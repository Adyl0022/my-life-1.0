import React from 'react';
import Svg, { Circle, Defs, G, Path, Pattern, Rect } from 'react-native-svg';

export const FinArt = () => (
  <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
    <Defs><Pattern id="fgrid" width="44" height="44" patternUnits="userSpaceOnUse"><Circle cx="22" cy="22" r="14" fill="none" stroke="#fff" strokeWidth=".8" opacity=".08" /><Circle cx="22" cy="22" r="8" fill="none" stroke="#fff" strokeWidth=".8" opacity=".08" /></Pattern></Defs>
    <Rect width="390" height="844" fill="url(#fgrid)" />
    <G fill="#ffc46b" opacity=".15"><Path d="M0 844V760l30-10 30 14 30-30 30 16 30-34 30 20 30-40 30 18 30-36 30 22 30-30 30 14 30-20V844z" /></G>
    <G stroke="#fff" opacity=".35" strokeWidth="1.5" strokeLinecap="round"><Path d="M358 90v10M353 95h10M30 640v8M26 644h8" /></G>
  </Svg>
);
