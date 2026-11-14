import { Platform } from 'react-native';
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
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t.at, channelId: 'events' } as any,
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
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: m, channelId: 'zikir' } as any,
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
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: 'backup' } as any,
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
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t.at, channelId: 'renewals' } as any,
      });
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
      content: { title: 'Your week in My Life', body: 'See how your week went. Open Insights and tap Week.', sound: false },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 20, minute: 0, channelId: 'week' } as any,
    });
  } catch (e) { /* ignore */ }
}
