import { Platform } from 'react-native';
import { cs } from './region';
import * as Notifications from 'expo-notifications';
import { setup, cancelPrefix, inQuiet, Toggles } from './adhan';

export type PEvent = { id: number; name: string; date: string; remind: string; done: boolean };

// One reminder per Planner event, at 9 am on the day it is due (On the day), the day before, or a week before.
export async function syncEventAlerts(events: PEvent[], tg: Toggles): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelPrefix('event-');
    if (!tg.ev) return;
    const now = Date.now(); const todo: { e: PEvent; at: Date; when: string }[] = [];
    for (const e of events || []) {
      if (e.done || !e.date || !e.remind || e.remind === 'None') continue;
      const [y, m, d] = e.date.split('-').map(Number); if (!y || !m || !d) continue;
      const back = e.remind === '1 week before' ? 7 : e.remind === '1 day before' ? 1 : 0;
      const at = new Date(y, m - 1, d - back, 9, 0, 0);
      if (at.getTime() <= now + 5000 || inQuiet(at, tg)) continue;
      todo.push({ e, at, when: back === 7 ? 'in 1 week' : back === 1 ? 'tomorrow' : 'today' });
    }
    if (!todo.length) return;
    if (!(await setup())) return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('events', { name: 'Event reminders', importance: Notifications.AndroidImportance.HIGH, lightColor: '#6a4df0' });
    for (const t of todo.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 50)) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'event-' + t.e.id + '-' + t.at.getTime(),
        content: { title: t.e.name, body: 'Event ' + t.when + '. Open Planner for details.', sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t.at, channelId: 'events', delivery: 'alarmClock' } as any,
      });
    }
  } catch (e) { /* ignore */ }
}

// Al-Ma'thurat reminders, every morning and every evening. Only scheduled when notifications are already allowed.
export async function syncZikirAlerts(tg: Toggles): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelPrefix('zikir-');
    if (!tg.zk) return;
    const p = await Notifications.getPermissionsAsync(); if (p.status !== 'granted') return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('zikir', { name: 'Daily zikir', importance: Notifications.AndroidImportance.DEFAULT, lightColor: '#6a4df0' });
    const slots: [string, number, number, string][] = [['morning', 6, 30, 'Morning Al-Ma\'thurat'], ['evening', 17, 30, 'Evening Al-Ma\'thurat']];
    for (const [k, h, m, title] of slots) {
      if (inQuiet(new Date(2000, 0, 1, h, m), tg)) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: 'zikir-' + k,
        content: { title, body: 'Time for your ' + (k === 'morning' ? 'morning' : 'evening') + ' zikir. Open Islamic Hub.', sound: false },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: m, channelId: 'zikir', delivery: 'alarmClock' } as any,
      });
    }
  } catch (e) { /* ignore */ }
}

// One reminder to back up, 30 days after the last backup (or 30 days from now if there has never been one).
export async function syncBackupAlert(on: boolean, last: number): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelPrefix('backup-');
    if (!on) return;
    const p = await Notifications.getPermissionsAsync(); if (p.status !== 'granted') return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('backup', { name: 'Backup reminder', importance: Notifications.AndroidImportance.DEFAULT, lightColor: '#6a4df0' });
    const base = new Date(last || Date.now()); base.setDate(base.getDate() + 30); base.setHours(10, 0, 0, 0);
    let at = base;
    if (at.getTime() <= Date.now() + 5000) { at = new Date(); at.setDate(at.getDate() + 1); at.setHours(10, 0, 0, 0); }
    await Notifications.scheduleNotificationAsync({
      identifier: 'backup-next',
      content: { title: 'Time for a backup', body: 'It has been a while. Save a copy of your data from Settings, Export.', sound: false },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: 'backup', delivery: 'alarmClock' } as any,
    });
  } catch (e) { /* ignore */ }
}

type RenData = { data?: Record<string, { renew?: { roadtax?: string; insurance?: string; licence?: string } }> };
// Road tax, insurance and driving licence: a reminder 30 days before, 7 days before and on the day, at 9 am.
export async function syncRenewAlerts(rec: RenData, tg: Toggles, on: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelPrefix('renew-');
    if (!on || !tg.ev) return;
    const now = Date.now(); const todo: { id: string; at: Date; title: string; body: string }[] = [];
    const L: [string, string][] = [['roadtax', 'Road tax'], ['insurance', 'Insurance'], ['licence', 'Driving licence']];
    Object.entries((rec && rec.data) || {}).forEach(([veh, v], vi) => {
      const rn = (v && v.renew) || {};
      L.forEach(([k, lab]) => {
        const s = (rn as any)[k] as string | undefined; if (!s) return;
        const [y, m, d] = s.split('-').map(Number); if (!y || !m || !d) return;
        ([[30, 'in 30 days'], [7, 'in 7 days'], [0, 'today']] as [number, string][]).forEach(([back, when]) => {
          const at = new Date(y, m - 1, d - back, 9, 0, 0);
          if (at.getTime() <= now + 5000 || inQuiet(at, tg)) return;
          todo.push({ id: 'renew-' + vi + '-' + k + '-' + back, at, title: lab + ' ' + (back === 0 ? 'expires today' : 'expires ' + when), body: (veh ? veh + '. ' : '') + 'Open My Record to see the date.' });
        });
      });
    });
    if (!todo.length) return;
    if (!(await setup())) return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('renewals', { name: 'Renewal reminders', importance: Notifications.AndroidImportance.HIGH, lightColor: '#ff8fab' });
    for (const t of todo.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 30)) {
      await Notifications.scheduleNotificationAsync({
        identifier: t.id,
        content: { title: t.title, body: t.body, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t.at, channelId: 'renewals', delivery: 'alarmClock' } as any,
      });
    }
  } catch (e) { /* ignore */ }
}

// Documents: a reminder per document on the day chosen in the document (days before expiry) and on the day itself, at 9 am.
export async function syncDocAlerts(store: { docs?: { id: string; title: string; expiry?: string; remind?: string }[] }, tg: Toggles, on: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelPrefix('doc-');
    if (!on || !tg.ev) return;
    const DAYS: Record<string, number> = { '1w': 7, '1m': 30, '3m': 90, '6m': 180 };
    const now = Date.now(); const todo: { id: string; at: Date; title: string; body: string }[] = [];
    ((store && store.docs) || []).forEach(dc => {
      const s = dc.expiry; const rd = DAYS[dc.remind || ''];
      if (!s || !rd) return;
      const [y, m, d] = s.split('-').map(Number); if (!y || !m || !d) return;
      ([[rd, 'is due in ' + (rd >= 30 ? Math.round(rd / 30) + (rd >= 60 ? ' months' : ' month') : '1 week')], [0, 'expires today']] as [number, string][]).forEach(([back, when]) => {
        const at = new Date(y, m - 1, d - back, 9, 0, 0);
        if (at.getTime() <= now + 5000 || inQuiet(at, tg)) return;
        todo.push({ id: 'doc-' + dc.id + '-' + back, at, title: dc.title + ' ' + (back === 0 ? when : 'expires soon'), body: back === 0 ? 'Open Documents to see it.' : 'It ' + when.replace('is due', 'expires') + '. Open Documents to see it.' });
      });
    });
    if (!todo.length) return;
    if (!(await setup())) return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('renewals', { name: 'Renewal reminders', importance: Notifications.AndroidImportance.HIGH, lightColor: '#ff8fab' });
    for (const t of todo.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 30)) {
      await Notifications.scheduleNotificationAsync({
        identifier: t.id,
        content: { title: t.title, body: t.body, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t.at, channelId: 'renewals' } as any,
      });
    }
  } catch (e) { /* ignore */ }
}

// Subscriptions: a 9 am reminder before each coming charge (and on the day), for the next 3 charges of each one. A free trial warns before it turns into a payment.
export async function syncSubAlerts(store: { subs?: any[] }, tg: Toggles, on: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelPrefix('sub-');
    if (!on || !tg.ev) return;
    const { nextCharge, addCycle, ymd, num, rm } = await import('./subs');
    const now = Date.now(); const today = ymd(new Date()); const todo: { id: string; at: Date; title: string; body: string }[] = [];
    ((store && store.subs) || []).forEach((s: any) => {
      if (s.status === 'paused' || s.status === 'cancelled') return;
      let d = nextCharge(s, today); if (!d) return;
      for (let k = 0; k < 3; k++, d = addCycle(d, s.cycle)) {
        const [y, m, dd] = d.split('-').map(Number); const trial = !!s.trial && k === 0; const p = rm(num(s.price));
        const list: [number, string][] = [[0, 'today']]; if (s.remind > 0) list.unshift([s.remind, s.remind === 1 ? 'tomorrow' : 'in ' + s.remind + (s.remind === 7 ? ' days' : ' days')]);
        list.forEach(([back, when]) => {
          const at = new Date(y, m - 1, dd - back, 9, 0, 0); if (at.getTime() <= now + 5000 || inQuiet(at, tg)) return;
          todo.push({ id: 'sub-' + s.id + '-' + d + '-' + back, at, title: trial ? s.name + ' free trial ends ' + when : s.name + ' charges ' + when, body: trial ? 'Cancel it now if you do not want to pay ' + p + '. Open Subscriptions.' : p + '. Open Subscriptions to see it.' });
        });
      }
    });
    if (!todo.length) return;
    if (!(await setup())) return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('subs', { name: 'Subscription reminders', importance: Notifications.AndroidImportance.HIGH, lightColor: '#7c9cff' });
    for (const t of todo.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 30)) {
      await Notifications.scheduleNotificationAsync({ identifier: t.id, content: { title: t.title, body: t.body, sound: true }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t.at, channelId: 'subs' } as any });
    }
  } catch (e) { /* ignore */ }
}

// Personal Collection: a 9 am reminder on the due date of money or things you lent or borrowed, and 30 days before a gadget's warranty ends.
export async function syncColAlerts(col: { items?: any[]; loans?: any[] }, tg: Toggles, on: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelPrefix('col-');
    if (!on || !tg.ev) return;
    const now = Date.now(); const todo: { id: string; at: Date; title: string; body: string }[] = [];
    const at9 = (s: string, back: number) => { const [y, m, d] = String(s || '').split('-').map(Number); if (!y || !m || !d) return null; const t = new Date(y, m - 1, d - back, 9, 0, 0); return t.getTime() <= now + 5000 || inQuiet(t, tg) ? null : t; };
    ((col && col.loans) || []).forEach((l) => {
      if (l.done || !l.due || l.remind === 'off') return;
      const what = l.what === 'money' ? cs() + Math.max(0, (parseFloat(String(l.amount).replace(',', '.')) || 0) - (l.pays || []).reduce((t: number, p: any) => t + (p.a > 0 ? p.a : 0), 0)) : l.title;
      const lead = l.remind === '3d' ? 3 : 0; const t = at9(l.due, lead); if (!t) return;
      const when = lead ? 'Due in 3 days' : 'Due today';
      todo.push({ id: 'col-loan-' + l.id, at: t, title: l.dir === 'lent' ? when + ': ' + l.who + ' should return ' + what : when + ': return ' + what + ' to ' + l.who, body: 'Open Lent & Borrowed to mark it returned.' });
    });
    ((col && col.items) || []).forEach((x) => {
      if (x.cat !== 'gadget' || !x.warranty) return; const t = at9(x.warranty, 30); if (!t) return;
      todo.push({ id: 'col-warr-' + x.id, at: t, title: x.name + ' warranty ends in 30 days', body: 'Check it now if anything needs fixing.' });
    });
    if (!todo.length) return;
    if (!(await setup())) return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('renewals', { name: 'Renewal reminders', importance: Notifications.AndroidImportance.HIGH, lightColor: '#ff8fab' });
    for (const t of todo.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 30)) {
      await Notifications.scheduleNotificationAsync({ identifier: t.id, content: { title: t.title, body: t.body, sound: true }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t.at, channelId: 'renewals' } as any });
    }
  } catch (e) { /* ignore */ }
}

// Every Sunday at 8 pm: a nudge to look at the weekly review in Insights. Only when notifications are already allowed.
export async function syncWeekAlert(tg: Toggles): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelPrefix('week-');
    if (!tg.ev) return;
    const p = await Notifications.getPermissionsAsync(); if (p.status !== 'granted') return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('week', { name: 'Weekly review', importance: Notifications.AndroidImportance.DEFAULT, lightColor: '#7c9cff' });
    await Notifications.scheduleNotificationAsync({
      identifier: 'week-review',
      content: { title: 'Your week in My Life 1.0', body: 'See how your week went. Open Insights and tap Week.', sound: false },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 20, minute: 0, channelId: 'week', delivery: 'alarmClock' } as any,
    });
  } catch (e) { /* ignore */ }
}

type MedRow = { id: string; name: string; dose: string; time: string; days?: number[] };
// Medicine reminders: every day at the time set, and again one hour later if it is not ticked yet. Quiet hours do not mute these.
export async function syncMedAlerts(meds: MedRow[], takenToday: string[], on: boolean, ring = true): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelPrefix('med-');
    if (!on || !meds.length) return;
    if (!(await setup())) return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('meds', { name: 'Medicine reminders', importance: Notifications.AndroidImportance.HIGH, lightColor: '#5ee7df' });
    const now = Date.now();
    // Alarm-style delivery: the phone cannot hold the reminder back (needs exact timing to be allowed). The person can turn it off in Medicine.
    const delivery = ring ? 'alarmClock' : 'bestEffort';
    for (const m of meds.slice(0, 10)) {
      const t = /^(\d{1,2}):(\d{2})$/.exec(m.time || ''); if (!t) continue;
      const hh = +t[1], mm = +t[2];
      const body = m.name + (m.dose ? ' · ' + m.dose : '');
      const every = !m.days || m.days.length === 0 || m.days.length >= 7;
      if (every) {
        await Notifications.scheduleNotificationAsync({
          identifier: 'med-' + m.id + '-daily',
          content: { title: 'Medicine reminder', body, sound: true },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: hh, minute: mm, channelId: 'meds', delivery } as any,
        });
      } else {
        for (const wd of m.days!) {
          await Notifications.scheduleNotificationAsync({
            identifier: 'med-' + m.id + '-wk' + wd,
            content: { title: 'Medicine reminder', body, sound: true },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: wd + 1, hour: hh, minute: mm, channelId: 'meds', delivery } as any,
          });
        }
      }
      // One reminder an hour later for each of the next 7 days. Ticking the medicine in the app cancels that day's reminder.
      for (let d = 0; d < 7; d++) {
        if (d === 0 && takenToday.includes(m.id)) continue;
        const at = new Date(); at.setDate(at.getDate() + d); at.setHours(hh + 1, mm, 0, 0);
        if (!every && !m.days!.includes(at.getDay())) continue;
        if (at.getTime() <= now + 5000) continue;
        await Notifications.scheduleNotificationAsync({
          identifier: 'med-' + m.id + '-fu-' + at.getFullYear() + (at.getMonth() + 1) + at.getDate(),
          content: { title: 'Did you take your medicine?', body, sound: true },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: 'meds', delivery } as any,
        });
      }
    }
  } catch (e) { /* ignore */ }
}

// Optional daily Relax reminder at a time the person sets.
export async function syncRelaxAlert(time: string | undefined, on: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelPrefix('rlx-rem');
    const t = /^(\d{1,2}):(\d{2})$/.exec(time || '');
    if (!on || !t) return;
    if (!(await setup())) return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('relax', { name: 'Relax reminder', importance: Notifications.AndroidImportance.DEFAULT, lightColor: '#8fe9e2' });
    await Notifications.scheduleNotificationAsync({
      identifier: 'rlx-rem',
      content: { title: 'Time to relax', body: 'A few quiet minutes: breathe or meditate in Habit & Health.', sound: false },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: +t[1], minute: +t[2], channelId: 'relax', delivery: 'alarmClock' } as any,
    });
  } catch (e) { /* ignore */ }
}
// A soft bell when a meditation ends, in case the screen has locked.
export async function scheduleRelaxEnd(seconds: number): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelPrefix('rlx-end');
    if (!(await setup())) return;
    // Own channel with higher importance so the bell sounds and shows on a locked screen.
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('relax-end', { name: 'Relax timer finished', importance: Notifications.AndroidImportance.HIGH, lightColor: '#8fe9e2', vibrationPattern: [0, 250, 150, 250] });
    await Notifications.scheduleNotificationAsync({
      identifier: 'rlx-end',
      content: { title: 'Session complete', body: 'Well done. Take a moment before you carry on.', sound: true },
      // alarmClock delivery: the phone cannot hold the notification back while the screen is off (same as medicine reminders).
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(Date.now() + Math.max(5, Math.round(seconds)) * 1000), channelId: 'relax-end', delivery: 'alarmClock' } as any,
    });
  } catch (e) { /* ignore */ }
}
export async function cancelRelaxEnd(): Promise<void> {
  if (Platform.OS === 'web') return;
  try { await cancelPrefix('rlx-end'); } catch (e) { /* ignore */ }
}

// Two days before the estimated period, at 9 am. The text is deliberately plain so nothing private shows on the lock screen.
export async function syncCycleAlert(daysTo: number | null, on: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelPrefix('cyc-');
    if (!on || daysTo == null) return;
    if (!(await setup())) return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('cycle', { name: 'Personal reminder', importance: Notifications.AndroidImportance.DEFAULT, lightColor: '#ff8fab' });
    const at = new Date(); at.setDate(at.getDate() + daysTo - 2); at.setHours(9, 0, 0, 0);
    if (at.getTime() <= Date.now() + 5000) return;
    await Notifications.scheduleNotificationAsync({
      identifier: 'cyc-next',
      content: { title: 'Reminder from My Life 1.0', body: 'Open My Life 1.0 to see your reminder.', sound: false },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: 'cycle', delivery: 'alarmClock' } as any,
    });
  } catch (e) { /* ignore */ }
}

// A reminder set inside a note (Notes & Reminders). It rings at the exact time the person chose, so quiet hours and the Planner switch do not hold it back.
export type NoteRem = { id: number; t: string; s: string; rm?: number; rd?: boolean; ra?: number[] };
const AHEAD = (m: number) => (m >= 1440 ? (m / 1440 === 1 ? 'tomorrow' : 'in ' + m / 1440 + ' days') : m >= 60 ? 'in ' + (m / 60 === 1 ? '1 hour' : m / 60 + ' hours') : 'in ' + m + ' minutes');
export async function syncNoteAlerts(notes: NoteRem[], on: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelPrefix('note-');
    if (!on) return;
    const now = Date.now();
    const todo: { id: string; at: number; title: string; body: string }[] = [];
    for (const n of (notes || []).filter((x) => x.rm && !x.rd)) {
      const line = (n.s || '').split('\n').map((x) => x.replace(/^\s*([☐☑]|•|\d+\.)\s*/, '').trim()).find(Boolean) || '';
      const title = (n.t || '').trim() || 'Reminder';
      todo.push({ id: 'note-' + n.id + '-' + n.rm, at: n.rm as number, title, body: line.slice(0, 120) || 'Open Notes & Reminders for your note.' });
      for (const m of (n.ra || []).filter((v) => v > 0 && v <= 10080).slice(0, 5)) todo.push({ id: 'note-' + n.id + '-' + n.rm + '-b' + m, at: (n.rm as number) - m * 60000, title, body: 'Coming up ' + AHEAD(m) + (line ? ' · ' + line.slice(0, 80) : '') });
    }
    const list = todo.filter((x) => x.at > now + 5000).sort((a, b) => a.at - b.at).slice(0, 60);
    if (!list.length) return;
    if (!(await setup())) return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('notes', { name: 'Note reminders', importance: Notifications.AndroidImportance.HIGH, lightColor: '#ffc46b' });
    for (const n of list) {
      await Notifications.scheduleNotificationAsync({
        identifier: n.id,
        content: { title: n.title, body: n.body, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(n.at), channelId: 'notes', delivery: 'alarmClock' } as any,
      });
    }
  } catch (e) { /* ignore */ }
}
