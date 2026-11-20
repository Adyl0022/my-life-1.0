import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from './Txt';
import { ENERGY } from '../lib/patterns';

const buzz = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
const SHORT = ['Energetic', 'Normal', 'Tired', 'Exhausted'];

/** A battery with four segments. Level 0 is the fullest (very energetic) and level 3 is almost empty (exhausted). */
export function Battery({ lvl, w = 30, h = 16, empty = false }: { lvl: number; w?: number; h?: number; empty?: boolean }) {
  const c = ENERGY[lvl][1]; const full = 4 - lvl; const pad = Math.max(2, Math.round(h * 0.16)); const gap = Math.max(1.5, Math.round(h * 0.1));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: w, height: h, borderRadius: h * 0.3, borderWidth: Math.max(1.5, h * 0.09), borderColor: empty ? 'rgba(255,255,255,.4)' : c, padding: pad, flexDirection: 'row', gap }}>
        {[0, 1, 2, 3].map((i) => (<View key={i} style={{ flex: 1, borderRadius: h * 0.12, backgroundColor: !empty && i < full ? c : 'rgba(255,255,255,.14)' }} />))}
      </View>
      <View style={{ width: Math.max(2, h * 0.14), height: h * 0.4, borderTopRightRadius: 2, borderBottomRightRadius: 2, backgroundColor: empty ? 'rgba(255,255,255,.4)' : c, marginLeft: 1 }} />
    </View>
  );
}

/** The four battery buttons for the Dashboard Quick log. The one the app suggests has a ring. */
export function EnergyRow({ suggest, onPick }: { suggest: number | null; onPick: (i: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {ENERGY.map((e, i) => (
        <Pressable key={e[0]} onPress={() => { buzz(); onPick(i); }} hitSlop={4} accessibilityLabel={'Energy ' + e[0]} style={({ pressed }) => ({ paddingVertical: 8, paddingHorizontal: 7, borderRadius: 14, borderWidth: suggest === i ? 1.5 : 1, borderColor: suggest === i ? e[1] : 'rgba(255,255,255,.22)', backgroundColor: suggest === i ? e[1] + '30' : 'rgba(255,255,255,.08)', transform: [{ scale: pressed ? 0.94 : 1 }] })}>
          <Battery lvl={i} w={26} h={14} />
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14 }}>
        {lvl >= 0 ? <Battery lvl={lvl} w={96} h={48} /> : <Battery lvl={3} w={96} h={48} empty />}
        <View style={{ flex: 1 }}>
          <Text style={{ color: col, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }}>{own ? 'YOUR RATING' : est ? 'ESTIMATED' : 'NOT LOGGED YET'}</Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 }}>{lvl >= 0 ? ENERGY[lvl][0] : 'How is your energy?'}</Text>
        </View>
      </View>
      <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, lineHeight: 18, marginTop: 10 }}>{own ? 'How you said you feel today.' : est ? est.why + '.' : 'Log sleep, water, steps or mood and an estimate appears here.'}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        {ENERGY.map((e, i) => {
          const on = own && en === i; const guess = !own && est && est.lvl === i;
          return (
            <Pressable key={e[0]} onPress={() => { buzz(); onPick(on ? undefined : i); }} accessibilityLabel={'Energy ' + e[0]} style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 7, paddingVertical: 12, paddingHorizontal: 2, borderRadius: 18, borderWidth: on || guess ? 1.5 : 1, borderColor: on || guess ? e[1] : 'rgba(255,255,255,.16)', backgroundColor: on ? e[1] + '40' : 'rgba(255,255,255,.07)', transform: [{ scale: pressed ? 0.95 : 1 }] })}>
              <Battery lvl={i} w={34} h={17} />
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: on ? '#fff' : 'rgba(255,255,255,.85)', fontSize: 11.5, fontWeight: on ? '800' : '700' }}>{SHORT[i]}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, marginTop: 10, lineHeight: 15 }}>{own ? 'Tap your choice again to go back to the estimate.' : 'This is a guess from what you logged. Tap how you really feel to replace it.'}</Text>
    </View>
  );
}
