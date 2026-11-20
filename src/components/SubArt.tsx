import React from 'react';
import { View, Animated, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Polygon, Polyline } from 'react-native-svg';
import { useSpin, useSway } from './artMotion';

// Background art for Subscriptions. Two ideas, both about things that come round again and grow:
//  1. a tunnel of squares, each turned a little more than the last. Two sets turn against each other, so a moiré ripples through it.
//  2. a golden spiral that winds out from the bottom left, with a few glowing points riding on it.
// Fine gold and ice-blue lines on deep night blue. Lines only, so the cards on top stay easy to read.
const GD = '#f6cf8b', IB = '#a9c2ff', RS = '#ffb3c7';
const PHI = (1 + Math.sqrt(5)) / 2, K = Math.log(PHI) / (Math.PI / 2);
const sq = (side: number, deg: number) => { const h = side / 2, a = (deg * Math.PI) / 180, c = Math.cos(a), n = Math.sin(a); return [[-h, -h], [h, -h], [h, h], [-h, h]].map(([x, y]) => (x * c - y * n).toFixed(1) + ',' + (x * n + y * c).toFixed(1)).join(' '); };
const spiral = (a: number, turns: number) => { const pts: string[] = []; for (let t = 0; t <= turns * 2 * Math.PI; t += 0.05) { const r = a * Math.exp(K * t); pts.push((r * Math.cos(t)).toFixed(1) + ',' + (r * Math.sin(t)).toFixed(1)); } return pts.join(' '); };
const SPIRAL = spiral(2.2, 2.9); // reaches about 2.2 * phi^6.8 = 58 x ... scaled below
const SQN = 16;
function Layer({ left, top, R, rot, scale, opacity, children }: { left: number; top: number; R: number; rot?: any; scale?: any; opacity?: any; children: React.ReactNode }) {
  return <Animated.View style={{ position: 'absolute', left: left - R, top: top - R, width: R * 2, height: R * 2, opacity: opacity == null ? 1 : opacity, transform: [...(rot ? [{ rotate: rot }] : []), ...(scale ? [{ scale }] : [])] }}>{children}</Animated.View>;
}
function Dust({ x, y, r, v }: { x: number; y: number; r: number; v: Animated.Value }) {
  return <Animated.View style={{ position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: GD, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.85] }) }} />;
}
export function SubArt() {
  const { width: W, height: H } = useWindowDimensions(); const s = Math.max(W / 390, 1);
  const t1 = useSpin(140, 1), t2 = useSpin(110, -1), sp = useSpin(200, 1), ripple = useSway(12), tw1 = useSway(4), tw2 = useSway(5.5, 1), tw3 = useSway(7, 2);
  const cx = W - 50 * s, cy = 130 * s; const R = 150 * s;
  const rc = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.04] });
  const box = (r: number) => ({ width: r * 2, height: r * 2 });
  const L = { fill: 'none', strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const scx = 40 * s, scy = H - 70 * s, SR = 230 * s;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {/* tunnel of squares: even ones turn one way, odd ones the other */}
      <Layer left={cx} top={cy} R={R} rot={t1} scale={rc}><Svg {...box(R)} viewBox="-150 -150 300 300"><G {...L} stroke={GD} strokeWidth={0.9}>{Array.from({ length: SQN }, (_, i) => i).filter((i) => i % 2 === 0).map((i) => <Polygon key={i} points={sq(200 - i * 11.5, i * 5.5)} strokeOpacity={0.12 + (i / SQN) * 0.42} />)}</G></Svg></Layer>
      <Layer left={cx} top={cy} R={R} rot={t2} scale={rc}><Svg {...box(R)} viewBox="-150 -150 300 300"><G {...L} stroke={IB} strokeWidth={0.9}>{Array.from({ length: SQN }, (_, i) => i).filter((i) => i % 2 === 1).map((i) => <Polygon key={i} points={sq(200 - i * 11.5, i * 5.5)} strokeOpacity={0.1 + (i / SQN) * 0.4} />)}</G><Circle r={3} fill={GD} fillOpacity={0.9} /><Circle r={9} fill="none" stroke={GD} strokeOpacity={0.5} strokeWidth={0.8} /></Svg></Layer>

      {/* golden spiral from the bottom left */}
      <Layer left={scx} top={scy} R={SR} rot={sp}>
        <Svg {...box(SR)} viewBox="-230 -230 460 460"><G transform="scale(3.1)"><Polyline points={SPIRAL} {...L} stroke={GD} strokeOpacity={0.42} strokeWidth={0.5} /><Polyline points={SPIRAL} {...L} stroke={RS} strokeOpacity={0.16} strokeWidth={0.5} transform="rotate(180)" /></G>
          {[2.2, 3.1, 4.4].map((ph, i) => { const t = ph * Math.PI * 1.3, r = 2.2 * Math.exp(K * t) * 3.1; return <Circle key={i} cx={r * Math.cos(t)} cy={r * Math.sin(t)} r={3.2 - i * 0.5} fill={GD} fillOpacity={0.85 - i * 0.15} />; })}
        </Svg>
      </Layer>
      <Layer left={scx} top={scy} R={SR} rot={t2}><Svg {...box(SR)} viewBox="-230 -230 460 460">{[60, 97, 157, 254].map((r, i) => <Circle key={r} r={r} fill="none" stroke={IB} strokeOpacity={0.12 + (i % 2) * 0.05} strokeWidth={0.7} strokeDasharray={i % 2 ? '2 6' : undefined} />)}</Svg></Layer>

      {/* dust */}
      <Dust x={0.12 * W} y={0.22 * H} r={1.6} v={tw1} /><Dust x={0.47 * W} y={0.31 * H} r={1.2} v={tw2} /><Dust x={0.84 * W} y={0.47 * H} r={1.8} v={tw3} /><Dust x={0.3 * W} y={0.55 * H} r={1.3} v={tw2} />
      <Dust x={0.9 * W} y={0.68 * H} r={1.3} v={tw1} /><Dust x={0.62 * W} y={0.82 * H} r={1.7} v={tw3} /><Dust x={0.2 * W} y={0.4 * H} r={1.1} v={tw3} />
    </View>
  );
}
