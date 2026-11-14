import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './Txt';
import { Glass } from './Glass';
import { useStored } from '../lib/store';

const VER: string = String(require('../../app.json').expo.version || '');

const HOURS = 1;
// True while the What's new card should show: until it is closed or opened, and at most 1 hour after this version first appeared.
export function useWhatsNew() {
  const [seen, setSeen, ok] = useStored<string>('ml_seen_ver', '');
  const [first, setFirst, ok2] = useStored<{ v: string; t: number }>('ml_ver_first', { v: '', t: 0 });
  React.useEffect(() => { if (ok && ok2 && seen !== VER && first.v !== VER) setFirst({ v: VER, t: Date.now() }); }, [ok, ok2, seen, first.v]);
  const fresh = first.v !== VER || Date.now() - first.t < HOURS * 3600000;
  return { show: ok && ok2 && !!VER && seen !== VER && fresh, done: () => setSeen(VER) };
}

// A card at the top of Settings, shown once after an update, like the message from the owner. The X hides it for this version.
export function WhatsNewCard({ onOpen }: { onOpen: () => void }) {
  const { show, done } = useWhatsNew();
  if (!show) return null;
  return (
    <Glass radius={20} style={{ padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <Text style={{ fontSize: 18 }}>✨</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#9fe6ff', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.6 }}>NEW IN {VER}</Text>
        <Text style={{ color: '#fff', fontSize: 13.5, lineHeight: 19, marginTop: 3 }}>Family Planner, step sensor, Budget left in Life Score, renewal reminders and more.</Text>
        <Pressable onPress={() => { done(); onOpen(); }} hitSlop={8} style={{ marginTop: 8, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(124,156,255,.4)' }}>
          <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>See what's new</Text>
        </Pressable>
      </View>
      <Pressable onPress={done} hitSlop={10} accessibilityLabel="Close"><Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 16 }}>✕</Text></Pressable>
    </Glass>
  );
}
