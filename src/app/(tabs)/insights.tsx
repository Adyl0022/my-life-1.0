import React, { useEffect, useState } from 'react';
import { InsightsBg } from '../../components/PageBg';
import { PageIn } from '../../components/PageIn';
import { Rise, FillBar, GrowBar, useReplay } from '../../components/Anim';
import { HeadIcon } from '../../components/HabitIcons';
import { navScroll } from '../../lib/navbar';
import { View, ScrollView, Pressable, Animated } from 'react-native';
import { Text } from '../../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Path, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Glass } from '../../components/Glass';
import { getDay, cupsGoal, goalPctOf, keyOfDate, dateOf } from '../../lib/habit';
import { useCore, scoreParts, lifeScore, tips, weekly, patterns, hideTip, tipCat } from '../../lib/insights';
import { TOP } from '../../lib/layout';
import { cs, useRegion } from '../../lib/region';

const ACirc: any = Animated.createAnimatedComponent(Circle);
type Sp = { amt: number; date: string };
const Wallet = ({ s = 30 }: { s?: number }) => (
  <View style={{ width: s, height: s, borderRadius: s * 0.32, backgroundColor: '#ffc46b', alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={s * 0.62} height={s * 0.62} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18v3M3 7.5V17a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5.5A2.5 2.5 0 0 1 3 7.5zM16 13.5h2" /></Svg>
  </View>
);

export default function Insights() {
  useRegion();
  const router = useRouter();
  const [week, setWeek] = useState(false);
  const core0 = useCore();
  const [showAll, setShowAll] = useState(false);
  const [why, setWhy] = useState('');
  const [cat, setCat] = useState('All');
  const hd = core0.hd, fin = core0.fin;
  const cg = cupsGoal(hd), goal = hd.goal || 8000;
  const has = (o: number) => { const x = getDay(hd, o); return x.cups > 0 || x.sleep > 0 || x.steps > 0; };
  const dayPct = (o: number) => goalPctOf(getDay(hd, o), goal, cg);
  const avgPct = (from: number, to: number) => { let n = 0, t = 0; for (let o = from; o <= to; o++) if (has(o)) { n++; t += dayPct(o); } return n ? Math.round(t / n) : 0; };
  const spends = (fin && fin.spends) || [];
  const spendOn = (o: number) => { const k = keyOfDate(dateOf(o)); return spends.filter((x) => x.date === k).reduce((a, b) => a + (b.amt || 0), 0); };
  const spendSum = (from: number, to: number) => { let t = 0; for (let o = from; o <= to; o++) t += spendOn(o); return t; };
  const ht = getDay(hd, 0);
  const anyData = scoreParts(core0, week).length > 0;
  const parts = scoreParts(core0, week);
  const score = lifeScore(parts);
  const rm = (n: number) => cs() + (Math.round(n * 100) / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let metrics: { l: string; v: string; p: number; c: string; ic: React.ReactNode }[];
  if (week) {
    let st = 0, sl = 0, sn = 0, wd = 0;
    for (let o = -6; o <= 0; o++) { const x = getDay(hd, o); st += x.steps; if (x.sleep > 0) { sl += x.sleep; sn++; } if (x.cups >= cg) wd++; }
    const sp = spendSum(-6, 0), pv = spendSum(-13, -7);
    const stA = Math.round(st / 7), slA = sn ? Math.round((sl / sn) * 10) / 10 : 0;
    metrics = [
      { l: 'Steps', v: stA.toLocaleString() + ' a day', p: (stA / goal) * 100, c: '#34d399', ic: <HeadIcon k="steps" size={26} /> },
      { l: 'Water goal', v: wd + ' of 7 days', p: (wd / 7) * 100, c: '#5ee7df', ic: <HeadIcon k="water" size={26} /> },
      { l: 'Sleep', v: slA + ' h avg', p: (slA / 7) * 100, c: '#b794ff', ic: <HeadIcon k="sleep" size={26} /> },
      { l: 'Spending', v: rm(sp), p: pv > 0 ? (sp / pv) * 50 : sp > 0 ? 50 : 0, c: '#ffc46b', ic: <Wallet s={26} /> },
    ];
  } else {
    const sp = spendOn(0); let m = 0, md = 0; for (let o = -29; o <= 0; o++) { const v = spendOn(o); if (v > 0) { m += v; md++; } }
    const av = md ? m / md : 0;
    metrics = [
      { l: 'Steps', v: ht.steps.toLocaleString() + ' of ' + goal.toLocaleString(), p: (ht.steps / goal) * 100, c: '#34d399', ic: <HeadIcon k="steps" size={26} /> },
      { l: 'Water', v: ht.cups + ' of ' + cg + ' glasses', p: (ht.cups / cg) * 100, c: '#5ee7df', ic: <HeadIcon k="water" size={26} /> },
      { l: 'Sleep', v: (ht.sleep || 0) + ' h', p: (ht.sleep / 7) * 100, c: '#b794ff', ic: <HeadIcon k="sleep" size={26} /> },
      { l: 'Spending', v: rm(sp), p: av > 0 ? (sp / av) * 50 : sp > 0 ? 50 : 0, c: '#ffc46b', ic: <Wallet s={26} /> },
    ];
  }
  const src = week ? [-6, -5, -4, -3, -2, -1, 0].map((o) => (has(o) ? dayPct(o) : 0)) : [-27, -20, -13, -6].map((o) => avgPct(o, o + 6));
  const lab = week ? [-6, -5, -4, -3, -2, -1, 0].map((o) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dateOf(o).getDay()]) : ['W1', 'W2', 'W3', 'W4'];
  const habitPct = metrics.slice(0, 3).map((m) => Math.min(100, m.p));
  const low = habitPct.indexOf(Math.min(...habitPct));
  const title = !anyData ? 'Nothing logged yet' : score >= 80 ? (week ? 'A great week' : 'You are doing great today') : score >= 50 ? (week ? 'A steady week' : 'You are doing well today') : (week ? 'A quiet week' : 'A slow start today');
  const hint = !anyData ? 'Log steps, water or sleep in Habit & Health and your score will appear here.' : (['Steps are the part to lift next.', 'A little more water would lift your score.', 'More sleep would lift your score.'])[low];

  const core = core0;
  const allTips = tips(core, week);
  const cats = ['All'].concat(['Health', 'Money', 'Faith', 'Tasks', 'Vehicle'].filter((k) => allTips.some((x) => tipCat(x.id) === k)));
  const curCat = cats.indexOf(cat) >= 0 ? cat : 'All';
  const pool = curCat === 'All' ? allTips : allTips.filter((x) => tipCat(x.id) === curCat);
  const shown = showAll || curCat !== 'All' ? pool : pool.slice(0, 3);
  const wk = weekly(core);
  const pats = patterns(core);

  const R = 54, C = 2 * Math.PI * R;
  const t = useReplay(String(score) + String(week), 0, 1200, false);
  const [num, setNum] = useState(0);
  useEffect(() => { const id = t.addListener(({ value }) => setNum(Math.round(score * value))); return () => t.removeListener(id); }, [score, week]);
  const off = t.interpolate({ inputRange: [0, 1], outputRange: [C, C - (C * score) / 100] });
  const mx = Math.max(...src, 1);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <LinearGradient colors={['#0a0f2c', '#1a1048', '#0c2b4d']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <InsightsBg />
      <PageIn i={2}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView onScroll={navScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 130 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Insights</Text>
            <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)' }}>
              {[false, true].map((w) => (
                <Pressable key={String(w)} onPress={() => setWeek(w)}>
                  {week === w ? (
                    <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999 }}><Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{w ? 'Week' : 'Today'}</Text></LinearGradient>
                  ) : (<View style={{ paddingVertical: 6, paddingHorizontal: 14 }}><Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{w ? 'Week' : 'Today'}</Text></View>)}
                </Pressable>
              ))}
            </View>
          </View>

          <Rise i={0}>
          <Glass radius={28} style={{ marginTop: 14, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <LinearGradient colors={['rgba(124,156,255,.3)', 'rgba(183,148,255,.18)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
            <View style={{ width: 124, height: 124 }}>
              <View style={{ transform: [{ rotate: '-90deg' }] }}>
                <Svg width={124} height={124} viewBox="0 0 124 124">
                  <Defs><SvgGrad id="rg" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#8fe9e2" /><Stop offset="1" stopColor="#7c9cff" /></SvgGrad></Defs>
                  <Circle cx={62} cy={62} r={R} stroke="rgba(255,255,255,.14)" strokeWidth={10} fill="none" />
                  <ACirc cx={62} cy={62} r={R} stroke="url(#rg)" strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray={`${C}`} strokeDashoffset={off} />
                </Svg>
              </View>
              <View style={{ position: 'absolute', left: 0, top: 0, width: 124, height: 124, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800', lineHeight: 36 }}>{num}</Text>
                <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11, marginTop: 2 }}>out of 100</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>LIFE SCORE</Text>
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 4, lineHeight: 21 }}>{title}</Text>
              <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12, lineHeight: 17, marginTop: 6 }}>{parts.length > 1 ? 'Built from ' + parts.length + ' parts of your life, shown below.' : hint}</Text>
            </View>
          </Glass>
          </Rise>

          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 16, marginBottom: 8, marginHorizontal: 4 }}>Smart suggestions</Text>
          {cats.length > 2 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {cats.map((k) => (
                <Pressable key={k} onPress={() => setCat(k)} style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: curCat === k ? 'transparent' : 'rgba(255,255,255,.2)', backgroundColor: curCat === k ? '#7c9cff' : 'rgba(255,255,255,.08)' }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{k}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <View style={{ gap: 10 }}>
            {shown.length === 0 && (
              <Glass radius={22} style={{ paddingVertical: 16, paddingHorizontal: 16 }}>
                <Text style={{ color: '#fff', fontSize: 13.5, fontWeight: '700' }}>All caught up</Text>
                <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, marginTop: 2 }}>No suggestions right now. Hidden tips return after 7 days.</Text>
              </Glass>
            )}
            {shown.map((tp, i) => (
              <Rise key={tp.id} i={6 + i}>
                <Glass radius={22} style={{ paddingVertical: 12, paddingHorizontal: 14 }}>
                  <Pressable onPress={() => router.push(tp.go as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <HeadIcon k={tp.k} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontSize: 13.5, fontWeight: '700' }}>{tp.title}</Text>
                      <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, marginTop: 2, lineHeight: 15 }}>{tp.sub}</Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 20 }}>›</Text>
                  </Pressable>
                  <View style={{ flexDirection: 'row', gap: 18, marginTop: 9, marginLeft: 52 }}>
                    <Pressable hitSlop={8} onPress={() => setWhy(why === tp.id ? '' : tp.id)}><Text style={{ color: '#8fe9e2', fontSize: 11.5, fontWeight: '700' }}>{why === tp.id ? 'Hide reason' : 'Why this?'}</Text></Pressable>
                    <Pressable hitSlop={8} onPress={() => hideTip(core, tp.id)}><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, fontWeight: '600' }}>Hide for 7 days</Text></Pressable>
                  </View>
                  {why === tp.id && <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 11.5, lineHeight: 16, marginTop: 7, marginLeft: 52 }}>{tp.why}</Text>}
                </Glass>
              </Rise>
            ))}
            {curCat === 'All' && allTips.length > 3 && (
              <Pressable onPress={() => setShowAll(!showAll)} style={{ alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 14 }}>
                <Text style={{ color: '#8fe9e2', fontSize: 12.5, fontWeight: '700' }}>{showAll ? 'Show fewer' : 'Show all ' + allTips.length}</Text>
              </Pressable>
            )}
          </View>


          {parts.length > 1 && (
            <Rise i={4}>
              <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>What makes up your score</Text>
                {parts.map((pt, i) => (
                  <View key={pt.k} style={{ marginTop: 11 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{pt.label}</Text>
                      <Text style={{ color: pt.c, fontSize: 12.5, fontWeight: '800' }}>{pt.pct}</Text>
                    </View>
                    <View style={{ marginTop: 5 }}><FillBar p={pt.pct} color={pt.c} delay={i * 80} dep={String(week) + pt.pct} /></View>
                    <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 11, marginTop: 4 }}>{pt.detail}</Text>
                  </View>
                ))}
              </Glass>
            </Rise>
          )}

          {week && (
            <Rise i={4}>
              <Glass radius={26} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
                <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>WEEKLY REVIEW</Text>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 4 }}>{wk.head}</Text>
                {wk.rows.map((r) => (
                  <View key={r.l} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '600' }}>{r.l}</Text>
                      <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 11, marginTop: 1 }}>Last week {r.prev}</Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{r.now}</Text>
                    <View style={{ minWidth: 54, alignItems: 'flex-end' }}>
                      <Text style={{ color: r.d === null || r.d === 0 ? 'rgba(255,255,255,.6)' : r.good ? '#7df0c6' : '#ff8fab', fontSize: 12, fontWeight: '800' }}>{r.d === null ? 'new' : (r.d > 0 ? '+' : '') + r.d + '%'}</Text>
                    </View>
                  </View>
                ))}
                {(wk.best || wk.worst) && (
                  <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, marginTop: 12, lineHeight: 16 }}>
                    {wk.best ? 'Best day: ' + wk.best.day + ' (' + wk.best.pct + ').' : ''}{wk.worst ? ' Quietest: ' + wk.worst.day + ' (' + wk.worst.pct + ').' : ''}
                  </Text>
                )}
              </Glass>
            </Rise>
          )}

          {pats.length > 0 && (
            <Rise i={5}>
              <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Patterns we noticed</Text>
                {pats.map((t2, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 9, marginTop: 9 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#b794ff', marginTop: 6 }} />
                    <Text style={{ flex: 1, color: 'rgba(255,255,255,.88)', fontSize: 12.5, lineHeight: 18 }}>{t2}</Text>
                  </View>
                ))}
              </Glass>
            </Rise>
          )}

          <Rise i={5}>
          <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{week ? 'Score this week' : 'Score by week'}</Text>
              <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 11.5 }}>{week ? 'Last 7 days' : 'Last 4 weeks'}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: week ? 8 : 16, height: 96, marginTop: 12 }}>
              {src.map((v, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 5 }}>
                  <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 10, fontWeight: '700' }}>{v > 0 ? v : ''}</Text>
                  <GrowBar h={Math.max(5, Math.round((v / Math.max(mx, 100)) * 58))} delay={i * 70} dep={String(week) + src.join()} style={{ width: '100%' }}>
                    <LinearGradient colors={i === src.length - 1 ? ['#8fe9e2', '#7c9cff'] : ['rgba(255,255,255,.4)', 'rgba(255,255,255,.14)']} style={{ flex: 1, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }} />
                  </GrowBar>
                  <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 10 }}>{lab[i]}</Text>
                </View>
              ))}
            </View>
          </Glass>
          </Rise>

          <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, lineHeight: 17, marginTop: 14, marginHorizontal: 4 }}>Calculated from your own habits, tasks, spending, records and zikir on this device.</Text>
        </ScrollView>
      </SafeAreaView>
      </PageIn>
    </View>
  );
}
