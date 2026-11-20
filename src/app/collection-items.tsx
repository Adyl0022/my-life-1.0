import { LineIcon } from '../components/LineIcon';
import React, { useMemo, useState } from 'react';
import { View, Pressable, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Text } from '../components/Txt';
import { RecordPage, Intro } from '../components/RecordHubUi';
import { SearchField } from '../components/Shine';
import { Inp, DateField, W } from '../components/Ui';
import { ItemRow, Tile, Sums, Empty, BigBtn, SheetFrame, Detail, Lab, chip, dim } from '../components/ColUi';
import { useStored } from '../lib/store';
import { confirmDelete } from '../lib/dialog';
import { tryForm, numberError } from '../lib/num';
import { takePhoto } from '../lib/photo';
import { statusOf, validDate, ymd } from '../lib/documents';
import { ColArt } from '../components/ColArt';
import { CATS, ACC, BTN, EMPTY_COL, kindIcon, num, rm, dmy, type ColStore, type Item, type ItemCat } from '../lib/collection';

type Form = Omit<Item, 'id'> & { id: number; noBought: boolean; noW: boolean };
const blank = (cat: ItemCat): Form => ({ id: 0, cat, kind: CATS[cat].kinds[0][0], name: '', price: '', bought: ymd(new Date()), warranty: ymd(new Date(Date.now() + 365 * 86400000)), photo: '', note: '', noBought: true, noW: true });
const wStatus = (x: Item) => (x.warranty ? statusOf({ id: 0, type: '', title: '', expiry: x.warranty, remind: 'off' }) : null);

function Sheet({ f, setF, onSave, onDelete, onClose }: { f: Form; setF: (x: Form) => void; onSave: () => void; onDelete?: () => void; onClose: () => void }) {
  const C = CATS[f.cat]; const g = BTN; const ac = ACC[f.cat === 'gadget' ? 'gadget' : f.cat]; const [tried, setTried] = useState(false); const [msg, setMsg] = useState('');
  const set = (p: Partial<Form>) => setF({ ...f, ...p });
  const pick = async (cam: boolean) => { setMsg(''); try { const u = await takePhoto(cam); if (u) set({ photo: u }); } catch (e: any) { setMsg(e && e.message === 'camera' ? 'Camera access is off. Allow it in Settings, or choose a photo instead.' : 'Could not open the photo. Please try again.'); } };
  const bad = !f.noBought && !validDate(f.bought), badW = C.warranty && !f.noW && !validDate(f.warranty), badP = !!numberError(f.price);
  const save = () => { setTried(true); tryForm('colitem'); if (!f.name.trim() || bad || badW || badP) return; onSave(); };
  const check = (on: boolean, t: string, fn: () => void) => (
    <Pressable onPress={fn} accessibilityLabel={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.5)', backgroundColor: on ? 'rgba(94,231,223,.5)' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{on ? <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>✓</Text> : null}</View>
      <Text style={{ color: W, fontSize: 14 }}>{t}</Text>
    </Pressable>
  );
  return (
    <SheetFrame title={(f.id ? 'Edit ' : 'Add ') + C.one} sub={C.title} onClose={onClose}>
      <Lab t="KIND" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {C.kinds.map(([k, e]) => (
          <Pressable key={k} onPress={() => set({ kind: k })} accessibilityLabel={k} style={{ width: '31.5%' }}><View style={{ ...chip(f.kind === k, ac), paddingVertical: 12 }}><LineIcon name={e} c={f.kind === k ? ac : '#e8e8f6'} size={26} /><Text numberOfLines={1} style={{ color: W, fontSize: 11.5, fontWeight: '700', marginTop: 6 }}>{k}</Text></View></Pressable>
        ))}
      </View>
      <Lab t="PHOTO (OPTIONAL)" />
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        {f.photo ? <Image source={{ uri: f.photo }} style={{ width: 84, height: 64, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.1)' }} resizeMode="cover" /> : null}
        <Pressable onPress={() => pick(true)} accessibilityLabel="Take photo" style={{ flex: 1 }}><LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><LineIcon name="camera" c="#fff" size={20} w={1.7} /><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>Take photo</Text></View></LinearGradient></Pressable>
        <Pressable onPress={() => pick(false)} accessibilityLabel="Choose a photo" style={{ flex: 1, height: 46, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><LineIcon name="photo" c="#fff" size={20} /><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>Choose</Text></View></Pressable>
      </View>
      {f.photo ? <Pressable onPress={() => confirmDelete('this photo', () => set({ photo: '' }), { title: 'Remove this photo?', message: 'The photo will be removed from this phone.' })} accessibilityLabel="Remove photo" style={{ marginTop: 8 }}><Text style={{ color: '#ff9aa9', fontSize: 12.5, fontWeight: '700' }}>Remove photo</Text></Pressable> : null}
      <Text style={{ color: dim, fontSize: 11.5, marginTop: 8 }}>Photos stay on this phone only and are not backed up online.</Text>
      {msg ? <Text style={{ color: '#ffd593', fontSize: 12.5, marginTop: 8 }}>{msg}</Text> : null}
      <Lab t="DETAILS" />
      <Inp value={f.name} onChangeText={(x: string) => set({ name: x })} placeholder={'Name, e.g. ' + (f.cat === 'gadget' ? 'Samsung S24' : f.cat === 'lifestyle' ? 'Nike Air Max' : 'Terrace house')} maxLength={60} />
      {tried && !f.name.trim() ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please enter a name.</Text> : null}
      <Inp form="colitem" style={{ marginTop: 9 }} value={f.price} onChangeText={(x: string) => set({ price: x })} keyboardType="decimal-pad" placeholder="Price in RM (optional)" />
      <Lab t="DATE BOUGHT" />
      {check(f.noBought, "I do not remember the date", () => set({ noBought: !f.noBought }))}
      {!f.noBought ? <DateField value={f.bought} onChange={(v: string) => set({ bought: v })} past /> : null}
      {tried && bad ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please pick a valid date.</Text> : null}
      {C.warranty ? (<>
        <Lab t="WARRANTY ENDS" />
        {check(f.noW, 'No warranty', () => set({ noW: !f.noW }))}
        {!f.noW ? <DateField value={f.warranty} onChange={(v: string) => set({ warranty: v })} /> : null}
        {tried && badW ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please pick a valid date.</Text> : null}
        {!f.noW ? <Text style={{ color: dim, fontSize: 11.5, marginTop: 6 }}>You get a reminder 30 days before it ends.</Text> : null}
      </>) : null}
      <Lab t="NOTE (OPTIONAL)" />
      <Inp value={f.note} onChangeText={(x: string) => set({ note: x })} placeholder={f.cat === 'property' ? 'e.g. Rent RM 1,200 a month' : 'e.g. Serial number, shop'} maxLength={200} />
      <BigBtn t="Save" onPress={save} a11y="Save item" />
      {onDelete ? <BigBtn t="Delete" outline="#ff8da1" onPress={onDelete} a11y="Delete item" /> : null}
    </SheetFrame>
  );
}

export default function Screen() {
  const { c } = useLocalSearchParams<{ c?: string }>();
  const cat: ItemCat = c === 'lifestyle' || c === 'property' ? c : 'gadget';
  const C = CATS[cat]; const g = BTN; const ac = ACC[cat];
  const [st, setSt] = useStored<ColStore>('ml_collection', EMPTY_COL);
  const all = (st && st.items) || [];
  const [q, setQ] = useState(''); const [f, setF] = useState<Form | null>(null); const [det, setDet] = useState(0);
  const mine = all.filter((x) => x.cat === cat);
  const list = useMemo(() => { const n = q.trim().toLowerCase(); return mine.filter((x) => !n || (x.name + ' ' + x.kind + ' ' + x.note).toLowerCase().includes(n)).sort((a, b) => b.id - a.id); }, [all, q, cat]);
  const total = mine.reduce((t, x) => t + num(x.price), 0);
  const inW = mine.filter((x) => { const s = wStatus(x); return s && s.n != null && s.n >= 0; }).length;
  const openNew = () => setF(blank(cat));
  const openEdit = (x: Item) => setF({ ...x, noBought: !x.bought, noW: !x.warranty, bought: x.bought || ymd(new Date()), warranty: x.warranty || ymd(new Date(Date.now() + 365 * 86400000)) });
  const save = () => {
    if (!f) return; const { noBought, noW, ...rest } = f; const it: Item = { ...rest, name: f.name.trim(), price: f.price.trim(), bought: noBought ? '' : f.bought, warranty: !C.warranty || noW ? '' : f.warranty, note: f.note.trim() };
    if (it.id) setSt({ ...st, items: all.map((x) => (x.id === it.id ? it : x)) });
    else setSt({ ...st, items: [...all, { ...it, id: st.next }], next: st.next + 1 });
    setF(null);
  };
  const del = () => { if (!f || !f.id) return; confirmDelete('this ' + C.one, () => { setSt({ ...st, items: all.filter((x) => x.id !== f.id) }); setF(null); setDet(0); }, { title: 'Delete this ' + C.one + '?', message: 'The details and the photo on this phone will be removed. This cannot be undone.' }); };
  const plus = <Pressable onPress={openNew} accessibilityLabel={'Add ' + C.one}><LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 28, fontWeight: '300', marginTop: -2 }}>+</Text></LinearGradient></Pressable>;
  const cur = all.find((x) => x.id === det);
  const ws = cur ? wStatus(cur) : null;
  return (
    <RecordPage title={C.title} sub={mine.length + (mine.length === 1 ? ' item' : ' items')} right={plus} bg={<ColArt />}>
      <Intro plain title={C.title} text={C.text} colors={['rgba(142,168,255,.5)', 'rgba(183,148,255,.4)']} />
      <View style={{ marginTop: 12 }}><SearchField value={q} onChangeText={setQ} placeholder={'Search ' + C.title.toLowerCase()} /></View>
      {mine.length ? <Sums a={['VALUE', rm(total)]} b={C.warranty ? ['IN WARRANTY', inW + ' of ' + mine.length] : undefined} /> : null}
      {list.length ? list.map((x) => {
        const s = wStatus(x);
        return <ItemRow key={x.id} a11y={'Open ' + x.name} tile={<Tile icon={kindIcon(cat, x.kind)} c={ac} />} photo={x.photo} label={x.kind.toUpperCase()} title={x.name} sub={[x.bought ? 'Bought ' + dmy(x.bought) : '', x.price ? rm(num(x.price)) : ''].filter(Boolean).join(' · ') || undefined}
          status={C.warranty && s ? (s.n != null && s.n < 0 ? 'Warranty ended' : 'Warranty ' + s.txt) : undefined} statusCol={s ? s.col : undefined} onPress={() => setDet(x.id)} />;
      }) : <Empty e={q.trim() ? 'search' : C.e} t={q.trim() ? 'Nothing found' : 'Nothing here yet'} s={q.trim() ? 'Try another word.' : 'Tap + to add your first ' + C.one + '.'} />}
      {cur && !f ? (
        <Detail label={cur.kind.toUpperCase()} title={cur.name} tile={<Tile icon={kindIcon(cat, cur.kind)} c={ac} size={84} />} photo={cur.photo}
          lines={[...(cur.price ? [['Price', rm(num(cur.price))] as [string, string]] : []), ...(cur.bought ? [['Bought', dmy(cur.bought)] as [string, string]] : []), ...(C.warranty ? [['Warranty ends', cur.warranty ? dmy(cur.warranty) : 'No warranty'] as [string, string]] : []), ...(cur.note ? [['Note', cur.note] as [string, string]] : [])]}
          status={C.warranty && ws ? (ws.n != null && ws.n < 0 ? 'Warranty ended' : 'Warranty ' + ws.txt) : undefined} statusCol={ws ? ws.col : undefined} hot={!!(ws && ws.hot)} onClose={() => setDet(0)}>
          <BigBtn t="Edit" onPress={() => { setDet(0); openEdit(cur); }} a11y="Edit item" />
        </Detail>
      ) : null}
      {f ? <Sheet f={f} setF={setF} onSave={save} onDelete={f.id ? del : undefined} onClose={() => setF(null)} /> : null}
    </RecordPage>
  );
}
