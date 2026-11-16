import React from 'react';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Text } from './Txt';
import { Blob } from './Bg';
import { OrbSvg } from './Orb';
import { OrbLive } from './OrbLive';
import { openPaywall, Shine } from './Paywall';
import { PER, usePrice } from '../lib/purchase';
import { TOP } from '../lib/layout';

const STARS: [number, number, number, number][] = Array.from({ length: 34 }, (_, i) => [(i * 37 + 11) % 100, (i * 53 + 7) % 96, 0.6 + ((i * 7) % 6) / 10, 0.25 + ((i * 13) % 6) / 10]);

// Locked My Life Assistant. It uses the same sky, stars and orb as the real Assistant, with a made-up sample chat.
export function AssistantUnlock() {
  const router = useRouter();
  const PRICE = usePrice();
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <LinearGradient colors={['#0a0f2c', '#1a1048', '#0c2b4d']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(183,148,255,.5)" style={{ right: -100, top: -40 }} />
      <Blob size={340} color="rgba(94,231,223,.3)" style={{ left: -120, bottom: 80 }} />
      <Blob size={260} color="rgba(124,156,255,.35)" style={{ right: -90, top: 420 }} />
      <Svg pointerEvents="none" width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0 }}>
        {STARS.map((t, i) => <Circle key={i} cx={t[0] + '%'} cy={t[1] + '%'} r={t[2]} fill="#fff" opacity={t[3]} />)}
        <Circle cx="50%" cy="22%" r={96} stroke="rgba(255,255,255,.07)" strokeWidth={1.2} fill="none" />
        <Circle cx="50%" cy="22%" r={140} stroke="rgba(255,255,255,.05)" strokeWidth={1.2} fill="none" />
        <Circle cx="50%" cy="22%" r={186} stroke="rgba(255,255,255,.035)" strokeWidth={1.2} fill="none" />
      </Svg>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 22, paddingTop: 12 + TOP }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 16 }}><Text style={{ color: '#8fe9e2', fontSize: 15, fontWeight: '700' }}>Back</Text></Pressable>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <OrbLive size={104} />
            <View style={{ marginTop: 14, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(183,148,255,.2)', borderWidth: 1, borderColor: 'rgba(183,148,255,.55)' }}><Text style={{ color: '#d8c4ff', fontSize: 11, fontWeight: '800', letterSpacing: 2 }}>PRO</Text></View>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 10, textAlign: 'center' }}>My Life Assistant</Text>
            <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20, maxWidth: 300 }}>Ask about your spending, tasks and health. Answers come from your own data, on your phone.</Text>
          </View>
          {/* Sample chat. It is made up and shows no real data. */}
          <View style={{ marginTop: 22 }}>
            <View style={{ alignItems: 'flex-end' }}>
              <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ maxWidth: '82%', paddingVertical: 11, paddingHorizontal: 15, borderRadius: 20, borderBottomRightRadius: 6 }}>
                <Text style={{ color: '#fff', fontSize: 13.5, fontWeight: '600' }}>How much did I spend on food this week?</Text>
              </LinearGradient>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 10 }}>
              <OrbSvg size={30} uid="unl" />
              <View style={{ maxWidth: '78%', paddingVertical: 11, paddingHorizontal: 15, borderRadius: 20, borderBottomLeftRadius: 6, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
                <View style={{ height: 9, width: 150, borderRadius: 5, backgroundColor: 'rgba(255,255,255,.28)' }} />
                <View style={{ height: 9, width: 110, borderRadius: 5, backgroundColor: 'rgba(255,255,255,.18)', marginTop: 8 }} />
              </View>
            </View>
          </View>
          <Pressable onPress={openPaywall} accessibilityRole="button" style={{ marginTop: 26, borderRadius: 999, overflow: 'hidden', shadowColor: '#b794ff', shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}>
            <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 15, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 15.5, fontWeight: '800' }}>Subscribe · {PRICE} {PER}</Text>
            </LinearGradient>
            <Shine />
          </Pressable>
          <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11.5, textAlign: 'center', marginTop: 10 }}>Cancel anytime in Google Play.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
