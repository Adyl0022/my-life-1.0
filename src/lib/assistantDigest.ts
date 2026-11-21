import { remaining, dueDay } from './debts';
import { cs } from './region';

// A short written summary of the person's own saved data. It is given to the AI that runs on the phone (never to Online AI),
// so it can answer questions about spending, money, habits, tasks and plans in its own words instead of only by fixed rules.
const m2 = (n: number) => cs() + (Math.round((n || 0) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

export function dataDigest(R: any, max = 2600): string {
  if (!R || !R.ready) return '';
  const out: string[] = []; const now = new Date();
  const ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  out.push('Today is ' + now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + '.');
  try {
    const cats = Object.entries(R.cats || {}).filter((x: any) => x[1] > 0).sort((a: any, b: any) => b[1] - a[1]).slice(0, 8).map((x: any) => x[0] + ' ' + m2(x[1]));
    if (R.hasSpend || R.spendMonth) out.push('Spending this month: ' + m2(R.spendMonth) + (cats.length ? ' (' + cats.join(', ') + ')' : '') + '. Spent today: ' + m2(R.spendToday) + '.');
    if (R.income) out.push('Income this month: ' + m2(R.income) + (R.incomeLast ? ', last month ' + m2(R.incomeLast) : '') + '.');
    const lim = Object.entries(R.limits || {}).map((x: any) => x[0] + ' ' + m2(x[1]));
    if (lim.length) out.push('Monthly limits: ' + lim.join(', ') + '.');
    const rec = (R.spends || []).filter((s: any) => s && s.date).slice().sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '') || b.id - a.id).slice(0, 10).map((s: any) => s.date.slice(5) + ' ' + s.name + ' ' + m2(s.amt) + ' (' + s.cat + ')');
    if (rec.length) out.push('Latest spending: ' + rec.join('; ') + '.');
  } catch (e) { /* skip */ }
  try {
    const ds = ((R.debts && R.debts.debts) || []).filter((d: any) => !d.fixed && remaining(d) > 0);
    if (ds.length) out.push('Commitments (loans and instalments): ' + ds.slice(0, 8).map((d: any) => d.name + ' ' + m2(remaining(d)) + ' left, ' + m2(d.monthly) + ' a month, due day ' + dueDay(d, now.getFullYear(), now.getMonth())).join('; ') + '.');
    if (R.commit) out.push('Commitments due this month in total: ' + m2(R.commit) + '.');
  } catch (e) { /* skip */ }
  try {
    const g = (R.goals || []).slice(0, 6).map((x: any) => x.name + ' ' + m2(x.saved) + ' of ' + m2(x.target));
    if (g.length) out.push('Savings goals: ' + g.join('; ') + '.');
    const sb = (R.subs || []).slice(0, 8).map((x: any) => x.name + ' ' + m2(x.price) + ' ' + x.cycle + (x.n != null ? ' (next in ' + x.n + ' days)' : ''));
    if (sb.length) out.push('Subscriptions: ' + sb.join('; ') + '. About ' + m2(R.subsMonth) + ' a month.');
  } catch (e) { /* skip */ }
  try {
    const days = Object.entries(R.days || {}).sort((a: any, b: any) => (a[0] < b[0] ? 1 : -1)).slice(0, 7).map((x: any) => x[1]);
    out.push('Today: ' + (R.steps || 0) + ' steps, ' + (R.cups || 0) + ' of ' + (R.cupGoal || 8) + ' glasses of water, ' + (R.sleep ? R.sleep + ' h sleep' : 'no sleep logged') + (R.mood ? ', mood ' + R.mood + ' of 5' : '') + '. Habit score ' + (R.score || 0) + '%, streak ' + (R.streak || 0) + ' days.');
    const sl = days.map((d: any) => d.sleep).filter((v: number) => v > 0), st = days.map((d: any) => d.steps).filter((v: number) => v > 0), wt = days.map((d: any) => d.cups).filter((v: number) => v > 0);
    if (sl.length || st.length) out.push('Last 7 days average: ' + (sl.length ? avg(sl).toFixed(1) + ' h sleep, ' : '') + (st.length ? Math.round(avg(st)) + ' steps, ' : '') + (wt.length ? avg(wt).toFixed(1) + ' glasses of water' : '') + '.');
  } catch (e) { /* skip */ }
  try {
    const tk = (R.plTasks || []).filter((t: any) => t.status !== 'done').slice(0, 8).map((t: any) => t.name + (t.due ? ' (due ' + t.due + ')' : ''));
    if (tk.length) out.push('Open tasks: ' + tk.join('; ') + '.');
    const ev = (R.plEvents || []).filter((e: any) => !e.done && e.date >= now.toISOString().slice(0, 10)).sort((a: any, b: any) => a.date.localeCompare(b.date)).slice(0, 6).map((e: any) => e.name + ' on ' + e.date);
    if (ev.length) out.push('Coming events: ' + ev.join('; ') + '.');
    const dc = (R.docs || []).filter((d: any) => d.n != null && d.n <= 90).slice(0, 5).map((d: any) => d.title + ' expires in ' + d.n + ' days');
    if (dc.length) out.push('Documents expiring soon: ' + dc.join('; ') + '.');
    if (R.hasVehicle && R.odo) out.push('Vehicle: ' + Math.round(R.odo) + ' km' + (R.nextSvc != null ? ', next service ' + R.nextSvcName + ' in about ' + Math.round(R.nextSvc) + ' km' : '') + '.');
  } catch (e) { /* skip */ }
  void ym;
  let s = out.join('\n');
  if (s.length > max) s = s.slice(0, max);
  return s;
}
