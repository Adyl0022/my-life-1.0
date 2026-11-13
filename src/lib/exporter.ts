import { Platform } from 'react-native';
import { getText, DEFAULT_NAME } from './store';
import { calcLeft, commitFor, MONTHS as MN3 } from './moneyLeft';
import { goalLines, goalSaved } from './savings';
import { cs, cu } from './region';

export type Sheet = { name: string; head: string[]; rows: (string | number)[][] };
export type Chart = { title: string; kind: 'bars' | 'hbars' | 'line' | 'donut'; labels: string[]; values: number[]; unit?: string; color?: string };
export type Report = { sheets: Sheet[]; totals: [string, string][]; charts: Chart[]; name: string; period: string; created: string };
const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const stamp = (d = new Date()) => { const h = d.getHours(); return d.getDate() + ' ' + MN[d.getMonth()] + ' ' + d.getFullYear() + ', ' + (h % 12 || 12) + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + (h < 12 ? 'am' : 'pm'); };
export const fileStamp = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + '-' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
const PERN = ['This month', 'Last 3 months', 'All time'];
const dm = (k: string) => { const p = String(k).split('-'); return p.length === 3 ? Number(p[2]) + ' ' + MN[Number(p[1]) - 1] : k; };

export const MODS = [
  { k: 'planner', name: 'Planner and Notes', sub: 'Events, tasks and notes', keys: ['ml_planner', 'ml_notes'] },
  { k: 'islamic', name: 'Islamic Hub', sub: 'Fasting log, Tasbih counts, bookmarks and reading progress', keys: ['ml_islamic', 'ml_tasbih', 'ml_puasa'] },
  { k: 'finance', name: 'My Finance', sub: 'Income, spending, savings goals and commitments', keys: ['ml_finance', 'ml_debts', 'ml_savings'] },
  { k: 'record', name: 'My Record', sub: 'Vehicle mileage, fuel and services', keys: ['ml_record'] },
  { k: 'habit', name: 'Habit and Health', sub: 'Mood, sleep, water and steps', keys: ['ml_habit'] },
  { k: 'usage', name: 'App usage history', sub: 'Time spent and opens from Stats', keys: ['ml_usage_v1'] },
];

const pad = (n: number) => String(n).padStart(2, '0');
const rm = (n: number) => { const v = Math.round(n * 100) / 100; return cs() + v.toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
const num = (x: any) => (typeof x === 'number' && isFinite(x) ? x : Number(x) || 0);

export async function collect(sel: string[]) {
  const out: Record<string, any> = {};
  for (const m of MODS.filter((x) => sel.includes(x.k))) {
    out[m.k] = {};
    for (const k of m.keys) { try { const r = await getText(k); if (r != null) out[m.k][k] = JSON.parse(r); } catch (e) {} }
  }
  return out;
}

// Flattens any saved object into Item / Value rows, for data that has no special table.
function flat(v: any, limit = 400): [string, string][] {
  const rows: [string, string][] = [];
  const walk = (p: string, x: any) => {
    if (rows.length >= limit) return;
    if (x && typeof x === 'object') Object.keys(x).forEach((k) => walk(p ? p + ' / ' + k : k, x[k]));
    else rows.push([p, String(x)]);
  };
  walk('', v); return rows;
}

export async function buildReport(sel: string[], per: number): Promise<Report> {
  const raw = await collect(sel);
  const now = new Date();
  const ym = now.getFullYear() + '-' + pad(now.getMonth() + 1);
  const from = per === 0 ? ym : per === 1 ? (() => { const d = new Date(now.getFullYear(), now.getMonth() - 2, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); })() : '';
  const inP = (date?: string) => !from || !date || String(date).slice(0, 7) >= from;
  const sheets: Sheet[] = []; const totals: [string, string][] = []; const charts: Chart[] = [];
  let name = DEFAULT_NAME; try { const n = await getText('ml_name'); if (n) name = JSON.parse(n) || DEFAULT_NAME; } catch (e) {}
  const g = (m: string, k: string) => (raw[m] && raw[m][k]) || null;

  if (sel.includes('planner')) {
    const pl = g('planner', 'ml_planner'); const nt = g('planner', 'ml_notes');
    const tasks = ((pl && pl.tasks) || []).filter((t: any) => inP(t.due));
    const events = ((pl && pl.events) || []).filter((e: any) => inP(e.date));
    const notes = ((nt && nt.notes) || []).filter((n: any) => !from || !n.u || inP(new Date(n.u).toISOString().slice(0, 10)));
    if (tasks.length) sheets.push({ name: 'Tasks', head: ['Task', 'Category', 'Priority', 'Due', 'Status', 'Note'], rows: tasks.map((t: any) => [t.name || '', t.cat || '', t.prio || '', t.due || '', t.status || '', t.note || '']) });
    if (events.length) sheets.push({ name: 'Events', head: ['Event', 'Date', 'Reminder', 'Done'], rows: events.map((e: any) => [e.name || '', e.date || '', e.remind || '', e.done ? 'Yes' : 'No']) });
    if (notes.length) sheets.push({ name: 'Notes', head: ['Title', 'Text', 'Pinned'], rows: notes.map((n: any) => [n.t || '', typeof n.s === 'string' ? n.s : JSON.stringify(n.s ?? ''), n.pin ? 'Yes' : 'No']) });
    totals.push(['Notes', String(notes.length)], ['Tasks', String(tasks.length)], ['Events', String(events.length)]);
    if (tasks.length) { const dn = tasks.filter((t: any) => t.status === 'done').length; charts.push({ title: 'Tasks', kind: 'donut', labels: ['Done', 'To do'], values: [dn, tasks.length - dn] }); }
  }
  if (sel.includes('finance')) {
    const f = g('finance', 'ml_finance'); const d = g('finance', 'ml_debts'); const sv = g('finance', 'ml_savings');
    const allSp = ((f && f.spends) || []) as any[];
    const inPSp = allSp.filter((s: any) => inP(s.date));
    const sp = inPSp.filter((s: any) => s.cat !== 'Savings');
    const put = inPSp.filter((s: any) => s.cat === 'Savings');
    const goals = ((sv && sv.goals) || []) as any[];
    const gname = (id: any) => { const gg = goals.find((x: any) => x.id === id); return gg ? gg.name : ''; };
    const inc: [string, string, number][] = [];
    Object.keys((f && f.inc) || {}).sort().forEach((m) => { if (inP(m)) Object.keys(f.inc[m] || {}).forEach((s) => inc.push([m, s, num(f.inc[m][s])])); });
    const tin = inc.reduce((a, r) => a + r[2], 0); const tsp = sp.reduce((a: number, s: any) => a + num(s.amt), 0); const tsv = put.reduce((a: number, s: any) => a + num(s.amt), 0);
    if (sp.length) sheets.push({ name: 'Spending', head: ['Date', 'Item', 'Category', 'Amount (' + cu() + ')'], rows: sp.map((s: any) => [s.date || '', s.name || '', s.cat || '', num(s.amt)]) });
    if (put.length) sheets.push({ name: 'Savings entries', head: ['Date', 'Item', 'Goal', 'Amount (' + cu() + ')'], rows: put.map((s: any) => [s.date || '', s.name || '', gname(s.goal) || 'No goal chosen', num(s.amt)]) });
    if (inc.length) sheets.push({ name: 'Income', head: ['Month', 'Source', 'Amount (' + cu() + ')'], rows: inc });
    const debts = (d && d.debts) || [];
    if (debts.length) sheets.push({ name: 'Commitments', head: ['Name', 'Balance (' + cu() + ')', 'Monthly (' + cu() + ')', 'Due day', 'Since', 'Saves into goal'], rows: debts.map((x: any) => [x.name || '', num(x.bal), num(x.monthly), num(x.due), x.since || '', gname(x.goal)]) });
    if (goals.length) {
      sheets.push({ name: 'Savings goals', head: ['Goal', 'Kept in', 'Target (' + cu() + ')', 'Saved (' + cu() + ')', 'Progress', 'To go (' + cu() + ')', 'Target date'], rows: goals.map((x: any) => { const sd = goalSaved(x, allSp, d); const tg = num(x.target); return [x.name || '', x.place || '', tg, sd, tg > 0 ? Math.min(100, Math.round((sd / tg) * 100)) + '%' : '-', Math.max(0, Math.round((tg - sd) * 100) / 100), x.due || '']; }) });
      const gl: (string | number)[][] = []; goals.forEach((x: any) => goalLines(x, allSp, d).filter((l) => inP(l.date)).forEach((l) => gl.push([x.name || '', l.date || '', l.src === 'tracker' ? 'Spending Tracker' : l.src === 'commit' ? 'Monthly commitment' : l.src === 'out' ? 'Taken out' : 'Opening amount', l.note, l.amt])));
      if (gl.length) sheets.push({ name: 'Savings history', head: ['Goal', 'Date', 'Source', 'Note', 'Amount (' + cu() + ')'], rows: gl });
    }
    const lim = ((f && f.limits) || {}) as Record<string, number>; const bcAll: Record<string, number> = {};
    sp.forEach((x: any) => { const c = x.cat || 'Other'; bcAll[c] = (bcAll[c] || 0) + num(x.amt); });
    const ymNow = new Date().toISOString().slice(0, 7); const curSp: Record<string, number> = {};
    allSp.filter((x: any) => x.cat !== 'Savings' && String(x.date || '').slice(0, 7) === ymNow).forEach((x: any) => { const c = x.cat || 'Other'; curSp[c] = (curSp[c] || 0) + num(x.amt); });
    const lk = Object.keys(lim).filter((c) => lim[c] > 0);
    if (lk.length) sheets.push({ name: 'Category limits', head: ['Category', 'Monthly limit (' + cu() + ')', 'Spent this month (' + cu() + ')', 'Used'], rows: lk.map((c) => [c, num(lim[c]), Math.round((curSp[c] || 0) * 100) / 100, Math.round(((curSp[c] || 0) / lim[c]) * 100) + '%']) });
    // Money Left for each month in the period, worked out the same way as the app does
    const months = new Set<string>(); Object.keys((f && f.inc) || {}).forEach((m) => { if (inP(m)) months.add(m); }); inPSp.forEach((x: any) => { if (x.date) months.add(String(x.date).slice(0, 7)); });
    const mrows: (string | number)[][] = []; let ovr = 0;
    Array.from(months).sort().forEach((m) => {
      const mi = Object.keys((f && f.inc && f.inc[m]) || {}).reduce((a, k2) => a + num(f.inc[m][k2]), 0);
      const L = calcLeft({ ym: m, income: mi, commit: commitFor(d, m), spends: allSp });
      if (L.left < 0) ovr++;
      mrows.push([MN3[Number(m.slice(5, 7)) - 1] + ' ' + m.slice(0, 4), mi, L.commit, Math.round(L.spent * 100) / 100, Math.round(L.savings * 100) / 100, Math.round(L.left * 100) / 100]);
    });
    if (mrows.length) sheets.push({ name: 'Money left', head: ['Month', 'Income (' + cu() + ')', 'Commitments (' + cu() + ')', 'Spending (' + cu() + ')', 'Savings goals (' + cu() + ')', 'Left (' + cu() + ')'], rows: mrows });
    const tcm = mrows.reduce((a, r) => a + num(r[2]), 0); const net = mrows.length ? mrows.reduce((a, r) => a + num(r[5]), 0) : tin - tsp - tsv;
    totals.push(['Total income', rm(tin)]);
    if (tcm > 0) totals.push(['Commitments and debts', rm(tcm)]);
    totals.push(['Total spending', rm(tsp)]);
    if (tsv > 0) totals.push(['Put into savings goals', rm(tsv)]);
    totals.push(['Money left', rm(net)]);
    if (goals.length) totals.push(['Saved in all goals', rm(goals.reduce((a: number, x: any) => a + goalSaved(x, allSp, d), 0))]);
    if (ovr > 0) totals.push(['Months over budget', String(ovr)]);
    const bc: Record<string, number> = {}; const bd: Record<string, number> = {};
    sp.forEach((x: any) => { const c = x.cat || 'Other'; bc[c] = (bc[c] || 0) + num(x.amt); if (x.date) bd[x.date] = (bd[x.date] || 0) + num(x.amt); });
    const cs = Object.keys(bc).sort((a, b) => bc[b] - bc[a]).slice(0, 7);
    if (tin || tsp) charts.push({ title: 'Income and spending', kind: 'bars', labels: tsv > 0 ? ['Income', 'Spending', 'Savings', 'Left'] : ['Income', 'Spending', 'Left'], values: tsv > 0 ? [tin, tsp, tsv, Math.max(0, net)] : [tin, tsp, Math.max(0, net)], unit: cu() });
    if (cs.length) charts.push({ title: 'Spending by category', kind: 'hbars', labels: cs, values: cs.map((c) => Math.round(bc[c] * 100) / 100), unit: cu() });
    const dk = Object.keys(bd).sort().slice(-14);
    if (dk.length > 1) charts.push({ title: 'Daily spending', kind: 'bars', labels: dk.map(dm), values: dk.map((k) => Math.round(bd[k] * 100) / 100), unit: cu(), color: '#ff8f5a' });
    if (goals.length) charts.push({ title: 'Savings goals progress (%)', kind: 'hbars', labels: goals.slice(0, 7).map((x: any) => String(x.name || '').slice(0, 16)), values: goals.slice(0, 7).map((x: any) => num(x.target) > 0 ? Math.min(100, Math.round((goalSaved(x, allSp, d) / num(x.target)) * 100)) : 0), unit: '%', color: '#34d399' });
  }
  if (sel.includes('record')) {
    const r = g('record', 'ml_record'); const rows: (string | number)[][] = []; let km = 0;
    Object.keys((r && r.data) || {}).forEach((veh) => {
      const v = r.data[veh] || {};
      (v.readings || []).filter((x: any) => inP(x.date)).forEach((x: any) => rows.push([veh, 'Mileage', x.date || '', '', '', num(x.odo)]));
      (v.exps || []).filter((x: any) => inP(x.date)).forEach((x: any) => rows.push([veh, 'Expense', x.date || '', x.name || '', num(x.amt), '']));
      (v.fuel || []).filter((x: any) => inP(x.date)).forEach((x: any) => rows.push([veh, 'Fuel', x.date || '', num(x.liters) + ' L', num(x.amt), num(x.odo) || '']));
      const odos = (v.readings || []).map((x: any) => num(x.odo)).filter((n: number) => n > 0); if (odos.length) km += Math.max(...odos) - Math.min(...odos);
    });
    const first = Object.keys((r && r.data) || {})[0]; const rd = first ? ((r.data[first].readings || []).filter((x: any) => inP(x.date)).slice().sort((a: any, b: any) => (a.date < b.date ? -1 : 1)).slice(-14)) : [];
    if (rd.length > 1) charts.push({ title: 'Odometer (km), latest readings', kind: 'line', labels: rd.slice(-12).map((x: any) => dm(x.date)), values: rd.slice(-12).map((x: any) => num(x.odo)), color: '#e0518a' });
    if (rows.length) sheets.push({ name: 'Record', head: ['Vehicle', 'Type', 'Date', 'Detail', 'Amount (' + cu() + ')', 'Odometer (km)'], rows });
    totals.push(['Record entries', String(rows.length)]);
  }
  if (sel.includes('habit')) {
    const h = g('habit', 'ml_habit'); const days = (h && h.days) || {};
    const keys = Object.keys(days).sort().filter((k) => inP(k) && (num(days[k].steps) > 0 || num(days[k].sleep) > 0 || num(days[k].cups) > 0 || num(days[k].mood) >= 0));
    const rows = keys.map((k) => { const x = days[k] || {}; return [k, num(x.steps), num(x.sleep), x.mood >= 0 ? ['Awful', 'Low', 'Okay', 'Good', 'Great'][x.mood] || '' : '', num(x.cups)]; });
    if (rows.length) sheets.push({ name: 'Habit and Health', head: ['Date', 'Steps', 'Sleep (hours)', 'Mood', 'Water (cups)'], rows });
    const kg = ((h && h.kg) || []).filter((x: any) => inP(x.d));
    if (kg.length) sheets.push({ name: 'Weight', head: ['Date', 'Weight (kg)'], rows: kg.map((x: any) => [x.d, num(x.v)]) });
    totals.push(['Habit days', String(rows.length)]);
    const hk = keys.slice(-14);
    if (hk.some((k) => num(days[k].steps) > 0)) charts.push({ title: 'Steps per day', kind: 'bars', labels: hk.map(dm), values: hk.map((k) => num(days[k].steps)), color: '#7c9cff' });
    if (hk.some((k) => num(days[k].sleep) > 0)) charts.push({ title: 'Sleep (hours)', kind: 'line', labels: hk.map(dm), values: hk.map((k) => num(days[k].sleep)), color: '#b794ff' });
  }
  if (sel.includes('islamic')) {
    const p = g('islamic', 'ml_puasa'); const t = g('islamic', 'ml_tasbih'); const i = g('islamic', 'ml_islamic');
    const KN: Record<string, string> = { r: 'Ramadan', s: 'Sunnah', q: 'Make-up', x: 'Excused' };
    const fd = Object.keys((p && p.days) || {}).sort().filter((k) => inP(k)).map((k) => [k, KN[p.days[k]] || String(p.days[k])]);
    if (fd.length) sheets.push({ name: 'Fasting', head: ['Date', 'Kind'], rows: fd });
    if (t) sheets.push({ name: 'Tasbih', head: ['Day', 'Total'], rows: [[t.day || '', num(t.total)]] });
    const fl = i ? flat(i) : []; if (fl.length) sheets.push({ name: 'Islamic Hub', head: ['Item', 'Value'], rows: fl });
    totals.push(['Fasting days', String(fd.length)]);
    if (fd.length) { const cn: Record<string, number> = {}; fd.forEach((x) => { cn[x[1]] = (cn[x[1]] || 0) + 1; }); const ks = Object.keys(cn); charts.push({ title: 'Fasting days', kind: 'donut', labels: ks, values: ks.map((k) => cn[k]) }); }
  }
  if (sel.includes('usage')) {
    const u = g('usage', 'ml_usage_v1') || {};
    const uk = Object.keys(u).sort().filter((k) => inP(k));
    if (uk.length) {
      sheets.push({ name: 'App usage', head: ['Date', 'Opens', 'Time spent (min)'], rows: uk.map((k) => [k, num(u[k].opens), Math.round(num(u[k].sec) / 60)]) });
      const ul = uk.slice(-14);
      charts.push({ title: 'Minutes in the app', kind: 'bars', labels: ul.map(dm), values: ul.map((k) => Math.round(num(u[k].sec) / 60)), color: '#5ee7df' });
    }
  }
  return { sheets, totals, charts, name, period: PERN[per], created: stamp() };
}

export const toCsv = (r: Report) => {
  const q = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const out: string[] = [q('My Life 1.0'), [q('Report for'), q(r.name || '')].join(','), [q('Period'), q(r.period)].join(','), [q('Created'), q(r.created)].join(','), '', q('Summary')];
  r.totals.forEach(([a, b]) => out.push([a, b].map(q).join(',')));
  r.sheets.forEach((s) => { out.push('', q(s.name), s.head.map(q).join(',')); s.rows.forEach((x) => out.push(x.map(q).join(','))); });
  return '﻿' + out.join('\r\n');
};

const esc = (v: any) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PAL = ['#7c9cff', '#34d399', '#ffb454', '#ff8fab', '#b794ff', '#5ee7df', '#94a3b8'];
const fmtN = (n: number) => (Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10).toLocaleString('en-US');

function svgBars(c: Chart) {
  const W = 300, H = 140, L = 6, B = 24, T = 14; const n = c.values.length; const mx = Math.max(...c.values, 1);
  const bw = Math.min(26, (W - L * 2) / n - 6);
  const bars = c.values.map((v, i) => { const h = ((H - B - T) * v) / mx; const x = L + (i + 0.5) * ((W - L * 2) / n) - bw / 2; const y = H - B - h;
    return '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + Math.max(h, 1) + '" rx="4" fill="' + (c.color || PAL[i % PAL.length]) + '"/>' + (n <= 8 ? '<text x="' + (x + bw / 2) + '" y="' + (y - 3) + '" font-size="8" text-anchor="middle" fill="#445">' + fmtN(v) + '</text>' : '')
      + (n <= 8 || i % Math.ceil(n / 7) === 0 ? '<text x="' + (x + bw / 2) + '" y="' + (H - 9) + '" font-size="8" text-anchor="middle" fill="#667">' + esc(c.labels[i]) + '</text>' : ''); }).join('');
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%"><line x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - L) + '" y2="' + (H - B) + '" stroke="#dde"/>' + bars + '</svg>';
}
function svgHBars(c: Chart) {
  const mx = Math.max(...c.values, 1); const rh = 22; const H = c.values.length * rh + 4;
  const rows = c.values.map((v, i) => '<text x="0" y="' + (i * rh + 13) + '" font-size="9" fill="#334">' + esc(c.labels[i]) + '</text><rect x="86" y="' + (i * rh + 3) + '" width="' + Math.max(3, (150 * v) / mx) + '" height="12" rx="6" fill="' + PAL[i % PAL.length] + '"/><text x="' + (90 + (150 * v) / mx) + '" y="' + (i * rh + 13) + '" font-size="9" fill="#445">' + fmtN(v) + '</text>').join('');
  return '<svg viewBox="0 0 300 ' + H + '" width="100%">' + rows + '</svg>';
}
function svgLine(c: Chart) {
  const n = c.values.length; const many = n > 7; const W = 300, H = many ? 170 : 150, L = 16, B = many ? 46 : 26, T = 22; const mn = Math.min(...c.values), mx = Math.max(...c.values); const rg = mx - mn || 1; const col = c.color || PAL[0];
  const pts = c.values.map((v, i) => [L + (i * (W - L * 2)) / Math.max(n - 1, 1), T + (H - B - T) * (1 - (v - mn) / rg)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = d + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (H - B) + ' L' + pts[0][0].toFixed(1) + ' ' + (H - B) + ' Z';
  const dots = pts.map((p) => '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.6" fill="#fff" stroke="' + col + '" stroke-width="1.8"/>').join('');
  // A value above every point (alternating above and below when there are many, so numbers do not collide), and a date under every point.
  const vals = pts.map((p, i) => { const up = !many || i % 2 === 0; const anc = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'; return '<text x="' + p[0].toFixed(1) + '" y="' + (up ? p[1] - 6 : p[1] + 12).toFixed(1) + '" font-size="' + (many ? 6.5 : 8) + '" font-weight="600" text-anchor="' + anc + '" fill="#334">' + fmtN(c.values[i]) + '</text>'; }).join('');
  const lb = c.labels.map((l, i) => many
    ? '<text transform="translate(' + (pts[i][0] + 2).toFixed(1) + ' ' + (H - B + 8) + ') rotate(55)" font-size="6.5" fill="#667">' + esc(l) + '</text>'
    : '<text x="' + pts[i][0].toFixed(1) + '" y="' + (H - 9) + '" font-size="8" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '" fill="#667">' + esc(l) + '</text>').join('');
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%"><line x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - L) + '" y2="' + (H - B) + '" stroke="#dde"/><path d="' + area + '" fill="' + col + '" opacity=".14"/><path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="2.2" stroke-linejoin="round"/>' + dots + vals + lb + '</svg>';
}
function svgDonut(c: Chart) {
  const tot = c.values.reduce((a, b) => a + b, 0) || 1; const R = 42, C = 2 * Math.PI * R; let off = 0;
  const arcs = c.values.map((v, i) => { const len = (v / tot) * C; const e = '<circle cx="60" cy="60" r="' + R + '" fill="none" stroke="' + PAL[i % PAL.length] + '" stroke-width="16" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 60 60)"/>'; off += len; return e; }).join('');
  const leg = c.labels.map((l, i) => '<tspan x="140" dy="' + (i ? 18 : 0) + '" fill="#334"><tspan fill="' + PAL[i % PAL.length] + '">●</tspan> ' + esc(l) + ': ' + fmtN(c.values[i]) + '</tspan>').join('');
  return '<svg viewBox="0 0 300 120" width="100%">' + arcs + '<text x="60" y="64" font-size="15" font-weight="700" text-anchor="middle" fill="#1b2140">' + fmtN(tot) + '</text><text x="140" y="' + (60 - (c.labels.length - 1) * 9) + '" font-size="10">' + leg + '</text></svg>';
}
const chartSvg = (c: Chart) => (c.kind === 'bars' ? svgBars(c) : c.kind === 'hbars' ? svgHBars(c) : c.kind === 'line' ? svgLine(c) : svgDonut(c));

export const PDF_CSS = '*{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:14mm}body{font-family:Helvetica,Arial,sans-serif;color:#1b2140;margin:0}'
  + '.ban{background:linear-gradient(120deg,#3b4ea8,#7a50e6 60%,#2fa8c9);color:#fff;border-radius:18px;padding:22px 24px}.ban h1{margin:0 0 12px;font-size:30px;letter-spacing:-.5px}.ban .s{font-size:13px;opacity:.9;margin-bottom:14px}'
  + '.pill{display:inline-block;background:rgba(255,255,255,.2);border-radius:999px;padding:5px 12px;font-size:11.5px;margin:0 6px 4px 0}'
  + 'h2{margin:0 0 8px;color:#3b4ea8;font-size:15px}h3{margin:0 0 6px;font-size:12px;color:#1b2140}h3 small{color:#889;font-weight:400}.sec{margin:26px 0 10px;font-size:17px;font-weight:700}.m{color:#667;font-size:11px}'
  + '.g{display:flex;flex-wrap:wrap;gap:10px}.t{border-radius:14px;padding:10px 14px;min-width:120px;flex:1 1 28%}.t b{display:block;font-size:19px}.t span{font-size:11px;color:#556}'
  + '.cs{display:flex;flex-wrap:wrap;gap:12px}.c{box-sizing:border-box;width:calc(50% - 6px);border:1px solid #e3e6f5;border-radius:14px;padding:12px 14px;page-break-inside:avoid}'
  + '.blk{margin-top:22px;page-break-inside:avoid}table{border-collapse:collapse;width:100%;font-size:11px}th{background:#3b4ea8;color:#fff;text-align:left;padding:6px 7px}th:first-child{border-radius:8px 0 0 0}th:last-child{border-radius:0 8px 0 0}td{padding:5px 7px;border-bottom:1px solid #e6e9f5}tr:nth-child(even) td{background:#f6f7fd}'
  + '.f{margin-top:30px;border-top:1px solid #e3e6f5;padding-top:10px;color:#889;font-size:10.5px;text-align:center;page-break-inside:avoid}.f b{display:block;color:#3b4ea8;font-size:13px;letter-spacing:.2px;margin-bottom:3px}.f span{display:block;line-height:1.6}';
export const pdfFooter = (name?: string) => '<div class="f"><b>My Life 1.0</b><span>' + (name ? 'Prepared for ' + esc(name) + '. ' : '') + 'Made privately on this phone.</span><span>Keep this file safe, it may contain personal details.</span></div>';
export { esc as escHtml, PAL, fmtN, chartSvg };
export function toHtml(r: Report) {
  const tcol = ['#eef1ff', '#e9fbf4', '#fff4e3', '#ffeef3', '#f3edff', '#e8fbfa'];
  const tiles = r.totals.map(([a, b], i) => '<div class="t" style="background:' + tcol[i % tcol.length] + '"><b>' + esc(b) + '</b><span>' + esc(a) + '</span></div>').join('');
  const cards = r.charts.map((c) => '<div class="c"><h3>' + esc(c.title) + (c.unit ? ' <small>(' + esc(c.unit) + ')</small>' : '') + '</h3>' + chartSvg(c) + '</div>').join('');
  const tabs = r.sheets.map((s) => '<div class="blk"><h2>' + esc(s.name) + '</h2><table><tr>' + s.head.map((h) => '<th>' + esc(h) + '</th>').join('') + '</tr>' +
    s.rows.slice(0, 600).map((x) => '<tr>' + x.map((c, ci) => '<td>' + esc(typeof c === 'number' ? (s.head[ci].indexOf('(' + cu() + ')') >= 0 ? c.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : fmtN(c)) : c) + '</td>').join('') + '</tr>').join('') + '</table>' + (s.rows.length > 600 ? '<p class="m">Showing the first 600 of ' + s.rows.length + ' rows. Use Excel for everything.</p>' : '') + '</div>').join('');

  return '<html><head><meta charset="utf-8"><style>' + PDF_CSS + '</style></head><body><div class="ban"><h1>My Life 1.0</h1><div class="s">' + (r.name ? 'Personal report for ' + esc(r.name) : 'Personal report') + '</div><span class="pill">Period: ' + esc(r.period) + '</span><span class="pill">Created: ' + esc(r.created) + '</span></div>'
    + '<div class="sec">Summary</div><div class="g">' + tiles + '</div>' + (cards ? '<div class="sec">Charts</div><div class="cs">' + cards + '</div>' : '') + (tabs ? '<div class="sec">Details</div>' + tabs : '<p>No data saved yet for this period.</p>')
    + pdfFooter(r.name)+'</body></html>';
}

export async function toXlsxBase64(r: Report): Promise<string> {
  const X: any = await import('xlsx');
  const wb = X.utils.book_new();
  const t = X.utils.aoa_to_sheet([['My Life 1.0', ''], ['Report for', r.name || ''], ['Period', r.period], ['Created', r.created], ['', ''], ['Summary', ''], ...r.totals]);
  t['!cols'] = [{ wch: 24 }, { wch: 26 }];
  X.utils.book_append_sheet(wb, t, 'Summary');
  r.sheets.forEach((s) => {
    const ws = X.utils.aoa_to_sheet([s.head, ...s.rows]);
    ws['!cols'] = s.head.map((h, i) => ({ wch: Math.min(42, Math.max(h.length + 3, ...s.rows.slice(0, 80).map((x) => String(x[i] ?? '').length + 2))) }));
    ws['!autofilter'] = { ref: X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(s.rows.length, 1), c: s.head.length - 1 } }) };
    s.head.forEach((h, c) => { if (h.indexOf('(' + cu() + ')') >= 0) s.rows.forEach((_, i) => { const cell = ws[X.utils.encode_cell({ r: i + 1, c })]; if (cell && typeof cell.v === 'number') cell.z = '#,##0.00'; }); });
    X.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  });
  return X.write(wb, { bookType: 'xlsx', type: 'base64' });
}

// Saves the file and opens the phone's share sheet (or downloads it on the web).
export async function deliver(name: string, mime: string, body: string, base64 = false): Promise<boolean> {
  if (Platform.OS === 'web') {
    let part: any = body;
    if (base64) { const bin = atob(body); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); part = u; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new (globalThis as any).Blob([part], { type: mime })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); return true;
  }
  const FS = await import('expo-file-system/legacy'); const Sh = await import('expo-sharing');
  const uri = (FS.cacheDirectory || '') + name;
  await FS.writeAsStringAsync(uri, body, { encoding: base64 ? FS.EncodingType.Base64 : FS.EncodingType.UTF8 });
  if (!(await Sh.isAvailableAsync())) return false;
  await Sh.shareAsync(uri, { mimeType: mime, dialogTitle: name });
  return true;
}
export async function deliverPdf(html: string, name = 'my-life-report.pdf'): Promise<boolean> {
  const Print = await import('expo-print');
  if (Platform.OS === 'web') { await Print.printAsync({ html }); return true; }
  const r = await Print.printToFileAsync({ html }); const Sh = await import('expo-sharing');
  if (!(await Sh.isAvailableAsync())) return false;
  let uri = r.uri;
  try { const FS = await import('expo-file-system/legacy'); const to = (FS.cacheDirectory || '') + name; await FS.deleteAsync(to, { idempotent: true }); await FS.copyAsync({ from: r.uri, to }); uri = to; } catch (e) { /* keep the original name */ }
  await Sh.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: name }); return true;
}
