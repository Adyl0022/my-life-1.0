import React, { useLayoutEffect, useRef, useState } from 'react';
import { Animated, View, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from './Txt';
import { LinearGradient } from 'expo-linear-gradient';

/** Slide and fade for the content under a tab bar. Give it the index of the current tab and wrap the content in `slide`. */
export function useTabSlide(index: number) {
  const fx = useRef(new Animated.Value(1)).current; const prev = useRef(index); const dir = useRef(1);
  useLayoutEffect(() => {
    if (prev.current === index) return;
    dir.current = index > prev.current ? 1 : -1; prev.current = index;
    fx.setValue(0); Animated.timing(fx, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [index]);
  return { opacity: fx, transform: [{ translateX: fx.interpolate({ inputRange: [0, 1], outputRange: [dir.current * 38, 0] }) }] };
}

/** A coloured pill that glides between equal-width tabs. Put `indicator` first inside the bar (padding 3) and spread `onLayout` on the bar. */
export function useTabPill(index: number, count: number, colors: [string, string], pad = 3) {
  const pos = useRef(new Animated.Value(index)).current; const [w, setW] = useState(0);
  useLayoutEffect(() => { Animated.spring(pos, { toValue: index, useNativeDriver: true, friction: 8, tension: 90 }).start(); }, [index]);
  const tw = w ? (w - pad * 2) / count : 0;
  const indicator = tw ? (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: pad, top: pad, bottom: pad, width: tw, transform: [{ translateX: Animated.multiply(pos, tw) }] }}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 999 }} />
    </Animated.View>
  ) : null;
  return { indicator, onLayout: (e: any) => setW(e.nativeEvent.layout.width) };
}

/** Tabs of different widths with one coloured pill that glides to the tab you press, with a light vibration. */
export function SlidePills({ tabs, index, onChange, colors, textOn = '#fff', textOff = 'rgba(255,255,255,.8)', pad = 3, gap = 0, fontSize = 13, padX = 16, padY = 7, bar, style }: {
  tabs: string[]; index: number; onChange: (i: number) => void; colors: [string, string]; textOn?: string; textOff?: string; pad?: number; gap?: number; fontSize?: number; padX?: number; padY?: number; bar?: any; style?: any;
}) {
  const lay = useRef<{ x: number; w: number }[]>([]); const [, bump] = useState(0);
  const left = useRef(new Animated.Value(0)).current; const wid = useRef(new Animated.Value(0)).current; const ready = useRef(false);
  const go = (i: number, jump: boolean) => {
    const l = lay.current[i]; if (!l) return;
    if (jump) { left.setValue(l.x); wid.setValue(l.w); return; }
    Animated.spring(left, { toValue: l.x, useNativeDriver: false, friction: 8, tension: 90 }).start();
    Animated.spring(wid, { toValue: l.w, useNativeDriver: false, friction: 8, tension: 90 }).start();
  };
  useLayoutEffect(() => { go(index, !ready.current && !!lay.current[index]); if (lay.current[index]) ready.current = true; }, [index]);
  return (
    <View style={[{ flexDirection: 'row', alignSelf: 'flex-start', padding: pad, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,.15)', gap }, bar, style]}>
      {ready.current || lay.current[index] ? (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: pad, bottom: pad, left, width: wid }}>
          <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 999 }} />
        </Animated.View>
      ) : null}
      {tabs.map((t, i) => (
        <Pressable key={t + i} accessibilityLabel={t}
          onLayout={(e) => { const { x, width } = e.nativeEvent.layout; const first = !lay.current[i]; lay.current[i] = { x, w: width }; if (i === index) { go(i, !ready.current); ready.current = true; } if (first) bump((n) => n + 1); }}
          onPress={() => { if (i !== index) { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } onChange(i); }}
          style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
          <View style={{ paddingVertical: padY, paddingHorizontal: padX }}><Text style={{ color: i === index ? textOn : textOff, fontSize, fontWeight: i === index ? '800' : '600' }}>{t}</Text></View>
        </Pressable>
      ))}
    </View>
  );
}
