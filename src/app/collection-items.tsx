import { LineIcon } from '../components/LineIcon';
import React, { useMemo, useState } from 'react';
import { View, Pressable, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '../components/Txt';
import { RecordPage, Intro } from '../components/RecordHubUi';
import { SearchField } from '../components/Shine';
import { Inp, DateField, W } from '../components/Ui';
import { ItemRow, Tile, Sums, Empty, BigBtn, SheetFrame, Detail, Lab, chip, dim, PhotoStrip, GridCard } from '../components/ColUi';
import { EqPills } from '../components/TabSlide';
import { useStored } from '../lib/store';
import { confirmDelete } from '../lib/dialog';
import { tryForm, numberError } from '../lib/num';
import { takePhoto } from '../lib/photo';
import { statusOf, validDate, ymd, typeOf, EMPTY_DOCS, type DocStore } from '../lib/documents';
import { ColArt } from '../components/ColArt';
import { CATS, ACC, BTN, EMPTY_COL, kindIcon, num, rm, dmy, photosOf, worthNow, worthMine, warrantyBar, CONDS, type ColStore, type Item, type ItemCat } from '../lib/collection';

type Form = Omit<Item, 'id'> & { id: number; noBought: boolean; noW: boolean };
const blank = (cat: ItemCat): Form => ({ id: 0, cat, kind: CATS[cat].kinds[0][0], name: '', price: '', bought: ymd(new Date()), warranty: ymd(new Date(Date.now() + 365 * 86400000)), photo: '', photos: [], docIds: [], worth: '', cond: 'good', note: '', noBought: true, noW: true });
const wStatus = (x: Item) => (x.warranty ? statusOf({ id: 0, type: '', title: '', expiry: x.warranty, remind: 'off' }) : null);

function Sheet({ f, setF, onSave, onDelete, onClose, docs }: { docs: DocStore['docs']; f: Form; setF: (x: Form) => void; onSave: () => void; onDelete?: () => void; onClose: () => void }) {
  const C = CATS[f.cat]; const g = BTN; const ac = ACC[f.cat === 'gadget' ? 'gadget' : f.cat]; const [tried, setTried] = useState(false); const [msg, setMsg] = useState('');
  const set = (p: Partial<Form>) => setF({ ...f, ...p });
  const pick = async (cam: boolean) => { setMsg(''); try { const cur = f.photos || []; if (cur.length >= 5) { setMsg('You can add up to 5 photos.'); return; } const u = await takePhoto(cam); if (u) set({ photos: [...cur, u] }); } catch (e: any) { setMsg(e && e.message === 'camera' ? 'Camera access is off. Allow it in Settings, or choose a photo instead.' : 'Could not open the photo. Please try again.'); } };
  const bad = !f.noBought && !validDate(f.bought), badW = C.warranty && !f.noW && !validDate(f.warranty), badP = !!numberError(f.price), badWo = !!numberError(f.worth || '');
  const save = () => { setTried(true); tryForm('colitem'); if (!f.name.trim() || bad || badW || badP || badWo) return; onSave(); };
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
      <Lab t={'PHOTOS (OPTIONAL, UP TO 5)'} />
      {(f.photos || []).length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {(f.photos || []).map((u, i) => (
            <View key={u + i} style={{ width: 78 }}>
              <Image source={{ uri: u }} style={{ width: 78, height: 78, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.1)' }} resizeMode="cover" />
              <Pressable onPress={() => confirmDelete('this photo', () => set({ photos: (f.photos || []).filter((_, k) => k !== i) }), { title: 'Remove this photo?', message: 'The photo will be removed from this phone.' })} accessibilityLabel={'Remove photo ' + (i + 1)} style={{ marginTop: 4 }}><Text style={{ color: '#ff9aa9', fontSize: 11.5, fontWeight: '700', textAlign: 'center' }}>Remove</Text></Pressable>
            </View>
          ))}
        </View>
      ) : null}
      {(f.photos || []).length < 5 ? (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Pressable onPress={() => pick(true)} accessibilityLabel="Take photo" style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}><LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#0b1030', fontSize: 14, fontWeight: '800' }}>Take photo</Text></LinearGradient></Pressable>
          <Pressable onPress={() => pick(false)} accessibilityLabel="Choose a photo" style={({ pressed }) => ({ flex: 1, height: 46, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.97 : 1 }] })}><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>Choose a photo</Text></Pressable>
        </View>
      ) : <Text style={{ color: dim, fontSize: 12 }}>You have 5 photos. Remove one to add another.</Text>}
      <Text style={{ color: dim, fontSize: 11.5, marginTop: 8 }}>Photos stay on this phone only and are not backed up online. The first photo is the cover.</Text>
      {msg ? <Text style={{ color: '#ffd593', fontSize: 12.5, marginTop: 8 }}>{msg}</Text> : null}
      <Lab t="DETAILS" />
      <Inp value={f.name} onChangeText={(x: string) => set({ name: x })} placeholder={'Name, e.g. ' + (f.cat === 'gadget' ? 'Samsung S24' : f.cat === 'lifestyle' ? 'Nike Air Max' : 'Terrace house')} maxLength={60} />
      {tried && !f.name.trim() ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please enter a name.</Text> : null}
      <Inp form="colitem" style={{ marginTop: 9 }} value={f.price} onChangeText={(x: string) => set({ price: x })} keyboardType="decimal-pad" placeholder="Price in RM (optional)" />
      {f.cat === 'gadget' ? (<>
        <Lab t="CONDITION NOW" />
        <EqPills tabs={CONDS.map((c) => c.n)} index={Math.max(0, CONDS.findIndex((c) => c.k === (f.cond || 'good')))} onChange={(i) => set({ cond: CONDS[i].k })} colors={['#7c9cff', '#b794ff']} fontSize={12} />
        <Inp form="colitem" noCheck={false} zeroOk style={{ marginTop: 9 }} value={f.worth || ''} onChangeText={(x: string) => set({ worth: x })} keyboardType="decimal-pad" placeholder="What it is worth now in RM (optional)" />
        <Text style={{ color: dim, fontSize: 11.5, marginTop: 6, lineHeight: 16 }}>Know the price it sells for now? Type it. If you leave it empty, My Life 1.0 makes a guess from the price, age, kind, brand and condition.</Text>
      </>) : null}
      <Lab t="DATE BOUGHT" />
      {check(f.noBought, "I do not remember the date", () => set({ noBought: !f.noBought }))}
      {!f.noBought ? <DateField value={f.bought} onChange={(v: string) => set({ bought: v })} past /> : null}
      {f.cat === 'gadget' && f.noBought ? <Text style={{ color: '#ffd593', fontSize: 11.5, marginTop: 4, lineHeight: 16 }}>Without the date bought, My Life 1.0 cannot guess what it is worth now. Untick the box above and pick the date to get a guess.</Text> : null}
      {tried && bad ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please pick a valid date.</Text> : null}
      {C.warranty ? (<>
        <Lab t="WARRANTY ENDS" />
        {check(f.noW, 'No warranty', () => set({ noW: !f.noW }))}
        {!f.noW ? <DateField value={f.warranty} onChange={(v: string) => set({ warranty: v })} /> : null}
        {tried && badW ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please pick a valid date.</Text> : null}
        {!f.noW ? <Text style={{ color: dim, fontSize: 11.5, marginTop: 6 }}>You get a reminder 30 days before it ends.</Text> : null}
      </>) : null}
      <Lab t="NOTE (OPTIONAL)" />
      <Inp value={f.note} onChangeText={(x: string) => set({ note: x })} placeholder={f.cat === 'property' ? 'e.g. Rent RM 1,200 a month, agent phone, what to check' : 'e.g. Serial number, shop, how it was bought'} maxLength={500} multiline style={{ minHeight: 84, textAlignVertical: 'top' }} />
      <Text style={{ color: dim, fontSize: 11.5, marginTop: 5, textAlign: 'right' }}>{f.note.length} / 500</Text>
      <Lab t="LINK PAPERS (OPTIONAL)" />
      {docs.length ? (<>
        <Text style={{ color: dim, fontSize: 12, marginBottom: 8, lineHeight: 17 }}>Pick the receipt or warranty paper from Documents, so you can open it from here.</Text>
        {docs.slice(0, 40).map((d) => { const on = (f.docIds || []).indexOf(d.id) >= 0; return <View key={d.id}>{check(on, d.title + ' · ' + typeOf(d.type).label, () => set({ docIds: on ? (f.docIds || []).filter((i) => i !== d.id) : [...(f.docIds || []), d.id] }))}</View>; })}
      </>) : <Text style={{ color: dim, fontSize: 12, lineHeight: 17 }}>Nothing to link yet. Add a receipt or warranty paper in My Record, Documents, then come back.</Text>}
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
  const router = useRouter();
  const [dst] = useStored<DocStore>('ml_documents', EMPTY_DOCS); const docs = (dst && dst.docs) || [];
  const [views, setViews] = useStored<Record<string, string>>('ml_colview', {}); const grid = (views && views[cat]) === 'grid';
  const all = (st && st.items) || [];
  const [q, setQ] = useState(''); const [f, setF] = useState<Form | null>(null); const [det, setDet] = useState(0);
  const mine = all.filter((x) => x.cat === cat);
  const list = useMemo(() => { const n = q.trim().toLowerCase(); return mine.filter((x) => !n || (x.name + ' ' + x.kind + ' ' + x.note).toLowerCase().includes(n)).sort((a, b) => b.id - a.id); }, [all, q, cat]);
  const total = mine.reduce((t, x) => t + num(x.price), 0);
  const worth = C.warranty ? mine.reduce((t, x) => t + (worthNow(x) != null ? (worthNow(x) as number) : num(x.price)), 0) : 0;
  const guessed = C.warranty && mine.some((x) => worthNow(x) != null);
  const missing = C.warranty ? mine.filter((x) => worthNow(x) == null).length : 0;
  const inW = mine.filter((x) => { const s = wStatus(x); return s && s.n != null && s.n >= 0; }).length;
  const openNew = () => setF(blank(cat));
  const openEdit = (x: Item) => setF({ ...x, cond: x.cond || 'good', worth: x.worth || '', photos: photosOf(x), docIds: (x.docIds || []).filter((i) => docs.some((d) => d.id === i)), noBought: !x.bought, noW: !x.warranty, bought: x.bought || ymd(new Date()), warranty: x.warranty || ymd(new Date(Date.now() + 365 * 86400000)) });
  const save = () => {
    if (!f) return; const { noBought, noW, ...rest } = f; const it: Item = { ...rest, name: f.name.trim(), price: f.price.trim(), bought: noBought ? '' : f.bought, warranty: !C.warranty || noW ? '' : f.warranty, note: f.note.trim(), photos: (f.photos || []).slice(0, 5), photo: (f.photos || [])[0] || '', docIds: f.docIds || [], worth: C.warranty ? (f.worth || '').trim() : '', cond: C.warranty ? f.cond || 'good' : undefined };
    if (it.id) setSt({ ...st, items: all.map((x) => (x.id === it.id ? it : x)) });
    else setSt({ ...st, items: [...all, { ...it, id: st.next }], next: st.next + 1 });
    setF(null);
  };
  const del = () => { if (!f || !f.id) return; confirmDelete('this ' + C.one, () => { setSt({ ...st, items: all.filter((x) => x.id !== f.id) }); setF(null); setDet(0); }, { title: 'Delete this ' + C.one + '?', message: 'The details and the photo on this phone will be removed. This cannot be undone.' }); };
  const plus = <Pressable onPress={openNew} accessibilityLabel={'Add ' + C.one}><LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 28, fontWeight: '300', marginTop: -2 }}>+</Text></LinearGradient></Pressable>;
  const cur = all.find((x) => x.id === det);
  const ws = cur ? wStatus(cur) : null;
  const wb = cur ? warrantyBar(cur) : null;
  const linked = cur ? docs.filter((d) => (cur.docIds || []).indexOf(d.id) >= 0) : [];
  return (
    <RecordPage title={C.title} sub={mine.length + (mine.length === 1 ? ' item' : ' items')} right={plus} bg={<ColArt />}>
      <Intro plain title={C.title} text={C.text} colors={['rgba(142,168,255,.5)', 'rgba(183,148,255,.4)']} />
      <View style={{ marginTop: 12 }}><SearchField value={q} onChangeText={setQ} placeholder={'Search ' + C.title.toLowerCase()} /></View>
      {mine.length ? <Sums a={[C.warranty ? 'YOU PAID' : 'VALUE', rm(total)]} b={C.warranty ? ['WORTH NOW', guessed ? '~ ' + rm(worth) : '—'] : undefined} /> : null}
      {mine.length && C.warranty ? <Text style={{ color: dim, fontSize: 11.5, marginTop: 8, lineHeight: 16 }}>{inW + ' of ' + mine.length + ' still in warranty. '}{guessed ? 'Worth now uses the number you typed, or a guess from the price, age, kind, brand and condition.' + (missing ? ' ' + missing + (missing === 1 ? ' item has' : ' items have') + ' no date bought, so ' + (missing === 1 ? 'it is' : 'they are') + ' counted at the price you paid.' : ' A guess can be different from real prices.') : 'To see what your gadgets are worth now, add the price and the date bought to each one, or type the worth yourself.'}</Text> : null}
      {mine.length ? <View style={{ marginTop: 12 }}><EqPills tabs={['List', 'Grid']} index={grid ? 1 : 0} onChange={(i) => setViews({ ...(views || {}), [cat]: i ? 'grid' : 'list' })} colors={['#7c9cff', '#b794ff']} fontSize={13} width={190} /></View> : null}
      {list.length ? (grid ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {list.map((x) => { const s = wStatus(x); return <GridCard key={x.id} a11y={'Open ' + x.name} tile={<Tile icon={kindIcon(cat, x.kind)} c={ac} />} photo={photosOf(x)[0]} label={x.kind.toUpperCase()} title={x.name} sub={x.price ? rm(num(x.price)) : undefined}
            status={C.warranty && s ? (s.n != null && s.n < 0 ? 'Warranty ended' : 'Warranty ' + s.txt) : undefined} statusCol={s ? s.col : undefined} onPress={() => setDet(x.id)} />; })}
        </View>
      ) : list.map((x) => {
        const s = wStatus(x);
        return <ItemRow key={x.id} a11y={'Open ' + x.name} tile={<Tile icon={kindIcon(cat, x.kind)} c={ac} />} photo={photosOf(x)[0]} label={x.kind.toUpperCase()} title={x.name} sub={[x.bought ? 'Bought ' + dmy(x.bought) : '', x.price ? rm(num(x.price)) : ''].filter(Boolean).join(' · ') || undefined}
          status={C.warranty && s ? (s.n != null && s.n < 0 ? 'Warranty ended' : 'Warranty ' + s.txt) : undefined} statusCol={s ? s.col : undefined} onPress={() => setDet(x.id)} />;
      })) : <Empty e={q.trim() ? 'search' : C.e} t={q.trim() ? 'Nothing found' : 'Nothing here yet'} s={q.trim() ? 'Try another word.' : 'Tap + to add your first ' + C.one + '.'} />}
      {cur && !f ? (
        <Detail label={cur.kind.toUpperCase()} title={cur.name} tile={<Tile icon={kindIcon(cat, cur.kind)} c={ac} size={84} />} photo={photosOf(cur)[0]}
          lines={[...(cur.price ? [['Price', rm(num(cur.price))] as [string, string]] : []), ...(cur.bought ? [['Bought', dmy(cur.bought)] as [string, string]] : []), ...(C.warranty ? [['Warranty ends', cur.warranty ? dmy(cur.warranty) : 'No warranty'] as [string, string]] : []), ...(cur.note ? [['Note', cur.note] as [string, string]] : [])]}
          status={C.warranty && ws ? (ws.n != null && ws.n < 0 ? 'Warranty ended' : 'Warranty ' + ws.txt) : undefined} statusCol={ws ? ws.col : undefined} hot={!!(ws && ws.hot)} onClose={() => setDet(0)}>
          <PhotoStrip photos={photosOf(cur)} />
          {C.warranty && wb ? (
            <View style={{ marginTop: 16, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.06)' }}>
              <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 }}>WARRANTY</Text>
              <Text style={{ color: W, fontSize: 18, fontWeight: '800', marginTop: 4 }}>{wb.left < 0 ? 'Ended ' + (-wb.left) + (wb.left === -1 ? ' day ago' : ' days ago') : wb.left === 0 ? 'Ends today' : wb.left + (wb.left === 1 ? ' day left' : ' days left')}</Text>
              <View style={{ height: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,.12)', marginTop: 10, overflow: 'hidden' }}><View style={{ width: Math.round(wb.used * 100) + '%', height: 8, borderRadius: 8, backgroundColor: wb.left < 0 ? '#ff9aa9' : wb.left <= 30 ? '#ffd593' : '#5ee7b5' }} /></View>
              <Text style={{ color: dim, fontSize: 11.5, marginTop: 8 }}>{wb.left >= 0 ? 'You get a reminder 30 days before it ends.' : 'The warranty has ended.'}</Text>
            </View>
          ) : null}
          {cur.cat === 'gadget' && worthNow(cur) != null ? <Text style={{ color: dim, fontSize: 12, marginTop: 12, lineHeight: 17 }}>{worthMine(cur) > 0 ? 'Worth now: ' + rm(worthNow(cur) as number) + ', the number you typed.' : 'Worth now, a guess: about ' + rm(worthNow(cur) as number) + '. It is only an estimate from the price, age, kind, brand and condition.'}</Text> : null}
          {linked.length ? (
            <View style={{ marginTop: 16 }}>
              <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 }}>PAPERS</Text>
              {linked.map((d) => (
                <Pressable key={d.id} onPress={() => { setDet(0); router.push('/documents' as any); }} accessibilityLabel={'Open ' + d.title} style={({ pressed }) => ({ marginTop: 6, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.07)', flexDirection: 'row', alignItems: 'center', gap: 10, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
                  <View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: W, fontSize: 14, fontWeight: '800' }}>{d.title}</Text><Text style={{ color: dim, fontSize: 11.5, marginTop: 2 }}>{typeOf(d.type).label + (d.expiry ? ' · ends ' + dmy(d.expiry) : '')}</Text></View>
                  <Text style={{ color: '#8fe9e2', fontSize: 12.5, fontWeight: '800' }}>Open</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <BigBtn t="Edit" onPress={() => { setDet(0); openEdit(cur); }} a11y="Edit item" />
        </Detail>
      ) : null}
      {f ? <Sheet docs={docs} f={f} setF={setF} onSave={save} onDelete={f.id ? del : undefined} onClose={() => setF(null)} /> : null}
    </RecordPage>
  );
}
