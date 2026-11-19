import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';
import { useStored } from '../lib/store';
import { MemSave, MEM_EMPTY } from '../lib/memories';

// Which pages may turn by themselves in the card at the bottom of Home. Quick log is always there.
export const DASH_PAGES: { k: string; t: string; s: string; e: string; c: string }[] = [
  { k: 'prayer', t: 'Next prayer', s: 'The next prayer time and how long is left', e: '🕌', c: '#5ee7b5' },
  { k: 'tasks', t: 'Tasks today', s: 'Tasks due today and any that are late', e: '✅', c: '#5ee7b5' },
  { k: 'event', t: 'Next event', s: 'The nearest event with days left', e: '📅', c: '#8ea8ff' },
  { k: 'job', t: 'Vehicle job', s: 'A maintenance job that is due soon or late', e: '🔧', c: '#7df0c6' },
  { k: 'renew', t: 'Road tax, insurance, licence', s: 'Shows when one expires within 30 days', e: '🏍️', c: '#ffb3c6' },
  { k: 'money', t: 'Money this month', s: 'What is left to spend this month', e: '💰', c: '#ffd24a' },
  { k: 'debt', t: 'Debt payment', s: 'A payment due within 7 days or late', e: '💳', c: '#ffc46b' },
  { k: 'streak', t: 'Streak', s: 'How many days in a row you logged', e: '🔥', c: '#ff9a8b' },
  { k: 'score', t: 'Life score', s: 'Your score for today', e: '🎯', c: '#b794ff' },
  { k: 'tip', t: 'Tip', s: 'A small tip from your own records', e: '💡', c: '#ffd9a8' },
  { k: 'lesson', t: 'Life lesson', s: 'A new short lesson every day, with some of your own', e: '🌱', c: '#b794ff' },
  { k: 'memories', t: 'Your Memories', s: 'Days with My Life 1.0', e: '📖', c: '#ffb3c6' },
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
  const all = () => { setSt({ off: [] }); setMem({ ...MEM_EMPTY, ...(mem || {}), dash: true }); };
  const count = DASH_PAGES.filter((p) => isOn(p.k)).length;
  return { isOn, set, all, count };
}

// A quiet bar in Settings. Tap it to open the full list on its own screen.
export function DashCardPicks() {
  const router = useRouter(); const p = useDashPages();
  return (
    <Pressable onPress={() => router.push('/dashcard' as any)} accessibilityLabel="Open Dashboard card pages" style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.985 : 1 }], borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', borderTopColor: 'rgba(255,255,255,.4)' })}>
      <LinearGradient colors={['rgba(94,231,223,.3)', 'rgba(124,156,255,.3)', 'rgba(183,148,255,.24)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)' }}><Text style={{ fontSize: 20 }}>🏠</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Dashboard card</Text>
          <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, marginTop: 2, lineHeight: 16 }}>Choose what turns by itself on Home</Text>
        </View>
        <View style={{ paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.16)' }}><Text style={{ color: '#fff', fontSize: 11.5, fontWeight: '800' }}>{p.count + 1} pages</Text></View>
        <Text style={{ color: '#fff', fontSize: 22 }}>›</Text>
      </LinearGradient>
    </Pressable>
  );
}
