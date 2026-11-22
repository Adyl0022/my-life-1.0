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

const median = (a: number[]) => { const b = a.slice().sort((x, y) => x - y); const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
// Theil-Sen: the middle value of the slopes between every pair of points. One odd day (a long hike, a missed day) cannot pull the line. `agree` is how many of the slopes point the same way (0.5 = no direction at all).
const theilSen = (pts: { x: number; y: number }[]) => {
  const sl: number[] = [];
  for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) { const dx = pts[b].x - pts[a].x; if (dx > 0) sl.push((pts[b].y - pts[a].y) / dx); }
  if (!sl.length) return null;
  const up = sl.filter((v) => v > 0).length, dn = sl.filter((v) => v < 0).length;
  return { slope: median(sl), agree: up + dn === 0 ? 1 : Math.max(up, dn) / (up + dn) };
};
const mean = (a: number[]) => a.reduce((t, v) => t + v, 0) / (a.length || 1);
export type Fut = { hist: (number | null)[]; proj: number[]; now: number; in4: number; slope: number; line: string; eta: string };
// A careful guess from the last 28 days of your own records, worked out like this:
// - Today is left out for steps and water, because the day is not finished and would pull the numbers down.
// - It needs at least 14 days with records, and 3 of the 4 weeks with 3 days or more.
// - The direction comes from the middle of all day to day slopes (Theil-Sen), so one strange day cannot swing it.
// - Where you are now is the average of your latest 7 days. The trend then fades a little each week (damped), because habits level off and do not carry on in a straight line for ever.
// - The guess is kept within a believable range of where you are now.
export function future(h: HData, k: 'steps' | 'water' | 'sleep'): Fut | null {
  const last = k === 'sleep' ? 0 : -1; const pts: { x: number; y: number }[] = [];
  for (let off = last - 27; off <= last; off++) { const v = valOf(getDay(h, off), k); if (v != null && !(k === 'sleep' && v > 14)) pts.push({ x: off - last, y: v }); }
  const hist: (number | null)[] = []; let goodWeeks = 0;
  for (let j = 3; j >= 0; j--) {
    const vals = pts.filter((p) => p.x >= -6 - 7 * j && p.x <= -7 * j).map((p) => p.y);
    hist.push(vals.length >= 2 ? mean(vals) : null); if (vals.length >= 3) goodWeeks++;
  }
  if (pts.length < 14 || goodWeeks < 3) return null;
  const ts = theilSen(pts); if (!ts) return null;
  const wkVals = pts.filter((p) => p.x >= -6).map((p) => p.y); const twoWk = pts.filter((p) => p.x >= -13).map((p) => p.y); const level = mean(wkVals.length >= 3 ? wkVals : twoWk.length >= 3 ? twoWk : pts.map((p) => p.y));
  const goal = k === 'steps' ? (h.goal || 8000) : k === 'water' ? cupsGoal(h) : 7;
  const per = k === 'steps' ? Math.max(80, level * 0.025) : k === 'water' ? Math.max(0.1, level * 0.025) : 0.1; // a change smaller than this a week counts as steady
  const clear = ts.agree >= 0.6; const wk = clear ? ts.slope * 7 : 0;
  const lo = k === 'sleep' ? Math.max(3, level - 1.5) : Math.max(0, level * 0.5), hi = k === 'sleep' ? Math.min(12, level + 1.5) : k === 'water' ? Math.min(16, level * 1.5) : Math.min(40000, level * 1.5);
  const step = k === 'steps' ? 50 : 0.1; const phi = 0.85; let cum = 0;
  const proj = [1, 2, 3, 4].map((i) => { cum += wk * Math.pow(phi, i - 1); const v = Math.max(lo, Math.min(hi, level + cum)); return Math.round(v / step) * step; });
  let eta: string;
  if (level >= goal) eta = 'You are already at your goal. Keep it up.';
  else if (wk > per) { const wi = proj.findIndex((v) => v >= goal); eta = wi >= 0 ? 'At this pace you reach your goal in about ' + (wi + 1) + (wi === 0 ? ' week.' : ' weeks.') : 'Your goal is still a way off at this pace.'; }
  else if (!clear) eta = 'Your days go up and down, so there is no clear direction yet. A steady routine will show a clearer line.';
  else eta = Math.abs(wk) <= per ? 'Steady for now. A small push would get you closer to your goal.' : 'Heading away from your goal at this pace. A small change this week can turn it around.';
  return { hist, proj, now: level, in4: proj[3], slope: wk, line: wk > per ? 'Rising' : wk < -per ? 'Falling' : 'Steady', eta };
}
export type WFut = { hist: number[]; proj: number[]; last: number; goal: number | null; line: string };
// Weight: needs at least 3 weigh-ins over 7 days or more (the last 90 days). The direction is the middle slope between all pairs (so one odd weigh-in cannot swing it), where you are now is the middle of your last 3, and a change of more than 1 kg a week is not counted because it cannot go on.
export function weightFuture(h: HData): WFut | null {
  const cut = keyOfDate(dateOf(-90));
  const l = (h.kg || []).filter((p) => p.d >= cut && p.v > 0).sort((a, b) => (a.d < b.d ? -1 : 1)).slice(-12);
  if (l.length < 3) return null;
  const t0 = new Date(l[0].d + 'T12:00:00').getTime(); const day = (d: string) => (new Date(d + 'T12:00:00').getTime() - t0) / 86400000;
  const span = day(l[l.length - 1].d); if (span < 7) return null;
  const ts = theilSen(l.map((p) => ({ x: day(p.d), y: p.v }))); if (!ts) return null;
  const level = median(l.slice(-3).map((p) => p.v)); const clear = ts.agree >= 0.6;
  const wk = clear ? Math.max(-1, Math.min(1, ts.slope * 7)) : 0; const slope = wk / 7;
  const phi = 0.9; let cum = 0; const proj = [1, 2, 3, 4].map((i) => { cum += wk * Math.pow(phi, i - 1); return Math.round((level + cum) * 10) / 10; });
  const g = h.goalKg || 0; let line = clear ? 'Your weight is about steady.' : 'Your weight goes up and down, so there is no clear direction yet.';
  if (Math.abs(wk) >= 0.1) {
    line = 'About ' + (wk > 0 ? '+' : '') + (Math.round(wk * 10) / 10) + ' kg a week.';
    if (g > 0 && (g - level) * slope > 0) { const days = Math.round((g - level) / slope); if (days <= 365) line += ' At this pace you reach ' + g + ' kg around ' + dstr(dateOf(days), true) + '.'; }
  }
  return { hist: l.map((p) => p.v), proj, last: level, goal: g || null, line };
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
