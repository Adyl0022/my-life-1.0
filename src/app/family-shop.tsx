import React, { useState } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/Txt';
import { Glass } from '../components/Glass';
import { Header } from '../components/IslamicUi';
import { FamilyBg } from '../components/FamilyBg';
import { Rise } from '../components/Anim';
import { Btn, Chip, Field, Label, NewBtn, Note, Tick, W, DIM } from '../components/FamilyUi';
import { useFamily, famError } from '../lib/family';
import { useFamShop, shopSave, shopBought, shopClear, famDelete, nameOf, SHOP_CATS, FShop } from '../lib/familyData';

// One list for the whole family. Anyone can add, tick off, edit or delete. Bought items stay until "Clear bought".
export default function FamilyShop() {
  const f = useFamily();
  const info = f.info;
  const s = useFamShop(info?.id);
  const [panel, setPanel] = useState(false);
  const [eid, setEid] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [cat, setCat] = useState('Groceries');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const toBuy = s.rows.filter((x) => !x.bought);
  const bought = s.rows.filter((x) => x.bought);
  const cats = [...SHOP_CATS, ...toBuy.map((x) => x.category).filter((c) => SHOP_CATS.indexOf(c) < 0)].filter((c, i, a) => a.indexOf(c) === i);

  const open = (x?: FShop) => {
    setMsg(''); setPanel(true);
    if (x) { setEid(x.id); setName(x.name); setQty(x.qty || ''); setCat(x.category); } else { setEid(null); setName(''); setQty(''); }
  };
  const save = async () => {
    if (!name.trim()) { setMsg('Please type the item.'); return; }
    setBusy(true); setMsg('');
    try {
      await shopSave(eid, name, qty, cat);
      await s.reload();
      if (eid) setPanel(false); else { setName(''); setQty(''); }   // keep the panel open to add several items quickly
      setEid(null);
    } catch (e) { setMsg(famError(e)); }
    setBusy(false);
  };
  const del = () => Alert.alert('Delete this item?', 'It moves to Recently deleted for 7 days.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { try { await famDelete('shop', eid!); await s.reload(); setPanel(false); setEid(null); } catch (e) { setMsg(famError(e)); } } },
  ]);
  const tick = async (x: FShop) => {
    setMsg('');
    s.patch(x.id, { bought: !x.bought });
    try { await shopBought(x.id, !x.bought); } catch (e) { setMsg(famError(e)); s.reload(); }
  };
  const clear = () => Alert.alert('Clear bought items?', 'They move to Recently deleted for 7 days.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Clear', onPress: async () => { try { await shopClear(); await s.reload(); } catch (e) { setMsg(famError(e)); } } },
  ]);

  const Row = ({ x }: { x: FShop }) => (
    <Glass radius={20} style={{ marginBottom: 8, opacity: x.bought ? 0.6 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 13 }}>
        <Tick on={x.bought} onPress={() => tick(x)} c="#ffc46b" />
        <Pressable style={{ flex: 1 }} onPress={() => open(x)}>
          <Text style={{ color: W, fontSize: 14.5, fontWeight: '700', textDecorationLine: x.bought ? 'line-through' : 'none' }} numberOfLines={2}>{x.name}</Text>
          <Text style={{ color: DIM, fontSize: 11.5, marginTop: 2 }}>{x.qty ? x.qty + ' · ' : ''}{x.bought ? 'bought by ' + nameOf(info, x.bought_by) : 'added by ' + nameOf(info, x.created_by)}</Text>
        </Pressable>
      </View>
    </Glass>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <FamilyBg />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Shopping list" sub="Shared with the whole family" right={<NewBtn onPress={() => (panel ? setPanel(false) : open())} t={panel ? 'Close' : '+ New'} />} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 150 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {panel ? (
            <Rise>
              <Glass radius={24} style={{ padding: 16 }}>
                <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>{eid ? 'Edit item' : 'Add item'}</Text>
                <Field label="Item" value={name} onChange={setName} ph="Eggs" max={80} />
                <Field label="How many (optional)" value={qty} onChange={setQty} ph="2 trays" max={30} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                  {cats.map((c) => <Chip key={c} t={c} color="#ffc46b" on={cat === c} onPress={() => setCat(c)} />)}
                </View>
                {msg ? <View style={{ marginTop: 12 }}><Note warm t={msg} /></View> : null}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <Btn t={eid ? 'Save' : 'Add'} kind="main" onPress={save} busy={busy} flex />
                  {eid ? <Btn t="Delete" kind="danger" onPress={del} disabled={busy} /> : null}
                </View>
              </Glass>
            </Rise>
          ) : msg ? <Note warm t={msg} /> : null}
          {s.offline ? <View style={{ marginTop: 12 }}><Note t="You are offline. Showing the last saved list. Changes need an internet connection." /></View> : null}
          {s.ready ? <Text style={{ color: DIM, fontSize: 12, marginTop: 14, marginLeft: 4 }}>{toBuy.length} to buy · {bought.length} bought</Text> : null}
          {cats.map((c) => { const l = toBuy.filter((x) => x.category === c); return l.length ? <View key={c}><Label t={c} />{l.map((x) => <Row key={x.id} x={x} />)}</View> : null; })}
          {bought.length ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Label t="Bought" />
                <Pressable onPress={clear} hitSlop={8} style={{ marginTop: 16 }}><Text style={{ color: '#5ee7df', fontSize: 12.5, fontWeight: '800' }}>Clear bought</Text></Pressable>
              </View>
              {bought.map((x) => <Row key={x.id} x={x} />)}
            </>
          ) : null}
          {s.ready && !s.rows.length ? <View style={{ marginTop: 18 }}><Note t="The list is empty. Tap + New to add what the family needs." /></View> : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
