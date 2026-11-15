import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Glass } from '../components/Glass';
import { Blob } from '../components/Bg';
import { Inp, W } from '../components/Ui';
import { HeadIcon } from '../components/HabitIcons';
import { CardArt } from '../components/CardArt';
import { useStored } from '../lib/store';
import { TOP } from '../lib/layout';
import { HData, HEMPTY, Med, dateOf, keyOfDate, getDay, fmtTime, medDue, medRepeat, to12 } from '../lib/habit';

const T = '#5ee7df';
const DN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ICS = ['medicine', 'tablet', 'syrup', 'needle'];
const part = (t: string) => { const h = +t.slice(0, 2); return h < 12 ? 'MORNING' : h < 17 ? 'AFTERNOON' : h < 21 ? 'EVENING' : 'NIGHT'; };
const ORDER = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];

export default function Medicine() {
  const router = useRouter();
  const [h, setH] = useStored<HData>('ml_habit', HEMPTY);
  const [tab, setTab] = useState<'today' | 'week' | 'all'>('today');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState(''); const [dose, setDose] = useState(''); const [time, setTime] = useState('');
  const [rep, setRep] = useState<'every' | 'weekdays' | 'pick'>('every'); const [pick, setPick] = useState<number[]>([]);
  const [ic, setIc] = useState('medicine'); const [err, setErr] = useState('');
  const meds = h.meds || [];
  const today = dateOf(0); const tk = keyOfDate(today);
  const taken = getDay(h, 0).med || [];
  const due = meds.filter((m) => medDue(m, today));
  const done = due.filter((m) => taken.includes(m.id)).length;
  const pct = due.length ? done / due.length : 0;
  const nextOne = due.filter((m) => !taken.includes(m.id)).sort((a, b) => (a.time < b.time ? -1 : 1))[0];
  const toggle = (id: string) => { const cur = getDay(h, 0); const on = (cur.med || []).includes(id); setH({ ...h, days: { ...h.days, [tk]: { ...cur, med: on ? (cur.med || []).filter((x) => x !== id) : [...(cur.med || []), id] } } }); };
  const reset = () => { setName(''); setDose(''); setTime(''); setRep('every'); setPick([]); setIc('medicine'); setErr(''); };
  const save = () => {
    const nm = name.trim(); const tm = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time);
    if (!nm) { setErr('Type the name of the medicine.'); return; }
    if (!tm) { setErr('Type the time as 24-hour, for example 20:30.'); return; }
    if (rep === 'pick' && pick.length === 0) { setErr('Pick at least one day.'); return; }
    if (meds.length >= 10) { setErr('You can keep up to 10 medicines.'); return; }
    const days = rep === 'every' ? undefined : rep === 'weekdays' ? [1, 2, 3, 4, 5] : [...pick].sort();
    const m: Med = { id: String(Date.now()), name: nm.slice(0, 40), dose: dose.trim().slice(0, 60), time: String(+tm[1]).padStart(2, '0') + ':' + tm[2], ic, ...(days ? { days } : {}) };
    setH({ ...h, meds: [...meds, m].sort((a, b) => (a.time < b.time ? -1 : 1)) });
    reset(); setAdding(false); setTab('today');
  };
  const drop = (id: string) => setH({ ...h, meds: meds.filter((m) => m.id !== id) });
  const Chip = ({ on, t, onPress }: { on: boolean; t: string; onPress: () => void }) => (
    <Pressable onPress={onPress} style={{ paddingVertical: 8, paddingHorizontal: 15, borderRadius: 999, backgroundColor: on ? T : 'rgba(255,255,255,.12)' }}><Text style={{ color: on ? '#06222a' : W, fontSize: 12.5, fontWeight: '800' }}>{t}</Text></Pressable>
  );
  const Row = ({ m, check }: { m: Med; check?: boolean }) => { const on = taken.includes(m.id); return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 9, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.09)' }}>
      <HeadIcon k={m.ic || 'medicine'} size={38} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{m.name}</Text>
        <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5 }}>{(m.dose ? m.dose + ' · ' : '') + to12(m.time)}</Text>
        <View style={{ alignSelf: 'flex-start', marginTop: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 10 }}>{medRepeat(m)}</Text></View>
      </View>
      {check ? (
        <Pressable accessibilityLabel={on ? 'Mark ' + m.name + ' as not taken' : 'Mark ' + m.name + ' as taken'} onPress={() => toggle(m.id)} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: on ? T : 'rgba(255,255,255,.4)', backgroundColor: on ? T : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{on ? <Text style={{ color: '#06222a', fontWeight: '800', fontSize: 16 }}>✓</Text> : null}</Pressable>
      ) : (
        <Pressable onPress={() => drop(m.id)} hitSlop={8}><Text style={{ color: '#ff8fab', fontSize: 12.5, fontWeight: '800' }}>Remove</Text></Pressable>
      )}
    </View>); };
  const week = Array.from({ length: 7 }, (_, i) => { const off = i - 6; const d = dateOf(off); const x = getDay(h, off); const dm = meds.filter((m) => medDue(m, d)); return { d, n: dm.length, k: dm.filter((m) => (x.med || []).includes(m.id)).length, off }; });
  const R = 36; const C = 2 * Math.PI * R;
  return (
    <View style={{ flex: 1, backgroundColor: '#0d1030' }}>
      <LinearGradient colors={['#0d1030', '#1d1250', '#0f2b55']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(183,148,255,.5)" style={{ right: -100, top: -40 }} />
      <Blob size={340} color="rgba(94,231,223,.3)" style={{ left: -120, bottom: 0 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 60 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => (adding ? (reset(), setAdding(false)) : router.back())} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
            <Text style={{ flex: 1, color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>{adding ? 'Add medicine' : 'Medicine'}</Text>
            {!adding ? <Pressable onPress={() => { reset(); setAdding(true); }} accessibilityLabel="Add medicine"><LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 26, marginTop: -2 }}>+</Text></LinearGradient></Pressable> : null}
          </View>

          {adding ? (
            <>
              <Glass radius={24} style={{ marginTop: 14, padding: 14 }}>
                <Text style={{ color: T, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4 }}>NAME</Text>
                <Inp value={name} onChangeText={setName} placeholder="e.g. Paracetamol" style={{ marginTop: 6 }} />
                <Text style={{ color: T, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4, marginTop: 14 }}>DOSE (FROM YOUR LABEL OR DOCTOR)</Text>
                <Inp value={dose} onChangeText={setDose} placeholder="e.g. 500 mg, 1 tablet" style={{ marginTop: 6 }} />
                <Text style={{ color: T, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4, marginTop: 14 }}>REMINDER TIME (24-HOUR)</Text>
                <Inp value={time} onChangeText={(v: string) => setTime(fmtTime(v))} placeholder="e.g. 20:30" keyboardType="number-pad" maxLength={5} style={{ marginTop: 6 }} />
                <Text style={{ color: T, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4, marginTop: 14 }}>REPEAT</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <Chip on={rep === 'every'} t="Every day" onPress={() => setRep('every')} /><Chip on={rep === 'weekdays'} t="Weekdays" onPress={() => setRep('weekdays')} /><Chip on={rep === 'pick'} t="Pick days" onPress={() => setRep('pick')} />
                </View>
                {rep === 'pick' ? (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                    {DN.map((l, i) => { const on = pick.includes(i); return <Pressable key={i} onPress={() => setPick(on ? pick.filter((x) => x !== i) : [...pick, i])} style={{ flex: 1, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? T : 'rgba(255,255,255,.12)' }}><Text style={{ color: on ? '#06222a' : W, fontWeight: '800', fontSize: 13 }}>{l}</Text></Pressable>; })}
                  </View>
                ) : null}
                <Text style={{ color: T, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4, marginTop: 14 }}>ICON</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  {ICS.map((k) => <Pressable key={k} onPress={() => setIc(k)} style={{ padding: 4, borderRadius: 16, borderWidth: 2, borderColor: ic === k ? W : 'transparent' }}><HeadIcon k={k} size={38} /></Pressable>)}
                </View>
                {err ? <Text style={{ color: '#ffb3bf', fontSize: 12, marginTop: 12 }}>{err}</Text> : null}
              </Glass>
              <Text style={{ color: '#ffd593', fontSize: 11, lineHeight: 15, marginTop: 10 }}>My Life does not give dose advice. Type what is on the label or in your doctor's note. You get a reminder at the time you set, and again an hour later if it is not ticked.</Text>
              <Pressable onPress={save} style={{ marginTop: 14, alignSelf: 'flex-start' }}><LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, paddingHorizontal: 26, borderRadius: 999 }}><Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Save medicine</Text></LinearGradient></Pressable>
            </>
          ) : (
            <>
              <Glass radius={24} style={{ marginTop: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <CardArt kind="med" />
                <View style={{ width: 84, height: 84, alignItems: 'center', justifyContent: 'center' }}>
                  <Svg width={84} height={84} viewBox="0 0 84 84" style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                    <Circle cx="42" cy="42" r={R} stroke="rgba(255,255,255,.16)" strokeWidth="9" fill="none" />
                    <Circle cx="42" cy="42" r={R} stroke={T} strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={`${C * pct} ${C}`} />
                  </Svg>
                  <Text style={{ color: W, fontSize: 17, fontWeight: '800' }}>{done}/{due.length}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Today's medicine</Text>
                  <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 12, marginTop: 5, lineHeight: 17 }}>{!meds.length ? 'Add a medicine to get reminders.' : !due.length ? 'Nothing due today.' : nextOne ? (due.length - done) + ' left to take. Next: ' + nextOne.name + ' at ' + to12(nextOne.time) : 'All done for today.'}</Text>
                  <Text style={{ color: '#ffd593', fontSize: 11, marginTop: 4 }}>Not ticked? You get a nudge after 1 hour.</Text>
                </View>
              </Glass>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
                <Chip on={tab === 'today'} t="Today" onPress={() => setTab('today')} /><Chip on={tab === 'week'} t="Week" onPress={() => setTab('week')} /><Chip on={tab === 'all'} t="All medicines" onPress={() => setTab('all')} />
              </View>
              {tab === 'today' ? (
                !due.length ? <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, marginTop: 18 }}>{meds.length ? 'No medicine is due today.' : 'Tap + to add your first medicine.'}</Text>
                : ORDER.filter((p) => due.some((m) => part(m.time) === p)).map((p) => (
                  <View key={p}>
                    <Text style={{ color: '#9fb0d0', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4, marginTop: 14, marginBottom: 8 }}>{p}</Text>
                    {due.filter((m) => part(m.time) === p).map((m) => <Row key={m.id} m={m} check />)}
                  </View>))
              ) : null}
              {tab === 'week' ? (
                <Glass radius={24} style={{ marginTop: 14, padding: 14 }}>
                  <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Last 7 days</Text>
                  {week.map((x) => { const full = x.n > 0 && x.k === x.n; return (
                    <View key={x.off} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                      <Text style={{ color: 'rgba(255,255,255,.8)', width: 78, fontSize: 12.5, fontWeight: x.off === 0 ? '800' : '600' }}>{x.off === 0 ? 'Today' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][x.d.getDay()] + ' ' + x.d.getDate()}</Text>
                      <View style={{ flex: 1, height: 10, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.14)', overflow: 'hidden' }}><View style={{ width: (x.n ? (x.k / x.n) * 100 : 0) + '%', height: '100%', backgroundColor: full ? T : '#ffc46b' }} /></View>
                      <Text style={{ color: full ? T : 'rgba(255,255,255,.75)', width: 38, textAlign: 'right', fontSize: 12.5, fontWeight: '800' }}>{x.n ? x.k + '/' + x.n : '-'}</Text>
                    </View>); })}
                  <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, marginTop: 12, lineHeight: 15 }}>Only days when a medicine was due are counted. A personal record, not medical advice.</Text>
                </Glass>
              ) : null}
              {tab === 'all' ? (
                <View style={{ marginTop: 14 }}>
                  {meds.length ? meds.map((m) => <Row key={m.id} m={m} />) : <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 13 }}>No medicines yet. Tap + to add one.</Text>}
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
