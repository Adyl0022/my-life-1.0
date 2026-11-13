// One shared calculation for "Money Left", used by the card, the budget alerts and the Assistant,
// so all of them always show the same numbers.
import { DebtData, isActive, amountDue } from './debts';
import { cs } from './region';

export type Sp = { id: number; name: string; cat: string; amt: number; date: string; goal?: number };
const pad = (n: number) => String(n).padStart(2, '0');
export const ymKey = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1);
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function commitFor(debts: DebtData | null | undefined, ym: string): number {
  const list = (debts && debts.debts) || [];
  return list.filter((x) => isActive(x, ym)).reduce((a, x) => a + amountDue(x, ym), 0);
}

export type Left = ReturnType<typeof calcLeft>;

export function calcLeft(o: { ym: string; income: number; commit: number; spends: Sp[]; now?: Date }) {
  const now = o.now || new Date(); const ym = o.ym;
  const y = parseInt(ym.slice(0, 4), 10), m = parseInt(ym.slice(5, 7), 10) - 1;
  const dim = new Date(y, m + 1, 0).getDate();
  const isCur = ym === ymKey(now);
  const dayNo = isCur ? now.getDate() : dim;
  const daysLeft = isCur ? dim - dayNo + 1 : 0;
  const todayStr = ym + '-' + pad(now.getDate());
  const all = (o.spends || []).filter((p) => (p.date || '').slice(0, 7) === ym);
  const savings = all.filter((p) => p.cat === 'Savings').reduce((a, p) => a + p.amt, 0);
  const inM = all.filter((p) => p.cat !== 'Savings');
  const spent = inM.reduce((a, p) => a + p.amt, 0);
  const today = isCur ? inM.filter((p) => p.date === todayStr).reduce((a, p) => a + p.amt, 0) : 0;
  const income = o.income, commit = o.commit;
  const afterCommit = income - commit;
  const left = income - commit - spent - savings;
  const over = left < 0;
  const used = income > 0 ? (commit + spent + savings) / income : 0;

  // A fair pace: bills and big one-off buys are left out, because they do not repeat every day.
  const room = Math.max(0, afterCommit - savings);
  const bigAt = Math.max(150, room * 0.15);
  const oneOffs = inM.filter((p) => p.cat === 'Bills' || p.amt >= bigAt);
  const oneOff = oneOffs.reduce((a, p) => a + p.amt, 0);
  const regular = spent - oneOff;
  const pace = dayNo > 0 ? regular / dayNo : 0;
  const projSpent = isCur ? spent + pace * Math.max(0, daysLeft - 1) : spent;
  const projLeft = income - commit - savings - projSpent;
  // What you can spend per day from today on, counted from the start of today.
  const allowance = isCur && daysLeft > 0 ? Math.max(0, left + today) / daysLeft : 0;
  let runOutDay = 0;
  if (isCur && pace > 0 && left > 0) { const d = dayNo + Math.floor(left / pace); runOutDay = d < dim ? d : 0; }
  const state: 'none' | 'over' | 'care' | 'ok' = income <= 0 ? 'none' : over ? 'over' : (isCur && projLeft < 0) || used >= 0.85 ? 'care' : 'ok';
  return { ym, y, m, dim, isCur, dayNo, daysLeft, income, commit, afterCommit, spent, savings, today, left, over, used, pace, regular, oneOff, oneOffs, projSpent, projLeft, allowance, runOutDay, state, count: inM.length };
}

export type Summary = { saved: number; ok: boolean; topCat: string; topAmt: number; topShare: number; prevSpent: number; vsPrev: number | null; biggest: Sp | null; tip: string };

// A short summary of a whole month (used at the end of a month and for past months).
export function monthSummary(o: { ym: string; income: number; commit: number; spends: Sp[]; prevYm: string }): Summary {
  const c = calcLeft({ ym: o.ym, income: o.income, commit: o.commit, spends: o.spends });
  const inM = o.spends.filter((p) => (p.date || '').slice(0, 7) === o.ym && p.cat !== 'Savings');
  const by: Record<string, number> = {}; inM.forEach((p) => { by[p.cat] = (by[p.cat] || 0) + p.amt; });
  const cats = Object.keys(by).sort((a, b) => by[b] - by[a]);
  const topCat = cats[0] || ''; const topAmt = topCat ? by[topCat] : 0;
  const prevSpent = o.spends.filter((p) => (p.date || '').slice(0, 7) === o.prevYm && p.cat !== 'Savings').reduce((a, p) => a + p.amt, 0);
  const vsPrev = prevSpent > 0 ? Math.round(((c.spent - prevSpent) / prevSpent) * 100) : null;
  const biggest = inM.slice().sort((a, b) => b.amt - a.amt)[0] || null;
  let tip = '';
  if (c.income <= 0) tip = '';
  else if (c.over) tip = 'Next month, plan a limit before the month starts' + (topCat ? ' and watch ' + topCat + ', your biggest category.' : '.');
  else if (topCat && ['Food', 'Shopping', 'Other', 'Petrol'].indexOf(topCat) >= 0) tip = 'Trimming ' + topCat + ' by 10% would free about ' + cs() + Math.round(topAmt * 0.1) + ' next month.';
  else tip = 'Good month. Keep the same pace next month.';
  return { saved: c.left, ok: !c.over, topCat, topAmt, topShare: c.spent > 0 ? Math.round((topAmt / c.spent) * 100) : 0, prevSpent, vsPrev, biggest, tip };
}
