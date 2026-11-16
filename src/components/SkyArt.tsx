import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Path, Rect, Polygon, ClipPath, LinearGradient as SvgLG } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Period } from '../lib/theme';

function loop(v: Animated.Value, duration: number, from = 0, to = 1, easing = Easing.linear, yoyo = false) {
  const seq = yoyo
    ? Animated.sequence([Animated.timing(v, { toValue: to, duration: duration / 2, easing, useNativeDriver: true }), Animated.timing(v, { toValue: from, duration: duration / 2, easing, useNativeDriver: true })])
    : Animated.sequence([Animated.timing(v, { toValue: to, duration, easing, useNativeDriver: true }), Animated.timing(v, { toValue: from, duration: 0, useNativeDriver: true })]);
  return Animated.loop(seq);
}


// Native SVG blends toward "transparent black" and leaves a dark ring, so keep one hue and fade only the opacity.
function fixStops(stops: [number, string][]): [number, string, number][] {
  const parsed = stops.map(([o, c]) => {
    const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
    return m ? { o, rgb: `rgb(${m[1]},${m[2]},${m[3]})`, a: m[4] === undefined ? 1 : parseFloat(m[4]) } : { o, rgb: c, a: 1 };
  });
  return parsed.map((p, i) => {
    if (p.a === 0) {
      let j = i - 1; while (j >= 0 && parsed[j].a === 0) j--;
      return [p.o, j >= 0 ? parsed[j].rgb : p.rgb, 0] as [number, string, number];
    }
    return [p.o, p.rgb, p.a] as [number, string, number];
  });
}

export function Glow({ size, stops, style }: { size: number; stops: [number, string][]; style?: any }) {
  const id = 'g' + Math.abs(Math.round(size * 7 + stops.length * 13 + (style?.right ?? 0)));
  return (
    <View style={[{ position: 'absolute', width: size, height: size }, style]} pointerEvents="none">
      <Svg width={size} height={size}>
        <Defs><RadialGradient id={id} cx="50%" cy="50%" r="50%">{fixStops(stops).map(([o, c, a], i) => <Stop key={i} offset={o} stopColor={c} stopOpacity={a} />)}</RadialGradient></Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

function Pulse({ children, style }: { children: React.ReactNode; style?: any }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = loop(v, 6000, 0, 1, Easing.inOut(Easing.ease), true); a.start(); return () => a.stop(); }, [v]);
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute' }, style, { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] }]}>{children}</Animated.View>;
}

function Cloud({ top, w, h, opacity, dur, delay, color = '#fff' }: { top: number; w: number; h: number; opacity: number; dur: number; delay: number; color?: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(delay);
    const a = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: dur * (1 - delay), easing: Easing.linear, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true })]));
    a.start(); return () => a.stop();
  }, [v, dur, delay]);
  const s = w / 80;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top, left: 0, opacity, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-170, 560] }) }] }}>
      <View style={{ width: w, height: h, borderRadius: 999, backgroundColor: color }} />
      <View style={{ position: 'absolute', left: 26 * s - 4, top: -14 * s - 4, width: w * 0.55 + 8, height: h + 8, borderRadius: 999, backgroundColor: color }} />
      <View style={{ position: 'absolute', left: 54 * s, top: -4 * s, width: w * 0.4, height: h, borderRadius: 999, backgroundColor: color }} />
    </Animated.View>
  );
}

function Disc({ size, right, top, colors, glow }: { size: number; right: number; top: number; colors: [string, string, string]; glow: string }) {
  const id = 'd' + size;
  return (
    <>
      <Glow size={size * 2.4} style={{ right: right - size * 0.7, top: top - size * 0.7 }} stops={[[0, glow], [1, 'rgba(0,0,0,0)']]} />
      <View style={{ position: 'absolute', right, top, width: size, height: size }} pointerEvents="none">
        <Svg width={size} height={size}>
          <Defs><RadialGradient id={id} cx="35%" cy="35%" r="70%"><Stop offset="0" stopColor={colors[0]} /><Stop offset="0.6" stopColor={colors[1]} /><Stop offset="1" stopColor={colors[2]} /></RadialGradient></Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
        </Svg>
      </View>
    </>
  );
}

// Slowly turning sun rays (same wedges as the design)
function Rays({ right, top, n, half, color, opacity }: { right: number; top: number; n: number; half: number; color: string; opacity: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = Animated.loop(Animated.timing(v, { toValue: 1, duration: 80000, easing: Easing.linear, useNativeDriver: true })); a.start(); return () => a.stop(); }, [v]);
  const polys = Array.from({ length: n }, (_, i) => {
    const c = (i * 2 * Math.PI) / n, h = (half * Math.PI) / 180;
    const pt = (t: number) => `${(150 * Math.cos(t)).toFixed(1)},${(150 * Math.sin(t)).toFixed(1)}`;
    return `0,0 ${pt(c - h)} ${pt(c + h)}`;
  });
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', right, top, width: 300, height: 300, transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
      <Svg width={300} height={300} viewBox="-150 -150 300 300">{polys.map((pts, i) => <Polygon key={i} points={pts} fill={color} opacity={opacity} />)}</Svg>
    </Animated.View>
  );
}

function Flare({ right, top, size, delay }: { right: number; top: number; size: number; delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { v.setValue(0); const a = Animated.sequence([Animated.delay(delay), Animated.loop(loop(v, 4000, 0, 1, Easing.inOut(Easing.ease), true))]); a.start(); return () => a.stop(); }, [v, delay]);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', right, top, width: size, height: size, borderRadius: size / 2, backgroundColor: 'rgba(255,236,170,.5)', opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.7] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }) }] }} />;
}

function Stars() {
  const pts = useRef(Array.from({ length: 26 }, (_, i) => ({ x: (i * 97 + 36) % 470, y: (i * 53 + 28) % 250, r: 1.1 + ((i * 7) % 8) / 10, d: (i % 6) * 0.4 }))).current;
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = loop(v, 2400, 0, 1, Easing.inOut(Easing.ease), true); a.start(); return () => a.stop(); }, [v]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }}>
      <Svg width={480} height={260}>{pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#fff" />)}</Svg>
    </Animated.View>
  );
}

function Moon() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = loop(v, 10000, 0, 1, Easing.inOut(Easing.ease), true); a.start(); return () => a.stop(); }, [v]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', right: -44, top: -52, width: 190, height: 190, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }}>
      <Glow size={330} stops={[[0, 'rgba(255,238,200,.38)'], [0.42, 'rgba(190,200,255,.14)'], [0.7, 'rgba(0,0,0,0)']]} style={{ left: -70, top: -70 }} />
      <Svg width={190} height={190} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="mdisc" cx="0.38" cy="0.34" r="0.78"><Stop offset="0" stopColor="#fffdf3" /><Stop offset="0.55" stopColor="#f6e9c8" /><Stop offset="1" stopColor="#d9c697" /></RadialGradient>
          <SvgLG id="mshade" x1="0" y1="0.3" x2="1" y2="0.7"><Stop offset="0" stopColor="#0b1040" stopOpacity="0.72" /><Stop offset="0.45" stopColor="#0b1040" stopOpacity="0.3" /><Stop offset="0.8" stopColor="#0b1040" stopOpacity="0" /></SvgLG>
          <ClipPath id="mclip"><Circle cx="50" cy="50" r="42" /></ClipPath>
        </Defs>
        <Circle cx="50" cy="50" r="42" fill="url(#mdisc)" />
        <Circle cx="34" cy="40" r="6" fill="#cdb67c" fillOpacity="0.28" /><Circle cx="52" cy="62" r="8.500" fill="#cdb67c" fillOpacity="0.22" /><Circle cx="66" cy="38" r="4" fill="#cdb67c" fillOpacity="0.26" /><Circle cx="40" cy="70" r="3.200" fill="#cdb67c" fillOpacity="0.24" /><Circle cx="72" cy="58" r="2.600" fill="#cdb67c" fillOpacity="0.24" />
        <Rect x="8" y="8" width="84" height="84" fill="url(#mshade)" clipPath="url(#mclip)" />
        <Circle cx="50" cy="50" r="42" fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="0.8" />
      </Svg>
    </Animated.View>
  );
}

function Aurora() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = loop(v, 12000, 0, 1, Easing.inOut(Easing.ease), true); a.start(); return () => a.stop(); }, [v]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -40, right: -40, top: 20, height: 170, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }), transform: [{ rotate: '-7deg' }] }}>
      <LinearGradient colors={['rgba(94,231,223,0)', 'rgba(94,231,223,.2)', 'rgba(150,110,255,.2)', 'rgba(150,110,255,0)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ flex: 1 }} />
    </Animated.View>
  );
}

function Sparkle({ x, y, size, delay, dur }: { x: number; y: number; size: number; delay: number; dur: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { v.setValue(0); const a = Animated.sequence([Animated.delay(delay), Animated.loop(loop(v, dur, 0, 1, Easing.inOut(Easing.ease), true))]); a.start(); return () => a.stop(); }, [v, delay, dur]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: x, top: y, width: size, height: size, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.15] }) }] }}>
      <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 0c.9 6.200 3.600 10.100 12 12-8.400 1.900-11.100 5.800-12 12-.9-6.200-3.600-10.100-12-12 8.400-1.900 11.100-5.800 12-12z" fill="#fff" /></Svg>
    </Animated.View>
  );
}

function Constellation() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = loop(v, 5200, 0, 1, Easing.inOut(Easing.ease), true); a.start(); return () => a.stop(); }, [v]);
  const P = [[8, 30], [34, 12], [62, 26], [88, 8], [112, 30]];
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 120, top: 6, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.95] }) }}>
      <Svg width={124} height={44}>
        <Path d={'M' + P.map((p) => p.join(' ')).join('L')} stroke="#cfe0ff" strokeOpacity="0.35" strokeWidth="0.8" fill="none" strokeDasharray="2 3" />
        {P.map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} r={i === 2 ? 2.2 : 1.5} fill="#fff" />)}
      </Svg>
    </Animated.View>
  );
}

function Firefly({ x, y, dx, dy, delay, dur, color }: { x: number; y: number; dx: number; dy: number; delay: number; dur: number; color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { v.setValue(0); const a = Animated.sequence([Animated.delay(delay), Animated.loop(loop(v, dur, 0, 1, Easing.inOut(Easing.sin), true))]); a.start(); return () => a.stop(); }, [v, delay, dur]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: x, top: y, width: 14, height: 14, opacity: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 1, 0.2] }), transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) }, { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) }] }}>
      <Svg width={14} height={14}><Defs><RadialGradient id={'ff' + color.slice(1)} cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor={color} stopOpacity="1" /><Stop offset="0.35" stopColor={color} stopOpacity="0.55" /><Stop offset="1" stopColor={color} stopOpacity="0" /></RadialGradient></Defs><Circle cx={7} cy={7} r={7} fill={'url(#ff' + color.slice(1) + ')'} /></Svg>
    </Animated.View>
  );
}

function Shoot({ right = 20, top = 40, dur = 6500, delay = 0, w = 110 }: { right?: number; top?: number; dur?: number; delay?: number; w?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { v.setValue(0); const a = Animated.sequence([Animated.delay(delay), loop(v, dur, 0, 1, Easing.in(Easing.ease))]); a.start(); return () => a.stop(); }, [v, dur, delay]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', right, top, width: w, height: 2.5, opacity: v.interpolate({ inputRange: [0, 0.04, 0.16, 1], outputRange: [0, 1, 0, 0] }), transform: [{ rotate: '28deg' }, { translateX: v.interpolate({ inputRange: [0, 0.16, 1], outputRange: [0, -170, -170] }) }, { translateY: v.interpolate({ inputRange: [0, 0.16, 1], outputRange: [0, 95, 95] }) }] }}>
      <Svg width={w} height={2.5}><Defs><SvgLG id="sh" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#fff" stopOpacity="0" /><Stop offset="1" stopColor="#fff" stopOpacity="1" /></SvgLG></Defs><Rect width={w} height={2.5} rx={1.2} fill="url(#sh)" /></Svg>
    </Animated.View>
  );
}

export function SkyArt({ period, offset = 0 }: { period: Period; offset?: number }) {
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 340 + offset, overflow: 'hidden' }} pointerEvents="none">
     <View style={{ position: 'absolute', left: 0, right: 0, top: offset, height: 340 }}>
      {period === 'Morning' && (<>
        <Pulse style={{ right: -75, top: 21 }}><Glow size={330} stops={[[0, 'rgba(255,238,185,.95)'], [0.38, 'rgba(255,190,120,.45)'], [0.7, 'rgba(0,0,0,0)']]} style={{ position: 'relative' }} /></Pulse>
        <Rays right={-60} top={36} n={16} half={5.6} color="#fff3c9" opacity={0.3} />
        <Disc size={72} right={54} top={150} colors={['#fffbe6', '#ffd98a', '#ffb35c']} glow="rgba(255,210,130,.7)" />
        <Cloud top={98} w={80} h={26} opacity={0.6} dur={42000} delay={0.14} />
        <Cloud top={150} w={64} h={20} opacity={0.5} dur={55000} delay={0.44} />
        <Cloud top={60} w={48} h={15} opacity={0.4} dur={48000} delay={0.62} />
      </>)}
      {period === 'Afternoon' && (<>
        <Pulse style={{ right: -38, top: -32 }}><Glow size={320} stops={[[0, 'rgba(255,252,220,.95)'], [0.38, 'rgba(255,225,140,.45)'], [0.7, 'rgba(0,0,0,0)']]} style={{ position: 'relative' }} /></Pulse>
        <Rays right={-28} top={-22} n={18} half={5} color="#fffbe0" opacity={0.28} />
        <Disc size={60} right={92} top={98} colors={['#ffffff', '#fff0a8', '#ffd04d']} glow="rgba(255,236,150,.75)" />
        <Cloud top={88} w={88} h={28} opacity={0.6} dur={36000} delay={0.1} />
        <Cloud top={160} w={72} h={23} opacity={0.55} dur={52000} delay={0.38} />
        <Cloud top={44} w={56} h={18} opacity={0.4} dur={60000} delay={0.55} />
        <Flare right={162} top={166} size={18} delay={0} />
        <Flare right={190} top={196} size={30} delay={700} />
        <Flare right={256} top={224} size={14} delay={1400} />
        <Flare right={298} top={248} size={22} delay={2100} />
      </>)}
      {period === 'Evening' && (<>
        <Pulse style={{ right: -90, top: 0 }}><Glow size={360} stops={[[0, 'rgba(255,170,110,.9)'], [0.38, 'rgba(255,90,120,.4)'], [0.7, 'rgba(0,0,0,0)']]} style={{ position: 'relative' }} /></Pulse>
        <Disc size={72} right={54} top={146} colors={['#fff0c8', '#ffb06b', '#ff6a5a']} glow="rgba(255,120,90,.65)" />
        <LinearGradient colors={['rgba(255,130,100,0)', 'rgba(255,110,100,.45)', 'rgba(255,110,100,0)']} locations={[0, 0.5, 1]} style={{ position: 'absolute', left: 0, right: 0, top: 176, height: 120 }} />
        <Cloud top={92} w={88} h={28} opacity={0.6} dur={44000} delay={0.18} color="#ffc2d1" />
        <Cloud top={146} w={68} h={22} opacity={0.5} dur={58000} delay={0.45} color="#ffd2bd" />
        <Cloud top={52} w={56} h={18} opacity={0.4} dur={66000} delay={0.52} color="#ffb3c8" />
      </>)}
      {period === 'Night' && (<>
        <Aurora />
        <Stars />
        <Moon />
        <Sparkle x={26} y={62} size={13} delay={0} dur={2600} />
        <Sparkle x={150} y={26} size={10} delay={600} dur={3200} />
        <Sparkle x={74} y={152} size={9} delay={1800} dur={3400} />
        <Sparkle x={236} y={150} size={11} delay={1100} dur={3000} />
        <Shoot right={40} top={150} dur={7500} delay={1200} w={100} />
      </>)}
     </View>
    </View>
  );
}
