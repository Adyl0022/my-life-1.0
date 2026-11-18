import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { Text } from './Txt';
import Svg, { Defs, RadialGradient, LinearGradient as LG, Stop, Circle, Ellipse, Path, ClipPath, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// Same artwork as the design: the colour blobs spin inside the sphere while the highlight, ring and star stay still.
export function OrbPart({ size, uid, part }: { size: number; uid: string; part: 'base' | 'top' | 'top2' | 'star' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <RadialGradient id={uid + 'b'} cx="0.34" cy="0.28" r="0.85"><Stop offset="0" stopColor="#d9fffb" /><Stop offset="0.38" stopColor="#7fb2ff" /><Stop offset="0.75" stopColor="#6a4df0" /><Stop offset="1" stopColor="#2a1a78" /></RadialGradient>
        <LG id={uid + 'h'} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#fff" stopOpacity="0.85" /><Stop offset="1" stopColor="#fff" stopOpacity="0" /></LG>
        <LG id={uid + 'r'} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#fff" stopOpacity="0.9" /><Stop offset="0.5" stopColor="#fff" stopOpacity="0.08" /><Stop offset="1" stopColor="#8fe9e2" stopOpacity="0.8" /></LG>
        <RadialGradient id={uid + 'c1'} cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#5ee7df" stopOpacity="1" /><Stop offset="0.55" stopColor="#5ee7df" stopOpacity="0.7" /><Stop offset="1" stopColor="#5ee7df" stopOpacity="0" /></RadialGradient>
        <RadialGradient id={uid + 'c2'} cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#ff8fe0" stopOpacity="1" /><Stop offset="0.55" stopColor="#ff8fe0" stopOpacity="0.7" /><Stop offset="1" stopColor="#ff8fe0" stopOpacity="0" /></RadialGradient>
        <RadialGradient id={uid + 'c3'} cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#ffd27a" stopOpacity="0.8" /><Stop offset="0.55" stopColor="#ffd27a" stopOpacity="0.45" /><Stop offset="1" stopColor="#ffd27a" stopOpacity="0" /></RadialGradient>
        <LG id={uid + 'd'} x1="0" y1="0" x2="0" y2="1"><Stop offset="0.5" stopColor="#1a0a6a" stopOpacity="0" /><Stop offset="1" stopColor="#1a0a6a" stopOpacity="0.55" /></LG>
        <LG id={uid + 'e'} x1="1" y1="1" x2="0" y2="0"><Stop offset="0" stopColor="#8fe9e2" stopOpacity="0.85" /><Stop offset="0.4" stopColor="#8fe9e2" stopOpacity="0" /></LG>
        <RadialGradient id={uid + 'sg'} cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#fff" stopOpacity="0.75" /><Stop offset="1" stopColor="#fff" stopOpacity="0" /></RadialGradient>
        <ClipPath id={uid + 'k'}><Circle cx="24" cy="24" r="22" /></ClipPath>
      </Defs>
      {part === 'base' && (<>
        <Circle cx="24" cy="24" r="22" fill={`url(#${uid}b)`} />
        <G clipPath={`url(#${uid}k)`}>
          <Ellipse cx="14" cy="32" rx="14" ry="10" fill={`url(#${uid}c1)`} />
          <Ellipse cx="35" cy="17" rx="12" ry="9" fill={`url(#${uid}c2)`} />
          <Ellipse cx="33" cy="35" rx="12" ry="9" fill={`url(#${uid}c3)`} />
        </G>
      </>)}
      {(part === 'top' || part === 'top2') && (<>
        <G clipPath={`url(#${uid}k)`}>
          <Circle cx="24" cy="24" r="22" fill={`url(#${uid}d)`} />
          <Ellipse cx="17" cy="11" rx="12" ry="6.5" fill={`url(#${uid}h)`} transform="rotate(-24 17 11)" />
          <Path d="M6 33a20 20 0 0 0 36 0" fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={3} />
        </G>
        <Circle cx="24" cy="24" r="21.4" fill="none" stroke={`url(#${uid}r)`} strokeWidth={1.2} />
        <Path d="M38 36a18 18 0 0 1-22 7" fill="none" stroke={`url(#${uid}e)`} strokeWidth={1.6} strokeLinecap="round" />
        {part === 'top' && (<><Circle cx="24" cy="24" r="13" fill={`url(#${uid}sg)`} opacity={0.5} /><Path d="M24 11l3 8.2L35.2 22l-8.2 2.8L24 33l-3-8.2L12.8 22l8.2-2.8z" fill="#fff" /></>)}
      </>)}
      {part === 'star' && (<>
        <Circle cx="24" cy="24" r="13" fill={`url(#${uid}sg)`} opacity={0.5} />
        <Path d="M24 11l3 8.2L35.2 22l-8.2 2.8L24 33l-3-8.2L12.8 22l8.2-2.8z" fill="#fff" />
      </>)}
    </Svg>
  );
}

// `spin` = seconds for one turn of the colours (omit it for a still orb). Only the orb of the answer being written, and the newest answer, should spin.
function OrbSpinning({ size, uid, secs }: { size: number; uid: string; secs: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    t.setValue(0);
    const a = Animated.loop(Animated.timing(t, { toValue: 1, duration: secs * 1000, easing: Easing.linear, useNativeDriver: true }));
    a.start();
    return () => a.stop();
  }, [secs]);
  const rot = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={{ transform: [{ rotate: rot }] }}><OrbPart size={size} uid={uid + 'a'} part="base" /></Animated.View>
      <View style={{ position: 'absolute', left: 0, top: 0 }}><OrbPart size={size} uid={uid + 'z'} part="top" /></View>
    </View>
  );
}

export function OrbSvg({ size, uid, spin }: { size: number; uid: string; spin?: number }) {
  if (spin && spin > 0) return <OrbSpinning size={size} uid={uid} secs={spin} />;
  return (
    <View style={{ width: size, height: size }}>
      <OrbPart size={size} uid={uid + 'a'} part="base" />
      <View style={{ position: 'absolute', left: 0, top: 0 }}><OrbPart size={size} uid={uid + 'z'} part="top" /></View>
    </View>
  );
}

export function Orb({ size = 42, badge = true, onPress }: { size?: number; badge?: boolean; onPress?: () => void }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 1400, useNativeDriver: false }), Animated.timing(v, { toValue: 0, duration: 1400, useNativeDriver: false })])); a.start(); return () => a.stop(); }, [v]);
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true })); a.start(); return () => a.stop(); }, [spin]);
  const tw = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.timing(tw, { toValue: 1, duration: 1200, useNativeDriver: true }), Animated.timing(tw, { toValue: 0, duration: 1200, useNativeDriver: true })])); a.start(); return () => a.stop(); }, [tw]);
  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const shadowOpacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.95] });
  const dot = size * 0.0375;
  return (
    <Animated.View accessibilityLabel="Ask My Life assistant" onTouchEnd={onPress} style={{ width: size, height: size, borderRadius: size / 2, shadowColor: v.interpolate({ inputRange: [0, 1], outputRange: ['#7c9cff', '#8fe9e2'] }) as any, shadowRadius: 14, shadowOpacity: shadowOpacity as any, shadowOffset: { width: 0, height: 0 }, elevation: 6 }}>
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, transform: [{ rotate: rot }] }}><OrbPart size={size} uid={'o' + size} part="base" /></Animated.View>
      <View style={{ position: 'absolute', left: 0, top: 0 }}><OrbPart size={size} uid={'t' + size} part="top" /></View>
      <Animated.View style={{ position: 'absolute', left: (35 / 48) * size - dot, top: (12 / 48) * size - dot, width: dot * 2, height: dot * 2, borderRadius: dot, backgroundColor: '#fff', opacity: tw.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }} />
      {badge && (
        <LinearGradient colors={['#ff8fab', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', right: -7, bottom: -5, paddingHorizontal: 6, borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.85)', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}>
          <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 0.4, color: '#fff', lineHeight: 13 }}>AI</Text>
        </LinearGradient>
      )}
    </Animated.View>
  );
}
