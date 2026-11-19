import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, View, TextInput, ViewStyle, StyleProp, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SearchIcon, CloseIcon } from './AudioIcons';

const ND = Platform.OS !== 'web';

// A button that reacts when pressed: it springs in, a ring of light spreads out around it and a soft shine sweeps across it.
// With `pulse` it also breathes a gentle halo all the time (used for the play button while a recitation is playing).
export function Shine({ onPress, style, radius = 20, glow = '#7df0c6', pulse, disabled, label, hitSlop, children }: {
  onPress?: () => void; style?: StyleProp<ViewStyle>; radius?: number; glow?: string; pulse?: boolean; disabled?: boolean; label?: string; hitSlop?: number; children?: React.ReactNode;
}) {
  const sc = useRef(new Animated.Value(1)).current;
  const ring = useRef(new Animated.Value(1)).current; // 1 = finished (invisible)
  const sweep = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(48);
  useEffect(() => {
    if (!pulse) { halo.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(halo, { toValue: 1, duration: 1700, easing: Easing.out(Easing.quad), useNativeDriver: ND }));
    loop.start();
    return () => { loop.stop(); };
  }, [pulse, halo]);
  const fire = () => {
    ring.setValue(0); sweep.setValue(0);
    Animated.parallel([
      Animated.timing(ring, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: ND }),
      Animated.timing(sweep, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: ND }),
    ]).start();
  };
  const onLayout = (e: LayoutChangeEvent) => setW(Math.max(30, e.nativeEvent.layout.width));
  return (
    <Pressable
      disabled={disabled} accessibilityLabel={label} hitSlop={hitSlop}
      onPressIn={() => { Animated.spring(sc, { toValue: 0.88, speed: 40, bounciness: 0, useNativeDriver: ND }).start(); }}
      onPressOut={() => { Animated.spring(sc, { toValue: 1, speed: 14, bounciness: 14, useNativeDriver: ND }).start(); }}
      onPress={() => { fire(); if (onPress) onPress(); }}
    >
      <Animated.View style={{ transform: [{ scale: sc }] }}>
        {pulse ? <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -2, right: -2, top: -2, bottom: -2, borderRadius: radius + 2, backgroundColor: glow, opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }), transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }] }} /> : null}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -2, right: -2, top: -2, bottom: -2, borderRadius: radius + 2, borderWidth: 2, borderColor: glow, opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.95, 0] }), transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }] }} />
        <View onLayout={onLayout} style={[{ borderRadius: radius, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, style]}>
          {children}
          <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, width: w * 0.7, opacity: sweep.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-w, w * 1.3] }) }, { skewX: '-20deg' }] }}>
            <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,.55)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// The search field: when it is touched it lights up with a soft glow and a shine runs across it.
export function GlowField({ children, focused, radius = 16 }: { children: React.ReactNode; focused: boolean; radius?: number }) {
  const f = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(300);
  useEffect(() => {
    Animated.timing(f, { toValue: focused ? 1 : 0, duration: 260, useNativeDriver: false }).start();
    if (focused) { sweep.setValue(0); Animated.timing(sweep, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: ND }).start(); }
  }, [focused, f, sweep]);
  return (
    <View>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -4, right: -4, top: -4, bottom: -4, borderRadius: radius + 4, backgroundColor: '#7df0c6', opacity: f.interpolate({ inputRange: [0, 1], outputRange: [0, 0.22] }) }} />
      <Animated.View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: radius, overflow: 'hidden', borderWidth: 1, backgroundColor: 'rgba(255,255,255,.08)', borderColor: f.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,.14)', 'rgba(125,240,198,.95)'] }) }}>
        {children}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, width: w * 0.35, opacity: sweep.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-w * 0.4, w * 1.1] }) }, { skewX: '-20deg' }] }}>
          <LinearGradient colors={['rgba(125,240,198,0)', 'rgba(125,240,198,.35)', 'rgba(125,240,198,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// Ready-made search box used everywhere: the same glow and shine as the Quran Audio search, a clear button once you type.
export function SearchField({ value, onChangeText, placeholder, autoFocus, autoCapitalize }: { value: string; onChangeText: (t: string) => void; placeholder: string; autoFocus?: boolean; autoCapitalize?: 'none' | 'sentences' }) {
  const [f, setF] = useState(false);
  return (
    <GlowField focused={f}>
      <SearchIcon size={18} color={f ? '#7df0c6' : 'rgba(255,255,255,.6)'} />
      <TextInput value={value} onChangeText={onChangeText} onFocus={() => setF(true)} onBlur={() => setF(false)} autoFocus={autoFocus} autoCapitalize={autoCapitalize} placeholder={placeholder} placeholderTextColor="rgba(255,255,255,.45)" accessibilityLabel={placeholder} style={{ flex: 1, color: '#fff', fontSize: 14, paddingVertical: 11, outlineStyle: 'none' } as any} />
      {value ? <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityLabel="Clear search"><CloseIcon size={16} color="rgba(255,255,255,.7)" /></Pressable> : null}
    </GlowField>
  );
}
