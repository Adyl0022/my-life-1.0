import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';

// A quiet entry in Settings, About. It shows no numbers: you open it when you want to look back.
export function MemoriesCard() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push('/memories' as any)} accessibilityLabel="Open Your Memories with My Life 1.0" style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.985 : 1 }], borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', borderTopColor: 'rgba(255,255,255,.4)' })}>
      <LinearGradient colors={['rgba(124,156,255,.4)', 'rgba(183,148,255,.3)', 'rgba(255,180,94,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)' }}><Text style={{ fontSize: 20 }}>📖</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Your Memories with My Life 1.0</Text>
          <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, marginTop: 2, lineHeight: 16 }}>Every moment matters. Every journey tells a story</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 22 }}>›</Text>
      </LinearGradient>
    </Pressable>
  );
}
