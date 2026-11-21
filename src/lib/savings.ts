// Savings goals (tabung). Money that goes into a goal comes from three places that all stay in sync:
// the Spending Tracker (category Savings), a monthly commitment linked to the goal, and an opening balance.
import type { DebtData } from './debts';

export type Out = { id: number; amt: number; date: string; note: string };
export type Goal = { id: number; name: string; kind: string; target: number; place: string; due: string; start: number; out: Out[]; made: string; acc?: number };
export type SavData = { goals: Goal[]; nextId: number };
export const SAV_EMPTY: SavData = { goals: [], nextId: 1 };

export const KINDS: { k: string; label: string; name: string; color: string }[] = [
  { k: 'motor', label: 'Motorcycle', name: 'Motorcycle', color: '#ff8fab' },
  { k: 'car', label: 'Car', name: 'Car', color: '#7c9cff' },
  { k: 'house', label: 'House', name: 'House', color: '#ffc46b' },
  { k: 'wedding', label: 'Wedding', name: 'Wedding fund', color: '#ff9db5' },
  { k: 'travel', label: 'Travel', name: 'Travel fund', color: '#5ee7df' },
  { k: 'emergency', label: 'Emergency', name: 'Emergency savings', color: '#ffb36b' },
  { k: 'medical', label: 'Medical', name: 'Medical savings', color: '#7df0c6' },
  { k: 'hajj', label: 'Hajj / Umrah', name: 'Hajj / Umrah', color: '#8fe9a8' },
  { k: 'other', label: 'Other', name: '', color: '#b794ff' },
];
export const kindOf = (k: string) => KINDS.find((x) => x.k === k) || KINDS[KINDS.length - 1];

type Sp = { id: number; name: string; cat: string; amt: number; date: string; goal?: number };
export type Line = { id: string; date: string; amt: number; src: 'start' | 'tracker' | 'commit' | 'out'; note: string; spId?: number; outId?: number };

// Everything that moved in or out of one goal, newest first.
export function goalLines(g: Goal, spends: Sp[], debts: DebtData | null | undefined): Line[] {
  const L: Line[] = [];
  if (g.start > 0) L.push({ id: 'st', date: g.made || '', amt: g.start, src: 'start', note: 'Opening amount' });
  (spends || []).forEach((p) => { if (p.cat === 'Savings' && p.goal === g.id) L.push({ id: 's' + p.id, date: p.date, amt: p.amt, src: 'tracker', note: p.name || 'Savings', spId: p.id }); });
  ((debts && debts.debts) || []).forEach((x: any) => {
    if (x.goal !== g.id) return;
    Object.keys(x.paid || {}).forEach((ym) => { if ((x.paid[ym] || 0) > 0) L.push({ id: 'c' + x.id + ym, date: ym + '-' + String(Math.min(28, Math.max(1, x.due || 1))).padStart(2, '0'), amt: x.paid[ym], src: 'commit', note: x.name + ' (monthly)' }); });
  });
  (g.out || []).forEach((o) => L.push({ id: 'o' + o.id, date: o.date, amt: -o.amt, src: 'out', note: o.note || 'Withdrawn', outId: o.id }));
  return L.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
export const goalSaved = (g: Goal, spends: Sp[], debts: DebtData | null | undefined) => Math.max(0, Math.round(goalLines(g, spends, debts).reduce((a, l) => a + l.amt, 0) * 100) / 100);

// How much per month reaches the target by the due date.
export function perMonth(g: Goal, saved: number): number | null {
  if (!g.due || !(g.target > saved)) return null;
  const now = new Date(); const d = new Date(g.due + 'T12:00:00'); if (isNaN(d.getTime())) return null;
  const months = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()) + (d.getDate() >= now.getDate() ? 1 : 0);
  if (months <= 0) return null;
  return Math.ceil((g.target - saved) / months);
}
export const monthsUntil = (due: string): number => { const now = new Date(); const d = new Date(due + 'T12:00:00'); return (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()); };
