import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, Animated, Easing, AccessibilityInfo, Vibration, Platform } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Glass } from '../components/Glass';
import { Blob } from '../components/Bg';
import { Inp, W } from '../components/Ui';
import { HeadIcon } from '../components/HabitIcons';
import { CardArt } from '../components/CardArt';
import { PageArt } from '../components/PageArt';
import { useStored } from '../lib/store';
import { TOP } from '../lib/layout';
import { weekOffs, HData, HEMPTY, fmtTime, dateOf, getDay } from '../lib/habit';
import { BREATH, STYLES, LOOK, mins, fmtMin, weekMins, relaxStreak, recentSess, addSess, delSess, nowHM } from '../lib/relax';
import { dayKind } from '../lib/cycle';
import { scheduleRelaxEnd, cancelRelaxEnd } from '../lib/alerts';

const T = '#5ee7df';
const Cap = ({ t, top = 14 }: { t: string; top?: number }) => <Text style={{ color: '#9fb0d0', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4, marginTop: top, marginBottom: 8 }}>{t}</Text>;
const Chip = ({ on, t, onPress }: { on: boolean; t: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={{ paddingVertical: 8, paddingHorizontal: 15, borderRadius: 999, backgroundColor: on ? T : 'rgba(255,255,255,.12)' }}><Text style={{ color: on ? '#06222a' : W, fontSize: 12.5, fontWeight: '800' }}>{t}</Text></Pressable>
);
const Go = ({ onPress, t }: { onPress: () => void; t: string }) => (
  <Pressable onPress={onPress} style={{ marginTop: 16, alignSelf: 'flex-start' }}><LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, paddingHorizontal: 30, borderRadius: 999 }}><Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{t}</Text></LinearGradient></Pressable>
);
const buzz = (kind: 'l' | 'ok') => { if (Platform.OS === 'web') return; try { kind === 'ok' ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {} };

type Run = { kind: 'b' | 'm'; k: string; total: number };

function Session({ run, bell, reduce, onSave, onClose }: { run: Run; bell: boolean; reduce: boolean; onSave: (sec: number) => void; onClose: () => void }) {
  const { kind, k, total } = run;
  const pat = BREATH.find((b) => b.k === k); const sty = STYLES.find((b) => b.k === k);
  const steps = pat ? pat.steps.filter((s) => s[1] > 0) : [];
  const cycle = steps.reduce((a, s) => a + s[1], 0) || 1;
  const [el, setEl] = useState(0); const [paused, setPaused] = useState(false); const [done, setDone] = useState(false);
  const acc = useRef(0); const t0 = useRef(Date.now()); const pRef = useRef(false); const dRef = useRef(false);
  const saveRef = useRef(onSave); saveRef.current = onSave;
  const elapsed = () => acc.current + (pRef.current ? 0 : (Date.now() - t0.current) / 1000);
  const scale = useRef(new Animated.Value(0.62)).current; const pulse = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current; const pop = useRef(new Animated.Value(0)).current;

  const finish = (full: boolean) => {
    if (dRef.current) return; dRef.current = true;
    const e = full ? total : elapsed();
    cancelRelaxEnd();
    if (e >= 30) saveRef.current(Math.min(total, e));
    if (full) { buzz('ok'); if (Platform.OS !== 'web') Vibration.vibrate([0, 250, 150, 250]); setDone(true); Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: true }).start(); }
    else onClose();
  };
  useEffect(() => {
    if (kind === 'm' && bell) scheduleRelaxEnd(total);
    const id = setInterval(() => { if (dRef.current) return; const e = elapsed(); if (e >= total) { setEl(total); finish(true); } else setEl(e); }, 200);
    return () => { clearInterval(id); cancelRelaxEnd(); };
  }, []);
  useEffect(() => {
    if (kind !== 'm' || reduce) return;
    const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(pulse, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })]));
    loop.start(); return () => loop.stop();
  }, []);

  let idx = 0, pe = 0;
  if (kind === 'b') { let pos = el % cycle; for (let i = 0; i < steps.length; i++) { if (pos < steps[i][1]) { idx = i; pe = pos; break; } pos -= steps[i][1]; } }
  const round = Math.floor(el / cycle) + 1; const rounds = Math.max(1, Math.ceil(total / cycle));
  const phase = kind === 'b' ? steps[idx][0] : '';
  const tipI = kind === 'm' && sty ? Math.floor(el / 40) % sty.tips.length : 0;
  const key = kind === 'b' ? round * 10 + idx : tipI;

  useEffect(() => {
    if (done) return;
    fade.setValue(0); Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    if (kind !== 'b') return;
    if (!pRef.current) buzz('l');
  }, [key]);
  useEffect(() => {
    if (kind !== 'b' || reduce || done) return;
    if (paused) { scale.stopAnimation(); return; }
    const e = elapsed(); let pos = e % cycle; let i = 0; for (; i < steps.length; i++) { if (pos < steps[i][1]) break; pos -= steps[i][1]; }
    if (i >= steps.length) return;
    const name = steps[i][0]; if (name !== 'Breathe in' && name !== 'Breathe out') return;
    Animated.timing(scale, { toValue: name === 'Breathe in' ? 1 : 0.62, duration: Math.max(300, (steps[i][1] - pos) * 1000), easing: Easing.inOut(Easing.sin), useNativeDriver: true }).start();
  }, [key, paused, done]);

  const togglePause = () => {
    if (done) return;
    if (!pRef.current) { acc.current = elapsed(); pRef.current = true; setPaused(true); if (kind === 'm') cancelRelaxEnd(); }
    else { t0.current = Date.now(); pRef.current = false; setPaused(false); if (kind === 'm' && bell) scheduleRelaxEnd(total - acc.current); }
  };
  const left = Math.max(0, Math.ceil(total - el)); const mm = Math.floor(left / 60), ss = left % 60;
  const R = 112, C = 2 * Math.PI * R; const prog = Math.min(1, el / total);
  const circ = kind === 'b' ? scale : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] });
  const glow = kind === 'b' ? scale.interpolate({ inputRange: [0.62, 1], outputRange: [0.3, 0.85] }) : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });
  const title = kind === 'b' ? (pat ? pat.name : '') : (sty ? sty.name : '');
  const sub = kind === 'b' ? (pat ? pat.steps.map((s) => (s[0] === 'Breathe in' ? 'In ' : s[0] === 'Breathe out' ? 'Out ' : 'Hold ') + s[1]).join(' · ') : '') : '';
  return (
    <View style={{ alignItems: 'center', paddingTop: 10 }}>
      <View style={{ alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => (done ? onClose() : finish(false))} accessibilityLabel="Close"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 22 }}>×</Text></Glass></Pressable>
        <Text style={{ flex: 1, color: W, fontSize: 20, fontWeight: '800' }}>{title}</Text>
      </View>
      <View style={{ width: 260, height: 260, marginTop: 26, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(94,231,223,.22)', opacity: glow, transform: [{ scale: circ }] }} />
        <Animated.View style={{ position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(124,156,255,.28)', transform: [{ scale: circ }] }} />
        <Svg width={260} height={260} viewBox="0 0 260 260" style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          <Circle cx="130" cy="130" r={R} stroke="rgba(255,255,255,.14)" strokeWidth="9" fill="none" />
          <Circle cx="130" cy="130" r={R} stroke={T} strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={`${C * prog} ${C}`} />
        </Svg>
        {done ? <Animated.Text style={{ color: T, fontSize: 64, fontWeight: '800', transform: [{ scale: pop }] }}>✓</Animated.Text> : <Text style={{ color: W, fontSize: 40, fontWeight: '800' }}>{mm}:{String(ss).padStart(2, '0')}</Text>}
      </View>
      {done ? (
        <View style={{ alignItems: 'center', marginTop: 26 }}>
          <Text style={{ color: W, fontSize: 22, fontWeight: '800' }}>Session complete</Text>
          <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, marginTop: 6 }}>{fmtMin(total / 60)} min saved to your record</Text>
          <Go onPress={onClose} t="Done" />
        </View>
      ) : (
        <View style={{ alignItems: 'center', marginTop: 26, paddingHorizontal: 10 }}>
          <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
            {kind === 'b' ? <Text style={{ color: W, fontSize: 24, fontWeight: '800' }}>{paused ? 'Paused' : phase}</Text> : <Text style={{ color: W, fontSize: 16, fontWeight: '700', textAlign: 'center', lineHeight: 23 }}>{paused ? 'Paused' : sty ? sty.tips[tipI] : ''}</Text>}
          </Animated.View>
          {kind === 'b' ? <><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, marginTop: 6 }}>{sub}</Text><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 12, marginTop: 4 }}>Round {Math.min(round, rounds)} of {rounds}</Text></> : null}
          <Pressable onPress={togglePause} accessibilityLabel={paused ? 'Resume' : 'Pause'} style={{ marginTop: 26 }}><LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 18 }}>{paused ? '▶' : '❚❚'}</Text></LinearGradient></Pressable>
          <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 16, textAlign: 'center' }}>{kind === 'b' ? 'Breathe gently. Stop if you feel dizzy.' : 'Tap × to stop early. 30 seconds or more is saved.'}</Text>
        </View>
      )}
    </View>
  );
}

export default function Relax() {
  const router = useRouter();
  const [h, setH] = useStored<HData>('ml_habit', HEMPTY);
  const [tab, setTab] = useState<'b' | 'm' | 'r'>('b');
  const [bk, setBk] = useState('box'); const [bl, setBl] = useState(180);
  const [mk, setMk] = useState('sit'); const [ml, setMl] = useState(10); const [cust, setCust] = useState(false); const [cm, setCm] = useState('');
  const [run, setRun] = useState<Run | null>(null); const [reduce, setReduce] = useState(false);
  const [rem, setRem] = useState(''); const [remErr, setRemErr] = useState(''); const [rN, setRN] = useState(0); const [delKey, setDelKey] = useState<string | null>(null);
  useEffect(() => { try { AccessibilityInfo.isReduceMotionEnabled().then(setReduce); } catch (e) {} }, []);
  const goal = h.rlGoal || 10; const bell = h.rlBell !== false;
  const today = mins(getDay(h, 0));
  const start = (r: Run) => setRun(r);
  const startM = () => { const m = cust ? Math.round(+cm) : ml; if (!(m >= 1 && m <= 90)) return; start({ kind: 'm', k: mk, total: m * 60 }); };
  const save = (sec: number) => setH(addSess(h, { k: run ? run.k : 'sit', s: Math.round(sec), at: nowHM() }));
  const week = weekOffs().map((off) => { return { off, d: dateOf(off), m: mins(getDay(h, off)) }; });
  const mx = Math.max(10, ...week.map((x) => x.m));
  const Row = ({ ic, n, d, sel, onPress }: { ic: string; n: string; d: string; sel?: boolean; onPress?: () => void }) => (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 18, backgroundColor: sel ? 'rgba(94,231,223,.14)' : 'rgba(255,255,255,.09)', borderWidth: 2, borderColor: sel ? T : 'transparent' }}>
      <HeadIcon k={ic} size={40} />
      <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{n}</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 4 }}>{d}</Text></View>
    </Pressable>
  );
  const setRemind = () => {
    const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(rem);
    if (!m) { setRemErr('Type the time as 24-hour, for example 07:00.'); setRN((n) => n + 1); return; }
    setRemErr(''); setH({ ...h, rlRem: String(+m[1]).padStart(2, '0') + ':' + m[2] }); setRem('');
  };
  return (
    <View style={{ flex: 1, backgroundColor: '#0d1030' }}>
      <LinearGradient colors={['#0d1030', '#1d1250', '#0f2b55']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(183,148,255,.5)" style={{ right: -100, top: -40 }} />
      <Blob size={340} color="rgba(94,231,223,.3)" style={{ left: -120, bottom: 0 }} />
      <PageArt kind="relax" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" scrollEnabled={!run} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 60 }}>
          {run ? <Session run={run} bell={bell} reduce={reduce} onSave={save} onClose={() => setRun(null)} /> : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
                <Text style={{ flex: 1, color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Relax</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
                <Chip on={tab === 'b'} t="Breathe" onPress={() => setTab('b')} /><Chip on={tab === 'm'} t="Meditate" onPress={() => setTab('m')} /><Chip on={tab === 'r'} t="Record" onPress={() => setTab('r')} />
              </View>
              {tab === 'b' ? (
                <>
                  {h.cyOn && dayKind(h, 0) !== 'other' ? <Glass radius={20} style={{ marginTop: 14, padding: 12 }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>{dayKind(h, 0) === 'period' ? 'On your period?' : 'Your period may be close.'}</Text><Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12, lineHeight: 17, marginTop: 4 }}>Slow breathing such as Deep belly or Calm 4-7-8 can feel soothing. A warm drink, some water and a little rest help too.</Text></Glass> : null}
                  <Cap t="BREATHING PATTERNS" />
                  {BREATH.map((b) => <Row key={b.k} ic={b.ic} n={b.name} d={b.desc} sel={bk === b.k} onPress={() => setBk(b.k)} />)}
                  <Cap t="LENGTH" top={8} />
                  <View style={{ flexDirection: 'row', gap: 8 }}>{[60, 180, 300].map((s) => <Chip key={s} on={bl === s} t={s / 60 + ' min'} onPress={() => setBl(s)} />)}</View>
                  <Go onPress={() => start({ kind: 'b', k: bk, total: bl })} t="Start" />
                  <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, lineHeight: 15, marginTop: 14 }}>For relaxing only, not medical treatment. Stop if you feel dizzy or uncomfortable.</Text>
                </>
              ) : null}
              {tab === 'm' ? (
                <>
                  <Cap t="STYLE" />
                  {STYLES.map((b) => <Row key={b.k} ic={b.ic} n={b.name} d={b.desc} sel={mk === b.k} onPress={() => setMk(b.k)} />)}
                  <Cap t="TIMER (MINUTES)" top={8} />
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {[5, 10, 15, 20].map((m) => <Chip key={m} on={!cust && ml === m} t={String(m)} onPress={() => { setCust(false); setMl(m); }} />)}
                    <Chip on={cust} t="Custom" onPress={() => setCust(true)} />
                  </View>
                  {cust ? <Inp min={1} max={90} value={cm} onChangeText={(v: string) => setCm(v.replace(/\D/g, '').slice(0, 2))} placeholder="Minutes, 1 to 90" keyboardType="number-pad" style={{ marginTop: 10 }} /> : null}
                  <Pressable onPress={() => setH({ ...h, rlBell: !bell })} style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: bell ? T : 'rgba(255,255,255,.4)', backgroundColor: bell ? T : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{bell ? <Text style={{ color: '#0d1030', fontWeight: '800', fontSize: 14 }}>✓</Text> : null}</View>
                    <Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>Soft bell when the timer ends</Text>
                  </Pressable>
                  <Go onPress={startM} t="Start" />
                </>
              ) : null}
              {tab === 'r' ? (
                <>
                  <Glass radius={24} style={{ marginTop: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-around' }}>
                    <CardArt kind="relax" />
                    {[[fmtMin(today), 'min today'], [fmtMin(weekMins(h)), 'min this week'], [String(relaxStreak(h)), 'day streak']].map((x) => <View key={x[1]} style={{ alignItems: 'center' }}><Text style={{ color: W, fontSize: 22, fontWeight: '800' }}>{x[0]}</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 4 }}>{x[1]}</Text></View>)}
                  </Glass>
                  <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
                    <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>This week</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 90, marginTop: 10 }}>
                      {week.map((x) => <View key={x.off} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}><View style={{ width: '100%', height: Math.max(x.m > 0 ? 6 : 0, (x.m / mx) * 70), borderRadius: 8, backgroundColor: x.m >= goal ? T : 'rgba(94,231,223,.5)' }} /><Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 10.5, marginTop: 4 }}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'][x.d.getDay()]}</Text></View>)}
                    </View>
                  </Glass>
                  <Cap t="RECENT" />
                  {recentSess(h).length ? recentSess(h).map((x) => { const L = LOOK[x.r.k] || { name: 'Session', ic: 'relax', med: false }; const key = x.off + ':' + x.idx; const ask = delKey === key; return (
                    <View key={key} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.09)' }}>
                        <HeadIcon k={L.ic} size={40} />
                        <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{L.name + ' · ' + fmtMin(x.r.s / 60) + ' min'}</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 4 }}>{x.when + ', ' + x.r.at}</Text></View>
                        {!ask ? <Pressable onPress={() => setDelKey(key)} hitSlop={10} accessibilityLabel={'Delete ' + L.name + ' record'} style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.1)' }}><Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg></Pressable> : null}
                      </View>
                      {ask ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, paddingHorizontal: 4 }}>
                          <Text style={{ color: '#ffc2cc', fontSize: 12.5, flex: 1 }}>Delete this record?</Text>
                          <Chip on={false} t="Keep" onPress={() => setDelKey(null)} />
                          <Pressable onPress={() => { setH(delSess(h, x.off, x.idx)); setDelKey(null); }} accessibilityLabel="Confirm delete" style={{ paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#ff8fa3' }}><Text style={{ color: '#3a0a16', fontSize: 13, fontWeight: '800' }}>Delete</Text></Pressable>
                        </View>
                      ) : null}
                    </View>
                  ); }) : <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 13 }}>No sessions yet. Try a 1 minute breathing exercise.</Text>}
                  <Glass radius={24} style={{ marginTop: 14, padding: 14 }}>
                    <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Daily goal</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>{[5, 10, 15, 20].map((m) => <Chip key={m} on={goal === m} t={m + ' min'} onPress={() => setH({ ...h, rlGoal: m })} />)}</View>
                    <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12.5, marginTop: 14 }}>{h.rlRem ? 'Reminder every day at ' + h.rlRem : 'Reminder: off'}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      <View style={{ flex: 1 }}><Inp value={rem} onChangeText={(v: string) => { setRem(fmtTime(v)); setRemErr(''); }} placeholder="24-hour, e.g. 07:00" keyboardType="number-pad" maxLength={5} bad={remErr ? rN : 0} /></View>
                      <Chip on t="Set" onPress={setRemind} />
                      {h.rlRem ? <Chip on={false} t="Clear" onPress={() => { const n = { ...h }; delete n.rlRem; setH(n); }} /> : null}
                    </View>
                    {remErr ? <Text style={{ color: '#ffb3bf', fontSize: 12, marginTop: 8 }}>{remErr}</Text> : null}
                  </Glass>
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
