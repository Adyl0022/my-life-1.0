import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient as LG, Path, Rect, Stop, ClipPath } from 'react-native-svg';
import { MOODS } from '../lib/habit';

const INK = '#2a1747';
// A little face for each mood: Awful, Low, Okay, Good, Great
export function Face({ i, size = 42, on = true }: { i: number; size?: number; on?: boolean }) {
  const c = MOODS[i][1];
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" opacity={on ? 1 : 0.55}>
      <Defs><LG id={'fg' + i} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#fff" stopOpacity=".55" /><Stop offset="1" stopColor="#fff" stopOpacity="0" /></LG></Defs>
      <Circle cx="24" cy="24" r="22" fill={c} />
      <Ellipse cx="24" cy="12" rx="15" ry="9" fill={'url(#fg' + i + ')'} />
      {i === 0 && <G><Path d="M12 15l8 3M36 15l-8 3" stroke={INK} strokeWidth="2.4" strokeLinecap="round" /><Circle cx="16.5" cy="22" r="2.6" fill={INK} /><Circle cx="31.5" cy="22" r="2.6" fill={INK} /><Path d="M15 36q9-10 18 0" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" /><Path d="M33.5 26q2 3 0 5.5q-2-2.5 0-5.5z" fill="#cfe9ff" /></G>}
      {i === 1 && <G><Circle cx="16.5" cy="20" r="2.6" fill={INK} /><Circle cx="31.5" cy="20" r="2.6" fill={INK} /><Path d="M16 34q8-6 16 0" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" /></G>}
      {i === 2 && <G><Circle cx="16.5" cy="20" r="2.6" fill={INK} /><Circle cx="31.5" cy="20" r="2.6" fill={INK} /><Path d="M16 32h16" stroke={INK} strokeWidth="2.8" strokeLinecap="round" /></G>}
      {i === 3 && <G><Circle cx="16.5" cy="20" r="2.6" fill={INK} /><Circle cx="31.5" cy="20" r="2.6" fill={INK} /><Path d="M15 30q9 9 18 0" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" /></G>}
      {i === 4 && <G><Path d="M12 22q4.5-6 9 0M27 22q4.5-6 9 0" stroke={INK} strokeWidth="2.8" strokeLinecap="round" fill="none" /><Path d="M13 29h22q-2 11-11 11t-11-11z" fill={INK} /><Path d="M18 36q6 3 12 0q-3-3.5-6-3.5t-6 3.5z" fill="#ff8fab" /><Circle cx="11" cy="29" r="3" fill="#ff8fab" opacity=".55" /><Circle cx="37" cy="29" r="3" fill="#ff8fab" opacity=".55" /></G>}
    </Svg>
  );
}

// A water glass that fills up
export function GlassIcon({ full, size = 44 }: { full: boolean; size?: number }) {
  const w = size * 0.8;
  return (
    <Svg width={w} height={size} viewBox="0 0 32 40">
      <Defs>
        <LG id="wg" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#9fe3ff" /><Stop offset="1" stopColor="#5a8bff" /></LG>
        <ClipPath id="gc"><Path d="M5 4h22l-2.4 29a3.4 3.4 0 0 1-3.4 3.1H10.8a3.4 3.4 0 0 1-3.4-3.1z" /></ClipPath>
      </Defs>
      <Path d="M5 4h22l-2.4 29a3.4 3.4 0 0 1-3.4 3.1H10.8a3.4 3.4 0 0 1-3.4-3.1z" fill={full ? 'rgba(124,156,255,.18)' : 'rgba(255,255,255,.07)'} />
      {full && <G clipPath="url(#gc)"><Rect x="0" y="12" width="32" height="30" fill="url(#wg)" /><Path d="M0 12q4-3 8 0t8 0 8 0 8 0v3H0z" fill="#d6f3ff" opacity=".7" /><Circle cx="14" cy="26" r="1.6" fill="#fff" opacity=".6" /><Circle cx="20" cy="30" r="1.1" fill="#fff" opacity=".5" /></G>}
      <Path d="M5 4h22l-2.4 29a3.4 3.4 0 0 1-3.4 3.1H10.8a3.4 3.4 0 0 1-3.4-3.1z" fill="none" stroke={full ? '#cfe0ff' : 'rgba(255,255,255,.4)'} strokeWidth="1.8" strokeLinejoin="round" />
      {full && <Path d="M9 9l1.4 17" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />}
    </Svg>
  );
}

const ICONS: Record<string, { c: string; d: React.ReactNode }> = {
  steps: { c: '#5ee7df', d: <G fill="#fff"><Ellipse cx="9" cy="15" rx="3" ry="4.6" /><Circle cx="7.4" cy="8.6" r="1.1" /><Circle cx="9.4" cy="8" r="1.1" /><Circle cx="11.4" cy="8.6" r="1.1" /><Ellipse cx="16" cy="12" rx="3" ry="4.6" /><Circle cx="14.4" cy="5.6" r="1.1" /><Circle cx="16.4" cy="5" r="1.1" /><Circle cx="18.4" cy="5.6" r="1.1" /></G> },
  sleep: { c: '#b794ff', d: <G><Path d="M19.5 14.2A8 8 0 1 1 9.8 4.5a6.4 6.4 0 0 0 9.7 9.7z" fill="#fff" /><Path d="M17 4.5v3M15.5 6h3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" /></G> },
  goal: { c: '#7c9cff', d: <G fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><Circle cx="12" cy="12" r="8" /><Circle cx="12" cy="12" r="4.4" /><Circle cx="12" cy="12" r="1" fill="#fff" /><Path d="M12 12l6-6" /></G> },
  weight: { c: '#ffc46b', d: <G fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Rect x="4" y="4.5" width="16" height="15" rx="4.5" /><Path d="M8 10.5a4 4 0 0 1 8 0" /><Path d="M12 10.5l1.6-2" /></G> },
  water: { c: '#7c9cff', d: <Path d="M12 3.5s6 6.2 6 10.6a6 6 0 0 1-12 0C6 9.700 12 3.500 12 3.500z" fill="#fff" /> },
  mood: { c: '#ff8fab', d: <G fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><Circle cx="12" cy="12" r="8.5" /><Path d="M8.5 14q3.500 3.500 7 0" /><Circle cx="9.200" cy="9.800" r=".7" fill="#fff" /><Circle cx="14.800" cy="9.800" r=".7" fill="#fff" /></G> },
  link: { c: '#5ee7df', d: <Path d="M12 3l2 6.200 6.200 2-6.200 2-2 6.200-2-6.200-6.200-2 6.200-2z" fill="#fff" /> },
  streak: { c: '#ff8a5c', d: <Path d="M12 3c.5 3-1.500 4.200-3 6.200C7.500 11 7 12.500 7 14a5 5 0 0 0 10 0c0-2-1-3.200-2-4.200.100 1.200-.400 2-1.200 2.200C14.500 9 13.500 5.500 12 3z" fill="#fff" /> },
  week: { c: '#8fe9e2', d: <G fill="#fff"><Rect x="4.500" y="12" width="3.500" height="7" rx="1.200" /><Rect x="10.200" y="7" width="3.500" height="12" rx="1.200" /><Rect x="16" y="9.500" width="3.500" height="9.500" rx="1.200" /></G> },
  badge: { c: '#ffc46b', d: <G fill="#fff"><Path d="M7 4h10v5a5 5 0 0 1-10 0z" /><Rect x="10.500" y="13.500" width="3" height="3.500" /><Rect x="8" y="17" width="8" height="2.500" rx="1" /></G> },
  note: { c: '#ff8fab', d: <G fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M6 4.500h12v15H6z" /><Path d="M9 9h6M9 12.500h6M9 16h3.500" /></G> },
  medicine: { c: '#5ee7df', d: <G><G rotation="-45" origin="12, 12"><Rect x="3.5" y="8.5" width="17" height="7" rx="3.5" fill="none" stroke="#fff" strokeWidth="1.7" /><Path d="M12 8.5H7a3.5 3.5 0 0 0 0 7h5z" fill="#fff" /><Path d="M12 8.5v7" stroke="#fff" strokeWidth="1.7" /></G><Path d="M15.5 6.5l1.600 1.600" stroke="#fff" strokeOpacity=".7" strokeWidth="1.400" strokeLinecap="round" /></G> },
  tablet: { c: '#7c9cff', d: <G><Ellipse cx="12" cy="12.500" rx="8.500" ry="6.500" fill="#fff" /><Path d="M3.500 12.500h17" stroke="#7c9cff" strokeWidth="1.600" /><Path d="M6.500 9.200c1.600-1.600 4-2.200 6-2.200" fill="none" stroke="#7c9cff" strokeOpacity=".5" strokeWidth="1.300" strokeLinecap="round" /></G> },
  syrup: { c: '#ff8fab', d: <G><Rect x="9" y="2.500" width="6" height="2.800" rx="1" fill="#fff" /><Path d="M10 5.300v2L7.500 10v9.500a1.800 1.800 0 0 0 1.800 1.800h5.400a1.800 1.800 0 0 0 1.800-1.800V10L14 7.300v-2" fill="none" stroke="#fff" strokeWidth="1.700" strokeLinejoin="round" strokeLinecap="round" /><Path d="M7.800 14.500c1.500-1.200 2.700 1.200 4.200 0s2.700 1.200 4.200 0v5a1.500 1.500 0 0 1-1.500 1.500H9.300a1.500 1.500 0 0 1-1.500-1.500z" fill="#fff" fillOpacity=".55" /><Path d="M12 9.500v3M10.500 11h3" stroke="#fff" strokeWidth="1.500" strokeLinecap="round" /></G> },
  needle: { c: '#ffc46b', d: <G><G rotation="-45" origin="12, 12"><Rect x="7" y="9" width="9" height="6" rx="1.200" fill="none" stroke="#fff" strokeWidth="1.700" /><Rect x="7.800" y="9.800" width="4" height="4.400" fill="#fff" fillOpacity=".6" /><Path d="M16 12h4M20 9.500v5M7 12H3" stroke="#fff" strokeWidth="1.700" strokeLinecap="round" /><Path d="M10 9v1.500M12.500 9v1.500M15 9v1.500" stroke="#fff" strokeWidth="1.100" /></G></G> },
  drops: { c: '#b794ff', d: <G><Path d="M10.500 3C10.500 3 5 9.500 5 13.500a5.500 5.500 0 0 0 11 0C16 9.500 10.500 3 10.500 3z" fill="#fff" /><Path d="M8 13.500a2.600 2.600 0 0 0 2.200 2.600" stroke="#b794ff" strokeWidth="1.400" strokeLinecap="round" fill="none" /><Path d="M18 11c0 0-2.800 3.200-2.800 5.200a2.800 2.800 0 0 0 5.600 0C20.800 14.200 18 11 18 11z" fill="#fff" fillOpacity=".7" /></G> },
  inhaler: { c: '#7df0c6', d: <G><Rect x="8" y="2.500" width="6" height="9" rx="1.500" fill="#fff" /><Path d="M7 11h8.500a3 3 0 0 1 3 3v4.500a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" fill="none" stroke="#fff" strokeWidth="1.700" strokeLinejoin="round" /><Path d="M3 14h2M3.500 16.800l1.800-.8M3.500 11.200l1.800.8" stroke="#fff" strokeWidth="1.400" strokeLinecap="round" /></G> },
  cream: { c: '#ff9f7a', d: <G><Path d="M8 3.500h8l-1.500 13h-5z" fill="none" stroke="#fff" strokeWidth="1.700" strokeLinejoin="round" /><Path d="M8 6h8" stroke="#fff" strokeWidth="1.700" /><Rect x="9" y="16.500" width="6" height="4" rx="1" fill="#fff" /><Path d="M12 9v4M10 11h4" stroke="#fff" strokeWidth="1.500" strokeLinecap="round" /></G> },
  vitamin: { c: '#ffd45e', d: <G><Circle cx="12" cy="12" r="8" fill="none" stroke="#fff" strokeWidth="1.700" /><Circle cx="12" cy="12" r="5" fill="#fff" fillOpacity=".25" /><Path d="M12 7v10M7.700 9.500l8.600 5M16.300 9.500l-8.600 5" stroke="#fff" strokeWidth="1.300" strokeLinecap="round" /></G> },
  rbox: { c: '#7c9cff', d: <G fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Rect x="5" y="5" width="14" height="14" rx="3" /></G> },
  rcalm: { c: '#b794ff', d: <G fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M19 14.500A8 8 0 1 1 9.500 5a6.400 6.400 0 0 0 9.500 9.500z" /></G> },
  rwave: { c: '#5ee7df', d: <G fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M3 12q3-6 6 0t6 0 6 0" /><Path d="M3 17q3-6 6 0t6 0 6 0" opacity=".6" /></G> },
  rinf: { c: '#ffc46b', d: <G fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 12c-2-3-3.500-4-5.500-4a4 4 0 0 0 0 8c2 0 3.500-1 5.500-4zm0 0c2 3 3.500 4 5.500 4a4 4 0 0 0 0-8c-2 0-3.500 1-5.500 4z" /></G> },
  rdrop: { c: '#ff8fab', d: <G fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 3.500s6 6.200 6 10.600a6 6 0 0 1-12 0C6 9.700 12 3.500 12 3.500z" /></G> },
  rsit: { c: '#7c9cff', d: <G fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="6" r="2.500" /><Path d="M5 19c2-1 4-1.500 7-1.500s5 .5 7 1.500M8 14c1.500 1 2.500 1.500 4 1.500s2.500-.5 4-1.500" /></G> },
  reye: { c: '#5ee7df', d: <G fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M3 12s3.500-6 9-6 9 6 9 6-3.500 6-9 6-9-6-9-6z" /><Circle cx="12" cy="12" r="2.500" /></G> },
  rbody: { c: '#b794ff', d: <G fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="5" r="2" /><Path d="M12 8v7M7 10h10M9 20l3-5 3 5" /></G> },
  rheart: { c: '#ff8fab', d: <G fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 19s-7-4.500-7-9.500A3.800 3.800 0 0 1 12 8a3.800 3.800 0 0 1 7 1.500C19 14.500 12 19 12 19z" /></G> },
  rzz: { c: '#8fe9e2', d: <G fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M5 6h6l-6 7h6M14 12h5l-5 6h5" /></G> },
  relax: { c: '#8fe9e2', d: <G fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="8" /><Circle cx="12" cy="12" r="3.500" /></G> },
  cycle: { c: '#ff8fab', d: <G fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 3.500s5.500 5.800 5.500 10a5.500 5.500 0 0 1-11 0c0-4.200 5.500-10 5.500-10z" /><Path d="M12 17.500v-4M10 15.500h4" /></G> },
  energy: { c: '#ffc46b', d: <Path d="M13 3L5.500 13H11l-1 8 7.500-10H12z" fill="#fff" /> },
  brain: { c: '#b794ff', d: <G fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 5.500v13" /><Path d="M12 6a3 3 0 0 0-5.600-1.100A3 3 0 0 0 5 10.500 3 3 0 0 0 5.500 15 3 3 0 0 0 9 18.500a3 3 0 0 0 3-1.200" /><Path d="M12 6a3 3 0 0 1 5.600-1.100A3 3 0 0 1 19 10.500 3 3 0 0 1 18.500 15 3 3 0 0 1 15 18.500a3 3 0 0 1-3-1.200" /><Path d="M8.500 10.500H12M15.500 10.500H12" /></G> },
  insight: { c: '#7df0c6', d: <G fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><Path d="M4 17l5-5 3.500 3.500L20 8" /><Path d="M15 8h5v5" /></G> },
};
export function HeadIcon({ k, size = 30 }: { k: string; size?: number }) {
  const ic = ICONS[k]; if (!ic) return null;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.34, backgroundColor: ic.c, alignItems: 'center', justifyContent: 'center', shadowColor: ic.c, shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
      <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 24 24">{ic.d}</Svg>
    </View>
  );
}

export function BrainIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24"><G fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 5.500v13" /><Path d="M12 6a3 3 0 0 0-5.600-1.100A3 3 0 0 0 5 10.500 3 3 0 0 0 5.500 15 3 3 0 0 0 9 18.500a3 3 0 0 0 3-1.200" /><Path d="M12 6a3 3 0 0 1 5.600-1.100A3 3 0 0 1 19 10.500 3 3 0 0 1 18.500 15 3 3 0 0 1 15 18.500a3 3 0 0 1-3-1.200" /><Path d="M8.500 10.500H12M15.500 10.500H12" /></G></Svg>
  );
}
