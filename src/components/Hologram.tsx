import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Pressable } from 'react-native';
import Svg, { Defs, LinearGradient as SG, Stop, Path, Circle, Ellipse, G, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Region, REGIONS } from '../lib/twin';

// A light 2D hologram of a body (SVG, no 3D engine). Tap a part to pick it.
const AG = Animated.createAnimatedComponent(G);
const BODY = [
  'M66 84 Q100 70 134 84 L131 150 Q127 190 121 232 L79 232 Q73 190 69 150 Z', // torso
  'M62 88 Q46 92 42 118 L36 186 Q34 197 44 198 Q53 198 55 188 L63 128 Z', // left arm
  'M138 88 Q154 92 158 118 L164 186 Q166 197 156 198 Q147 198 145 188 L137 128 Z', // right arm
  'M79 232 L100 232 L99 322 L96 392 Q95 405 85 405 Q75 405 76 392 L79 322 Z', // left leg
  'M121 232 L100 232 L101 322 L104 392 Q105 405 115 405 Q125 405 124 392 L121 322 Z', // right leg
  'M92 60 L108 60 L110 74 Q100 80 90 74 Z', // neck
];

export function Hologram({ w, sel, onPick, glow, reduce }: { w: number; sel: Region; onPick: (r: Region) => void; glow: number; reduce: boolean }) {
  const H = w * 2.1; const sc = w / 200;
  const scan = useRef(new Animated.Value(0)).current; const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) { scan.setValue(0.5); pulse.setValue(1); return; }
    const a = Animated.loop(Animated.timing(scan, { toValue: 1, duration: 3400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }));
    const b = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: false }), Animated.timing(pulse, { toValue: 0.35, duration: 1100, useNativeDriver: false })]));
    a.start(); b.start(); return () => { a.stop(); b.stop(); };
  }, [reduce]);
  const on = (r: Region) => sel === r;
  const col = (r: Region) => REGIONS.find((x) => x.k === r)!.c;
  const body = 0.28 + glow * 0.62; // how brightly the body glows follows how much was recorded that day
  const Hot = ({ r, children }: { r: Region; children: React.ReactNode }) => (
    <AG opacity={on(r) ? (pulse as any) : 0.9} onPress={() => onPick(r)}>{children}</AG>
  );
  return (
    <View style={{ width: w, height: H, alignSelf: 'center' }}>
      <Svg width={w} height={H} viewBox="0 0 200 420">
        <Defs>
          <SG id="bg" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#5ee7df" stopOpacity="0.34" /><Stop offset="0.55" stopColor="#7c9cff" stopOpacity="0.2" /><Stop offset="1" stopColor="#b794ff" stopOpacity="0.28" /></SG>
        </Defs>
        {/* floor rings */}
        <Ellipse cx="100" cy="408" rx="86" ry="10" fill="none" stroke="#5ee7df" strokeOpacity="0.5" strokeWidth="1.2" />
        <Ellipse cx="100" cy="408" rx="62" ry="7" fill="none" stroke="#b794ff" strokeOpacity="0.5" strokeWidth="1" />
        <Ellipse cx="100" cy="408" rx="34" ry="4" fill="#5ee7df" fillOpacity="0.2" />
        {/* body shell */}
        <G onPress={() => onPick('body')}>
          <Circle cx="100" cy="38" r="22" fill="url(#bg)" stroke="#8fe9e2" strokeOpacity={body} strokeWidth="1.6" />
          {BODY.map((d, i) => <Path key={i} d={d} fill="url(#bg)" stroke="#8fe9e2" strokeOpacity={body} strokeWidth="1.6" strokeLinejoin="round" />)}
          {[100, 128, 156, 184, 212].map((y) => <Line key={y} x1="76" x2="124" y1={y} y2={y} stroke="#8fe9e2" strokeOpacity="0.12" strokeWidth="0.8" />)}
          <Path d="M100 80 L100 230" stroke="#8fe9e2" strokeOpacity="0.16" strokeWidth="0.8" />
        </G>
        {/* muscles: upper arms and thighs */}
        <Hot r="muscles">
          <Path d="M62 90 Q47 95 43 118 L50 124 L63 118 Z" fill={col('muscles')} fillOpacity={on('muscles') ? 0.5 : 0.16} stroke={col('muscles')} strokeWidth={on('muscles') ? 1.8 : 1} />
          <Path d="M138 90 Q153 95 157 118 L150 124 L137 118 Z" fill={col('muscles')} fillOpacity={on('muscles') ? 0.5 : 0.16} stroke={col('muscles')} strokeWidth={on('muscles') ? 1.8 : 1} />
          <Path d="M80 238 L99 238 L99 305 L79 305 Z" fill={col('muscles')} fillOpacity={on('muscles') ? 0.5 : 0.16} stroke={col('muscles')} strokeWidth={on('muscles') ? 1.8 : 1} />
          <Path d="M101 238 L120 238 L121 305 L101 305 Z" fill={col('muscles')} fillOpacity={on('muscles') ? 0.5 : 0.16} stroke={col('muscles')} strokeWidth={on('muscles') ? 1.8 : 1} />
        </Hot>
        {/* lungs */}
        <Hot r="lungs">
          <Path d="M96 100 Q80 98 76 126 Q74 146 86 150 Q96 150 96 136 Z" fill={col('lungs')} fillOpacity={on('lungs') ? 0.5 : 0.16} stroke={col('lungs')} strokeWidth={on('lungs') ? 1.8 : 1} />
          <Path d="M104 100 Q120 98 124 126 Q126 146 114 150 Q104 150 104 136 Z" fill={col('lungs')} fillOpacity={on('lungs') ? 0.5 : 0.16} stroke={col('lungs')} strokeWidth={on('lungs') ? 1.8 : 1} />
        </Hot>
        {/* heart */}
        <Hot r="heart">
          <Path d="M110 118 C110 112 118 112 118 119 C118 126 110 131 110 136 C110 131 102 126 102 119 C102 112 110 112 110 118 Z" fill={col('heart')} fillOpacity={on('heart') ? 0.75 : 0.3} stroke={col('heart')} strokeWidth={on('heart') ? 1.8 : 1} />
        </Hot>
        {/* brain */}
        <Hot r="brain">
          <Ellipse cx="100" cy="34" rx="15" ry="12" fill={col('brain')} fillOpacity={on('brain') ? 0.55 : 0.2} stroke={col('brain')} strokeWidth={on('brain') ? 1.8 : 1} />
          <Path d="M100 23 L100 45 M88 34 Q94 30 100 34 Q106 38 112 34" fill="none" stroke={col('brain')} strokeOpacity="0.8" strokeWidth="0.9" />
        </Hot>
      </Svg>
      {/* moving scan line */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: w * 0.12, right: w * 0.12, top: 0, height: 36 * sc, transform: [{ translateY: scan.interpolate({ inputRange: [0, 1], outputRange: [0, H - 36 * sc] }) }] }}>
        <LinearGradient colors={['rgba(94,231,223,0)', 'rgba(94,231,223,.38)', 'rgba(94,231,223,0)']} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}
