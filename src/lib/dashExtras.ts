import { usePrayer } from './prayer';
import { odoEstimate, taskState } from './maintTasks';
import { calcLeft, commitFor, ymKey } from './moneyLeft';
import { cs } from './region';
import type { Core } from './insights';

// Extra pages for the Dashboard card. Each one is null when there is nothing worth showing, so the card never turns through empty pages.
export type Extra = { label: string; title: string; sub: string; tone?: string; go: string };
const money = (n: number) => n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const dayN = (s: string) => { const p = s.split('-'); return Math.round(new Date(+p[0], +p[1] - 1, +p[2], 12).getTime() / 86400000); };

export function useDashExtras(core: Core, on: { islamic: boolean; planner: boolean; record: boolean; finance: boolean }): { prayer: Extra | null; event: Extra | null; job: Extra | null; money: Extra | null } {
  const pr = usePrayer(true);
  const now = new Date(); const today = ymd(now);
  let prayer: Extra | null = null;
  const n: any = pr && (pr as any).nextSolat;
  if (on.islamic && n && n.name) {
    const d = Math.max(0, Math.round(n.diff || 0)); const left = d >= 60 ? Math.floor(d / 60) + ' h ' + (d % 60 ? d % 60 + ' min' : '') : d + ' min';
    prayer = { label: 'NEXT PRAYER', title: n.name + ' at ' + n.time12, sub: (n.tomorrow ? 'Tomorrow · in ' : 'In ') + left.trim(), tone: '#8fe9e2', go: '/prayer' };
  }
  let event: Extra | null = null;
  if (on.planner) {
    const list = ((core.pl && (core.pl as any).events) || []).filter((e: any) => e && !e.done && /^\d{4}-\d{2}-\d{2}$/.test(e.date || ''));
    const t = dayN(today); const late = list.filter((e: any) => dayN(e.date) < t && t - dayN(e.date) <= 30).sort((a: any, b: any) => (a.date < b.date ? 1 : -1))[0];
    const soon = list.filter((e: any) => dayN(e.date) >= t && dayN(e.date) - t <= 14).sort((a: any, b: any) => (a.date < b.date ? -1 : 1))[0];
    const e = late || soon;
    if (e) { const dl = dayN(e.date) - t; event = { label: 'NEXT EVENT', title: e.name, sub: dl < 0 ? 'Overdue ' + -dl + (dl === -1 ? ' day' : ' days') : dl === 0 ? 'Today' : dl === 1 ? '1 day left' : dl + ' days left', tone: dl < 0 ? '#ff6b81' : dl <= 7 ? '#ffd24a' : '#5ee7b5', go: '/planner' }; }
  }
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
    if (b) job = { label: 'VEHICLE JOB', title: b.name, sub: b.veh + ' · ' + b.text, tone: b.lv === 2 ? '#ff6b81' : '#ffd24a', go: '/record' };
  }
  let moneyX: Extra | null = null;
  if (on.finance) {
    const ym = ymKey(now); const inc = ((core.fin && (core.fin as any).inc) || {})[ym] || {};
    const income = Object.values(inc).reduce((s: number, x: any) => s + (+x || 0), 0) as number;
    if (income > 0) {
      const c = calcLeft({ ym, income, commit: commitFor(core.debts, ym), spends: ((core.fin && (core.fin as any).spends) || []) });
      moneyX = c.over
        ? { label: 'MONEY THIS MONTH', title: 'Over budget by ' + cs() + money(-c.left), sub: 'Take it easy for the last ' + c.daysLeft + (c.daysLeft === 1 ? ' day' : ' days'), tone: '#ff6b81', go: '/finance' }
        : { label: 'MONEY THIS MONTH', title: cs() + money(c.left) + ' left', sub: c.daysLeft + (c.daysLeft === 1 ? ' day' : ' days') + ' to go · about ' + cs() + money(c.allowance) + ' a day', tone: c.state === 'care' ? '#ffd24a' : '#5ee7b5', go: '/finance' };
    }
  }
  return { prayer, event, job, money: moneyX };
}
