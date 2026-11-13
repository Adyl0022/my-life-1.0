import React, { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './Txt';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Glass } from './Glass';
import { Inp } from './Ui';
import { useStored } from '../lib/store';
import { HData, GLASS, cupsGoal, latestKg, avgOf, keyOfDate, dateOf } from '../lib/habit';
import { cs, cu } from '../lib/region';

const W = '#fff'; const T = '#5ee7df';
const dim = 'rgba(255,255,255,.65)';
const Stat = ({ l, v, c }: { l: string; v: string; c?: string }) => (
  <View style={{ flex: 1, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,.08)' }}>
    <Text style={{ color: 'rgba(255,255,255,.68)', fontSize: 10.5 }}>{l}</Text><Text style={{ color: c || W, fontSize: 15, fontWeight: '800', marginTop: 2 }}>{v}</Text>
  </View>
);
const r1 = (n: number) => Math.round(n * 10) / 10;
const daysAgoKey = (n: number) => keyOfDate(dateOf(-n));

export function WeightGoal({ h, setH }: { h: HData; setH: (v: HData) => void }) {
  const [rng, setRng] = useState<30 | 90>(30); const [gin, setGin] = useState(''); const [editing, setEditing] = useState(false);
  const list = (h.kg || []).slice().sort((a, b) => (a.d < b.d ? -1 : 1));
  const kg = latestKg(h); const m = (h.cm || 0) / 100;
  const lo = m ? 18.5 * m * m : 0, hi = m ? 24.9 * m * m : 0;
  const goal = h.goalKg || 0;
  const pts = list.filter((x) => x.d >= daysAgoKey(rng));
  const startW = list.length ? list[0].v : kg;
  const save = () => { const v = parseFloat(gin.replace(',', '.')); setH({ ...h, goalKg: v >= 20 && v <= 300 ? r1(v) : 0 }); setGin(''); setEditing(false); };
  // change over the last 30 days
  const cutK = daysAgoKey(30); const before = list.filter((x) => x.d <= cutK); const base30 = before.length ? before[before.length - 1].v : (list.length > 1 ? list[0].v : 0);
  const base30d = before.length ? 30 : list.length > 1 ? Math.max(1, Math.round((new Date(list[list.length - 1].d).getTime() - new Date(list[0].d).getTime()) / 86400000)) : 0;
  const ch = base30 > 0 ? r1(kg - base30) : 0;
  const perWeek = base30d >= 7 && base30 > 0 ? (kg - base30) / (base30d / 7) : 0;
  const toGo = goal > 0 && kg > 0 ? r1(goal - kg) : 0;
  const lowGoal = goal > 0 && lo > 0 && goal < lo - 0.05;
  const toward = toGo !== 0 && perWeek !== 0 && Math.sign(perWeek) === Math.sign(toGo) && Math.abs(perWeek) >= 0.05;
  const weeks = toward ? Math.ceil(Math.abs(toGo) / Math.abs(perWeek)) : 0;
  const eta = weeks > 0 && weeks < 200 ? new Date(Date.now() + weeks * 7 * 86400000) : null;
  const pct = goal > 0 && startW !== goal ? Math.max(0, Math.min(100, Math.round(((startW - kg) / (startW - goal)) * 100))) : 0;
  // chart
  const CW = 300, CH = 90;
  const vals = pts.map((x) => x.v).concat(goal > 0 ? [goal] : []);
  const mn = Math.min(...vals, kg || 1) - 0.5, mx = Math.max(...vals, kg || 1) + 0.5;
  const t0 = new Date(daysAgoKey(rng) + 'T12:00:00').getTime(), t1 = Date.now();
  const X = (d: string) => 8 + ((new Date(d + 'T12:00:00').getTime() - t0) / (t1 - t0)) * (CW - 16);
  const Y = (v: number) => 8 + (1 - (v - mn) / (mx - mn || 1)) * (CH - 16);
  const path = pts.map((x, i) => (i ? 'L' : 'M') + X(x.d).toFixed(1) + ' ' + Y(x.v).toFixed(1)).join(' ');
  return (
    <Glass radius={26} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Weight goal</Text>
        <Pressable onPress={() => { setEditing(!editing); setGin(goal > 0 ? String(goal) : ''); }} style={{ paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: W, fontSize: 12, fontWeight: '700' }}>{goal > 0 ? 'Target ' + goal + ' kg ✎' : '+ Set target'}</Text></Pressable>
      </View>
      {editing ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <Inp style={{ flex: 1 }} keyboardType="decimal-pad" value={gin} onChangeText={setGin} placeholder="Target weight (kg)" onSubmitEditing={save} />
          <Pressable onPress={save} style={{ paddingVertical: 11, paddingHorizontal: 16, borderRadius: 14, backgroundColor: T }}><Text style={{ color: '#0d1030', fontWeight: '800', fontSize: 13 }}>Save</Text></Pressable>
        </View>
      ) : null}
      {hi > 0 ? <Text style={{ color: dim, fontSize: 12, marginTop: 8 }}>Healthy range for your height: {r1(lo)} to {r1(hi)} kg</Text> : <Text style={{ color: dim, fontSize: 12, marginTop: 8 }}>Add your height in the weight card above to see your healthy range.</Text>}
      {lowGoal ? <Text style={{ color: '#ffc46b', fontSize: 12, marginTop: 6, lineHeight: 17 }}>This target is below the healthy range for your height. Please talk to a doctor before aiming this low.</Text> : null}
      {kg > 0 ? (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Stat l="Now" v={kg + ' kg'} />
          <Stat l="30-day change" v={base30 > 0 ? (ch > 0 ? '+' : '') + ch + ' kg' : '-'} c={base30 > 0 ? W : dim} />
          <Stat l={goal > 0 ? 'To target' : 'Target'} v={goal > 0 ? (toGo === 0 ? 'Reached' : (toGo > 0 ? '+' : '') + toGo + ' kg') : 'Not set'} c={goal > 0 && toGo === 0 ? '#7df0c6' : W} />
        </View>
      ) : <Text style={{ color: dim, fontSize: 12.5, marginTop: 12 }}>Log your weight above to see your trend.</Text>}
      {goal > 0 && kg > 0 && startW !== goal ? (
        <View style={{ marginTop: 12 }}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.14)', overflow: 'hidden' }}><LinearGradient colors={['#b794ff', T]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 8, width: pct + '%' }} /></View>
          <Text style={{ color: dim, fontSize: 11.5, marginTop: 5 }}>{pct}% of the way from {startW} kg to {goal} kg</Text>
        </View>
      ) : null}
      {pts.length >= 2 ? (
        <View style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', alignSelf: 'flex-end', padding: 2, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)' }}>
            {([30, 90] as const).map((n) => <Pressable key={n} onPress={() => setRng(n)} style={{ paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999, backgroundColor: rng === n ? '#b794ff' : 'transparent' }}><Text style={{ color: W, fontSize: 11.5, fontWeight: '700' }}>{n} days</Text></Pressable>)}
          </View>
          <Svg width="100%" height={CH} viewBox={'0 0 ' + CW + ' ' + CH} preserveAspectRatio="none" style={{ marginTop: 6 }}>
            {goal > 0 ? <Line x1={8} x2={CW - 8} y1={Y(goal)} y2={Y(goal)} stroke="#7df0c6" strokeWidth={1.2} strokeDasharray="4 4" /> : null}
            <Path d={path} stroke="#b794ff" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((x, i) => <Circle key={x.d} cx={X(x.d)} cy={Y(x.v)} r={i === pts.length - 1 ? 4 : 2.4} fill={i === pts.length - 1 ? T : '#b794ff'} />)}
          </Svg>
          {goal > 0 ? <Text style={{ color: '#7df0c6', fontSize: 11, marginTop: 2 }}>Dashed line is your target</Text> : null}
        </View>
      ) : kg > 0 ? <Text style={{ color: dim, fontSize: 11.5, marginTop: 12 }}>Log your weight at least twice to see the trend chart.</Text> : null}
      {goal > 0 && kg > 0 && toGo !== 0 && !lowGoal ? (
        <View style={{ marginTop: 12, padding: 11, borderRadius: 14, backgroundColor: 'rgba(124,156,255,.2)' }}>
          {eta ? <><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>About {weeks} {weeks === 1 ? 'week' : 'weeks'} to go</Text><Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, marginTop: 2 }}>At your pace of {r1(Math.abs(perWeek))} kg a week you reach {goal} kg around {eta.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })}.</Text></>
            : <><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>No clear trend toward your target yet</Text><Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, marginTop: 2 }}>Weigh in weekly for a few weeks and an estimate will show here.</Text></>}
        </View>
      ) : null}
    </Glass>
  );
}

type Food = [string, number, number];
const POOL: Record<'b' | 'm' | 's', Food[]> = {
  b: [['2 boiled eggs and a black coffee', 160, 12], ['Oats with skim milk', 220, 10], ['2 eggs on 2 slices of wholemeal bread', 330, 17], ['Oats with milk and a banana', 330, 12], ['Roti canai (1) with dhal', 350, 9], ['Peanut butter on 2 slices of bread, with a glass of milk', 480, 18], ['Nasi lemak with egg', 500, 15]],
  m: [['Sup ayam with vegetables, no rice', 250, 28], ['Grilled fish, ulam and a small scoop of rice', 380, 30], ['Grilled chicken, vegetables and half a plate of rice', 450, 35], ['Tempeh, egg and vegetables with 1 cup of rice', 500, 24], ['Chicken rice, 1 plate', 600, 30], ['Nasi campur: chicken, vegetables, egg, 1 plate of rice', 650, 35], ['Nasi goreng ayam, 1 plate', 700, 25]],
  s: [['Papaya, 1 bowl', 60, 1], ['An apple or an orange', 80, 1], ['1 boiled egg', 78, 6], ['A banana', 105, 1], ['Plain yoghurt, 1 cup', 120, 7], ['A glass of full cream milk', 150, 8], ['A handful of nuts', 170, 6], ['Banana with peanut butter', 290, 8]],
};
const pickFoods = (pool: Food[], budget: number) => {
  const ok = pool.filter((f) => f[1] <= budget * 1.1);
  const src = ok.length ? ok : [pool[0]];
  return src.sort((a, b) => Math.abs(a[1] - budget) - Math.abs(b[1] - budget)).slice(0, 3).sort((a, b) => b[1] - a[1]);
};
const Tick = ({ ok, t }: { ok: boolean; t: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999, backgroundColor: ok ? 'rgba(125,240,198,.18)' : 'rgba(255,196,107,.18)' }}>
    <Text style={{ color: ok ? '#7df0c6' : '#ffc46b', fontSize: 11.5, fontWeight: '800' }}>{ok ? '✓' : '•'}</Text><Text style={{ color: W, fontSize: 11.5, fontWeight: '700' }}>{t}</Text>
  </View>
);
export function DailyNeeds({ h, setH }: { h: HData; setH: (v: HData) => void }) {
  const [age, setAge] = useState(''); const [ed, setEd] = useState(false);
  const kg = latestKg(h); const cm = h.cm || 0; const a = h.age || 0; const sx = h.sex;
  useEffect(() => { if (h.age) setAge(String(h.age)); }, [h.age]);
  const ok = kg > 0 && cm > 0 && a > 0 && !!sx;
  const showEd = ed || !(a > 0 && sx);
  const saveAge = (sex: 'm' | 'f' | undefined, ag: string) => { const n = parseInt(ag, 10); const okAge = n >= 12 && n <= 100; setH({ ...h, sex: sex || h.sex, age: okAge ? n : h.age }); if (okAge && (sex || h.sex)) setEd(false); };
  const missing: string[] = []; if (!(kg > 0)) missing.push('weight'); if (!(cm > 0)) missing.push('height');
  let body: React.ReactNode = null;
  if (ok) {
    const bmr = 10 * kg + 6.25 * cm - 5 * a + (sx === 'm' ? 5 : -161);
    const st = avgOf(h, -6, 0, (x) => x.steps);
    const [lvl, mul] = st < 4000 ? ['Light activity', 1.2] : st < 8000 ? ['Moderate activity', 1.375] : st < 12000 ? ['Active', 1.55] : ['Very active', 1.725] as [string, number];
    const tdee = bmr * (mul as number);
    const g = h.goalKg || 0; const m = cm / 100; const bmi = kg / (m * m);
    const mode = g > 0 && g < kg - 0.5 && bmi >= 18.5 ? 'lose' : g > kg + 0.5 ? 'gain' : 'keep';
    const floor = Math.max(bmr, sx === 'm' ? 1500 : 1200);
    const cal = mode === 'lose' ? Math.max(floor, tdee - 400) : mode === 'gain' ? tdee + 300 : tdee;
    const pro = kg * (mode === 'lose' ? 1.6 : mode === 'gain' ? 1.6 : 1.2);
    const meals: [string, string, number, Food[]][] = [
      ['Breakfast', '#ffc46b', 0.25, POOL.b], ['Lunch', '#7df0c6', 0.35, POOL.m], ['Dinner', '#b794ff', 0.3, POOL.m], ['Snacks', '#ff8fab', 0.1, POOL.s],
    ];
    const tip = mode === 'lose' ? 'Skip sweet drinks (one teh tarik is about 150 kcal) and keep protein high so you stay full.' : mode === 'gain' ? 'Eat 3 meals and 2 snacks, and add a glass of full cream milk. Regular meals matter more than huge ones.' : 'Fill half your plate with vegetables, a quarter with protein and a quarter with rice.';
    body = (
      <>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <Stat l={mode === 'lose' ? 'Calories to lose' : mode === 'gain' ? 'Calories to gain' : 'Calories to keep'} v={Math.round(cal / 10) * 10 + ' kcal'} />
          <Stat l="Protein" v={Math.round(pro / 5) * 5 + ' g'} />
          <Stat l="Water" v={(cupsGoal(h) * GLASS / 1000).toFixed(1) + ' L'} />
        </View>
        <Text style={{ color: dim, fontSize: 11.5, marginTop: 8, lineHeight: 17 }}>{'Based on ' + lvl.toLowerCase() + ' (about ' + Math.round(st).toLocaleString() + ' steps a day). Your body burns about ' + Math.round(tdee / 10) * 10 + ' kcal a day.' + (mode === 'lose' ? ' Eating a little less than this helps you lose weight slowly.' : mode === 'gain' ? ' Eating a little more than this helps you gain weight.' : '')}</Text>
        <Text style={{ color: W, fontSize: 14, fontWeight: '800', marginTop: 16 }}>What to eat today</Text>
        <Text style={{ color: dim, fontSize: 11.5, marginTop: 2, lineHeight: 16 }}>{'Ideas that fit your ' + Math.round(cal / 10) * 10 + ' kcal. Amounts are rough and change with portion size.'}</Text>
        {meals.map(([n, c, f, pool]) => {
          const bud = Math.round((cal * f) / 10) * 10; const picks = pickFoods(pool, bud);
          return (
            <View key={n} style={{ marginTop: 10, padding: 11, borderRadius: 16, backgroundColor: 'rgba(0,0,0,.2)', borderLeftWidth: 3, borderLeftColor: c }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{n}</Text><Text style={{ color: c, fontSize: 12, fontWeight: '800' }}>{'about ' + bud + ' kcal'}</Text></View>
              {picks.map((x) => (
                <View key={x[0]} style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <Text style={{ flex: 1, color: 'rgba(255,255,255,.9)', fontSize: 12.5, lineHeight: 17 }}>{x[0]}</Text>
                  <Text style={{ color: dim, fontSize: 11.5 }}>{'~' + x[1] + ' kcal, ' + x[2] + ' g protein'}</Text>
                </View>
              ))}
            </View>
          );
        })}
        <View style={{ marginTop: 12, padding: 11, borderRadius: 14, backgroundColor: 'rgba(124,156,255,.2)' }}><Text style={{ color: W, fontSize: 12.5, lineHeight: 18 }}>{tip}</Text></View>
      </>
    );
  } else {
    body = (
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: dim, fontSize: 12.5, lineHeight: 18 }}>{missing.length ? 'Still needed: ' + missing.join(' and ') + '. Add ' + (missing.length > 1 ? 'them' : 'it') + ' in the Weight & BMI card above.' : 'Add your age and sex to see your estimate.'}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          <Tick ok={kg > 0} t="Weight" /><Tick ok={cm > 0} t="Height" /><Tick ok={a > 0} t="Age" /><Tick ok={!!sx} t="Sex" />
        </View>
      </View>
    );
  }
  return (
    <Glass radius={26} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Daily needs</Text>
        {a > 0 && sx ? <Pressable onPress={() => setEd(!ed)} style={{ paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: W, fontSize: 12, fontWeight: '700' }}>{(sx === 'm' ? 'Male' : 'Female') + ', ' + a + ' yrs ✎'}</Text></Pressable> : null}
      </View>
      <Text style={{ color: dim, fontSize: 12, lineHeight: 17, marginTop: 4 }}>How much food energy and protein your body needs each day, so you can eat in line with your weight goal. Water is your daily drinking target.</Text>
      {showEd ? (
        <View style={{ marginTop: 10, gap: 8 }}>
          <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)' }}>
            {([['m', 'Male'], ['f', 'Female']] as ['m' | 'f', string][]).map(([k, n]) => <Pressable key={k} onPress={() => saveAge(k, age)} style={{ flex: 1, paddingVertical: 7, borderRadius: 999, alignItems: 'center', backgroundColor: sx === k ? '#b794ff' : 'transparent' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>{n}</Text></Pressable>)}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Inp style={{ flex: 1 }} keyboardType="number-pad" value={age} onChangeText={setAge} placeholder="Age (years)" onSubmitEditing={() => saveAge(undefined, age)} />
            <Pressable onPress={() => saveAge(undefined, age)} style={{ paddingVertical: 11, paddingHorizontal: 16, borderRadius: 14, backgroundColor: T }}><Text style={{ color: '#0d1030', fontWeight: '800', fontSize: 13 }}>Save</Text></Pressable>
          </View>
        </View>
      ) : null}
      {body}
      <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 10, lineHeight: 15 }}>A rough estimate from a standard formula, not medical advice. Your age and sex are only used for this estimate.</Text>
    </Glass>
  );
}

// Health spending: reads and writes the same list as My Finance, using the "Health" category.
type FSp = { id: number; name: string; cat: string; amt: number; date: string };
const MS3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ymKey = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
const rmh = (n: number) => cs() + (Math.round(n * 100) / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const HEALTH_CAT = 'Health';
export function healthMonths(spends: { cat?: string; amt: number; date: string }[], n = 6, now = new Date()) {
  const out: { ym: string; label: string; v: number }[] = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1, 12); out.push({ ym: ymKey(d), label: MS3[d.getMonth()], v: 0 }); }
  (spends || []).forEach((x) => { if (x.cat !== HEALTH_CAT) return; const m = out.find((o) => o.ym === (x.date || '').slice(0, 7)); if (m) m.v += x.amt || 0; });
  return out;
}
export function HealthSpend() {
  const [fin, setFin] = useStored<any>('ml_finance', { inc: {}, cnt: {}, spends: [], nextId: 1 });
  const [amt, setAmt] = useState(''); const [nm, setNm] = useState(''); const [open, setOpen] = useState(false);
  const spends: FSp[] = (fin && fin.spends) || [];
  const mon = healthMonths(spends); const cur = mon[mon.length - 1].v, prev = mon[mon.length - 2].v; const mx = Math.max(...mon.map((m) => m.v), 1);
  const list = spends.filter((x) => x.cat === HEALTH_CAT).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id)).slice(0, 5);
  const add = () => {
    const n = parseFloat(amt.replace(',', '.')); if (!(n > 0)) return;
    const t = new Date(); const date = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
    const id = (fin && fin.nextId) || 1;
    setFin({ ...fin, spends: [{ id, name: nm.trim() || 'Health', cat: HEALTH_CAT, amt: n, date }, ...spends], nextId: id + 1 });
    setAmt(''); setNm(''); setOpen(false);
  };
  const del = (id: number) => setFin({ ...fin, spends: spends.filter((x) => x.id !== id) });
  const diff = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;
  return (
    <Glass radius={24} style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
      <LinearGradient colors={['rgba(255,143,171,.26)', 'rgba(94,231,181,.12)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Health spending</Text><Text style={{ color: dim, fontSize: 11.5, marginTop: 2 }}>Clinic, medicine, vitamins and gym. Also counted in My Finance.</Text></View>
        <Pressable onPress={() => setOpen(!open)}><View style={{ paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, backgroundColor: open ? 'rgba(255,255,255,.14)' : '#ff8fab' }}><Text style={{ color: open ? W : '#2a1030', fontSize: 12.5, fontWeight: '800' }}>{open ? 'Close' : '+ Add'}</Text></View></Pressable>
      </View>
      {open ? (
        <View style={{ marginTop: 12, gap: 8 }}>
          <Inp value={nm} onChangeText={setNm} placeholder="What for? e.g. Clinic consultation" />
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Inp style={{ flex: 1 }} keyboardType="decimal-pad" value={amt} onChangeText={setAmt} placeholder={'Amount (' + cu() + ')'} onSubmitEditing={add} />
            <Pressable onPress={add}><LinearGradient colors={['#ff8fab', '#ffc46b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 42, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#2a1030', fontSize: 13, fontWeight: '800' }}>Save</Text></LinearGradient></Pressable>
          </View>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        <Stat l="This month" v={rmh(cur)} c="#ff9db5" />
        <Stat l="Last month" v={rmh(prev)} />
      </View>
      {diff !== null && cur > 0 ? <Text style={{ color: dim, fontSize: 12, marginTop: 8 }}>{diff === 0 ? 'Same as last month.' : (diff > 0 ? diff + '% more' : Math.abs(diff) + '% less') + ' than last month.'}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 64, marginTop: 14 }}>
        {mon.map((m, i) => <View key={m.ym} style={{ flex: 1, height: 64, justifyContent: 'flex-end' }}><View style={{ height: Math.max(4, Math.round((m.v / mx) * 60)), borderRadius: 5, backgroundColor: i === mon.length - 1 ? '#ff8fab' : 'rgba(255,255,255,.35)' }} /></View>)}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>{mon.map((m) => <Text key={m.ym} style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,.55)', fontSize: 9.5 }}>{m.label}</Text>)}</View>
      {list.length ? (
        <View style={{ marginTop: 12 }}>
          {list.map((x, i) => (
            <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.1)' }}>
              <View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: W, fontSize: 13.5, fontWeight: '600' }}>{x.name}</Text><Text style={{ color: dim, fontSize: 11 }}>{x.date}</Text></View>
              <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{rmh(x.amt)}</Text>
              <Pressable accessibilityLabel="Delete" onPress={() => del(x.id)} hitSlop={6}><Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 15 }}>✕</Text></Pressable>
            </View>
          ))}
        </View>
      ) : <Text style={{ color: dim, fontSize: 12, marginTop: 12 }}>No health spending yet. Add a clinic visit or medicine, or log it in My Finance under Health.</Text>}
    </Glass>
  );
}
