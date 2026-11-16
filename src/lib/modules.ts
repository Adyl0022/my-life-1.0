import { trackVisit } from './usage';

export type ModCount = Record<string, Record<string, number>>;
export const MODS: { k: string; name: string; c: string }[] = [
  { k: 'planner', name: 'Daily Planner', c: '#7c9cff' },
  { k: 'islamic', name: 'Islamic Hub', c: '#34d399' },
  { k: 'finance', name: 'My Finance', c: '#ffc46b' },
  { k: 'record', name: 'My Record', c: '#ff8fab' },
  { k: 'habit', name: 'Habit & Health', c: '#b794ff' },
];
export const modOf = (path: string): string => {
  if (path.startsWith('/planner') || path.startsWith('/notes') || path.startsWith('/family')) return 'planner';
  if (['/islamic', '/prayer', '/mathurat', '/tasbih', '/puasa', '/tahlil', '/surah'].some((p) => path.startsWith(p))) return 'islamic';
  if (path.startsWith('/finance')) return 'finance';
  if (path.startsWith('/record')) return 'record';
  if (path.startsWith('/habit')) return 'habit';
  return '';
};
let prev = '';
export function trackModule(path: string) {
  const m = modOf(path);
  const was = prev; prev = m;
  if (!m || m === was) return;
  trackVisit(m).catch(() => {});
}
