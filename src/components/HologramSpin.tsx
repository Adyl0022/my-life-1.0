import React, { useEffect, useRef } from 'react';
import { View, Animated, PanResponder } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';

// The turning hologram: 36 pictures of the body, one every 10 degrees, stacked on top of each other.
// Only the two pictures nearest the current angle are visible, so it turns smoothly without any 3D engine.
const FR = [
  require('../../assets/holo/f00.png'),
  require('../../assets/holo/f01.png'),
  require('../../assets/holo/f02.png'),
  require('../../assets/holo/f03.png'),
  require('../../assets/holo/f04.png'),
  require('../../assets/holo/f05.png'),
  require('../../assets/holo/f06.png'),
  require('../../assets/holo/f07.png'),
  require('../../assets/holo/f08.png'),
  require('../../assets/holo/f09.png'),
  require('../../assets/holo/f10.png'),
  require('../../assets/holo/f11.png'),
  require('../../assets/holo/f12.png'),
  require('../../assets/holo/f13.png'),
  require('../../assets/holo/f14.png'),
  require('../../assets/holo/f15.png'),
  require('../../assets/holo/f16.png'),
  require('../../assets/holo/f17.png'),
  require('../../assets/holo/f18.png'),
  require('../../assets/holo/f19.png'),
  require('../../assets/holo/f20.png'),
  require('../../assets/holo/f21.png'),
  require('../../assets/holo/f22.png'),
  require('../../assets/holo/f23.png'),
  require('../../assets/holo/f24.png'),
  require('../../assets/holo/f25.png'),
  require('../../assets/holo/f26.png'),
  require('../../assets/holo/f27.png'),
  require('../../assets/holo/f28.png'),
  require('../../assets/holo/f29.png'),
  require('../../assets/holo/f30.png'),
  require('../../assets/holo/f31.png'),
  require('../../assets/holo/f32.png'),
  require('../../assets/holo/f33.png'),
  require('../../assets/holo/f34.png'),
  require('../../assets/holo/f35.png'),
];
const N = FR.length; const FW = 432, FH = 448, FLOOR = 48;

export function HologramSpin({ w, onTap, glow, reduce }: { w: number; onTap: () => void; glow: number; reduce: boolean }) {
  const sc = w / FW; const bh = FH * sc; const H = bh + FLOOR * sc;
  const ops = useRef(FR.map((_, i) => new Animated.Value(i === 2 ? 1 : 0))).current;
  const st = useRef({ ang: 20, vel: 0, drag: false, shown: [2] as number[], reduce }); st.current.reduce = reduce;
  const draw = () => {
    const s = st.current; const p = (((s.ang / 360) * N) % N + N) % N; const i = Math.floor(p) % N; const j = (i + 1) % N; const f = p - Math.floor(p);
    s.shown.forEach((k) => { if (k !== i && k !== j) ops[k].setValue(0); });
    ops[i].setValue(Math.min(1, 2 * (1 - f))); ops[j].setValue(Math.min(1, 2 * f)); s.shown = [i, j];
  };
  useEffect(() => {
    let raf = 0; let last = Date.now(); let dead = false; let skip = false;
    const loop = () => {
      if (dead) return; const now = Date.now(); const dt = Math.min(0.1, (now - last) / 1000); last = now; const s = st.current;
      skip = !skip;
      if (!s.drag) { if (!s.reduce) s.ang += 17 * dt; if (Math.abs(s.vel) > 0.05) { s.ang += s.vel; s.vel *= 0.9; } }
      if (!skip || s.drag) draw();
      raf = requestAnimationFrame(loop);
    };
    draw(); raf = requestAnimationFrame(loop);
    return () => { dead = true; cancelAnimationFrame(raf); };
  }, []);
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true, onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => { const p: any = pan; p.t0 = Date.now(); p.mv = 0; p.last = 0; st.current.drag = true; st.current.vel = 0; },
    onPanResponderMove: (_, g) => { const p: any = pan; const dx = g.dx - (p.last || 0); p.last = g.dx; p.mv += Math.abs(dx); st.current.ang += dx * 0.7; st.current.vel = dx * 0.7; },
    onPanResponderRelease: () => { const p: any = pan; st.current.drag = false; if (Date.now() - p.t0 < 350 && p.mv < 8) { st.current.vel = 0; onTap(); } },
    onPanResponderTerminate: () => { st.current.drag = false; },
  })).current;
  return (
    <View style={{ width: w, height: H, alignSelf: 'center' }}>
      <Svg pointerEvents="none" width={w} height={H} viewBox={'0 0 ' + FW + ' ' + (FH + FLOOR)} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Ellipse cx="216" cy="462" rx="160" ry="18" fill="none" stroke="#5ee7df" strokeOpacity="0.6" strokeWidth="1.6" />
        <Ellipse cx="216" cy="462" rx="120" ry="13" fill="none" stroke="#7c9cff" strokeOpacity="0.6" strokeWidth="1.6" />
        <Ellipse cx="216" cy="462" rx="80" ry="9" fill="none" stroke="#b794ff" strokeOpacity="0.7" strokeWidth="1.6" />
        <Ellipse cx="216" cy="462" rx="40" ry="5" fill="#5ee7df" fillOpacity="0.25" />
      </Svg>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: w, height: bh, opacity: 0.6 + 0.4 * glow }}>
        {FR.map((src, i) => <Animated.Image key={i} source={src} fadeDuration={0} style={{ position: 'absolute', left: 0, top: 0, width: w, height: bh, opacity: ops[i] }} />)}
      </View>
      <View {...pan.panHandlers} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
    </View>
  );
}
