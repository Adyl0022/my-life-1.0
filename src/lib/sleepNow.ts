import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getItem, setItem } from './store';
import { HData, HDay, BLANK, HEMPTY, keyOfDate, to12 } from './habit';
import { setSleepTile, sleepNativeOk, sleepNativeStart, sleepNativeEnd, sleepNativeState, sleepNativeClear } from '../../modules/step-counter';
import { periodOf } from './theme';
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

// On Android the timer is run by the phone itself (notification button and Quick Settings tile work without opening the app).
// The app only saves the finished sleeps into the Sleep Tracker, whenever it opens or comes back to the front.
const native = () => Platform.OS === 'android' && sleepNativeOk();

// Saves one finished sleep into the day you woke up. Gives the notification title and text.
async function saveSleep(start: number, end: number): Promise<{ title: string; msg: string }> {
  const ms = end - start;
  const pd = periodOf(new Date(end)); let title = pd === 'Night' ? (new Date(end).getHours() >= 20 ? 'Good evening' : 'Hello') : 'Good ' + pd.toLowerCase();
  if (ms < 10 * 60000) return { title, msg: 'That was under 10 minutes, so it was not saved.' };
  if (ms > 16 * 3600000) return { title, msg: 'That was over 16 hours, so it was not saved. You can type your sleep by hand.' };
  const hrs = Math.round(ms / 360000) / 10; const w = new Date(end); const k = keyOfDate(w);
  const h = await getItem<HData>('ml_habit', HEMPTY);
  const day: HDay = { ...BLANK, ...(h.days[k] || {}) };
  await setItem('ml_habit', { ...h, days: { ...h.days, [k]: { ...day, sleep: hrs, bed: hhmm(new Date(start)), wake: hhmm(w) } } });
  let msg = 'You slept ' + fmtDur(ms) + '. Saved to Sleep Tracker.';
  if (hrs < 6) { title = 'Short sleep'; msg += ' Less than 6 hours is not enough. Try to get more rest next time.'; }
  else if (hrs > 9) { title = 'Long sleep'; msg += ' More than 9 hours is a lot. Try to keep your sleep steady.'; }
  return { title, msg };
}

// Android: takes what the phone recorded (a sleep in progress, or sleeps finished while the app was closed) into the app. Gives the last message.
export async function syncSleepNative(): Promise<string> {
  if (!native()) return '';
  const st = sleepNativeState(); if (!st) return '';
  let msg = '';
  for (const p of st.pending) { const r = await saveSleep(p.s, p.e); msg = r.msg; }
  if (st.pending.length) sleepNativeClear();
  const cur = await getItem<SleepNow>(SLEEP_KEY, null);
  if (st.start > 0) { if (!cur || cur.start !== st.start) await setItem(SLEEP_KEY, { start: st.start }); }
  else if (cur && cur.start) await setItem(SLEEP_KEY, null);
  return msg;
}

export async function startSleep(): Promise<void> {
  if (native()) {
    try { await setup(true); } catch (e) {}
    sleepNativeStart(); await syncSleepNative(); return;
  }
  const cur = await getItem<SleepNow>(SLEEP_KEY, null); if (cur && cur.start) return;
  const start = Date.now();
  await setItem(SLEEP_KEY, { start }); setSleepTile(start);
  if (!(await prep())) return;
  try {
    await Notifications.scheduleNotificationAsync({ identifier: NID, content: { title: 'Sleeping since ' + to12(hhmm(new Date(start))), body: 'Tap "I\'m awake" when you wake up.', categoryIdentifier: 'sleeping', sticky: true, autoDismiss: false, sound: false } as any, trigger: { channelId: 'sleeping' } as any });
  } catch (e) {}
}

// Returns a short message for the screen. The hours go to the day you woke up.
export async function endSleep(): Promise<string> {
  if (native()) { sleepNativeEnd(); return (await syncSleepNative()) || ''; }
  const cur = await getItem<SleepNow>(SLEEP_KEY, null); if (!cur || !cur.start) return '';
  const end = Date.now();
  await setItem(SLEEP_KEY, null); setSleepTile(0);
  try { await Notifications.dismissNotificationAsync(NID); await Notifications.cancelScheduledNotificationAsync(NID); } catch (e) {}
  const { title, msg } = await saveSleep(cur.start, end);
  if (await prep()) { try { await Notifications.scheduleNotificationAsync({ content: { title, body: msg, sound: false } as any, trigger: { channelId: 'sleeping' } as any }); } catch (e) {} }
  return msg;
}
