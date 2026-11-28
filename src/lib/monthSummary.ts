import type { HData, HDay } from './habit';
import type { Fin, Pl, Veh } from './insights';
import type { DebtData } from './debts';
import type { PuasaData } from './fasting';
import type { SavData } from './savings';

// "Your month": a plain look back at one calendar month, worked out on this phone from what the person logged. No AI and nothing is sent anywhere.
// Pure code on purpose (no screens, no storage), so it is easy to test. Hidden modules are left out. Wording is a personal record, not medical or financial advice.

export type MIn = {
  hd: HData; fin: Fin; pl: Pl; rec: { data: Record<string, Veh> }; debts: DebtData; puasa: PuasaData; sav: SavData;
  cg: number; goal: number; rm: (n: number) => string; today: Date;
  on: { habit: boolean; finance: boolean; planner: boolean; islamic: boolean; record: boolean };
};
export type MRow = { l: string; v: string; d?: number | null; good?: boolean };
export type MSec = { k: 'health' | 'money' | 'tasks' | 'faith' | 'vehicle'; title: string; c: string; pct?: number; rows: MRow[] };
export type MSum = {
  ym: string; label: string; name: string; partial: boolean; daysIn: number; upto: number; logged: number;
  hasData: boolean; score: number | null; headline: string; story: string;
  /** One value per day of the month: 0-100 for a day with something logged, -1 for an empty day. Used for the small picture on the Dashboard card. */
  daily: number[];
  stats: { l: string; v: string }[]; sections: MSec[];
  wins: string[]; improve: string[]; advice: string[]; focus: string[];
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MOODN = ['Awful', 'Low', 'Okay', 'Good', 'Great'];
const pad = (n: number) => String(n).padStart(2, '0');
export const ymKey = (y: number, m0: number) => y + '-' + pad(m0 + 1);
const keyOf = (y: number, m0: number, d: number) => ymKey(y, m0) + '-' + pad(d);
const BLANK: HDay = { mood: -1, cups: 0, sleep: 0, steps: 0 };
const r1 = (n: number) => Math.round(n * 10) / 10;
const num = (n: any) => (typeof n === 'number' && isFinite(n) ? n : 0);
const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const clamp = (n: number, a = 0, b = 100) => Math.max(a, Math.min(b, n));
const pctChange = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : null);

type Raw = ReturnType<typeof calc>;

function calc(i: MIn, y: number, m0: number) {
  const daysIn = new Date(y, m0 + 1, 0).getDate();
  const t = i.today;
  const partial = t.getFullYear() === y && t.getMonth() === m0;
  const upto = partial ? t.getDate() : daysIn;
  const ym = ymKey(y, m0);
  const day = (d: number): HDay => ({ ...BLANK, ...((i.hd.days || {})[keyOf(y, m0, d)] || {}) });

  // Health habits
  const daily: number[] = [];
  const spendDay: Record<string, boolean> = {};
  ((i.fin && i.fin.spends) || []).forEach((x) => { if (typeof x.date === 'string' && x.date.slice(0, 7) === ymKey(y, m0)) spendDay[x.date] = true; });
  const stepsL: number[] = [], waterL: number[] = [], sleepL: number[] = [], moodL: number[] = [], pcts: number[] = [];
  let stepDays = 0, waterDays = 0, sleepOk = 0, logged = 0, run = 0, streak = 0, relax = 0, goodMood = 0, lowMood = 0;
  let best = { d: 0, p: -1 }, worst = { d: 0, p: 101 };
  for (let d = 1; d <= upto; d++) {
    const x = day(d);
    const any = x.cups > 0 || x.sleep > 0 || x.steps > 0;
    if (!any) daily.push(spendDay[keyOf(y, m0, d)] ? 45 : -1);
    if (any) {
      logged++;
      const p = Math.round(((Math.min(x.cups / i.cg, 1)) + Math.min(x.sleep / 7, 1) + Math.min(x.steps / i.goal, 1)) / 3 * 100);
      daily.push(p); pcts.push(p); if (p > best.p) best = { d, p }; if (p < worst.p) worst = { d, p };
      if (p >= 70) { run++; streak = Math.max(streak, run); } else run = 0;
    } else run = 0;
    if (x.steps > 0) { stepsL.push(x.steps); if (x.steps >= i.goal) stepDays++; }
    if (x.cups > 0) { waterL.push(x.cups); if (x.cups >= i.cg) waterDays++; }
    if (x.sleep > 0) { sleepL.push(x.sleep); if (x.sleep >= 7) sleepOk++; }
    if (x.mood >= 0) { moodL.push(x.mood); if (x.mood >= 3) goodMood++; if (x.mood <= 1) lowMood++; }
    relax += ((x.rl || []) as any[]).reduce((s, r) => s + num(r && r.s), 0) / 60;
  }

  // Money (savings put into goals are not spending)
  const all = ((i.fin && i.fin.spends) || []).filter((s) => typeof s.date === 'string' && s.date.slice(0, 7) === ym && s.date.slice(8, 10) <= pad(upto));
  const spendL = all.filter((s) => s.cat !== 'Savings');
  const spent = spendL.reduce((a, s) => a + num(s.amt), 0);
  const saved = all.filter((s) => s.cat === 'Savings').reduce((a, s) => a + num(s.amt), 0);
  const income = Object.values((i.fin && i.fin.inc && i.fin.inc[ym]) || {}).reduce((a: number, b: any) => a + num(b), 0) as number;
  const byCat: Record<string, number> = {}; const byDay: Record<string, number> = {};
  spendL.forEach((s) => { const c = s.cat || 'Other'; byCat[c] = (byCat[c] || 0) + num(s.amt); byDay[s.date] = (byDay[s.date] || 0) + num(s.amt); });
  const cats = Object.keys(byCat).map((k) => [k, byCat[k]] as [string, number]).sort((a, b) => b[1] - a[1]);
  const spendDays = Object.keys(byDay).length;
  const topDay = Object.keys(byDay).map((k) => ({ d: +k.slice(8, 10), a: byDay[k] })).sort((a, b) => b.a - a.a)[0] || null;

  // Commitments (bills, loans) paid this month
  let cPaid = 0, cDue = 0, cCount = 0, cDone = 0;
  ((i.debts && i.debts.debts) || []).forEach((x: any) => {
    const paidBefore = Object.keys(x.paid || {}).filter((k) => k < ym).reduce((a, k) => a + num(x.paid[k]), 0);
    const live = (x.since || '') <= ym && (x.fixed || num(x.paid && x.paid[ym]) > 0 || num(x.bal) - paidBefore > 0.005);
    if (!live) return;
    cCount++; const p = num(x.paid && x.paid[ym]); cPaid += p; cDue += p > 0 ? p : x.fixed ? num(x.monthly) : Math.min(num(x.monthly), Math.max(0, num(x.bal) - paidBefore));
    if (p > 0) cDone++;
  });

  // Tasks and events
  const tasks = ((i.pl && i.pl.tasks) || []).filter((x) => x.due && x.due.slice(0, 7) === ym && +x.due.slice(8, 10) <= upto);
  const tasksDone = tasks.filter((x) => x.status === 'done').length;
  const events = ((i.pl && i.pl.events) || []).filter((x) => x.date && x.date.slice(0, 7) === ym && +x.date.slice(8, 10) <= upto);
  const eventsDone = events.filter((x) => x.done).length;

  // Fasting (the days the person ticked)
  const fast = { r: 0, s: 0, q: 0 } as Record<string, number>;
  Object.keys((i.puasa && i.puasa.days) || {}).forEach((k) => { if (k.slice(0, 7) === ym) { const v = (i.puasa.days as any)[k]; if (v === 'r' || v === 's' || v === 'q') fast[v]++; } });

  // Vehicle: distance from odometer readings and fuel stops in the month
  let km = 0, fuel = 0, litres = 0;
  Object.keys((i.rec && i.rec.data) || {}).forEach((vk) => {
    const v = i.rec.data[vk] || {};
    const odos: number[] = [];
    (v.readings || []).forEach((r) => { if (r.date && r.date.slice(0, 7) === ym && num(r.odo) > 0) odos.push(r.odo); });
    (v.fuel || []).forEach((f) => { if (f.date && f.date.slice(0, 7) === ym) { fuel += num(f.amt); litres += num(f.liters); if (num(f.odo) > 0) odos.push(f.odo); } });
    if (odos.length >= 2) km += Math.max(...odos) - Math.min(...odos);
  });

  return {
    ym, y, m0, daysIn, upto, partial, logged, daily,
    steps: { avg: avg(stepsL), days: stepDays, n: stepsL.length }, water: { avg: avg(waterL), days: waterDays, n: waterL.length },
    sleep: { avg: avg(sleepL), ok: sleepOk, n: sleepL.length }, mood: { avg: avg(moodL), n: moodL.length, good: goodMood, low: lowMood },
    healthPct: Math.round(avg(pcts)), streak, relax: Math.round(relax), best, worst,
    income, spent, saved, cats, spendDays, topDay, noSpend: spendDays > 0 ? upto - spendDays : 0, perDay: upto > 0 ? spent / upto : 0,
    cPaid, cDue, cCount, cDone, tasks: tasks.length, tasksDone, events: events.length, eventsDone, fast, km, fuel, litres,
  };
}

const MON_OF = (y: number, m0: number) => MONTHS[m0] + ' ' + y;

export function buildMonth(i: MIn, y: number, m0: number): MSum {
  const c = calc(i, y, m0);
  const py = m0 === 0 ? y - 1 : y, pm = m0 === 0 ? 11 : m0 - 1;
  const p = calc(i, py, pm);
  const rm = i.rm; const H = i.on.habit, F = i.on.finance, P = i.on.planner, I = i.on.islamic, R = i.on.record;
  const full = !c.partial; // totals are only compared with the month before when this month is complete
  const sections: MSec[] = []; const wins: string[] = []; const improve: string[] = []; const advice: string[] = []; const focus: string[] = [];
  const parts: number[] = []; const stats: { l: string; v: string }[] = [];
  const hasH = H && c.logged >= 3, hasM = F && (c.spent > 0 || c.income > 0 || c.cDue > 0), hasT = P && c.tasks + c.events > 0;
  const hasF = I && c.fast.r + c.fast.s + c.fast.q > 0, hasV = R && (c.km > 0 || c.fuel > 0);
  const sub = (x: number, a: number) => (a > 0 ? Math.round(x / a * 100) : 0);

  // ----- Health -----
  if (hasH) {
    const rows: MRow[] = [];
    rows.push({ l: 'Days you logged', v: c.logged + ' of ' + c.upto });
    if (c.steps.n) rows.push({ l: 'Steps a day', v: Math.round(c.steps.avg).toLocaleString(), d: p.steps.n ? pctChange(c.steps.avg, p.steps.avg) : null, good: c.steps.avg >= p.steps.avg });
    if (c.steps.n) rows.push({ l: 'Step goal reached', v: c.steps.days + (c.steps.days === 1 ? ' day' : ' days') });
    if (c.water.n) rows.push({ l: 'Water goal reached', v: c.water.days + (c.water.days === 1 ? ' day' : ' days') });
    if (c.sleep.n) rows.push({ l: 'Sleep a night', v: r1(c.sleep.avg) + ' h', d: p.sleep.n ? pctChange(c.sleep.avg, p.sleep.avg) : null, good: c.sleep.avg >= p.sleep.avg });
    if (c.mood.n) rows.push({ l: 'Mood on most days', v: MOODN[clamp(Math.round(c.mood.avg), 0, 4)] });
    if (c.streak >= 2) rows.push({ l: 'Longest good streak', v: c.streak + ' days' });
    if (c.relax > 0) rows.push({ l: 'Relax time', v: c.relax + ' min' });
    sections.push({ k: 'health', title: 'Body and habits', c: '#34d399', pct: c.healthPct, rows });
    parts.push(c.healthPct);
    if (c.steps.n) stats.push({ l: 'Steps a day', v: Math.round(c.steps.avg).toLocaleString() });
    // wins
    if (c.steps.days >= 10) wins.push('You reached your step goal on ' + c.steps.days + ' days.');
    if (c.water.days >= 10) wins.push('You drank enough water on ' + c.water.days + ' days.');
    if (c.sleep.n >= 7 && c.sleep.avg >= 7) wins.push('You slept ' + r1(c.sleep.avg) + ' h a night on average, right in a healthy range.');
    if (c.streak >= 5) wins.push('You kept a good streak going for ' + c.streak + ' days in a row.');
    if (c.mood.n >= 7 && c.mood.good / c.mood.n >= 0.6) wins.push('Your mood was Good or Great on most of the days you rated.');
    if (c.relax >= 60) wins.push('You gave yourself ' + c.relax + ' minutes of relax time.');
    if (p.steps.n && c.steps.n && full && c.steps.avg > p.steps.avg * 1.1) wins.push('You walked ' + pctChange(c.steps.avg, p.steps.avg) + '% more each day than the month before.');
    // improve and advice
    if (c.sleep.n >= 5 && c.sleep.avg < 7) { improve.push('Your sleep averaged ' + r1(c.sleep.avg) + ' h, a little under 7 h.'); advice.push('Try going to bed 20 minutes earlier for a week, then add another 20. Small steps stick better than a big change.'); }
    if (c.steps.n >= 5 && c.steps.avg < i.goal * 0.7) { improve.push('Steps averaged ' + Math.round(c.steps.avg).toLocaleString() + ' a day, under your goal of ' + i.goal.toLocaleString() + '.'); advice.push('A short walk after a meal adds up fast. Ten minutes is around 1,000 steps.'); }
    if (c.water.n >= 5 && c.water.days < c.water.n / 2) { improve.push('You reached your water goal on only ' + c.water.days + ' of ' + c.water.n + ' days you logged water.'); advice.push('Keep a bottle where you work and finish one glass as soon as you wake up.'); }
    if (c.mood.n >= 7 && c.mood.low / c.mood.n >= 0.4) { improve.push('Mood was Low on ' + c.mood.low + ' days.'); advice.push('Look at the days your mood was best. What did you do that day: sleep, walk, time with people? Do a bit more of that. If low days keep coming, talking to someone you trust or a health professional can help.'); }
    if (c.logged < c.upto * 0.5) { improve.push('You logged habits on only ' + c.logged + ' of ' + c.upto + ' days.'); advice.push('Log at the same moment each day, for example when you brush your teeth at night. It takes under a minute and makes this summary far more accurate.'); }
    // focus
    if (c.sleep.n && c.sleep.avg < 7) focus.push('Sleep at least 7 h on ' + Math.min(20, Math.max(10, c.sleep.ok + 5)) + ' nights.');
    if (c.steps.n && c.steps.avg < i.goal) focus.push('Raise your daily steps to ' + (Math.round((Math.min(i.goal, c.steps.avg * 1.1)) / 100) * 100).toLocaleString() + ' on average.');
    if (c.water.n && c.water.days < c.upto * 0.6) focus.push('Reach your water goal on ' + Math.min(c.daysIn, c.water.days + 5) + ' days.');
  }

  // ----- Money -----
  if (hasM) {
    const rows: MRow[] = [];
    if (c.income > 0) rows.push({ l: 'Income', v: rm(c.income) });
    if (c.spent > 0 || c.income > 0) rows.push({ l: 'Spent', v: rm(c.spent), d: full && p.spent > 0 ? pctChange(c.spent, p.spent) : null, good: c.spent <= p.spent });
    if (c.income > 0 && c.spent > 0) { const left = c.income - c.spent; rows.push({ l: left >= 0 ? 'Left over' : 'Over income by', v: rm(Math.abs(left)) }); }
    if (c.saved > 0) rows.push({ l: 'Put into savings', v: rm(c.saved) });
    if (c.spent > 0) rows.push({ l: 'Average a day', v: rm(c.perDay) });
    c.cats.slice(0, 3).forEach((k) => rows.push({ l: k[0], v: rm(k[1]) + ' · ' + sub(k[1], c.spent) + '%' }));
    if (c.topDay && c.spent > 0) rows.push({ l: 'Biggest day', v: c.topDay.d + ' ' + MONTHS[m0].slice(0, 3) + ' · ' + rm(c.topDay.a) });
    if (c.noSpend >= 3) rows.push({ l: 'Days with no spending', v: String(c.noSpend) });
    if (c.cCount > 0) rows.push({ l: 'Bills and loans paid', v: c.cDone + ' of ' + c.cCount });
    let mp = 0;
    if (c.income > 0 && c.spent > 0) { const rate = (c.income - c.spent) / c.income; mp = rate >= 0.2 ? 100 : rate >= 0.1 ? 85 : rate >= 0 ? 65 : 30; }
    if (c.cCount > 0) { const cp = Math.round((c.cDone / c.cCount) * 100); mp = mp > 0 ? Math.round((mp + cp) / 2) : cp; }
    sections.push({ k: 'money', title: 'Money', c: '#ffc46b', pct: mp > 0 ? mp : undefined, rows });
    if (mp > 0) parts.push(mp);
    if (c.spent > 0) stats.push({ l: 'Spent', v: rm(c.spent) });
    if (c.income > 0 && c.income > c.spent && c.spent > 0) { const rate = Math.round(((c.income - c.spent) / c.income) * 100); if (rate >= 20) wins.push('You kept ' + rate + '% of your income. Saving 20% or more is a strong habit.'); else if (rate >= 5) wins.push('You spent less than you earned and kept ' + rate + '% of your income.'); }
    if (c.saved > 0) wins.push('You put ' + rm(c.saved) + ' into your savings goals.');
    if (c.cCount > 0 && c.cDone === c.cCount) wins.push('Every bill and loan was paid this month.');
    if (c.noSpend >= 5) wins.push('You had ' + c.noSpend + ' days with no spending.');
    if (full && p.spent > 0 && c.spent > 0 && c.spent < p.spent * 0.9) wins.push('You spent ' + Math.abs(pctChange(c.spent, p.spent) as number) + '% less than the month before.');
    if (c.income > 0 && c.spent > c.income) { improve.push('You spent ' + rm(c.spent - c.income) + ' more than you earned.'); advice.push('Look at your biggest category first, since that is where a small cut saves the most. Pay bills first, then set a daily amount for everything else.'); }
    if (full && p.spent > 0 && c.spent > p.spent * 1.2) { improve.push('Spending was up ' + pctChange(c.spent, p.spent) + '% on the month before.'); advice.push('Check the biggest day and the top category. One large purchase can explain most of a jump.'); }
    if (c.cats.length && c.spent > 0 && c.cats[0][1] / c.spent >= 0.4 && c.cats.length > 1) { improve.push(c.cats[0][0] + ' took ' + sub(c.cats[0][1], c.spent) + '% of your spending.'); advice.push('When one category is this big, a small change there beats cutting many small things.'); }
    if (c.cCount > 0 && c.cDone < c.cCount) { improve.push(c.cCount - c.cDone + (c.cCount - c.cDone === 1 ? ' bill or loan was' : ' bills or loans were') + ' not marked paid.'); advice.push('Set a reminder two days before each due date so nothing is missed or paid late.'); }
    if (c.income > 0 && c.saved === 0 && c.income > c.spent) advice.push('You had money left over. Moving even a small part to a savings goal on payday keeps it from being spent.');
    if (c.spent > 0) { const target = full && p.spent > 0 ? Math.min(c.spent, p.spent) * 0.95 : c.spent * 0.95; focus.push('Keep spending under ' + rm(Math.round(target / 10) * 10) + '.'); }
    if (c.cCount > 0 && c.cDone < c.cCount) focus.push('Pay every bill and loan on time.');
    if (c.income > 0 && c.saved === 0) focus.push('Put something into savings on payday.');
  }

  // ----- Tasks -----
  if (hasT) {
    const tot = c.tasks + c.events, done = c.tasksDone + c.eventsDone; const tp = Math.round((done / tot) * 100);
    const rows: MRow[] = [];
    if (c.tasks) rows.push({ l: 'Tasks done', v: c.tasksDone + ' of ' + c.tasks });
    if (c.events) rows.push({ l: 'Events done', v: c.eventsDone + ' of ' + c.events });
    sections.push({ k: 'tasks', title: 'Planner', c: '#7c9cff', pct: tp, rows });
    parts.push(tp);
    if (tot >= 5 && tp >= 80) wins.push('You finished ' + done + ' of ' + tot + ' tasks and events planned for the month.');
    if (tot - done >= 3) { improve.push(tot - done + ' planned tasks or events were left undone.'); advice.push('Plan fewer things for each day, three at most. Move the rest to another day instead of leaving them overdue.'); }
    if (tot - done >= 3) focus.push('Finish at least ' + Math.min(tot, done + 3) + ' planned tasks.');
  }

  // ----- Faith -----
  if (hasF) {
    const rows: MRow[] = [];
    if (c.fast.r) rows.push({ l: 'Ramadan days fasted', v: String(c.fast.r) });
    if (c.fast.s) rows.push({ l: 'Sunnah fasts', v: String(c.fast.s) });
    if (c.fast.q) rows.push({ l: 'Qadha fasts made up', v: String(c.fast.q) });
    sections.push({ k: 'faith', title: 'Faith', c: '#8fe9e2', rows });
    if (c.fast.s >= 4) wins.push('You kept ' + c.fast.s + ' sunnah fasts.');
    if (c.fast.q >= 1) wins.push('You made up ' + c.fast.q + (c.fast.q === 1 ? ' qadha fast.' : ' qadha fasts.'));
    if (c.fast.r >= 20) wins.push('You fasted ' + c.fast.r + ' days of Ramadan.');
  }

  // ----- Vehicle -----
  if (hasV) {
    const rows: MRow[] = [];
    if (c.km > 0) rows.push({ l: 'Distance ridden or driven', v: Math.round(c.km).toLocaleString() + ' km' });
    if (c.fuel > 0) rows.push({ l: 'Fuel spending', v: rm(c.fuel) });
    if (c.fuel > 0 && c.km > 0) rows.push({ l: 'Fuel cost per km', v: rm(c.fuel / c.km) });
    if (c.litres > 0 && c.km > 0) rows.push({ l: 'Distance per litre', v: r1(c.km / c.litres) + ' km' });
    sections.push({ k: 'vehicle', title: 'Vehicle', c: '#ff9f6b', rows });
  }

  const hasData = sections.length > 0;
  const score = parts.length ? Math.round(avg(parts)) : null;
  const name = MONTHS[m0];
  const headline = !hasData ? 'Nothing logged in ' + name : score === null ? 'Your ' + name + ' at a glance' : score >= 80 ? 'A strong ' + name : score >= 60 ? 'A steady ' + name : 'A building ' + name;

  // The story: a few plain sentences about the month
  const s: string[] = [];
  if (hasH) {
    const bits: string[] = [];
    if (c.steps.n) bits.push('walked about ' + Math.round(c.steps.avg).toLocaleString() + ' steps a day');
    if (c.sleep.n) bits.push('slept ' + r1(c.sleep.avg) + ' h a night');
    if (c.mood.n) bits.push('felt ' + MOODN[clamp(Math.round(c.mood.avg), 0, 4)].toLowerCase() + ' on most days');
    if (bits.length) s.push((c.partial ? 'So far this month you ' : 'In ' + name + ' you ') + bits.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.');
  }
  if (hasM && c.spent > 0) {
    s.push('You spent ' + rm(c.spent) + (c.income > 0 ? ' from ' + rm(c.income) + ' income' + (c.income >= c.spent ? ', keeping ' + rm(c.income - c.spent) + '.' : ', which is ' + rm(c.spent - c.income) + ' more than you earned.') : '.'));
  }
  if (hasT) s.push('You completed ' + (c.tasksDone + c.eventsDone) + ' of ' + (c.tasks + c.events) + ' planned tasks and events.');
  if (hasF && c.fast.s + c.fast.r + c.fast.q > 0) s.push('You fasted ' + (c.fast.s + c.fast.r + c.fast.q) + ' days.');
  const story = hasData ? s.join(' ') : 'Log your habits, spending or tasks during the month and your summary will appear here on the 1st.';

  // Always finish with a short, kind line and a general tip so the page never ends empty
  if (hasData && wins.length === 0) wins.push('You kept using My Life 1.0 this month, and that is the habit that makes everything else easier.');
  if (hasData && improve.length === 0) improve.push('Nothing stands out as a problem. Keep your routine going.');
  if (hasData && advice.length === 0) advice.push('Your month looks balanced. Pick one small thing to push a little further next month, rather than changing everything at once.');
  if (hasData && focus.length === 0) focus.push('Keep your current routine and log on most days.');
  if (hasData && c.logged < c.upto * 0.5 && !improve.some((x) => x.indexOf('logged') >= 0)) improve.push('Habits were logged on only ' + c.logged + ' of ' + c.upto + ' days.');
  if (hasData && !c.partial) focus.push('Look at this page again on the 1st and see what changed.');

  return {
    ym: ymKey(y, m0), label: MON_OF(y, m0), name, partial: c.partial, daysIn: c.daysIn, upto: c.upto, logged: c.logged, hasData, score, headline, story, daily: c.daily,
    stats: stats.slice(0, 3), sections, wins: wins.slice(0, 5), improve: improve.slice(0, 5), advice: advice.slice(0, 5), focus: focus.slice(0, 5),
  };
}

/** The month before today's month, as [year, month 0-11]. */
export const lastMonthOf = (d: Date): [number, number] => (d.getMonth() === 0 ? [d.getFullYear() - 1, 11] : [d.getFullYear(), d.getMonth() - 1]);
/** Show the "your month" card on the Dashboard from the 1st until this many days into the month. */
export const DASH_DAYS = 7;
