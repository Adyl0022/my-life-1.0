import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './Txt';
import { Glass } from './Glass';
import { HeadIcon } from './HabitIcons';
import { useStored } from '../lib/store';
import { HData, HDay, BLANK, getDay, dateOf, keyOfDate, MOODS, WD, MON, cupsGoal } from '../lib/habit';
import { cyclePatterns } from '../lib/cycle';
import { ENERGY, energyEstimate, findPatterns, weekFacts, windowAvg, dayLevel, hasAny, MIN_DAYS, TPLS, expState } from '../lib/patterns';

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
  // Calendar
  const [mo, setMo] = useState(0);
  const [pick, setPick] = useState<string>('');
  const base = new Date(); base.setDate(1); base.setHours(12, 0, 0, 0); base.setMonth(base.getMonth() + mo);
  const y = base.getFullYear(), m = base.getMonth();
  const dim = new Date(y, m + 1, 0).getDate(); const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  const todayKey = keyOfDate(dateOf(0));
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const keyOf = (d: number) => keyOfDate(new Date(y, m, d, 12));
  const dayOf = (k: string): HDay => ({ ...BLANK, ...(h.days[k] || {}) });
  const sel = pick || todayKey; const sd = dayOf(sel); const sdt = new Date(sel + 'T12:00:00');
  const sEst = sd.en != null && sd.en >= 0 ? null : energyEstimate(sd, cg, goal);
  // Time machine
  const [back, setBack] = useState(30);
  const now = windowAvg(h, 0), then = windowAvg(h, -back);
  const rows: { l: string; a: string | null; b: string | null; up: boolean | null }[] = [
    { l: 'Steps a day', a: then.steps != null ? Math.round(then.steps).toLocaleString() : null, b: now.steps != null ? Math.round(now.steps).toLocaleString() : null, up: then.steps != null && now.steps != null ? now.steps >= then.steps : null },
    { l: 'Water a day', a: then.water != null ? (Math.round(then.water * 10) / 10) + ' glasses' : null, b: now.water != null ? (Math.round(now.water * 10) / 10) + ' glasses' : null, up: then.water != null && now.water != null ? now.water >= then.water : null },
    { l: 'Sleep a night', a: then.sleep != null ? hrs(then.sleep) : null, b: now.sleep != null ? hrs(now.sleep) : null, up: then.sleep != null && now.sleep != null ? now.sleep >= then.sleep : null },
    { l: 'Mood', a: then.mood != null ? MOODS[Math.round(then.mood)][0] : null, b: now.mood != null ? MOODS[Math.round(now.mood)][0] : null, up: then.mood != null && now.mood != null ? now.mood >= then.mood : null },
  ];
  const nowAny = now.days > 0;
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
    <Glass radius={26} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <HeadIcon k="brain" size={40} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: W, fontSize: 17, fontWeight: '800' }}>My Life Intelligence</Text>
          <Text style={{ color: DIM, fontSize: 12.5, marginTop: 1 }}>Your life, understood better.</Text>
        </View>
      </View>
      <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, lineHeight: 16, marginTop: 10 }}>Calculated on your phone from your own records. It shows possible links, not proof, and it is not medical advice.</Text>
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

    <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View><Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Health Calendar</Text><Text style={{ color: DIM, fontSize: 12 }}>{MN[m] + ' ' + y + ' · tap a day'}</Text></View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable accessibilityLabel="Previous month" onPress={() => { if (mo > -12) { setMo(mo - 1); setPick(''); } }} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center', opacity: mo > -12 ? 1 : 0.4 }}><Text style={{ color: W, fontSize: 18, marginTop: -2 }}>‹</Text></Pressable>
          <Pressable accessibilityLabel="Next month" onPress={() => { if (mo < 0) { setMo(mo + 1); setPick(''); } }} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center', opacity: mo < 0 ? 1 : 0.4 }}><Text style={{ color: W, fontSize: 18, marginTop: -2 }}>›</Text></Pressable>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 10 }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', color: 'rgba(255,255,255,.55)', fontSize: 10.5, fontWeight: '700' }}>{l}</Text>)}</View>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row', marginTop: 5, gap: 5 }}>
          {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
            if (d == null) return <View key={i} style={{ flex: 1, aspectRatio: 1 }} />;
            const k = keyOf(d); const fut = k > todayKey; const lv = fut ? 0 : dayLevel(dayOf(k)); const on = k === sel; const isT = k === todayKey;
            return (
              <Pressable key={i} disabled={fut} onPress={() => setPick(k)} style={{ flex: 1, aspectRatio: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: lv ? 'rgba(94,231,223,' + (0.1 + lv * 0.13) + ')' : 'rgba(255,255,255,.07)', borderWidth: on ? 2 : isT ? 1.5 : 0, borderColor: on ? W : 'rgba(255,255,255,.6)', opacity: fut ? 0.35 : 1 }}>
                <Text style={{ color: W, fontSize: 11.5, fontWeight: isT ? '800' : '600' }}>{d}</Text>
                {h.cyOn && !fut && dayOf(k).pd ? <View style={{ position: 'absolute', bottom: 3, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff8fab' }} /> : null}
              </Pressable>
            );
          })}
        </View>
      ))}
      <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, marginTop: 8 }}>{'Brighter means more things were logged that day.' + (h.cyOn ? ' A pink dot marks a period day.' : '')}</Text>
      <View style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.09)' }}>
        <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{WD[sdt.getDay()] + ', ' + sdt.getDate() + ' ' + MON[sdt.getMonth()]}</Text>
        {h.cyOn && sd.pd ? <Text style={{ color: '#ff8fab', fontSize: 12.5, fontWeight: '700', marginTop: 4 }}>Period day</Text> : null}
        {hasAny(sd) ? (
          <View style={{ marginTop: 6, gap: 3 }}>
            {[['Steps', sd.steps > 0 ? Math.round(sd.steps).toLocaleString() : 'No record'], ['Water', sd.cups > 0 ? sd.cups + ' of ' + cg + ' glasses' : 'No record'], ['Sleep', sd.sleep > 0 ? hrs(sd.sleep) : 'No record'], ['Mood', sd.mood >= 0 ? MOODS[sd.mood][0] : 'No record'], ['Energy', sd.en != null && sd.en >= 0 ? ENERGY[sd.en][0] : sEst ? ENERGY[sEst.lvl][0] + ' (estimated)' : 'No record']].map(([a, b]) => (
              <View key={a} style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: DIM, fontSize: 12.5 }}>{a}</Text><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{b}</Text></View>
            ))}
          </View>
        ) : <Text style={{ color: DIM, fontSize: 12.5, marginTop: 4 }}>No record for this day.</Text>}
      </View>
    </Glass>

    <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
      <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Time Machine</Text>
      <Text style={{ color: DIM, fontSize: 12 }}>Your last 7 days compared with 7 days back then</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        {([[30, '30 days ago'], [60, '60 days ago'], [90, '3 months ago']] as [number, string][]).map(([n, l]) => (
          <Pressable key={n} onPress={() => setBack(n)} style={{ flex: 1, paddingVertical: 9, borderRadius: 14, alignItems: 'center', backgroundColor: back === n ? T : 'rgba(255,255,255,.1)' }}><Text style={{ color: back === n ? '#06222a' : W, fontSize: 12, fontWeight: '800' }}>{l}</Text></Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 12 }}><Text style={{ flex: 1.2, color: 'rgba(255,255,255,.55)', fontSize: 11 }}> </Text><Text style={{ flex: 1, color: 'rgba(255,255,255,.55)', fontSize: 11, fontWeight: '700' }}>THEN</Text><Text style={{ flex: 1, color: 'rgba(255,255,255,.55)', fontSize: 11, fontWeight: '700' }}>NOW</Text></View>
      {rows.map((r) => (
        <View key={r.l} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.08)', marginTop: 4 }}>
          <Text style={{ flex: 1.2, color: DIM, fontSize: 12.5 }}>{r.l}</Text>
          <Text style={{ flex: 1, color: r.a ? W : 'rgba(255,255,255,.45)', fontSize: 12.5, fontWeight: '700' }}>{r.a || 'No record'}</Text>
          <Text style={{ flex: 1, color: r.b ? (r.up == null ? W : r.up ? '#7df0c6' : '#ff8fab') : 'rgba(255,255,255,.45)', fontSize: 12.5, fontWeight: '800' }}>{r.b || 'No record'}</Text>
        </View>
      ))}
      <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, marginTop: 8 }}>{then.days === 0 ? 'Nothing was logged around then. Try a shorter time back.' : !nowAny ? 'Nothing logged in the last 7 days.' : 'Averages use only the days that have a record.'}</Text>
    </Glass>
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
          {TPLS.map((t) => { const used = active.some((x) => x.e.tpl === t.id); return (
            <Pressable key={t.id} disabled={used} onPress={() => startExp(t.id)} style={{ marginTop: 8, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.09)', opacity: used ? 0.45 : 1 }}>
              <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{t.title}</Text>
              <Text style={{ color: DIM, fontSize: 11.5, marginTop: 2 }}>{t.days + ' days · ' + (used ? 'already running' : t.note)}</Text>
            </Pressable>); })}
          <Text style={{ color: '#ffd593', fontSize: 11, lineHeight: 15, marginTop: 10 }}>Only things the app already records can be counted: sleep, steps, water and mood.</Text>
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
