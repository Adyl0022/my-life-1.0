import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Polygon, Polyline } from 'react-native-svg';

// Fine security-print art for the Documents page: guilloche rosettes, banknote waves and a seal. Lines only, so text stays easy to read.
const T = '#8fe9e2', L = '#b9a6ff', Gd = '#ffd9a8';
function Rosette({ cx, cy, rx, ry, n, col, op }: { cx: number; cy: number; rx: number; ry: number; n: number; col: string; op: number }) {
  return <G>{Array.from({ length: n }, (_, i) => <Ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} rotation={(i * 180) / n} origin={cx + ',' + cy} fill="none" stroke={col} strokeWidth={0.7} strokeOpacity={op} />)}</G>;
}
function Rings({ cx, cy, r0, r1, step, col, op }: { cx: number; cy: number; r0: number; r1: number; step: number; col: string; op: number }) {
  const a: number[] = []; for (let r = r0; r < r1; r += step) a.push(r);
  return <G>{a.map((r) => <Circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={0.6} strokeOpacity={op} />)}</G>;
}
const WAVES = Array.from({ length: 34 }, (_, i) => {
  const y = 560 + (300 * i) / 33, ph = i * 0.22, a = 14 * (0.6 + 0.4 * Math.sin(i * 0.35));
  const pts: string[] = []; for (let x = -10; x <= 410; x += 10) pts.push(x + ',' + (y + a * Math.sin((x / 190) * 2 * Math.PI + ph)).toFixed(1));
  return pts.join(' ');
});
function Star({ cx, cy, r, n }: { cx: number; cy: number; r: number; n: number }) {
  const p: string[] = []; for (let i = 0; i < n * 2; i++) { const a = (Math.PI * i) / n - Math.PI / 2, rr = i % 2 === 0 ? r : r * 0.45; p.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1)); }
  return <Polygon points={p.join(' ')} fill="none" stroke={Gd} strokeWidth={0.8} strokeOpacity={0.5} />;
}
export function DocArt() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      <Svg width="100%" height={230} viewBox="0 0 390 230" preserveAspectRatio="xMaxYMin slice" style={{ position: 'absolute', right: 0, top: 0 }}>
        <Rosette cx={338} cy={96} rx={92} ry={34} n={28} col={L} op={0.3} />
        <Rosette cx={338} cy={96} rx={60} ry={22} n={20} col={Gd} op={0.26} />
        <Rings cx={338} cy={96} r0={8} r1={22} step={3} col={Gd} op={0.3} />
      </Svg>
      <Svg width="100%" height={340} viewBox="0 520 390 340" preserveAspectRatio="xMinYMax slice" style={{ position: 'absolute', left: 0, bottom: 0 }}>
        {WAVES.map((p, i) => <Polyline key={i} points={p} fill="none" stroke={T} strokeWidth={0.6} strokeOpacity={0.17} />)}
        <Rosette cx={40} cy={742} rx={130} ry={46} n={30} col={T} op={0.22} />
        <Rosette cx={40} cy={742} rx={84} ry={30} n={22} col={L} op={0.26} />
        <Rings cx={40} cy={742} r0={10} r1={34} step={3} col={T} op={0.3} />
        <Circle cx={318} cy={742} r={66} fill="none" stroke={Gd} strokeWidth={0.8} strokeOpacity={0.3} strokeDasharray="1.5 4" />
        <Circle cx={318} cy={742} r={56} fill="none" stroke={Gd} strokeWidth={0.7} strokeOpacity={0.3} />
        <Rings cx={318} cy={742} r0={10} r1={48} step={4} col={L} op={0.28} />
        <Star cx={318} cy={742} r={22} n={8} />
      </Svg>
    </View>
  );
}
