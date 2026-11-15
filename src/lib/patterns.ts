import { HData, HDay, getDay, dateOf, keyOfDate, MOODS, MON } from './habit';

// My Life Intelligence: simple rules that run on the phone, on the person's own records. No AI service.
export const ENERGY: [string, string][] = [['Very energetic', '#7df0c6'], ['Normal', '#8fe9e2'], ['Tired', '#ffc46b'], ['Exhausted', '#ff8fab']];
const hrs = (n: number) => (Math.round(n * 10) / 10) + ' h';

// An estimate from what is already logged. It is a guess, not the person's own rating.
export function energyEstimate(x: HDay, cg: number, goal: number): { lvl: number; why: string } | null {
  const why: string[] = []; let s = 0, n = 0;
  if (x.sleep > 0) { n++; s += x.sleep >= 7.5 ? 2 : x.sleep >= 6.5 ? 1 : x.sleep >= 5.5 ? 0 : x.sleep >= 4.5 ? -1 : -2; why.push(hrs(x.sleep) + ' sleep'); }
  if (x.cups > 0) { n++; if (x.cups / cg >= 0.8) s += 1; why.push(x.cups + ' of ' + cg + ' glasses'); }
  if (x.steps > 0) { n++; if (x.steps / goal >= 0.7) s += 1; why.push(Math.round(x.steps).toLocaleString() + ' steps'); }
  if (x.mood >= 0) { n++; s += x.mood >= 3 ? 1 : x.mood <= 1 ? -1 : 0; why.push('mood ' + MOODS[x.mood][0].toLowerCase()); }
  if (n < 2) return null;
  return { lvl: s >= 3 ? 0 : s >= 0 ? 1 : s >= -2 ? 2 : 3, why: 'From ' + why.join(', ') };
}
export const hasAny = (x: HDay) => x.steps > 0 || x.cups > 0 || x.sleep > 0 || x.mood >= 0 || (x.en ?? -1) >= 0;
export const dayLevel = (x: HDay) => (x.steps > 0 ? 1 : 0) + (x.cups > 0 ? 1 : 0) + (x.sleep > 0 ? 1 : 0) + (x.mood >= 0 ? 1 : 0);
export const fmtD = (d: Date) => d.getDate() + ' ' + MON[d.getMonth()];

type X = { id: 'sleep' | 'steps' | 'water'; get: (x: HDay) => number | null; round: (v: number) => number; hi: (t: number) => string; lo: string };
const XS: X[] = [
  { id: 'sleep', get: (x) => (x.sleep > 0 ? x.sleep : null), round: (v) => Math.round(v * 2) / 2, hi: (t) => t + ' h or more of sleep', lo: 'less sleep' },
  { id: 'steps', get: (x) => (x.steps > 0 ? x.steps : null), round: (v) => Math.max(500, Math.round(v / 500) * 500), hi: (t) => t.toLocaleString() + '+ steps', lo: 'fewer steps' },
  { id: 'water', get: (x) => (x.cups > 0 ? x.cups : null), round: (v) => Math.max(1, Math.round(v)), hi: (t) => t + '+ glasses', lo: 'fewer glasses' },
];
type Y = { id: 'mood' | 'energy'; label: string; get: (x: HDay) => number | null; name: (v: number) => string };
const YS: Y[] = [
  { id: 'mood', label: 'mood', get: (x) => (x.mood >= 0 ? x.mood : null), name: (v) => MOODS[Math.max(0, Math.min(4, Math.round(v)))][0] },
  // Only the person's own energy rating is used, never the estimate (the estimate is worked out from the same records).
  { id: 'energy', label: 'energy', get: (x) => ((x.en ?? -1) >= 0 ? 3 - (x.en as number) : null), name: (v) => ENERGY[Math.max(0, Math.min(3, 3 - Math.round(v)))][0] },
];
export type Pat = { id: string; title: string; detail: string; range: string; n: number };
const med = (a: number[]) => { const s = a.slice().sort((p, q) => p - q); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
export const MIN_DAYS = 10;

// Looks at the last 30 days. A pattern needs at least 10 days where both records exist, and 3 days on each side.
export function findPatterns(h: HData): { list: Pat[]; best: number } {
  const list: Pat[] = []; let best = 0;
  for (const x of XS) for (const y of YS) {
    const rows: { xv: number; yv: number; o: number }[] = [];
    for (let o = -29; o <= 0; o++) { const d = getDay(h, o); const xv = x.get(d), yv = y.get(d); if (xv != null && yv != null) rows.push({ xv, yv, o }); }
    best = Math.max(best, rows.length);
    if (rows.length < MIN_DAYS) continue;
    const thr = x.round(med(rows.map((r) => r.xv)));
    const hi = rows.filter((r) => r.xv >= thr), lo = rows.filter((r) => r.xv < thr);
    if (hi.length < 3 || lo.length < 3) continue;
    const av = (a: typeof rows) => a.reduce((t, r) => t + r.yv, 0) / a.length;
    const ah = av(hi), al = av(lo), diff = ah - al;
    if (Math.abs(diff) < 0.5) continue;
    const better = diff > 0;
    const first = dateOf(Math.min(...rows.map((r) => r.o))), last = dateOf(Math.max(...rows.map((r) => r.o)));
    list.push({
      id: x.id + '-' + y.id,
      title: 'Your ' + y.label + ' was higher on days with ' + (better ? x.hi(thr) : x.lo),
      detail: hi.length + ' days with ' + x.hi(thr) + ': ' + y.name(ah) + '. ' + lo.length + ' days with ' + x.lo + ': ' + y.name(al) + '.',
      range: fmtD(first) + ' to ' + fmtD(last) + ' · ' + rows.length + ' days', n: rows.length,
    });
  }
  return { list: list.sort((a, b) => b.n - a.n), best };
}

// Plain facts from the last 7 days, only when there is something to say.
export function weekFacts(h: HData): string[] {
  const out: string[] = []; let w = 0, sl = 0, sn = 0, st = 0, any = 0;
  for (let o = -6; o <= 0; o++) { const d = getDay(h, o); if (d.cups > 0) w++; if (d.sleep > 0) { sl += d.sleep; sn++; } if (d.steps > 0) st++; if (hasAny(d)) any++; }
  if (any === 0) return out;
  out.push('Water was logged on ' + w + ' of the last 7 days.');
  if (sn > 0) out.push('Average sleep was ' + hrs(sl / sn) + ' across ' + sn + (sn === 1 ? ' night.' : ' nights.'));
  out.push('Steps were recorded on ' + st + ' of the last 7 days.');
  return out;
}

export type Win = { steps: number | null; water: number | null; sleep: number | null; mood: number | null; days: number };
// Averages over 7 days that end `end` days from today (0 = today, -30 = 30 days ago).
export function windowAvg(h: HData, end: number): Win {
  const acc = { steps: [] as number[], water: [] as number[], sleep: [] as number[], mood: [] as number[] }; let days = 0;
  for (let o = end - 6; o <= end; o++) { const d = getDay(h, o); if (hasAny(d)) days++; if (d.steps > 0) acc.steps.push(d.steps); if (d.cups > 0) acc.water.push(d.cups); if (d.sleep > 0) acc.sleep.push(d.sleep); if (d.mood >= 0) acc.mood.push(d.mood); }
  const m = (a: number[]) => (a.length ? a.reduce((p, q) => p + q, 0) / a.length : null);
  return { steps: m(acc.steps), water: m(acc.water), sleep: m(acc.sleep), mood: m(acc.mood), days };
}
export { keyOfDate };
