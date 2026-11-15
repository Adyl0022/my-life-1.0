import React from 'react';
import { View, Pressable, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Text } from './Txt';
import { Glass } from './Glass';
import { useStored } from '../lib/store';
import { useHidden } from '../lib/hidden';
import { useCore, scoreParts, lifeScore, tips } from '../lib/insights';
import { HeadIcon, Face } from './HabitIcons';
import { curStreak, bestStreakAll, goalPctOf, getDay, cupsGoal, dateOf, keyOfDate, medDue, to12, HData, HDay, HEMPTY } from '../lib/habit';
import { ENERGY } from '../lib/patterns';

// The card at the bottom of the Dashboard. Tap to switch what it shows, long-press to open the full page.
type Kind = 'log' | 'usage' | 'streak' | 'score' | 'tip';
const ORDER: Kind[] = ['log', 'usage', 'streak', 'score', 'tip'];
const dim = 'rgba(255,255,255,.7)';
const LET = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function DashCard({ mins, opens, series }: { mins: number; opens: number; series: number[] }) {
  const router = useRouter();
  const hid = useHidden();
  const core = useCore();
  const [sel, setSel] = useStored<string>('ml_dcard2', 'log');
  const [hd, setHd] = useStored<HData>('ml_habit', HEMPTY);
  const [slp, setSlp] = React.useState(7);
  const v = React.useRef(new Animated.Value(1)).current;
  const ty = React.useRef(new Animated.Value(0)).current;

  const parts = scoreParts(core, false);
  const tp = tips(core, false);
  const ok: Record<Kind, boolean> = { log: hid.on('habit'), usage: true, streak: hid.on('habit'), score: parts.length > 0, tip: tp.length > 0 };
  const avail = ORDER.filter((k) => ok[k]);
  const kind: Kind = (ORDER as string[]).indexOf(sel) >= 0 && ok[sel as Kind] ? (sel as Kind) : (ok.log ? 'log' : 'usage');
  const idx = avail.indexOf(kind);

  const next = () => {
    if (avail.length < 2) return;
    const to = avail[(idx + 1) % avail.length];
    Animated.parallel([Animated.timing(v, { toValue: 0, duration: 160, useNativeDriver: true }), Animated.timing(ty, { toValue: -8, duration: 160, useNativeDriver: true })]).start(() => {
      setSel(to); ty.setValue(8);
      Animated.parallel([Animated.timing(v, { toValue: 1, duration: 160, useNativeDriver: true }), Animated.timing(ty, { toValue: 0, duration: 160, useNativeDriver: true })]).start();
    });
  };
  const open = () => router.push((kind === 'usage' ? '/stats' : kind === 'streak' || kind === 'log' ? '/habit' : kind === 'tip' && tp[0] ? (tp[0].go || '/insights') : '/insights') as any);

  const maxM = Math.max(...series, 1);
  let body: React.ReactNode = null;
  if (kind === 'log') {
    // Quick log: the next thing not filled in today, answered right here. When it is saved the next one takes its place.
    const td = getDay(hd, 0); const put = (p: Partial<HDay>) => setHd({ ...hd, days: { ...hd.days, [keyOfDate(dateOf(0))]: { ...td, ...p } } });
    const cg = cupsGoal(hd); const due = (hd.meds || []).filter((m) => medDue(m, dateOf(0))); const took = td.med || []; const med = due.find((m) => !took.includes(m.id));
    const todo: string[] = []; if (!(td.sleep > 0)) todo.push('sleep'); if (td.mood < 0) todo.push('mood'); if ((td.en ?? -1) < 0) todo.push('energy'); if (med) todo.push('med'); if (td.cups < cg) todo.push('water');
    const cur = todo[0]; const head = (t: string, sub: string) => (
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#8fe9e2', fontSize: 9.5, fontWeight: '800', letterSpacing: 1.2 }}>{'QUICK LOG' + (todo.length ? ' · ' + todo.length + ' LEFT' : '')}</Text>
        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14.5, fontWeight: '800', marginTop: 3 }}>{t}</Text>
        <Text numberOfLines={1} style={{ color: dim, fontSize: 11, marginTop: 2 }}>{sub}</Text>
      </View>
    );
    const Btn = ({ t, onPress, w }: { t: string; onPress: () => void; w?: number }) => <Pressable onPress={onPress} hitSlop={6} style={{ minWidth: w || 0, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#8fe9e2', alignItems: 'center' }}><Text style={{ color: '#06222a', fontSize: 12.5, fontWeight: '800' }}>{t}</Text></Pressable>;
    const Rnd = ({ t, onPress }: { t: string; onPress: () => void }) => <Pressable onPress={onPress} hitSlop={6} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', marginTop: -2 }}>{t}</Text></Pressable>;
    if (cur === 'sleep') body = (<>{head('Sleep last night', 'Hours you slept')}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Rnd t="−" onPress={() => setSlp(Math.max(0.5, slp - 0.5))} /><Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', minWidth: 40, textAlign: 'center' }}>{slp} h</Text><Rnd t="+" onPress={() => setSlp(Math.min(14, slp + 0.5))} /><Btn t="Save" onPress={() => put({ sleep: slp })} /></View></>);
    else if (cur === 'mood') body = (<>{head('Mood today', 'Tap how you feel')}
      <View style={{ flexDirection: 'row', gap: 5 }}>{[0, 1, 2, 3, 4].map((i) => <Pressable key={i} onPress={() => put({ mood: i })} hitSlop={4} accessibilityLabel={'Mood ' + (i + 1) + ' of 5'}><Face i={i} size={31} /></Pressable>)}</View></>);
    else if (cur === 'energy') body = (<>{head('Energy today', 'Your own rating')}
      <View style={{ width: 176, flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'flex-end' }}>{ENERGY.map((e, i) => <Pressable key={e[0]} onPress={() => put({ en: i })} style={{ width: 85, paddingVertical: 6, borderRadius: 999, alignItems: 'center', backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: e[1] + '99' }}><Text numberOfLines={1} style={{ color: '#fff', fontSize: 10.5, fontWeight: '700' }}>{e[0]}</Text></Pressable>)}</View></>);
    else if (cur === 'med' && med) body = (<>{head(med.name, [med.dose, med.time ? to12(med.time) : ''].filter(Boolean).join(' · ') || 'Medicine for today')}
      <Btn t="Taken" onPress={() => put({ med: [...took, med.id] })} /></>);
    else if (cur === 'water') body = (<>{head('Water', td.cups + ' of ' + cg + ' glasses today')}
      <Btn t="+1 glass" onPress={() => put({ cups: Math.min(cg, td.cups + 1) })} /></>);
    else body = (<><HeadIcon k="week" size={40} />{head('All logged for today', 'Sleep, mood, energy and water are in')}</>);
  } else if (kind === 'usage') {
    body = (<>
      <View>
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>App Usage <Text style={{ fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,.65)' }}>· 30 days</Text></Text>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 6 }}>
          <View><Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{mins} min</Text><Text style={{ color: dim, fontSize: 11 }}>Today</Text></View>
          <View><Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{opens} {opens === 1 ? 'open' : 'opens'}</Text><Text style={{ color: dim, fontSize: 11 }}>Today</Text></View>
        </View>
      </View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 60 }}>
        {series.map((m, i) => (
          <LinearGradient key={i} colors={m > 0 ? ['#8fe9e2', '#7c9cff'] : ['rgba(255,255,255,.25)', 'rgba(255,255,255,.25)']} style={{ flex: 1, height: m > 0 ? Math.max(8, Math.round((m / maxM) * 52)) : 4, borderTopLeftRadius: 3, borderTopRightRadius: 3, borderBottomLeftRadius: 1, borderBottomRightRadius: 1 }} />
        ))}
      </View>
    </>);
  } else if (kind === 'streak') {
    const hd = core.hd; const cg = cupsGoal(hd), g = hd.goal || 8000;
    const now = curStreak(hd), best = Math.max(bestStreakAll(hd), now);
    const days = [-6, -5, -4, -3, -2, -1, 0].map((o) => ({ l: LET[dateOf(o).getDay()], on: goalPctOf(getDay(hd, o), g, cg) >= 70, today: o === 0 }));
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
        <Text style={{ color: dim, fontSize: 11 }}>Last 7 days · ring = today</Text>
      </View>
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

  return (
    <Pressable onPress={next} onLongPress={open} delayLongPress={450} style={({ pressed }) => ({ marginTop: 12, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <Glass style={{ height: 90, justifyContent: 'center' }}>
        <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, opacity: v, transform: [{ translateY: ty }] }}>{body}</Animated.View>
        {avail.length > 1 ? (
          <View pointerEvents="none" style={{ position: 'absolute', top: 9, right: 14, flexDirection: 'row', gap: 4 }}>
            {avail.map((k, i) => <View key={k} style={{ width: i === idx ? 14 : 5, height: 5, borderRadius: 3, backgroundColor: i === idx ? '#8fe9e2' : 'rgba(255,255,255,.3)' }} />)}
          </View>
        ) : null}
      </Glass>
    </Pressable>
  );
}
