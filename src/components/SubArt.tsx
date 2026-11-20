import React from 'react';
import { View, Animated, Image, useWindowDimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useSpin, useSway } from './artMotion';
import { TOP } from '../lib/layout';

// Background for Subscriptions, in the same palette as Documents and Personal Collection (teal, lavender, gold on the dark purple page):
// slow rings with small points riding on them behind the picture, and a few twinkling specks. The picture is a rendered pair of headphones with a premium card.
const T = '#8fe9e2', L = '#b9a6ff', Gd = '#ffd9a8';
function Layer({ left, top, R, rot, children }: { left: number; top: number; R: number; rot: any; children: React.ReactNode }) {
  return <Animated.View style={{ position: 'absolute', left: left - R, top: top - R, width: R * 2, height: R * 2, transform: [{ rotate: rot }] }}>{children}</Animated.View>;
}
function Dust({ x, y, r, v, c }: { x: number; y: number; r: number; v: Animated.Value; c: string }) {
  return <Animated.View style={{ position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: c, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.9] }) }} />;
}
// the picture and its rings; this scrolls with the page, so it sits inside the content and not in the fixed background
export function SubHero() {
  const a = useSpin(150, 1), b = useSpin(100, -1), c = useSpin(210, 1), fl = useSway(7);
  const y = fl.interpolate({ inputRange: [0, 1], outputRange: [4, -5] });
  const box = (R: number) => ({ width: R * 2, height: R * 2 });
  const CX = 150, CY = 112;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', right: -56, top: -(TOP + 36), width: 300, height: 300 }}>
      <Layer left={CX} top={CY} R={140} rot={c}><Svg {...box(140)} viewBox="-140 -140 280 280"><Circle r={136} fill="none" stroke={L} strokeOpacity={0.26} strokeWidth={0.8} strokeDasharray="2 6" /><Circle cx={136} cy={0} r={3.4} fill={Gd} fillOpacity={0.9} /><Circle cx={-96} cy={96} r={2.4} fill={T} fillOpacity={0.8} /></Svg></Layer>
      <Layer left={CX} top={CY} R={106} rot={a}><Svg {...box(106)} viewBox="-106 -106 212 212"><Circle r={102} fill="none" stroke={T} strokeOpacity={0.3} strokeWidth={0.9} /><Circle cx={0} cy={-102} r={4} fill={T} fillOpacity={0.9} /><Circle cx={72} cy={72} r={2.6} fill={L} fillOpacity={0.8} /></Svg></Layer>
      <Layer left={CX} top={CY} R={74} rot={b}><Svg {...box(74)} viewBox="-74 -74 148 148"><Circle r={70} fill="none" stroke={Gd} strokeOpacity={0.34} strokeWidth={0.9} strokeDasharray="1.5 5" /><Circle cx={70} cy={0} r={3} fill={Gd} fillOpacity={0.9} /></Svg></Layer>
      <Animated.View style={{ position: 'absolute', left: CX - 107 + 14, top: CY - 99 + 16, transform: [{ translateY: y }] }}><Image source={require('../../assets/sub-hero.png')} style={{ width: 214, height: 198 }} resizeMode="contain" /></Animated.View>
    </View>
  );
}

// fixed background: a few twinkling specks in the Documents palette
export function SubArt() {
  const { width: W, height: H } = useWindowDimensions();
  const t1 = useSway(4), t2 = useSway(5.5, 1), t3 = useSway(7, 2);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <Dust x={0.08 * W} y={0.2 * H} r={1.6} v={t1} c={Gd} /><Dust x={0.46 * W} y={0.34 * H} r={1.2} v={t2} c={T} /><Dust x={0.88 * W} y={0.52 * H} r={1.8} v={t3} c={L} />
      <Dust x={0.3 * W} y={0.52 * H} r={1.3} v={t2} c={Gd} /><Dust x={0.94 * W} y={0.72 * H} r={1.3} v={t1} c={T} /><Dust x={0.62 * W} y={0.82 * H} r={1.7} v={t3} c={L} />
      <Dust x={0.2 * W} y={0.7 * H} r={1.2} v={t3} c={T} /><Dust x={0.72 * W} y={0.14 * H} r={1.4} v={t2} c={Gd} />
    </View>
  );
}
