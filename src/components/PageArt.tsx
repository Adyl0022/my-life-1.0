import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, AccessibilityInfo } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, G, Path, Rect, Line, Defs, RadialGradient, Stop } from 'react-native-svg';

// A full-screen decorative layer behind a feature page (Relax, Medicine, Cycle). It sits over the usual page gradient and under the content.
// Things drift gently. Everything stands still when the phone is set to reduce motion.
const FILL = { position: 'absolute' as const, left: 0, top: 0, right: 0, bottom: 0 };
const Vb = ({ children }: { children: React.ReactNode }) => <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">{children}</Svg>;
const dots = (pts: number[][], c: string, o = 0.4) => pts.map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} r={p[2] || 1.8} fill={c} fillOpacity={o} />);
const px = (x: number) => (x / 390) * 100 + '%'; const py = (y: number) => (y / 844) * 100 + '%';

// A value that goes 0 to 1 and back (yoyo) or 0 to 1 and restarts (loop). Does nothing when motion is reduced.
function useLoop(ms: number, delay: number, yoyo: boolean, reduce: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(yoyo ? 0.5 : 0); return; }
    const ease = Easing.inOut(Easing.sin);
    const l = Animated.loop(yoyo
      ? Animated.sequence([Animated.timing(v, { toValue: 1, duration: ms, easing: ease, delay, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: ms, easing: ease, useNativeDriver: true })])
      : Animated.sequence([Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.linear, delay, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true })]));
    l.start(); return () => l.stop();
  }, [reduce]);
  return v;
}

// A small glowing firefly that wanders and twinkles.
function Firefly({ x, y, ms, delay, reduce }: { x: number; y: number; ms: number; delay: number; reduce: boolean }) {
  const v = useLoop(ms, delay, true, reduce); const t = useLoop(ms * 0.45, delay, true, reduce);
  return (
    <Animated.View style={{ position: 'absolute', left: px(x), top: py(y), width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,224,150,.32)', alignItems: 'center', justifyContent: 'center',
      opacity: reduce ? 0.8 : t.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
      transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-22, 22] }) }, { translateY: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [8, -14, 6] }) }] }}>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#ffe9a8' }} />
    </Animated.View>
  );
}
// A little cloud that drifts sideways.
function Cloud({ x, y, w, ms, dx, reduce }: { x: number; y: number; w: number; ms: number; dx: number; reduce: boolean }) {
  const v = useLoop(ms, 0, true, reduce);
  return (
    <Animated.View style={{ position: 'absolute', left: px(x), top: py(y), width: w, height: w * 0.57, opacity: 0.9, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) }] }}>
      <Svg width={w} height={w * 0.57} viewBox="0 -12 100 57"><Path d="M20 38a14 14 0 0 1 2-28a20 20 0 0 1 38-4a16 16 0 0 1 24 12a13 13 0 0 1-4 20z" fill="#fff" fillOpacity=".07" stroke="#c9b0ff" strokeOpacity=".4" strokeWidth="1.5" strokeLinejoin="round" /></Svg>
    </Animated.View>
  );
}
// A feather that floats down slowly.
function Feather({ x, y, s, ms, delay, reduce }: { x: number; y: number; s: number; ms: number; delay: number; reduce: boolean }) {
  const v = useLoop(ms, delay, false, reduce);
  return (
    <Animated.View style={{ position: 'absolute', left: px(x), top: py(y), width: s, height: s * 2.4,
      opacity: reduce ? 0.7 : v.interpolate({ inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 0.85, 0.6, 0] }),
      transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }) }, { translateX: v.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 20, 0, -20, 0] }) }, { rotate: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-20deg', '25deg', '-15deg'] }) }] }}>
      <Svg width={s} height={s * 2.4} viewBox="0 0 20 48"><Path d="M10 1C20 12 19 34 10 47C1 34 0 12 10 1z" fill="#c9b0ff" fillOpacity=".16" stroke="#c9b0ff" strokeOpacity=".55" strokeWidth="1.1" /><Path d="M10 4V46M10 14l5-4M10 22l6-5M10 30l5-4M10 14l-5-4M10 22l-6-5M10 30l-5-4" stroke="#c9b0ff" strokeOpacity=".4" strokeWidth=".9" fill="none" /></Svg>
    </Animated.View>
  );
}
// A ripple that spreads on the water and fades.
function Ripple({ ms, delay, reduce }: { ms: number; delay: number; reduce: boolean }) {
  const v = useLoop(ms, delay, false, reduce);
  return (
    <Animated.View style={{ position: 'absolute', left: '50%', marginLeft: -120, bottom: 4, width: 240, height: 56, opacity: reduce ? 0.3 : v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.7, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1.25] }) }] }}>
      <Svg width="100%" height="100%" viewBox="0 0 240 56"><Ellipse cx="120" cy="28" rx="116" ry="24" fill="none" stroke="#8fe9e2" strokeOpacity=".7" strokeWidth="1.4" /></Svg>
    </Animated.View>
  );
}
// A bubble that rises and fades.
function Bubble({ x, y, r, ms, delay, reduce }: { x: number; y: number; r: number; ms: number; delay: number; reduce: boolean }) {
  const v = useLoop(ms, delay, false, reduce);
  return (
    <Animated.View style={{ position: 'absolute', left: px(x), top: py(y), width: r * 2, height: r * 2, borderRadius: r, borderWidth: 1.1, borderColor: 'rgba(143,233,226,.5)', backgroundColor: 'rgba(143,233,226,.08)',
      opacity: reduce ? 0.6 : v.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 0.8, 0.6, 0] }), transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -130] }) }, { translateX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 9, -4] }) }] }} />
  );
}
// A petal that falls, sways and turns.
function Petal({ x, y, s, ms, delay, reduce }: { x: number; y: number; s: number; ms: number; delay: number; reduce: boolean }) {
  const v = useLoop(ms, delay, false, reduce);
  return (
    <Animated.View style={{ position: 'absolute', left: px(x), top: py(y), width: s, height: s * 1.6,
      opacity: reduce ? 0.7 : v.interpolate({ inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 0.9, 0.7, 0] }),
      transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, 150] }) }, { translateX: v.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 16, 0, -16, 0] }) }, { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '70deg'] }) }] }}>
      <Svg width={s} height={s * 1.6} viewBox="0 0 20 32"><Path d="M10 1C19 10 19 22 10 31C1 22 1 10 10 1z" fill="#ff8fab" fillOpacity=".25" stroke="#ff8fab" strokeOpacity=".55" strokeWidth="1.2" /></Svg>
    </Animated.View>
  );
}
// A pill that bobs and tilts.
function Pill({ x, y, w, c, ms, delay, tilt, reduce }: { x: number; y: number; w: number; c: string; ms: number; delay: number; tilt: number; reduce: boolean }) {
  const v = useLoop(ms, delay, true, reduce); const h = w / 2;
  return (
    <Animated.View style={{ position: 'absolute', left: px(x), top: py(y), width: w, height: h, opacity: 0.85,
      transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] }) }, { rotate: v.interpolate({ inputRange: [0, 1], outputRange: [tilt - 9 + 'deg', tilt + 9 + 'deg'] }) }] }}>
      <Svg width={w} height={h} viewBox="0 0 100 50"><Rect x="2" y="2" width="96" height="46" rx="23" fill="#fff" fillOpacity=".1" stroke={c} strokeOpacity=".6" strokeWidth="3" /><Path d="M50 2v46" stroke={c} strokeOpacity=".6" strokeWidth="3" /></Svg>
    </Animated.View>
  );
}

export function PageArt({ kind }: { kind: 'med' | 'relax' | 'cycle' }) {
  const [reduce, setReduce] = useState(false);
  useEffect(() => { try { AccessibilityInfo.isReduceMotionEnabled().then(setReduce); } catch (e) {} }, []);
  const breathe = useLoop(4200, 0, true, reduce); const twinkle = useLoop(2600, 0, true, reduce);
  const wash: [string, string] = kind === 'med' ? ['rgba(94,231,223,0)', 'rgba(94,231,223,.16)'] : kind === 'relax' ? ['rgba(124,156,255,0)', 'rgba(124,156,255,.2)'] : ['rgba(255,143,171,0)', 'rgba(255,143,171,.2)'];
  return (
    <View pointerEvents="none" style={FILL}>
      <LinearGradient colors={wash} start={{ x: 0.5, y: 0.1 }} end={{ x: 0.5, y: 1 }} style={FILL} />
      {kind === 'relax' ? (
        <>
          <Cloud x={20} y={690} w={96} ms={9000} dx={30} reduce={reduce} /><Cloud x={250} y={760} w={70} ms={11000} dx={-26} reduce={reduce} />
          <Firefly x={80} y={600} ms={5200} delay={0} reduce={reduce} /><Firefly x={300} y={560} ms={6100} delay={900} reduce={reduce} /><Firefly x={200} y={650} ms={4800} delay={1700} reduce={reduce} />
          <Firefly x={340} y={730} ms={5600} delay={400} reduce={reduce} /><Firefly x={50} y={760} ms={6400} delay={2300} reduce={reduce} /><Firefly x={150} y={790} ms={5000} delay={1200} reduce={reduce} />
          <Firefly x={270} y={690} ms={7000} delay={2800} reduce={reduce} /><Firefly x={120} y={530} ms={5800} delay={3200} reduce={reduce} />
          <Feather x={300} y={470} s={13} ms={13000} delay={0} reduce={reduce} /><Feather x={70} y={500} s={11} ms={15000} delay={6000} reduce={reduce} />
          <Bubble x={60} y={760} r={9} ms={7000} delay={0} reduce={reduce} /><Bubble x={330} y={720} r={6} ms={6000} delay={1500} reduce={reduce} />
          <Bubble x={120} y={800} r={5} ms={5500} delay={800} reduce={reduce} /><Bubble x={290} y={800} r={11} ms={8000} delay={2600} reduce={reduce} />
          <Bubble x={200} y={700} r={4} ms={6500} delay={3400} reduce={reduce} /><Bubble x={30} y={680} r={5} ms={7500} delay={4200} reduce={reduce} />
          <Animated.View style={[FILL, { opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }]}>
            <Vb>
              {dots([[40, 120, 2], [330, 90, 2.6], [90, 260, 1.6], [350, 330, 2], [30, 430, 1.8], [300, 480, 1.4], [150, 70, 1.4], [260, 200, 1.8]], '#fff', 0.55)}
              <Path d="M318 150a22 22 0 1 0 22 28a17 17 0 0 1-22-28z" fill="#e8dcff" fillOpacity=".18" stroke="#c9b0ff" strokeOpacity=".35" strokeWidth="1.2" />
            </Vb>
          </Animated.View>
        </>
      ) : null}
      {kind === 'med' ? (
        <>
          <Vb>
            <Path d="M-20 520C80 470 140 560 220 520S340 440 420 500" fill="none" stroke="#5ee7df" strokeOpacity=".3" strokeWidth="1.5" strokeDasharray="3 7" />
            {[[40, 500], [120, 528], [220, 520], [300, 476], [372, 486]].map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} r={i === 2 ? 7 : 4.5} fill="#5ee7df" fillOpacity={i === 2 ? 0.55 : 0.3} />)}
            {[[330, 700], [60, 600], [200, 560]].map((p, i) => <G key={i}><Line x1={p[0] - 8} y1={p[1]} x2={p[0] + 8} y2={p[1]} stroke="#5ee7df" strokeOpacity=".4" strokeWidth="2" /><Line x1={p[0]} y1={p[1] - 8} x2={p[0]} y2={p[1] + 8} stroke="#5ee7df" strokeOpacity=".4" strokeWidth="2" /></G>)}
            {dots([[30, 300, 2], [360, 250, 1.6], [100, 360, 1.4], [290, 380, 2], [180, 790, 1.8]], '#fff', 0.4)}
          </Vb>
          <Animated.View style={[FILL, { opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }]}>
            <Vb><Circle cx="296" cy="590" r="6" fill="#5ee7df" fillOpacity=".5" /></Vb>
          </Animated.View>
          <Pill x={285} y={630} w={84} c="#5ee7df" ms={3600} delay={0} tilt={-28} reduce={reduce} />
          <Pill x={30} y={690} w={64} c="#ffc46b" ms={4200} delay={600} tilt={26} reduce={reduce} />
          <Pill x={215} y={745} w={56} c="#8fe9e2" ms={3200} delay={1200} tilt={10} reduce={reduce} />
          <Pill x={330} y={540} w={44} c="#7c9cff" ms={4800} delay={300} tilt={38} reduce={reduce} />
          <Pill x={120} y={790} w={50} c="#ff8fab" ms={3900} delay={900} tilt={-18} reduce={reduce} />
        </>
      ) : null}
      {kind === 'cycle' ? (
        <>
          <Vb>
            <Path d="M-10 820C60 780 110 830 190 800S320 770 400 810" fill="none" stroke="#ff8fab" strokeOpacity=".3" strokeWidth="1.4" />
            {[[60, 796], [190, 800], [320, 782]].map((p, i) => <G key={i}>{[0, 72, 144, 216, 288].map((r) => <G key={r} rotation={r} origin={p[0] + ', ' + p[1]}><Circle cx={p[0]} cy={p[1] - 8} r="5" fill="#ff8fab" fillOpacity=".2" stroke="#ff8fab" strokeOpacity=".45" strokeWidth="1" /></G>)}<Circle cx={p[0]} cy={p[1]} r="2.6" fill="#ffd593" fillOpacity=".7" /></G>)}
          </Vb>
          <Animated.View style={[FILL, { opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }]}>
            <Vb>{dots([[320, 110, 2], [60, 200, 1.8], [350, 300, 1.5], [130, 330, 1.4], [250, 400, 1.8], [30, 700, 1.6]], '#fff', 0.5)}</Vb>
          </Animated.View>
          <Petal x={300} y={540} s={14} ms={9000} delay={0} reduce={reduce} /><Petal x={60} y={560} s={12} ms={11000} delay={2500} reduce={reduce} />
          <Petal x={200} y={520} s={16} ms={10000} delay={5000} reduce={reduce} /><Petal x={340} y={640} s={11} ms={8500} delay={1200} reduce={reduce} />
          <Petal x={110} y={640} s={13} ms={12000} delay={3800} reduce={reduce} /><Petal x={250} y={600} s={10} ms={9500} delay={6800} reduce={reduce} />
        </>
      ) : null}
    </View>
  );
}
