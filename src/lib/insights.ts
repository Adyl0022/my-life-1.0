import { modOn, Mod } from './hidden';
import { useStored } from './store';
import { PUASA_EMPTY, PuasaData, ramadanState, qadhaOwed, sunatToday, isHaram } from './fasting';
import { DEBT_EMPTY, DebtData, remaining, isActive, ymOf, dueDay, amountDue, debtSummary, monthsLeft, yearsMonths, payoffLabel } from './debts';
import { SAV_EMPTY, SavData, goalSaved, perMonth } from './savings';
import { calcLeft, commitFor } from './moneyLeft';
import { HEMPTY, HData, getDay, cupsGoal, goalPctOf, keyOfDate, dateOf, MOODS, WD, bestStreakAll } from './habit';
import { cs } from './region';

export type Sp = { amt: number; date: string; cat?: string; name?: string; id?: number; goal?: number };
export type Fin = { inc: Record<string, Record<string, number>>; spends: Sp[]; limits?: Record<string, number> };
export type Tk = { name: string; due: string; status: string };
export type Ev = { name: string; date: string; done: boolean };
export type Pl = { events: Ev[]; tasks: Tk[] };
export type Veh = { readings?: { date: string; odo: number }[]; fuel?: { date: string; liters: number; amt: number; odo: number }[]; parts?: { name: string; odo: number; life: number }[]; renew?: { roadtax?: string; insurance?: string; licence?: string } };
export type Core = { hd: HData; fin: Fin; pl: Pl; rec: { data: Record<string, Veh> }; tas: { day: string; total: number }; debts: DebtData; puasa: PuasaData; sav: SavData; off: Record<string, string>; setOff: (v: Record<string, string>) => void };
export type Part = { k: string; label: string; pct: number; detail: string; c: string };
export type Tip = { id: string; title: string; sub: string; why: string; go: string; k: string; pri: number };

export const useCore = (): Core => {
  const [hd] = useStored('ml_habit', HEMPTY);
  const [fin] = useStored<Fin>('ml_finance', { inc: {}, spends: [] } as any);
  const [pl] = useStored<Pl>('ml_planner', { events: [], tasks: [] } as any);
  const [rec] = useStored<{ data: Record<string, Veh> }>('ml_record', { data: {} } as any);
  const [tas] = useStored<{ day: string; total: number }>('ml_tasbih', { day: '', total: 0 });
  const [debts] = useStored<DebtData>('ml_debts', DEBT_EMPTY);
  const [puasa] = useStored<PuasaData>('ml_puasa', PUASA_EMPTY);
  const [sav] = useStored<SavData>('ml_savings', SAV_EMPTY);
  const [off, setOff] = useStored<Record<string, string>>('ml_tips_off', {});
  return { hd, fin, pl, rec, tas, debts, puasa, sav, off, setOff };
};

const tk = (o: number) => keyOfDate(dateOf(o));
const allSpends = (c: Core) => (c.fin && c.fin.spends) || [];
// Money put into savings goals is not spending, so it is left out of every spending figure.
const spends = (c: Core) => allSpends(c).filter((x) => x.cat !== 'Savings');
export const spendOn = (c: Core, o: number) => spends(c).filter((x) => x.date === tk(o)).reduce((a, b) => a + (b.amt || 0), 0);
export const spendSum = (c: Core, from: number, to: number) => { let t = 0; for (let o = from; o <= to; o++) t += spendOn(c, o); return t; };
export const hasData = (c: Core, o: number) => { const x = getDay(c.hd, o); return x.cups > 0 || x.sleep > 0 || x.steps > 0; };
export const dayPct = (c: Core, o: number) => goalPctOf(getDay(c.hd, o), c.hd.goal || 8000, cupsGoal(c.hd));
export const avgPct = (c: Core, from: number, to: number) => { let n = 0, t = 0; for (let o = from; o <= to; o++) if (hasData(c, o)) { n++; t += dayPct(c, o); } return n ? Math.round(t / n) : 0; };
const daysTo = (s: string) => { const a = new Date(s + 'T00:00:00').getTime(); const n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((a - n.getTime()) / 86400000); };
export const incomeOf = (c: Core) => Object.values((c.fin && c.fin.inc && c.fin.inc[ymOf(new Date())]) || {}).reduce((a: number, b: any) => a + (b || 0), 0) as number;
const rmf = (n: number) => cs() + (Math.round(n * 100) / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Everyday spending guide: average of days that had spending in the last 30 days.
const usualSpend = (c: Core) => { let t = 0, n = 0; for (let o = -30; o <= -1; o++) { const v = spendOn(c, o); if (v > 0) { t += v; n++; } } return n >= 3 ? t / n : 0; };
const tasksDue = (c: Core) => ((c.pl && c.pl.tasks) || []).filter((t) => t.due && t.due <= tk(0));

export function scoreParts(c: Core, week: boolean): Part[] {
  const parts: Part[] = [];
  const hAny = week ? [-6, -5, -4, -3, -2, -1, 0].some((o) => hasData(c, o)) : hasData(c, 0);
  if (hAny) { const p = week ? avgPct(c, -6, 0) : dayPct(c, 0); parts.push({ k: 'habit', label: 'Health habits', pct: p, detail: week ? 'Steps, water and sleep over 7 days' : 'Steps, water and sleep today', c: '#34d399' }); }
  const due = tasksDue(c);
  if (due.length) { const dn = due.filter((t) => t.status === 'done').length; parts.push({ k: 'tasks', label: 'Tasks', pct: Math.round((dn / due.length) * 100), detail: dn + ' of ' + due.length + ' tasks due or overdue', c: '#7c9cff' }); }
  const ds = debtSummary(c.debts);
  if (ds.commit > 0) parts.push({ k: 'bills', label: 'Commitments', pct: Math.round((ds.paid / ds.commit) * 100), detail: rmf(ds.paid) + ' of ' + rmf(ds.commit) + ' paid this month', c: '#ff8fab' });
  const us = usualSpend(c);
  // Spending only counts once something was actually entered, so an empty day never shows a perfect score.
  if (us > 0 && (week ? spendSum(c, -6, 0) > 0 : spendOn(c, 0) > 0)) {
    if (week) { const w = spendSum(c, -6, 0) / 7; const pct = w <= us ? 100 : Math.max(20, Math.round(100 - ((w - us) / us) * 60)); parts.push({ k: 'spend', label: 'Spending', pct, detail: rmf(w) + ' a day against ' + rmf(us) + ' usual', c: '#ffc46b' }); }
    else { const t = spendOn(c, 0); const pct = t <= us ? 100 : Math.max(20, Math.round(100 - ((t - us) / us) * 60)); parts.push({ k: 'spend', label: 'Spending', pct, detail: rmf(t) + ' against ' + rmf(us) + ' usual', c: '#ffc46b' }); }
  }
  if (c.tas && c.tas.day && c.tas.day === tk(0) && c.tas.total > 0) parts.push({ k: 'faith', label: 'Zikir', pct: Math.min(100, Math.round((c.tas.total / 33) * 100)), detail: c.tas.total + ' tasbih today', c: '#8fe9e2' });
  try {
    const rs = ramadanState(c.puasa || PUASA_EMPTY, new Date());
    if (rs.phase === 'during') { const past = Math.max(1, rs.day - 1 - rs.excused); parts.push({ k: 'faith', label: 'Ramadan', pct: Math.min(100, Math.round((rs.fasted / past) * 100)), detail: rs.fasted + ' days fasted of ' + rs.day, c: '#34d399' }); }
  } catch (e) {}
  const need: Record<string, Mod> = { habit: 'habit', tasks: 'planner', bills: 'finance', spend: 'finance', faith: 'islamic' };
  return parts.filter((p) => !need[p.k] || modOn(need[p.k]));
}
export const lifeScore = (p: Part[]) => (p.length ? Math.round(p.reduce((a, b) => a + b.pct, 0) / p.length) : 0);

export type Row = { l: string; now: string; prev: string; d: number | null; good: boolean };
export function weekly(c: Core) {
  const cg = cupsGoal(c.hd);
  const avg = (from: number, to: number, f: (x: any) => number, skip0 = false) => { let t = 0, n = 0; for (let o = from; o <= to; o++) { const v = f(getDay(c.hd, o)); if (skip0 && !(v > 0)) continue; t += v; n++; } return n ? t / n : 0; };
  // Average daily score over the days that have anything logged.
  const dayAvg = (from: number, to: number) => { let t = 0, n = 0; for (let o = from; o <= to; o++) if (hasData(c, o)) { t += dayPct(c, o); n++; } return n ? t / n : 0; };
  const mk = (l: string, a: number, b: number, fmt: (n: number) => string, up: boolean): Row => ({ l, now: fmt(a), prev: fmt(b), d: b > 0 ? Math.round(((a - b) / b) * 100) : null, good: up ? a >= b : a <= b });
  const rows: Row[] = [
    mk('Steps a day', avg(-6, 0, (x) => x.steps), avg(-13, -7, (x) => x.steps), (n) => Math.round(n).toLocaleString(), true),
    mk('Water a day', avg(-6, 0, (x) => x.cups), avg(-13, -7, (x) => x.cups), (n) => (Math.round(n * 10) / 10) + ' of ' + cg, true),
    mk('Sleep a night', avg(-6, 0, (x) => x.sleep, true), avg(-13, -7, (x) => x.sleep, true), (n) => (Math.round(n * 10) / 10) + ' h', true),
    mk('Daily score', dayAvg(-6, 0), dayAvg(-13, -7), (n) => Math.round(n) + '%', true),
  ];
  let best = -1, worst = -1, bp = -1, wp = 101;
  for (let o = -6; o <= 0; o++) if (hasData(c, o)) { const p = dayPct(c, o); if (p > bp) { bp = p; best = o; } if (p < wp) { wp = p; worst = o; } }
  const dn = (o: number) => WD[dateOf(o).getDay()];
  let head = 'Log a few days to see your weekly review.';
  const cand = rows.filter((r) => r.d !== null && r.d !== 0).map((r) => ({ r, s: (r.good ? 1 : -1) * Math.abs(r.d as number) }));
  if (cand.length) { const top = cand.sort((a, b) => b.s - a.s)[0]; head = top.r.l.replace(' a day', '').replace(' a night', '') + ' is ' + ((top.r.d as number) > 0 ? 'up ' : 'down ') + Math.abs(top.r.d as number) + '% on last week.'; }
  else if (best !== -1) head = 'Your best day was ' + dn(best) + '.';
  return { rows, best: best !== -1 ? { day: dn(best), pct: bp } : null, worst: worst !== -1 && worst !== best ? { day: dn(worst), pct: wp } : null, head };
}

export function patterns(c: Core): string[] {
  if (!modOn('habit')) return [];
  const out: string[] = [];
  const cg = cupsGoal(c.hd), goal = c.hd.goal || 8000;
  const days: ReturnType<typeof getDay>[] = [];
  for (let o = -59; o <= 0; o++) { const x = getDay(c.hd, o); if (x.mood >= 0) days.push(x); }
  const mn = (n: number) => MOODS[Math.max(0, Math.min(4, Math.round(n)))][0];
  const cmp = (f: (x: any) => boolean, hi: string, lo: string, key: string) => {
    const a = days.filter(f), b = days.filter((x) => !f(x));
    if (a.length < 3 || b.length < 3) return;
    const ma = a.reduce((s, x) => s + x.mood, 0) / a.length, mb = b.reduce((s, x) => s + x.mood, 0) / b.length;
    if (ma - mb >= 0.4) out.push('On days ' + hi + ', your mood averages ' + mn(ma) + ', against ' + mn(mb) + ' ' + lo + '.');
  };
  cmp((x) => x.sleep >= 7, 'you sleep 7 h or more', 'on shorter nights', 's');
  cmp((x) => x.cups >= cg, 'you reach your water goal', 'on other days', 'w');
  cmp((x) => x.steps >= goal, 'you reach your step goal', 'on other days', 't');
  const sum = [0, 0, 0, 0, 0, 0, 0], cnt = [0, 0, 0, 0, 0, 0, 0];
  for (let o = -27; o <= 0; o++) if (hasData(c, o)) { const w = dateOf(o).getDay(); sum[w] += dayPct(c, o); cnt[w]++; }
  let bw = -1, bv = -1; for (let w = 0; w < 7; w++) if (cnt[w] >= 2 && sum[w] / cnt[w] > bv) { bv = sum[w] / cnt[w]; bw = w; }
  if (bw >= 0) out.push('Your strongest day is ' + ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][bw] + ', averaging ' + Math.round(bv) + ' out of 100.');
  return out.slice(0, 3);
}

export function tips(c: Core, week: boolean): Tip[] {
  const L: Tip[] = [];
  const add = (t: Tip) => L.push(t);
  const cg = cupsGoal(c.hd), goal = c.hd.goal || 8000, ht = getDay(c.hd, 0);
  const now = new Date(), hr = now.getHours(), dow = now.getDay();
  const todayK = tk(0);
  // Health
  if (!week) {
    if (ht.cups < cg) { const n = Math.min(2, cg - ht.cups); add({ id: 'water', title: 'Drink ' + n + ' more ' + (n === 1 ? 'glass' : 'glasses') + ' of water', sub: 'You are at ' + ht.cups + ' of ' + cg + '. Log it in Habit & Health.', why: 'Water is a third of your daily score. Your goal comes from your body weight.', go: '/habit', k: 'water', pri: 60 }); }
    if (ht.steps < goal) add({ id: 'steps', title: 'Walk ' + (goal - ht.steps).toLocaleString() + ' more steps', sub: 'Your goal today is ' + goal.toLocaleString() + ' steps.', why: 'Steps count toward your activity score. A short walk after a meal adds up fast.', go: '/habit', k: 'steps', pri: 55 });
    if (!(ht.sleep > 0)) add({ id: 'sleeplog', title: 'Log last night\'s sleep', sub: 'Sleep is a third of your daily score.', why: 'Without a sleep entry your score cannot include it.', go: '/habit', k: 'sleep', pri: 58 });
    else if (ht.sleep < 6) add({ id: 'sleeplow', title: 'Aim for 7 hours tonight', sub: 'You slept ' + ht.sleep + ' h. A little more rest lifts your score.', why: 'Seven hours is the target used in your score.', go: '/habit', k: 'sleep', pri: 70 });
    if (ht.mood < 0) add({ id: 'mood', title: 'Log how you feel today', sub: 'Tracking mood shows patterns over time.', why: 'After a few days, Insights can show what lifts your mood.', go: '/habit', k: 'mood', pri: 40 });
  } else {
    const wl = [-6, -5, -4, -3, -2, -1, 0].filter((o) => hasData(c, o)).length;
    if (wl < 5) add({ id: 'wlog', title: 'Log more days this week', sub: 'You logged ' + wl + ' of 7 days. A fuller week gives a truer score.', why: 'Averages are only as good as the days you record.', go: '/habit', k: 'week', pri: 62 });
  }
  // Shift worker: sleep debt over last 7 days
  let debt = 0, logged = 0; for (let o = -6; o <= 0; o++) { const s = getDay(c.hd, o).sleep; if (s > 0) { logged++; debt += Math.max(0, 7 - s); } }
  if (logged >= 3 && debt >= 5) add({ id: 'debt', title: 'Sleep debt: ' + (Math.round(debt * 10) / 10) + ' h this week', sub: 'Try an earlier bedtime or a short nap before your next shift.', why: 'Counted as hours below 7 h on the nights you logged. After night shifts, a 20 to 30 minute nap helps.', go: '/habit', k: 'sleep', pri: 75 });
  // Health spending (Health category in My Finance)
  { const ymC = ymOf(new Date()), d0 = new Date(); d0.setDate(1); d0.setMonth(d0.getMonth() - 1); const ymP = ymOf(d0);
    const hs = (ym: string) => ((c.fin && c.fin.spends) || []).filter((x) => x.cat === 'Health' && (x.date || '').slice(0, 7) === ym).reduce((a, x) => a + (x.amt || 0), 0);
    const hc = hs(ymC), hp = hs(ymP);
    if (hc > 0 && hp > 0 && hc >= hp * 1.3) add({ id: 'hspend', title: 'Health spending is up', sub: rmf(hc) + ' this month, ' + rmf(hp) + ' last month.', why: 'Counted from entries under Health in My Finance. A short note on what each cost was for helps you see what changed.', go: '/habit', k: 'spend', pri: 44 });
  }
  // Fasting sunnah
  const tomorrow = (dow + 1) % 7;
  const inRamNow = (() => { try { return ramadanState(c.puasa || PUASA_EMPTY, new Date()).phase === 'during'; } catch (e) { return false; } })();
  if (inRamNow) { /* Ramadan has its own tips */ }
  else if ((dow === 1 || dow === 4) && !ht.fast && !(c.puasa && c.puasa.days && c.puasa.days[tk(0)]) && hr < 11) add({ id: 'fast', title: 'Today is a sunnah fasting day', sub: dow === 1 ? 'Monday is a recommended day to fast.' : 'Thursday is a recommended day to fast.', why: 'You can log your fast in Habit & Health.', go: '/habit', k: 'streak', pri: 45 });
  else if ((tomorrow === 1 || tomorrow === 4) && hr >= 17) add({ id: 'fastnext', title: 'Tomorrow is a sunnah fasting day', sub: tomorrow === 1 ? 'Monday is a recommended day to fast.' : 'Thursday is a recommended day to fast.', why: 'A gentle reminder the evening before, so you can plan suhoor.', go: '/habit', k: 'streak', pri: 42 });
  // Puasa module
  try {
    const now = new Date(), pz = c.puasa || PUASA_EMPTY, rs = ramadanState(pz, now), ow = qadhaOwed(pz, now), po = pz.off || 0;
    if (rs.phase === 'during') {
      const ht2 = getDay(c.hd, 0), cg2 = cupsGoal(c.hd);
      if (hr >= 19 && ht2.cups < cg2 / 2) add({ id: 'ramwater', title: 'Drink between iftar and sahur', sub: 'You are at ' + ht2.cups + ' of ' + cg2 + ' glasses today.', why: 'You cannot drink while fasting, so spread your water through the night. Aim for about 2 glasses at iftar, 4 through the evening and 2 at sahur.', go: '/habit', k: 'water', pri: 66 });
      const sl = getDay(c.hd, 0).sleep; const sl1 = getDay(c.hd, -1).sleep;
      if ((sl > 0 && sl < 6) || (sl === 0 && sl1 > 0 && sl1 < 6)) add({ id: 'ramsleep', title: 'Short on sleep in Ramadan', sub: 'A short nap in the afternoon can help your energy.', why: 'Late nights and early sahur cut sleep. Even 20 to 30 minutes helps. Avoid hard exercise while fasting.', go: '/habit', k: 'sleep', pri: 64 });
      if (rs.unmarked > 0) add({ id: 'ramgap', title: rs.unmarked + (rs.unmarked === 1 ? ' day' : ' days') + ' not marked in Ramadan', sub: 'Mark the days you fasted or were excused.', why: 'Unmarked days count as missed and are added to your make-up after Ramadan.', go: '/puasa', k: 'streak', pri: 74 });
      if (!(rs.todayDone as string | undefined)) add({ id: 'ramtoday', title: 'Mark today\'s Ramadan fast', sub: 'Day ' + rs.day + ' of ' + rs.r.len + '. Tap to record it.', why: 'Marking each day keeps your Ramadan count and make-up correct.', go: '/puasa', k: 'streak', pri: 80 });
    } else {
      if (ow > 0) add({ id: 'qadha', title: ow + (ow === 1 ? ' missed fast' : ' missed fasts') + ' to make up', sub: rs.phase === 'before' ? 'Ramadan is ' + rs.daysTo + ' days away.' : 'Try to finish before next Ramadan.', why: 'Missed Ramadan days are owed. Mondays and Thursdays are a good time to make them up.', go: '/puasa', k: 'streak', pri: rs.phase === 'before' && rs.daysTo < ow * 7 ? 72 : 52 });
      if (rs.phase === 'before' && rs.daysTo <= 30) add({ id: 'ramsoon', title: 'Ramadan in ' + rs.daysTo + ' days', sub: 'A good time to settle your make-up and plan your routine.', why: 'The date is a calendar estimate. Confirm with the official announcement.', go: '/puasa', k: 'insight', pri: 55 });
      const st = sunatToday(now, po);
      if (st && !isHaram(now, po) && !(pz.days || {})[tk(0)] && st !== 'Monday sunnah fast' && st !== 'Thursday sunnah fast') add({ id: 'sunat', title: 'Today: ' + st, sub: 'A recommended day to fast.', why: 'Open Puasa to log it and see your yearly count.', go: '/puasa', k: 'streak', pri: 56 });
    }
  } catch (e) {}
  // Islamic
  if (dow === 5) add({ id: 'kahfi', title: 'Read Surah Al-Kahfi today', sub: 'It is Friday. Verses 1 to 10 and 101 to 110 are ready to read.', why: 'Reading Al-Kahfi on Friday is a well known sunnah.', go: '/surah/kahfi10', k: 'link', pri: 80 });
  add(hr < 12 ? { id: 'zikir', title: 'Read morning Al-Ma\'thurat', sub: 'Best read after Subuh. It takes about 10 minutes.', why: 'Morning zikir is read after Subuh until the sun is well up.', go: '/mathurat', k: 'link', pri: 35 } : { id: 'zikir', title: 'Read evening Al-Ma\'thurat', sub: 'Best read after Asar. It takes about 10 minutes.', why: 'Evening zikir is read after Asar until Maghrib.', go: '/mathurat', k: 'link', pri: 35 });
  if (hr >= 20 && !(c.tas && c.tas.day === todayK && c.tas.total > 0)) add({ id: 'tasbih', title: 'A few minutes of tasbih tonight', sub: 'You have not counted any zikir today.', why: 'Counted from your Tasbih screen. It resets every day.', go: '/tasbih', k: 'insight', pri: 30 });
  // Planner
  const tasks = (c.pl && c.pl.tasks) || [], events = (c.pl && c.pl.events) || [];
  const over = tasks.filter((t) => t.status !== 'done' && t.due && t.due < todayK);
  if (over.length) add({ id: 'overdue', title: over.length + (over.length === 1 ? ' task is overdue' : ' tasks are overdue'), sub: over.slice(0, 2).map((t) => t.name).join(', ') + (over.length > 2 ? ' and more' : ''), why: 'These tasks have a due date before today and are not marked done.', go: '/planner', k: 'goal', pri: 85 });
  const dueToday = tasks.filter((t) => t.status !== 'done' && t.due === todayK);
  if (dueToday.length) add({ id: 'duetoday', title: dueToday.length + (dueToday.length === 1 ? ' task is due today' : ' tasks are due today'), sub: dueToday.slice(0, 2).map((t) => t.name).join(', '), why: 'Due today and not marked done yet.', go: '/planner', k: 'goal', pri: 78 });
  const soon = events.filter((e) => !e.done && e.date && daysTo(e.date) >= 0 && daysTo(e.date) <= 2).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (soon.length) { const d = daysTo(soon[0].date); add({ id: 'event', title: soon[0].name + (d === 0 ? ' is today' : d === 1 ? ' is tomorrow' : ' is in 2 days'), sub: soon.length > 1 ? 'And ' + (soon.length - 1) + ' more coming up.' : 'Open Daily Planner for details.', why: 'Shows events in the next 2 days that are not marked done.', go: '/planner', k: 'week', pri: 82 }); }
  // Finance
  const mk = todayK.slice(0, 7), pk = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); })();
  const sm = spends(c).filter((x) => (x.date || '').slice(0, 7) === mk), sp = spends(c).filter((x) => (x.date || '').slice(0, 7) === pk);
  const tm = sm.reduce((a, b) => a + (b.amt || 0), 0), tp = sp.reduce((a, b) => a + (b.amt || 0), 0);
  if (sm.length >= 3) {
    const cat: Record<string, number> = {}; sm.forEach((x) => { const k = x.cat || 'Other'; cat[k] = (cat[k] || 0) + (x.amt || 0); });
    const top = Object.keys(cat).sort((a, b) => cat[b] - cat[a])[0];
    add({ id: 'topcat', title: top + ' is your biggest spending', sub: rmf(cat[top]) + ' this month, ' + Math.round((cat[top] / tm) * 100) + '% of what you spent.', why: 'Based on the spending you added in My Finance this month.', go: '/finance', k: 'goal', pri: 50 });
  }
  if (tp > 0 && tm > 0) { const d = Math.round(((tm - tp) / tp) * 100); if (Math.abs(d) >= 10) add({ id: 'mom', title: 'Spending is ' + (d > 0 ? 'up ' : 'down ') + Math.abs(d) + '% on last month', sub: rmf(tm) + ' so far, against ' + rmf(tp) + ' last month.', why: 'Compares this month so far with the whole of last month.', go: '/finance', k: 'goal', pri: d > 0 ? 66 : 38 }); }
  const dm = now.getDate(); let nsd = 0; for (let o = -(dm - 1); o <= -1; o++) if (spendOn(c, o) === 0) nsd++;
  if (dm >= 7 && sm.length >= 1 && nsd >= 3) add({ id: 'nospend', title: nsd + ' no-spend days this month', sub: 'Keep it going. Small gaps in spending add up.', why: 'Counts days this month before today with nothing added in My Finance.', go: '/finance', k: 'badge', pri: 32 });
  {
    const inc = incomeOf(c);
    if (inc > 0) {
      const L = calcLeft({ ym: mk, income: inc, commit: commitFor(c.debts, mk), spends: allSpends(c) as any });
      if (L.left > 0 && L.daysLeft > 0) add({ id: 'allow', title: 'About ' + rmf(L.allowance) + ' a day left to spend', sub: rmf(L.left) + ' left this month after commitments and savings, for ' + L.daysLeft + ' days.', why: 'The same Money Left figure you see in My Finance: income minus commitments, spending and money put into savings goals.', go: '/finance', k: 'goal', pri: 52 });
      else if (L.left <= 0) add({ id: 'over', title: 'You are over budget this month', sub: 'Commitments, spending and savings add up to ' + rmf(-L.left) + ' more than your income.', why: 'The same Money Left figure you see in My Finance.', go: '/finance', k: 'goal', pri: 88 });
      if (L.isCur && L.projLeft < 0 && L.left > 0) add({ id: 'pace', title: 'At this pace you will run short', sub: 'Your usual daily spending would leave you about ' + rmf(-L.projLeft) + ' short by month end.', why: 'Projection from your regular daily spending, leaving out bills and big one-off buys.', go: '/finance', k: 'goal', pri: 70 });
      // Category limits
      const lim = (c.fin && c.fin.limits) || {};
      Object.keys(lim).forEach((k2) => {
        if (!(lim[k2] > 0)) return; const t = sm.filter((x) => (x.cat || 'Other') === k2).reduce((a, b) => a + (b.amt || 0), 0); const r = t / lim[k2];
        if (r > 1) add({ id: 'lim-' + k2, title: k2 + ' is over its limit', sub: rmf(t) + ' spent against a limit of ' + rmf(lim[k2]) + '.', why: 'Compares this month\'s ' + k2 + ' spending with the limit you set in My Finance.', go: '/finance', k: 'goal', pri: 72 });
        else if (r >= 0.8) add({ id: 'lim-' + k2, title: k2 + ' is at ' + Math.round(r * 100) + '% of its limit', sub: rmf(lim[k2] - t) + ' left before you reach ' + rmf(lim[k2]) + '.', why: 'Compares this month\'s ' + k2 + ' spending with the limit you set in My Finance.', go: '/finance', k: 'goal', pri: 60 });
      });
    }
  }
  // Savings goals
  {
    const goals = (c.sav && c.sav.goals) || []; const all = allSpends(c) as any;
    const savedThisMonth = all.filter((x: any) => x.cat === 'Savings' && (x.date || '').slice(0, 7) === mk).reduce((a: number, b: any) => a + (b.amt || 0), 0);
    goals.forEach((g) => {
      const sv = goalSaved(g, all, c.debts); const pct = g.target > 0 ? Math.round((sv / g.target) * 100) : 0;
      if (g.target > 0 && sv >= g.target) add({ id: 'goal-done-' + g.id, title: g.name + ' is fully saved', sub: rmf(sv) + ' saved. You reached your target.', why: 'Counted from the savings goal you set.', go: '/savings', k: 'badge', pri: 45 });
      else if (g.target > 0 && pct >= 75) add({ id: 'goal-near-' + g.id, title: g.name + ' is ' + pct + '% saved', sub: rmf(g.target - sv) + ' to go. Almost there.', why: 'Counted from the savings goal you set.', go: '/savings', k: 'goal', pri: 44 });
      else { const pm = perMonth(g, sv); if (pm) add({ id: 'goal-pm-' + g.id, title: 'Save about ' + rmf(pm) + ' a month for ' + g.name, sub: rmf(g.target - sv) + ' to go by ' + g.due + '.', why: 'Remaining amount spread over the months until your target date.', go: '/savings', k: 'goal', pri: 40 }); }
    });
    if (goals.length > 0 && savedThisMonth <= 0 && now.getDate() >= 10) add({ id: 'goal-none', title: 'Nothing saved to your goals this month', sub: 'Even a small amount keeps ' + (goals[0].name) + ' moving.', why: 'No Savings entries or linked commitments were found for this month.', go: '/savings', k: 'goal', pri: 42 });
  }
  // Debts
  const dym = ymOf(now);
  ((c.debts && c.debts.debts) || []).filter((x) => isActive(x, dym) && !((x.paid || {})[dym] > 0)).forEach((x) => {
    const dd = dueDay(x, now.getFullYear(), now.getMonth()) - now.getDate();
    if (dd < 0) add({ id: 'debt-' + x.id, title: x.name + ' is ' + -dd + (dd === -1 ? ' day' : ' days') + ' overdue', sub: cs() + Math.round(amountDue(x, dym)).toLocaleString() + ' is still unpaid this month.', why: 'The due day has passed and this month is not ticked as paid in My Finance.', go: '/finance', k: 'goal', pri: 92 });
    else if (dd <= 3) add({ id: 'debt-' + x.id, title: x.name + (dd === 0 ? ' is due today' : dd === 1 ? ' is due tomorrow' : ' is due in ' + dd + ' days'), sub: cs() + Math.round(amountDue(x, dym)).toLocaleString() + '. Tick it off in My Finance once paid.', why: 'Based on the due day you saved for this debt.', go: '/finance', k: 'goal', pri: 89 });
  });
  // Commitments
  {
    const ds = debtSummary(c.debts), inc = incomeOf(c);
    const dmonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (ds.commit > 0 && inc > 0) {
      const share = Math.round(((ds.commit + ds.food) / inc) * 100), free = inc - ds.commit - ds.food;
      if (free < 0) add({ id: 'cm-over', title: 'Commitments are higher than your income', sub: rmf(-free) + ' short this month after bills and food.', why: 'Income minus all monthly commitments and your food amount is below zero.', go: '/finance', k: 'goal', pri: 87 });
      else {
        if (share >= 60) add({ id: 'cm-share', title: 'Commitments take ' + share + '% of your income', sub: 'Little room is left for surprises. Try to clear the smallest debt first.', why: 'A common guide is to keep fixed payments below about half of take-home pay.', go: '/finance', k: 'goal', pri: 64 });
        if (free > 50) add({ id: 'cm-free', title: rmf(free) + ' is free this month', sub: ds.debts.length ? 'Put half of it toward ' + ds.debts.slice().sort((a, b) => remaining(a) - remaining(b))[0].name + ' or into savings.' : 'Consider moving some of it into savings.', why: 'Income minus bills, debts and food. Paying extra early shortens how long a debt lasts and cuts interest.', go: '/finance', k: 'goal', pri: 46 });
      }
    }
    if (ds.debts.length >= 2) {
      const sm = ds.debts.slice().sort((a, b) => remaining(a) - remaining(b))[0];
      add({ id: 'cm-snow', title: 'Clear ' + sm.name + ' first', sub: rmf(remaining(sm)) + ' left, about ' + yearsMonths(monthsLeft(sm)) + '. Then add its ' + rmf(sm.monthly) + ' to the next debt.', why: 'Paying off the smallest balance first frees up monthly cash sooner and keeps you motivated. This is often called the snowball method.', go: '/finance', k: 'badge', pri: 48 });
    }
    if (ds.debts.length >= 1) {
      const big = ds.debts.slice().sort((a, b) => remaining(b) - remaining(a))[0];
      const extra = Math.max(20, Math.round((big.monthly * 0.2) / 10) * 10); const was = monthsLeft(big), now2 = Math.ceil(remaining(big) / (big.monthly + extra));
      if (was - now2 >= 1) add({ id: 'cm-extra', title: 'Pay ' + cs() + extra + ' extra on ' + big.name, sub: 'You would finish ' + (was - now2) + (was - now2 === 1 ? ' month' : ' months') + ' sooner.', why: 'Works out how long the balance lasts at ' + rmf(big.monthly + extra) + ' a month instead of ' + rmf(big.monthly) + '. Extra payments often save interest too.', go: '/finance', k: 'goal', pri: 47 });
      add({ id: 'cm-free-date', title: 'Debt-free by ' + payoffLabel(ds.worst, ds.unpaid.every((x) => x.fixed) || ds.debts.every((x) => (x.paid || {})[ds.ym] > 0)), sub: 'About ' + yearsMonths(ds.worst) + ' to go, ' + rmf(ds.totalLeft) + ' remaining.', why: 'Based on your balances and monthly payments if you keep paying every month.', go: '/finance', k: 'badge', pri: 24 });
    }
    if (ds.unpaid.length > 0 && dmonth - now.getDate() <= 5) add({ id: 'cm-left', title: ds.unpaid.length + (ds.unpaid.length === 1 ? ' payment is' : ' payments are') + ' not ticked yet', sub: rmf(ds.toPay) + ' with ' + (dmonth - now.getDate()) + (dmonth - now.getDate() === 1 ? ' day' : ' days') + ' left this month.', why: 'Tick each payment in My Finance once paid so your balances stay right.', go: '/finance', k: 'goal', pri: 70 });
    const lastD = new Date(now.getFullYear(), now.getMonth() - 1, 1), lastYm = ymOf(lastD);
    const ms = ds.list.filter((x) => x.since <= lastYm && !((x.paid || {})[lastYm] > 0) && (x.fixed || remaining(x) > 0));
    if (ms.length) add({ id: 'cm-miss', title: ms.length + (ms.length === 1 ? ' payment' : ' payments') + ' not ticked last month', sub: ms.map((x) => x.name).slice(0, 3).join(', ') + '. Mark them paid to keep balances right.', why: 'Debt balances only go down when a month is ticked as paid.', go: '/finance', k: 'goal', pri: 56 });
  }
  // Record
  const vs = Object.entries((c.rec && c.rec.data) || {});
  let hadOdo = false, anyReading = false;
  vs.forEach(([name, v]) => {
    const r = (v.readings || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const f = (v.fuel || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const latest = Math.max(0, ...r.map((x) => x.odo), ...f.map((x) => x.odo));
    if (r.length) { anyReading = true; if ((r[r.length - 1].date || '').slice(0, 7) === mk) hadOdo = true; }
    (v.parts || []).forEach((p) => { if (latest > 0 && p.life > 0) { const left = p.life - Math.max(0, latest - p.odo); if (left <= 500) add({ id: 'part-' + name + p.name, title: p.name + (left <= 0 ? ' is due for a change' : ' due in about ' + Math.round(left).toLocaleString() + ' km'), sub: name + ' · lasts about ' + p.life.toLocaleString() + ' km.', why: 'From the last change and your latest odometer in My Record.', go: '/record', k: 'insight', pri: left <= 0 ? 86 : 72 }); } });
    const rn = v.renew || {}; ([['roadtax', 'Road tax'], ['insurance', 'Insurance'], ['licence', 'Driving licence']] as [keyof typeof rn, string][]).forEach(([k, lab]) => { const s = rn[k]; if (s) { const d = daysTo(s); if (d <= 30) add({ id: 'ren-' + name + k, title: lab + (d < 0 ? ' expired ' + -d + (d === -1 ? ' day ago' : ' days ago') : d === 0 ? ' expires today' : ' expires in ' + d + (d === 1 ? ' day' : ' days')), sub: name + ' · renew before it lapses.', why: 'Based on the expiry date saved in My Record.', go: '/record', k: 'badge', pri: d <= 7 ? 90 : 74 }); } });
    if (f.length >= 3) {
      const span = f[f.length - 1].odo - f[0].odo; const cost = f.slice(0, -1).reduce((a, b) => a + (b.amt || 0), 0);
      if (span > 50 && cost > 0) add({ id: 'cpk-' + name, title: 'Fuel costs about ' + rmf(cost / span) + ' a km', sub: name + ' · from your last ' + f.length + ' fill-ups.', why: 'Money spent on fuel divided by the distance between your first and last fill-up.', go: '/record', k: 'insight', pri: 28 });
    }
  });
  if (vs.length && anyReading && !hadOdo && dm >= 25) add({ id: 'odo', title: 'Add this month\'s odometer reading', sub: 'Keep your mileage and suggestions in My Record up to date.', why: 'No reading has been saved yet this month.', go: '/record', k: 'insight', pri: 44 });
  else if (vs.length && !anyReading) add({ id: 'odo0', title: 'Add your first odometer reading', sub: 'My Record can then track mileage and service needs.', why: 'No odometer reading is saved yet.', go: '/record', k: 'insight', pri: 26 });
  const today = tk(0);
  return L.filter((t) => tipMods(t.id).every((m) => modOn(m))).filter((t) => !(c.off && c.off[t.id] && c.off[t.id] >= today)).sort((a, b) => b.pri - a.pri);
}
export const hideTip = (c: Core, id: string, days = 7) => { const d = dateOf(days); c.setOff({ ...(c.off || {}), [id]: keyOfDate(d) }); };

export function records(c: Core) {
  let bs = 0, bsd = '', bw = 0, bwd = '', bsc = 0, bscd = '';
  for (let o = -120; o <= 0; o++) {
    const x = getDay(c.hd, o); const k = tk(o);
    if (x.steps > bs) { bs = x.steps; bsd = k; }
    if (x.cups > bw) { bw = x.cups; bwd = k; }
    if (hasData(c, o)) { const p = dayPct(c, o); if (p > bsc) { bsc = p; bscd = k; } }
  }
  return { streak: bestStreakAll(c.hd), steps: bs, stepsDate: bsd, water: bw, waterDate: bwd, score: bsc, scoreDate: bscd };
}

// Which modules a tip needs. A tip is shown only when all of them are on.
export const tipMods = (id: string): Mod[] => {
  if (id === 'hspend') return ['habit', 'finance'];
  if (id === 'ramwater' || id === 'ramsleep') return ['habit', 'islamic'];
  if (/^(fast|fastnext)$/.test(id)) return ['islamic'];
  const cat = tipCat(id);
  return [cat === 'Health' ? 'habit' : cat === 'Faith' ? 'islamic' : cat === 'Tasks' ? 'planner' : cat === 'Vehicle' ? 'record' : 'finance'];
};
export const tipCat = (id: string): string => {
  if (/^(water|steps|sleeplog|sleeplow|mood|wlog|debt|ramwater|ramsleep|hspend)$/.test(id)) return 'Health';
  if (/^(fast|fastnext|kahfi|zikir|tasbih|ramtoday|qadha|ramsoon|sunat|ramgap)$/.test(id)) return 'Faith';
  if (/^(overdue|duetoday|event)$/.test(id)) return 'Tasks';
  if (/^(part-|ren-|cpk-|odo)/.test(id)) return 'Vehicle';
  return 'Money';
};
