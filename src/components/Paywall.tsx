import React, { useEffect, useState } from 'react';
import { Modal, View, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import { Text } from './Txt';
import { Glass } from './Glass';
import { PRICE, buyPro, restorePurchases } from '../lib/purchase';

let shown = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
export function openPaywall() { shown = true; emit(); }
function closePaywall() { shown = false; emit(); }

const Lock = ({ s = 16, c = '#fff' }: { s?: number; c?: string }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Rect x="5" y="11" width="14" height="9" rx="2.5" /><Path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>
);
const Tick = () => (<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#8fe9e2" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><Path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>);

const PERKS = [
  'My Life Assistant',
  'Spending by category and income trend',
  'Vehicle record PDF and extra categories',
  'Every tip in Insights',
];

function Btn({ t, onPress, solid }: { t: string; onPress: () => void; solid?: boolean }) {
  return solid ? (
    <Pressable onPress={onPress} accessibilityRole="button"><LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, borderRadius: 999, alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{t}</Text></LinearGradient></Pressable>
  ) : (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ paddingVertical: 12, alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13.5, fontWeight: '700' }}>{t}</Text></Pressable>
  );
}

// Shown on top of the whole app when a locked feature is tapped.
export function PaywallHost() {
  const [, n] = useState(0); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { const f = () => { n((x) => x + 1); setMsg(''); }; subs.add(f); return () => { subs.delete(f); }; }, []);
  const go = async (fn: typeof buyPro) => { setBusy(true); const r = await fn(); setBusy(false); setMsg(r.msg); if (r.ok) closePaywall(); };
  return (
    <Modal visible={shown} transparent animationType="fade" onRequestClose={closePaywall} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(5,8,28,.72)', justifyContent: 'center', padding: 22 }}>
        <Glass radius={28} style={{ padding: 22 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,156,255,.28)' }}><Lock s={26} /></View>
            <Text style={{ color: '#fff', fontSize: 21, fontWeight: '800', marginTop: 14 }}>Unlock My Life</Text>
            <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 13.5, marginTop: 4, textAlign: 'center' }}>{PRICE} one time. Yours forever.</Text>
          </View>
          <View style={{ marginTop: 18, gap: 11 }}>
            {PERKS.map((p) => (<View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Tick /><Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 }}>{p}</Text></View>))}
          </View>
          {msg ? <Text style={{ color: '#ffd9a0', fontSize: 12.5, marginTop: 16, textAlign: 'center' }}>{msg}</Text> : null}
          <View style={{ marginTop: 18 }}>
            <Btn solid t={busy ? 'Please wait...' : 'Unlock for ' + PRICE} onPress={() => { if (!busy) go(buyPro); }} />
            <Btn t="Restore purchase" onPress={() => { if (!busy) go(restorePurchases); }} />
            <Btn t="Not now" onPress={closePaywall} />
          </View>
        </Glass>
      </View>
    </Modal>
  );
}

// Blurs a card and opens the unlock sheet when tapped. When `on` is false the card is shown as normal.
export function Locked({ on, mt = 0, radius = 24, children }: { on: boolean; mt?: number; radius?: number; children: React.ReactNode }) {
  if (!on) return <View style={{ marginTop: mt }}>{children}</View>;
  return (
    <View style={{ marginTop: mt, borderRadius: radius, overflow: 'hidden' }}>
      <View pointerEvents="none" style={{ opacity: 0.55 }}>{children}</View>
      <Pressable onPress={openPaywall} accessibilityRole="button" accessibilityLabel={'Unlock for ' + PRICE} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <BlurView intensity={26} tint="dark" pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(10,15,44,.78)', borderWidth: 1, borderColor: 'rgba(255,255,255,.3)' }}>
          <Lock s={15} /><Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Unlock · {PRICE}</Text>
        </View>
      </Pressable>
    </View>
  );
}

// A full page shown instead of a locked screen.
export function UnlockPage({ title, text }: { title: string; text: string }) {
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
          <Pressable onPress={openPaywall} accessibilityRole="button" style={{ marginTop: 26 }}><LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, paddingHorizontal: 34, borderRadius: 999 }}><Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Unlock for {PRICE}</Text></LinearGradient></Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
