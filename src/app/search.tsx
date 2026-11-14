import React, { useMemo, useState } from 'react';
import { View, TextInput, ScrollView, Pressable } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { Glass } from '../components/Glass';
import { Blob } from '../components/Bg';
import { SEARCH_INDEX } from '../data/searchIndex';
import { ROUTES } from '../lib/routes';
import { TOP } from '../lib/layout';
import { useHidden, modOnName } from '../lib/hidden';

const MODS = ['All', 'Planner', 'Islamic', 'Finance', 'Record', 'Habit', 'Family', 'System'];

export default function Search() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [mod, setMod] = useState('All');
  const hid = useHidden();
  const [note, setNote] = useState('');
  const ql = q.trim().toLowerCase();
  const res = useMemo(() => { const w = ql.split(/\s+/).filter(Boolean); return SEARCH_INDEX.filter((x) => { if (!modOnName(x.m)) return false; if (mod !== 'All' && x.m !== mod) return false; const hay = (x.t + ' ' + x.s + ' ' + x.k + ' ' + x.m).toLowerCase(); return w.every((t) => hay.indexOf(t) >= 0); }); }, [ql, mod, hid.off.join(',')]);
  const open = (h: string) => {
    const r = ROUTES[h];
    if (r) router.push(r as any); else { setNote('This screen is being built and will open here soon.'); setTimeout(() => setNote(''), 2200); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <LinearGradient colors={['#0a0f2c', '#1a1048', '#0c2b4d']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(124,156,255,.5)" style={{ right: -100, top: -40 }} />
      <Blob size={340} color="rgba(183,148,255,.35)" style={{ left: -120, bottom: 0 }} />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 + TOP }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Back">
            <Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <View><Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M15 5l-7 7 7 7" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg></View>
            </Glass>
          </Pressable>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3, flex: 1 }}>Search</Text>
        </View>
        <View style={{ marginTop: 14 }}>
          <View>
            <View style={{ position: 'absolute', left: 14, top: 14, zIndex: 2 }}><Svg width={22} height={22} viewBox="0 0 24 24"><Circle cx={11} cy={11} r={7} stroke="rgba(255,255,255,.7)" strokeWidth={1.8} fill="none" /><Path d="M20 20l-4-4" stroke="rgba(255,255,255,.7)" strokeWidth={1.8} strokeLinecap="round" /></Svg></View>
            <TextInput value={q} onChangeText={setQ} autoFocus placeholder="Search planner, surah, finance, records..." placeholderTextColor="rgba(255,255,255,.5)" style={{ height: 50, borderRadius: 18, paddingLeft: 44, paddingRight: 14, color: '#fff', fontSize: 15, fontWeight: '600', backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', outlineStyle: 'none' } as any} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
            {MODS.filter((n) => modOnName(n)).map((n) => (
              <Pressable key={n} onPress={() => setMod(n)}>
                {mod === n ? (
                  <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999 }}><Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{n}</Text></LinearGradient>
                ) : (
                  <View style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.08)' }}><Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{n}</Text></View>
                )}
              </Pressable>
            ))}
          </ScrollView>
          <Text style={{ marginTop: 14, color: 'rgba(255,255,255,.65)', fontSize: 11.5, fontWeight: '700', letterSpacing: 1.2 }}>{ql ? res.length + ' result' + (res.length === 1 ? '' : 's') : 'Everything in My Life'}</Text>
        </View>
        <ScrollView style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {res.map((r) => (
            <Pressable key={r.t + r.h} onPress={() => open(r.h)}>
              <Glass radius={18} style={{ paddingVertical: 11, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: r.c, shadowColor: r.c, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 14.5, fontWeight: '700' }}>{r.t}</Text>
                  <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 12, marginTop: 1 }}>{r.s}</Text>
                </View>
                <Text style={{ color: r.c, fontSize: 11, fontWeight: '700' }}>{r.m}</Text>
              </Glass>
            </Pressable>
          ))}
          {res.length === 0 && <Glass radius={18} style={{ padding: 18 }}><Text style={{ textAlign: 'center', fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,.75)' }}>Nothing found. Try another word, for example "yasin", "oil" or "budget".</Text></Glass>}
        </ScrollView>
        {!!note && <View style={{ position: 'absolute', left: 20, right: 20, bottom: 30, alignItems: 'center' }}><Glass radius={999} style={{ paddingVertical: 9, paddingHorizontal: 18, backgroundColor: 'rgba(20,26,70,.92)' }}><Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{note}</Text></Glass></View>}
      </SafeAreaView>
    </View>
  );
}
