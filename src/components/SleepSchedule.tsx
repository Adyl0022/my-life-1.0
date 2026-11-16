import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './Txt';
import { HData, HDay, WD, MON, dateOf, getDay, to12 } from '../lib/habit';

// Shows when you slept, not only for how long: one bar per night on a clock that runs from 6 PM to the next 6 PM, so a night shift or a day sleep fits too.
const DIM = 'rgba(255,255,255,.65)'; const P = '#b794ff'; const START = 18 * 60;
const mins = (s?: string) => { const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(s || ''); return m ? +m[1] * 60 + +m[2] : null; };
const fm = (m: number) => to12(String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, '0') + ':' + String(((m % 1440) + 1440) % 1440 % 60).padStart(2, '0'));
const hh = (m: number) => { const h = Math.floor(m / 60), r = Math.round(m % 60); return r ? h + ' h ' + r + ' min' : h + ' h'; };

export function SleepSchedule({ h }: { h: HData }) {
  const [n, setN] = useState(7); const big = n > 7;
  const days: { label: string; d: HDay; today: boolean }[] = Array.from({ length: n }, (_, i) => { const o = i - (n - 1); const dt = dateOf(o); return { label: o === 0 ? 'Last night' : big ? dt.getDate() + ' ' + MON[dt.getMonth()] : WD[dt.getDay()], d: getDay(h, o), today: o === 0 }; });
  const rows = days.map((x) => { const b = mins(x.d.bed), w = mins(x.d.wake); if (b == null || w == null) return { ...x, b: null as number | null, w: null as number | null, len: 0 }; let len = (w - b + 1440) % 1440; if (len === 0) len = 1440; return { ...x, b, w, len }; });
  const timed = rows.filter((r) => r.b != null);
  const today = rows[rows.length - 1];
  // Average bed and wake times, counted on the same 6 PM clock so a bedtime after midnight averages correctly.
  const shift = (m: number) => (m - START + 1440) % 1440; const avg = (a: number[]) => Math.round(a.reduce((s, v) => s + v, 0) / a.length);
  const aBed = timed.length ? (avg(timed.map((r) => shift(r.b as number))) + START) % 1440 : null; const aWake = timed.length ? (avg(timed.map((r) => shift(r.w as number))) + START) % 1440 : null;
  const aLen = timed.length ? avg(timed.map((r) => r.len)) : null;
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ color: DIM, fontSize: 11.5, fontWeight: '800', letterSpacing: 1 }}>{'SLEEP SCHEDULE · LAST ' + n + ' DAYS'}</Text>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
        {[7, 30].map((v) => <Pressable key={v} onPress={() => setN(v)} accessibilityLabel={'Show the last ' + v + ' days'} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, backgroundColor: n === v ? P : 'rgba(255,255,255,.12)' }}><Text style={{ color: n === v ? '#1a0d3a' : '#fff', fontSize: 12, fontWeight: '800' }}>{v + ' days'}</Text></Pressable>)}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <View style={{ flex: 1, padding: 10, borderRadius: 14, backgroundColor: 'rgba(183,148,255,.18)' }}>
          <Text style={{ color: DIM, fontSize: 10.5 }}>Last night</Text>
          {today.b != null ? <><Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 4 }}>{'Bed  ' + fm(today.b as number)}</Text><Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 1 }}>{'Wake  ' + fm(today.w as number)}</Text><Text style={{ color: DIM, fontSize: 11.5, marginTop: 3 }}>{hh(today.len)}</Text></>
            : <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 3 }}>{today.d.sleep > 0 ? today.d.sleep.toFixed(1) + ' h, no times set' : 'No record yet'}</Text>}
        </View>
        <View style={{ flex: 1, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.09)' }}>
          <Text style={{ color: DIM, fontSize: 10.5 }}>{'Usual (' + n + ' days)'}</Text>
          {aBed != null ? <><Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 4 }}>{'Bed  ' + fm(aBed)}</Text><Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 1 }}>{'Wake  ' + fm(aWake as number)}</Text><Text style={{ color: DIM, fontSize: 11.5, marginTop: 3 }}>{hh(aLen as number) + ' · ' + timed.length + (timed.length === 1 ? ' night' : ' nights')}</Text></>
            : <Text style={{ color: DIM, fontSize: 12, marginTop: 3 }}>Set bed and wake times to see this</Text>}
        </View>
      </View>
      <View style={{ marginTop: 12 }}>
        {rows.map((r, i) => {
          const segs: [number, number][] = []; if (r.b != null) { const s = shift(r.b); if (s + r.len > 1440) { segs.push([s, 1440 - s]); segs.push([0, s + r.len - 1440]); } else segs.push([s, r.len]); }
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', height: big ? 18 : 24 }}>
              <Text numberOfLines={1} style={{ width: 62, fontSize: big ? 10.5 : 11, color: r.today ? '#fff' : DIM, fontWeight: r.today ? '800' : '500' }}>{r.label}</Text>
              <View style={{ flex: 1, height: big ? 9 : 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                {[25, 50, 75].map((p) => <View key={p} style={{ position: 'absolute', left: p + '%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,.1)' }} />)}
                {segs.map((g, k) => <View key={k} style={{ position: 'absolute', left: (g[0] / 14.4) + '%', width: (g[1] / 14.4) + '%', top: 0, bottom: 0, borderRadius: 6, backgroundColor: P, opacity: r.today ? 1 : 0.6 }} />)}
              </View>
              <Text style={{ width: 52, textAlign: 'right', fontSize: big ? 10.5 : 11, color: r.today ? '#fff' : DIM, fontWeight: r.today ? '800' : '500' }}>{r.b != null ? (r.len / 60).toFixed(1) + ' h' : r.d.sleep > 0 ? r.d.sleep.toFixed(1) + ' h' : '-'}</Text>
            </View>);
        })}
        <View style={{ flexDirection: 'row', marginTop: 2 }}>
          <View style={{ width: 62 }} />
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>{['6 PM', '12 AM', '6 AM', '12 PM', '6 PM'].map((l, i) => <Text key={i} style={{ fontSize: 9.5, color: 'rgba(255,255,255,.5)' }}>{l}</Text>)}</View>
          <View style={{ width: 52 }} />
        </View>
      </View>
      <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, lineHeight: 15, marginTop: 8 }}>Each purple bar runs from when you went to bed to when you woke up. Days with only hours and no times show the hours without a bar.</Text>
    </View>
  );
}
