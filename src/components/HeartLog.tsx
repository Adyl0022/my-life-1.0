import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './Txt';
import { Inp, W } from './Ui';
import { HData, HeartRead, dateOf, keyOfDate } from '../lib/habit';

// A notebook for pulse and blood pressure. The person types the numbers; the app only keeps them and shows them back. It never judges a reading.
const DIM = 'rgba(255,255,255,.7)'; const T = '#ff8fab';
const num = (s: string) => { const n = parseInt(s.replace(/[^0-9]/g, ''), 10); return Number.isFinite(n) ? n : undefined; };
const dlabel = (k: string) => { const d = new Date(k + 'T12:00:00'); return d.getDate() + '/' + (d.getMonth() + 1); };

export function HeartLog({ h, setH, off = 0 }: { h: HData; setH: (v: HData) => void; off?: number }) {
  const [bpm, setBpm] = useState(''); const [sys, setSys] = useState(''); const [dia, setDia] = useState(''); const [err, setErr] = useState('');
  const list = (h.heart || []).slice().sort((a, b) => (a.d + a.at < b.d + b.at ? 1 : -1));
  const save = () => {
    const p = num(bpm), s = num(sys), d = num(dia);
    if (p == null && s == null && d == null) { setErr('Type a pulse, a blood pressure, or both.'); return; }
    if (p != null && (p < 30 || p > 220)) { setErr('Pulse should be between 30 and 220. Please check the number.'); return; }
    if ((s != null) !== (d != null)) { setErr('Blood pressure needs both numbers, for example 120 and 80.'); return; }
    if (s != null && d != null && (s < 70 || s > 250 || d < 40 || d > 150 || d >= s)) { setErr('Please check the blood pressure numbers. The systolic (first) number is the larger one.'); return; }
    const now = new Date(); const at = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const r: HeartRead = { id: String(Date.now()), d: keyOfDate(dateOf(Math.min(0, off))), at, ...(p != null ? { bpm: p } : {}), ...(s != null && d != null ? { sys: s, dia: d } : {}) };
    setH({ ...h, heart: [...(h.heart || []), r].slice(-400) });
    setBpm(''); setSys(''); setDia(''); setErr('');
  };
  const drop = (id: string) => setH({ ...h, heart: (h.heart || []).filter((x) => x.id !== id) });
  return (
    <View>
      <Text style={{ color: DIM, fontSize: 12, marginTop: 4 }}>{off < 0 ? 'Add a reading for this day' : 'Add a reading'}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Inp value={bpm} onChangeText={setBpm} keyboardType="number-pad" placeholder="Pulse (bpm)" maxLength={3} style={{ flex: 1.2 }} />
        <Inp value={sys} onChangeText={setSys} keyboardType="number-pad" placeholder="Systolic" maxLength={3} style={{ flex: 0.8 }} />
        <Inp value={dia} onChangeText={setDia} keyboardType="number-pad" placeholder="Diastolic" maxLength={3} style={{ flex: 0.8 }} />
      </View>
      <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 4 }}>Blood pressure: systolic (first number) and diastolic (second number), in mmHg.</Text>
      {err ? <Text style={{ color: '#ffd593', fontSize: 12, marginTop: 6 }}>{err}</Text> : null}
      <Pressable onPress={save} style={{ alignSelf: 'flex-start', marginTop: 10, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: T }}><Text style={{ color: '#2a0a14', fontWeight: '800', fontSize: 13 }}>Save reading</Text></Pressable>
      {list.length ? (
        <View style={{ marginTop: 14 }}>
          <Text style={{ color: DIM, fontSize: 11.5, fontWeight: '700', marginBottom: 2 }}>RECENT READINGS</Text>
          {list.slice(0, 6).map((x) => (
            <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.08)' }}>
              <Text style={{ color: DIM, fontSize: 12, width: 62 }}>{dlabel(x.d) + ' ' + x.at}</Text>
              <Text style={{ color: W, fontSize: 13, fontWeight: '800', flex: 1 }}>{[x.bpm != null ? x.bpm + ' bpm' : '', x.sys != null ? x.sys + '/' + x.dia + ' mmHg' : ''].filter(Boolean).join('   ')}</Text>
              <Pressable onPress={() => drop(x.id)} hitSlop={10} accessibilityLabel="Delete this reading"><Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 18, paddingHorizontal: 6 }}>×</Text></Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, lineHeight: 16, marginTop: 12 }}>These are your own notes. My Life is not a medical device and does not diagnose, treat or advise. Talk to a doctor or nurse about your readings.</Text>
    </View>
  );
}
