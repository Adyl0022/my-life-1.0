import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';
import { Glass } from './Glass';
import { Avatar, Btn, DIM, W } from './FamilyUi';
import { FInfo } from '../lib/family';
import { FEvent, FTask, peopleOf, timeText } from '../lib/familyData';
import { useStored } from '../lib/store';
import { useRegion } from '../lib/region';
import { upcomingMy, fetchMy, EMPTY_CACHE, MyCache } from '../lib/myEvents';

// The family calendar: a month grid with little coloured bars, and the chosen day as a timeline underneath.
// Activities (teal), tasks that are due (gold), birthdays (pink) and public holidays for the country in Settings (purple).
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const C = { a: '#5ee7df', t: '#ffc46b', b: '#ff8fab', h: '#b794ff' };
const pad = (n: number) => String(n).padStart(2, '0');
const key = (y: number, m: number, d: number) => y + '-' + pad(m + 1) + '-' + pad(d);
const keyOf = (d: Date) => key(d.getFullYear(), d.getMonth(), d.getDate());

type Item = { k: 'h' | 'b' | 'a' | 't'; sort: string; time: string; title: string; sub?: string; id?: string; color?: string; who?: { name: string; color: string }[]; done?: boolean };

export function FamCalendar({ info, events, tasks, onEvent, onTask, onNew }: { info: FInfo | null; events: FEvent[]; tasks: FTask[]; onEvent: (id: string) => void; onTask: (id: string) => void; onNew: (date: string) => void }) {
  const now = new Date(); const todayKey = keyOf(now);
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [sel, setSel] = useState(todayKey);
  const [mc, setMc, mcOk] = useStored<MyCache>('ml_myevents', EMPTY_CACHE);
  const [rg] = useRegion();
  useEffect(() => { if (!mcOk) return; fetchMy(mc, todayKey, false, rg.cc).then((n) => { if (n) setMc(n); }); }, [mcOk, todayKey, rg.cc]); // eslint-disable-line react-hooks/exhaustive-deps
  const people = useMemo(() => peopleOf(info), [info]);

  const byDay = useMemo(() => {
    const map: Record<string, Item[]> = {};
    const add = (d: string, it: Item) => { (map[d] = map[d] || []).push(it); };
    const first = key(ym.y, ym.m, 1);
    // public holidays of the chosen month, from the same list the Planner uses
    try { for (const h of upcomingMy(first, 400, mc, rg.cc)) if (h.date.slice(0, 7) === first.slice(0, 7)) add(h.date, { k: 'h', sort: '0', time: 'All day', title: h.name, sub: 'Public holiday' }); } catch (e) { /* no holidays */ }
    // birthdays come back every year
    const dim = new Date(ym.y, ym.m + 1, 0).getDate();
    for (const p of [...(info?.members || []).map((m) => ({ name: m.name, color: m.color, bd: m.birthday })), ...(info?.profiles || []).map((m) => ({ name: m.name, color: m.color, bd: m.birthday }))]) {
      const r = p.bd ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(p.bd) : null; if (!r || Number(r[2]) - 1 !== ym.m) continue;
      const day = Math.min(Number(r[3]), dim); const age = ym.y - Number(r[1]);
      add(key(ym.y, ym.m, day), { k: 'b', sort: '1' + p.name, time: 'All day', title: p.name + "'s birthday", sub: age > 0 ? 'Turns ' + age : undefined, color: p.color });
    }
    for (const e of events) {
      const d = new Date(e.starts_at); if (d.getFullYear() !== ym.y || d.getMonth() !== ym.m) continue;
      add(keyOf(d), { k: 'a', sort: '2' + pad(d.getHours()) + pad(d.getMinutes()), time: timeText(d), title: e.title, sub: e.place || undefined, id: e.id, who: e.attendees.map((id) => people.find((p) => p.id === id)).filter(Boolean) as any });
    }
    for (const t of tasks) {
      if (!t.due_at) continue; const d = new Date(t.due_at); if (d.getFullYear() !== ym.y || d.getMonth() !== ym.m) continue;
      add(keyOf(d), { k: 't', sort: '3' + pad(d.getHours()) + pad(d.getMinutes()), time: 'Due ' + timeText(d), title: t.title, sub: t.done ? 'Done' : 'Task', id: t.id, done: t.done, who: t.assignees.map((id) => people.find((p) => p.id === id)).filter(Boolean) as any });
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => (a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0));
    return map;
  }, [ym, events, tasks, info, mc, rg.cc, people]);

  const nextBd = useMemo(() => {
    const out: { name: string; color: string; when: Date; days: number; age: number }[] = [];
    const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (const p of [...(info?.members || []), ...(info?.profiles || [])] as { name: string; color: string; birthday?: string | null }[]) {
      const r = p.birthday ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(p.birthday) : null; if (!r) continue;
      let y = t0.getFullYear(); let d = new Date(y, Number(r[2]) - 1, Number(r[3])); if (d < t0) { y += 1; d = new Date(y, Number(r[2]) - 1, Number(r[3])); }
      out.push({ name: p.name, color: p.color, when: d, days: Math.round((d.getTime() - t0.getTime()) / 86400000), age: y - Number(r[1]) });
    }
    return out.sort((a, b) => a.days - b.days).slice(0, 3);
  }, [info]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = (n: number) => { const d = new Date(ym.y, ym.m + n, 1); setYm({ y: d.getFullYear(), m: d.getMonth() }); setSel(d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() ? todayKey : keyOf(d)); };
  const lead = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7; const dim = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)]; while (cells.length % 7) cells.push(null);
  const list = byDay[sel] || [];
  const sd = new Date(Number(sel.slice(0, 4)), Number(sel.slice(5, 7)) - 1, Number(sel.slice(8, 10)));

  return (
    <View>
      <Glass solid radius={26} style={{ paddingTop: 14, paddingBottom: 8, paddingHorizontal: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingBottom: 8 }}>
          <Text style={{ color: W, fontSize: 24, fontWeight: '900' }}>{MONTHS[ym.m]}</Text>
          <Text style={{ color: DIM, fontSize: 14, marginLeft: 8, flex: 1 }}>{ym.y}</Text>
          <Pressable hitSlop={12} onPress={() => go(-1)} style={{ paddingHorizontal: 12 }}><Text style={{ color: W, fontSize: 22 }}>‹</Text></Pressable>
          <Pressable hitSlop={12} onPress={() => go(1)} style={{ paddingLeft: 12 }}><Text style={{ color: W, fontSize: 22 }}>›</Text></Pressable>
        </View>
        <View style={{ flexDirection: 'row' }}>{'MTWTFSS'.split('').map((x, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', color: DIM, fontSize: 11, paddingBottom: 4 }}>{x}</Text>)}</View>
        {Array.from({ length: cells.length / 7 }, (_, w) => (
          <View key={w} style={{ flexDirection: 'row' }}>
            {cells.slice(w * 7, w * 7 + 7).map((d, i) => {
              if (!d) return <View key={i} style={{ flex: 1, height: 42 }} />;
              const k = key(ym.y, ym.m, d); const items = byDay[k] || []; const kinds = (['a', 't', 'b'] as const).filter((x) => items.some((it) => it.k === x));
              const hol = items.some((it) => it.k === 'h'); const on = k === sel; const today = k === todayKey;
              return (
                <Pressable key={i} onPress={() => setSel(k)} style={{ flex: 1, height: 42, alignItems: 'center', paddingTop: 3 }}>
                  {on ? <LinearGradient colors={['#ff8fab', '#ffc46b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 3, width: 31, height: 31, borderRadius: 16 }} /> : today ? <View style={{ position: 'absolute', top: 3, width: 31, height: 31, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,196,107,.8)' }} /> : null}
                  <Text style={{ height: 31, lineHeight: 31, color: on ? '#2a1740' : hol ? '#d3bcff' : W, fontSize: 13.5, fontWeight: on || hol || today ? '800' : '500' }}>{d}</Text>
                  <View style={{ flexDirection: 'row', gap: 2, position: 'absolute', bottom: 1 }}>{kinds.map((x) => <View key={x} style={{ width: 10, height: 3, borderRadius: 2, backgroundColor: C[x] }} />)}</View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </Glass>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10, marginLeft: 6 }}>
        {([['a', 'Activity'], ['t', 'Task due'], ['b', 'Birthday'], ['h', 'Holiday']] as const).map(([k, t]) => <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C[k] }} /><Text style={{ color: DIM, fontSize: 11 }}>{t}</Text></View>)}
      </View>

      {nextBd.length ? (
        <Glass solid radius={20} style={{ marginTop: 14, padding: 12 }}>
          <Text style={{ color: DIM, fontSize: 10.5, letterSpacing: 1.3, fontWeight: '800', marginBottom: 6 }}>NEXT BIRTHDAYS</Text>
          {nextBd.map((b, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
              <Avatar name={b.name} color={b.color} size={26} />
              <Text style={{ flex: 1, color: W, fontSize: 13.5, fontWeight: '700' }} numberOfLines={1}>{b.name}</Text>
              <Text style={{ color: DIM, fontSize: 12 }}>{b.when.getDate()} {MONTHS[b.when.getMonth()].slice(0, 3)} · {b.days === 0 ? 'today' : b.days === 1 ? 'tomorrow' : 'in ' + b.days + ' days'}{b.age > 0 ? ' · turns ' + b.age : ''}</Text>
            </View>
          ))}
        </Glass>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 18, marginBottom: 10, marginHorizontal: 6 }}>
        <Text style={{ color: W, fontSize: 34, fontWeight: '900' }}>{sd.getDate()}</Text>
        <Text style={{ color: W, fontSize: 15, fontWeight: '700' }}>{DAYS[(sd.getDay() + 6) % 7]}</Text>
        <Text style={{ color: DIM, fontSize: 12, flex: 1 }}>{list.length ? list.length + (list.length === 1 ? ' thing' : ' things') : 'Nothing planned'}</Text>
      </View>
      <View style={{ paddingLeft: 56 }}>
        {list.length ? <LinearGradient colors={[C.b, C.a, C.t]} style={{ position: 'absolute', left: 44, top: 8, bottom: 8, width: 2, opacity: 0.5 }} /> : null}
        {list.map((it, i) => {
          const c = it.k === 'b' ? C.b : it.k === 'h' ? C.h : it.k === 't' ? C.t : C.a;
          const tap = it.id ? () => (it.k === 'a' ? onEvent(it.id!) : onTask(it.id!)) : undefined;
          const bg = it.k === 'h' ? ['rgba(183,148,255,.42)', 'rgba(30,42,92,.74)'] : it.k === 'b' ? ['rgba(255,143,171,.46)', 'rgba(255,196,107,.22)'] : ['rgba(30,42,92,.74)', 'rgba(30,42,92,.74)'];
          return (
            <View key={i} style={{ marginBottom: 10 }}>
              <Text style={{ position: 'absolute', left: -56, top: 13, width: 40, textAlign: 'right', color: DIM, fontSize: 10.5 }} numberOfLines={1}>{it.time.replace('Due ', '')}</Text>
              <View style={{ position: 'absolute', left: -17, top: 14, width: 12, height: 12, borderRadius: 6, backgroundColor: c, borderWidth: 2, borderColor: '#14194a' }} />
              <Pressable disabled={!tap} onPress={tap}>
                <LinearGradient colors={bg as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 18, borderWidth: 1, borderColor: c + '99', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: it.done ? 0.6 : 1 }}>
                  {it.k === 'b' ? <Avatar name={it.title} color={it.color || C.b} size={34} /> : null}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: W, fontSize: 14.5, fontWeight: '700' }} numberOfLines={2}>{it.k === 'h' ? '🌙 ' : it.k === 'b' ? '🎂 ' : ''}{it.title}</Text>
                    {it.sub ? <Text style={{ color: DIM, fontSize: 11.5, marginTop: 2 }}>{it.sub}</Text> : null}
                  </View>
                  {it.who && it.who.length ? <View style={{ flexDirection: 'row' }}>{it.who.slice(0, 3).map((p, j) => <View key={j} style={{ marginLeft: j ? -8 : 0 }}><Avatar name={p.name} color={p.color} size={24} ring /></View>)}</View> : null}
                </LinearGradient>
              </Pressable>
            </View>
          );
        })}
      </View>
      <View style={{ marginTop: 6 }}><Btn solid t={'+ New activity on ' + sd.getDate() + ' ' + MONTHS[sd.getMonth()].slice(0, 3)} kind="main" onPress={() => onNew(sel)} /></View>
    </View>
  );
}
