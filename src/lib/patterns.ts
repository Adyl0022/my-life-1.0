import { HData, HDay, Exp, getDay, dateOf, keyOfDate, MOODS, MON, goalPctOf, cupsGoal, medDue } from './habit';

// My Life Intelligence: simple rules that run on the phone, on the person's own records. No AI service.
export const ENERGY: [string, string][] = [['Very energetic', '#7df0c6'], ['Normal', '#8fe9e2'], ['Tired', '#ffc46b'], ['Exhausted', '#ff8fab']];
const hrs = (n: number) => (Math.round(n * 10) / 10) + ' h';

// An estimate from what is already logged. It is a guess, not the person's own rating.
/** The lowest pulse read while you slept on a day. It follows the sleep times you set (so a day sleep after a night shift counts too). With no times set it uses midnight to 7 am. */
export function nightLow(h: HData, key: string): number | null {
  const mins = (t?: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : -1; };
  const dd = (h.days || {})[key]; const b = mins(dd && dd.bed), w = mins(dd && dd.wake);
  const prev = new Date(key + 'T12:00:00'); prev.setDate(prev.getDate() - 1); const pk = keyOfDate(prev);
  let s = 0, e = 420; if (b >= 0 && w >= 0 && b !== w) { if (b > w) { s = b - 1440; e = w; } else { s = b; e = w; } }
  const v = (h.heart || []).filter((x) => x.bpm != null && (x.d === key || x.d === pk)).filter((x) => { const m = mins(x.at); if (m < 0) return false; const t = (x.d === key ? 0 : -1440) + m; return t >= s && t <= e; }).map((x) => x.bpm as number);
  return v.length ? Math.min(...v) : null;
}
/** Today's night pulse against your own usual (the middle value of the last 14 nights). Needs at least 4 earlier nights. */
export function restSignal(h: HData, key: string): { low: number; base: number } | null {
  const low = nightLow(h, key); if (low == null) return null;
  const t = new Date(key + 'T12:00:00'); const prev: number[] = [];
  for (let i = 1; i <= 14; i++) { const d = new Date(t); d.setDate(d.getDate() - i); const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); const v = nightLow(h, k); if (v != null) prev.push(v); }
  if (prev.length < 4) return null;
  prev.sort((a, b) => a - b); return { low, base: prev[Math.floor(prev.length / 2)] };
}

export function energyEstimate(x: HDay, cg: number, goal: number, rs?: { low: number; base: number } | null): { lvl: number; why: string } | null {
  const why: string[] = []; let s = 0, n = 0;
  if (x.sleep > 0) { n++; s += x.sleep >= 7.5 ? 2 : x.sleep >= 6.5 ? 1 : x.sleep >= 5.5 ? 0 : x.sleep >= 4.5 ? -1 : -2; why.push(hrs(x.sleep) + ' sleep'); }
  if (x.cups > 0) { n++; if (x.cups / cg >= 0.8) s += 1; why.push(x.cups + ' of ' + cg + ' glasses'); }
  if (x.steps > 0) { n++; if (x.steps / goal >= 0.7) s += 1; why.push(Math.round(x.steps).toLocaleString() + ' steps'); }
  if (x.mood >= 0) { n++; s += x.mood >= 3 ? 1 : x.mood <= 1 ? -1 : 0; why.push('mood ' + MOODS[x.mood][0].toLowerCase()); }
  // A night pulse clearly above your usual can mean a tired body. It only ever lowers the guess, and only a little.
  if (rs && rs.low - rs.base >= 6) { n++; s -= 1; why.push('night pulse ' + rs.low + ' bpm, higher than your usual ' + rs.base); }
  if (n < 2) return null;
  let lvl = s >= 3 ? 0 : s >= 0 ? 1 : s >= -2 ? 2 : 3;
  // Feeling tired or having a fever (noted in the Dashboard Quick log) lowers the guess by one step.
  const sick = (x.sy || []).filter((y) => /^(tired|fever)$/i.test(y)); let note = '';
  if (sick.length) { lvl = Math.min(3, lvl + 1); note = ' · ' + sick.join(' and ').toLowerCase() + ' noted'; }
  return { lvl, why: 'From ' + why.join(', ') + note };
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
// Averages over the days from `from` to `to` (0 = today, -30 = 30 days ago).
export function avgRange(h: HData, from: number, to: number): Win {
  const acc = { steps: [] as number[], water: [] as number[], sleep: [] as number[], mood: [] as number[] }; let days = 0;
  for (let o = from; o <= to; o++) { const d = getDay(h, o); if (hasAny(d)) days++; if (d.steps > 0) acc.steps.push(d.steps); if (d.cups > 0) acc.water.push(d.cups); if (d.sleep > 0) acc.sleep.push(d.sleep); if (d.mood >= 0) acc.mood.push(d.mood); }
  const m = (a: number[]) => (a.length ? a.reduce((p, q) => p + q, 0) / a.length : null);
  return { steps: m(acc.steps), water: m(acc.water), sleep: m(acc.sleep), mood: m(acc.mood), days };
}
// Averages over 7 days that end `end` days from today.
export const windowAvg = (h: HData, end: number): Win => avgRange(h, end - 6, end);

// Experiments: small tests of the person's own habits. Only things the app already records can be counted.
export type Ctx = { goal: number; cg: number; date: Date; meds: { id: string; days?: number[] }[]; t: number };
/** `own` kinds let the person choose the number: from `min` to `max` in steps of `step`, starting at `def`, and `mk` writes the title. */
export type Tpl = { id: string; cat: string; title: string; days: number; note: string; ok: (x: HDay, c: Ctx) => boolean | null; own?: { min: number; max: number; step: number; def: number; unit: string; mk: (n: number) => string } };
const hm = (s?: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ''); return m ? +m[1] * 60 + +m[2] : null; };
// Bedtime counts as on time when it is between 6 pm and the limit. A time after midnight is late.
const bedBy = (limit: number) => (x: HDay) => { const v = hm(x.bed); if (v == null) return null; if (v < 6 * 60) return false; return v >= 18 * 60 && v <= limit; };
const wakeBy = (limit: number) => (x: HDay) => { const v = hm(x.wake); if (v == null) return null; return v <= limit; };
export const CATS = ['Sleep', 'Move', 'Water', 'Mind', 'Habits', 'Your own number'];
export const TPLS: Tpl[] = [
  { id: 'bed', cat: 'Sleep', title: 'Sleep before 11 pm', days: 7, note: 'Counted from the bedtime you log in Today', ok: bedBy(23 * 60) },
  { id: 'bed12', cat: 'Sleep', title: 'Sleep before midnight', days: 7, note: 'Counted from your bedtime', ok: bedBy(24 * 60) },
  { id: 'bed1030', cat: 'Sleep', title: 'Sleep before 10:30 pm', days: 7, note: 'Counted from your bedtime', ok: bedBy(22 * 60 + 30) },
  { id: 'wake7', cat: 'Sleep', title: 'Wake up by 7 am', days: 7, note: 'Counted from the wake time you log', ok: wakeBy(7 * 60) },
  { id: 'sleep7', cat: 'Sleep', title: 'Sleep 7 hours or more', days: 7, note: 'Counted from your sleep record', ok: (x) => (x.sleep > 0 ? x.sleep >= 7 : null) },
  { id: 'sleep8', cat: 'Sleep', title: 'Sleep 8 hours or more', days: 7, note: 'Counted from your sleep record', ok: (x) => (x.sleep > 0 ? x.sleep >= 8 : null) },
  { id: 'steps4', cat: 'Move', title: 'Walk 4,000 steps a day', days: 7, note: 'A gentle start, counted from your steps', ok: (x) => (x.steps > 0 ? x.steps >= 4000 : null) },
  { id: 'steps', cat: 'Move', title: 'Walk 6,000 steps a day', days: 7, note: 'Counted from your steps', ok: (x) => (x.steps > 0 ? x.steps >= 6000 : null) },
  { id: 'steps8', cat: 'Move', title: 'Walk 8,000 steps a day', days: 7, note: 'Counted from your steps', ok: (x) => (x.steps > 0 ? x.steps >= 8000 : null) },
  { id: 'steps10', cat: 'Move', title: 'Walk 10,000 steps a day', days: 14, note: 'A bigger challenge, counted from your steps', ok: (x) => (x.steps > 0 ? x.steps >= 10000 : null) },
  { id: 'goalsteps', cat: 'Move', title: 'Reach your steps goal', days: 7, note: 'Counted against the goal you set', ok: (x, c) => (x.steps > 0 ? x.steps >= c.goal : null) },
  { id: 'water6', cat: 'Water', title: 'Drink 6 glasses a day', days: 7, note: 'Counted from your water', ok: (x) => (x.cups > 0 ? x.cups >= 6 : null) },
  { id: 'water', cat: 'Water', title: 'Drink 7 glasses a day', days: 14, note: 'Counted from your water', ok: (x) => (x.cups > 0 ? x.cups >= 7 : null) },
  { id: 'water8', cat: 'Water', title: 'Drink 8 glasses a day', days: 7, note: 'Counted from your water', ok: (x) => (x.cups > 0 ? x.cups >= 8 : null) },
  { id: 'goalwater', cat: 'Water', title: 'Reach your water goal', days: 7, note: 'Counted against your own water goal', ok: (x, c) => (x.cups > 0 ? x.cups >= c.cg : null) },
  { id: 'relax5', cat: 'Mind', title: 'Relax 5 minutes a day', days: 7, note: 'Counted from Relax (breathe or meditate)', ok: (x) => { const m = (x.rl || []).reduce((a, r) => a + r.s, 0) / 60; return m >= 5 ? true : (x.rl || []).length || x.mood >= 0 || x.cups > 0 || x.steps > 0 || x.sleep > 0 ? false : null; } },
  { id: 'relax10', cat: 'Mind', title: 'Relax 10 minutes a day', days: 14, note: 'Counted from Relax (breathe or meditate)', ok: (x) => { const m = (x.rl || []).reduce((a, r) => a + r.s, 0) / 60; return m >= 10 ? true : (x.rl || []).length || x.mood >= 0 || x.cups > 0 || x.steps > 0 || x.sleep > 0 ? false : null; } },
  { id: 'moodlog', cat: 'Mind', title: 'Log your mood every day', days: 7, note: 'Counted when you pick a mood', ok: (x) => x.mood >= 0 || x.cups > 0 || x.steps > 0 || x.sleep > 0 ? x.mood >= 0 : null },
  { id: 'energylog', cat: 'Mind', title: 'Rate your energy every day', days: 14, note: 'Counted when you tap how you feel', ok: (x) => x.mood >= 0 || x.cups > 0 || x.steps > 0 || x.sleep > 0 ? (x.en ?? -1) >= 0 : null },
  { id: 'happy', cat: 'Mind', title: 'Mood Good or Great', days: 7, note: 'Counted from the mood you log', ok: (x) => (x.mood >= 0 ? x.mood >= 3 : null) },
  { id: 'goals80', cat: 'Habits', title: 'Reach 80% of your daily goals', days: 7, note: 'Water, sleep and steps together', ok: (x, c) => (x.cups > 0 || x.sleep > 0 || x.steps > 0 ? goalPctOf(x, c.goal, c.cg) >= 80 : null) },
  { id: 'logall', cat: 'Habits', title: 'Log water, sleep and steps', days: 7, note: 'All three recorded on the same day', ok: (x) => (x.cups > 0 || x.sleep > 0 || x.steps > 0 ? x.cups > 0 && x.sleep > 0 && x.steps > 0 : null) },
  { id: 'osteps', cat: 'Your own number', title: 'Walk your own steps target', days: 7, note: 'You choose the steps, counted from your steps', ok: (x, c) => (x.steps > 0 ? x.steps >= c.t : null), own: { min: 1000, max: 30000, step: 500, def: 5000, unit: 'steps', mk: (n) => 'Walk ' + n.toLocaleString() + ' steps a day' } },
  { id: 'osleep', cat: 'Your own number', title: 'Sleep your own hours', days: 7, note: 'You choose the hours, counted from your sleep record', ok: (x, c) => (x.sleep > 0 ? x.sleep >= c.t : null), own: { min: 4, max: 11, step: 0.5, def: 7, unit: 'hours', mk: (n) => 'Sleep ' + n + ' hours or more' } },
  { id: 'owater', cat: 'Your own number', title: 'Drink your own glasses', days: 7, note: 'You choose the glasses, counted from your water', ok: (x, c) => (x.cups > 0 ? x.cups >= c.t : null), own: { min: 1, max: 20, step: 1, def: 6, unit: 'glasses', mk: (n) => 'Drink ' + n + ' glasses a day' } },
  { id: 'orelax', cat: 'Your own number', title: 'Relax your own minutes', days: 7, note: 'You choose the minutes, counted from Relax', ok: (x, c) => { const m = (x.rl || []).reduce((a, r) => a + r.s, 0) / 60; return m >= c.t ? true : (x.rl || []).length || x.mood >= 0 || x.cups > 0 || x.steps > 0 || x.sleep > 0 ? false : null; }, own: { min: 1, max: 60, step: 1, def: 5, unit: 'minutes', mk: (n) => 'Relax ' + n + ' minutes a day' } },
  { id: 'meds', cat: 'Habits', title: 'Take every medicine on time', days: 7, note: 'Counted from your Medication ticks', ok: (x, c) => { const due = c.meds.filter((m) => medDue(m, c.date)); if (!due.length) return null; return due.every((m) => (x.med || []).includes(m.id)); } },
];
export type ExpState = { tpl: Tpl; cells: ('hit' | 'miss' | 'none' | 'future')[]; hit: number; logged: number; dayNo: number; done: boolean; rows: { l: string; a: string; b: string }[] };
export function expState(e: Exp, h: HData): ExpState | null {
  const base = TPLS.find((t) => t.id === e.tpl); if (!base) return null;
  const tv = base.own ? (e.goal != null ? e.goal : base.own.def) : 0; const tpl: Tpl = base.own ? { ...base, title: base.own.mk(tv) } : base;
  const startOff = Math.round((new Date(e.start + 'T12:00:00').getTime() - dateOf(0).getTime()) / 86400000);
  const cells: ExpState['cells'] = []; let hit = 0, logged = 0;
  for (let i = 0; i < tpl.days; i++) {
    const o = startOff + i; if (o > 0) { cells.push('future'); continue; }
    const r = tpl.ok(getDay(h, o), { goal: h.goal || 8000, cg: cupsGoal(h), date: dateOf(o), meds: h.meds || [], t: tv }); if (r === null) cells.push('none'); else { logged++; if (r) hit++; cells.push(r ? 'hit' : 'miss'); }
  }
  const endOff = startOff + tpl.days - 1; const done = endOff < 0;
  const rows: ExpState['rows'] = [];
  if (done || logged > 0) {
    const bef = avgRange(h, startOff - tpl.days, startOff - 1), dur = avgRange(h, startOff, Math.min(endOff, 0));
    const add = (l: string, a: number | null, b: number | null, f: (n: number) => string) => { if (a != null && b != null) rows.push({ l, a: f(a), b: f(b) }); };
    add('Sleep a night', bef.sleep, dur.sleep, (n) => hrs(n));
    add('Steps a day', bef.steps, dur.steps, (n) => Math.round(n).toLocaleString());
    add('Water a day', bef.water, dur.water, (n) => (Math.round(n * 10) / 10) + ' glasses');
    add('Mood', bef.mood, dur.mood, (n) => MOODS[Math.max(0, Math.min(4, Math.round(n)))][0]);
  }
  return { tpl, cells, hit, logged, dayNo: Math.min(tpl.days, -startOff + 1), done, rows };
}
export { keyOfDate };

// What an experiment tells you when it is over (or on its last day), and what to try next. Plain advice from your own records, never medical advice.
export type Advice = { head: string; tone: 'great' | 'good' | 'low'; line: string; tips: string[]; next?: Tpl; nextWhy?: string };
const HARDER: Record<string, string> = { bed: 'bed1030', bed12: 'bed', sleep7: 'sleep8', steps4: 'steps', steps: 'steps8', steps8: 'steps10', water6: 'water', water: 'water8', relax5: 'relax10' };
const EASIER: Record<string, string> = { bed: 'bed12', bed1030: 'bed', sleep8: 'sleep7', steps10: 'steps8', steps8: 'steps', steps: 'steps4', water8: 'water', water: 'water6', relax10: 'relax5' };
const TIPS: Record<string, { hi: string[]; lo: string[] }> = {
  Sleep: {
    hi: ['Keep the same bedtime on your days off too. It is the thing that helps most.', 'Keep the room dark and cool, and keep your phone away from the bed.'],
    lo: ['Choose a wind-down time: screens off and lights low for 30 minutes before bed.', 'If you work shifts, protect one fixed sleep window instead of aiming for a perfect night.', 'Start with an easier target and build up from there.'],
  },
  Move: {
    hi: ['Great consistency. A short walk after each meal makes the next target easy.', 'Keep your best walking time in your routine, for example after Maghrib.'],
    lo: ['Split the goal: three short walks of 10 minutes add up quickly.', 'On busy days take the stairs or park a little further away.', 'Try the easier step goal first, then raise it.'],
  },
  Water: {
    hi: ['Keep a bottle where you can see it. It is the easiest habit to hold on to.', 'Have a glass when you wake up and with every meal.'],
    lo: ['Link a glass to things you already do: waking up, each meal, each prayer time.', 'Keep a filled bottle in your bag or on your desk.', 'Log each glass as you drink it so the count is right.'],
  },
  Mind: {
    hi: ['Short sessions at the same time each day work best. Keep your time.', 'Notice what made your good days good and plan a little more of it.'],
    lo: ['Attach it to a fixed moment, for example just before sleep.', 'Even 2 minutes counts. Start small so it feels easy.', 'If low days keep coming, talk to someone you trust.'],
  },
  Habits: {
    hi: ['Keep the routine that worked and add one small thing at a time.', 'Plan the next week on the day before, so nothing is left to chance.'],
    lo: ['Pick just one habit this week and do it at the same time each day.', 'Set a reminder, and tick it off as soon as it is done.', 'Make the goal smaller until it feels easy, then raise it.'],
  },
};
export function adviceOf(st: ExpState): Advice {
  const rate = st.logged > 0 ? st.hit / st.logged : 0; const pct = Math.round(rate * 100);
  const tone: Advice['tone'] = rate >= 0.85 ? 'great' : rate >= 0.5 ? 'good' : 'low';
  const head = tone === 'great' ? 'Great job' : tone === 'good' ? 'Good progress' : st.logged === 0 ? 'Not enough records' : 'A tough one, and that is okay';
  let line = st.logged === 0 ? 'No days were recorded, so there is nothing to measure yet.' : 'You met the target on ' + st.hit + ' of ' + st.logged + ' recorded days (' + pct + '%).';
  if (st.logged > 0 && st.logged < st.tpl.days) line += ' ' + (st.tpl.days - st.logged) + (st.tpl.days - st.logged === 1 ? ' day has' : ' days have') + ' no record. Log every day for a fairer result.';
  const t = TIPS[st.tpl.cat] || TIPS.Habits; const tips = (tone === 'low' ? t.lo : t.hi).slice();
  if (st.logged < st.tpl.days && st.logged > 0) tips.push('Log it every day, even on a day you missed. The result only counts what is recorded.');
  const map = tone === 'great' ? HARDER : tone === 'low' ? EASIER : null;
  const next = map && map[st.tpl.id] ? TPLS.find((x) => x.id === map[st.tpl.id]) : undefined;
  const nextWhy = next ? (tone === 'great' ? 'Ready for a bigger step? ' : 'A smaller step can be a better start. ') : undefined;
  return { head, tone, line, tips, next, nextWhy };
}
