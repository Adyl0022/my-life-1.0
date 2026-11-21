import React, { useState } from 'react';
import { View, Modal } from 'react-native';
import { Pressable } from './Press';
import { Text } from './Txt';
import Svg, { Circle, Path } from 'react-native-svg';
import { Inp, SBtn, Sheet, W } from './Ui';
import { useStored } from '../lib/store';
import { openPrompts } from '../lib/adhan';

type Note = { id: number; t: string; s: string; c: number; pin: boolean; u: number; r: string; rm?: number; rd?: boolean; ra?: number[] };
type Data = { notes: Note[]; seq: number };

const WDN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; const MONN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const clock = (d: Date) => { const h = d.getHours(); return (h % 12 || 12) + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + (h < 12 ? 'AM' : 'PM'); };
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const dayText = (ms: number) => { const d = new Date(ms); const diff = Math.round((dayStart(d) - dayStart(new Date())) / 86400000); return (diff === 0 ? 'Today, ' : diff === 1 ? 'Tomorrow, ' : WDN[d.getDay()] + ', ') + d.getDate() + ' ' + MONN[d.getMonth()]; };
const remText = (ms: number) => { const d = new Date(ms); const diff = Math.round((dayStart(d) - dayStart(new Date())) / 86400000); return (diff === 0 ? 'Today ' : diff === 1 ? 'Tomorrow ' : WDN[d.getDay()] + ' ' + d.getDate() + ' ' + MONN[d.getMonth()] + ', ') + clock(d); };
const at = (plus: number, h: number) => { const d = new Date(); d.setDate(d.getDate() + plus); d.setHours(h, 0, 0, 0); return d.getTime(); };
const hourLater = () => { const d = new Date(Date.now() + 3600000); d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0); return d.getTime(); };

export const Bell = ({ c = '#fff', z = 14 }: { c?: string; z?: number }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><Path d="M13.7 21a2 2 0 0 1-3.4 0" /></Svg>;


export const AHEAD_OPTS: [string, number][] = [['5 min', 5], ['15 min', 15], ['30 min', 30], ['1 hour', 60], ['1 day', 1440]];
export const aheadLine = (ra: number[]) => { const n = (ra || []).length + 1; return n + (n === 1 ? ' alert: at the time' : ' alerts: ' + (ra || []).slice().sort((a, b) => b - a).map((m) => (AHEAD_OPTS.find((o) => o[1] === m) || [m + ' min'])[0] + ' before').join(', ') + ' and at the time'); };
// Extra alerts before the time. Tap to pick any of them; each one is another notification.
export function AheadPicker({ when, ra, setRa }: { when: number; ra: number[]; setRa: (v: number[]) => void }) {
  return (
    <View>
      <Text style={{ color: '#ffd593', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: 14, marginBottom: 8 }}>ALSO ALERT ME BEFORE</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {AHEAD_OPTS.map(([l, m]) => {
          const ok = !when || when - m * 60000 > Date.now() + 10000; const on = ra.indexOf(m) >= 0 && ok;
          return (
            <Pressable key={m} disabled={!ok} onPress={() => setRa(on ? ra.filter((x) => x !== m) : [...ra, m])} accessibilityLabel={l + ' before'} style={{ paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, opacity: ok ? 1 : 0.35, backgroundColor: on ? '#ffc46b' : 'rgba(255,255,255,.12)' }}>
              <Text style={{ color: on ? '#3a2200' : W, fontSize: 12.5, fontWeight: '800' }}>{l}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 8 }}>{aheadLine(ra.filter((m) => !when || when - m * 60000 > Date.now() + 10000))}</Text>
    </View>
  );
}

// The menu that opens from the Dashboard search button: Search or a quick reminder.
export function SearchMenu({ top, onSearch, onRemind, onClose }: { top: number; onSearch: () => void; onRemind: () => void; onClose: () => void }) {
  const Row = ({ ic, t, s, tint, onPress }: { ic: React.ReactElement; t: string; s: string; tint: string; onPress: () => void }) => (
    <Pressable onPress={onPress} accessibilityLabel={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14 }}>
      <View style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: tint }}>{ic}</View>
      <View style={{ flexShrink: 1 }}><Text style={{ color: W, fontSize: 15, fontWeight: '700' }}>{t}</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 1 }}>{s}</Text></View>
    </Pressable>
  );
  return (
    <Modal transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(5,8,25,.35)' }}>
        <View style={{ position: 'absolute', right: 20, top, width: 220, padding: 6, borderRadius: 20, backgroundColor: '#3f2f78', borderWidth: 1, borderColor: 'rgba(255,255,255,.35)' }}>
          <Row tint="rgba(255,255,255,.18)" t="Search" s="Find anything in the app" onPress={onSearch} ic={<Svg width={19} height={19} viewBox="0 0 24 24"><Circle cx={11} cy={11} r={7} stroke="#fff" strokeWidth={1.9} fill="none" /><Path d="M20 20l-4-4" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" /></Svg>} />
          <Row tint="rgba(255,196,107,.35)" t="Remind me" s="Quick reminder" onPress={onRemind} ic={<Bell c="#ffe3b3" z={18} />} />
        </View>
      </Pressable>
    </Modal>
  );
}

// Writes the reminder straight into Notes & Reminders (same list, same alerts).
export function QuickRemind({ onClose, onDone }: { onClose: () => void; onDone: (msg: string) => void }) {
  const [data, setData] = useStored<Data>('ml_notes', { notes: [], seq: 1 });
  const [txt, setTxt] = useState('');
  const [when, setWhen] = useState(0);
  const [pick, setPick] = useState(false);
  const [err, setErr] = useState('');
  const [ra, setRa] = useState<number[]>([]);
  const eve = at(0, 18), tonight = at(0, 21);
  const chips: [string, number][] = [['In 1 hour', hourLater()], ...(eve > Date.now() + 600000 ? [['This evening 6 PM', eve] as [string, number]] : []), ...(tonight > Date.now() + 600000 ? [['Tonight 9 PM', tonight] as [string, number]] : []), ['Tomorrow 8 AM', at(1, 8)]];
  const shift = (f: 'd' | 'h' | 'm', by: number) => { const d = new Date(when || chips[0][1]); if (f === 'd') d.setDate(d.getDate() + by); else if (f === 'h') d.setHours(d.getHours() + by); else d.setMinutes(d.getMinutes() + by); d.setSeconds(0, 0); setWhen(d.getTime()); };
  const save = () => {
    openPrompts();
    const t = txt.trim(); if (!t) return setErr('Write what to remember');
    if (!when) return setErr('Pick a time');
    if (when <= Date.now() + 30000) return setErr('Pick a time in the future');
    setData({ notes: [{ id: data.seq, t, s: '', c: 2, pin: false, u: Date.now(), r: '', rm: when, ...(ra.filter((m) => when - m * 60000 > Date.now() + 10000).length ? { ra: ra.filter((m) => when - m * 60000 > Date.now() + 10000) } : {}) }, ...data.notes], seq: data.seq + 1 });
    onDone('Reminder set · ' + remText(when)); onClose();
  };
  const on = (v: number) => Math.abs(when - v) < 60000;
  return (
    <Sheet onClose={onClose}>
      <View style={{ padding: 18, borderRadius: 26, backgroundColor: '#131845', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
        <Text style={{ color: W, fontSize: 17, fontWeight: '800' }}>Remind me</Text>
        <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 2 }}>Saved in Notes & Reminders</Text>
        <Text style={{ color: '#ffd593', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: 14, marginBottom: 6 }}>WHAT</Text>
        <Inp value={txt} onChangeText={(v: string) => { setTxt(v); setErr(''); }} placeholder="e.g. Charge phone" autoFocus maxLength={80} />
        <Text style={{ color: '#ffd593', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: 14, marginBottom: 8 }}>WHEN</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {chips.map(([l, v]) => (
            <Pressable key={l} onPress={() => { setWhen(v); setErr(''); }} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: on(v) ? '#ffc46b' : 'rgba(255,255,255,.12)' }}><Text style={{ color: on(v) ? '#3a2200' : W, fontSize: 12.5, fontWeight: '800' }}>{l}</Text></Pressable>
          ))}
          <Pressable onPress={() => { setPick(!pick); if (!when) setWhen(chips[0][1]); }} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: pick ? 'rgba(255,196,107,.3)' : 'rgba(255,255,255,.12)', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,213,147,.6)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>Pick time…</Text></Pressable>
        </View>
        {pick && when ? ([['Date', dayText(when), 'd', 1], ['Hour', (new Date(when).getHours() % 12 || 12) + ' ' + (new Date(when).getHours() < 12 ? 'AM' : 'PM'), 'h', 1], ['Minute', ':' + String(new Date(when).getMinutes()).padStart(2, '0'), 'm', 5]] as [string, string, 'd' | 'h' | 'm', number][]).map(([l, v, f, by]) => (
          <View key={l} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 13 }}>{l}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable onPress={() => shift(f, -by)} accessibilityLabel={'Earlier ' + l} hitSlop={4} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 18, fontWeight: '800', marginTop: -2 }}>−</Text></Pressable>
              <Text style={{ color: W, fontSize: 14.5, fontWeight: '800', minWidth: 118, textAlign: 'center' }}>{v}</Text>
              <Pressable onPress={() => shift(f, by)} accessibilityLabel={'Later ' + l} hitSlop={4} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 18, fontWeight: '800', marginTop: -2 }}>+</Text></Pressable>
            </View>
          </View>
        )) : null}
        {when ? <AheadPicker when={when} ra={ra} setRa={setRa} /> : null}
        {when ? <Text style={{ color: '#ffd593', fontSize: 12.5, fontWeight: '700', marginTop: 14 }}>{'You will be reminded ' + remText(when)}</Text> : null}
        {err ? <Text style={{ color: '#ffb3c4', fontSize: 12.5, fontWeight: '700', marginTop: 10 }}>{err}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}><SBtn t="Cancel" onPress={onClose} /><SBtn t="Set reminder" kind="primary" onPress={save} /></View>
      </View>
    </Sheet>
  );
}
