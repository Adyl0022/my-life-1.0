import React, { useLayoutEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
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
