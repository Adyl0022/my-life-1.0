import React, { useState, useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { Pressable } from './Press';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SG, Stop } from 'react-native-svg';
import { Glass } from './Glass';
import { Text } from './Txt';
import { Inp, DateField, todayStr, W } from './Ui';
import { Btn, Chip, Sq, Ext, Ren, renewStatus } from './RecordExtras';
import { Tk, taskState, odoEstimate } from '../lib/maintTasks';
import { cu } from '../lib/region';

import { confirmDelete } from '../lib/dialog';
import { pn, pi, tryForm } from '../lib/num';
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
  const nDays = pi(dy), nKm = pi(km, { max: 2000000 }); const ok = !!nm.trim() && (nDays > 0 || nKm > 0) && !(nDays > 3650);
  const isToday = dt === todayStr();
  const save = () => { if (!ok) { if (!(nDays > 0 || nKm > 0)) tryForm('task'); return; } const typed = parseInt(odAt.replace(/[^0-9]/g, ''), 10); const base = typed > 0 ? typed : isToday && odoNow > 0 ? odoNow : undefined;
    upd((x) => ({ ...x, tasks: [...(x.tasks || []), { id: Date.now(), name: nm.trim(), kind, days: nDays > 0 ? nDays : undefined, km: nKm > 0 ? nKm : undefined, last: dt, odo: base, hist: [dt] }] })); setOpen(false); };
  // Parts saved before the lists were joined move into this list once.
  useEffect(() => { const ps: any[] = (d as any).parts || []; if (!ps.length) return;
    upd((x) => ({ ...x, parts: [], tasks: [...(x.tasks || []), ...(x.parts || []).map((p: any) => ({ id: p.id, name: p.name, kind: 'part', km: p.life, last: p.date, odo: p.odo, hist: [p.date] }))] })); }, [((d as any).parts || []).length]);
  const [od, setOd] = useState(''); const [odErr, setOdErr] = useState(''); const [fixOdo, setFixOdo] = useState(false);
  // Saves a real odometer reading (today). A reading lower than the last real one is refused, so the monthly mileage stays right.
  // A reading typed on the estimate card is kept in its own list for the estimate. It goes into Monthly or Yearly Mileage only when you choose, so weekly updates do not fill those lists. A second reading on the same day replaces the first.
  const [toM, setToM] = useState(false); const [toY, setToY] = useState(false);
  const saveOdo = (v: string, toMonthly = false, toYearly = false): number | null => { const n = pi(v, { max: 2000000 }); if (!(n > 0)) { if (v.trim()) setOdErr('Not a valid number'); return null; } const t0 = todayStr();
    const dd: any = d;
    const other = Math.max(0, ...(dd.readings || []).filter((r: any) => r.date !== t0).map((r: any) => r.odo || 0), ...(dd.yreadings || []).filter((r: any) => !toYearly || r.date !== t0).map((r: any) => r.odo || 0), ...(dd.oreadings || []).filter((r: any) => r.date !== t0).map((r: any) => r.odo || 0), ...(dd.fuel || []).map((f: any) => f.odo || 0));
    if (n < other) { setOdErr('That is lower than your last reading (' + other.toLocaleString('en-MY') + ' km).'); return -1; }
    const put = (a: any[] | undefined) => [...(a || []).filter((r: any) => r.date !== t0), { id: Date.now(), date: t0, odo: n }];
    upd((x: any) => ({ ...x, oreadings: put(x.oreadings), ...(toMonthly ? { readings: put(x.readings) } : {}), ...(toYearly ? { yreadings: put(x.yreadings) } : {}) })); setOdErr(''); return n; };
  const lastQ: any = (((d as any).oreadings || []) as any[]).slice().sort((a: any, b: any) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.odo - a.odo))[0];
  const done = (t: Tk) => { const c = pn(cost); const today = todayStr();
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
  const R = 47, CIR = 2 * Math.PI * R;
  // The ring fills up to the score, a little at a time.
  const [shownScore, setShownScore] = useState(0);
  useEffect(() => { let n = 0; const id = setInterval(() => { n += 1; setShownScore(Math.round(score * Math.min(1, n / 36))); if (n >= 36) clearInterval(id); }, 26); return () => clearInterval(id); }, [score]);
  const spin = useRef(new Animated.Value(0)).current; const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 28000, easing: Easing.linear, useNativeDriver: true }));
    const b = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.timing(pulse, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })]));
    a.start(); b.start(); return () => { a.stop(); b.stop(); };
  }, [spin, pulse]);
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
          <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 112, height: 112, borderRadius: 56, backgroundColor: RING[0], opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.10, 0.30] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.12] }) }] }} />
          <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 128, height: 128, transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
            <Svg width={128} height={128} viewBox="0 0 128 128">
              {Array.from({ length: 48 }, (_, i) => { const a = (i / 48) * Math.PI * 2; return <Circle key={i} cx={64 + Math.cos(a) * 60} cy={64 + Math.sin(a) * 60} r={i % 4 === 0 ? 1.8 : 0.9} fill="rgba(255,255,255,.4)" />; })}
            </Svg>
          </Animated.View>
          <Svg width={128} height={128} viewBox="0 0 128 128" style={{ position: 'absolute' }}>
            <Defs><SG id="rg" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={RING[0]} /><Stop offset="1" stopColor={RING[1]} /></SG></Defs>
            <Circle cx={64} cy={64} r={R} stroke="rgba(255,255,255,.12)" strokeWidth={10} fill="none" />
            {items.length ? <Circle cx={64} cy={64} r={R} stroke="url(#rg)" strokeOpacity={0.3} strokeWidth={18} strokeLinecap="round" fill="none" strokeDasharray={CIR} strokeDashoffset={CIR * (1 - shownScore / 100)} transform="rotate(-90 64 64)" /> : null}
            {items.length ? <Circle cx={64} cy={64} r={R} stroke="url(#rg)" strokeWidth={10} strokeLinecap="round" fill="none" strokeDasharray={CIR} strokeDashoffset={CIR * (1 - shownScore / 100)} transform="rotate(-90 64 64)" /> : null}
          </Svg>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={{ color: W, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>{items.length ? shownScore : '-'}</Text>
            {items.length ? <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, fontWeight: '800', marginTop: 4, marginLeft: 1 }}>%</Text> : null}
          </View>
          <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 9, fontWeight: '800', letterSpacing: 1.6, marginTop: -2 }}>HEALTH</Text>
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
      <View style={{ marginTop: 10, gap: 8 }}>
        {RK.map(([k, label]) => { const st = renewStatus(rn[k]); const on = ek === k; const has = !!rn[k]; const gone = has && st.n < 0;
          const sub = !has ? 'Add the expiry date to get a reminder' : gone ? 'Expired on ' + fdy(rn[k] as string) + '. Renew it soon.' : 'Expires on ' + fdy(rn[k] as string);
          return (
          <Pressable key={k} onPress={() => { setEv(rn[k] || todayStr()); setEk(on ? '' : k); }} accessibilityLabel={(has ? 'Edit ' : 'Set ') + label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, backgroundColor: on ? 'rgba(255,255,255,.26)' : 'rgba(255,255,255,.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.36)' }}>
            <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: has ? st.col : 'rgba(255,255,255,.3)' }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>{label}</Text>
              <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 11.5, lineHeight: 16, marginTop: 2 }}>{sub}</Text>
            </View>
            {has ? (
              <View style={{ alignItems: 'center', minWidth: 58 }}>
                <Text style={{ color: st.col, fontSize: gone ? 15 : 22, fontWeight: '800', lineHeight: 26 }}>{gone ? 'Expired' : st.n}</Text>
                {gone ? null : <Text style={{ color: st.col, fontSize: 10.5, fontWeight: '700' }}>{st.n === 1 ? 'day left' : 'days left'}</Text>}
              </View>
            ) : (
              <View style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.2)' }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>+ Set</Text></View>
            )}
          </Pressable>); })}
      </View>
      {ek ? (
        <View style={{ marginTop: 10, gap: 8 }}>
          <Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{RK.find((x) => x[0] === ek)![1] + ' expires on'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><DateField value={ev} onChange={setEv} style={{ flex: 1 }} /><Btn t="Save" onPress={() => { upd((x) => ({ ...x, renew: { ...(x.renew || {}), [ek]: ev } })); setEk(''); }} /></View>
        </View>
      ) : null}

      <Line />
      {oe.odo > 0 || list.some((t) => t.km) ? (<>
        <View style={{ marginTop: 14 }}><Hd t="Odometer" sub="Your meter reading for service countdowns" /></View>
        <View style={{ marginTop: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.36)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 11.5, fontWeight: '700', letterSpacing: 0.3 }}>{oe.est ? 'Odometer now (estimate)' : oe.odo > 0 ? 'Odometer now (actual)' : 'Odometer'}</Text>
              <Text style={{ color: W, fontSize: 22, fontWeight: '800', marginTop: 8 }}>{oe.odo > 0 ? (oe.est ? '~' : '') + oe.odo.toLocaleString('en-MY') + ' km' : 'No reading yet'}</Text>
              {!oe.est && oe.odo > 0 && oe.lastDate ? <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, lineHeight: 16, marginTop: 8 }}>{'What your meter or fuel log showed on ' + oe.lastDate.split('-').reverse().join('/') + '.'}</Text> : null}
              {oe.est ? <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, lineHeight: 16, marginTop: 8 }}>{'From about ' + Math.round(oe.perDay) + ' km a day over the ' + 'last ' + oe.span + ' days' + ' before ' + oe.lastDate.split('-').reverse().join('/') + '. Days you do not ride are counted. Type a new reading to make it exact.'}</Text> : null}
            </View>
            <Pressable onPress={() => { setFixOdo(!fixOdo); setOd(''); setOdErr(''); }} accessibilityLabel="Update odometer" style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(94,231,181,.3)', borderWidth: 1, borderColor: 'rgba(94,231,181,.45)' }}><Text style={{ color: '#b6f7de', fontSize: 12.5, fontWeight: '800' }}>{fixOdo ? 'Close' : 'Update'}</Text></Pressable>
          </View>
          {fixOdo ? (
            <View style={{ marginTop: 10, gap: 6 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}><Inp style={{ flex: 1 }} keyboardType="number-pad" bad={odErr || undefined} value={od} onChangeText={(v: string) => { setOd(v); setOdErr(''); }} placeholder="Meter reading now (km)" onSubmitEditing={() => { const n = saveOdo(od, toM, toY); if (n && n > 0) { setFixOdo(false); setOd(''); setToM(false); setToY(false); } }} /><Btn t="Save" h={42} w={16} onPress={() => { const n = saveOdo(od, toM, toY); if (n && n > 0) { setFixOdo(false); setOd(''); setToM(false); setToY(false); } }} /></View>
              <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, marginTop: 2 }}>Also add this reading to:</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}><Chip t="Monthly Mileage" on={toM} onPress={() => setToM(!toM)} /><Chip t="Yearly Mileage" on={toY} onPress={() => setToY(!toY)} /></View>
              {lastQ ? <Pressable onPress={() => confirmDelete('last reading', () => upd((x: any) => ({ ...x, oreadings: (x.oreadings || []).filter((r: any) => r.id !== lastQ.id) })), { title: 'Remove this reading?', message: lastQ.odo.toLocaleString('en-MY') + ' km from the estimate card is removed. Monthly and Yearly Mileage are not changed.', yes: 'Remove' })} accessibilityLabel="Remove last reading from the estimate" style={{ alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,143,171,.16)', borderWidth: 1, borderColor: 'rgba(255,143,171,.4)' }}><Text style={{ color: '#ffb3c6', fontSize: 12, fontWeight: '800' }}>{'Remove my last reading (' + lastQ.odo.toLocaleString('en-MY') + ' km)'}</Text></Pressable> : null}
              {odErr ? <Text style={{ color: '#ffb3c6', fontSize: 11.5 }}>{odErr}</Text> : <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, lineHeight: 15 }}>Updates the estimate. Tap Monthly or Yearly to count it there too.</Text>}
            </View>
          ) : null}
        </View>
      </>) : null}
      <View style={{ marginTop: 14 }}><Hd t="Maintenance tasks" sub="Repeat jobs and parts in one list" right={!open ? <Btn t="+ Add task" h={36} w={14} onPress={() => { setOpen(true); setNm(''); setDy(''); setKm(''); setOdAt(''); setKind('check'); setDt(todayStr()); }} /> : undefined} /></View>
      {open ? (
        <View style={{ marginTop: 10, gap: 8, padding: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.36)' }}>
          <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.25)' }}>
            {([['check', 'Repeat job'], ['part', 'Replace a part']] as const).map(([k, l]) => (
              <Pressable key={k} onPress={() => { setKind(k); setNm(''); setDy(''); setKm(''); }} style={{ flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center', backgroundColor: kind === k ? 'rgba(183,148,255,.55)' : 'transparent' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>{l}</Text></Pressable>))}
          </View>
          <View><Text style={{ color: dim, fontSize: 11.5, marginBottom: 6 }}>{kind === 'part' ? 'Part' : 'Job'}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>{preset.map(([n, a, b]) => <Chip key={n} t={n} on={nm === n} onPress={() => pick(n, a, b)} />)}</View>
            <Inp value={nm} onChangeText={setNm} placeholder={kind === 'part' ? 'Or type your own part' : 'Or type your own job'} /></View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Text style={{ color: dim, fontSize: 11.5, marginBottom: 4 }}>{kind === 'part' ? 'Lasts about (km)' : 'Repeat every (days)'}</Text><Inp form="task" need="the days or the km" keyboardType="number-pad" value={kind === 'part' ? km : dy} onChangeText={kind === 'part' ? setKm : setDy} placeholder={kind === 'part' ? 'e.g. 12000' : 'e.g. 7'} /></View>
            <View style={{ flex: 1 }}><Text style={{ color: dim, fontSize: 11.5, marginBottom: 4 }}>{kind === 'part' ? 'or (days), optional' : 'or every (km), optional'}</Text><Inp form="task" need="the days or the km" keyboardType="number-pad" value={kind === 'part' ? dy : km} onChangeText={kind === 'part' ? setDy : setKm} placeholder={kind === 'part' ? 'e.g. 730' : 'e.g. 500'} /></View>
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
            <View key={t.id} style={{ marginTop: i === 0 ? 10 : 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.36)', paddingVertical: 9, paddingHorizontal: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: BAR[s.level] }} />
                <Text style={{ flex: 1, color: W, fontSize: 14, fontWeight: '800' }} numberOfLines={1}>{t.name}</Text>
                <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, backgroundColor: s.level === 2 ? 'rgba(255,143,171,.26)' : s.level === 1 ? 'rgba(255,196,107,.22)' : 'rgba(94,231,181,.18)' }}><Text style={{ color: COL[s.level], fontSize: 10.5, fontWeight: '800' }}>{pr[0]}</Text></View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
                <Text style={{ flex: 1, color: 'rgba(255,255,255,.72)', fontSize: 11.5 }} numberOfLines={1}>{(t.kind === 'part' ? 'Changed ' : 'Last ') + fd(t.last) + (s.since === 0 ? ' · today' : ' · ' + s.since + (s.since === 1 ? ' day ago' : ' days ago'))}</Text>
                <Pressable onPress={() => { setDoneId(doneId === t.id ? null : t.id); setCost(''); }} accessibilityLabel={'Mark ' + t.name + (t.kind === 'part' ? ' changed today' : ' done today')} style={{ paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(94,231,181,.3)' }}><Text style={{ color: '#b6f7de', fontSize: 11.5, fontWeight: '800' }}>{t.kind === 'part' ? 'Changed today' : 'Done today'}</Text></Pressable>
              </View>
              <View style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,.12)', marginTop: 7, overflow: 'hidden' }}><View style={{ width: Math.round(s.frac * 100) + '%', height: '100%', borderRadius: 2, backgroundColor: BAR[s.level] }} /></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 8 }}>
                <Text style={{ flex: 1, color: 'rgba(255,255,255,.55)', fontSize: 10.5 }} numberOfLines={1}>{[(t.kind === 'part' ? 'Lasts ' : 'Every ') + [t.days ? t.days + (t.days === 1 ? ' day' : ' days') : '', t.km ? t.km.toLocaleString('en-MY') + ' km' : ''].filter(Boolean).join(' / '), pr[1] || ''].filter(Boolean).join(' · ')}</Text>
                <Pressable onPress={() => confirmDelete(t.name, () => upd((x) => ({ ...x, tasks: (x.tasks || []).filter((y: Tk) => y.id !== t.id) })), { title: 'Remove ' + t.name + '?', message: 'Its history is removed too. This cannot be undone.', yes: 'Remove' })} accessibilityLabel={'Delete ' + t.name} style={{ paddingVertical: 4, paddingHorizontal: 2 }}><Text style={{ color: '#ff9aa9', fontSize: 10.5, fontWeight: '700' }}>Remove</Text></Pressable>
              </View>
                {doneId === t.id ? (
                  <View style={{ marginTop: 10, gap: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Inp style={{ flex: 1 }} keyboardType="decimal-pad" value={cost} onChangeText={setCost} placeholder={'Cost (' + cu() + ')'} />
                      <Inp style={{ flex: 1 }} keyboardType="number-pad" bad={odErr || undefined} value={od} onChangeText={(v: string) => { setOd(v); setOdErr(''); }} placeholder="Odometer km" onSubmitEditing={() => done(t)} />
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
