import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Platform, Animated, Easing, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
// The sound of coins dropping into a money box. It starts as the light begins to arrive and ends with the last coin as the tick appears.
const COIN = require('../../assets/sounds/coin.wav');
async function playCoin() {
  try {
    if (Platform.OS === 'web') { const src = (typeof COIN === 'string' ? COIN : (COIN && COIN.default) || COIN); const a = new (window as any).Audio(src); a.volume = 0.8; a.play().catch(() => {}); return; }
    const A: any = await import('expo-audio');
    const p = A.createAudioPlayer(COIN); p.volume = 0.8; p.play();
    setTimeout(() => { try { p.remove(); } catch (e) { /* ignore */ } }, 4000);
  } catch (e) { /* no sound is fine */ }
}
const eo = (x: number) => 1 - Math.pow(1 - x, 3);
const rnd = (i: number) => { const v = Math.sin(i * 12.9898 + 1.7) * 43758.5453; return v - Math.floor(v); };
const STARS = Array.from({ length: 46 }, (_, i) => ({ x: rnd(i + 1), y: rnd(i + 91), r: 0.7 + rnd(i + 7) * 1.4, g: i % 2 }));
// Confetti that bursts from the receiving card: small bars and diamonds, never dots
const CONF = Array.from({ length: 22 }, (_, i) => ({ a: -Math.PI + (i / 22) * Math.PI + (rnd(i) - 0.5) * 0.35, v: 90 + rnd(i + 21) * 120, w: 4 + rnd(i + 41) * 5, h: 9 + rnd(i + 5) * 8, c: ['#8fe9e2', '#b794ff', '#ffd593', '#ffffff', '#5ee7b5'][i % 5], r: (rnd(i + 9) - 0.5) * 720 }));
// The stream of light: slim streaks with a diamond head, braided in two strands
const PULSES = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ at: i * 0.06, c: i % 3 === 0 ? '#ffd593' : i % 2 ? '#b794ff' : '#8fe9e2', k: i % 2 ? 1 : -1 }));

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
    const snd = setTimeout(() => { if (!dead) playCoin(); }, FLOW_AT + FLOW_MS * 0.5);
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
    return () => { dead = true; clearTimeout(snd); run.stop(); loops.forEach((l) => l.stop()); [p, b, tk, lift, rc, bn].forEach((v) => v.stopAnimation()); };
  }, [info]);

  if (!info) return null;
  const W = Math.min(sw - 24, 360); const H = 300;
  const CW = Math.min(W - 40, 236), CH = 84, CX = (W - CW) / 2; const GAP0 = CH, GAP1 = H - CH; const mid = W / 2;
  const fc = info.fromC || '#7c9cff', tc = info.toC || '#5ee7df';
  const word = info.pay ? 'Payment' : 'Transfer';
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
  // One account card. It shows the account name and its balance, in the colour of its kind of account.
  const Card = ({ label, name, bal, col, tint, w }: { label: string; name: string; bal: number | null; col: string; tint?: boolean; w: number }) => (
    <View style={{ width: w, height: CH, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.4)' }}>
      <LinearGradient colors={tint ? ['#2fd9a0', '#128f72'] : [col, col + '88', '#1b1f55']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ ...abs, left: 0, top: 0, right: 0, bottom: 0 }} />
      <LinearGradient colors={['rgba(255,255,255,.34)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 0.9 }} style={{ ...abs, left: 0, top: 0, right: 0, bottom: 0 }} />
      <View style={{ ...abs, left: 16, top: 14, width: 30, height: 22, borderRadius: 6, overflow: 'hidden' }}>
        <LinearGradient colors={['#ffe9a8', '#d8a94a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
        <View style={{ ...abs, left: 0, right: 0, top: 10, height: 1.2, backgroundColor: 'rgba(120,80,10,.45)' }} />
        <View style={{ ...abs, top: 0, bottom: 0, left: 14, width: 1.2, backgroundColor: 'rgba(120,80,10,.45)' }} />
      </View>
      <Text style={{ ...abs, left: 54, top: 19, color: 'rgba(255,255,255,.85)', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.6 }}>{label}</Text>
      <View style={{ ...abs, left: 16, right: 16, bottom: 11, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <Text numberOfLines={1} style={{ flex: 1, color: '#fff', fontSize: 15, fontWeight: '800' }}>{name}</Text>
        {bal != null ? <Text style={{ color: 'rgba(255,255,255,.92)', fontSize: 13, fontWeight: '700' }}>{cs() + money(bal)}</Text> : null}
      </View>
    </View>
  );
  const lay = { left: CX, width: CW };
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={burst ? onClose : undefined}>
      <View style={{ flex: 1, backgroundColor: '#070a22' }}>
        <LinearGradient colors={['#070a22', '#150d3e', '#0a2848']} locations={[0, 0.5, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ ...abs, left: 0, top: 0, right: 0, bottom: 0 }} />
        <Blob size={340} color="rgba(183,148,255,.45)" style={{ right: -110, top: -50 }} />
        <Blob size={360} color="rgba(94,231,223,.28)" style={{ left: -130, bottom: 40 }} />
        {[0, 1].map((g) => (
          <Animated.View key={g} pointerEvents="none" style={{ ...abs, left: 0, top: 0, width: sw, height: sh, opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: g ? [0.9, 0.35] : [0.35, 0.9] }) }}>
            {STARS.filter((q) => q.g === g).map((q, i) => <View key={i} style={{ ...abs, left: q.x * sw, top: q.y * sh, width: q.r * 2, height: q.r * 2, borderRadius: q.r, backgroundColor: '#fff' }} />)}
          </Animated.View>
        ))}
        {[0, 1, 2].map((i) => (
          <Animated.View key={i} pointerEvents="none" style={{ ...abs, left: sw / 2 - 150, top: sh * 0.4 - 150, width: 300, height: 300, borderRadius: 150, borderWidth: 1.2, borderColor: '#8fe9e2', opacity: ring.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.2 - i * 0.05, 0] }), transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.25 + i * 0.5, 1.5 + i * 0.5] }) }] }} />
        ))}
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
          <Animated.View style={{ alignItems: 'center', transform: [{ translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -128] }) }, { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 0.78] }) }] }}>
            <View style={{ height: 20, width: W, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={{ ...abs, opacity: b.interpolate({ inputRange: [0, 0.2], outputRange: [1, 0], extrapolate: 'clamp' }) }}><Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 14, fontWeight: '800', letterSpacing: 1.6 }}>{(word === 'Payment' ? 'PAYING' : 'SENDING') + '...'}</Text></Animated.View>
              <Animated.View style={{ ...abs, opacity: b.interpolate({ inputRange: [0.1, 0.4], outputRange: [0, 1], extrapolate: 'clamp' }) }}><Text style={{ color: '#7df0c6', fontSize: 14, fontWeight: '800', letterSpacing: 1.6 }}>{word.toUpperCase() + ' SUCCESSFUL'}</Text></Animated.View>
            </View>
            <Text style={{ color: '#fff', fontSize: 40, fontWeight: '800', marginTop: 6, letterSpacing: 0.4 }}>{cs() + money(burst ? amt : shown)}</Text>
            <View style={{ width: W, height: H, marginTop: 10 }}>
              {/* a soft beam of colour down the middle that the light travels along */}
              <Animated.View pointerEvents="none" style={{ ...abs, left: mid - 34, top: GAP0 - 6, width: 68, height: GAP1 - GAP0 + 12, overflow: 'hidden', opacity: p.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' }) }}>
                <Animated.View style={{ width: 68, height: (GAP1 - GAP0) * 2, transform: [{ translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -(GAP1 - GAP0)] }) }] }}>
                  <LinearGradient colors={['rgba(143,233,226,0)', 'rgba(143,233,226,.28)', 'rgba(183,148,255,.3)', 'rgba(143,233,226,.28)', 'rgba(183,148,255,.3)', 'rgba(143,233,226,.28)', 'rgba(143,233,226,0)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ flex: 1 }} />
                </Animated.View>
              </Animated.View>
              {/* the light: slim streaks with a diamond head, braided in two strands from the first card to the second */}
              {PULSES.map((q, i) => {
                const a = q.at, z = Math.min(1, a + 0.55);
                const xr = [a, z], yr = [a, a + (z - a) * 0.25, a + (z - a) * 0.5, a + (z - a) * 0.75, z];
                return (
                  <Animated.View key={i} pointerEvents="none" style={{ ...abs, left: mid - 3, top: GAP0 - 54, width: 6, height: 54, opacity: p.interpolate({ inputRange: [a, a + 0.06, z - 0.1, z], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' }), transform: [
                    { translateY: p.interpolate({ inputRange: xr, outputRange: [0, GAP1 - GAP0 + 54], easing: Easing.inOut(Easing.quad), extrapolate: 'clamp' }) },
                    { translateX: p.interpolate({ inputRange: yr, outputRange: [0, q.k * -26, 0, q.k * 26, 0], extrapolate: 'clamp' }) },
                  ] }}>
                    <LinearGradient colors={[q.c + '00', q.c]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ flex: 1, borderRadius: 3 }} />
                    <View style={{ ...abs, bottom: -2, left: -1, width: 8, height: 8, backgroundColor: '#fff', transform: [{ rotate: '45deg' }], opacity: 0.95 }} />
                  </Animated.View>
                );
              })}
              {/* the first card gives its light away and dims a little */}
              <Animated.View pointerEvents="none" style={{ ...abs, ...lay, top: 0, opacity: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0.78] }), transform: [{ scale: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] }) }] }}>
                <Card label="FROM" name={info.from} bal={info.fromBal != null ? (burst ? f1 : fromShown) : null} col={fc} w={CW} />
              </Animated.View>
              {/* the second card pulls the light in: it brightens and grows as it fills, then turns green */}
              {[0, 0.12, 0.26].map((d, i) => (
                <Animated.View key={i} pointerEvents="none" style={{ ...abs, ...lay, top: GAP1, height: CH, borderRadius: 20, borderWidth: 2.2, borderColor: i === 1 ? '#8fe9e2' : '#5ee7b5', opacity: b.interpolate({ inputRange: [d, d + 0.08, 1], outputRange: [0, 0.8, 0], extrapolate: 'clamp' }), transform: [{ scale: b.interpolate({ inputRange: [d, 1], outputRange: [1, 1.55], extrapolate: 'clamp' }) }] }} />
              ))}
              <Animated.View pointerEvents="none" style={{ ...abs, ...lay, top: GAP1, transform: [{ scale: p.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1.02, 1.07] }) }] }}>
                <Card label={info.pay ? 'PAID TO' : 'TO'} name={info.to} bal={info.toBal != null ? (burst ? t1 : toShown) : null} col={tc} w={CW} />
                <Animated.View style={{ ...abs, left: 0, top: 0, opacity: b.interpolate({ inputRange: [0, 0.35], outputRange: [0, 1], extrapolate: 'clamp' }) }}>
                  <Card label={info.pay ? 'PAID TO' : 'TO'} name={info.to} bal={info.toBal != null ? (burst ? t1 : toShown) : null} col={tc} tint w={CW} />
                </Animated.View>
                {/* a band of light sweeps across the card when the money arrives */}
                <View pointerEvents="none" style={{ ...abs, left: 0, top: 0, width: CW, height: CH, borderRadius: 20, overflow: 'hidden' }}>
                  <Animated.View style={{ ...abs, top: -20, width: 70, height: CH + 40, transform: [{ translateX: b.interpolate({ inputRange: [0, 0.8], outputRange: [-90, CW + 30], extrapolate: 'clamp' }) }, { rotate: '18deg' }], opacity: b.interpolate({ inputRange: [0, 0.1, 0.7, 0.8], outputRange: [0, 0.9, 0.9, 0], extrapolate: 'clamp' }) }}>
                    <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,.55)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
                  </Animated.View>
                </View>
              </Animated.View>
              {CONF.map((c, i) => (
                <Animated.View key={i} pointerEvents="none" style={{ ...abs, left: mid - c.w / 2, top: GAP1 + CH / 2, width: c.w, height: c.h, borderRadius: 2, backgroundColor: c.c, opacity: b.interpolate({ inputRange: [0, 0.05, 0.7, 1], outputRange: [0, 1, 0.85, 0], extrapolate: 'clamp' }), transform: [
                  { translateX: b.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(c.a) * c.v * 1.3] }) },
                  { translateY: b.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, Math.sin(c.a) * c.v, Math.sin(c.a) * c.v + 90] }) },
                  { rotate: b.interpolate({ inputRange: [0, 1], outputRange: ['0deg', c.r + 'deg'] }) },
                ] }} />
              ))}
              {/* the tick sits in a rounded badge on the second card */}
              <Animated.View pointerEvents="none" style={{ ...abs, left: CX + CW - 22, top: GAP1 - 18, width: 44, height: 44, borderRadius: 14, backgroundColor: '#1fbf8a', borderWidth: 2, borderColor: 'rgba(255,255,255,.85)', alignItems: 'center', justifyContent: 'center', opacity: tk.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ scale: tk.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }, { rotate: tk.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '0deg'] }) }] }}>
                <Svg width={28} height={28}><Path d="M6 15 L12 21 L23 8" stroke="#fff" strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
              </Animated.View>
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
