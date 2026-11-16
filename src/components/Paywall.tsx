import React, { useEffect, useState } from 'react';
import { Modal, View, Pressable, ScrollView, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Rect, Circle, Ellipse, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { Text } from './Txt';
import { Glass } from './Glass';
import { PER, usePrice, buyPro, restorePurchases } from '../lib/purchase';

let shown = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
export function openPaywall() { shown = true; emit(); }
function closePaywall() { shown = false; emit(); }

const Lock = ({ s = 16, c = '#fff' }: { s?: number; c?: string }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Rect x="5" y="11" width="14" height="9" rx="2.5" /><Path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>
);

// A human body standing on a hologram projector, with light beams and scan rings.
const BodyHolo = ({ s = 34 }: { s?: number }) => (
  <Svg width={s} height={s} viewBox="4 2 24 28">
    <Defs>
      <SvgGrad id="hb" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#d6fffb" /><Stop offset="1" stopColor="#2fd6c8" /></SvgGrad>
      <SvgGrad id="hl" x1="0" y1="1" x2="0" y2="0"><Stop offset="0" stopColor="#5ee7df" stopOpacity="0.55" /><Stop offset="1" stopColor="#5ee7df" stopOpacity="0" /></SvgGrad>
    </Defs>
    <Path d="M8 27 L11.5 6 H20.5 L24 27 Z" fill="url(#hl)" />
    <Circle cx="16" cy="6.2" r="2.6" fill="url(#hb)" />
    <Path d="M11.6 10.4 C11.6 9.6 12.3 9.1 13.1 9.1 H18.9 C19.7 9.1 20.4 9.6 20.4 10.4 V16 C20.4 16.5 20 16.9 19.5 16.9 C19 16.9 18.7 16.5 18.7 16 V12 H18.2 V21.5 C18.2 22 17.8 22.4 17.3 22.4 C16.8 22.4 16.5 22 16.5 21.5 V16.6 H15.5 V21.5 C15.5 22 15.2 22.4 14.7 22.4 C14.2 22.4 13.8 22 13.8 21.5 V12 H13.3 V16 C13.3 16.5 13 16.9 12.5 16.9 C12 16.9 11.6 16.5 11.6 16 Z" fill="url(#hb)" />
    <Ellipse cx="16" cy="24.2" rx="6" ry="1.7" fill="none" stroke="#5ee7df" strokeWidth="1.1" />
    <Ellipse cx="16" cy="27" rx="9.5" ry="2.5" fill="none" stroke="#2fd6c8" strokeWidth="1.2" />
    <Path d="M9 14.5 H23" stroke="#d6fffb" strokeWidth="0.8" strokeDasharray="1.6 1.6" opacity="0.8" />
  </Svg>
);

const PERKS: { e: string; t: string }[] = [
  { e: '✨', t: 'Assistant' },
  { e: '📊', t: 'Spending & income trends' },
  { e: '👨‍👩‍👧', t: 'Family Planner' },
  { e: '🎧', t: 'Offline Quran recitations' },
  { e: 'holo', t: 'Body hologram' },
  { e: '🔎', t: 'Pattern Finder' },
  { e: '🚗', t: 'Vehicle PDF & categories' },
  { e: '💡', t: 'Every Insights tip' },
];

// Small gold PRO tag that marks a feature of the yearly subscription.
export const ProTag = ({ s = 10 }: { s?: number }) => (
  <View style={{ paddingVertical: 2, paddingHorizontal: 6, borderRadius: 999, backgroundColor: 'rgba(255,196,107,.2)', borderWidth: 1, borderColor: 'rgba(255,196,107,.6)' }}><Text style={{ color: '#ffd9a0', fontSize: s, fontWeight: '800', letterSpacing: 1 }}>PRO</Text></View>
);

// A soft light that sweeps across a surface every few seconds.
export function Shine({ delay = 0 }: { delay?: number }) {
  const x = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(x, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.delay(2600),
      Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [x, delay]);
  const tx = x.interpolate({ inputRange: [0, 1], outputRange: [-160, 420] });
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' }}>
      <Animated.View style={{ position: 'absolute', top: -20, bottom: -20, width: 90, transform: [{ translateX: tx }, { rotate: '18deg' }] }}>
        <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,.34)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}

function Btn({ t, onPress, solid }: { t: string; onPress: () => void; solid?: boolean }) {
  return solid ? (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ borderRadius: 999, overflow: 'hidden', shadowColor: '#2fd6c8', shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}>
      <LinearGradient colors={['#2fd6c8', '#7ff3ea']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 15, alignItems: 'center' }}>
        <Text style={{ color: '#04201f', fontSize: 15.5, fontWeight: '800' }}>{t}</Text>
      </LinearGradient>
      <Shine />
    </Pressable>
  ) : (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ paddingVertical: 12, alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13.5, fontWeight: '700' }}>{t}</Text></Pressable>
  );
}

// Shown on top of the whole app when a locked feature is tapped.
export function PaywallHost() {
  const PRICE = usePrice();
  const [, n] = useState(0); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { const f = () => { n((x) => x + 1); setMsg(''); }; subs.add(f); return () => { subs.delete(f); }; }, []);
  const go = async (fn: typeof buyPro) => { setBusy(true); const r = await fn(); setBusy(false); setMsg(r.msg); if (r.ok) closePaywall(); };
  return (
    <Modal visible={shown} transparent animationType="fade" onRequestClose={closePaywall} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(2,6,14,.9)', justifyContent: 'center', padding: 18 }}>
        <View style={{ borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(94,231,223,.28)', maxHeight: '96%' }}>
          <LinearGradient colors={['#0e4f50', '#0a2230', '#070f1c']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.7 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <LinearGradient pointerEvents="none" colors={['rgba(94,231,223,.30)', 'rgba(94,231,223,0)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 230 }} />
          <LinearGradient pointerEvents="none" colors={['rgba(47,214,200,0)', 'rgba(47,214,200,.14)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 200 }} />
          <ScrollView bounces={false} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#5ee7df', fontSize: 11.5, fontWeight: '800', letterSpacing: 3.5 }}>MY LIFE PRO</Text>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 6, textAlign: 'center' }}>Everything, unlocked</Text>
              <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 13, marginTop: 4 }}>One yearly plan. Cancel anytime.</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12, rowGap: 8 }}>
              {PERKS.map((p) => (
                <View key={p.t} style={{ width: '48.5%', minHeight: 92, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(94,231,223,.22)', backgroundColor: 'rgba(255,255,255,.07)', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 8 }}>
                  {p.e === 'holo' ? <View style={{ height: 34, justifyContent: 'center', marginTop: -2 }}><BodyHolo s={44} /></View> : <Text style={{ fontSize: 26, lineHeight: 32 }}>{p.e}</Text>}
                  <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700', textAlign: 'center', marginTop: 6, lineHeight: 16 }}>{p.t}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 12 }}>
              <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800' }}>{PRICE}</Text>
              <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, fontWeight: '600', marginLeft: 6 }}>{PER}</Text>
            </View>
            {msg ? <Text style={{ color: '#ffd9a0', fontSize: 12.5, marginTop: 10, textAlign: 'center' }}>{msg}</Text> : null}
            <View style={{ marginTop: 14 }}>
              <Btn solid t={busy ? 'Please wait...' : 'Subscribe'} onPress={() => { if (!busy) go(buyPro); }} />
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <Pressable onPress={() => { if (!busy) go(restorePurchases); }} accessibilityRole="button" style={{ paddingVertical: 12, paddingHorizontal: 6 }}><Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13.5, fontWeight: '700' }}>Restore purchase</Text></Pressable>
                <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 13.5 }}>·</Text>
                <Pressable onPress={closePaywall} accessibilityRole="button" style={{ paddingVertical: 12, paddingHorizontal: 6 }}><Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13.5, fontWeight: '700' }}>Not now</Text></Pressable>
              </View>
              <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11.5, textAlign: 'center', marginTop: 2, lineHeight: 16 }}>Renews every year until you cancel. Cancel anytime in Google Play.</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Blurs a card and opens the unlock sheet when tapped. When `on` is false the card is shown as normal.
export function Locked({ on, mt = 0, radius = 24, title, children }: { on: boolean; mt?: number; radius?: number; title?: string; children: React.ReactNode }) {
  const PRICE = usePrice();
  if (!on) return <View style={{ marginTop: mt }}>{children}</View>;
  return (
    <View style={{ marginTop: mt, borderRadius: radius, overflow: 'hidden' }}>
      {/* The real card only sets the size. It is fully hidden, so nothing shows through. */}
      <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ opacity: 0 }}>{children}</View>
      <Pressable onPress={openPaywall} accessibilityRole="button" accessibilityLabel={'Unlock, ' + PRICE + ' ' + PER} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)' }}>
        <LinearGradient colors={['#1d1856', '#151a4a', '#0e2650']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <LinearGradient colors={['rgba(94,231,223,.16)', 'rgba(94,231,223,0)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 90 }} />
        {/* Made-up sample shapes. They are not the person's data. */}
        <View pointerEvents="none" style={{ position: 'absolute', left: 18, right: 18, top: title ? 48 : 18, bottom: 18, overflow: 'hidden' }}>
          {title ? null : (<><View style={{ height: 13, width: '42%', borderRadius: 7, backgroundColor: 'rgba(255,255,255,.2)' }} /><View style={{ height: 8, width: '68%', borderRadius: 4, backgroundColor: 'rgba(255,255,255,.1)', marginTop: 9 }} /></>)}
          {[['34%', '72%'], ['26%', '48%'], ['38%', '86%'], ['30%', '30%'], ['24%', '60%']].map(([a, b], i) => (
            <View key={i} style={{ marginTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ height: 10, width: a as any, borderRadius: 5, backgroundColor: 'rgba(255,255,255,.16)' }} />
                <View style={{ height: 10, width: '14%', borderRadius: 5, backgroundColor: 'rgba(255,255,255,.12)' }} />
              </View>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.08)', marginTop: 8, overflow: 'hidden' }}>
                <LinearGradient colors={['rgba(94,231,223,.55)', 'rgba(124,156,255,.5)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 8, width: b as any, borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </View>
        {title ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: 18, right: 18, top: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14, fontWeight: '800', flex: 1, marginRight: 10 }}>{title}</Text>
            <View style={{ paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999, backgroundColor: 'rgba(94,231,223,.2)', borderWidth: 1, borderColor: 'rgba(94,231,223,.5)' }}><Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.5 }}>PRO</Text></View>
          </View>
        ) : null}
        <Shine delay={400} />
        <LinearGradient pointerEvents="none" colors={['rgba(14,20,56,0)', 'rgba(14,20,56,.82)', 'rgba(14,20,56,0)']} style={{ position: 'absolute', left: 0, right: 0, top: '18%', bottom: '18%' }} />
        <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(14,20,56,.9)', borderWidth: 1, borderColor: 'rgba(124,156,255,.6)' }}><Lock s={22} /></View>
        <View style={{ marginTop: 12, paddingVertical: 9, paddingHorizontal: 18, borderRadius: 999, backgroundColor: 'rgba(14,20,56,.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,.3)' }}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Unlock · {PRICE} {PER}</Text>
        </View>
      </Pressable>
    </View>
  );
}

// A full page shown instead of a locked screen.
export function UnlockPage({ title, text }: { title: string; text: string }) {
  const PRICE = usePrice();
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <LinearGradient colors={['#0a0f2c', '#1a1048', '#0c2b4d']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <SafeAreaView style={{ flex: 1, padding: 22 }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 16 }}><Text style={{ color: '#8fe9e2', fontSize: 15, fontWeight: '700' }}>Back</Text></Pressable>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,156,255,.28)' }}><Lock s={34} /></View>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 20, textAlign: 'center' }}>{title}</Text>
          <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 14.5, marginTop: 10, textAlign: 'center', lineHeight: 21, maxWidth: 320 }}>{text}</Text>
          <Pressable onPress={openPaywall} accessibilityRole="button" style={{ marginTop: 26 }}><LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, paddingHorizontal: 34, borderRadius: 999 }}><Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Subscribe · {PRICE} {PER}</Text></LinearGradient></Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
