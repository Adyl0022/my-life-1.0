import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing } from 'react-native';
import { Glass } from './Glass';
import { OrbSvg } from './Orb';
import { RichText, FADE } from './RichText';

// Effects for an answer that is still being written. No text cursor: the life is around the text.

// Put brightness marks (0..15) in front of the last words of the text.
function mark(text: string, levels: number[]): string {
  const t = text.replace(/\s+$/, '');
  const w = [...t.matchAll(/\S+/g)];
  const k = Math.min(levels.length, Math.max(0, w.length - 1));
  let r = t;
  for (let j = k - 1; j >= 0; j--) { const m = w[w.length - k + j]; r = r.slice(0, m.index!) + FADE[levels[levels.length - k + j]] + r.slice(m.index!); }
  return r;
}

// A: the last three words appear softly.
export function FadeText({ text }: { text: string }) {
  return <RichText text={mark(text, [3, 7, 11])} />;
}

// B: a light travels over the last words, left to right, again and again.
export function ShimmerText({ text }: { text: string }) {
  const [p, setP] = useState(0);
  useEffect(() => { const t = setInterval(() => setP((x) => (x + 1) % 18), 150); return () => clearInterval(t); }, []);
  const N = 4;
  const c = (p / 18) * (N + 3) - 1.5;
  const levels = Array.from({ length: N }, (_, i) => {
    const bump = Math.exp(-((i - c) * (i - c)) / 1.6);
    const base = i === N - 1 ? 6 : 10;
    return Math.min(15, Math.round(base + bump * (15 - base)));
  });
  return <RichText text={mark(text, levels)} />;
}

// The bubble: its edge glows softly and breathes while the answer is written.
export function GlowBubble({ children, glow = true }: { children: React.ReactNode; glow?: boolean }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!glow) return;
    const l = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(t, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, [glow]);
  const R = { borderRadius: 20, borderBottomLeftRadius: 6 };
  return (
    <View style={{ maxWidth: '84%', flexShrink: 1 }}>
      <Glass radius={20} style={{ paddingVertical: 13, paddingHorizontal: 16, borderBottomLeftRadius: 6 }}>{children}</Glass>
      {glow ? <Animated.View pointerEvents="none" style={[R, { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderWidth: 1.5, borderColor: 'rgba(183,148,255,.85)', opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.85] }) }]} /> : null}
    </View>
  );
}

// The little orb breathes (it swells and brightens a little, no halo around it) while the answer is written.
export function OrbBreath({ on = true }: { on?: boolean }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!on) return;
    const l = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(t, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, [on]);
  return (
    <View style={{ width: 32, height: 32 }}>
      <Animated.View style={{ opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }), transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] }) }] }}><OrbSvg size={32} uid="ty" /></Animated.View>
    </View>
  );
}
