import React, { useState } from 'react';
import { View, ScrollView, Pressable, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
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
import { PageArt } from '../components/PageArt';
import { useStored } from '../lib/store';
import { TOP } from '../lib/layout';
import { missedDoses } from '../lib/medMissed';
import { weekOffs, HData, HEMPTY, Med, dateOf, keyOfDate, getDay, fmtTime, medDue, medRepeat, to12 } from '../lib/habit';

import { confirmDelete } from '../lib/dialog';
const T = '#5ee7df';
const DN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ICS: [string, string][] = [['medicine', 'Capsule'], ['tablet', 'Tablet'], ['syrup', 'Syrup'], ['needle', 'Injection'], ['drops', 'Drops'], ['inhaler', 'Inhaler'], ['cream', 'Cream'], ['vitamin', 'Vitamin']];
const part = (t: string) => { const h = +t.slice(0, 2); return h < 12 ? 'MORNING' : h < 17 ? 'AFTERNOON' : h < 21 ? 'EVENING' : 'NIGHT'; };
const ORDER = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];

export default function Medicine() {
  const router = useRouter();
  const [h, setH] = useStored<HData>('ml_habit', HEMPTY);
  const [tab, setTab] = useState<'today' | 'week' | 'all'>('today');
  // Without "exact timing" Android may hold a reminder back by many minutes, even an hour. Tell the person and let them turn it on.
  const [exact, setExact] = useState<boolean | null>(null);
  React.useEffect(() => { if (Platform.OS !== 'android') return; Notifications.getExactAlarmPermissionsAsync().then((r: any) => setExact(!!r.granted)).catch(() => setExact(null)); }, []);
  const [ring, setRing] = useStored<boolean>('ml_med_ring', true);
  const askExact = async () => { try { const r: any = await Notifications.requestExactAlarmPermissionsAsync(); setExact(!!r.granted); } catch (e) { /* ignore */ } };
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState('');
  const [name, setName] = useState(''); const [dose, setDose] = useState(''); const [time, setTime] = useState('');
  const [rep, setRep] = useState<'every' | 'weekdays' | 'pick'>('every'); const [pick, setPick] = useState<number[]>([]);
  const [ic, setIc] = useState('medicine'); const [err, setErr] = useState('');
  const meds = h.meds || [];
  const [clock, setClock] = useState(Date.now());
  React.useEffect(() => { const t = setInterval(() => setClock(Date.now()), 60000); return () => clearInterval(t); }, []);
  const miss = missedDoses(h, new Date(clock), 7);
  const missToday = miss.filter((x) => x.off === 0);
  const stOf = (id: string) => { const x = missToday.find((y) => y.med.id === id); return x ? x.status : ''; };
  const missedAll = miss.filter((x) => x.status === 'missed');
  const today = dateOf(0); const tk = keyOfDate(today);
  const taken = getDay(h, 0).med || [];
  const due = meds.filter((m) => medDue(m, today));
  const done = due.filter((m) => taken.includes(m.id)).length;
  const pct = due.length ? done / due.length : 0;
  const nextOne = due.filter((m) => !taken.includes(m.id)).sort((a, b) => (a.time < b.time ? -1 : 1))[0];
  const toggle = (id: string) => { const cur = getDay(h, 0); const on = (cur.med || []).includes(id); setH({ ...h, days: { ...h.days, [tk]: { ...cur, med: on ? (cur.med || []).filter((x) => x !== id) : [...(cur.med || []), id] } } }); };
  const reset = () => { setName(''); setDose(''); setTime(''); setRep('every'); setPick([]); setIc('medicine'); setErr(''); setEditId(''); };
  const startEdit = (m: Med) => {
    const dd = m.days || [];
    setName(m.name); setDose(m.dose || ''); setTime(m.time); setIc(m.ic || 'medicine'); setErr('');
    if (dd.length === 0 || dd.length >= 7) { setRep('every'); setPick([]); } else if ([...dd].sort().join('') === '12345') { setRep('weekdays'); setPick([]); } else { setRep('pick'); setPick([...dd]); }
    setEditId(m.id); setAdding(true);
  };
  const save = () => {
    const nm = name.trim(); const tm = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time);
    if (!nm) { setErr('Type the name of the medicine.'); return; }
    if (!tm) { setErr('Type the time as 24-hour, for example 20:30.'); return; }
    if (rep === 'pick' && pick.length === 0) { setErr('Pick at least one day.'); return; }
    if (!editId && meds.length >= 10) { setErr('You can keep up to 10 medicines.'); return; }
    const days = rep === 'every' ? undefined : rep === 'weekdays' ? [1, 2, 3, 4, 5] : [...pick].sort();
    const tmS = String(+tm[1]).padStart(2, '0') + ':' + tm[2];
    if (editId) {
      const old = meds.find((x) => x.id === editId);
      if (old) {
        const changed = old.time !== tmS || JSON.stringify([...(old.days || [])].sort()) !== JSON.stringify([...(days || [])].sort());
        const { days: _d, ...rest } = old;
        const nm2: Med = { ...rest, name: nm.slice(0, 40), dose: dose.trim().slice(0, 60), time: tmS, ic, ...(days ? { days } : {}), ...(changed ? { since: Date.now() } : {}) };
        setH({ ...h, meds: meds.map((x) => (x.id === editId ? nm2 : x)).sort((a, b) => (a.time < b.time ? -1 : 1)) });
      }
      reset(); setAdding(false); setTab('all');
      return;
    }
    const m: Med = { id: String(Date.now()), name: nm.slice(0, 40), dose: dose.trim().slice(0, 60), time: String(+tm[1]).padStart(2, '0') + ':' + tm[2], ic, ...(days ? { days } : {}) };
    setH({ ...h, meds: [...meds, m].sort((a, b) => (a.time < b.time ? -1 : 1)) });
    reset(); setAdding(false); setTab('today');
  };
  const drop = (id: string) => setH({ ...h, meds: meds.filter((m) => m.id !== id) });
  const Chip = ({ on, t, onPress }: { on: boolean; t: string; onPress: () => void }) => (
    <Pressable onPress={onPress} style={{ paddingVertical: 8, paddingHorizontal: 15, borderRadius: 999, backgroundColor: on ? T : 'rgba(255,255,255,.12)' }}><Text style={{ color: on ? '#06222a' : W, fontSize: 12.5, fontWeight: '800' }}>{t}</Text></Pressable>
  );
  const Row = ({ m, check }: { m: Med; check?: boolean }) => { const on = taken.includes(m.id); const st = check && !on ? stOf(m.id) : ''; return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 9, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 18, backgroundColor: st === 'missed' ? 'rgba(255,120,140,.16)' : 'rgba(255,255,255,.09)', borderWidth: st ? 1 : 0, borderColor: st === 'missed' ? 'rgba(255,140,160,.55)' : 'rgba(255,196,107,.5)' }}>
      <HeadIcon k={m.ic || 'medicine'} size={38} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{m.name}</Text>
        <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5 }}>{(m.dose ? m.dose + ' · ' : '') + to12(m.time)}</Text>
        <View style={{ alignSelf: 'flex-start', marginTop: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 10 }}>{medRepeat(m)}</Text></View>
        {st ? <View style={{ alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: st === 'missed' ? 'rgba(255,120,140,.3)' : 'rgba(255,196,107,.28)' }}><Text style={{ color: st === 'missed' ? '#ffb3c0' : '#ffd593', fontSize: 10.5, fontWeight: '800' }}>{st === 'missed' ? 'Missed · tap the circle if you took it' : 'Overdue · take it now'}</Text></View> : null}
      </View>
      {check ? (
        <Pressable accessibilityLabel={on ? 'Mark ' + m.name + ' as not taken' : 'Mark ' + m.name + ' as taken'} onPress={() => toggle(m.id)} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: on ? T : 'rgba(255,255,255,.4)', backgroundColor: on ? T : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{on ? <Text style={{ color: '#06222a', fontWeight: '800', fontSize: 16 }}>✓</Text> : null}</Pressable>
      ) : (
        <View style={{ alignItems: 'flex-end', gap: 10 }}>
          <Pressable onPress={() => startEdit(m)} hitSlop={8} accessibilityLabel={'Edit ' + m.name}><Text style={{ color: T, fontSize: 12.5, fontWeight: '800' }}>Edit</Text></Pressable>
          <Pressable onPress={() => confirmDelete('this medicine', () => drop(m.id), { title: 'Remove this medicine?', yes: 'Remove' })} hitSlop={8}><Text style={{ color: '#ff8fab', fontSize: 12.5, fontWeight: '800' }}>Remove</Text></Pressable>
        </View>
      )}
    </View>); };
  const week = weekOffs().map((off) => { const d = dateOf(off); const x = getDay(h, off); const dm = meds.filter((m) => medDue(m, d)); return { d, n: off > 0 ? 0 : dm.length, k: dm.filter((m) => (x.med || []).includes(m.id)).length, off }; });
  const R = 36; const C = 2 * Math.PI * R;
  return (
    <View style={{ flex: 1, backgroundColor: '#0d1030' }}>
      <LinearGradient colors={['#0d1030', '#1d1250', '#0f2b55']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(183,148,255,.5)" style={{ right: -100, top: -40 }} />
      <Blob size={340} color="rgba(94,231,223,.3)" style={{ left: -120, bottom: 0 }} />
      <PageArt kind="med" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 60 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => (adding ? (reset(), setAdding(false)) : router.back())} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
            <Text style={{ flex: 1, color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>{adding ? (editId ? 'Edit medicine' : 'Add medicine') : 'Medicine'}</Text>
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
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, rowGap: 10 }}>
                  {ICS.map(([k, n]) => <Pressable key={k} onPress={() => setIc(k)} accessibilityLabel={n} style={{ width: '25%', alignItems: 'center' }}><View style={{ padding: 4, borderRadius: 18, borderWidth: 2, borderColor: ic === k ? W : 'transparent' }}><HeadIcon k={k} size={42} /></View><Text style={{ color: ic === k ? W : 'rgba(255,255,255,.7)', fontSize: 11.5, fontWeight: ic === k ? '800' : '600', marginTop: 4 }}>{n}</Text></Pressable>)}
                </View>
                {err ? <Text style={{ color: '#ffb3bf', fontSize: 12, marginTop: 12 }}>{err}</Text> : null}
              </Glass>
              <Text style={{ color: '#ffd593', fontSize: 11, lineHeight: 15, marginTop: 10 }}>My Life does not give dose advice. Type what is on the label or in your doctor's note. You get a reminder at the time you set, and again an hour later if it is not ticked.</Text>
              <Pressable onPress={save} style={{ marginTop: 14, alignSelf: 'flex-start' }}><LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, paddingHorizontal: 26, borderRadius: 999 }}><Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{editId ? 'Save changes' : 'Save medicine'}</Text></LinearGradient></Pressable>
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
                  {missToday.some((x) => x.status === 'missed') ? <Text style={{ color: '#ffb3c0', fontSize: 11.5, fontWeight: '800', marginTop: 4 }}>{missToday.filter((x) => x.status === 'missed').length + ' missed today'}</Text> : null}
                </View>
              </Glass>
              {Platform.OS === 'android' && meds.length > 0 ? (
                <Glass radius={22} style={{ padding: 14, marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>Never late</Text>
                      <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 12, lineHeight: 17, marginTop: 3 }}>{ring !== false ? 'Medicine reminders use an alarm-style timer so your phone cannot hold them back. A small alarm icon may show in the status bar.' : 'Off. Your phone may delay a reminder to save battery.'}</Text>
                    </View>
                    <Pressable onPress={() => setRing(ring === false)} accessibilityLabel="Never late reminders" style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: ring !== false ? '#ffc46b' : 'rgba(255,255,255,.18)', justifyContent: 'center', paddingHorizontal: 3 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: ring !== false ? '#1b1038' : '#fff', alignSelf: ring !== false ? 'flex-end' : 'flex-start' }} />
                    </Pressable>
                  </View>
                </Glass>
              ) : null}
              {exact === false && meds.length > 0 && ring !== false ? (
                <Glass radius={22} style={{ padding: 14, marginTop: 12, backgroundColor: 'rgba(255,196,107,.14)', borderColor: 'rgba(255,196,107,.4)', borderWidth: 1 }}>
                  <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>Reminders may arrive late</Text>
                  <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 12.5, lineHeight: 18, marginTop: 3 }}>Your phone is not set to deliver reminders on the minute, so a medicine reminder can be held back, sometimes by an hour. Turn on exact timing so it arrives at the time you set.</Text>
                  <Pressable onPress={askExact} style={{ marginTop: 10, alignSelf: 'flex-start', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#ffc46b' }}><Text style={{ color: '#0b1030', fontWeight: '800', fontSize: 13 }}>Turn on exact timing</Text></Pressable>
                </Glass>
              ) : null}
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
                  <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>This week</Text>
                  {week.map((x) => { const full = x.n > 0 && x.k === x.n; return (
                    <View key={x.off} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                      <Text style={{ color: 'rgba(255,255,255,.8)', width: 78, fontSize: 12.5, fontWeight: x.off === 0 ? '800' : '600' }}>{x.off === 0 ? 'Today' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][x.d.getDay()] + ' ' + x.d.getDate()}</Text>
                      <View style={{ flex: 1, height: 10, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.14)', overflow: 'hidden' }}><View style={{ width: (x.n ? (x.k / x.n) * 100 : 0) + '%', height: '100%', backgroundColor: full ? T : '#ffc46b' }} /></View>
                      <Text style={{ color: full ? T : 'rgba(255,255,255,.75)', width: 38, textAlign: 'right', fontSize: 12.5, fontWeight: '800' }}>{x.n ? x.k + '/' + x.n : '-'}</Text>
                    </View>); })}
                  {missedAll.length ? (
                    <View style={{ marginTop: 14, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,120,140,.14)', borderWidth: 1, borderColor: 'rgba(255,140,160,.45)' }}>
                      <Text style={{ color: '#ffb3c0', fontSize: 13, fontWeight: '800' }}>{'Missed in the last 7 days (' + missedAll.length + ')'}</Text>
                      {missedAll.slice(0, 12).map((x, i) => <Text key={i} style={{ color: 'rgba(255,255,255,.85)', fontSize: 12.5, marginTop: 5 }}>{(x.off === 0 ? 'Today' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][x.date.getDay()] + ' ' + x.date.getDate()) + ' · ' + x.med.name + ' · ' + to12(x.med.time)}</Text>)}
                    </View>
                  ) : week.some((x) => x.n > 0) ? <Text style={{ color: T, fontSize: 12.5, fontWeight: '700', marginTop: 12 }}>No missed doses in the last 7 days.</Text> : null}
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
