import React from 'react';
import { View, Platform } from 'react-native';
import { Pressable } from './Press';
import * as Haptics from '../lib/haptics';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { SlidePills } from './TabSlide';
import { Text } from './Txt';
import { ENERGY } from '../lib/patterns';

const buzz = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
const SHORT = ['Energetic', 'Normal', 'Tired', 'Exhausted'];

export const PCT = [90, 60, 35, 15];
/** A round meter. The coloured arc shows how much energy: 90, 60, 35 or 15 percent. */
export function Ring({ lvl, size = 40, empty = false, bolt = false, thick }: { lvl: number; size?: number; empty?: boolean; bolt?: boolean; thick?: number }) {
  const c = ENERGY[lvl][1]; const sw = thick || Math.max(3.5, size * 0.1); const r = (size - sw) / 2; const L = 2 * Math.PI * r; const pc = PCT[lvl];
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.16)" strokeWidth={sw} fill="none" />
        {!empty ? <Circle cx={size / 2} cy={size / 2} r={r} stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeDasharray={`${L * pc / 100} ${L}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} /> : null}
      </Svg>
      {bolt ? (
        <Svg width={size * 0.3} height={size * 0.3} viewBox="0 0 24 24" style={{ marginBottom: 2 }}><Path d="M13 2 4 14h6l-1 8 9-12h-6z" fill={empty ? 'rgba(255,255,255,.5)' : c} /></Svg>
      ) : null}
      {!empty ? <Text style={{ color: '#fff', fontSize: bolt ? size * 0.2 : Math.max(8, size * 0.25), fontWeight: '800', marginTop: bolt ? 0 : 0 }}>{pc + '%'}</Text> : null}
    </View>
  );
}

/** The four buttons for the Dashboard Quick log. The one the app suggests has a ring around it. */
export function EnergyRow({ suggest, onPick }: { suggest: number | null; onPick: (i: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {ENERGY.map((e, i) => (
        <Pressable key={e[0]} onPress={() => { buzz(); onPick(i); }} hitSlop={3} accessibilityLabel={'Energy ' + e[0] + ' ' + PCT[i] + ' percent'} style={({ pressed }) => ({ width: 46, alignItems: 'center', gap: 3, paddingVertical: 6, borderRadius: 14, borderWidth: suggest === i ? 1.5 : 1, borderColor: suggest === i ? e[1] : 'rgba(255,255,255,.22)', backgroundColor: suggest === i ? e[1] + '30' : 'rgba(255,255,255,.08)', transform: [{ scale: pressed ? 0.94 : 1 }] })}>
          <Ring lvl={i} size={32} />
          <Text numberOfLines={1} style={{ color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: -0.3 }}>{SHORT[i]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const LABEL = ['Excellent', 'Good', 'Low', 'Needs rest'];
const HEAD = ['Keep up the great work!', 'A steady day', 'Go easy today', 'Focus on rest'];
const TEXT = [
  'Your energy looks high, so you are ready for a full day. Keep the same sleep, water and walking to stay here.',
  'Your energy looks normal. A glass of water, a short walk and an early night will help it stay steady.',
  'Your energy looks low. Take short breaks, drink water, keep the day light and try to sleep earlier tonight.',
  'Your energy looks very low. Rest if you can, drink water, eat something and sleep early tonight. If you feel unwell for days, please see a doctor.',
];
export type EnergyPoint = { v: number | null; own: boolean; d: string };

/** Half-circle gauge with the score in the middle. */
function Gauge({ lvl, empty }: { lvl: number; empty: boolean }) {
  const W = 250, H = 156, sw = 18, r = 100, cx = W / 2, cy = 118; const col = empty ? 'rgba(255,255,255,.3)' : ENERGY[lvl][1];
  const d = 'M ' + (cx - r) + ' ' + cy + ' A ' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + cy; const L = Math.PI * r;
  return (
    <View style={{ alignItems: 'center', marginTop: 6 }}>
      <View style={{ width: W, height: H }}>
        <Svg width={W} height={H}>
          <Path d={d} stroke="rgba(255,255,255,.16)" strokeWidth={sw} fill="none" strokeLinecap="round" />
          {!empty ? <Path d={d} stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round" strokeDasharray={(L * PCT[lvl] / 100) + ' ' + L} /> : null}
        </Svg>
        <View style={{ position: 'absolute', left: 0, right: 0, top: 60, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 52, fontWeight: '800', lineHeight: 58 }}>{empty ? '--' : PCT[lvl]}</Text>
          <Text style={{ color: col, fontSize: 15, fontWeight: '800', marginTop: 0 }}>{empty ? 'Not enough yet' : LABEL[lvl]}</Text>
        </View>
      </View>
    </View>
  );
}

/** Week or month line of energy. A dot is filled when you rated the day yourself and hollow when it is only an estimate. */
function Trend({ pts }: { pts: EnergyPoint[] }) {
  const [w, setW] = React.useState(0); const H = 150, padL = 26, padR = 10, padT = 10, padB = 24; const n = pts.length;
  const X = (i: number) => padL + (n <= 1 ? 0 : (i * (w - padL - padR)) / (n - 1)); const Y = (v: number) => padT + (1 - v / 100) * (H - padT - padB);
  const segs: string[] = []; let cur = ''; pts.forEach((q, i) => { if (q.v == null) { if (cur) segs.push(cur); cur = ''; } else cur += (cur ? ' L ' : 'M ') + X(i).toFixed(1) + ' ' + Y(q.v).toFixed(1); }); if (cur) segs.push(cur);
  const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: H }}>
      {w > 0 ? (
        <Svg width={w} height={H}>
          {[0, 50, 100].map((g) => (<React.Fragment key={g}><Path d={'M ' + padL + ' ' + Y(g) + ' L ' + (w - padR) + ' ' + Y(g)} stroke="rgba(255,255,255,.12)" strokeWidth={1} strokeDasharray="3 4" /><SvgText x={0} y={Y(g) + 4} fill="rgba(255,255,255,.5)" fontSize={10} fontFamily="sans-serif">{String(g)}</SvgText></React.Fragment>))}
          {segs.map((d, i) => (<Path key={i} d={d} stroke="rgba(255,255,255,.55)" strokeWidth={2} fill="none" strokeLinejoin="round" />))}
          {pts.map((q, i) => { const dt = new Date(q.d + 'T12:00:00'); const lab = n <= 7 ? WD[dt.getDay()] : (i % 5 === 0 || i === n - 1) ? String(dt.getDate()) : ''; const lv = q.v == null ? -1 : PCT.indexOf(q.v); const c = lv >= 0 ? ENERGY[lv][1] : '#fff';
            return (<React.Fragment key={q.d}>
              {q.v != null ? <Circle cx={X(i)} cy={Y(q.v)} r={n <= 7 ? 6 : 4} fill={q.own ? c : 'rgba(20,20,50,.9)'} stroke={c} strokeWidth={2} /> : null}
              {lab ? <SvgText x={X(i)} y={H - 6} fill="rgba(255,255,255,.55)" fontSize={10} fontFamily="sans-serif" textAnchor="middle">{lab}</SvgText> : null}
            </React.Fragment>); })}
        </Svg>
      ) : null}
    </View>
  );
}

/** The big Energy card in Habit and Health. */
export function EnergyBig({ en, est, week, month, onPick }: { en: number | undefined; est: { lvl: number; why: string } | null; week: EnergyPoint[]; month: EnergyPoint[]; onPick: (i: number | undefined) => void }) {
  const [tab, setTab] = React.useState(0);
  const own = en != null && en >= 0; const lvl = own ? (en as number) : est ? est.lvl : -1; const empty = lvl < 0; const col = empty ? 'rgba(255,255,255,.6)' : ENERGY[lvl][1];
  const pts = tab === 0 ? week : month; const vals = pts.filter((q) => q.v != null).map((q) => q.v as number);
  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null; const hi = vals.length ? Math.max(...vals) : null; const lo = vals.length ? Math.min(...vals) : null;
  const stat = (t: string, v: string) => (<View style={{ flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>{v}</Text><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10.5, marginTop: 2 }}>{t}</Text></View>);
  return (
    <View>
      <Gauge lvl={lvl < 0 ? 0 : lvl} empty={empty} />
      <Text style={{ color: col, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textAlign: 'center', marginTop: 2 }}>{own ? 'YOUR RATING' : est ? 'ESTIMATED' : 'NOT LOGGED YET'}</Text>
      <View style={{ marginTop: 14, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)' }}>
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>{empty ? 'How is your energy?' : HEAD[lvl]}</Text>
        <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, lineHeight: 19, marginTop: 6 }}>{empty ? 'Log two things like sleep, water, steps or mood and an estimate appears here. Or tap how you feel below.' : TEXT[lvl]}</Text>
        {est && !own ? <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: 'rgba(255,255,255,.68)', fontSize: 12, lineHeight: 18 }}>{est.why + '.'}</Text></View> : null}
      </View>
      <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 11.5, fontWeight: '800', letterSpacing: 1, marginTop: 16 }}>HOW DO YOU FEEL?</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        {ENERGY.map((e, i) => {
          const on = own && en === i; const guess = !own && est && est.lvl === i;
          return (
            <Pressable key={e[0]} onPress={() => { buzz(); onPick(on ? undefined : i); }} accessibilityLabel={'Energy ' + e[0] + ' ' + PCT[i] + ' percent'} style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 7, paddingVertical: 11, paddingHorizontal: 2, borderRadius: 18, borderWidth: on || guess ? 1.5 : 1, borderColor: on || guess ? e[1] : 'rgba(255,255,255,.16)', backgroundColor: on ? e[1] + '40' : 'rgba(255,255,255,.07)', transform: [{ scale: pressed ? 0.95 : 1 }] })}>
              <Ring lvl={i} size={40} />
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: on ? '#fff' : 'rgba(255,255,255,.85)', fontSize: 11.5, fontWeight: on ? '800' : '700' }}>{SHORT[i]}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, marginTop: 8, lineHeight: 15 }}>{own ? 'Tap your choice again to go back to the estimate.' : 'A rough estimate from what you logged, not a medical measurement. Tap how you really feel to replace it.'}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Energy trend</Text>
        <SlidePills tabs={['Week', 'Month']} index={tab} onChange={(i) => { buzz(); setTab(i); }} colors={['#7c9cff', '#b794ff']} fontSize={12.5} padX={14} padY={6} />
      </View>
      <View style={{ marginTop: 10 }}><Trend pts={pts} /></View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#fff' }} /><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10.5 }}>You rated it</Text></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: '#fff' }} /><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10.5 }}>Estimated</Text></View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        {stat('Average', avg == null ? '--' : String(avg))}{stat('Best', hi == null ? '--' : String(hi))}{stat('Lowest', lo == null ? '--' : String(lo))}{stat(tab === 0 ? 'Days of 7' : 'Days of 30', String(vals.length))}
      </View>
    </View>
  );
}
