import React, { useMemo, useState } from 'react';
import { View, Pressable, Platform, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../components/Txt';
import { RecordPage } from '../components/RecordHubUi';
import { Glass } from '../components/Glass';
import { Inp, DateField, W } from '../components/Ui';
import { SheetFrame, Lab, chip, dim, BigBtn, Empty } from '../components/ColUi';
import { SubArt } from '../components/SubArt';
import { LineIcon } from '../components/LineIcon';
import { useStored } from '../lib/store';
import { confirmDelete } from '../lib/dialog';
import { tryForm, pn, numberError } from '../lib/num';
import { takePhoto } from '../lib/photo';
import { scanPhoto } from '../lib/documents';
import { onlineAsk, useOnlineAi } from '../lib/onlineAi';
import { SUB_EMPTY, SUB_CATS, CYCLES, REM, SERVICES, catOf, dueOf, monthlyTotal, monthly, detect, fromFound, readBill, readAi, aiPrompt, rm, num, validDate, ymd, addCycle, type Sub, type SubStore, type Cycle, type Billed } from '../lib/subs';
import type { Sp } from '../lib/moneyLeft';

const BL = '#7c9cff', GR = '#5ee7b5';
type Form = Omit<Sub, 'id'> & { id: number };
const blank = (): Form => ({ id: 0, name: '', cat: 'other', price: '', cycle: 'month', next: ymd(addDay(new Date(), 30)), remind: 3, trial: false, note: '' });
function addDay(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
const Err = ({ t }: { t: string }) => <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>{t}</Text>;

const MN3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const shortD = (v: any) => { const t = typeof v === 'string' ? v : v && v.getFullYear ? ymd(v) : ''; const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t); return m ? Number(m[3]) + ' ' + MN3[Number(m[2]) - 1] : ''; };
const initials = (n: string) => { const w = n.replace(/[^A-Za-z0-9+ ]/g, ' ').trim().split(/\s+/).filter(Boolean); return ((w[0] || '?')[0] + (w.length > 1 && /[A-Za-z]/.test(w[1][0]) ? w[1][0] : '')).toUpperCase(); };
// The tile for a subscription: your own picture if you chose one, otherwise the first letters of the name in the category colour.
function Tile({ name, cat, photo, size = 46 }: { name: string; cat: string; photo?: string; size?: number }) {
  const c = catOf(cat);
  return <View style={{ width: size, height: size, borderRadius: size * 0.33, backgroundColor: c.c + '22', borderWidth: 1, borderColor: c.c + '88', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    {photo ? <Image source={{ uri: photo }} style={{ width: size, height: size }} resizeMode="cover" /> : <Text style={{ color: c.c, fontSize: size * 0.4, fontWeight: '800', letterSpacing: 0.5 }}>{initials(name)}</Text>}
  </View>;
}

function Sheet({ f, setF, onSave, onDelete, onClose }: { f: Form; setF: (x: Form) => void; onSave: () => void; onDelete?: () => void; onClose: () => void }) {
  const [tried, setTried] = useState(false); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false); const [raw, setRaw] = useState(''); const [on] = useOnlineAi();
  const set = (p: Partial<Form>) => setF({ ...f, ...p });
  const price = pn(f.price); const badPrice = !!numberError(f.price) || !(price > 0); const badDate = !validDate(f.next);
  const save = () => { setTried(true); tryForm('sub'); if (!f.name.trim() || badPrice || badDate) return; onSave(); };
  const apply = (b: Billed, base: Form = f): Form => ({ ...base, name: b.name || base.name, cat: b.cat || base.cat, price: b.price || base.price, cycle: b.cycle || base.cycle, next: b.next || base.next, trial: b.trial != null ? b.trial : base.trial });
  const pick = async (camera: boolean) => {
    setBusy(true); setMsg('');
    try {
      const uri = await takePhoto(camera);
      if (uri) {
        const text = Platform.OS === 'web' ? null : await scanPhoto(uri);
        if (text == null) setMsg(Platform.OS === 'web' ? 'Scanning works in the Android app. You can still type the details in.' : 'Scanning is not ready on this phone. You can still type the details in.');
        else { setRaw(text); const b = readBill(text, ymd(new Date())); if (!b) setMsg('Could not find a bill in this photo. Try again in good light, or type it in.'); else { setF(apply(b)); setMsg((b.usd ? 'The price looks like US dollars. Please type it in ringgit. ' : '') + 'Read some details from the photo. Please check each box before you save. The photo itself is not kept.'); } }
      }
    } catch (e: any) { setMsg(e && e.message === 'camera' ? 'Camera access is off. Allow it in Settings to scan, or choose a photo instead.' : 'Could not open the photo. Please try again.'); }
    setBusy(false);
  };
  const ai = async () => {
    setBusy(true); setMsg('Asking the online AI. Only the words from the bill are sent, never the photo.');
    const r = await onlineAsk(aiPrompt(raw), 'en');
    if ('text' in r) { const b = readAi(r.text); if (b) { setF(apply(b)); setMsg('The online AI read some details. It can be wrong, so please check each box.'); } else setMsg('The AI could not make sense of it. Please type it in.'); }
    else setMsg(r.why === 'login' ? 'Sign in to use the online AI.' : r.why === 'offline' ? 'No internet. Please try again later.' : 'The online AI is busy or its limit is reached. Please type it in.');
    setBusy(false);
  };
  const svcs = SERVICES.filter((s, i, a) => a.findIndex((x) => x.n === s.n) === i);
  return (
    <SheetFrame title={f.id ? 'Edit subscription' : 'Add subscription'} sub="Pick, scan or type it in" onClose={onClose}>
      <Lab t="PICK A SERVICE" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
        {svcs.map((s) => { const c = catOf(s.cat); return <Pressable key={s.n} onPress={() => set({ name: s.n, cat: s.cat })} accessibilityLabel={s.n}><View style={{ ...chip(f.name === s.n, c.c), flexDirection: 'row', alignItems: 'center', gap: 7 }}><LineIcon name={c.icon} c={f.name === s.n ? c.c : '#e8e8f6'} size={16} /><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{s.n}</Text></View></Pressable>; })}
      </ScrollView>
      <Lab t="OR LET ME FILL IT IN" />
      <Pressable onPress={() => pick(true)} disabled={busy}><LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><LineIcon name="scan" c="#fff" size={22} w={1.7} /><Text style={{ color: W, fontSize: 15.5, fontWeight: '800' }}>{busy ? 'Reading…' : 'Scan a bill or receipt'}</Text></View></LinearGradient></Pressable>
      <Pressable onPress={() => pick(false)} disabled={busy} style={{ marginTop: 10, height: 44, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><LineIcon name="photo" c="#fff" size={20} /><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>Choose a photo of a bill</Text></View></Pressable>
      {raw && on ? <Pressable onPress={ai} disabled={busy} accessibilityLabel="Read with AI" style={{ marginTop: 10, height: 42, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(94,231,181,.6)', backgroundColor: 'rgba(94,231,181,.12)', alignItems: 'center', justifyContent: 'center' }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><LineIcon name="wand" c={GR} size={18} /><Text style={{ color: GR, fontSize: 13, fontWeight: '800' }}>Read with AI (sends the words only)</Text></View></Pressable> : null}
      {msg ? <Text style={{ color: msg.startsWith('Read') || msg.startsWith('The online AI read') ? GR : '#ffd593', fontSize: 12.5, fontWeight: '700', marginTop: 10, lineHeight: 18 }}>{msg}</Text> : null}
      <Text style={{ color: dim, fontSize: 11.5, marginTop: 8, lineHeight: 16 }}>The words are read on this phone and the photo is not kept.</Text>
      <Lab t="DETAILS" />
      <Inp value={f.name} onChangeText={(x: string) => set({ name: x })} placeholder="Name, e.g. Streaming" maxLength={40} />
      {tried && !f.name.trim() ? <Err t="Please enter a name." /> : null}
      <Inp form="sub" need="a price" style={{ marginTop: 9 }} value={f.price} onChangeText={(x: string) => set({ price: x })} keyboardType="decimal-pad" placeholder="Price in RM" />
      {tried && f.price.trim() && !numberError(f.price) && !(price > 0) ? <Err t="Please enter a price above 0." /> : null}
      <Lab t="HOW OFTEN" />
      <View style={{ flexDirection: 'row', gap: 8 }}>{CYCLES.map((c) => <Pressable key={c.k} onPress={() => set({ cycle: c.k })} accessibilityLabel={c.n} style={{ flex: 1 }}><View style={chip(f.cycle === c.k, BL)}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{c.n}</Text></View></Pressable>)}</View>
      <Lab t={f.trial ? 'FIRST CHARGE (WHEN THE TRIAL ENDS)' : 'NEXT CHARGE'} />
      <DateField value={f.next} onChange={(v: string) => set({ next: v })} />
      {tried && badDate ? <Err t="Please pick a valid date." /> : null}
      <Pressable onPress={() => set({ trial: !f.trial })} accessibilityLabel="Free trial" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.5)', backgroundColor: f.trial ? 'rgba(94,231,223,.5)' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{f.trial ? <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>✓</Text> : null}</View>
        <Text style={{ color: W, fontSize: 14 }}>This is a free trial</Text>
      </Pressable>
      <Lab t="CATEGORY" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{SUB_CATS.map((c) => <Pressable key={c.k} onPress={() => set({ cat: c.k })} accessibilityLabel={c.n}><View style={{ ...chip(f.cat === c.k, c.c), flexDirection: 'row', alignItems: 'center', gap: 6 }}><LineIcon name={c.icon} c={f.cat === c.k ? c.c : '#e8e8f6'} size={16} /><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{c.n}</Text></View></Pressable>)}</View>
      <Lab t="REMIND ME BEFORE" />
      <View style={{ flexDirection: 'row', gap: 8 }}>{REM.map((r) => <Pressable key={r.d} onPress={() => set({ remind: r.d })} accessibilityLabel={r.n} style={{ flex: 1 }}><View style={chip(f.remind === r.d, BL)}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{r.n}</Text></View></Pressable>)}</View>
      <Text style={{ color: dim, fontSize: 11.5, marginTop: 6 }}>You get a reminder at 9 am{f.remind ? ', and another on the day' : ' on the day'}.</Text>
      <Lab t="LOGO" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Tile name={f.name} cat={f.cat} photo={f.photo} size={54} />
        <View style={{ flex: 1, gap: 8 }}>
          <Pressable onPress={async () => { try { const u = await takePhoto(false); if (u) set({ photo: u }); } catch (e) { setMsg('Could not open the photo. Please try again.'); } }} accessibilityLabel="Choose your own logo image" style={{ height: 38, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{f.photo ? 'Change image' : 'Use my own image'}</Text></Pressable>
          {f.photo ? <Pressable onPress={() => set({ photo: '' })} accessibilityLabel="Use letters instead"><Text style={{ color: dim, fontSize: 12.5, textAlign: 'center' }}>Use letters instead</Text></Pressable> : null}
        </View>
      </View>
      <Text style={{ color: dim, fontSize: 11.5, marginTop: 6, lineHeight: 16 }}>Your image stays on this phone only. It is not saved to your account. Everything else about the subscription is.</Text>
      <Lab t="NOTE (OPTIONAL)" />
      <Inp value={f.note} onChangeText={(x: string) => set({ note: x })} placeholder="e.g. Shared plan" maxLength={120} />
      <BigBtn t="Save" onPress={save} a11y="Save subscription" />
      {onDelete ? <BigBtn t="Delete" outline="#ff8da1" onPress={onDelete} a11y="Delete subscription" /> : null}
    </SheetFrame>
  );
}

function Row({ s, today, onPress }: { s: Sub; today: string; onPress: () => void }) {
  const c = catOf(s.cat); const d = dueOf(s, today); const hot = d.hot || d.warn;
  const span = s.cycle === 'week' ? 7 : s.cycle === 'year' ? 365 : 30; const fill = Math.max(0.04, Math.min(1, 1 - Math.max(0, d.days) / span));
  const per = s.cycle === 'week' ? '/wk' : s.cycle === 'year' ? '/yr' : '/mo';
  return (
    <Pressable onPress={onPress} accessibilityLabel={'Open ' + s.name} style={({ pressed }) => ({ marginTop: 8, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: hot ? d.col + 'b3' : 'rgba(255,255,255,.2)', borderTopColor: hot ? d.col : 'rgba(255,255,255,.38)', backgroundColor: 'rgba(255,255,255,.06)' }}>
        <LinearGradient colors={hot ? [d.col + '45', d.col + '0a'] : [c.c + '30', 'rgba(255,255,255,.03)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 8 }}>
          <Tile name={s.name} cat={s.cat} photo={s.photo} size={40} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ color: W, fontSize: 15.5, fontWeight: '800' }}>{s.name}</Text>
            <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.72)', fontSize: 12, marginTop: 3 }}>{CYCLES.find((x) => x.k === s.cycle)!.per}{s.note ? ' · ' + s.note : ''}</Text>
          </View>
          <Text style={{ color: W, fontSize: 15.5, fontWeight: '800', letterSpacing: -0.3 }}>{rm(num(s.price))}<Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: '600' }}>{per}</Text></Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 11 }}>
          <View style={{ paddingVertical: 2, paddingHorizontal: 9, borderRadius: 999, borderWidth: 1, borderColor: d.col + '99', backgroundColor: d.hot ? 'rgba(255,107,129,.85)' : d.col + '26' }}><Text style={{ color: d.hot ? '#fff' : d.col, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 }}>{d.pill}</Text></View>
          <View style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.1)', overflow: 'hidden' }}><View style={{ width: (fill * 100) + '%', height: 4, borderRadius: 4, backgroundColor: hot ? d.col : c.c }} /></View>
          <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 11 }}>{shortD(d.date)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function Screen() {
  const [st, setSt] = useStored<SubStore>('ml_subs', SUB_EMPTY);
  const [fin] = useStored<{ spends?: Sp[] }>('ml_finance', {});
  const subs = (st && st.subs) || []; const no = (st && st.no) || [];
  const today = ymd(new Date()); const [f, setF] = useState<Form | null>(null);
  const found = useMemo(() => detect((fin && fin.spends) || [], subs, no, today), [fin, st]);
  const list = useMemo(() => subs.slice().sort((a, b) => dueOf(a, today).days - dueOf(b, today).days), [st]);
  const total = monthlyTotal(subs);
  const nextUp = list.length ? { name: list[0].name, d: dueOf(list[0], today) } : null;
  const shares = useMemo(() => { const m: Record<string, number> = {}; subs.forEach((x) => { m[x.cat] = (m[x.cat] || 0) + monthly(x); }); return Object.keys(m).map((k) => ({ k, v: m[k], c: catOf(k).c, n: catOf(k).n })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v); }, [st]);
  const save = () => {
    if (!f) return; const s: Sub = { ...f, name: f.name.trim(), price: String(pn(f.price)), note: f.note.trim() };
    if (s.id) setSt({ ...st, subs: subs.map((x) => (x.id === s.id ? s : x)) }); else setSt({ ...st, subs: [...subs, { ...s, id: st.next }], next: st.next + 1 });
    setF(null);
  };
  const del = () => { if (!f || !f.id) return; confirmDelete(f.name || 'this subscription', () => { setSt({ ...st, subs: subs.filter((x) => x.id !== f.id) }); setF(null); }, { title: 'Delete this subscription?', message: 'It will be removed from your list. This cannot be undone.' }); };
  const addFound = (x: ReturnType<typeof detect>[number]) => setSt({ ...st, subs: [...subs, fromFound(x, today, st.next)], next: st.next + 1 });
  const notThis = (x: ReturnType<typeof detect>[number]) => confirmDelete(x.name, () => setSt({ ...st, no: [...no, x.key] }), { title: 'Not a subscription?', message: x.name + ' will not be suggested again.', yes: 'Hide it' });
  const plus = <Pressable onPress={() => setF(blank())} accessibilityLabel="Add subscription"><LinearGradient colors={[BL, GR]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#07243a', fontSize: 28, fontWeight: '300', marginTop: -2 }}>+</Text></LinearGradient></Pressable>;
  return (
    <RecordPage title="Subscriptions" sub={subs.length ? rm(total) + ' a month' : 'Track what you pay'} right={plus} bg={<SubArt />} tone={{ base: '#140826', grad: ['#150827', '#2b1052', '#3d1768'], a: 'rgba(214,90,255,.34)', b: 'rgba(120,90,255,.3)' }}>
      <View style={{ marginTop: 6, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', borderTopColor: 'rgba(255,255,255,.42)' }}>
        <LinearGradient colors={['rgba(124,156,255,.5)', 'rgba(183,148,255,.34)', 'rgba(255,180,94,.24)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 14 }}>
          <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 9.5, fontWeight: '800', letterSpacing: 1.6 }}>YOU PAY EVERY MONTH</Text>
          <Text style={{ color: W, fontSize: 30, fontWeight: '800', marginTop: 2, letterSpacing: -0.8 }}>{rm(total)}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.16)' }}><Text style={{ color: W, fontSize: 11, fontWeight: '700' }}>{rm(total * 12)} a year</Text></View>
            <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.16)' }}><Text style={{ color: W, fontSize: 11.5, fontWeight: '700' }}>{subs.length} active</Text></View>
            {nextUp ? <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(94,231,181,.22)', borderWidth: 1, borderColor: 'rgba(94,231,181,.5)' }}><Text numberOfLines={1} style={{ color: '#8fe9d0', fontSize: 11.5, fontWeight: '800' }}>Next: {nextUp.name} · {nextUp.d.pill.toLowerCase()}</Text></View> : null}
          </View>
          {shares.length ? <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', height: 6, borderRadius: 8, overflow: 'hidden', gap: 2 }}>{shares.map((x) => <View key={x.k} style={{ flex: x.v, backgroundColor: x.c, borderRadius: 4 }} />)}</View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 7 }}>{shares.map((x) => <View key={x.k} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: x.c }} /><Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 11.5, fontWeight: '600' }}>{x.n} {Math.round((x.v / (total || 1)) * 100)}%</Text></View>)}</View>
          </View> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}><LineIcon name="bell" c="rgba(255,255,255,.75)" size={15} /><Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 11.5, lineHeight: 16, flex: 1 }}>This month's coming charges come off Money Left.</Text></View>
        </LinearGradient>
      </View>
      {found.map((x) => (
        <View key={x.key} style={{ marginTop: 10, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(94,231,181,.55)', borderTopColor: 'rgba(94,231,181,.85)' }}>
          <LinearGradient colors={['rgba(94,231,181,.26)', 'rgba(94,231,181,.05)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 34, borderRadius: 12, backgroundColor: 'rgba(94,231,181,.2)', borderWidth: 1, borderColor: 'rgba(94,231,181,.6)', alignItems: 'center', justifyContent: 'center' }}><LineIcon name="wand" c={GR} size={21} /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#8fe9d0', fontSize: 9.5, fontWeight: '800', letterSpacing: 1.6 }}>FOUND IN YOUR SPENDING</Text>
                <Text numberOfLines={1} style={{ color: W, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{x.name} · {rm(x.amt)}</Text>
                <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12, marginTop: 2 }}>Paid {x.months} months in a row, around the {x.day}{x.day % 10 === 1 && x.day !== 11 ? 'st' : x.day % 10 === 2 && x.day !== 12 ? 'nd' : x.day % 10 === 3 && x.day !== 13 ? 'rd' : 'th'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 9 }}>
              <Pressable onPress={() => addFound(x)} accessibilityLabel={'Add ' + x.name} style={{ flex: 1 }}><View style={{ height: 34, borderRadius: 12, backgroundColor: GR, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#06312a', fontSize: 13.5, fontWeight: '800' }}>Add subscription</Text></View></Pressable>
              <Pressable onPress={() => notThis(x)} accessibilityLabel={'Not ' + x.name}><View style={{ width: 86, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>Not this</Text></View></Pressable>
            </View>
          </LinearGradient>
        </View>
      ))}
      {list.length ? <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.8, marginTop: 18, marginBottom: 0 }}>COMING UP</Text> : null}
      {list.map((s) => <Row key={s.id} s={s} today={today} onPress={() => setF({ ...s })} />)}
      {!list.length && !found.length ? <Empty e="repeat" t="No subscriptions yet" s="Tap + to add one, or scan a bill. When the same payment shows up in your spending month after month, it will appear here for you to add." /> : null}
      {f ? <Sheet f={f} setF={setF} onSave={save} onDelete={f.id ? del : undefined} onClose={() => setF(null)} /> : null}
    </RecordPage>
  );
}
