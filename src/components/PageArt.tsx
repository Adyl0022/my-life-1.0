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
          <Animated.View style={[FILL, { transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, -16] }) }] }]}>
            <Vb>
              {[[60, 700, 9], [330, 640, 6], [120, 790, 5], [290, 770, 11], [210, 560, 4], [36, 560, 5], [360, 520, 4]].map((c, i) => <Circle key={i} cx={c[0]} cy={c[1]} r={c[2]} fill="#8fe9e2" fillOpacity=".08" stroke="#8fe9e2" strokeOpacity=".35" strokeWidth="1.1" />)}
            </Vb>
          </Animated.View>
          <Vb>
            <Defs><RadialGradient id="rg" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#b794ff" stopOpacity=".2" /><Stop offset="1" stopColor="#b794ff" stopOpacity="0" /></RadialGradient></Defs>
            <Circle cx="195" cy="740" r="120" fill="url(#rg)" />
            {/* a lotus: two rings of petals around a small centre */}
            {[-60, -30, 0, 30, 60].map((r) => <G key={'o' + r} rotation={r} origin="195, 770"><Path d="M195 770C171 742 171 700 195 674C219 700 219 742 195 770z" fill="#b794ff" fillOpacity=".08" stroke="#c9b0ff" strokeOpacity=".32" strokeWidth="1.2" /></G>)}
            {[-30, 0, 30].map((r) => <G key={'i' + r} rotation={r} origin="195, 770"><Path d="M195 770C181 750 181 722 195 704C209 722 209 750 195 770z" fill="#8fe9e2" fillOpacity=".1" stroke="#8fe9e2" strokeOpacity=".4" strokeWidth="1.1" /></G>)}
            <Circle cx="195" cy="770" r="5" fill="#ffd593" fillOpacity=".6" />
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
          <Animated.View style={[FILL, { transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }) }] }]}>
            <Vb>
              {[[300, 560, 20], [70, 640, -35], [340, 700, 50], [120, 760, -10], [250, 800, 30], [28, 520, 60], [210, 620, -50]].map((p, i) => (
                <G key={i} rotation={p[2]} origin={p[0] + ', ' + p[1]}>
                  <Path d={'M' + p[0] + ' ' + (p[1] - 12) + 'C' + (p[0] + 9) + ' ' + (p[1] - 4) + ' ' + (p[0] + 9) + ' ' + (p[1] + 5) + ' ' + p[0] + ' ' + (p[1] + 12) + 'C' + (p[0] - 9) + ' ' + (p[1] + 5) + ' ' + (p[0] - 9) + ' ' + (p[1] - 4) + ' ' + p[0] + ' ' + (p[1] - 12) + 'z'} fill="#ff8fab" fillOpacity={0.14 + (i % 3) * 0.05} stroke="#ff8fab" strokeOpacity=".4" strokeWidth="1" />
                </G>
              ))}
            </Vb>
          </Animated.View>
          <Vb>
            {/* a thin vine along the bottom with tiny blossoms */}
            <Path d="M-10 820C60 780 110 830 190 800S320 770 400 810" fill="none" stroke="#ff8fab" strokeOpacity=".3" strokeWidth="1.4" />
            {[[60, 796], [190, 800], [320, 782]].map((p, i) => <G key={i}>{[0, 72, 144, 216, 288].map((r) => <G key={r} rotation={r} origin={p[0] + ', ' + p[1]}><Circle cx={p[0]} cy={p[1] - 8} r="5" fill="#ff8fab" fillOpacity=".2" stroke="#ff8fab" strokeOpacity=".45" strokeWidth="1" /></G>)}<Circle cx={p[0]} cy={p[1]} r="2.6" fill="#ffd593" fillOpacity=".7" /></G>)}
            {dots([[320, 110, 2], [60, 200, 1.8], [350, 300, 1.5], [130, 330, 1.4], [250, 400, 1.8], [30, 700, 1.6]], '#fff', 0.42)}
          </Vb>
        </>
      ) : null}
    </View>
  );
}
