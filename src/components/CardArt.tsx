import React, { useEffect, useState } from 'react';
import { View, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, G, Path, Rect, Line, RadialGradient, Stop } from 'react-native-svg';

// Soft decorative backgrounds that sit behind a card's content. Each one hints at what the card is about.
const FILL = { position: 'absolute' as const, left: 0, top: 0, right: 0, bottom: 0 };
const WASH: Record<string, [string, string]> = {
  med: ['rgba(94,231,223,0)', 'rgba(94,231,223,.2)'],
  relax: ['rgba(124,156,255,0)', 'rgba(124,156,255,.24)'],
  cycle: ['rgba(255,143,171,0)', 'rgba(255,143,171,.22)'],
  intel: ['rgba(183,148,255,0)', 'rgba(183,148,255,.26)'],
};


// The linked points behind My Life Intelligence. The points drift slowly, the links follow them, and small lights travel along the links like thoughts being connected.
const NODES: [number, number, number][] = [[40, 120, 3], [96, 92, 4], [150, 118, 3], [214, 84, 5], [262, 112, 4], [300, 62, 5], [250, 34, 3], [120, 40, 3]];
const LINKS: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [3, 6], [6, 5], [1, 7]];
function IntelNet() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let id: any, last = 0; const t0 = Date.now();
    const tick = () => { const n = Date.now(); if (n - last > 45) { last = n; setT((n - t0) / 1000); } id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);
  const P = NODES.map((n, i) => ({ x: n[0] + Math.sin(t * (0.22 + i * 0.03) + i * 1.7) * 6, y: n[1] + Math.cos(t * (0.18 + i * 0.022) + i * 2.3) * 5, r: n[2], tw: 0.5 + 0.5 * Math.sin(t * 0.8 + i * 0.9) }));
  return (
    <G>
      {LINKS.map((l, i) => <Line key={i} x1={P[l[0]].x} y1={P[l[0]].y} x2={P[l[1]].x} y2={P[l[1]].y} stroke="#b794ff" strokeOpacity=".24" strokeWidth="1.2" />)}
      {P.map((c, i) => <Circle key={i} cx={c.x} cy={c.y} r={c.r + c.tw * 0.9} fill="#d3c1ff" fillOpacity={0.2 + c.tw * 0.22} />)}
      {LINKS.map((l, i) => {
        const ph = ((t * 0.15 + i * 0.37) % 1), a = P[l[0]], b = P[l[1]], o = Math.sin(ph * Math.PI);
        return <Circle key={'p' + i} cx={a.x + (b.x - a.x) * ph} cy={a.y + (b.y - a.y) * ph} r={2.4} fill="#fff" fillOpacity={0.15 + o * 0.6} />;
      })}
    </G>
  );
}

export function CardArt({ kind }: { kind: 'med' | 'relax' | 'cycle' | 'intel' }) {
  const w = WASH[kind];
  return (
    <View pointerEvents="none" style={FILL}>
      <LinearGradient colors={w} start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }} style={FILL} />
      <Svg width="100%" height="100%" viewBox="0 0 320 150" preserveAspectRatio="xMaxYMid slice">
        <Defs>
          <RadialGradient id="g1" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#fff" stopOpacity=".28" /><Stop offset="1" stopColor="#fff" stopOpacity="0" /></RadialGradient>
        </Defs>
        {kind === 'med' ? (
          <G>
            {/* a dose timeline with four stops, and a few capsules and tablets drifting at the right */}
            <Line x1="170" y1="118" x2="310" y2="118" stroke="#5ee7df" strokeOpacity=".35" strokeWidth="1.5" strokeDasharray="3 6" />
            {[180, 220, 262, 300].map((x, i) => <Circle key={x} cx={x} cy="118" r={i === 1 ? 6 : 4} fill="#5ee7df" fillOpacity={i === 1 ? 0.7 : 0.35} />)}
            <G rotation="-28" origin="262, 52"><Rect x="238" y="40" width="48" height="22" rx="11" fill="#fff" fillOpacity=".1" stroke="#5ee7df" strokeOpacity=".5" strokeWidth="1.4" /><Path d="M262 40v22" stroke="#5ee7df" strokeOpacity=".5" strokeWidth="1.4" /></G>
            <G rotation="24" origin="206, 78"><Rect x="188" y="68" width="36" height="16" rx="8" fill="#ffc46b" fillOpacity=".16" stroke="#ffc46b" strokeOpacity=".55" strokeWidth="1.3" /></G>
            <Circle cx="296" cy="84" r="13" fill="#fff" fillOpacity=".08" stroke="#8fe9e2" strokeOpacity=".5" strokeWidth="1.3" /><Path d="M288 92l16-16" stroke="#8fe9e2" strokeOpacity=".5" strokeWidth="1.3" />
            <Circle cx="236" cy="16" r="2.5" fill="#fff" fillOpacity=".4" /><Circle cx="300" cy="22" r="1.8" fill="#fff" fillOpacity=".35" />
          </G>
        ) : null}
        {kind === 'relax' ? (
          <G>
            {/* breathing rings that widen, with a soft glow and a few stars */}
            <Circle cx="268" cy="86" r="62" fill="url(#g1)" />
            {[18, 34, 52, 72].map((r, i) => <Circle key={r} cx="268" cy="86" r={r} fill="none" stroke="#8fe9e2" strokeOpacity={0.55 - i * 0.12} strokeWidth="1.4" />)}
            <Circle cx="268" cy="86" r="7" fill="#8fe9e2" fillOpacity=".6" />
            <Path d="M150 128q20-14 40 0t40 0 40 0 40 0" fill="none" stroke="#7c9cff" strokeOpacity=".35" strokeWidth="1.5" />
            <Path d="M150 140q20-14 40 0t40 0 40 0 40 0" fill="none" stroke="#7c9cff" strokeOpacity=".22" strokeWidth="1.5" />
            {[[200, 22], [236, 40], [160, 46], [300, 20]].map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} r={i % 2 ? 1.6 : 2.4} fill="#fff" fillOpacity=".45" />)}
          </G>
        ) : null}
        {kind === 'cycle' ? (
          <G>
            {/* a gentle orbit with the phases of the moon along it */}
            <Circle cx="262" cy="80" r="56" fill="none" stroke="#ff8fab" strokeOpacity=".28" strokeWidth="1.4" strokeDasharray="2 7" />
            <Circle cx="262" cy="80" r="34" fill="none" stroke="#ff8fab" strokeOpacity=".2" strokeWidth="1.2" />
            <Circle cx="262" cy="80" r="14" fill="#ff8fab" fillOpacity=".5" />
            <Path d="M262 66a14 14 0 0 0 0 28a9 14 0 0 1 0-28z" fill="#fff" fillOpacity=".25" />
            {[0, 1, 2, 3, 4].map((i) => { const a = (-150 + i * 40) * Math.PI / 180; const x = 262 + 56 * Math.cos(a), y = 80 + 56 * Math.sin(a); return <Circle key={i} cx={x} cy={y} r={i === 2 ? 6 : 4} fill="#ff8fab" fillOpacity={0.25 + i * 0.12} />; })}
            <Circle cx="170" cy="30" r="2" fill="#fff" fillOpacity=".4" /><Circle cx="316" cy="132" r="2.2" fill="#fff" fillOpacity=".4" /><Circle cx="214" cy="124" r="1.6" fill="#fff" fillOpacity=".35" />
          </G>
        ) : null}
        {kind === 'intel' ? <IntelNet /> : null}
      </Svg>
    </View>
  );
}

// The brain icon of My Life Intelligence: it breathes slowly, soft rings spread out from it, and one small light circles around it.
export function IntelIcon({ children, size = 48 }: { children: React.ReactNode; size?: number }) {
  const ring1 = React.useRef(new Animated.Value(0)).current, ring2 = React.useRef(new Animated.Value(0)).current;
  const breath = React.useRef(new Animated.Value(0)).current, spin = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const L = (v: Animated.Value, ms: number, delay = 0) => Animated.loop(Animated.sequence([Animated.delay(delay), Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.out(Easing.quad), useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true })]));
    const a = [L(ring1, 3200), L(ring2, 3200, 1600),
      Animated.loop(Animated.sequence([Animated.timing(breath, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(breath, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true })])),
      Animated.loop(Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true }))];
    a.forEach((x) => x.start());
    return () => a.forEach((x) => x.stop());
  }, []);
  const ring = (v: Animated.Value) => ({ position: 'absolute' as const, width: size, height: size, borderRadius: size * 0.34, borderWidth: 1.5, borderColor: '#d3c1ff', opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }] });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View pointerEvents="none" style={ring(ring1)} />
      <Animated.View pointerEvents="none" style={ring(ring2)} />
      <Animated.View style={{ transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) }] }}>{children}</Animated.View>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size + 18, height: size + 18, alignItems: 'center', transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff', opacity: 0.85, shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 4 }} />
      </Animated.View>
    </View>
  );
}
