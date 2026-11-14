import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { readCache } from './famCache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { call, FInfo } from './family';

// Family Planner, stage B: tasks, shared shopping list and "Recently deleted".
// Reading uses the tables directly (the server only lets family members see their own rows) and refreshes by itself
// when someone else changes something. Every change goes through a server function (sql/family_b.sql).
export type FTask = {
  id: string; title: string; note: string | null; due_at: string | null; repeat: Repeat; remind_min: number | null;
  assignees: string[]; done: boolean; done_at: string | null; done_by: string | null; created_by: string | null; created_at: string;
};
export type FShop = { id: string; name: string; qty: string | null; category: string; bought: boolean; bought_by: string | null; created_by: string | null; created_at: string };
export type FEvent = { id: string; title: string; place: string | null; note: string | null; starts_at: string; ends_at: string | null; attendees: string[]; remind_min: number | null; created_by: string | null; created_at: string };
export type Repeat = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';
export type Trashed = { kind: 'task' | 'event' | 'shop'; id: string; title: string; deleted_at: string; deleted_by: string | null };
export type FPerson = { id: string; name: string; color: string; member: boolean };

export const REPEATS: { k: Repeat; t: string }[] = [{ k: 'none', t: 'Never' }, { k: 'daily', t: 'Daily' }, { k: 'weekdays', t: 'Weekdays' }, { k: 'weekly', t: 'Weekly' }, { k: 'monthly', t: 'Monthly' }];
export const REMINDS: { k: number | null; t: string }[] = [{ k: null, t: 'None' }, { k: 0, t: 'At the time' }, { k: 30, t: '30 min before' }, { k: 60, t: '1 hour before' }, { k: 1440, t: '1 day before' }];
export const SHOP_CATS = ['Groceries', 'Household', 'Other'];

export const peopleOf = (i: FInfo | null): FPerson[] => i
  ? [...i.members.map((m) => ({ id: m.user_id, name: m.name, color: m.color, member: true })), ...i.profiles.map((p) => ({ id: p.id, name: p.name, color: p.color, member: false }))]
  : [];

// A list of rows from one table, kept fresh. Shows the last saved copy while offline.
function useRows<T extends { id: string }>(table: string, fid: string | undefined, order: string, asc: boolean, soft = true) {
  const [rows, setRows] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const [msg, setMsg] = useState('');
  const alive = useRef(true);
  const timer = useRef<any>(null);
  const uid = useRef(Math.random().toString(36).slice(2, 9)); // every screen gets its own channel name, so opening a screen again never clashes with one still closing
  const key = 'ml_famrows_' + table + '_' + (fid || '');
  const locks = useRef<Record<string, { p: any; until: number }>>({}); // a tick the person just made stays as they made it until the server has caught up, so quick taps never flicker back
  const seq = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; clearTimeout(timer.current); }; }, []);

  const load = useCallback(async () => {
    if (!fid) return;
    const mine = ++seq.current;
    try {
      let q: any = supabase.from(table).select('*').eq('family_id', fid);
      if (soft) q = q.is('deleted_at', null);
      const { data, error } = await q.order(order, { ascending: asc }).limit(600);
      if (error) throw error;
      if (!alive.current || mine !== seq.current) return; // a newer read is already on its way
      const now = Date.now(); const L = locks.current;
      const fresh = ((data || []) as T[]).map((x) => { const l = L[x.id]; if (!l) return x; if (l.until < now) { delete L[x.id]; return x; } return { ...x, ...l.p }; });
      setRows(fresh); setReady(true); setOffline(false); setMsg('');
      AsyncStorage.setItem(key, JSON.stringify(data || [])).catch(() => {});
    } catch (e: any) {
      if (!alive.current) return;
      setOffline(true);
      const m = String((e && (e.message || e.error)) || e || '');
      setMsg(/network|fetch|timeout/i.test(m) || !m ? 'You are offline. Showing the last saved list. Changes need an internet connection.' : 'The list could not be read (' + m.replace(/\s+/g, ' ').slice(0, 110) + '). Anything you add is saved, but cannot be shown yet.');
    }
  }, [fid, table, order, asc, key, soft]);
  const soon = useCallback(() => { clearTimeout(timer.current); timer.current = setTimeout(load, 250); }, [load]);

  useEffect(() => {
    if (!fid) return;
    readCache<T[]>(key).then((c) => { if (c && Array.isArray(c) && alive.current) { setRows((r) => (r.length ? r : c)); setReady(true); } }).catch(() => {});
    load();
    let ch: any = null;
    try {
      ch = supabase.channel('fam-' + table + '-' + fid + '-' + uid.current)
        .on('postgres_changes', { event: '*', schema: 'public', table, filter: 'family_id=eq.' + fid }, soon)
        .subscribe();
    } catch (e) { ch = null; } // live updates are a bonus: the list still loads and refreshes without them
    const st = AppState.addEventListener('change', (x) => { if (x === 'active') load(); });
    return () => { try { if (ch) supabase.removeChannel(ch); } catch (e) {} st.remove(); };
  }, [fid, key, load, soon, table]);

  const patch = useCallback((id: string, p: Partial<T>) => { locks.current[id] = { p: { ...(locks.current[id]?.p || {}), ...p }, until: Date.now() + 2500 }; setRows((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x))); }, []);
  return { rows, ready, offline, msg, reload: load, patch };
}
// Call this on a screen (never in the root layout, which has no navigation yet): reads the list again every time the screen
// comes back into view, for example after saving a task, even if no live update arrived.
export function useReloadOnFocus(...reloads: (() => any)[]) {
  const first = useRef(true);
  const ref = useRef(reloads); ref.current = reloads;
  useFocusEffect(useCallback(() => {
    if (first.current) { first.current = false; return; }
    const run = () => ref.current.forEach((r) => { try { r(); } catch (e) {} });
    run(); const t = setTimeout(run, 900);
    return () => clearTimeout(t);
  }, []));
}
export const useFamTasks = (fid?: string) => useRows<FTask>('family_tasks', fid, 'due_at', true);
export const useFamEvents = (fid?: string) => useRows<FEvent>('family_events', fid, 'starts_at', true);
export const useFamShop = (fid?: string) => useRows<FShop>('family_shop', fid, 'created_at', true);

export type TaskIn = { id?: string | null; title: string; note: string; due: string | null; repeat: Repeat; remind: number | null; assignees: string[] };
export const taskSave = (a: TaskIn) => call<string>('family_task_save', { p_id: a.id || null, p_title: a.title, p_note: a.note || null, p_due: a.due, p_repeat: a.repeat, p_remind: a.due ? a.remind : null, p_assignees: a.assignees });
export type EventIn = { id?: string | null; title: string; place: string; note: string; starts: string; ends: string | null; attendees: string[]; remind: number | null };
export const eventSave = (a: EventIn) => call<string>('family_event_save', { p_id: a.id || null, p_title: a.title, p_place: a.place || null, p_note: a.note || null, p_starts: a.starts, p_ends: a.ends, p_attendees: a.attendees, p_remind: a.remind });
export const taskDone = (id: string, done: boolean) => call('family_task_done', { p_id: id, p_done: done });
export const shopSave = (id: string | null, name: string, qty: string, cat: string) => call<string>('family_shop_save', { p_id: id, p_name: name, p_qty: qty || null, p_cat: cat });
export const shopBought = (id: string, bought: boolean) => call('family_shop_bought', { p_id: id, p_bought: bought });
export const shopClear = () => call<number>('family_shop_clear_bought');
export const famDelete = (kind: Trashed['kind'], id: string) => call('family_delete', { p_kind: kind, p_id: id });
export const famRestore = (kind: Trashed['kind'], id: string) => call('family_restore', { p_kind: kind, p_id: id });
export const trashRemove = (kind: Trashed['kind'], id: string) => call('family_trash_remove', { p_kind: kind, p_id: id });
export const trashEmpty = () => call('family_trash_empty');
export const trashList = () => call<Trashed[]>('family_trash');

// Dates ------------------------------------------------------------------------------------------------------
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
export const dayDiff = (iso: string) => Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / 86400000);
export const timeText = (d: Date) => { const h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + (h < 12 ? 'AM' : 'PM'); };
export const dateText = (d: Date) => DAY[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()];
export function dueText(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso), n = dayDiff(iso);
  const day = n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : n > 1 && n < 7 ? DAY[d.getDay()] : d.getDate() + ' ' + MON[d.getMonth()];
  return day + ' ' + timeText(d);
}
export const daysLeft = (deletedAt: string) => Math.max(0, 7 - Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400000));
export const nameOf = (info: FInfo | null, uid: string | null) => (uid && info?.members.find((m) => m.user_id === uid)?.name) || 'A former member';


// Stage D: Household (menu, wishes), chores, points and rewards (sql/family_f.sql) --------------------------------
export type FMenu = { id: string; day: string; slot: 'breakfast' | 'lunch' | 'dinner'; dish: string; cook: string | null; needs: string | null };
export type FWish = { id: string; owner: string; title: string; price: string | null; note: string | null; created_by: string | null };
export type FClaim = { wish_id: string; claimer: string; id: string };
export type FChore = { id: string; title: string; points: number; every: 'daily' | 'weekly'; rotate: string[]; anchor: string };
export type FChoreLog = { id: string; chore_id: string; period: string; person: string; status: 'pending' | 'approved'; marked_by: string | null };
export type FReward = { id: string; title: string; cost: number };
export type FRedeem = { id: string; person: string; title: string; cost: number; status: 'pending' | 'approved' | 'declined'; created_at: string };

export const useFamMenu = (fid?: string) => useRows<FMenu>('family_menu', fid, 'day', true, false);
export const useFamWishes = (fid?: string) => useRows<FWish>('family_wishes', fid, 'created_at', true, false);
// The claims table has no id of its own: wish_id is its key, so it is given as the id here. The person a wish belongs to gets no rows (the server hides them).
export function useFamClaims(fid?: string) {
  const r = useRows<any>('family_wish_claims', fid, 'created_at', true, false);
  return { ...r, rows: r.rows.map((x: any) => ({ ...x, id: x.wish_id })) as FClaim[] };
}
export const useFamChores = (fid?: string) => useRows<FChore>('family_chores', fid, 'created_at', true, false);
export const useFamChoreLog = (fid?: string) => useRows<FChoreLog>('family_chore_log', fid, 'created_at', false, false);
export const useFamRewards = (fid?: string) => useRows<FReward>('family_rewards', fid, 'cost', true, false);
export const useFamRedeems = (fid?: string) => useRows<FRedeem>('family_redeems', fid, 'created_at', false, false);

export const menuSave = (day: string, slot: string, dish: string, cook: string | null, needs: string) => call('family_menu_save', { p_day: day, p_slot: slot, p_dish: dish, p_cook: cook, p_needs: needs || null });
export const wishSave = (id: string | null, owner: string, title: string, price: string, note: string) => call<string>('family_wish_save', { p_id: id, p_owner: owner, p_title: title, p_price: price || null, p_note: note || null });
export const wishDelete = (id: string) => call('family_wish_delete', { p_id: id });
export const wishClaim = (id: string, on: boolean) => call('family_wish_claim', { p_id: id, p_on: on });
export const choreSave = (id: string | null, title: string, points: number, every: 'daily' | 'weekly', rotate: string[]) => call<string>('family_chore_save', { p_id: id, p_title: title, p_points: points, p_every: every, p_rotate: rotate });
export const choreDelete = (id: string) => call('family_chore_delete', { p_id: id });
export const choreMark = (id: string, period: string) => call('family_chore_mark', { p_chore: id, p_period: period });
export const choreDecide = (id: string, ok: boolean) => call('family_chore_decide', { p_log: id, p_ok: ok });
export const rewardSave = (id: string | null, title: string, cost: number) => call<string>('family_reward_save', { p_id: id, p_title: title, p_cost: cost });
export const rewardDelete = (id: string) => call('family_reward_delete', { p_id: id });
export const rewardAsk = (id: string, person: string) => call('family_reward_ask', { p_reward: id, p_person: person });
export const redeemDecide = (id: string, ok: boolean) => call('family_redeem_decide', { p_id: id, p_ok: ok });

// Everyone's points. `sig` changes whenever a chore is ticked, approved or a reward is asked for, so the numbers follow.
export function useBalances(fid: string | undefined, sig: string) {
  const [bal, setBal] = useState<Record<string, number>>({});
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const load = useCallback(async () => {
    if (!fid) return;
    try { const r: any = await call('family_balances'); if (alive.current && r && typeof r === 'object') setBal(r); } catch (e) { /* offline: keep the last numbers */ }
  }, [fid]);
  useEffect(() => { load(); }, [load, sig]);
  return { bal, reload: load };
}

// Chores take turns. The same sums are made on the server (family_chore_person), so every phone agrees on whose turn it is.
const ymd = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const localDay = (d = new Date()) => ymd(d);
export const periodOf = (every: 'daily' | 'weekly', d = new Date()) => { if (every === 'daily') return ymd(d); const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return ymd(x); };
const utcDay = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 86400000;
export function choreWho(c: FChore, period: string): string {
  const n = c.rotate.length; if (!n) return '';
  const k = Math.floor((utcDay(period) - utcDay(c.anchor)) / (c.every === 'weekly' ? 7 : 1));
  return c.rotate[((k % n) + n) % n];
}
export const nextWho = (c: FChore, period: string): string => { const n = c.rotate.length; if (n < 2) return ''; const k = Math.floor((utcDay(period) - utcDay(c.anchor)) / (c.every === 'weekly' ? 7 : 1)); return c.rotate[(((k + 1) % n) + n) % n]; };
