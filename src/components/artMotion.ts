import React from 'react';
import { Animated, Easing } from 'react-native';

// Slow, calm motion for the page art. Everything runs on transforms and opacity, so it is cheap and the lines stay sharp.
/** Goes round and round. Returns a rotation string for a transform. */
export function useSpin(sec: number, dir: 1 | -1 = 1) {
  const v = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => { const a = Animated.loop(Animated.timing(v, { toValue: 1, duration: sec * 1000, easing: Easing.linear, useNativeDriver: true })); a.start(); return () => a.stop(); }, []);
  return v.interpolate({ inputRange: [0, 1], outputRange: dir > 0 ? ['0deg', '360deg'] : ['0deg', '-360deg'] });
}
/** Goes 0 to 1 and back to 0, easing in and out, forever. `delay` offsets one layer from another. */
export function useSway(sec: number, delay = 0) {
  const v = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const e = Easing.inOut(Easing.sin);
    const a = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: (sec * 1000) / 2, easing: e, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: (sec * 1000) / 2, easing: e, useNativeDriver: true })]));
    const t = setTimeout(() => a.start(), delay * 1000); return () => { clearTimeout(t); a.stop(); };
  }, []);
  return v;
}
