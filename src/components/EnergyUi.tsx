import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from './Txt';
import { ENERGY } from '../lib/patterns';

const buzz = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
const SHORT = ['Energetic', 'Normal', 'Tired', 'Exhausted'];

export const PCT = [90, 60, 35, 15];
/** A round meter. The coloured arc shows how much energy: 90, 60, 35 or 15 percent. */
export function Ring({ lvl, size = 40, empty = false, bolt = false, thick }: { lvl: number; size?: number; empty?: boolean; bolt?: boolean; thick?: number }) {
  const c = ENERGY[lvl][1]; const sw = thick || Math.max(3.5, size * 0.1); const r = (size - sw) / 2; const L = 2 * Math.PI * r; const pc = PCT[lvl];
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.16)" strokeWidth={sw} fill="none" />
        {!empty ? <Circle cx={size / 2} cy={size / 2} r={r} stroke={c} strokeWidth={sw} fill="none" strokeLinecap="round" strokeDasharray={`${L * pc / 100} ${L}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} /> : null}
      </Svg>
      {bolt ? (
        <Svg width={size * 0.3} height={size * 0.3} viewBox="0 0 24 24" style={{ marginBottom: 2 }}><Path d="M13 2 4 14h6l-1 8 9-12h-6z" fill={empty ? 'rgba(255,255,255,.5)' : c} /></Svg>
      ) : null}
      {!empty ? <Text style={{ color: '#fff', fontSize: bolt ? size * 0.2 : Math.max(8, size * 0.25), fontWeight: '800', marginTop: bolt ? 0 : 0 }}>{pc + '%'}</Text> : null}
    </View>
  );
}

/** The four buttons for the Dashboard Quick log. The one the app suggests has a ring around it. */
export function EnergyRow({ suggest, onPick }: { suggest: number | null; onPick: (i: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {ENERGY.map((e, i) => (
        <Pressable key={e[0]} onPress={() => { buzz(); onPick(i); }} hitSlop={3} accessibilityLabel={'Energy ' + e[0] + ' ' + PCT[i] + ' percent'} style={({ pressed }) => ({ width: 46, alignItems: 'center', gap: 3, paddingVertical: 6, borderRadius: 14, borderWidth: suggest === i ? 1.5 : 1, borderColor: suggest === i ? e[1] : 'rgba(255,255,255,.22)', backgroundColor: suggest === i ? e[1] + '30' : 'rgba(255,255,255,.08)', transform: [{ scale: pressed ? 0.94 : 1 }] })}>
          <Ring lvl={i} size={32} />
          <Text numberOfLines={1} style={{ color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: -0.3 }}>{SHORT[i]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** The big Energy card in Habit and Health. */
export function EnergyBig({ en, est, onPick }: { en: number | undefined; est: { lvl: number; why: string } | null; onPick: (i: number | undefined) => void }) {
  const own = en != null && en >= 0; const lvl = own ? (en as number) : est ? est.lvl : -1; const col = lvl >= 0 ? ENERGY[lvl][1] : 'rgba(255,255,255,.6)';
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 14 }}>
        <Ring lvl={lvl >= 0 ? lvl : 3} size={116} bolt empty={lvl < 0} thick={11} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: col, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }}>{own ? 'YOUR RATING' : est ? 'ESTIMATED' : 'NOT LOGGED YET'}</Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 }}>{lvl >= 0 ? ENERGY[lvl][0] : 'How is your energy?'}</Text><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 12, marginTop: 2 }}>{lvl >= 0 ? 'About ' + PCT[lvl] + '% of a full day of energy' : 'Pick one below'}</Text>
        </View>
      </View>
      <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, lineHeight: 18, marginTop: 10 }}>{own ? 'How you said you feel today.' : est ? est.why + '.' : 'Log sleep, water, steps or mood and an estimate appears here.'}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        {ENERGY.map((e, i) => {
          const on = own && en === i; const guess = !own && est && est.lvl === i;
          return (
            <Pressable key={e[0]} onPress={() => { buzz(); onPick(on ? undefined : i); }} accessibilityLabel={'Energy ' + e[0] + ' ' + PCT[i] + ' percent'} style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 7, paddingVertical: 12, paddingHorizontal: 2, borderRadius: 18, borderWidth: on || guess ? 1.5 : 1, borderColor: on || guess ? e[1] : 'rgba(255,255,255,.16)', backgroundColor: on ? e[1] + '40' : 'rgba(255,255,255,.07)', transform: [{ scale: pressed ? 0.95 : 1 }] })}>
              <Ring lvl={i} size={40} />
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: on ? '#fff' : 'rgba(255,255,255,.85)', fontSize: 11.5, fontWeight: on ? '800' : '700' }}>{SHORT[i]}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, marginTop: 10, lineHeight: 15 }}>{own ? 'Tap your choice again to go back to the estimate.' : 'This is a guess from what you logged. Tap how you really feel to replace it.'}</Text>
    </View>
  );
}
