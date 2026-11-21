import { HData, HDay, BLANK, getDay, dateOf, keyOfDate, MOODS, MON, cupsGoal, bestStreakAll } from './habit';
import { windowAvg, ENERGY, hasAny, energyEstimate, restSignal } from './patterns';
import { mins, fmtMin } from './relax';

export type Metric = 'steps' | 'water' | 'sleep' | 'mood' | 'energy';
export const METRICS: { k: Metric; l: string; c: string }[] = [
  { k: 'steps', l: 'Steps', c: '#5ee7df' }, { k: 'water', l: 'Water', c: '#7c9cff' }, { k: 'sleep', l: 'Sleep', c: '#b794ff' },
  { k: 'mood', l: 'Mood', c: '#ff8fab' }, { k: 'energy', l: 'Energy', c: '#ffc46b' },
];
// Energy is only the person's own rating (never the estimate): 0 exhausted to 3 very energetic.
export const valOf = (x: HDay, k: Metric): number | null =>
  k === 'steps' ? (x.steps > 0 ? x.steps : null) : k === 'water' ? (x.cups > 0 ? x.cups : null) : k === 'sleep' ? (x.sleep > 0 ? x.sleep : null)
    : k === 'mood' ? (x.mood >= 0 ? x.mood : null) : ((x.en ?? -1) >= 0 ? 3 - (x.en as number) : null);
export const fmtVal = (k: Metric, v: number): string =>
  k === 'steps' ? Math.round(v).toLocaleString() : k === 'water' ? (Math.round(v * 10) / 10) + ' glasses' : k === 'sleep' ? (Math.round(v * 10) / 10) + ' h'
    : k === 'mood' ? MOODS[Math.max(0, Math.min(4, Math.round(v)))][0] : ENERGY[Math.max(0, Math.min(3, 3 - Math.round(v)))][0];
export const dstr = (d: Date, year = false) => d.getDate() + ' ' + MON[d.getMonth()] + (year ? ' ' + d.getFullYear() : '');

// For energy, a day without the person's own rating gets the app's estimate (est = true), when it has two or more records to work from. The chart draws those as hollow dots.
export function series(h: HData, n: number, k: Metric): { off: number; v: number | null; est?: boolean }[] {
  const out: { off: number; v: number | null; est?: boolean }[] = [];
  for (let i = 0; i < n; i++) {
    const off = -(n - 1) + i; const x = getDay(h, off); let v = valOf(x, k); let est = false;
    if (k === 'energy' && v == null) { const e = energyEstimate(x, cupsGoal(h), h.goal || 8000, restSignal(h, keyOfDate(dateOf(off)))); if (e) { v = 3 - e.lvl; est = true; } }
    out.push(est ? { off, v, est } : { off, v });
  }
  return out;
}

const regress = (pts: { x: number; y: number }[]) => {
  const n = pts.length; const mx = pts.reduce((a, p) => a + p.x, 0) / n, my = pts.reduce((a, p) => a + p.y, 0) / n;
  let nu = 0, de = 0; pts.forEach((p) => { nu += (p.x - mx) * (p.y - my); de += (p.x - mx) * (p.x - mx); });
  const slope = de === 0 ? 0 : nu / de; return { slope, icpt: my - slope * mx };
};
export type Fut = { hist: (number | null)[]; proj: number[]; now: number; in4: number; slope: number; line: string; eta: string };
// A straight-line guess from the last 4 weeks of your own averages. It needs 3 weeks with records.
export function future(h: HData, k: 'steps' | 'water' | 'sleep'): Fut | null {
  const hist: (number | null)[] = [];
  for (let j = 3; j >= 0; j--) { const w = windowAvg(h, -7 * j); hist.push(k === 'steps' ? w.steps : k === 'water' ? w.water : w.sleep); }
  const pts = hist.map((v, i) => (v == null ? null : { x: i, y: v })).filter(Boolean) as { x: number; y: number }[];
  if (pts.length < 3) return null;
  const { slope, icpt } = regress(pts); const max = k === 'water' ? 16 : k === 'sleep' ? 12 : 60000;
  const proj = [4, 5, 6, 7].map((x) => Math.max(0, Math.min(max, icpt + slope * x)));
  const now = pts[pts.length - 1].y; const goal = k === 'steps' ? (h.goal || 8000) : k === 'water' ? cupsGoal(h) : 7;
  const per = k === 'steps' ? 50 : k === 'water' ? 0.05 : 0.02; // a change smaller than this a week counts as steady
  let eta: string;
  if (now >= goal) eta = 'You are already at your goal. Keep it up.';
  else if (slope > per) { const wk = Math.ceil((goal - now) / slope); eta = wk <= 26 ? 'At this pace you reach your goal in about ' + wk + (wk === 1 ? ' week.' : ' weeks.') : 'Your goal is still a long way off at this pace.'; }
  else eta = Math.abs(slope) <= per ? 'Steady for now. A small push would get you closer to your goal.' : 'Heading away from your goal at this pace. A small change this week can turn it around.';
  return { hist, proj, now, in4: proj[3], slope, line: slope > per ? 'Rising' : slope < -per ? 'Falling' : 'Steady', eta };
}
export type WFut = { hist: number[]; proj: number[]; last: number; goal: number | null; line: string };
export function weightFuture(h: HData): WFut | null {
  const l = (h.kg || []).slice().sort((a, b) => (a.d < b.d ? -1 : 1)).slice(-8);
  if (l.length < 2) return null;
  const t0 = new Date(l[0].d + 'T12:00:00').getTime(); const day = (d: string) => (new Date(d + 'T12:00:00').getTime() - t0) / 86400000;
  const span = day(l[l.length - 1].d); if (span < 7) return null;
  const { slope } = regress(l.map((p) => ({ x: day(p.d), y: p.v })));
  const last = l[l.length - 1].v; const wk = slope * 7; const proj = [1, 2, 3, 4].map((i) => Math.round((last + wk * i) * 10) / 10);
  const g = h.goalKg || 0; let line = 'Your weight is about steady.';
  if (Math.abs(wk) >= 0.1) {
    line = 'About ' + (wk > 0 ? '+' : '') + (Math.round(wk * 10) / 10) + ' kg a week.';
    if (g > 0 && (g - last) * slope > 0) { const days = Math.round((g - last) / slope); if (days <= 365) line += ' At this pace you reach ' + g + ' kg around ' + dstr(dateOf(days), true) + '.'; }
  }
  return { hist: l.map((p) => p.v), proj, last, goal: g || null, line };
}

export type Mem = { ic: string; t: string; d: string };
export function memories(h: HData): Mem[] {
  const out: Mem[] = []; const keys = Object.keys(h.days || {}).filter((k) => hasAny({ ...BLANK, ...(h.days[k] as HDay) })).sort();
  if (!keys.length) return out;
  const dt = (k: string) => new Date(k + 'T12:00:00'); const day = (k: string): HDay => ({ ...BLANK, ...(h.days[k] as HDay) });
  out.push({ ic: 'week', t: 'You started on ' + dstr(dt(keys[0]), true), d: keys.length + (keys.length === 1 ? ' day' : ' days') + ' with records so far.' });
  let bs = '', bsv = 0, bz = '', bzv = 0, great = 0, lastGreat = '', st = 0, cu = 0, rel = 0, relN = 0;
  keys.forEach((k) => { const x = day(k); if (x.steps > bsv) { bsv = x.steps; bs = k; } if (x.sleep > bzv && x.sleep <= 10) { bzv = x.sleep; bz = k; } if (x.mood === 4) { great++; lastGreat = k; } st += x.steps; cu += x.cups; rel += mins(x); relN += (x.rl || []).length; });
  if (bs) out.push({ ic: 'steps', t: 'Your best walking day: ' + Math.round(bsv).toLocaleString() + ' steps', d: dstr(dt(bs), true) });
  if (bz) out.push({ ic: 'sleep', t: 'Your longest sleep: ' + (Math.round(bzv * 10) / 10) + ' h', d: dstr(dt(bz), true) });
  const bst = bestStreakAll(h); if (bst > 0) out.push({ ic: 'badge', t: 'Best streak: ' + bst + (bst === 1 ? ' day' : ' days'), d: 'Days in a row at 70% or more of your goals.' });
  if (great > 0) out.push({ ic: 'mood', t: great + (great === 1 ? ' day' : ' days') + ' you felt great', d: 'Last one: ' + dstr(dt(lastGreat), true) });
  if (relN > 0) out.push({ ic: 'relax', t: fmtMin(rel) + ' minutes of calm', d: relN + (relN === 1 ? ' relax session' : ' relax sessions') + ' so far.' });
  out.push({ ic: 'goal', t: 'Since you started', d: Math.round(st).toLocaleString() + ' steps and ' + cu + ' glasses of water logged.' });
  const now = dateOf(0);
  [1, 3, 6, 12].forEach((n) => {
    const d = new Date(now.getFullYear(), now.getMonth() - n, now.getDate(), 12); if (d.getDate() !== now.getDate()) return;
    const k = keyOfDate(d); if (!h.days[k]) return; const x = day(k); if (!hasAny(x)) return;
    const bits: string[] = []; if (x.steps > 0) bits.push(Math.round(x.steps).toLocaleString() + ' steps'); if (x.cups > 0) bits.push(x.cups + ' glasses'); if (x.sleep > 0) bits.push((Math.round(x.sleep * 10) / 10) + ' h sleep'); if (x.mood >= 0) bits.push('mood ' + MOODS[x.mood][0].toLowerCase());
    out.push({ ic: 'link', t: n === 1 ? 'This day, a month ago' : n === 12 ? 'This day, a year ago' : 'This day, ' + n + ' months ago', d: bits.join(' · ') });
  });
  keys.filter((k) => (day(k).note || '').trim()).slice(-3).reverse().forEach((k) => out.push({ ic: 'note', t: '“' + (day(k).note as string).trim().slice(0, 90) + '”', d: dstr(dt(k), true) }));
  return out;
}
