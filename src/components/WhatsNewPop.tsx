import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './Txt';
import { Glass } from './Glass';
import { useStored } from '../lib/store';

const VER: string = String(require('../../app.json').expo.version || '');

// A card at the top of Settings, shown once after an update, like the message from the owner. The X hides it for this version.
export function WhatsNewCard({ onOpen }: { onOpen: () => void }) {
  const [seen, setSeen, ok] = useStored<string>('ml_seen_ver', '');
  if (!ok || !VER || seen === VER) return null;
  return (
    <Glass radius={20} style={{ padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <Text style={{ fontSize: 18 }}>✨</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#9fe6ff', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.6 }}>NEW IN {VER}</Text>
        <Text style={{ color: '#fff', fontSize: 13.5, lineHeight: 19, marginTop: 3 }}>Family Planner, step sensor, Budget left in Life Score, renewal reminders and more.</Text>
        <Pressable onPress={() => { setSeen(VER); onOpen(); }} hitSlop={8} style={{ marginTop: 8, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(124,156,255,.4)' }}>
          <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>See what's new</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => setSeen(VER)} hitSlop={10} accessibilityLabel="Close"><Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 16 }}>✕</Text></Pressable>
    </Glass>
  );
}
