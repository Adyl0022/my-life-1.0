import React from 'react';
import { View, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Glass } from './Glass';
import { Text } from './Txt';
import { initial } from '../lib/family';
import { useNextInput } from '../lib/nextInput';

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

export function Btn({ t, onPress, kind = 'ghost', busy, disabled, flex, solid }: { t: string; onPress: () => void; kind?: 'main' | 'ghost' | 'danger' | 'good'; busy?: boolean; disabled?: boolean; flex?: boolean; solid?: boolean }) {
  const off = disabled || busy;
  const inner = busy ? <ActivityIndicator color={kind === 'main' ? '#2a1030' : '#fff'} /> : <Text style={{ color: kind === 'main' ? '#2a1030' : kind === 'danger' ? '#ffb3bf' : kind === 'good' ? '#8ff0d4' : W, fontSize: 13.5, fontWeight: '800' }}>{t}</Text>;
  return (
    <Pressable onPress={off ? undefined : onPress} style={({ pressed }) => ({ flex: flex ? 1 : undefined, opacity: off ? 0.55 : pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
      {kind === 'main'
        ? <LinearGradient colors={['#ff8fab', '#ffc46b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999, alignItems: 'center' }}>{inner}</LinearGradient>
        : <View style={{ paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999, alignItems: 'center', backgroundColor: solid ? (kind === 'danger' ? '#3d2c4c' : kind === 'good' ? '#1c4252' : '#343d5a') : kind === 'danger' ? 'rgba(255,107,129,.16)' : kind === 'good' ? 'rgba(52,211,153,.18)' : 'rgba(255,255,255,.12)', borderWidth: kind === 'danger' || kind === 'good' ? 1 : 0, borderColor: kind === 'good' ? 'rgba(52,211,153,.5)' : 'rgba(255,107,129,.45)' }}>{inner}</View>}
    </Pressable>
  );
}

export const Field = ({ label, value, onChange, ph, max = 30, caps }: { label: string; value: string; onChange: (s: string) => void; ph?: string; max?: number; caps?: boolean }) => {
  const n = useNextInput({});
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, fontWeight: '600' }}>{label}</Text>
      <TextInput ref={n.ref} {...n.extra} value={value} onChangeText={onChange} placeholder={ph} placeholderTextColor="rgba(255,255,255,.4)" maxLength={max} autoCapitalize={caps ? 'characters' : 'words'} autoCorrect={false}
        style={{ marginTop: 6, color: W, fontSize: 15, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 16, backgroundColor: 'rgba(0,0,0,.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }} />
    </View>
  );
};

export const Note = ({ t, warm }: { t: string; warm?: boolean }) => (
  <View style={{ padding: 12, borderRadius: 16, backgroundColor: warm ? 'rgba(255,213,147,.12)' : 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: warm ? 'rgba(255,213,147,.45)' : 'rgba(255,255,255,.12)' }}>
    <Text style={{ color: warm ? '#ffe0ad' : DIM, fontSize: 12.5, lineHeight: 18 }}>{t}</Text>
  </View>
);

// Small line icons used by the family screens.
const ICO: Record<string, string> = {
  tasks: 'M5 12.5l4.500 4.500L19 7.500',
  shop: 'M3 4h2.500l2 11h10.500l2-8H6.500',
  undo: 'M4 12a8 8 0 1 0 3-6.200M4 4v4.500h4.500',
  plus: 'M12 5v14M5 12h14',
  star: 'M12 3l2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100-4.400-4.300 6.100-.9z',
  pencil: 'M4 20l1-4L16.500 4.500a2 2 0 0 1 3 3L8 19z',
  repeat: 'M17 2l3 3-3 3M20 5H8a4 4 0 0 0-4 4v1M7 22l-3-3 3-3M4 19h12a4 4 0 0 0 4-4v-1',
  clock: 'M12 7v5l3 2',
};
export const Ico = ({ k, c = W, s = 20, w = 2 }: { k: string; c?: string; s?: number; w?: number }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <Path d={ICO[k] || ''} stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    {k === 'shop' ? <><Circle cx={9} cy={19.500} r={1.300} fill={c} /><Circle cx={17} cy={19.500} r={1.300} fill={c} /></> : null}
    {k === 'clock' ? <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={w} /> : null}
  </Svg>
);

// A row on the family home screen.
export const Tile = ({ ic, c, t, sub, onPress }: { ic: string; c: string; t: string; sub: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1, transform: [{ scale: pressed ? 0.97 : 1 }], marginBottom: 10 })}>
    <Glass flat radius={22} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: c + '2b', alignItems: 'center', justifyContent: 'center' }}><Ico k={ic} c={c} s={22} /></View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>{t}</Text>
        <Text style={{ color: DIM, fontSize: 12, marginTop: 1 }}>{sub}</Text>
      </View>
      <Text style={{ color: DIM, fontSize: 22, marginTop: -2 }}>›</Text>
    </Glass>
  </Pressable>
);

// "+ New" button in the top corner of a list screen.
export const NewBtn = ({ onPress, t = '+ New' }: { onPress: () => void; t?: string }) => (
  <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.93 : 1 }] })}>
    <LinearGradient colors={['#ff8fab', '#ffc46b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999 }}>
      <Text style={{ color: '#2a1030', fontSize: 13.5, fontWeight: '800' }}>{t}</Text>
    </LinearGradient>
  </Pressable>
);

export const Chip = ({ t, on, onPress, color }: { t: string; on?: boolean; onPress: () => void; color?: string }) => (
  <Pressable onPress={onPress} style={({ pressed }) => ({ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: on ? (color || '#5ee7df') : 'rgba(255,255,255,.1)', opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] })}>
    <Text style={{ color: on ? '#0a0f2c' : W, fontSize: 12.5, fontWeight: '800' }}>{t}</Text>
  </Pressable>
);

// Round tick box for tasks and shopping items.
export const Tick = ({ on, onPress, c = '#5ee7df' }: { on: boolean; onPress: () => void; c?: string }) => (
  <Pressable onPress={onPress} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.85 : 1 }] })} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
    <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: on ? c : 'rgba(255,255,255,.45)', backgroundColor: on ? c : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      {on ? <Ico k="tasks" c="#0a0f2c" s={15} w={3} /> : null}
    </View>
  </Pressable>
);
