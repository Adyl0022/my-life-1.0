import React from 'react';
import { View, Platform } from 'react-native';
import { Pressable } from './Press';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';
import { Text } from './Txt';
import { LineIcon } from './LineIcon';
import { pendingCharge, rm, num, type SubStore } from '../lib/subs';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const buzz = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };

/** When a subscription's charge day has come, ask once whether it was charged and, if so, add it to your spending. Shows one at a time. */
export function SubChargeCard({ subs, setSubs, spends, nextId, addSpend, today, accName, accWarn }: { subs: SubStore; setSubs: (s: SubStore) => void; spends: any[]; nextId: number; addSpend: (sp: any) => void; today: string; accName?: (id?: number) => string; accWarn?: (id: number | undefined, amt: number) => string }) {
  const list = (subs && subs.subs) || [];
  const hit = list.map((s) => ({ s, c: pendingCharge(s, today) })).filter((x) => x.c);
  if (!hit.length) return null;
  const { s, c } = hit[0]; const more = hit.length - 1;
  const when = c === today ? 'today' : 'on ' + parseInt(c.slice(8), 10) + ' ' + MON[parseInt(c.slice(5, 7), 10) - 1];
  const an = accName ? accName(s.acc) : ''; const warn = accWarn ? accWarn(s.acc, num(s.price)) : '';
  const mark = () => setSubs({ ...subs, subs: list.map((x) => (x.id === s.id ? { ...x, rec: c } : x)) });
  const add = () => { buzz(); addSpend({ id: nextId, name: s.name, cat: 'Bills', amt: num(s.price), date: c, note: 'Subscription', ...(s.acc && an ? { acc: s.acc } : {}) }); mark(); };
  const skip = () => { buzz(); mark(); };
  return (
    <View style={{ marginTop: 12, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(94,231,181,.5)' }}>
      <LinearGradient colors={['rgba(94,231,181,.2)', 'rgba(124,156,255,.22)', 'rgba(183,148,255,.2)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)' }}><LineIcon name="repeat" c="#fff" size={22} w={1.7} /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 }}>SUBSCRIPTION CHARGE{more > 0 ? ' · ' + (more + 1) + ' TO CHECK' : ''}</Text>
            <Text numberOfLines={1} style={{ color: '#fff', fontSize: 15.5, fontWeight: '800', marginTop: 2 }}>{s.name} · {rm(num(s.price))}</Text>
            <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12, marginTop: 2 }}>Due {when}. Was it charged?</Text>
          </View>
        </View>
        <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, lineHeight: 16, marginTop: 10 }}>{an ? 'Tap yes and ' + rm(num(s.price)) + ' is taken off ' + an + ' in My Accounts, and added to your spending under Bills. Nothing changes until you tap.' : "Add it to your spending so Money Left, Today's spending and Spending by category stay right. It is saved under Bills."}</Text>
        {warn ? <Text style={{ color: '#ffc46b', fontSize: 11.5, lineHeight: 16, marginTop: 6 }}>{warn}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <Pressable onPress={add} accessibilityLabel={an ? 'Take ' + s.name + ' off ' + an : 'Add ' + s.name + ' to my spending'} style={({ pressed }) => ({ flex: 1.5, transform: [{ scale: pressed ? 0.96 : 1 }] })}>
            <View style={{ height: 44, borderRadius: 14, backgroundColor: '#5ee7b5', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#0f2a22', fontSize: 14, fontWeight: '800' }}>{an ? 'Yes, take off ' + an : 'Add to my spending'}</Text></View>
          </Pressable>
          <Pressable onPress={skip} accessibilityLabel={'Not charged this time: ' + s.name} style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.96 : 1 }] })}>
            <View style={{ height: 44, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,.28)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 13.5, fontWeight: '700' }}>Not this time</Text></View>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}
