import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './Txt';
import { Glass } from './Glass';
import { useStored } from '../lib/store';
import { MemSave, MEM_EMPTY } from '../lib/memories';

// Which pages may turn by themselves in the card at the bottom of Home. Quick log is always there.
export const DASH_PAGES: [string, string, string][] = [
  ['prayer', 'Next prayer', 'The next prayer time and how long is left'],
  ['event', 'Next event', 'The nearest event with days left'],
  ['job', 'Vehicle job', 'A maintenance job that is due soon or late'],
  ['money', 'Money this month', 'What is left to spend this month'],
  ['streak', 'Streak', 'How many days in a row you logged'],
  ['score', 'Life score', 'Your score for today'],
  ['tip', 'Tip', 'A small tip from your own records'],
  ['memories', 'Your Memories', 'Days with My Life 1.0'],
];
export function useDashPages() {
  const [st, setSt] = useStored<{ off: string[] }>('ml_dashpages', { off: [] });
  const [mem, setMem] = useStored<MemSave>('ml_memories', MEM_EMPTY);
  const off = (st && st.off) || [];
  const isOn = (k: string) => (k === 'memories' ? !(mem && mem.dash === false) : off.indexOf(k) < 0);
  const set = (k: string, v: boolean) => {
    if (k === 'memories') { setMem({ ...MEM_EMPTY, ...(mem || {}), dash: v }); return; }
    setSt({ off: v ? off.filter((x) => x !== k) : [...off.filter((x) => x !== k), k] });
  };
  return { isOn, set };
}

export function DashCardPicks() {
  const p = useDashPages();
  return (
    <Glass style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Dashboard card</Text>
      <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 4, lineHeight: 17 }}>Choose which pages turn by themselves in the card at the bottom of Home. Quick log is always shown. A page also stays hidden when there is nothing to show.</Text>
      {DASH_PAGES.map(([k, t, s], i) => { const on = p.isOn(k); return (
        <Pressable key={k} onPress={() => p.set(k, !on)} accessibilityLabel={(on ? 'Hide ' : 'Show ') + t + ' on the Dashboard card'} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: 'rgba(255,255,255,.1)', marginTop: i === 0 ? 8 : 0 }}>
          <View style={{ flex: 1 }}><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{t}</Text><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, marginTop: 1 }}>{s}</Text></View>
          <View style={{ width: 44, height: 26, borderRadius: 13, padding: 3, backgroundColor: on ? '#5ee7b5' : 'rgba(255,255,255,.2)', alignItems: on ? 'flex-end' : 'flex-start' }}><View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: on ? '#0d3a2c' : '#fff' }} /></View>
        </Pressable>); })}
    </Glass>
  );
}
