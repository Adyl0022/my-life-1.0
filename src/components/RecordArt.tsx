import React from 'react';
import { View, Animated, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Line, Polygon } from 'react-native-svg';
import { useSpin, useSway } from './artMotion';

// Fine geometric art for the My Record page, in the same colours as Documents. Lines only, so text stays easy to read.
// Top right: a hexagon tunnel that turns slowly. Bottom left: a lattice of overlapping circles that drifts. Bottom right: a small compass star.
// The middle of the page stays empty.
const T = '#8fe9e2', L = '#b9a6ff', Gd = '#ffd9a8';
const poly = (cx: number, cy: number, r: number, n: number, rot: number) => {
  const p: string[] = [];
  for (let i = 0; i < n; i++) { const a = rot + (2 * Math.PI * i) / n; p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); }
  return p.join(' ');
};
// Each ring is a hexagon a little smaller and a little more turned than the one outside it, so together they curl into a tunnel.
function Tunnel({ R, n, col, op }: { R: number; n: number; col: string; op: number }) {
  return (
    <G>
      {Array.from({ length: n }, (_, i) => {
        const f = 1 - (i / n) * 0.86;
        return <Polygon key={i} points={poly(R, R, R * f, 6, (i * Math.PI) / 18)} fill="none" stroke={col} strokeWidth={0.7} strokeOpacity={op * (0.5 + 0.5 * f)} />;
      })}
    </G>
  );
}
// Rings of the same size on a six-fold grid: each circle passes through the centre of its neighbours.
function Lattice({ r, rings, col, op }: { r: number; rings: number; col: string; op: number }) {
  const pts: [number, number][] = [[0, 0]];
  for (let k = 1; k <= rings; k++) for (let i = 0; i < 6 * k; i++) {
    const side = Math.floor(i / k), step = i % k;
    const a0 = (Math.PI / 3) * side, a1 = (Math.PI / 3) * (side + 1);
    const x0 = k * r * Math.cos(a0), y0 = k * r * Math.sin(a0), x1 = k * r * Math.cos(a1), y1 = k * r * Math.sin(a1);
    pts.push([x0 + ((x1 - x0) * step) / k, y0 + ((y1 - y0) * step) / k]);
  }
  return <G>{pts.map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} r={r} fill="none" stroke={col} strokeWidth={0.6} strokeOpacity={op} />)}</G>;
}
function Compass({ R, col, op }: { R: number; col: string; op: number }) {
  const spikes: React.ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI * i) / 8, long = i % 2 === 0;
    spikes.push(<Line key={i} x1={R + R * 0.3 * Math.cos(a)} y1={R + R * 0.3 * Math.sin(a)} x2={R + R * (long ? 0.96 : 0.66) * Math.cos(a)} y2={R + R * (long ? 0.96 : 0.66) * Math.sin(a)} stroke={col} strokeWidth={long ? 0.9 : 0.6} strokeOpacity={op} />);
  }
  return <G><Circle cx={R} cy={R} r={R * 0.3} fill="none" stroke={col} strokeWidth={0.7} strokeOpacity={op} /><Circle cx={R} cy={R} r={R * 0.98} fill="none" stroke={col} strokeWidth={0.6} strokeOpacity={op * 0.7} strokeDasharray="1.5 5" />{spikes}</G>;
}
export function RecordArt() {
  const { width: W, height: H } = useWindowDimensions();
  const s = Math.max(W / 390, 1);
  const a1 = useSpin(90, 1), a2 = useSpin(60, -1), a3 = useSpin(110, 1), a4 = useSpin(70, -1);
  const dr = useSway(16), br = useSway(8), br2 = useSway(10, 2);
  const dx = dr.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] }), dy = dr.interpolate({ inputRange: [0, 1], outputRange: [8, -8] });
  const sc = br.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.05] });
  const tw = br2.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const R1 = 104 * s, R2 = 66 * s, R3 = 150 * s, R4 = 54 * s;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <Animated.View style={{ position: 'absolute', right: -R1 * 0.38, top: -R1 * 0.28, width: R1 * 2, height: R1 * 2, transform: [{ rotate: a1 }] }}>
        <Svg width={R1 * 2} height={R1 * 2} viewBox={`0 0 ${R1 * 2} ${R1 * 2}`}><Tunnel R={R1} n={22} col={L} op={0.34} /></Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', right: -R1 * 0.38 + (R1 - R2), top: -R1 * 0.28 + (R1 - R2), width: R2 * 2, height: R2 * 2, transform: [{ rotate: a2 }] }}>
        <Svg width={R2 * 2} height={R2 * 2} viewBox={`0 0 ${R2 * 2} ${R2 * 2}`}><Tunnel R={R2} n={14} col={Gd} op={0.3} /></Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', left: -R3 * 0.62, bottom: -R3 * 0.5, width: R3 * 2, height: R3 * 2, transform: [{ translateX: dx }, { translateY: dy }] }}>
        <Svg width={R3 * 2} height={R3 * 2} viewBox={`${-R3} ${-R3} ${R3 * 2} ${R3 * 2}`}><Lattice r={36 * s} rings={3} col={T} op={0.22} /></Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', right: 26 * s, bottom: 76 * s, width: R4 * 2, height: R4 * 2, opacity: tw, transform: [{ rotate: a3 }, { scale: sc }] }}>
        <Svg width={R4 * 2} height={R4 * 2} viewBox={`0 0 ${R4 * 2} ${R4 * 2}`}><Compass R={R4} col={Gd} op={0.42} /></Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', right: 26 * s + R4 * 0.45, bottom: 76 * s + R4 * 0.45, width: R4 * 1.1, height: R4 * 1.1, opacity: tw, transform: [{ rotate: a4 }] }}>
        <Svg width={R4 * 1.1} height={R4 * 1.1} viewBox="0 0 100 100"><Polygon points={poly(50, 50, 46, 6, 0)} fill="none" stroke={L} strokeWidth={1.2} strokeOpacity={0.5} /></Svg>
      </Animated.View>
    </View>
  );
}
