import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, ToastAndroid } from 'react-native';
import { seal, open } from './secure';

export const DEFAULT_NAME = '';
const listeners = new Set<() => void>();
// When the app comes back to the front, read everything again, so a read that failed while the phone was asleep is repaired.
AppState.addEventListener('change', (st) => { if (st === 'active') listeners.forEach((f) => f()); });
export async function getItem<T>(k: string, d: T): Promise<T> {
  try { const r = await AsyncStorage.getItem(k); return r == null ? d : (JSON.parse(await open(r)) as T); } catch (e) { return d; }
}
// Like getItem, but returns null when the saved value could not be read (for example the phone keystore is slow right after the app wakes),
// so the caller can stop instead of saving over good data with an empty default. It tries a few times before giving up.
export async function getItemStrict<T>(k: string, d: T, tries = 3): Promise<T | null> {
  for (let i = 0; i < tries; i++) {
    try { const r = await AsyncStorage.getItem(k); return r == null ? d : (JSON.parse(await open(r)) as T); } catch (e) {}
    if (i < tries - 1) await new Promise((res) => setTimeout(res, 1000));
  }
  return null;
}
// Tells every screen that reads saved values to read again (used by code that writes with AsyncStorage directly).
export function notifyStored() { listeners.forEach((f) => f()); }
export async function setItem(k: string, v: unknown) {
  try { await AsyncStorage.setItem(k, await seal(JSON.stringify(v))); } catch (e) {}
  listeners.forEach((f) => f());
  import('./sync').then((m) => m.markDirty(k)).catch(() => {});
  if (k === 'ml_finance' || k === 'ml_debts') import('./budgetAlert').then((m) => m.checkBudget()).catch(() => {});
}
// Writes a value that came from the cloud: saved like normal but not marked as a local edit.
export async function applyRemote(k: string, v: unknown) {
  try { await AsyncStorage.setItem(k, await seal(JSON.stringify(v))); } catch (e) {}
  listeners.forEach((f) => f());
}
// Raw readable JSON text of a saved key (used by Export).
export async function getText(k: string): Promise<string | null> {
  try { const r = await AsyncStorage.getItem(k); return r == null ? null : await open(r); } catch (e) { return null; }
}
// Small bookkeeping values that other parts of the app read and write as plain text (sync state, account check, announcements, usage).
// They must never be encrypted: the code that reads them compares the plain text. Encrypting the saved account id made the app
// believe a different person had signed in, and it then cleared the phone's data and loaded the cloud copy again.
const PLAIN_KEYS = ['ml_sync_meta', 'ml_sync_uid', 'ml_license_cache', 'ml_ann_seen', 'ml_ann_gone', 'ml_modules', 'ml_hours'];
const isPlainKey = (k: string) => PLAIN_KEYS.includes(k) || k.startsWith('ml_pt_') || k.startsWith('ml_usage');
// Reads one of those plain values. If an older version encrypted it by mistake, it is decrypted and saved back as plain text.
// Throws when it is encrypted and cannot be opened right now, so the caller can wait instead of guessing.
export async function readPlain(k: string): Promise<string | null> {
  const r = await AsyncStorage.getItem(k);
  if (r == null || !r.startsWith('enc1:')) return r;
  const t = await open(r);
  try { await AsyncStorage.setItem(k, t); } catch (e) {}
  return t;
}
// Pass at start: encrypts user data that was saved as plain text before encryption existed (or while the keystore was not ready).
export async function encryptExisting() {
  try {
    const ks = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('ml_') && !isPlainKey(k));
    for (const k of PLAIN_KEYS) { try { await readPlain(k); } catch (e) {} }
    for (const k of ks) {
      const r = await AsyncStorage.getItem(k);
      if (r != null && !r.startsWith('enc1:')) { const e = await seal(r); if (e !== r) await AsyncStorage.setItem(k, e); }
    }
  } catch (e) {}
}
export async function clearMine(keepName: boolean) {
  try {
    const ks = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('ml_') && !(keepName && k === 'ml_name'));
    await AsyncStorage.multiRemove(ks);
  } catch (e) {}
  try { await (await import('./sync')).forgetSyncState(); } catch (e) {}
  listeners.forEach((f) => f());
}
export function useStored<T>(k: string, d: T): [T, (v: T) => void, boolean] {
  const [v, setV] = useState<T>(d); const [ok, setOk] = useState(false);
  const ready = useRef(false); const bad = useRef(false); // true while the saved value could not be read: edits are not saved then, so they cannot erase it
  useEffect(() => {
    let alive = true; let last: string | null | undefined; let retries = 0; // last saved text we showed; undefined = nothing shown yet
    // Every write in the app re-reads every screen's data. Only update the screen when this key's saved text really changed, so the first sync after install does not make everything re-render and blink.
    const load = () => AsyncStorage.getItem(k).then(async (r) => {
      if (!alive || r === last) return;
      let x: T = d, good = true;
      try { if (r != null) x = JSON.parse(await open(r)) as T; } catch (e) { good = false; }
      if (!alive) return;
      // A read that failed must not blank a screen that already shows the real data.
      last = good ? r : undefined; if (good || !ready.current) setV(x); setOk(true);
      bad.current = !good; if (good) ready.current = true;
      if (!good && retries++ < 4) setTimeout(() => { if (alive) load(); }, 1500);
      if (good) retries = 0;
    }).catch(() => { if (alive) { last = undefined; setOk(true); bad.current = true; if (retries++ < 4) setTimeout(() => { if (alive) load(); }, 1500); } });
    load(); listeners.add(load);
    return () => { alive = false; listeners.delete(load); };
  }, [k]);
  // Saving before the saved data has been read would write over it, so wait and say so instead of failing silently.
  return [v, (x: T) => { if (bad.current || !ready.current) { if (Platform.OS === 'android') ToastAndroid.show('Your data is still loading. Please try again in a moment.', ToastAndroid.SHORT); return; } setV(x); setItem(k, x); }, ok];
}
export const useName = () => { const [n] = useStored<string>('ml_name', DEFAULT_NAME); return n; };
