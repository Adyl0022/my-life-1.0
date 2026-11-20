// My Accounts: where your money is kept (cash, banks, wallets, savings) and what you owe (cards, loans).
// A balance is never stored. It is worked out from the opening balance plus everything that happened after the "as of" date,
// so editing or deleting a spending or a movement always gives the right balance again.
export type AccGroup = 'cash' | 'ewallet' | 'bank' | 'saving' | 'card' | 'loan';
export const GROUPS: { k: AccGroup; t: string; plural: string; liab: boolean; c: string; hint: string }[] = [
  { k: 'cash', t: 'Cash', plural: 'Cash', liab: false, c: '#ffc46b', hint: 'Money in your wallet or at home' },
  { k: 'ewallet', t: 'E-wallet', plural: 'E-wallets', liab: false, c: '#8fe9e2', hint: 'Money in a wallet app' },
  { k: 'bank', t: 'Bank', plural: 'Bank accounts', liab: false, c: '#7c9cff', hint: 'Savings or current account' },
  { k: 'saving', t: 'Savings', plural: 'Savings', liab: false, c: '#5ee7b5', hint: 'Money you keep for later' },
  { k: 'card', t: 'Credit card', plural: 'Credit cards', liab: true, c: '#ff8fab', hint: 'What you owe on the card' },
  { k: 'loan', t: 'Loan', plural: 'Loans', liab: true, c: '#b794ff', hint: 'What you still owe' }, // kept only for accounts made earlier; new loans go in Commitments
];
export const groupOf = (k: AccGroup) => GROUPS.find((g) => g.k === k) || GROUPS[0];

export type Acc = { id: number; name: string; g: AccGroup; start: number; since: string };
export type Move = { id: number; date: string; kind: 'transfer' | 'deposit' | 'adjust'; from?: number; to?: number; amt: number; note?: string };
export type AccData = { accs: Acc[]; moves: Move[]; nextId: number };
export const ACC_EMPTY: AccData = { accs: [], moves: [], nextId: 1 };
export type AccSpend = { id: number; name: string; cat: string; amt: number; date: string; acc?: number };

export const isLiab = (a: Acc) => groupOf(a.g).liab;
const r2 = (n: number) => Math.round(n * 100) / 100;

export type Line = { key: string; date: string; text: string; delta: number; kind: 'spend' | 'move' | 'debt'; ref: number };
/** The part of a Commitments item that matters here: which account pays it, from which month, and what was paid. */
export type AccDebt = { id: number; name: string; due: number; since: string; paid?: Record<string, number>; acc?: number; accSince?: string };
const dueDate = (ym: string, due: number) => { const y = +ym.slice(0, 4), m = +ym.slice(5, 7); const last = new Date(y, m, 0).getDate(); return ym + '-' + String(Math.min(Math.max(1, due || 1), last)).padStart(2, '0'); };

/** Everything that changed one account after its "as of" date, newest first. delta is in the account's own terms: for a card or loan, plus means you owe more. */
export function linesOf(a: Acc, data: AccData, spends: AccSpend[], debts: AccDebt[] = []): Line[] {
  const out: Line[] = []; const liab = isLiab(a); const nameOf = (id?: number) => (data.accs.find((x) => x.id === id) || { name: 'another account' }).name;
  spends.forEach((s) => { if (s.acc === a.id && s.amt > 0 && (s.date || '') >= a.since) out.push({ key: 's' + s.id, date: s.date, text: s.name || s.cat, delta: liab ? s.amt : -s.amt, kind: 'spend', ref: s.id }); });
  data.moves.forEach((m) => {
    if ((m.date || '') < a.since) return;
    if (m.kind === 'deposit' && m.to === a.id) out.push({ key: 'm' + m.id, date: m.date, text: m.note || 'Money in', delta: m.amt, kind: 'move', ref: m.id });
    else if (m.kind === 'adjust' && m.to === a.id) out.push({ key: 'm' + m.id, date: m.date, text: m.note || 'Balance set by you', delta: m.amt, kind: 'move', ref: m.id });
    else if (m.kind === 'transfer' && m.from === a.id) out.push({ key: 'm' + m.id, date: m.date, text: (liab ? 'Cash taken to ' : 'Sent to ') + nameOf(m.to), delta: liab ? m.amt : -m.amt, kind: 'move', ref: m.id });
    else if (m.kind === 'transfer' && m.to === a.id) out.push({ key: 'm' + m.id, date: m.date, text: (liab ? 'Paid from ' : 'Received from ') + nameOf(m.from), delta: liab ? -m.amt : m.amt, kind: 'move', ref: m.id });
  });
  debts.forEach((d) => { if (d.acc !== a.id) return; Object.keys(d.paid || {}).forEach((ym) => { const amt = (d.paid || {})[ym]; if (!(amt > 0) || ym < (d.accSince || d.since)) return; const date = dueDate(ym, d.due); if (date < a.since) return; out.push({ key: 'd' + d.id + ym, date, text: d.name + ' payment', delta: liab ? amt : -amt, kind: 'debt', ref: d.id }); }); });
  return out.sort((x, y) => (y.date || '').localeCompare(x.date || '') || y.key.localeCompare(x.key));
}
export const balanceOf = (a: Acc, data: AccData, spends: AccSpend[], debts: AccDebt[] = []) => r2(a.start + linesOf(a, data, spends, debts).reduce((s, l) => s + l.delta, 0));

/** What you still owe in Commitments (ansuran and other debts with a balance). Bills with no balance are left out. */
export const commitTotal = (debts: { bal: number; paid?: Record<string, number>; fixed?: boolean }[]) => r2((debts || []).reduce((a, d) => a + (d.fixed ? 0 : Math.max(0, d.bal - Object.values(d.paid || {}).reduce((x, y) => x + y, 0))), 0));

export function totals(data: AccData, spends: AccSpend[], commit = 0, debts: AccDebt[] = []) {
  let assets = 0, liab = commit;
  data.accs.forEach((a) => { const b = balanceOf(a, data, spends, debts); if (isLiab(a)) liab += b; else assets += b; });
  return { assets: r2(assets), liab: r2(liab), total: r2(assets - liab) };
}
