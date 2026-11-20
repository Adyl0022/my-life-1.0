import React from 'react';
import { View, Pressable, Animated, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// One on/off switch for the whole app. When it flips, the knob slides with a little spring and stretches for a moment, the colour fades in,
// and the phone gives a short tap. Press it and it shrinks slightly, so it feels like a real button.
// Give it `onPress` to make it tappable. Leave `onPress` out when a row around it already handles the tap: it still animates and taps when `on` changes.
export function Toggle({ on, onPress, colors = ['#5ee7b5', '#5ee7b5'], thumbOn, w = 44, h = 26, label }: { on: boolean; onPress?: () => void; colors?: [string, string] | string; thumbOn?: string; w?: number; h?: number; label?: string }) {
  const p = React.useRef(new Animated.Value(on ? 1 : 0)).current;
  const st = React.useRef(new Animated.Value(1)).current;
  const sc = React.useRef(new Animated.Value(1)).current;
  const first = React.useRef(true);
  React.useEffect(() => {
    Animated.spring(p, { toValue: on ? 1 : 0, friction: 7, tension: 140, useNativeDriver: true }).start();
    if (first.current) { first.current = false; return; }
    Animated.sequence([Animated.timing(st, { toValue: 1.28, duration: 90, useNativeDriver: true }), Animated.spring(st, { toValue: 1, friction: 5, useNativeDriver: true })]).start();
    if (Platform.OS !== 'web') { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) { /* no vibration on this phone */ } }
  }, [on]);
  const d = h - 6; const cols: [string, string] = typeof colors === 'string' ? [colors, colors] : colors;
  const body = (
    <View style={{ width: w, height: h, borderRadius: h / 2, backgroundColor: 'rgba(255,255,255,.2)', overflow: 'hidden' }}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: p }]}><LinearGradient colors={cols} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /></Animated.View>
      <Animated.View style={{ position: 'absolute', top: 3, left: 3, width: d, height: d, borderRadius: d / 2, backgroundColor: '#fff', transform: [{ translateX: p.interpolate({ inputRange: [0, 1], outputRange: [0, w - d - 6] }) }, { scaleX: st }] }}>
        {thumbOn ? <Animated.View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: d / 2, backgroundColor: thumbOn, opacity: p }} /> : null}
      </Animated.View>
    </View>
  );
  if (!onPress) return <View pointerEvents="none">{body}</View>;
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label} onPress={onPress} hitSlop={6}
      onPressIn={() => Animated.spring(sc, { toValue: 0.9, useNativeDriver: true, friction: 6 }).start()} onPressOut={() => Animated.spring(sc, { toValue: 1, useNativeDriver: true, friction: 4 }).start()}>
      <Animated.View style={{ transform: [{ scale: sc }] }}>{body}</Animated.View>
    </Pressable>
  );
}
