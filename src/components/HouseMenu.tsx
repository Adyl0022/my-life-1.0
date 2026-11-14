import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';
import { Glass } from './Glass';
import { Avatar, Btn, Chip, Field, Note, W, DIM } from './FamilyUi';
import { famError, useAutoRefresh, FInfo } from '../lib/family';
import { useFamMenu, useFamShop, menuSave, shopSave, peopleOf, localDay, useReloadOnFocus, FMenu } from '../lib/familyData';

// The family menu: breakfast, lunch and dinner for each day. "Needs" can be sent to the shopping list in one tap.
const SLOTS: { k: FMenu['slot']; t: string; ic: string }[] = [{ k: 'breakfast', t: 'Breakfast', ic: '🍳' }, { k: 'lunch', t: 'Lunch', ic: '🍜' }, { k: 'dinner', t: 'Dinner', ic: '🍽️' }];
const ACC = ['#ff8fab', '#ffc46b', '#5ee7df', '#b794ff', '#7c9cff', '#ff8fab', '#ffc46b'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ymd = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const parse = (s: string) => new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const items = (s: string | null) => (s || '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, 12);

export function HouseMenu({ info }: { info: FInfo | null }) {
  const m = useFamMenu(info?.id);
  const sh = useFamShop(info?.id);
  useReloadOnFocus(m.reload, sh.reload);
  useAutoRefresh(() => { m.reload(); sh.reload(); }, 8000);
  const people = useMemo(() => peopleOf(info), [info]);
  const [day, setDay] = useState(localDay());
  const [slot, setSlot] = useState<FMenu['slot'] | ''>('');
  const [dish, setDish] = useState('');
  const [cook, setCook] = useState<string | null>(null);
  const [needs, setNeeds] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState('');

  const base = parse(day); const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() - ((base.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
  const today = localDay();
  const planned = week.filter((d) => m.rows.some((x) => x.day === ymd(d))).length;
  const at = (s: FMenu['slot']) => m.rows.find((x) => x.day === day && x.slot === s);
  const toBuy = sh.rows.filter((x) => !x.bought).map((x) => x.name.toLowerCase());

  const open = (s: FMenu['slot']) => { const x = at(s); setSlot(s); setDish(x?.dish || ''); setCook(x?.cook || null); setNeeds(x?.needs || ''); setMsg(''); setOk(''); };
  const save = async (clear?: boolean) => {
    if (!slot) return; setBusy(true); setMsg('');
    try { await menuSave(day, slot, clear ? '' : dish, clear ? null : cook, clear ? '' : needs); await m.reload(); setSlot(''); } catch (e) { setMsg(famError(e)); }
    setBusy(false);
  };
  const addToShop = async (s: FMenu) => {
    setBusy(true); setMsg(''); setOk('');
    try {
      const want = items(s.needs).filter((x) => toBuy.indexOf(x.toLowerCase()) < 0);
      for (const x of want) await shopSave(null, x, '', 'Groceries');
      await sh.reload();
      setOk(want.length ? 'Added ' + want.length + (want.length === 1 ? ' item' : ' items') + ' to the shopping list.' : 'Everything is already on the shopping list.');
    } catch (e) { setMsg(famError(e)); }
    setBusy(false);
  };

  return (
    <View>
      <LinearGradient colors={['rgba(94,231,223,.30)', 'rgba(183,148,255,.34)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, paddingTop: 16, paddingBottom: 16, paddingHorizontal: 12, marginTop: 6, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,.3)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, marginBottom: 20 }}>
          <Text style={{ color: W, fontSize: 17, fontWeight: '900', flex: 1 }}>{MON[week[0].getMonth()]}{week[6].getMonth() !== week[0].getMonth() ? ' / ' + MON[week[6].getMonth()] : ''} {week[6].getFullYear()}</Text>
          <Pressable hitSlop={12} onPress={() => setDay(ymd(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 7)))} style={({ pressed }) => ({ paddingHorizontal: 14, opacity: pressed ? 0.6 : 1 })}><Text style={{ color: W, fontSize: 22 }}>‹</Text></Pressable>
          <Pressable hitSlop={12} onPress={() => setDay(ymd(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7)))} style={({ pressed }) => ({ paddingLeft: 14, opacity: pressed ? 0.6 : 1 })}><Text style={{ color: W, fontSize: 22 }}>›</Text></Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {week.map((d) => { const k = ymd(d); const on = k === day; const has = m.rows.some((x) => x.day === k);
            const ac = ACC[(d.getDay() + 6) % 7]; // each weekday has its own colour once it has a menu
            const dark = on ? '#2a1740' : null;
            const inner = (
              <>
                <Text style={{ color: dark || (has ? ac : 'rgba(255,255,255,.75)'), fontSize: 10.5, fontWeight: '800' }}>{'MTWTFSS'[(d.getDay() + 6) % 7]}</Text>
                <Text style={{ color: dark || W, fontSize: 16, fontWeight: '900', marginTop: 3 }}>{d.getDate()}</Text>
                <View style={{ width: 5, height: 5, borderRadius: 3, marginTop: 5, backgroundColor: has ? (dark || ac) : 'transparent' }} />
              </>
            );
            return (
              <Pressable key={k} onPress={() => { setDay(k); setSlot(''); setOk(''); }} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] })}>
                {on ? <View pointerEvents="none" style={{ position: 'absolute', left: -3, right: -3, top: -3, bottom: -3, borderRadius: 19, backgroundColor: 'rgba(255,143,171,.38)' }} /> : null}
                {on
                  ? <LinearGradient colors={['#ff8fab', '#ffc46b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ alignItems: 'center', paddingVertical: 10, borderRadius: 16 }}>{inner}</LinearGradient>
                  : <View style={{ alignItems: 'center', paddingVertical: 10, borderRadius: 16, backgroundColor: has ? ac + '2e' : 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: has ? ac + '99' : k === today ? 'rgba(255,196,107,.9)' : 'rgba(255,255,255,.22)' }}>{inner}</View>}
              </Pressable>
            ); })}
        </View>
        <View style={{ marginTop: 18, marginHorizontal: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}>
            <Text style={{ color: DIM, fontSize: 10.5 }}>Menu planned</Text>
            <Text style={{ color: DIM, fontSize: 10.5 }}>{planned} of 7 days</Text>
          </View>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,.18)' }}><LinearGradient colors={['#ff8fab', '#ffc46b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: (planned / 7 * 100) + '%', height: 4, borderRadius: 2 }} /></View>
        </View>
      </LinearGradient>
      <Text style={{ color: W, fontSize: 17, fontWeight: '800', marginLeft: 4, marginBottom: 10 }}>{DAYN[base.getDay()]}{day === today ? ' · Today' : ''}</Text>
      {msg ? <Note warm t={msg} /> : null}
      {ok ? <Note t={ok} /> : null}
      {SLOTS.map((s) => {
        const x = at(s.k); const c = x?.cook ? people.find((p) => p.id === x.cook) : null; const open2 = slot === s.k;
        return (
          <View key={s.k}>
            <Pressable onPress={() => (open2 ? setSlot('') : open(s.k))}>
              <Glass solid radius={22} style={{ marginBottom: 10, padding: 13, borderStyle: x ? 'solid' : 'dashed' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 24 }}>{s.ic}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: DIM, fontSize: 10.5, letterSpacing: 1, fontWeight: '800' }}>{s.t.toUpperCase()}</Text>
                    <Text style={{ color: x ? W : DIM, fontSize: 14.5, fontWeight: '700', marginTop: 1 }} numberOfLines={2}>{x ? x.dish : '+ Add ' + s.t.toLowerCase()}</Text>
                    {x && items(x.needs).length ? <Text style={{ color: DIM, fontSize: 11.5, marginTop: 2 }} numberOfLines={2}>Needs: {items(x.needs).join(', ')}</Text> : null}
                  </View>
                  {c ? <Avatar name={c.name} color={c.color} size={30} /> : null}
                </View>
                {x && items(x.needs).length && !open2 ? <View style={{ marginTop: 10 }}><Btn solid t={'+ Add ' + items(x.needs).length + ' to the shopping list'} kind="good" onPress={() => addToShop(x)} disabled={busy} /></View> : null}
              </Glass>
            </Pressable>
            {open2 ? (
              <Glass solid radius={22} style={{ marginBottom: 10, padding: 14 }}>
                <Field label="What is cooked" value={dish} onChange={setDish} ph="Nasi lemak" max={80} />
                <Field label="Needs from the shop (optional, separate with commas)" value={needs} onChange={setNeeds} ph="eggs, sambal, cucumber" max={300} />
                <Text style={{ color: DIM, fontSize: 12, marginTop: 14, marginBottom: 6 }}>Who cooks (optional)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {people.map((p) => <Chip key={p.id} t={p.name} color={p.color} on={cook === p.id} onPress={() => setCook(cook === p.id ? null : p.id)} />)}
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <Btn t="Save" kind="main" onPress={() => save()} busy={busy} disabled={!dish.trim()} flex />
                  {at(s.k) ? <Btn t="Remove" kind="danger" onPress={() => save(true)} disabled={busy} /> : null}
                </View>
              </Glass>
            ) : null}
          </View>
        );
      })}
      <Text style={{ color: DIM, fontSize: 11.5, marginLeft: 4 }}>Anyone in the family can edit the menu.</Text>
    </View>
  );
}
