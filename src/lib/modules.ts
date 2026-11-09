import AsyncStorage from '@react-native-async-storage/async-storage';
import { notifyStored } from './store';
import { open } from './secure';

export type ModCount = Record<string, Record<string, number>>;
export const MODS: { k: string; name: string; c: string }[] = [
  { k: 'planner', name: 'Daily Planner', c: '#7c9cff' },
  { k: 'islamic', name: 'Islamic Hub', c: '#34d399' },
  { k: 'finance', name: 'My Finance', c: '#ffc46b' },
  { k: 'record', name: 'My Record', c: '#ff8fab' },
  { k: 'habit', name: 'Habit & Health', c: '#b794ff' },
];
export const modOf = (path: string): string => {
  if (path.startsWith('/planner') || path.startsWith('/notes')) return 'planner';
  if (['/islamic', '/prayer', '/mathurat', '/tasbih', '/puasa', '/tahlil', '/surah'].some((p) => path.startsWith(p))) return 'islamic';
  if (path.startsWith('/finance')) return 'finance';
  if (path.startsWith('/record')) return 'record';
  if (path.startsWith('/habit')) return 'habit';
  return '';
};
const dk = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
let prev = '';
// These counts only say how many times each module was opened, so they are saved as plain text, like the time-used numbers
// (which have always worked). Saving them encrypted made them depend on the phone keystore, and they kept getting lost.
// An older encrypted value is still read, and if it cannot be read the counts simply start again.
async function rd<T>(k: string, d: T): Promise<T> {
  try { const r = await AsyncStorage.getItem(k); return r == null ? d : (JSON.parse(await open(r)) as T); } catch (e) { return d; }
}
// One visit is written at a time, so two quick screen changes cannot overwrite each other.
let queue: Promise<void> = Promise.resolve();
export function trackModule(path: string) {
  const m = modOf(path);
  const was = prev; prev = m;
  if (!m || m === was) return queue;
  queue = queue.then(async () => {
    const all = await rd<ModCount>('ml_modules', {});
    const hrs = await rd<number[]>('ml_hours', new Array(24).fill(0));
    const k = dk(new Date());
    all[k] = all[k] || {};
    all[k][m] = (all[k][m] || 0) + 1;
    const cut = new Date(); cut.setDate(cut.getDate() - 31);
    Object.keys(all).forEach((x) => { if (x < dk(cut)) delete all[x]; });
    const hh = Array.isArray(hrs) && hrs.length === 24 ? hrs : new Array(24).fill(0);
    hh[new Date().getHours()] += 1;
    await AsyncStorage.setItem('ml_modules', JSON.stringify(all));
    await AsyncStorage.setItem('ml_hours', JSON.stringify(hh));
    notifyStored();
  }).catch(() => {});
  return queue;
}
