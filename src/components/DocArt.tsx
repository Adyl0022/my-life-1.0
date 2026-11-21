import React from 'react';
import { View, Animated, useWindowDimensions } from 'react-native';
import Svg, { Circle, Ellipse, G, Polygon, Polyline } from 'react-native-svg';
import { useSpin, useSway } from './artMotion';

// Fine security-print art for the Documents page: guilloche rosettes, banknote waves and a seal. Lines only, so text stays easy to read.
// The rosettes turn very slowly in opposite directions, the waves drift side to side and the seal breathes, so the page feels alive.
const T = '#8fe9e2', L = '#b9a6ff', Gd = '#ffd9a8';
function Rosette({ cx, cy, rx, ry, n, col, op }: { cx: number; cy: number; rx: number; ry: number; n: number; col: string; op: number }) {
  return <G>{Array.from({ length: n }, (_, i) => <Ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} rotation={(i * 180) / n} origin={cx + ',' + cy} fill="none" stroke={col} strokeWidth={0.7} strokeOpacity={op} />)}</G>;
}
function Rings({ cx, cy, r0, r1, step, col, op }: { cx: number; cy: number; r0: number; r1: number; step: number; col: string; op: number }) {
  const a: number[] = []; for (let r = r0; r < r1; r += step) a.push(r);
  return <G>{a.map((r) => <Circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={0.6} strokeOpacity={op} />)}</G>;
}
const WAVES = Array.from({ length: 34 }, (_, i) => {
  const y = 560 + (300 * i) / 33, ph = i * 0.22, a = 14 * (0.6 + 0.4 * Math.sin(i * 0.35));
  const pts: string[] = []; for (let x = -50; x <= 440; x += 10) pts.push(x + ',' + (y + a * Math.sin((x / 190) * 2 * Math.PI + ph)).toFixed(1));
  return pts.join(' ');
});
function Star({ cx, cy, r, n }: { cx: number; cy: number; r: number; n: number }) {
  const p: string[] = []; for (let i = 0; i < n * 2; i++) { const a = (Math.PI * i) / n - Math.PI / 2, rr = i % 2 === 0 ? r : r * 0.45; p.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1)); }
  return <Polygon points={p.join(' ')} fill="none" stroke={Gd} strokeWidth={0.8} strokeOpacity={0.5} />;
}
// A layer drawn around its own centre, so it can turn on the spot. (cx, cy) is in the 390 wide drawing; the box is placed to match the page.
function Turn({ at, R, rot, scale, children }: { at: { left?: number; right?: number; top?: number; bottom?: number }; R: number; rot: Animated.AnimatedInterpolation<string>; scale?: Animated.Value | Animated.AnimatedInterpolation<number>; children: (vb: string) => React.ReactNode }) {
  return <Animated.View style={{ position: 'absolute', width: R * 2, height: R * 2, ...at, transform: [{ rotate: rot }, ...(scale ? [{ scale: scale as any }] : [])] }}>{children('')}</Animated.View>;
}
export function DocArt() {
  const { width: W } = useWindowDimensions(); const s = Math.max(W / 390, 1);
  const r1 = useSpin(80, 1), r2 = useSpin(55, -1), r3 = useSpin(90, -1), r4 = useSpin(65, 1), r5 = useSpin(120, 1), r6 = useSpin(75, -1);
  const wv = useSway(14), br = useSway(7), br2 = useSway(9, 2);
  const wx = wv.interpolate({ inputRange: [0, 1], outputRange: [-16, 16] }); const wy = wv.interpolate({ inputRange: [0, 1], outputRange: [3, -3] });
  const sc = br.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.05] }); const sc2 = br2.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] });
  const op = br2.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });
  // top right: the centre of the rosette is (338, 96) in a 390 x 230 drawing, pinned to the top right corner
  const tr = (R: number) => ({ left: s * 338 + (W - 390 * s) - R * s, top: s * 96 - R * s });
  // bottom: drawings are pinned to the bottom left; y counts from the bottom of the 860 high drawing
  const bl = (cx: number, cy: number, R: number) => ({ left: s * cx - R * s, bottom: s * (860 - cy) - R * s });
  const box = (R: number) => ({ width: R * 2 * s, height: R * 2 * s });
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <Turn at={tr(96)} R={96 * s} rot={r1}>{() => <Svg {...box(96)} viewBox="242 0 192 192"><Rosette cx={338} cy={96} rx={92} ry={34} n={28} col={L} op={0.3} /></Svg>}</Turn>
      <Turn at={tr(64)} R={64 * s} rot={r2}>{() => <Svg {...box(64)} viewBox="274 32 128 128"><Rosette cx={338} cy={96} rx={60} ry={22} n={20} col={Gd} op={0.26} /></Svg>}</Turn>
      <Turn at={tr(24)} R={24 * s} rot={r5} scale={sc}>{() => <Svg {...box(24)} viewBox="314 72 48 48"><Rings cx={338} cy={96} r0={8} r1={22} step={3} col={Gd} op={0.3} /></Svg>}</Turn>
      <Animated.View style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: 340, transform: [{ translateX: wx }, { translateY: wy }] }}>
        <Svg width="100%" height={340} viewBox="0 520 390 340" preserveAspectRatio="xMinYMax slice">
          {WAVES.map((p, i) => <Polyline key={i} points={p} fill="none" stroke={T} strokeWidth={0.6} strokeOpacity={0.17} />)}
        </Svg>
      </Animated.View>
      <Turn at={bl(40, 742, 135)} R={135 * s} rot={r3}>{() => <Svg {...box(135)} viewBox="-95 607 270 270"><Rosette cx={40} cy={742} rx={130} ry={46} n={30} col={T} op={0.22} /></Svg>}</Turn>
      <Turn at={bl(40, 742, 90)} R={90 * s} rot={r4}>{() => <Svg {...box(90)} viewBox="-50 652 180 180"><Rosette cx={40} cy={742} rx={84} ry={30} n={22} col={L} op={0.26} /></Svg>}</Turn>
      <Turn at={bl(40, 742, 36)} R={36 * s} rot={r6} scale={sc2}>{() => <Svg {...box(36)} viewBox="4 706 72 72"><Rings cx={40} cy={742} r0={10} r1={34} step={3} col={T} op={0.3} /></Svg>}</Turn>
      <Turn at={bl(318, 742, 70)} R={70 * s} rot={r5}>{() => <Svg {...box(70)} viewBox="248 672 140 140"><Circle cx={318} cy={742} r={66} fill="none" stroke={Gd} strokeWidth={0.8} strokeOpacity={0.3} strokeDasharray="1.5 4" /></Svg>}</Turn>
      <Turn at={bl(318, 742, 60)} R={60 * s} rot={r6} scale={sc2}>{() => <Svg {...box(60)} viewBox="258 682 120 120"><Circle cx={318} cy={742} r={56} fill="none" stroke={Gd} strokeWidth={0.7} strokeOpacity={0.3} /></Svg>}</Turn>
      <Turn at={bl(318, 742, 50)} R={50 * s} rot={r2} scale={sc}>{() => <Svg {...box(50)} viewBox="268 692 100 100"><Rings cx={318} cy={742} r0={10} r1={48} step={4} col={L} op={0.28} /></Svg>}</Turn>
      <Turn at={bl(318, 742, 24)} R={24 * s} rot={r1}>{() => <Svg {...box(24)} viewBox="294 718 48 48"><Star cx={318} cy={742} r={22} n={8} /></Svg>}</Turn>
    </View>
  );
}
