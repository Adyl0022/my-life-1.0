import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export type ColIconName = 'gadget' | 'life' | 'prop' | 'lent' | 'less' | 'watch' | 'laptop' | 'cash' | 'tool' | 'audio';
/** Thin line icons for Personal Collection. */
export function ColIcon({ name, c = '#fff', size = 26 }: { name: ColIconName; c?: string; size?: number }) {
  const p = { fill: 'none', stroke: c, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'gadget' ? <><Rect x={7} y={2.5} width={10} height={19} rx={2.6} {...p} /><Path d="M10.5 5.2h3" {...p} /><Circle cx={12} cy={18.6} r={0.7} fill={c} /></> : null}
      {name === 'life' ? <><Path d="M5.5 8.5h13l-1 11.2a1.5 1.5 0 0 1-1.5 1.3H8a1.5 1.5 0 0 1-1.5-1.3z" {...p} /><Path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" {...p} /></> : null}
      {name === 'prop' ? <><Path d="M3.5 11 12 3.8 20.5 11" {...p} /><Path d="M5.8 9.6V20h12.4V9.6" {...p} /><Path d="M10 20v-5.2h4V20" {...p} /></> : null}
      {name === 'lent' ? <><Path d="M4 8h14.5" {...p} /><Path d="m15 4.5 3.7 3.5L15 11.5" {...p} /><Path d="M20 16H5.5" {...p} /><Path d="m9 12.5-3.7 3.5L9 19.5" {...p} /></> : null}
      {name === 'less' ? <><Path d="M9.2 17.2c0-1.6-2.7-2.6-2.7-6a5.5 5.5 0 0 1 11 0c0 3.4-2.7 4.4-2.7 6z" {...p} /><Path d="M9.5 20.2h5" {...p} /><Path d="M10.4 22.2h3.2" {...p} /></> : null}
      {name === 'watch' ? <><Rect x={7.5} y={6.5} width={9} height={11} rx={3} {...p} /><Path d="M9.5 6.5 10.3 2.5h3.4l.8 4M9.5 17.5l.8 4h3.4l.8-4" {...p} /><Path d="M12 10v2.3l1.6 1" {...p} /></> : null}
      {name === 'laptop' ? <><Rect x={4.5} y={5.5} width={15} height={10} rx={1.6} {...p} /><Path d="M2.5 19h19" {...p} /></> : null}
      {name === 'cash' ? <><Rect x={3} y={6.5} width={18} height={11} rx={2} {...p} /><Circle cx={12} cy={12} r={2.6} {...p} /></> : null}
      {name === 'tool' ? <Path d="M14.5 6.5a4 4 0 0 0-5.2 5L3.8 17a1.8 1.8 0 0 0 2.6 2.6l5.5-5.5a4 4 0 0 0 5-5.2l-2.6 2.6-2.4-.6-.6-2.4z" {...p} /> : null}
      {name === 'audio' ? <><Path d="M4.5 15v-3a7.5 7.5 0 0 1 15 0v3" {...p} /><Rect x={3.5} y={14} width={4} height={6.5} rx={1.6} {...p} /><Rect x={16.5} y={14} width={4} height={6.5} rx={1.6} {...p} /></> : null}
    </Svg>
  );
}
