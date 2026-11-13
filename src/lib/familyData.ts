import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
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
function useRows<T extends { id: string }>(table: string, fid: string | undefined, order: string, asc: boolean) {
  const [rows, setRows] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const alive = useRef(true);
  const timer = useRef<any>(null);
  const key = 'ml_famrows_' + table + '_' + (fid || '');
  useEffect(() => { alive.current = true; return () => { alive.current = false; clearTimeout(timer.current); }; }, []);

  const load = useCallback(async () => {
    if (!fid) return;
    try {
      const { data, error } = await supabase.from(table).select('*').eq('family_id', fid).is('deleted_at', null).order(order, { ascending: asc }).limit(600);
      if (error) throw error;
      if (!alive.current) return;
      setRows((data || []) as T[]); setReady(true); setOffline(false);
      AsyncStorage.setItem(key, JSON.stringify(data || [])).catch(() => {});
    } catch (e) {
      if (!alive.current) return;
      setOffline(true);
    }
  }, [fid, table, order, asc, key]);
  const soon = useCallback(() => { clearTimeout(timer.current); timer.current = setTimeout(load, 250); }, [load]);

  useEffect(() => {
    if (!fid) return;
    AsyncStorage.getItem(key).then((raw) => { if (raw && alive.current) { try { setRows((r) => (r.length ? r : JSON.parse(raw))); setReady(true); } catch (e) {} } }).catch(() => {});
    load();
    const ch = supabase.channel('fam-' + table + '-' + fid)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter: 'family_id=eq.' + fid }, soon)
      .subscribe();
    const st = AppState.addEventListener('change', (x) => { if (x === 'active') load(); });
    return () => { supabase.removeChannel(ch); st.remove(); };
  }, [fid, key, load, soon, table]);

  const patch = useCallback((id: string, p: Partial<T>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x))), []);
  return { rows, ready, offline, reload: load, patch };
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
