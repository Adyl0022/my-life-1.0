import React from 'react';
import { View } from 'react-native';
import { Pressable } from './Press';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';
import { useMonths } from '../lib/useMonth';

// Entry card under the suggestions in Insights: opens the full "Your month" summary. Shows last month when there is one, otherwise the month so far.
export function MonthCard() {
  const router = useRouter(); const m = useMonths();
  const s = m.last.hasData ? m.last : m.cur;
  const sub = !s.hasData ? 'Log a few days and your summary will appear here' : s.partial ? s.name + ' so far · ' + s.headline : s.name + ' · ' + s.headline;
  return (
    <Pressable onPress={() => router.push('/monthly' as any)} accessibilityLabel="Open your month in review" style={({ pressed }) => ({ marginTop: 14, transform: [{ scale: pressed ? 0.985 : 1 }], borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.24)' })}>
      <LinearGradient colors={['rgba(124,156,255,.42)', 'rgba(183,148,255,.3)', 'rgba(94,231,223,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 15, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
        <View style={{ width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)' }}>
          <Text style={{ color: '#fff', fontSize: s.score !== null ? 17 : 20, fontWeight: '800' }}>{s.score !== null ? s.score : '📅'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.3 }}>YOUR MONTH IN REVIEW</Text>
          <Text numberOfLines={2} style={{ color: '#fff', fontSize: 14.5, fontWeight: '800', marginTop: 3, lineHeight: 19 }}>{sub}</Text>
          <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, marginTop: 3 }}>Your life, wins, what to improve and next goals</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 22 }}>›</Text>
      </LinearGradient>
    </Pressable>
  );
}
