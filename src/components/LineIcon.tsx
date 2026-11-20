import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export type LineName =
  | 'passport' | 'mykad' | 'cidb' | 'permit' | 'idother' | 'bank' | 'member' | 'warranty' | 'insurance' | 'agreement' | 'certificate' | 'property' | 'other'
  | 'camera' | 'photo' | 'search' | 'phone' | 'laptop' | 'watch' | 'audio' | 'plug' | 'shoes' | 'bag' | 'shirt' | 'perfume' | 'ring' | 'gift' | 'house' | 'land' | 'rent' | 'shop' | 'building'
  | 'money' | 'tool' | 'swap' | 'bulb';

/** One set of thin line icons for Documents and Personal Collection, so nothing there uses coloured emoji. */
export function LineIcon({ name, c = '#fff', size = 24, w = 1.6 }: { name: string; c?: string; size?: number; w?: number }) {
  const p = { fill: 'none', stroke: c, strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const P = (d: string, k?: number) => <Path key={k} d={d} {...p} />;
  let g: React.ReactNode = null;
  switch (name) {
    case 'passport': g = <><Rect x={5} y={3} width={14} height={18} rx={2.2} {...p} />{P('M12 7.1c-1.2 1.6-1.2 4.6 0 6.2M12 7.1c1.2 1.6 1.2 4.6 0 6.2M9 10.2h6')}<Circle cx={12} cy={10.2} r={3.1} {...p} />{P('M8.7 17h6.6')}</>; break;
    case 'mykad': g = <><Rect x={2.5} y={5.5} width={19} height={13} rx={2.4} {...p} /><Circle cx={8.6} cy={10.8} r={1.8} {...p} />{P('M5.6 15.6c.4-1.7 1.6-2.4 3-2.4s2.6.7 3 2.4M14 10h4.5M14 13.2h4.5')}</>; break;
    case 'cidb': g = <>{P('M5.5 17a6.5 6.5 0 0 1 13 0')}{P('M3.5 17h17v2.2h-17z')}{P('M12 10.6V17M8.6 12v5M15.4 12v5')}</>; break;
    case 'permit': g = <>{P('M7 3h7l4 4v14H7z')}{P('M14 3v4h4')}{P('M9.8 12h5.4M9.8 15.4h5.4')}</>; break;
    case 'idother': g = <><Rect x={4.5} y={3} width={15} height={18} rx={2.4} {...p} />{P('M10 6h4')}<Circle cx={12} cy={11.6} r={2.2} {...p} />{P('M8.3 17.6c.5-1.6 1.8-2.3 3.7-2.3s3.2.7 3.7 2.3')}</>; break;
    case 'bank': g = <><Rect x={2.5} y={5.5} width={19} height={13} rx={2.4} {...p} />{P('M2.5 10h19M6 14.6h4')}</>; break;
    case 'member': g = <><Rect x={3} y={5} width={18} height={14} rx={3} {...p} />{P('M12 8.4l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z')}</>; break;
    case 'warranty': g = <>{P('M6 3h12v18l-2.2-1.5L13.6 21 12 19.5 10.4 21l-2.2-1.5L6 21z')}{P('M9 8h6M9 11.5h6M9 15h3.5')}</>; break;
    case 'insurance': g = <>{P('M12 3l7 2.8v5.4c0 4.4-2.9 7.7-7 9.8-4.1-2.1-7-5.4-7-9.8V5.8z')}{P('M9 12l2.2 2.2 3.9-4.2')}</>; break;
    case 'agreement': g = <>{P('M7 3h7l4 4v14H7z')}{P('M14 3v4h4')}{P('M9.4 16.4c.9-1.6 1.6-1.6 2.2-.4s1.3 1 2.2-.5M9.8 11.5h4.6')}</>; break;
    case 'certificate': g = <><Rect x={3.5} y={4.5} width={17} height={12} rx={2} {...p} /><Circle cx={12} cy={10.5} r={2.3} {...p} />{P('M9.6 16.5l-1 4.5 3.4-1.8 3.4 1.8-1-4.5')}</>; break;
    case 'property': case 'rent': g = <><Circle cx={8} cy={15.5} r={3.6} {...p} />{P('M10.7 12.9L19.6 4M16.6 7l2.3 2.3M14 9.6l1.8 1.8')}</>; break;
    case 'other': g = <>{P('M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z')}</>; break;
    case 'camera': g = <>{P('M3.5 8.5a2 2 0 0 1 2-2h2l1.4-2h6.2l1.4 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z')}<Circle cx={12} cy={13} r={3.4} {...p} /></>; break;
    case 'photo': g = <><Rect x={3.5} y={4.5} width={17} height={15} rx={2.6} {...p} /><Circle cx={9} cy={10} r={1.5} {...p} />{P('M4 17l4.5-4.5 3.5 3.5 2.5-2.5 5.5 5')}</>; break;
    case 'search': g = <><Circle cx={11} cy={11} r={6.2} {...p} />{P('M15.8 15.8l4.7 4.7')}</>; break;
    case 'phone': g = <><Rect x={7} y={2.5} width={10} height={19} rx={2.6} {...p} />{P('M10.5 5.2h3')}<Circle cx={12} cy={18.6} r={0.7} fill={c} /></>; break;
    case 'laptop': g = <><Rect x={4.5} y={5.5} width={15} height={10} rx={1.6} {...p} />{P('M2.5 19h19')}</>; break;
    case 'watch': g = <><Rect x={7.5} y={6.5} width={9} height={11} rx={3} {...p} />{P('M9.5 6.5 10.3 2.5h3.4l.8 4M9.5 17.5l.8 4h3.4l.8-4M12 10v2.3l1.6 1')}</>; break;
    case 'audio': g = <>{P('M4.5 15v-3a7.5 7.5 0 0 1 15 0v3')}<Rect x={3.5} y={14} width={4} height={6.5} rx={1.6} {...p} /><Rect x={16.5} y={14} width={4} height={6.5} rx={1.6} {...p} /></>; break;
    case 'plug': g = <>{P('M9 3v4M15 3v4')}{P('M6.5 7h11v3.5a5.5 5.5 0 0 1-11 0z')}{P('M12 16v5')}</>; break;
    case 'shoes': g = <>{P('M3 18v-5.5l3.6-1 2.6 2.1 5.8 1.2c2.6.5 6 1.2 6 3.2V18z')}{P('M9.2 12.6l1.4-1.6M3 15.6h18')}</>; break;
    case 'bag': g = <><Rect x={4.5} y={8.5} width={15} height={12} rx={2.6} {...p} />{P('M8.5 8.5V7a3.5 3.5 0 0 1 7 0v1.5')}</>; break;
    case 'shirt': g = <>{P('M8.5 3.5l-5 3 2 3.6 2.2-1.2V20.5h8.6V8.9l2.2 1.2 2-3.6-5-3a3.6 3.6 0 0 1-7 0z')}</>; break;
    case 'perfume': g = <><Rect x={6.5} y={10} width={11} height={11} rx={2.6} {...p} /><Rect x={9.5} y={3.5} width={5} height={4} rx={1} {...p} />{P('M10 10V7.5h4V10')}</>; break;
    case 'ring': g = <><Circle cx={12} cy={15} r={5.2} {...p} />{P('M9.3 6.2L12 3l2.7 3.2L12 9.2z')}</>; break;
    case 'gift': g = <><Rect x={3} y={7.5} width={18} height={3.5} rx={1} {...p} />{P('M4.5 11v8.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V11M12 7.5V21')}{P('M12 7.5C9.5 7.5 8 6.7 8 5.4S9.2 3.5 10.4 4.2 12 6.2 12 7.5zM12 7.5c2.5 0 4-.8 4-2.1s-1.2-1.9-2.4-1.2S12 6.2 12 7.5z')}</>; break;
    case 'house': g = <>{P('M3.5 11 12 3.8 20.5 11')}{P('M5.8 9.6V20h12.4V9.6')}{P('M10 20v-5.2h4V20')}</>; break;
    case 'land': g = <>{P('M3 19l6-10 4 6.5 2.3-3.5L21 19z')}{P('M2.5 19h19')}</>; break;
    case 'shop': g = <>{P('M4 9.5l1.2-5h13.6l1.2 5')}{P('M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0')}{P('M5.5 12.5V20h13v-7.5M10 20v-4h4v4')}</>; break;
    case 'building': g = <><Rect x={5.5} y={3.5} width={13} height={17.5} rx={1.6} {...p} />{P('M9 7.5h1.5M13.5 7.5H15M9 11h1.5M13.5 11H15M10.5 21v-3.5h3V21')}</>; break;
    case 'money': g = <><Rect x={3} y={6.5} width={18} height={11} rx={2} {...p} /><Circle cx={12} cy={12} r={2.6} {...p} /></>; break;
    case 'tool': g = <>{P('M14.5 6.5a4 4 0 0 0-5.2 5L3.8 17a1.8 1.8 0 0 0 2.6 2.6l5.5-5.5a4 4 0 0 0 5-5.2l-2.6 2.6-2.4-.6-.6-2.4z')}</>; break;
    case 'swap': g = <>{P('M4 8h14.5')}{P('m15 4.5 3.7 3.5L15 11.5')}{P('M20 16H5.5')}{P('m9 12.5-3.7 3.5L9 19.5')}</>; break;
    case 'bulb': g = <>{P('M9.2 17.2c0-1.6-2.7-2.6-2.7-6a5.5 5.5 0 0 1 11 0c0 3.4-2.7 4.4-2.7 6z')}{P('M9.5 20.2h5M10.4 22.2h3.2')}</>; break;
    default: g = <>{P('M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z')}</>;
  }
  return <Svg width={size} height={size} viewBox="0 0 24 24">{g}</Svg>;
}
