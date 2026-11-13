import React from 'react';
import { View, Pressable, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Text } from './Txt';
import { Glass } from './Glass';
import { useStored } from '../lib/store';
import { useHidden } from '../lib/hidden';
import { useCore, scoreParts, lifeScore, tips, tipCat } from '../lib/insights';
import { curStreak, bestStreakAll, goalPctOf, getDay, cupsGoal, dateOf } from '../lib/habit';

// The card at the bottom of the Dashboard. Tap to switch what it shows, long-press to open the full page.
type Kind = 'usage' | 'streak' | 'score' | 'tip';
const ORDER: Kind[] = ['usage', 'streak', 'score', 'tip'];
const TIPIC: Record<string, string> = { Health: '💧', Money: '💰', Faith: '🕌', Tasks: '✅', Vehicle: '🚗' };
const dim = 'rgba(255,255,255,.7)';
const LET = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function DashCard({ mins, opens, series }: { mins: number; opens: number; series: number[] }) {
  const router = useRouter();
  const hid = useHidden();
  const core = useCore();
  const [sel, setSel] = useStored<string>('ml_dcard', 'usage');
  const v = React.useRef(new Animated.Value(1)).current;
  const ty = React.useRef(new Animated.Value(0)).current;

  const parts = scoreParts(core, false);
  const tp = tips(core, false);
  const ok: Record<Kind, boolean> = { usage: true, streak: hid.on('habit'), score: parts.length > 0, tip: tp.length > 0 };
  const avail = ORDER.filter((k) => ok[k]);
  const kind: Kind = (ORDER as string[]).indexOf(sel) >= 0 && ok[sel as Kind] ? (sel as Kind) : 'usage';
  const idx = avail.indexOf(kind);

  const next = () => {
    if (avail.length < 2) return;
    const to = avail[(idx + 1) % avail.length];
    Animated.parallel([Animated.timing(v, { toValue: 0, duration: 160, useNativeDriver: true }), Animated.timing(ty, { toValue: -8, duration: 160, useNativeDriver: true })]).start(() => {
      setSel(to); ty.setValue(8);
      Animated.parallel([Animated.timing(v, { toValue: 1, duration: 160, useNativeDriver: true }), Animated.timing(ty, { toValue: 0, duration: 160, useNativeDriver: true })]).start();
    });
  };
  const open = () => router.push((kind === 'usage' ? '/stats' : kind === 'streak' ? '/habit' : kind === 'tip' && tp[0] ? (tp[0].go || '/insights') : '/insights') as any);

  const maxM = Math.max(...series, 1);
  let body: React.ReactNode = null;
  if (kind === 'usage') {
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
    const days = [-6, -5, -4, -3, -2, -1, 0].map((o) => ({ l: LET[dateOf(o).getDay()], on: goalPctOf(getDay(hd, o), g, cg) >= 70 }));
    body = (<>
      <View>
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Daily Streak</Text>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 }}>{now} {now === 1 ? 'day' : 'days'}</Text>
        <Text style={{ color: dim, fontSize: 11 }}>Now · best {best}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'flex-end', gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {days.map((d, i) => d.on
            ? <LinearGradient key={i} colors={['#8fe9e2', '#34d399']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#06222a', fontSize: 10, fontWeight: '900' }}>{d.l}</Text></LinearGradient>
            : <View key={i} style={{ width: 21, height: 21, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10, fontWeight: '700' }}>{d.l}</Text></View>)}
        </View>
        <Text style={{ color: dim, fontSize: 11 }}>Last 7 days</Text>
      </View>
    </>);
  } else if (kind === 'score') {
    const sc = lifeScore(parts); const R = 24, C = 2 * Math.PI * R;
    const top = parts.slice().sort((a, b) => b.pct - a.pct).slice(0, 3).map((p) => p.label + ' ' + p.pct + '%');
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
        <Text numberOfLines={2} style={{ color: dim, fontSize: 11, marginTop: 4, lineHeight: 15 }}>{top.join(' · ')}</Text>
      </View>
    </>);
  } else {
    const t = tp[0];
    body = (<>
      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,196,107,.25)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 20 }}>{TIPIC[tipCat(t.id)] || '💡'}</Text></View>
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
