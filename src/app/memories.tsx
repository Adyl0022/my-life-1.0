import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, Animated, Easing } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Glass } from '../components/Glass';
import { Blob } from '../components/Bg';
import { W, GP } from '../components/Ui';
import { TOP } from '../lib/layout';
import { confirmDelete } from '../lib/dialog';
import { useMemories, nice, Mem } from '../lib/memories';
import { MON } from '../lib/habit';
import { Toggle } from '../components/Toggle';

const DIM = 'rgba(255,255,255,.65)'; const nf = (n: number) => n.toLocaleString('en-GB');
const RAISED = { backgroundColor: 'rgba(255,255,255,.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.36)' } as const;
const KIND: Record<Mem['kind'], [string, string]> = { start: ['🌅', '#ffb45e'], milestone: ['🎈', '#ffb3c6'], note: ['📝', '#ff9a8b'], task: ['✅', '#5ee7b5'], plan: ['🎯', '#8ea8ff'], job: ['🔧', '#7df0c6'], part: ['⚙️', '#5ee7df'], badge: ['🏅', '#ffd24a'] };

// Each section fades and rises in softly, one after another. Nothing loops, so the screen stays calm.
function Rise({ i, children }: { i: number; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 520, delay: Math.min(i, 6) * 90, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>{children}</Animated.View>;
}
const Head = ({ t, s }: { t: string; s?: string }) => (
  <View style={{ marginTop: 26, marginBottom: 10 }}>
    <Text style={{ color: W, fontSize: 18, fontWeight: '800', letterSpacing: -0.2 }}>{t}</Text>
    {s ? <Text style={{ color: DIM, fontSize: 12.5, marginTop: 2 }}>{s}</Text> : null}
  </View>
);
const Empty = ({ t }: { t: string }) => <View style={{ padding: 16, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.25)' }}><Text style={{ color: DIM, fontSize: 13, lineHeight: 19 }}>{t}</Text></View>;
const Bar = ({ p, c }: { p: number; c: string }) => <View style={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.14)', overflow: 'hidden', marginTop: 8 }}><View style={{ width: Math.max(0, Math.min(1, p)) * 100 + '%', height: 5, borderRadius: 3, backgroundColor: c }} /></View>;
const nextGoal = (n: number) => [5, 10, 25, 50, 100, 250, 500, 1000, 5000, 10000].find((g) => g > n) || n;
const Sw = ({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) => <Toggle on={on} onPress={() => set(!on)} label={label} colors="#5ee7b5" thumbOn="#0d3a2c" />;

export default function Memories() {
  const router = useRouter(); const M = useMemories();
  const [more, setMore] = useState(false);
  const [year, setYear] = useState<number | null>(null);
  const yr = year ?? (M.years.length ? M.years[M.years.length - 1] : new Date().getFullYear());
  const R = M.review(yr);
  const hide = (id: string, what: string) => confirmDelete(what, () => M.setMem({ ...M.mem, hide: [...M.mem.hide, id] }), { title: 'Hide this memory?', message: 'It will no longer show in Your Timeline or On This Day. The task, note or record itself is not deleted.', yes: 'Hide' });
  const ms = [30, 100, 365]; const nextMs = ms.find((x) => x > M.days);
  const shown = more ? M.items : M.items.slice(0, 12);
  const none = !M.items.length && !M.nums.notes && !M.nums.tasks && !M.nums.habits && !M.nums.records;
  const stat: [string, string, number, string, string][] = [
    ['Notes', '📝', M.nums.notes, '#ff9a8b', 'notes kept'], ['Tasks completed', '✅', M.nums.tasks, '#5ee7b5', 'tasks done'], ['Plans achieved', '🎯', M.nums.plans, '#8ea8ff', 'events done'],
    ['Habits tracked', '🌿', M.nums.habits, '#7df0a0', 'days logged'], ['Records saved', '🏍️', M.nums.records, '#ffd24a', 'entries in My Record'],
  ];
  let sec = 0; let lastMonth = '';
  return (
    <View style={{ flex: 1, backgroundColor: '#0d1030' }}>
      <LinearGradient colors={['#0d1030', '#1d1250', '#0f2b55']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(183,148,255,.45)" style={{ right: -110, top: -40 }} />
      <Blob size={340} color="rgba(255,180,94,.22)" style={{ left: -130, bottom: 40 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 70 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
            <Text style={{ flex: 1, color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Your Memories</Text>
          </View>
          <Text style={{ color: '#ffd9a8', fontSize: 13.5, fontStyle: 'italic', marginTop: 12, lineHeight: 20 }}>Every moment matters. Every journey tells a story</Text>

          {/* 1. Our Journey Together */}
          <Rise i={sec++}>
            <View style={{ marginTop: 18, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', borderTopColor: 'rgba(255,255,255,.4)' }}>
              <LinearGradient colors={['rgba(124,156,255,.42)', 'rgba(183,148,255,.3)', 'rgba(255,180,94,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18 }}>
                <Text style={{ color: DIM, fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2 }}>OUR JOURNEY TOGETHER</Text>
                {M.start ? (<>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
                    <Text style={{ color: W, fontSize: 46, fontWeight: '800', letterSpacing: -1 }}>{M.days}</Text>
                    <Text style={{ color: W, fontSize: 17, fontWeight: '700' }}>{M.days === 1 ? 'day together' : 'days together'}</Text>
                  </View>
                  <Text style={{ color: DIM, fontSize: 12.5, marginTop: 2 }}>{'You started on ' + nice(M.start)}</Text>
                  <View style={{ flexDirection: 'row', marginTop: 16 }}>
                    {ms.map((n, i) => { const ok = M.days >= n; return (
                      <View key={n} style={{ flex: 1, alignItems: 'flex-end' }}>
                        <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: ok ? '#5ee7b5' : 'rgba(255,255,255,.14)', borderWidth: ok ? 0 : 1, borderColor: 'rgba(255,255,255,.25)' }}>
                          <Text style={{ color: ok ? '#0d3a2c' : DIM, fontSize: 13, fontWeight: '800' }}>{ok ? '✓' : '·'}</Text>
                        </View>
                        <Text style={{ color: ok ? W : DIM, fontSize: 12, fontWeight: '700', marginTop: 5 }}>{n === 365 ? '1 year' : n + ' days'}</Text>
                      </View>); })}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {ms.map((n, i) => { const from = i === 0 ? 0 : ms[i - 1]; return <View key={n} style={{ flex: 1 }}><Bar p={Math.max(0, Math.min(1, (M.days - from) / (n - from)))} c="#ffd24a" /></View>; })}
                  </View>
                  <Text style={{ color: DIM, fontSize: 12, marginTop: 7 }}>{nextMs ? (nextMs - M.days) + (nextMs - M.days === 1 ? ' day' : ' days') + ' to your ' + (nextMs === 365 ? '1 year' : nextMs + '-day') + ' milestone' : 'You have reached every milestone so far.'}</Text>
                </>) : <Text style={{ color: W, fontSize: 14, marginTop: 8, lineHeight: 20 }}>Sign in to see how long you have been with My Life 1.0.</Text>}
              </LinearGradient>
            </View>
          </Rise>

          {none ? <View style={{ marginTop: 18 }}><Empty t="Your memory book is still empty. As you write notes, finish tasks, log your health or save records, your moments will appear here by themselves." /></View> : null}

          {/* 2. Your Life in Numbers */}
          <Rise i={sec++}>
            <Head t="Your Life in Numbers" s="Counted from what you saved in the app" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {stat.map(([t, ic, n, c, sub], i) => (
                <View key={t} style={[RAISED, { width: i === 4 ? '100%' : '48%', flexGrow: 1, borderRadius: 20, padding: 14 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: DIM, fontSize: 12, fontWeight: '700' }}>{t}</Text><Text style={{ fontSize: 16 }}>{ic}</Text>
                  </View>
                  <Text style={{ color: W, fontSize: 28, fontWeight: '800', marginTop: 4 }}>{nf(n)}</Text>
                  <Bar p={n / nextGoal(n)} c={c} />
                  <Text style={{ color: DIM, fontSize: 11, marginTop: 5 }}>{n > 0 ? nf(n) + ' of ' + nf(nextGoal(n)) + ' · next goal' : 'Nothing yet · ' + sub}</Text>
                </View>))}
            </View>
          </Rise>

          {/* 3. Your Timeline */}
          <Rise i={sec++}>
            <Head t="Your Timeline" s="Moments the app saw, newest first" />
            {M.items.length <= 1 && M.start ? <View style={{ marginBottom: 10 }}><Empty t="More moments will join your timeline as you write notes, finish tasks and look after your vehicle." />{M.undated > 0 ? <Text style={{ color: DIM, fontSize: 12, marginTop: 6 }}>Older tasks, notes and plans have no date, so they are in your numbers but not here.</Text> : null}</View> : null}
            {shown.map((x) => {
              const mo = x.date.slice(0, 7); const head = mo !== lastMonth; lastMonth = mo; const k = KIND[x.kind];
              return (
                <View key={x.id}>
                  {head ? <Text style={{ color: '#ffd9a8', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginTop: 10, marginBottom: 6 }}>{(MON[+mo.slice(5) - 1] + ' ' + mo.slice(0, 4)).toUpperCase()}</Text> : null}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ alignItems: 'center', width: 34 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: k[1] + '33', borderWidth: 1, borderColor: k[1] + '88' }}><Text style={{ fontSize: 15 }}>{k[0]}</Text></View>
                      <View style={{ flex: 1, width: 2, backgroundColor: 'rgba(255,255,255,.12)', marginVertical: 2 }} />
                    </View>
                    <View style={[RAISED, { flex: 1, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>{x.title}</Text>
                          {x.sub ? <Text style={{ color: DIM, fontSize: 12.5, marginTop: 2 }}>{x.sub}</Text> : null}
                          <Text style={{ color: 'rgba(255,255,255,.45)', fontSize: 11, marginTop: 4 }}>{nice(x.date)}</Text>
                        </View>
                        {x.kind !== 'start' ? <Pressable onPress={() => hide(x.id, 'this memory')} accessibilityLabel="Hide this memory" hitSlop={8} style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.1)' }}><Text style={{ color: DIM, fontSize: 11, fontWeight: '700' }}>Hide</Text></Pressable> : null}
                      </View>
                    </View>
                  </View>
                </View>);
            })}
            {M.items.length > 12 ? <Pressable onPress={() => setMore(!more)} style={{ alignSelf: 'center', marginTop: 4, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999, ...RAISED }}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{more ? 'See less' : 'See more · ' + (M.items.length - 12) + ' more'}</Text></Pressable> : null}
          </Rise>

          {/* 4. On This Day */}
          <Rise i={sec++}>
            <Head t="On This Day" s="Same date, earlier months and years" />
            {M.onThisDay.length + M.habitDays.length ? (
              <View style={{ gap: 8 }}>
                {M.onThisDay.map(({ when, item }) => (
                  <View key={item.id} style={[RAISED, { borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                    <Text style={{ fontSize: 20 }}>{KIND[item.kind][0]}</Text>
                    <View style={{ flex: 1 }}><Text style={{ color: '#ffd9a8', fontSize: 11.5, fontWeight: '800' }}>{when.toUpperCase()}</Text><Text style={{ color: W, fontSize: 14, fontWeight: '700', marginTop: 1 }}>{item.title}</Text>{item.sub ? <Text style={{ color: DIM, fontSize: 12.5, marginTop: 1 }}>{item.sub}</Text> : null}</View>
                    <Pressable onPress={() => hide(item.id, 'this memory')} accessibilityLabel="Hide this memory" hitSlop={8}><Text style={{ color: DIM, fontSize: 11, fontWeight: '700' }}>Hide</Text></Pressable>
                  </View>))}
                {M.habitDays.map((x) => (
                  <View key={x.date} style={[RAISED, { borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                    <Text style={{ fontSize: 20 }}>🌿</Text>
                    <View style={{ flex: 1 }}><Text style={{ color: '#ffd9a8', fontSize: 11.5, fontWeight: '800' }}>{x.when.toUpperCase()}</Text><Text style={{ color: W, fontSize: 14, fontWeight: '700', marginTop: 1 }}>Your health that day</Text><Text style={{ color: DIM, fontSize: 12.5, marginTop: 1 }}>{x.text}</Text></View>
                    <Pressable onPress={() => hide('hd' + x.date, 'this memory')} accessibilityLabel="Hide this memory" hitSlop={8}><Text style={{ color: DIM, fontSize: 11, fontWeight: '700' }}>Hide</Text></Pressable>
                  </View>))}
              </View>) : <Empty t="Nothing from earlier months or years on this date yet. Come back on another day and your past will say hello." />}
          </Rise>

          {/* 5. Your Achievements */}
          <Rise i={sec++}>
            <Head t="Your Achievements" s={M.badges.filter((b) => b.ok).length + ' of ' + M.badges.length + ' unlocked. A badge opens only when you really meet it'} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {M.badges.map((b) => (
                <View key={b.id} style={[RAISED, { width: '48%', flexGrow: 1, borderRadius: 20, padding: 12, alignItems: 'center', justifyContent: 'center', opacity: b.ok ? 1 : 0.62, borderColor: b.ok ? b.color + 'aa' : 'rgba(255,255,255,.2)' }]}>
                  <View style={{ width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: b.ok ? b.color + '33' : 'rgba(255,255,255,.08)', borderWidth: 1.5, borderColor: b.ok ? b.color : 'rgba(255,255,255,.2)' }}>
                    <Text allowFontScaling={false} style={{ fontSize: 24, lineHeight: 30, width: 54, height: 30, textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false, opacity: b.ok ? 1 : 0.4 }}>{b.ok ? b.icon : '🔒'}</Text>
                  </View>
                  <Text style={{ color: W, fontSize: 13, fontWeight: '800', textAlign: 'center', marginTop: 8 }}>{b.title}</Text>
                  {b.ok ? <Text style={{ color: b.color, fontSize: 11, fontWeight: '700', marginTop: 3 }}>{'Unlocked ' + (b.at ? nice(b.at) : '')}</Text>
                    : <><Text style={{ color: DIM, fontSize: 11, textAlign: 'center', marginTop: 3 }}>{b.how}</Text><View style={{ alignSelf: 'stretch' }}><Bar p={b.cur / b.goal} c={b.color} /></View><Text style={{ color: DIM, fontSize: 10.5, marginTop: 4 }}>{nf(b.cur) + ' of ' + nf(b.goal)}</Text></>}
                </View>))}
            </View>
          </Rise>

          {/* 6. Your Year in Review */}
          <Rise i={sec++}>
            <Head t="Your Year in Review" s="A summary of the year, from dated moments" />
            {M.years.length > 1 ? <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>{M.years.map((y) => <Pressable key={y} onPress={() => setYear(y)} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, backgroundColor: yr === y ? '#b794ff' : 'rgba(255,255,255,.12)' }}><Text style={{ color: yr === y ? '#0d1030' : W, fontWeight: '800', fontSize: 12.5 }}>{y}</Text></Pressable>)}</View> : null}
            <View style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', borderTopColor: 'rgba(255,255,255,.4)' }}>
              <LinearGradient colors={['rgba(255,180,94,.28)', 'rgba(255,111,145,.2)', 'rgba(124,156,255,.25)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16 }}>
                <Text style={{ color: W, fontSize: 28, fontWeight: '800' }}>{String(yr)}</Text>
                {R.tasks + R.notes + R.plans + R.jobs + R.habitDays + R.badges.length + R.marks.length === 0 ? <Text style={{ color: DIM, fontSize: 13, marginTop: 6, lineHeight: 19 }}>Nothing is dated in {String(yr)} yet. This page fills in by itself as the year goes on.</Text> : (<>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {([['tasks finished', R.tasks], ['notes written', R.notes], ['plans achieved', R.plans], ['vehicle jobs', R.jobs], ['days of health logged', R.habitDays], ['steps walked', R.steps]] as [string, number][]).filter((x) => x[1] > 0).map(([a, n]) => (
                      <View key={a} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, ...RAISED }}><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{nf(n)}</Text><Text style={{ color: DIM, fontSize: 11.5 }}>{a}</Text></View>))}
                  </View>
                  {R.best > 0 ? (<>
                    <Text style={{ color: DIM, fontSize: 11.5, fontWeight: '800', letterSpacing: 1, marginTop: 16 }}>YOUR BUSIEST MONTHS</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 64, marginTop: 8 }}>
                      {R.months.map((v, i) => <View key={i} style={{ flex: 1, height: Math.max(3, (v / R.best) * 60), borderRadius: 4, backgroundColor: v === R.best ? '#ffd24a' : 'rgba(255,255,255,.28)' }} />)}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 3 }}>{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((l, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,.5)', fontSize: 9.5 }}>{l}</Text>)}</View>
                    <Text style={{ color: W, fontSize: 13, marginTop: 8 }}>{R.bestName + ' was your most active month, with ' + R.best + (R.best === 1 ? ' moment.' : ' moments.')}</Text>
                  </>) : null}
                  {R.badges.length || R.marks.length ? (<View style={{ marginTop: 14, gap: 6 }}>
                    <Text style={{ color: DIM, fontSize: 11.5, fontWeight: '800', letterSpacing: 1 }}>HIGHLIGHTS</Text>
                    {R.marks.map((x) => <Text key={x.id} style={{ color: W, fontSize: 13 }}>{'🎈  ' + x.title + ' · ' + nice(x.date)}</Text>)}
                    {R.badges.map((b) => <Text key={b.id} style={{ color: W, fontSize: 13 }}>{b.icon + '  ' + b.title + ' · ' + nice(b.at as string)}</Text>)}
                  </View>) : null}
                </>)}
              </LinearGradient>
            </View>
            {M.undated > 0 ? <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11.5, marginTop: 8, lineHeight: 17 }}>{M.undated + (M.undated === 1 ? ' older task, note or plan has' : ' older tasks, notes and plans have') + ' no date, so they count in your numbers but not in the timeline or this summary.'}</Text> : null}
          </Rise>

          {/* Control and privacy */}
          <Rise i={sec++}>
            <Head t="You are in control" s="Memories stay on your phone and in your own backup" />
            <Glass style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>Show on Dashboard</Text><Text style={{ color: DIM, fontSize: 12, marginTop: 1 }}>A Your Memories page in the card at the bottom of Home</Text></View>
                <Sw on={M.mem.dash} set={(v) => M.setMem({ ...M.mem, dash: v })} label="Show Your Memories on the Dashboard" />
              </View>
              {M.hiddenCount > 0 ? <Pressable onPress={() => M.setMem({ ...M.mem, hide: [] })} style={{ marginTop: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{'Show ' + M.hiddenCount + ' hidden ' + (M.hiddenCount === 1 ? 'memory' : 'memories') + ' again'}</Text></Pressable> : null}
              <Pressable onPress={() => confirmDelete('your memories', () => M.setMem({ hide: [], badges: {}, dash: M.mem.dash }), { title: 'Reset your memories?', message: 'This forgets the days your badges were unlocked and any memories you hid. Your notes, tasks, health logs and records are not touched, and badges will open again by themselves when you meet them.', yes: 'Reset' })} style={{ marginTop: 10, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,111,145,.16)', borderWidth: 1, borderColor: 'rgba(255,111,145,.4)', alignItems: 'center' }}><Text style={{ color: '#ffb3c4', fontSize: 13, fontWeight: '800' }}>Reset my memories</Text></Pressable>
            </Glass>
          </Rise>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
