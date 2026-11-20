import React from 'react';
import { View, Animated, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Path, Rect, Polygon } from 'react-native-svg';
import { useSpin, useSway } from './artMotion';

// Background art for Subscriptions: billing orbits with little dots going round, two arrows chasing each other (things that repeat),
// a calendar of dots with one charge day pulsing, and small outlines of what people subscribe to drifting about. Lines only, very soft.
const B = '#9db4ff', V = '#c3a6ff', G2 = '#8fe9d0', O = '#ffc796';
const ring = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1); return 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + r + ' ' + r + ' 0 0 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1);
};
function Layer({ left, top, R, rot, scale, children }: { left: number; top: number; R: number; rot?: any; scale?: any; children: React.ReactNode }) {
  return <Animated.View style={{ position: 'absolute', left: left - R, top: top - R, width: R * 2, height: R * 2, transform: [...(rot ? [{ rotate: rot }] : []), ...(scale ? [{ scale }] : [])] }}>{children}</Animated.View>;
}
export function SubArt() {
  const { width: W, height: H } = useWindowDimensions(); const s = Math.max(W / 390, 1);
  const o1 = useSpin(70, 1), o2 = useSpin(48, -1), o3 = useSpin(100, 1), ar = useSpin(26, 1), ar2 = useSpin(34, -1);
  const f1 = useSway(11), f2 = useSway(13, 2), f3 = useSway(10, 4), f4 = useSway(12, 1), pulse = useSway(5);
  const dy = (v: Animated.Value, a: number) => v.interpolate({ inputRange: [0, 1], outputRange: [a, -a] });
  const sc = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.25] }); const po = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const cx = W - 52 * s, cy = 120 * s; // orbit centre, near the top right
  const box = (R: number) => ({ width: R * 2, height: R * 2 });
  const float = (v: Animated.Value, x: number, y: number, a: number, node: React.ReactNode) => <Animated.View style={{ position: 'absolute', left: x, top: y, transform: [{ translateY: dy(v, a) }] }}>{node}</Animated.View>;
  const gl = { fill: 'none', strokeWidth: 1.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {/* billing orbits */}
      <Layer left={cx} top={cy} R={150 * s} rot={o3}><Svg {...box(150 * s)} viewBox="-150 -150 300 300"><Circle r={146} fill="none" stroke={B} strokeOpacity={0.2} strokeWidth={0.8} strokeDasharray="2 6" /><Circle cx={146} cy={0} r={3.4} fill={V} fillOpacity={0.7} /><Circle cx={-103} cy={103} r={2.4} fill={B} fillOpacity={0.6} /></Svg></Layer>
      <Layer left={cx} top={cy} R={104 * s} rot={o1}><Svg {...box(104 * s)} viewBox="-104 -104 208 208"><Circle r={100} fill="none" stroke={V} strokeOpacity={0.26} strokeWidth={0.8} /><Circle cx={0} cy={-100} r={4} fill={G2} fillOpacity={0.8} /><Circle cx={70} cy={71} r={2.6} fill={O} fillOpacity={0.7} /></Svg></Layer>
      <Layer left={cx} top={cy} R={62 * s} rot={o2}><Svg {...box(62 * s)} viewBox="-62 -62 124 124"><Circle r={58} fill="none" stroke={G2} strokeOpacity={0.3} strokeWidth={0.8} strokeDasharray="1.5 4" /><Circle cx={58} cy={0} r={3} fill={B} fillOpacity={0.8} /></Svg></Layer>
      {/* two arrows chasing each other: the sign of something that repeats */}
      <Layer left={cx} top={cy} R={34 * s} rot={ar}><Svg {...box(34 * s)} viewBox="-34 -34 68 68"><G stroke={G2} strokeOpacity={0.55} {...gl}><Path d={ring(0, 0, 26, -2.6, 0.2)} /><Polygon points="22,-8 28,2 17,2" fill={G2} fillOpacity={0.55} stroke="none" /></G></Svg></Layer>
      <Layer left={cx} top={cy} R={34 * s} rot={ar2}><Svg {...box(34 * s)} viewBox="-34 -34 68 68"><G stroke={V} strokeOpacity={0.5} {...gl}><Path d={ring(0, 0, 18, 0.5, 3.3)} /><Polygon points="-15,10 -19,0 -9,2" fill={V} fillOpacity={0.5} stroke="none" /></G></Svg></Layer>
      {/* calendar of dots, bottom left; one charge day pulses */}
      <View style={{ position: 'absolute', left: 14 * s, bottom: 30 * s, opacity: 0.5 }}>
        <Svg width={150 * s} height={110 * s} viewBox="0 0 150 110">
          {Array.from({ length: 35 }, (_, i) => <Circle key={i} cx={10 + (i % 7) * 21} cy={10 + Math.floor(i / 7) * 21} r={1.6} fill={B} fillOpacity={0.45} />)}
        </Svg>
        <Animated.View style={{ position: 'absolute', left: (10 + 3 * 21 - 9) * s, top: (10 + 2 * 21 - 9) * s, width: 18 * s, height: 18 * s, borderRadius: 9 * s, borderWidth: 1.2, borderColor: G2, opacity: po, transform: [{ scale: sc }] }} />
        <Animated.View style={{ position: 'absolute', left: (10 + 3 * 21 - 3) * s, top: (10 + 2 * 21 - 3) * s, width: 6 * s, height: 6 * s, borderRadius: 3 * s, backgroundColor: G2, opacity: 0.8 }} />
      </View>
      {/* what people subscribe to, as faint outlines */}
      {float(f1, 18 * s, 0.34 * H, 7, <Svg width={46} height={46} viewBox="0 0 24 24"><G stroke={V} strokeOpacity={0.3} {...gl}><Rect x={3} y={5} width={18} height={14} rx={4} /><Polygon points="10,9.5 15,12 10,14.5" /></G></Svg>)}
      {float(f2, W - 66 * s, 0.5 * H, 8, <Svg width={42} height={42} viewBox="0 0 24 24"><G stroke={O} strokeOpacity={0.32} {...gl}><Path d="M9 18V6l10-2v12" /><Circle cx={6.5} cy={18} r={2.5} /><Circle cx={16.5} cy={16} r={2.5} /></G></Svg>)}
      {float(f3, W - 120 * s, 0.76 * H, 6, <Svg width={40} height={40} viewBox="0 0 24 24"><G stroke={B} strokeOpacity={0.3} {...gl}><Path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 10.5 3.8 3.8 0 0 1 17 18z" /></G></Svg>)}
      {float(f4, 0.42 * W, 0.62 * H, 6, <Svg width={34} height={34} viewBox="0 0 24 24"><G stroke={G2} strokeOpacity={0.32} {...gl}><Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></G></Svg>)}
    </View>
  );
}
