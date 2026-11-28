import React from 'react';
import { View, Animated, Easing, useWindowDimensions } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Polygon, RadialGradient, Defs, Stop } from 'react-native-svg';
import { useSpin, useSway } from './artMotion';

// "Orbit" art for the My Record page, in the same colours as Documents. Lines and light only, so text stays easy to read.
// Top right: a small gyroscope of three tilted rings, each with a bright point that travels round it, around a glowing core.
// Bottom: two sets of rings with their centres a little apart. Where they cross they make a moiré, and it shifts as one set drifts.
// A few small crosses and stars twinkle between. The middle of the page stays empty.
const FLAT = 0.36;
const T = '#8fe9e2', L = '#b9a6ff', Gd = '#ffd9a8';
const poly = (cx: number, cy: number, r: number, n: number, rot: number) => {
  const p: string[] = [];
  for (let i = 0; i < n; i++) { const a = rot + (2 * Math.PI * i) / n; p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); }
  return p.join(' ');
};
// One tilted ring: a flat ellipse, with a bright point that runs round it. The point is moved with its own x and y, so it stays round and sharp.
const STEPS = 24;
function Ring({ R, tilt, col, sec, dir, dotAt }: { R: number; tilt: number; col: string; sec: number; dir: 1 | -1; dotAt: number }) {
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => { const a = Animated.loop(Animated.timing(t, { toValue: 1, duration: sec * 1000, easing: Easing.linear, useNativeDriver: true })); a.start(); return () => a.stop(); }, []);
  const ks = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS);
  const ang = (i: number) => dotAt + dir * (2 * Math.PI * i) / STEPS;
  const x = t.interpolate({ inputRange: ks, outputRange: ks.map((_k, i) => R * Math.cos(ang(i))) });
  const y = t.interpolate({ inputRange: ks, outputRange: ks.map((_k, i) => R * FLAT * Math.sin(ang(i))) });
  const id = 'g' + col.slice(1);
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: R * 2, height: R * 2, transform: [{ rotate: tilt + 'deg' }] }}>
      <Svg width={R * 2} height={R * 2} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Ellipse cx={R} cy={R} rx={R * 0.96} ry={R * 0.96 * FLAT} fill="none" stroke={col} strokeWidth={0.9} strokeOpacity={0.5} />
        <Ellipse cx={R} cy={R} rx={R * 0.88} ry={R * 0.88 * FLAT} fill="none" stroke={col} strokeWidth={0.5} strokeOpacity={0.28} strokeDasharray="1 4" />
      </Svg>
      <Animated.View style={{ position: 'absolute', left: R - 10, top: R - 10, width: 20, height: 20, transform: [{ translateX: Animated.multiply(x, 0.96) }, { translateY: Animated.multiply(y, 0.96) }] }}>
        <Svg width={20} height={20} viewBox="0 0 20 20">
          <Defs><RadialGradient id={id} cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor={col} stopOpacity="0.95" /><Stop offset="1" stopColor={col} stopOpacity="0" /></RadialGradient></Defs>
          <Circle cx={10} cy={10} r={9} fill={'url(#' + id + ')'} /><Circle cx={10} cy={10} r={1.7} fill="#fff" fillOpacity={0.95} />
        </Svg>
      </Animated.View>
    </View>
  );
}
function Moire({ cx, cy, rMax, step, col, op }: { cx: number; cy: number; rMax: number; step: number; col: string; op: number }) {
  const a: number[] = []; for (let r = step; r <= rMax; r += step) a.push(r);
  return <G>{a.map((r) => <Circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={0.55} strokeOpacity={op} />)}</G>;
}
const Cross = ({ x, y, s, c }: { x: number; y: number; s: number; c: string }) => <G><Line x1={x - s} y1={y} x2={x + s} y2={y} stroke={c} strokeWidth={0.9} strokeOpacity={0.6} /><Line x1={x} y1={y - s} x2={x} y2={y + s} stroke={c} strokeWidth={0.9} strokeOpacity={0.6} /></G>;
export function RecordArt2() {
  const { width: W, height: H } = useWindowDimensions();
  const s = Math.max(W / 390, 1);
  const core = useSpin(50, 1), drift = useSway(18), tw1 = useSway(4), tw2 = useSway(6, 1.5), pulse = useSway(5);
  const dx = drift.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] }), dy = drift.interpolate({ inputRange: [0, 1], outputRange: [10, -10] });
  const o1 = tw1.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }), o2 = tw2.interpolate({ inputRange: [0, 1], outputRange: [1, 0.25] });
  const sc = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] });
  const R = 96 * s, CX = W - 66 * s, CY = 70 * s;
  const MR = 230 * s;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {/* moiré, bottom left */}
      <Svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Moire cx={-10 * s} cy={H - 40 * s} rMax={MR} step={8 * s} col={T} op={0.2} />
      </Svg>
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transform: [{ translateX: dx }, { translateY: dy }] }}>
        <Svg width={W} height={H}>
          <Moire cx={46 * s} cy={H - 20 * s} rMax={MR} step={8 * s} col={L} op={0.2} />
        </Svg>
      </Animated.View>
      {/* gyroscope, top right */}
      <View style={{ position: 'absolute', left: CX - R, top: CY - R, width: R * 2, height: R * 2 }}>
        <Ring R={R} tilt={0} col={L} sec={14} dir={1} dotAt={0.6} />
        <Ring R={R} tilt={60} col={T} sec={19} dir={-1} dotAt={2.4} />
        <Ring R={R} tilt={120} col={Gd} sec={11} dir={1} dotAt={4.4} />
        <Animated.View style={{ position: 'absolute', left: R - 24 * s, top: R - 24 * s, width: 48 * s, height: 48 * s, transform: [{ rotate: core }, { scale: sc }] }}>
          <Svg width={48 * s} height={48 * s} viewBox="0 0 48 48">
            <Polygon points={poly(24, 24, 21, 6, 0)} fill="none" stroke={Gd} strokeWidth={1} strokeOpacity={0.7} />
            <Polygon points={poly(24, 24, 13, 3, 0.5)} fill="none" stroke={L} strokeWidth={0.9} strokeOpacity={0.7} />
            <Circle cx={24} cy={24} r={2.4} fill="#fff" fillOpacity={0.95} />
          </Svg>
        </Animated.View>
      </View>
      {/* small stars between */}
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: o1 }}>
        <Svg width={W} height={H}>
          <Cross x={W * 0.12} y={H * 0.36} s={5} c={T} /><Cross x={W * 0.78} y={H * 0.52} s={4} c={L} /><Cross x={W * 0.9} y={H * 0.74} s={6} c={Gd} />
          <Circle cx={W * 0.3} cy={H * 0.5} r={1.4} fill="#fff" fillOpacity={0.6} />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, opacity: o2 }}>
        <Svg width={W} height={H}>
          <Cross x={W * 0.06} y={H * 0.58} s={4} c={Gd} /><Cross x={W * 0.62} y={H * 0.44} s={5} c={T} /><Cross x={W * 0.46} y={H * 0.83} s={4} c={L} />
          <Circle cx={W * 0.86} cy={H * 0.62} r={1.6} fill="#fff" fillOpacity={0.6} /><Circle cx={W * 0.2} cy={H * 0.7} r={1.2} fill="#fff" fillOpacity={0.5} />
        </Svg>
      </Animated.View>
    </View>
  );
}
