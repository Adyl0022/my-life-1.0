import React from 'react';
import { View, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from './Txt';
import { Blob } from './Bg';
import { FamilyBg, HouseHeart } from './FamilyBg';
import { HologramSpin } from './HologramSpin';
import { openPaywall, Shine } from './Paywall';
import { PER, usePrice } from '../lib/purchase';
import { TOP } from '../lib/layout';

function BackBtn() {
  const router = useRouter();
  return <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 16 }}><Text style={{ color: '#8fe9e2', fontSize: 15, fontWeight: '700' }}>Back</Text></Pressable>;
}

function Cta({ colors, dark, glow }: { colors: [string, string]; dark: string; glow: string }) {
  const PRICE = usePrice();
  return (
    <View>
      <Pressable onPress={openPaywall} accessibilityRole="button" style={{ marginTop: 24, borderRadius: 999, overflow: 'hidden', shadowColor: glow, shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 15, alignItems: 'center' }}>
          <Text style={{ color: dark, fontSize: 15.5, fontWeight: '800' }}>Subscribe · {PRICE} {PER}</Text>
        </LinearGradient>
        <Shine />
      </Pressable>
      <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11.5, textAlign: 'center', marginTop: 10 }}>Cancel anytime in Google Play.</Text>
    </View>
  );
}

const Badge = ({ t, c, bg, bd }: { t: string; c: string; bg: string; bd: string }) => (
  <View style={{ paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999, backgroundColor: bg, borderWidth: 1, borderColor: bd }}><Text style={{ color: c, fontSize: 11, fontWeight: '800', letterSpacing: 2 }}>{t}</Text></View>
);

const MEMBERS: [string, string][] = [['M', '#ff8fab'], ['D', '#ffc46b'], ['A', '#8fe9e2'], ['H', '#b794ff']];

// Locked Family Planner pages. Same night sky and lit houses as the real planner, with a made-up family and task list.
export function FamilyUnlock() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <FamilyBg />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 22, paddingTop: 12 + TOP }}>
        <BackBtn />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 24 }}>
          <View style={{ alignItems: 'center' }}>
            <HouseHeart size={150} />
            <View style={{ marginTop: 14 }}><Badge t="PRO" c="#ffd9a0" bg="rgba(255,196,107,.18)" bd="rgba(255,196,107,.55)" /></View>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 10, textAlign: 'center' }}>Family Planner</Text>
            <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20, maxWidth: 310 }}>Share tasks, plans and shopping lists with your family, all in one place.</Text>
          </View>
          {/* Made-up family and tasks. Nothing here is real data. */}
          <View style={{ marginTop: 22, borderRadius: 22, padding: 16, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {MEMBERS.map(([l, c], i) => (
                <View key={l} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#14193f', marginLeft: i ? -8 : 0 }}><Text style={{ color: '#10153a', fontSize: 14, fontWeight: '800' }}>{l}</Text></View>
              ))}
              <View style={{ marginLeft: 12, height: 10, width: 90, borderRadius: 5, backgroundColor: 'rgba(255,255,255,.2)' }} />
            </View>
            {[['64%', true], ['48%', false], ['72%', false]].map(([w, done], i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: done ? '#ffc46b' : 'rgba(255,255,255,.3)', backgroundColor: done ? 'rgba(255,196,107,.35)' : 'transparent' }} />
                <View style={{ height: 10, width: w as any, borderRadius: 5, backgroundColor: 'rgba(255,255,255,.18)' }} />
              </View>
            ))}
          </View>
          <Cta colors={['#ff8fab', '#ffc46b']} dark="#2a1030" glow="#ff8fab" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Locked body hologram page. Same sky as Time Machine, with the hologram turning slowly as a teaser.
export function HologramUnlock() {
  const { width } = useWindowDimensions();
  const w = Math.min(300, width - 90);
  return (
    <View style={{ flex: 1, backgroundColor: '#070b22' }}>
      <LinearGradient colors={['#070b22', '#0e1346', '#0b2347']} locations={[0, 0.55, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={300} color="rgba(124,156,255,.35)" style={{ right: -110, top: 60 }} />
      <Blob size={320} color="rgba(94,231,223,.22)" style={{ left: -130, bottom: 120 }} />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 22, paddingTop: 12 + TOP }}>
        <BackBtn />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 24 }}>
          <Pressable onPress={openPaywall} accessibilityLabel="Body hologram, locked" style={{ alignItems: 'center' }}>
            <View pointerEvents="none"><HologramSpin w={w} onTap={() => {}} glow={0.6} reduce={false} /></View>
          </Pressable>
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <Badge t="PRO" c="#8fe9e2" bg="rgba(94,231,223,.18)" bd="rgba(94,231,223,.5)" />
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 10, textAlign: 'center' }}>Body hologram</Text>
            <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20, maxWidth: 310 }}>See your days on a turning body. The rest of Time Machine stays open to everyone.</Text>
          </View>
          <Cta colors={['#7c9cff', '#5ee7df']} dark="#06182e" glow="#5ee7df" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
