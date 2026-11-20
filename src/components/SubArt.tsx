import React from 'react';
import { View, Animated, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Polyline } from 'react-native-svg';
import { useSpin, useSway } from './artMotion';

// Background art for Subscriptions. Top: ribbons that cross in an infinity loop (always coming round again), in gold, rose and blue.
// Bottom: a fine lattice of small overlapping circles that turns very slowly. Lines only, so the cards on top stay easy to read.
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
// infinity (lemniscate) ribbons, one inside the next
const RIBBON = Array.from({ length: 34 }, (_, k) => {
  const sc = 60 + k * 6.5, pts: string[] = [];
  for (let i = 0; i <= 360; i += 4) { const t = (i * Math.PI) / 180, d = 1 + Math.sin(t) ** 2; pts.push((sc * 1.5 * Math.cos(t) / d).toFixed(1) + ',' + (sc * 1.5 * Math.sin(t) * Math.cos(t) / d * 1.6).toFixed(1)); }
  return { pts: pts.join(' '), col: [GD, RS, IB][k % 3], op: 0.1 + 0.24 * (1 - k / 34) };
});
function Layer({ left, top, R, rot, scale, children }: { left: number; top: number; R: number; rot?: any; scale?: any; children: React.ReactNode }) {
  return <Animated.View style={{ position: 'absolute', left: left - R, top: top - R, width: R * 2, height: R * 2, transform: [...(rot ? [{ rotate: rot }] : []), ...(scale ? [{ scale }] : [])] }}>{children}</Animated.View>;
}
function Dust({ x, y, r, v, c }: { x: number; y: number; r: number; v: Animated.Value; c: string }) {
  return <Animated.View style={{ position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: c, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.85] }) }} />;
}
export function SubArt() {
  const { width: W, height: H } = useWindowDimensions(); const s = Math.max(W / 390, 1);
  const a = useSpin(220, 1), b = useSpin(160, -1), sway = useSway(14), shimmer = useSway(6), t1 = useSway(4), t2 = useSway(5.5, 1), t3 = useSway(7, 2);
  const rs = sway.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.05] }); const rr = sway.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });
  const sh = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const RB = 195 * s;
  const rw = W; const rh = 330 * s;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {/* infinity ribbons */}
      <Animated.View style={{ position: 'absolute', left: 0, top: 70 * s, width: rw, height: rh, opacity: sh, transform: [{ scale: rs }, { rotate: rr }] }}>
        <Svg width={rw} height={rh} viewBox="-195 -165 390 330" preserveAspectRatio="xMidYMid slice">
          {RIBBON.map((r, i) => <Polyline key={i} points={r.pts} fill="none" stroke={r.col} strokeOpacity={r.op} strokeWidth={1} />)}
        </Svg>
      </Animated.View>
      {/* fine lattices at the bottom */}
      <Layer left={0.28 * W} top={H - 20 * s} R={190 * s} rot={a}><Flower r={13} rings={8} size={190 * s * 2} col={GD} op={0.34} /></Layer>
      <Layer left={0.86 * W} top={H - 6 * s} R={130 * s} rot={b}><Flower r={11} rings={7} size={130 * s * 2} col={IB} op={0.3} /></Layer>
      <Dust x={0.1 * W} y={0.2 * H} r={1.6} v={t1} c={GD} /><Dust x={0.5 * W} y={0.28 * H} r={1.2} v={t2} c={RS} /><Dust x={0.86 * W} y={0.5 * H} r={1.8} v={t3} c={GD} />
      <Dust x={0.32 * W} y={0.5 * H} r={1.3} v={t2} c={IB} /><Dust x={0.92 * W} y={0.72 * H} r={1.3} v={t1} c={RS} /><Dust x={0.6 * W} y={0.8 * H} r={1.7} v={t3} c={GD} />
    </View>
  );
}
