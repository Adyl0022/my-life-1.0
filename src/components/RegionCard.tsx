import React, { useState } from 'react';
import { View, Pressable, ScrollView, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';
import { Glass } from './Glass';
import { useRegion, CURRENCIES, COUNTRIES, curOf, countryOf } from '../lib/region';

const W = '#fff';
const dim = 'rgba(255,255,255,.6)';

// Small rounded tile that holds a flag.
const Flag = ({ f, on }: { f: string; on?: boolean }) => (
  <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: on ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 20 }}>{f}</Text>
  </View>
);

type Item = { id: string; flag: string; title: string; sub: string; pill?: string; group: string };

function Sheet({ title, ph, items, sel, onPick, onClose }: { title: string; ph: string; items: Item[]; sel: string; onPick: (id: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const k = q.trim().toLowerCase();
  const shown = items.filter((i) => !k || (i.title + ' ' + i.sub + ' ' + (i.pill || '')).toLowerCase().includes(k));
  const cur = shown.find((i) => i.id === sel);
  const groups: string[] = []; shown.forEach((i) => { if (i.id !== sel && groups.indexOf(i.group) < 0) groups.push(i.group); });
  const Opt = ({ i }: { i: Item }) => {
    const on = i.id === sel;
    const inner = (
      <>
        <Flag f={i.flag} on={on} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>{i.title}</Text>
          <Text style={{ color: dim, fontSize: 11.5, marginTop: 1 }}>{i.sub}</Text>
        </View>
        {i.pill ? (
          on
            ? <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ minWidth: 44, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999, alignItems: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>{i.pill}</Text></LinearGradient>
            : <View style={{ minWidth: 44, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999, alignItems: 'center', backgroundColor: 'rgba(255,255,255,.1)' }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>{i.pill}</Text></View>
        ) : null}
        {on ? <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#5ee7df', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#06222a', fontSize: 12, fontWeight: '900' }}>✓</Text></View> : null}
      </>
    );
    return (
      <Pressable onPress={() => onPick(i.id)} style={{ marginTop: 4 }}>
        {on
          ? <LinearGradient colors={['rgba(124,156,255,.38)', 'rgba(183,148,255,.28)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(167,160,255,.7)' }}>{inner}</LinearGradient>
          : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 18 }}>{inner}</View>}
      </Pressable>
    );
  };
  const Hd = ({ t }: { t: string }) => <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginTop: 16, marginBottom: 2, marginLeft: 4 }}>{t.toUpperCase()}</Text>;
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(3,5,18,.6)', justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <LinearGradient colors={['#1a1f5a', '#12184a', '#0f1a44']} style={{ height: '85%', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderTopWidth: 1, borderColor: 'rgba(255,255,255,.2)', paddingTop: 10, paddingHorizontal: 18 }}>
          <View style={{ width: 44, height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.35)', alignSelf: 'center', marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: W, fontSize: 19, fontWeight: '800' }}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 14 }}>✕</Text></Pressable>
          </View>
          <TextInput value={q} onChangeText={setQ} placeholder={ph} placeholderTextColor="rgba(255,255,255,.45)" autoCorrect={false} style={{ marginTop: 12, color: W, fontSize: 14, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 16, backgroundColor: 'rgba(0,0,0,.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)' }} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {cur ? <><Hd t="Selected" /><Opt i={cur} /></> : null}
            {groups.map((g) => (
              <View key={g}><Hd t={g} />{shown.filter((i) => i.group === g && i.id !== sel).map((i) => <Opt key={i.id} i={i} />)}</View>
            ))}
            {!shown.length ? <Text style={{ color: dim, fontSize: 13, textAlign: 'center', marginTop: 30 }}>Nothing found</Text> : null}
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const Field = ({ k, flag, title, sub, pill, onPress }: { k: string; flag: string; title: string; sub: string; pill?: string; onPress: () => void }) => (
  <View style={{ marginTop: 14 }}>
    <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, fontWeight: '600' }}>{k}</Text>
    <Pressable onPress={onPress} style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 9, paddingRight: 12, borderRadius: 16, backgroundColor: 'rgba(0,0,0,.28)', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)' }}>
      <Flag f={flag} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>{title}</Text>
        <Text style={{ color: dim, fontSize: 11.5, marginTop: 1 }}>{sub}</Text>
      </View>
      {pill ? <View style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(124,156,255,.28)', borderWidth: 1, borderColor: 'rgba(124,156,255,.4)' }}><Text style={{ color: W, fontSize: 12, fontWeight: '800' }}>{pill}</Text></View> : null}
      <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 20 }}>›</Text>
    </Pressable>
  </View>
);

export function RegionCard() {
  const [r, setR] = useRegion();
  const [open, setOpen] = useState<'' | 'country' | 'cur'>('');
  const co = countryOf(r.cc); const cu = curOf(r.cur);
  const countries: Item[] = COUNTRIES.map((c) => ({ id: c.cc, flag: c.flag, title: c.name, sub: curOf(c.cur).code + ' · ' + curOf(c.cur).sym, group: 'All countries' }));
  const curs: Item[] = CURRENCIES.map((c) => ({ id: c.code, flag: c.flag, title: c.name, sub: c.where + ' · ' + c.code, pill: c.sym, group: c.grp }));
  return (
    <Glass style={{ padding: 16 }}>
      <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Region</Text>
      <Field k="Country" flag={co.flag} title={co.name} sub="Public holidays in Planner" onPress={() => setOpen('country')} />
      <Field k="Currency" flag={cu.flag} title={cu.name} sub={cu.code} pill={cu.sym} onPress={() => setOpen('cur')} />
      <Text style={{ color: dim, fontSize: 11.5, marginTop: 12, lineHeight: 16 }}>This only changes how amounts look. Your numbers are not converted.</Text>
      {open === 'country' ? (
        <Sheet title="Choose country" ph="Search country" items={countries} sel={r.cc} onClose={() => setOpen('')}
          onPick={(id) => { const c = countryOf(id); setR({ cc: c.cc, cur: r.cur }); setOpen(''); }} />
      ) : null}
      {open === 'cur' ? (
        <Sheet title="Choose currency" ph="Search currency or country" items={curs} sel={r.cur} onClose={() => setOpen('')}
          onPick={(id) => { setR({ cc: r.cc, cur: id }); setOpen(''); }} />
      ) : null}
    </Glass>
  );
}
