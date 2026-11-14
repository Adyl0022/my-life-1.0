import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, Animated, Easing, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import RA, { useSharedValue, useAnimatedStyle, withTiming, interpolate, Easing as REasing } from 'react-native-reanimated';
import { subscribeNav, setNavCollapsed } from '../../lib/navbar';
import { Text } from '../../components/Txt';
import { Tabs, useRouter } from 'expo-router';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { THEMES, periodOf } from '../../lib/theme';
import { Glass } from '../../components/Glass';
import { useAnnouncement } from '../../lib/announcement';

const ITEMS: { name: string; label: string }[] = [
  { name: 'index', label: 'Home' }, { name: 'stats', label: 'Stats' }, { name: 'insights', label: 'Insights' }, { name: 'settings', label: 'Settings' },
];
function Icon({ name, color }: { name: string; color: string }) {
  const p = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {name === 'index' && <Path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" {...p} />}
      {name === 'stats' && <><Path d="M5 20V10M12 20V4M19 20v-7" {...p} /></>}
      {name === 'insights' && <><Path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" {...p} /><Path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" {...p} /></>}
      {name === 'settings' && <><Circle cx={12} cy={12} r={3} {...p} /><Path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" {...p} /></>}
    </Svg>
  );
}
const BUB = [
  ['rgba(143,233,226,.46)', 'rgba(124,156,255,.2)'],
  ['rgba(183,148,255,.5)', 'rgba(124,156,255,.2)'],
  ['rgba(255,143,171,.5)', 'rgba(255,196,107,.2)'],
  ['rgba(150,185,255,.46)', 'rgba(143,233,226,.18)'],
];
const DOT = ['#8fe9e2', '#b794ff', '#ff8fab', '#9bb8ff'];
const PGLOW: Record<string, string> = { Morning: '255,210,122', Afternoon: '124,196,255', Evening: '255,140,107', Night: '124,156,255' };
function iconAnim(name: string, v: Animated.Value): any {
  const m = (inp: number[], out: any[]) => v.interpolate({ inputRange: inp, outputRange: out });
  if (name === 'index') return { transform: [{ translateY: m([0, 0.22, 0.45, 0.62, 0.78, 1], [0, -9, 0, -4, 0, 0]) }, { scaleY: m([0, 0.45, 0.5, 0.58, 1], [1, 1, 0.85, 1, 1]) }] };
  if (name === 'stats') return { transformOrigin: 'bottom', transform: [{ scaleY: m([0, 0.35, 0.6, 0.8, 1], [0.25, 1.2, 0.92, 1.05, 1]) }] };
  if (name === 'insights') return { transform: [{ rotate: m([0, 1], ['0deg', '360deg']) }, { scale: m([0, 0.4, 0.7, 1], [1, 1.35, 0.95, 1]) }] };
  return { transform: [{ rotate: m([0, 0.6, 0.8, 1], ['0deg', '110deg', '88deg', '90deg']) }] };
}
function Bar({ state }: any) {
  const router = useRouter(); const { unread } = useAnnouncement();
  const home = state.index === 0;
  const period = periodOf(new Date());
  const th = THEMES[period];
  const tint = (a: number) => { const h = th.colors[th.colors.length - 1]; return 'rgba(' + parseInt(h.slice(1, 3), 16) + ',' + parseInt(h.slice(3, 5), 16) + ',' + parseInt(h.slice(5, 7), 16) + ',' + a + ')'; };
  const [W, setW] = useState(0);
  const tw = W / ITEMS.length;
  const bw = tw + 14;
  const idx = state.index;
  const posOf = (i: number) => i * tw + tw / 2 - bw / 2;
  const tx = useRef(new Animated.Value(0)).current;
  const sx = useRef(new Animated.Value(1)).current;
  const sheen = useRef(new Animated.Value(0)).current;
  const rip = useRef(new Animated.Value(1)).current;
  const col = useSharedValue(0);
  const ia = useRef(ITEMS.map(() => new Animated.Value(1))).current;
  const pops = useRef(ITEMS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const lastIdx = useRef(-1);
  useEffect(() => {
    if (!W) return;
    if (lastIdx.current === -1 || lastIdx.current === idx) { tx.setValue(posOf(idx)); }
    else {
      Animated.parallel([
        Animated.spring(tx, { toValue: posOf(idx), friction: 9, tension: 120, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(sx, { toValue: 1.32, duration: 170, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.spring(sx, { toValue: 1, friction: 6, tension: 140, useNativeDriver: true }),
        ]),
      ]).start();
      rip.setValue(0);
      Animated.timing(rip, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
    lastIdx.current = idx;
  }, [idx, W]);
  useEffect(() => {
    ia[idx].setValue(0);
    Animated.timing(ia[idx], { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }).start();
    pops.forEach((v, i) => Animated.spring(v, { toValue: i === idx ? 1 : 0, friction: 5, tension: 160, useNativeDriver: true }).start());
    setNavCollapsed(false);
  }, [idx]);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(sheen, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.delay(1700),
      Animated.timing(sheen, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    loop.start();

    const un = subscribeNav((c) => { col.value = withTiming(c ? 1 : 0, { duration: 300, easing: REasing.out(REasing.cubic) }); });
    return () => { loop.stop(); un(); };
  }, []);
  const press = (r: any, i: number) => {
    if (Platform.OS !== 'web') { try { Haptics.selectionAsync(); } catch {} }
    if (i !== idx) router.navigate((r.name === 'index' ? '/' : '/' + r.name) as any);
  };
  // Everything runs on the UI thread and the bar's width never changes, so nothing is re-measured while it shrinks.
  const barSt = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(col.value, [0, 1], [0, 8]) }, { scale: interpolate(col.value, [0, 1], [1, 0.88]) }] }));
  const lblSt = useAnimatedStyle(() => ({ height: interpolate(col.value, [0, 1], [13, 0]), opacity: interpolate(col.value, [0, 0.7], [1, 0], 'clamp') }));
  const gc = PGLOW[period];
  return (
    <>
    <LinearGradient pointerEvents="none" colors={home ? ['rgba(10,15,44,0)', tint(.35), tint(.6)] : ['rgba(10,15,44,0)', 'rgba(10,15,44,.92)', 'rgba(10,15,44,.98)']} locations={[0, 0.55, 1]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 104 }} />
    <RA.View style={[{ position: 'absolute', left: 20, right: 20, bottom: 18, transformOrigin: '50% 100%' } as any, barSt]}>
      <Glass radius={28} style={{ padding: 8, backgroundColor: home ? 'rgba(255,255,255,.2)' : 'rgba(24,28,72,.78)' }}>
        <View style={{ flexDirection: 'row' }} onLayout={(e) => { const w = Math.round(e.nativeEvent.layout.width); setW((o) => (Math.abs(o - w) > 1 ? w : o)); }}>
          {W > 0 && (
            <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: -5, bottom: -5, width: bw, borderRadius: 27, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.45)', transform: [{ translateX: tx }, { scaleX: sx }] }}>
              <LinearGradient colors={['rgba(255,255,255,.26)', 'rgba(255,255,255,.1)']} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
              {BUB.map((c, i) => (
                <Animated.View key={i} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: pops[i] }}>
                  <LinearGradient colors={c as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
                </Animated.View>
              ))}
              <Animated.View style={{ position: 'absolute', left: '50%', top: '50%', width: bw * 1.3, height: bw * 1.3, marginLeft: -bw * 0.65, marginTop: -bw * 0.65, borderRadius: bw, backgroundColor: 'rgba(255,255,255,.55)', opacity: rip.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.5, 0] }), transform: [{ scale: rip.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] }) }] }} />
              <Animated.View style={{ position: 'absolute', top: -10, bottom: -10, width: bw * 0.34, left: 0, transform: [{ translateX: sheen.interpolate({ inputRange: [0, 1], outputRange: [-bw * 0.5, bw * 1.2] }) }, { skewX: '-22deg' }] }}>
                <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,.55)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
              </Animated.View>
              {DOT.map((c, i) => (
                <Animated.View key={i} style={{ position: 'absolute', bottom: 6, left: '50%', marginLeft: -11, width: 22, height: 3, borderRadius: 3, backgroundColor: c, opacity: pops[i] }} />
              ))}
            </Animated.View>
          )}
          {state.routes.map((r: any, i: number) => {
            const item = ITEMS.find((x) => x.name === r.name); if (!item) return null;
            const on = idx === i;
            const pop = pops[ITEMS.findIndex((x) => x.name === r.name)];
            return (
              <Pressable key={r.key} onPress={() => press(r, i)} accessibilityLabel={item.label} style={{ flex: 1, borderRadius: 22 }}>
                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                  <Animated.View style={{ transform: [{ translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }, { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] }) }] }}>
                    <Animated.View style={iconAnim(r.name, ia[ITEMS.findIndex((x) => x.name === r.name)])}><Icon name={r.name} color={on ? '#fff' : 'rgba(255,255,255,.65)'} /></Animated.View>
                    {r.name === 'settings' && unread ? <View pointerEvents="none" style={{ position: 'absolute', right: -3, top: -3, width: 11, height: 11, borderRadius: 6, backgroundColor: '#ff5d73', borderWidth: 2, borderColor: home ? 'rgba(60,60,110,.9)' : '#181c48' }} /> : null}
                  </Animated.View>
                  <RA.View style={[{ overflow: 'hidden', marginTop: 2 }, lblSt]}>
                    <Text style={{ fontSize: 10.5, fontWeight: '700', color: on ? '#fff' : 'rgba(255,255,255,.65)' }}>{item.label}</Text>
                  </RA.View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Glass>
    </RA.View>
    </>
  );
}
export default function TabsLayout() {
  return <Tabs tabBar={(p) => <Bar {...p} />} screenOptions={{ headerShown: false }}>{ITEMS.map((i) => <Tabs.Screen key={i.name} name={i.name} />)}</Tabs>;
}
