import { usePrayer } from './prayer';
import { odoEstimate, taskState } from './maintTasks';
import { calcLeft, commitFor, ymKey } from './moneyLeft';
import { cs } from './region';
import { isActive, amountDue, dueDay, ymOf } from './debts';
import type { Core } from './insights';
import { useStored } from './store';
import { SUB_EMPTY, dueOf, rm as rmSub, num as numSub, useSubsG, CYCLES, type SubStore } from './subs';
import { useRegion } from './region';
import { upcomingMy, EMPTY_CACHE, MyCache } from './myEvents';
import { upcoming as islamicUp, useHijriSync } from './hijriSync';

// Extra pages for the Dashboard card. Each one is null when there is nothing worth showing, so the card never turns through empty pages.
export type Extra = { label: string; title: string; sub: string; tone?: string; go: string; ring?: number; val?: string };
const money = (n: number) => n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const dayN = (s: string) => { const p = s.split('-'); return Math.round(new Date(+p[0], +p[1] - 1, +p[2], 12).getTime() / 86400000); };

export function useDashExtras(core: Core, on: { islamic: boolean; planner: boolean; record: boolean; finance: boolean }): { prayer: Extra | null; event: Extra | null; calmix: Extra | null; calgen: Extra | null; subs: Extra | null; job: Extra | null; money: Extra | null; tasks: Extra | null; renew: Extra | null; debt: Extra | null } {
  const pr = usePrayer(true);
  const now = new Date(); const today = ymd(now);
  let prayer: Extra | null = null;
  const n: any = pr && (pr as any).nextSolat;
  if (on.islamic && n && n.name) {
    const d = Math.max(0, Math.round(n.diff || 0)); const left = d >= 60 ? Math.floor(d / 60) + ' h ' + (d % 60 ? d % 60 + ' min' : '') : d + ' min';
    prayer = { label: 'NEXT PRAYER', title: n.name + ' at ' + n.time12, sub: (n.tomorrow ? 'Tomorrow · in ' : 'In ') + left.trim(), tone: '#8fe9e2', go: '/prayer', val: d >= 60 ? Math.floor(d / 60) + 'h' + String(d % 60).padStart(2, '0') : d + 'm', ring: 1 - Math.min(d, 360) / 360 };
  }
  let event: Extra | null = null;
  if (on.planner) {
    const list = ((core.pl && (core.pl as any).events) || []).filter((e: any) => e && !e.done && /^\d{4}-\d{2}-\d{2}$/.test(e.date || ''));
    const t = dayN(today); const late = list.filter((e: any) => dayN(e.date) < t && t - dayN(e.date) <= 30).sort((a: any, b: any) => (a.date < b.date ? 1 : -1))[0];
    const soon = list.filter((e: any) => dayN(e.date) >= t && dayN(e.date) - t <= 14).sort((a: any, b: any) => (a.date < b.date ? -1 : 1))[0];
    const e = late || soon;
    if (e) { const dl = dayN(e.date) - t; event = { label: 'NEXT EVENT', title: e.name, sub: dl < 0 ? 'Overdue ' + -dl + (dl === -1 ? ' day' : ' days') : dl === 0 ? 'Today' : dl === 1 ? '1 day left' : dl + ' days left', tone: dl < 0 ? '#ff6b81' : dl <= 7 ? '#ffd24a' : '#5ee7b5', go: '/planner', val: dl === 0 ? 'Today' : dl + 'd', ring: dl < 0 ? 1 : 1 - Math.min(dl, 14) / 14 }; }
  }
  // Upcoming calendar pages: your own events, public holidays and (for the mixed page) Islamic dates, nearest first
  const [mc] = useStored<MyCache>('ml_myevents', EMPTY_CACHE); const [rg] = useRegion(); const hoff = useHijriSync();
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const calPage = (withIslamic: boolean): Extra | null => {
    type It = { date: string; name: string; src: 'mine' | 'islam' | 'holiday'; go: string };
    const all: It[] = [];
    if (on.planner) ((core.pl && (core.pl as any).events) || []).forEach((e: any) => { if (e && !e.done && /^\d{4}-\d{2}-\d{2}$/.test(e.date || '') && e.date >= today) all.push({ date: e.date, name: e.name, src: 'mine', go: '/planner' }); });
    let my: any[] = []; try { my = upcomingMy(today, 40, mc, rg.cc); } catch (e) { my = []; }
    my.forEach((e) => { if (e.kind === 'islam') { if (withIslamic) all.push({ date: e.date, name: e.name, src: 'islam', go: '/islamic' }); } else all.push({ date: e.date, name: e.name, src: 'holiday', go: '/planner' }); });
    if (withIslamic && on.islamic) { try { islamicUp(now, hoff, 12).forEach((u) => { const d = ymd(u.date); if (!all.some((a) => a.src === 'islam' && Math.abs(dayN(a.date) - dayN(d)) <= 2)) all.push({ date: d, name: u.n, src: 'islam', go: '/islamic' }); }); } catch (e) { /* none */ } }
    const t = dayN(today); const list = all.filter((a) => dayN(a.date) - t <= 120).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const n = list[0]; if (!n) return null;
    const dl = dayN(n.date) - t; const dt = new Date(+n.date.slice(0, 4), +n.date.slice(5, 7) - 1, +n.date.slice(8, 10));
    const nx = list[1]; const nd = nx ? dayN(nx.date) - t : 0;
    const when = WD[dt.getDay()] + ' ' + dt.getDate() + ' ' + MN[dt.getMonth()];
    const left = dl === 0 ? 'Today' : dl === 1 ? 'Tomorrow' : dl + ' days';
    return { label: 'UPCOMING · ' + (n.src === 'mine' ? 'YOUR EVENT' : n.src === 'islam' ? 'ISLAMIC' : 'HOLIDAY'), title: n.name, sub: when + ' · ' + left + (nx ? ' · then ' + nx.name + (nd === dl ? ' same day' : '') : ''), tone: dl <= 7 ? '#ffd24a' : '#5ee7b5', go: n.go, val: dl === 0 ? 'Today' : dl + 'd', ring: 1 - Math.min(dl, 30) / 30 };
  };
  const sbsS = useSubsG(); let subsX: Extra | null = null;
  if (on.finance) {
    const near = ((sbsS && sbsS.subs) || []).map((s) => ({ s, d: dueOf(s, today) })).filter((x) => x.d.days <= 7).sort((a, b) => a.d.days - b.d.days)[0];
    if (near) subsX = { label: near.s.trial ? 'FREE TRIAL' : 'SUBSCRIPTION', title: near.s.name + ' · ' + rmSub(numSub(near.s.price)), sub: near.d.txt + ' · ' + CYCLES.find((c) => c.k === near.s.cycle)!.per, tone: near.d.col, go: '/subscriptions', val: near.d.days <= 0 ? 'Today' : near.d.days + 'd', ring: 1 - Math.min(near.d.days, 7) / 7 };
  }
  const calmix = calPage(true); let calgen = calPage(false); if (calgen && calmix && calgen.title === calmix.title) calgen = null; // never show the same date twice in a row
  let job: Extra | null = null;
  if (on.record) {
    let best: { lv: number; di: number; name: string; veh: string; text: string } | null = null;
    Object.entries((core.rec && (core.rec as any).data) || {}).forEach(([veh, v]: [string, any]) => {
      const oe = odoEstimate(v);
      ((v && v.tasks) || []).forEach((t: any) => {
        if (!t || !t.name || (t.kind === 'part' && t.km > 0 && t.odo != null && !t.days)) return;
        const s = taskState(t, oe.odo, oe.est); if (s.level < 1) return;
        if (!best || s.level > best.lv || (s.level === best.lv && s.dueIn < best.di)) best = { lv: s.level, di: s.dueIn, name: t.name, veh, text: s.text };
      });
    });
    const b: any = best;
    if (b) job = { label: 'VEHICLE JOB', title: b.name, sub: b.veh + ' · ' + b.text, tone: b.lv === 2 ? '#ff6b81' : '#ffd24a', go: '/vehicle', val: b.lv === 2 ? 'Late' : 'Soon', ring: b.lv === 2 ? 1 : 0.75 };
  }
  let moneyX: Extra | null = null;
  if (on.finance) {
    const ym = ymKey(now); const inc = ((core.fin && (core.fin as any).inc) || {})[ym] || {};
    const income = Object.values(inc).reduce((s: number, x: any) => s + (+x || 0), 0) as number;
    if (income > 0) {
      const c = calcLeft({ ym, income, commit: commitFor(core.debts, ym), spends: ((core.fin && (core.fin as any).spends) || []) });
      moneyX = c.over
        ? { label: 'MONEY THIS MONTH', title: 'Over budget by ' + cs() + money(-c.left), sub: 'Take it easy for the last ' + c.daysLeft + (c.daysLeft === 1 ? ' day' : ' days'), tone: '#ff6b81', go: '/finance', val: '0%', ring: 0 }
        : { label: 'MONEY THIS MONTH', title: cs() + money(c.left) + ' left', sub: c.daysLeft + (c.daysLeft === 1 ? ' day' : ' days') + ' to go · about ' + cs() + money(c.allowance) + ' a day', tone: c.state === 'care' ? '#ffd24a' : '#5ee7b5', go: '/finance', val: Math.max(0, Math.round((c.left / income) * 100)) + '%', ring: Math.max(0, Math.min(1, c.left / income)) };
    }
  }
  // Tasks that are due today or already late.
  let tasks: Extra | null = null;
  if (on.planner) {
    const tl = ((core.pl && (core.pl as any).tasks) || []).filter((x: any) => x && x.status !== 'done' && /^\d{4}-\d{2}-\d{2}$/.test(x.due || ''));
    const td = tl.filter((x: any) => x.due === today); const lt = tl.filter((x: any) => x.due < today);
    const all = [...lt, ...td];
    if (all.length) {
      tasks = { label: 'TASKS TODAY', title: all.length === 1 ? all[0].name : all.length + ' tasks need you', sub: [td.length ? td.length + ' due today' : '', lt.length ? lt.length + ' late' : ''].filter(Boolean).join(' · '), tone: lt.length ? '#ff6b81' : '#ffd24a', go: '/planner', val: String(all.length), ring: td.length / all.length };
    }
  }
  // Road tax, insurance or licence that expires within 30 days (or expired in the last 60 days).
  let renew: Extra | null = null;
  if (on.record) {
    let bw: { n: number; label: string; veh: string } | null = null; const vehs = Object.keys((core.rec && (core.rec as any).data) || {});
    Object.entries((core.rec && (core.rec as any).data) || {}).forEach(([veh, v]: [string, any]) => {
      const r = (v && v.renew) || {};
      ([['roadtax', 'Road tax'], ['insurance', 'Insurance'], ['licence', 'Licence']] as [string, string][]).forEach(([k, label]) => {
        const d = r[k]; if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
        const n = dayN(d) - dayN(today); if (n > 30 || n < -60) return;
        if (!bw || n < bw.n) bw = { n, label, veh };
      });
    });
    const b: any = bw;
    if (b) renew = { label: 'RENEWAL', title: b.label + (vehs.length > 1 ? ' · ' + b.veh : ''), sub: b.n < 0 ? 'Expired ' + -b.n + (b.n === -1 ? ' day ago' : ' days ago') : b.n === 0 ? 'Expires today' : b.n + (b.n === 1 ? ' day left' : ' days left'), tone: b.n < 0 ? '#ff6b81' : b.n <= 30 ? '#ffd24a' : '#5ee7b5', go: '/vehicle', val: b.n < 0 ? 'Late' : b.n === 0 ? 'Today' : b.n + 'd', ring: b.n < 0 ? 1 : 1 - Math.min(b.n, 30) / 30 };
  }
  // The next debt payment: due within 7 days, or this month's payment that is past its day and still unpaid.
  let debt: Extra | null = null;
  if (on.finance) {
    const list = (((core.debts as any) && (core.debts as any).debts) || []) as any[];
    const ym = ymOf(now); let pick: { n: number; name: string; amt: number } | null = null;
    list.forEach((d) => {
      if (!d || !isActive(d, ym)) return;
      const paid = ((d.paid || {})[ym] || 0) > 0; if (paid) return;
      const n = dayN(ymd(new Date(now.getFullYear(), now.getMonth(), dueDay(d, now.getFullYear(), now.getMonth())))) - dayN(today);
      if (n > 7) return;
      if (!pick || n < pick.n) pick = { n, name: d.name, amt: amountDue(d, ym) };
    });
    const b: any = pick;
    if (b) debt = { label: 'DEBT PAYMENT', title: b.name + ' · ' + cs() + money(b.amt), sub: b.n < 0 ? 'Overdue ' + -b.n + (b.n === -1 ? ' day' : ' days') : b.n === 0 ? 'Due today' : 'Due in ' + b.n + (b.n === 1 ? ' day' : ' days'), tone: b.n < 0 ? '#ff6b81' : b.n <= 2 ? '#ffd24a' : '#5ee7b5', go: '/finance', val: b.n < 0 ? 'Late' : b.n === 0 ? 'Today' : b.n + 'd', ring: b.n < 0 ? 1 : 1 - Math.min(b.n, 7) / 7 };
  }
  return { prayer, event, calmix, calgen, subs: subsX, job, money: moneyX, tasks, renew, debt };
}
