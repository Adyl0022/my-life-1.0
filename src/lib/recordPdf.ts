import { PDF_CSS, pdfFooter, escHtml as esc, fmtN, chartSvg, stamp, Chart } from './exporter';
import { cs, cu } from './region';

const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const n0 = (x: any) => (typeof x === 'number' && isFinite(x) ? x : Number(x) || 0);
const k = (n: number) => Math.round(n).toLocaleString('en-US');
const rm = (n: number) => cs() + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fd = (s: string) => { const p = (s || '').split('-'); return p.length === 3 ? Number(p[2]) + ' ' + MN[Number(p[1]) - 1] + ' ' + p[0] : s || '-'; };
const mk = (s: string) => (s || '').slice(0, 7);
const ml = (m: string) => MN[Number(m.slice(5, 7)) - 1] + " '" + m.slice(2, 4);
const daysTo = (s: string) => { const a = new Date(s + 'T00:00:00').getTime(); const n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((a - n.getTime()) / 86400000); };

const EXTRA = '.ban.rec{background:linear-gradient(120deg,#d63f7c,#7a50e6 58%,#2f7fd0)}.ban .big{font-size:13px;opacity:.92;margin:-4px 0 12px}'
  + '.rn{display:flex;gap:10px}.rn>div{flex:1;border-radius:14px;padding:12px 14px;page-break-inside:avoid}.rn b{display:block;font-size:13px}.rn span{display:block;font-size:11px;margin-top:3px}.rn i{display:inline-block;margin-top:7px;font-style:normal;font-size:10.5px;font-weight:700;border-radius:999px;padding:3px 10px;background:rgba(255,255,255,.75)}'
  + '.pb{margin:9px 0;page-break-inside:avoid}.pb .h{display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:4px}.pb .tr{height:9px;border-radius:5px;background:#e8ebf7;overflow:hidden}.pb .tr div{height:9px;border-radius:5px}'
  + '.tbl h2{color:#d63f7c}.tbl th{background:#7a50e6}.tot{font-weight:700}'
  + '.hl{background:#f6f7fd;border-radius:12px;padding:10px 14px;font-size:12px;margin-top:10px;line-height:1.6}';

function tbl(title: string, head: string[], rows: string[][], note?: string) {
  if (!rows.length) return '<div class="blk tbl"><h2>' + title + '</h2><p class="m">No records yet.</p></div>';
  return '<div class="blk tbl"><h2>' + title + (note ? ' <span class="m">· ' + note + '</span>' : '') + '</h2><table><tr>' + head.map((h) => '<th>' + h + '</th>').join('') + '</tr>'
    + rows.map((r) => '<tr>' + r.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</table></div>';
}

export function buildRecordHtml(vehicle: string, d: any, latest: number, owner = ''): string {
  const rd: { date: string; odo: number }[] = (d.readings || []).concat(d.yreadings || []).filter((r: any) => r && r.date).sort((a: any, b: any) => (a.date < b.date ? -1 : 1));
  const exps = (d.exps || []).slice().sort((a: any, b: any) => (a.date < b.date ? 1 : -1));
  const fuel = (d.fuel || []).slice().sort((a: any, b: any) => (a.date < b.date ? 1 : -1));
  const parts = d.parts || []; const ren = d.renew || {};
  const mTot = exps.reduce((s: number, e: any) => s + n0(e.amt), 0);
  const fTot = fuel.reduce((s: number, e: any) => s + n0(e.amt), 0);
  const lit = fuel.reduce((s: number, e: any) => s + n0(e.liters), 0);
  const odos = rd.map((r) => n0(r.odo)).filter((x) => x > 0);
  const dist = odos.length > 1 ? Math.max(...odos) - Math.min(...odos) : 0;
  const cpk = dist > 0 ? (mTot + fTot) / dist : 0;
  // Fuel economy needs real fill-ups: distance between the first and last fill-up that have an odometer reading,
  // divided by the litres put in after the first one (the full-tank method). With fewer than two fill-ups there is no honest figure.
  const fo = fuel.filter((e: any) => n0(e.odo) > 0 && n0(e.liters) > 0).sort((a: any, b: any) => n0(a.odo) - n0(b.odo));
  const fdist = fo.length > 1 ? n0(fo[fo.length - 1].odo) - n0(fo[0].odo) : 0;
  const flit = fo.slice(1).reduce((s: number, e: any) => s + n0(e.liters), 0);
  const kmlRaw = fdist > 0 && flit > 0 ? fdist / flit : 0;
  const kml = kmlRaw >= 5 && kmlRaw <= 120 ? kmlRaw : 0;

  // monthly distance + spending
  const dm: Record<string, number> = {};
  for (let i = 1; i < rd.length; i++) { const dlt = n0(rd[i].odo) - n0(rd[i - 1].odo); if (dlt > 0) dm[mk(rd[i].date)] = (dm[mk(rd[i].date)] || 0) + dlt; }
  const yr: Record<string, number> = {}; rd.forEach((x) => { const y = (x.date || '').slice(0, 4); if (y && n0(x.odo) > (yr[y] || 0)) yr[y] = n0(x.odo); });
  const sp: Record<string, number> = {};
  exps.concat(fuel).forEach((e: any) => { const m = mk(e.date); if (m) sp[m] = (sp[m] || 0) + n0(e.amt); });
  const last = (o: Record<string, number>) => Object.keys(o).sort().slice(-6);
  const charts: Chart[] = [];
  const rl = rd.slice(-12);
  if (rl.length > 1) charts.push({ title: 'Odometer over time (each reading)', kind: 'line', labels: rl.map((x) => fd(x.date).slice(0, -5)), values: rl.map((x) => n0(x.odo)), unit: 'km', color: '#d63f7c' });
  if (last(dm).length) charts.push({ title: 'Distance travelled per month', kind: 'bars', labels: last(dm).map(ml), values: last(dm).map((m) => dm[m]), unit: 'km', color: '#7a50e6' });
  const yk = Object.keys(yr).sort().slice(-5);
  if (yk.length > 1) charts.push({ title: 'Odometer at the end of each year', kind: 'bars', labels: yk, values: yk.map((y) => yr[y]), unit: 'km', color: '#d63f7c' });
  if (last(sp).length) charts.push({ title: 'Spending per month', kind: 'bars', labels: last(sp).map(ml), values: last(sp).map((m) => Math.round(sp[m] * 100) / 100), unit: cu(), color: '#ff8f5a' });
  if (mTot + fTot > 0) charts.push({ title: 'Where the money went', kind: 'donut', labels: ['Maintenance', 'Fuel'], values: [Math.round(mTot * 100) / 100, Math.round(fTot * 100) / 100], unit: cu() });
  const fl = fuel.slice(0, 8).reverse();
  if (fl.length > 1) charts.push({ title: 'Recent fuel fill-ups', kind: 'bars', labels: fl.map((x: any) => fd(x.date).slice(0, -5)), values: fl.map((x: any) => n0(x.amt)), unit: cu(), color: '#34d399' });
  const byName: Record<string, number> = {};
  exps.forEach((e: any) => { const nm = String(e.name || 'Other').trim() || 'Other'; byName[nm] = (byName[nm] || 0) + n0(e.amt); });
  const top = Object.keys(byName).sort((a, b) => byName[b] - byName[a]).slice(0, 5);
  if (top.length > 1) charts.push({ title: 'Biggest maintenance costs', kind: 'hbars', labels: top.map((t) => (t.length > 14 ? t.slice(0, 13) + '…' : t)), values: top.map((t) => Math.round(byName[t] * 100) / 100), unit: cu() });

  const tc = ['#fff0f5', '#f3edff', '#fff4e3', '#e9fbf4', '#eef1ff', '#e8fbfa'];
  const tl: [string, string][] = [['Latest odometer', latest > 0 ? k(latest) + ' km' : '-'], ['Distance travelled', dist > 0 ? k(dist) + ' km' : '-'], ['Maintenance', rm(mTot)], ['Fuel', rm(fTot)], ['Cost per km', cpk > 0 ? cs() + cpk.toFixed(2) : '-'], ['Fuel economy', kml > 0 ? kml.toFixed(1) + ' km/L' : 'Add 2+ fill-ups']];
  const tiles = tl.map(([a, b], i) => '<div class="t" style="background:' + tc[i] + '"><b>' + esc(b) + '</b><span>' + esc(a) + '</span></div>').join('');

  const RK: [string, string][] = [['roadtax', 'Road tax'], ['insurance', 'Insurance'], ['licence', 'Driving licence']];
  const rn = RK.map(([key, label]) => {
    const s = ren[key]; if (!s) return '<div style="background:#eef0f7;color:#556"><b>' + label + '</b><span>Not set</span><i>Add a date in the app</i></div>';
    const n = daysTo(s); const [bg, fg, tx] = n < 0 ? ['#ffe3e8', '#b3243f', 'Expired ' + (-n) + ' days ago'] : n <= 30 ? ['#fff0d6', '#9a5b00', 'Due in ' + n + ' days'] : ['#dff7ec', '#146c4a', n + ' days left'];
    return '<div style="background:' + bg + ';color:' + fg + '"><b>' + label + '</b><span>Expires ' + fd(s) + '</span><i>' + tx + '</i></div>';
  }).join('');

  const pb = parts.map((p: any) => {
    const used = Math.max(0, latest - n0(p.odo)); const life = n0(p.life) || 1; const pc = Math.min(100, Math.round((used / life) * 100));
    const col = pc >= 100 ? '#e5484d' : pc >= 80 ? '#f5a524' : '#34d399';
    return '<div class="pb"><div class="h"><b>' + esc(p.name) + '</b><span>' + k(used) + ' of ' + k(life) + ' km · ' + pc + '%</span></div><div class="tr"><div style="width:' + Math.max(pc, 2) + '%;background:' + col + '"></div></div></div>';
  }).join('');

  const cards = charts.map((c) => '<div class="c"><h3>' + esc(c.title) + (c.unit ? ' <small>(' + esc(c.unit) + ')</small>' : '') + '</h3>' + chartSvg(c) + '</div>').join('');
  const sub = [(d.profile && d.profile.model) || '', (d.profile && d.profile.plate) || ''].filter(Boolean).join(' · ');
  const dmk = Object.keys(dm).filter((m) => dm[m] > 0); const hiM = dmk.sort((a, b) => dm[b] - dm[a])[0]; const loM = dmk.sort((a, b) => dm[a] - dm[b])[0];
  const hl = (mTot + fTot > 0 || dist > 0) ? '<div class="hl"><b>Highlights.</b> ' + (dist > 0 ? 'You rode ' + k(dist) + ' km since your first odometer reading (' + k(Math.min(...odos)) + ' km), which is why this is lower than your latest odometer. ' : '') + (dmk.length > 1 ? 'Your longest month was ' + ml(hiM) + ' (' + k(dm[hiM]) + ' km) and your shortest was ' + ml(loM) + ' (' + k(dm[loM]) + ' km). ' : '') + (mTot + fTot > 0 ? 'You spent ' + rm(mTot + fTot) + ' in total' + (cpk > 0 ? ', about ' + cs() + cpk.toFixed(2) + ' per km' : '') + '. ' : '') + (kml > 0 ? 'Your fuel economy is about ' + kml.toFixed(1) + ' km/L.' : '') + '</div>' : '';

  return '<html><head><meta charset="utf-8"><style>' + PDF_CSS + EXTRA + '</style></head><body>'
    + '<div class="ban rec"><h1>My Record · ' + esc(vehicle) + '</h1>' + (sub ? '<div class="big">' + esc(sub) + '</div>' : '') + '<span class="pill">Created: ' + esc(stamp()) + '</span>' + (owner ? '<span class="pill">For: ' + esc(owner) + '</span>' : '') + (latest > 0 ? '<span class="pill">Odometer: ' + k(latest) + ' km</span>' : '') + '</div>'
    + '<div class="sec">Summary</div><div class="g">' + tiles + '</div>' + hl
    + '<div class="sec">Renewals</div><div class="rn">' + rn + '</div>'
    + (cards ? '<div class="sec">Charts</div><div class="cs">' + cards + '</div>' : '')
    + (pb ? '<div class="sec">Parts life</div>' + pb : '')
    + '<div class="sec">Details</div>'
    + tbl('Odometer readings', ['Date', 'Odometer'], rd.slice().reverse().map((r) => [fd(r.date), k(n0(r.odo)) + ' km']))
    + tbl('Maintenance spending', ['Date', 'Item', 'Amount'], exps.map((e: any) => [fd(e.date), e.name || '-', rm(n0(e.amt))]), 'total ' + rm(mTot))
    + tbl('Parts', ['Part', 'Changed', 'Odometer', 'Lasts'], parts.map((p: any) => [p.name, fd(p.date), k(n0(p.odo)) + ' km', k(n0(p.life)) + ' km']))
    + tbl('Fuel', ['Date', 'Litres', 'Amount', 'Odometer'], fuel.map((e: any) => [fd(e.date), n0(e.liters).toFixed(1) + ' L', rm(n0(e.amt)), n0(e.odo) > 0 ? k(n0(e.odo)) + ' km' : '-']), 'total ' + rm(fTot) + ' · ' + lit.toFixed(1) + ' L')
    + pdfFooter(owner) + '</body></html>';
}
