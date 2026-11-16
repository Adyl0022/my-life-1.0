import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { useSession } from './auth';
import { useFocusEffect } from 'expo-router';
import { readCache } from './famCache';

// Family Planner, stage A: the family space, its invite code and its members.
// Every action goes through a server function (sql/family.sql) that checks the person and their licence.
export type FRole = 'owner' | 'parent' | 'member';
export type FMember = { user_id: string; name: string; color: string; role: FRole; joined: string; birthday?: string | null };
export type FProfile = { id: string; name: string; color: string; birthday?: string | null };
export type FInfo = { id: string; name: string; role: FRole; me: string; code: string | null; invites_open: boolean; max_members: number; max_profiles: number; members: FMember[]; profiles: FProfile[] };
export type FState = 'loading' | 'none' | 'locked' | 'ready';

export const FAM_COLORS = ['#ff8fab', '#ffc46b', '#5ee7df', '#b794ff', '#8fe9e2', '#7c9cff'];
export const pickColor = (n: number) => FAM_COLORS[Math.abs(n) % FAM_COLORS.length];
export const initial = (s: string) => (s.trim().charAt(0) || '?').toUpperCase();
export const showCode = (c: string | null) => (c ? c.slice(0, 3) + '-' + c.slice(3) : '');
export const isParent = (r?: FRole | null) => r === 'owner' || r === 'parent';

const KEY = 'ml_family_cache';
let mem: { uid: string; info: FInfo } | null = null; // last known family, so opening the screens again is instant
const MSG: Record<string, string> = {
  not_active: 'Family Planner needs an active My Life subscription.',
  already_in_family: 'You are already in a family.',
  bad_name: 'Please type a name.',
  invalid_code: 'That code is not valid. Check it and try again.',
  family_full: 'That family is full (15 members).',
  too_many_attempts: 'Too many wrong tries. Please wait 15 minutes and try again.',
  owner_must_transfer: 'Make someone else the owner first, then you can leave.',
  not_allowed: 'Only the family owner or a parent can do that.',
  profiles_full: 'You can add up to 10 people without an account.',
  cannot_remove_self: 'You cannot remove yourself. Use Leave family instead.',
  not_in_family: 'You are not in a family.',
  no_family: 'You are not in a family.',
  bad_title: 'Please type a title.',
  bad_people: 'One of the chosen people is no longer in the family.',
  bad_date: 'Please check the date and time.',
  repeat_needs_date: 'A repeating task needs a date.',
  name_mismatch: 'The name does not match. Type the family name exactly.',
  list_full: 'This list is full. Delete some old items first.',
  not_found: 'That item was already changed or deleted by someone else.',
  already_claimed: 'Someone else is already getting this one.',
  already_marked: 'This chore is already ticked for this turn.',
  not_enough_points: 'Not enough points yet.',
  bad_points: 'Points must be a number from 1 to 100 (rewards up to 1000).',
};
export function famError(e: any): string {
  const m = String((e && (e.message || e.error)) || e || '');
  const k = Object.keys(MSG).find((x) => m.indexOf(x) >= 0);
  if (k) return MSG[k];
  if (/network|fetch|timeout/i.test(m)) return 'No internet connection. Please try again.';
  const why = m.replace(/\s+/g, ' ').trim().slice(0, 110); // the real reason, so a problem can be reported and fixed
  return 'Something went wrong. Please try again.' + (why ? ' (' + why + ')' : '');
}
export async function call<T = any>(fn: string, args: Record<string, any> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  if (data && typeof data === 'object' && (data as any).error) throw new Error((data as any).error);
  return data as T;
}

export const famCreate = (name: string, display: string, color: string) => call<{ id: string; code: string }>('family_create', { p_name: name, p_display: display, p_color: color });
export const famJoin = (code: string, display: string, color: string) => call('family_join', { p_code: code, p_display: display, p_color: color });
export const famLeave = () => call('family_leave');
// After leaving or deleting a family: forget the saved copy, so the Family screen never shows the old family again.
// Screens that are still open underneath (for example the Family screen below Members) are told straight away, so none of them
// shows the old family for a moment after it was left or deleted.
const subs = new Set<(gone: boolean) => void>();
export const famNotify = (gone = false) => { subs.forEach((f) => { try { f(gone); } catch (e) {} }); };
export function famForget() { mem = null; AsyncStorage.removeItem(KEY).catch(() => {}); clearRows(); famNotify(true); }
export const famRemove = (uid: string) => call('family_remove_member', { p_user: uid });
export const famNewCode = () => call<string>('family_new_code');
export const famSetRole = (uid: string, role: 'parent' | 'member') => call('family_set_role', { p_user: uid, p_role: role });
export const famSetInvites = (open: boolean) => call<string | null>('family_set_invites', { p_open: open });
export const famDeleteAll = (name: string) => call('family_delete_all', { p_name: name });
export const famTransfer = (uid: string) => call('family_transfer_owner', { p_user: uid });
export const famRename = (name: string) => call('family_rename', { p_name: name });
export const famSetMe = (name: string, color: string) => call('family_set_me', { p_display: name, p_color: color });
export const famAddProfile = (name: string, color: string) => call('family_profile_add', { p_name: name, p_color: color });
export const famSetBirthday = (d: string | null) => call('family_set_birthday', { p_date: d });
export const famMemberBirthday = (uid: string, d: string | null) => call('family_member_birthday', { p_user: uid, p_date: d });
export const famProfileBirthday = (id: string, d: string | null) => call('family_profile_birthday', { p_id: id, p_date: d });
export const famRemoveProfile = (id: string) => call('family_profile_remove', { p_id: id });

// Forget the saved copies of the family lists when the person is no longer in a family.
function clearRows() {
  AsyncStorage.getAllKeys().then((ks) => { const d = ks.filter((k) => k.indexOf('ml_famrows_') === 0); if (d.length) AsyncStorage.multiRemove(d).catch(() => {}); }).catch(() => {});
}

// Loads the family for the signed-in person. Shows the last saved copy while offline.
export function useFamily() {
  const [sess] = useSession();
  const uid = sess?.user?.id || '';
  const [state, setState] = useState<FState>(mem && mem.uid === uid ? 'ready' : 'loading');
  const [info, setInfo] = useState<FInfo | null>(mem && mem.uid === uid ? mem.info : null);
  const [offline, setOffline] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  const refresh = useCallback(async () => {
    if (!uid) { setState('none'); setInfo(null); return; }
    try {
      const r: any = await call('family_info');
      if (!alive.current) return;
      setOffline(false);
      if (!r || r.state === 'none') { mem = null; setInfo(null); setState('none'); AsyncStorage.removeItem(KEY).catch(() => {}); clearRows(); }
      else if (r.state === 'locked') { mem = null; setInfo(null); setState('locked'); }
      else { mem = { uid, info: r as FInfo }; setInfo(r as FInfo); setState('ready'); AsyncStorage.setItem(KEY, JSON.stringify({ uid, info: r })).catch(() => {}); }
    } catch (e) {
      if (!alive.current) return;
      try {
        const c: any = await readCache(KEY);
        if (c && c.uid === uid && c.info) { setInfo(c.info); setState('ready'); setOffline(true); return; }
      } catch (x) {}
      setOffline(true); setState((s) => (s === 'loading' ? 'none' : s));
    }
  }, [uid]);

  // Show the saved copy straight away, then bring it up to date in the background.
  useEffect(() => {
    if (!uid || state !== 'loading') return;
    readCache<any>(KEY).then((c) => { if (c && c.uid === uid && c.info && alive.current) { mem = { uid, info: c.info }; setInfo((i) => i || c.info); setState((x) => (x === 'loading' ? 'ready' : x)); } }).catch(() => {});
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { const f = (gone: boolean) => { if (gone) { setInfo(null); setState('none'); } refresh(); }; subs.add(f); return () => { subs.delete(f); }; }, [refresh]);
  useEffect(() => { const s = AppState.addEventListener('change', (x) => { if (x === 'active') refresh(); }); return () => s.remove(); }, [refresh]);
  return { state, info, offline, refresh };
}

// For screens (never the root layout): while a family screen is in view, read the family again every few seconds, so a new member,
// a role change or a new code shows up without leaving and coming back.
export function useAutoRefresh(refresh: () => any, ms = 6000) {
  const ref = useRef(refresh); ref.current = refresh;
  useFocusEffect(useCallback(() => {
    const run = () => { try { const r = ref.current(); if (r && r.catch) r.catch(() => {}); } catch (e) {} };
    const id = setInterval(run, ms);
    const st = AppState.addEventListener('change', (x) => { if (x === 'active') run(); });
    return () => { clearInterval(id); st.remove(); };
  }, [ms]));
}
