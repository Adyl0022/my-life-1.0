import React from 'react';
import { View, Pressable, Animated, ScrollView, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Text } from './Txt';
import { Glass } from './Glass';
import { useStored } from '../lib/store';
import { useHidden } from '../lib/hidden';
import { Inp } from './Ui';
import { useCycleSave } from '../lib/cycleHook';
import { cycleInfo } from '../lib/cycle';
import { addSleepTile } from '../../modules/step-counter';
import { useSession } from '../lib/auth';
import { MemSave, MEM_EMPTY } from '../lib/memories';
import { SLEEP_KEY, SleepNow, startSleep, endSleep, fmtDur } from '../lib/sleepNow';
const UNWELL = ['Headache', 'Tired', 'Fever'];
const fm = (m: number) => { const x = ((m % 1440) + 1440) % 1440; return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };
import { useCore, scoreParts, lifeScore, tips } from '../lib/insights';
import { HeadIcon, Face } from './HabitIcons';
import { weekOffs, curStreak, bestStreakAll, goalPctOf, getDay, cupsGoal, dateOf, keyOfDate, hoursBetween, medDue, to12, HData, HDay, HEMPTY } from '../lib/habit';

// The card at the bottom of the Dashboard. Tap to switch what it shows, long-press to open the full page.
type Kind = 'log' | 'usage' | 'streak' | 'score' | 'tip' | 'memories';
const ORDER: Kind[] = ['log', 'usage', 'streak', 'score', 'tip', 'memories'];
const dim = 'rgba(255,255,255,.7)';
const LET = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function DashCard({ mins, opens, series }: { mins: number; opens: number; series: number[] }) {
  const router = useRouter();
  const hid = useHidden();
  const core = useCore();
  const [sel, setSel] = useStored<string>('ml_dcard2', 'log');
  const [hd, setHd] = useStored<HData>('ml_habit', HEMPTY);
  const [slp, setSlp] = React.useState(7);
  const [bpm, setBpm] = React.useState('');
  const [bedM, setBedM] = React.useState(23 * 60 + 30); const [wkM, setWkM] = React.useState(6 * 60 + 30); const [hrsOnly, setHrsOnly] = React.useState(false); const [sleepStep, setSleepStep] = React.useState(0);
  const [unw, setUnw] = React.useState(false); const [usy, setUsy] = React.useState<string[]>([]); const [oth, setOth] = React.useState(''); const [othOn, setOthOn] = React.useState(false);
  const [skip, setSkip] = useStored<{ d: string; k: string[] }>('ml_qlskip', { d: '', k: [] });
  const { setPeriod } = useCycleSave(hd, setHd);
  const [sn] = useStored<SleepNow>(SLEEP_KEY, null); const [snMsg, setSnMsg] = React.useState(''); const [, setTick] = React.useState(0);
  const sleeping = !!(sn && sn.start);
  const [sess] = useSession(); const [mem] = useStored<MemSave>('ml_memories', MEM_EMPTY);
  const ca = sess?.user?.created_at ? new Date(sess.user.created_at) : null; const mdays = ca && !isNaN(ca.getTime()) ? Math.max(1, Math.floor((Date.now() - ca.getTime()) / 86400000) + 1) : 0;
  const last = React.useRef(Date.now()); const busy = React.useRef(false); const nextRef = React.useRef<() => void>(() => {});
  React.useEffect(() => { const i = setInterval(() => setTick((x) => x + 1), 300000); return () => clearInterval(i); }, []);
  React.useEffect(() => { if (!sleeping) return; const i = setInterval(() => setTick((x) => x + 1), 30000); return () => clearInterval(i); }, [sleeping]);
  const v = React.useRef(new Animated.Value(1)).current;
  const ty = React.useRef(new Animated.Value(0)).current;

  const parts = scoreParts(core, false);
  const tp = tips(core, false);
  const ok: Record<Kind, boolean> = { log: hid.on('habit'), usage: true, streak: hid.on('habit'), score: parts.length > 0, tip: tp.length > 0, memories: !!sess && !(mem && mem.dash === false) };
  const avail = ORDER.filter((k) => ok[k]);
  const kind: Kind = sleeping && ok.log ? 'log' : (ORDER as string[]).indexOf(sel) >= 0 && ok[sel as Kind] ? (sel as Kind) : (ok.log ? 'log' : 'usage');
  const idx = avail.indexOf(kind);

  const next = () => {
    last.current = Date.now();
    if (avail.length < 2) return;
    const to = avail[(idx + 1) % avail.length];
    Animated.parallel([Animated.timing(v, { toValue: 0, duration: 160, useNativeDriver: true }), Animated.timing(ty, { toValue: -8, duration: 160, useNativeDriver: true })]).start(() => {
      setSel(to); ty.setValue(8);
      Animated.parallel([Animated.timing(v, { toValue: 1, duration: 160, useNativeDriver: true }), Animated.timing(ty, { toValue: 0, duration: 160, useNativeDriver: true })]).start();
    });
  };
  const open = () => router.push((kind === 'memories' ? '/memories' : kind === 'usage' ? '/stats' : kind === 'streak' || kind === 'log' ? '/habit' : kind === 'tip' && tp[0] ? (tp[0].go || '/insights') : '/insights') as any);

  nextRef.current = next;
  // The card turns by itself every few seconds. It waits after a touch, and stays put while you are sleeping or typing something.
  React.useEffect(() => { const i = setInterval(() => { if (busy.current || Date.now() - last.current < 20000) return; nextRef.current(); }, 7000); return () => clearInterval(i); }, []);

  const maxM = Math.max(...series.filter((x) => Number.isFinite(x)), 1);
  let body: React.ReactNode = null; let cur0: string | undefined;
  if (kind === 'log') {
    // Quick log: the next thing not filled in today, answered right here. When it is saved the next one takes its place.
    const td = getDay(hd, 0); const put = (p: Partial<HDay>) => setHd({ ...hd, days: { ...hd.days, [keyOfDate(dateOf(0))]: { ...td, ...p } } });
    const cg = cupsGoal(hd); const due = (hd.meds || []).filter((m) => medDue(m, dateOf(0))); const took = td.med || []; const med = due.find((m) => !took.includes(m.id));
    const todo: string[] = []; const hr = new Date().getHours(); const nightNow = hr >= 20 || hr < 9; const needSleep = !(td.sleep > 0); if (needSleep && nightNow) todo.push('sleep'); if (td.mood < 0) todo.push('mood'); if (med) todo.push('med'); if (td.cups < cg) todo.push('water');
    // Pulse and period are not daily, so they are asked only when they fit, and "Skip" hides them until tomorrow.
    const dk = keyOfDate(dateOf(0)); const sk = skip.d === dk ? skip.k : []; const later = (k: string) => setSkip({ d: dk, k: [...sk, k] });
    if ((hd.heart || []).length && !(hd.heart || []).some((x) => x.d === dk) && !sk.includes('heart')) todo.push('heart');
    const cy = cycleInfo(hd); if (hd.cyOn && !td.pd && cy.nextOff != null && cy.nextOff <= 2 && !sk.includes('period')) todo.push('period');
    if (needSleep && !nightNow) todo.push('sleep');
    const cur = todo[0]; cur0 = cur; const head = (t: string, sub: string, onSub?: () => void) => (
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: '#8fe9e2', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.9 }}>{'QUICK LOG' + (todo.length ? ' · ' + todo.length + ' LEFT' : '')}</Text>
        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14.5, fontWeight: '800', marginTop: 3 }}>{t}</Text>
        {onSub ? <Pressable onPress={onSub} hitSlop={8}><Text numberOfLines={1} style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '700', marginTop: 2 }}>{sub}</Text></Pressable> : <Text numberOfLines={1} style={{ color: dim, fontSize: 11, marginTop: 2 }}>{sub}</Text>}
      </View>
    );
    const Btn = ({ t, onPress, w }: { t: string; onPress: () => void; w?: number }) => <Pressable onPress={onPress} hitSlop={6} style={{ minWidth: w || 0, paddingVertical: 9, paddingHorizontal: 13, borderRadius: 999, backgroundColor: '#8fe9e2', alignItems: 'center' }}><Text style={{ color: '#06222a', fontSize: 12.5, fontWeight: '800' }}>{t}</Text></Pressable>;
    const Rnd = ({ t, onPress, z = 30 }: { t: string; onPress: () => void; z?: number }) => <Pressable onPress={onPress} hitSlop={6} style={{ width: z, height: z, borderRadius: z / 2, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', marginTop: -2 }}>{t}</Text></Pressable>;
    const tileMsg = async () => { const r = await addSleepTile(); setSnMsg(r === 2 ? 'Added to Quick Settings' : r === 1 ? 'Already in Quick Settings' : r === 0 ? 'Not added' : 'Open Quick Settings, tap the pencil and drag Going to sleep up'); };
    if (sleeping && sn) body = (<>{head('You are sleeping', 'Since ' + to12(new Date(sn.start).toTimeString().slice(0, 5)) + ' · ' + fmtDur(Date.now() - sn.start))}
      <Btn t="I'm awake" onPress={async () => setSnMsg(await endSleep())} /></>);
    else if (cur === 'sleep') body = (<>{head("You haven't slept yet", snMsg || (Platform.OS === 'android' ? 'Add to Quick Settings ›' : 'Tap when you go to bed'), Platform.OS === 'android' ? tileMsg : undefined)}
      <Btn t="Going to sleep" onPress={async () => { setSnMsg(''); await startSleep(); }} /></>);
    else if (cur === 'sleep' && hrsOnly) body = (<>{head('Sleep last night', 'Set times ›', () => setHrsOnly(false))}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Rnd t="−" onPress={() => setSlp(Math.max(0.5, slp - 0.5))} /><Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', minWidth: 40, textAlign: 'center' }}>{slp} h</Text><Rnd t="+" onPress={() => setSlp(Math.min(14, slp + 0.5))} /><Btn t="Save" onPress={() => put({ sleep: slp })} /></View></>);
    else if (cur === 'sleep' && sleepStep === 0) body = (<>{head('Went to bed', 'Use hours only ›', () => setHrsOnly(true))}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Rnd z={26} t="−" onPress={() => setBedM((bedM + 1425) % 1440)} /><Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', minWidth: 62, textAlign: 'center' }}>{to12(fm(bedM))}</Text><Rnd z={26} t="+" onPress={() => setBedM((bedM + 15) % 1440)} /><View style={{ width: 0 }} /><Btn t="Next" onPress={() => setSleepStep(1)} /></View></>);
    else if (cur === 'sleep') { const hr = hoursBetween(fm(bedM), fm(wkM)); body = (<>{head('Woke up', '= ' + hr + ' h of sleep', () => setSleepStep(0))}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Rnd z={26} t="−" onPress={() => setWkM((wkM + 1425) % 1440)} /><Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', minWidth: 62, textAlign: 'center' }}>{to12(fm(wkM))}</Text><Rnd z={26} t="+" onPress={() => setWkM((wkM + 15) % 1440)} /><View style={{ width: 0 }} /><Btn t="Save" onPress={() => { put({ bed: fm(bedM), wake: fm(wkM), sleep: hr }); setSleepStep(0); }} /></View></>); }
    else if (cur === 'mood') body = (<>{head('Mood today', 'Tap how you feel')}
      <View style={{ flexDirection: 'row', gap: 5 }}>{[0, 1, 2, 3, 4].map((i) => <Pressable key={i} onPress={() => put({ mood: i })} hitSlop={4} accessibilityLabel={'Mood ' + (i + 1) + ' of 5'}><Face i={i} size={31} /></Pressable>)}</View></>);
    else if (cur === 'med' && med) body = (<>{head(med.name, [med.dose, med.time ? to12(med.time) : ''].filter(Boolean).join(' · ') || 'Medicine for today')}
      <Btn t="Taken" onPress={() => put({ med: [...took, med.id] })} /></>);
    else if (cur === 'water') body = (<>{head('Water today', td.cups * 250 + ' / ' + cg * 250 + ' ml · ' + td.cups + ' of ' + cg + ' glasses')}
      <Btn t="+1 glass (250 ml)" onPress={() => put({ cups: Math.min(cg, td.cups + 1) })} /></>);
    else if (cur === 'heart') body = (<>{head('Pulse', 'In bpm')}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Inp value={bpm} onChangeText={setBpm} keyboardType="number-pad" placeholder="bpm" maxLength={3} style={{ width: 54, paddingVertical: 7, paddingHorizontal: 8, textAlign: 'center' }} /><Btn t="Save" onPress={() => { const n = parseInt(bpm, 10); if (!(n >= 30 && n <= 220)) return; const now = new Date(); setHd({ ...hd, heart: [...(hd.heart || []), { id: String(Date.now()), d: dk, at: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'), bpm: n }].slice(-400) }); setBpm(''); }} /><Pressable onPress={() => later('heart')} hitSlop={8}><Text style={{ color: dim, fontSize: 11.5, fontWeight: '700' }}>Skip</Text></Pressable></View></>);
    else if (cur === 'period') body = (<>{head('Period', 'Did it start today?')}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Btn t="Yes" onPress={() => setPeriod(0, true)} /><Pressable onPress={() => later('period')} hitSlop={8}><Text style={{ color: dim, fontSize: 11.5, fontWeight: '700' }}>Skip</Text></Pressable></View></>);
    else if (unw) { const reset = () => { setUnw(false); setUsy([]); setOth(''); setOthOn(false); };
      const save = () => { const add = [...usy, ...(othOn && oth.trim() ? [oth.trim()] : [])]; if (add.length) put({ sy: [...(td.sy || []).filter((y) => !add.includes(y)), ...add] }); reset(); };
      body = (
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#fff', fontSize: 14.5, fontWeight: '800' }}>What are you feeling?</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={reset} hitSlop={8}><Text style={{ color: dim, fontSize: 12, fontWeight: '700' }}>Cancel</Text></Pressable>
            <Pressable onPress={save} hitSlop={6} style={{ paddingVertical: 5, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#8fe9e2' }}><Text style={{ color: '#06222a', fontSize: 12, fontWeight: '800' }}>Save</Text></Pressable>
          </View>
        </View>
        {othOn ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <Inp value={oth} onChangeText={setOth} placeholder="Type what you feel" maxLength={24} style={{ flex: 1, paddingVertical: 6 }} />
            <Pressable onPress={() => { setOthOn(false); setOth(''); }} hitSlop={8}><Text style={{ color: dim, fontSize: 18 }}>×</Text></Pressable>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, flexGrow: 0 }} contentContainerStyle={{ gap: 6 }}>
            {UNWELL.map((x) => { const on = usy.includes(x); return <Pressable key={x} onPress={() => setUsy(on ? usy.filter((y) => y !== x) : [...usy, x])} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: on ? '#8fe9e2' : 'rgba(255,255,255,.12)' }}><Text style={{ color: on ? '#06222a' : '#fff', fontSize: 12, fontWeight: '800' }}>{x}</Text></Pressable>; })}
            <Pressable onPress={() => setOthOn(true)} accessibilityLabel="Other, type what you feel" style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#8fe9e2' }}><Text style={{ color: '#8fe9e2', fontSize: 12, fontWeight: '800' }}>Other…</Text></Pressable>
          </ScrollView>
        )}
      </View>); }
    else body = (<><HeadIcon k="week" size={40} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: '#8fe9e2', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.9 }}>QUICK LOG</Text>
        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14.5, fontWeight: '800', marginTop: 3 }}>All logged for today</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
          <Text numberOfLines={1} style={{ color: dim, fontSize: 11, flexShrink: 1 }}>{(td.sy || []).length ? 'Noted: ' + (td.sy || []).join(', ') : 'Everything is in'}</Text>
          <Pressable onPress={() => { setUsy((td.sy || []).filter((y) => UNWELL.includes(y))); setUnw(true); }} hitSlop={8} style={{ flexShrink: 0, paddingLeft: 8 }}><Text numberOfLines={1} style={{ color: '#8fe9e2', fontSize: 11.5, fontWeight: '800' }}>{(td.sy || []).length ? 'Edit ›' : 'Feeling unwell? ›'}</Text></Pressable>
        </View>
      </View></>);
  } else if (kind === 'usage') {
    body = (<>
      <View>
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>App Usage <Text style={{ fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,.65)' }}>· {series.length} days</Text></Text>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 6 }}>
          <View><Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{mins} min</Text><Text style={{ color: dim, fontSize: 11 }}>Today</Text></View>
          <View><Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{opens} {opens === 1 ? 'open' : 'opens'}</Text><Text style={{ color: dim, fontSize: 11 }}>Today</Text></View>
        </View>
      </View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 60 }}>
        {series.map((m, i) => (
          <LinearGradient key={i} colors={m > 0 ? ['#8fe9e2', '#7c9cff'] : ['rgba(255,255,255,.25)', 'rgba(255,255,255,.25)']} style={{ flex: 1, height: m > 0 && Number.isFinite(m) ? Math.max(8, Math.round((m / maxM) * 52)) : 4, borderTopLeftRadius: 3, borderTopRightRadius: 3, borderBottomLeftRadius: 1, borderBottomRightRadius: 1 }} />
        ))}
      </View>
    </>);
  } else if (kind === 'streak') {
    const hd = core.hd; const cg = cupsGoal(hd), g = hd.goal || 8000;
    const now = curStreak(hd), best = Math.max(bestStreakAll(hd), now);
    const days = weekOffs().map((o) => ({ l: LET[dateOf(o).getDay()], on: goalPctOf(getDay(hd, o), g, cg) >= 70, today: o === 0 }));
    body = (<>
      <View>
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Daily Streak</Text>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 }}>{now} {now === 1 ? 'day' : 'days'}</Text>
        <Text style={{ color: dim, fontSize: 11 }}>Now · best {best}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'flex-end', gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {days.map((d, i) => d.on
            ? <LinearGradient key={i} colors={['#8fe9e2', '#34d399']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: d.today ? 2 : 0, borderColor: '#fff' }}><Text style={{ color: '#06222a', fontSize: 10, fontWeight: '900' }}>{d.l}</Text></LinearGradient>
            : <View key={i} style={{ width: 21, height: 21, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center', borderWidth: d.today ? 2 : 0, borderColor: '#fff' }}><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10, fontWeight: '700' }}>{d.l}</Text></View>)}
        </View>
        <Text style={{ color: dim, fontSize: 11 }}>This week · ring = today</Text>
      </View>
    </>);
  } else if (kind === 'memories') {
    body = (<>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#8fe9e2', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.9 }}>YOUR MEMORIES</Text>
        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14.5, fontWeight: '800', marginTop: 3 }}>{mdays ? 'Day ' + mdays + ' with My Life 1.0' : 'Your Memories with My Life 1.0'}</Text>
        <Text numberOfLines={2} style={{ color: dim, fontSize: 10.5, marginTop: 3, lineHeight: 14 }}>Every moment matters. Every journey tells a story</Text>
      </View>
      <Pressable onPress={() => router.push('/memories' as any)} accessibilityLabel="Open Your Memories" style={{ paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#8fe9e2' }}><Text style={{ color: '#0d3a3a', fontSize: 13, fontWeight: '800' }}>Open</Text></Pressable>
    </>);
  } else if (kind === 'score') {
    const sc = lifeScore(parts); const R = 24, C = 2 * Math.PI * R;
    const sorted = parts.slice().sort((a, b) => b.pct - a.pct); const warn = sorted.find(p => p.k === 'spend' && /(over budget|nearly used)$/.test(p.detail)); const top = warn ? [warn, ...sorted.filter(p => p !== warn).slice(0, 2)] : sorted.slice(0, 3);
    body = (<>
      <View style={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={60} height={60} style={{ position: 'absolute' }}>
          <Circle cx={30} cy={30} r={R} stroke="rgba(255,255,255,.18)" strokeWidth={6} fill="none" />
          <Circle cx={30} cy={30} r={R} stroke="#34d399" strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={C + ''} strokeDashoffset={C - (C * Math.min(sc, 100)) / 100} transform="rotate(-90 30 30)" />
        </Svg>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{sc}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Life Score <Text style={{ fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,.65)' }}>· today</Text></Text>
        <Text numberOfLines={2} style={{ color: dim, fontSize: 11, marginTop: 4, lineHeight: 15 }}>{top.map((p, i) => { const over = p.k === 'spend' && /over budget$/.test(p.detail); const near = p.k === 'spend' && /nearly used$/.test(p.detail); return <Text key={p.k + i}>{i ? ' · ' : ''}{p.label + ' ' + p.pct + '%'}{over || near ? <Text style={{ color: over ? '#ff8a9b' : '#ffc46b', fontWeight: '800' }}>{over ? ' · over' : ' · low'}</Text> : null}</Text>; })}</Text>
      </View>
    </>);
  } else {
    const t = tp[0];
    body = (<>
      <HeadIcon k={t.k} size={40} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 13.5, fontWeight: '700' }}>{t.title}</Text>
        <Text numberOfLines={2} style={{ color: dim, fontSize: 11, marginTop: 3, lineHeight: 15 }}>{t.sub}</Text>
      </View>
    </>);
  }

  busy.current = sleeping || (kind === 'log' && (cur0 === 'heart' || unw || othOn || !!bpm));
  return (
    <Pressable onTouchStart={() => { last.current = Date.now(); }} onPress={kind === 'log' && (cur0 === 'heart' || (cur0 === undefined && unw)) ? undefined : next} onLongPress={open} delayLongPress={450} style={({ pressed }) => ({ marginTop: 12, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <Glass style={{ height: 90, justifyContent: 'center' }}>
        <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, opacity: v, transform: [{ translateY: ty }] }}>{body}</Animated.View>
        {avail.length > 1 && !(kind === 'log' && cur0 === undefined && unw) ? (
          <View pointerEvents="none" style={{ position: 'absolute', top: 9, right: 14, flexDirection: 'row', gap: 4 }}>
            {avail.map((k, i) => <View key={k} style={{ width: i === idx ? 14 : 5, height: 5, borderRadius: 3, backgroundColor: i === idx ? '#8fe9e2' : 'rgba(255,255,255,.3)' }} />)}
          </View>
        ) : null}
      </Glass>
    </Pressable>
  );
}
