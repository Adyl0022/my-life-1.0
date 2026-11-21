import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Platform, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';
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
const END = TB + 3.2;

const STARS = Array.from({ length: 46 }, (_, i) => ({ x: rnd(i + 1), y: rnd(i + 91), r: 0.6 + rnd(i + 7) * 1.5, p: rnd(i + 33) * 6.28, s: 0.8 + rnd(i + 55) * 1.6 }));
const SPARKS = Array.from({ length: 34 }, (_, i) => ({ a: rnd(i + 3) * 6.2832, v: 70 + rnd(i + 21) * 130, r: 1.6 + rnd(i + 41) * 2.6, c: ['#8fe9e2', '#b794ff', '#ffd593', '#ffffff', '#5ee7b5'][i % 5], d: rnd(i + 61) * 0.18 }));

export function TransferDone({ info, onClose }: { info: TransferInfo | null; onClose: () => void }) {
  const { width: sw, height: sh } = useWindowDimensions();
  const [t, setT] = useState(0);
  const buzzed = useRef(false);

  useEffect(() => {
    if (!info) return;
    buzzed.current = false; setT(0);
    const ND = Platform.OS !== 'web';
    if (ND) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    let raf = 0; let last = 0; const t0 = Date.now();
    const loop = () => {
      const now = (Date.now() - t0) / 1000;
      if (now - last >= 0.028 || now >= END) {
        last = now; setT(Math.min(now, END));
        if (!buzzed.current && now >= TB && ND) { buzzed.current = true; Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); }
      }
      if (now < END) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [info]);

  if (!info) return null;
  const W = Math.min(sw - 24, 360); const H = 230;
  const ax = 64, bx = W - 64, cy = 112, R = 33;
  const fc = info.fromC || '#7c9cff', tc = info.toC || '#5ee7df';
  const word = info.pay ? 'Payment' : 'Transfer';
  const burst = t >= TB; const bt = Math.max(0, t - TB);

  // how much has arrived (0..1), how much has left (0..1)
  const arrived = clamp((t - ARRIVE0) / (TB - ARRIVE0)); const left = clamp((t - T0) / ((N - 1) * GAP + 0.1));
  const flowing = clamp(t / 0.5) * (burst ? 0 : 1);
  const amtShown = info.amt * eo(arrived) * (burst ? 1 : 1);
  const fromShown = info.fromBal != null ? info.fromBal - (info.fromBal - (info.fromAfter != null ? info.fromAfter : info.fromBal)) * eo(arrived) : null;
  const toShown = info.toBal != null ? info.toBal + ((info.toAfter != null ? info.toAfter : info.toBal) - info.toBal) * eo(arrived) : null;

  // the stage moves up when the receipt comes in
  const lift = eio(clamp((t - (TB + 0.65)) / 0.6));
  const stageY = -86 * lift; const stageK = 1 - 0.1 * lift;
  const pop = burst ? 1 + 0.2 * Math.sin(clamp(bt / 0.45) * Math.PI) : 1 + 0.05 * arrived;
  const green = eo(clamp(bt / 0.35));
  const tick = eo(clamp((bt - 0.18) / 0.42));
  const rec = eo(clamp((t - (TB + 0.95)) / 0.55));
  const btn = eo(clamp((t - (TB + 1.5)) / 0.5));

  // the braided stream
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const s0 = (t - (T0 + i * GAP)) / D; if (s0 < 0 || s0 > 1.02) continue;
    const k = i % 2; const col = i % 5 === 0 ? '#ffd593' : k ? '#b794ff' : '#8fe9e2';
    for (let j = 6; j >= 0; j--) {
      const s = s0 - j * 0.022; if (s < 0 || s > 1) continue;
      const e = eio(s); const env = Math.pow(Math.sin(Math.PI * s), 0.8);
      const x = ax + (bx - ax) * e; const y = cy + env * 46 * Math.sin(2 * Math.PI * (1.5 * s) + k * Math.PI);
      const f = 1 - j / 7;
      dots.push(<Circle key={'g' + i + '_' + j} cx={x} cy={y} r={(j === 0 ? 3.8 : 3.2) * (0.5 + f * 0.6)} fill={col} opacity={(j === 0 ? 1 : 0.55 * f) * clamp(env * 3)} />);
      if (j === 0) dots.push(<Circle key={'h' + i} cx={x} cy={y} r={9} fill={col} opacity={0.2 * clamp(env * 3)} />);
    }
  }
  // the thin guide threads behind the stream
  const thread = (k: number) => { let d = ''; for (let q = 0; q <= 40; q++) { const s = q / 40; const e = eio(s); const x = ax + (bx - ax) * e; const y = cy + Math.pow(Math.sin(Math.PI * s), 0.8) * 46 * Math.sin(2 * Math.PI * 1.5 * s + k * Math.PI); d += (q ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '; } return d; };

  // sparks after the arrival
  const sparks = burst ? SPARKS.map((p, i) => { const a = bt - p.d; if (a < 0 || a > 1.5) return null; const x = bx + Math.cos(p.a) * p.v * a; const y = cy + Math.sin(p.a) * p.v * a + 90 * a * a; return <Circle key={'sp' + i} cx={x} cy={y} r={p.r * (1 - a / 1.6)} fill={p.c} opacity={clamp(1 - a / 1.4)} />; }) : null;
  const waves = burst ? [0, 0.14, 0.3].map((d, i) => { const a = clamp((bt - d) / 0.95); if (a <= 0 || a >= 1) return null; return <Circle key={'w' + i} cx={bx} cy={cy} r={R + 8 + eo(a) * 95} stroke={i === 1 ? '#8fe9e2' : '#5ee7b5'} strokeWidth={2.4 * (1 - a) + 0.4} fill="none" opacity={0.75 * (1 - a)} />; }) : null;

  const C = 2 * Math.PI * (R + 9);
  const orbR = (cx: number, id: string, k: number) => (
    <G transform={`translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})`}>
      <Circle cx={cx} cy={cy} r={R + 20} fill={`url(#${id}g)`} opacity={0.55} />
      <Circle cx={cx} cy={cy} r={R} fill={`url(#${id})`} />
      <Circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,.45)" strokeWidth={1.2} />
    </G>
  );
  const bgRings = [0, 1, 2].map((i) => { const a = ((t * 0.18 + i / 3) % 1); return <Circle key={'bg' + i} cx={sw / 2} cy={sh * 0.36} r={40 + a * Math.max(sw, sh) * 0.62} stroke="#8fe9e2" strokeWidth={1.2} fill="none" opacity={0.18 * (1 - a) * (burst ? 0.5 : 1)} />; });
  const stars = STARS.map((p, i) => <Circle key={'st' + i} cx={p.x * sw} cy={p.y * sh} r={p.r} fill="#fff" opacity={0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * p.s + p.p))} />);

  const dots3 = '.'.repeat(1 + (Math.floor(t * 2.6) % 3));
  const Row = ({ k, v, sub }: { k: string; v: string; sub?: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, gap: 12 }}>
      <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 13 }}>{k}</Text>
      <View style={{ flexShrink: 1, alignItems: 'flex-end' }}>
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'right' }}>{v}</Text>
        {sub ? <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11.5, marginTop: 1 }}>{sub}</Text> : null}
      </View>
    </View>
  );
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={burst ? onClose : undefined}>
      <View style={{ flex: 1, backgroundColor: '#070a22' }}>
        <LinearGradient colors={['#070a22', '#150d3e', '#0a2848']} locations={[0, 0.5, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <Blob size={340} color="rgba(183,148,255,.45)" style={{ right: -110, top: -50 }} />
        <Blob size={360} color="rgba(94,231,223,.28)" style={{ left: -130, bottom: 40 }} />
        <Svg width={sw} height={sh} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">{bgRings}{stars}</Svg>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
          <View style={{ alignItems: 'center', transform: [{ translateY: stageY }, { scale: stageK }] }}>
            <Text style={{ color: burst ? '#7df0c6' : 'rgba(255,255,255,.85)', fontSize: 14, fontWeight: '800', letterSpacing: 1.6, opacity: 1 }}>{burst ? word.toUpperCase() + ' SUCCESSFUL' : (word === 'Payment' ? 'PAYING' : 'SENDING') + dots3}</Text>
            <Text style={{ color: '#fff', fontSize: 40, fontWeight: '800', marginTop: 6, letterSpacing: 0.4 }}>{cs() + money(amtShown)}</Text>
            <View style={{ width: W, height: H, marginTop: 2 }}>
              <Svg width={W + 140} height={H + 140} style={{ position: 'absolute', left: -70, top: -70 }} pointerEvents="none">
                <G transform="translate(70 70)">
                <Defs>
                  <RadialGradient id="ogA" cx="38%" cy="32%" r="75%"><Stop offset="0" stopColor="#ffffff" stopOpacity={0.95} /><Stop offset="0.45" stopColor={fc} stopOpacity={1} /><Stop offset="1" stopColor={fc} stopOpacity={0.55} /></RadialGradient>
                  <RadialGradient id="ogAg" cx="50%" cy="50%" r="50%"><Stop offset="0.55" stopColor={fc} stopOpacity={0.55} /><Stop offset="1" stopColor={fc} stopOpacity={0} /></RadialGradient>
                  <RadialGradient id="ogB" cx="38%" cy="32%" r="75%"><Stop offset="0" stopColor="#ffffff" stopOpacity={0.95} /><Stop offset="0.45" stopColor={tc} stopOpacity={1} /><Stop offset="1" stopColor={tc} stopOpacity={0.55} /></RadialGradient>
                  <RadialGradient id="ogBg" cx="50%" cy="50%" r="50%"><Stop offset="0.55" stopColor={tc} stopOpacity={0.55} /><Stop offset="1" stopColor={tc} stopOpacity={0} /></RadialGradient>
                  <RadialGradient id="ogC" cx="38%" cy="32%" r="75%"><Stop offset="0" stopColor="#ffffff" stopOpacity={0.95} /><Stop offset="0.45" stopColor="#5ee7b5" stopOpacity={1} /><Stop offset="1" stopColor="#2fbf8f" stopOpacity={1} /></RadialGradient>
                  <RadialGradient id="ogCg" cx="50%" cy="50%" r="50%"><Stop offset="0.55" stopColor="#5ee7b5" stopOpacity={0.6} /><Stop offset="1" stopColor="#5ee7b5" stopOpacity={0} /></RadialGradient>
                </Defs>
                {!burst ? (<><Path d={thread(0)} stroke="#8fe9e2" strokeWidth={1} fill="none" opacity={0.14 * flowing} /><Path d={thread(1)} stroke="#b794ff" strokeWidth={1} fill="none" opacity={0.14 * flowing} /></>) : null}
                {orbR(ax, 'ogA', 1 - 0.1 * left)}
                {orbR(bx, 'ogB', pop)}
                {burst ? <G opacity={green}><G transform={`translate(${bx} ${cy}) scale(${pop}) translate(${-bx} ${-cy})`}><Circle cx={bx} cy={cy} r={R + 20} fill="url(#ogCg)" /><Circle cx={bx} cy={cy} r={R} fill="url(#ogC)" /></G></G> : null}
                <Circle cx={ax} cy={cy} r={R + 9} stroke={fc} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.9} strokeDasharray={`${Math.max(0.1, C * (1 - left))} ${C}`} transform={`rotate(-90 ${ax} ${cy})`} />
                <Circle cx={bx} cy={cy} r={R + 9} stroke={burst ? '#5ee7b5' : tc} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.95} strokeDasharray={`${Math.max(0.1, C * (burst ? 1 : arrived))} ${C}`} transform={`rotate(-90 ${bx} ${cy})`} />
                {dots}
                {waves}
                {sparks}
                {burst ? <Path d={`M${bx - 13} ${cy + 1} L${bx - 3} ${cy + 11} L${bx + 14} ${cy - 10}`} stroke="#fff" strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray="44" strokeDashoffset={44 * (1 - tick)} opacity={tick > 0 ? 1 : 0} /> : null}
                </G>
              </Svg>
              <View pointerEvents="none" style={{ position: 'absolute', left: ax - 48, top: cy + R + 20, width: 96, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'center' }} numberOfLines={2}>{info.from}</Text>
                {fromShown != null ? <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 2 }}>{cs() + money(fromShown)}</Text> : null}
              </View>
              <View pointerEvents="none" style={{ position: 'absolute', left: bx - 48, top: cy + R + 20, width: 96, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'center' }} numberOfLines={2}>{info.to}</Text>
                {toShown != null ? <Text style={{ color: burst ? '#9af3d2' : 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 2 }}>{cs() + money(toShown)}</Text> : null}
              </View>
            </View>
          </View>
          <View style={{ position: 'absolute', left: 24, right: 24, bottom: 0, paddingBottom: 26, opacity: rec, transform: [{ translateY: 18 * (1 - rec) }] }} pointerEvents={rec > 0.5 ? 'auto' : 'none'}>
            <Glass radius={22} style={{ paddingHorizontal: 18, paddingVertical: 8 }}>
              <Row k="From" v={info.from} sub={info.fromBal != null && info.fromAfter != null ? cs() + money(info.fromBal) + '  →  ' + cs() + money(info.fromAfter) : undefined} />
              <Row k={info.pay ? 'Paid to' : 'To'} v={info.to} sub={info.toBal != null && info.toAfter != null ? cs() + money(info.toBal) + '  →  ' + cs() + money(info.toAfter) : undefined} />
              <Row k="Date" v={info.date} />
              <Row k="Reference" v={info.ref} />
            </Glass>
            <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, lineHeight: 16, textAlign: 'center', marginTop: 10 }}>This only moves money between your own accounts inside My Life 1.0. It does not send money at a real bank.</Text>
            <View style={{ opacity: btn }} pointerEvents={btn > 0.5 ? 'auto' : 'none'}>
              <Pressable onPress={onClose} buzz accessibilityLabel="Done">
                <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ marginTop: 14, paddingVertical: 15, borderRadius: 18, alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Done</Text></LinearGradient>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
