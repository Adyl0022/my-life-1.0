import React from 'react';
import { View } from 'react-native';
import { Pressable } from './Press';
import { Text } from './Txt';
import { Glass } from './Glass';
import { useAnnouncement, closeAnnouncement } from '../lib/announcement';

export function Announcement() {
  const { a, unread } = useAnnouncement();
  if (!a) return null;
  return (
    <Glass radius={20} style={{ padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
      <Text style={{ fontSize: 18 }}>📣</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#ffd593', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.6 }}>{unread ? 'NEW MESSAGE' : 'MESSAGE'}</Text>
        <Text style={{ color: '#fff', fontSize: 13.5, lineHeight: 19, marginTop: 3 }}>{a.msg}</Text>
      </View>
      <Pressable onPress={closeAnnouncement} hitSlop={10} accessibilityLabel="Close message"><Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 16 }}>✕</Text></Pressable>
    </Glass>
  );
}
