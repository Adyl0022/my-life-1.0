import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, AccessibilityInfo } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Path, Rect, Line, Defs, RadialGradient, Stop } from 'react-native-svg';

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
          {/* the lotus opens and closes like a breath */}
          <Animated.View style={{ position: 'absolute', left: '50%', marginLeft: -130, bottom: 28, width: 260, height: 200, transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }) }], opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) }}>
            <Svg width="100%" height="100%" viewBox="0 0 260 200">
              <Defs><RadialGradient id="rg" cx="50%" cy="60%" r="50%"><Stop offset="0" stopColor="#b794ff" stopOpacity=".3" /><Stop offset="1" stopColor="#b794ff" stopOpacity="0" /></RadialGradient></Defs>
              <Circle cx="130" cy="130" r="120" fill="url(#rg)" />
              {[-60, -30, 0, 30, 60].map((r) => <G key={'o' + r} rotation={r} origin="130, 160"><Path d="M130 160C106 132 106 90 130 64C154 90 154 132 130 160z" fill="#b794ff" fillOpacity=".08" stroke="#c9b0ff" strokeOpacity=".4" strokeWidth="1.2" /></G>)}
              {[-30, 0, 30].map((r) => <G key={'i' + r} rotation={r} origin="130, 160"><Path d="M130 160C116 140 116 112 130 94C144 112 144 140 130 160z" fill="#8fe9e2" fillOpacity=".12" stroke="#8fe9e2" strokeOpacity=".5" strokeWidth="1.1" /></G>)}
              <Circle cx="130" cy="160" r="5" fill="#ffd593" fillOpacity=".7" />
            </Svg>
          </Animated.View>
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
