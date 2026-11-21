import React, { useMemo, useState } from 'react';
import { photoSyncOn } from '../lib/sync';
import { View, Platform, ScrollView, Image } from 'react-native';
import { Pressable } from '../components/Press';
import { curCode, useRegion } from '../lib/region';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../components/Txt';
import { Inp, DateField, W } from '../components/Ui';
import { SheetFrame, Lab, chip, dim, BigBtn, Empty } from '../components/ColUi';
import { CancelGuideSheet } from '../components/CancelGuideSheet';
import * as Haptics from '../lib/haptics';
import { SubArt } from '../components/SubArt';
import { SubInsights } from '../components/SubInsights';
import { RecordPage } from '../components/RecordHubUi';
import { useRouter } from 'expo-router';
import { LineIcon } from '../components/LineIcon';
import { useStored } from '../lib/store';
import { confirmDelete, showAlert } from '../lib/dialog';
import { tryForm, pn, numberError } from '../lib/num';
import { takePhoto, scanDocument, docFromGallery } from '../lib/photo';
import { scanPhoto } from '../lib/documents';
import { onlineAsk, useOnlineAi } from '../lib/onlineAi';
import { SUB_EMPTY, SUB_CATS, CYCLES, REM, SERVICES, STATUSES, PAYS, payName, live, unitOf, catOf, dueOf, monthlyTotal, monthly, detect, matchService, fromFound, readBill, curWarn, readAi, aiPrompt, rm, num, validDate, ymd, addCycle, type Sub, type SubStore, type Cycle, type Billed } from '../lib/subs';
import type { Sp } from '../lib/moneyLeft';

const BL = '#7c9cff', GR = '#5ee7b5';
type Form = Omit<Sub, 'id'> & { id: number };
const blank = (): Form => ({ id: 0, name: '', cat: 'other', price: '', cycle: 'month', next: ymd(addDay(new Date(), 30)), remind: 3, trial: false, note: '', status: 'active', pay: '' });
function addDay(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
// One bordered block for each part of the form, so the parts are easy to tell apart.
const Sec = ({ children }: { children?: React.ReactNode }) => <View style={{ marginTop: 14, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', backgroundColor: 'rgba(255,255,255,.045)' }}>{children}</View>;
const L2 = ({ t }: { t: string }) => <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10 }}>{t}</Text>;
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

function Sheet({ f, setF, onSave, onSaveNow, onDelete, onClose }: { f: Form; setF: (x: Form) => void; onSave: () => void; onSaveNow: (x: Form) => void; onDelete?: () => void; onClose: () => void }) {
  const [guide, setGuide] = useState(false);
  const [tried, setTried] = useState(false); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false); const [raw, setRaw] = useState(''); const [on] = useOnlineAi();
  const set = (p: Partial<Form>) => setF({ ...f, ...p });
  const price = pn(f.price); const badPrice = !!numberError(f.price) || !(price > 0); const badDate = !validDate(f.next);
  const save = () => { setTried(true); tryForm('sub'); if (!f.name.trim() || badPrice || badDate) return; onSave(); };
  const apply = (b: Billed, base: Form = f): Form => ({ ...base, name: b.name || base.name, cat: b.cat || base.cat, price: b.price || base.price, cycle: b.cycle || base.cycle, next: b.next || base.next, trial: b.trial != null ? b.trial : base.trial });
  const pick = async (camera: boolean) => {
    setBusy(true); setMsg('');
    try {
      const uri = camera ? await scanDocument() : await docFromGallery();
      if (uri) {
        const text = Platform.OS === 'web' ? null : await scanPhoto(uri);
        if (text == null) setMsg(Platform.OS === 'web' ? 'Scanning works in the Android app. You can still type the details in.' : 'Scanning is not ready on this phone. You can still type the details in.');
        else { setRaw(text); const b = readBill(text, ymd(new Date())); if (!b) setMsg('Could not find a bill in this photo. Try again in good light, or type it in.'); else { setF(apply(b)); setMsg(curWarn(b.cur) + 'Read some details from the photo. Please check each box before you save. The photo itself is not kept.'); } }
      }
    } catch (e: any) { setMsg(e && e.message === 'camera' ? 'Camera access is off. Allow it in Settings to scan, or choose a photo instead.' : 'Could not open the photo. Please try again.'); }
    setBusy(false);
  };
  const ai = async () => {
    setBusy(true); setMsg('Reading it again online. Only the words from the bill are sent, never the photo.');
    const r = await onlineAsk(aiPrompt(raw), 'en');
    if ('text' in r) { const b = readAi(r.text); if (b) { setF(apply(b)); setMsg('Read some details online. It can be wrong, so please check each box.'); } else setMsg('Could not make sense of it. Please type it in.'); }
    else setMsg(r.why === 'login' ? 'Sign in to read it again online.' : r.why === 'offline' ? 'No internet. Please try again later.' : 'The online reading is busy or its limit is reached. Please type it in.');
    setBusy(false);
  };
  const svcs = SERVICES.filter((s, i, a) => a.findIndex((x) => x.n === s.n) === i);
  if (guide) return <CancelGuideSheet name={f.name.trim()} matched={(matchService(f.name) || { n: '' }).n || null} onClose={() => setGuide(false)} onMark={() => { setGuide(false); onSaveNow({ ...f, status: 'cancelled' }); }} />;
  return (
    <SheetFrame title={f.id ? 'Edit subscription' : 'Add subscription'} sub="Pick, scan or type it in" onClose={onClose}>
      <Sec><L2 t="PICK A SERVICE" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
        {svcs.map((s) => { const c = catOf(s.cat); return <Pressable key={s.n} onPress={() => set({ name: s.n, cat: s.cat })} accessibilityLabel={s.n}><View style={{ ...chip(f.name === s.n, c.c), flexDirection: 'row', alignItems: 'center', gap: 7 }}><LineIcon name={c.icon} c={f.name === s.n ? c.c : '#e8e8f6'} size={16} /><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{s.n}</Text></View></Pressable>; })}
        {(() => { const mine = f.cat === 'other' && !svcs.some((s) => s.n === f.name); const c = catOf('other'); return <Pressable key="__other" onPress={() => set({ cat: 'other', name: svcs.some((s) => s.n === f.name) ? '' : f.name })} accessibilityLabel="Other service"><View style={{ ...chip(mine, c.c), flexDirection: 'row', alignItems: 'center', gap: 7 }}><LineIcon name={c.icon} c={mine ? c.c : '#e8e8f6'} size={16} /><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>Other</Text></View></Pressable>; })()}
      </ScrollView>
      </Sec>
      <Sec><L2 t="OR LET ME FILL IT IN" />
      <Text style={{ color: dim, fontSize: 12.5, lineHeight: 18, marginBottom: 12 }}>Don't want to type everything? Just take a photo of the bill or receipt, or choose one from your gallery, and the details fill in for you. Please check them before you save, in case something was read wrong.</Text>
      <Pressable onPress={() => pick(true)} disabled={busy}><LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><LineIcon name="scan" c="#fff" size={22} w={1.7} /><Text style={{ color: W, fontSize: 15.5, fontWeight: '800' }}>{busy ? 'Reading…' : 'Scan a bill or receipt'}</Text></View></LinearGradient></Pressable>
      <Pressable onPress={() => pick(false)} disabled={busy} style={{ marginTop: 10, height: 44, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><LineIcon name="photo" c="#fff" size={20} /><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>Choose a photo of a bill</Text></View></Pressable>
      {raw && on ? <Pressable onPress={ai} disabled={busy} accessibilityLabel="Read again, more carefully" style={{ marginTop: 10, height: 42, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(94,231,181,.6)', backgroundColor: 'rgba(94,231,181,.12)', alignItems: 'center', justifyContent: 'center' }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><LineIcon name="wand" c={GR} size={18} /><Text style={{ color: GR, fontSize: 13, fontWeight: '800' }}>Read again, more carefully (sends the words only)</Text></View></Pressable> : null}
      {msg ? <Text style={{ color: msg.startsWith('Read') ? GR : '#ffd593', fontSize: 12.5, fontWeight: '700', marginTop: 10, lineHeight: 18 }}>{msg}</Text> : null}
      <Text style={{ color: dim, fontSize: 11.5, marginTop: 8, lineHeight: 16 }}>The words are read on this phone and the photo is not kept.</Text>
      </Sec>
      <Sec><L2 t="DETAILS" />
      <Inp value={f.name} onChangeText={(x: string) => set({ name: x })} placeholder="Name, e.g. Streaming" maxLength={40} />
      {tried && !f.name.trim() ? <Err t="Please enter a name." /> : null}
      <Inp form="sub" need="a price" style={{ marginTop: 9 }} value={f.price} onChangeText={(x: string) => set({ price: x })} keyboardType="decimal-pad" placeholder={'Price in ' + curCode()} />
      {tried && f.price.trim() && !numberError(f.price) && !(price > 0) ? <Err t="Please enter a price above 0." /> : null}
      </Sec>
      {f.id ? <Sec>
        <L2 t="STATUS" />
        <View style={{ flexDirection: 'row', gap: 8 }}>{STATUSES.map((x) => { const on = (f.status || 'active') === x.k; return <Pressable key={x.k} onPress={() => set({ status: x.k })} accessibilityLabel={x.n} style={{ flex: 1 }}><View style={{ height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, borderWidth: 1, borderColor: on ? x.c : 'rgba(255,255,255,.16)', backgroundColor: on ? x.c + '26' : 'rgba(255,255,255,.06)' }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: x.c }} /><Text style={{ color: W, fontSize: 13, fontWeight: on ? '800' : '600' }}>{x.n}</Text></View></Pressable>; })}</View>
        {(f.status || 'active') !== 'active' ? <Text style={{ color: dim, fontSize: 11.5, marginTop: 6, lineHeight: 16 }}>{f.status === 'cancelled' ? 'Cancelled' : 'Paused'} subscriptions stay in your list but are left out of your totals, reminders and Money Left. Tap Save to keep this change.</Text> : null}
      </Sec> : null}
      <Sec><L2 t="HOW OFTEN" />
      <View style={{ gap: 9 }}>
        {[CYCLES.slice(0, 3), CYCLES.slice(3)].map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 9 }}>
            {row.map((c) => { const on = f.cycle === c.k; return (
              <Pressable key={c.k} onPress={() => { if (!on && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); set({ cycle: c.k }); }} accessibilityLabel={c.lab} style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.96 : 1 }] })}>
                <View style={{ height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: on ? '#9a86ff' : 'rgba(255,255,255,.16)', backgroundColor: on ? 'rgba(124,92,255,.38)' : 'rgba(255,255,255,.07)' }}>
                  <Text style={{ color: W, fontSize: 14.5, fontWeight: on ? '800' : '700' }}>{c.lab}</Text>
                  <Text style={{ color: on ? 'rgba(255,255,255,.85)' : dim, fontSize: 10.5, marginTop: 2 }}>{c.per}</Text>
                </View>
              </Pressable>
            ); })}
          </View>
        ))}
      </View>
      </Sec>
      <Sec><L2 t={f.trial ? 'FIRST CHARGE (WHEN THE TRIAL ENDS)' : 'NEXT CHARGE'} />
      <DateField value={f.next} onChange={(v: string) => set({ next: v })} />
      {tried && badDate ? <Err t="Please pick a valid date." /> : null}
      <Pressable onPress={() => set({ trial: !f.trial })} accessibilityLabel="Free trial" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.5)', backgroundColor: f.trial ? 'rgba(94,231,223,.5)' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{f.trial ? <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>✓</Text> : null}</View>
        <Text style={{ color: W, fontSize: 14 }}>This is a free trial</Text>
      </Pressable>
      </Sec>
      <Sec><L2 t="PAID WITH (OPTIONAL)" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{PAYS.map((x) => { const on = f.pay === x.k; return <Pressable key={x.k} onPress={() => set({ pay: on ? '' : x.k })} accessibilityLabel={x.n}><View style={chip(on, BL)}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{x.n}</Text></View></Pressable>; })}</View>
      <Text style={{ color: dim, fontSize: 11.5, marginTop: 6 }}>Only the type is kept. Never type a card number here.</Text>
      </Sec>
      <Sec><L2 t="CATEGORY" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 9 }}>{SUB_CATS.map((c) => { const on = f.cat === c.k; return <Pressable key={c.k} onPress={() => set({ cat: c.k })} accessibilityLabel={c.n} style={{ width: '31.5%' }}><View style={{ height: 78, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderColor: on ? c.c : 'rgba(255,255,255,.16)', backgroundColor: on ? c.c + '33' : 'rgba(255,255,255,.07)' }}><LineIcon name={c.icon} c={on ? '#fff' : c.c} size={24} /><Text style={{ color: W, fontSize: 12.5, fontWeight: on ? '800' : '600' }}>{c.n}</Text></View></Pressable>; })}</View>
      </Sec>
      <Sec><L2 t="REMIND ME BEFORE" />
      <View style={{ flexDirection: 'row', gap: 8 }}>{REM.map((r) => <Pressable key={r.d} onPress={() => set({ remind: r.d })} accessibilityLabel={r.n} style={{ flex: 1 }}><View style={chip(f.remind === r.d, BL)}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{r.n}</Text></View></Pressable>)}</View>
      <Text style={{ color: dim, fontSize: 11.5, marginTop: 6 }}>You get a reminder at 9 am{f.remind ? ', and another on the day' : ' on the day'}.</Text>
      </Sec>
      <Sec><L2 t="LOGO" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Tile name={f.name} cat={f.cat} photo={f.photo} size={54} />
        <View style={{ flex: 1, gap: 8 }}>
          <Pressable onPress={async () => { try { const u = await takePhoto(false, { square: true }); if (u) set({ photo: u }); } catch (e) { setMsg('Could not open the photo. Please try again.'); } }} accessibilityLabel="Choose your own logo image" style={{ height: 38, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{f.photo ? 'Change image' : 'Use my own image'}</Text></Pressable>
          {f.photo ? <Pressable onPress={() => set({ photo: '' })} accessibilityLabel="Use letters instead"><Text style={{ color: dim, fontSize: 12.5, textAlign: 'center' }}>Use letters instead</Text></Pressable> : null}
        </View>
      </View>
      <Text style={{ color: dim, fontSize: 11.5, marginTop: 6, lineHeight: 16 }}>Pick a picture and cut out the square you want, then tap CROP at the top right to finish (that button is your phone's own editor). {photoSyncOn() ? "Your image is saved to your account too." : "Your image stays on this phone only. It is not saved to your account. Everything else about the subscription is."}</Text>
      </Sec>
      <Sec><L2 t="NOTE (OPTIONAL)" />
      <Inp value={f.note} onChangeText={(x: string) => set({ note: x })} placeholder="e.g. Shared plan" maxLength={120} />
      </Sec>
      {f.id ? <Pressable onPress={() => setGuide(true)} accessibilityLabel="How to cancel" style={({ pressed }) => ({ marginTop: 14, transform: [{ scale: pressed ? 0.985 : 1 }], borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' })}>
        <LinearGradient colors={['rgba(124,156,255,.4)', 'rgba(183,148,255,.3)', 'rgba(255,180,94,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)' }}><LineIcon name="scan" c="#fff" size={20} w={1.7} /></View>
          <View style={{ flex: 1 }}><Text style={{ color: '#fff', fontSize: 14.5, fontWeight: '800' }}>How to cancel</Text><Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, marginTop: 2 }}>Step by step{f.name.trim() ? ' for ' + f.name.trim() : ''}</Text></View>
          <Text style={{ color: '#fff', fontSize: 22 }}>›</Text>
        </LinearGradient>
      </Pressable> : null}
      <BigBtn t="Save" onPress={save} a11y="Save subscription" />
      {onDelete ? <BigBtn t="Delete" outline="#ff8da1" onPress={onDelete} a11y="Delete subscription" /> : null}
    </SheetFrame>
  );
}

// colours for the light cards: the status colours from subs.ts are pastel, so these are the deeper versions for white backgrounds
const INK = '#ffffff', INK2 = 'rgba(255,255,255,.66)', VIO = '#b9a6ff', LINE = 'rgba(255,255,255,.12)';
const deep = (hex: string) => hex;
const short = (d: ReturnType<typeof dueOf>) => { const tr = d.pill.startsWith('TRIAL'); if (tr) return d.days <= 0 ? 'Trial ends today' : d.days === 1 ? 'Ends tomorrow' : 'Trial · ' + d.days + ' days'; return d.days <= 0 ? 'Today' : d.days === 1 ? 'Tomorrow' : 'In ' + d.days + ' days'; };
const stTone = (k?: string) => { const c = (STATUSES.find((x) => x.k === k) || STATUSES[0]).c; return { c, bg: c + '26', t: k === 'cancelled' ? 'Cancelled' : 'Paused' }; };
const tone = (d: ReturnType<typeof dueOf>) => (d.hot ? { c: '#ff8fa3', bg: 'rgba(255,107,129,.2)', t: short(d) } : d.warn ? { c: '#ffd24a', bg: 'rgba(255,210,74,.18)', t: short(d) } : { c: '#5ee7b5', bg: 'rgba(94,231,181,.16)', t: short(d) });
// The first look of the cards: light, thin glass. Used by the totals card and the "Found in your spending" card.
const plain = { borderRadius: 22, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.17)' } as const;
// Bold frosted glass: the art behind is blurred, the pane is brighter at the top and has a clear light edge, so it stands out and the text stays easy to read.
function Pane({ style, children }: { style?: any; children?: React.ReactNode }) {
  return (
    <View style={[{ borderRadius: 22, overflow: 'hidden', zIndex: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' }, style]}>
      <LinearGradient colors={['rgba(124,156,255,.4)', 'rgba(183,148,255,.3)', 'rgba(255,180,94,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
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

export default function Screen() {
  useRegion();
  const router = useRouter();
  const [st, setSt] = useStored<SubStore>('ml_subs', SUB_EMPTY);
  const [fin] = useStored<{ spends?: Sp[]; inc?: Record<string, Record<string, number>> }>('ml_finance', {});
  const subs = (st && st.subs) || []; const no = (st && st.no) || [];
  const today = ymd(new Date()); const [f, setF] = useState<Form | null>(null);
  const found = useMemo(() => detect((fin && fin.spends) || [], subs, no, today), [fin, st]);
  const list = useMemo(() => subs.slice().sort((a, b) => (live(a) === live(b) ? dueOf(a, today).days - dueOf(b, today).days : live(a) ? -1 : 1)), [st]);
  const act = subs.filter(live);
  const total = monthlyTotal(subs);
  const first = list.find(live); const fd = first ? dueOf(first, today) : null; const ft = fd ? tone(fd) : null;
  const incNow = (fin && (fin as any).inc && (fin as any).inc[today.slice(0, 7)]) || {}; const income = Object.keys(incNow).reduce((a, k) => a + (Number(incNow[k]) || 0), 0);
  const months = useMemo(() => nextMonths(subs.filter(live), today), [st]);
  const save = (g?: Form) => {
    const f2 = g || f; if (!f2) return; const s: Sub = { ...f2, name: f2.name.trim(), price: String(pn(f2.price)), note: f2.note.trim() };
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

          {first && fd && ft ? <Pressable onPress={() => setF({ ...first })} accessibilityLabel="Upcoming renewal" style={({ pressed }) => ({ marginTop: 12, transform: [{ scale: pressed ? 0.985 : 1 }], borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', borderTopColor: 'rgba(255,255,255,.55)' })}>
            <LinearGradient colors={['rgba(124,156,255,.4)', 'rgba(183,148,255,.3)', 'rgba(255,180,94,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)' }}><LineIcon name="bell" c={fd.hot ? '#ff8fa3' : fd.warn ? '#ffd24a' : '#fff'} size={22} /></View>
              <View style={{ flex: 1 }}><Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5 }}>Upcoming renewal</Text><Text numberOfLines={1} style={{ color: '#fff', fontSize: 15, fontWeight: '800', marginTop: 1 }}>{first.name}</Text><Text numberOfLines={1} style={{ color: '#fff', fontSize: 12.5, fontWeight: '700', marginTop: 2 }}>{shortD(fd.date)} · {fd.txt.replace(/^Charges /, '')}</Text><Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, marginTop: 1 }}>{rm(num(first.price))} / {unitOf(first.cycle)}</Text></View>
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
            <SubInsights subs={subs} income={income} months={months} onOpen={(x) => setF({ ...x })} />
          </> : null}
          <View style={{ height: 60 }} />
      </RecordPage>
        <View pointerEvents="box-none" style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
          <Pressable onPress={() => setF(blank())} accessibilityLabel="Add subscription"><LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, shadowColor: '#6a4bd8', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}><Text style={{ color: '#1a1040', fontSize: 22, marginTop: -2 }}>+</Text><Text style={{ color: '#1a1040', fontSize: 16, fontWeight: '800' }}>Add Subscription</Text></LinearGradient></Pressable>
        </View>
      {f ? <Sheet f={f} setF={setF} onSave={() => save()} onSaveNow={(x) => { save(x); showAlert('Marked as cancelled', x.name.trim() + ' is now marked as cancelled. It stays in your list, but it is left out of your totals, reminders and Money Left.'); }} onDelete={f.id ? del : undefined} onClose={() => setF(null)} /> : null}
    </View>
  );
}
