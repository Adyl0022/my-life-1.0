import React from 'react';
import { View, Animated, useWindowDimensions } from 'react-native';
import Svg, { Circle, Ellipse, Polyline } from 'react-native-svg';
import { useSpin, useSway } from './artMotion';

// Fine "unravelling" art for the Subscriptions page: a swirl of hairline ellipses that slowly turns, with circuit traces coming off it and
// running out across the page, each ending in a small node. Lines only, in the My Finance colours, so the text stays easy to read.
const T = '#8fe9e2', L = '#c3b0ff', Gd = '#ffd9a8';
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
type Spot = { cx: number; cy: number; R: number; col: string; op: number; n: number; ntr: number; L: number; seed: number; turn: number; dir: 1 | -1 };
type Tr = { pts: string; x: number; y: number; col: string; op: number };
function traces(s: Spot): Tr[] {
  const out: Tr[] = [];
  for (let i = 0; i < s.ntr; i++) {
    const r = rng(s.seed + i * 7), a = (i * 2 * Math.PI) / s.ntr;
    let x = s.cx + s.R * 0.8 * Math.cos(a), y = s.cy + s.R * 0.8 * Math.sin(a);
    const d = [[x, y]];
    const l1 = s.L * (0.3 + r() * 0.3); x += l1 * Math.cos(a); y += l1 * Math.sin(a); d.push([x, y]);
    const a2 = a + ((r() < 0.5 ? -1 : 1) * Math.PI) / 4, l2 = 20 + r() * 40; x += l2 * Math.cos(a2); y += l2 * Math.sin(a2); d.push([x, y]);
    const l3 = s.L * (0.3 + r() * 0.4); x += l3 * Math.cos(a); y += l3 * Math.sin(a); d.push([x, y]);
    out.push({ pts: d.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '), x, y, col: s.col, op: s.op * 0.9 });
  }
  return out;
}
export function SubArt() {
  const { width: W, height: H } = useWindowDimensions();
  const s = Math.max(W / 390, 1);
  const spots: Spot[] = React.useMemo(() => [
    { cx: W - 52 * s, cy: 96 * s, R: 92 * s, col: L, op: 0.3, n: 44, ntr: 18, L: 170 * s, seed: 1, turn: 90, dir: 1 },
    { cx: 40 * s, cy: H - 118 * s, R: 130 * s, col: T, op: 0.26, n: 48, ntr: 24, L: 230 * s, seed: 40, turn: 110, dir: -1 },
    { cx: W - 72 * s, cy: H - 118 * s, R: 62 * s, col: Gd, op: 0.28, n: 34, ntr: 12, L: 110 * s, seed: 90, turn: 75, dir: 1 },
  ], [W, H]);
  const trs = React.useMemo(() => spots.map(traces), [spots]);
  const r0 = useSpin(spots[0].turn, spots[0].dir), r1 = useSpin(spots[1].turn, spots[1].dir), r2 = useSpin(spots[2].turn, spots[2].dir);
  const rots = [r0, r1, r2];
  const tw = useSway(5), tw2 = useSway(7, 2);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <Svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        {trs.map((g) => g.map((t, i) => <Polyline key={i} points={t.pts} fill="none" stroke={t.col} strokeWidth={0.55} strokeOpacity={t.op} />))}
      </Svg>
      {spots.map((sp, k) => (
        <Animated.View key={k} style={{ position: 'absolute', left: sp.cx - sp.R, top: sp.cy - sp.R, width: sp.R * 2, height: sp.R * 2, transform: [{ rotate: rots[k] }] }}>
          <Svg width={sp.R * 2} height={sp.R * 2} viewBox={`0 0 ${sp.R * 2} ${sp.R * 2}`}>
            {Array.from({ length: sp.n }, (_, i) => { const f = 1 - (i / sp.n) * 0.82; return <Ellipse key={i} cx={sp.R} cy={sp.R} rx={sp.R * f} ry={sp.R * f * 0.36} rotation={i * 6.5} origin={sp.R + ',' + sp.R} fill="none" stroke={sp.col} strokeWidth={0.55} strokeOpacity={sp.op} />; })}
          </Svg>
        </Animated.View>
      ))}
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: tw.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }}>
        <Svg width={W} height={H}>
          {trs.map((g, k) => g.map((t, i) => (i % 2 === 0 ? <React.Fragment key={k + '-' + i}><Circle cx={t.x} cy={t.y} r={2.3} fill="none" stroke={t.col} strokeOpacity={0.6} strokeWidth={0.7} /><Circle cx={t.x} cy={t.y} r={0.9} fill={t.col} opacity={0.85} /></React.Fragment> : null)))}
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: tw2.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }) }}>
        <Svg width={W} height={H}>
          {trs.map((g, k) => g.map((t, i) => (i % 2 === 1 ? <React.Fragment key={k + '-' + i}><Circle cx={t.x} cy={t.y} r={2.3} fill="none" stroke={t.col} strokeOpacity={0.6} strokeWidth={0.7} /><Circle cx={t.x} cy={t.y} r={0.9} fill={t.col} opacity={0.85} /></React.Fragment> : null)))}
        </Svg>
      </Animated.View>
    </View>
  );
}
