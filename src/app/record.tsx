import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, G, Path, Pattern, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Glass } from '../components/Glass';
import { Blob } from '../components/Bg';
import { Inp, DateField, Sheet, SBtn, todayStr, W } from '../components/Ui';
import { useStored } from '../lib/store';
import { Ext, ProfileCard, RenewCard, FuelCard, PartsCard, DocsCard, ExportCard, renewStatus } from '../components/RecordExtras';
import { TOP } from '../lib/layout';

type Rd = { id: number; date: string; odo: number };
type Ex = { id: number; name: string; amt: number; date: string };
type Veh = Ext & { readings: Rd[]; yreadings: Rd[]; exps: Ex[] };
type Data = { cats: string[]; sel: number; data: Record<string, Veh>; nextId: number };
const EMPTY: Data = { cats: ['Motorcycle'], sel: 0, data: {}, nextId: 1 };
const blank = (): Veh => ({ readings: [], yreadings: [], exps: [] });
const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const num = (n: number) => n.toLocaleString('en-MY', { maximumFractionDigits: 0 });
const money = (n: number) => n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (s: string) => { const p = (s || '').split('-'); return p.length === 3 ? parseInt(p[2], 10) + ' ' + M[parseInt(p[1], 10) - 1] + ' ' + p[0] : s; };
const byDate = (a: Rd, b: Rd) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
const PG = ['#ff8fab', '#b794ff'] as [string, string];
const PINK = '#ffb3c6';
const TIPS = [
  'Check tyre pressure once a week. Correct pressure saves fuel and keeps the grip.', 'Look at the engine oil level before your first ride of the day.',
  'Wipe and lube the chain every 500 to 800 km, or after riding in the rain.', 'Test both brakes gently before you move off. They should feel firm, not spongy.',
  'Keep a small tool kit and a tyre repair kit under the seat.', 'Check that all lights and indicators work. A blown bulb is easy to miss.',
  'Warm up for 30 to 60 seconds in the morning, then ride gently for the first few minutes.', 'Wash it regularly. Dirt and salt hide small problems and speed up rust.',
  'Check the battery terminals for dust or white powder and clean them if needed.', 'Note the odometer reading on the same day each month for a clean comparison.',
  'Look for oil spots where you park. A new spot means a leak to check.', 'Replace the air filter on schedule. A clogged filter wastes fuel.',
  'Keep your service receipts. They help with resale and warranty claims.', 'Check the brake pad thickness every month or two. Replace before the metal shows.',
  'Do not leave the tank nearly empty for long. It can draw in dirt and moisture.', 'Cover it or park in the shade. Sun and rain age the seat, plastics and paint.',
  'Check your road tax, insurance and licence dates this week.', 'Listen for new sounds. A squeak, rattle or knock is an early warning.',
  'Check the coolant level if your vehicle is liquid cooled.', 'Inspect tyre tread. If the wear bars are level with the tread, it is time for new tyres.',
  'Tighten loose bolts and mirrors once in a while. Vibration loosens them.', 'Ride smoothly. Gentle throttle and early braking extend the life of the parts.',
  'Keep the spare key in a safe place at home, not on the vehicle.', 'Take a photo of your odometer when you log it. It helps if you need proof later.',
  'Check the suspension by pressing down on it. It should rebound smoothly.', 'Clean the helmet visor and check the strap. Replace a helmet after any hard impact.',
  'Review last month\'s spending here. Small repairs add up quickly.', 'Plan your next service a little early, before the due date, not after.',
  'Keep your phone mount and charger secure so they do not distract you while riding.', 'Check the horn, clutch and throttle cables for smooth movement.',
  'Before a long ride, check tyres, oil, chain and brakes, then rest every two hours.',
];
const STY: Record<string, [string, string, string]> = { warn: ['rgba(255,196,107,.16)', 'rgba(255,196,107,.4)', '#ffd593'], bad: ['rgba(255,143,171,.16)', 'rgba(255,143,171,.4)', '#ffb3c6'], good: ['rgba(94,231,181,.16)', 'rgba(94,231,181,.4)', '#7df0c6'], info: ['rgba(124,156,255,.18)', 'rgba(124,156,255,.45)', '#a9bcff'] };

const RecArt = () => (
  <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
    <Defs><Pattern id="rgrid" width="44" height="44" patternUnits="userSpaceOnUse"><Path d="M0 14h44M0 30h44" stroke="#fff" strokeWidth=".7" opacity=".07" /><Path d="M10 0v44" stroke="#ff8fab" strokeWidth=".7" opacity=".1" /></Pattern></Defs>
    <Rect width="390" height="844" fill="url(#rgrid)" />
    <G fill="#ff8fab" opacity=".15"><Path d="M20 844a110 110 0 0 1 220 0z" /><Path d="M200 844a80 80 0 0 1 160 0z" opacity=".7" /><Rect x="0" y="826" width="390" height="18" /></G>
    <G fill="none" stroke="#ffb3c6" strokeWidth="1.4" opacity=".25"><Circle cx="348" cy="70" r="26" /><Circle cx="348" cy="70" r="40" strokeDasharray="3 6" /></G>
    <Path d="M348 70l10-12" stroke="#ffb3c6" strokeWidth="2.4" strokeLinecap="round" opacity=".4" />
  </Svg>
);
const Logo = () => (
  <Svg width={44} height={44} viewBox="0 0 44 44">
    <Rect x="4" y="5" width="25" height="34" rx="5" fill="#fff" opacity=".95" /><Rect x="4" y="5" width="6" height="34" rx="3" fill="#ff8fab" />
    <Path d="M15 15h10M15 21h8" stroke="#ffc9d8" strokeWidth="2.4" strokeLinecap="round" /><Circle cx="32" cy="29" r="9" fill="#b794ff" /><Circle cx="32" cy="29" r="3.2" fill="#fff" />
    <Path d="M32 17v3M32 38v3M20 29h3M41 29h3" stroke="#b794ff" strokeWidth="3" strokeLinecap="round" />
  </Svg>
);
const Stat = ({ l, v, bg, vc }: { l: string; v: string; bg?: string; vc?: string }) => (
  <View style={{ flex: 1, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: bg || 'rgba(255,255,255,.08)' }}>
    <Text style={{ color: 'rgba(255,255,255,.68)', fontSize: 10.5 }}>{l}</Text>
    <Text style={{ color: vc || W, fontSize: 15, fontWeight: '800', marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{/ km$/.test(v) ? v.replace(/ km$/, '') : v}{/ km$/.test(v) ? <Text style={{ fontSize: 11, fontWeight: '700', color: vc || 'rgba(255,255,255,.75)' }}>{' km'}</Text> : null}</Text>
  </View>
);
const Arrow = ({ t, onPress, op, label }: { t: string; onPress: () => void; op: number; label: string }) => (
  <Pressable accessibilityLabel={label} onPress={onPress} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center', opacity: op }}><Text style={{ color: W, fontSize: 20, marginTop: -2 }}>{t}</Text></Pressable>
);
const Del = ({ onPress }: { onPress: () => void }) => <Pressable accessibilityLabel="Delete" onPress={onPress} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ff9aa9', fontSize: 14 }}>✕</Text></Pressable>;
const AddB = ({ t, onPress, w = 16 }: { t: string; onPress: () => void; w?: number }) => <Pressable onPress={onPress}><LinearGradient colors={PG} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 42, paddingHorizontal: w, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 12, fontWeight: '800' }}>{t}</Text></LinearGradient></Pressable>;
type Bar = { label: string; sub?: string; top: string; h: number; hot: boolean; delta: string; dc: string; warm?: boolean; note?: string };
const Bars = ({ bars, height = 158, noteH = 13 }: { bars: Bar[]; height?: number; noteH?: number }) => {
  const filled = bars.filter((x) => !!x.top); const mxH = Math.max(...bars.map((x) => (x.top ? x.h : 0)), 0); const showTop = filled.length >= 2 && mxH > 0; const mnH = Math.min(...filled.map((x) => x.h)); const showLow = showTop && mnH < mxH;
  return (
  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height, marginTop: 22 }}>
    {bars.map((b, i) => {
      const r = { width: '100%' as const, height: b.h, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 };
      return (
        <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: '100%' }}>
          <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 10 }}>{b.top}</Text>
          {b.hot ? <LinearGradient colors={b.warm ? ['#ffc46b', '#ff8fab'] : PG} style={r} /> : <View style={[r, { backgroundColor: b.warm ? (b.top ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.18)') : 'rgba(255,255,255,.25)' }]} />}
          <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11 }}>{b.label}</Text>
          {b.sub !== undefined ? <Text style={{ color: 'rgba(255,255,255,.45)', fontSize: 9, marginTop: -3 }}>{b.sub}</Text> : null}
          <Text numberOfLines={2} style={{ height: noteH, fontSize: 9.5, lineHeight: 12, textAlign: 'center', fontWeight: '800', color: showLow && b.note === undefined && b.top && b.h === mnH && b.h !== mxH ? '#7df0c6' : '#ffc46b' }}>{b.note !== undefined ? b.note : (showTop && b.top && b.h === mxH ? 'Highest' : (showLow && b.top && b.h === mnH ? 'Lowest' : ''))}</Text>
        </View>
      );
    })}
  </View>
  );
};

export default function Record() {
  const router = useRouter();
  const [st, setSt] = useStored<Data>('ml_record', EMPTY);
  const [mPage, setMPage] = useState<number | null>(null); const [sPage, setSPage] = useState<number | null>(null); const [selYear, setSelYear] = useState<string | null>(null); const [allExp, setAllExp] = useState(false); const [yPage, setYPage] = useState<number | null>(null);
  const [addingCat, setAddingCat] = useState(false); const [catIn, setCatIn] = useState(''); const [delAsk, setDelAsk] = useState(false); const [renaming, setRenaming] = useState(false); const [renIn, setRenIn] = useState('');
  const t0 = todayStr();
  const [rDate, setRDate] = useState(t0); const [rOdo, setROdo] = useState(''); const [yDate, setYDate] = useState(t0); const [yOdo, setYOdo] = useState('');
  const [eDate, setEDate] = useState(t0); const [eName, setEName] = useState(''); const [eAmt, setEAmt] = useState('');
  const [quick, setQuick] = useState<{ type: 'odo' | 'exp'; date: string; odo: string; name: string; amt: string } | null>(null);

  const catName = st.cats[st.sel] || st.cats[0];
  const d = st.data[catName] || blank();
  const upd = (fn: (v: Veh) => Veh, extra?: Partial<Data>) => setSt({ ...st, ...extra, data: { ...st.data, [catName]: fn({ ...d }) } });
  const sorted = d.readings.slice().sort(byDate);
  const latest = sorted.length ? sorted[sorted.length - 1].odo : 0;
  const allOdo = Math.max(latest, ...(d.yreadings || []).map((r) => r.odo), ...(d.fuel || []).map((f) => f.odo || 0));
  const now = new Date();
  const km = (from: string, to: string) => {
    const inR = sorted.filter((r) => r.date >= from && r.date < to); if (!inR.length) return null;
    const before = sorted.filter((r) => r.date < from);
    if (before.length) return Math.max(0, inR[inR.length - 1].odo - before[before.length - 1].odo);
    if (inR.length >= 2) return Math.max(0, inR[inR.length - 1].odo - inR[0].odo);
    return null;
  };
  const ysorted = d.readings.concat(d.yreadings || []).slice().sort(byDate);
  const mk = (y: number, m: number) => { const a = new Date(y, m, 1), b = new Date(y, m + 1, 1); return km(a.getFullYear() + '-' + pad(a.getMonth() + 1) + '-01', b.getFullYear() + '-' + pad(b.getMonth() + 1) + '-01'); };
  // monthly pages start Nov 2026, 6 months a page
  const mCur = Math.max(0, (now.getFullYear() - 2026) * 12 + (now.getMonth() - 10)); const mAuto = Math.floor(mCur / 6); const mPg = Math.min(mPage == null ? mAuto : mPage, mAuto);
  const monthsArr = [0, 1, 2, 3, 4, 5].map((k) => { const idx = mPg * 6 + k; const x = new Date(2026, 10 + idx, 1); return { y: x.getFullYear(), m: x.getMonth(), idx }; });
  const kms = monthsArr.map((mm) => mk(mm.y, mm.m));
  const maxKm = Math.max(...kms.map((k) => k || 0), 1);
  const dl = (c: number | null, p: number | null) => { if (c == null || p == null) return { t: '', col: 'rgba(255,255,255,.5)' }; const x = c - p; if (x === 0) return { t: '=', col: 'rgba(255,255,255,.6)' }; return { t: (x > 0 ? '+' : '-') + num(Math.abs(x)), col: x > 0 ? '#ffb3a0' : '#7df0c6' }; };
  const bars: Bar[] = monthsArr.map((mm, i) => { const x = dl(kms[i], mk(mm.y, mm.m - 1)); return { label: M[mm.m], sub: String(mm.y), top: kms[i] != null ? num(kms[i] as number) : '', h: kms[i] ? Math.max(8, Math.round(((kms[i] as number) / maxKm) * 78)) : 6, hot: mm.idx === mCur && !!kms[i], delta: x.t, dc: x.col }; });
  const cmp = (c: number | null, p: number | null, curName: string, prevName: string) => {
    const cur = c == null ? 'No data' : num(c) + ' km'; const prev = p == null ? 'No data' : num(p) + ' km';
    if (c == null || p == null) return { cur, prev, diff: '-', color: W, bg: undefined as string | undefined, note: 'Add odometer readings for both periods to compare ' + curName + ' with ' + prevName + '.' };
    const x = c - p; const pct = p > 0 ? Math.round(Math.abs(x) / p * 100) : 0;
    if (x === 0) return { cur, prev, diff: 'Same', color: W, bg: undefined, note: 'You rode the same distance as ' + prevName + '.' };
    return { cur, prev, diff: (x > 0 ? '+' : '-') + num(Math.abs(x)) + ' km', color: x > 0 ? '#ffb3a0' : '#7df0c6', bg: x > 0 ? 'rgba(255,143,107,.16)' : 'rgba(94,231,181,.16)', note: (x > 0 ? 'Up ' : 'Down ') + pct + '% (' + num(Math.abs(x)) + ' km ' + (x > 0 ? 'more' : 'less') + ') than ' + prevName + '.' };
  };
  const curKmV = mk(now.getFullYear(), now.getMonth()); const prevKmV = mk(now.getFullYear(), now.getMonth() - 1);
  const mc = cmp(curKmV, prevKmV, 'this month', 'last month');
  const yv = (y: number) => { const r = ysorted.filter((x) => x.date.slice(0, 4) === String(y)); return r.length ? r[r.length - 1].odo : null; };
  const yc = (() => {
    const c = yv(now.getFullYear()), p = yv(now.getFullYear() - 1);
    const cur = c == null ? 'No data' : num(c) + ' km'; const prev = p == null ? 'No data' : num(p) + ' km';
    if (c == null || p == null) return { cur, prev, diff: '-', color: W, bg: undefined as string | undefined, note: 'Add an odometer reading for this year and last year to see how far you rode.' };
    const x = c - p;
    if (x === 0) return { cur, prev, diff: 'Same', color: W, bg: undefined, note: 'No change since last year.' };
    return { cur, prev, diff: (x > 0 ? '+' : '-') + num(Math.abs(x)) + ' km', color: x > 0 ? '#ffb3a0' : '#7df0c6', bg: x > 0 ? 'rgba(255,143,107,.16)' : 'rgba(94,231,181,.16)', note: x > 0 ? 'You rode ' + num(x) + ' km since last year\'s reading.' : 'This year\'s reading is ' + num(Math.abs(x)) + ' km lower than last year. Check the readings.' };
  })();
  const yCurI = Math.max(0, now.getFullYear() - 2024); const yAuto = Math.floor(yCurI / 5); const yPg = Math.min(yPage == null ? yAuto : yPage, yAuto);
  const yearsArr = [0, 1, 2, 3, 4].map((k) => 2024 + yPg * 5 + k);
  const ykms = yearsArr.map((y) => yv(y)); const yMax = Math.max(...ykms.map((k) => k || 0), 1);
  const yBars: Bar[] = yearsArr.map((y, i) => { const x = dl(ykms[i], yv(y - 1)); return { label: String(y), top: ykms[i] != null ? num(ykms[i] as number) : '', h: ykms[i] ? Math.max(8, Math.round(((ykms[i] as number) / yMax) * 78)) : 6, hot: y === now.getFullYear() && !!ykms[i], delta: x.t, dc: x.col }; });
  // spending
  const keyOfM = (y: number, m: number) => { const x = new Date(y, m, 1); return x.getFullYear() + '-' + pad(x.getMonth() + 1); };
  const spendIn = (key: string) => d.exps.filter((e) => e.date.slice(0, 7) === key).reduce((a, e) => a + e.amt, 0);
  const exIdx = (e: Ex) => { const pr = (e.date || '').split('-').map(Number); return pr.length >= 2 && pr[0] ? (pr[0] - 2026) * 12 + (pr[1] - 1 - 10) : 0; };
  const sMinPg = Math.floor(Math.min(0, ...d.exps.map(exIdx)) / 6); const sPg = Math.max(sMinPg, Math.min(sPage == null ? mAuto : sPage, mAuto));
  const sMonths = [0, 1, 2, 3, 4, 5].map((k) => { const idx = sPg * 6 + k; const x = new Date(2026, 10 + idx, 1); return { y: x.getFullYear(), m: x.getMonth(), idx }; });
  const topItem = (key: string) => { const g: Record<string, { n: string; t: number; c: number }> = {}; d.exps.filter((e) => e.date.slice(0, 7) === key).forEach((e) => { const k = e.name.trim().toLowerCase(); if (!g[k]) g[k] = { n: e.name.trim(), t: 0, c: 0 }; g[k].t += e.amt; g[k].c++; }); const all = Object.values(g).sort((a, b) => b.t - a.t); if (!all.length) return ''; const a = all[0]; const nm = a.n.length > 9 ? a.n.slice(0, 8) + '…' : a.n; return nm + (a.c > 1 ? ' ×' + a.c : '') + (all.length > 1 ? '\n+' + (all.length - 1) + ' more' : ''); };
  const byYear: Record<string, number> = {}; d.exps.forEach((e) => { const y = (e.date || '').slice(0, 4); if (y) byYear[y] = (byYear[y] || 0) + e.amt; });
  const sv = sMonths.map((mm) => spendIn(keyOfM(mm.y, mm.m))); const sMax = Math.max(...sv, 1);
  const sCurV = spendIn(keyOfM(now.getFullYear(), now.getMonth())); const sPrevV = spendIn(keyOfM(now.getFullYear(), now.getMonth() - 1)); const sd = sCurV - sPrevV;
  const sPct = sPrevV > 0 ? Math.round(Math.abs(sd) / sPrevV * 100) : 0;
  const sBars: Bar[] = sMonths.map((mm, i) => { const prev = spendIn(keyOfM(mm.y, mm.m - 1)); const dd = sv[i] - prev; return { label: M[mm.m], sub: String(mm.y), top: sv[i] > 0 ? num(sv[i]) : '', h: sv[i] > 0 ? Math.max(8, Math.round((sv[i] / sMax) * 78)) : 6, hot: mm.idx === mCur && sv[i] > 0, warm: true, note: topItem(keyOfM(mm.y, mm.m)), delta: sv[i] > 0 || prev > 0 ? (dd === 0 ? '=' : (dd > 0 ? '+' : '-') + num(Math.abs(dd))) : '', dc: dd > 0 ? '#ffb3a0' : dd < 0 ? '#7df0c6' : 'rgba(255,255,255,.6)' }; });
  const expTotal = d.exps.reduce((a, e) => a + e.amt, 0);
  // suggestions
  const word = catName.toLowerCase() === 'motorcycle' ? 'motorcycle' : 'vehicle';
  const curKeyM = now.getFullYear() + '-' + pad(now.getMonth() + 1);
  const sg: { p: number; kind: string; title: string; text: string; tag: string; act?: 'odo' | 'exp'; actText?: string }[] = [];
  if (!sorted.length) sg.push({ p: 0, kind: 'info', title: 'Add your first odometer reading', text: 'With readings, My Record works out your distance for each month and year automatically.', tag: 'Start here', act: 'odo', actText: '+ Add reading' });
  else {
    if (!sorted.some((r) => r.date.slice(0, 7) === curKeyM)) sg.push({ p: 1, kind: 'warn', title: 'No reading yet this month', text: 'Last reading was ' + num(latest) + ' km on ' + fmtDate(sorted[sorted.length - 1].date) + '. Add today\'s odometer so this month\'s distance is accurate.', tag: 'Mileage', act: 'odo', actText: '+ Add reading' });
    if (curKmV != null && prevKmV != null && prevKmV > 0) {
      const pc = Math.round(((curKmV - prevKmV) / prevKmV) * 100);
      if (pc >= 20) sg.push({ p: 2, kind: 'warn', title: 'You rode ' + pc + '% more than last month', text: 'More distance means more wear. Check tyre pressure, chain and brakes a little more often.', tag: 'Mileage' });
      else if (pc <= -20) sg.push({ p: 3, kind: 'info', title: 'You rode ' + Math.abs(pc) + '% less than last month', text: 'A short ride now and then keeps the battery charged and the engine moving.', tag: 'Mileage' });
      else sg.push({ p: 5, kind: 'good', title: 'Your distance is steady', text: 'About the same as last month (' + num(curKmV) + ' km this month).', tag: 'Mileage' });
    }
  }
  if (sPrevV > 0 && sCurV > sPrevV * 1.3) sg.push({ p: 2, kind: 'warn', title: 'Maintenance spending is up ' + Math.round(((sCurV - sPrevV) / sPrevV) * 100) + '%', text: 'You spent RM ' + num(sCurV - sPrevV) + ' more than last month. Check if it was a one-off or a part to keep an eye on.', tag: 'Spending' });
  if (d.exps.length === 0) sg.push({ p: 4, kind: 'info', title: 'No maintenance recorded yet', text: 'Note oil changes, tyres and repairs so you can see the real cost of keeping your ' + word + ' running.', tag: 'Spending', act: 'exp', actText: '+ Add spending' });
  if (latest > 0) sg.push({ p: 6, kind: 'info', title: 'Plan your next service', text: 'Odometer is ' + num(latest) + ' km. Compare it with the service interval in your owner\'s manual.', tag: 'Service' });
  ([['roadtax', 'Road tax'], ['insurance', 'Insurance'], ['licence', 'Driving licence']] as const).forEach(([k, l]) => {
    const rs = renewStatus(d.renew && d.renew[k]);
    if (rs.n < 0) sg.push({ p: 0.5, kind: 'bad', title: l + ' has expired', text: l + ' ' + rs.txt.toLowerCase() + '. Renew it as soon as you can.', tag: 'Renewal' });
    else if (rs.n <= 30) sg.push({ p: 1.5, kind: 'warn', title: l + ' expires soon', text: l + ': ' + rs.txt.toLowerCase() + '. Plan your renewal now.', tag: 'Renewal' });
  });
  const sugg = sg.sort((x, y) => x.p - y.p).slice(0, 3).concat([{ p: 99, kind: 'good', title: 'Tip of the day', text: TIPS[(now.getDate() - 1) % 31], tag: 'Tip' }]);

  const nextId = () => st.nextId;
  const addReading = () => { const o = parseInt(rOdo, 10); if (!(o >= 0) || !rDate) return; upd((x) => ({ ...x, readings: [...x.readings, { id: nextId(), date: rDate, odo: o }] }), { nextId: st.nextId + 1 }); setROdo(''); };
  const addYReading = () => { const o = parseInt(yOdo, 10); if (!(o >= 0) || !yDate) return; upd((x) => ({ ...x, yreadings: [...(x.yreadings || []), { id: nextId(), date: yDate, odo: o }] }), { nextId: st.nextId + 1 }); setYOdo(''); };
  const addExp = () => { const a = parseFloat(eAmt.replace(',', '.')); if (!(a > 0)) return; upd((x) => ({ ...x, exps: [{ id: nextId(), name: eName.trim() || 'Service', amt: a, date: eDate || t0 }, ...x.exps] }), { nextId: st.nextId + 1 }); setEName(''); setEAmt(''); };
  const saveQuick = () => {
    const q = quick; if (!q) return;
    if (q.type === 'odo') { const o = parseInt(q.odo, 10); if (!(o >= 0) || !q.date) return; upd((x) => ({ ...x, readings: [...x.readings, { id: nextId(), date: q.date, odo: o }] }), { nextId: st.nextId + 1 }); }
    else { const a = parseFloat(q.amt.replace(',', '.')); if (!(a > 0)) return; upd((x) => ({ ...x, exps: [{ id: nextId(), name: (q.name || '').trim() || 'Service', amt: a, date: q.date }, ...x.exps] }), { nextId: st.nextId + 1 }); }
    setQuick(null);
  };
  const saveCat = () => { const n = catIn.trim(); if (!n || st.cats.includes(n)) { setAddingCat(false); return; } const c = [...st.cats, n]; setSt({ ...st, cats: c, sel: c.length - 1 }); setAddingCat(false); setCatIn(''); };
  const doRename = () => { const n = renIn.trim().slice(0, 30); const old = st.cats[st.sel]; if (!n || n === old || st.cats.includes(n)) { setRenaming(false); return; } const dd = { ...st.data }; if (dd[old]) { dd[n] = dd[old]; delete dd[old]; } setSt({ ...st, cats: st.cats.map((c, i) => (i === st.sel ? n : c)), data: dd }); setRenaming(false); };
  const doDel = () => { if (st.sel < 1) return; const nm = st.cats[st.sel]; const dd = { ...st.data }; delete dd[nm]; setSt({ ...st, cats: st.cats.filter((_, i) => i !== st.sel), data: dd, sel: st.sel - 1 }); setDelAsk(false); };
  const qOk = !!quick && (quick.type === 'odo' ? parseInt(quick.odo, 10) >= 0 && !!quick.date : parseFloat(quick.amt.replace(',', '.')) > 0);
  const diffS = sCurV === 0 && sPrevV === 0 ? '-' : sd === 0 ? 'Same' : (sd > 0 ? '+' : '-') + 'RM ' + num(Math.abs(sd));
  const sNote = sCurV === 0 && sPrevV === 0 ? 'Add maintenance spending to see how this month compares with last month.' : sd === 0 ? 'Same spending as last month.' : sPrevV > 0 ? (sd > 0 ? 'Up ' : 'Down ') + sPct + '% compared with last month.' : 'No spending recorded last month to compare with.';
  const dim = 'rgba(255,255,255,.65)';
  const Row = ({ children, last }: { children: React.ReactNode; last?: boolean }) => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(255,255,255,.1)' }}>{children}</View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#1b0f26' }}>
      <LinearGradient colors={['#1b0f26', '#2c1340', '#10244a']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(255,143,171,.38)" style={{ right: -100, top: -40 }} />
      <Blob size={340} color="rgba(124,156,255,.32)" style={{ left: -120, bottom: 10 }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}><RecArt /></View>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 60 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
            <Text style={{ flex: 1, color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>My Record</Text>
          </View>
          <Glass radius={24} style={{ marginTop: 14, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <LinearGradient colors={['rgba(255,143,171,.4)', 'rgba(183,148,255,.24)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
            <Logo />
            <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Keep every record</Text><Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12, marginTop: 1 }}>Logs, service and spending in one place</Text></View>
          </Glass>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 12 }}>
            {st.cats.map((n, i) => (
              <Pressable key={n} onPress={() => { setSt({ ...st, sel: i }); setDelAsk(false); setRenaming(false); }}>
                {i === st.sel ? <LinearGradient colors={PG} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>{n}</Text></LinearGradient>
                  : <View style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.08)' }}><Text style={{ color: W, fontSize: 13, fontWeight: '600' }}>{n}</Text></View>}
              </Pressable>
            ))}
            {!addingCat ? <Pressable onPress={() => { setAddingCat(true); setCatIn(''); }} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.08)' }}><Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 13, fontWeight: '600' }}>+ New category</Text></Pressable> : null}
          </View>
          {addingCat ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
              <Inp style={{ flex: 1 }} autoFocus value={catIn} onChangeText={setCatIn} placeholder="Category name, e.g. Car, Health" onSubmitEditing={saveCat} />
              <AddB t="Add" onPress={saveCat} />
            </View>
          ) : null}
          {!renaming ? (
            <Pressable onPress={() => { setRenaming(true); setRenIn(catName); setDelAsk(false); }} accessibilityLabel="Rename category" style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 6, marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>Rename "{catName}"</Text></Pressable>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
              <Inp style={{ flex: 1 }} autoFocus value={renIn} onChangeText={setRenIn} placeholder="New name, e.g. Car" maxLength={30} onSubmitEditing={doRename} />
              <AddB t="Save" onPress={doRename} />
              <SBtn t="Cancel" onPress={() => setRenaming(false)} />
            </View>
          )}
          {st.sel > 0 ? (
            <View style={{ marginTop: 10 }}>
              {!delAsk ? (
                <Pressable onPress={() => setDelAsk(true)} style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,143,171,.5)', backgroundColor: 'rgba(255,143,171,.12)' }}><Text style={{ color: PINK, fontSize: 12.5, fontWeight: '700' }}>🗑 Delete this category</Text></Pressable>
              ) : (
                <View style={{ borderRadius: 18, padding: 14, backgroundColor: '#3a1f4d', borderWidth: 1, borderColor: 'rgba(255,143,171,.4)' }}>
                  <Text style={{ color: W, fontSize: 13, fontWeight: '700', lineHeight: 19 }}>Delete "{catName}" and all its readings and spending?</Text>
                  <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, marginTop: 2 }}>This cannot be undone.</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}><SBtn t="Cancel" onPress={() => setDelAsk(false)} /><SBtn t="Delete" kind="danger" onPress={doDel} /></View>
                </View>
              )}
            </View>
          ) : null}

          <ProfileCard d={d} upd={(fn) => upd(fn)} name={catName} />

          {/* Suggestions */}
          <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
            <LinearGradient colors={['rgba(255,143,171,.2)', 'rgba(183,148,255,.1)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <LinearGradient colors={PG} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 16 }}>✦</Text></LinearGradient>
              <View><Text style={{ color: W, fontSize: 14.5, fontWeight: '800' }}>Suggestions</Text><Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 11.5, marginTop: 1 }}>From your readings and spending</Text></View>
            </View>
            <View style={{ gap: 9, marginTop: 12 }}>
              {sugg.map((g, i) => (
                <View key={i} style={{ borderRadius: 18, paddingVertical: 11, paddingHorizontal: 13, backgroundColor: STY[g.kind][0], borderWidth: 1, borderColor: STY[g.kind][1] }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><Text style={{ flex: 1, color: STY[g.kind][2], fontSize: 13, fontWeight: '800' }}>{g.title}</Text><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10, fontWeight: '700' }}>{g.tag}</Text></View>
                  <Text style={{ color: 'rgba(255,255,255,.9)', fontSize: 12.5, lineHeight: 19, marginTop: 3 }}>{g.text}</Text>
                  {g.act ? <Pressable onPress={() => setQuick({ type: g.act!, date: t0, odo: '', name: '', amt: '' })} style={{ alignSelf: 'flex-start', marginTop: 7, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,.28)', backgroundColor: 'rgba(255,255,255,.14)' }}><Text style={{ color: W, fontSize: 11.5, fontWeight: '700' }}>{g.actText}</Text></Pressable> : null}
                </View>
              ))}
            </View>
            <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, marginTop: 8 }}>General tips only. Always follow the service schedule in your owner's manual.</Text>
          </Glass>

          <RenewCard d={d} upd={(fn) => upd(fn)} />

          {/* Monthly mileage */}
          <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>Monthly Mileage</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 1 }}>{M[monthsArr[0].m] + ' ' + monthsArr[0].y + ' – ' + M[monthsArr[5].m] + ' ' + monthsArr[5].y} · km</Text></View>
              <View style={{ flexDirection: 'row', gap: 6 }}><Arrow t="‹" label="Earlier months" op={mPg > 0 ? 1 : 0.35} onPress={() => setMPage(Math.max(0, mPg - 1))} /><Arrow t="›" label="Later months" op={mPg < mAuto ? 1 : 0.35} onPress={() => setMPage(Math.min(mAuto, mPg + 1))} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}><Stat l="This month" v={mc.cur} /><Stat l="Last month" v={mc.prev} /><Stat l="Change" v={mc.diff} vc={mc.color} bg={mc.bg} /></View>
            <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 11.5, marginTop: 6 }}>{mc.note}</Text>
            <Bars bars={bars} />
            <Text style={{ color: dim, fontSize: 12, marginTop: 10 }}>Starts Nov 2026 and adds new months automatically. Enter the odometer reading; distance is worked out from the difference between months.</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
              <DateField value={rDate} onChange={setRDate} style={{ flex: 1 }} />
              <Inp style={{ flex: 1 }} keyboardType="number-pad" value={rOdo} onChangeText={setROdo} placeholder="Odometer km" />
              <AddB t="+ Add" onPress={addReading} />
            </View>
            <View style={{ marginTop: 6 }}>
              {sorted.slice().reverse().slice(0, 4).map((r, i, a) => <Row key={r.id} last={i === a.length - 1}><Text style={{ flex: 1, color: W, fontSize: 14 }}>{fmtDate(r.date)}</Text><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{num(r.odo)} km</Text><Del onPress={() => upd((x) => ({ ...x, readings: x.readings.filter((y) => y.id !== r.id) }))} /></Row>)}
            </View>
          </Glass>

          {/* Yearly mileage */}
          <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>Yearly Mileage</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 1 }}>{yearsArr[0] + ' – ' + yearsArr[4]} · km</Text></View>
              <View style={{ flexDirection: 'row', gap: 6 }}><Arrow t="‹" label="Earlier years" op={yPg > 0 ? 1 : 0.35} onPress={() => setYPage(Math.max(0, yPg - 1))} /><Arrow t="›" label="Later years" op={yPg < yAuto ? 1 : 0.35} onPress={() => setYPage(Math.min(yAuto, yPg + 1))} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}><Stat l="This year" v={yc.cur} /><Stat l="Last year" v={yc.prev} /><Stat l="Change" v={yc.diff} vc={yc.color} bg={yc.bg} /></View>
            <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 11.5, marginTop: 6 }}>{yc.note}</Text>
            <Bars bars={yBars} />
            <Text style={{ color: dim, fontSize: 12, marginTop: 10, lineHeight: 18 }}>Starts from 2024 and adds new years automatically. Enter the odometer reading with any date from 2024. Each bar shows the latest reading in that year, and the small number is how far you rode since the year before. Readings from Monthly Mileage count here too.</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
              <DateField value={yDate} onChange={setYDate} style={{ flex: 1 }} />
              <Inp style={{ flex: 1 }} keyboardType="number-pad" value={yOdo} onChangeText={setYOdo} placeholder="Odometer km" />
              <AddB t="+ Add" onPress={addYReading} />
            </View>
            <View style={{ marginTop: 6 }}>
              {(d.yreadings || []).slice().sort(byDate).reverse().slice(0, 4).map((r, i, a) => <Row key={r.id} last={i === a.length - 1}><Text style={{ flex: 1, color: W, fontSize: 14 }}>{fmtDate(r.date)}</Text><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{num(r.odo)} km</Text><Del onPress={() => upd((x) => ({ ...x, yreadings: (x.yreadings || []).filter((y) => y.id !== r.id) }))} /></Row>)}
            </View>
          </Glass>

          <FuelCard d={d} upd={(fn) => upd(fn)} />

          {/* Maintenance spending */}
          <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>Maintenance Spending</Text><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>RM {money(expTotal)}</Text></View>
            <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11, marginTop: 2 }}>All time total</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}><Stat l="This month" v={'RM ' + num(sCurV)} /><Stat l="Last month" v={'RM ' + num(sPrevV)} /><Stat l="vs last month" v={diffS} vc={sd > 0 ? '#ffb3a0' : sd < 0 ? '#7df0c6' : W} bg={sd > 0 ? 'rgba(255,143,107,.16)' : sd < 0 ? 'rgba(94,231,181,.16)' : undefined} /></View>
            <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 11.5, marginTop: 6 }}>{sNote}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, fontWeight: '700' }}>{M[sMonths[0].m] + ' ' + sMonths[0].y + ' – ' + M[sMonths[5].m] + ' ' + sMonths[5].y}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}><Arrow t="‹" label="Earlier months" op={sPg > sMinPg ? 1 : 0.35} onPress={() => setSPage(Math.max(sMinPg, sPg - 1))} /><Arrow t="›" label="Later months" op={sPg < mAuto ? 1 : 0.35} onPress={() => setSPage(Math.min(mAuto, sPg + 1))} /></View>
            </View>
            <Bars bars={sBars} noteH={26} />
            <Text style={{ color: dim, fontSize: 12, marginTop: 8 }}>Under each month is what you spent most on. Use the arrows to see earlier months. Amounts are in RM.</Text>
            {Object.keys(byYear).length ? (() => {
              const cy = String(now.getFullYear()); const ys = Object.keys(byYear);
              const order = [...ys.filter((y) => y >= cy).sort(), ...ys.filter((y) => y < cy).sort().reverse()];
              const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
              const inYear = selYear ? d.exps.filter((e) => (e.date || '').slice(0, 4) === selYear) : [];
              const monthsOf = Array.from(new Set(inYear.map((e) => e.date.slice(5, 7)))).sort();
              return (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, fontWeight: '700' }}>Total for each year</Text>
                  <Text style={{ color: dim, fontSize: 11.5, marginTop: 2, marginBottom: 8 }}>Tap a year to see what you spent on each month.</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {order.map((y) => { const on = selYear === y; return (
                      <Pressable key={y} onPress={() => setSelYear(on ? null : y)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: on ? '#b06ad8' : 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: on ? 'rgba(255,255,255,.5)' : 'transparent' }}>
                        <Text style={{ color: on ? W : 'rgba(255,255,255,.65)', fontSize: 11 }}>{y + (y === cy ? ' · this year' : '') + (on ? ' ▴' : ' ▾')}</Text><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{'RM ' + num(byYear[y])}</Text>
                      </Pressable>
                    ); })}
                  </View>
                  {selYear ? (
                    <View style={{ marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: 'rgba(0,0,0,.22)' }}>
                      <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{selYear + ' · RM ' + num(byYear[selYear] || 0)}</Text>
                      {monthsOf.map((mo) => {
                        const items = inYear.filter((e) => e.date.slice(5, 7) === mo).slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id));
                        const tot = items.reduce((a, e) => a + e.amt, 0);
                        return (
                          <View key={mo} style={{ marginTop: 12 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: '#ffc46b', fontSize: 12.5, fontWeight: '800' }}>{FULL[parseInt(mo, 10) - 1]}</Text><Text style={{ color: '#ffc46b', fontSize: 12.5, fontWeight: '800' }}>{'RM ' + num(tot)}</Text></View>
                            {items.map((e) => (
                              <View key={e.id} style={{ flexDirection: 'row', gap: 8, paddingVertical: 5, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.08)', marginTop: 4 }}>
                                <Text style={{ flex: 1, color: W, fontSize: 13 }} numberOfLines={1}>{e.name}<Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11.5 }}>{'  · ' + fmtDate(e.date)}</Text></Text>
                                <Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{'RM ' + num(e.amt)}</Text>
                              </View>
                            ))}
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })() : null}
            <DateField value={eDate} onChange={setEDate} style={{ marginTop: 12 }} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <Inp style={{ flex: 1.3 }} value={eName} onChangeText={setEName} placeholder="e.g. Engine oil" />
              <Inp style={{ flex: 0.8 }} keyboardType="decimal-pad" value={eAmt} onChangeText={setEAmt} placeholder="RM" onSubmitEditing={addExp} />
              <AddB t="+ Add" onPress={addExp} w={14} />
            </View>
            {d.exps.length === 0 ? <Text style={{ marginTop: 10, color: dim, fontSize: 12 }}>No spending recorded yet.</Text> : null}
            {(() => {
              const sorted = d.exps.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
              const shown = allExp ? sorted : sorted.slice(0, 5);
              return (
                <>
                  {d.exps.length > 0 ? <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, fontWeight: '700', marginTop: 12 }}>{allExp || sorted.length <= 5 ? 'All records, newest first' : 'Latest 5 records'}</Text> : null}
                  <View style={{ marginTop: 2 }}>
                    {shown.map((e, i) => <Row key={e.id} last={i === shown.length - 1}><Text style={{ flex: 1, color: W, fontSize: 14 }} numberOfLines={1}>{e.name}<Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 12 }}>{'  · ' + fmtDate(e.date)}</Text></Text><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>RM {money(e.amt)}</Text><Del onPress={() => upd((x) => ({ ...x, exps: x.exps.filter((y) => y.id !== e.id) }))} /></Row>)}
                  </View>
                  {sorted.length > 5 ? <Pressable onPress={() => setAllExp(!allExp)} style={{ alignSelf: 'center', marginTop: 8, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>{allExp ? 'Show fewer' : 'Show all ' + sorted.length + ' records'}</Text></Pressable> : null}
                </>
              );
            })()}
          </Glass>
          <PartsCard d={d} upd={(fn) => upd(fn)} latest={allOdo} addNow={(o) => upd((x) => ({ ...x, readings: [...x.readings, { id: Date.now(), date: t0, odo: o }] }))} />
          <DocsCard d={d} upd={(fn) => upd(fn)} />
          <ExportCard name={catName} d={d} latest={latest} />
        </ScrollView>

        {quick ? (
          <Sheet onClose={() => setQuick(null)}>
            <View style={{ padding: 18, borderRadius: 26, backgroundColor: '#25164a', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: W, fontSize: 17, fontWeight: '800' }}>Quick add</Text><Del onPress={() => setQuick(null)} /></View>
              <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)', marginTop: 12 }}>
                {([['odo', 'Odometer reading'], ['exp', 'Spending']] as const).map(([k, l]) => (
                  <Pressable key={k} onPress={() => setQuick({ ...quick, type: k })} style={{ flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center', backgroundColor: quick.type === k ? '#b06ad8' : 'transparent' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>{l}</Text></Pressable>
                ))}
              </View>
              {quick.type === 'odo' ? (<>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}><DateField value={quick.date} onChange={(v) => setQuick({ ...quick, date: v })} style={{ flex: 1 }} /><Inp style={{ flex: 1 }} keyboardType="number-pad" value={quick.odo} onChangeText={(v: string) => setQuick({ ...quick, odo: v })} placeholder="Odometer km" /></View>
                <Text style={{ color: dim, fontSize: 11.5, marginTop: 8 }}>Used for Monthly and Yearly Mileage. Any date from 2024 works.</Text>
              </>) : (<>
                <Inp style={{ marginTop: 12 }} value={quick.name} onChangeText={(v: string) => setQuick({ ...quick, name: v })} placeholder="e.g. Engine oil" />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}><DateField value={quick.date} onChange={(v) => setQuick({ ...quick, date: v })} style={{ flex: 1 }} /><Inp style={{ flex: 1 }} keyboardType="decimal-pad" value={quick.amt} onChangeText={(v: string) => setQuick({ ...quick, amt: v })} placeholder="RM" /></View>
              </>)}
              <Pressable onPress={saveQuick} style={{ marginTop: 16, opacity: qOk ? 1 : 0.5 }}><LinearGradient colors={PG} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>{quick.type === 'exp' ? 'Add spending' : 'Add reading'}</Text></LinearGradient></Pressable>
            </View>
          </Sheet>
        ) : null}
      </SafeAreaView>
    </View>
  );
}
