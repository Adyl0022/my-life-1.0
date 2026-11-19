import { useEffect, useMemo } from 'react';
import { useStored } from './store';
import { useSession } from './auth';
import { HData, HEMPTY, bestStreakAll, MON } from './habit';

// "Your Memories with My Life": everything here is worked out on the phone from data the app already saves for the signed-in person.
// Nothing is made up. Only two small things are stored: which memories the person chose to hide, and the day a badge was first seen unlocked.
export type MemSave = { hide: string[]; badges: Record<string, string>; dash: boolean };
export const MEM_EMPTY: MemSave = { hide: [], badges: {}, dash: true };

export type Mem = { id: string; date: string; kind: 'start' | 'milestone' | 'note' | 'task' | 'plan' | 'job' | 'part' | 'badge'; title: string; sub?: string };
export type Badge = { id: string; title: string; how: string; icon: string; color: string; cur: number; goal: number; ok: boolean; at?: string };

export const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const parse = (s: string) => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); };
export const nice = (s: string) => { const d = parse(s); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); };
const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
const valid = (s: any): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s);
const cut = (s: string, n = 60) => { const t = s.replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

export type Memories = {
  ready: boolean; start: string | null; days: number; mem: MemSave; setMem: (m: MemSave) => void;
  nums: { notes: number; tasks: number; plans: number; habits: number; records: number };
  items: Mem[]; hiddenCount: number; allItems: Mem[]; onThisDay: { when: string; item: Mem }[]; habitDays: { when: string; date: string; text: string }[];
  badges: Badge[]; undated: number; years: number[];
  review: (y: number) => { year: number; tasks: number; notes: number; plans: number; jobs: number; habitDays: number; steps: number; months: number[]; best: number; bestName: string; badges: Badge[]; marks: Mem[] };
};

export function useMemories(): Memories {
  const [sess, sok] = useSession();
  const [mem, setMem, mok] = useStored<MemSave>('ml_memories', MEM_EMPTY);
  const [h] = useStored<HData>('ml_habit', HEMPTY);
  const [pl] = useStored<any>('ml_planner', { events: [], tasks: [] });
  const [nt] = useStored<any>('ml_notes', { notes: [] });
  const [rec] = useStored<any>('ml_record', { data: {} });
  const ca = sess?.user?.created_at; const start = ca && !isNaN(new Date(ca).getTime()) ? ymd(new Date(ca)) : null;
  const today = ymd(new Date());
  const m: MemSave = { hide: (mem && mem.hide) || [], badges: (mem && mem.badges) || {}, dash: !mem || mem.dash !== false };

  const calc = useMemo(() => {
    const notes: any[] = (nt && nt.notes) || []; const tasks: any[] = (pl && pl.tasks) || []; const events: any[] = (pl && pl.events) || [];
    const done = tasks.filter((t) => t.status === 'done'); const planDone = events.filter((e) => e.done);
    const hdays = Object.entries((h && h.days) || {}).filter(([k, x]: [string, any]) => valid(k) && (x.cups > 0 || x.sleep > 0 || x.steps > 0 || x.mood >= 0 || (x.med && x.med.length) || x.bed));
    const cats: any[] = Object.values((rec && rec.data) || {});
    const jobs: { name: string; date: string; veh: string }[] = []; const parts: { name: string; date: string }[] = []; let recCount = 0; let recFirst = '';
    const seen = (d: any) => { if (valid(d) && (!recFirst || d < recFirst)) recFirst = d.slice(0, 10); };
    Object.entries((rec && rec.data) || {}).forEach(([veh, c]: [string, any]) => {
      if (!c) return;
      (c.readings || []).forEach((r: any) => { recCount++; seen(r.date); }); (c.yreadings || []).forEach((r: any) => { recCount++; seen(r.date); });
      (c.exps || []).forEach((r: any) => { recCount++; seen(r.date); }); (c.fuel || []).forEach((r: any) => { recCount++; seen(r.date); });
      (c.docs || []).forEach((r: any) => { recCount++; seen(r.date); });
      (c.parts || []).forEach((r: any) => { recCount++; seen(r.date); if (valid(r.date)) parts.push({ name: r.name, date: r.date.slice(0, 10) }); });
      (c.tasks || []).forEach((t: any) => (t.hist || []).forEach((d: string) => { recCount++; seen(d); if (valid(d)) jobs.push({ name: t.name, date: d.slice(0, 10), veh }); }));
      ['roadtax', 'insurance', 'licence'].forEach((k) => { if (c.renew && c.renew[k]) recCount++; });
    });
    const nums = { notes: notes.length, tasks: done.length, plans: planDone.length, habits: hdays.length, records: recCount };
    const all: Mem[] = [];
    if (start) {
      all.push({ id: 'start', date: start, kind: 'start', title: 'You joined My Life', sub: 'Day one of your journey' });
      [[30, '30 days together'], [100, '100 days together'], [365, 'One year with My Life']].forEach(([n, t]) => { const d = addDays(start, (n as number) - 1); if (d <= today) all.push({ id: 'ms' + n, date: d, kind: 'milestone', title: t as string, sub: 'A milestone you reached just by showing up' }); });
    }
    notes.forEach((n) => { if (n.cr) all.push({ id: 'note' + n.id, date: ymd(new Date(n.cr)), kind: 'note', title: 'Wrote a note', sub: cut(n.t || n.s || 'Untitled note') }); });
    done.forEach((t) => { if (valid(t.doneAt)) all.push({ id: 'task' + t.id, date: t.doneAt.slice(0, 10), kind: 'task', title: 'Finished a task', sub: cut(t.name) }); });
    planDone.forEach((e) => { if (valid(e.doneAt)) all.push({ id: 'plan' + e.id, date: e.doneAt.slice(0, 10), kind: 'plan', title: 'Plan achieved', sub: cut(e.name) }); });
    jobs.forEach((j) => all.push({ id: 'job' + j.veh + j.name + j.date, date: j.date, kind: 'job', title: 'Looked after your ' + j.veh.toLowerCase(), sub: j.name }));
    parts.forEach((p) => all.push({ id: 'part' + p.name + p.date, date: p.date, kind: 'part', title: 'Changed a part', sub: cut(p.name) }));
    const undated = done.filter((t) => !valid(t.doneAt)).length + notes.filter((n) => !n.cr).length + planDone.filter((e) => !valid(e.doneAt)).length;
    const minOf = (l: string[]) => (l.length ? l.sort()[0] : undefined);
    const firstNote = minOf(notes.filter((n) => n.cr).map((n) => ymd(new Date(n.cr))));
    const firstTask = minOf(done.filter((t) => valid(t.doneAt)).map((t) => t.doneAt.slice(0, 10)));
    const firstPlan = minOf(planDone.filter((e) => valid(e.doneAt)).map((e) => e.doneAt.slice(0, 10)));
    const days = start ? Math.max(1, Math.floor((parse(today).getTime() - parse(start).getTime()) / 86400000) + 1) : 0;
    const streak = bestStreakAll(h || HEMPTY);
    const B = (id: string, title: string, how: string, icon: string, color: string, cur: number, goal: number, at?: string): Badge => ({ id, title, how, icon, color, cur: Math.min(cur, goal), goal, ok: cur >= goal, at });
    const badges: Badge[] = [
      B('first-note', 'First Note', 'Write your first note', '📝', '#ffb45e', nums.notes, 1, firstNote),
      B('notes-10', '10 Notes', 'Keep 10 notes', '🗒️', '#ff9a8b', nums.notes, 10),
      B('first-task', 'First Task Done', 'Finish a task', '✅', '#5ee7b5', nums.tasks, 1, firstTask),
      B('tasks-100', 'First 100 Tasks', 'Finish 100 tasks', '🏆', '#ffd24a', nums.tasks, 100),
      B('first-plan', 'Plan Achieved', 'Mark an event as done', '🎯', '#8ea8ff', nums.plans, 1, firstPlan),
      B('habit-7', '7-Day Habit Streak', 'Reach 70% of your daily goal 7 days in a row', '🔥', '#ff8fab', streak, 7),
      B('habit-30', '30-Day Habit Streak', 'Reach 70% of your daily goal 30 days in a row', '🌟', '#b794ff', streak, 30),
      B('first-record', 'First Record', 'Save something in My Record', '🏍️', '#7df0c6', nums.records, 1, recFirst || undefined),
      B('records-50', '50 Records', 'Save 50 records', '📚', '#5ee7df', nums.records, 50),
      B('days-30', '30 Days with My Life', 'Use My Life for 30 days', '🌱', '#7df0a0', days, 30, start ? addDays(start, 29) : undefined),
      B('days-100', '100 Days with My Life', 'Use My Life for 100 days', '🌿', '#34d399', days, 100, start ? addDays(start, 99) : undefined),
      B('first-year', 'First Year with My Life', 'Use My Life for one year', '🎂', '#ffb3c6', days, 365, start ? addDays(start, 364) : undefined),
    ];
    const years: number[] = []; if (start) for (let y = +start.slice(0, 4); y <= +today.slice(0, 4); y++) years.push(y);
    return { nums, all, undated, badges, days, hdays, years };
  }, [nt, pl, h, rec, start, today]);

  // Remember the day a badge was first seen unlocked (its own date when the app can tell, otherwise today). Nothing else is written.
  const ready = mok && sok;
  useEffect(() => {
    if (!ready || !start) return;
    const add: Record<string, string> = {}; calc.badges.forEach((b) => { if (b.ok && !m.badges[b.id]) add[b.id] = b.at && b.at <= today ? b.at : today; });
    if (Object.keys(add).length) setMem({ ...m, badges: { ...m.badges, ...add } });
  }, [ready, start, calc.badges]); // eslint-disable-line react-hooks/exhaustive-deps

  const badges = calc.badges.map((b) => ({ ...b, at: b.ok ? m.badges[b.id] || (b.at && b.at <= today ? b.at : today) : undefined }));
  const badgeItems: Mem[] = badges.filter((b) => b.ok && b.at).map((b) => ({ id: 'badge' + b.id, date: b.at as string, kind: 'badge', title: 'Badge unlocked: ' + b.title, sub: b.how }));
  const allItems = [...calc.all, ...badgeItems].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? 1 : -1));
  const items = allItems.filter((x) => !m.hide.includes(x.id));

  const td = parse(today);
  const onThisDay = items.filter((x) => x.date < today && parse(x.date).getDate() === td.getDate()).map((x) => {
    const d = parse(x.date); const months = (td.getFullYear() - d.getFullYear()) * 12 + (td.getMonth() - d.getMonth());
    const when = months % 12 === 0 ? (months / 12 === 1 ? '1 year ago' : months / 12 + ' years ago') : months === 1 ? '1 month ago' : months + ' months ago';
    return { when, item: x };
  });
  const habitDays = calc.hdays.filter(([k, x]: [string, any]) => k < today && parse(k).getDate() === td.getDate() && (x.steps > 0 || x.sleep > 0) && !m.hide.includes('hd' + k)).map(([k, x]: [string, any]) => {
    const d = parse(k); const months = (td.getFullYear() - d.getFullYear()) * 12 + (td.getMonth() - d.getMonth());
    const when = months % 12 === 0 ? (months / 12 === 1 ? '1 year ago' : months / 12 + ' years ago') : months === 1 ? '1 month ago' : months + ' months ago';
    const t: string[] = []; if (x.steps > 0) t.push(Math.round(x.steps).toLocaleString('en-GB') + ' steps'); if (x.sleep > 0) t.push(x.sleep.toFixed(1) + ' h of sleep'); if (x.cups > 0) t.push(x.cups + ' glasses of water');
    return { when, date: k, text: t.join(' · ') };
  }).sort((a, b) => (a.date < b.date ? 1 : -1));

  const review = (year: number) => {
    const inY = (d: string) => +d.slice(0, 4) === year; const list = calc.all.filter((x) => inY(x.date)); const months = Array(12).fill(0);
    list.forEach((x) => { if (x.kind !== 'start' && x.kind !== 'milestone') months[+x.date.slice(5, 7) - 1]++; });
    const hd = calc.hdays.filter(([k]: [string, any]) => inY(k)); hd.forEach(([k]: [string, any]) => { months[+k.slice(5, 7) - 1]++; });
    let best = 0; months.forEach((v, i) => { if (v > months[best]) best = i; });
    return {
      year, tasks: list.filter((x) => x.kind === 'task').length, notes: list.filter((x) => x.kind === 'note').length, plans: list.filter((x) => x.kind === 'plan').length, jobs: list.filter((x) => x.kind === 'job' || x.kind === 'part').length,
      habitDays: hd.length, steps: hd.reduce((s: number, [, x]: [string, any]) => s + (x.steps || 0), 0), months, best: months[best] > 0 ? months[best] : 0, bestName: MON[best],
      badges: badges.filter((b) => b.ok && b.at && inY(b.at)), marks: list.filter((x) => x.kind === 'start' || x.kind === 'milestone'),
    };
  };
  return { ready, start, days: calc.days, mem: m, setMem, nums: calc.nums, items, hiddenCount: allItems.length - items.length, allItems, onThisDay, habitDays, badges, undated: calc.undated, years: calc.years, review };
}
