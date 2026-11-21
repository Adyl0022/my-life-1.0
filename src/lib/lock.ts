import { useEffect, useState } from 'react';
import { Platform, AppState } from 'react-native';
import * as LocalAuth from 'expo-local-authentication';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { secGet, secSet, secDel, randHex } from './secure';
import { clearMine } from './store';

export type LockCfg = {
  on: boolean;
  bio: boolean;          // fingerprint / face allowed
  after: number;         // seconds in background before it locks again (0 = straight away)
  scope: 'all' | 'sensitive';
  salt: string; hash: string;
  fails: number; until: number; // wrong-PIN counter and the time the pause ends
  it?: number;           // rounds used to scramble the PIN (older saves used 20000)
};
export const LOCK_OFF: LockCfg = { on: false, bio: false, after: 60, scope: 'all', salt: '', hash: '', fails: 0, until: 0 };
const KEY = 'ml_lock';
export const AFTER = [[0, 'Instantly'], [60, '1 min'], [300, '5 min'], [900, '15 min']] as [number, string][];
// Finance, debts, notes and vehicle records are the sensitive part of the app.
export const SENSITIVE = ['/finance', '/notes', '/record', '/vehicle', '/documents', '/collection'];

let cfg: LockCfg = LOCK_OFF;
let loaded = false;
let locked = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export async function loadLock() {
  try { const r = await secGet(KEY); cfg = r ? { ...LOCK_OFF, ...JSON.parse(r) } : LOCK_OFF; } catch (e) { cfg = LOCK_OFF; }
  if (!loaded) { loaded = true; locked = cfg.on; }
  emit();
}
async function save(c: LockCfg) { cfg = c; await secSet(KEY, JSON.stringify(c)); emit(); }

const IT = 3000;
// Done in small slices so the keypad never freezes while the PIN is being checked.
const hashPin = async (pin: string, salt: string, c: number) => bytesToHex(await pbkdf2Async(sha256, pin, salt, { c, dkLen: 32, asyncTick: 8 }));

export const bioReady = async () => {
  if (Platform.OS === 'web') return false;
  try { return (await LocalAuth.hasHardwareAsync()) && (await LocalAuth.isEnrolledAsync()); } catch (e) { return false; }
};
export async function bioAuth(msg = 'Unlock My Life 1.0'): Promise<boolean> {
  try { const r = await LocalAuth.authenticateAsync({ promptMessage: msg, cancelLabel: 'Use PIN', disableDeviceFallback: true }); return !!r.success; } catch (e) { return false; }
}

export async function setPin(pin: string, bio: boolean, after = cfg.after, scope = cfg.scope) {
  const salt = randHex(16);
  await save({ ...cfg, on: true, bio, after, scope, salt, hash: await hashPin(pin, salt, IT), it: IT, fails: 0, until: 0 });
  locked = false; emit();
}
export async function patchLock(p: Partial<LockCfg>) { await save({ ...cfg, ...p }); }
export async function disableLock() { await secDel(KEY); cfg = LOCK_OFF; locked = false; emit(); }

// Returns 'ok', 'bad' (with tries left) or 'wait' (seconds to wait).
export async function checkPin(pin: string): Promise<{ r: 'ok' } | { r: 'bad'; left: number } | { r: 'wait'; secs: number }> {
  const now = Date.now();
  if (cfg.until > now) return { r: 'wait', secs: Math.ceil((cfg.until - now) / 1000) };
  if ((await hashPin(pin, cfg.salt, cfg.it || 20000)) === cfg.hash) {
    // A PIN saved with the older, slower setting is quietly re-saved with the faster one.
    if ((cfg.it || 20000) !== IT) { const salt = randHex(16); await save({ ...cfg, salt, hash: await hashPin(pin, salt, IT), it: IT, fails: 0, until: 0 }); }
    else if (cfg.fails) await save({ ...cfg, fails: 0, until: 0 });
    return { r: 'ok' };
  }
  const fails = cfg.fails + 1;
  if (fails % 5 === 0) { await save({ ...cfg, fails, until: now + 30000 }); return { r: 'wait', secs: 30 }; }
  await save({ ...cfg, fails });
  return { r: 'bad', left: 5 - (fails % 5) };
}
export function unlock() { locked = false; emit(); }
// Forgot PIN and no fingerprint: wipe the app data and the lock itself.
export async function wipeEverything() { await clearMine(false); await disableLock(); }

export function useLock() {
  const [, tick] = useState(0);
  useEffect(() => { const f = () => tick((n) => n + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  return { cfg, locked: locked && cfg.on, ready: loaded };
}

// Locks the app again when it was left in the background for longer than the user chose.
export function useLockWatcher() {
  useEffect(() => {
    loadLock();
    let left = 0;
    const s = AppState.addEventListener('change', (st) => {
      if (st === 'background' || st === 'inactive') { if (!left) left = Date.now(); }
      else if (st === 'active') {
        if (left && cfg.on && Date.now() - left >= cfg.after * 1000) { locked = true; emit(); }
        left = 0;
      }
    });
    return () => s.remove();
  }, []);
}
