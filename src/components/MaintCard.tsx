import React, { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SG, Stop } from 'react-native-svg';
import { Glass } from './Glass';
import { Text } from './Txt';
import { Inp, DateField, todayStr, W } from './Ui';
import { Btn, Chip, Sq, Ext, Ren, renewStatus } from './RecordExtras';
import { Tk, taskState, odoEstimate } from '../lib/maintTasks';
import { cu } from '../lib/region';

const dim = 'rgba(255,255,255,.65)';
const COL = ['#7df0c6', '#ffd593', '#ffb3c6']; const BAR = ['#5ee7b5', '#ffc46b', '#ff8fab'];
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fdy = (s: string) => { const p = (s || '').split('-'); return p.length === 3 ? parseInt(p[2], 10) + ' ' + MO[parseInt(p[1], 10) - 1] + ' ' + p[0] : s; };
const fd = (s: string) => { const p = (s || '').split('-'); return p.length === 3 ? parseInt(p[2], 10) + ' ' + MO[parseInt(p[1], 10) - 1] : s; };
const BIKE: [string, number, number][] = [['Spray chain', 7, 0], ['Tyre pressure', 7, 0], ['Engine oil level', 14, 0], ['Wash', 14, 0]];
const BIKE_P: [string, number, number][] = [['Front tyre', 0, 15000], ['Rear tyre', 0, 12000], ['Battery', 0, 24000], ['Brake pads', 0, 12000], ['Chain and sprocket', 0, 20000], ['Spark plug', 0, 8000]];
const CAR_P: [string, number, number][] = [['Tyres', 0, 40000], ['Battery', 0, 36000], ['Brake pads', 0, 30000], ['Engine oil', 0, 10000], ['Air filter', 0, 15000]];
const CAR: [string, number, number][] = [['Tyre pressure', 14, 0], ['Engine oil level', 14, 0], ['Coolant level', 30, 0], ['Wipers and washer', 60, 0], ['Wash', 14, 0]];

// One card for the small jobs you repeat: chain, tyre pressure, oil level. Shows how long since, and how long until the next one.
export function MaintCard({ d, upd, latest, cat }: { d: Ext; upd: (fn: (x: any) => any) => void; latest: number; cat: string }) {
  const moto = !/car|van|truck|mpv|suv|sedan|kereta/i.test(cat);
  const [open, setOpen] = useState(false); const [nm, setNm] = useState(''); const [dy, setDy] = useState(''); const [km, setKm] = useState(''); const [dt, setDt] = useState(todayStr()); const [kind, setKind] = useState<'check' | 'part'>('check'); const [odAt, setOdAt] = useState('');
  const [all, setAll] = useState(false); const [doneId, setDoneId] = useState<number | null>(null); const [cost, setCost] = useState('');
  // Most urgent first, so the three shown are the ones that need you.
  const oe = odoEstimate(d); const odoNow = oe.odo;
  const list: Tk[] = (d.tasks || []).slice().sort((a, b) => { const x = taskState(a, odoNow, oe.est), y = taskState(b, odoNow, oe.est); return y.level - x.level || x.dueIn - y.dueIn; });
  const LIM = 3; const shown = all ? list : list.slice(0, LIM);
  const pick = (n: string, days: number, k: number) => { setNm(n); setDy(days ? String(days) : ''); setKm(k ? String(k) : ''); };
  const nDays = parseInt(dy, 10), nKm = parseInt(km, 10); const ok = !!nm.trim() && (nDays > 0 || nKm > 0) && !(nDays > 3650);
  const isToday = dt === todayStr();
  const save = () => { if (!ok) return; const typed = parseInt(odAt.replace(/[^0-9]/g, ''), 10); const base = typed > 0 ? typed : isToday && odoNow > 0 ? odoNow : undefined;
    upd((x) => ({ ...x, tasks: [...(x.tasks || []), { id: Date.now(), name: nm.trim(), kind, days: nDays > 0 ? nDays : undefined, km: nKm > 0 ? nKm : undefined, last: dt, odo: base, hist: [dt] }] })); setOpen(false); };
  // Parts saved before the lists were joined move into this list once.
  useEffect(() => { const ps: any[] = (d as any).parts || []; if (!ps.length) return;
    upd((x) => ({ ...x, parts: [], tasks: [...(x.tasks || []), ...(x.parts || []).map((p: any) => ({ id: p.id, name: p.name, kind: 'part', km: p.life, last: p.date, odo: p.odo, hist: [p.date] }))] })); }, [((d as any).parts || []).length]);
  const [od, setOd] = useState(''); const [odErr, setOdErr] = useState(''); const [fixOdo, setFixOdo] = useState(false);
  // Saves a real odometer reading (today). A reading lower than the last real one is refused, so the monthly mileage stays right.
  const saveOdo = (v: string): number | null => { const n = parseInt(v.replace(/[^0-9]/g, ''), 10); if (!(n > 0)) return null; if (n < oe.last) { setOdErr('That is lower than your last reading (' + oe.last.toLocaleString('en-MY') + ' km).'); return -1; }
    upd((x) => ({ ...x, readings: [...(x.readings || []), { id: Date.now(), date: todayStr(), odo: n }] })); setOdErr(''); return n; };
  const done = (t: Tk) => { const c = parseFloat(cost.replace(',', '.')); const today = todayStr();
    let base = odoNow; if (od.trim()) { const n = saveOdo(od); if (n === -1) return; if (n) base = n; }
    upd((x) => { return { ...x, tasks: (x.tasks || []).map((y: Tk) => { if (y.id !== t.id) return y; const h = (y.hist || []).slice(); if (y.last && h[0] !== y.last) h.unshift(y.last); if (h[0] !== today) h.unshift(today); return { ...y, last: today, odo: base > 0 ? base : y.odo, hist: Array.from(new Set(h)).slice(0, 8) }; }), exps: c > 0 ? [{ id: Date.now(), name: t.name, amt: c, date: today }, ...(x.exps || [])] : x.exps }; });
    setDoneId(null); setCost(''); setOd(''); };
  // Health: jobs, parts and renewals together. Green counts 1, yellow half, red 0.
  const items: { n: string; lv: 0 | 1 | 2; why: string; show: boolean }[] = [];
  list.forEach((t) => { const s = taskState(t, odoNow, oe.est); items.push({ n: t.name, lv: s.level, why: s.text.split(' · ')[0].toLowerCase(), show: true }); });
  const RK: [keyof Ren, string][] = [['roadtax', 'Road tax'], ['insurance', 'Insurance'], ['licence', 'Licence']];
  const rn: Ren = d.renew || {};
  RK.forEach(([k, n]) => { const s = rn[k]; if (!s) return; const r = renewStatus(s); items.push({ n, lv: (r.n < 0 ? 2 : r.n <= 30 ? 1 : 0) as 0 | 1 | 2, why: r.txt.toLowerCase(), show: false }); });
  const score = items.length ? Math.round((items.reduce((a, x) => a + (x.lv === 0 ? 1 : x.lv === 1 ? 0.5 : 0), 0) / items.length) * 100) : 0;
  const bad = items.filter((x) => x.lv > 0 && x.show).sort((a, b) => b.lv - a.lv).slice(0, 3);
  const RING = score >= 80 ? ['#5ee7b5', '#7c9cff'] : score >= 50 ? ['#ffc46b', '#ff8fab'] : ['#ff8fab', '#ff5d8f'];
  const word = !items.length ? 'Add a job to start' : score >= 80 ? 'In great shape' : score >= 50 ? 'Needs a little care' : 'Needs attention';
  const R = 46, CIR = 2 * Math.PI * R;
  // The ring fills up to the score, a little at a time.
  const [shownScore, setShownScore] = useState(0);
  useEffect(() => { let n = 0; const id = setInterval(() => { n += 1; setShownScore(Math.round(score * Math.min(1, n / 14))); if (n >= 14) clearInterval(id); }, 28); return () => clearInterval(id); }, [score]);
  const nOk = items.filter((x) => x.lv === 0).length, nSoon = items.filter((x) => x.lv === 1).length, nLate = items.filter((x) => x.lv === 2).length;
  const [ek, setEk] = useState<keyof Ren | ''>(''); const [ev, setEv] = useState(todayStr());
  const preset = kind === 'part' ? (moto ? BIKE_P : CAR_P) : moto ? BIKE : CAR;
  const Hd = ({ t, sub, right }: { t: string; sub?: string; right?: React.ReactNode }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
      <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 16, fontWeight: '800', letterSpacing: -0.2 }}>{t}</Text>{sub ? <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 11.5, marginTop: 2 }}>{sub}</Text> : null}</View>
      {right}
    </View>);
  const Line = () => <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0)', 'rgba(255,255,255,.22)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1, marginTop: 20, marginBottom: 12 }} />;
  const Stat = ({ n, l, c }: { n: number; l: string; c: string }) => (
    <View style={{ flex: 1, paddingVertical: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.36)', alignItems: 'center' }}>
      <Text style={{ color: c, fontSize: 18, fontWeight: '800' }}>{n}</Text>
      <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 10.5, fontWeight: '700', marginTop: 1 }}>{l}</Text>
    </View>);
  return (
    <Glass radius={32} style={{ marginTop: 12, padding: 18, overflow: 'hidden' }}>
      <LinearGradient pointerEvents="none" colors={['rgba(255,143,171,.30)', 'rgba(183,148,255,.16)', 'rgba(124,156,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 11, fontWeight: '800', letterSpacing: 2 }}>{(cat + ' score').toUpperCase()}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 }}>
        <View style={{ width: 128, height: 128, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={128} height={128} viewBox="0 0 128 128" style={{ position: 'absolute' }}>
            <Defs><SG id="rg" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={RING[0]} /><Stop offset="1" stopColor={RING[1]} /></SG></Defs>
            {Array.from({ length: 48 }, (_, i) => { const a = (i / 48) * Math.PI * 2; return <Circle key={i} cx={64 + Math.cos(a) * 60} cy={64 + Math.sin(a) * 60} r={i % 4 === 0 ? 1.6 : 0.9} fill="rgba(255,255,255,.35)" />; })}
            <Circle cx={64} cy={64} r={R} stroke="rgba(255,255,255,.12)" strokeWidth={12} fill="none" />
            {items.length ? <Circle cx={64} cy={64} r={R} stroke="url(#rg)" strokeOpacity={0.28} strokeWidth={20} strokeLinecap="round" fill="none" strokeDasharray={CIR} strokeDashoffset={CIR * (1 - shownScore / 100)} transform="rotate(-90 64 64)" /> : null}
            {items.length ? <Circle cx={64} cy={64} r={R} stroke="url(#rg)" strokeWidth={12} strokeLinecap="round" fill="none" strokeDasharray={CIR} strokeDashoffset={CIR * (1 - shownScore / 100)} transform="rotate(-90 64 64)" /> : null}
          </Svg>
          <Text style={{ color: W, fontSize: 31, fontWeight: '800', letterSpacing: -1 }}>{items.length ? shownScore + '%' : '-'}</Text>
          <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 9.5, fontWeight: '800', letterSpacing: 1.6, marginTop: -1 }}>HEALTH</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: W, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 }}>{word}</Text>
          <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 3, lineHeight: 16 }}>Jobs, parts and paperwork together</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {bad.length ? bad.map((x) => <View key={x.n} style={{ paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999, backgroundColor: x.lv === 2 ? 'rgba(255,143,171,.28)' : 'rgba(255,196,107,.24)' }}><Text style={{ color: x.lv === 2 ? '#ffc2d0' : '#ffe0a8', fontSize: 11, fontWeight: '700' }}>{x.n + ' · ' + x.why}</Text></View>)
              : items.length ? <View style={{ paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999, backgroundColor: 'rgba(94,231,181,.22)' }}><Text style={{ color: '#9af3d3', fontSize: 11, fontWeight: '700' }}>Everything is on track</Text></View> : null}
          </View>
        </View>
      </View>
      {items.length ? <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}><Stat n={nOk} l="On track" c="#7df0c6" /><Stat n={nSoon} l="Coming up" c="#ffd593" /><Stat n={nLate} l="Late" c="#ffb3c6" /></View> : null}

      <Line />
      <Hd t="Road tax, insurance and licence" sub="Tap one to set or change its date" />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        {RK.map(([k, label]) => { const st = renewStatus(rn[k]); const on = ek === k; return (
          <Pressable key={k} onPress={() => { setEv(rn[k] || todayStr()); setEk(on ? '' : k); }} accessibilityLabel={(rn[k] ? 'Edit ' : 'Set ') + label} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 20, backgroundColor: on ? 'rgba(255,255,255,.26)' : 'rgba(255,255,255,.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.36)' }}>
            <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, fontWeight: '700' }}>{label}</Text>
            <Text style={{ color: rn[k] ? st.col : W, fontSize: 16, fontWeight: '800', marginTop: 5 }} numberOfLines={1} adjustsFontSizeToFit>{rn[k] ? (st.n < 0 ? 'Expired' : st.n + (st.n === 1 ? ' day' : ' days')) : '+ Set'}</Text>
            <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 10.5, marginTop: 2 }} numberOfLines={1}>{rn[k] ? fdy(rn[k] as string) : 'No date yet'}</Text>
          </Pressable>); })}
      </View>
      {ek ? (
        <View style={{ marginTop: 10, gap: 8 }}>
          <Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{RK.find((x) => x[0] === ek)![1] + ' expires on'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><DateField value={ev} onChange={setEv} style={{ flex: 1 }} /><Btn t="Save" onPress={() => { upd((x) => ({ ...x, renew: { ...(x.renew || {}), [ek]: ev } })); setEk(''); }} /></View>
        </View>
      ) : null}

      <Line />
      <Hd t="Maintenance tasks" sub="Repeat jobs and parts in one list" right={!open ? <Btn t="+ Add task" h={36} w={14} onPress={() => { setOpen(true); setNm(''); setDy(''); setKm(''); setOdAt(''); setKind('check'); setDt(todayStr()); }} /> : undefined} />
      {oe.odo > 0 || list.some((t) => t.km) ? (
        <View style={{ marginTop: 14, paddingVertical: 16, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.36)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 11.5, fontWeight: '700', letterSpacing: 0.3 }}>{oe.est ? 'Odometer now (estimate)' : 'Odometer'}</Text>
              <Text style={{ color: W, fontSize: 22, fontWeight: '800', marginTop: 8 }}>{oe.odo > 0 ? (oe.est ? '~' : '') + oe.odo.toLocaleString('en-MY') + ' km' : 'No reading yet'}</Text>
              {oe.est ? <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, lineHeight: 16, marginTop: 8 }}>{'From your average of about ' + Math.round(oe.perDay) + ' km a day since ' + oe.lastDate.split('-').reverse().join('/') + '.'}</Text> : null}
            </View>
            <Pressable onPress={() => { setFixOdo(!fixOdo); setOd(''); setOdErr(''); }} accessibilityLabel="Correct odometer" style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(94,231,181,.3)', borderWidth: 1, borderColor: 'rgba(94,231,181,.45)' }}><Text style={{ color: '#b6f7de', fontSize: 12.5, fontWeight: '800' }}>{fixOdo ? 'Close' : oe.est ? 'Correct' : 'Update'}</Text></Pressable>
          </View>
          {fixOdo ? (
            <View style={{ marginTop: 10, gap: 6 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}><Inp style={{ flex: 1 }} keyboardType="number-pad" value={od} onChangeText={(v: string) => { setOd(v); setOdErr(''); }} placeholder="What your meter shows now (km)" onSubmitEditing={() => { const n = saveOdo(od); if (n && n > 0) { setFixOdo(false); setOd(''); } }} /><Btn t="Save" h={42} w={16} onPress={() => { const n = saveOdo(od); if (n && n > 0) { setFixOdo(false); setOd(''); } }} /></View>
              {odErr ? <Text style={{ color: '#ffb3c6', fontSize: 11.5 }}>{odErr}</Text> : null}
            </View>
          ) : null}
        </View>
      ) : null}
      {open ? (
        <View style={{ marginTop: 12, gap: 10, padding: 14, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.36)' }}>
          <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.25)' }}>
            {([['check', 'Repeat job'], ['part', 'Replace a part']] as const).map(([k, l]) => (
              <Pressable key={k} onPress={() => { setKind(k); setNm(''); setDy(''); setKm(''); }} style={{ flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center', backgroundColor: kind === k ? 'rgba(183,148,255,.55)' : 'transparent' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>{l}</Text></Pressable>))}
          </View>
          <View><Text style={{ color: dim, fontSize: 11.5, marginBottom: 6 }}>{kind === 'part' ? 'Part' : 'Job'}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>{preset.map(([n, a, b]) => <Chip key={n} t={n} on={nm === n} onPress={() => pick(n, a, b)} />)}</View>
            <Inp value={nm} onChangeText={setNm} placeholder={kind === 'part' ? 'Or type your own part' : 'Or type your own job'} /></View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Text style={{ color: dim, fontSize: 11.5, marginBottom: 4 }}>{kind === 'part' ? 'Lasts about (km)' : 'Repeat every (days)'}</Text><Inp keyboardType="number-pad" value={kind === 'part' ? km : dy} onChangeText={kind === 'part' ? setKm : setDy} placeholder={kind === 'part' ? 'e.g. 12000' : 'e.g. 7'} /></View>
            <View style={{ flex: 1 }}><Text style={{ color: dim, fontSize: 11.5, marginBottom: 4 }}>{kind === 'part' ? 'or (days), optional' : 'or every (km), optional'}</Text><Inp keyboardType="number-pad" value={kind === 'part' ? dy : km} onChangeText={kind === 'part' ? setDy : setKm} placeholder={kind === 'part' ? 'e.g. 730' : 'e.g. 500'} /></View>
          </View>
          <View><Text style={{ color: dim, fontSize: 11.5, marginBottom: 4 }}>{kind === 'part' ? 'Date changed' : 'Last done'}</Text><DateField value={dt} onChange={setDt} /></View>
          <View><Text style={{ color: dim, fontSize: 11.5, marginBottom: 4 }}>{isToday ? 'Odometer that day (km), optional' : 'Odometer that day (km)'}</Text><Inp keyboardType="number-pad" value={odAt} onChangeText={setOdAt} placeholder={isToday && odoNow > 0 ? 'Leave empty to use ' + (oe.est ? '~' : '') + odoNow.toLocaleString('en-MY') : 'What the meter showed'} /></View>
          <Text style={{ color: dim, fontSize: 11.5, lineHeight: 16 }}>{'It is due when the days pass or the km are reached, whichever comes first.' + (!isToday ? ' For an earlier date, type the odometer from that day so the km can be counted.' : '')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}><View style={{ opacity: ok ? 1 : 0.5 }}><Btn t={kind === 'part' ? 'Save part' : 'Save job'} onPress={save} /></View><Pressable onPress={() => setOpen(false)} style={{ height: 42, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontWeight: '700' }}>Cancel</Text></Pressable></View>
        </View>
      ) : null}
      {list.length === 0 && !open ? <Text style={{ marginTop: 10, color: dim, fontSize: 12, lineHeight: 18 }}>Nothing here yet. Tap + Add task. Choose Repeat job for Spray chain or Tyre pressure, or Replace a part for tyres, battery and brake pads. My Record counts the days and km for you.</Text> : null}
      <View>
        {shown.map((t, i) => {
          const s = taskState(t, odoNow, oe.est); const hist = (t.hist || []).filter((x) => x !== t.last).slice(0, 3); const pr = s.text.split(' · ');
          return (
            <View key={t.id} style={{ marginTop: i === 0 ? 12 : 10, borderRadius: 24, backgroundColor: 'rgba(255,255,255,.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.36)', padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: BAR[s.level] }} />
                <Text style={{ flex: 1, color: W, fontSize: 17, fontWeight: '800' }} numberOfLines={1}>{t.name}</Text>
                <View style={{ paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, backgroundColor: s.level === 2 ? 'rgba(255,143,171,.26)' : s.level === 1 ? 'rgba(255,196,107,.22)' : 'rgba(94,231,181,.18)' }}><Text style={{ color: COL[s.level], fontSize: 12, fontWeight: '800' }}>{pr[0]}</Text></View>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 14 }}>
                {[
                  [t.kind === 'part' ? 'Changed' : 'Last done', fd(t.last)],
                  ['Since', s.since === 0 ? 'Today' : s.since + (s.since === 1 ? ' day' : ' days')],
                  [t.kind === 'part' ? 'Lasts' : 'Every', [t.days ? t.days + (t.days === 1 ? ' day' : ' days') : '', t.km ? t.km.toLocaleString('en-MY') + ' km' : ''].filter(Boolean).join('\n')],
                ].map((c, k) => (
                  <View key={c[0]} style={{ flex: 1, paddingLeft: k === 0 ? 0 : 12, borderLeftWidth: k === 0 ? 0 : 1, borderLeftColor: 'rgba(255,255,255,.12)' }}>
                    <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 10.5, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }}>{c[0]}</Text>
                    <Text style={{ color: W, fontSize: 14, fontWeight: '800', marginTop: 3 }} numberOfLines={2}>{c[1]}</Text>
                  </View>
                ))}
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.12)', marginTop: 14, overflow: 'hidden' }}><View style={{ width: Math.round(s.frac * 100) + '%', height: '100%', borderRadius: 3, backgroundColor: BAR[s.level] }} /></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10 }}>
                <Text style={{ flex: 1, color: 'rgba(255,255,255,.6)', fontSize: 12 }} numberOfLines={1}>{pr[1] ? pr[1] : hist.length ? 'Before: ' + hist.map(fd).join(', ') : ''}</Text>
                <Pressable onPress={() => upd((x) => ({ ...x, tasks: (x.tasks || []).filter((y: Tk) => y.id !== t.id) }))} accessibilityLabel={'Delete ' + t.name} style={{ paddingVertical: 9, paddingHorizontal: 6 }}><Text style={{ color: '#ff9aa9', fontSize: 12.5, fontWeight: '700' }}>Remove</Text></Pressable>
                <Pressable onPress={() => { setDoneId(doneId === t.id ? null : t.id); setCost(''); }} accessibilityLabel={'Mark ' + t.name + (t.kind === 'part' ? ' changed today' : ' done today')} style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 999, backgroundColor: 'rgba(94,231,181,.3)' }}><Text style={{ color: '#b6f7de', fontSize: 13, fontWeight: '800' }}>{t.kind === 'part' ? 'Changed today' : 'Done today'}</Text></Pressable>
              </View>
                {doneId === t.id ? (
                  <View style={{ marginTop: 10, gap: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Inp style={{ flex: 1 }} keyboardType="decimal-pad" value={cost} onChangeText={setCost} placeholder={'Cost (' + cu() + ')'} />
                      <Inp style={{ flex: 1 }} keyboardType="number-pad" value={od} onChangeText={(v: string) => { setOd(v); setOdErr(''); }} placeholder="Odometer km" onSubmitEditing={() => done(t)} />
                    </View>
                    {odErr ? <Text style={{ color: '#ffb3c6', fontSize: 11.5 }}>{odErr}</Text> : <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11 }}>Cost and odometer are optional. Type the odometer to correct the km count.</Text>}
                    <View style={{ alignSelf: 'flex-start' }}><Btn t="Save" h={40} w={22} onPress={() => done(t)} /></View>
                  </View>
                ) : null}
            </View>
          );
        })}
      </View>
      {list.length > LIM ? <Pressable onPress={() => setAll(!all)} accessibilityLabel={all ? 'See fewer tasks' : 'See more tasks'} style={{ alignSelf: 'center', marginTop: 8, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{all ? 'See less' : 'See more · ' + (list.length - LIM) + ' more'}</Text></Pressable> : null}
      {list.length > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <Text style={{ flex: 1, color: dim, fontSize: 11.5 }}>Remind me when a task is due</Text>
          <Chip t="On" on={d.trem !== false} onPress={() => upd((x) => ({ ...x, trem: true }))} /><Chip t="Off" on={d.trem === false} onPress={() => upd((x) => ({ ...x, trem: false }))} />
        </View>
      ) : null}
      {list.length > 0 && d.trem !== false ? <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 6 }}>The reminder comes at 9 am with a Done button. A cost you type is added to Spending.</Text> : null}
    </Glass>
  );
}
