import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SG, Stop } from 'react-native-svg';
import { Glass } from './Glass';
import { Text } from './Txt';
import { Inp, DateField, todayStr, W } from './Ui';
import { Btn, Chip, Sq, Ext, Pt, Ren, renewStatus } from './RecordExtras';
import { Tk, taskState } from '../lib/maintTasks';
import { cu } from '../lib/region';

const dim = 'rgba(255,255,255,.65)';
const COL = ['#7df0c6', '#ffd593', '#ffb3c6']; const BAR = ['#5ee7b5', '#ffc46b', '#ff8fab'];
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fd = (s: string) => { const p = (s || '').split('-'); return p.length === 3 ? parseInt(p[2], 10) + ' ' + MO[parseInt(p[1], 10) - 1] : s; };
const BIKE: [string, number, number][] = [['Spray chain', 7, 500], ['Tyre pressure', 7, 0], ['Engine oil level', 14, 0], ['Wash', 14, 0]];
const CAR: [string, number, number][] = [['Tyre pressure', 14, 0], ['Engine oil level', 14, 0], ['Coolant level', 30, 0], ['Wipers and washer', 60, 0], ['Wash', 14, 0]];

// One card for the small jobs you repeat: chain, tyre pressure, oil level. Shows how long since, and how long until the next one.
export function MaintCard({ d, upd, latest, cat }: { d: Ext; upd: (fn: (x: any) => any) => void; latest: number; cat: string }) {
  const moto = !/car|van|truck|mpv|suv|sedan|kereta/i.test(cat);
  const [open, setOpen] = useState(false); const [nm, setNm] = useState(''); const [dy, setDy] = useState(''); const [km, setKm] = useState(''); const [dt, setDt] = useState(todayStr());
  const [all, setAll] = useState(false); const [doneId, setDoneId] = useState<number | null>(null); const [cost, setCost] = useState('');
  // Most urgent first, so the three shown are the ones that need you.
  const list: Tk[] = (d.tasks || []).slice().sort((a, b) => { const x = taskState(a, latest), y = taskState(b, latest); return y.level - x.level || x.dueIn - y.dueIn; });
  const LIM = 3; const shown = all ? list : list.slice(0, LIM); const parts: Pt[] = d.parts || [];
  const pick = (n: string, days: number, k: number) => { setNm(n); setDy(String(days)); setKm(k ? String(k) : ''); };
  const nDays = parseInt(dy, 10); const ok = !!nm.trim() && nDays > 0 && nDays <= 365;
  const save = () => { if (!ok) return; const k = parseInt(km, 10);
    upd((x) => ({ ...x, tasks: [...(x.tasks || []), { id: Date.now(), name: nm.trim(), days: nDays, km: k > 0 ? k : undefined, last: dt, odo: latest > 0 ? latest : undefined, hist: [dt] }] })); setOpen(false); };
  const done = (t: Tk) => { const c = parseFloat(cost.replace(',', '.')); const today = todayStr();
    upd((x) => { return { ...x, tasks: (x.tasks || []).map((y: Tk) => { if (y.id !== t.id) return y; const h = (y.hist || []).slice(); if (y.last && h[0] !== y.last) h.unshift(y.last); if (h[0] !== today) h.unshift(today); return { ...y, last: today, odo: latest > 0 ? latest : y.odo, hist: Array.from(new Set(h)).slice(0, 8) }; }), exps: c > 0 ? [{ id: Date.now(), name: t.name, amt: c, date: today }, ...(x.exps || [])] : x.exps }; });
    setDoneId(null); setCost(''); };
  // Health: tasks, parts and renewals together. Green counts 1, yellow half, red 0.
  const items: { n: string; lv: 0 | 1 | 2; why: string; show: boolean }[] = [];
  list.forEach((t) => { const s = taskState(t, latest); items.push({ n: t.name, lv: s.level, why: s.text.split(' · ')[0].toLowerCase(), show: true }); });
  if (latest > 0) parts.forEach((p) => { const left = p.life - Math.max(0, latest - p.odo); const lv = left < 0 ? 2 : left <= p.life * 0.15 ? 1 : 0; items.push({ n: p.name, lv: lv as 0 | 1 | 2, why: left < 0 ? 'change it' : left + ' km left', show: true }); });
  const RK: [keyof Ren, string][] = [['roadtax', 'Road tax'], ['insurance', 'Insurance'], ['licence', 'Licence']];
  const rn: Ren = d.renew || {};
  RK.forEach(([k, n]) => { const s = rn[k]; if (!s) return; const r = renewStatus(s); items.push({ n, lv: (r.n < 0 ? 2 : r.n <= 30 ? 1 : 0) as 0 | 1 | 2, why: r.txt.toLowerCase(), show: false }); });
  const score = items.length ? Math.round((items.reduce((a, x) => a + (x.lv === 0 ? 1 : x.lv === 1 ? 0.5 : 0), 0) / items.length) * 100) : 0;
  const bad = items.filter((x) => x.lv > 0 && x.show).sort((a, b) => b.lv - a.lv).slice(0, 3);
  const RING = score >= 80 ? ['#5ee7b5', '#7c9cff'] : score >= 50 ? ['#ffc46b', '#ff8fab'] : ['#ff8fab', '#ff5d8f'];
  const word = !items.length ? 'Add a job to start' : score >= 80 ? 'In great shape' : score >= 50 ? 'Needs a little care' : 'Needs attention';
  const R = 40, CIR = 2 * Math.PI * R;
  const [ek, setEk] = useState<keyof Ren | ''>(''); const [ev, setEv] = useState(todayStr());
  const preset = moto ? BIKE : CAR;
  return (
    <Glass radius={30} style={{ marginTop: 12, padding: 18, overflow: 'hidden' }}>
      <LinearGradient pointerEvents="none" colors={['rgba(255,143,171,.26)', 'rgba(183,148,255,.14)', 'rgba(183,148,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, fontWeight: '800', letterSpacing: 1.6 }}>{(cat + ' score').toUpperCase()}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
        <View style={{ width: 104, height: 104, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={104} height={104} viewBox="0 0 104 104" style={{ position: 'absolute' }}>
            <Defs><SG id="rg" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={RING[0]} /><Stop offset="1" stopColor={RING[1]} /></SG></Defs>
            <Circle cx={52} cy={52} r={R} stroke="rgba(255,255,255,.14)" strokeWidth={10} fill="none" />
            {items.length ? <Circle cx={52} cy={52} r={R} stroke="url(#rg)" strokeWidth={10} strokeLinecap="round" fill="none" strokeDasharray={CIR} strokeDashoffset={CIR * (1 - score / 100)} transform="rotate(-90 52 52)" /> : null}
          </Svg>
          <Text style={{ color: W, fontSize: 27, fontWeight: '800' }}>{items.length ? score + '%' : '-'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: W, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 }}>{word}</Text>
          <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 3 }}>Jobs, parts and paperwork together</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {bad.length ? bad.map((x) => <View key={x.n} style={{ paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999, backgroundColor: x.lv === 2 ? 'rgba(255,143,171,.28)' : 'rgba(255,196,107,.24)' }}><Text style={{ color: x.lv === 2 ? '#ffc2d0' : '#ffe0a8', fontSize: 11, fontWeight: '700' }}>{x.n + ' · ' + x.why}</Text></View>)
              : items.length ? <View style={{ paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999, backgroundColor: 'rgba(94,231,181,.22)' }}><Text style={{ color: '#9af3d3', fontSize: 11, fontWeight: '700' }}>Everything is on track</Text></View> : null}
          </View>
        </View>
      </View>

      <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4, marginTop: 22 }}>ROAD TAX, INSURANCE AND LICENCE</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        {RK.map(([k, label]) => { const st = renewStatus(rn[k]); const on = ek === k; return (
          <Pressable key={k} onPress={() => { setEv(rn[k] || todayStr()); setEk(on ? '' : k); }} accessibilityLabel={(rn[k] ? 'Edit ' : 'Set ') + label} style={{ flex: 1, paddingVertical: 11, paddingHorizontal: 10, borderRadius: 18, backgroundColor: on ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.09)' }}>
            <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, fontWeight: '700' }}>{label}</Text>
            <Text style={{ color: rn[k] ? st.col : W, fontSize: 15, fontWeight: '800', marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit>{rn[k] ? (st.n < 0 ? 'Expired' : st.n + (st.n === 1 ? ' day' : ' days')) : '+ Set'}</Text>
            <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 10.5, marginTop: 2 }} numberOfLines={1}>{rn[k] ? fd(rn[k] as string) : 'No date yet'}</Text>
          </Pressable>); })}
      </View>
      {ek ? (
        <View style={{ marginTop: 10, gap: 8 }}>
          <Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{RK.find((x) => x[0] === ek)![1] + ' expires on'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><DateField value={ev} onChange={setEv} style={{ flex: 1 }} /><Btn t="Save" onPress={() => { upd((x) => ({ ...x, renew: { ...(x.renew || {}), [ek]: ev } })); setEk(''); }} /></View>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
        <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4 }}>{moto ? 'REPEAT JOBS · CHAIN, TYRES, OIL' : 'REPEAT JOBS · TYRES, OIL, COOLANT'}</Text>
        {!open ? <Btn t="+ Add task" h={34} w={12} onPress={() => { setOpen(true); setNm(''); setDy(''); setKm(''); setDt(todayStr()); }} /> : null}
      </View>
      {open ? (
        <View style={{ marginTop: 10, gap: 10 }}>
          <View><Text style={{ color: dim, fontSize: 11.5, marginBottom: 6 }}>Task</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>{preset.map(([n, a, b]) => <Chip key={n} t={n} on={nm === n} onPress={() => pick(n, a, b)} />)}</View>
            <Inp value={nm} onChangeText={setNm} placeholder="Or type your own task" /></View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Text style={{ color: dim, fontSize: 11.5, marginBottom: 4 }}>Repeat every (days)</Text><Inp keyboardType="number-pad" value={dy} onChangeText={setDy} placeholder="e.g. 7" /></View>
            <View style={{ flex: 1 }}><Text style={{ color: dim, fontSize: 11.5, marginBottom: 4 }}>or every (km), optional</Text><Inp keyboardType="number-pad" value={km} onChangeText={setKm} placeholder="e.g. 500" /></View>
          </View>
          <View><Text style={{ color: dim, fontSize: 11.5, marginBottom: 4 }}>Last done</Text><DateField value={dt} onChange={setDt} /></View>
          <Text style={{ color: dim, fontSize: 11.5, lineHeight: 16 }}>It is due when the days pass or the km are reached, whichever comes first. The km part needs odometer readings in My Record.</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}><View style={{ opacity: ok ? 1 : 0.5 }}><Btn t="Save task" onPress={save} /></View><Pressable onPress={() => setOpen(false)} style={{ height: 42, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontWeight: '700' }}>Cancel</Text></Pressable></View>
        </View>
      ) : null}
      {list.length === 0 && !open ? <Text style={{ marginTop: 10, color: dim, fontSize: 12, lineHeight: 18 }}>No tasks yet. Tap + Add task, choose Spray chain or Tyre pressure, and My Record counts the days since you last did it and the days until the next time.</Text> : null}
      <View>
        {shown.map((t, i) => {
          const s = taskState(t, latest); const hist = (t.hist || []).filter((x) => x !== t.last).slice(0, 3);
          return (
            <View key={t.id} style={{ marginTop: i === 0 ? 10 : 8, padding: 12, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.08)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>{t.name}</Text>
                  <Text style={{ color: dim, fontSize: 11.5, marginTop: 3 }}>{'Last done ' + fd(t.last) + ' · ' + (s.since === 0 ? 'today' : s.since + (s.since === 1 ? ' day ago' : ' days ago')) + ' · every ' + t.days + (t.days === 1 ? ' day' : ' days') + (t.km ? ' or ' + t.km + ' km' : '')}</Text>
                </View>
                <Sq t="✕" label={'Delete ' + t.name} c="#ff9aa9" onPress={() => upd((x) => ({ ...x, tasks: (x.tasks || []).filter((y: Tk) => y.id !== t.id) }))} />
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.12)', marginTop: 7, overflow: 'hidden' }}><View style={{ width: Math.round(s.frac * 100) + '%', height: '100%', backgroundColor: BAR[s.level] }} /></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, gap: 8 }}>
                <Text style={{ flex: 1, color: COL[s.level], fontSize: 11.5, fontWeight: '700' }}>{s.text}</Text>
                <Pressable onPress={() => { setDoneId(doneId === t.id ? null : t.id); setCost(''); }} accessibilityLabel={'Mark ' + t.name + ' done today'} style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(94,231,181,.24)' }}><Text style={{ color: '#9af3d3', fontSize: 12, fontWeight: '800' }}>Done today</Text></Pressable>
              </View>
              {hist.length ? <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 3 }}>{'Before: ' + hist.map(fd).join(', ')}</Text> : null}
              {doneId === t.id ? (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  <Inp style={{ flex: 1 }} keyboardType="decimal-pad" value={cost} onChangeText={setCost} placeholder={'Cost in ' + cu() + ' (optional)'} onSubmitEditing={() => done(t)} />
                  <Btn t="Save" h={42} w={16} onPress={() => done(t)} />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      {list.length > LIM ? <Pressable onPress={() => setAll(!all)} accessibilityLabel={all ? 'Show fewer tasks' : 'Show all tasks'} style={{ alignSelf: 'center', marginTop: 8, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{all ? 'Show less' : 'Show all ' + list.length + ' tasks'}</Text></Pressable> : null}
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
