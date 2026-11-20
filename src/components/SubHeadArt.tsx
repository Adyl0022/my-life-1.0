import React from 'react';
import { Animated } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useSway } from './artMotion';

// Header picture for Subscriptions: a pair of headphones behind a glass membership card with a crown. Drawn here, not copied from anywhere.
export function SubHeadArt({ width = 190 }: { width?: number }) {
  const f = useSway(7); const g = useSway(9, 2);
  const y = f.interpolate({ inputRange: [0, 1], outputRange: [3, -4] }); const y2 = g.interpolate({ inputRange: [0, 1], outputRange: [-3, 4] });
  const h = (width * 160) / 200;
  return (
    <Animated.View style={{ width, height: h, transform: [{ translateY: y }] }}>
      <Svg width={width} height={h} viewBox="0 0 200 160">
        <Defs>
          <LinearGradient id="band" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#8c6cf5" /><Stop offset="1" stopColor="#3f2bb0" /></LinearGradient>
          <LinearGradient id="cup" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#a58bff" /><Stop offset="1" stopColor="#4a33c4" /></LinearGradient>
          <LinearGradient id="card" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#4a3aa8" /><Stop offset="1" stopColor="#241660" /></LinearGradient>
          <LinearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#fff1ff" /><Stop offset="1" stopColor="#c9b2ff" /></LinearGradient>
          <LinearGradient id="halo" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#ffffff" stopOpacity="0.5" /><Stop offset="1" stopColor="#ffffff" stopOpacity="0" /></LinearGradient>
        </Defs>
        <Circle cx="108" cy="76" r="66" fill="url(#halo)" />
        {/* headphones */}
        <G>
          <Path d="M56 86 C56 30 150 24 156 88" fill="none" stroke="url(#band)" strokeWidth="11" strokeLinecap="round" />
          <Path d="M60 84 C62 40 140 34 150 80" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="2.5" strokeLinecap="round" />
          <Rect x="42" y="78" width="27" height="50" rx="13" fill="url(#cup)" />
          <Rect x="46" y="84" width="9" height="38" rx="4.5" fill="#fff" fillOpacity="0.22" />
          <Rect x="144" y="78" width="27" height="50" rx="13" fill="url(#cup)" />
          <Rect x="148" y="84" width="9" height="38" rx="4.5" fill="#fff" fillOpacity="0.22" />
        </G>
        {/* the card */}
        <G rotation={-9} origin="104,112">
          <Rect x="60" y="78" width="104" height="66" rx="14" fill="url(#card)" />
          <Rect x="60" y="78" width="104" height="66" rx="14" fill="none" stroke="#fff" strokeOpacity="0.35" />
          <Rect x="60" y="78" width="104" height="22" rx="14" fill="#fff" fillOpacity="0.07" />
          <Path d="M92 118 L95 104 L102 112 L112 98 L122 112 L129 104 L132 118 Z" fill="url(#gold)" />
          <Rect x="93" y="121" width="38" height="5" rx="2.5" fill="url(#gold)" />
          <Circle cx="112" cy="97" r="2.6" fill="#fff" />
          <Rect x="72" y="132" width="28" height="4" rx="2" fill="#fff" fillOpacity="0.4" />
          <Rect x="126" y="132" width="26" height="4" rx="2" fill="#fff" fillOpacity="0.25" />
        </G>
        <Path d="M170 30 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#fff" fillOpacity="0.9" />
        <Circle cx="38" cy="44" r="3" fill="#fff" fillOpacity="0.7" /><Circle cx="182" cy="118" r="2.4" fill="#fff" fillOpacity="0.6" />
      </Svg>
    </Animated.View>
  );
}
