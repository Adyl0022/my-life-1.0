import React, { useState } from 'react';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { View, Pressable } from 'react-native';
import { Text } from './Txt';
import { Inp, W } from './Ui';
import { HData, HeartRead, dateOf, keyOfDate } from '../lib/habit';

// A notebook for pulse and blood pressure. The person types the numbers; the app only keeps them and shows them back. It never judges a reading.
const DIM = 'rgba(255,255,255,.7)'; const T = '#ff8fab';
const num = (s: string) => { const n = parseInt(s.replace(/[^0-9]/g, ''), 10); return Number.isFinite(n) ? n : undefined; };
const dlabel = (k: string) => { const d = new Date(k + 'T12:00:00'); return d.getDate() + '/' + (d.getMonth() + 1); };

// A plain line of the person's own readings over time. No "normal" band is drawn, because the app does not judge a reading.
function Chart({ title, series, pts }: { title: string; series: { c: string; l: string; f: (x: HeartRead) => number }[]; pts: HeartRead[] }) {
  const [w, setW] = useState(0); const H = 96, PX = 6, PY = 10;
  const all = pts.flatMap((x) => series.map((sr) => sr.f(x))); const lo = Math.min(...all) - 4, hi = Math.max(...all) + 4;
  const X = (i: number) => PX + (pts.length === 1 ? 0.5 : i / (pts.length - 1)) * (w - PX * 2); const Y = (v: number) => PY + (1 - (v - lo) / (hi - lo)) * (H - PY * 2);
  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ color: DIM, fontSize: 11.5, fontWeight: '700', flex: 1 }}>{title}</Text>
        {series.map((sr) => <View key={sr.l} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sr.c }} /><Text style={{ color: DIM, fontSize: 10.5 }}>{sr.l}</Text></View>)}
      </View>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: H, marginTop: 6, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.06)' }}>
        {w > 0 ? (
          <Svg pointerEvents="none" width={w} height={H}>
            <Line x1={PX} y1={H / 2} x2={w - PX} y2={H / 2} stroke="#fff" strokeOpacity="0.08" strokeWidth="1" />
            {series.map((sr) => <Polyline key={sr.l} points={pts.map((x, i) => X(i) + ',' + Y(sr.f(x))).join(' ')} fill="none" stroke={sr.c} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />)}
            {series.map((sr) => pts.map((x, i) => <Circle key={sr.l + i} cx={X(i)} cy={Y(sr.f(x))} r={i === pts.length - 1 ? 4 : 2.6} fill={sr.c} />))}
          </Svg>
        ) : null}
        <Text style={{ position: 'absolute', left: 8, top: 4, color: 'rgba(255,255,255,.5)', fontSize: 9.5 }}>{Math.max(...all)}</Text>
        <Text style={{ position: 'absolute', left: 8, bottom: 4, color: 'rgba(255,255,255,.5)', fontSize: 9.5 }}>{Math.min(...all)}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
        <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 10 }}>{dlabel(pts[0].d)}</Text>
        <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 10 }}>{series.map((sr) => sr.f(pts[pts.length - 1])).join('/') + '  ·  ' + dlabel(pts[pts.length - 1].d)}</Text>
      </View>
    </View>
  );
}

export function HeartLog({ h, setH, off = 0 }: { h: HData; setH: (v: HData) => void; off?: number }) {
  const [bpm, setBpm] = useState(''); const [sys, setSys] = useState(''); const [dia, setDia] = useState(''); const [err, setErr] = useState(''); const [all, setAll] = useState(false);
  const list = (h.heart || []).slice().sort((a, b) => (a.d + a.at < b.d + b.at ? 1 : -1));
  const asc = list.slice().reverse(); const pu = asc.filter((x) => x.bpm != null).slice(-20); const bp = asc.filter((x) => x.sys != null && x.dia != null).slice(-20);
  const save = () => {
    const p = num(bpm), s = num(sys), d = num(dia);
    if (p == null && s == null && d == null) { setErr('Type a pulse, a blood pressure, or both.'); return; }
    if (p != null && (p < 30 || p > 220)) { setErr('Pulse should be between 30 and 220. Please check the number.'); return; }
    if ((s != null) !== (d != null)) { setErr('Blood pressure needs both numbers, for example 120 and 80.'); return; }
    if (s != null && d != null && (s < 70 || s > 250 || d < 40 || d > 150 || d >= s)) { setErr('Please check the blood pressure numbers. The systolic (first) number is the larger one.'); return; }
    const now = new Date(); const at = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const r: HeartRead = { id: String(Date.now()), d: keyOfDate(dateOf(Math.min(0, off))), at, ...(p != null ? { bpm: p } : {}), ...(s != null && d != null ? { sys: s, dia: d } : {}) };
    setH({ ...h, heart: [...(h.heart || []), r].slice(-400) });
    setBpm(''); setSys(''); setDia(''); setErr('');
  };
  const drop = (id: string) => setH({ ...h, heart: (h.heart || []).filter((x) => x.id !== id) });
  return (
    <View>
      <Text style={{ color: DIM, fontSize: 12, marginTop: 4 }}>{off < 0 ? 'Add a reading for this day' : 'Add a reading'}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Inp value={bpm} onChangeText={setBpm} keyboardType="number-pad" placeholder="Pulse" maxLength={3} style={{ flex: 1 }} />
        <Inp value={sys} onChangeText={setSys} keyboardType="number-pad" placeholder="Systolic" maxLength={3} style={{ flex: 1 }} />
        <Inp value={dia} onChangeText={setDia} keyboardType="number-pad" placeholder="Diastolic" maxLength={3} style={{ flex: 1 }} />
      </View>
      <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 4 }}>Pulse in bpm. Blood pressure: systolic (first number) and diastolic (second number), in mmHg.</Text>
      {err ? <Text style={{ color: '#ffd593', fontSize: 12, marginTop: 6 }}>{err}</Text> : null}
      <Pressable onPress={save} style={{ alignSelf: 'flex-start', marginTop: 10, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: T }}><Text style={{ color: '#2a0a14', fontWeight: '800', fontSize: 13 }}>Save reading</Text></Pressable>
      {pu.length >= 2 ? <Chart title="PULSE OVER TIME (bpm)" pts={pu} series={[{ c: '#ff8fab', l: 'Pulse', f: (x) => x.bpm as number }]} /> : null}
      {bp.length >= 2 ? <Chart title="BLOOD PRESSURE OVER TIME (mmHg)" pts={bp} series={[{ c: '#7c9cff', l: 'Systolic', f: (x) => x.sys as number }, { c: '#5ee7df', l: 'Diastolic', f: (x) => x.dia as number }]} /> : null}
      {list.length && pu.length < 2 && bp.length < 2 ? <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 10 }}>Save 2 readings or more to see a graph over time.</Text> : null}
      {list.length ? (
        <View style={{ marginTop: 14 }}>
          <Text style={{ color: DIM, fontSize: 11.5, fontWeight: '700', marginBottom: 2 }}>RECENT READINGS</Text>
          {(all ? list : list.slice(0, 6)).map((x) => (
            <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.08)' }}>
              <Text style={{ color: DIM, fontSize: 12, width: 86 }}>{dlabel(x.d) + ' ' + x.at}</Text>
              <Text style={{ color: W, fontSize: 13, fontWeight: '800', flex: 1 }}>{[x.bpm != null ? x.bpm + ' bpm' : '', x.sys != null ? x.sys + '/' + x.dia + ' mmHg' : ''].filter(Boolean).join('   ')}</Text>
              <Pressable onPress={() => drop(x.id)} hitSlop={10} accessibilityLabel="Delete this reading"><Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 18, paddingHorizontal: 6 }}>×</Text></Pressable>
            </View>
          ))}
          {list.length > 6 ? (
            <Pressable onPress={() => setAll(!all)} accessibilityRole="button" style={{ alignSelf: 'center', marginTop: 8, paddingVertical: 7, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', backgroundColor: 'rgba(255,255,255,.06)' }}>
              <Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>{all ? 'Show less' : 'Show all (' + list.length + ')'}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, lineHeight: 16, marginTop: 12 }}>These are your own notes. My Life is not a medical device and does not diagnose, treat or advise. Talk to a doctor or nurse about your readings.</Text>
    </View>
  );
}
