import React, { useMemo, useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Text } from './Txt';
import { EqPills } from './TabSlide';
import { catOf, monthly, rm, live, payName, PAYS, type Sub } from '../lib/subs';

const INK = '#ffffff', INK2 = 'rgba(255,255,255,.72)';
const buzz = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
const TABS = ['Costliest', 'Per day', 'By payment', 'Save'];
const PAY_COL: Record<string, string> = { debit: '#8ea8ff', credit: '#ff9ac4', ewallet: '#5ee7b5', bank: '#ffd24a', other: '#c9b6ff', none: 'rgba(255,255,255,.5)' };

/** One box with sliding tabs. It reads only what is already saved: your subscriptions and your income for this month. */
export function SubInsights({ subs, income, onOpen }: { subs: Sub[]; income: number; onOpen: (s: Sub) => void }) {
  const [tab, setTab] = useState(0);
  const act = useMemo(() => subs.filter(live), [subs]);
  const ranked = useMemo(() => act.map((s) => ({ s, m: monthly(s) })).filter((x) => x.m > 0).sort((a, b) => b.m - a.m), [act]);
  const total = ranked.reduce((a, b) => a + b.m, 0); const top = Math.max(1, ...ranked.map((x) => x.m));
  const byPay = useMemo(() => {
    const m: Record<string, number> = {}; ranked.forEach((x) => { const k = x.s.pay && PAYS.some((p) => p.k === x.s.pay) ? x.s.pay : 'none'; m[k] = (m[k] || 0) + x.m; });
    return Object.keys(m).map((k) => ({ k, n: k === 'none' ? 'Not set' : payName(k), v: m[k], c: PAY_COL[k] || PAY_COL.other })).sort((a, b) => b.v - a.v);
  }, [ranked]);
  const perDay = (total * 12) / 365; const pct = income > 0 ? (total / income) * 100 : 0;
  const bar = (v: number, max: number, c: [string, string]) => (<View style={{ height: 7, borderRadius: 4, backgroundColor: 'rgba(0,0,0,.22)', overflow: 'hidden', marginTop: 6 }}><LinearGradient colors={c} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: Math.max(4, Math.min(100, (v / (max || 1)) * 100)) + '%', height: '100%', borderRadius: 4 }} /></View>);
  const hr = <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.18)', marginTop: 10, paddingTop: 9 }} />;

  return (
    <View>
      <EqPills tabs={TABS} index={tab} onChange={setTab} colors={['#7c9cff', '#b794ff']} fontSize={12} />
      <View style={{ marginTop: 14 }}>
        {tab === 0 ? (<>
          {ranked.slice(0, 6).map((x, i) => (
            <View key={x.s.id} style={{ marginBottom: i < Math.min(6, ranked.length) - 1 ? 12 : 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <Text style={{ color: INK2, fontSize: 12, fontWeight: '800', width: 16 }}>{i + 1}</Text>
                <Text numberOfLines={1} style={{ color: INK, fontSize: 14, fontWeight: '700', flex: 1 }}>{x.s.name}</Text>
                <Text style={{ color: INK, fontSize: 13.5, fontWeight: '800' }}>{rm(x.m)}</Text><Text style={{ color: INK2, fontSize: 11.5 }}>/ month</Text>
              </View>
              {bar(x.m, top, [catOf(x.s.cat).c, '#b794ff'])}
              <Text style={{ color: INK2, fontSize: 11.5, marginTop: 4 }}>{catOf(x.s.cat).n} · {rm(x.m * 12)} a year</Text>
            </View>
          ))}
          {hr}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: INK2, fontSize: 12 }}>All together, every month</Text><Text style={{ color: INK, fontSize: 13.5, fontWeight: '800' }}>{rm(total)}</Text></View>
        </>) : null}

        {tab === 1 ? (<>
          <View style={{ alignItems: 'center', paddingVertical: 4 }}>
            <Text style={{ color: INK, fontSize: 34, fontWeight: '800' }}>{rm(perDay)}</Text>
            <Text style={{ color: INK2, fontSize: 12.5, marginTop: 2 }}>is what your subscriptions cost every day</Text>
          </View>
          {hr}
          {[['Every week', total * 12 / 52], ['Every month', total], ['Every year', total * 12]].map(([l, v]) => (
            <View key={String(l)} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}><Text style={{ color: INK2, fontSize: 12.5 }}>{l}</Text><Text style={{ color: INK, fontSize: 13.5, fontWeight: '800' }}>{rm(Number(v))}</Text></View>
          ))}
          {hr}
          {income > 0 ? (<>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: INK2, fontSize: 12.5 }}>Share of your income this month</Text><Text style={{ color: INK, fontSize: 13.5, fontWeight: '800' }}>{pct < 10 ? pct.toFixed(1) : Math.round(pct)}%</Text></View>
            {bar(pct, 100, ['#8fe9e2', '#7c9cff'])}
          </>) : <Text style={{ color: INK2, fontSize: 12, lineHeight: 17 }}>Add your income for this month in My Finance and you will also see how much of it goes to subscriptions.</Text>}
        </>) : null}

        {tab === 2 ? (<>
          {byPay.map((x, i) => (
            <View key={x.k} style={{ marginBottom: i < byPay.length - 1 ? 12 : 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: x.c }} />
                <Text style={{ color: INK, fontSize: 14, fontWeight: '700', flex: 1 }}>{x.n}</Text>
                <Text style={{ color: INK, fontSize: 13.5, fontWeight: '800' }}>{rm(x.v)}</Text><Text style={{ color: INK2, fontSize: 11.5 }}>/ month</Text>
              </View>
              {bar(x.v, total, [x.c, x.c])}
            </View>
          ))}
          {hr}
          <Text style={{ color: INK2, fontSize: 12, lineHeight: 17 }}>Keep enough money in each of these before the charge day. Only the type is saved, never a card number.</Text>
        </>) : null}

        {tab === 3 ? (<>
          <Text style={{ color: INK2, fontSize: 12.5, lineHeight: 18, marginBottom: 10 }}>Stopping one of these frees up the most money. Tap one to open it. How to cancel is inside.</Text>
          {ranked.slice(0, 3).map((x, i) => (
            <Pressable key={x.s.id} onPress={() => { buzz(); onOpen(x.s); }} accessibilityLabel={'Open ' + x.s.name} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12, marginBottom: i < Math.min(3, ranked.length) - 1 ? 8 : 0, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.28)', backgroundColor: 'rgba(255,255,255,.1)', transform: [{ scale: pressed ? 0.98 : 1 }] })}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: INK, fontSize: 14, fontWeight: '800' }}>{x.s.name}</Text>
                <Text style={{ color: INK2, fontSize: 12, marginTop: 2 }}>Stop it and keep <Text style={{ color: '#8fe9e2', fontWeight: '800' }}>{rm(x.m * 12)}</Text> a year</Text>
              </View>
              <Text style={{ color: INK, fontSize: 18 }}>›</Text>
            </Pressable>
          ))}
        </>) : null}
      </View>
    </View>
  );
}
