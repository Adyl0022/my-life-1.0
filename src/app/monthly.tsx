import React, { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '../components/Txt';
import { Pressable } from '../components/Press';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { InsightsBg } from '../components/PageBg';
import { Glass } from '../components/Glass';
import { Rise, FillBar } from '../components/Anim';
import { EqPills } from '../components/TabSlide';
import { TOP } from '../lib/layout';
import { useMonths, useMonthSeen } from '../lib/useMonth';
import { MSum, MSec } from '../lib/monthSummary';

const DIM = 'rgba(255,255,255,.72)';
const Head = ({ t, c = '#fff' }: { t: string; c?: string }) => <Text style={{ color: c, fontSize: 15, fontWeight: '800', marginTop: 20, marginBottom: 9, marginHorizontal: 4 }}>{t}</Text>;
const Bullets = ({ items, dot }: { items: string[]; dot: string }) => (
  <Glass radius={22} style={{ paddingVertical: 12, paddingHorizontal: 15 }}>
    {items.map((x, i) => (
      <View key={i} style={{ flexDirection: 'row', gap: 10, marginTop: i ? 10 : 0 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot, marginTop: 6 }} />
        <Text style={{ flex: 1, color: 'rgba(255,255,255,.92)', fontSize: 13, lineHeight: 19 }}>{x}</Text>
      </View>
    ))}
  </Glass>
);
const Section = ({ s, i }: { s: MSec; i: number }) => (
  <Rise i={i}>
    <Glass radius={24} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.c }} />
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{s.title}</Text>
        </View>
        {s.pct !== undefined ? <Text style={{ color: s.c, fontSize: 14, fontWeight: '800' }}>{s.pct}<Text style={{ fontSize: 11, color: DIM }}> / 100</Text></Text> : null}
      </View>
      {s.pct !== undefined ? <View style={{ marginTop: 9 }}><FillBar p={s.pct} color={s.c} dep={s.title + s.pct} /></View> : null}
      {s.rows.map((r, k) => (
        <View key={k} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: k ? 1 : 0, borderTopColor: 'rgba(255,255,255,.1)', marginTop: k === 0 ? 8 : 0 }}>
          <Text style={{ flex: 1, color: DIM, fontSize: 12.5 }}>{r.l}</Text>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'right' }}>{r.v}</Text>
          {r.d !== undefined && r.d !== null && r.d !== 0 ? <Text style={{ minWidth: 50, textAlign: 'right', color: r.good ? '#7df0c6' : '#ff8fab', fontSize: 11.5, fontWeight: '800' }}>{(r.d > 0 ? '+' : '') + r.d + '%'}</Text> : <View style={{ width: 0 }} />}
        </View>
      ))}
    </Glass>
  </Rise>
);

function Body({ s }: { s: MSum }) {
  if (!s.hasData) {
    return (
      <Glass radius={26} style={{ marginTop: 16, padding: 20 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Nothing logged in {s.name} yet</Text>
        <Text style={{ color: DIM, fontSize: 13, lineHeight: 19, marginTop: 6 }}>{s.story}</Text>
      </Glass>
    );
  }
  let n = 1;
  return (
    <>
      <Rise i={0}>
        <Glass radius={28} style={{ marginTop: 16, padding: 18 }}>
          <LinearGradient colors={['rgba(124,156,255,.32)', 'rgba(183,148,255,.18)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
          <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>{s.label.toUpperCase()}{s.partial ? ' · SO FAR' : ''}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 }}>
            {s.score !== null ? (
              <View style={{ width: 74, height: 74, borderRadius: 37, borderWidth: 6, borderColor: 'rgba(143,233,226,.85)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.08)' }}>
                <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', lineHeight: 30 }}>{s.score}</Text>
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 25 }}>{s.headline}</Text>
              <Text style={{ color: DIM, fontSize: 12, marginTop: 3 }}>{s.score !== null ? 'Life score out of 100' : 'Logged on ' + s.logged + ' of ' + s.upto + ' days'}</Text>
            </View>
          </View>
          <Text style={{ color: 'rgba(255,255,255,.92)', fontSize: 13.5, lineHeight: 21, marginTop: 14 }}>{s.story}</Text>
          {s.stats.length ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              {s.stats.map((x) => (
                <View key={x.l} style={{ flex: 1, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 16, backgroundColor: 'rgba(0,0,0,.22)', alignItems: 'center' }}>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{x.v}</Text>
                  <Text numberOfLines={1} style={{ color: DIM, fontSize: 10.5, marginTop: 2 }}>{x.l}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Glass>
      </Rise>

      {s.sections.map((x) => <Section key={x.k} s={x} i={n++} />)}

      <Rise i={n++}><Head t="What went well" c="#7df0c6" /><Bullets items={s.wins} dot="#7df0c6" /></Rise>
      <Rise i={n++}><Head t="What you can improve" c="#ffc46b" /><Bullets items={s.improve} dot="#ffc46b" /></Rise>
      <Rise i={n++}><Head t="Tips and advice" c="#c3b0ff" /><Bullets items={s.advice} dot="#c3b0ff" /></Rise>
      <Rise i={n++}>
        <Head t={s.partial ? 'Goals for the rest of the month' : 'Goals for next month'} c="#8fe9e2" />
        <Glass radius={22} style={{ paddingVertical: 12, paddingHorizontal: 15 }}>
          {s.focus.map((x, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10, marginTop: i ? 10 : 0, alignItems: 'flex-start' }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.6, borderColor: '#8fe9e2', marginTop: 1 }} />
              <Text style={{ flex: 1, color: 'rgba(255,255,255,.92)', fontSize: 13, lineHeight: 19 }}>{x}</Text>
            </View>
          ))}
        </Glass>
      </Rise>
    </>
  );
}

export default function Monthly() {
  const router = useRouter(); const m = useMonths(); const [, setSeen] = useMonthSeen();
  const [tab, setTab] = useState<number | null>(null);
  const idx = tab ?? (m.last.hasData || !m.cur.hasData ? 0 : 1);
  useEffect(() => { if (m.last.hasData) setSeen(m.last.ym); }, [m.last.ym, m.last.hasData]); // eslint-disable-line react-hooks/exhaustive-deps
  const s = idx === 0 ? m.last : m.cur;
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <LinearGradient colors={['#0a0f2c', '#1a1048', '#0c2b4d']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <InsightsBg />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 70 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
            <View style={{ flex: 1 }}><Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Your month</Text><Text style={{ color: DIM, fontSize: 12, marginTop: 5 }}>Your life at a glance, month by month</Text></View>
          </View>
          <View style={{ marginTop: 16 }}>
            <EqPills tabs={['Last month', 'This month so far']} index={idx} onChange={(i) => setTab(i)} colors={['#7c9cff', '#b794ff']} fontSize={12.5} />
          </View>
          <Body key={idx} s={s} />
          <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, lineHeight: 17, marginTop: 18, marginHorizontal: 4 }}>Worked out on this phone from what you logged, using only the modules you keep on. It is a personal record, not medical or financial advice.</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
