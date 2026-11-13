import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';
import { Glass } from './Glass';
import { ChipIcon } from './dashArt';
import { ALL_MODS, useHidden } from '../lib/hidden';

const KEY: Record<string, string> = { planner: 'Planner', islamic: 'Islamic', finance: 'Finance', record: 'Record', habit: 'Habit' };
const G: [string, string] = ['#7c9cff', '#b794ff'];

// Turn modules on or off. Data stays saved; a module that is off disappears from the Dashboard, Search, Stats, Insights, Assistant and its reminders.
export function ModulesCard() {
  const h = useHidden();
  const [msg, setMsg] = useState('');
  return (
    <Glass style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Modules</Text>
      <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 2, lineHeight: 17 }}>Turn off what you do not use. Your data stays saved and comes back when you turn it on again.</Text>
      {ALL_MODS.map((m, i) => {
        const on = h.on(m.k);
        return (
          <Pressable key={m.k} onPress={() => { const ok = h.toggle(m.k); setMsg(ok ? '' : 'At least one module has to stay on.'); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: 'rgba(255,255,255,.1)', marginTop: i === 0 ? 8 : 0 }}>
            <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: m.c, alignItems: 'center', justifyContent: 'center' }}><ChipIcon k={KEY[m.k]} /></View>
            <View style={{ flex: 1 }}><Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{m.name}</Text><Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 11.5 }}>{m.sub}</Text></View>
            <LinearGradient colors={on ? G : ['rgba(255,255,255,.22)', 'rgba(255,255,255,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 26, borderRadius: 13, padding: 3 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', marginLeft: on ? 18 : 0 }} />
            </LinearGradient>
          </Pressable>
        );
      })}
      {msg ? <Text style={{ color: '#ffd593', fontSize: 12, paddingBottom: 8 }}>{msg}</Text> : <View style={{ height: 6 }} />}
    </Glass>
  );
}
