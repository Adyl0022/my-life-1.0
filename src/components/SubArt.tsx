import React from 'react';
import { View, Animated, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSway } from './artMotion';

// Background for Subscriptions: hundreds of hairline rings from three centres that overlap, so a soft moiré ripples across the whole page.
// Each set drifts a little on its own, so the ripple slowly moves. Gold, teal and lavender, the same palette as My Finance. Lines only.
const T = '#8fe9e2', L = '#c3b0ff', Gd = '#ffd9a8';
function Rings({ w, h, cx, cy, step, n, col, op }: { w: number; h: number; cx: number; cy: number; step: number; n: number; col: string; op: number }) {
  return <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>{Array.from({ length: n }, (_, k) => <Circle key={k} cx={cx} cy={cy} r={(k + 1) * step} fill="none" stroke={col} strokeOpacity={op} strokeWidth={0.55} />)}</Svg>;
}
function Dust({ x, y, r, v, c }: { x: number; y: number; r: number; v: Animated.Value; c: string }) {
  return <Animated.View style={{ position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: c, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.9] }) }} />;
}
export function SubArt() {
  const { width: W, height: H } = useWindowDimensions();
  const d1 = useSway(22), d2 = useSway(28, 3), d3 = useSway(34, 6), t1 = useSway(4), t2 = useSway(5.5, 1), t3 = useSway(7, 2);
  const M = 40; const w = W + M * 2, h = H + M * 2; const reach = Math.hypot(w, h);
  const mv = (v: Animated.Value, ax: number, ay: number) => ({ position: 'absolute' as const, left: -M, top: -M, width: w, height: h, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-ax, ax] }) }, { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [ay, -ay] }) }] });
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <Animated.View style={mv(d1, 16, 12)}><Rings w={w} h={h} cx={w - M + 30} cy={M - 20} step={11} n={Math.ceil(reach / 11)} col={Gd} op={0.12} /></Animated.View>
      <Animated.View style={mv(d2, 14, 16)}><Rings w={w} h={h} cx={M - 30} cy={h - M + 20} step={11} n={Math.ceil(reach / 11)} col={T} op={0.12} /></Animated.View>
      <Animated.View style={mv(d3, 12, 12)}><Rings w={w} h={h} cx={w / 2} cy={h / 2} step={20} n={Math.ceil(reach / 40)} col={L} op={0.06} /></Animated.View>
      <Dust x={0.1 * W} y={0.2 * H} r={1.6} v={t1} c={Gd} /><Dust x={0.5 * W} y={0.3 * H} r={1.2} v={t2} c={T} /><Dust x={0.88 * W} y={0.5 * H} r={1.8} v={t3} c={L} />
      <Dust x={0.3 * W} y={0.55 * H} r={1.3} v={t2} c={Gd} /><Dust x={0.93 * W} y={0.74 * H} r={1.3} v={t1} c={T} /><Dust x={0.62 * W} y={0.84 * H} r={1.7} v={t3} c={L} />
    </View>
  );
}
