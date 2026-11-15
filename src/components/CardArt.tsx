import React from 'react';
import { View } from 'react-native';
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
        {kind === 'intel' ? (
          <G>
            {/* a small network of linked points */}
            {[[210, 30, 260, 62], [260, 62, 300, 34], [260, 62, 282, 108], [282, 108, 224, 98], [224, 98, 260, 62], [224, 98, 190, 126]].map((l, i) => <Line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke="#b794ff" strokeOpacity=".4" strokeWidth="1.3" />)}
            {[[210, 30, 4], [260, 62, 7], [300, 34, 4], [282, 108, 5], [224, 98, 5], [190, 126, 3]].map((c, i) => <Circle key={i} cx={c[0]} cy={c[1]} r={c[2]} fill="#d3c1ff" fillOpacity={i === 1 ? 0.7 : 0.45} />)}
          </G>
        ) : null}
      </Svg>
    </View>
  );
}
