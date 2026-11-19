import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, Animated, Modal, ScrollView, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '../components/Txt';
import { RecordPage, Intro } from '../components/RecordHubUi';
import { DocArt } from '../components/DocArt';
import { SearchField } from '../components/Shine';
import { Inp, DateField, W } from '../components/Ui';
import { useStored } from '../lib/store';
import { confirmDelete } from '../lib/dialog';
import { tryForm } from '../lib/num';
import { takePhoto } from '../lib/photo';
import { DOC_TYPES, TABS, REMINDS, EMPTY_DOCS, typeOf, statusOf, bySoon, validDate, readText, guessType, scanPhoto, ymd, type Doc, type DocStore, type DocTab, type Remind, type Read } from '../lib/documents';

const dim = 'rgba(255,255,255,.62)';
function Ring({ s }: { s: ReturnType<typeof statusOf> }) {
  const r = 20, C = 2 * Math.PI * r;
  if (s.ring == null) return <View style={{ width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 22, fontWeight: '700' }}>∞</Text></View>;
  return (
    <View style={{ width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={46} height={46} viewBox="0 0 46 46" style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={23} cy={23} r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={4.5} />
        <Circle cx={23} cy={23} r={r} fill="none" stroke={s.col} strokeWidth={4.5} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - Math.max(0.04, s.ring))} />
      </Svg>
      <Text style={{ color: W, fontSize: 10.5, fontWeight: '800' }}>{s.val}</Text>
    </View>
  );
}
function Row({ d, onPress }: { d: Doc; onPress: () => void }) {
  const t = typeOf(d.type), s = statusOf(d);
  return (
    <Pressable onPress={onPress} accessibilityLabel={'Open ' + d.title} style={({ pressed }) => ({ marginTop: 10, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <View style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: s.hot ? 'rgba(255,107,129,.6)' : 'rgba(255,255,255,.2)', borderTopColor: s.hot ? 'rgba(255,107,129,.7)' : 'rgba(255,255,255,.34)', backgroundColor: s.hot ? 'rgba(255,107,129,.16)' : 'rgba(255,255,255,.07)' }}>
        <LinearGradient colors={s.hot ? ['rgba(255,107,129,.3)', 'rgba(255,107,129,.08)'] : ['rgba(255,255,255,.12)', 'rgba(255,255,255,.03)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 }}>
          <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: s.hot ? '#ff6b81' : t.c, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.35)', borderTopColor: 'rgba(255,255,255,.6)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }}><Text style={{ fontSize: 22 }}>{t.e}</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: '#8fe9e2', fontSize: 9.5, fontWeight: '800', letterSpacing: 1.1 }}>{t.lab}</Text>
            <Text numberOfLines={1} style={{ color: W, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{d.title}</Text>
            <Text numberOfLines={1} style={{ color: s.col, fontSize: 12.5, fontWeight: '700', marginTop: 2 }}>{s.txt}</Text>
          </View>
          <Ring s={s} />
        </View>
      </View>
    </Pressable>
  );
}

function Detail({ d, onEdit, onClose }: { d: Doc; onEdit: () => void; onClose: () => void }) {
  const t = typeOf(d.type), s = statusOf(d); const [big, setBig] = useState(false);
  const rem = REMINDS.find((x) => x.k === d.remind);
  const line = (k: string, v: string) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 13, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.1)' }}>
      <Text style={{ color: dim, fontSize: 13 }}>{k}</Text><Text style={{ color: W, fontSize: 14, fontWeight: '700', flexShrink: 1, textAlign: 'right' }} selectable>{v}</Text>
    </View>
  );
  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#1b0f26' }}>
        <LinearGradient colors={['#1b0f26', '#2c1340', '#10244a']} locations={[0, 0.48, 1]} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 52, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={onClose} accessibilityLabel="Close"><View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 22 }}>‹</Text></View></Pressable>
            <View style={{ flex: 1 }}><Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 }}>{t.lab}</Text><Text numberOfLines={2} style={{ color: W, fontSize: 22, fontWeight: '800' }}>{d.title}</Text></View>
          </View>
          {d.photo ? (
            <Pressable onPress={() => setBig(true)} accessibilityLabel="View photo" style={{ marginTop: 20 }}>
              <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.06)' }}>
                <Image source={{ uri: d.photo }} style={{ width: '100%', aspectRatio: 1.58 }} resizeMode="contain" />
              </View>
              <Text style={{ color: dim, fontSize: 11.5, textAlign: 'center', marginTop: 8 }}>Tap the photo to see it full screen</Text>
            </Pressable>
          ) : (
            <Pressable onPress={onEdit} style={{ marginTop: 20, height: 150, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.3)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.05)' }}>
              <Text style={{ fontSize: 30 }}>{t.e}</Text><Text style={{ color: W, fontSize: 14, fontWeight: '700', marginTop: 6 }}>No photo yet</Text><Text style={{ color: dim, fontSize: 12, marginTop: 2 }}>Tap to add one</Text>
            </Pressable>
          )}
          <View style={{ marginTop: 18, borderRadius: 20, borderWidth: 1, borderColor: s.hot ? 'rgba(255,107,129,.5)' : 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.06)', paddingHorizontal: 16, paddingVertical: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 13 }}><Text style={{ color: dim, fontSize: 13 }}>Status</Text><Text style={{ color: s.col, fontSize: 14, fontWeight: '800' }}>{s.txt}</Text></View>
            {d.number ? line('Number', d.number) : null}
            {d.expiry ? line(d.type === 'warranty' ? 'Warranty ends' : 'Expires', d.expiry.split('-').reverse().join('/')) : line('Expiry', 'No expiry')}
            {d.expiry ? line('Reminder', rem && rem.k !== 'off' ? rem.n : 'None') : null}
            {d.note ? line('Note', d.note) : null}
          </View>
          <Pressable onPress={onEdit} accessibilityLabel="Edit document" style={{ marginTop: 20 }}><LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 16, fontWeight: '800' }}>Edit</Text></LinearGradient></Pressable>
        </ScrollView>
        {big && d.photo ? (
          <Modal transparent statusBarTranslucent animationType="fade" onRequestClose={() => setBig(false)}>
            <Pressable onPress={() => setBig(false)} style={{ flex: 1, backgroundColor: 'rgba(5,8,25,.94)', padding: 16, justifyContent: 'center' }}><Image source={{ uri: d.photo }} style={{ width: '100%', height: '85%' }} resizeMode="contain" /></Pressable>
          </Modal>
        ) : null}
      </View>
    </Modal>
  );
}

type Form = { id: number; type: string; title: string; number: string; expiry: string; noExp: boolean; remind: Remind; photo: string; note: string };
const blank = (type: string): Form => ({ id: 0, type, title: '', number: '', expiry: ymd(new Date(Date.now() + 365 * 86400000)), noExp: false, remind: '3m', photo: '', note: '' });

function Sheet({ f, setF, onSave, onDelete, onClose }: { f: Form; setF: (x: Form) => void; onSave: () => void; onDelete?: () => void; onClose: () => void }) {
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false); const [view, setView] = useState(false); const [tried, setTried] = useState(false);
  const set = (p: Partial<Form>) => setF({ ...f, ...p });
  const t = typeOf(f.type);
  const fill = (base: Form, r: Read): Form => {
    const t = typeOf(base.type);
    const nm = r.name ? r.name.replace(/\b([A-Z])([A-Z]+)\b/g, (_m, x, y) => x + y.toLowerCase()) : '';
    return { ...base, title: base.title.trim() ? base.title : (nm ? t.label + ' · ' + nm : base.title), number: r.number || base.number, expiry: r.expiry || base.expiry, noExp: r.expiry ? false : base.noExp };
  };
  const pick = async (camera: boolean) => {
    setBusy(true); setMsg('');
    try {
      const uri = await takePhoto(camera);
      if (uri) {
        const text = Platform.OS === 'web' ? null : await scanPhoto(uri);
        const fresh = !f.id && !f.title.trim() && !f.number.trim();
        const g = text && fresh ? guessType(text) : null; const ty = g ? g.type : f.type;
        const r = text ? (readText(ty, text) || (ty !== f.type ? readText(f.type, text) : null)) : null; const base = { ...f, type: ty, photo: uri };
        if (text == null) { setF(base); setMsg(Platform.OS === 'web' ? 'Scanning works in the Android app. You can still type the details in.' : 'Scanning is not ready on this phone. You can still type the details in.'); }
        else if (!r) { setF(base); setMsg((g && g.type !== f.type ? 'Looks like a ' + typeOf(g.type).label.toLowerCase() + ', but no details could be read. ' : '') + 'Could not read this photo. Try again in good light, hold the camera steady, or type it in.'); }
        else { setF(fill(base, r)); const sw = g && g.type !== f.type ? 'Looks like a ' + typeOf(g.type).label.toLowerCase() + (g.sure ? '. ' : ', but I am not sure. Change the type above if it is wrong. ') : ''; setMsg(sw + (r.sure ? '✓ The two code lines matched. Please still check each box.' : 'Read some details from the photo. Please check each box before you save.')); }
      }
    } catch (e: any) { setMsg(e && e.message === 'camera' ? 'Camera access is off. Allow it in Settings to scan, or choose a photo instead.' : 'Could not open the photo. Please try again.'); }
    setBusy(false);
  };
  const badDate = !f.noExp && !validDate(f.expiry);
  const save = () => { setTried(true); tryForm('doc'); if (!f.title.trim() || badDate) return; onSave(); };
  const chip = (on: boolean, c = '#8ea8ff') => ({ paddingVertical: 10, paddingHorizontal: 4, borderRadius: 14, alignItems: 'center' as const, backgroundColor: on ? c + '55' : 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: on ? c : 'rgba(255,255,255,.14)' });
  const lab = (x: string) => <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginTop: 18, marginBottom: 8 }}>{x}</Text>;
  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#1b0f26' }}>
        <LinearGradient colors={['#1b0f26', '#2c1340', '#10244a']} locations={[0, 0.48, 1]} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 52, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={onClose} accessibilityLabel="Close"><View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></View></Pressable>
              <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 22, fontWeight: '800' }}>{f.id ? 'Edit document' : 'Add document'}</Text><Text style={{ color: dim, fontSize: 12 }}>Scan it or type it in</Text></View>
            </View>
            {lab('TYPE')}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {DOC_TYPES.map((x) => (
                <Pressable key={x.key} onPress={() => set({ type: x.key })} style={{ width: '23.2%' }} accessibilityLabel={x.label}>
                  <View style={{ ...chip(f.type === x.key, x.c), paddingVertical: 12 }}><Text style={{ fontSize: 22 }}>{x.e}</Text><Text numberOfLines={1} style={{ color: W, fontSize: 11, fontWeight: '700', marginTop: 3 }}>{x.label}</Text></View>
                </Pressable>
              ))}
            </View>
            {lab('FILL IT IN FOR YOU')}
            <Pressable onPress={() => pick(true)} disabled={busy}><LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}><Text style={{ color: W, fontSize: 16, fontWeight: '800' }}>{busy ? 'Reading…' : '📷  Scan with camera'}</Text></LinearGradient></Pressable>
            <Pressable onPress={() => pick(false)} disabled={busy} style={{ marginTop: 10, height: 46, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>🖼️  Choose a photo</Text></Pressable>
            {msg ? <Text style={{ color: msg.startsWith('✓') ? '#5ee7b5' : '#ffd593', fontSize: 12.5, fontWeight: '700', marginTop: 10, lineHeight: 18 }}>{msg}</Text> : null}
            <Text style={{ color: dim, fontSize: 11.5, marginTop: 8, lineHeight: 16 }}>The words are read on this phone. The photo is not sent anywhere and stays on this phone only.</Text>
            {f.photo ? (
              <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable onPress={() => setView(true)}><Image source={{ uri: f.photo }} style={{ width: 96, height: 64, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.1)' }} resizeMode="cover" /></Pressable>
                <Pressable onPress={() => confirmDelete('this photo', () => set({ photo: '' }), { title: 'Remove this photo?', yes: 'Remove' })} accessibilityLabel="Remove photo"><View style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.1)' }}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>Remove photo</Text></View></Pressable>
              </View>
            ) : null}
            {lab('DETAILS')}
            <Inp value={f.title} onChangeText={(x: string) => set({ title: x })} placeholder={t.label + ' name, e.g. ' + (f.type === 'passport' ? 'Passport · Adli' : f.type === 'bank' ? 'Maybank Visa' : f.type === 'warranty' ? 'Samsung TV' : 'My ' + t.label.toLowerCase())} maxLength={60} />
            {(tried || false) && !f.title.trim() ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please enter a name.</Text> : null}
            <Inp style={{ marginTop: 9 }} value={f.number} onChangeText={(x: string) => set({ number: x })} placeholder={f.type === 'bank' ? 'Card number (optional, you can leave it empty)' : 'Number (optional)'} maxLength={40} autoCapitalize="characters" />
            {lab(f.type === 'warranty' ? 'WARRANTY ENDS' : 'EXPIRY DATE')}
            <Pressable onPress={() => set({ noExp: !f.noExp })} accessibilityLabel="No expiry" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: f.noExp ? '#8fe9e2' : 'rgba(255,255,255,.4)', backgroundColor: f.noExp ? 'rgba(143,233,226,.35)' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{f.noExp ? <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>✓</Text> : null}</View>
              <Text style={{ color: W, fontSize: 14, fontWeight: '600' }}>No expiry</Text>
            </Pressable>
            {!f.noExp ? <DateField value={f.expiry} onChange={(x: string) => set({ expiry: x })} /> : null}
            {tried && badDate ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please pick a valid date.</Text> : null}
            {lab('REMIND ME BEFORE')}
            <View style={{ flexDirection: 'row', gap: 6, opacity: f.noExp ? 0.4 : 1 }}>
              {REMINDS.map((x) => (<Pressable key={x.k} disabled={f.noExp} onPress={() => set({ remind: x.k })} style={{ flex: 1 }}><View style={chip(f.remind === x.k && !f.noExp, '#8fe9e2')}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{x.n}</Text></View></Pressable>))}
            </View>
            {f.noExp ? <Text style={{ color: dim, fontSize: 11.5, marginTop: 6 }}>No reminder is needed when there is no expiry.</Text> : null}
            <Pressable onPress={save} style={{ marginTop: 26 }} accessibilityLabel="Save document"><LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 16, fontWeight: '800' }}>Save</Text></LinearGradient></Pressable>
            {onDelete ? <Pressable onPress={onDelete} style={{ marginTop: 12, height: 46, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,107,129,.5)', alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Delete document"><Text style={{ color: '#ff9aa9', fontSize: 14, fontWeight: '700' }}>Delete document</Text></Pressable> : null}
          </ScrollView>
        </KeyboardAvoidingView>
        {view && f.photo ? (
          <Modal transparent statusBarTranslucent animationType="fade" onRequestClose={() => setView(false)}>
            <Pressable onPress={() => setView(false)} style={{ flex: 1, backgroundColor: 'rgba(5,8,25,.94)', padding: 16, justifyContent: 'center' }}><Image source={{ uri: f.photo }} style={{ width: '100%', height: '80%' }} resizeMode="contain" /><Text style={{ color: dim, fontSize: 12, textAlign: 'center', marginTop: 10 }}>Tap anywhere to close</Text></Pressable>
          </Modal>
        ) : null}
      </View>
    </Modal>
  );
}

export default function Documents() {
  const [st, setSt] = useStored<DocStore>('ml_documents', EMPTY_DOCS);
  const docs = (st && st.docs) || [];
  const [tab, setTab] = useState<DocTab>('identity'); const [q, setQ] = useState(''); const [f, setF] = useState<Form | null>(null); const [det, setDet] = useState(0);
  const order = TABS.map((x) => x.k); const [pw, setPw] = useState(0);
  const pos = useRef(new Animated.Value(0)).current; const fx = useRef(new Animated.Value(1)).current; const dir = useRef(1);
  useEffect(() => { Animated.spring(pos, { toValue: order.indexOf(tab), useNativeDriver: true, friction: 8, tension: 90 }).start(); }, [tab]);
  const goTab = (k: DocTab) => {
    if (k === tab) return; dir.current = order.indexOf(k) > order.indexOf(tab) ? 1 : -1;
    fx.setValue(0); setTab(k); Animated.timing(fx, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  };
  const tw = pw ? (pw - 6) / TABS.length : 0;
  const slide = { opacity: fx, transform: [{ translateX: fx.interpolate({ inputRange: [0, 1], outputRange: [dir.current * 38, 0] }) }] };
  const info = TABS.find((x) => x.k === tab) as (typeof TABS)[number];
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return docs.filter((d) => typeOf(d.type).tab === tab && (!n || (d.title + ' ' + (d.number || '') + ' ' + typeOf(d.type).label).toLowerCase().includes(n))).sort(bySoon);
  }, [docs, tab, q]);
  const openNew = () => setF(blank(DOC_TYPES.find((x) => x.tab === tab)!.key));
  const openEdit = (d: Doc) => setF({ id: d.id, type: d.type, title: d.title, number: d.number || '', expiry: d.expiry || ymd(new Date(Date.now() + 365 * 86400000)), noExp: !d.expiry, remind: d.remind, photo: d.photo || '', note: d.note || '' });
  const save = () => {
    if (!f) return;
    const doc: Doc = { id: f.id || (st && st.next) || 1, type: f.type, title: f.title.trim(), number: f.number.trim() || undefined, expiry: f.noExp ? undefined : f.expiry, remind: f.noExp ? 'off' : f.remind, photo: f.photo || undefined, note: f.note || undefined };
    const next = f.id ? docs.map((d) => (d.id === f.id ? doc : d)) : [doc, ...docs];
    setSt({ docs: next, next: Math.max((st && st.next) || 1, doc.id + 1) });
    setTab(typeOf(f.type).tab); setF(null);
  };
  const del = () => { if (!f || !f.id) return; confirmDelete('this document', () => { setSt({ ...st, docs: docs.filter((d) => d.id !== f.id) }); setF(null); }, { title: 'Delete this document?', message: 'The details and the photo on this phone will be removed. This cannot be undone.' }); };
  const plus = (
    <Pressable onPress={openNew} accessibilityLabel="Add document"><LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 26, fontWeight: '300', marginTop: -2 }}>+</Text></LinearGradient></Pressable>
  );
  return (
    <RecordPage title="Documents" sub={docs.length + ' saved'} right={plus} bg={<DocArt />}>
      <Animated.View style={slide}><Intro title={info.title} text={info.text} colors={['rgba(142,168,255,.5)', 'rgba(183,148,255,.4)']} /></Animated.View>
      <View onLayout={(e) => setPw(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)', marginTop: 12 }}>
        {tw ? <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 3, top: 3, bottom: 3, width: tw, transform: [{ translateX: Animated.multiply(pos, tw) }] }}><LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: 999 }} /></Animated.View> : null}
        {TABS.map((x) => (
          <Pressable key={x.k} onPress={() => goTab(x.k)} style={{ flex: 1 }} accessibilityLabel={x.n}>
            <View style={{ paddingVertical: 9, alignItems: 'center' }}><Text style={{ color: tab === x.k ? W : 'rgba(255,255,255,.85)', fontSize: 13, fontWeight: tab === x.k ? '800' : '700' }}>{x.n}</Text></View>
          </Pressable>
        ))}
      </View>
      <View style={{ marginTop: 12 }}><SearchField value={q} onChangeText={setQ} placeholder={'Search ' + info.n.toLowerCase()} /></View>
      <Animated.View style={slide}>
      {list.length ? list.map((d) => <Row key={d.id} d={d} onPress={() => setDet(d.id)} />) : (
        <View style={{ marginTop: 28, alignItems: 'center', paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 40 }}>{q.trim() ? '🔍' : typeOf(DOC_TYPES.find((x) => x.tab === tab)!.key).e}</Text>
          <Text style={{ color: W, fontSize: 16, fontWeight: '800', marginTop: 10 }}>{q.trim() ? 'Nothing found' : 'Nothing here yet'}</Text>
          <Text style={{ color: dim, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 }}>{q.trim() ? 'Try another word.' : 'Tap + to add one. You can scan it with the camera.'}</Text>
        </View>
      )}
      </Animated.View>
      {det && !f && docs.find((x) => x.id === det) ? <Detail d={docs.find((x) => x.id === det) as Doc} onEdit={() => { const x = docs.find((y) => y.id === det) as Doc; setDet(0); openEdit(x); }} onClose={() => setDet(0)} /> : null}
      {f ? <Sheet f={f} setF={setF} onSave={save} onDelete={f.id ? del : undefined} onClose={() => setF(null)} /> : null}
    </RecordPage>
  );
}
