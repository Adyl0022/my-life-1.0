import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

// Art for Personal Collection: fine contour lines like a map, and a small constellation. Lines only, so text stays easy to read.
function contour(cx: number, cy: number, n: number, r0: number, dr: number, seed: number) {
  const ph = [seed * 1.7, seed * 2.3 + 1, seed * 0.9 + 2];
  return Array.from({ length: n }, (_, i) => {
    const r = r0 + i * dr; const pts: string[] = [];
    for (let k = 0; k <= 72; k++) {
      const t = (k / 72) * 2 * Math.PI;
      const rr = r * (1 + 0.16 * Math.sin(2 * t + ph[0] + i * 0.12) + 0.1 * Math.sin(3 * t + ph[1] - i * 0.09) + 0.055 * Math.sin(5 * t + ph[2]));
      pts.push((k ? 'L' : 'M') + (cx + rr * Math.cos(t) * 1.1).toFixed(1) + ' ' + (cy + rr * Math.sin(t) * 0.9).toFixed(1));
    }
    return { d: pts.join(' ') + 'Z', o: 0.4 * (1 - i / (n * 1.25)) };
  });
}
const TOP = contour(330, 70, 14, 14, 10, 1);
const BOT = contour(40, 130, 16, 16, 11, 2);
const NODES_A = [[230, 150], [268, 126], [306, 162], [340, 122], [372, 150]];
const NODES_B = [[150, 220], [196, 240], [236, 214]];

function Twinkle({ delay, children }: { delay: number; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 1800, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(v, { toValue: 0.45, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true })]));
    a.start(); return () => a.stop();
  }, []);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: v }}>{children}</Animated.View>;
}

export function ColArt() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      <Svg width="100%" height={250} viewBox="0 0 390 250" preserveAspectRatio="xMaxYMin slice" style={{ position: 'absolute', right: 0, top: 0 }}>
        {TOP.map((p, i) => <Path key={i} d={p.d} fill="none" stroke="#e3d4ff" strokeWidth={0.8} strokeOpacity={p.o} />)}
      </Svg>
      <View style={{ position: 'absolute', left: 0, bottom: 0, right: 0, height: 300 }}>
        <Svg width="100%" height={300} viewBox="0 0 390 300" preserveAspectRatio="xMinYMax slice" style={{ position: 'absolute', left: 0, bottom: 0 }}>
          {BOT.map((p, i) => <Path key={i} d={p.d} fill="none" stroke="#ffc9dc" strokeWidth={0.8} strokeOpacity={p.o * 0.9} />)}
        </Svg>
        <Twinkle delay={0}>
          <Svg width="100%" height={300} viewBox="0 0 390 300" preserveAspectRatio="xMinYMax slice">
            {NODES_A.slice(1).map((p, i) => <Line key={i} x1={NODES_A[i][0]} y1={NODES_A[i][1]} x2={p[0]} y2={p[1]} stroke="#8fe9e2" strokeOpacity={0.45} strokeWidth={0.8} />)}
            {NODES_A.map((p, i) => <G2 key={i} x={p[0]} y={p[1]} c="#8fe9e2" />)}
          </Svg>
        </Twinkle>
        <Twinkle delay={900}>
          <Svg width="100%" height={300} viewBox="0 0 390 300" preserveAspectRatio="xMinYMax slice">
            {NODES_B.slice(1).map((p, i) => <Line key={i} x1={NODES_B[i][0]} y1={NODES_B[i][1]} x2={p[0]} y2={p[1]} stroke="#ffe3c2" strokeOpacity={0.45} strokeWidth={0.8} />)}
            {NODES_B.map((p, i) => <G2 key={i} x={p[0]} y={p[1]} c="#ffe3c2" />)}
          </Svg>
        </Twinkle>
      </View>
    </View>
  );
}
const G2 = ({ x, y, c }: { x: number; y: number; c: string }) => <><Circle cx={x} cy={y} r={7} fill={c} fillOpacity={0.18} /><Circle cx={x} cy={y} r={2} fill="#fff" /></>;
