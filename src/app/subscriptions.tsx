import React, { useMemo, useState } from 'react';
import { View, Pressable, Platform, ScrollView, Image } from 'react-native';
import { curCode, useRegion } from '../lib/region';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Text } from '../components/Txt';
import { Inp, DateField, W } from '../components/Ui';
import { SheetFrame, Lab, chip, dim, BigBtn, Empty } from '../components/ColUi';
import { SubArt } from '../components/SubArt';
import { RecordPage } from '../components/RecordHubUi';
import Svg, { Circle as SCircle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { LineIcon } from '../components/LineIcon';
import { useStored } from '../lib/store';
import { confirmDelete } from '../lib/dialog';
import { tryForm, pn, numberError } from '../lib/num';
import { takePhoto } from '../lib/photo';
import { scanPhoto } from '../lib/documents';
import { onlineAsk, useOnlineAi } from '../lib/onlineAi';
import { SUB_EMPTY, SUB_CATS, CYCLES, REM, SERVICES, STATUSES, PAYS, payName, live, unitOf, catOf, dueOf, monthlyTotal, monthly, detect, fromFound, readBill, curWarn, readAi, aiPrompt, rm, num, validDate, ymd, addCycle, type Sub, type SubStore, type Cycle, type Billed } from '../lib/subs';
import type { Sp } from '../lib/moneyLeft';

const BL = '#7c9cff', GR = '#5ee7b5';
type Form = Omit<Sub, 'id'> & { id: number };
const blank = (): Form => ({ id: 0, name: '', cat: 'other', price: '', cycle: 'month', next: ymd(addDay(new Date(), 30)), remind: 3, trial: false, note: '', status: 'active', pay: '' });
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
        else { setRaw(text); const b = readBill(text, ymd(new Date())); if (!b) setMsg('Could not find a bill in this photo. Try again in good light, or type it in.'); else { setF(apply(b)); setMsg(curWarn(b.cur) + 'Read some details from the photo. Please check each box before you save. The photo itself is not kept.'); } }
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
        {(() => { const mine = f.cat === 'other' && !svcs.some((s) => s.n === f.name); const c = catOf('other'); return <Pressable key="__other" onPress={() => set({ cat: 'other', name: svcs.some((s) => s.n === f.name) ? '' : f.name })} accessibilityLabel="Other service"><View style={{ ...chip(mine, c.c), flexDirection: 'row', alignItems: 'center', gap: 7 }}><LineIcon name={c.icon} c={mine ? c.c : '#e8e8f6'} size={16} /><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>Other</Text></View></Pressable>; })()}
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
      <Inp form="sub" need="a price" style={{ marginTop: 9 }} value={f.price} onChangeText={(x: string) => set({ price: x })} keyboardType="decimal-pad" placeholder={'Price in ' + curCode()} />
      {tried && f.price.trim() && !numberError(f.price) && !(price > 0) ? <Err t="Please enter a price above 0." /> : null}
      {f.id ? <>
        <Lab t="STATUS" />
        <View style={{ flexDirection: 'row', gap: 8 }}>{STATUSES.map((x) => { const on = (f.status || 'active') === x.k; return <Pressable key={x.k} onPress={() => set({ status: x.k })} accessibilityLabel={x.n} style={{ flex: 1 }}><View style={{ height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, borderWidth: 1, borderColor: on ? x.c : 'rgba(255,255,255,.16)', backgroundColor: on ? x.c + '26' : 'rgba(255,255,255,.06)' }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: x.c }} /><Text style={{ color: W, fontSize: 13, fontWeight: on ? '800' : '600' }}>{x.n}</Text></View></Pressable>; })}</View>
        {(f.status || 'active') !== 'active' ? <Text style={{ color: dim, fontSize: 11.5, marginTop: 6, lineHeight: 16 }}>{f.status === 'cancelled' ? 'Cancelled' : 'Paused'} subscriptions stay in your list but are left out of your totals, reminders and Money Left.</Text> : null}
      </> : null}
      <Lab t="HOW OFTEN" />
      <View style={{ flexDirection: 'row', height: 46, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', padding: 4 }}>{CYCLES.map((c) => <Pressable key={c.k} onPress={() => set({ cycle: c.k })} accessibilityLabel={c.n} style={{ flex: 1 }}><View style={{ flex: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: f.cycle === c.k ? '#6a47e8' : 'transparent' }}><Text style={{ color: W, fontSize: 12, fontWeight: f.cycle === c.k ? '800' : '600' }} numberOfLines={1} adjustsFontSizeToFit>{c.lab}</Text></View></Pressable>)}</View>
      <Lab t={f.trial ? 'FIRST CHARGE (WHEN THE TRIAL ENDS)' : 'NEXT CHARGE'} />
      <DateField value={f.next} onChange={(v: string) => set({ next: v })} />
      {tried && badDate ? <Err t="Please pick a valid date." /> : null}
      <Pressable onPress={() => set({ trial: !f.trial })} accessibilityLabel="Free trial" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.5)', backgroundColor: f.trial ? 'rgba(94,231,223,.5)' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{f.trial ? <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>✓</Text> : null}</View>
        <Text style={{ color: W, fontSize: 14 }}>This is a free trial</Text>
      </Pressable>
      <Lab t="PAID WITH (OPTIONAL)" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{PAYS.map((x) => { const on = f.pay === x.k; return <Pressable key={x.k} onPress={() => set({ pay: on ? '' : x.k })} accessibilityLabel={x.n}><View style={chip(on, BL)}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{x.n}</Text></View></Pressable>; })}</View>
      <Text style={{ color: dim, fontSize: 11.5, marginTop: 6 }}>Only the type is kept. Never type a card number here.</Text>
      <Lab t="CATEGORY" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>{SUB_CATS.map((c) => { const on = f.cat === c.k; return <Pressable key={c.k} onPress={() => set({ cat: c.k })} accessibilityLabel={c.n} style={{ width: '31.4%' }}><View style={{ height: 78, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: on ? c.c : 'rgba(255,255,255,.16)', backgroundColor: on ? c.c + '33' : 'rgba(255,255,255,.07)' }}><LineIcon name={c.icon} c={on ? '#fff' : c.c} size={24} /><Text style={{ color: W, fontSize: 12.5, fontWeight: on ? '800' : '600' }}>{c.n}</Text></View></Pressable>; })}</View>
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

// colours for the light cards: the status colours from subs.ts are pastel, so these are the deeper versions for white backgrounds
const INK = '#ffffff', INK2 = 'rgba(255,255,255,.66)', VIO = '#b9a6ff', LINE = 'rgba(255,255,255,.12)';
const deep = (hex: string) => hex;
const short = (d: ReturnType<typeof dueOf>) => { const tr = d.pill.startsWith('TRIAL'); if (tr) return d.days <= 0 ? 'Trial ends today' : d.days === 1 ? 'Ends tomorrow' : 'Trial · ' + d.days + ' days'; return d.days <= 0 ? 'Today' : d.days === 1 ? 'Tomorrow' : d.days <= 3 ? d.days + ' days' : 'Active'; };
const stTone = (k?: string) => { const c = (STATUSES.find((x) => x.k === k) || STATUSES[0]).c; return { c, bg: c + '26', t: k === 'cancelled' ? 'Cancelled' : 'Paused' }; };
const tone = (d: ReturnType<typeof dueOf>) => (d.hot ? { c: '#ff8fa3', bg: 'rgba(255,107,129,.2)', t: short(d) } : d.warn ? { c: '#ffd24a', bg: 'rgba(255,210,74,.18)', t: short(d) } : { c: '#5ee7b5', bg: 'rgba(94,231,181,.16)', t: short(d) });
// The first look of the cards: light, thin glass. Used by the totals card and the "Found in your spending" card.
const plain = { borderRadius: 22, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.17)', borderTopColor: 'rgba(255,255,255,.3)' } as const;
// Bold frosted glass: the art behind is blurred, the pane is brighter at the top and has a clear light edge, so it stands out and the text stays easy to read.
function Pane({ style, children }: { style?: any; children?: React.ReactNode }) {
  return (
    <View style={[{ borderRadius: 22, overflow: 'hidden', zIndex: 0, borderWidth: 1.2, borderColor: 'rgba(255,255,255,.32)', borderTopColor: 'rgba(255,255,255,.6)', borderBottomColor: 'rgba(255,255,255,.14)' }, style]}>
      <BlurView intensity={70} tint="dark" pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
      <LinearGradient colors={['rgba(255,255,255,.2)', 'rgba(255,255,255,.07)', 'rgba(255,255,255,.12)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
      {children}
    </View>
  );
}

function Row({ s, today, onPress }: { s: Sub; today: string; onPress: () => void }) {
  const d = dueOf(s, today); const on = live(s); const t = on ? tone(d) : stTone(s.status);
  const per = unitOf(s.cycle);
  return (
    <Pressable onPress={onPress} accessibilityLabel={'Open ' + s.name} style={({ pressed }) => ({ marginTop: 9, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <Pane style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 13, paddingVertical: 12, opacity: on ? 1 : 0.62 }}>
        <TileL name={s.name} cat={s.cat} photo={s.photo} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: INK, fontSize: 15.5, fontWeight: '800' }}>{s.name}</Text>
          <Text numberOfLines={1} style={{ color: INK2, fontSize: 12, marginTop: 2 }}>{catOf(s.cat).n}{on ? ' · ' + shortD(d.date) : ''}{s.pay ? ' · ' + payName(s.pay) : ''}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: INK, fontSize: 14.5, fontWeight: '800' }}>{rm(num(s.price))}<Text style={{ color: INK2, fontSize: 11, fontWeight: '600' }}> / {per}</Text></Text>
          <View style={{ marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 2.5, paddingHorizontal: 8, borderRadius: 999, backgroundColor: t.bg }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.c }} /><Text style={{ color: t.c, fontSize: 10, fontWeight: '800' }}>{t.t}</Text></View>
        </View>
      </Pane>
    </Pressable>
  );
}
// the tile on a light card: letters in the deeper category colour, or your own picture
function TileL({ name, cat, photo, size = 44 }: { name: string; cat: string; photo?: string; size?: number }) {
  const c = catOf(cat).c;
  return <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: c + '30', borderWidth: 1, borderColor: c + 'aa', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    {photo ? <Image source={{ uri: photo }} style={{ width: size, height: size }} resizeMode="cover" /> : <Text style={{ color: deep(c), fontSize: size * 0.38, fontWeight: '800' }}>{initials(name)}</Text>}
  </View>;
}
const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// what really falls due in each of the next five months
function nextMonths(subs: Sub[], today: string) {
  const t = new Date(today + 'T12:00:00'); const out: { k: string; n: string; v: number }[] = [];
  for (let i = 0; i < 5; i++) { const d = new Date(t.getFullYear(), t.getMonth() + i, 1); out.push({ k: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), n: MN[d.getMonth()], v: 0 }); }
  const end = out[4].k + '-31';
  subs.forEach((s) => { const p = num(s.price); let d = s.next >= today ? s.next : (nextChargeFrom(s, today) || ''); let n = 0; while (d && d <= end && n++ < 80) { const o = out.find((x) => d.startsWith(x.k)); if (o) o.v += p; d = addCycle(d, s.cycle); } });
  return out;
}
const nextChargeFrom = (s: Sub, today: string) => dueOf(s, today).date;

function Donut({ parts, total }: { parts: { c: string; v: number }[]; total: number }) {
  const r = 44, C = 2 * Math.PI * r; const sum = parts.reduce((a, b) => a + b.v, 0) || 1; let off = 0;
  return <View style={{ width: 118, height: 118, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={118} height={118} viewBox="0 0 118 118">
      <SCircle cx={59} cy={59} r={r} stroke="rgba(255,255,255,.1)" strokeWidth={14} fill="none" />
      {parts.map((p, i) => { const l = (C * p.v) / sum; const e = <SCircle key={i} cx={59} cy={59} r={r} stroke={p.c} strokeWidth={14} fill="none" strokeDasharray={Math.max(0, l - 3) + ' ' + C} strokeDashoffset={-off} rotation={-90} origin="59,59" strokeLinecap="round" />; off += l; return e; })}
    </Svg>
    <View style={{ position: 'absolute', alignItems: 'center' }}><Text style={{ color: INK, fontSize: 24, fontWeight: '800' }}>{total}</Text><Text style={{ color: INK2, fontSize: 10.5 }}>Total</Text></View>
  </View>;
}

export default function Screen() {
  useRegion();
  const router = useRouter();
  const [st, setSt] = useStored<SubStore>('ml_subs', SUB_EMPTY);
  const [fin] = useStored<{ spends?: Sp[] }>('ml_finance', {});
  const subs = (st && st.subs) || []; const no = (st && st.no) || [];
  const today = ymd(new Date()); const [f, setF] = useState<Form | null>(null);
  const found = useMemo(() => detect((fin && fin.spends) || [], subs, no, today), [fin, st]);
  const list = useMemo(() => subs.slice().sort((a, b) => (live(a) === live(b) ? dueOf(a, today).days - dueOf(b, today).days : live(a) ? -1 : 1)), [st]);
  const act = subs.filter(live);
  const total = monthlyTotal(subs);
  const first = list.find(live); const fd = first ? dueOf(first, today) : null; const ft = fd ? tone(fd) : null;
  const shares = useMemo(() => { const m: Record<string, number> = {}; act.forEach((x) => { m[x.cat] = (m[x.cat] || 0) + monthly(x); }); return Object.keys(m).map((k) => ({ k, v: m[k], c: catOf(k).c, n: catOf(k).n })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v); }, [st]);
  const months = useMemo(() => nextMonths(subs.filter(live), today), [st]); const top = Math.max(1, ...months.map((x) => x.v));
  const save = () => {
    if (!f) return; const s: Sub = { ...f, name: f.name.trim(), price: String(pn(f.price)), note: f.note.trim() };
    if (s.id) setSt({ ...st, subs: subs.map((x) => (x.id === s.id ? s : x)) }); else setSt({ ...st, subs: [...subs, { ...s, id: st.next }], next: st.next + 1 });
    setF(null);
  };
  const del = () => { if (!f || !f.id) return; confirmDelete(f.name || 'this subscription', () => { setSt({ ...st, subs: subs.filter((x) => x.id !== f.id) }); setF(null); }, { title: 'Delete this subscription?', message: 'It will be removed from your list. This cannot be undone.' }); };
  const addFound = (x: ReturnType<typeof detect>[number]) => setSt({ ...st, subs: [...subs, fromFound(x, today, st.next)], next: st.next + 1 });
  const notThis = (x: ReturnType<typeof detect>[number]) => confirmDelete(x.name, () => setSt({ ...st, no: [...no, x.key] }), { title: 'Not a subscription?', message: x.name + ' will not be suggested again.', yes: 'Hide it' });
  const stat = (icon: string, v: string, l: string, last?: boolean) => <View style={{ flex: 1, alignItems: 'center', gap: 4, borderRightWidth: last ? 0 : 1, borderRightColor: 'rgba(255,255,255,.12)' }}><LineIcon name={icon} c={VIO} size={22} /><Text numberOfLines={1} adjustsFontSizeToFit style={{ color: INK, fontSize: 14.5, fontWeight: '800' }}>{v}</Text><Text style={{ color: INK2, fontSize: 11 }}>{l}</Text></View>;
  return (
    <View style={{ flex: 1 }}>
      <RecordPage title="Subscriptions" sub="Know what renews, before it does" bg={<SubArt />} tone={{ base: '#1a1030', grad: ['#1a1030', '#2a1747', '#3a1d3d'], a: 'rgba(255,196,107,.34)', b: 'rgba(183,148,255,.3)' }}>
          <View style={{ height: 6 }} />
          <View style={{ ...plain, flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 6, marginTop: 6 }}>
            {stat('check', String(act.length), 'Active')}{stat('cal', rm(total), 'Monthly total')}{stat('chart', rm(total * 12), 'Yearly total', true)}
          </View>

          {first && fd && ft ? <Pressable onPress={() => setF({ ...first })} accessibilityLabel="Upcoming renewal" style={({ pressed }) => ({ marginTop: 12, transform: [{ scale: pressed ? 0.985 : 1 }], borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', borderTopColor: 'rgba(255,255,255,.4)' })}>
            <LinearGradient colors={['rgba(124,156,255,.4)', 'rgba(183,148,255,.3)', 'rgba(255,180,94,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)' }}><LineIcon name="bell" c={fd.hot ? '#ff8fa3' : fd.warn ? '#ffd24a' : '#fff'} size={22} /></View>
              <View style={{ flex: 1 }}><Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5 }}>Upcoming renewal</Text><Text numberOfLines={1} style={{ color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 1 }}>{first.name}</Text><Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, marginTop: 2 }}>{shortD(fd.date)} · {rm(num(first.price))} / {first.cycle === 'week' ? 'week' : first.cycle === 'year' ? 'year' : 'month'}</Text></View>
              <Text style={{ color: '#fff', fontSize: 22 }}>›</Text>
            </LinearGradient>
          </Pressable> : null}

          {found.map((x) => (
            <View key={x.key} style={{ ...plain, marginTop: 12, padding: 12, borderColor: 'rgba(94,231,181,.55)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(94,231,181,.18)', alignItems: 'center', justifyContent: 'center' }}><LineIcon name="wand" c="#5ee7b5" size={23} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#8fe9d0', fontSize: 9.5, fontWeight: '800', letterSpacing: 1.5 }}>FOUND IN YOUR SPENDING</Text>
                  <Text numberOfLines={1} style={{ color: INK, fontSize: 15.5, fontWeight: '800', marginTop: 2 }}>{x.name} · {rm(x.amt)}</Text>
                  <Text style={{ color: INK2, fontSize: 12, marginTop: 2 }}>Paid {x.months} months in a row, around the {x.day}{x.day % 10 === 1 && x.day !== 11 ? 'st' : x.day % 10 === 2 && x.day !== 12 ? 'nd' : x.day % 10 === 3 && x.day !== 13 ? 'rd' : 'th'}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <Pressable onPress={() => addFound(x)} accessibilityLabel={'Add ' + x.name} style={{ flex: 1 }}><View style={{ height: 36, borderRadius: 12, backgroundColor: '#5ee7b5', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#06312a', fontSize: 13.5, fontWeight: '800' }}>Add subscription</Text></View></Pressable>
                <Pressable onPress={() => notThis(x)} accessibilityLabel={'Not ' + x.name}><View style={{ width: 86, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: INK, fontSize: 12.5, fontWeight: '700' }}>Not this</Text></View></Pressable>
              </View>
            </View>
          ))}

          {list.length ? <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 20, marginHorizontal: 2 }}><Text style={{ color: INK, fontSize: 16, fontWeight: '800' }}>My Subscriptions</Text><Text style={{ color: VIO, fontSize: 12, fontWeight: '700' }}>{act.length} active</Text></View> : null}
          {list.map((s) => <Row key={s.id} s={s} today={today} onPress={() => setF({ ...s })} />)}
          {!list.length && !found.length ? <Pane style={{ marginTop: 14, padding: 22, alignItems: 'center' }}><LineIcon name="repeat" c={VIO} size={34} /><Text style={{ color: INK, fontSize: 16, fontWeight: '800', marginTop: 10 }}>No subscriptions yet</Text><Text style={{ color: INK2, fontSize: 12.5, textAlign: 'center', lineHeight: 18, marginTop: 6 }}>Tap Add Subscription, or scan a bill. When the same payment shows up in your spending month after month, it will appear here for you to add.</Text></Pane> : null}

          {act.length ? <>
            <Text style={{ color: INK, fontSize: 16, fontWeight: '800', marginTop: 22, marginHorizontal: 2 }}>Summary</Text>
            <Pane style={{ marginTop: 9, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Donut parts={shares.map((x) => ({ c: x.c, v: x.v }))} total={act.length} />
              <View style={{ flex: 1 }}>
                {shares.map((x) => <View key={x.k} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}><View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: x.c }} /><Text style={{ color: INK, fontSize: 13, flex: 1 }}>{x.n}</Text><Text style={{ color: INK2, fontSize: 12.5, fontWeight: '700' }}>{Math.round((x.v / (total || 1)) * 100)}%</Text></View>)}
                <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.12)', marginTop: 6, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: INK2, fontSize: 12 }}>Every month</Text><Text style={{ color: INK, fontSize: 13, fontWeight: '800' }}>{rm(total)}</Text></View>
              </View>
            </Pane>
            <Text style={{ color: INK, fontSize: 14.5, fontWeight: '800', marginTop: 16, marginHorizontal: 2 }}>Next 5 months</Text>
            <Pane style={{ marginTop: 8, padding: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 150 }}>
              {months.map((m, i) => <View key={m.k} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 5 }}>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: INK2, fontSize: 9.5, fontWeight: '700' }}>{m.v ? Math.round(m.v) : ''}</Text>
                <LinearGradient colors={i === 0 ? ['#b9a6ff', '#7a5cf0'] : ['#8fe9e2', '#5aa8c8']} style={{ width: '100%', height: Math.max(6, (m.v / top) * 78), borderRadius: 8 }} />
                <Text style={{ color: INK2, fontSize: 10.5 }}>{m.n}</Text>
              </View>)}
            </Pane>
            <Text style={{ color: INK2, fontSize: 11.5, marginTop: 10, lineHeight: 16, marginHorizontal: 2 }}>This month's coming charges come off Money Left.</Text>
          </> : null}
          <View style={{ height: 60 }} />
      </RecordPage>
        <View pointerEvents="box-none" style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
          <Pressable onPress={() => setF(blank())} accessibilityLabel="Add subscription"><LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, shadowColor: '#6a4bd8', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}><Text style={{ color: '#1a1040', fontSize: 22, marginTop: -2 }}>+</Text><Text style={{ color: '#1a1040', fontSize: 16, fontWeight: '800' }}>Add Subscription</Text></LinearGradient></Pressable>
        </View>
      {f ? <Sheet f={f} setF={setF} onSave={save} onDelete={f.id ? del : undefined} onClose={() => setF(null)} /> : null}
    </View>
  );
}
