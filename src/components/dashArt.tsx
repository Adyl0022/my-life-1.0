import React from 'react';
import Svg, { G, Rect, Circle, Path, Polygon, Polyline, Ellipse, Line, Defs, RadialGradient, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { cu } from '../lib/region';

export const PlannerArt = () => (
<Svg width="100%" height="100%" viewBox="0 -8 170 98" preserveAspectRatio="xMidYMid meet">
<Rect x="22" y="14" width="54" height="56" rx="8" fill="#fff" opacity=".93"/>
<Rect x="22" y="14" width="54" height="16" rx="8" fill="#5b7bff"/><Rect x="22" y="22" width="54" height="8" fill="#5b7bff"/>
<Rect x="34" y="8" width="5" height="12" rx="2.5" fill="#fff"/><Rect x="59" y="8" width="5" height="12" rx="2.5" fill="#fff"/>
<Path d="M31 41l4 4 7-8M31 57l4 4 7-8" stroke="#4c6fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
<Path d="M50 42h18M50 58h18" stroke="#c3cfff" strokeWidth="3" strokeLinecap="round"/>
<Rect x="94" y="38" width="52" height="32" rx="5" fill="#fff" opacity=".93"/>
<G transform="rotate(-9 94 36)"><Rect x="92" y="24" width="56" height="12" rx="3" fill="#1a1048"/><Polygon points="100,24 108,24 102,36 94,36" fill="#7c9cff"/><Polygon points="116,24 124,24 118,36 110,36" fill="#7c9cff"/><Polygon points="132,24 140,24 134,36 126,36" fill="#7c9cff"/></G>
<Polygon points="113,48 113,62 126,55" fill="#5b7bff"/>
<Circle cx="156" cy="16" r="3" fill="#fff" opacity=".8"/><Circle cx="10" cy="40" r="2" fill="#fff" opacity=".6"/>
</Svg>
);

export const IslamicArt = () => (
<Svg width="100%" height="100%" viewBox="0 -8 170 98" preserveAspectRatio="xMidYMid meet">
<Rect x="0" y="70" width="170" height="20" fill="#0b3a33" opacity=".45"/>
<Rect x="46" y="48" width="78" height="26" fill="#fff" opacity=".93"/>
<Path d="M54 48a31 31 0 0 1 62 0z" fill="#fff" opacity=".97"/>
<Path d="M85 17v-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
<Path d="M85 4a4 4 0 1 0 3 6 3.2 3.2 0 1 1-3-6z" fill="#fff"/>
<Rect x="24" y="30" width="9" height="44" fill="#fff" opacity=".93"/><Path d="M22 30l6.5-14 6.5 14z" fill="#fff"/>
<Rect x="137" y="30" width="9" height="44" fill="#fff" opacity=".93"/><Path d="M135 30l6.5-14 6.5 14z" fill="#fff"/>
<Path d="M78 74V62a7 7 0 0 1 14 0v12z" fill="#2fb594"/>
<Path d="M14 20a6 6 0 1 0 6 8 5 5 0 1 1-6-8z" fill="#fff" opacity=".85"/>
<Circle cx="158" cy="14" r="2.5" fill="#fff" opacity=".8"/><Circle cx="66" cy="12" r="2" fill="#fff" opacity=".7"/>
</Svg>
);

export const FinanceArt = () => (
<Svg width="100%" height="100%" viewBox="0 -8 170 98" preserveAspectRatio="xMidYMid meet">
<Rect x="20" y="48" width="14" height="24" rx="3" fill="#fff" opacity=".55"/>
<Rect x="40" y="38" width="14" height="34" rx="3" fill="#fff" opacity=".75"/>
<Rect x="60" y="26" width="14" height="46" rx="3" fill="#fff" opacity=".97"/>
<Polyline points="20,36 42,26 66,14" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
<Path d="M57 11l10 2-3 10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
<Ellipse cx="122" cy="68" rx="22" ry="7" fill="#d98f1f"/><Rect x="100" y="58" width="44" height="10" fill="#f4b13d"/><Ellipse cx="122" cy="58" rx="22" ry="7" fill="#ffd27a"/>
<Ellipse cx="122" cy="48" rx="22" ry="7" fill="#d98f1f"/><Rect x="100" y="38" width="44" height="10" fill="#f4b13d"/><Ellipse cx="122" cy="38" rx="22" ry="7" fill="#ffd27a"/>
<Ellipse cx="122" cy="28" rx="22" ry="7" fill="#d98f1f"/><Rect x="100" y="18" width="44" height="10" fill="#f4b13d"/><Ellipse cx="122" cy="18" rx="22" ry="7" fill="#ffe3a0"/>
<SvgText x="122" y="21" textAnchor="middle" fontSize="9" fontWeight="800" fill="#a86a00">{cu().slice(0, 3)}</SvgText>
</Svg>
);

export const RecordArt = () => (
<Svg width="100%" height="100%" viewBox="0 -8 170 98" preserveAspectRatio="xMidYMid meet">
<Rect x="26" y="10" width="64" height="62" rx="8" fill="#fff" opacity=".95"/>
<Rect x="26" y="10" width="11" height="62" rx="5" fill="#ff8fab"/>
<Path d="M48 24h32M48 34h26" stroke="#ffc9d8" strokeWidth="3" strokeLinecap="round"/>
<Rect x="48" y="52" width="7" height="12" rx="2" fill="#ff8fab"/><Rect x="59" y="46" width="7" height="18" rx="2" fill="#b794ff"/><Rect x="70" y="40" width="7" height="24" rx="2" fill="#ff8fab"/>
<Circle cx="126" cy="34" r="24" fill="#fff" opacity=".95"/>
<Path d="M106 44a21 21 0 0 1 40 0" fill="none" stroke="#ff8fab" strokeWidth="5" strokeLinecap="round"/>
<Line x1="126" y1="36" x2="136" y2="24" stroke="#7c5cff" strokeWidth="3" strokeLinecap="round"/><Circle cx="126" cy="36" r="3.5" fill="#7c5cff"/>
<G transform="rotate(-30 124 66)"><Rect x="104" y="62" width="40" height="8" rx="4" fill="#fff"/><Circle cx="104" cy="66" r="8" fill="#fff"/><Circle cx="104" cy="66" r="3.5" fill="#d46aa6"/></G>
<Circle cx="14" cy="18" r="2.5" fill="#fff" opacity=".7"/><Circle cx="158" cy="12" r="2" fill="#fff" opacity=".8"/>
</Svg>
);

export const HabitArt = () => (
<Svg width="100%" height="100%" viewBox="20 0 150 112" preserveAspectRatio="xMidYMid slice">
<Path d="M95 90C64 70 58 50 70 38c9-8 20-3 25 6 5-9 16-14 25-6 12 12 6 32-25 52z" fill="#fff" opacity=".96"/>
<Path d="M95 90C64 70 58 50 70 38c9-8 20-3 25 6z" fill="#ffd0e6" opacity=".6"/>
<Polyline points="14,62 56,62 66,42 80,82 90,54 100,62 176,62" fill="none" stroke="#ff5f8f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
<Path d="M30 16c7 9 10 13 10 18a10 10 0 0 1-20 0c0-5 3-9 10-18z" fill="#bff4f0"/>
<Path d="M156 16a8 8 0 1 0 8 11 6.5 6.5 0 1 1-8-11z" fill="#fff"/>
<Circle cx="170" cy="88" r="3" fill="#fff" opacity=".8"/><Circle cx="20" cy="92" r="2.5" fill="#fff" opacity=".7"/>
</Svg>
);

export const ChipIcon = ({ k }: { k: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {k === 'Planner' && (<G><Rect x="3" y="5" width="18" height="16" rx="3"/><Path d="M8 3v4M16 3v4M3 11h18"/></G>)}
    {k === 'Islamic' && (<G><Path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></G>)}
    {k === 'Finance' && (<G><Path d="M3 7a2 2 0 0 1 2-2h13v3"/><Path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-1"/><Circle cx="16" cy="14" r="1.2"/></G>)}
    {k === 'Record' && (<G><Path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><Path d="M5 17a3 3 0 0 1 3-3h11"/></G>)}
    {k === 'Habit' && (<G><Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></G>)}
  </Svg>
);

export const CARDS = [
  { k: 'Planner', title: 'Daily Planner', sub: 'Events · Tasks', c1: 'rgba(124,156,255,.55)', c2: 'rgba(183,148,255,.35)' },
  { k: 'Islamic', title: 'Islamic Hub', sub: 'Surah · Doa · Zikir', c1: 'rgba(52,211,153,.5)', c2: 'rgba(94,231,223,.3)' },
  { k: 'Finance', title: 'My Finance', sub: 'Income · Spending', c1: 'rgba(255,196,107,.55)', c2: 'rgba(255,143,171,.3)' },
  { k: 'Record', title: 'My Record', sub: 'Logs & records', c1: 'rgba(255,143,171,.55)', c2: 'rgba(183,148,255,.35)' },
  { k: 'Habit', title: 'Habit Tracker & Health', sub: 'Mood · Sleep · Water · Goals', c1: 'rgba(183,148,255,.55)', c2: 'rgba(94,231,223,.3)' },
];

export const HabitBanner = () => (
<Svg width="100%" height="100%" viewBox="0 0 130 130" preserveAspectRatio="xMidYMid meet">
<Defs>
<RadialGradient id="hbglow" cx="0.5" cy="0.5" r="0.5"><Stop offset="0" stopColor="#ff9ec4" stopOpacity=".6"/><Stop offset="1" stopColor="#ff9ec4" stopOpacity="0"/></RadialGradient>
<LinearGradient id="hbheart" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#fff"/><Stop offset="1" stopColor="#ffd0e6"/></LinearGradient>
</Defs>
<Circle cx="65" cy="70" r="60" fill="url(#hbglow)"/>
<Path d="M65 108C31 86 25 64 38 52c10-9 22-3 27 7 5-10 17-16 27-7 13 12 7 34-27 56z" fill="url(#hbheart)"/>
<Polyline points="12,72 42,72 52,50 66,98 78,60 86,72 118,72" fill="none" stroke="#ff5f8f" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"/>
<Path d="M26 12c6 8 9 12 9 16a9 9 0 0 1-18 0c0-4 3-8 9-16z" fill="#bff4f0"/>
<Path d="M108 12a8 8 0 1 0 8 11 6.500 6.500 0 1 1-8-11z" fill="#fff" opacity=".95"/>
<Circle cx="120" cy="104" r="2.600" fill="#fff" opacity=".8"/><Circle cx="10" cy="104" r="2" fill="#fff" opacity=".6"/><Circle cx="66" cy="14" r="2" fill="#fff" opacity=".6"/>
</Svg>
);
