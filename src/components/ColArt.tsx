import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Art for Personal Collection: a fine flow field of hair-thin threads in the Documents colours (teal, lilac, gold). Lines only, so text stays easy to read.
let s = 7;
const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
const ang = (x: number, y: number) => 2.4 * Math.sin(x * 0.011 + 1.3 * Math.sin(y * 0.006)) + 2.1 * Math.cos(y * 0.009 - x * 0.004) + 0.9 * Math.sin((x + y) * 0.017);
const PAL = ['#8fe9e2', '#b9a6ff', '#ffd9a8', '#b9a6ff', '#8fe9e2'];
const THREADS = Array.from({ length: 300 }, () => {
  let x = rnd() * 430 - 20, y = rnd() * 860 - 20;
  const x0 = x, y0 = y; let d = 'M' + x.toFixed(0) + ' ' + y.toFixed(0);
  for (let k = 0; k < 34; k++) { const a = ang(x, y); x += Math.cos(a) * 6; y += Math.sin(a) * 6; d += 'L' + x.toFixed(0) + ' ' + y.toFixed(0); }
  const t = (x0 / 390) * 0.5 + (y0 / 820) * 0.5;
  return { d, c: PAL[Math.min(4, Math.floor(t * 5))], o: [0.1, 0.16, 0.22, 0.3][Math.floor(rnd() * 4)] };
});
export function ColArt() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      <Svg width="100%" height="100%" viewBox="0 0 390 820" preserveAspectRatio="xMidYMid slice">
        {THREADS.map((t, i) => <Path key={i} d={t.d} fill="none" stroke={t.c} strokeWidth={0.5} strokeOpacity={t.o} />)}
      </Svg>
    </View>
  );
}
export default ColArt;
