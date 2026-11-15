import { HData, HDay, getDay, dateOf, keyOfDate } from './habit';
import { PuasaData, hijriOf, ramadanOf, diffDays, keyD, parseK, addDays } from './fasting';
import { Pat, ENERGY, fmtD } from './patterns';
import { MOODS } from './habit';

// Period days are marked on each day (HDay.pd). Everything else is worked out from those marks, on the phone.
export const SYMS = ['Cramps', 'Headache', 'Tired', 'Mood swings', 'Acne', 'Bloating'];
export const FLOW = ['Light', 'Medium', 'Heavy'];

export type Period = { start: number; len: number }; // start is an offset from today (0 = today, -10 = ten days ago)
export function periods(h: HData, back = 400): Period[] {
  const out: Period[] = []; let cur: Period | null = null;
  for (let o = -back; o <= 0; o++) {
    const on = !!getDay(h, o).pd;
    if (on) { if (cur) cur.len++; else { cur = { start: o, len: 1 }; out.push(cur); } } else cur = null;
  }
  return out;
}
export type CycleInfo = { periods: Period[]; avgCycle: number; avgPeriod: number; learned: boolean; nextOff: number | null; daysTo: number | null; cycleDay: number | null; onPeriod: boolean };
export function cycleInfo(h: HData): CycleInfo {
  const ps = periods(h);
  const gaps: number[] = []; for (let i = 1; i < ps.length; i++) { const g = ps[i].start - ps[i - 1].start; if (g >= 18 && g <= 45) gaps.push(g); }
  const recent = gaps.slice(-6);
  const avgCycle = recent.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length) : 28;
  const lens = ps.slice(-6).map((p) => p.len).filter((l) => l >= 1 && l <= 14);
  const avgPeriod = lens.length ? Math.round(lens.reduce((a, b) => a + b, 0) / lens.length) : 5;
  const last = ps.length ? ps[ps.length - 1] : null;
  const nextOff = last ? last.start + avgCycle : null;
  const onPeriod = !!getDay(h, 0).pd;
  const cycleDay = last && -last.start + 1 <= 60 ? -last.start + 1 : null;
  return { periods: ps, avgCycle, avgPeriod, learned: recent.length > 0, nextOff, daysTo: nextOff == null ? null : nextOff, cycleDay, onPeriod };
}
export function statusText(c: CycleInfo): string {
  if (c.onPeriod) return 'Period day ' + (c.cycleDay || 1) + ' · average ' + c.avgPeriod + ' days';
  if (c.nextOff == null) return 'Mark the first day of your period to begin';
  const d = c.nextOff;
  if (d > 1) return 'Next period in about ' + d + ' days (estimate)';
  if (d === 1) return 'Next period expected tomorrow (estimate)';
  if (d === 0) return 'Period expected today (estimate)';
  return 'Period is about ' + -d + (d === -1 ? ' day' : ' days') + ' late (estimate)';
}

// Where a day sits: on the period, in the 7 days before the next recorded period, or neither.
export function dayKind(h: HData, off: number): 'period' | 'before' | 'other' {
  if (getDay(h, off).pd) return 'period';
  for (let o = off + 1; o <= Math.min(0, off + 7); o++) { if (getDay(h, o).pd && !getDay(h, o - 1).pd) return 'before'; }
  return 'other';
}
// Compares your own mood and energy ratings on period days and the week before, over the last 90 days.
export function cyclePatterns(h: HData): Pat[] {
  const out: Pat[] = [];
  if (periods(h, 90).length < 1) return out;
  const groups: Record<string, { m: number[]; e: number[] }> = { period: { m: [], e: [] }, before: { m: [], e: [] }, other: { m: [], e: [] } };
  let first = 0;
  for (let o = -89; o <= 0; o++) {
    const x = getDay(h, o); const g = groups[dayKind(h, o)];
    if (x.mood >= 0) g.m.push(x.mood); if ((x.en ?? -1) >= 0) g.e.push(3 - (x.en as number));
    if ((x.mood >= 0 || (x.en ?? -1) >= 0) && first === 0) first = o;
  }
  const av = (a: number[]) => a.reduce((p, q) => p + q, 0) / a.length;
  const tot = (k: 'm' | 'e') => groups.period[k].length + groups.before[k].length + groups.other[k].length;
  const add = (kind: 'period' | 'before', k: 'm' | 'e') => {
    const g = groups[kind][k], o = groups.other[k];
    if (tot(k) < 10 || g.length < 3 || o.length < 3) return;
    const diff = av(g) - av(o); if (Math.abs(diff) < 0.5) return;
    const name = (v: number) => (k === 'm' ? MOODS[Math.max(0, Math.min(4, Math.round(v)))][0] : ENERGY[Math.max(0, Math.min(3, 3 - Math.round(v)))][0]);
    const lab = k === 'm' ? 'mood' : 'energy'; const when = kind === 'period' ? 'during your period' : 'in the week before your period';
    out.push({ id: 'cy-' + kind + '-' + k, title: 'Your ' + lab + ' tends to be ' + (diff > 0 ? 'higher ' : 'lower ') + when, detail: g.length + ' days ' + when + ': ' + name(av(g)) + '. ' + o.length + ' other days: ' + name(av(o)) + '.', range: 'Last 90 days · ' + tot(k) + ' rated days', n: tot(k) });
  };
  add('period', 'm'); add('period', 'e'); add('before', 'm'); add('before', 'e');
  return out;
}

// Period days that fall inside Ramadan count as excused, which adds them to the qadha still owed. Only marks made here are removed here.
export function reconcileHaid(p: PuasaData, h: HData): { p: PuasaData; px: string[]; added: number } {
  const days = { ...p.days }; const px = new Set(h.px || []); const want = new Set<string>();
  for (let o = -400; o <= 0; o++) {
    if (!getDay(h, o).pd) continue;
    const d = dateOf(o); const hy = hijriOf(d, p.off || 0).y; const r = ramadanOf(hy, p);
    if (diffDays(d, r.start) >= 0 && diffDays(d, r.end) <= 0) want.add(keyOfDate(d));
  }
  let added = 0;
  want.forEach((k) => { if (days[k] === undefined || days[k] === 'x') { if (days[k] === undefined) added++; days[k] = 'x'; px.add(k); } });
  Array.from(px).forEach((k) => { if (!want.has(k)) { if (days[k] === 'x') delete days[k]; px.delete(k); } });
  return { p: { ...p, days }, px: Array.from(px).sort(), added };
}
export const nextDate = (c: CycleInfo) => (c.nextOff == null ? null : dateOf(c.nextOff));
export { fmtD };
