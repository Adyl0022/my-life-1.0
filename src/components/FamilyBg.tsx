import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, G, Defs, Pattern, Circle } from 'react-native-svg';
import { Blob } from './Bg';

// Background of the Family Planner pages: same night sky as the Islamic Hub, with a neighbourhood of lit houses,
// string lights, twinkling stars and warm floating dots. Every animation is slow and runs on the native driver.
const AG = Animated.createAnimatedComponent(G);

function useLoop(from: number, to: number, dur: number, delay = 0) {
  const v = useRef(new Animated.Value(from)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: to, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: from, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, []);
  return v;
}

const STARS: [number, number, number][] = [[8, 12, 2], [22, 20, 1], [40, 9, 2], [58, 16, 1], [74, 11, 2], [90, 22, 1], [14, 34, 1], [48, 30, 2], [84, 38, 1], [30, 45, 2], [66, 50, 1], [94, 56, 1]];
function Star({ x, y, s, i }: { x: number; y: number; s: number; i: number }) {
  const v = useLoop(0.12, 1, 1400 + s * 380, i * 240);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: (x + '%') as any, top: (y + '%') as any, width: s + 1.5, height: s + 1.5, borderRadius: 4, backgroundColor: '#fff', opacity: v }} />;
}
function Shoot({ left, top, delay, gap }: { left: string; top: string; delay: number; gap: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration: 1000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(gap),
      Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: left as any, top: top as any, width: 90, height: 2, opacity: v.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 0.9, 0] }), transform: [{ rotate: '28deg' }, { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, 150] }) }] }}>
      <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,179,198,.55)', '#fff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 2 }} />
    </Animated.View>
  );
}
function Mote({ left, delay, dur, size, color }: { left: string; delay: number; dur: number; size: number; color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, []);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: left as any, bottom: 110, width: size, height: size, borderRadius: size, backgroundColor: color, opacity: v.interpolate({ inputRange: [0, 0.12, 0.8, 1], outputRange: [0, 0.85, 0.5, 0] }), transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -460] }) }] }} />;
}

// String lights hanging across the top; the wire sways a little and the bulbs glow in three groups.
const BULBS: [number, number, string][] = [[5, 22, '#ff8fab'], [18, 34, '#ffc46b'], [31, 42, '#5ee7df'], [44, 45, '#ff8fab'], [57, 42, '#ffc46b'], [70, 34, '#5ee7df'], [83, 24, '#ff8fab'], [95, 15, '#ffc46b']];
function Lights() {
  const sw = useLoop(0, 1, 2800);
  const g0 = useLoop(0.45, 1, 1200), g1 = useLoop(0.45, 1, 1200, 400), g2 = useLoop(0.45, 1, 1200, 800);
  const gl = [g0, g1, g2];
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 70, transformOrigin: 'top center', transform: [{ rotate: sw.interpolate({ inputRange: [0, 1], outputRange: ['-0.8deg', '0.8deg'] }) }] }}>
      <Svg width="100%" height={70} viewBox="0 0 400 70" preserveAspectRatio="none">
        <Path d="M0 12 Q 90 56 200 48 T 400 8" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth={1.4} />
      </Svg>
      {BULBS.map((b, i) => (
        <Animated.View key={i} style={{ position: 'absolute', left: (b[0] + '%') as any, top: b[1] + 2, width: 10, height: 10, marginLeft: -5, borderRadius: 5, backgroundColor: b[2], opacity: gl[i % 3], shadowColor: b[2], shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }} />
      ))}
    </Animated.View>
  );
}

// A row of houses along the bottom; some windows glow warm and flicker softly.
const HOUSES: [number, number, number, boolean][] = [[0, 70, 40, true], [46, 95, 48, true], [100, 60, 36, false], [142, 110, 52, true], [200, 80, 44, true], [250, 100, 50, true], [306, 66, 38, false], [350, 90, 50, true]];
function Houses() {
  const a = useLoop(0.35, 1, 2200), b = useLoop(0.35, 1, 2900, 700);
  const wins: { x: number; y: number; k: number }[] = [];
  HOUSES.forEach(([hx, h, w], i) => {
    for (let wy = 150 - h + 26, r = 0; wy < 144; wy += 26, r++) for (let c = 0; c < 2; c++) if ((i + r + c) % 4 !== 1) wins.push({ x: hx + (c ? w - 18 : 8), y: wy, k: (i + r + c) % 2 });
  });
  return (
    <Svg pointerEvents="none" width="100%" height={150} viewBox="0 0 400 150" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
      <G fill="#ffb3c6" opacity={0.15}>
        {HOUSES.map(([hx, h, w, roof], i) => roof
          ? <Path key={i} d={`M${hx} 150V${150 - h + 16}L${hx + w / 2} ${150 - h}L${hx + w} ${150 - h + 16}V150z`} />
          : <Rect key={i} x={hx} y={150 - h} width={w} height={h} />)}
        <Rect x={0} y={140} width={400} height={10} opacity={0.8} />
      </G>
      <AG opacity={a as any}>{wins.filter((x) => x.k === 0).map((x, i) => <Rect key={i} x={x.x} y={x.y} width={9} height={11} rx={2} fill="#ffc46b" />)}</AG>
      <AG opacity={b as any}>{wins.filter((x) => x.k === 1).map((x, i) => <Rect key={i} x={x.x} y={x.y} width={9} height={11} rx={2} fill="#ffc46b" />)}</AG>
    </Svg>
  );
}

export function FamilyBg() {
  return (
    <>
      <LinearGradient colors={['#0a0f2c', '#0f1f3d', '#0c3a3f']} locations={[0, 0.5, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(255,143,171,.4)" style={{ left: -90, top: -50 }} />
      <Blob size={340} color="rgba(94,231,223,.3)" style={{ right: -120, top: 300 }} />
      <Blob size={280} color="rgba(255,196,107,.26)" style={{ left: -50, bottom: 60 }} />
      <Svg pointerEvents="none" width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0 }}>
        <Defs>
          <Pattern id="hearts" width={56} height={56} patternUnits="userSpaceOnUse">
            <Path d="M28 36s-9-5.2-9-11.5a5 5 0 0 1 9-2.6 5 5 0 0 1 9 2.6C37 30.800 28 36 28 36z" fill="none" stroke="#fff" strokeWidth={1} opacity={0.09} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#hearts)" />
      </Svg>
      {STARS.map((t, i) => <Star key={i} x={t[0]} y={t[1]} s={t[2]} i={i} />)}
      <Shoot left="6%" top="14%" delay={1500} gap={4500} />
      <Shoot left="42%" top="22%" delay={5200} gap={6200} />
      <Mote left="14%" delay={0} dur={7000} size={4} color="#ff8fab" />
      <Mote left="36%" delay={2200} dur={8500} size={3} color="#ffc46b" />
      <Mote left="58%" delay={900} dur={7500} size={4} color="#5ee7df" />
      <Mote left="78%" delay={3600} dur={8000} size={3} color="#ff8fab" />
      <Mote left="90%" delay={1800} dur={6500} size={3} color="#ffc46b" />
      <Houses />
      <Lights />
    </>
  );
}

// Little house with a beating heart, used in the page header.
export function HouseHeart({ size = 78 }: { size?: number }) {
  const v = useLoop(1, 1.16, 650);
  return (
    <View pointerEvents="none" style={{ width: size, height: size * 0.8 }}>
      <Svg width={size} height={size * 0.8} viewBox="0 0 150 120">
        <Path d="M20 62 75 18l55 44" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M34 56v46h82V56" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.32)" strokeWidth={3} strokeLinejoin="round" />
        <Rect x={46} y={68} width={10} height={12} rx={2} fill="#ffc46b" opacity={0.85} />
        <Rect x={94} y={68} width={10} height={12} rx={2} fill="#ffc46b" opacity={0.85} />
      </Svg>
      <Animated.View style={{ position: 'absolute', left: size * 0.5 - 12, top: size * 0.8 * 0.5, transform: [{ scale: v }] }}>
        <Svg width={24} height={22} viewBox="0 0 24 22"><Path d="M12 20s-9-5.400-9-11.500A4.800 4.800 0 0 1 12 6a4.800 4.800 0 0 1 9 2.500C21 14.600 12 20 12 20z" fill="#ff8fab" /></Svg>
      </Animated.View>
    </View>
  );
}
