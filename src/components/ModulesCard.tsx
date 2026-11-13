import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';
import { Glass } from './Glass';
import { ChipIcon } from './dashArt';
import { ALL_MODS, useHidden, useModOrder } from '../lib/hidden';

const KEY: Record<string, string> = { planner: 'Planner', islamic: 'Islamic', finance: 'Finance', record: 'Record', habit: 'Habit' };
const G: [string, string] = ['#7c9cff', '#b794ff'];

// Turn modules on or off. Data stays saved; a module that is off disappears from the Dashboard, Search, Stats, Insights, Assistant and its reminders.
export function ModulesCard() {
  const h = useHidden(); const mo = useModOrder();
  const [msg, setMsg] = useState('');
  const by = (k: string) => ALL_MODS.find((m) => m.k === k)!;
  // Rows in Dashboard order: the Habit & Health banner is first or last.
  const keys = mo.habitTop ? ['habit', ...mo.order] : [...mo.order, 'habit'];
  const Arrow = ({ up, off, onPress }: { up: boolean; off: boolean; onPress: () => void }) => (
    <Pressable onPress={off ? undefined : onPress} hitSlop={6} style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center', opacity: off ? 0.28 : 1 }}>
      <Text style={{ color: '#fff', fontSize: 11 }}>{up ? '▲' : '▼'}</Text>
    </Pressable>
  );
  return (
    <Glass style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Modules</Text>
      <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 2, lineHeight: 17 }}>Turn off what you do not use and use the arrows to set the order on your Dashboard. Your data stays saved and comes back when you turn a module on again.</Text>
      {keys.map((k, i) => {
        const m = by(k); const on = h.on(m.k); const isHabit = k === 'habit';
        const idx = mo.order.indexOf(k as any);
        return (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: 'rgba(255,255,255,.1)', marginTop: i === 0 ? 8 : 0 }}>
            <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: m.c, alignItems: 'center', justifyContent: 'center', opacity: on ? 1 : 0.5 }}><ChipIcon k={KEY[m.k]} /></View>
            <View style={{ flex: 1, opacity: on ? 1 : 0.55 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{m.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 11.5 }}>{isHabit ? 'Banner at the top or bottom of your Dashboard' : m.sub}</Text>
            </View>
            {isHabit
              ? <><Arrow up off={mo.habitTop} onPress={() => mo.setHabitTop(true)} /><Arrow up={false} off={!mo.habitTop} onPress={() => mo.setHabitTop(false)} /></>
              : <><Arrow up off={idx === 0} onPress={() => mo.move(k as any, -1)} /><Arrow up={false} off={idx === mo.order.length - 1} onPress={() => mo.move(k as any, 1)} /></>}
            <Pressable onPress={() => { const ok = h.toggle(m.k); setMsg(ok ? '' : 'At least one module has to stay on.'); }} hitSlop={6}>
              <LinearGradient colors={on ? G : ['rgba(255,255,255,.22)', 'rgba(255,255,255,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 26, borderRadius: 13, padding: 3 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', marginLeft: on ? 18 : 0 }} />
              </LinearGradient>
            </Pressable>
          </View>
        );
      })}
      {msg ? <Text style={{ color: '#ffd593', fontSize: 12, paddingBottom: 8 }}>{msg}</Text> : <View style={{ height: 6 }} />}
    </Glass>
  );
}
