import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Pressable, Platform, Keyboard, TextInput } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, G, Line, Path, Pattern, Rect, Polyline } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Glass } from '../components/Glass';
import { Blob } from '../components/Bg';
import { Inp, W } from '../components/Ui';
import { Face, GlassIcon, HeadIcon } from '../components/HabitIcons';
import { useStored } from '../lib/store';
import { TOP } from '../lib/layout';
import { WeightGoal, DailyNeeds, HealthSpend } from '../components/BodyCards';
import { PUASA_EMPTY, PuasaData, ramadanState, qadhaOwed, keyD } from '../lib/fasting';
import { HData, HEMPTY, MOODS, WD, MON, GLASS, dateOf, getDay, keyOfDate, goalPctOf, HDay, BLANK as BLANKD, cupsGoal, latestKg, hoursBetween, fmtTime, bestStreakAll, avgOf } from '../lib/habit';
import { withNavBar } from '../lib/permNav';

const T = '#5ee7df';
const Lbl = ({ t }: { t: string }) => <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, fontWeight: '600' }}>{t}</Text>;
const Ttl = ({ t, k, nm }: { t: string; k?: string; nm?: boolean }) => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: k && !nm ? 9 : 0 }}>{k ? <HeadIcon k={k} /> : null}<Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>{t}</Text></View>;
const Step = ({ t, onPress, label }: { t: string; onPress: () => void; label: string }) => (
  <Pressable accessibilityLabel={label} onPress={onPress} style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 20, fontWeight: '700', marginTop: -2 }}>{t}</Text></Pressable>
);
const Art = () => (
  <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
    <Defs><Pattern id="hgrid" width="44" height="44" patternUnits="userSpaceOnUse"><Path d="M0 22q11-9 22 0t22 0" fill="none" stroke="#fff" strokeWidth=".9" opacity=".08" /></Pattern></Defs>
    <Rect width="390" height="844" fill="url(#hgrid)" />
    <G fill="none" stroke={T} strokeWidth="1.4" opacity=".22"><Path d="M0 760q48-30 97 0t97 0 97 0 99 0" /><Path d="M0 790q48-30 97 0t97 0 97 0 99 0" opacity=".6" /></G>
  </Svg>
);
const Heart = () => (
  <Svg width={46} height={46} viewBox="0 0 46 46"><Path d="M23 40S6 30 6 18a8 8 0 0 1 17-4 8 8 0 0 1 17 4c0 12-17 22-17 22z" fill="rgba(255,255,255,.22)" stroke="#fff" strokeWidth="1.8" /><Polyline points="10,24 18,24 21,17 25,31 28,24 36,24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
function Bars({ vals, labels, max, goal, color, hi }: { vals: number[]; labels: string[]; max: number; goal?: number; color: string; hi: number }) {
  const H = 70;
  return (
    <View style={{ marginTop: 10, height: H + 20 }}>
      {goal != null && <View style={{ position: 'absolute', left: 0, right: 0, top: H - Math.min(goal / max, 1) * H, borderTopWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.4)' }} />}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: H }}>
        {vals.map((v, i) => <View key={i} style={{ flex: 1, height: Math.max(3, Math.min(v / max, 1) * H), borderRadius: 7, backgroundColor: i === hi ? color : 'rgba(255,255,255,.28)' }} />)}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>{labels.map((l, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10.5, color: i === hi ? W : 'rgba(255,255,255,.6)', fontWeight: i === hi ? '800' : '500' }}>{l}</Text>)}</View>
    </View>
  );
}

export default function Habit() {
  const router = useRouter();
  const [h, setH] = useStored<HData>('ml_habit', HEMPTY);
  const [tab, setTab] = useState<'today' | 'progress' | 'body'>('today');
  const svRef = useRef<any>(null); const scrollY = useRef(0); const [kb, setKb] = useState(0);
  useEffect(() => {
    const sh = Keyboard.addListener('keyboardDidShow', (e) => {
      setKb(e.endCoordinates.height);
      setTimeout(() => {
        const f: any = (TextInput as any).State && (TextInput as any).State.currentlyFocusedInput ? (TextInput as any).State.currentlyFocusedInput() : null;
        if (f && f.measure) f.measure((_x: number, _y: number, _w: number, hh: number, _px: number, py: number) => { const delta = py + hh - e.endCoordinates.screenY + 28; if (delta > 0 && svRef.current) svRef.current.scrollTo({ y: scrollY.current + delta, animated: true }); });
      }, 160);
    });
    const hd = Keyboard.addListener('keyboardDidHide', () => setKb(0));
    return () => { sh.remove(); hd.remove(); };
  }, []);
  const [edit, setEdit] = useState(false); const [gv, setGv] = useState('');
  const hRef = useRef(h); hRef.current = h;
  const [autoMsg, setAutoMsg] = useState('');
  const [kgIn, setKgIn] = useState(''); const [cmIn, setCmIn] = useState(''); const [bed, setBed] = useState<string | null>(null); const [wake, setWake] = useState<string | null>(null);
  const goal = h.goal || 8000;
  const cg = cupsGoal(h); const kg = latestKg(h);
  const t = getDay(h, 0);
  const put = (p: Partial<HDay>) => setH({ ...h, days: { ...h.days, [keyOfDate(dateOf(0))]: { ...t, ...p } } });
  const km = (t.steps * 0.00075).toFixed(1);
  const gp = goalPctOf(t, goal, cg);
  const stepPct = Math.min(t.steps / goal, 1);
  const wk = [-6, -5, -4, -3, -2, -1, 0].map((o) => ({ o, d: getDay(h, o), dt: dateOf(o) }));
  const wl = wk.map((x) => x.o === 0 ? 'Today' : WD[x.dt.getDay()]);
  const saveGoal = () => { const n = parseInt(gv.replace(/[^0-9]/g, ''), 10); if (n >= 500 && n <= 100000) { setH({ ...h, goal: n }); setEdit(false); } };
  // streak: consecutive days reaching 70%
  let streak = 0; { const startOff = gp >= 70 ? 0 : -1; for (let o = startOff; o > -400; o--) { if (goalPctOf(getDay(h, o), goal, cg) >= 70) streak++; else break; } }
  const tip = t.sleep <= 0 ? ['Log your sleep', 'Use + and − to record last night.', 'rgba(255,255,255,.1)'] : t.sleep < 6 ? ['Short night', 'Try to rest earlier tonight.', 'rgba(255,143,171,.25)'] : t.sleep < 7 ? ['Almost there', 'A little more sleep helps.', 'rgba(255,196,107,.25)'] : t.sleep <= 9 ? ['Well rested', 'Great sleep, keep it up.', 'rgba(125,240,198,.25)'] : ['Long sleep', 'A bit much, try to keep it steady.', 'rgba(124,156,255,.25)'];
  // Steps: Health Connect first (all-day count), then the phone's step sensor while the app is open
  const [hcOn, setHcOn] = useState(false); const [retry, setRetry] = useState(0); const [stepIn, setStepIn] = useState('');
  const setSteps = (n: number) => { const x = getDay(hRef.current, 0); put({ steps: n, ...(x.hc != null ? { adj: n - x.hc } : {}) }); };
  useEffect(() => {
    if (!h.auto || Platform.OS === 'web') { setHcOn(false); setAutoMsg(''); return; }
    let sub: { remove: () => void } | null = null; let alive = true; let timer: any = null; let last = 0;
    const saveToday = (f: (td: HDay) => HDay) => { const cur = hRef.current; const key = keyOfDate(dateOf(0)); const td = { ...BLANKD, ...(cur.days[key] || {}) }; setH({ ...cur, days: { ...cur.days, [key]: f(td) } }); };
    const startSensor = async (why: string) => {
      try {
        const { Pedometer } = require('expo-sensors');
        if (!(await Pedometer.isAvailableAsync())) { setAutoMsg(why + ' This phone has no step sensor.'); return; }
        const perm: any = await withNavBar(() => Pedometer.requestPermissionsAsync());
        if (!perm.granted) { setAutoMsg('Allow Physical activity permission in phone settings to count steps.'); setH({ ...hRef.current, auto: false }); return; }
        setAutoMsg(why);
        sub = Pedometer.watchStepCount((r: { steps: number }) => { if (!alive) return; const d = r.steps - last; last = r.steps; if (d > 0) saveToday((td) => ({ ...td, steps: td.steps + d })); });
      } catch (e) { setAutoMsg('Step counting is not available on this device.'); }
    };
    (async () => {
      try {
        const HC = require('react-native-health-connect');
        const st = await HC.getSdkStatus();
        if (st !== HC.SdkAvailabilityStatus.SDK_AVAILABLE) { await startSensor(st === HC.SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED ? 'Update Health Connect in Play Store for all-day counting. For now steps count while this app is open.' : 'Health Connect is not on this phone, so steps count while this app is open.'); return; }
        await HC.initialize();
        let g = await HC.getGrantedPermissions();
        if (!g.some((x: any) => x.recordType === 'Steps')) g = await withNavBar(() => HC.requestPermission([{ accessType: 'read', recordType: 'Steps' }]));
        if (!g.some((x: any) => x.recordType === 'Steps')) { await startSensor('Health Connect access was not allowed, so steps count while this app is open.'); return; }
        const read = async () => {
          const s0 = new Date(); s0.setHours(0, 0, 0, 0);
          const r = await HC.aggregateRecord({ recordType: 'Steps', timeRangeFilter: { operationType: 'between', startTime: s0.toISOString(), endTime: new Date().toISOString() } });
          const n = Math.round((r && r.COUNT_TOTAL) || 0); return n;
        };
        const n0 = await read();
        if (!alive) return;
        if (n0 <= 0) { await startSensor('No steps in Health Connect yet. Install Samsung Health or Google Fit for all-day counting. For now steps count while this app is open.'); return; }
        setHcOn(true); setAutoMsg('');
        const sync = async () => { try { const n = await read(); if (alive) saveToday((td) => ({ ...td, hc: n, steps: Math.max(0, n + (td.adj || 0)) })); } catch (e) {} };
        await sync(); timer = setInterval(sync, 60000);
      } catch (e) { await startSensor('Health Connect is not available, so steps count while this app is open.'); }
    })();
    return () => { alive = false; sub && sub.remove(); timer && clearInterval(timer); };
  }, [h.auto, retry]);
  const dow = dateOf(0).getDay(); const sunnahDay = dow === 1 || dow === 4;
  const [pz, setPz] = useStored<PuasaData>('ml_puasa', PUASA_EMPTY);
  const rs = ramadanState(pz, new Date()); const owed = qadhaOwed(pz, new Date()); const inRam = rs.phase === 'during';
  const toggleFast = () => {
    const days = { ...(pz.days || {}) }; const k = keyD(new Date());
    if (t.fast) delete days[k]; else days[k] = inRam ? 'r' : (days[k] === 'q' ? 'q' : 's');
    setPz({ ...pz, days }); put({ fast: !t.fast });
  };
  type Sg = { t: string; b: string; tag: string; to?: string };
  const sg: Sg[] = [];
  if (t.sleep > 0 && t.sleep < 6) sg.push({ t: 'Rest early tonight', b: 'Short on sleep. End the day with a calm Tasbih.', tag: 'Sleep · Tasbih', to: '/tasbih' });
  if (t.mood >= 0 && t.mood <= 1) sg.push({ t: 'Take a calm moment', b: 'Feeling low? A few minutes of Tasbih can settle the heart.', tag: 'Mood · Tasbih', to: '/tasbih' });
  if (t.cups < cg / 2) sg.push({ t: 'Drink a glass now', b: 'Have a glass before the next prayer time.', tag: 'Water · Prayer', to: '/prayer' });
  if (t.steps < goal * 0.5) sg.push({ t: 'Take a short walk', b: 'A walk after prayer adds easy steps.', tag: 'Steps · Prayer', to: '/prayer' });
  if (t.cups <= cg / 2) sg.push({ t: 'Bring your own water', b: 'Skip the bought drinks and track the savings.', tag: 'Water · Finance', to: '/finance' });
  if (inRam) {
    if (t.cups < cg / 2) sg.push({ t: 'Spread your water tonight', b: 'You are fasting. Sip between iftar and sahur to reach ' + cg + ' glasses.', tag: 'Ramadan · Water', to: '/puasa' });
    if (t.sleep > 0 && t.sleep < 6) sg.push({ t: 'Sleep is short in Ramadan', b: 'Try a short nap in the afternoon to keep your energy up.', tag: 'Ramadan · Sleep', to: '/puasa' });
  }
  if (sunnahDay && !t.fast && !inRam) sg.push({ t: 'Sunnah fasting day', b: 'Drink plenty at sahur and iftar so you stay at your water goal.', tag: 'Water · Prayer', to: '/prayer' });
  if (gp >= 70) sg.push({ t: 'Great day!', b: 'Goal reached. Log a small saving to match.', tag: 'Goal · Finance', to: '/finance' });
  if (!sg.length) sg.push({ t: 'Keep going', b: 'Log today to get personal suggestions.', tag: 'Life Link' });
  const sgs = sg.slice(0, 3);

  const klist = (h.kg || []).slice().sort((a, b) => (a.d < b.d ? -1 : 1)); const kl = klist.slice(-8);
  const bmi = kg > 0 && h.cm ? kg / Math.pow(h.cm / 100, 2) : 0;
  const bmiTxt = bmi ? (bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy range' : bmi < 30 ? 'Overweight' : 'Obese') : '';
  const logKg = () => { const v = parseFloat(kgIn.replace(',', '.')); const c = parseInt(cmIn, 10); const nk = (v >= 20 && v <= 300) ? [...klist.filter((x) => x.d !== keyOfDate(dateOf(0))), { d: keyOfDate(dateOf(0)), v: Math.round(v * 10) / 10 }] : h.kg; setH({ ...h, kg: nk, cm: c >= 100 && c <= 250 ? c : h.cm }); setKgIn(''); setCmIn(''); };
  // water vs mood / sleep
  const wd: { ok: boolean; mood: number; sleep: number }[] = []; for (let o = -60; o <= 0; o++) { const x = getDay(h, o); if (x.cups > 0 && x.mood >= 0) wd.push({ ok: x.cups >= cg, mood: x.mood, sleep: x.sleep }); }
  const hiW = wd.filter((x) => x.ok), loW = wd.filter((x) => !x.ok);
  const mAvg = (l: typeof wd) => l.reduce((a, x) => a + x.mood, 0) / Math.max(l.length, 1);
  const sAvgL = (l: typeof wd) => { const z = l.filter((x) => x.sleep > 0); return z.reduce((a, x) => a + x.sleep, 0) / Math.max(z.length, 1); };
  const insOk = hiW.length >= 3 && loW.length >= 3;
  const mName = (v: number) => MOODS[Math.max(0, Math.min(4, Math.round(v)))][0];
  // weekly summary
  const cur7 = (f: (x: HDay) => number) => avgOf(h, -6, 0, f), prev7 = (f: (x: HDay) => number) => avgOf(h, -13, -7, f);
  const best = bestStreakAll(h);
  const Delta = ({ a, b, u, d = 1 }: { a: number; b: number; u: string; d?: number }) => { const df = a - b; const up = df > 0.049; const dn = df < -0.049; return <Text style={{ color: up ? '#7df0c6' : dn ? '#ff8fab' : 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: '700', marginTop: 2 }}>{b > 0 ? (up ? '▲ ' : dn ? '▼ ' : '● ') + Math.abs(df).toFixed(d) + ' ' + u : 'new'}</Text>; };

  return (
    <View style={{ flex: 1, backgroundColor: '#0d1030' }}>
      <LinearGradient colors={['#0d1030', '#1d1250', '#0f2b55']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(183,148,255,.5)" style={{ right: -100, top: -40 }} />
      <Blob size={340} color="rgba(94,231,223,.3)" style={{ left: -120, bottom: 0 }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}><Art /></View>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView ref={svRef} onScroll={(e) => { scrollY.current = e.nativeEvent.contentOffset.y; }} scrollEventThrottle={16} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 60 + kb }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
            <Text style={{ flex: 1, color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Habit & Health</Text>
            <Glass radius={999} style={{ paddingVertical: 9, paddingHorizontal: 14 }}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{dateOf(0).toDateString().slice(0, 10)}</Text></Glass>
          </View>

          <Glass radius={24} style={{ marginTop: 14, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <LinearGradient colors={['rgba(183,148,255,.45)', 'rgba(94,231,223,.25)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
            <Heart />
            <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Small habits, big health</Text><Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12, marginTop: 1 }}>Mood, water, sleep and goals</Text></View>
          </Glass>

          <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)', marginTop: 12 }}>
            {([['today', 'Today'], ['progress', 'Progress'], ['body', 'Body']] as ['today' | 'progress' | 'body', string][]).map(([k, n]) => (
              <Pressable key={k} onPress={() => setTab(k)} style={{ flex: 1 }}>
                {tab === k ? (
                  <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 8, borderRadius: 999, alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{n}</Text></LinearGradient>
                ) : (<View style={{ paddingVertical: 8, alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 13, fontWeight: '700' }}>{n}</Text></View>)}
              </Pressable>
            ))}
          </View>

          {tab === 'today' && (<>
          <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
            <Ttl k="goal" t="Goal Tracker" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 }}>
              <Text style={{ color: W, fontSize: 30, fontWeight: '800' }}>{gp}%</Text>
              <View style={{ flex: 1 }}>
                <View style={{ height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.14)', overflow: 'hidden' }}><LinearGradient colors={['#b794ff', T]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 10, width: (Math.min(gp, 100) + '%') as any }} /></View>
                <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 11.5, marginTop: 6 }}>Water, sleep and steps combined</Text>
              </View>
            </View>
          </Glass>
          <Glass radius={26} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <Ttl nm k="sleep" t="Sleep Tracker" />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <Lbl t="Last night" />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Step t="−" label="Less sleep" onPress={() => put({ sleep: Math.max(0, t.sleep - 0.5) })} />
                <Text style={{ color: W, fontSize: 22, fontWeight: '800', minWidth: 58, textAlign: 'center' }}>{t.sleep.toFixed(1)}h</Text>
                <Step t="+" label="More sleep" onPress={() => put({ sleep: Math.min(14, t.sleep + 0.5) })} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' }}>
              <View style={{ flex: 1 }}><Lbl t="Went to bed" /><Inp value={bed ?? t.bed ?? ''} onChangeText={(x: string) => setBed(fmtTime(x))} keyboardType="number-pad" maxLength={5} placeholder="e.g. 08:30" style={{ marginTop: 4 }} /></View>
              <View style={{ flex: 1 }}><Lbl t="Woke up" /><Inp value={wake ?? t.wake ?? ''} onChangeText={(x: string) => setWake(fmtTime(x))} keyboardType="number-pad" maxLength={5} placeholder="e.g. 15:30" style={{ marginTop: 4 }} /></View>
              <Pressable onPress={() => { const b = bed ?? t.bed ?? '', w = wake ?? t.wake ?? ''; if (!b && !w) { put({ bed: '', wake: '' }); setBed(null); setWake(null); return; } const hr = hoursBetween(b, w); if (hr > 0) { put({ bed: b, wake: w, sleep: hr }); setBed(null); setWake(null); } }} style={{ marginTop: 18, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#b794ff' }}><Text style={{ color: '#0d1030', fontWeight: '800', fontSize: 13 }}>Set</Text></Pressable>
            </View>
            <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, marginTop: 6 }}>Night shift? Sleep in the day counts too. Use 24-hour time: type 0830 for 08:30 and the hours fill in for you.</Text>
            <Bars vals={wk.map((x) => x.d.sleep)} labels={wl} max={10} goal={7} color="#b794ff" hi={6} />
            <View style={{ marginTop: 12, padding: 11, borderRadius: 14, backgroundColor: tip[2] }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>{tip[0]}</Text><Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, marginTop: 2 }}>{tip[1]}</Text></View>
          </Glass>
          <Glass radius={24} style={{ marginTop: 12, paddingVertical: 16, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Ttl nm k="water" t="Drink Water" /><Text style={{ color: t.cups >= cg ? '#7df0c6' : 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: '800' }}>{t.cups} of {cg} glasses</Text></View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {Array.from({ length: Math.max(cg, t.cups) }).map((_, i) => <Pressable key={i} accessibilityLabel={'Glass ' + (i + 1)} onPress={() => put({ cups: t.cups === i + 1 ? i : i + 1 })} style={{ width: '17.5%', flexGrow: 1, alignItems: 'center', paddingVertical: 2 }}><GlassIcon full={i < t.cups} size={50} /></Pressable>)}
            </View>
            <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 11.5, marginTop: 10 }}>{(t.cups * GLASS / 1000).toFixed(2)} of {(cg * GLASS / 1000).toFixed(1)} L{kg > 0 ? ' · based on ' + kg + ' kg' : ''}</Text>
          </Glass>
          <Glass radius={26} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Ttl k="steps" t="Steps & Distance" />
              <Pressable onPress={() => { setEdit(!edit); setGv(String(goal)); }}><View style={{ paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: W, fontSize: 12, fontWeight: '700' }}>Goal {goal.toLocaleString('en-MY')} ✎</Text></View></Pressable>
            </View>
            {edit && (
              <View style={{ marginTop: 10, padding: 10, borderRadius: 16, backgroundColor: 'rgba(0,0,0,.22)' }}>
                <Lbl t="Daily step goal" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {[5000, 8000, 10000, 12000].map((n) => <Pressable key={n} onPress={() => { setH({ ...h, goal: n }); setEdit(false); }} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: goal === n ? T : 'rgba(255,255,255,.12)' }}><Text style={{ color: goal === n ? '#0d1030' : W, fontSize: 12, fontWeight: '700' }}>{n.toLocaleString('en-MY')}</Text></Pressable>)}
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
                  <Inp value={gv} onChangeText={setGv} keyboardType="number-pad" placeholder="Custom (500 – 100,000)" style={{ flex: 1 }} />
                  <Pressable onPress={saveGoal} style={{ paddingVertical: 11, paddingHorizontal: 16, borderRadius: 14, backgroundColor: T }}><Text style={{ color: '#0d1030', fontWeight: '800', fontSize: 13 }}>Save</Text></Pressable>
                </View>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 18, marginTop: 10 }}>
              <View><Text style={{ color: W, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 }}>{t.steps.toLocaleString('en-MY')}</Text><Lbl t="steps" /></View>
              <View><Text style={{ color: W, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 }}>{km}</Text><Lbl t="km" /></View>
            </View>
            <View style={{ height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.14)', marginTop: 10, overflow: 'hidden' }}><LinearGradient colors={['#7c9cff', T]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 10, width: (stepPct * 100 + '%') as any }} /></View>
            <Bars vals={wk.map((x) => x.d.steps)} labels={wl} max={Math.max(goal, ...wk.map((x) => x.d.steps))} goal={goal} color={T} hi={6} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Pressable onPress={() => setSteps(t.steps + 500)} style={{ flex: 1, paddingVertical: 11, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center' }}><Text style={{ color: W, fontWeight: '800', fontSize: 13 }}>+500 steps</Text></Pressable>
              <Pressable onPress={() => setSteps(Math.max(0, t.steps - 500))} style={{ paddingVertical: 11, paddingHorizontal: 18, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center' }}><Text style={{ color: W, fontWeight: '800', fontSize: 13 }}>−500</Text></Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <Inp value={stepIn} onChangeText={(v: string) => setStepIn(v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" placeholder="Type steps" style={{ flex: 1 }} />
              <Pressable onPress={() => { const n = parseInt(stepIn, 10); if (n > 0) { setSteps(t.steps + n); setStepIn(''); } }} style={{ paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.14)' }}><Text style={{ color: W, fontWeight: '800', fontSize: 13 }}>Add</Text></Pressable>
              <Pressable onPress={() => { const n = parseInt(stepIn, 10); if (n >= 0 && stepIn !== '') { setSteps(Math.min(n, 200000)); setStepIn(''); } }} style={{ paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, backgroundColor: T }}><Text style={{ color: '#0d1030', fontWeight: '800', fontSize: 13 }}>Set total</Text></Pressable>
            </View>
            <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, marginTop: 6 }}>Add puts the number on top of today's steps. Set total replaces today's steps with the number.</Text>
            {Platform.OS !== 'web' && (
              <Pressable onPress={() => setH({ ...h, auto: !h.auto })} style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 46, height: 26, borderRadius: 13, backgroundColor: h.auto ? T : 'rgba(255,255,255,.2)', padding: 3, alignItems: h.auto ? 'flex-end' : 'flex-start' }}><View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: W }} /></View>
                <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 13.5, fontWeight: '700' }}>Count steps automatically</Text><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5 }}>All-day count from Health Connect when it has data.</Text></View>
              </Pressable>
            )}
            {!!autoMsg && <Text style={{ color: '#ffc46b', fontSize: 11.5, marginTop: 6, lineHeight: 16 }}>{autoMsg}</Text>}
            {!!autoMsg && !hcOn && Platform.OS !== 'web' && (
              <View style={{ marginTop: 8, padding: 10, borderRadius: 14, backgroundColor: 'rgba(0,0,0,.22)' }}>
                <Text style={{ color: W, fontSize: 12, fontWeight: '800' }}>Connect your health app</Text>
                <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, lineHeight: 16, marginTop: 3 }}>1. Open Samsung Health, then Settings and Health Connect, and allow it to share Steps.{'\n'}2. Come back here and tap Check again.{'\n'}Honor Health may not support Health Connect. Samsung Health is the best choice.</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <Pressable onPress={() => { try { require('react-native-health-connect').openHealthConnectSettings(); } catch (e) {} }} style={{ flex: 1, paddingVertical: 9, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>Open Health Connect</Text></Pressable>
                  <Pressable onPress={() => setRetry(retry + 1)} style={{ flex: 1, paddingVertical: 9, borderRadius: 12, backgroundColor: T, alignItems: 'center' }}><Text style={{ color: '#0d1030', fontSize: 12.5, fontWeight: '800' }}>Check again</Text></Pressable>
                </View>
              </View>
            )}
            <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11.5, marginTop: 10, lineHeight: 16 }}>{Platform.OS === 'web' ? 'Add steps by hand here. On the phone app you can turn on automatic counting.' : !h.auto ? 'Turn this on to count steps. You can always add or correct steps by hand.' : hcOn ? 'Counting all day through Health Connect. Open My Life to refresh the total.' : 'You can always add or correct steps by hand.'}</Text>
          </Glass>
          <Glass radius={24} style={{ marginTop: 12, paddingVertical: 16, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Ttl nm k="mood" t="Mood" /><Text style={{ color: t.mood >= 0 ? MOODS[t.mood][1] : 'rgba(255,255,255,.6)', fontSize: 13, fontWeight: '800' }}>{t.mood >= 0 ? MOODS[t.mood][0] : 'How do you feel?'}</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              {MOODS.map((m, i) => { const on = t.mood === i; return (
                <Pressable key={m[0]} accessibilityLabel={m[0]} onPress={() => put({ mood: on ? -1 : i })} style={{ alignItems: 'center', width: 58, gap: 7 }}>
                  <View style={{ width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: on ? 2.5 : 0, borderColor: W, transform: [{ scale: on ? 1.08 : 1 }] }}><Face i={i} size={on ? 44 : 44} on={on} /></View>
                  <Text style={{ color: on ? W : 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: on ? '800' : '500' }}>{m[0]}</Text>
                </Pressable>); })}
            </View>
          </Glass>
          <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
            <Ttl k="note" t="Today's note" /><Lbl t="Why do you feel this way? (optional)" />
            <Inp value={t.note || ''} onChangeText={(v: string) => put({ note: v })} placeholder="e.g. Long shift, but a good rest" multiline style={{ marginTop: 8, minHeight: 44 }} />
            <Pressable onPress={toggleFast} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: t.fast ? T : 'rgba(255,255,255,.4)', backgroundColor: t.fast ? T : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{t.fast && <Text style={{ color: '#0d1030', fontWeight: '800', fontSize: 14 }}>✓</Text>}</View>
              <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 13.5, fontWeight: '700' }}>Fasting today</Text><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5 }}>{inRam ? 'Ramadan day ' + rs.day + ' of ' + rs.r.len + '.' : sunnahDay ? 'Today is a sunnah fasting day (' + (dow === 1 ? 'Monday' : 'Thursday') + ').' : 'Sunnah fasts: Monday, Thursday and the white days.'}</Text></View>
            </Pressable>
            <Pressable onPress={() => router.push('/puasa' as any)} style={{ marginTop: 10 }}><Text style={{ color: '#8fe9e2', fontSize: 12.5, fontWeight: '700' }}>{(inRam ? rs.fasted + ' of ' + rs.r.len + ' days fasted' : owed > 0 ? owed + (owed === 1 ? ' missed fast' : ' missed fasts') + ' to make up' : 'Open Fasting') + ' ›'}</Text></Pressable>
          </Glass>
          <View style={{ marginTop: 12 }}><HealthSpend /></View>
          </>)}
          {tab === 'progress' && (<>
          <Glass radius={26} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View><Ttl k="streak" t="Habit Streak" /><Lbl t="Days reaching 70% of your goal" /></View>
              <View style={{ alignItems: 'flex-end' }}><Text style={{ color: W, fontSize: 28, fontWeight: '800' }}>{streak}</Text><Lbl t={streak === 1 ? 'day' : 'days'} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {wk.map((x, i) => { const ok = goalPctOf(x.d, goal, cg) >= 70; return (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: ok ? T : 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}>{ok && <HeadIcon k="streak" size={22} />}</View>
                  <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10.5 }}>{WD[x.dt.getDay()]}</Text>
                </View>); })}
            </View>
            <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12, marginTop: 10 }}>{gp >= 70 ? 'Goal reached today, keep it going.' : 'Reach 70% today to extend it.'}</Text>
          </Glass>
          <Glass radius={26} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <Ttl k="week" t="This week" /><Lbl t="Last 7 days compared with the 7 before" />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {([['Water', (x: HDay) => x.cups, 'glasses', 1], ['Sleep', (x: HDay) => x.sleep, 'h', 1], ['Steps', (x: HDay) => x.steps, 'steps', 0]] as [string, (x: HDay) => number, string, number][]).map((r) => (
                <View key={r[0]} style={{ flex: 1, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.08)' }}>
                  <Lbl t={r[0]} /><Text style={{ color: W, fontSize: 17, fontWeight: '800', marginTop: 2 }}>{r[3] ? cur7(r[1]).toFixed(1) : Math.round(cur7(r[1])).toLocaleString('en-MY')}</Text>
                  <Delta a={cur7(r[1])} b={prev7(r[1])} u={r[2]} d={r[3]} />
                </View>))}
            </View>
          </Glass>
          <Glass radius={26} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <Ttl k="insight" t="Water & You" /><Lbl t="How water links to your mood and sleep" />
            {insOk ? (
              <View style={{ gap: 8, marginTop: 10 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1, padding: 11, borderRadius: 14, backgroundColor: 'rgba(124,156,255,.22)' }}><Lbl t={'Goal met · ' + hiW.length + ' days'} /><Text style={{ color: W, fontSize: 15, fontWeight: '800', marginTop: 3 }}>Mood {mName(mAvg(hiW))}</Text><Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12 }}>Sleep {sAvgL(hiW).toFixed(1)} h</Text></View>
                  <View style={{ flex: 1, padding: 11, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.09)' }}><Lbl t={'Below goal · ' + loW.length + ' days'} /><Text style={{ color: W, fontSize: 15, fontWeight: '800', marginTop: 3 }}>Mood {mName(mAvg(loW))}</Text><Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12 }}>Sleep {sAvgL(loW).toFixed(1)} h</Text></View>
                </View>
                <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, lineHeight: 18 }}>{mAvg(hiW) - mAvg(loW) > 0.3 ? 'On days you reach your water goal your mood is higher. Keep drinking.' : mAvg(hiW) - mAvg(loW) < -0.3 ? 'No clear boost to your mood from water yet. Your sleep may matter more.' : 'Your mood looks similar either way so far. More days will make this clearer.'}</Text>
              </View>
            ) : <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12.5, lineHeight: 18, marginTop: 10 }}>Log water and mood for at least 3 days above your goal and 3 days below it. Then you will see how water changes your mood and sleep.</Text>}
          </Glass>
          <Glass radius={26} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <Ttl k="link" t="Life Link" /><Lbl t="Suggestions from your day" />
            <View style={{ gap: 8, marginTop: 10 }}>
              {sgs.map((s, i) => (
                <Pressable key={i} disabled={!s.to} onPress={() => s.to && router.push(s.to as any)} style={{ padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.09)' }}>
                  <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{s.t}</Text>
                  <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12, marginTop: 2, lineHeight: 17 }}>{s.b}</Text>
                  <Text style={{ color: T, fontSize: 11, fontWeight: '700', marginTop: 6 }}>{s.tag}{s.to ? '  ›' : ''}</Text>
                </Pressable>
              ))}
            </View>
          </Glass>
          <Glass radius={26} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <Ttl k="badge" t="Badges" /><Lbl t={'Best streak so far: ' + best + (best === 1 ? ' day' : ' days')} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              {[7, 30, 100].map((n) => { const on = best >= n; return (
                <View key={n} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16, backgroundColor: on ? 'rgba(94,231,223,.22)' : 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: on ? T : 'rgba(255,255,255,.1)' }}>
                  <Text style={{ fontSize: 24, opacity: on ? 1 : 0.3 }}>{n === 7 ? '🌱' : n === 30 ? '🔥' : '🏆'}</Text>
                  <Text style={{ color: W, fontSize: 15, fontWeight: '800', marginTop: 4, opacity: on ? 1 : 0.6 }}>{n} days</Text>
                  <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10.5 }}>{on ? 'Unlocked' : 'Locked'}</Text>
                </View>); })}
            </View>
          </Glass>
          <Pressable onPress={() => router.push('/habit-history' as any)}>
            <Glass radius={22} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>30-Day History</Text><Text style={{ color: W, fontSize: 20 }}>›</Text>
            </Glass>
          </Pressable>
          </>)}
          {tab === 'body' && (<>
          <Glass radius={26} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <Ttl k="weight" t="Weight & BMI" /><Lbl t={kg > 0 ? 'Your water goal follows your weight' : 'Add your weight to personalise your water goal'} />
            {kg > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 18, marginTop: 10 }}>
                <View><Text style={{ color: W, fontSize: 28, fontWeight: '800' }}>{kg}</Text><Lbl t="kg" /></View>
                {bmi > 0 && <View><Text style={{ color: W, fontSize: 28, fontWeight: '800' }}>{bmi.toFixed(1)}</Text><Lbl t={'BMI · ' + bmiTxt} /></View>}
              </View>
            )}
            {kg > 0 && <Text style={{ color: T, fontSize: 12, fontWeight: '700', marginTop: 6 }}>Water goal: {(cg * GLASS / 1000).toFixed(1)} L a day ({cg} glasses)</Text>}
            {kl.length >= 2 && <Bars vals={kl.map((x) => x.v - Math.min(...kl.map((y) => y.v)) + 1)} labels={kl.map((x) => parseInt(x.d.slice(8), 10) + '/' + parseInt(x.d.slice(5, 7), 10))} max={Math.max(...kl.map((x) => x.v)) - Math.min(...kl.map((x) => x.v)) + 2} color="#b794ff" hi={kl.length - 1} />}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' }}>
              <Inp value={kgIn} onChangeText={setKgIn} keyboardType="decimal-pad" placeholder="Weight (kg)" style={{ flex: 1 }} />
              <Inp value={cmIn} onChangeText={setCmIn} keyboardType="number-pad" placeholder={h.cm ? h.cm + ' cm' : 'Height (cm)'} style={{ flex: 1 }} />
              <Pressable onPress={logKg} style={{ paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, backgroundColor: T }}><Text style={{ color: '#0d1030', fontWeight: '800', fontSize: 13 }}>Log</Text></Pressable>
            </View>
            <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, marginTop: 6 }}>Weigh yourself once a week. Water goal is about 33 ml per kg. BMI is a rough guide only.</Text>
          </Glass>
          <WeightGoal h={h} setH={setH} />
          <DailyNeeds h={h} setH={setH} />
          </>)}
          <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11.5, textAlign: 'center', marginTop: 14 }}>Your habits are saved on this phone and backed up to your account.</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
