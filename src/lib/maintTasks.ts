import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getItem, setItem } from './store';
import { setup, cancelPrefix, inQuiet, Toggles } from './adhan';

// Repeating maintenance tasks for a vehicle (spray the chain, check tyre pressure, oil level ...).
// A task is due after a number of days, or after a number of km if you set one, whichever comes first.
export type Tk = { id: number; name: string; days: number; km?: number; last: string; odo?: number; hist?: string[] };
const dayN = (s: string) => { const [y, m, d] = s.split('-').map(Number); return Math.round(new Date(y, (m || 1) - 1, d || 1).getTime() / 86400000 - new Date().getTimezoneOffset() / 1440); };
const todayN = () => { const n = new Date(); return Math.round(new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime() / 86400000 - n.getTimezoneOffset() / 1440); };
const ymd = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const todayKey = () => ymd(new Date());

/** The highest odometer reading saved for this vehicle. */
export const latestOdo = (v: any): number => Math.max(0, ...((v && v.readings) || []).map((r: any) => r.odo || 0), ...((v && v.yreadings) || []).map((r: any) => r.odo || 0), ...((v && v.fuel) || []).map((f: any) => f.odo || 0));

export type TkState = { level: 0 | 1 | 2; since: number; dueIn: number; kmLeft: number | null; frac: number; text: string };
export function taskState(t: Tk, latest: number): TkState {
  const since = Math.max(0, todayN() - dayN(t.last)); const dueIn = t.days - since;
  const kmLeft = t.km && t.odo != null && latest > 0 ? t.km - (latest - t.odo) : null;
  const late = dueIn < 0 || (kmLeft != null && kmLeft < 0);
  const soon = !late && (dueIn <= Math.max(1, Math.round(t.days * 0.25)) || (kmLeft != null && t.km != null && kmLeft <= t.km * 0.2));
  const frac = Math.min(1, Math.max(since / Math.max(1, t.days), kmLeft != null && t.km ? (t.km - kmLeft) / t.km : 0));
  const parts: string[] = [];
  if (dueIn < 0) parts.push('Late ' + -dueIn + (dueIn === -1 ? ' day' : ' days')); else if (dueIn === 0) parts.push('Due today'); else parts.push('Due in ' + dueIn + (dueIn === 1 ? ' day' : ' days'));
  if (kmLeft != null) parts.push(kmLeft < 0 ? -kmLeft + ' km over' : kmLeft + ' km left');
  return { level: late ? 2 : soon ? 1 : 0, since, dueIn, kmLeft, frac, text: parts.join(' · ') };
}

/** Marks a task done today. cost > 0 also adds a spending record. Done twice on the same day changes nothing the second time. */
export function markDone(rec: any, cat: string, id: number, cost: number): any {
  const v = rec && rec.data && rec.data[cat]; if (!v || !(v.tasks || []).some((t: Tk) => t.id === id)) return rec;
  const today = todayKey(); const odo = latestOdo(v); let nextId = rec.nextId || 1; let exps = v.exps || [];
  const tasks = (v.tasks as Tk[]).map((t) => {
    if (t.id !== id) return t;
    if (t.last === today && (t.hist || [])[0] === today && !(cost > 0)) return t;
    if (cost > 0) { exps = [{ id: nextId, name: t.name, amt: cost, date: today }, ...exps]; nextId += 1; }
    const h = (t.hist || []).slice(); if (t.last && h[0] !== t.last) h.unshift(t.last); if (h[0] !== today) h.unshift(today); else h[0] = today;
    return { ...t, last: today, odo: odo > 0 ? odo : t.odo, hist: Array.from(new Set(h)).slice(0, 8) };
  });
  return { ...rec, nextId, data: { ...rec.data, [cat]: { ...v, tasks, exps } } };
}
export async function doneStored(cat: string, id: number): Promise<void> {
  const rec = await getItem<any>('ml_record', null); if (!rec) return;
  const n = markDone(rec, cat, id, 0); if (n !== rec) await setItem('ml_record', n);
}

// A reminder at 9 am when a task falls due, with a Done button. A task that is already late gets one reminder the next morning.
export async function syncTaskAlerts(rec: any, tg: Toggles, on: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelPrefix('mtask-');
    if (!on || !tg.ev) return;
    const now = Date.now(); const todo: { id: string; at: Date; title: string; body: string; cat: string; tid: number }[] = [];
    Object.entries((rec && rec.data) || {}).forEach(([cat, v]: [string, any], vi) => {
      if (!v || v.trem === false) return;
      ((v.tasks || []) as Tk[]).forEach((t) => {
        const [y, m, d] = (t.last || '').split('-').map(Number); if (!y || !m || !d) return;
        let at = new Date(y, m - 1, d + t.days, 9, 0, 0);
        if (at.getTime() <= now + 5000) { at = new Date(); at.setDate(at.getDate() + 1); at.setHours(9, 0, 0, 0); }
        if (inQuiet(at, tg)) return;
        todo.push({ id: 'mtask-' + vi + '-' + t.id, at, title: t.name + ' is due', body: (cat ? cat + '. ' : '') + 'Last done ' + t.last + '. Tap Done when you have done it.', cat, tid: t.id });
      });
    });
    if (!todo.length) return;
    if (!(await setup())) return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('maintenance', { name: 'Maintenance reminders', importance: Notifications.AndroidImportance.HIGH, lightColor: '#ff8fab' });
    await Notifications.setNotificationCategoryAsync('taskdone', [{ identifier: 'taskdone', buttonTitle: 'Done', options: { opensAppToForeground: true } }]);
    for (const t of todo.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 30)) {
      await Notifications.scheduleNotificationAsync({
        identifier: t.id,
        content: { title: t.title, body: t.body, sound: true, categoryIdentifier: 'taskdone', data: { cat: t.cat, tid: t.tid } } as any,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t.at, channelId: 'maintenance', delivery: 'alarmClock' } as any,
      });
    }
  } catch (e) { /* ignore */ }
}
