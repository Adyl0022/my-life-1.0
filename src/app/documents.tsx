import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KbScroll } from '../components/KbScroll';
import { View, Pressable, Animated, Modal, ScrollView, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '../components/Txt';
import { RecordPage, Intro } from '../components/RecordHubUi';
import { DocArt } from '../components/DocArt';
import { SearchField } from '../components/Shine';
import { Inp, DateField, W } from '../components/Ui';
import { PrivateNote, Sections, Lab } from '../components/ColUi';
import { useStored } from '../lib/store';
import { confirmDelete } from '../lib/dialog';
import { tryForm } from '../lib/num';
import { takePhoto } from '../lib/photo';
import { LineIcon } from '../components/LineIcon';
import { Toggle } from '../components/Toggle';
import { CopyRow, ShareSheet, exportPdf } from '../components/DocShare';
import { RenewGuideSheet } from '../components/RenewGuideSheet';
import { useDocLock, setDocLock, askUnlock } from '../lib/docLock';
import * as Haptics from 'expo-haptics';
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
          <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: (s.hot ? '#ff6b81' : t.c) + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: (s.hot ? '#ff6b81' : t.c) + '88' }}><LineIcon name={t.key} c={s.hot ? '#ff8a9b' : t.c} size={24} /></View>
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

function Detail({ d, onEdit, onClose, onRemind }: { d: Doc; onEdit: () => void; onClose: () => void; onRemind: (r: Remind) => void }) {
  const t = typeOf(d.type), s = statusOf(d); const [big, setBig] = useState(false); const [bi, setBi] = useState(0); const [rn, setRn] = useState(false); const [sh, setSh] = useState(false); const [pm, setPm] = useState('');
  const pages = [d.photo, ...(d.photos || [])].filter(Boolean) as string[];
  const sug = d.type === 'passport' ? '6m' : d.type === 'bank' || d.type === 'warranty' || d.type === 'insurance' ? '1m' : '3m'; const sugN = (REMINDS.find((x) => x.k === sug) as any).n;
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
            <Pressable onPress={() => { setBi(0); setBig(true); }} accessibilityLabel="View photo" style={{ marginTop: 20 }}>
              <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.06)' }}>
                <Image source={{ uri: d.photo }} style={{ width: '100%', aspectRatio: 1.58 }} resizeMode="contain" />
              </View>
              <Text style={{ color: dim, fontSize: 11.5, textAlign: 'center', marginTop: 8 }}>Tap the photo to see it full screen</Text>
            </Pressable>
          ) : (
            <Pressable onPress={onEdit} style={{ marginTop: 20, height: 150, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.3)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.05)' }}>
              <LineIcon name="photo" c="rgba(255,255,255,.8)" size={32} /><Text style={{ color: W, fontSize: 14, fontWeight: '700', marginTop: 8 }}>No photo yet</Text><Text style={{ color: dim, fontSize: 12, marginTop: 2 }}>Tap to add one</Text>
            </Pressable>
          )}
          <View style={{ marginTop: 18, borderRadius: 20, borderWidth: 1, borderColor: s.hot ? 'rgba(255,107,129,.5)' : 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.06)', paddingHorizontal: 16, paddingVertical: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 13 }}><Text style={{ color: dim, fontSize: 13 }}>Status</Text><Text style={{ color: s.col, fontSize: 14, fontWeight: '800' }}>{s.txt}</Text></View>
            {d.number ? line('Number', d.number) : null}
            {d.expiry ? line(d.type === 'warranty' ? 'Warranty ends' : 'Expires', d.expiry.split('-').reverse().join('/')) : line('Expiry', 'No expiry')}
            {d.expiry ? line('Reminder', rem && rem.k !== 'off' ? rem.n : 'None') : null}
            {d.note ? line('Note', d.note) : null}
          </View>
          {pages.length > 1 ? (
            <View style={{ marginTop: 14 }}>
              <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 }}>PAGES · {pages.length}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9 }}>
                {pages.map((u, k) => (<Pressable key={k} onPress={() => { setBi(k); setBig(true); }} accessibilityLabel={'Page ' + (k + 1)}><Image source={{ uri: u }} style={{ width: 64, height: 84, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)' }} /></Pressable>))}
              </ScrollView>
            </View>
          ) : null}
          <CopyRow number={d.number} name={d.title} />
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); setRn(true); }} accessibilityLabel="How to renew" style={({ pressed }) => ({ marginTop: 16, transform: [{ scale: pressed ? 0.985 : 1 }], borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' })}>
            <LinearGradient colors={['rgba(124,156,255,.4)', 'rgba(183,148,255,.3)', 'rgba(255,180,94,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)' }}><LineIcon name="repeat" c="#fff" size={20} w={1.7} /></View>
              <View style={{ flex: 1 }}><Text style={{ color: '#fff', fontSize: 14.5, fontWeight: '800' }}>How to renew</Text><Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, marginTop: 2 }}>Steps and what to bring</Text></View>
              <Text style={{ color: '#fff', fontSize: 22 }}>›</Text>
            </LinearGradient>
          </Pressable>
          {pages.length ? (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable onPress={() => setSh(true)} accessibilityLabel="Share with a note" style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}><View style={{ height: 46, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>Share with a note</Text></View></Pressable>
              {pages.length > 1 ? <Pressable onPress={async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); setPm('Making the PDF…'); const r = await exportPdf(pages, d.title); setPm(r === 'ok' ? '' : r === 'web' ? 'Making a PDF works in the Android app.' : 'Could not make the PDF. Please try again.'); }} accessibilityLabel="Export as one PDF" style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}><View style={{ height: 46, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>Export as one PDF</Text></View></Pressable> : null}
            </View>
          ) : null}
          {pm ? <Text style={{ color: '#ffd593', fontSize: 12.5, fontWeight: '700', marginTop: 10 }}>{pm}</Text> : null}
          <Text style={{ color: dim, fontSize: 11.5, marginTop: 8, lineHeight: 16 }}>Pictures stay on this phone only. Sharing and the PDF are made on the phone and nothing is uploaded.</Text>
          <Pressable onPress={onEdit} accessibilityLabel="Edit document" style={{ marginTop: 20 }}><LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 16, fontWeight: '800' }}>Edit</Text></LinearGradient></Pressable>
        </ScrollView>
        {big && pages[bi] ? (
          <Modal transparent statusBarTranslucent animationType="fade" onRequestClose={() => setBig(false)}>
            <Pressable onPress={() => setBig(false)} style={{ flex: 1, backgroundColor: 'rgba(5,8,25,.94)', padding: 16, justifyContent: 'center' }}><Image source={{ uri: pages[bi] }} style={{ width: '100%', height: '85%' }} resizeMode="contain" /></Pressable>
          </Modal>
        ) : null}
        {rn ? <RenewGuideSheet type={d.type} title={d.title} onClose={() => setRn(false)} suggestLabel={d.expiry && d.remind !== sug ? 'Set my reminder for ' + sugN : undefined} onRemind={() => { onRemind(sug as Remind); setRn(false); }} /> : null}
        {sh && pages.length ? <ShareSheet pages={pages} title={d.title} onClose={() => setSh(false)} /> : null}
      </View>
    </Modal>
  );
}

type Form = { id: number; type: string; title: string; number: string; expiry: string; noExp: boolean; remind: Remind; photo: string; photos: string[]; note: string };
const blank = (type: string): Form => ({ id: 0, type, title: '', number: '', expiry: ymd(new Date(Date.now() + 365 * 86400000)), noExp: false, remind: '3m', photo: '', photos: [], note: '' });

function Sheet({ f, setF, onSave, onDelete, onClose }: { f: Form; setF: (x: Form) => void; onSave: () => void; onDelete?: () => void; onClose: () => void }) {
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false); const [view, setView] = useState(false); const [tried, setTried] = useState(false); const [pg, setPg] = useState(-1); const [pmsg, setPmsg] = useState('');
  const set = (p: Partial<Form>) => setF({ ...f, ...p });
  const t = typeOf(f.type);
  const [tab0] = useState(typeOf(f.type).tab);
  const allowed = DOC_TYPES.filter((x) => x.tab === tab0);
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
        const g0 = text && fresh ? guessType(text) : null; const g = g0 && allowed.some((a) => a.key === g0.type) ? g0 : null; const pre = g0 && !g ? 'This looks like a ' + typeOf(g0.type).label.toLowerCase() + ', which belongs in the ' + (TABS.find((x) => x.k === typeOf(g0.type).tab)?.n || 'other') + ' tab. ' : ''; const ty = g ? g.type : f.type;
        const r = text ? (readText(ty, text) || (ty !== f.type ? readText(f.type, text) : null)) : null; const base = { ...f, type: ty, photo: uri };
        if (text == null) { setF(base); setMsg(Platform.OS === 'web' ? 'Scanning works in the Android app. You can still type the details in.' : 'Scanning is not ready on this phone. You can still type the details in.'); }
        else if (!r) { setF(base); setMsg(pre + (g && g.type !== f.type ? 'Looks like a ' + typeOf(g.type).label.toLowerCase() + ', but no details could be read. ' : '') + 'Could not read this photo. Try again in good light, hold the camera steady, or type it in.'); }
        else { setF(fill(base, r)); const sw = g && g.type !== f.type ? 'Looks like a ' + typeOf(g.type).label.toLowerCase() + (g.sure ? '. ' : ', but I am not sure. Change the type above if it is wrong. ') : ''; setMsg(pre + sw + (r.sure ? '✓ The two code lines matched. Please still check each box.' : 'Read some details from the photo. Please check each box before you save.')); }
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
        <KbScroll contentContainerStyle={{ padding: 20, paddingTop: 52, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={onClose} accessibilityLabel="Close"><View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></View></Pressable>
              <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 22, fontWeight: '800' }}>{f.id ? 'Edit document' : 'Add document'}</Text><Text style={{ color: dim, fontSize: 12 }}>Scan it or type it in</Text></View>
            </View>
            <PrivateNote />
            <Sections>
            <Lab t={'TYPE'} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {allowed.map((x) => (
                <Pressable key={x.key} onPress={() => set({ type: x.key })} style={{ flexGrow: 1, flexBasis: '30%' }} accessibilityLabel={x.label}>
                  <View style={{ ...chip(f.type === x.key, x.c), paddingVertical: 12 }}><LineIcon name={x.key} c={f.type === x.key ? x.c : '#e8e8f6'} size={26} /><Text numberOfLines={1} style={{ color: W, fontSize: 11, fontWeight: '700', marginTop: 6 }}>{x.label}</Text></View>
                </Pressable>
              ))}
            </View>
            <Lab t={'FILL IT IN FOR YOU'} />
            <Pressable onPress={() => pick(true)} disabled={busy}><LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>{busy ? null : <LineIcon name="camera" c="#fff" size={22} w={1.7} />}<Text style={{ color: W, fontSize: 16, fontWeight: '800' }}>{busy ? 'Reading…' : 'Scan with camera'}</Text></View></LinearGradient></Pressable>
            <Pressable onPress={() => pick(false)} disabled={busy} style={{ marginTop: 10, height: 46, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><LineIcon name="photo" c="#fff" size={22} /><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>Choose a photo</Text></View></Pressable>
            {msg ? <Text style={{ color: msg.startsWith('✓') ? '#5ee7b5' : '#ffd593', fontSize: 12.5, fontWeight: '700', marginTop: 10, lineHeight: 18 }}>{msg}</Text> : null}
            <Text style={{ color: dim, fontSize: 11.5, marginTop: 8, lineHeight: 16 }}>The words are read on this phone. The photo is not sent anywhere and is not backed up online. Only the details are.</Text>
            {f.photo ? (
              <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable onPress={() => setView(true)}><Image source={{ uri: f.photo }} style={{ width: 96, height: 64, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.1)' }} resizeMode="cover" /></Pressable>
                <Pressable onPress={() => confirmDelete('this photo', () => set({ photo: '' }), { title: 'Remove this photo?', yes: 'Remove' })} accessibilityLabel="Remove photo"><View style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.1)' }}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>Remove photo</Text></View></Pressable>
              </View>
            ) : null}
            {f.photo ? (
              <>
                <Lab t="MORE PAGES (OPTIONAL)" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9 }}>
                  {f.photos.map((u, k) => (<Pressable key={k} onPress={() => setPg(pg === k ? -1 : k)} accessibilityLabel={'Page ' + (k + 2)}><Image source={{ uri: u }} style={{ width: 64, height: 84, borderRadius: 10, borderWidth: 2, borderColor: pg === k ? '#8ea8ff' : 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)' }} /></Pressable>))}
                </ScrollView>
                {pg >= 0 && f.photos[pg] ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    {[['‹ Earlier', -1], ['Later ›', 1]].map(([n, dd]) => (<Pressable key={n as string} onPress={() => { const j = pg + (dd as number); if (j < 0 || j >= f.photos.length) return; const a = f.photos.slice(); [a[pg], a[j]] = [a[j], a[pg]]; set({ photos: a }); setPg(j); }} style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.96 : 1 }] })}><View style={{ height: 38, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{n as string}</Text></View></Pressable>))}
                    <Pressable onPress={() => confirmDelete('this page', () => { set({ photos: f.photos.filter((_, k) => k !== pg) }); setPg(-1); }, { title: 'Remove this page?', yes: 'Remove' })} accessibilityLabel="Remove page" style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.96 : 1 }] })}><View style={{ height: 38, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,107,129,.5)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ff9aa9', fontSize: 12.5, fontWeight: '700' }}>Remove</Text></View></Pressable>
                  </View>
                ) : null}
                {f.photos.length < 9 ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    {[['Add page: camera', true], ['Add page: gallery', false]].map(([n, cam]) => (<Pressable key={n as string} onPress={async () => { setPmsg(''); try { const u = await takePhoto(cam as boolean); if (u) set({ photos: [...f.photos, u] }); } catch (e: any) { setPmsg(e && e.message === 'camera' ? 'Camera access is off. Allow it in Settings, or choose a photo instead.' : 'Could not open the photo. Please try again.'); } }} style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.96 : 1 }] })}><View style={{ height: 40, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{n as string}</Text></View></Pressable>))}
                  </View>
                ) : <Text style={{ color: dim, fontSize: 11.5, marginTop: 8 }}>That is the most pages for one paper (10).</Text>}
                {pmsg ? <Text style={{ color: '#ffd593', fontSize: 12.5, fontWeight: '700', marginTop: 8 }}>{pmsg}</Text> : null}
                <Text style={{ color: dim, fontSize: 11.5, marginTop: 8, lineHeight: 16 }}>For papers with more than one side or page. Only the first page is read for details. All pages stay on this phone only.</Text>
              </>
            ) : null}
            <Lab t={'DETAILS'} />
            <Inp value={f.title} onChangeText={(x: string) => set({ title: x })} placeholder={t.label + ' name, e.g. ' + (f.type === 'passport' ? 'My passport' : f.type === 'bank' ? 'Maybank Visa' : f.type === 'warranty' ? 'Samsung TV' : 'My ' + t.label.toLowerCase())} maxLength={60} />
            {(tried || false) && !f.title.trim() ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please enter a name.</Text> : null}
            <Inp style={{ marginTop: 9 }} value={f.number} onChangeText={(x: string) => set({ number: x })} placeholder={f.type === 'bank' ? 'Card number (optional, you can leave it empty)' : 'Number (optional)'} maxLength={40} autoCapitalize="characters" />
            <Lab t={f.type === 'warranty' ? 'WARRANTY ENDS' : 'EXPIRY DATE'} />
            <Pressable onPress={() => set({ noExp: !f.noExp })} accessibilityLabel="No expiry" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: f.noExp ? '#8fe9e2' : 'rgba(255,255,255,.4)', backgroundColor: f.noExp ? 'rgba(143,233,226,.35)' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{f.noExp ? <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>✓</Text> : null}</View>
              <Text style={{ color: W, fontSize: 14, fontWeight: '600' }}>No expiry</Text>
            </Pressable>
            {!f.noExp ? <DateField value={f.expiry} onChange={(x: string) => set({ expiry: x })} /> : null}
            {tried && badDate ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please pick a valid date.</Text> : null}
            <Lab t={'REMIND ME BEFORE'} />
            <View style={{ flexDirection: 'row', gap: 6, opacity: f.noExp ? 0.4 : 1 }}>
              {REMINDS.map((x) => (<Pressable key={x.k} disabled={f.noExp} onPress={() => set({ remind: x.k })} style={{ flex: 1 }}><View style={{ ...chip(f.remind === x.k && !f.noExp, '#8fe9e2'), paddingHorizontal: 2 }}><Text numberOfLines={1} style={{ color: W, fontSize: 11.5, fontWeight: '700', textAlign: 'center' }}>{x.n}</Text></View></Pressable>))}
            </View>
            {f.noExp ? <Text style={{ color: dim, fontSize: 11.5, marginTop: 6 }}>No reminder is needed when there is no expiry.</Text> : null}
            </Sections>
            <Pressable onPress={save} style={{ marginTop: 26 }} accessibilityLabel="Save document"><LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 16, fontWeight: '800' }}>Save</Text></LinearGradient></Pressable>
            {onDelete ? <Pressable onPress={onDelete} style={{ marginTop: 12, height: 46, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,107,129,.5)', alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Delete document"><Text style={{ color: '#ff9aa9', fontSize: 14, fontWeight: '700' }}>Delete document</Text></Pressable> : null}
        </KbScroll>
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
  const lk = useDocLock(); const [lmsg, setLmsg] = useState('');
  useEffect(() => { if (lk.loaded && lk.locked) askUnlock(); }, [lk.loaded, lk.locked]);
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
  const openEdit = (d: Doc) => setF({ id: d.id, type: d.type, title: d.title, number: d.number || '', expiry: d.expiry || ymd(new Date(Date.now() + 365 * 86400000)), noExp: !d.expiry, remind: d.remind, photo: d.photo || '', photos: d.photos || [], note: d.note || '' });
  const save = () => {
    if (!f) return;
    const doc: Doc = { id: f.id || (st && st.next) || 1, type: f.type, title: f.title.trim(), number: f.number.trim() || undefined, expiry: f.noExp ? undefined : f.expiry, remind: f.noExp ? 'off' : f.remind, photo: f.photo || undefined, photos: f.photos.length ? f.photos : undefined, note: f.note || undefined };
    const next = f.id ? docs.map((d) => (d.id === f.id ? doc : d)) : [doc, ...docs];
    setSt({ docs: next, next: Math.max((st && st.next) || 1, doc.id + 1) });
    setTab(typeOf(f.type).tab); setF(null);
  };
  const del = () => { if (!f || !f.id) return; confirmDelete('this document', () => { setSt({ ...st, docs: docs.filter((d) => d.id !== f.id) }); setF(null); }, { title: 'Delete this document?', message: 'The details and the photo on this phone will be removed. This cannot be undone.' }); };
  const plus = (
    <Pressable onPress={openNew} accessibilityLabel="Add document"><LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 26, fontWeight: '300', marginTop: -2 }}>+</Text></LinearGradient></Pressable>
  );
  if (lk.locked) {
    return (
      <RecordPage title="Documents" sub="Locked" bg={<DocArt />}>
        <View style={{ marginTop: 26, padding: 26, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.06)', alignItems: 'center' }}>
          <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', alignItems: 'center', justifyContent: 'center' }}><LineIcon name="idother" c="#fff" size={34} w={1.6} /></View>
          <Text style={{ color: W, fontSize: 17, fontWeight: '800', marginTop: 14 }}>Documents are locked</Text>
          <Text style={{ color: dim, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 }}>Use your fingerprint, face or phone lock to open them.</Text>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); askUnlock(); }} accessibilityLabel="Unlock Documents" style={({ pressed }) => ({ marginTop: 18, alignSelf: 'stretch', transform: [{ scale: pressed ? 0.97 : 1 }] })}>
            <LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#1a1030', fontSize: 15, fontWeight: '800' }}>Unlock</Text></LinearGradient>
          </Pressable>
        </View>
      </RecordPage>
    );
  }
  const soon = docs.filter((d) => d.expiry && validDate(d.expiry)).map((d) => ({ d, s: statusOf(d) })).filter((x) => x.s.n != null && (x.s.n as number) <= 180 && (x.s.n as number) >= -90).sort((a, b) => (a.s.n as number) - (b.s.n as number)).slice(0, 3);
  return (
    <RecordPage title="Documents" sub={docs.length + ' saved'} right={plus} bg={<DocArt />}>
      <Animated.View style={slide}><Intro title={info.title} text={info.text} colors={['rgba(142,168,255,.5)', 'rgba(183,148,255,.4)']} /></Animated.View>
      {soon.length ? (
        <View style={{ marginTop: 12, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: soon[0].s.hot ? 'rgba(255,107,129,.55)' : 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.06)' }}>
          <Text style={{ color: soon[0].s.hot ? '#ffb3c6' : '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginBottom: 4 }}>RENEWING SOON</Text>
          {soon.map(({ d, s: st2 }, k) => (
            <Pressable key={d.id} onPress={() => setDet(d.id)} accessibilityLabel={'Open ' + d.title} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: k ? 1 : 0, borderTopColor: 'rgba(255,255,255,.1)', opacity: pressed ? 0.7 : 1 })}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: typeOf(d.type).c + '22', borderWidth: 1, borderColor: typeOf(d.type).c + '66', alignItems: 'center', justifyContent: 'center' }}><LineIcon name={d.type} c={typeOf(d.type).c} size={22} /></View>
              <View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} style={{ color: W, fontSize: 14.5, fontWeight: '800' }}>{d.title}</Text><Text numberOfLines={1} style={{ color: dim, fontSize: 12, marginTop: 1 }}>{TABS.find((x) => x.k === typeOf(d.type).tab)!.n} · {d.type === 'warranty' ? 'ends ' : 'ends '}{(d.expiry as string).split('-').reverse().join('/')}</Text></View>
              <View style={{ paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999, backgroundColor: st2.col + '33' }}><Text style={{ color: st2.col, fontSize: 11, fontWeight: '800' }}>{(st2.n as number) < 0 ? 'Expired' : st2.n === 0 ? 'Today' : st2.n + (st2.n === 1 ? ' day' : ' days')}</Text></View>
            </Pressable>
          ))}
          <Text style={{ color: dim, fontSize: 11.5, marginTop: 4 }}>Tap one to see what to do next.</Text>
        </View>
      ) : null}
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
          <LineIcon name={q.trim() ? 'search' : DOC_TYPES.find((x) => x.tab === tab)!.key} c="rgba(255,255,255,.85)" size={44} w={1.4} />
          <Text style={{ color: W, fontSize: 16, fontWeight: '800', marginTop: 10 }}>{q.trim() ? 'Nothing found' : 'Nothing here yet'}</Text>
          <Text style={{ color: dim, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 }}>{q.trim() ? 'Try another word.' : 'Tap + to add one. You can scan it with the camera.'}</Text>
        </View>
      )}
      </Animated.View>
      <View style={{ marginTop: 18, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', backgroundColor: 'rgba(255,255,255,.045)' }}>
        <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10 }}>LOCK (YOUR CHOICE)</Text>
        <Pressable onPress={async () => { setLmsg(''); const ok = await setDocLock(!lk.on); if (!ok && !lk.on) setLmsg('Set a fingerprint, face or screen lock on your phone first, then try again.'); }} accessibilityLabel="Lock Documents" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14.5, fontWeight: '800' }}>Lock Documents</Text><Text style={{ color: dim, fontSize: 12, marginTop: 2, lineHeight: 17 }}>Ask for your fingerprint, face or phone lock each time you open them.</Text></View>
          <Toggle on={lk.on} colors={['#7c9cff', '#b794ff']} />
        </Pressable>
        {lmsg ? <Text style={{ color: '#ffd593', fontSize: 12.5, fontWeight: '700', marginTop: 8 }}>{lmsg}</Text> : null}
        <Text style={{ color: dim, fontSize: 11.5, marginTop: 8, lineHeight: 16 }}>This uses your phone's own lock and stays on this phone only. It does not change your account.</Text>
      </View>
      {det && !f && docs.find((x) => x.id === det) ? <Detail d={docs.find((x) => x.id === det) as Doc} onEdit={() => { const x = docs.find((y) => y.id === det) as Doc; setDet(0); openEdit(x); }} onClose={() => setDet(0)} onRemind={(r) => setSt({ ...st, docs: docs.map((x) => (x.id === det ? { ...x, remind: r } : x)) })} /> : null}
      {f ? <Sheet f={f} setF={setF} onSave={save} onDelete={f.id ? del : undefined} onClose={() => setF(null)} /> : null}
    </RecordPage>
  );
}
