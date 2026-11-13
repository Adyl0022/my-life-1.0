import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React from 'react';
import { View, TextInput, Pressable, Modal, Platform, Keyboard, Dimensions, ScrollView } from 'react-native';
import { Text } from './Txt';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useNextInput } from '../lib/nextInput';

export const W = '#fff';
export const GP = ['#7c9cff', '#b794ff'] as [string, string];
export const Inp = (p: any) => {
  const n = useNextInput(p);
  const setRef = (el: any) => { n.ref.current = el; if (typeof p.ref === 'function') p.ref(el); else if (p.ref) p.ref.current = el; };
  return <TextInput placeholderTextColor="rgba(255,255,255,.4)" maxFontSizeMultiplier={1.12} {...p} {...n.extra} ref={setRef} style={[{ minWidth: 0, color: W, fontSize: 14, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 14, backgroundColor: 'rgba(0,0,0,.28)', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)', outlineStyle: 'none' } as any, p.style]} />;
};
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const nice = (v: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); return m ? Number(m[3]) + ' ' + MON[Number(m[2]) - 1] + ' ' + m[1] : v; };
export function DateField({ value, onChange, style }: { value: string; onChange: (v: string) => void; style?: any }) {
  if (Platform.OS === 'web') {
    return React.createElement('input', { type: 'date', value, onChange: (e: any) => onChange(e.target.value), style: { color: '#fff', colorScheme: 'dark', fontSize: 14, padding: '10px 12px', borderRadius: 14, background: 'rgba(0,0,0,.28)', border: '1px solid rgba(255,255,255,.14)', outline: 'none', fontFamily: 'inherit', minWidth: 0, ...(style || {}) } });
  }
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + 'T12:00:00') : new Date();
  const fmt = (x: Date) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  const box = { paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(0,0,0,.28)', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)', justifyContent: 'center' as const };
  if (Platform.OS === 'ios') {
    return <View style={[box, { paddingVertical: 4, alignItems: 'flex-start' }, style]}><DateTimePicker value={d} mode="date" display="compact" themeVariant="dark" onChange={(_: any, x?: Date) => x && onChange(fmt(x))} /></View>;
  }
  return (
    <Pressable style={[box, style]} onPress={() => DateTimePickerAndroid.open({ value: d, mode: 'date', onChange: (e: any, x?: Date) => { if (e.type === 'set' && x) onChange(fmt(x)); } })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 16 }}>📅</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: value ? '#fff' : 'rgba(255,255,255,.55)', fontSize: 15, fontWeight: '700' }}>{value ? nice(value) : 'Pick a date'}</Text>
          <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, marginTop: 1 }}>Tap to change the date</Text>
        </View>
      </View>
    </Pressable>
  );
}
// Faint family motifs behind the Family Planner pill: little houses, birds in flight, sparkles.
const FP = 'rgba(255,255,255,.72)';
const Mo = ({ k, s, st }: { k: 'house' | 'bird' | 'spark' | 'dot'; s: number; st: any }) => (
  <View pointerEvents="none" style={[{ position: 'absolute' }, st]}>
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      {k === 'house' ? <Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" stroke={FP} strokeWidth={2} strokeLinejoin="round" /> : null}
      {k === 'bird' ? <Path d="M2 11Q7 4 12 11Q17 4 22 11" stroke={FP} strokeWidth={2.2} strokeLinecap="round" /> : null}
      {k === 'spark' ? <Path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill={FP} /> : null}
      {k === 'dot' ? <Path d="M12 7a3 3 0 1 0 0.01 0zM6 21c0-4 2.5-6 6-6s6 2 6 6z" fill={FP} /> : null}
    </Svg>
  </View>
);
// Picnic-blanket check (soft squares) with a few little stars, behind the Family Planner pill.
const FamPattern = () => (
  <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
    {Array.from({ length: 14 }, (_, i) => <View key={'v' + i} style={{ position: 'absolute', left: i * 20, top: 0, bottom: 0, width: 10, backgroundColor: 'rgba(255,255,255,.10)' }} />)}
    {[5, 25].map((y) => <View key={'h' + y} style={{ position: 'absolute', left: 0, right: 0, top: y, height: 10, backgroundColor: 'rgba(255,255,255,.10)' }} />)}
    <Mo k="spark" s={9} st={{ left: 7, top: 4 }} />
    <Mo k="spark" s={6} st={{ left: 19, bottom: 4 }} />
    <Mo k="spark" s={11} st={{ right: 9, top: 3 }} />
    <Mo k="spark" s={6} st={{ right: 25, bottom: 4 }} />
  </View>
);
export const Pill = ({ t, onPress, on, style, warm, fam }: { t: string; onPress: () => void; on?: boolean; style?: any; warm?: boolean; fam?: boolean }) => (
  <Pressable onPress={onPress} style={style}>
    {fam ? <View style={{ borderRadius: 999, shadowColor: '#2dd4bf', shadowOpacity: 0.7, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8 }}><LinearGradient colors={['#34d399', '#22b8c9', '#5b8def']} locations={[0, 0.55, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 9, paddingHorizontal: 20, borderRadius: 999, overflow: 'hidden', alignItems: 'center', borderWidth: 1.2, borderColor: 'rgba(190,255,240,.85)' }}><FamPattern /><Text style={{ color: W, fontSize: 13, fontWeight: '800', textShadowColor: 'rgba(20,120,140,.9)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } }}>{t}</Text></LinearGradient></View>
      : warm ? <View style={{ borderRadius: 999, shadowColor: '#ff4d2e', shadowOpacity: 0.85, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8 }}><LinearGradient colors={['#ff9500', '#ff4d1f', '#ff1f5a']} locations={[0, 0.55, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, alignItems: 'center', borderWidth: 1.2, borderColor: 'rgba(255,214,170,.9)' }}><Text style={{ color: W, fontSize: 13, fontWeight: '800', textShadowColor: 'rgba(255,60,30,.9)', textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } }}>{t}</Text></LinearGradient></View>
      : on ? <LinearGradient colors={GP} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, alignItems: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>{t}</Text></LinearGradient>
      : <View style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '600' }}>{t}</Text></View>}
  </Pressable>
);
export const SBtn = ({ t, onPress, kind = 'glass', style }: { t: string; onPress: () => void; kind?: 'glass' | 'danger' | 'primary'; style?: any }) => (
  <Pressable onPress={onPress} style={[{ flex: 1 }, style]}>
    <LinearGradient colors={kind === 'primary' ? GP : kind === 'danger' ? ['rgba(255,107,129,.28)', 'rgba(255,107,129,.28)'] : ['rgba(255,255,255,.12)', 'rgba(255,255,255,.12)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 11, borderRadius: 14, alignItems: 'center' }}>
      <Text style={{ color: kind === 'danger' ? '#ffb3bf' : W, fontSize: 13.5, fontWeight: '700' }}>{t}</Text>
    </LinearGradient>
  </Pressable>
);
export function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const [kb, setKb] = React.useState(0);
  const [h, setH] = React.useState(0);
  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    const a = Keyboard.addListener('keyboardDidShow', (e: any) => setKb(e.endCoordinates.height));
    const b = Keyboard.addListener('keyboardDidHide', () => setKb(0));
    return () => { a.remove(); b.remove(); };
  }, []);
  const full = Dimensions.get('window').height;
  const pad = h >= full - 120 ? kb : 0;
  return (
    <Modal transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
      <View onLayout={(e) => setH(e.nativeEvent.layout.height)} style={{ flex: 1, backgroundColor: 'rgba(5,8,25,.72)', paddingBottom: pad }}>
        <Pressable onPress={onClose} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}
export const Toast = ({ t }: { t: string }) => t ? <View pointerEvents="none" style={{ position: 'absolute', bottom: 40, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.75)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '600' }}>{t}</Text></View> : null;
export const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
