import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

// Small line and solid icons for the Quran Audio screen (drawn, so they look the same on every phone and never turn into coloured emoji).
type P = { size?: number; color?: string };
const S = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24' });
const line = (color: string, w = 2) => ({ stroke: color, strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' });

export const PlayIcon = ({ size = 20, color = '#fff' }: P) => (
  <Svg {...S(size)}><Path d="M8.2 5.6v12.8c0 .8.9 1.3 1.6.9l10-6.4c.6-.4.6-1.3 0-1.7l-10-6.4c-.7-.4-1.6.1-1.6.8z" fill={color} /></Svg>
);
export const PauseIcon = ({ size = 20, color = '#fff' }: P) => (
  <Svg {...S(size)}><Rect x={6.5} y={5} width={4} height={14} rx={1.6} fill={color} /><Rect x={13.5} y={5} width={4} height={14} rx={1.6} fill={color} /></Svg>
);
export const PrevIcon = ({ size = 20, color = '#fff' }: P) => (
  <Svg {...S(size)}><Rect x={5} y={5.5} width={2.2} height={13} rx={1.1} fill={color} /><Path d="M18.6 6.4v11.2c0 .8-.9 1.2-1.5.8l-7.6-5.6c-.5-.4-.5-1.2 0-1.6l7.6-5.6c.6-.4 1.5 0 1.5.8z" fill={color} /></Svg>
);
export const NextIcon = ({ size = 20, color = '#fff' }: P) => (
  <Svg {...S(size)}><Rect x={16.8} y={5.5} width={2.2} height={13} rx={1.1} fill={color} /><Path d="M5.4 6.4v11.2c0 .8.9 1.2 1.5.8l7.6-5.6c.5-.4.5-1.2 0-1.6L6.9 5.6c-.6-.4-1.5 0-1.5.8z" fill={color} /></Svg>
);
export const DownloadIcon = ({ size = 20, color = '#fff' }: P) => (
  <Svg {...S(size)}><Path d="M12 4v10.5m0 0l-4-4m4 4l4-4M5.5 19.5h13" {...line(color, 2)} /></Svg>
);
export const CheckIcon = ({ size = 20, color = '#fff' }: P) => (
  <Svg {...S(size)}><Path d="M5 12.8l4.6 4.6L19 7.8" {...line(color, 2.4)} /></Svg>
);
export const CloseIcon = ({ size = 20, color = '#fff' }: P) => (
  <Svg {...S(size)}><Path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...line(color, 2.2)} /></Svg>
);
export const SearchIcon = ({ size = 20, color = '#fff' }: P) => (
  <Svg {...S(size)}><Circle cx={11} cy={11} r={6.2} {...line(color, 2)} /><Path d="M15.8 15.8l4 4" {...line(color, 2)} /></Svg>
);
