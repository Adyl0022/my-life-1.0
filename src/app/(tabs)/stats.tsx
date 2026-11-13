import React, { useState } from 'react';
import { FastMonths } from '../../components/FastMonths';
import { StatsBg } from '../../components/PageBg';
import { PageIn } from '../../components/PageIn';
import { navScroll } from '../../lib/navbar';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '../../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Glass } from '../../components/Glass';
import { Blob } from '../../components/Bg';
import { useUsage } from '../../lib/usage';
import { Rise, FillBar, GrowBar } from '../../components/Anim';
import { HeadIcon } from '../../components/HabitIcons';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useStored } from '../../lib/store';
import { MODS } from '../../lib/modules';
import { HEMPTY, getDay, cupsGoal, dateOf, keyOfDate, MOODS } from '../../lib/habit';
import { useCore, weekly, records, hasData as hasHab, dayPct, incomeOf } from '../../lib/insights';
import { debtSummary, remainingAt, amountDue, yearsMonths, payoffLabel } from '../../lib/debts';
import { TOP } from '../../lib/layout';
import { monthRows } from '../../lib/financeStats';
import { goalSaved } from '../../lib/savings';
import { healthMonths } from '../../components/BodyCards';
import { sunatYear, qadhaOwed, ramadanState } from '../../lib/fasting';
import { cs, useRegion } from '../../lib/region';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MI = ({ k, s = 30 }: { k: string; s?: number }) => {
  const c = (MODS.find((m) => m.k === k) || MODS[0]).c;
  const p: any = { stroke: '#fff', strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <View style={{ width: s, height: s, borderRadius: s * 0.32, backgroundColor: c, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={s * 0.62} height={s * 0.62} viewBox="0 0 24 24">
        {k === 'planner' && <><Rect x={4} y={5} width={16} height={15} rx={3} {...p} /><Path d="M4 10h16M9 3v4M15 3v4M9 15l2 2 4-4" {...p} /></>}
        {k === 'islamic' && <Path d="M3 21v-7h4v7M17 21v-7h4v7M7 21v-6a5 5 0 0 1 10 0v6M12 10V7M2 21h20" {...p} />}
        {k === 'finance' && <Path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18v3M3 7.5V17a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5.5A2.5 2.5 0 0 1 3 7.5zM16 13.5h2" {...p} />}
        {k === 'record' && <><Circle cx={12} cy={13} r={8} {...p} /><Path d="M12 13l4-4M12 5v2M4.5 9l1.7 1" {...p} /></>}
        {k === 'habit' && <Path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" {...p} />}
      </Svg>
    </View>
  );
};
const Lbl = ({ t }: { t: string }) => <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 11.5, fontWeight: '700', letterSpacing: 1.2 }}>{t.toUpperCase()}</Text>;

export default function Stats() {
  useRegion();
  const [tab, setTab] = useState<'use' | 'health' | 'money'>('use');
  const u = useUsage(16);
  const [metric, setMetric] = useState<'time' | 'opens'>('time');
  const days = u.days;
  const arr = days.map((d) => (metric === 'time' ? Math.round(d.min) : d.opens));
  const max = Math.max(...arr, 1);
  const sum = arr.reduce((a, b) => a + b, 0);
  const todayMin = Math.floor(u.today.sec / 60);
  const yMin = Math.round(days[28].min);
  const diff = todayMin - yMin;
  const avgOpens = days.reduce((a, d) => a + d.opens, 0) / 30;
  const d0 = new Date(); d0.setDate(d0.getDate() - 29);
  const unit = metric === 'time' ? ' min' : '';
  const total = metric === 'time' ? Math.floor(sum / 60) + ' h ' + (sum % 60) + ' m' : String(sum);
  const hasData = sum > 0;
  const [hd] = useStored('ml_habit', HEMPTY);
  const [fin] = useStored<{ spends: { amt: number; date: string }[] }>('ml_finance', { spends: [] } as any);
  const cg = cupsGoal(hd);
  const core = useCore();
  const ds = debtSummary(core.debts); const incNow = incomeOf(core);
  const PAL = ['#ff8fab', '#ffc46b', '#7c9cff', '#b794ff', '#8fe9e2', '#5ee7b5', '#ff8a5c'];
  const segs = ds.act.map((x, i) => ({ n: x.name, v: amountDue(x, ds.ym), c: PAL[i % PAL.length] })).concat(ds.food > 0 ? [{ n: 'Food', v: ds.food, c: '#e8d5ff' }] : []);
  const used = segs.reduce((a, b) => a + b.v, 0); const base = Math.max(incNow, used, 1);
  const freeAmt = Math.max(0, incNow - used);
  const dm6 = [5, 4, 3, 2, 1, 0].map((b) => { const d0 = new Date(); d0.setDate(1); d0.setMonth(d0.getMonth() - b); const k = d0.getFullYear() + '-' + String(d0.getMonth() + 1).padStart(2, '0'); const has = ds.list.filter((x) => !x.fixed && x.since <= k); return { k, l: MON[d0.getMonth()], v: has.reduce((a, x) => a + remainingAt(x, k), 0), has: has.length > 0 }; });
  const dmax = Math.max(...dm6.map((x) => x.v), 1);
  const wk = weekly(core);
  const rc = records(core);
  const hh = u.hours;
  const bk = [['Night', [0, 1, 2, 3, 4, 5]], ['Morning', [6, 7, 8, 9, 10, 11]], ['Afternoon', [12, 13, 14, 15, 16, 17]], ['Evening', [18, 19, 20, 21, 22, 23]]] as [string, number[]][];
  const bt = bk.map(([n, l]) => ({ n, v: l.reduce((a, h) => a + (hh[h] || 0), 0) }));
  const bmax = Math.max(...bt.map((b) => b.v), 1);
  const btop = bt.slice().sort((a, b) => b.v - a.v)[0];
  const heat = Array.from({ length: 30 }, (_, i) => { const o = i - 29; return hasHab(core, o) ? dayPct(core, o) : -1; });
  const fd = (k: string) => { if (!k) return ''; const [y, m, d] = k.split('-'); return Number(d) + ' ' + MON[Number(m) - 1]; };
  const last7 = [-6, -5, -4, -3, -2, -1, 0];
  const wd = last7.map((o) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dateOf(o).getDay()]);
  const spendOn = (o: number) => ((fin && fin.spends) || []).filter((x: any) => x.cat !== 'Savings' && x.date === keyOfDate(dateOf(o))).reduce((a, b) => a + (b.amt || 0), 0);
  const trends = [
    { t: 'Steps', k: 'steps', c: '#34d399', v: last7.map((o) => getDay(hd, o).steps), fmt: (n: number) => Math.round(n).toLocaleString(), unit: 'a day' },
    { t: 'Water', k: 'water', c: '#5ee7df', v: last7.map((o) => getDay(hd, o).cups), fmt: (n: number) => String(Math.round(n * 10) / 10), unit: 'of ' + cg + ' glasses' },
    { t: 'Sleep', k: 'sleep', c: '#b794ff', v: last7.map((o) => getDay(hd, o).sleep), fmt: (n: number) => String(Math.round(n * 10) / 10), unit: 'hours a night' },
    { t: 'Mood', k: 'mood', c: '#ff8fab', v: last7.map((o) => { const m = getDay(hd, o).mood; return m >= 0 ? m + 1 : 0; }), fmt: (n: number) => { const lg = last7.map((o) => getDay(hd, o).mood).filter((m) => m >= 0); if (!lg.length) return 'None'; return MOODS[Math.max(0, Math.min(4, Math.round(lg.reduce((a, b) => a + b, 0) / lg.length)))][0]; }, unit: 'on average' },
    { t: 'Spending', k: '', c: '#ffc46b', v: last7.map((o) => spendOn(o)), fmt: (n: number) => cs() + (Math.round(n * 100) / 100).toLocaleString('en-MY', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }), unit: 'in 7 days', sum: true },
  ];
  const tot: Record<string, number> = u.mods;
  const ranked = MODS.map((m) => ({ ...m, n: tot[m.k] || 0 })).filter((m) => m.n > 0).sort((a, b) => b.n - a.n);
  const topN = ranked.length ? ranked[0].n : 1;
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <LinearGradient colors={['#0a0f2c', '#1a1048', '#0c2b4d']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <StatsBg />
      <PageIn i={1}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView onScroll={navScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 130 }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Stats</Text>
          <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)', marginTop: 14 }}>
            {([['use', 'App use'], ['health', 'Health'], ['money', 'Money']] as ['use' | 'health' | 'money', string][]).map(([k, n]) => (
              <Pressable key={k} onPress={() => setTab(k)} style={{ flex: 1 }}>
                {tab === k ? (
                  <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 8, borderRadius: 999, alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{n}</Text></LinearGradient>
                ) : (<View style={{ paddingVertical: 8, alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 13, fontWeight: '700' }}>{n}</Text></View>)}
              </Pressable>
            ))}
          </View>

          {tab === 'use' && (<>
          <Rise i={0}>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
            <Glass radius={22} style={{ flex: 1, padding: 14 }}>
              <Lbl t="Time today" />
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 4 }}>{todayMin} <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,.7)' }}>min</Text></Text>
              <Text style={{ fontSize: 11.5, marginTop: 2, color: diff >= 0 ? '#7df0c6' : '#ffb3a0' }}>{diff >= 0 ? '+' : '-'}{Math.abs(diff)} min vs yesterday</Text>
            </Glass>
            <Glass radius={22} style={{ flex: 1, padding: 14 }}>
              <Lbl t="Opens today" />
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 4 }}>{u.today.opens} <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,.7)' }}>{u.today.opens === 1 ? 'time' : 'times'}</Text></Text>
              <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 2 }}>Avg {avgOpens.toFixed(1)} a day</Text>
            </Glass>
          </View>
          </Rise>

          <Rise i={1}>
          <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Last 30 days</Text>
              <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)' }}>
                {(['time', 'opens'] as const).map((k) => (
                  <Pressable key={k} onPress={() => setMetric(k)}>
                    {metric === k ? (
                      <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{k === 'time' ? 'Time' : 'Opens'}</Text></LinearGradient>
                    ) : (<View style={{ paddingVertical: 6, paddingHorizontal: 12 }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{k === 'time' ? 'Time' : 'Opens'}</Text></View>)}
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={{ height: 120, marginTop: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 120 }}>
              {arr.map((v, i) => (
                <GrowBar key={i} h={Math.max(6, Math.round((v / max) * 116))} delay={i * 14} dep={metric} style={{ flex: 1 }}>
                  <LinearGradient colors={i === arr.length - 1 ? ['#8fe9e2', '#7c9cff'] : ['rgba(255,255,255,.3)', 'rgba(255,255,255,.3)']} style={{ flex: 1, borderTopLeftRadius: 3, borderTopRightRadius: 3, borderBottomLeftRadius: 1, borderBottomRightRadius: 1 }} />
                </GrowBar>
              ))}
            </View>
            {!hasData && (
              <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 14, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <HeadIcon k="insight" size={34} />
                <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 12.5, fontWeight: '700' }}>No activity yet</Text>
                <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5 }}>Your days will fill in as you use the app.</Text>
              </View>
            )}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10.5 }}>{d0.getDate()} {MON[d0.getMonth()]}</Text>
              <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10.5 }}>Today</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {[[metric === 'time' ? Math.round(sum / 30) + unit : (sum / 30).toFixed(1), 'Daily average'], [max + unit, 'Busiest day'], [total, '30-day total']].map(([a, b]) => (
                <View key={b} style={{ flex: 1, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,.08)' }}>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{hasData ? a : '-'}</Text>
                  <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11 }}>{b}</Text>
                </View>
              ))}
            </View>
          </Glass>
          </Rise>

          <Rise i={3}>
          <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Most used</Text>
            {ranked.length === 0 ? (
              <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, lineHeight: 19, marginTop: 8 }}>Your most used modules will show here once the modules are open and in use.</Text>
            ) : (
              <View style={{ gap: 12, marginTop: 12 }}>
                {ranked.map((m, i) => (
                  <View key={m.k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <MI k={m.k} s={34} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{m.name}</Text>
                        <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>{m.n} {m.n === 1 ? 'visit' : 'visits'}</Text>
                      </View>
                      <FillBar p={(m.n / topN) * 100} color={m.c} delay={i * 90} dep={m.n} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Glass>
          </Rise>

          <Rise i={4}>
          <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>When you use the app</Text>
            {bt.every((b) => b.v === 0) ? (
              <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, lineHeight: 19, marginTop: 8 }}>This fills in as you open modules during the day.</Text>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 84, marginTop: 12 }}>
                  {bt.map((b, i) => (
                    <View key={b.n} style={{ flex: 1, height: 84, justifyContent: 'flex-end' }}>
                      <GrowBar h={Math.max(5, Math.round((b.v / bmax) * 84))} delay={i * 70} dep={bt.map((x) => x.v).join()} style={{ width: '100%' }}>
                        <LinearGradient colors={b.n === btop.n ? ['#8fe9e2', '#7c9cff'] : ['rgba(255,255,255,.4)', 'rgba(255,255,255,.14)']} style={{ flex: 1, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }} />
                      </GrowBar>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                  {bt.map((b) => <Text key={b.n} style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,.65)', fontSize: 10.5 }}>{b.n}</Text>)}
                </View>
                <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12, marginTop: 10 }}>You open modules most in the {btop.n.toLowerCase()}.</Text>
              </>
            )}
          </Glass>
          </Rise>
          </>)}
          {tab === 'health' && (<>
          <Rise i={4}>
          <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Habit calendar</Text>
              <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11 }}>Last 30 days</Text>
            </View>
            <View style={{ gap: 6, marginTop: 12 }}>
              {[0, 1, 2].map((r) => (
                <View key={r} style={{ flexDirection: 'row', gap: 6 }}>
                  {heat.slice(r * 10, r * 10 + 10).map((p, j) => { const i = r * 10 + j; return (
                    <View key={i} style={{ flex: 1, aspectRatio: 1, borderRadius: 6, backgroundColor: p < 0 ? 'rgba(255,255,255,.1)' : p >= 80 ? '#34d399' : p >= 50 ? 'rgba(52,211,153,.6)' : p >= 25 ? 'rgba(52,211,153,.35)' : 'rgba(52,211,153,.18)', borderWidth: i === 29 ? 1.5 : 0, borderColor: '#fff' }} />
                  ); })}
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10.5 }}>Less</Text>
              {['rgba(255,255,255,.08)', 'rgba(52,211,153,.18)', 'rgba(52,211,153,.35)', 'rgba(52,211,153,.6)', '#34d399'].map((c) => <View key={c} style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: c }} />)}
              <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10.5 }}>More</Text>
            </View>
          </Glass>
          </Rise>

          <Rise i={4}>
          <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>This week and last week</Text>
            {wk.rows.map((r) => (
              <View key={r.l} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 11 }}>
                <Text style={{ flex: 1, color: '#fff', fontSize: 12.5, fontWeight: '600' }}>{r.l}</Text>
                <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, marginRight: 10 }}>{r.prev}</Text>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{r.now}</Text>
                <Text style={{ minWidth: 52, textAlign: 'right', color: r.d === null || r.d === 0 ? 'rgba(255,255,255,.6)' : r.good ? '#7df0c6' : '#ff8fab', fontSize: 12, fontWeight: '800' }}>{r.d === null ? 'new' : (r.d > 0 ? '+' : '') + r.d + '%'}</Text>
              </View>
            ))}
          </Glass>
          </Rise>

          <Rise i={4}>
          <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            {(() => {
              const pz = core.puasa, now = new Date(), yr = sunatYear(pz, now), ow = qadhaOwed(pz, now), rs = ramadanState(pz, now);
              const mx = Math.max(...yr.months, 1); const L = ['J','F','M','A','M','J','J','A','S','O','N','D'];
              return (<>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Fasting</Text><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11 }}>Last 12 months</Text></View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  {[['Sunnah fasts', String(yr.total), '#7df0c6'], ['Make-up done', String(yr.qadha), '#ffd593'], ['Make-up owed', String(ow), ow > 0 ? '#ff9db5' : '#7df0c6']].map(([a, b, c]) => (
                    <View key={a} style={{ flex: 1, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,.08)' }}><Text style={{ color: 'rgba(255,255,255,.68)', fontSize: 10.5 }}>{a}</Text><Text style={{ color: c, fontSize: 17, fontWeight: '800', marginTop: 2 }}>{b}</Text></View>
                  ))}
                </View>
                {rs.phase === 'during' ? <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, marginTop: 10 }}>Ramadan: {rs.fasted} of {rs.r.len} days fasted</Text> : rs.phase === 'before' ? <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, marginTop: 10 }}>Next Ramadan in {rs.daysTo} days</Text> : null}
                <FastMonths months={yr.months} now={now} />
              </>);
            })()}
          </Glass>
          </Rise>

          <Rise i={4}>
          <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            {(() => {
              const hm = healthMonths((fin && (fin as any).spends) || []); const mx = Math.max(...hm.map((m) => m.v), 1); const tot = hm.reduce((a, m) => a + m.v, 0);
              return (<>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Health spending</Text><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11 }}>Last 6 months</Text></View>
                <Text style={{ color: '#ff9db5', fontSize: 20, fontWeight: '800', marginTop: 8 }}>{cs()}{(Math.round(hm[hm.length - 1].v * 100) / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 12, fontWeight: '500' }}>  this month</Text></Text>
                {tot > 0 ? (<>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 60, marginTop: 12 }}>
                    {hm.map((m, i) => <View key={m.ym} style={{ flex: 1, height: 60, justifyContent: 'flex-end' }}><View style={{ height: Math.max(4, Math.round((m.v / mx) * 56)), borderRadius: 5, backgroundColor: i === hm.length - 1 ? '#ff8fab' : 'rgba(255,255,255,.35)' }} /></View>)}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>{hm.map((m) => <Text key={m.ym} style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,.55)', fontSize: 9.5 }}>{m.label}</Text>)}</View>
                </>) : <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, marginTop: 8 }}>Add a clinic visit or medicine in Habit & Health, or log it in My Finance under Health.</Text>}
              </>);
            })()}
          </Glass>
          </Rise>

          <Rise i={4}>
          <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Personal records</Text>
            {rc.steps + rc.water + rc.streak === 0 ? (
              <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, lineHeight: 19, marginTop: 8 }}>Log steps, water and sleep to set your first records.</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                {[
                  ['Best step day', rc.steps.toLocaleString(), fd(rc.stepsDate), 'steps'],
                  ['Most water', rc.water + ' glasses', fd(rc.waterDate), 'water'],
                  ['Best score', rc.score + ' / 100', fd(rc.scoreDate), 'insight'],
                  ['Longest streak', rc.streak + (rc.streak === 1 ? ' day' : ' days'), 'Goal at 70 or more', 'streak'],
                ].map(([a, b, c, k]) => (
                  <View key={a} style={{ width: '47.5%', flexGrow: 1, borderRadius: 16, padding: 11, backgroundColor: 'rgba(255,255,255,.08)' }}>
                    <HeadIcon k={k} size={26} />
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 6 }}>{b}</Text>
                    <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 11, marginTop: 1 }}>{a}</Text>
                    {!!c && <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 10.5, marginTop: 1 }}>{c}</Text>}
                  </View>
                ))}
              </View>
            )}
          </Glass>
          </Rise>

          <Rise i={4}>
          <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Your last 7 days</Text>
            <View style={{ gap: 16, marginTop: 14 }}>
              {trends.filter((x) => x.k).map((tr, ti) => {
                const mx = Math.max(...tr.v, 1); const avg = tr.v.reduce((a, b) => a + b, 0) / 7;
                return (
                  <View key={tr.t}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      {tr.k ? <HeadIcon k={tr.k} size={24} /> : <MI k="finance" s={24} />}
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 }}>{tr.t}</Text>
                      <Text style={{ color: tr.c, fontSize: 13, fontWeight: '800' }}>{tr.fmt((tr as any).sum ? avg * 7 : avg)}</Text>
                      <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11 }}>{tr.unit}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 44 }}>
                      {tr.v.map((v, i) => (
                        <View key={i} style={{ flex: 1, height: 44, justifyContent: 'flex-end' }}>
                          <GrowBar h={Math.max(4, Math.round((v / mx) * 44))} delay={ti * 60 + i * 40} dep={tr.v.join()} style={{ width: '100%' }}>
                            <View style={{ flex: 1, borderRadius: 4, backgroundColor: tr.c, opacity: i === 6 ? 1 : 0.5 }} />
                          </GrowBar>
                        </View>
                      ))}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                      {wd.map((d, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,.55)', fontSize: 9.5 }}>{d}</Text>)}
                    </View>
                  </View>
                );
              })}
            </View>
          </Glass>
          </Rise>
          </>)}
          {tab === 'money' && (<>
          <Rise i={4}>
          <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            {(() => {
              const rows = monthRows(core, 6); const cur = rows[rows.length - 1]; const any = rows.some((r) => r.has);
              const fm = (n: number) => cs() + Math.round(Math.abs(n)).toLocaleString('en-MY');
              const mxL = Math.max(...rows.map((r) => Math.abs(r.left)), 1); const mxS = Math.max(...rows.map((r) => r.savings), 1);
              const totS = rows.reduce((a, r) => a + r.savings, 0); const rate = cur.income > 0 ? Math.round((cur.savings / cur.income) * 100) : 0;
              const best = rows.filter((r) => r.income > 0).sort((a, b) => b.left - a.left)[0];
              const goalsSaved = ((core.sav && core.sav.goals) || []).reduce((a, g) => a + goalSaved(g, ((fin && (fin as any).spends) || []) as any, core.debts), 0);
              return (<>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Money left each month</Text><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11 }}>Last 6 months</Text></View>
                {any ? (<>
                  <Text style={{ color: cur.left < 0 ? '#ff9aa9' : '#7df0c6', fontSize: 20, fontWeight: '800', marginTop: 8 }}>{cur.left < 0 ? '-' : ''}{fm(cur.left)}<Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 12, fontWeight: '500' }}>{'  ' + (cur.left < 0 ? 'over budget' : 'left') + ' this month'}</Text></Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 60, marginTop: 12 }}>
                    {rows.map((r, i) => <View key={r.ym} style={{ flex: 1, height: 60, justifyContent: 'flex-end' }}><View style={{ height: r.income > 0 ? Math.max(4, Math.round((Math.abs(r.left) / mxL) * 56)) : 4, borderRadius: 5, backgroundColor: r.income <= 0 ? 'rgba(255,255,255,.18)' : r.left < 0 ? '#ff7a8a' : i === rows.length - 1 ? '#5ee7b5' : 'rgba(255,255,255,.35)' }} /></View>)}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>{rows.map((r) => <Text key={r.ym} style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,.55)', fontSize: 9.5 }}>{r.label}</Text>)}</View>
                  <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, marginTop: 8 }}>{best && best.ym !== cur.ym ? 'Your best month was ' + best.label + ' with ' + fm(best.left) + ' left. ' : ''}Red bars are months you went over budget. Months without income are grey.</Text>
                </>) : <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, marginTop: 8 }}>Add your income and spending in My Finance to see how much you keep each month.</Text>}
                {any && cur.income > 0 ? (<View style={{ marginTop: 18, paddingTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.1)' }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 14 }}>Where this month's income goes</Text>
                  <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 6, backgroundColor: 'rgba(255,255,255,.12)' }}>
                    {[[cur.commit, '#b794ff'], [cur.spent, '#ffc46b'], [cur.savings, '#7c9cff'], [Math.max(0, cur.left), '#5ee7b5']].map(([v, col], i) => <View key={i} style={{ flex: Math.max(0, v as number) / Math.max(cur.income, cur.commit + cur.spent + cur.savings), backgroundColor: col as string }} />)}
                  </View>
                  {[['Commitments and debts', cur.commit, '#b794ff'], ['Spending', cur.spent, '#ffc46b'], ['Savings goals', cur.savings, '#7c9cff'], ['Left', Math.max(0, cur.left), '#5ee7b5']].map(([l, v, col]) => (
                    <View key={l as string} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: col as string }} />
                      <Text style={{ flex: 1, color: 'rgba(255,255,255,.88)', fontSize: 13.5 }}>{l as string}</Text>
                      <Text style={{ width: 84, textAlign: 'right', color: '#fff', fontSize: 13.5, fontWeight: '700' }}>{fm(v as number)}</Text>
                      <Text style={{ width: 42, textAlign: 'right', color: 'rgba(255,255,255,.6)', fontSize: 12.5 }}>{Math.round(((v as number) / cur.income) * 100)}%</Text>
                    </View>
                  ))}
                </View>) : null}
              </>);
            })()}
          </Glass>
          </Rise>

          <Rise i={4}>
          <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            {(() => {
              const rows = monthRows(core, 6); const cur = rows[rows.length - 1]; const mxS = Math.max(...rows.map((r) => r.savings), 1);
              const rate = cur.income > 0 ? Math.round((cur.savings / cur.income) * 100) : 0;
              const goalsSaved = ((core.sav && core.sav.goals) || []).reduce((a, g) => a + goalSaved(g, ((fin && (fin as any).spends) || []) as any, core.debts), 0);
              const nGoals = ((core.sav && core.sav.goals) || []).length; const totS = rows.reduce((a, r) => a + r.savings, 0);
              return (<>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Savings</Text><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11 }}>Last 6 months</Text></View>
                <Text style={{ color: '#7df0c6', fontSize: 20, fontWeight: '800', marginTop: 8 }}>{cs()}{Math.round(cur.savings).toLocaleString('en-MY')}<Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 12, fontWeight: '500' }}>{'  saved this month' + (cur.income > 0 && cur.savings > 0 ? ' (' + rate + '% of income)' : '')}</Text></Text>
                {nGoals > 0 ? (<>
                  {totS > 0 ? (<>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 60, marginTop: 12 }}>
                      {rows.map((r, i) => <View key={r.ym} style={{ flex: 1, height: 60, justifyContent: 'flex-end' }}><View style={{ height: Math.max(4, Math.round((r.savings / mxS) * 56)), borderRadius: 5, backgroundColor: i === rows.length - 1 ? '#7c9cff' : 'rgba(255,255,255,.35)' }} /></View>)}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>{rows.map((r) => <Text key={r.ym} style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,.55)', fontSize: 9.5 }}>{r.label}</Text>)}</View>
                  </>) : <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, marginTop: 8 }}>Nothing saved in the last 6 months. Choose Savings in the Spending Tracker to start.</Text>}
                  <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, marginTop: 8 }}>{'All goals together: ' + cs() + Math.round(goalsSaved).toLocaleString('en-MY') + ' across ' + nGoals + (nGoals === 1 ? ' goal.' : ' goals.')}</Text>
                </>) : <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, marginTop: 8 }}>Create a goal in My Finance, Savings Goals, then put money into it from the Spending Tracker or a monthly commitment.</Text>}
              </>);
            })()}
          </Glass>
          </Rise>

          <Rise i={4}>
          <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Spending, last 7 days</Text>
            <View style={{ gap: 16, marginTop: 14 }}>
              {trends.filter((x) => !x.k).map((tr, ti) => {
                const mx = Math.max(...tr.v, 1); const avg = tr.v.reduce((a, b) => a + b, 0) / 7;
                return (
                  <View key={tr.t}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      {tr.k ? <HeadIcon k={tr.k} size={24} /> : <MI k="finance" s={24} />}
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 }}>{tr.t}</Text>
                      <Text style={{ color: tr.c, fontSize: 13, fontWeight: '800' }}>{tr.fmt((tr as any).sum ? avg * 7 : avg)}</Text>
                      <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11 }}>{tr.unit}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 44 }}>
                      {tr.v.map((v, i) => (
                        <View key={i} style={{ flex: 1, height: 44, justifyContent: 'flex-end' }}>
                          <GrowBar h={Math.max(4, Math.round((v / mx) * 44))} delay={ti * 60 + i * 40} dep={tr.v.join()} style={{ width: '100%' }}>
                            <View style={{ flex: 1, borderRadius: 4, backgroundColor: tr.c, opacity: i === 6 ? 1 : 0.5 }} />
                          </GrowBar>
                        </View>
                      ))}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                      {wd.map((d, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,.55)', fontSize: 9.5 }}>{d}</Text>)}
                    </View>
                    {(tr as any).sum ? <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, marginTop: 8 }}>{'About ' + tr.fmt(avg) + ' a day on average. The tall bar is the day you spent the most.'}</Text> : null}
                  </View>
                );
              })}
            </View>
          </Glass>
          </Rise>
          {ds.commit + ds.food > 0 ? (
            <Rise i={4}>
            <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Where your income goes</Text>
              <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 11.5, marginTop: 2 }}>{incNow > 0 ? 'This month, out of ' + cs() + Math.round(incNow).toLocaleString() : 'Add this month\'s income in My Finance to see the full split.'}</Text>
              <View style={{ flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', marginTop: 12, backgroundColor: 'rgba(255,255,255,.1)' }}>
                {segs.map((g) => <View key={g.n} style={{ width: (g.v / base) * 100 + '%', backgroundColor: g.c }} />)}
                {freeAmt > 0 ? <View style={{ width: (freeAmt / base) * 100 + '%', backgroundColor: '#34d399' }} /> : null}
              </View>
              <View style={{ marginTop: 10, gap: 6 }}>
                {segs.concat(incNow > 0 ? [{ n: freeAmt > 0 ? 'Free' : 'Short', v: freeAmt > 0 ? freeAmt : used - incNow, c: freeAmt > 0 ? '#34d399' : '#ff8fab' }] : []).map((g) => (
                  <View key={g.n} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: g.c }} />
                    <Text style={{ flex: 1, color: '#fff', fontSize: 12.5 }}>{g.n}</Text>
                    <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5 }}>{Math.round((g.v / base) * 100)}%</Text>
                    <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700', minWidth: 78, textAlign: 'right' }}>{cs()}{Math.round(g.v).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            </Glass>
            </Rise>
          ) : null}

          {ds.debts.length > 0 ? (
            <Rise i={4}>
            <Glass style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Debt remaining</Text>
                <Text style={{ color: '#ffd593', fontSize: 13, fontWeight: '800' }}>{cs()}{Math.round(ds.totalLeft).toLocaleString()}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 90, marginTop: 14 }}>
                {dm6.map((x, i) => (
                  <View key={x.k} style={{ flex: 1, height: 90, justifyContent: 'flex-end' }}>
                    <GrowBar h={x.has ? Math.max(6, Math.round((x.v / dmax) * 86)) : 4} delay={i * 60} dep={dm6.map((y) => y.v).join()} style={{ width: '100%' }}>
                      <LinearGradient colors={i === 5 ? ['#ffc46b', '#ff8fab'] : ['rgba(255,255,255,.4)', 'rgba(255,255,255,.14)']} style={{ flex: 1, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, opacity: x.has ? 1 : 0.3 }} />
                    </GrowBar>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>{dm6.map((x) => <Text key={x.k} style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,.65)', fontSize: 10.5 }}>{x.l}</Text>)}</View>
              <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12, marginTop: 10 }}>{'Debt-free by ' + payoffLabel(ds.worst, ds.debts.every((x) => (x.paid || {})[ds.ym] > 0)) + ', about ' + yearsMonths(ds.worst) + ' to go.'}</Text>
            </Glass>
            </Rise>
          ) : null}
          {ds.commit + ds.food <= 0 && ds.debts.length === 0 ? (
            <Rise i={1}>
            <Glass style={{ marginTop: 14, paddingVertical: 16, paddingHorizontal: 16 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>No money plan yet</Text>
              <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, lineHeight: 19, marginTop: 6 }}>Add your monthly commitments and debts in My Finance. Your income split and debt progress will show here.</Text>
            </Glass>
            </Rise>
          ) : null}

          </>)}
          <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 12, lineHeight: 18, marginTop: 12, marginHorizontal: 4 }}>Counted on this device and kept for 30 days.</Text>
        </ScrollView>
      </SafeAreaView>
      </PageIn>
    </View>
  );
}
