import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { setup } from './adhan';
import { cs } from './region';

export type Debt = { id: number; name: string; bal: number; monthly: number; due: number; since: string; paid: Record<string, number>; remind: boolean; fixed?: boolean; goal?: number };
export type DebtData = { debts: Debt[]; nextId: number; notify: boolean; ahead: number; food?: number };
export const DEBT_EMPTY: DebtData = { debts: [], nextId: 1, notify: true, ahead: 1 };
const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const ymOf = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
export const remaining = (d: Debt) => d.fixed ? 0 : Math.max(0, Math.round((d.bal - Object.values(d.paid || {}).reduce((a, b) => a + b, 0)) * 100) / 100);
export const monthsLeft = (d: Debt) => (d.monthly > 0 ? Math.ceil(remaining(d) / d.monthly - 1e-9) : 0);
export const dueDay = (d: Debt, y: number, m: number) => Math.min(Math.max(1, d.due || 1), new Date(y, m + 1, 0).getDate());
export const isActive = (d: Debt, ym: string) => d.since <= ym && (d.fixed || remaining(d) > 0 || (d.paid || {})[ym] > 0);
export const amountDue = (d: Debt, ym: string) => ((d.paid || {})[ym] > 0 ? d.paid[ym] : d.fixed ? d.monthly : Math.min(d.monthly, remaining(d)));
export const yearsMonths = (n: number) => { const y = Math.floor(n / 12), m = n % 12; const p: string[] = []; if (y) p.push(y + (y === 1 ? ' year' : ' years')); if (m) p.push(m + (m === 1 ? ' month' : ' months')); return p.length ? p.join(' ') : 'Less than a month'; };
export const payoffLabel = (n: number, paidNow: boolean) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + (paidNow ? 1 : 0) + Math.max(0, n - 1)); return MONS[d.getMonth()] + ' ' + d.getFullYear(); };

// Schedules one reminder per unpaid month (next 6 months) because Android cannot repeat a notification monthly.
export async function syncDebtAlerts(data: DebtData): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of all) if (String(n.identifier).startsWith('debt-')) await Notifications.cancelScheduledNotificationAsync(n.identifier);
    const want = data.notify && data.debts.some((d) => d.remind && (d.fixed || remaining(d) > 0));
    if (!want) return true;
    if (!(await setup())) return false;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('debts', { name: 'Debt reminders', importance: Notifications.AndroidImportance.HIGH, lightColor: '#ffc46b' });
    const now = Date.now(); const base = new Date();
    for (const d of data.debts) {
      if (!d.remind || (!d.fixed && remaining(d) <= 0)) continue;
      let left = d.fixed ? 99 : monthsLeft(d);
      for (let i = 0; i < 6 && left > 0; i++) {
        const t = new Date(base.getFullYear(), base.getMonth() + i, 1); const ym = ymOf(t);
        if (ym < d.since) continue;
        if ((d.paid || {})[ym] > 0) continue;
        left--;
        const at = new Date(t.getFullYear(), t.getMonth(), dueDay(d, t.getFullYear(), t.getMonth()) - (data.ahead || 0), 9, 0, 0);
        if (at.getTime() <= now + 5000) continue;
        const amt = cs() + (d.fixed ? d.monthly : Math.min(d.monthly, remaining(d))).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        await Notifications.scheduleNotificationAsync({
          identifier: 'debt-' + d.id + '-' + ym,
          content: { title: d.name + (data.ahead === 0 ? ' is due today' : data.ahead === 1 ? ' is due tomorrow' : ' is due in ' + data.ahead + ' days'), body: 'Payment of ' + amt + '. Open My Finance to mark it paid.', sound: true },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: 'debts' } as any,
        });
      }
    }
    return true;
  } catch (e) { return false; }
}

export const remainingAt = (d: Debt, ym: string) => d.fixed ? 0 : Math.max(0, Math.round((d.bal - Object.keys(d.paid || {}).filter((k) => k <= ym).reduce((a, k) => a + d.paid[k], 0)) * 100) / 100);
export function debtSummary(data: DebtData) {
  const ym = ymOf(new Date()); const list = (data && data.debts) || []; const food = 0;
  const act = list.filter((x) => isActive(x, ym));
  const commit = act.reduce((a, x) => a + amountDue(x, ym), 0);
  const paid = act.reduce((a, x) => a + ((x.paid || {})[ym] || 0), 0);
  const debts = list.filter((x) => !x.fixed && remaining(x) > 0);
  const totalLeft = debts.reduce((a, x) => a + remaining(x), 0);
  const worst = debts.reduce((a, x) => Math.max(a, monthsLeft(x)), 0);
  const unpaid = act.filter((x) => !((x.paid || {})[ym] > 0));
  return { ym, list, act, commit, paid, toPay: commit - paid, food, debts, totalLeft, worst, unpaid };
}
