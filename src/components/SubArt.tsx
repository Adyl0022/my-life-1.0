import React from 'react';
import { View, Animated, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Polyline, Stop } from 'react-native-svg';
import { useSpin, useSway } from './artMotion';

// Background art for Subscriptions, on deep purple.
// Top right: a spirograph rosette, curves that wind round and close up again, which is what a subscription does every month.
// Bottom: layers of soft silk waves in violet and orchid that drift slowly. Fine lines and gentle fills, so the cards stay easy to read.
const LI = '#e4d4ff', OR = '#e08bff', RG = '#ffc9d9', VI = '#9d8bff';
const hypo = (R: number, r: number, d: number, turns: number) => {
  const pts: string[] = [];
  for (let t = 0; t <= turns * 2 * Math.PI; t += 0.03) pts.push(((R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t)).toFixed(1) + ',' + ((R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t)).toFixed(1));
  return pts.join(' ');
};
const CURVES = { a: hypo(96, 36, 62, 3), b: hypo(96, 36, 40, 3), c: hypo(60, 22, 36, 3), d: hypo(120, 45, 70, 3) };
const wave = (w: number, base: number, amp: number, len: number, ph: number) => {
  let d = 'M-20,' + (base + amp * Math.sin(ph)).toFixed(1);
  for (let x = -20; x <= w + 40; x += 12) d += ' L' + x + ',' + (base + amp * Math.sin((x / len) * 2 * Math.PI + ph) + (amp / 2) * Math.sin((x / (len * 0.6)) * 2 * Math.PI + ph * 1.7)).toFixed(1);
  return d;
};
function Layer({ left, top, R, rot, scale, children }: { left: number; top: number; R: number; rot?: any; scale?: any; children: React.ReactNode }) {
  return <Animated.View style={{ position: 'absolute', left: left - R, top: top - R, width: R * 2, height: R * 2, transform: [...(rot ? [{ rotate: rot }] : []), ...(scale ? [{ scale }] : [])] }}>{children}</Animated.View>;
}
function Dust({ x, y, r, v, c }: { x: number; y: number; r: number; v: Animated.Value; c: string }) {
  return <Animated.View style={{ position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: c, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.9] }) }} />;
}
export function SubArt() {
  const { width: W, height: H } = useWindowDimensions(); const s = Math.max(W / 390, 1);
  const a = useSpin(120, 1), b = useSpin(90, -1), c = useSpin(60, 1), d = useSpin(160, -1), glow = useSway(6), w1 = useSway(15), w2 = useSway(19, 2), w3 = useSway(23, 4), t1 = useSway(4), t2 = useSway(5.5, 1), t3 = useSway(7, 2);
  const gs = glow.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.2] }); const go = glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const x1 = w1.interpolate({ inputRange: [0, 1], outputRange: [-26, 26] }), x2 = w2.interpolate({ inputRange: [0, 1], outputRange: [30, -30] }), x3 = w3.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] });
  const cx = W - 46 * s, cy = 128 * s; const R = 150 * s; const box = { width: R * 2, height: R * 2 };
  const WH = 340 * s; const wv = (x: Animated.AnimatedInterpolation<number>, base: number, amp: number, len: number, ph: number, c1: string, c2: string, op: number, bottom: number) => (
    <Animated.View style={{ position: 'absolute', left: -30, bottom, width: W + 60, height: WH, transform: [{ translateX: x }] }}>
      <Svg width={W + 60} height={WH} viewBox={`0 0 ${W + 60} ${WH}`}>
        <Defs><LinearGradient id={'g' + ph} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={c1} stopOpacity={op} /><Stop offset="1" stopColor={c2} stopOpacity={0} /></LinearGradient></Defs>
        <Path d={wave(W + 60, base, amp, len, ph) + ` L${W + 60},${WH} L0,${WH} Z`} fill={`url(#g${ph})`} />
        <Path d={wave(W + 60, base, amp, len, ph)} fill="none" stroke={c1} strokeOpacity={0.45} strokeWidth={1} />
      </Svg>
    </Animated.View>
  );
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {/* silk waves */}
      {wv(x1, 215 * s, 18 * s, 220 * s, 0.4, OR, '#5b2bd6', 0.3, 0)}
      {wv(x2, 248 * s, 16 * s, 180 * s, 2.0, VI, '#3a1a9a', 0.26, 0)}
      {wv(x3, 280 * s, 12 * s, 260 * s, 3.6, RG, '#8a3aa8', 0.2, 0)}
      {/* spirograph rosette */}
      <Layer left={cx} top={cy} R={R} rot={d}><Svg {...box} viewBox="-150 -150 300 300"><Polyline points={CURVES.d} fill="none" stroke={VI} strokeOpacity={0.3} strokeWidth={0.7} /></Svg></Layer>
      <Layer left={cx} top={cy} R={R} rot={a}><Svg {...box} viewBox="-150 -150 300 300"><Polyline points={CURVES.a} fill="none" stroke={LI} strokeOpacity={0.5} strokeWidth={0.8} strokeLinejoin="round" /></Svg></Layer>
      <Layer left={cx} top={cy} R={R} rot={b}><Svg {...box} viewBox="-150 -150 300 300"><Polyline points={CURVES.b} fill="none" stroke={OR} strokeOpacity={0.5} strokeWidth={0.8} strokeLinejoin="round" /></Svg></Layer>
      <Layer left={cx} top={cy} R={R} rot={c}><Svg {...box} viewBox="-150 -150 300 300"><Polyline points={CURVES.c} fill="none" stroke={RG} strokeOpacity={0.55} strokeWidth={0.8} strokeLinejoin="round" /><Circle r={132} fill="none" stroke={LI} strokeOpacity={0.14} strokeWidth={0.6} strokeDasharray="2 6" /></Svg></Layer>
      <Layer left={cx} top={cy} R={22 * s} scale={gs}><Animated.View style={{ opacity: go }}><Svg width={44 * s} height={44 * s} viewBox="-22 -22 44 44"><Circle r={14} fill={OR} fillOpacity={0.22} /><Circle r={6} fill={LI} fillOpacity={0.35} /><Circle r={2.4} fill="#fff" /></Svg></Animated.View></Layer>
      <Dust x={0.08 * W} y={0.2 * H} r={1.6} v={t1} c={LI} /><Dust x={0.46 * W} y={0.3 * H} r={1.2} v={t2} c={RG} /><Dust x={0.88 * W} y={0.52 * H} r={1.8} v={t3} c={LI} />
      <Dust x={0.3 * W} y={0.48 * H} r={1.3} v={t2} c={OR} /><Dust x={0.94 * W} y={0.72 * H} r={1.3} v={t1} c={RG} /><Dust x={0.62 * W} y={0.5 * H} r={1.7} v={t3} c={LI} />
    </View>
  );
}
