import { goalSaved } from './savings';
import { useEffect } from 'react';
import { useStored, getItem, getItemStrict, setItem } from './store';
import { HEMPTY, HData, keyOfDate, dateOf, cupsGoal, getDay, bestStreakAll, BLANK } from './habit';
import { DEBT_EMPTY, DebtData, debtSummary, ymOf } from './debts';
import { commitFor } from './moneyLeft';
import { PUASA_EMPTY, PuasaData } from './fasting';
import { Fin, Pl, scoreParts, lifeScore, incomeOf, Core } from './insights';
import { TG_DEFAULT, Toggles } from './adhan';
import { LockCfg, LOCK_OFF, useLock, loadLock } from './lock';

// Everything the Assistant knows comes from here: the same saved data the rest of the app uses.
export type Real = {
  ready: boolean;
  hd: HData; goal: number; cupGoal: number; steps: number; cups: number; sleep: number; mood: number; // mood 1 to 5, 0 = not logged
  score: number; streak: number;
  fin: Fin; income: number; spendToday: number; spendMonth: number; cats: Record<string, number>; hasSpend: boolean;
  tasks: { n: string; d: string; s: string }[]; events: { n: string; d: string }[];
  hasVehicle: boolean; odo: number; kmMonth: number | null; kmLast: number | null; mtcMonth: number; nextSvc: number | null; nextSvcName: string;
  debts: DebtData; puasa: PuasaData;
  tg: Toggles; lock: LockCfg;
  P: [string, number, number][]; // prayer times today, empty when the place is not known yet
  spends: { id: number; name: string; cat: string; amt: number; date: string }[]; days: Record<string, { mood: number; cups: number; sleep: number; steps: number }>;
  plTasks: { id: number; name: string; due: string; prio: string; status: string }[]; plEvents: { id: number; name: string; date: string; done: boolean }[];
  incomeLast: number; commit: number; limits: Record<string, number>; goals: { id: number; name: string; target: number; place: string; due: string; saved: number }[];
};

const td = () => keyOfDate(new Date());
function incomeLastMonth(fin: any): number { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); const row = (fin && fin.inc && fin.inc[k]) || {}; return Object.keys(row).reduce((a, n) => a + (Number(row[n]) || 0), 0); }
const num = (x: any) => (typeof x === 'number' && isFinite(x) ? x : 0);

type RecVeh = { readings?: { date: string; odo: number }[]; exps?: { name: string; amt: number; date: string }[]; parts?: { name: string; odo: number; life: number }[] };
type RecData = { cats: string[]; sel: number; data: Record<string, RecVeh>; nextId: number };

function kmBetween(sorted: { date: string; odo: number }[], from: string, to: string): number | null {
  const inR = sorted.filter((r) => r.date >= from && r.date < to); if (!inR.length) return null;
  const before = sorted.filter((r) => r.date < from);
  if (before.length) return Math.max(0, inR[inR.length - 1].odo - before[before.length - 1].odo);
  if (inR.length >= 2) return Math.max(0, inR[inR.length - 1].odo - inR[0].odo);
  return null;
}

export function useReal(P: [string, number, number][]): Real {
  const [hd, , o1] = useStored<HData>('ml_habit', HEMPTY);
  const [fin, , o2] = useStored<Fin>('ml_finance', { inc: {}, spends: [] } as any);
  const [pl, , o3] = useStored<Pl>('ml_planner', { events: [], tasks: [] } as any);
  const [rec, , o4] = useStored<RecData>('ml_record', { cats: ['Motorcycle'], sel: 0, data: {}, nextId: 1 });
  const [tas, , o5] = useStored<{ day: string; total: number }>('ml_tasbih', { day: '', total: 0 });
  const [debts, , o6] = useStored<DebtData>('ml_debts', DEBT_EMPTY);
  const [sav, , o9] = useStored<any>('ml_savings', { goals: [], nextId: 1 });
  const [puasa, , o7] = useStored<PuasaData>('ml_puasa', PUASA_EMPTY);
  const [tgRaw, , o8] = useStored<Partial<Toggles>>('ml_toggles', {});
  const { cfg: lockRaw } = useLock();
  useEffect(() => { loadLock(); }, []);
  const ready = o1 && o2 && o3 && o4 && o5 && o6 && o7 && o8 && o9;

  const t = getDay(hd, 0); const cg = cupsGoal(hd);
  const core: Core = { hd, fin, pl, rec: { data: (rec.data || {}) as any }, tas, debts, puasa, sav: ((sav && sav.goals) ? sav : { goals: [], nextId: 1 }), off: {}, setOff: () => {} };
  const spends = (fin && fin.spends) || [];
  const ym = ymOf(new Date()); const today = td();
  let spendToday = 0, spendMonth = 0; const cats: Record<string, number> = {};
  spends.filter((x) => x.cat !== 'Savings').forEach((x) => { const a = num(x.amt); if (x.date === today) spendToday += a; if ((x.date || '').slice(0, 7) === ym) { spendMonth += a; const c = x.cat || 'Other'; cats[c] = (cats[c] || 0) + a; } });

  const vname = (rec.cats && rec.cats[rec.sel]) || (rec.cats && rec.cats[0]) || 'Motorcycle';
  const v: RecVeh = (rec.data && rec.data[vname]) || {};
  const sorted = (v.readings || []).slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const now = new Date(); const pad = (n: number) => String(n).padStart(2, '0');
  const a0 = new Date(now.getFullYear(), now.getMonth(), 1), a1 = new Date(now.getFullYear(), now.getMonth() + 1, 1), b0 = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const k = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-01';
  const odo = sorted.length ? sorted[sorted.length - 1].odo : 0;
  const mtcMonth = (v.exps || []).filter((x) => (x.date || '').slice(0, 7) === ym).reduce((a, x) => a + num(x.amt), 0);
  let nextSvc: number | null = null, nextSvcName = '';
  (v.parts || []).forEach((p) => { const due = num(p.odo) + num(p.life); if (p.life > 0 && (nextSvc == null || due < nextSvc)) { nextSvc = due; nextSvcName = p.name; } });

  return {
    ready, hd, goal: hd.goal || 8000, cupGoal: cg, steps: t.steps, cups: t.cups, sleep: t.sleep, mood: t.mood >= 0 ? t.mood + 1 : 0,
    score: lifeScore(scoreParts(core, false)), streak: bestStreakAll(hd),
    fin: fin as Fin, income: incomeOf(core), spendToday: Math.round(spendToday * 100) / 100, spendMonth: Math.round(spendMonth * 100) / 100, cats, hasSpend: spends.length > 0,
    tasks: ((pl && pl.tasks) || []).map((x: any) => ({ n: x.name, d: x.due || '', s: x.status })), events: ((pl && pl.events) || []).filter((e: any) => !e.done).map((e: any) => ({ n: e.name, d: e.date })),
    hasVehicle: sorted.length > 0, odo, kmMonth: kmBetween(sorted, k(a0), k(a1)), kmLast: kmBetween(sorted, k(b0), k(a0)), mtcMonth: Math.round(mtcMonth * 100) / 100, nextSvc, nextSvcName,
    debts, puasa, tg: { ...TG_DEFAULT, ...tgRaw }, lock: lockRaw, P,
    goals: ((sav && sav.goals) || []).map((g: any) => ({ id: g.id, name: g.name, target: g.target, place: g.place || '', due: g.due || '', saved: goalSaved(g, spends as any, debts) })),
    spends: spends as any, days: (hd.days || {}) as any,
    plTasks: ((pl && pl.tasks) || []).map((x: any) => ({ id: x.id, name: x.name, due: x.due || '', prio: x.prio || 'Medium', status: x.status })),
    plEvents: ((pl && pl.events) || []).map((e: any) => ({ id: e.id, name: e.name, date: e.date, done: !!e.done })),
    incomeLast: incomeLastMonth(fin), commit: commitFor(debts, ym), limits: ((fin as any).limits || {}) as Record<string, number>,
  };
}

// Writes what the Assistant was asked to save into the same places the screens use.
export async function persist(a: any): Promise<void> {
  const today = td(); const id = Date.now();
  if (a.type === 'spend') {
    const f: any = await getItemStrict('ml_finance', { inc: {}, cnt: {}, spends: [], nextId: 1 }); if (f === null) return;
    const nid = f.nextId || 1;
    await setItem('ml_finance', { ...f, spends: [{ id: nid, name: a.name, cat: a.cat, amt: a.amt, date: a.date || today }, ...(f.spends || [])], nextId: nid + 1 });
  } else if (a.type === 'inc') {
    const f: any = await getItemStrict('ml_finance', { inc: {}, cnt: {}, spends: [], nextId: 1 }); if (f === null) return;
    const ym = ymOf(new Date()); const inc = { ...(f.inc || {}) }; const row = { ...(inc[ym] || {}) };
    row[a.name] = (row[a.name] || 0) + a.amt; inc[ym] = row;
    await setItem('ml_finance', { ...f, inc });
  } else if (a.type === 'mtc' || a.type === 'odo') {
    const r: any = await getItemStrict('ml_record', { cats: ['Motorcycle'], sel: 0, data: {}, nextId: 1 }); if (r === null) return;
    const cats = r.cats && r.cats.length ? r.cats : ['Motorcycle']; const name = cats[r.sel] || cats[0];
    const v = { readings: [], yreadings: [], exps: [], ...(r.data && r.data[name] || {}) };
    let nid = r.nextId || 1;
    if (a.type === 'mtc') { v.exps = [...v.exps, { id: nid++, name: a.name, amt: a.amt, date: today }]; if (a.odo) v.readings = [...v.readings, { id: nid++, date: today, odo: a.odo }]; }
    else v.readings = [...v.readings, { id: nid++, date: today, odo: a.val }];
    await setItem('ml_record', { ...r, cats, data: { ...(r.data || {}), [name]: v }, nextId: nid });
  } else if (a.type === 'steps' || a.type === 'sleep' || a.type === 'mood' || a.type === 'cups') {
    const h: any = await getItemStrict('ml_habit', HEMPTY); if (h === null) return;
    const cur = { ...BLANK, ...((h.days || {})[today] || {}) };
    if (a.type === 'steps') cur.steps = (cur.steps || 0) + a.n;
    if (a.type === 'sleep') cur.sleep = a.h;
    if (a.type === 'mood') cur.mood = a.v - 1;
    if (a.type === 'cups') cur.cups = a.c;
    await setItem('ml_habit', { ...h, days: { ...(h.days || {}), [today]: cur } });
  } else if (a.type === 'task') {
    const p: any = await getItemStrict('ml_planner', { events: [], tasks: [], cats: ['Tasks'], nextId: 1 }); if (p === null) return;
    const nid = p.nextId || 1;
    await setItem('ml_planner', { ...p, nextId: nid + 1, tasks: [...(p.tasks || []), { id: nid, name: a.name, note: '', prio: a.prio || 'Medium', due: a.due || '', cat: (p.cats && p.cats[0]) || 'Tasks', status: 'todo' }] });
  } else if (a.type === 'event') {
    const p: any = await getItemStrict('ml_planner', { events: [], tasks: [], cats: ['Tasks'], nextId: 1 }); if (p === null) return;
    const nid = p.nextId || 1;
    await setItem('ml_planner', { ...p, nextId: nid + 1, events: [...(p.events || []), { id: nid, name: a.name, date: a.date, remind: a.remind || '1 day before', done: false }] });
  } else if (a.type === 'taskdone') {
    const p: any = await getItemStrict('ml_planner', { events: [], tasks: [], cats: ['Tasks'], nextId: 1 }); if (p === null) return;
    await setItem('ml_planner', { ...p, tasks: (p.tasks || []).map((x: any) => (x.id === a.id ? { ...x, status: 'done' } : x)) });
  } else if (a.type === 'undoSpend') {
    const f: any = await getItemStrict('ml_finance', { inc: {}, cnt: {}, spends: [], nextId: 1 }); if (f === null) return;
    await setItem('ml_finance', { ...f, spends: (f.spends || []).filter((x: any) => x.id !== a.id) });
  } else if (a.type === 'note') {
    const n: any = await getItemStrict('ml_notes', { notes: [], seq: 1 }); if (n === null) return;
    const id = n.seq || 1;
    await setItem('ml_notes', { notes: [{ id, t: a.title || '', s: a.text, c: 6, pin: false, u: Date.now(), r: '' }, ...(n.notes || [])], seq: id + 1 });
  }
}
