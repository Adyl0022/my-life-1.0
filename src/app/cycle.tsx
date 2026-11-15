import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Glass } from '../components/Glass';
import { Blob } from '../components/Bg';
import { W } from '../components/Ui';
import { CardArt } from '../components/CardArt';
import { useStored } from '../lib/store';
import { TOP } from '../lib/layout';
import { HData, HEMPTY, MON, dateOf, getDay } from '../lib/habit';
import { cycleInfo, statusText, nextDate, fmtD, SYMS, FLOW } from '../lib/cycle';
import { useCycleSave } from '../lib/cycleHook';
import { useHidden } from '../lib/hidden';

const PINK = '#ff8fab'; const T = '#5ee7df'; const DIM = 'rgba(255,255,255,.7)';
const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Cycle() {
  const router = useRouter();
  const [h, setH] = useStored<HData>('ml_habit', HEMPTY);
  const { setPeriod, patch } = useCycleSave(h, setH);
  const [mo, setMo] = useState(0);
  const hid = useHidden();
  const c = cycleInfo(h);
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + mo);
  const y = base.getFullYear(), m = base.getMonth();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7; const dim = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)]; while (cells.length % 7) cells.push(null);
  const offOf = (d: number) => Math.round((new Date(y, m, d, 12).getTime() - dateOf(0).getTime()) / 86400000);
  const nd = nextDate(c);
  const today = getDay(h, 0);
  const rem = h.cyRem !== false;
  return (
    <View style={{ flex: 1, backgroundColor: '#0d1030' }}>
      <LinearGradient colors={['#0d1030', '#1d1250', '#0f2b55']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(183,148,255,.5)" style={{ right: -100, top: -40 }} />
      <Blob size={340} color="rgba(94,231,223,.3)" style={{ left: -120, bottom: 0 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 60 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
            <Text style={{ flex: 1, color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Cycle</Text>
          </View>

          <Glass radius={24} style={{ marginTop: 14, padding: 14 }}>
            <CardArt kind="cycle" />
            <Text style={{ color: W, fontSize: 16, fontWeight: '800' }}>{statusText(c)}</Text>
            {nd && !c.onPeriod ? <Text style={{ color: DIM, fontSize: 12, marginTop: 4 }}>{'Around ' + fmtD(nd) + (c.learned ? ' · based on your average cycle of ' + c.avgCycle + ' days' : ' · uses 28 days until you log two periods')}</Text> : null}
            <Pressable onPress={() => setPeriod(0, !today.pd)} style={{ marginTop: 12, alignSelf: 'flex-start' }}>
              <View style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 999, backgroundColor: today.pd ? PINK : 'rgba(255,255,255,.14)' }}><Text style={{ color: today.pd ? '#3a0f1c' : W, fontSize: 13.5, fontWeight: '800' }}>{today.pd ? 'Period today ✓' : 'Period started today'}</Text></View>
            </Pressable>
            {today.pd ? (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                {FLOW.map((f, i) => <Pressable key={f} onPress={() => patch(0, { fl: today.fl === i ? undefined : i })} style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: today.fl === i ? PINK : 'rgba(255,255,255,.12)' }}><Text style={{ color: today.fl === i ? '#3a0f1c' : W, fontSize: 12.5, fontWeight: '800' }}>{f}</Text></Pressable>)}
              </View>
            ) : null}
            <Text style={{ color: DIM, fontSize: 12, marginTop: 12 }}>How do you feel today?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {SYMS.map((s) => { const on = (today.sy || []).includes(s); return <Pressable key={s} onPress={() => patch(0, { sy: on ? (today.sy || []).filter((x) => x !== s) : [...(today.sy || []), s] })} style={{ paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, backgroundColor: on ? T : 'rgba(255,255,255,.12)' }}><Text style={{ color: on ? '#06222a' : W, fontSize: 12.5, fontWeight: '800' }}>{s}</Text></Pressable>; })}
            </View>
          </Glass>

          <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View><Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Calendar</Text><Text style={{ color: DIM, fontSize: 12, marginTop: 4 }}>{MN[m] + ' ' + y + ' · tap a day to mark it'}</Text></View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable accessibilityLabel="Previous month" onPress={() => { if (mo > -12) setMo(mo - 1); }} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center', opacity: mo > -12 ? 1 : 0.4 }}><Text style={{ color: W, fontSize: 18, marginTop: -2 }}>‹</Text></Pressable>
                <Pressable accessibilityLabel="Next month" onPress={() => { if (mo < 1) setMo(mo + 1); }} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center', opacity: mo < 1 ? 1 : 0.4 }}><Text style={{ color: W, fontSize: 18, marginTop: -2 }}>›</Text></Pressable>
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 10 }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,.55)', fontSize: 10.5, fontWeight: '700' }}>{l}</Text>)}</View>
            {Array.from({ length: cells.length / 7 }, (_, r) => (
              <View key={r} style={{ flexDirection: 'row', marginTop: 5, gap: 5 }}>
                {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
                  if (d == null) return <View key={i} style={{ flex: 1, aspectRatio: 1 }} />;
                  const o = offOf(d); const fut = o > 0; const pd = !fut && !!getDay(h, o).pd; const isT = o === 0;
                  let pred = false; if (c.nextOff != null && !pd) { const e = o - c.nextOff; pred = e >= 0 && e < c.avgPeriod && o >= 0; }
                  return (
                    <Pressable key={i} disabled={fut} onPress={() => setPeriod(o, !pd)} style={{ flex: 1, aspectRatio: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: pd ? PINK : pred ? 'rgba(255,143,171,.22)' : 'rgba(255,255,255,.07)', borderWidth: isT ? 1.5 : pred ? 1 : 0, borderColor: isT ? 'rgba(255,255,255,.7)' : 'rgba(255,143,171,.6)', opacity: fut ? 0.35 : 1 }}>
                      <Text style={{ color: pd ? '#3a0f1c' : W, fontSize: 11.5, fontWeight: isT || pd ? '800' : '600' }}>{d}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
            <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, marginTop: 8 }}>Pink is a period day you marked. A pink outline is the estimate for the next one.</Text>
          </Glass>

          <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
            <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Your averages</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
              {[[String(c.avgCycle), 'day cycle'], [String(c.avgPeriod), 'day period'], [String(c.periods.length), 'logged']].map((x) => <View key={x[1]} style={{ alignItems: 'center' }}><Text style={{ color: W, fontSize: 22, fontWeight: '800' }}>{x[0]}</Text><Text style={{ color: DIM, fontSize: 11.5, marginTop: 4 }}>{x[1]}</Text></View>)}
            </View>
            {c.periods.length ? <Text style={{ color: DIM, fontSize: 12, marginTop: 12 }}>{'Last periods: ' + c.periods.slice(-4).reverse().map((p) => fmtD(dateOf(p.start)) + ' (' + p.len + 'd)').join(' · ')}</Text> : <Text style={{ color: DIM, fontSize: 12, marginTop: 12 }}>Nothing logged yet.</Text>}
          </Glass>

          <Pressable onPress={() => setH({ ...h, cyRem: !rem })} style={{ marginTop: 12 }}>
            <Glass radius={24} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: rem ? T : 'rgba(255,255,255,.4)', backgroundColor: rem ? T : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{rem ? <Text style={{ color: '#0d1030', fontWeight: '800', fontSize: 14 }}>✓</Text> : null}</View>
              <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>Reminder 2 days before</Text><Text style={{ color: DIM, fontSize: 11.5, lineHeight: 15, marginTop: 4 }}>The notification says only "Reminder from My Life", so nothing private shows on your lock screen.</Text></View>
            </Glass>
          </Pressable>

          {hid.on('islamic') ? (
          <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
            <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Fasting and qadha</Text>
            <Text style={{ color: DIM, fontSize: 12, lineHeight: 17, marginTop: 4 }}>Period days that fall in Ramadan are marked as excused in your Fasting record, so they are added to the qadha you still owe. If you unmark a day here, the mark is removed too.</Text>
          </Glass>
          ) : null}
          <Text style={{ color: '#ffd593', fontSize: 11, lineHeight: 15, marginTop: 12 }}>These are estimates from your own records, not medical advice, and not for planning or avoiding pregnancy. If your cycle is very irregular or you have strong pain, please see a doctor.</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
