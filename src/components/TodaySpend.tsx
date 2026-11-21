import React, { useState } from 'react';
import { View } from 'react-native';
import { Pressable } from './Press';
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
  const [mode, setMode, modeOk] = useStored<'ask' | 'yes' | 'no'>('ml_today_veh', 'ask');
  const [rec, , recOk] = useStored<{ data?: Record<string, { exps?: { amt: number; date: string }[] }> }>('ml_record', { data: {} });
  const [ask, setAsk] = useState<'yes' | 'no' | null>(null); // waiting for the person to confirm a change
  const t = todayStr();
  const mine = (spends || []).filter((p) => p.cat !== 'Savings' && p.date === t);
  const fin = mine.reduce((a, p) => a + p.amt, 0);
  const all: { name?: string; amt: number; date: string }[] = [];
  Object.values((rec && rec.data) || {}).forEach((v) => (v && v.exps ? v.exps : []).forEach((e) => all.push(e)));
  const maint = all.filter((e) => e.date === t);
  const veh = maint.reduce((a, e) => a + (e.amt || 0), 0);
  const has = all.length > 0;
  // No vehicle maintenance left in My Record: forget the earlier choice, so the question comes back when a new one is added.
  React.useEffect(() => { if (recOk && modeOk && !has && mode !== 'ask') setMode('ask'); }, [recOk, modeOk, has, mode]);
  const inc = mode === 'yes' && has;
  const total = fin + (inc ? veh : 0);
  const rows: { k: string; name: string; sub: string; amt: number; v?: boolean }[] = [
    ...mine.map((p) => ({ k: 'f' + p.id, name: p.name, sub: p.cat + (p.note ? ' · ' + p.note : ''), amt: p.amt })),
    ...(inc ? maint.map((e, i) => ({ k: 'v' + i, name: e.name || 'Service', sub: 'Vehicle · From My Record', amt: e.amt || 0, v: true })) : []),
  ];
  const count = mine.length + (inc ? maint.length : 0);

  return (
    <Glass radius={26} style={{ padding: 16, marginTop: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Today's spending</Text>
      </View>
      <Text style={{ color: W, fontSize: 30, fontWeight: '800', marginTop: 8 }}>{cs() + money(total)}</Text>
      <Text style={{ color: dim, fontSize: 12.5, marginTop: 2 }}>{count === 0 ? 'No spending yet today' : count + (count === 1 ? ' item' : ' items') + ' today'}</Text>
      {has && mode !== 'ask' ? (
          <Pressable onPress={() => setAsk(mode === 'yes' ? 'no' : 'yes')} hitSlop={8} style={{ alignSelf: 'flex-start', marginTop: 10, paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, backgroundColor: mode === 'yes' ? 'rgba(255,196,107,.35)' : 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: mode === 'yes' ? '#ffc46b' : 'rgba(255,255,255,.22)' }}>
            <Text style={{ color: W, fontSize: 11.5, fontWeight: '700' }}>{mode === 'yes' ? 'Vehicle maintenance counted in My Finance' : 'Vehicle maintenance not counted'}</Text>
          </Pressable>
      ) : null}
      {rows.length > 0 ? (
        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.14)' }}>
          {rows.map((x, i) => (
            <View key={x.k} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: i ? 1 : 0, borderTopColor: 'rgba(255,255,255,.08)' }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: x.v ? '#ff9f6b' : '#ffc46b', marginRight: 10 }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: W, fontSize: 13.5, fontWeight: '700' }} numberOfLines={1}>{x.name}</Text>
                <Text style={{ color: dim, fontSize: 11.5, marginTop: 1 }} numberOfLines={1}>{x.sub}</Text>
              </View>
              <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{cs() + money(x.amt)}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {inc && veh > 0 ? (
        <View style={{ marginTop: 6 }}>
          <Text style={{ color: dim, fontSize: 12 }}>{'My Finance  ' + cs() + money(fin)}</Text>
          <Text style={{ color: dim, fontSize: 12, marginTop: 2 }}>{'Vehicle maintenance  ' + cs() + money(veh)}</Text>
        </View>
      ) : null}
      <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 8 }}>Includes every category, such as Health and Bills. Savings are not counted as spending.</Text>

      {ask ? (
        <View style={{ marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,120,120,.14)', borderWidth: 1, borderColor: 'rgba(255,150,150,.5)' }}>
          <Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>{ask === 'yes' ? 'Are you sure?' : 'Stop counting vehicle maintenance?'}</Text>
          <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 12.5, lineHeight: 18, marginTop: 3 }}>{ask === 'yes' ? 'This changes your whole My Finance: monthly totals, Money Left, category charts, Insights, Stats, the Assistant, budget alerts and exports will all include your vehicle maintenance from My Record. Those items can only be edited or deleted in My Record. Watch out for double counting if you also typed the same service as a spending.' : 'Your vehicle maintenance will be taken out of all My Finance figures again (totals, Money Left, charts, Insights, Stats, Assistant, budget alerts and exports). Nothing is deleted from My Record.'}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Pressable onPress={() => setAsk(null)} style={{ flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center' }}><Text style={{ color: W, fontWeight: '700', fontSize: 13 }}>Cancel</Text></Pressable>
            <Pressable onPress={() => { setMode(ask); setAsk(null); }} style={{ flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: '#ffc46b', alignItems: 'center' }}><Text style={{ color: '#0b1030', fontWeight: '800', fontSize: 13 }}>{ask === 'yes' ? 'Yes, change it' : 'Yes, stop'}</Text></Pressable>
          </View>
        </View>
      ) : null}

      {has && mode === 'ask' && !ask ? (
        <View style={{ marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,196,107,.14)', borderWidth: 1, borderColor: 'rgba(255,196,107,.4)' }}>
          <Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>Vehicle maintenance found</Text>
          <Text style={{ color: 'rgba(255,255,255,.82)', fontSize: 12.5, lineHeight: 18, marginTop: 3 }}>I found maintenance spending in your My Record. Include it in My Finance? It will count in today's spending, Money Left, charts, Insights and exports. You can change this any time. Edit or delete it in My Record.</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Pressable onPress={() => setMode('no')} style={{ flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center' }}><Text style={{ color: W, fontWeight: '700', fontSize: 13 }}>No, keep it apart</Text></Pressable>
            <Pressable onPress={() => setAsk('yes')} style={{ flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: '#ffc46b', alignItems: 'center' }}><Text style={{ color: '#0b1030', fontWeight: '800', fontSize: 13 }}>Yes, include</Text></Pressable>
          </View>
        </View>
      ) : null}
    </Glass>
  );
}
