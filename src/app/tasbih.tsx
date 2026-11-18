import React, { useState } from 'react';
import { View, ScrollView, Pressable, Animated, Easing } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Glass } from '../components/Glass';
import { IslamicBg, Header } from '../components/IslamicUi';
import { W } from '../components/Ui';
import { useStored } from '../lib/store';
import { useLang, dayKey, QURAN_FONT } from '../lib/islamic';

const PRE = [
  ['Subhanallah', 'سُبْحَانَ ٱللَّهِ', 'Maha Suci Allah', 'Glory be to Allah'],
  ['Alhamdulillah', 'ٱلْحَمْدُ لِلَّهِ', 'Segala puji bagi Allah', 'All praise is for Allah'],
  ['Allahu Akbar', 'ٱللَّهُ أَكْبَرُ', 'Allah Maha Besar', 'Allah is the Greatest'],
  ['La ilaha illallah', 'لَا إِلَٰهَ إِلَّا ٱللَّهُ', 'Tiada Tuhan selain Allah', 'There is no god but Allah'],
];
const G = ['#34d399', '#5ee7df'] as [string, string];
type T = { day: string; total: number; rounds: number };
export default function Tasbih() {
  const [lang, setLang] = useLang();
  const [st, setSt] = useStored<T>('ml_tasbih', { day: dayKey(), total: 0, rounds: 0 });
  const [p, setP] = useState(0); const [target, setTarget] = useState(33); const [count, setCount] = useState(0); const [done, setDone] = useState(false);
  const today = st.day === dayKey() ? st : { day: dayKey(), total: 0, rounds: 0 };
  const cur = PRE[p]; const C = 2 * Math.PI * 98;
  const fx = React.useRef(new Animated.Value(1)).current;
  const pop = React.useRef(new Animated.Value(1)).current;
  const burst = () => {
    fx.setValue(0); Animated.timing(fx, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.sequence([Animated.timing(pop, { toValue: 1.14, duration: 110, useNativeDriver: true }), Animated.timing(pop, { toValue: 1, duration: 170, useNativeDriver: true })]).start();
  };
  const tap = () => {
    burst();
    const c = count + 1;
    if (c >= target) { setCount(0); setDone(true); setSt({ ...today, total: today.total + 1, rounds: today.rounds + 1 }); }
    else { setCount(c); setDone(false); setSt({ ...today, total: today.total + 1 }); }
  };
  const chip = (on: boolean, t: string, f: () => void) => <Pressable key={t} onPress={f}>{on ? <LinearGradient colors={G} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 }}><Text style={{ color: '#06281c', fontSize: 12.5, fontWeight: '800' }}>{t}</Text></LinearGradient> : <View style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '600' }}>{t}</Text></View>}</Pressable>;
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <IslamicBg a="rgba(255,196,107,.3)" />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Tasbih Counter" right={
          <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)' }}>
            {(['ms', 'en'] as const).map((l) => <Pressable key={l} onPress={() => setLang(l)} style={{ paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, backgroundColor: lang === l ? '#34d399' : 'transparent' }}><Text style={{ color: lang === l ? '#06281c' : 'rgba(255,255,255,.75)', fontSize: 11.5, fontWeight: '800' }}>{l === 'ms' ? 'BM' : 'EN'}</Text></Pressable>)}
          </View>} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {PRE.map((x, i) => chip(p === i, x[0], () => { setP(i); setCount(0); setDone(false); }))}
          </ScrollView>
          <Glass radius={28} style={{ marginTop: 14, padding: 18, alignItems: 'center' }}>
            <Text style={{ color: W, fontFamily: QURAN_FONT, fontSize: 34, lineHeight: 70, alignSelf: 'stretch', textAlign: 'center' }}>{cur[1]}</Text>
            <Text style={{ color: '#8fe9e2', fontSize: 13, fontWeight: '700' }}>{cur[0]}</Text>
            <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, marginTop: 2 }}>{lang === 'en' ? cur[3] : cur[2]}</Text>
            <Pressable accessibilityLabel="Tap to count" onPress={tap} style={({ pressed }) => ({ marginTop: 14, width: 220, height: 220, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.95 : 1 }] })}>
              <View style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                <Svg width={220} height={220} viewBox="0 0 220 220"><Circle cx={110} cy={110} r={98} stroke="rgba(255,255,255,.14)" strokeWidth={10} fill="none" /><Circle cx={110} cy={110} r={98} stroke="#5ee7df" strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={`${C}`} strokeDashoffset={C - C * (count / target)} /></Svg>
              </View>
              <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: 220, height: 220 }}>
                <Animated.View style={{ position: 'absolute', left: 10, top: 10, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(143,233,226,.28)', opacity: fx.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }), transform: [{ scale: fx.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.15] }) }] }} />
                <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: 'rgba(143,233,226,.9)', opacity: fx.interpolate({ inputRange: [0, 0.01, 1], outputRange: [0, 0.95, 0] }), transform: [{ scale: fx.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.32] }) }] }} />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                  <View key={a} style={{ position: 'absolute', left: 107, top: 107, width: 6, height: 6, transform: [{ rotate: a + 'deg' }] }}>
                    <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', opacity: fx.interpolate({ inputRange: [0, 0.01, 1], outputRange: [0, 1, 0] }), transform: [{ translateY: fx.interpolate({ inputRange: [0, 1], outputRange: [-96, -128] }) }, { scale: fx.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) }] }} />
                  </View>
                ))}
              </View>
              <Animated.Text style={{ color: W, fontSize: 64, fontWeight: '800', transform: [{ scale: pop }], textShadowColor: 'rgba(143,233,226,.35)', textShadowRadius: 18 }}>{count}</Animated.Text>
              <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 13 }}>of {target}</Text>
              <Text style={{ color: done ? '#7df0c6' : 'rgba(255,255,255,.6)', fontSize: 12, marginTop: 4 }}>{done ? 'Round complete' : 'Tap to count'}</Text>
            </Pressable>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>{[11, 33, 100].map((n) => chip(target === n, n + '×', () => { setTarget(n); setCount(0); setDone(false); }))}</View>
          </Glass>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <Glass radius={20} style={{ flex: 1, padding: 14 }}><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5 }}>Rounds done</Text><Text style={{ color: W, fontSize: 22, fontWeight: '800', marginTop: 2 }}>{today.rounds}</Text></Glass>
            <Glass radius={20} style={{ flex: 1, padding: 14 }}><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5 }}>Total today</Text><Text style={{ color: W, fontSize: 22, fontWeight: '800', marginTop: 2 }}>{today.total}</Text></Glass>
          </View>
          <Pressable onPress={() => { setCount(0); setDone(false); setSt({ day: dayKey(), total: 0, rounds: 0 }); }} style={{ marginTop: 12, height: 46, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>Reset counter</Text></Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
