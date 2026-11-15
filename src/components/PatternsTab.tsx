import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './Txt';
import { Glass } from './Glass';
import { HeadIcon } from './HabitIcons';
import { useStored } from '../lib/store';
import { HData, HDay, BLANK, getDay, dateOf, keyOfDate, MOODS, WD, MON, cupsGoal } from '../lib/habit';
import { CardArt } from './CardArt';
import { TimeMachine } from './TimeMachine';
import { cyclePatterns } from '../lib/cycle';
import { ENERGY, energyEstimate, findPatterns, weekFacts, windowAvg, dayLevel, hasAny, MIN_DAYS, TPLS, CATS, expState } from '../lib/patterns';

const T = '#5ee7df';
const W = '#fff';
const DIM = 'rgba(255,255,255,.7)';
const hrs = (n: number) => (Math.round(n * 10) / 10) + ' h';
const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Tile = ({ ic, v, l }: { ic: string; v: string; l: string }) => (
  <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.09)', alignItems: 'center' }}>
    <HeadIcon k={ic} size={26} />
    <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: W, fontSize: 15, fontWeight: '800', marginTop: 6 }}>{v}</Text>
    <Text style={{ color: DIM, fontSize: 10.5, marginTop: 1 }}>{l}</Text>
  </View>
);

// The first tab of Habit & Health. It only reads what is already logged.
export function PatternsTab({ h, setH, onToday }: { h: HData; setH: (v: HData) => void; onToday: () => void }) {
  const goal = h.goal || 8000, cg = cupsGoal(h);
  const t = getDay(h, 0);
  const est = t.en != null && t.en >= 0 ? { lvl: t.en, own: true, why: 'Your own rating' } : (() => { const e = energyEstimate(t, cg, goal); return e ? { lvl: e.lvl, own: false, why: e.why } : null; })();
  const [off, setOff] = useStored<Record<string, number>>('ml_pat_off', {});
  const [why, setWhy] = useState('');
  const pats = findPatterns(h);
  const cyP = h.cyOn ? cyclePatterns(h) : [];
  const shown = [...pats.list, ...cyP].filter((p) => !(off[p.id] && Date.now() - off[p.id] < 30 * 86400000)).slice(0, 3);
  const facts = weekFacts(h);
  // Experiments
  const [newOpen, setNewOpen] = useState(false);
  const exps = (h.exps || []).map((e) => ({ e, st: expState(e, h) })).filter((x) => x.st);
  const active = exps.filter((x) => !x.st!.done), finished = exps.filter((x) => x.st!.done).slice(-3).reverse();
  const startExp = (tpl: string) => {
    if (active.some((x) => x.e.tpl === tpl) || active.length >= 3) return;
    setH({ ...h, exps: [...(h.exps || []), { id: String(Date.now()), tpl, start: keyOfDate(dateOf(0)) }] }); setNewOpen(false);
  };
  const dropExp = (id: string) => setH({ ...h, exps: (h.exps || []).filter((x) => x.id !== id) });

  return (<>
    <Glass radius={26} style={{ marginTop: 12, padding: 16 }}>
      <CardArt kind="intel" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <HeadIcon k="brain" size={48} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: W, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 }}>My Life Intelligence</Text>
          <Text style={{ color: DIM, fontSize: 13, marginTop: 2 }}>Your life, understood better.</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        {['Private, on your phone', 'Possible links, not proof'].map((c) => <View key={c} style={{ paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: 'rgba(255,255,255,.82)', fontSize: 11.5, fontWeight: '600' }}>{c}</Text></View>)}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 8, marginLeft: 62 }}>
        <View style={{ paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: 'rgba(255,255,255,.82)', fontSize: 11.5, fontWeight: '600' }}>Not medical advice</Text></View>
      </View>
    </Glass>

    <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
      <Text style={{ color: T, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.6 }}>DAILY OVERVIEW · TODAY</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <Tile ic="steps" v={t.steps > 0 ? Math.round(t.steps).toLocaleString() : 'No record'} l="Steps" />
        <Tile ic="water" v={t.cups > 0 ? t.cups + '/' + cg : 'No record'} l="Water" />
        <Tile ic="sleep" v={t.sleep > 0 ? hrs(t.sleep) : 'No record'} l="Sleep" />
        <Tile ic="mood" v={t.mood >= 0 ? MOODS[t.mood][0] : 'No record'} l="Mood" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: est ? ENERGY[est.lvl][1] : 'rgba(255,255,255,.3)' }} />
        <Text style={{ flex: 1, color: W, fontSize: 13, fontWeight: '700' }}>{est ? 'Energy: ' + ENERGY[est.lvl][0] + (est.own ? '' : ' (estimated)') : 'Energy: No record'}</Text>
      </View>
      {est ? <Text style={{ color: DIM, fontSize: 11.5, marginTop: 3 }}>{est.why}</Text> : <Text style={{ color: DIM, fontSize: 11.5, marginTop: 3 }}>Log two things in Today and an estimate appears here.</Text>}
      <Pressable onPress={onToday} style={{ marginTop: 10 }}><Text style={{ color: '#8fe9e2', fontSize: 12.5, fontWeight: '700' }}>Log today  ›</Text></Pressable>
    </Glass>

    <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><HeadIcon k="link" /><View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Patterns we noticed</Text><Text style={{ color: DIM, fontSize: 12 }}>Last 30 days · possible links, not proof</Text></View></View>
      {shown.length === 0 ? (
        <View style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.08)' }}>
          <Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>Not enough records yet</Text>
          <Text style={{ color: DIM, fontSize: 12, lineHeight: 17, marginTop: 3 }}>{pats.list.length > 0 && shown.length === 0 ? 'You have hidden every pattern for now. They return after 30 days.' : 'A pattern needs ' + MIN_DAYS + ' days where two things were logged together, for example mood and sleep. Your best pair so far: ' + pats.best + ' of ' + MIN_DAYS + ' days.'}</Text>
        </View>
      ) : shown.map((p) => (
        <View key={p.id} style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.09)' }}>
          <Text style={{ color: W, fontSize: 13.5, fontWeight: '800', lineHeight: 19 }}>{p.title}</Text>
          <Text style={{ color: DIM, fontSize: 11.5, marginTop: 3 }}>{p.range}</Text>
          {why === p.id ? <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 12, lineHeight: 17, marginTop: 6 }}>{p.detail + ' This is a link in your own records. It does not mean one caused the other.'}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
            <Pressable onPress={() => setWhy(why === p.id ? '' : p.id)} hitSlop={8}><Text style={{ color: T, fontSize: 12, fontWeight: '800' }}>{why === p.id ? 'Hide' : 'Why this?'}</Text></Pressable>
            <Pressable onPress={() => setOff({ ...off, [p.id]: Date.now() })} hitSlop={8}><Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 12, fontWeight: '700' }}>Dismiss</Text></Pressable>
          </View>
        </View>
      ))}
      {facts.length > 0 ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: DIM, fontSize: 11.5, fontWeight: '700', marginBottom: 4 }}>THIS WEEK IN NUMBERS</Text>
          {facts.map((f) => <Text key={f} style={{ color: 'rgba(255,255,255,.85)', fontSize: 12.5, lineHeight: 19 }}>{'•  ' + f}</Text>)}
        </View>
      ) : null}
    </Glass>

    <TimeMachine h={h} setH={setH} />
    <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
      <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Experiments</Text>
      <Text style={{ color: DIM, fontSize: 12 }}>Small tests of your own habits</Text>
      {active.map(({ e, st }) => (
        <View key={e.id} style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.09)' }}>
          <Text style={{ color: T, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4 }}>{'ACTIVE · DAY ' + st!.dayNo + ' OF ' + st!.tpl.days}</Text>
          <Text style={{ color: W, fontSize: 14, fontWeight: '800', marginTop: 3 }}>{st!.tpl.title}</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 8 }}>
            {st!.cells.map((c, i) => <View key={i} style={{ flex: 1, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: c === 'hit' ? T : c === 'miss' ? 'rgba(255,143,171,.55)' : 'rgba(255,255,255,.1)' }}><Text style={{ color: c === 'hit' ? '#06222a' : W, fontSize: 10, fontWeight: '800' }}>{c === 'hit' ? '✓' : c === 'miss' ? '✕' : ''}</Text></View>)}
          </View>
          <Text style={{ color: DIM, fontSize: 11.5, marginTop: 6 }}>{'Target met on ' + st!.hit + ' of ' + st!.logged + ' recorded days. ' + st!.tpl.note + '.'}</Text>
          <Pressable onPress={() => dropExp(e.id)} hitSlop={8} style={{ marginTop: 6, alignSelf: 'flex-start' }}><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: '700' }}>Stop this experiment</Text></Pressable>
        </View>
      ))}
      {newOpen ? (
        <View style={{ marginTop: 10 }}>
          {CATS.map((cat) => (
            <View key={cat}>
              <Text style={{ color: '#9fb0d0', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4, marginTop: 14 }}>{cat.toUpperCase()}</Text>
              {TPLS.filter((t) => t.cat === cat).map((t) => { const used = active.some((x) => x.e.tpl === t.id); return (
                <Pressable key={t.id} disabled={used} onPress={() => startExp(t.id)} style={{ marginTop: 8, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.09)', opacity: used ? 0.45 : 1 }}>
                  <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{t.title}</Text>
                  <Text style={{ color: DIM, fontSize: 11.5, marginTop: 2 }}>{t.days + ' days · ' + (used ? 'already running' : t.note)}</Text>
                </Pressable>); })}
            </View>
          ))}
          <Text style={{ color: '#ffd593', fontSize: 11, lineHeight: 15, marginTop: 10 }}>Only things the app already records can be counted: sleep, steps, water, mood, relax and medicine. You can run 3 at a time.</Text>
        </View>
      ) : null}
      <Pressable onPress={() => setNewOpen(!newOpen)} style={{ marginTop: 12, alignSelf: 'flex-start', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: active.length >= 3 && !newOpen ? 'rgba(255,255,255,.12)' : 'rgba(124,156,255,.45)' }}>
        <Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>{newOpen ? 'Close' : '+ New experiment'}</Text>
      </Pressable>
      {finished.length > 0 ? (
        <View style={{ marginTop: 14 }}>
          <Text style={{ color: DIM, fontSize: 11.5, fontWeight: '700' }}>FINISHED</Text>
          {finished.map(({ e, st }) => (
            <View key={e.id} style={{ marginTop: 8, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.09)' }}>
              <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{st!.tpl.title}</Text>
              <Text style={{ color: DIM, fontSize: 12, marginTop: 2 }}>{'Target met on ' + st!.hit + ' of ' + st!.tpl.days + ' days' + (st!.logged < st!.tpl.days ? ' (' + (st!.tpl.days - st!.logged) + ' with no record)' : '')}</Text>
              {st!.rows.length > 0 ? <View style={{ marginTop: 6 }}>
                <View style={{ flexDirection: 'row' }}><Text style={{ flex: 1.2, color: 'rgba(255,255,255,.5)', fontSize: 10.5 }}> </Text><Text style={{ flex: 1, color: 'rgba(255,255,255,.5)', fontSize: 10.5, fontWeight: '700' }}>BEFORE</Text><Text style={{ flex: 1, color: 'rgba(255,255,255,.5)', fontSize: 10.5, fontWeight: '700' }}>DURING</Text></View>
                {st!.rows.map((r) => <View key={r.l} style={{ flexDirection: 'row', paddingVertical: 3 }}><Text style={{ flex: 1.2, color: DIM, fontSize: 12 }}>{r.l}</Text><Text style={{ flex: 1, color: W, fontSize: 12, fontWeight: '700' }}>{r.a}</Text><Text style={{ flex: 1, color: W, fontSize: 12, fontWeight: '800' }}>{r.b}</Text></View>)}
              </View> : null}
              <Text style={{ color: '#ffd593', fontSize: 11, lineHeight: 15, marginTop: 6 }}>A personal observation from your own records, not clinical evidence.</Text>
              <Pressable onPress={() => dropExp(e.id)} hitSlop={8} style={{ marginTop: 6, alignSelf: 'flex-start' }}><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: '700' }}>Remove</Text></Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </Glass>
  </>);
}
