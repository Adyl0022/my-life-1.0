import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';

// Art for Personal Collection: fine geometry. Nested hexagons that turn slowly, a dotted lattice and a few crossing guide lines. Lines only, so text stays easy to read.
const T = '#8fe9e2', L = '#b9a6ff', Gd = '#ffd9a8';
function poly(cx: number, cy: number, r: number, n: number, rot: number) {
  return Array.from({ length: n }, (_, i) => { const a = rot + (2 * Math.PI * i) / n; return (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1); }).join(' ');
}
function Nest({ cx, cy, n, count, r0, dr, twist, col, op }: { cx: number; cy: number; n: number; count: number; r0: number; dr: number; twist: number; col: string; op: number }) {
  return <>{Array.from({ length: count }, (_, i) => <Polygon key={i} points={poly(cx, cy, r0 + i * dr, n, i * twist)} fill="none" stroke={col} strokeWidth={0.6} strokeOpacity={op * (1 - i / (count * 1.3))} />)}</>;
}
const DOTS: number[][] = [];
for (let r = 0; r < 7; r++) for (let c = 0; c < 9; c++) DOTS.push([6 + c * 14, 600 + r * 14, 0.34 * (1 - (r + (8 - c)) / 16)]);
export function ColArt() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      <Svg width="100%" height="100%" viewBox="0 0 390 820" preserveAspectRatio="xMidYMax slice">
        <Nest cx={318} cy={742} n={6} count={30} r0={10} dr={6.5} twist={0.07} col={L} op={0.5} />
        <Nest cx={318} cy={742} n={3} count={14} r0={10} dr={9} twist={0.16} col={Gd} op={0.42} />
        <Nest cx={64} cy={700} n={4} count={18} r0={8} dr={6} twist={0.09} col={T} op={0.4} />
        <Nest cx={374} cy={36} n={6} count={12} r0={6} dr={5} twist={0.12} col={T} op={0.4} />
        {DOTS.map((d, i) => <Circle key={i} cx={d[0]} cy={d[1]} r={0.9} fill={L} fillOpacity={Math.max(0.04, d[2])} />)}
        <Line x1={0} y1={620} x2={390} y2={820} stroke={T} strokeWidth={0.5} strokeOpacity={0.2} />
        <Line x1={0} y1={700} x2={390} y2={640} stroke={Gd} strokeWidth={0.5} strokeOpacity={0.18} />
      </Svg>
    </View>
  );
}
export default ColArt;
