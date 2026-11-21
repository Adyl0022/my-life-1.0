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

// Everything that moves here is driven by the phone's native animation engine (no redraw on every frame), so it stays smooth even on a busy phone.
// Only the small number texts count up, a few times a second.
const ND = Platform.OS !== 'web';
const FLOW_AT = 350, FLOW_MS = 2100;   // the light streams from one account to the other
const eo = (x: number) => 1 - Math.pow(1 - x, 3);
const rnd = (i: number) => { const v = Math.sin(i * 12.9898 + 1.7) * 43758.5453; return v - Math.floor(v); };
const STARS = Array.from({ length: 34 }, (_, i) => ({ x: rnd(i + 1), y: rnd(i + 91), r: 0.7 + rnd(i + 7) * 1.4, g: i % 2 }));
const SPARKS = Array.from({ length: 14 }, (_, i) => ({ a: (i / 14) * 6.2832 + rnd(i) * 0.4, v: 80 + rnd(i + 21) * 90, r: 2 + rnd(i + 41) * 2.4, c: ['#8fe9e2', '#b794ff', '#ffd593', '#ffffff', '#5ee7b5'][i % 5] }));
const PULSES = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ at: i * 0.075, c: i % 3 === 0 ? '#ffd593' : i % 2 ? '#b794ff' : '#8fe9e2', k: i % 2 ? 1 : -1 }));

/** A number that counts up or down while the light flows. It redraws only this small text, about 16 times a second. */
function useTween(from: number, to: number, key: string): number {
  const [v, setV] = useState(from);
  useEffect(() => {
    setV(from);
    if (from === to) return;
    let id: any = null; let t0 = 0;
    const st = setTimeout(() => {
      t0 = Date.now();
      id = setInterval(() => { const k = Math.min(1, (Date.now() - t0) / FLOW_MS); setV(from + (to - from) * eo(k)); if (k >= 1 && id) clearInterval(id); }, 60);
    }, FLOW_AT + 250);
    return () => { clearTimeout(st); if (id) clearInterval(id); };
  }, [key, from, to]);
  return v;
}

export function TransferDone({ info, onClose }: { info: TransferInfo | null; onClose: () => void }) {
  const { width: sw, height: sh } = useWindowDimensions();
  const p = useRef(new Animated.Value(0)).current;    // the light streaming across (0 to 1)
  const b = useRef(new Animated.Value(0)).current;    // the arrival burst
  const tk = useRef(new Animated.Value(0)).current;   // the tick popping in
  const lift = useRef(new Animated.Value(0)).current; // the stage moving up
  const rc = useRef(new Animated.Value(0)).current;   // the receipt
  const bn = useRef(new Animated.Value(0)).current;   // the Done button
  const drift = useRef(new Animated.Value(0)).current; // slow aurora drift, loops
  const twinkle = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const [burst, setBurst] = useState(false); const [ready, setReady] = useState(false);

  const amt = info ? info.amt : 0;
  const shown = useTween(0, amt, info ? info.ref : '');
  const f0 = info && info.fromBal != null ? info.fromBal : 0; const f1 = info && info.fromAfter != null ? info.fromAfter : f0;
  const t0b = info && info.toBal != null ? info.toBal : 0; const t1 = info && info.toAfter != null ? info.toAfter : t0b;
  const fromShown = useTween(f0, f1, info ? 'f' + info.ref : '');
  const toShown = useTween(t0b, t1, info ? 't' + info.ref : '');

  useEffect(() => {
    if (!info) return;
    [p, b, tk, lift, rc, bn].forEach((v) => v.setValue(0)); setBurst(false); setReady(false);
    if (ND) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const tm = (v: Animated.Value, to: number, ms: number, easing = Easing.inOut(Easing.cubic)) => Animated.timing(v, { toValue: to, duration: ms, easing, useNativeDriver: ND });
    const loops = [
      Animated.loop(Animated.timing(drift, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: ND })),
      Animated.loop(Animated.sequence([tm(twinkle, 1, 2600, Easing.inOut(Easing.sin)), tm(twinkle, 0, 2600, Easing.inOut(Easing.sin))])),
      Animated.loop(Animated.timing(ring, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: ND })),
    ];
    drift.setValue(0); twinkle.setValue(0); ring.setValue(0);
    loops.forEach((l) => l.start());
    const run = Animated.sequence([
      Animated.delay(FLOW_AT),
      tm(p, 1, FLOW_MS, Easing.inOut(Easing.quad)),
    ]);
    let dead = false;
    run.start(({ finished }) => {
      if (!finished || dead) return;
      setBurst(true);
      if (ND) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.parallel([
        tm(b, 1, 1100, Easing.out(Easing.cubic)),
        Animated.sequence([Animated.delay(160), Animated.spring(tk, { toValue: 1, friction: 5, tension: 120, useNativeDriver: ND })]),
        Animated.sequence([Animated.delay(900), tm(lift, 1, 650)]),
        Animated.sequence([Animated.delay(1250), tm(rc, 1, 550, Easing.out(Easing.cubic))]),
        Animated.sequence([Animated.delay(1750), tm(bn, 1, 450)]),
      ]).start(() => { if (!dead) setReady(true); });
    });
    return () => { dead = true; run.stop(); loops.forEach((l) => l.stop()); [p, b, tk, lift, rc, bn].forEach((v) => v.stopAnimation()); };
  }, [info]);

  if (!info) return null;
  const W = Math.min(sw - 24, 360); const H = 230;
  const ax = 64, bx = W - 64, cy = 112, R = 33; const span = bx - ax;
  const fc = info.fromC || '#7c9cff', tc = info.toC || '#5ee7df';
  const word = info.pay ? 'Payment' : 'Transfer';
  const rg = (id: string, c: string, c2: string) => (
    <RadialGradient id={id} cx="38%" cy="32%" r="75%"><Stop offset="0" stopColor="#ffffff" stopOpacity={0.95} /><Stop offset="0.45" stopColor={c} stopOpacity={1} /><Stop offset="1" stopColor={c2} stopOpacity={0.7} /></RadialGradient>
  );
  const halo = (id: string, c: string) => (
    <RadialGradient id={id} cx="50%" cy="50%" r="50%"><Stop offset="0.35" stopColor={c} stopOpacity={0.6} /><Stop offset="1" stopColor={c} stopOpacity={0} /></RadialGradient>
  );
  const OS = (R + 26) * 2; // size of an orb with its glow
  const orb = (id: string, c: string, c2: string) => (
    <Svg width={OS} height={OS}>
      <Defs>{rg(id, c, c2)}{halo(id + 'h', c)}</Defs>
      <Circle cx={OS / 2} cy={OS / 2} r={R + 26} fill={`url(#${id}h)`} />
      <Circle cx={OS / 2} cy={OS / 2} r={R} fill={`url(#${id})`} />
      <Circle cx={OS / 2} cy={OS / 2} r={R} fill="none" stroke="rgba(255,255,255,.45)" strokeWidth={1.2} />
    </Svg>
  );
  const abs = { position: 'absolute' as const };
  const Row = ({ k, v, sub }: { k: string; v: string; sub?: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, gap: 12 }}>
      <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 13 }}>{k}</Text>
      <View style={{ flexShrink: 1, alignItems: 'flex-end' }}>
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'right' }}>{v}</Text>
        {sub ? <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11.5, marginTop: 1 }}>{sub}</Text> : null}
      </View>
    </View>
  );
  const drX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -W] });
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={burst ? onClose : undefined}>
      <View style={{ flex: 1, backgroundColor: '#070a22' }}>
        <LinearGradient colors={['#070a22', '#150d3e', '#0a2848']} locations={[0, 0.5, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ ...abs, left: 0, top: 0, right: 0, bottom: 0 }} />
        {/* aurora: big soft colour bands that drift slowly */}
        <Animated.View pointerEvents="none" style={{ ...abs, left: -sw * 0.3, top: sh * 0.08, width: sw * 1.6, height: sh * 0.42, opacity: 0.9, transform: [{ translateX: drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-30, 30, -30] }) }, { rotate: '-8deg' }, { scaleY: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] }) }] }}>
          <LinearGradient colors={['rgba(94,231,223,0)', 'rgba(94,231,223,.2)', 'rgba(183,148,255,.26)', 'rgba(124,156,255,.14)', 'rgba(124,156,255,0)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ flex: 1 }} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={{ ...abs, left: -sw * 0.2, top: sh * 0.5, width: sw * 1.4, height: sh * 0.34, opacity: 0.8, transform: [{ translateX: drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [40, -40, 40] }) }, { rotate: '6deg' }, { scaleY: twinkle.interpolate({ inputRange: [0, 1], outputRange: [1.1, 0.9] }) }] }}>
          <LinearGradient colors={['rgba(183,148,255,0)', 'rgba(183,148,255,.2)', 'rgba(94,231,223,.22)', 'rgba(94,231,223,0)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ flex: 1 }} />
        </Animated.View>
        <Blob size={340} color="rgba(183,148,255,.3)" style={{ right: -110, top: -50 }} />
        <Blob size={360} color="rgba(94,231,223,.2)" style={{ left: -130, bottom: 40 }} />
        {/* stars: two groups that twinkle in turn */}
        {[0, 1].map((g) => (
          <Animated.View key={g} pointerEvents="none" style={{ ...abs, left: 0, top: 0, width: sw, height: sh, opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: g ? [0.9, 0.35] : [0.35, 0.9] }) }}>
            {STARS.filter((s) => s.g === g).map((s, i) => <View key={i} style={{ ...abs, left: s.x * sw, top: s.y * sh, width: s.r * 2, height: s.r * 2, borderRadius: s.r, backgroundColor: '#fff' }} />)}
          </Animated.View>
        ))}
        {/* slow rings spreading out behind the stage */}
        {[0, 1, 2].map((i) => {
          const d = (i / 3);
          return <Animated.View key={i} pointerEvents="none" style={{ ...abs, left: sw / 2 - 150, top: sh * 0.36 - 150, width: 300, height: 300, borderRadius: 150, borderWidth: 1.2, borderColor: '#8fe9e2', opacity: ring.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.2 - d * 0.1, 0] }), transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.25 + d * 0.5, 1.5 + d * 0.5] }) }] }} />;
        })}
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
          <Animated.View style={{ alignItems: 'center', transform: [{ translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -86] }) }, { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) }] }}>
            <View style={{ height: 20, width: W, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={{ ...abs, opacity: b.interpolate({ inputRange: [0, 0.2], outputRange: [1, 0], extrapolate: 'clamp' }) }}><Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 14, fontWeight: '800', letterSpacing: 1.6 }}>{(word === 'Payment' ? 'PAYING' : 'SENDING') + '...'}</Text></Animated.View>
              <Animated.View style={{ ...abs, opacity: b.interpolate({ inputRange: [0.1, 0.4], outputRange: [0, 1], extrapolate: 'clamp' }) }}><Text style={{ color: '#7df0c6', fontSize: 14, fontWeight: '800', letterSpacing: 1.6 }}>{word.toUpperCase() + ' SUCCESSFUL'}</Text></Animated.View>
            </View>
            <Text style={{ color: '#fff', fontSize: 40, fontWeight: '800', marginTop: 6, letterSpacing: 0.4 }}>{cs() + money(burst ? amt : shown)}</Text>
            <View style={{ width: W, height: H, marginTop: 2 }}>
              {/* the aurora ribbon the light travels along */}
              <Animated.View pointerEvents="none" style={{ ...abs, left: ax + R, top: cy - 20, width: span - R * 2, height: 40, overflow: 'hidden', opacity: p.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' }) }}>
                <Animated.View style={{ width: (span - R * 2) * 2, height: 40, transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -(span - R * 2)] }) }] }}>
                  <LinearGradient colors={['rgba(143,233,226,0)', 'rgba(143,233,226,.3)', 'rgba(183,148,255,.34)', 'rgba(143,233,226,.3)', 'rgba(183,148,255,.34)', 'rgba(143,233,226,.3)', 'rgba(143,233,226,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1, borderRadius: 20 }} />
                </Animated.View>
              </Animated.View>
              {/* the light: soft comets that flow from the first account into the second, in a gentle braid */}
              {PULSES.map((q, i) => {
                const a = q.at, z = Math.min(1, a + 0.55);
                const xr = [a, z], yr = [a, a + (z - a) * 0.25, a + (z - a) * 0.5, a + (z - a) * 0.75, z];
                return (
                  <Animated.View key={i} pointerEvents="none" style={{ ...abs, left: ax + R - 30, top: cy - 6, width: 60, height: 12, opacity: p.interpolate({ inputRange: [a, a + 0.06, z - 0.1, z], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' }), transform: [
                    { translateX: p.interpolate({ inputRange: xr, outputRange: [0, span - R * 2], easing: Easing.inOut(Easing.quad), extrapolate: 'clamp' }) },
                    { translateY: p.interpolate({ inputRange: yr, outputRange: [0, q.k * -20, 0, q.k * 20, 0], extrapolate: 'clamp' }) },
                  ] }}>
                    <LinearGradient colors={[q.c + '00', q.c]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1, borderRadius: 6 }} />
                    <View style={{ ...abs, right: 0, top: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff', opacity: 0.95 }} />
                  </Animated.View>
                );
              })}
              {/* the sender orb gives light away, shrinking a little */}
              <Animated.View pointerEvents="none" style={{ ...abs, left: ax - OS / 2, top: cy - OS / 2, transform: [{ scale: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) }] }}>{orb('oA', fc, fc)}</Animated.View>
              {/* the receiver orb pulls the light in: it glows and grows as it fills */}
              <Animated.View pointerEvents="none" style={{ ...abs, left: bx - OS / 2, top: cy - OS / 2, transform: [{ scale: p.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1.04, 1.16] }) }] }}>{orb('oB', tc, tc)}</Animated.View>
              <Animated.View pointerEvents="none" style={{ ...abs, left: bx - OS / 2, top: cy - OS / 2, opacity: b.interpolate({ inputRange: [0, 0.35], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ scale: b.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1.16, 1.3, 1.06] }) }] }}>{orb('oC', '#5ee7b5', '#2fbf8f')}</Animated.View>
              {/* the glow that opens as the light arrives, then the ripples */}
              {[0, 0.12, 0.26].map((d, i) => (
                <Animated.View key={i} pointerEvents="none" style={{ ...abs, left: bx - 40, top: cy - 40, width: 80, height: 80, borderRadius: 40, borderWidth: 2.4, borderColor: i === 1 ? '#8fe9e2' : '#5ee7b5', opacity: b.interpolate({ inputRange: [d, d + 0.08, 1], outputRange: [0, 0.75, 0], extrapolate: 'clamp' }), transform: [{ scale: b.interpolate({ inputRange: [d, 1], outputRange: [0.6, 3.1], extrapolate: 'clamp' }) }] }} />
              ))}
              {SPARKS.map((s, i) => (
                <Animated.View key={i} pointerEvents="none" style={{ ...abs, left: bx - s.r, top: cy - s.r, width: s.r * 2, height: s.r * 2, borderRadius: s.r, backgroundColor: s.c, opacity: b.interpolate({ inputRange: [0, 0.05, 0.7, 1], outputRange: [0, 1, 0.8, 0], extrapolate: 'clamp' }), transform: [
                  { translateX: b.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(s.a) * s.v] }) },
                  { translateY: b.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(s.a) * s.v + 50] }) },
                  { scale: b.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) },
                ] }} />
              ))}
              <Animated.View pointerEvents="none" style={{ ...abs, left: bx - 26, top: cy - 26, width: 52, height: 52, alignItems: 'center', justifyContent: 'center', opacity: tk.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ scale: tk.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }}>
                <Svg width={52} height={52}><Path d="M13 27 L23 37 L40 15" stroke="#fff" strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
              </Animated.View>
              <View pointerEvents="none" style={{ ...abs, left: ax - 48, top: cy + R + 24, width: 96, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'center' }} numberOfLines={2}>{info.from}</Text>
                {info.fromBal != null ? <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 2 }}>{cs() + money(burst ? f1 : fromShown)}</Text> : null}
              </View>
              <View pointerEvents="none" style={{ ...abs, left: bx - 48, top: cy + R + 24, width: 96, alignItems: 'center' }}>
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
