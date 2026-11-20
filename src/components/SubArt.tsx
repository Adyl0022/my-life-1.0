import React from 'react';
import { View, Animated, useWindowDimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useSpin, useSway } from './artMotion';

// Background art for Subscriptions: a lattice of overlapping circles in gold foil, the same circle repeated again and again.
// It turns very slowly at the top right, with a second, bigger one turning the other way at the bottom left. Lines only.
const GD = '#ffd592', RS = '#ffb0cf', IB = '#a9bcff';
// centres of a hexagonal lattice of circles of radius r, up to `rings` steps from the middle
const lattice = (r: number, rings: number) => {
  const out: { x: number; y: number; d: number }[] = [];
  for (let i = -rings; i <= rings; i++) for (let j = -rings; j <= rings; j++) {
    if (Math.abs(i + j) > rings) continue;
    const x = r * (i + j / 2), y = r * j * 0.866; out.push({ x, y, d: Math.max(Math.abs(i), Math.abs(j), Math.abs(i + j)) });
  }
  return out;
};
function Flower({ r, rings, size, col, op }: { r: number; rings: number; size: number; col: string; op: number }) {
  const pts = lattice(r, rings); const V = (rings + 1) * r + 4;
  return (
    <Svg width={size} height={size} viewBox={`${-V} ${-V} ${V * 2} ${V * 2}`}>
      <G fill="none" stroke={col} strokeWidth={0.8}>
        {pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={r} strokeOpacity={op * (1 - (p.d / (rings + 1)) * 0.75)} />)}
      </G>
      <Circle r={(rings + 1) * r} fill="none" stroke={col} strokeOpacity={op * 0.9} strokeWidth={1.1} />
      <Circle r={(rings + 1) * r + 5} fill="none" stroke={col} strokeOpacity={op * 0.4} strokeWidth={0.6} strokeDasharray="2 5" />
    </Svg>
  );
}
function Layer({ left, top, R, rot, scale, children }: { left: number; top: number; R: number; rot?: any; scale?: any; children: React.ReactNode }) {
  return <Animated.View style={{ position: 'absolute', left: left - R, top: top - R, width: R * 2, height: R * 2, transform: [...(rot ? [{ rotate: rot }] : []), ...(scale ? [{ scale }] : [])] }}>{children}</Animated.View>;
}
function Dust({ x, y, r, v, c }: { x: number; y: number; r: number; v: Animated.Value; c: string }) {
  return <Animated.View style={{ position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: c, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.85] }) }} />;
}
export function SubArt() {
  const { width: W, height: H } = useWindowDimensions(); const s = Math.max(W / 390, 1);
  const a = useSpin(180, 1), b = useSpin(240, -1), c = useSpin(70, 1), breathe = useSway(10), t1 = useSway(4), t2 = useSway(5.5, 1), t3 = useSway(7, 2);
  const sc = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.04] });
  const R1 = 150 * s, R2 = 210 * s;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <Layer left={W - 40 * s} top={120 * s} R={R1} rot={a} scale={sc}><Flower r={34} rings={3} size={R1 * 2} col={GD} op={0.55} /></Layer>
      <Layer left={W - 40 * s} top={120 * s} R={R1} rot={c}><Flower r={17} rings={2} size={R1 * 2} col={IB} op={0.0} /></Layer>
      <Layer left={30 * s} top={H - 40 * s} R={R2} rot={b}><Flower r={46} rings={3} size={R2 * 2} col={RS} op={0.4} /></Layer>
      <Layer left={30 * s} top={H - 40 * s} R={R2} rot={a}><Flower r={23} rings={4} size={R2 * 2} col={GD} op={0.2} /></Layer>
      <Dust x={0.1 * W} y={0.2 * H} r={1.6} v={t1} c={GD} /><Dust x={0.5 * W} y={0.28 * H} r={1.2} v={t2} c={RS} /><Dust x={0.86 * W} y={0.5 * H} r={1.8} v={t3} c={GD} />
      <Dust x={0.32 * W} y={0.5 * H} r={1.3} v={t2} c={IB} /><Dust x={0.92 * W} y={0.72 * H} r={1.3} v={t1} c={RS} /><Dust x={0.6 * W} y={0.8 * H} r={1.7} v={t3} c={GD} />
    </View>
  );
}
