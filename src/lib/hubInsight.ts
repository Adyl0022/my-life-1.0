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

// A short verse chosen for the day: Al-Kahfi on Friday, Al-Baqarah 185 in Ramadan, otherwise a short verse that changes every day.
const DAILY: [string, number][] = [['94', 5], ['2', 152], ['3', 139], ['13', 28], ['65', 3], ['93', 3], ['20', 46], ['2', 186]];
export function ayatOfDay(today: Date, ramadan: boolean): { key: string; n: number; why: string } {
  if (ramadan) return { key: '2', n: 185, why: 'For Ramadan' };
  if (today.getDay() === 5) return { key: 'kahfi', n: 10, why: 'For Friday' };
  const doy = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const d = DAILY[doy % DAILY.length];
  return { key: d[0], n: d[1], why: 'Verse of the day' };
}
