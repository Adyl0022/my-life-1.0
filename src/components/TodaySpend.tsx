import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './Txt';
import { Glass } from './Glass';
import { W, todayStr } from './Ui';
import { useStored } from '../lib/store';
import { cs } from '../lib/region';
import { Sp } from '../lib/moneyLeft';

const money = (n: number) => n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dim = 'rgba(255,255,255,.7)';

// Everything spent today in My Finance (all categories except Savings, so Health and Bills count),
// with an optional add-on: the vehicle maintenance noted in My Record. The person chooses once and can switch it any time.
export function TodaySpend({ spends }: { spends: Sp[] }) {
  const [mode, setMode] = useStored<'ask' | 'yes' | 'no'>('ml_today_veh', 'ask');
  const [rec] = useStored<{ data?: Record<string, { exps?: { amt: number; date: string }[] }> }>('ml_record', { data: {} });
  const t = todayStr();
  const mine = (spends || []).filter((p) => p.cat !== 'Savings' && p.date === t);
  const fin = mine.reduce((a, p) => a + p.amt, 0);
  const all: { amt: number; date: string }[] = [];
  Object.values((rec && rec.data) || {}).forEach((v) => (v && v.exps ? v.exps : []).forEach((e) => all.push(e)));
  const maint = all.filter((e) => e.date === t);
  const veh = maint.reduce((a, e) => a + (e.amt || 0), 0);
  const has = all.length > 0;
  const inc = mode === 'yes' && has;
  const total = fin + (inc ? veh : 0);
  const count = mine.length + (inc ? maint.length : 0);

  return (
    <Glass radius={26} style={{ padding: 16, marginTop: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Today's spending</Text>
      </View>
      <Text style={{ color: W, fontSize: 30, fontWeight: '800', marginTop: 8 }}>{cs() + money(total)}</Text>
      <Text style={{ color: dim, fontSize: 12.5, marginTop: 2 }}>{count === 0 ? 'No spending yet today' : count + (count === 1 ? ' item' : ' items') + ' today'}</Text>
      {has && mode !== 'ask' ? (
          <Pressable onPress={() => setMode(mode === 'yes' ? 'no' : 'yes')} hitSlop={8} style={{ alignSelf: 'flex-start', marginTop: 10, paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, backgroundColor: mode === 'yes' ? 'rgba(255,196,107,.35)' : 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: mode === 'yes' ? '#ffc46b' : 'rgba(255,255,255,.22)' }}>
            <Text style={{ color: W, fontSize: 11.5, fontWeight: '700' }}>{mode === 'yes' ? 'With vehicle maintenance' : 'Without vehicle maintenance'}</Text>
          </Pressable>
      ) : null}
      {inc && veh > 0 ? (
        <View style={{ marginTop: 6 }}>
          <Text style={{ color: dim, fontSize: 12 }}>{'My Finance  ' + cs() + money(fin)}</Text>
          <Text style={{ color: dim, fontSize: 12, marginTop: 2 }}>{'Vehicle maintenance  ' + cs() + money(veh)}</Text>
        </View>
      ) : null}
      <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 8 }}>Includes every category, such as Health and Bills. Savings are not counted as spending.</Text>

      {has && mode === 'ask' ? (
        <View style={{ marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,196,107,.14)', borderWidth: 1, borderColor: 'rgba(255,196,107,.4)' }}>
          <Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>Vehicle maintenance found</Text>
          <Text style={{ color: 'rgba(255,255,255,.82)', fontSize: 12.5, lineHeight: 18, marginTop: 3 }}>I found maintenance spending in your My Record. Do you want to include it in today's spending here? You can change this any time.</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Pressable onPress={() => setMode('no')} style={{ flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center' }}><Text style={{ color: W, fontWeight: '700', fontSize: 13 }}>No, keep it apart</Text></Pressable>
            <Pressable onPress={() => setMode('yes')} style={{ flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: '#ffc46b', alignItems: 'center' }}><Text style={{ color: '#0b1030', fontWeight: '800', fontSize: 13 }}>Yes, include</Text></Pressable>
          </View>
        </View>
      ) : null}
    </Glass>
  );
}
