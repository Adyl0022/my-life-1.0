import React, { useEffect, useRef } from 'react';
import { View, ScrollView, Pressable, Animated, Easing } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Glass } from '../components/Glass';
import { Blob } from '../components/Bg';
import { W } from '../components/Ui';
import { TOP } from '../lib/layout';
import { DASH_PAGES, useDashPages } from '../components/DashCardPicks';
import { Toggle } from '../components/Toggle';

const DIM = 'rgba(255,255,255,.65)';
const RAISED = { backgroundColor: 'rgba(255,255,255,.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.36)' } as const;
const Rise = ({ i, children }: { i: number; children: React.ReactNode }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 420, delay: Math.min(i, 8) * 55, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, []);
  return <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>{children}</Animated.View>;
};
const Sw = ({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) => <Toggle on={on} onPress={() => set(!on)} label={label} colors="#5ee7b5" thumbOn="#0d3a2c" w={46} h={28} />;
const Tile = ({ e, c }: { e: string; c: string }) => <View style={{ width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: c + '30', borderWidth: 1, borderColor: c + '66' }}><Text style={{ fontSize: 21 }}>{e}</Text></View>;

export default function DashCardScreen() {
  const router = useRouter(); const p = useDashPages();
  const off = DASH_PAGES.length - p.count;
  return (
    <View style={{ flex: 1, backgroundColor: '#0d1030' }}>
      <LinearGradient colors={['#0d1030', '#1d1250', '#0f2b55']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(94,231,223,.3)" style={{ right: -110, top: -40 }} />
      <Blob size={340} color="rgba(183,148,255,.28)" style={{ left: -130, bottom: 40 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 70 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
            <Text style={{ flex: 1, color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Dashboard card</Text>
          </View>
          <Rise i={0}>
            <Text style={{ color: '#a8f0ea', fontSize: 13.5, marginTop: 12, lineHeight: 20 }}>The card at the bottom of Home turns by itself. Choose which pages it may show.</Text>
            <View style={{ marginTop: 14, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', borderTopColor: 'rgba(255,255,255,.4)' }}>
              <LinearGradient colors={['rgba(94,231,223,.3)', 'rgba(124,156,255,.3)', 'rgba(183,148,255,.24)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16 }}>
                <Text style={{ color: DIM, fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2 }}>SHOWING ON HOME</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                  <Text style={{ color: W, fontSize: 38, fontWeight: '800', letterSpacing: -1 }}>{p.count + 1}</Text>
                  <Text style={{ color: W, fontSize: 15, fontWeight: '700' }}>{'of ' + (DASH_PAGES.length + 1) + ' pages'}</Text>
                </View>
                <Text style={{ color: DIM, fontSize: 12, marginTop: 4, lineHeight: 17 }}>A page also stays hidden while it has nothing to show, for example no event coming up.</Text>
              </LinearGradient>
            </View>
          </Rise>

          <Rise i={1}>
            <Text style={{ color: W, fontSize: 17, fontWeight: '800', marginTop: 22 }}>Pages</Text>
            <Text style={{ color: DIM, fontSize: 12.5, marginTop: 2 }}>Switch off what you do not want to see</Text>
          </Rise>
          <View style={{ gap: 8, marginTop: 12 }}>
            <Rise i={2}>
              <View style={{ ...RAISED, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Tile e="📝" c="#8fe9e2" />
                <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14.5, fontWeight: '800' }}>Quick log</Text><Text style={{ color: DIM, fontSize: 12, marginTop: 1 }}>Sleep, water, steps and mood for today</Text></View>
                <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(143,233,226,.2)' }}><Text style={{ color: '#a8f0ea', fontSize: 11.5, fontWeight: '800' }}>Always on</Text></View>
              </View>
            </Rise>
            {DASH_PAGES.map((x, i) => { const on = p.isOn(x.k); return (
              <Rise key={x.k} i={3 + i}>
                <Pressable onPress={() => p.set(x.k, !on)} accessibilityLabel={(on ? 'Hide ' : 'Show ') + x.t + ' on the Dashboard card'} style={{ ...RAISED, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: on ? 1 : 0.62 }}>
                  <Tile e={x.e} c={x.c} />
                  <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14.5, fontWeight: '800' }}>{x.t}</Text><Text style={{ color: DIM, fontSize: 12, marginTop: 1, lineHeight: 16 }}>{x.s}</Text></View>
                  <Sw on={on} set={(v) => p.set(x.k, v)} label={(on ? 'Hide ' : 'Show ') + x.t} />
                </Pressable>
              </Rise>); })}
          </View>
          {off > 0 ? <Pressable onPress={p.all} accessibilityLabel="Turn all pages on" style={{ alignSelf: 'center', marginTop: 18, paddingVertical: 10, paddingHorizontal: 22, borderRadius: 999, backgroundColor: 'rgba(94,231,181,.3)', borderWidth: 1, borderColor: 'rgba(94,231,181,.45)' }}><Text style={{ color: '#b6f7de', fontSize: 13, fontWeight: '800' }}>Turn all on</Text></Pressable> : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
