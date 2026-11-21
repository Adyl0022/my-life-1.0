import { LinearGradient } from 'expo-linear-gradient';
import { Locked } from './Paywall';
import { usePro } from '../lib/pro';
import React, { useState } from 'react';
import { View, Share } from 'react-native';
import { Pressable } from './Press';
import { Text } from './Txt';
import { Glass } from './Glass';
import { HeadIcon } from './HabitIcons';
import { useStored } from '../lib/store';
import { HData, HDay, Exp, BLANK, getDay, dateOf, keyOfDate, MOODS, WD, MON, cupsGoal } from '../lib/habit';
import { CardArt, IntelIcon } from './CardArt';
import { TimeMachine } from './TimeMachine';
import { cyclePatterns } from '../lib/cycle';
import { ENERGY, energyEstimate, restSignal, findPatterns, weekFacts, windowAvg, dayLevel, hasAny, MIN_DAYS, TPLS, CATS, expState, adviceOf } from '../lib/patterns';

import { confirmDelete } from '../lib/dialog';
import { Inp } from './Ui';
import { tryForm } from '../lib/num';
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
  const pro = usePro(); // the pattern finder card is part of the subscription
  const goal = h.goal || 8000, cg = cupsGoal(h);
  const t = getDay(h, 0);
  const est = t.en != null && t.en >= 0 ? { lvl: t.en, own: true, why: 'Your own rating' } : (() => { const e = energyEstimate(t, cg, goal, restSignal(h, keyOfDate(dateOf(0)))); return e ? { lvl: e.lvl, own: false, why: e.why } : null; })();
  const [off, setOff] = useStored<Record<string, number>>('ml_pat_off', {});
  const [why, setWhy] = useState('');
  const pats = findPatterns(h);
  const cyP = h.cyOn ? cyclePatterns(h) : [];
  const shown = [...pats.list, ...cyP].filter((p) => !(off[p.id] && Date.now() - off[p.id] < 30 * 86400000)).slice(0, 3);
  const facts = weekFacts(h);
  // Experiments
  const [newOpen, setNewOpen] = useState(false);
  const exps = (h.exps || []).map((e) => ({ e, st: expState(e, h) })).filter((x) => x.st);
  const live = exps.filter((x) => !x.e.ok);
  const active = live.filter((x) => !x.st!.done), finished = live.filter((x) => x.st!.done).reverse();
  const hist = exps.filter((x) => x.e.ok).sort((p, q) => ((q.e.okAt || '') > (p.e.okAt || '') ? 1 : -1));
  const [tg, setTg] = useState<Record<string, number>>({}); const [histAll, setHistAll] = useState(false); const [histOpen, setHistOpen] = useState(false);
  const [noteFor, setNoteFor] = useState(''); const [noteTxt, setNoteTxt] = useState('');
  const startExp = (tpl: string, goal?: number) => {
    if (active.some((x) => x.e.tpl === tpl && x.e.goal === goal) || active.length >= 3) return;
    setH({ ...h, exps: [...(h.exps || []), { id: String(Date.now()), tpl, start: keyOfDate(dateOf(0)), ...(goal != null ? { goal } : {}) }] }); setNewOpen(false);
  };
  const patch = (id: string, v: Partial<Exp>) => setH({ ...h, exps: (h.exps || []).map((x) => x.id === id ? { ...x, ...v } : x) });
  const okExp = (id: string) => patch(id, { ok: true, okAt: keyOfDate(dateOf(0)), rem: false });
  const addNote = (id: string) => {
    const t = noteTxt.trim(); if (!t) { tryForm('expnote'); return; }
    const e = (h.exps || []).find((x) => x.id === id); patch(id, { notes: [...((e && e.notes) || []), { d: keyOfDate(dateOf(0)), t: t.slice(0, 140) }] }); setNoteTxt(''); setNoteFor('');
  };
  // The run before this one (same kind, same own number), so a repeat can show if it went better.
  const prevOf = (e: Exp) => { const o = exps.filter((x) => x.e.id !== e.id && x.e.tpl === e.tpl && x.e.goal === e.goal && x.e.start < e.start && x.st!.logged > 0); return o.length ? o[o.length - 1].st! : null; };
  const trend = (e: Exp, st: NonNullable<ReturnType<typeof expState>>) => { const pv = prevOf(e); if (!pv || st.logged === 0) return ''; const a = Math.round((pv.hit / Math.max(1, pv.logged)) * 100), b = Math.round((st.hit / Math.max(1, st.logged)) * 100); return 'Last time ' + a + '%, now ' + b + '%' + (b > a ? ' (better)' : b < a ? ' (lower)' : ' (the same)'); };
  const shareExp = (st: NonNullable<ReturnType<typeof expState>>) => {
    const a = adviceOf(st); const lines = ['My Life 1.0 experiment: ' + st.tpl.title, 'Target met on ' + st.hit + ' of ' + st.tpl.days + ' days. ' + a.head + '.'];
    st.rows.forEach((r) => lines.push(r.l + ': ' + r.a + ' before, ' + r.b + ' during'));
    Share.share({ message: lines.join('\n') }).catch(() => {});
  };
  const [resId, setResId] = useState('');
  const Result = ({ st }: { st: NonNullable<ReturnType<typeof expState>> }) => {
    const a = adviceOf(st); const col = a.tone === 'great' ? '#7df0c6' : a.tone === 'good' ? '#ffd593' : '#ff9fb4';
    const running = active.some((x) => x.e.tpl === (a.next ? a.next.id : ''));
    return (
      <View style={{ marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,.22)', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)' }}>
        <Text style={{ color: col, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4 }}>YOUR RESULT</Text>
        <Text style={{ color: W, fontSize: 16, fontWeight: '800', marginTop: 3 }}>{a.head}</Text>
        <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>{a.line}</Text>
        {st.rows.length > 0 ? <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row' }}><Text style={{ flex: 1.2, color: 'rgba(255,255,255,.5)', fontSize: 10.5 }}> </Text><Text style={{ flex: 1, color: 'rgba(255,255,255,.5)', fontSize: 10.5, fontWeight: '700' }}>BEFORE</Text><Text style={{ flex: 1, color: 'rgba(255,255,255,.5)', fontSize: 10.5, fontWeight: '700' }}>DURING</Text></View>
          {st.rows.map((r) => <View key={r.l} style={{ flexDirection: 'row', paddingVertical: 3 }}><Text style={{ flex: 1.2, color: DIM, fontSize: 12 }}>{r.l}</Text><Text style={{ flex: 1, color: W, fontSize: 12, fontWeight: '700' }}>{r.a}</Text><Text style={{ flex: 1, color: W, fontSize: 12, fontWeight: '700' }}>{r.b}</Text></View>)}
        </View> : null}
        <Text style={{ color: T, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4, marginTop: 10 }}>HOW TO IMPROVE</Text>
        {a.tips.map((x) => <Text key={x} style={{ color: 'rgba(255,255,255,.88)', fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>{'•  ' + x}</Text>)}
        {a.next ? (
          <Pressable disabled={running || active.length >= 3} onPress={() => startExp(a.next!.id)} style={{ marginTop: 10, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(124,156,255,.45)', opacity: running || active.length >= 3 ? 0.45 : 1 }}>
            <Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>{(a.nextWhy || '') + 'Try: ' + a.next.title}</Text>
          </Pressable>
        ) : null}
        <Text style={{ color: '#ffd593', fontSize: 11, lineHeight: 15, marginTop: 10 }}>A personal observation from your own records, not clinical evidence or medical advice.{!st.done ? ' Today still counts, so the result can change tonight.' : ''}</Text>
      </View>
    );
  };
  const dropExp = (id: string) => setH({ ...h, exps: (h.exps || []).filter((x) => x.id !== id) });

  return (<>
    <View style={{ marginTop: 12, padding: 16, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
      <LinearGradient colors={['#4b3fa6', '#6d4fc4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <CardArt kind="intel" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <IntelIcon size={48}><HeadIcon k="brain" size={48} /></IntelIcon>
        <View style={{ flex: 1 }}>
          <Text style={{ color: W, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 }}>My Life Intelligence</Text>
          <Text style={{ color: DIM, fontSize: 12.5, lineHeight: 17, marginTop: 4 }}>Understand your habits, discover your patterns and improve your everyday life.</Text>
        </View>
      </View>
    </View>

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

    <Locked on={!pro} title="Patterns we noticed" mt={12}>
    <Glass radius={24} style={{ padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><HeadIcon k="link" /><View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Patterns we noticed</Text><Text style={{ color: DIM, fontSize: 12, marginTop: 4 }}>Last 30 days · possible links, not proof</Text></View></View>
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
    </Locked>

    <TimeMachine h={h} setH={setH} />
    <Locked on={!pro} title="Experiments" mt={12}>
    <Glass radius={24} style={{ padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Experiments</Text>
          <Text style={{ color: DIM, fontSize: 12 }}>Small tests of your own habits</Text>
        </View>
        {hist.length > 0 ? (
          <Pressable onPress={() => setHistOpen(!histOpen)} accessibilityLabel={histOpen ? 'Hide history' : 'Show history'}>
            <LinearGradient colors={histOpen ? ['#7c9cff', '#b794ff'] : ['rgba(124,156,255,.4)', 'rgba(183,148,255,.4)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8, paddingLeft: 14, paddingRight: 11, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,.28)' }}>
              <Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>History</Text>
              <View style={{ minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.28)' }}><Text style={{ color: W, fontSize: 11.5, fontWeight: '800' }}>{hist.length}</Text></View>
              <Text style={{ color: W, fontSize: 11, fontWeight: '800' }}>{histOpen ? '▲' : '▼'}</Text>
            </LinearGradient>
          </Pressable>
        ) : null}
      </View>
      {active.map(({ e, st }) => { const ready = st!.dayNo >= st!.tpl.days && !st!.cells.includes('future'); const open = ready && resId === e.id; const tr = trend(e, st!); return (
        <View key={e.id} style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.09)', borderWidth: ready ? 1 : 0, borderColor: 'rgba(125,240,198,.55)' }}>
          <Pressable disabled={!ready} onPress={() => setResId(open ? '' : e.id)} accessibilityLabel={ready ? 'Show the result of ' + st!.tpl.title : st!.tpl.title}>
          <Text style={{ color: ready ? '#7df0c6' : T, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4 }}>{ready ? 'COMPLETE · DAY ' + st!.dayNo + ' OF ' + st!.tpl.days + ' · TAP FOR YOUR RESULT' : 'ACTIVE · DAY ' + st!.dayNo + ' OF ' + st!.tpl.days}</Text>
          <Text style={{ color: W, fontSize: 14, fontWeight: '800', marginTop: 3 }}>{st!.tpl.title}</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 8 }}>
            {st!.cells.map((c, i) => <View key={i} style={{ flex: 1, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: c === 'hit' ? T : c === 'miss' ? 'rgba(255,143,171,.55)' : 'rgba(255,255,255,.1)' }}><Text style={{ color: c === 'hit' ? '#06222a' : W, fontSize: 10, fontWeight: '800' }}>{i + 1}</Text></View>)}
          </View>
          <Text style={{ color: DIM, fontSize: 11.5, marginTop: 6 }}>{'Target met on ' + st!.hit + ' of ' + st!.logged + ' recorded days. ' + st!.tpl.note + '.'}</Text>
          {tr ? <Text style={{ color: '#ffd593', fontSize: 11.5, marginTop: 3 }}>{tr}</Text> : null}
          </Pressable>
          {open ? <Result st={st!} /> : null}
          {(e.notes || []).map((n, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6 }}>
              <Text style={{ flex: 1, color: 'rgba(255,255,255,.85)', fontSize: 12, lineHeight: 17 }}>{n.d.slice(8) + ' ' + MN[+n.d.slice(5, 7) - 1].slice(0, 3) + ': ' + n.t}</Text>
              <Pressable hitSlop={8} accessibilityLabel="Delete note" onPress={() => confirmDelete('this note', () => patch(e.id, { notes: (e.notes || []).filter((_, j) => j !== i) }))}><Text style={{ color: '#ff8fa0', fontSize: 12, fontWeight: '800' }}>✕</Text></Pressable>
            </View>
          ))}
          {noteFor === e.id ? (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 8 }}>
              <Inp style={{ flex: 1 }} autoFocus form="expnote" need="a note" value={noteTxt} onChangeText={setNoteTxt} placeholder="What made today different?" maxLength={140} onSubmitEditing={() => addNote(e.id)} />
              <Pressable onPress={() => addNote(e.id)} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(124,156,255,.55)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>Add</Text></Pressable>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {ready ? (
              <Pressable onPress={() => confirmDelete('this experiment', () => okExp(e.id), { title: 'Finish this experiment?', message: 'It moves to your History, where you can read the result again or run it again.', yes: 'OK, finish' })} accessibilityLabel={'Finish ' + st!.tpl.title} style={{ paddingVertical: 8, paddingHorizontal: 22, borderRadius: 999, backgroundColor: '#7df0c6' }}><Text style={{ color: '#06281d', fontSize: 13, fontWeight: '800' }}>OK</Text></Pressable>
            ) : (
              <Pressable onPress={() => confirmDelete('this entry', () => dropExp(e.id))} hitSlop={6} style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,107,129,.16)', borderWidth: 1, borderColor: 'rgba(255,107,129,.55)' }}><Text style={{ color: '#ff8fa0', fontSize: 12.5, fontWeight: '800' }}>Stop this experiment</Text></Pressable>
            )}
            <Pressable onPress={() => { setNoteFor(noteFor === e.id ? '' : e.id); setNoteTxt(''); }} style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>{noteFor === e.id ? 'Cancel note' : '+ Note'}</Text></Pressable>
            {!ready ? <Pressable onPress={() => patch(e.id, { rem: !e.rem })} accessibilityLabel="Daily reminder" style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: e.rem ? 'rgba(125,240,198,.28)' : 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: e.rem ? '#7df0c6' : 'transparent' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>{e.rem ? 'Reminder: 8:30 pm' : 'Remind me'}</Text></Pressable> : null}
          </View>
        </View>
      ); })}
      {newOpen ? (
        <View style={{ marginTop: 10 }}>
          {CATS.map((cat) => (
            <View key={cat}>
              <Text style={{ color: '#9fb0d0', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4, marginTop: 14 }}>{cat.toUpperCase()}</Text>
              {TPLS.filter((t) => t.cat === cat).map((t) => { const o = t.own; const val = o ? (tg[t.id] != null ? tg[t.id] : o.def) : undefined; const used = active.some((x) => x.e.tpl === t.id && x.e.goal === (o ? val : undefined)); return (
                <Pressable key={t.id} disabled={used || !!o} onPress={() => startExp(t.id)} style={{ marginTop: 8, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.09)', opacity: used ? 0.45 : 1 }}>
                  <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{o ? o.mk(val as number) : t.title}</Text>
                  <Text style={{ color: DIM, fontSize: 11.5, marginTop: 2 }}>{t.days + ' days · ' + (used ? 'already running' : t.note)}</Text>
                  {o ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      <Pressable hitSlop={6} accessibilityLabel="Lower" onPress={() => setTg({ ...tg, [t.id]: Math.max(o.min, Math.round(((val as number) - o.step) * 10) / 10) })} style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.14)' }}><Text style={{ color: W, fontSize: 18, fontWeight: '800' }}>−</Text></Pressable>
                      <Text style={{ minWidth: 92, textAlign: 'center', color: W, fontSize: 15, fontWeight: '800' }}>{(val as number).toLocaleString() + ' ' + o.unit}</Text>
                      <Pressable hitSlop={6} accessibilityLabel="Higher" onPress={() => setTg({ ...tg, [t.id]: Math.min(o.max, Math.round(((val as number) + o.step) * 10) / 10) })} style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.14)' }}><Text style={{ color: W, fontSize: 18, fontWeight: '800' }}>+</Text></Pressable>
                      <Pressable disabled={used} onPress={() => startExp(t.id, val)} style={{ marginLeft: 'auto', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(124,156,255,.55)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>Start</Text></Pressable>
                    </View>
                  ) : null}
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
              {trend(e, st!) ? <Text style={{ color: '#ffd593', fontSize: 11.5, marginTop: 3 }}>{trend(e, st!)}</Text> : null}
              {st!.rows.length > 0 ? <View style={{ marginTop: 6 }}>
                <View style={{ flexDirection: 'row' }}><Text style={{ flex: 1.2, color: 'rgba(255,255,255,.5)', fontSize: 10.5 }}> </Text><Text style={{ flex: 1, color: 'rgba(255,255,255,.5)', fontSize: 10.5, fontWeight: '700' }}>BEFORE</Text><Text style={{ flex: 1, color: 'rgba(255,255,255,.5)', fontSize: 10.5, fontWeight: '700' }}>DURING</Text></View>
                {st!.rows.map((r) => <View key={r.l} style={{ flexDirection: 'row', paddingVertical: 3 }}><Text style={{ flex: 1.2, color: DIM, fontSize: 12 }}>{r.l}</Text><Text style={{ flex: 1, color: W, fontSize: 12, fontWeight: '700' }}>{r.a}</Text><Text style={{ flex: 1, color: W, fontSize: 12, fontWeight: '700' }}>{r.b}</Text></View>)}
              </View> : null}
              <Result st={st!} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                <Pressable onPress={() => okExp(e.id)} accessibilityLabel={'Finish ' + st!.tpl.title} style={{ paddingVertical: 8, paddingHorizontal: 22, borderRadius: 999, backgroundColor: '#7df0c6' }}><Text style={{ color: '#06281d', fontSize: 13, fontWeight: '800' }}>OK</Text></Pressable>
                <Pressable onPress={() => shareExp(st!)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>Share</Text></Pressable>
                <Pressable disabled={active.length >= 3} onPress={() => startExp(e.tpl, e.goal)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(124,156,255,.45)', opacity: active.length >= 3 ? 0.45 : 1 }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>Run again</Text></Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}
      {hist.length > 0 && histOpen ? (
        <View style={{ marginTop: 14 }}>
          <Text style={{ color: DIM, fontSize: 11.5, fontWeight: '700' }}>HISTORY</Text>
          {(histAll ? hist : hist.slice(0, 4)).map(({ e, st }) => { const op = resId === 'h' + e.id; const tr = trend(e, st!); return (
            <View key={e.id} style={{ marginTop: 8, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.09)' }}>
              <Pressable onPress={() => setResId(op ? '' : 'h' + e.id)} accessibilityLabel={'Show the result of ' + st!.tpl.title}>
                <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{st!.tpl.title}</Text>
                <Text style={{ color: DIM, fontSize: 12, marginTop: 2 }}>{'Target met on ' + st!.hit + ' of ' + st!.tpl.days + ' days · finished ' + (e.okAt ? e.okAt.slice(8) + ' ' + MN[+e.okAt.slice(5, 7) - 1].slice(0, 3) : '') + (op ? '' : ' · tap to open')}</Text>
                {tr ? <Text style={{ color: '#ffd593', fontSize: 11.5, marginTop: 3 }}>{tr}</Text> : null}
              </Pressable>
              {op ? <Result st={st!} /> : null}
              {op && (e.notes || []).length ? <View style={{ marginTop: 8 }}>{(e.notes || []).map((n, i) => <Text key={i} style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, lineHeight: 17, marginTop: 2 }}>{n.d.slice(8) + ' ' + MN[+n.d.slice(5, 7) - 1].slice(0, 3) + ': ' + n.t}</Text>)}</View> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                <Pressable onPress={() => shareExp(st!)} style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>Share</Text></Pressable>
                <Pressable disabled={active.length >= 3} onPress={() => startExp(e.tpl, e.goal)} style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(124,156,255,.45)', opacity: active.length >= 3 ? 0.45 : 1 }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>Run again</Text></Pressable>
                <Pressable onPress={() => confirmDelete('this experiment from History', () => dropExp(e.id))} hitSlop={6} style={{ paddingVertical: 7, paddingHorizontal: 12 }}><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: '700' }}>Remove</Text></Pressable>
              </View>
            </View>); })}
          {hist.length > 4 ? <Pressable onPress={() => setHistAll(!histAll)} style={{ marginTop: 10, alignSelf: 'flex-start' }}><Text style={{ color: T, fontSize: 12.5, fontWeight: '800' }}>{histAll ? 'Show fewer' : 'Show all ' + hist.length}</Text></Pressable> : null}
        </View>
      ) : null}
    </Glass>
    </Locked>
  </>);
}
