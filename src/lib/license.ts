import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getSession, useSession } from './auth';
import { readPlain } from './store';

export type Lic = { status: 'unknown' | 'active' | 'locked'; expires: string | null };
const KEY = 'ml_license_cache';
let cur: Lic = { status: 'unknown', expires: null };
let uid = '';
const subs = new Set<() => void>();
const set = (l: Lic) => { cur = l; subs.forEach((f) => f()); };
const valid = (e: string | null) => !e || new Date(e).getTime() > Date.now();

async function cached(u: string) {
  try {
    const raw = await readPlain(KEY); if (!raw) return undefined;
    const c = JSON.parse(raw); return c.uid === u ? (c.expires as string | null) : undefined;
  } catch { return undefined; }
}
const save = (u: string, expires: string | null) => AsyncStorage.setItem(KEY, JSON.stringify({ uid: u, expires, at: Date.now() })).catch(() => {});

// Asks the server whether this account is activated. Offline: trust the last answer saved on the phone.
export async function refreshLicense() {
  const s = getSession(); if (!s) { uid = ''; set({ status: 'unknown', expires: null }); return; }
  const u = s.user.id;
  // Safety net: the screen must never stay blank. If nothing answered in time, use the last answer saved on the phone.
  const guard = setTimeout(async () => {
    if (cur.status !== 'unknown' || uid !== u) return;
    const c = await cached(u); set(c !== undefined && valid(c) ? { status: 'active', expires: c } : { status: 'locked', expires: null });
  }, 12000);
  try {
    const q = supabase.from('licenses').select('expires_at').eq('user_id', u).maybeSingle();
    const { data, error } = await Promise.race([q, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000))]) as any;
    if (error) throw error;
    if (data && valid(data.expires_at)) { await save(u, data.expires_at); set({ status: 'active', expires: data.expires_at }); }
    else { await save(u, '1970-01-01T00:00:00Z'); set({ status: 'locked', expires: data?.expires_at ?? null }); }
  } catch {
    const c = await cached(u);
    if (c === undefined) set(cur.status === 'active' ? cur : { status: 'locked', expires: null });
    else set(valid(c) ? { status: 'active', expires: c } : { status: 'locked', expires: c });
  } finally { clearTimeout(guard); }
}

export async function redeemCode(code: string): Promise<{ ok: true } | { ok: false; err: string }> {
  try {
    const { data, error } = await supabase.rpc('redeem_code', { p_code: code });
    if (!error && (data as any)?.error === 'invalid_code') return { ok: false, err: 'That code is not valid or was already used.' };
    if (error) {
      const m = error.message || '';
      if (m.includes('invalid_code')) return { ok: false, err: 'That code is not valid or was already used.' };
      if (m.includes('too_many_attempts')) return { ok: false, err: 'Too many wrong tries. Please wait 15 minutes and try again.' };
      return { ok: false, err: /network|fetch/i.test(m) ? 'No internet connection. Please try again.' : 'Could not activate. Please try again.' };
    }
    await refreshLicense(); return { ok: true };
  } catch { return { ok: false, err: 'No internet connection. Please try again.' }; }
}

AppState.addEventListener('change', (s) => { if (s === 'active') refreshLicense(); });

export function useLicense(): Lic {
  const [sess] = useSession(); const [, n] = useState(0);
  useEffect(() => { const f = () => n((x) => x + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  const id = sess?.user?.id || '';
  useEffect(() => {
    if (!id) { set({ status: 'unknown', expires: null }); return; }
    if (uid !== id) { uid = id; set({ status: 'unknown', expires: null }); }
    cached(id).then((c) => { if (uid === id && cur.status === 'unknown' && c !== undefined && valid(c)) set({ status: 'active', expires: c }); });
    refreshLicense();
  }, [id]);
  return id ? cur : { status: 'unknown', expires: null };
}
