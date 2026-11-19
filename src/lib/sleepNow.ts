import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getItem, setItem } from './store';
import { HData, HDay, BLANK, HEMPTY, keyOfDate, to12 } from './habit';
import { ensureHandler, setup } from './adhan';

// "Going to sleep" starts a timer, "I'm awake" stops it and saves the hours into the Sleep Tracker.
export const SLEEP_KEY = 'ml_sleep_now';
export type SleepNow = { start: number } | null;
const NID = 'sleeping';
const hhmm = (d: Date) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
export const fmtDur = (ms: number) => { const m = Math.round(ms / 60000); return Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm'; };

async function prep() {
  if (Platform.OS === 'web') return false;
  if (!(await setup())) return false;
  ensureHandler();
  try {
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('sleeping', { name: 'Sleep timer', importance: Notifications.AndroidImportance.LOW, vibrationPattern: [0], lightColor: '#b794ff' });
    await Notifications.setNotificationCategoryAsync('sleeping', [{ identifier: 'awake', buttonTitle: "I'm awake", options: { opensAppToForeground: true } }]);
  } catch (e) {}
  return true;
}

export async function startSleep(): Promise<void> {
  const cur = await getItem<SleepNow>(SLEEP_KEY, null); if (cur && cur.start) return;
  const start = Date.now();
  await setItem(SLEEP_KEY, { start });
  if (!(await prep())) return;
  try {
    await Notifications.scheduleNotificationAsync({ identifier: NID, content: { title: 'Sleeping since ' + to12(hhmm(new Date(start))), body: 'Tap "I\'m awake" when you wake up.', categoryIdentifier: 'sleeping', sticky: true, autoDismiss: false, sound: false } as any, trigger: { channelId: 'sleeping' } as any });
  } catch (e) {}
}

// Returns a short message for the screen. The hours go to the day you woke up.
export async function endSleep(): Promise<string> {
  const cur = await getItem<SleepNow>(SLEEP_KEY, null); if (!cur || !cur.start) return '';
  const end = Date.now(); const ms = end - cur.start;
  await setItem(SLEEP_KEY, null);
  try { await Notifications.dismissNotificationAsync(NID); await Notifications.cancelScheduledNotificationAsync(NID); } catch (e) {}
  let msg: string;
  if (ms < 10 * 60000) msg = 'That was under 10 minutes, so it was not saved.';
  else if (ms > 16 * 3600000) msg = 'That was over 16 hours, so it was not saved. You can type your sleep by hand.';
  else {
    const hrs = Math.round(ms / 360000) / 10; const w = new Date(end); const k = keyOfDate(w);
    const h = await getItem<HData>('ml_habit', HEMPTY);
    const day: HDay = { ...BLANK, ...(h.days[k] || {}) };
    await setItem('ml_habit', { ...h, days: { ...h.days, [k]: { ...day, sleep: hrs, bed: hhmm(new Date(cur.start)), wake: hhmm(w) } } });
    msg = 'You slept ' + fmtDur(ms) + '. Saved to Sleep Tracker.';
  }
  if (await prep()) { try { await Notifications.scheduleNotificationAsync({ content: { title: 'Good morning', body: msg, sound: false } as any, trigger: { channelId: 'sleeping' } as any }); } catch (e) {} }
  return msg;
}
