// Small daily log for the Islamic Hub insight card (which days you read Quran or zikir), plus the verse of the day.
import { getItem, setItem } from './store';
import { keyD, addDays } from './fasting';

export type HubLog = Record<string, { q?: number; z?: number }>;

export async function markHub(kind: 'q' | 'z') {
  try {
    const k = keyD(new Date()), l = await getItem<HubLog>('ml_hub_log', {});
    if (l[k] && l[k][kind]) return;
    const cut = keyD(addDays(new Date(), -45)); const n: HubLog = {};
    Object.keys(l).forEach((d) => { if (d >= cut) n[d] = l[d]; });
    n[k] = { ...(n[k] || {}), [kind]: 1 };
    await setItem('ml_hub_log', n);
  } catch (e) {}
}

// Days out of the last 7 (today included) with this kind of activity.
export const weekDays = (l: HubLog, kind: 'q' | 'z', today = new Date()) => { let n = 0; for (let i = 0; i < 7; i++) { const x = l[keyD(addDays(today, -i))]; if (x && x[kind]) n++; } return n; };

// This week, Monday to Sunday: one flag per day.
export const weekRow = (has: (k: string) => boolean, today = new Date()) => { const mon = addDays(today, -((today.getDay() + 6) % 7)); return [0, 1, 2, 3, 4, 5, 6].map((i) => { const d = addDays(mon, i); return { on: has(keyD(d)), today: keyD(d) === keyD(today), future: d.getTime() > today.getTime() && keyD(d) !== keyD(today) }; }); };

// Current streak (today may still be empty) and best streak in the saved days.
export function streaks(l: HubLog, kind: 'q' | 'z', today = new Date()) {
  const on = (d: Date) => !!(l[keyD(d)] && l[keyD(d)][kind]);
  let cur = 0, o = on(today) ? 0 : 1; while (on(addDays(today, -o))) { cur++; o++; }
  let best = 0, run = 0; for (let i = 44; i >= 0; i--) { if (on(addDays(today, -i))) { run++; best = Math.max(best, run); } else run = 0; }
  return { cur, best };
}

// A verse for the day. On the day of an Islamic event it fits the event, then Ramadan, then Friday, otherwise a short verse that changes daily.
// Every verse here is short enough to show in full on the card (about 110 characters of translation at most).
const DAILY: [string, number][] = [['94', 5], ['2', 152], ['3', 139], ['93', 3], ['20', 46], ['55', 13], ['2', 153], ['16', 128]];
const FOR_EVENT: Record<string, [string, number]> = {
  'Awal Muharram': ['103', 3], 'Hari Asyura': ['26', 65], 'Maulidur Rasul': ['21', 107], "Isra' Mi'raj": ['53', 18],
  'Nuzul Quran': ['97', 1], 'Aidilfitri': ['87', 14], 'Hari Arafah': ['3', 96], 'Aidiladha': ['108', 2],
};
export function ayatOfDay(today: Date, ramadan: boolean, eventToday?: string): { key: string; n: number; why: string } {
  const fe = eventToday && FOR_EVENT[eventToday];
  if (fe) return { key: fe[0], n: fe[1], why: 'For ' + eventToday };
  if (ramadan) return { key: '97', n: 3, why: 'For Ramadan' };
  if (today.getDay() === 5) return { key: 'kahfi', n: 1, why: 'For Friday' };
  const doy = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const d = DAILY[doy % DAILY.length];
  return { key: d[0], n: d[1], why: 'Verse of the day' };
}
