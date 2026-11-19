import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';
import { useStored } from '../lib/store';
import { useSession } from '../lib/auth';
import { MemSave, MEM_EMPTY } from '../lib/memories';

// Small card on the Dashboard that opens Your Memories. It can be switched off inside Your Memories.
export function MemoriesEntry() {
  const router = useRouter(); const [sess] = useSession();
  const [mem, , ok] = useStored<MemSave>('ml_memories', MEM_EMPTY);
  if (!ok || !sess || (mem && mem.dash === false)) return null;
  const ca = sess.user?.created_at ? new Date(sess.user.created_at) : null;
  const days = ca && !isNaN(ca.getTime()) ? Math.max(1, Math.floor((Date.now() - ca.getTime()) / 86400000) + 1) : 0;
  return (
    <Pressable onPress={() => router.push('/memories' as any)} accessibilityLabel="Open Your Memories with My Life" style={{ marginTop: 14, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', borderTopColor: 'rgba(255,255,255,.4)' }}>
      <LinearGradient colors={['rgba(124,156,255,.4)', 'rgba(183,148,255,.28)', 'rgba(255,180,94,.2)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 14.5, fontWeight: '800' }}>Your Memories with My Life</Text>
          <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12, marginTop: 2 }}>{days ? 'Day ' + days + ' together. Every moment matters.' : 'Every moment matters. Every journey tells a story'}</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 22 }}>›</Text>
      </LinearGradient>
    </Pressable>
  );
}
