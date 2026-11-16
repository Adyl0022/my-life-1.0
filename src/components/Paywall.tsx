import React, { useEffect, useState } from 'react';
import { Modal, View, Pressable, ScrollView, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
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

// Modern line icons with a teal gradient stroke.
function Ico({ k }: { k: string }) {
  const sp = { fill: 'rgba(255,255,255,.28)', stroke: '#fff', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      {k === 'assistant' && (<><Path {...sp} d="M10 3l1.9 5.1L17 10l-5.1 1.9L10 17l-1.9-5.1L3 10l5.1-1.9z" /><Path {...sp} d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z" /></>)}
      {k === 'chart' && (<><Rect {...sp} x="4" y="12" width="4" height="8" rx="1.2" /><Rect {...sp} x="10" y="4" width="4" height="16" rx="1.2" /><Rect {...sp} x="16" y="9" width="4" height="11" rx="1.2" /></>)}
      {k === 'family' && (<><Circle {...sp} cx="9" cy="8" r="3" /><Path {...sp} d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><Circle {...sp} cx="17.5" cy="9" r="2.3" /><Path {...sp} d="M17 14.3c2.5.2 4.5 2.2 4.5 4.7" /></>)}
      {k === 'quran' && (<><Path {...sp} d="M4 14v-2a8 8 0 0 1 16 0v2" /><Rect {...sp} x="3" y="14" width="4" height="6" rx="2" /><Rect {...sp} x="17" y="14" width="4" height="6" rx="2" /></>)}
      {k === 'body' && (<><Circle {...sp} cx="12" cy="5" r="2.4" /><Path {...sp} d="M8 10.5l4 1 4-1M12 11.5V16M9.5 15.5L12 16l2.5-.5" /><Path {...sp} d="M4 20c2.5 1.6 13.5 1.6 16 0M7 18.2c2.8 1 7.2 1 10 0" /></>)}
      {k === 'pattern' && (<><Circle {...sp} cx="11" cy="11" r="6" /><Path {...sp} d="M20 20l-4.3-4.3M8.5 11.5l1.8 1.8L14 9" /></>)}
      {k === 'car' && (<><Path {...sp} d="M4 15v-3l2-5h12l2 5v3z" /><Circle {...sp} cx="7.5" cy="17.5" r="1.6" /><Circle {...sp} cx="16.5" cy="17.5" r="1.6" /></>)}
      {k === 'tip' && (<><Path {...sp} d="M9 18h6M10 21h4" /><Path {...sp} d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></>)}
    </Svg>
  );
}

const GRAD: Record<string, [string, string]> = {
  assistant: ['#7f9bff', '#4b5cf0'],
  chart: ['#3ee0b4', '#12a37f'],
  family: ['#ff9db8', '#e8527f'],
  quran: ['#4fd8f0', '#1b8fd0'],
  body: ['#5ee7df', '#17a6a0'],
  pattern: ['#c39bff', '#8a4fe0'],
  car: ['#ffb86b', '#ee7d2a'],
  tip: ['#ffe27a', '#f0a81c'],
};

const PERKS: { k: string; t: string }[] = [
  { k: 'assistant', t: 'My Life Assistant' },
  { k: 'chart', t: 'Spending and income trends' },
  { k: 'family', t: 'Family Planner' },
  { k: 'quran', t: 'Offline Quran recitations' },
  { k: 'body', t: 'Body hologram' },
  { k: 'pattern', t: 'Pattern Finder' },
  { k: 'car', t: 'Vehicle PDF and categories' },
  { k: 'tip', t: 'Every Insights tip' },
];

// A soft light that sweeps across a surface every few seconds.
function Shine({ delay = 0 }: { delay?: number }) {
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
                <View key={p.k} style={{ width: '48.5%', minHeight: 84, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(94,231,223,.22)', backgroundColor: 'rgba(255,255,255,.07)', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, paddingHorizontal: 8 }}>
                  <LinearGradient colors={GRAD[p.k]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: GRAD[p.k][1], shadowOpacity: 0.75, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,.45)', overflow: 'hidden' }}><View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 22, backgroundColor: 'rgba(255,255,255,.26)' }} /><Ico k={p.k} /></LinearGradient>
                  <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700', textAlign: 'center', marginTop: 8, lineHeight: 16 }}>{p.t}</Text>
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
              <Btn t="Restore purchase" onPress={() => { if (!busy) go(restorePurchases); }} />
              <Btn t="Not now" onPress={closePaywall} />
              <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11.5, textAlign: 'center', marginTop: 2, lineHeight: 16 }}>Renews every year until you cancel. Cancel anytime in Google Play. Your data stays with you if you stop.</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Blurs a card and opens the unlock sheet when tapped. When `on` is false the card is shown as normal.
export function Locked({ on, mt = 0, radius = 24, children }: { on: boolean; mt?: number; radius?: number; children: React.ReactNode }) {
  const PRICE = usePrice();
  if (!on) return <View style={{ marginTop: mt }}>{children}</View>;
  return (
    <View style={{ marginTop: mt, borderRadius: radius, overflow: 'hidden' }}>
      <View pointerEvents="none" style={{ opacity: 0.55 }}>{children}</View>
      <Pressable onPress={openPaywall} accessibilityRole="button" accessibilityLabel={'Unlock, ' + PRICE + ' ' + PER} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <BlurView intensity={26} tint="dark" pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(10,15,44,.78)', borderWidth: 1, borderColor: 'rgba(255,255,255,.3)' }}>
          <Lock s={15} /><Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Unlock · {PRICE} {PER}</Text>
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
