import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';

// Art for Personal Collection: a honeycomb that fills the bottom (a few cells glow) and a fine triangle mesh in the top right corner. Lines only, so text stays easy to read.
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
// Triangle mesh in the top right corner, fading away from the corner.
const MR = 215, MS = 30, MCX = 400, MCY = -10;
const PT = (r: number, c: number) => ({ x: MCX + c * MS + (r % 2 ? MS / 2 : 0) + (rnd() - 0.5) * 16, y: MCY + r * MS * 0.87 + (rnd() - 0.5) * 16 });
const GRID: Record<string, { x: number; y: number }> = {};
for (let r = 0; r <= 12; r++) for (let c = -12; c <= 0; c++) GRID[r + ',' + c] = PT(r, c);
const mf = (x: number, y: number) => Math.max(0, 1 - Math.hypot(x - MCX, y - MCY) / MR);
const EDGES: { x1: number; y1: number; x2: number; y2: number; c: string; f: number }[] = [];
const DOTS: { x: number; y: number; f: number }[] = [];
Object.keys(GRID).forEach((k) => {
  const [r, c] = k.split(',').map(Number), a = GRID[k];
  [[0, 1], [1, 0], [1, r % 2 === 0 ? -1 : 1]].forEach(([dr, dc]) => {
    const q = GRID[r + dr + ',' + (c + dc)]; if (!q) return;
    const f = mf((a.x + q.x) / 2, (a.y + q.y) / 2); if (f > 0) EDGES.push({ x1: a.x, y1: a.y, x2: q.x, y2: q.y, c: COL[(((r + c) % 3) + 3) % 3], f });
  });
  const f = mf(a.x, a.y); if (f > 0.15) DOTS.push({ x: a.x, y: a.y, f });
});
export function ColArt() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      <Svg width="100%" height="100%" viewBox="0 0 390 820" preserveAspectRatio="xMidYMax slice">
        {CELLS.map((c, i) => <Polygon key={i} points={c.p} fill={c.hot ? c.c : 'none'} fillOpacity={c.hot ? 0.22 * c.f : 0} stroke={c.c} strokeOpacity={(c.hot ? 0.7 : 0.4) * c.f} strokeWidth={0.6} />)}
      </Svg>
      <Svg width="100%" height={230} viewBox="0 0 390 230" preserveAspectRatio="xMaxYMin slice" style={{ position: 'absolute', right: 0, top: 0 }}>
        {EDGES.map((e, i) => <Line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={e.c} strokeOpacity={0.8 * e.f} strokeWidth={0.6} />)}
        {DOTS.map((d, i) => <Circle key={i} cx={d.x} cy={d.y} r={1.2} fill={Gd} fillOpacity={0.8 * d.f} />)}
      </Svg>
    </View>
  );
}
export default ColArt;
