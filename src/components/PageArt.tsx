import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, AccessibilityInfo } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Path, Rect, Line, Defs, RadialGradient, Stop } from 'react-native-svg';

// A full-screen decorative layer behind a feature page (Relax, Medicine, Cycle). It sits over the usual page gradient and under the content.
const FILL = { position: 'absolute' as const, left: 0, top: 0, right: 0, bottom: 0 };
const Vb = ({ children }: { children: React.ReactNode }) => <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">{children}</Svg>;
const dots = (pts: number[][], c: string, o = 0.4) => pts.map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} r={p[2] || 1.8} fill={c} fillOpacity={o} />);
const pill = (x: number, y: number, rot: number, w: number, c: string, o: number) => (
  <G key={x + '-' + y} rotation={rot} origin={x + ', ' + y}>
    <Rect x={x - w / 2} y={y - w / 4} width={w} height={w / 2} rx={w / 4} fill="#fff" fillOpacity={o * 0.35} stroke={c} strokeOpacity={o} strokeWidth="1.4" />
    <Path d={'M' + x + ' ' + (y - w / 4) + 'v' + w / 2} stroke={c} strokeOpacity={o} strokeWidth="1.3" />
  </G>
);

export function PageArt({ kind }: { kind: 'med' | 'relax' | 'cycle' }) {
  const [reduce, setReduce] = useState(false); const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { try { AccessibilityInfo.isReduceMotionEnabled().then(setReduce); } catch (e) {} }, []);
  useEffect(() => {
    if (reduce) { a.setValue(0); return; }
    const l = Animated.loop(Animated.sequence([Animated.timing(a, { toValue: 1, duration: 5200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(a, { toValue: 0, duration: 5200, easing: Easing.inOut(Easing.sin), useNativeDriver: true })]));
    l.start(); return () => l.stop();
  }, [reduce]);
  const wash: [string, string] = kind === 'med' ? ['rgba(94,231,223,0)', 'rgba(94,231,223,.16)'] : kind === 'relax' ? ['rgba(124,156,255,0)', 'rgba(124,156,255,.2)'] : ['rgba(255,143,171,0)', 'rgba(255,143,171,.2)'];
  const drift = { transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) }] };
  return (
    <View pointerEvents="none" style={FILL}>
      <LinearGradient colors={wash} start={{ x: 0.5, y: 0.1 }} end={{ x: 0.5, y: 1 }} style={FILL} />
      {kind === 'relax' ? (
        <>
          <Animated.View style={[FILL, drift]}>
            <Vb>
              <Defs><RadialGradient id="rg" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#8fe9e2" stopOpacity=".22" /><Stop offset="1" stopColor="#8fe9e2" stopOpacity="0" /></RadialGradient></Defs>
              <Circle cx="195" cy="640" r="230" fill="url(#rg)" />
              {[40, 80, 124, 170, 220, 275].map((r, i) => <Circle key={r} cx="195" cy="640" r={r} fill="none" stroke="#8fe9e2" strokeOpacity={0.34 - i * 0.045} strokeWidth="1.4" />)}
              <Circle cx="195" cy="640" r="10" fill="#8fe9e2" fillOpacity=".5" />
            </Vb>
          </Animated.View>
          <Vb>
            {[0, 1, 2, 3].map((i) => <Path key={i} d={'M-10 ' + (700 + i * 34) + 'q50-26 100 0t100 0 100 0 100 0 100 0'} fill="none" stroke="#7c9cff" strokeOpacity={0.3 - i * 0.06} strokeWidth="1.5" />)}
            {dots([[40, 120, 2], [330, 90, 2.6], [90, 260, 1.6], [350, 330, 2], [30, 430, 1.8], [300, 480, 1.4], [150, 70, 1.4], [260, 200, 1.8]], '#fff', 0.45)}
            <Path d="M318 150a22 22 0 1 0 22 28a17 17 0 0 1-22-28z" fill="#e8dcff" fillOpacity=".18" stroke="#c9b0ff" strokeOpacity=".35" strokeWidth="1.2" />
          </Vb>
        </>
      ) : null}
      {kind === 'med' ? (
        <Vb>
          <Path d="M-20 520C80 470 140 560 220 520S340 440 420 500" fill="none" stroke="#5ee7df" strokeOpacity=".3" strokeWidth="1.5" strokeDasharray="3 7" />
          {[[40, 500], [120, 528], [220, 520], [300, 476], [372, 486]].map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} r={i === 2 ? 7 : 4.5} fill="#5ee7df" fillOpacity={i === 2 ? 0.55 : 0.3} />)}
          {pill(320, 640, -30, 74, '#5ee7df', 0.45)}{pill(70, 700, 28, 58, '#ffc46b', 0.5)}{pill(250, 760, 12, 50, '#8fe9e2', 0.4)}{pill(352, 560, 40, 44, '#7c9cff', 0.35)}
          <Circle cx="150" cy="620" r="20" fill="#fff" fillOpacity=".06" stroke="#8fe9e2" strokeOpacity=".45" strokeWidth="1.3" /><Path d="M136 634l28-28" stroke="#8fe9e2" strokeOpacity=".45" strokeWidth="1.3" />
          {[[330, 700], [60, 600], [200, 560]].map((p, i) => <G key={i}><Line x1={p[0] - 8} y1={p[1]} x2={p[0] + 8} y2={p[1]} stroke="#5ee7df" strokeOpacity=".4" strokeWidth="2" /><Line x1={p[0]} y1={p[1] - 8} x2={p[0]} y2={p[1] + 8} stroke="#5ee7df" strokeOpacity=".4" strokeWidth="2" /></G>)}
          {dots([[30, 300, 2], [360, 250, 1.6], [100, 360, 1.4], [290, 380, 2], [180, 790, 1.8]], '#fff', 0.4)}
        </Vb>
      ) : null}
      {kind === 'cycle' ? (
        <>
          <Animated.View style={[FILL, drift]}>
            <Vb>
              <Defs><RadialGradient id="cg" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#ff8fab" stopOpacity=".26" /><Stop offset="1" stopColor="#ff8fab" stopOpacity="0" /></RadialGradient></Defs>
              <Circle cx="300" cy="640" r="210" fill="url(#cg)" />
              <Circle cx="300" cy="640" r="150" fill="none" stroke="#ff8fab" strokeOpacity=".3" strokeWidth="1.4" strokeDasharray="2 8" />
              <Circle cx="300" cy="640" r="100" fill="none" stroke="#ff8fab" strokeOpacity=".22" strokeWidth="1.2" />
              <Circle cx="300" cy="640" r="44" fill="#ff8fab" fillOpacity=".3" />
              <Path d="M300 596a44 44 0 0 0 0 88a28 44 0 0 1 0-88z" fill="#fff" fillOpacity=".2" />
            </Vb>
          </Animated.View>
          <Vb>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const ang = (-170 + i * 26) * Math.PI / 180; const x = 300 + 150 * Math.cos(ang), y = 640 + 150 * Math.sin(ang); return <Circle key={i} cx={x} cy={y} r={i === 3 ? 7 : 4} fill="#ff8fab" fillOpacity={0.2 + i * 0.05} />; })}
            {[[60, 560], [90, 700], [24, 450]].map((p, i) => <G key={i}>{[0, 72, 144, 216, 288].map((r) => <G key={r} rotation={r} origin={p[0] + ', ' + p[1]}><Circle cx={p[0]} cy={p[1] - 9} r="6" fill="#ff8fab" fillOpacity=".18" stroke="#ff8fab" strokeOpacity=".4" strokeWidth="1" /></G>)}<Circle cx={p[0]} cy={p[1]} r="3" fill="#ffd593" fillOpacity=".6" /></G>)}
            {dots([[320, 110, 2], [60, 200, 1.8], [350, 300, 1.5], [130, 330, 1.4], [250, 400, 1.8], [30, 780, 1.6]], '#fff', 0.42)}
          </Vb>
        </>
      ) : null}
    </View>
  );
}
