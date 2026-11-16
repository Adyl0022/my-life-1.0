import React from 'react';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';
import { DIM } from './FamilyUi';

// The pill with the chosen tab in the app's pink-to-gold gradient (same look as Activities).
export function HouseTabs<K extends string>({ tabs, v, onChange }: { tabs: [K, string][]; v: K; onChange: (k: K) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,.3)', borderRadius: 999, padding: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,.15)', marginBottom: 14 }}>
      {tabs.map(([k, t]) => (
        <Pressable key={k} onPress={() => onChange(k)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
          {v === k
            ? <LinearGradient colors={['#ff8fab', '#ffc46b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 7, paddingHorizontal: 16, borderRadius: 999 }}><Text style={{ color: '#2a1740', fontSize: 13, fontWeight: '800' }}>{t}</Text></LinearGradient>
            : <View style={{ paddingVertical: 7, paddingHorizontal: 16 }}><Text style={{ color: DIM, fontSize: 13 }}>{t}</Text></View>}
        </Pressable>
      ))}
    </View>
  );
}
