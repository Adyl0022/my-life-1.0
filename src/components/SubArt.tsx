import React from 'react';
import { View, Animated, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Polyline } from 'react-native-svg';
import { useSpin, useSway } from './artMotion';

// Background art for Subscriptions, in the look of current tech: nested hexagons around a core, circuit traces with glowing nodes,
// a low-poly mesh that drifts, and a wireframe cube. Thin lines only, so the cards on top stay easy to read.
const WH = '#ffffff', CY = '#9ff3ff', LV = '#d9c8ff', MT = '#b4ffe6';
const hex = (r: number, rot = 0) => Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i + rot; return (r * Math.cos(a)).toFixed(1) + ',' + (r * Math.sin(a)).toFixed(1); }).join(' ');
// isometric cube, edge e
const cube = (e: number) => {
  const dx = e * 0.866, dy = e * 0.5;
  const top = [[0, -e], [dx, -dy], [0, 0], [-dx, -dy]], bot = [[0, 0], [dx, -dy + e], [0, e], [-dx, -dy + e]];
  return { top, bot, dx, dy };
};
function Layer({ left, top, R, rot, scale, opacity, children }: { left: number; top: number; R: number; rot?: any; scale?: any; opacity?: any; children: React.ReactNode }) {
  return <Animated.View style={{ position: 'absolute', left: left - R, top: top - R, width: R * 2, height: R * 2, opacity: opacity == null ? 1 : opacity, transform: [...(rot ? [{ rotate: rot }] : []), ...(scale ? [{ scale }] : [])] }}>{children}</Animated.View>;
}
// low-poly mesh points on a jittered grid
const MESH = (() => { const p: [number, number][][] = []; for (let r = 0; r < 6; r++) { const row: [number, number][] = []; for (let c = 0; c < 9; c++) row.push([c * 50 + (r % 2 ? 25 : 0) + Math.sin(r * 3.1 + c * 1.7) * 9, r * 44 + Math.cos(c * 2.3 + r) * 8]); p.push(row); } return p; })();
export function SubArt() {
  const { width: W, height: H } = useWindowDimensions(); const s = Math.max(W / 390, 1);
  const h1 = useSpin(90, 1), h2 = useSpin(60, -1), h3 = useSpin(40, 1), cb = useSpin(80, 1);
  const dr = useSway(16), fl = useSway(9), p1 = useSway(3.5), p2 = useSway(4.5, 1), p3 = useSway(5.5, 2);
  const mx = dr.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] }); const fy = fl.interpolate({ inputRange: [0, 1], outputRange: [6, -6] });
  const op = (v: Animated.Value) => v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] });
  const cx = W - 60 * s, cy = 118 * s;
  const box = (R: number) => ({ width: R * 2, height: R * 2 });
  const q = cube(30);
  const L = { fill: 'none', strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {/* hexagons around a core */}
      <Layer left={cx} top={cy} R={140 * s} rot={h1}><Svg {...box(140 * s)} viewBox="-140 -140 280 280"><Polygon points={hex(136)} {...L} stroke={WH} strokeOpacity={0.22} strokeWidth={1} /><Circle cx={136} cy={0} r={3.5} fill={CY} fillOpacity={0.9} /><Circle cx={-68} cy={-117.8} r={2.5} fill={WH} fillOpacity={0.7} /></Svg></Layer>
      <Layer left={cx} top={cy} R={100 * s} rot={h2}><Svg {...box(100 * s)} viewBox="-100 -100 200 200"><Polygon points={hex(96, Math.PI / 6)} {...L} stroke={CY} strokeOpacity={0.34} strokeWidth={1} strokeDasharray="3 5" /><Circle cx={0} cy={-96} r={3} fill={MT} fillOpacity={0.9} /></Svg></Layer>
      <Layer left={cx} top={cy} R={64 * s} rot={h3}><Svg {...box(64 * s)} viewBox="-64 -64 128 128"><Polygon points={hex(60)} {...L} stroke={LV} strokeOpacity={0.5} strokeWidth={1.1} />{Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i; return <Line key={i} x1={0} y1={0} x2={60 * Math.cos(a)} y2={60 * Math.sin(a)} stroke={LV} strokeOpacity={0.2} strokeWidth={0.7} />; })}</Svg></Layer>
      <Layer left={cx} top={cy} R={20 * s} opacity={op(p1)}><Svg {...box(20 * s)} viewBox="-20 -20 40 40"><Circle r={7} fill={CY} fillOpacity={0.35} /><Circle r={3.2} fill={WH} fillOpacity={0.9} /></Svg></Layer>

      {/* circuit traces on the left edge */}
      <View style={{ position: 'absolute', left: 0, top: 0.8 * H, width: 120 * s, height: 220 * s }}>
        <Svg width={120 * s} height={220 * s} viewBox="0 0 120 220">
          <G {...L} stroke={WH} strokeOpacity={0.22} strokeWidth={1}>
            <Polyline points="0,20 40,20 56,36 56,90 80,114" /><Polyline points="0,70 24,70 40,86 40,150" /><Polyline points="0,130 30,130 46,146 46,196 70,196" /><Polyline points="0,176 16,176 28,188" />
          </G>
        </Svg>
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: 120 * s, height: 220 * s, opacity: op(p2) }}><Svg width={120 * s} height={220 * s} viewBox="0 0 120 220"><Circle cx={80} cy={114} r={3.5} fill={MT} /><Circle cx={40} cy={150} r={3} fill={CY} /><Circle cx={70} cy={196} r={3.5} fill={CY} /></Svg></Animated.View>
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: 120 * s, height: 220 * s, opacity: op(p3) }}><Svg width={120 * s} height={220 * s} viewBox="0 0 120 220"><Circle cx={28} cy={188} r={3} fill={WH} /><Circle cx={56} cy={90} r={3} fill={LV} /></Svg></Animated.View>
      </View>

      {/* low-poly mesh drifting along the bottom */}
      <Animated.View style={{ position: 'absolute', left: -20, bottom: 0, width: 460 * s, height: 190 * s, transform: [{ translateX: mx }] }}>
        <Svg width={460 * s} height={190 * s} viewBox="0 60 460 190" preserveAspectRatio="xMinYMax slice">
          <G {...L} stroke={WH} strokeOpacity={0.13} strokeWidth={0.8}>
            {MESH.slice(0, -1).map((row, r) => row.slice(0, -1).map((a, c) => { const b = row[c + 1], d = MESH[r + 1][c], e = MESH[r + 1][c + 1]; const o = r % 2 ? [a, b, e, d] : [a, b, d, e]; return <Polyline key={r + '-' + c} points={[a, b, e, d, a].map((x) => x[0].toFixed(0) + ',' + (x[1] + 20).toFixed(0)).join(' ')} />; }))}
          </G>
          {MESH.map((row, r) => row.map((a, c) => ((r + c) % 4 === 0 ? <Circle key={r + '_' + c} cx={a[0]} cy={a[1] + 20} r={2} fill={CY} fillOpacity={0.4} /> : null)))}
        </Svg>
      </Animated.View>

      {/* wireframe cube */}
      <Animated.View style={{ position: 'absolute', right: 22 * s, bottom: 120 * s, transform: [{ translateY: fy }] }}>
        <Animated.View style={{ transform: [{ rotate: cb }] }}>
          <Svg width={90} height={90} viewBox="-45 -45 90 90"><G transform="translate(0,-15)" {...L} stroke={LV} strokeOpacity={0.5} strokeWidth={1.1}>
            <Polygon points={q.top.map((p) => p.join(',')).join(' ')} /><Polyline points={[q.top[3], q.bot[3], q.bot[2], q.bot[1], q.top[1]].map((p) => p.join(',')).join(' ')} /><Line x1={0} y1={0} x2={0} y2={30} />
          </G></Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
