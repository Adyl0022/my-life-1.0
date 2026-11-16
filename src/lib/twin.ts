import { HData, HDay, HeartRead, BLANK, getDay, dateOf, keyOfDate, MOODS, cupsGoal, goalPctOf, latestKg } from './habit';
import { ENERGY, hasAny, energyEstimate } from './patterns';
import { BREATH } from './relax';

// Time Machine twin: only what the app really records. Nothing here makes up a reading.
export type Region = 'body' | 'brain' | 'heart' | 'lungs' | 'muscles';
export const REGIONS: { k: Region; l: string; sub: string; c: string }[] = [
  { k: 'body', l: 'Whole body', sub: 'Overview', c: '#5ee7df' },
  { k: 'brain', l: 'Brain', sub: 'Mood and mind', c: '#b794ff' },
  { k: 'heart', l: 'Heart', sub: 'Heart records', c: '#ff8fab' },
  { k: 'lungs', l: 'Lungs', sub: 'Breathing', c: '#7c9cff' },
  { k: 'muscles', l: 'Muscles', sub: 'Movement', c: '#ffc46b' },
];

const BK = BREATH.map((b) => b.k);
const sumMin = (x: HDay, breath: boolean) => Math.round((((x.rl || []).filter((r) => BK.includes(r.k) === breath).reduce((a, r) => a + r.s, 0)) / 60) * 10) / 10;
export const breathMins = (x: HDay) => sumMin(x, true);
export const calmMins = (x: HDay) => sumMin(x, false);

export const kgOn = (h: HData, off: number): number | null => {
  const k = keyOfDate(dateOf(off));
  const l = (h.kg || []).filter((p) => p.d <= k).sort((a, b) => (a.d < b.d ? -1 : 1));
  return l.length ? l[l.length - 1].v : null;
};

export const heartOn = (h: HData, off: number): HeartRead[] => { const k = keyOfDate(dateOf(off)); return (h.heart || []).filter((x) => x.d === k).sort((a, b) => (a.at < b.at ? -1 : 1)); };
export type Row = { l: string; v: number | null; t: string; unit?: string };
const r1 = (n: number) => String(Math.round(n * 10) / 10);
const row = (l: string, v: number | null, f: (n: number) => string): Row => ({ l, v, t: v == null ? 'No record' : f(v) });

// Your own rating when you gave one; otherwise the estimate from sleep, water, steps and mood, marked as an estimate.
function energyRow(h: HData, x: HDay): Row {
  if ((x.en ?? -1) >= 0) return row('Energy (your own rating)', 3 - (x.en as number), (n) => ENERGY[3 - Math.round(n)][0]);
  const e = energyEstimate(x, cupsGoal(h), h.goal || 8000);
  if (e) return row('Energy (estimate)', 3 - e.lvl, (n) => ENERGY[3 - Math.round(n)][0] + ' · estimate');
  return row('Energy', null, () => '');
}

// Rows for one region on one day (off 0 = today, -1 = yesterday...). A row without a record says so.
export function rowsFor(h: HData, off: number, k: Region): Row[] {
  const x: HDay = getDay(h, off); const pos = (n: number) => (n > 0 ? n : null);
  if (k === 'brain') return [
    row('Mood', x.mood >= 0 ? x.mood : null, (n) => MOODS[Math.round(n)][0]),
    energyRow(h, x),
    row('Sleep', pos(x.sleep), (n) => r1(n) + ' h'),
    row('Calm minutes', pos(calmMins(x)), (n) => r1(n) + ' min'),
    row('Feeling unwell', (x.sy || []).length || null, () => (x.sy || []).join(', ')),
  ];
  if (k === 'lungs') return [
    row('Breathing exercise', pos(breathMins(x)), (n) => r1(n) + ' min'),
    row('Relax sessions', (x.rl || []).length || null, (n) => String(n)),
  ];
  if (k === 'muscles') return [
    row('Steps', pos(x.steps), (n) => Math.round(n).toLocaleString()),
    row('Distance', pos(x.steps), (n) => r1(n * 0.00075) + ' km'),
    row('Steps goal', x.steps > 0 ? Math.min(100, Math.round((x.steps / (h.goal || 8000)) * 100)) : null, (n) => n + '%'),
  ];
  if (k === 'heart') {
    const l = heartOn(h, off); const p = [...l].reverse().find((x) => x.bpm != null); const b = [...l].reverse().find((x) => x.sys != null && x.dia != null);
    return [
      row('Pulse (latest)', p ? p.bpm! : null, (n) => Math.round(n) + ' bpm'),
      row('Blood pressure (latest)', b ? b.sys! : null, () => b!.sys + '/' + b!.dia + ' mmHg'),
      row('Readings', l.length || null, (n) => String(n)),
    ];
  }
  const kg = kgOn(h, off); const bmi = kg && h.cm ? kg / Math.pow(h.cm / 100, 2) : null;
  return [
    row('Steps', pos(x.steps), (n) => Math.round(n).toLocaleString()),
    row('Water', pos(x.cups), (n) => n + ' glasses'),
    row('Sleep', pos(x.sleep), (n) => r1(n) + ' h'),
    row('Mood', x.mood >= 0 ? x.mood : null, (n) => MOODS[Math.round(n)][0]),
    row('Weight', kg, (n) => r1(n) + ' kg'),
    row('BMI', bmi, (n) => r1(n)),
    row('Feeling unwell', (x.sy || []).length || null, () => (x.sy || []).join(', ')),
  ];
}
// 0..1 for how much the person recorded or reached that day. Used only for how bright the hologram glows.
export function glowOf(h: HData, off: number): number {
  const x = getDay(h, off); if (!hasAny({ ...BLANK, ...x })) return 0;
  return Math.max(0.15, Math.min(1, goalPctOf(x, h.goal || 8000, cupsGoal(h)) / 100));
}
export const hasRecords = (h: HData, off: number) => heartOn(h, off).length > 0 || (getDay(h, off).sy || []).length > 0 || hasAny({ ...BLANK, ...getDay(h, off) }) || breathMins(getDay(h, off)) > 0 || calmMins(getDay(h, off)) > 0;

// ---- Future: a straight line through the last 4 weekly averages of the person's own records ----
export type Metric = { k: string; l: string; unit: string; max: number; per: number; f: (x: HDay) => number | null; fmt: (n: number) => string };
const M = (k: string, l: string, unit: string, max: number, per: number, f: (x: HDay) => number | null, fmt: (n: number) => string): Metric => ({ k, l, unit, max, per, f, fmt });
export const FMETRICS: Record<Region, Metric[]> = {
  body: [
    M('steps', 'Steps a day', '', 60000, 50, (x) => (x.steps > 0 ? x.steps : null), (n) => Math.round(n).toLocaleString()),
    M('water', 'Water a day', 'glasses', 16, 0.05, (x) => (x.cups > 0 ? x.cups : null), (n) => r1(n) + ' glasses'),
    M('sleep', 'Sleep a night', 'h', 12, 0.02, (x) => (x.sleep > 0 ? x.sleep : null), (n) => r1(n) + ' h'),
  ],
  brain: [
    M('mood', 'Mood (0 awful, 4 great)', '', 4, 0.03, (x) => (x.mood >= 0 ? x.mood : null), (n) => MOODS[Math.max(0, Math.min(4, Math.round(n)))][0]),
    M('sleep', 'Sleep a night', 'h', 12, 0.02, (x) => (x.sleep > 0 ? x.sleep : null), (n) => r1(n) + ' h'),
  ],
  lungs: [M('br', 'Breathing a day', 'min', 120, 0.2, (x) => (breathMins(x) > 0 ? breathMins(x) : null), (n) => r1(n) + ' min')],
  muscles: [
    M('steps', 'Steps a day', '', 60000, 50, (x) => (x.steps > 0 ? x.steps : null), (n) => Math.round(n).toLocaleString()),
    M('km', 'Distance a day', 'km', 45, 0.04, (x) => (x.steps > 0 ? x.steps * 0.00075 : null), (n) => r1(n) + ' km'),
  ],
  heart: [],
};
export type Guess = { m: Metric; now: number; at: number; line: 'Rising' | 'Falling' | 'Steady' };
// Needs at least 3 of the last 4 weeks with records. Returns null when there is not enough to say anything honest.
export function guess(h: HData, m: Metric, days: number): Guess | null {
  const pts: { x: number; y: number }[] = [];
  for (let w = 0; w < 4; w++) {
    const v: number[] = [];
    for (let o = -7 * (3 - w) - 6; o <= -7 * (3 - w); o++) { const n = m.f(getDay(h, o)); if (n != null) v.push(n); }
    if (v.length >= 2) pts.push({ x: w, y: v.reduce((a, b) => a + b, 0) / v.length });
  }
  if (pts.length < 3) return null;
  const n = pts.length, mx = pts.reduce((a, p) => a + p.x, 0) / n, my = pts.reduce((a, p) => a + p.y, 0) / n;
  let nu = 0, de = 0; pts.forEach((p) => { nu += (p.x - mx) * (p.y - my); de += (p.x - mx) * (p.x - mx); });
  const slope = de === 0 ? 0 : nu / de; // change per week
  const now = pts[pts.length - 1].y;
  const at = Math.max(0, Math.min(m.max, now + slope * (days / 7)));
  return { m, now, at, line: slope > m.per ? 'Rising' : slope < -m.per ? 'Falling' : 'Steady' };
}
// Weight: needs 2 weigh-ins at least a week apart.
export function weightGuess(h: HData, days: number): { now: number; at: number; line: 'Rising' | 'Falling' | 'Steady' } | null {
  const l = (h.kg || []).slice().sort((a, b) => (a.d < b.d ? -1 : 1)).slice(-8); if (l.length < 2 || !latestKg(h)) return null;
  const t0 = new Date(l[0].d + 'T12:00:00').getTime(); const dy = (d: string) => (new Date(d + 'T12:00:00').getTime() - t0) / 86400000;
  const span = dy(l[l.length - 1].d); if (span < 7) return null;
  const n = l.length, mx = l.reduce((a, p) => a + dy(p.d), 0) / n, my = l.reduce((a, p) => a + p.v, 0) / n;
  let nu = 0, de = 0; l.forEach((p) => { nu += (dy(p.d) - mx) * (p.v - my); de += (dy(p.d) - mx) * (dy(p.d) - mx); });
  const perDay = de === 0 ? 0 : nu / de; const now = l[l.length - 1].v; const at = Math.max(now * 0.85, Math.min(now * 1.15, now + perDay * days));
  return { now, at, line: perDay * 7 > 0.1 ? 'Rising' : perDay * 7 < -0.1 ? 'Falling' : 'Steady' };
}
