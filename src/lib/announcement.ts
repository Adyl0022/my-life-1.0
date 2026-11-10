import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getSession, useSession } from './auth';
import { readPlain } from './store';

// A short message from the owner. It shows at the top of Settings, and the Settings tab shows a dot until it has been opened.
type Ann = { id: number; msg: string };
const SEEN = 'ml_ann_seen'; const GONE = 'ml_ann_gone';
let cur: Ann | null = null; let seen = ''; let gone = ''; let loaded = false; let started = false;
const subs = new Set<() => void>(); const emit = () => subs.forEach((f) => f());

export async function refreshAnnouncement() {
  if (!getSession()) { cur = null; emit(); return; }
  try {
    if (!loaded) { seen = (await readPlain(SEEN).catch(() => '')) || ''; gone = (await readPlain(GONE).catch(() => '')) || ''; loaded = true; }
    const { data, error } = await supabase.rpc('get_announcement');
    if (error) return;
    cur = data && data.msg ? { id: data.id, msg: data.msg } : null; emit();
  } catch {}
}
export const markSeen = () => { if (!cur || seen === String(cur.id)) return; seen = String(cur.id); AsyncStorage.setItem(SEEN, seen).catch(() => {}); emit(); };
export const closeAnnouncement = () => { if (!cur) return; gone = seen = String(cur.id); AsyncStorage.multiSet([[GONE, gone], [SEEN, seen]]).catch(() => {}); emit(); };

export function useAnnouncement() {
  const [sess] = useSession(); const uid = sess?.user?.id || '';
  const [, n] = useState(0);
  useEffect(() => {
    const f = () => n((x) => x + 1); subs.add(f);
    if (!started) { started = true; AppState.addEventListener('change', (s) => { if (s === 'active') refreshAnnouncement(); }); }
    return () => { subs.delete(f); };
  }, []);
  useEffect(() => { refreshAnnouncement(); }, [uid]);
  const a = cur && String(cur.id) !== gone ? cur : null;
  return { a, unread: !!a && String(a.id) !== seen };
}
