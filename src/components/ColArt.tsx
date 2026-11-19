import React from 'react';
import { View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

// Art for Personal Collection: a honeycomb that fills the bottom (a few cells glow) and a small fine star rosette in the top right corner. Lines only, so text stays easy to read.
const T = '#8fe9e2', L = '#b9a6ff', Gd = '#ffd9a8', COL = [L, T, Gd];
const S = 26, H = (S * Math.sqrt(3)) / 2;
const fade = (y: number) => Math.pow(Math.max(0, Math.min(1, (y - 560) / 260)), 0.8);
let seed = 11;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const CELLS: { p: string; c: string; hot: boolean; f: number }[] = [];
for (let r = 0; r < 16; r++) for (let c = -1; c < 16; c++) {
  const x = c * S * 1.5, y = 560 + r * H * 2 + (c % 2 ? H : 0), f = fade(y);
  if (f <= 0.03) continue;
  const p = Array.from({ length: 6 }, (_, i) => (x + S * Math.cos((Math.PI / 3) * i)).toFixed(1) + ',' + (y + S * Math.sin((Math.PI / 3) * i)).toFixed(1)).join(' ');
  CELLS.push({ p, c: COL[(((r + c) % 3) + 3) % 3], hot: rnd() < 0.14 * f + 0.03, f });
}
const star = (cx: number, cy: number, R: number, n: number, k: number) =>
  Array.from({ length: n }, (_, i) => (cx + R * Math.cos((2 * Math.PI * i * k) / n)).toFixed(1) + ',' + (cy + R * Math.sin((2 * Math.PI * i * k) / n)).toFixed(1)).join(' ');
const ROS = [[24, 5], [24, 7], [18, 5], [18, 7], [12, 5]].map(([n, k], i) => ({ p: star(372, 30, 56 * (1 - i * 0.14), n, k), c: COL[(i + 1) % 3] }));
export function ColArt() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      <Svg width="100%" height="100%" viewBox="0 0 390 820" preserveAspectRatio="xMidYMax slice">
        {CELLS.map((c, i) => <Polygon key={i} points={c.p} fill={c.hot ? c.c : 'none'} fillOpacity={c.hot ? 0.22 * c.f : 0} stroke={c.c} strokeOpacity={(c.hot ? 0.7 : 0.4) * c.f} strokeWidth={0.6} />)}
      </Svg>
      <Svg width={140} height={120} viewBox="300 0 90 120" style={{ position: 'absolute', right: 0, top: 0 }}>
        {ROS.map((r, i) => <Polygon key={i} points={r.p} fill="none" stroke={r.c} strokeOpacity={0.42} strokeWidth={0.6} />)}
      </Svg>
    </View>
  );
}
export default ColArt;
