import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Text } from './Txt';
import { catOf, monthly, rm, live, payName, PAYS, type Sub } from '../lib/subs';

const INK = '#ffffff', INK2 = 'rgba(255,255,255,.74)';
const buzz = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
const TITLES = ['COSTLIEST', 'PER DAY', 'BY PAYMENT', 'SAVE', 'NEXT 5 MONTHS'];
const PAY_COL: Record<string, string> = { debit: '#8ea8ff', credit: '#ff9ac4', ewallet: '#5ee7b5', bank: '#ffd24a', other: '#c9b6ff', none: 'rgba(255,255,255,.5)' };
const BODY_H = 262;

/** One card that turns by itself every few seconds, like the card on the Dashboard: Costliest, Per day, By payment, Save and the next five months.
 *  It waits 20 seconds after a touch. The dots at the top also let you jump to a page. It reads only what is already saved on this phone. */
export function SubInsights({ subs, income, months, onOpen }: { subs: Sub[]; income: number; months: { k: string; n: string; v: number }[]; onOpen: (s: Sub) => void }) {
  const [i, setI] = useState(0);
  const v = useRef(new Animated.Value(1)).current; const ty = useRef(new Animated.Value(0)).current;
  const last = useRef(0); const iRef = useRef(0); iRef.current = i;
  const goTo = (to: number) => {
    if (to === iRef.current) return;
    Animated.parallel([Animated.timing(v, { toValue: 0, duration: 160, useNativeDriver: true }), Animated.timing(ty, { toValue: -8, duration: 160, useNativeDriver: true })]).start(() => {
      setI(to); ty.setValue(8);
      Animated.parallel([Animated.timing(v, { toValue: 1, duration: 160, useNativeDriver: true }), Animated.timing(ty, { toValue: 0, duration: 160, useNativeDriver: true })]).start();
    });
  };
  const nextRef = useRef(() => {}); nextRef.current = () => goTo((iRef.current + 1) % TITLES.length);
  useEffect(() => { const t = setInterval(() => { if (Date.now() - last.current < 20000) return; nextRef.current(); }, 5000); return () => clearInterval(t); }, []);

  const act = useMemo(() => subs.filter(live), [subs]);
  const ranked = useMemo(() => act.map((s) => ({ s, m: monthly(s) })).filter((x) => x.m > 0).sort((a, b) => b.m - a.m), [act]);
  const total = ranked.reduce((a, b) => a + b.m, 0); const top = Math.max(1, ...ranked.map((x) => x.m));
  const byPay = useMemo(() => {
    const m: Record<string, number> = {}; ranked.forEach((x) => { const k = x.s.pay && PAYS.some((p) => p.k === x.s.pay) ? x.s.pay : 'none'; m[k] = (m[k] || 0) + x.m; });
    return Object.keys(m).map((k) => ({ k, n: k === 'none' ? 'Not set' : payName(k), v: m[k], c: PAY_COL[k] || PAY_COL.other })).sort((a, b) => b.v - a.v);
  }, [ranked]);
  const perDay = (total * 12) / 365; const pct = income > 0 ? (total / income) * 100 : 0; const mtop = Math.max(1, ...months.map((x) => x.v));
  const bar = (val: number, max: number, c: [string, string]) => (<View style={{ height: 7, borderRadius: 4, backgroundColor: 'rgba(0,0,0,.22)', overflow: 'hidden', marginTop: 6 }}><LinearGradient colors={c} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: Math.max(4, Math.min(100, (val / (max || 1)) * 100)) + '%', height: '100%', borderRadius: 4 }} /></View>);
  const hr = <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.18)', marginTop: 10, paddingTop: 9 }} />;

  return (
    <View style={{ marginTop: 9, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' }}>
      <LinearGradient colors={['rgba(124,156,255,.4)', 'rgba(183,148,255,.3)', 'rgba(255,180,94,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 14 }}>
        <Pressable onPress={() => { last.current = Date.now(); buzz(); goTo((i + 1) % TITLES.length); }} accessibilityLabel="Next summary page" hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#8fe9e2', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>{TITLES[i]}</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {TITLES.map((t, k) => (<Pressable key={t} onPress={() => { last.current = Date.now(); buzz(); goTo(k); }} accessibilityLabel={'Show ' + t.toLowerCase()} hitSlop={8}><View style={{ width: k === i ? 18 : 7, height: 7, borderRadius: 4, backgroundColor: k === i ? '#fff' : 'rgba(255,255,255,.35)' }} /></Pressable>))}
          </View>
        </Pressable>
        <Animated.View onTouchStart={() => { last.current = Date.now(); }} style={{ marginTop: 14, height: BODY_H, opacity: v, transform: [{ translateY: ty }] }}>
          {i === 0 ? (<>
            {ranked.slice(0, 4).map((x, k) => (
              <View key={x.s.id} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={{ color: INK2, fontSize: 12, fontWeight: '800', width: 16 }}>{k + 1}</Text>
                  <Text numberOfLines={1} style={{ color: INK, fontSize: 14, fontWeight: '700', flex: 1 }}>{x.s.name}</Text>
                  <Text style={{ color: INK, fontSize: 13.5, fontWeight: '800' }}>{rm(x.m)}</Text><Text style={{ color: INK2, fontSize: 11.5 }}>/ month</Text>
                </View>
                {bar(x.m, top, [catOf(x.s.cat).c, '#b794ff'])}
                <Text style={{ color: INK2, fontSize: 11.5, marginTop: 4 }}>{catOf(x.s.cat).n} · {rm(x.m * 12)} a year</Text>
              </View>
            ))}
            <View style={{ flex: 1 }} />
            <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.18)', paddingTop: 9, flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: INK2, fontSize: 12 }}>All together, every month</Text><Text style={{ color: INK, fontSize: 13.5, fontWeight: '800' }}>{rm(total)}</Text></View>
          </>) : null}

          {i === 1 ? (<>
            <View style={{ alignItems: 'center', paddingVertical: 4 }}>
              <Text style={{ color: INK, fontSize: 34, fontWeight: '800' }}>{rm(perDay)}</Text>
              <Text style={{ color: INK2, fontSize: 12.5, marginTop: 2 }}>is what your subscriptions cost every day</Text>
            </View>
            {hr}
            {[['Every week', total * 12 / 52], ['Every month', total], ['Every year', total * 12]].map(([l, val]) => (
              <View key={String(l)} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: INK2, fontSize: 12.5 }}>{l}</Text><Text style={{ color: INK, fontSize: 13.5, fontWeight: '800' }}>{rm(Number(val))}</Text></View>
            ))}
            {hr}
            {income > 0 ? (<>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: INK2, fontSize: 12.5 }}>Share of your income this month</Text><Text style={{ color: INK, fontSize: 13.5, fontWeight: '800' }}>{pct < 10 ? pct.toFixed(1) : Math.round(pct)}%</Text></View>
              {bar(pct, 100, ['#8fe9e2', '#7c9cff'])}
            </>) : <Text style={{ color: INK2, fontSize: 12, lineHeight: 17 }}>Add your income for this month in My Finance and you will also see how much of it goes to subscriptions.</Text>}
          </>) : null}

          {i === 2 ? (<>
            {byPay.map((x) => (
              <View key={x.k} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: x.c }} />
                  <Text style={{ color: INK, fontSize: 14, fontWeight: '700', flex: 1 }}>{x.n}</Text>
                  <Text style={{ color: INK, fontSize: 13.5, fontWeight: '800' }}>{rm(x.v)}</Text><Text style={{ color: INK2, fontSize: 11.5 }}>/ month</Text>
                </View>
                {bar(x.v, total, [x.c, x.c])}
              </View>
            ))}
            <View style={{ flex: 1 }} />
            <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.18)', paddingTop: 9 }}><Text style={{ color: INK2, fontSize: 12, lineHeight: 17 }}>Keep enough money in each of these before the charge day. Only the type is saved, never a card number.</Text></View>
          </>) : null}

          {i === 3 ? (<>
            <Text style={{ color: INK2, fontSize: 12.5, lineHeight: 18, marginBottom: 10 }}>Stopping one of these frees up the most money. Tap one to open it. How to cancel is inside.</Text>
            {ranked.slice(0, 3).map((x, k) => (
              <Pressable key={x.s.id} onPress={() => { last.current = Date.now(); buzz(); onOpen(x.s); }} accessibilityLabel={'Open ' + x.s.name} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12, marginBottom: k < Math.min(3, ranked.length) - 1 ? 8 : 0, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.28)', backgroundColor: 'rgba(255,255,255,.1)', transform: [{ scale: pressed ? 0.98 : 1 }] })}>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: INK, fontSize: 14, fontWeight: '800' }}>{x.s.name}</Text>
                  <Text style={{ color: INK2, fontSize: 12, marginTop: 2 }}>Stop it and keep <Text style={{ color: '#8fe9e2', fontWeight: '800' }}>{rm(x.m * 12)}</Text> a year</Text>
                </View>
                <Text style={{ color: INK, fontSize: 18 }}>›</Text>
              </Pressable>
            ))}
          </>) : null}

          {i === 4 ? (<>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 170 }}>
              {months.map((m, k) => (
                <View key={m.k} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 5 }}>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: INK2, fontSize: 9.5, fontWeight: '700' }}>{m.v ? Math.round(m.v) : ''}</Text>
                  <LinearGradient colors={k === 0 ? ['#b9a6ff', '#7a5cf0'] : ['#8fe9e2', '#5aa8c8']} style={{ width: '100%', height: Math.max(6, (m.v / mtop) * 100), borderRadius: 8 }} />
                  <Text style={{ color: INK2, fontSize: 10.5 }}>{m.n}</Text>
                </View>
              ))}
            </View>
            <View style={{ flex: 1 }} />
            <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.18)', paddingTop: 9 }}><Text style={{ color: INK2, fontSize: 12, lineHeight: 17 }}>This month's coming charges come off Money Left.</Text></View>
          </>) : null}
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
