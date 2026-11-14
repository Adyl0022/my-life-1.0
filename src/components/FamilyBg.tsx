import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, G, Circle } from 'react-native-svg';
import { Blob } from './Bg';

// Background of the Family Planner pages: same night sky as the Islamic Hub, with a neighbourhood of lit houses,
// string lights, twinkling sparkles, small drifting asteroids and warm floating dots. Every animation is slow and runs on the native driver.
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

// Four-point sparkle that twinkles: grows, brightens and turns a little, then fades back.
const SPARK: [number, number, number, string, number][] = [
  [6, 9, 14, '#ffc46b', 0], [24, 5, 9, '#fff3d6', 1], [46, 12, 12, '#5ee7df', 2], [68, 6, 15, '#ff8fab', 3], [88, 11, 10, '#ffc46b', 4],
  [12, 26, 9, '#5ee7df', 5], [36, 31, 13, '#ffc46b', 6], [60, 28, 9, '#fff3d6', 7], [84, 34, 13, '#ff8fab', 8],
  [8, 46, 12, '#fff3d6', 9], [30, 52, 9, '#ff8fab', 10], [52, 47, 14, '#5ee7df', 11], [76, 55, 10, '#ffc46b', 12], [93, 48, 8, '#fff3d6', 13],
  [18, 66, 13, '#ffc46b', 14], [44, 70, 9, '#5ee7df', 15], [70, 74, 12, '#fff3d6', 16], [90, 68, 9, '#ff8fab', 17],
];
function Sparkle({ x, y, s, c, i }: { x: number; y: number; s: number; c: string; i: number }) {
  const v = useLoop(0.5, 1, 1300 + (i % 5) * 350, i * 260);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: (x + '%') as any, top: (y + '%') as any, width: s, height: s, opacity: v.interpolate({ inputRange: [0.5, 1], outputRange: [0.15, 1] }), transform: [{ scale: v }, { rotate: v.interpolate({ inputRange: [0.5, 1], outputRange: ['0deg', '18deg'] }) }] }}>
      <Svg width={s} height={s} viewBox="-10 -10 20 20">
        <Circle r={9} fill={c} opacity={0.12} />
        <Path d="M0-10C.8-3 3-.8 10 0 3 .8.8 3 0 10-.8 3-3 .8-10 0-3-.8-.8-3 0-10z" fill={c} />
      </Svg>
    </Animated.View>
  );
}

// Small rocks that drift slowly across the sky while turning, each with a faint tail. Three depths: far = small and dim.
const ROCKS = ['M2 -6 7 -3 6 3 1 6 -5 4 -7 -2z', 'M0 -9 8 -5 9 2 3 8 -6 6 -9 -1z', 'M-1 -12 9 -7 12 3 4 11 -8 9 -12 0z'];
const ASTEROIDS: [number, number, number, number][] = [[60, 0, 0.1, 36000], [160, 1, 0.55, 28000], [260, 2, 0.3, 22000], [360, 0, 0.8, 38000], [470, 1, 0.2, 30000], [120, 2, 0.75, 24000], [560, 0, 0.45, 34000]];
function Asteroid({ y0, kind, phase, dur, i }: { y0: number; kind: number; phase: number; dur: number; i: number }) {
  const { width: W } = useWindowDimensions();
  const v = useRef(new Animated.Value(phase)).current;
  const r = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const m = Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: dur * (1 - phase), easing: Easing.linear, useNativeDriver: true }),
      Animated.loop(Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.linear, useNativeDriver: true })),
    ]);
    const spin = Animated.loop(Animated.timing(r, { toValue: 1, duration: 14000 + i * 3500, easing: Easing.linear, useNativeDriver: true }));
    m.start(); spin.start();
    return () => { m.stop(); spin.stop(); };
  }, []);
  const sz = [9, 13, 18][kind], o = [0.4, 0.6, 0.8][kind], tl = [20, 24, 30][kind];
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, opacity: v.interpolate({ inputRange: [0, 0.08, 0.92, 1], outputRange: [0, o, o, 0] }), transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-40, W + 40] }) }, { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [y0, y0 + (W + 80) * 0.42] }) }] }}>
      <View style={{ position: 'absolute', right: sz / 2, top: sz / 2 - 1, width: tl, height: 2, transformOrigin: 'right center', transform: [{ rotate: '-23deg' }] }}>
        <LinearGradient colors={['rgba(160,200,255,0)', 'rgba(160,200,255,.4)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 2 }} />
      </View>
      <Animated.View style={{ width: sz, height: sz, transform: [{ rotate: r.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
        <Svg width={sz} height={sz} viewBox="-14 -14 28 28">
          <Path d={ROCKS[kind]} fill="#8b9cc6" stroke="rgba(255,255,255,.4)" strokeWidth={0.7} strokeLinejoin="round" />
          <Path d={ROCKS[kind]} fill="rgba(15,22,52,.38)" transform="translate(2.4 2.4) scale(.62)" />
          <Circle cx={-2} cy={-1} r={1.5} fill="rgba(20,28,60,.5)" />
          <Circle cx={3} cy={3} r={1} fill="rgba(20,28,60,.45)" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
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

// The sky is drawn in two steps so opening a screen stays smooth: the colours and glows at once, then the moving parts (stars, sparkles,
// asteroids, lights, houses) once the screen has finished sliding in. A screen that is covered by another one stops drawing them.
// Fades its children in slowly, so the asteroids drift into view instead of popping up.
function FadeIn({ children }: { children: React.ReactNode }) {
  const o = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = Animated.timing(o, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }); a.start(); return () => a.stop(); }, []);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: o }}>{children}</Animated.View>;
}
function Moving() {
  const o = useRef(new Animated.Value(0)).current;
  // The moving parts are added in small steps, a few at a time, so no single frame has to build the whole sky.
  const [st, setSt] = useState(0);
  useEffect(() => {
    let n = 0; let t: any;
    const next = () => { n += 1; setSt(n); if (n < 6) t = setTimeout(next, 200); };
    t = setTimeout(next, 120);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => { const a = Animated.timing(o, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }); a.start(); return () => a.stop(); }, []);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: o }}>
      {st >= 1 ? STARS.map((t, i) => <Star key={i} x={t[0]} y={t[1]} s={t[2]} i={i} />) : null}
      {st >= 2 ? SPARK.slice(0, 9).map((t, i) => <Sparkle key={i} x={t[0]} y={t[1]} s={t[2]} c={t[3]} i={t[4]} />) : null}
      {st >= 3 ? SPARK.slice(9).map((t, i) => <Sparkle key={i + 9} x={t[0]} y={t[1]} s={t[2]} c={t[3]} i={t[4]} />) : null}
      {st >= 4 ? <>
        <Mote left="14%" delay={0} dur={7000} size={4} color="#ff8fab" />
        <Mote left="36%" delay={2200} dur={8500} size={3} color="#ffc46b" />
        <Mote left="58%" delay={900} dur={7500} size={4} color="#5ee7df" />
        <Mote left="78%" delay={3600} dur={8000} size={3} color="#ff8fab" />
        <Mote left="90%" delay={1800} dur={6500} size={3} color="#ffc46b" />
        <Lights />
      </> : null}
      {st >= 5 ? <Houses /> : null}
      {st >= 6 ? <FadeIn>
        {ASTEROIDS.map((a, i) => <Asteroid key={i} y0={a[0]} kind={a[1]} phase={a[2]} dur={a[3]} i={i} />)}
        <Shoot left="6%" top="14%" delay={1500} gap={4500} />
        <Shoot left="42%" top="22%" delay={5200} gap={6200} />
        <Shoot left="-4%" top="40%" delay={9000} gap={7000} />
      </FadeIn> : null}
    </Animated.View>
  );
}
// Memoised: the sky has no props, so refreshes of the screen's own data (every few seconds) never redraw it.
export const FamilyBg = React.memo(function FamilyBg() {
  const [on, setOn] = useState(false);
  const off = useRef<any>(null);
  useFocusEffect(useCallback(() => {
    clearTimeout(off.current);
    // Only after the slide-in has finished, so the sky never competes with the screen opening.
    const t = setTimeout(() => setOn(true), 600);
    return () => { clearTimeout(t); off.current = setTimeout(() => setOn(false), 900); };
  }, []));
  useEffect(() => () => clearTimeout(off.current), []);
  return (
    <>
      <LinearGradient colors={['#0a0f2c', '#0f1f3d', '#0c3a3f']} locations={[0, 0.5, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(255,143,171,.4)" style={{ left: -90, top: -50 }} />
      <Blob size={340} color="rgba(94,231,223,.3)" style={{ right: -120, top: 300 }} />
      <Blob size={280} color="rgba(255,196,107,.26)" style={{ left: -50, bottom: 60 }} />
      {on ? <Moving /> : null}
    </>
  );
});

function Bird({ size, delay, y, w }: { size: number; delay: number; y: number; w: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: size * 0.8 * y, opacity: v.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [size * 0.05, size * 0.95] }) }, { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [size * 0.2, -size * 0.05] }) }] }}>
      <Svg width={w} height={w * 0.5} viewBox="0 0 16 8"><Path d="M0 6q4-6 8 0q4-6 8 0" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" /></Svg>
    </Animated.View>
  );
}

// House icon of the Family Planner header: the same lit house, with two birds flying slowly past the roof.
export function HouseHeart({ size = 78 }: { size?: number }) {
  return (
    <View pointerEvents="none" style={{ width: size, height: size * 0.8 }}>
      <Svg width={size} height={size * 0.8} viewBox="0 0 150 120">
        <Path d="M20 62 75 18l55 44" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M34 56v46h82V56" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.32)" strokeWidth={3} strokeLinejoin="round" />
        <Rect x={46} y={68} width={10} height={12} rx={2} fill="#ffc46b" opacity={0.85} />
        <Rect x={94} y={68} width={10} height={12} rx={2} fill="#ffc46b" opacity={0.85} />
        <Rect x={68} y={80} width={14} height={22} rx={3} fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.25)" strokeWidth={2} />
      </Svg>
      <Bird size={size} delay={0} y={0.05} w={size * 0.14} />
      <Bird size={size} delay={2600} y={0.18} w={size * 0.11} />
    </View>
  );
}
