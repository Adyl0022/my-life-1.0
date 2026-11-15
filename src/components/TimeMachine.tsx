import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Polyline, Circle, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Text } from './Txt';
import { Glass } from './Glass';
import { HeadIcon, Face } from './HabitIcons';
import { Inp } from './Ui';
import { HData, HDay, BLANK, getDay, dateOf, keyOfDate, MOODS, WD, MON, cupsGoal, goalPctOf } from '../lib/habit';
import { ENERGY, energyEstimate, dayLevel, hasAny, windowAvg } from '../lib/patterns';
import { METRICS, Metric, fmtVal, series, future, weightFuture, memories, dstr, Fut } from '../lib/timeline';

const T = '#5ee7df'; const W = '#fff'; const DIM = 'rgba(255,255,255,.7)';
const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
type Tab = 'cal' | 'explore' | 'then' | 'future' | 'memories';
const TABS: [Tab, string][] = [['cal', 'Calendar'], ['explore', 'Explore'], ['then', 'Then vs Now'], ['future', 'Future'], ['memories', 'Memories']];

const Chip = ({ on, t, onPress, c }: { on: boolean; t: string; onPress: () => void; c?: string }) => (
  <Pressable onPress={onPress} style={{ paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, backgroundColor: on ? (c || T) : 'rgba(255,255,255,.12)' }}><Text style={{ color: on ? '#06222a' : W, fontSize: 12, fontWeight: '800' }}>{t}</Text></Pressable>
);

// Bars (steps, water, sleep) or a line with dots (mood, energy) over a number of days.
function Chart({ vals, color, line, goal, max }: { vals: (number | null)[]; color: string; line: boolean; goal?: number; max: number }) {
  const [w, setW] = useState(280); const H = 120; const pad = 6; const n = vals.length;
  const bw = (w - pad * 2) / n; const y = (v: number) => H - pad - (Math.min(v, max) / max) * (H - pad * 2);
  const pts = vals.map((v, i) => (v == null ? null : { x: pad + bw * i + bw / 2, y: y(v) }));
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ marginTop: 10 }}>
      <Svg width={w} height={H}>
        {[0.25, 0.5, 0.75].map((f) => <Line key={f} x1={pad} x2={w - pad} y1={H - pad - f * (H - pad * 2)} y2={H - pad - f * (H - pad * 2)} stroke="rgba(255,255,255,.08)" strokeWidth="1" />)}
        {goal != null && goal <= max ? <Line x1={pad} x2={w - pad} y1={y(goal)} y2={y(goal)} stroke="#ffd593" strokeOpacity=".7" strokeWidth="1.2" strokeDasharray="4 4" /> : null}
        {!line ? vals.map((v, i) => v == null ? <Rect key={i} x={pad + bw * i + bw * 0.2} y={H - pad - 2} width={Math.max(1, bw * 0.6)} height={2} fill="rgba(255,255,255,.18)" />
          : <Rect key={i} x={pad + bw * i + bw * 0.14} y={y(v)} width={Math.max(1.5, bw * 0.72)} height={Math.max(2, H - pad - y(v))} rx={Math.min(3, bw * 0.3)} fill={color} fillOpacity={goal != null && v >= goal ? 1 : 0.65} />) : null}
        {line ? <>
          <Polyline points={pts.filter(Boolean).map((p) => p!.x + ',' + p!.y).join(' ')} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, i) => p ? <Circle key={i} cx={p.x} cy={p.y} r={n > 40 ? 1.8 : 3.4} fill={color} /> : null)}
        </> : null}
      </Svg>
    </View>
  );
}
// A short line with a solid past and a dashed guess for the weeks ahead.
function Guess({ hist, proj, color }: { hist: (number | null)[]; proj: number[]; color: string }) {
  const [w, setW] = useState(280); const H = 110; const pad = 10; const all = [...hist, ...proj]; const n = all.length;
  const nums = all.filter((v) => v != null) as number[]; let lo = Math.min(...nums), hi = Math.max(...nums); if (hi - lo < 1e-6) { hi = hi + 1; lo = lo - 1; }
  const x = (i: number) => pad + ((w - pad * 2) / (n - 1)) * i; const y = (v: number) => H - pad - ((v - lo) / (hi - lo)) * (H - pad * 2);
  const hp = hist.map((v, i) => (v == null ? null : { x: x(i), y: y(v) })).filter(Boolean) as { x: number; y: number }[];
  const last = hp[hp.length - 1]; const pp = [last, ...proj.map((v, i) => ({ x: x(hist.length + i), y: y(v) }))];
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ marginTop: 10 }}>
      <Svg width={w} height={H}>
        <Line x1={x(hist.length - 1)} x2={x(hist.length - 1)} y1={4} y2={H - 4} stroke="rgba(255,255,255,.2)" strokeDasharray="3 5" />
        <Polyline points={hp.map((p) => p.x + ',' + p.y).join(' ')} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
        <Polyline points={pp.map((p) => p.x + ',' + p.y).join(' ')} fill="none" stroke={color} strokeOpacity=".7" strokeWidth="2.2" strokeDasharray="5 6" strokeLinecap="round" />
        {hp.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r="3.6" fill={color} />)}
        {pp.slice(1).map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r="3.2" fill="none" stroke={color} strokeWidth="1.6" />)}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}><Text style={{ color: DIM, fontSize: 10.5 }}>4 weeks ago</Text><Text style={{ color: DIM, fontSize: 10.5 }}>Now</Text><Text style={{ color: DIM, fontSize: 10.5 }}>In 4 weeks</Text></View>
    </View>
  );
}

export function TimeMachine({ h, setH }: { h: HData; setH: (v: HData) => void }) {
  const router = useRouter();
  const goal = h.goal || 8000, cg = cupsGoal(h);
  const [tab, setTab] = useState<Tab>('cal');
  // Calendar
  const [mo, setMo] = useState(0); const [pick, setPick] = useState(''); const [ed, setEd] = useState(false);
  const base = new Date(); base.setDate(1); base.setHours(12, 0, 0, 0); base.setMonth(base.getMonth() + mo);
  const y = base.getFullYear(), m = base.getMonth(); const dim = new Date(y, m + 1, 0).getDate(); const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  const todayKey = keyOfDate(dateOf(0));
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)]; while (cells.length % 7) cells.push(null);
  const keyOf = (d: number) => keyOfDate(new Date(y, m, d, 12));
  const dayOf = (k: string): HDay => ({ ...BLANK, ...(h.days[k] || {}) });
  const sel = pick || todayKey; const sd = dayOf(sel); const sdt = new Date(sel + 'T12:00:00');
  const sEst = sd.en != null && sd.en >= 0 ? null : energyEstimate(sd, cg, goal);
  const put = (p: Partial<HDay>) => setH({ ...h, days: { ...h.days, [sel]: { ...sd, ...p } } });
  const Stp = ({ l, v, onM, onP }: { l: string; v: string; onM: () => void; onP: () => void }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
      <Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{l}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable onPress={onM} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 18 }}>−</Text></Pressable>
        <Text style={{ color: W, fontWeight: '800', minWidth: 62, textAlign: 'center', fontSize: 13 }}>{v}</Text>
        <Pressable onPress={onP} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 18 }}>+</Text></Pressable>
      </View>
    </View>);
  const monthPct = Array.from({ length: dim }, (_, i) => { const k = keyOf(i + 1); return k > todayKey ? null : goalPctOf(dayOf(k), goal, cg); });
  // Explore
  const [range, setRange] = useState(30); const [met, setMet] = useState<Metric>('steps');
  const ser = series(h, range, met); const nums = ser.filter((s) => s.v != null) as { off: number; v: number }[];
  const mdef = METRICS.find((x) => x.k === met)!; const line = met === 'mood' || met === 'energy';
  const mx = met === 'steps' ? Math.max(goal * 1.2, ...nums.map((s) => s.v), 1000) : met === 'water' ? Math.max(cg + 2, ...nums.map((s) => s.v)) : met === 'sleep' ? Math.max(10, ...nums.map((s) => s.v)) : met === 'mood' ? 4 : 3;
  const mg = met === 'steps' ? goal : met === 'water' ? cg : met === 'sleep' ? 7 : undefined;
  const avg = nums.length ? nums.reduce((a, s) => a + s.v, 0) / nums.length : 0; const bestS = nums.length ? nums.reduce((a, s) => (s.v > a.v ? s : a)) : null;
  // Then vs now
  const [back, setBack] = useState(30); const now = windowAvg(h, 0), then = windowAvg(h, -back);
  const trows: { l: string; k: Metric; a: number | null; b: number | null }[] = [
    { l: 'Steps a day', k: 'steps', a: then.steps, b: now.steps }, { l: 'Water a day', k: 'water', a: then.water, b: now.water },
    { l: 'Sleep a night', k: 'sleep', a: then.sleep, b: now.sleep }, { l: 'Mood', k: 'mood', a: then.mood, b: now.mood },
  ];
  // Future
  const [fm, setFm] = useState<'steps' | 'water' | 'sleep' | 'weight'>('steps');
  const fut: Fut | null = fm === 'weight' ? null : future(h, fm); const wf = fm === 'weight' ? weightFuture(h) : null;
  const mems = tab === 'memories' ? memories(h) : [];

  return (
    <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <HeadIcon k="week" size={34} />
        <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 16, fontWeight: '800' }}>Time Machine</Text><Text style={{ color: DIM, fontSize: 12, marginTop: 4 }}>Your days, past and ahead</Text></View>
      </View>
      <Pressable onPress={() => router.push('/timemachine' as any)} accessibilityLabel="Open the body hologram" style={{ marginTop: 12, borderRadius: 16, overflow: 'hidden' }}>
        <LinearGradient colors={['rgba(94,231,223,.28)', 'rgba(124,156,255,.3)', 'rgba(183,148,255,.3)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(143,233,226,.4)', borderRadius: 16 }}>
          <HeadIcon k="rbody" size={30} />
          <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>Body hologram</Text><Text style={{ color: DIM, fontSize: 11.5, marginTop: 3 }}>Tap your body. Travel to the past or the future.</Text></View>
          <Text style={{ color: W, fontSize: 20 }}>›</Text>
        </LinearGradient>
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginHorizontal: -4 }} contentContainerStyle={{ gap: 6, paddingHorizontal: 4 }}>
        {TABS.map(([k, l]) => <Chip key={k} on={tab === k} t={l} onPress={() => setTab(k)} />)}
      </ScrollView>

      {tab === 'cal' ? (<>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{MN[m] + ' ' + y}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable accessibilityLabel="Previous month" onPress={() => { if (mo > -24) { setMo(mo - 1); setPick(''); setEd(false); } }} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center', opacity: mo > -24 ? 1 : 0.4 }}><Text style={{ color: W, fontSize: 18, marginTop: -2 }}>‹</Text></Pressable>
            <Pressable accessibilityLabel="Next month" onPress={() => { if (mo < 0) { setMo(mo + 1); setPick(''); setEd(false); } }} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center', opacity: mo < 0 ? 1 : 0.4 }}><Text style={{ color: W, fontSize: 18, marginTop: -2 }}>›</Text></Pressable>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,.55)', fontSize: 10.5, fontWeight: '700' }}>{l}</Text>)}</View>
        {Array.from({ length: cells.length / 7 }, (_, r) => (
          <View key={r} style={{ flexDirection: 'row', marginTop: 5, gap: 5 }}>
            {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
              if (d == null) return <View key={i} style={{ flex: 1, aspectRatio: 1 }} />;
              const k = keyOf(d); const fut2 = k > todayKey; const lv = fut2 ? 0 : dayLevel(dayOf(k)); const on = k === sel; const isT = k === todayKey;
              return (
                <Pressable key={i} disabled={fut2} onPress={() => { setPick(k); setEd(false); }} style={{ flex: 1, aspectRatio: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: lv ? 'rgba(94,231,223,' + (0.1 + lv * 0.13) + ')' : 'rgba(255,255,255,.07)', borderWidth: on ? 2 : isT ? 1.5 : 0, borderColor: on ? W : 'rgba(255,255,255,.6)', opacity: fut2 ? 0.35 : 1 }}>
                  <Text style={{ color: W, fontSize: 11.5, fontWeight: isT ? '800' : '600' }}>{d}</Text>
                  {h.cyOn && !fut2 && dayOf(k).pd ? <View style={{ position: 'absolute', bottom: 3, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff8fab' }} /> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
        <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, marginTop: 8 }}>{'Brighter means more things were logged that day.' + (h.cyOn ? ' A pink dot marks a period day.' : '')}</Text>
        <Text style={{ color: DIM, fontSize: 11.5, fontWeight: '700', marginTop: 12 }}>This month, goals reached each day</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 46, gap: 2, marginTop: 6 }}>
          {monthPct.map((p, i) => <View key={i} style={{ flex: 1, height: p == null ? 2 : Math.max(3, (p / 100) * 46), borderRadius: 2, backgroundColor: p == null ? 'rgba(255,255,255,.12)' : p >= 70 ? T : 'rgba(94,231,223,.4)' }} />)}
        </View>
        <View style={{ marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.09)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{WD[sdt.getDay()] + ', ' + sdt.getDate() + ' ' + MON[sdt.getMonth()]}</Text>
            <Pressable onPress={() => setEd(!ed)} style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, backgroundColor: ed ? T : 'rgba(255,255,255,.14)' }}><Text style={{ color: ed ? '#0d1030' : W, fontSize: 12, fontWeight: '800' }}>{ed ? 'Done' : 'Edit this day'}</Text></Pressable>
          </View>
          {h.cyOn && sd.pd ? <Text style={{ color: '#ff8fab', fontSize: 12.5, fontWeight: '700', marginTop: 4 }}>Period day</Text> : null}
          {!ed ? (hasAny(sd) ? (
            <View style={{ marginTop: 6, gap: 3 }}>
              {[['Steps', sd.steps > 0 ? Math.round(sd.steps).toLocaleString() : 'No record'], ['Water', sd.cups > 0 ? sd.cups + ' of ' + cg + ' glasses' : 'No record'], ['Sleep', sd.sleep > 0 ? (Math.round(sd.sleep * 10) / 10) + ' h' : 'No record'], ['Mood', sd.mood >= 0 ? MOODS[sd.mood][0] : 'No record'], ['Energy', sd.en != null && sd.en >= 0 ? ENERGY[sd.en][0] : sEst ? ENERGY[sEst.lvl][0] + ' (estimated)' : 'No record']].map(([a, b]) => (
                <View key={a} style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: DIM, fontSize: 12.5 }}>{a}</Text><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{b}</Text></View>
              ))}
              {sd.fast ? <Text style={{ color: T, fontSize: 12, fontWeight: '700', marginTop: 4 }}>Fasting day</Text> : null}
              {sd.note ? <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, marginTop: 6, fontStyle: 'italic' }}>“{sd.note}”</Text> : null}
            </View>
          ) : <Text style={{ color: DIM, fontSize: 12.5, marginTop: 6 }}>Nothing was logged on this day. Forgot? Tap Edit this day.</Text>) : (
            <View style={{ marginTop: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 6 }}>
                {MOODS.map((mm, i) => <Pressable key={mm[0]} accessibilityLabel={mm[0]} onPress={() => put({ mood: sd.mood === i ? -1 : i })} style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: sd.mood === i ? 2.5 : 0, borderColor: W }}><Face i={i} size={36} on={sd.mood === i} /></Pressable>)}
              </View>
              <Stp l="Water" v={sd.cups + ' / ' + cg} onM={() => put({ cups: Math.max(0, sd.cups - 1) })} onP={() => put({ cups: sd.cups + 1 })} />
              <Stp l="Sleep" v={(Math.round(sd.sleep * 10) / 10) + ' h'} onM={() => put({ sleep: Math.max(0, sd.sleep - 0.5) })} onP={() => put({ sleep: Math.min(14, sd.sleep + 0.5) })} />
              <Stp l="Steps" v={Math.round(sd.steps).toLocaleString('en-MY')} onM={() => put({ steps: Math.max(0, sd.steps - 500) })} onP={() => put({ steps: sd.steps + 500 })} />
              <Pressable onPress={() => put({ fast: !sd.fast })} style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: sd.fast ? T : 'rgba(255,255,255,.4)', backgroundColor: sd.fast ? T : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{sd.fast ? <Text style={{ color: '#0d1030', fontWeight: '800', fontSize: 14 }}>✓</Text> : null}</View>
                <Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>Fasting</Text>
              </Pressable>
              <Inp value={sd.note || ''} onChangeText={(v: string) => put({ note: v })} placeholder="Note for this day" style={{ marginTop: 10 }} />
            </View>)}
        </View>
      </>) : null}

      {tab === 'explore' ? (<>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>{METRICS.map((x) => <Chip key={x.k} on={met === x.k} c={x.c} t={x.l} onPress={() => setMet(x.k)} />)}</View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>{[7, 30, 90].map((n) => <Chip key={n} on={range === n} t={n + ' days'} onPress={() => setRange(n)} />)}</View>
        {nums.length ? (<>
          <Chart vals={ser.map((s) => s.v)} color={mdef.c} line={line} goal={mg} max={mx} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: DIM, fontSize: 10.5 }}>{dstr(dateOf(-(range - 1)))}</Text><Text style={{ color: DIM, fontSize: 10.5 }}>Today</Text></View>
          {mg != null ? <Text style={{ color: '#ffd593', fontSize: 11, marginTop: 6 }}>Dashed line: your goal. Brighter bars reached it.</Text> : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {[['Average', fmtVal(met, avg)], ['Best', bestS ? fmtVal(met, bestS.v) : '-'], ['Logged', nums.length + '/' + range]].map(([a, b]) => (
              <View key={a} style={{ flex: 1, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.09)' }}><Text style={{ color: DIM, fontSize: 10.5 }}>{a}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={{ color: W, fontSize: 14, fontWeight: '800', marginTop: 2 }}>{b}</Text></View>
            ))}
          </View>
          {bestS ? <Text style={{ color: DIM, fontSize: 11.5, marginTop: 8 }}>{'Best day: ' + dstr(dateOf(bestS.off))}</Text> : null}
        </>) : <Text style={{ color: DIM, fontSize: 12.5, marginTop: 14 }}>{'Nothing logged for ' + mdef.l.toLowerCase() + ' in the last ' + range + ' days yet.'}</Text>}
      </>) : null}

      {tab === 'then' ? (<>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>{[30, 60, 90].map((n) => <Chip key={n} on={back === n} t={n + ' days ago'} onPress={() => setBack(n)} />)}</View>
        {now.days > 0 && then.days > 0 ? (<>
          <View style={{ flexDirection: 'row', marginTop: 12 }}><View style={{ flex: 1.2 }} /><Text style={{ flex: 1, color: DIM, fontSize: 10.5, fontWeight: '800', letterSpacing: 1 }}>THEN</Text><Text style={{ flex: 1, color: DIM, fontSize: 10.5, fontWeight: '800', letterSpacing: 1 }}>NOW</Text></View>
          {trows.map((r) => {
            const mxv = Math.max(r.a || 0, r.b || 0, 0.0001); const up = r.a != null && r.b != null ? r.b >= r.a : null;
            return (
              <View key={r.l} style={{ paddingVertical: 9, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.1)', marginTop: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ flex: 1.2, color: DIM, fontSize: 12.5 }}>{r.l}</Text>
                  <Text style={{ flex: 1, color: r.a == null ? 'rgba(255,255,255,.45)' : W, fontSize: 12.5, fontWeight: '700' }}>{r.a == null ? 'No record' : fmtVal(r.k, r.a)}</Text>
                  <Text style={{ flex: 1, color: r.b == null ? 'rgba(255,255,255,.45)' : W, fontSize: 12.5, fontWeight: '800' }}>{r.b == null ? 'No record' : fmtVal(r.k, r.b) + (up == null ? '' : up ? ' ▲' : ' ▼')}</Text>
                </View>
                {r.a != null && r.b != null ? (
                  <View style={{ marginTop: 6, gap: 3 }}>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.08)' }}><View style={{ width: (r.a / mxv) * 100 + '%', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.45)' }} /></View>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.08)' }}><View style={{ width: (r.b / mxv) * 100 + '%', height: 6, borderRadius: 3, backgroundColor: up ? '#7df0c6' : '#ffc46b' }} /></View>
                  </View>) : null}
              </View>);
          })}
          <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, marginTop: 8 }}>Averages of the 7 days ending today and the 7 days ending {back} days ago. Grey is then, colour is now.</Text>
        </>) : <Text style={{ color: DIM, fontSize: 12.5, marginTop: 14 }}>Nothing was logged around then, or in the last week. Try a shorter time back.</Text>}
      </>) : null}

      {tab === 'future' ? (<>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {([['steps', 'Steps'], ['water', 'Water'], ['sleep', 'Sleep'], ['weight', 'Weight']] as const).map(([k, l]) => <Chip key={k} on={fm === k} t={l} onPress={() => setFm(k)} />)}
        </View>
        {fut ? (<>
          <Text style={{ color: W, fontSize: 15, fontWeight: '800', marginTop: 12 }}>{fut.line + ' · about ' + fmtVal(fm as Metric, fut.in4) + ' in 4 weeks'}</Text>
          <Text style={{ color: DIM, fontSize: 12.5, marginTop: 4, lineHeight: 18 }}>{fut.eta}</Text>
          <Guess hist={fut.hist} proj={fut.proj} color={fm === 'steps' ? T : fm === 'water' ? '#7c9cff' : '#b794ff'} />
        </>) : wf ? (<>
          <Text style={{ color: W, fontSize: 15, fontWeight: '800', marginTop: 12 }}>{wf.line}</Text>
          <Guess hist={wf.hist} proj={wf.proj} color="#ffc46b" />
        </>) : <Text style={{ color: DIM, fontSize: 12.5, marginTop: 14, lineHeight: 18 }}>{fm === 'weight' ? 'Log your weight at least twice, a week or more apart (Body tab), and a guess appears here.' : 'Log for about 3 weeks and a guess for the weeks ahead appears here.'}</Text>}
        <Text style={{ color: '#ffd593', fontSize: 11, lineHeight: 15, marginTop: 12 }}>A simple straight-line guess from your own recent records. It is not a promise and not medical advice. Life changes, and so can the line.</Text>
      </>) : null}

      {tab === 'memories' ? (<>
        {mems.length ? mems.map((x, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: i === 0 ? 14 : 8, padding: 11, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.09)' }}>
            <HeadIcon k={x.ic} size={36} />
            <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{x.t}</Text><Text style={{ color: DIM, fontSize: 12, marginTop: 4 }}>{x.d}</Text></View>
          </View>
        )) : <Text style={{ color: DIM, fontSize: 12.5, marginTop: 14 }}>Your memories appear here as you log. Start with today.</Text>}
      </>) : null}
    </Glass>
  );
}
