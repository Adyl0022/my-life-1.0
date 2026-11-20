import React from 'react';
import { lessonOfDay } from '../lib/lessonOfDay';
import { EMPTY_COL, type ColStore } from '../lib/collection';
import { View, Pressable, Animated, ScrollView, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text } from './Txt';
import { Glass } from './Glass';
import { useStored } from '../lib/store';
import { useHidden } from '../lib/hidden';
import { Inp } from './Ui';
import { useDashPages, DASH_PAGES } from './DashCardPicks';
import { useCycleSave } from '../lib/cycleHook';
import { cycleInfo } from '../lib/cycle';
import { addSleepTile } from '../../modules/step-counter';
import { useSession } from '../lib/auth';
import { useDashExtras } from '../lib/dashExtras';
import { MemSave, MEM_EMPTY } from '../lib/memories';
import { SLEEP_KEY, SleepNow, startSleep, endSleep, fmtDur } from '../lib/sleepNow';
const UNWELL = ['Headache', 'Tired', 'Fever'];
const fm = (m: number) => { const x = ((m % 1440) + 1440) % 1440; return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };
import { useCore, scoreParts, lifeScore, tips } from '../lib/insights';
import { HeadIcon, Face } from './HabitIcons';
import { energyEstimate, restSignal } from '../lib/patterns';
import { EnergyRow } from './EnergyUi';
import { weekOffs, curStreak, bestStreakAll, goalPctOf, getDay, cupsGoal, dateOf, keyOfDate, hoursBetween, medDue, to12, HData, HDay, HEMPTY } from '../lib/habit';

// The card at the bottom of the Dashboard. Tap opens the page, tap a bar segment to jump, long-press for the next one. Quick log keeps its own buttons.
type Kind = 'log' | 'usage' | 'streak' | 'score' | 'tip' | 'lesson' | 'memories' | 'prayer' | 'event' | 'calmix' | 'calgen' | 'subs' | 'job' | 'money' | 'tasks' | 'renew' | 'debt';
const ORDER: Kind[] = ['log', 'prayer', 'tasks', 'event', 'calmix', 'calgen', 'subs', 'job', 'renew', 'money', 'debt', 'streak', 'score', 'tip', 'lesson', 'memories'];
const EXK = ['prayer', 'event', 'calmix', 'calgen', 'subs', 'job', 'money', 'tasks', 'renew', 'debt'];
const dim = 'rgba(255,255,255,.7)';
const LET = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const PG: Record<string, { e: string; c: string }> = {}; DASH_PAGES.forEach((p) => { PG[p.k] = { e: p.e, c: p.c }; });
const RED = '#ff6b81', YEL = '#ffd24a', TEAL = '#8fe9e2';
// one place decides the status colour: red = late, yellow = close to due, otherwise the page's own calm colour
const toneOf = (t?: string) => (t === RED ? RED : t === YEL ? YEL : undefined);
const pillOf = (k: string, val?: string) => {
  if (!val) return '';
  if (val === 'Late') return 'OVERDUE'; if (val === 'Today') return 'TODAY'; if (val === 'Soon') return 'SOON';
  const d = /^(\d+)d$/.exec(val); if (d) return d[1] + (d[1] === '1' ? ' DAY' : ' DAYS');
  if (k === 'prayer') return 'IN ' + val.toUpperCase();
  if (k === 'money') return val + ' LEFT';
  if (k === 'tasks') return val + (val === '1' ? ' TASK' : ' TASKS');
  if (k === 'streak') return val + ' WEEK';
  if (k === 'score') return val + ' / 100';
  return val.toUpperCase();
};
// every page uses this one layout so the sizes match: label 9.5, title 16 (one line), sub 12.5 (two lines), status pill top right, a big faded emoji as a watermark
function Premium({ k, label, title, sub, tone, val }: { k: string; label: string; title: string; sub: string; tone?: string; val?: string }) {
  const g0 = PG[k] || { e: '✨', c: TEAL }; const hot = toneOf(tone); const c = hot || g0.c; const pill = pillOf(k, val);
  const sh = { textShadowColor: 'rgba(10,10,50,.35)', textShadowRadius: 5, textShadowOffset: { width: 0, height: 1 } } as const;
  return (<>
    <Text pointerEvents="none" style={{ position: 'absolute', right: -6, bottom: -20, fontSize: 90, lineHeight: 104, opacity: 0.3, transform: [{ rotate: '-12deg' }] }}>{g0.e}</Text>
    <View style={{ flex: 1, minWidth: 0, paddingRight: pill ? 78 : 56 }}>
      <Text numberOfLines={1} style={{ color: hot === RED ? '#ffd5db' : hot || '#d6faf3', fontSize: 9.5, fontWeight: '800', letterSpacing: 1.5 }}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} style={{ color: '#fff', fontSize: 16, lineHeight: 21, fontWeight: '800', marginTop: 3, ...sh }}>{title}</Text>
      <Text numberOfLines={2} style={{ color: 'rgba(255,255,255,.94)', fontSize: 12.5, lineHeight: 17, fontWeight: '600', marginTop: 2, ...sh }}>{sub}</Text>
    </View>
    {pill ? <View style={{ position: 'absolute', right: 14, top: 12, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: c + 'b3', backgroundColor: hot === RED ? 'rgba(255,107,129,.92)' : c + '40' }}><Text numberOfLines={1} style={{ color: hot === RED ? '#fff' : c, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>{pill}</Text></View> : null}
  </>);
}

export function DashCard({ mins, opens, series }: { mins: number; opens: number; series: number[] }) {
  const router = useRouter();
  const hid = useHidden();
  const core = useCore();
  const [sel, setSel] = useStored<string>('ml_dcard2', 'log');
  const [colS] = useStored<ColStore>('ml_collection', EMPTY_COL);
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
  const ex = useDashExtras(core, { islamic: hid.on('islamic'), planner: hid.on('planner'), record: hid.on('record'), finance: hid.on('finance') });
  const ok: Record<Kind, boolean> = { prayer: !!ex.prayer, event: !!ex.event, calmix: !!ex.calmix, calgen: !!ex.calgen, subs: !!ex.subs, job: !!ex.job, money: !!ex.money, tasks: !!ex.tasks, renew: !!ex.renew, debt: !!ex.debt, log: hid.on('habit'), usage: false, streak: hid.on('habit'), score: parts.length > 0, tip: tp.length > 0, lesson: true, memories: !!sess && !(mem && mem.dash === false) };
  const dp = useDashPages(); ORDER.forEach((k) => { if (k !== 'log' && !dp.isOn(k)) ok[k] = false; });
  const avail = ORDER.filter((k) => ok[k]);
  const kind: Kind = sleeping && ok.log ? 'log' : (ORDER as string[]).indexOf(sel) >= 0 && ok[sel as Kind] ? (sel as Kind) : (ok.log ? 'log' : avail[0] || 'log');
  const idx = avail.indexOf(kind);

  const goTo = (to: Kind) => {
    if (avail.length < 2 || to === kind) return;
    Animated.parallel([Animated.timing(v, { toValue: 0, duration: 160, useNativeDriver: true }), Animated.timing(ty, { toValue: -8, duration: 160, useNativeDriver: true })]).start(() => {
      setSel(to); ty.setValue(8);
      Animated.parallel([Animated.timing(v, { toValue: 1, duration: 160, useNativeDriver: true }), Animated.timing(ty, { toValue: 0, duration: 160, useNativeDriver: true })]).start();
    });
  };
  const next = () => goTo(avail[(idx + 1) % avail.length]);
  const open = () => router.push((EXK.indexOf(kind) >= 0 ? ((ex as any)[kind] as any).go : kind === 'memories' ? '/memories' : kind === 'lesson' ? '/lessons' : kind === 'usage' ? '/stats' : kind === 'streak' || kind === 'log' ? '/habit' : kind === 'tip' && tp[0] ? (tp[0].go || '/insights') : '/insights') as any);

  nextRef.current = next;
  // Coming back from another page: the card must keep turning, and must never be left half faded.
  useFocusEffect(React.useCallback(() => { last.current = 0; v.setValue(1); ty.setValue(0); }, [v, ty]));
  // The card turns by itself every few seconds. It waits after a touch, and stays put while you are sleeping or typing something.
  React.useEffect(() => { const i = setInterval(() => { if (busy.current || Date.now() - last.current < 20000) return; nextRef.current(); }, 5000); return () => clearInterval(i); }, []);

  const maxM = Math.max(...series.filter((x) => Number.isFinite(x)), 1);
  let body: React.ReactNode = null; let cur0: string | undefined; let hotC: string | undefined;
  if (kind === 'log') {
    // Quick log: the next thing not filled in today, answered right here. When it is saved the next one takes its place.
    const td = getDay(hd, 0); const put = (p: Partial<HDay>) => setHd({ ...hd, days: { ...hd.days, [keyOfDate(dateOf(0))]: { ...td, ...p } } });
    const cg = cupsGoal(hd); const due = (hd.meds || []).filter((m) => medDue(m, dateOf(0))); const took = td.med || []; const med = due.find((m) => !took.includes(m.id));
    const todo: string[] = []; const hr = new Date().getHours(); const nightNow = hr >= 20 || hr < 9; const needSleep = !(td.sleep > 0); if (needSleep && nightNow) todo.push('sleep'); if (td.mood < 0) todo.push('mood'); if ((td.en ?? -1) < 0 && td.mood >= 0 && hr >= 9 && !(skip.d === keyOfDate(dateOf(0)) && skip.k.includes('energy'))) todo.push('energy'); if (med) todo.push('med'); if (td.cups < cg) todo.push('water');
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
    else if (cur === 'mood') body = (<>{head('Mood today', td.sleep > 0 && td.sleep < 6 ? 'Slept ' + (Math.round(td.sleep * 10) / 10) + ' h. How do you feel?' : 'Tap how you feel')}
      <View style={{ flexDirection: 'row', gap: 5 }}>{[0, 1, 2, 3, 4].map((i) => <Pressable key={i} onPress={() => put({ mood: i })} hitSlop={4} accessibilityLabel={'Mood ' + (i + 1) + ' of 5'}><Face i={i} size={31} /></Pressable>)}</View></>);
    else if (cur === 'energy') { const est = energyEstimate(td, cg, hd.goal || 8000, restSignal(hd, dk)); body = (<>{head('Energy today', 'Skip for now ›', () => later('energy'))}
      <EnergyRow suggest={est ? est.lvl : null} onPick={(i) => put({ en: i })} /></>); }
    else if (cur === 'med' && med) body = (<>{head(med.name, [med.dose, med.time ? to12(med.time) : ''].filter(Boolean).join(' · ') || 'Medicine for today')}
      <Btn t="Taken" onPress={() => put({ med: [...took, med.id] })} /></>);
    else if (cur === 'water') body = (<>{head('Water today', td.cups * 250 + ' / ' + cg * 250 + ' ml · ' + td.cups + ' of ' + cg + ' glasses')}
      <Btn t="+1 glass (250 ml)" onPress={() => put({ cups: Math.min(cg, td.cups + 1) })} /></>);
    else if (cur === 'heart') body = (<>{head('Pulse', 'In bpm')}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Inp min={30} max={220} value={bpm} onChangeText={setBpm} keyboardType="number-pad" placeholder="bpm" maxLength={3} style={{ width: 54, paddingVertical: 7, paddingHorizontal: 8, textAlign: 'center' }} /><Btn t="Save" onPress={() => { const n = parseInt(bpm, 10); if (!(n >= 30 && n <= 220)) return; const now = new Date(); setHd({ ...hd, heart: [...(hd.heart || []), { id: String(Date.now()), d: dk, at: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'), bpm: n }].slice(-400) }); setBpm(''); }} /><Pressable onPress={() => later('heart')} hitSlop={8}><Text style={{ color: dim, fontSize: 11.5, fontWeight: '700' }}>Skip</Text></Pressable></View></>);
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
    const wk = weekOffs().filter((o) => goalPctOf(getDay(hd, o), g, cg) >= 70).length;
    body = <Premium k="streak" label="DAILY STREAK" title={now + (now === 1 ? ' day' : ' days')} sub={'Best ' + best + ' · ' + wk + ' of 7 this week'} val={wk + '/7'} />;
  } else if (EXK.indexOf(kind) >= 0) {
    const e = (ex as any)[kind] as any; hotC = toneOf(e.tone);
    body = <Premium k={kind} label={e.label} title={e.title} sub={e.sub} tone={e.tone} val={e.val} />;
  } else if (kind === 'lesson') {
    const ld = lessonOfDay(colS && colS.lessons);
    body = <Premium k="lesson" label={(ld.mine ? 'YOUR LESSON' : 'LIFE LESSON') + ' · ' + ld.tag.toUpperCase()} title={ld.title} sub={ld.text} />;
  } else if (kind === 'memories') {
    body = <Premium k="memories" label="YOUR MEMORIES" title={mdays ? 'Day ' + mdays + ' with My Life' : 'Your Memories'} sub="Every moment matters" />;
  } else if (kind === 'score') {
    const sc = lifeScore(parts);
    const sorted = parts.slice().sort((a, b) => b.pct - a.pct); const warn = sorted.find(p => p.k === 'spend' && /(over budget|nearly used)$/.test(p.detail)); const top = warn ? [warn, ...sorted.filter(p => p !== warn).slice(0, 1)] : sorted.slice(0, 2);
    body = <Premium k="score" label="LIFE SCORE · TODAY" title={sc + ' out of 100'} sub={top.map((p) => p.label + ' ' + p.pct + '%').join(' · ')} val={String(sc)} />;
  } else {
    const t = tp[0];
    body = <Premium k="tip" label="TIP" title={t.title} sub={t.sub} />;
  }

  busy.current = sleeping || (kind === 'log' && (cur0 === 'heart' || unw || othOn || !!bpm));
  const logOpen = kind === 'log';
  const barOn = avail.length > 1 && !(kind === 'log' && cur0 === undefined && unw);
  const prog = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => { prog.setValue(0); const a = Animated.timing(prog, { toValue: 1, duration: 5000, useNativeDriver: false }); a.start(); return () => a.stop(); }, [kind]);
  return (
    <Pressable onTouchStart={() => { last.current = Date.now(); }} onPress={logOpen ? (cur0 === 'heart' || (cur0 === undefined && unw) ? undefined : next) : open} onLongPress={logOpen ? open : next} delayLongPress={450} style={({ pressed }) => ({ marginTop: 12, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <Glass style={{ minHeight: 100, justifyContent: 'center', borderRadius: 26, ...(hotC ? { borderColor: hotC + 'b3', borderWidth: 1.2, shadowColor: hotC, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } } : {}) }}>
        {kind !== 'log' ? <><LinearGradient colors={[(hotC || (PG[kind] && PG[kind].c) || TEAL) + (hotC ? '99' : '66'), 'rgba(255,255,255,0)']} start={{ x: 1, y: 1 }} end={{ x: 0.3, y: 0.15 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} /><LinearGradient colors={['rgba(255,255,255,.26)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 0.7 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} /></> : null}
        <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, minHeight: 100, paddingBottom: barOn ? 12 : 0, opacity: v, transform: [{ translateY: ty }] }}>{body}</Animated.View>
        {barOn ? (
          <View style={{ position: 'absolute', left: 18, right: 18, bottom: 6, flexDirection: 'row', gap: 4 }}>
            {avail.map((k, i) => (
              <Pressable key={k} onPress={() => goTo(k)} hitSlop={{ top: 8, bottom: 8 }} accessibilityLabel={'Show page ' + (i + 1)} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,.18)', overflow: 'hidden' }}>
                {i === idx ? <Animated.View style={{ height: 3, backgroundColor: '#8fe9e2', width: prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} /> : i < idx ? <View style={{ height: 3, backgroundColor: 'rgba(143,233,226,.45)' }} /> : null}
              </Pressable>
            ))}
          </View>
        ) : null}
      </Glass>
    </Pressable>
  );
}
