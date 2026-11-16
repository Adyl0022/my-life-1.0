import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dateOf, keyOfDate } from './habit';
import { stepTotal } from '../../modules/step-counter';

// The phone counts steps all day on its own (a running total since it was switched on), even when My Life is closed.
// Each time we read that total we keep the difference since the last reading and add it to today.
// Kept on this phone only (never synced). A gap of more than 16 hours cannot be split between days, so it is skipped.
const KEY = 'ml_stepday';
type S = { d: string; last: number; at: number; today: number };

// Steps the sensor counted today, or { err } with the reason when it cannot be read.
export async function sensorToday(): Promise<{ n: number } | { err: number }> {
  if (Platform.OS !== 'android') return { err: -1 };
  const total = await stepTotal();
  if (total < 0) return { err: total };
  const day = keyOfDate(dateOf(0)); const now = Date.now();
  let s: S | null = null;
  try { const r = await AsyncStorage.getItem(KEY); if (r) { const j = JSON.parse(r); if (j && isFinite(j.last) && isFinite(j.at)) s = { d: String(j.d), last: Number(j.last), at: Number(j.at), today: Number(j.today) || 0 }; } } catch (e) {}
  let today = 0;
  if (s) {
    const delta = total >= s.last ? total - s.last : total; // the total starts again from zero after a restart
    const ok = delta >= 0 && delta < 60000;
    if (s.d === day) today = s.today + (ok ? delta : 0);
    else if (s.d === keyOfDate(dateOf(-1)) && now - s.at < 16 * 3600 * 1000 && ok) today = delta;
  }
  try { await AsyncStorage.setItem(KEY, JSON.stringify({ d: day, last: total, at: now, today })); } catch (e) {}
  return { n: Math.round(today) };
}
