import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, AccessibilityInfo, Animated, Easing, useWindowDimensions } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Glass } from '../components/Glass';
import { Blob } from '../components/Bg';
import { W } from '../components/Ui';
import { Hologram } from '../components/Hologram';
import { Hologram3D } from '../components/Hologram3D';
import { useStored } from '../lib/store';
import { TOP } from '../lib/layout';
import { HData, HEMPTY, dateOf, WD, MON } from '../lib/habit';
import { REGIONS, Region, rowsFor, glowOf, hasRecords, FMETRICS, guess, weightGuess } from '../lib/twin';
import { Platform } from 'react-native';

const T = '#5ee7df'; const DIM = 'rgba(255,255,255,.7)';
const buzz = () => { if (Platform.OS === 'web') return; try { Haptics.selectionAsync(); } catch (e) {} };
const dl = (off: number) => { const d = dateOf(off); return off === 0 ? 'Today' : off === -1 ? 'Yesterday' : WD[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()]; };
const Chip = ({ on, t, onPress, c }: { on: boolean; t: string; onPress: () => void; c?: string }) => (
  <Pressable onPress={onPress} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: on ? (c || T) : 'rgba(255,255,255,.12)' }}><Text style={{ color: on ? '#06222a' : W, fontSize: 12.5, fontWeight: '800' }}>{t}</Text></Pressable>
);

export default function TimeMachinePage() {
  const router = useRouter(); const { width } = useWindowDimensions();
  const [h] = useStored<HData>('ml_habit', HEMPTY);
  const [mode, setMode] = useState<'past' | 'future'>('past');
  const [reg, setReg] = useState<Region>('body');
  const [a, setA] = useState(0); const [b, setB] = useState<number | null>(null); const [cmp, setCmp] = useState(false);
  const [use3d, setUse3d] = useStored<boolean>('ml_tm3d', false); const [failed, setFailed] = useState(false);
  const [hz, setHz] = useState(7); const [reduce, setReduce] = useState(false);
  useEffect(() => { try { AccessibilityInfo.isReduceMotionEnabled().then(setReduce); } catch (e) {} }, []);
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => { rise.setValue(0); Animated.timing(rise, { toValue: 1, duration: reduce ? 0 : 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [reg, mode, a, b, hz]);
  const tl = useRef<any>(null);
  const hw = Math.min(150, Math.round(width * 0.38));
  const R = REGIONS.find((x) => x.k === reg)!;
  const pick = (r: Region) => { buzz(); setReg(r); };
  const days = Array.from({ length: 60 }, (_, i) => i - 59);
  const tap = (o: number) => { buzz(); if (cmp && o !== a) setB(o); else { setA(o); if (cmp && b === o) setB(null); } };

  const Panel = () => {
    const rowsA = rowsFor(h, a, reg); const rowsB = cmp && b != null ? rowsFor(h, b, reg) : null;
    if (reg === 'heart') return (
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>No heart records yet</Text>
        <Text style={{ color: DIM, fontSize: 12.5, lineHeight: 18, marginTop: 6 }}>My Life does not measure heart rate or blood pressure, so there is nothing to show here. Nothing is made up. When you can log heart readings in the app, they will appear on this part of the body.</Text>
      </View>
    );
    return (
      <View style={{ marginTop: 10 }}>
        {rowsB ? <View style={{ flexDirection: 'row', marginBottom: 4 }}><View style={{ flex: 1.3 }} /><Text style={{ flex: 1, color: '#9fb0d0', fontSize: 10.5, fontWeight: '800', letterSpacing: 1 }}>{dl(a).toUpperCase()}</Text><Text style={{ flex: 1, color: '#9fb0d0', fontSize: 10.5, fontWeight: '800', letterSpacing: 1 }}>{dl(b as number).toUpperCase()}</Text></View> : null}
        {rowsA.map((r, i) => {
          const o = rowsB ? rowsB[i] : null; const up = o && r.v != null && o.v != null ? (r.v > o.v ? '▲' : r.v < o.v ? '▼' : '=') : '';
          return (
            <View key={r.l} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderTopWidth: i ? 1 : 0, borderTopColor: 'rgba(255,255,255,.08)' }}>
              <Text style={{ flex: 1.3, color: DIM, fontSize: 12.5 }}>{r.l}</Text>
              <Text style={{ flex: 1, color: r.v == null ? 'rgba(255,255,255,.4)' : W, fontSize: 13.5, fontWeight: '800' }}>{r.t}{o ? ' ' + up : ''}</Text>
              {o ? <Text style={{ flex: 1, color: o.v == null ? 'rgba(255,255,255,.4)' : W, fontSize: 13.5, fontWeight: '800' }}>{o.t}</Text> : null}
            </View>
          );
        })}
        {!hasRecords(h, a) ? <Text style={{ color: DIM, fontSize: 12, marginTop: 8 }}>Nothing was recorded on this day.</Text> : null}
        {cmp && b == null ? <Text style={{ color: T, fontSize: 12, marginTop: 8 }}>Now tap a second day on the timeline to compare.</Text> : null}
      </View>
    );
  };

  const Future = () => {
    const ms = FMETRICS[reg];
    if (reg === 'heart') return <View style={{ marginTop: 12 }}><Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Nothing to estimate</Text><Text style={{ color: DIM, fontSize: 12.5, lineHeight: 18, marginTop: 6 }}>There are no heart records, so there is no estimate for this part. Nothing is made up.</Text></View>;
    const gs = ms.map((m) => ({ m, g: guess(h, m, hz) }));
    const wg = reg === 'body' ? weightGuess(h, hz) : null;
    const any = gs.some((x) => x.g) || !!wg;
    if (!any) return <View style={{ marginTop: 12 }}><Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Not enough records yet</Text><Text style={{ color: DIM, fontSize: 12.5, lineHeight: 18, marginTop: 6 }}>An honest estimate needs about 3 weeks of your own records for this part. Keep logging and it will appear here.</Text></View>;
    const arrow = (l: string) => (l === 'Rising' ? '▲' : l === 'Falling' ? '▼' : '=');
    return (
      <View style={{ marginTop: 10 }}>
        {gs.map(({ m, g }, i) => (
          <View key={m.k} style={{ paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: 'rgba(255,255,255,.08)' }}>
            <Text style={{ color: DIM, fontSize: 12.5 }}>{m.l}</Text>
            {g ? <Text style={{ color: W, fontSize: 14, fontWeight: '800', marginTop: 3 }}>{m.fmt(g.now)} now → about {m.fmt(g.at)} in {hz} days {arrow(g.line)} <Text style={{ color: R.c, fontSize: 12 }}>{g.line}</Text></Text> : <Text style={{ color: 'rgba(255,255,255,.45)', fontSize: 12.5, marginTop: 3 }}>Not enough records yet</Text>}
          </View>
        ))}
        {wg ? (
          <View style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.08)' }}>
            <Text style={{ color: DIM, fontSize: 12.5 }}>Weight</Text>
            <Text style={{ color: W, fontSize: 14, fontWeight: '800', marginTop: 3 }}>{Math.round(wg.now * 10) / 10} kg now → about {Math.round(wg.at * 10) / 10} kg in {hz} days {arrow(wg.line)} <Text style={{ color: R.c, fontSize: 12 }}>{wg.line}</Text></Text>
          </View>
        ) : null}
        {hz >= 90 ? <Text style={{ color: DIM, fontSize: 12, lineHeight: 17, marginTop: 6 }}>90 days is a long way. Treat it as a rough direction only.</Text> : null}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#070b22' }}>
      <LinearGradient colors={['#070b22', '#0e1346', '#0b2347']} locations={[0, 0.55, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={300} color="rgba(124,156,255,.35)" style={{ right: -110, top: 60 }} />
      <Blob size={320} color="rgba(94,231,223,.22)" style={{ left: -130, bottom: 120 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16 + TOP }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
            <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Time Machine</Text><Text style={{ color: DIM, fontSize: 12, marginTop: 3 }}>Your body, then and ahead</Text></View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <Chip on={mode === 'past'} t="Past" onPress={() => setMode('past')} />
            <Chip on={mode === 'future'} t="Future" onPress={() => setMode('future')} c="#b794ff" />
            <Chip on={use3d && !failed} t={use3d && !failed ? '3D' : '2D'} onPress={() => { setFailed(false); setUse3d(!use3d); }} c="#7c9cff" />
            {mode === 'past' ? <Chip on={cmp} t={cmp ? 'Comparing' : 'Compare'} onPress={() => { setCmp(!cmp); setB(null); }} c="#ffc46b" /> : null}
          </View>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          <Text style={{ color: mode === 'past' ? T : '#c9b0ff', textAlign: 'center', fontSize: 11, fontWeight: '800', letterSpacing: 1.6 }}>{mode === 'past' ? dl(a).toUpperCase() : 'ESTIMATE · IN ' + hz + ' DAYS'}</Text>
          {use3d && !failed
            ? <Hologram3D key="3d" w={Math.min(260, width - 40)} h={300} sel={reg} onPick={pick} glow={mode === 'past' ? glowOf(h, a) : 0.6} reduce={reduce} onFail={() => setFailed(true)} />
            : <Hologram w={hw} sel={reg} onPick={pick} glow={mode === 'past' ? glowOf(h, a) : 0.6} reduce={reduce} />}
          {use3d && failed ? <Text style={{ color: '#ffd593', fontSize: 11.5, textAlign: 'center', marginTop: 4 }}>3D is not available on this phone, so the flat hologram is shown.</Text> : null}
          {use3d && !failed ? <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, textAlign: 'center' }}>Drag to turn. Tap a part to pick it.</Text> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 6 }}>
            {REGIONS.map((r) => <Chip key={r.k} on={reg === r.k} t={r.l} onPress={() => pick(r.k)} c={r.c} />)}
          </ScrollView>
          <Animated.View style={{ opacity: rise, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
            <Glass radius={22} style={{ padding: 16, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: R.c }} />
                <Text style={{ color: W, fontSize: 16, fontWeight: '800' }}>{R.l}</Text>
                <Text style={{ color: DIM, fontSize: 12 }}>{R.sub}</Text>
              </View>
              {mode === 'past' ? Panel() : Future()}
              {mode === 'future' ? <Text style={{ color: '#ffd593', fontSize: 11.5, lineHeight: 16, marginTop: 10 }}>These are estimates from your own recent records, a simple straight-line guess. They are not medical predictions and nothing is guaranteed.</Text> : null}
            </Glass>
          </Animated.View>
          <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, lineHeight: 15, textAlign: 'center', marginTop: 12 }}>Only records you or your phone saved are shown. It all stays on your phone and your backup.</Text>
        </ScrollView>
        <View style={{ paddingBottom: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.1)', backgroundColor: 'rgba(7,11,34,.6)' }}>
          {mode === 'past' ? (
            <ScrollView ref={tl} horizontal showsHorizontalScrollIndicator={false} onContentSizeChange={() => tl.current && tl.current.scrollToEnd({ animated: false })} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              {days.map((o) => {
                const d = dateOf(o); const isA = o === a; const isB = o === b; const rec = hasRecords(h, o);
                return (
                  <Pressable key={o} onPress={() => tap(o)} accessibilityLabel={dl(o)} style={{ width: 48, paddingVertical: 8, borderRadius: 16, alignItems: 'center', backgroundColor: isA ? T : isB ? '#ffc46b' : 'rgba(255,255,255,.09)', borderWidth: 1, borderColor: isA || isB ? 'transparent' : 'rgba(255,255,255,.1)' }}>
                    <Text style={{ color: isA || isB ? '#06222a' : DIM, fontSize: 10.5, fontWeight: '700' }}>{WD[d.getDay()]}</Text>
                    <Text style={{ color: isA || isB ? '#06222a' : W, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{d.getDate()}</Text>
                    <View style={{ width: 5, height: 5, borderRadius: 3, marginTop: 4, backgroundColor: rec ? (isA || isB ? '#06222a' : T) : 'transparent' }} />
                    <Text style={{ color: isA || isB ? '#06222a' : 'rgba(255,255,255,.45)', fontSize: 9, marginTop: 1 }}>{MON[d.getMonth()]}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <View style={{ paddingHorizontal: 20 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[7, 30, 90].map((n) => <Pressable key={n} onPress={() => { buzz(); setHz(n); }} style={{ flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center', backgroundColor: hz === n ? '#b794ff' : 'rgba(255,255,255,.09)' }}><Text style={{ color: hz === n ? '#1a0b3a' : W, fontSize: 14, fontWeight: '800' }}>{n} days</Text><Text style={{ color: hz === n ? '#1a0b3a' : DIM, fontSize: 10.5, marginTop: 2 }}>ahead</Text></Pressable>)}
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
