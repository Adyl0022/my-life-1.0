import React from 'react';
import { View, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';
import { initial } from '../lib/family';

export const W = '#fff';
export const DIM = 'rgba(255,255,255,.68)';

export const Avatar = ({ name, color, size = 38, ring }: { name: string; color: string; size?: number; ring?: boolean }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderWidth: ring ? 2 : 0, borderColor: '#0f1f3d' }}>
    <Text style={{ color: '#10153a', fontSize: size * 0.38, fontWeight: '800' }}>{initial(name)}</Text>
  </View>
);

export const Pill = ({ t, c = 'rgba(255,255,255,.14)' }: { t: string; c?: string }) => (
  <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: c }}><Text style={{ color: W, fontSize: 11.5, fontWeight: '800' }}>{t}</Text></View>
);

export const Label = ({ t }: { t: string }) => (
  <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, fontWeight: '800', letterSpacing: 1.3, marginTop: 18, marginBottom: 8, marginLeft: 4 }}>{t.toUpperCase()}</Text>
);

export function Btn({ t, onPress, kind = 'ghost', busy, disabled, flex }: { t: string; onPress: () => void; kind?: 'main' | 'ghost' | 'danger'; busy?: boolean; disabled?: boolean; flex?: boolean }) {
  const off = disabled || busy;
  const inner = busy ? <ActivityIndicator color={kind === 'main' ? '#2a1030' : '#fff'} /> : <Text style={{ color: kind === 'main' ? '#2a1030' : kind === 'danger' ? '#ffb3bf' : W, fontSize: 13.5, fontWeight: '800' }}>{t}</Text>;
  return (
    <Pressable onPress={off ? undefined : onPress} style={({ pressed }) => ({ flex: flex ? 1 : undefined, opacity: off ? 0.55 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      {kind === 'main'
        ? <LinearGradient colors={['#ff8fab', '#ffc46b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999, alignItems: 'center' }}>{inner}</LinearGradient>
        : <View style={{ paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999, alignItems: 'center', backgroundColor: kind === 'danger' ? 'rgba(255,107,129,.16)' : 'rgba(255,255,255,.12)', borderWidth: kind === 'danger' ? 1 : 0, borderColor: 'rgba(255,107,129,.45)' }}>{inner}</View>}
    </Pressable>
  );
}

export const Field = ({ label, value, onChange, ph, max = 30, caps }: { label: string; value: string; onChange: (s: string) => void; ph?: string; max?: number; caps?: boolean }) => (
  <View style={{ marginTop: 12 }}>
    <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, fontWeight: '600' }}>{label}</Text>
    <TextInput value={value} onChangeText={onChange} placeholder={ph} placeholderTextColor="rgba(255,255,255,.4)" maxLength={max} autoCapitalize={caps ? 'characters' : 'words'} autoCorrect={false}
      style={{ marginTop: 6, color: W, fontSize: 15, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 16, backgroundColor: 'rgba(0,0,0,.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }} />
  </View>
);

export const Note = ({ t, warm }: { t: string; warm?: boolean }) => (
  <View style={{ padding: 12, borderRadius: 16, backgroundColor: warm ? 'rgba(255,213,147,.12)' : 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: warm ? 'rgba(255,213,147,.45)' : 'rgba(255,255,255,.12)' }}>
    <Text style={{ color: warm ? '#ffe0ad' : DIM, fontSize: 12.5, lineHeight: 18 }}>{t}</Text>
  </View>
);
