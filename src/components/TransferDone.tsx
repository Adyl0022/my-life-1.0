import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Platform, Animated, Easing, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './Txt';
import { Pressable } from './Press';
import { Glass } from './Glass';
import { Blob } from './Bg';
import * as Haptics from '../lib/haptics';
import { cs } from '../lib/region';

const money = (n: number) => n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export type TransferInfo = { amt: number; from: string; to: string; date: string; ref: string; pay: boolean; fromC?: string; toC?: string; fromBal?: number; toBal?: number; fromAfter?: number; toAfter?: number };

// The same look as before: a braided stream of light between two account orbs, a burst, a tick and a receipt.
// What changed is how it is drawn. Every moving part is planned ahead and handed to the phone's native animation engine,
// so nothing is redrawn on every frame and it stays smooth. Only the small number texts count up, a few times a second.
const ND = Platform.OS !== 'web';
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eio = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const eo = (x: number) => 1 - Math.pow(1 - x, 3);
const rnd = (i: number) => { const v = Math.sin(i * 12.9898 + 1.7) * 43758.5453; return v - Math.floor(v); };

// Timeline, in seconds. The transfer is already saved when this opens; this only shows it.
const N = 24;            // particles in the stream
const T0 = 0.55;         // first particle leaves
const GAP = 0.072;       // time between particles
const D = 1.3;           // time one particle takes to cross
const ARRIVE0 = T0 + D;  // first arrival
const TB = T0 + (N - 1) * GAP + D + 0.05; // last arrival = burst
const TR = 5;            // dots in each particle's tail
const STEP = 0.033;      // spacing of the tail, as a share of the crossing
const BT = 1.5;          // seconds the burst takes (b goes from 0 to 1 over this)
const bt = (sec: number) => clamp(sec / BT);

const STARS = Array.from({ length: 40 }, (_, i) => ({ x: rnd(i + 1), y: rnd(i + 91), r: 0.6 + rnd(i + 7) * 1.5, g: i % 2 }));
const SPARKS = Array.from({ length: 30 }, (_, i) => ({ a: rnd(i + 3) * 6.2832, v: 70 + rnd(i + 21) * 130, r: 1.6 + rnd(i + 41) * 2.6, c: ['#8fe9e2', '#b794ff', '#ffd593', '#ffffff', '#5ee7b5'][i % 5], d: rnd(i + 63) * 0.18 }));

/** A number that counts up or down while the money arrives. It redraws only this small text, about 16 times a second. */
function useTween(from: number, to: number, key: string): number {
  const [v, setV] = useState(from);
  useEffect(() => {
    setV(from);
    if (from === to) return;
    let id: any = null; let t0 = 0;
    const st = setTimeout(() => {
      t0 = Date.now();
      id = setInterval(() => { const k = Math.min(1, (Date.now() - t0) / ((TB - ARRIVE0) * 1000)); setV(from + (to - from) * eo(k)); if (k >= 1 && id) clearInterval(id); }, 60);
    }, ARRIVE0 * 1000);
    return () => { clearTimeout(st); if (id) clearInterval(id); };
  }, [key, from, to]);
  return v;
}

// The sound of coins dropping into a money box. It ends with the last coin as the tick appears.
const COIN = require('../../assets/sounds/coin.wav');
async function playCoin() {
  try {
    if (Platform.OS === 'web') { const src = (typeof COIN === 'string' ? COIN : (COIN && COIN.default) || COIN); const a = new (window as any).Audio(src); a.volume = 0.8; a.play().catch(() => {}); return; }
    const A: any = await import('expo-audio');
    const p = A.createAudioPlayer(COIN); p.volume = 0.8; p.play();
    setTimeout(() => { try { p.remove(); } catch (e) { /* ignore */ } }, 4000);
  } catch (e) { /* no sound is fine */ }
}

/** A ring that fills clockwise from the top while v goes from 0 to 1. Made of two rotating half rings, so it moves on the native engine. */
function Ring({ v, S, w, color, op = 1 }: { v: any; S: number; w: number; color: string; op?: number }) {
  const half = (side: 'r' | 'l') => (
    <View style={{ position: 'absolute', left: side === 'r' ? S / 2 : 0, top: 0, width: S / 2, height: S, overflow: 'hidden' }}>
      <Animated.View style={{ position: 'absolute', left: side === 'r' ? -S / 2 : 0, top: 0, width: S, height: S, transform: [{ rotate: v.interpolate(side === 'r' ? { inputRange: [0, 0.5, 1], outputRange: ['-180deg', '0deg', '0deg'] } : { inputRange: [0, 0.5, 1], outputRange: ['-180deg', '-180deg', '0deg'] }) }] }}>
        <View style={{ position: 'absolute', left: side === 'r' ? S / 2 : 0, top: 0, width: S / 2, height: S, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', left: side === 'r' ? -S / 2 : 0, top: 0, width: S, height: S, borderRadius: S / 2, borderWidth: w, borderColor: color }} />
        </View>
      </Animated.View>
    </View>
  );
  return <View pointerEvents="none" style={{ width: S, height: S, opacity: op }}>{half('r')}{half('l')}</View>;
}

export function TransferDone({ info, onClose }: { info: TransferInfo | null; onClose: () => void }) {
  const { width: sw, height: sh } = useWindowDimensions();
  const T = useRef(new Animated.Value(0)).current;    // the clock, in seconds, until the last light arrives
  const b = useRef(new Animated.Value(0)).current;    // the arrival burst
  const tk = useRef(new Animated.Value(0)).current;   // the tick popping in
  const lift = useRef(new Animated.Value(0)).current; // the stage moving up
  const rc = useRef(new Animated.Value(0)).current;   // the receipt
  const bn = useRef(new Animated.Value(0)).current;   // the Done button
  const twinkle = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const full = useRef(new Animated.Value(1)).current;
  const [burst, setBurst] = useState(false); const [ready, setReady] = useState(false);

  const amt = info ? info.amt : 0;
  const shown = useTween(0, amt, info ? info.ref : '');
  const f0 = info && info.fromBal != null ? info.fromBal : 0; const f1 = info && info.fromAfter != null ? info.fromAfter : f0;
  const t0b = info && info.toBal != null ? info.toBal : 0; const t1 = info && info.toAfter != null ? info.toAfter : t0b;
  const fromShown = useTween(f0, f1, info ? 'f' + info.ref : '');
  const toShown = useTween(t0b, t1, info ? 't' + info.ref : '');

  useEffect(() => {
    if (!info) return;
    [T, b, tk, lift, rc, bn].forEach((v) => v.setValue(0)); setBurst(false); setReady(false);
    if (ND) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const tm = (v: Animated.Value, to: number, ms: number, easing = Easing.inOut(Easing.cubic)) => Animated.timing(v, { toValue: to, duration: ms, easing, useNativeDriver: ND });
    const loops = [
      Animated.loop(Animated.sequence([tm(twinkle, 1, 2600, Easing.inOut(Easing.sin)), tm(twinkle, 0, 2600, Easing.inOut(Easing.sin))])),
      Animated.loop(Animated.timing(ring, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: ND })),
    ];
    twinkle.setValue(0); ring.setValue(0);
    loops.forEach((l) => l.start());
    let dead = false;
    const snd = setTimeout(() => { if (!dead) playCoin(); }, TB * 1000 - 1050);
    const run = tm(T, TB, TB * 1000, Easing.linear);
    run.start(({ finished }) => {
      if (!finished || dead) return;
      setBurst(true);
      if (ND) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.parallel([
        tm(b, 1, BT * 1000, Easing.linear),
        Animated.sequence([Animated.delay(180), Animated.spring(tk, { toValue: 1, friction: 6, tension: 110, useNativeDriver: ND })]),
        Animated.sequence([Animated.delay(650), tm(lift, 1, 600)]),
        Animated.sequence([Animated.delay(950), tm(rc, 1, 550, Easing.out(Easing.cubic))]),
        Animated.sequence([Animated.delay(1500), tm(bn, 1, 500)]),
      ]).start(() => { if (!dead) setReady(true); });
    });
    return () => { dead = true; clearTimeout(snd); run.stop(); loops.forEach((l) => l.stop()); [T, b, tk, lift, rc, bn].forEach((v) => v.stopAnimation()); };
  }, [info]);

  if (!info) return null;
  const W = Math.min(sw - 24, 360); const H = 230;
  const ax = 64, bx = W - 64, cy = 112, R = 33;
  const fc = info.fromC || '#7c9cff', tc = info.toC || '#5ee7df';
  const word = info.pay ? 'Payment' : 'Transfer';
  const abs = { position: 'absolute' as const };

  // the orbs: a glow, a sphere and a thin edge
  const OS = (R + 20) * 2;
  const orb = (id: string, c: string, c2: string) => (
    <Svg width={OS} height={OS}>
      <Defs>
        <RadialGradient id={id} cx="38%" cy="32%" r="75%"><Stop offset="0" stopColor="#ffffff" stopOpacity={0.95} /><Stop offset="0.45" stopColor={c} stopOpacity={1} /><Stop offset="1" stopColor={c2} stopOpacity={0.6} /></RadialGradient>
        <RadialGradient id={id + 'g'} cx="50%" cy="50%" r="50%"><Stop offset="0.55" stopColor={c} stopOpacity={0.55} /><Stop offset="1" stopColor={c} stopOpacity={0} /></RadialGradient>
      </Defs>
      <Circle cx={OS / 2} cy={OS / 2} r={R + 20} fill={`url(#${id}g)`} opacity={0.6} />
      <Circle cx={OS / 2} cy={OS / 2} r={R} fill={`url(#${id})`} />
      <Circle cx={OS / 2} cy={OS / 2} r={R} fill="none" stroke="rgba(255,255,255,.45)" strokeWidth={1.2} />
    </Svg>
  );
  // the thin guide threads behind the stream
  const thread = (k: number) => { let d = ''; for (let q = 0; q <= 40; q++) { const s = q / 40; const e = eio(s); const x = ax + (bx - ax) * e; const y = cy + Math.pow(Math.sin(Math.PI * s), 0.8) * 46 * Math.sin(2 * Math.PI * 1.5 * s + k * Math.PI); d += (q ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } return d; };

  // the braided stream: each particle and its tail follow the same planned path, in time with the clock
  const SM = 28;
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const k = i % 2; const col = i % 5 === 0 ? '#ffd593' : k ? '#b794ff' : '#8fe9e2';
    for (let j = TR - 1; j >= 0; j--) {
      const t0 = T0 + i * GAP + j * STEP * D; const ins: number[] = []; const xs: number[] = []; const ys: number[] = []; const os: number[] = [];
      const f = 1 - j / TR; const base = j === 0 ? 1 : 0.55 * f;
      for (let q = 0; q <= SM; q++) {
        const s = q / SM; const e = eio(s); const env = Math.pow(Math.sin(Math.PI * s), 0.8);
        ins.push(t0 + s * D + q * 1e-6); xs.push((bx - ax) * e); ys.push(env * 46 * Math.sin(2 * Math.PI * (1.5 * s) + k * Math.PI)); os.push(base * clamp(env * 3));
      }
      const rr = (j === 0 ? 3.8 : 3.2) * (0.5 + f * 0.6);
      dots.push(
        <Animated.View key={'d' + i + '_' + j} pointerEvents="none" style={{ ...abs, left: ax - 9, top: cy - 9, width: 18, height: 18, alignItems: 'center', justifyContent: 'center', opacity: T.interpolate({ inputRange: ins, outputRange: os, extrapolate: 'clamp' }), transform: [{ translateX: T.interpolate({ inputRange: ins, outputRange: xs, extrapolate: 'clamp' }) }, { translateY: T.interpolate({ inputRange: ins, outputRange: ys, extrapolate: 'clamp' }) }] }}>
          {j === 0 ? <View style={{ ...abs, left: 0, top: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: col, opacity: 0.2 }} /> : null}
          <View style={{ width: rr * 2, height: rr * 2, borderRadius: rr, backgroundColor: col }} />
        </Animated.View>
      );
    }
  }

  const Row = ({ k, v, sub }: { k: string; v: string; sub?: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, gap: 12 }}>
      <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 13 }}>{k}</Text>
      <View style={{ flexShrink: 1, alignItems: 'flex-end' }}>
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'right' }}>{v}</Text>
        {sub ? <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11.5, marginTop: 1 }}>{sub}</Text> : null}
      </View>
    </View>
  );
  const RS = (R + 9) * 2 + 4; // size of the progress rings
  const left = T.interpolate({ inputRange: [T0, T0 + (N - 1) * GAP + 0.1], outputRange: [1, 0], extrapolate: 'clamp' });    // the sender ring empties
  const arrived = T.interpolate({ inputRange: [ARRIVE0, TB], outputRange: [0, 1], extrapolate: 'clamp' });                 // the receiver ring fills
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={burst ? onClose : undefined}>
      <View style={{ flex: 1, backgroundColor: '#070a22' }}>
        <LinearGradient colors={['#070a22', '#150d3e', '#0a2848']} locations={[0, 0.5, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ ...abs, left: 0, top: 0, right: 0, bottom: 0 }} />
        <Blob size={340} color="rgba(183,148,255,.45)" style={{ right: -110, top: -50 }} />
        <Blob size={360} color="rgba(94,231,223,.28)" style={{ left: -130, bottom: 40 }} />
        {[0, 1].map((g) => (
          <Animated.View key={g} pointerEvents="none" style={{ ...abs, left: 0, top: 0, width: sw, height: sh, opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: g ? [0.9, 0.35] : [0.35, 0.9] }) }}>
            {STARS.filter((s) => s.g === g).map((s, i) => <View key={i} style={{ ...abs, left: s.x * sw, top: s.y * sh, width: s.r * 2, height: s.r * 2, borderRadius: s.r, backgroundColor: '#fff' }} />)}
          </Animated.View>
        ))}
        {[0, 1, 2].map((i) => (
          <Animated.View key={i} pointerEvents="none" style={{ ...abs, left: sw / 2 - 150, top: sh * 0.36 - 150, width: 300, height: 300, borderRadius: 150, borderWidth: 1.2, borderColor: '#8fe9e2', opacity: ring.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.2 - i * 0.05, 0] }), transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.25 + i * 0.5, 1.5 + i * 0.5] }) }] }} />
        ))}
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
          <Animated.View style={{ alignItems: 'center', transform: [{ translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -86] }) }, { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) }] }}>
            <View style={{ height: 20, width: W, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={{ ...abs, opacity: b.interpolate({ inputRange: [0, 0.01], outputRange: [1, 0], extrapolate: 'clamp' }) }}><Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 14, fontWeight: '800', letterSpacing: 1.6 }}>{(word === 'Payment' ? 'PAYING' : 'SENDING') + '...'}</Text></Animated.View>
              <Animated.View style={{ ...abs, opacity: b.interpolate({ inputRange: [0, 0.01], outputRange: [0, 1], extrapolate: 'clamp' }) }}><Text style={{ color: '#7df0c6', fontSize: 14, fontWeight: '800', letterSpacing: 1.6 }}>{word.toUpperCase() + ' SUCCESSFUL'}</Text></Animated.View>
            </View>
            <Text style={{ color: '#fff', fontSize: 40, fontWeight: '800', marginTop: 6, letterSpacing: 0.4 }}>{cs() + money(burst ? amt : shown)}</Text>
            <View style={{ width: W, height: H, marginTop: 2 }}>
              {/* the thin guide threads behind the stream */}
              <Animated.View pointerEvents="none" style={{ ...abs, left: 0, top: 0, width: W, height: H, opacity: T.interpolate({ inputRange: [0, 0.5, TB - 0.02, TB], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' }) }}>
                <Svg width={W} height={H}>
                  <Path d={thread(0)} stroke="#8fe9e2" strokeWidth={1} fill="none" opacity={0.14} />
                  <Path d={thread(1)} stroke="#b794ff" strokeWidth={1} fill="none" opacity={0.14} />
                </Svg>
              </Animated.View>
              {/* the orbs: the sender shrinks a little as it gives, the receiver swells as it fills */}
              <Animated.View pointerEvents="none" style={{ ...abs, left: ax - OS / 2, top: cy - OS / 2, transform: [{ scale: left.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }}>{orb('oA', fc, fc)}</Animated.View>
              <Animated.View pointerEvents="none" style={{ ...abs, left: bx - OS / 2, top: cy - OS / 2, transform: [{ scale: arrived.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }] }}>{orb('oB', tc, tc)}</Animated.View>
              <Animated.View pointerEvents="none" style={{ ...abs, left: bx - OS / 2, top: cy - OS / 2, opacity: b.interpolate({ inputRange: [0, bt(0.35)], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ scale: b.interpolate({ inputRange: [0, bt(0.225), bt(0.45), 1], outputRange: [1.05, 1.25, 1.05, 1.05] }) }] }}>{orb('oC', '#5ee7b5', '#2fbf8f')}</Animated.View>
              {/* the progress rings: the sender's empties, the receiver's fills and turns green */}
              <View pointerEvents="none" style={{ ...abs, left: ax - RS / 2, top: cy - RS / 2 }}><Ring v={left} S={RS} w={3} color={fc} op={0.9} /></View>
              <View pointerEvents="none" style={{ ...abs, left: bx - RS / 2, top: cy - RS / 2 }}><Ring v={arrived} S={RS} w={3} color={tc} op={0.95} /></View>
              <Animated.View pointerEvents="none" style={{ ...abs, left: bx - RS / 2, top: cy - RS / 2, opacity: b.interpolate({ inputRange: [0, 0.01], outputRange: [0, 1], extrapolate: 'clamp' }) }}><Ring v={full} S={RS} w={3} color="#5ee7b5" op={1} /></Animated.View>
              {dots}
              {/* shockwaves when the money arrives */}
              {[0, 0.14, 0.3].map((d, i) => (
                <Animated.View key={i} pointerEvents="none" style={{ ...abs, left: bx - (R + 8), top: cy - (R + 8), width: (R + 8) * 2, height: (R + 8) * 2, borderRadius: R + 8, borderWidth: 2.4, borderColor: i === 1 ? '#8fe9e2' : '#5ee7b5', opacity: b.interpolate({ inputRange: [bt(d), bt(d + 0.12), bt(d + 0.95)], outputRange: [0, 0.8, 0], extrapolate: 'clamp' }), transform: [{ scale: b.interpolate({ inputRange: [bt(d), bt(d + 0.95)], outputRange: [1, 1 + 95 / (R + 8)], extrapolate: 'clamp' }) }] }} />
              ))}
              {/* sparks: they fly out and fall a little */}
              {SPARKS.map((s, i) => {
                const qs = [0, 0.25, 0.5, 0.75, 1].map((u) => u * 1.3); const ins = qs.map((a, n) => bt(s.d + a) + n * 1e-6);
                return (
                  <Animated.View key={i} pointerEvents="none" style={{ ...abs, left: bx - s.r, top: cy - s.r, width: s.r * 2, height: s.r * 2, borderRadius: s.r, backgroundColor: s.c, opacity: b.interpolate({ inputRange: [bt(s.d), bt(s.d) + 0.01, bt(s.d + 1.0), bt(s.d + 1.3)], outputRange: [0, 1, 0.7, 0], extrapolate: 'clamp' }), transform: [
                    { translateX: b.interpolate({ inputRange: ins, outputRange: qs.map((a) => Math.cos(s.a) * s.v * a), extrapolate: 'clamp' }) },
                    { translateY: b.interpolate({ inputRange: ins, outputRange: qs.map((a) => Math.sin(s.a) * s.v * a + 90 * a * a), extrapolate: 'clamp' }) },
                    { scale: b.interpolate({ inputRange: [bt(s.d), bt(s.d + 1.3)], outputRange: [1, 0.3], extrapolate: 'clamp' }) },
                  ] }} />
                );
              })}
              <Animated.View pointerEvents="none" style={{ ...abs, left: bx - 26, top: cy - 26, width: 52, height: 52, alignItems: 'center', justifyContent: 'center', opacity: tk.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ scale: tk.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }}>
                <Svg width={52} height={52}><Path d="M13 27 L23 37 L40 15" stroke="#fff" strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
              </Animated.View>
              <View pointerEvents="none" style={{ ...abs, left: ax - 48, top: cy + R + 20, width: 96, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'center' }} numberOfLines={2}>{info.from}</Text>
                {info.fromBal != null ? <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 2 }}>{cs() + money(burst ? f1 : fromShown)}</Text> : null}
              </View>
              <View pointerEvents="none" style={{ ...abs, left: bx - 48, top: cy + R + 20, width: 96, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'center' }} numberOfLines={2}>{info.to}</Text>
                {info.toBal != null ? <Text style={{ color: burst ? '#9af3d2' : 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 2 }}>{cs() + money(burst ? t1 : toShown)}</Text> : null}
              </View>
            </View>
          </Animated.View>
          <Animated.View style={{ ...abs, left: 24, right: 24, bottom: 0, paddingBottom: 26, opacity: rc, transform: [{ translateY: rc.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }} pointerEvents={burst ? 'auto' : 'none'}>
            <Glass radius={22} style={{ paddingHorizontal: 18, paddingVertical: 8 }}>
              <Row k="From" v={info.from} sub={info.fromBal != null && info.fromAfter != null ? cs() + money(info.fromBal) + '  →  ' + cs() + money(info.fromAfter) : undefined} />
              <Row k={info.pay ? 'Paid to' : 'To'} v={info.to} sub={info.toBal != null && info.toAfter != null ? cs() + money(info.toBal) + '  →  ' + cs() + money(info.toAfter) : undefined} />
              <Row k="Date" v={info.date} />
              <Row k="Reference" v={info.ref} />
            </Glass>
            <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, lineHeight: 16, textAlign: 'center', marginTop: 10 }}>This only moves money between your own accounts inside My Life 1.0. It does not send money at a real bank.</Text>
            <Animated.View style={{ opacity: bn }} pointerEvents={ready ? 'auto' : 'none'}>
              <Pressable onPress={onClose} buzz accessibilityLabel="Done">
                <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ marginTop: 14, paddingVertical: 15, borderRadius: 18, alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Done</Text></LinearGradient>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
