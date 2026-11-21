import React, { useMemo, useState } from 'react';
import { View, Modal, ScrollView, Image, ActivityIndicator, Platform, Alert } from 'react-native';
import { Pressable } from './Press';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './Txt';
import { SearchField } from './Shine';
import { Inp, W } from './Ui';
import { EqPills } from './TabSlide';
import { exportPdf } from './DocShare';
import { useStored } from '../lib/store';
import { confirmDelete } from '../lib/dialog';
import { scanPages, pickPages, keepScan, dropScanFiles, picSize, SCAN_Q, type ScanQ } from '../lib/photo';
import * as Haptics from '../lib/haptics';

export type Scan = { id: number; title: string; pages: string[]; at: number; q: ScanQ };
export type ScanStore = { scans: Scan[]; next: number };
const EMPTY: ScanStore = { scans: [], next: 1 };
const dim = 'rgba(255,255,255,.62)';
const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dstr = (t: number) => { const d = new Date(t); return d.getDate() + ' ' + MN[d.getMonth()] + ' ' + d.getFullYear(); };
const stroke = { stroke: '#fff', strokeWidth: 1.9, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const BOX = { marginTop: 12, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.06)' } as const;
const LAB = { color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 } as const;

const ScanIcon = ({ s = 22 }: { s?: number }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24"><Path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" {...stroke} /><Rect x="8" y="7" width="8" height="10" rx="1.2" {...stroke} /><Path d="M10 11h4M10 14h3" {...stroke} /></Svg>
);
function Btn({ label, onPress, main, danger, disabled, flex }: { label: string; onPress: () => void; main?: boolean; danger?: boolean; disabled?: boolean; flex?: boolean }) {
  const inner = <Text style={{ color: main ? '#1a1030' : danger ? '#ffb3c6' : W, fontSize: 13.5, fontWeight: '800' }}>{label}</Text>;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={label} style={({ pressed }) => ({ flex: flex ? 1 : undefined, opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      {main ? <LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>{inner}</LinearGradient>
        : <View style={{ height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: danger ? 'rgba(255,107,129,.55)' : 'rgba(255,255,255,.25)', backgroundColor: danger ? 'rgba(255,107,129,.12)' : 'rgba(255,255,255,.08)' }}>{inner}</View>}
    </Pressable>
  );
}
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#1b0f26' }}>
        <LinearGradient colors={['#1b0f26', '#2c1340', '#10244a']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6 }}>
            <Pressable onPress={onClose} accessibilityLabel="Close"><View style={{ width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' }}><Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M15 5l-7 7 7 7" {...stroke} /></Svg></View></Pressable>
            <Text numberOfLines={1} style={{ flex: 1, color: W, fontSize: 19, fontWeight: '800' }}>{title}</Text>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
function Thumb({ uri, w, h, n, on, onPress }: { uri: string; w: number; h: number; n?: number; on?: boolean; onPress?: () => void }) {
  const body = (
    <View style={{ width: w, height: h, borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff', borderWidth: on ? 2.5 : 1, borderColor: on ? '#b794ff' : 'rgba(255,255,255,.3)' }}>
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      {n ? <View style={{ position: 'absolute', right: 4, bottom: 4, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, backgroundColor: 'rgba(0,0,0,.6)' }}><Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '800' }}>{n}</Text></View> : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

// Scans: kept apart from the papers of Documents. A paper here is just pages with a name, made into one PDF.
export function DocScans() {
  const [st, setSt] = useStored<ScanStore>('ml_scans', EMPTY);
  const [qk, setQk] = useStored<ScanQ>('ml_scan_q', 'hd');
  const [q, setQ] = useState(''); const [busy, setBusy] = useState(''); const [msg, setMsg] = useState('');
  const [draft, setDraft] = useState<{ uris: string[]; title: string } | null>(null);
  const [big, setBig] = useState(0); const [look, setLook] = useState('');
  React.useEffect(() => { let on = true; setBig(0); if (draft && draft.uris.length) Promise.all(draft.uris.slice(0, 8).map((u) => picSize(u))).then((r) => { if (on) setBig(Math.max(0, ...r.map((x) => (x ? Math.max(x.w, x.h) : 0)))); }); return () => { on = false; }; }, [draft ? draft.uris.join('|') : '']);
  const [open, setOpen] = useState(0); const [sel, setSel] = useState(0); const [ask, setAsk] = useState<{ s: Scan; name: string } | null>(null);
  const scans = (st && st.scans) || [];
  const qi = Math.max(0, SCAN_Q.findIndex((x) => x.k === qk));
  const cur = scans.find((s) => s.id === open) || null;
  const list = useMemo(() => { const n = q.trim().toLowerCase(); return scans.filter((s) => !n || s.title.toLowerCase().includes(n)).sort((a, b) => b.at - a.at); }, [scans, q]);
  const update = (id: number, f: (s: Scan) => Scan) => setSt({ ...st, scans: scans.map((s) => (s.id === id ? f(s) : s)) });
  const defTitle = () => 'Scan ' + dstr(Date.now());

  // "From gallery": on Android the Google scanner opens with a gallery button, so the photos can be cropped and cleaned with filters first.
  // "Add as they are" keeps the photos exactly as taken.
  const fromGallery = (addTo = 0) => {
    if (Platform.OS !== 'android') { get('gallery', addTo); return; }
    Alert.alert('Photos from your gallery', 'The scanner opens next. Tap its gallery button to choose your photos, then crop them and pick a filter (Auto clean, Colour, Grey or Black and white).', [
      { text: 'Open scanner', onPress: () => get('scan', addTo) },
      { text: 'Add as they are', onPress: () => get('gallery', addTo) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
  const get = async (how: 'scan' | 'gallery', addTo = 0) => {
    setMsg('');
    try {
      const uris = how === 'scan' ? await scanPages(30) : await pickPages();
      if (!uris.length) return;
      if (addTo) {
        setBusy('Making ' + uris.length + (uris.length === 1 ? ' page' : ' pages') + ' sharp…');
        const k = scans.find((s) => s.id === addTo); const out: string[] = [];
        for (const u of uris) out.push(await keepScan(u, (k && k.q) || qk));
        update(addTo, (s) => ({ ...s, pages: s.pages.concat(out) }));
        setBusy(''); return;
      }
      setDraft({ uris, title: defTitle() });
    } catch (e: any) { setBusy(''); setMsg(e && e.message === 'camera' ? 'Camera access is off. Allow it in Settings to scan, or choose pictures from the gallery.' : 'Could not scan. Please try again.'); }
  };
  const saveDraft = async () => {
    if (!draft) return;
    const title = draft.title.trim() || defTitle();
    setBusy('Making ' + draft.uris.length + (draft.uris.length === 1 ? ' page' : ' pages') + ' sharp…');
    const pages: string[] = [];
    for (const u of draft.uris) pages.push(await keepScan(u, qk));
    const sc: Scan = { id: (st && st.next) || 1, title, pages, at: Date.now(), q: qk };
    setSt({ scans: [sc, ...scans], next: sc.id + 1 });
    setBusy(''); setDraft(null);
  };
  // The file name the person chose: letters, numbers, spaces and a few marks only, so every phone and app accepts it.
  const clean = (n: string) => n.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').replace(/\.pdf$/i, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const doPdf = async (s: Scan, name: string) => {
    setMsg(''); setBusy('Making the PDF…');
    const nm = clean(name);
    const r = await exportPdf(s.pages, s.title, nm || 'Document-scan-my-life-export', !!nm);
    setBusy('');
    if (r === 'web') setMsg('Making a PDF works in the Android app.'); else if (r === 'fail') setMsg('Could not make the PDF. Try fewer pages or a lower quality.');
  };
  const delScan = (s: Scan) => confirmDelete('this scan', async () => { await dropScanFiles(s.pages); setSt({ ...st, scans: scans.filter((x) => x.id !== s.id) }); setOpen(0); }, { title: 'Delete this scan?', message: 'All its pages on this phone will be removed. This cannot be undone.' });
  const move = (s: Scan, d: number) => { const i = sel + d; if (i < 0 || i >= s.pages.length) return; const p = s.pages.slice(); const t = p[sel]; p[sel] = p[i]; p[i] = t; update(s.id, (x) => ({ ...x, pages: p })); setSel(i); };
  const turn = async (s: Scan) => {
    setBusy('Turning the page…'); const old = s.pages[sel];
    const nu = await keepScan(old, s.q || qk, 90);
    if (nu !== old) { await dropScanFiles([old]); update(s.id, (x) => ({ ...x, pages: x.pages.map((p, i) => (i === sel ? nu : p)) })); }
    setBusy('');
  };
  const delPage = (s: Scan) => {
    if (s.pages.length < 2) { delScan(s); return; }
    confirmDelete('this page', async () => { const g = s.pages[sel]; await dropScanFiles([g]); update(s.id, (x) => ({ ...x, pages: x.pages.filter((_, i) => i !== sel) })); setSel(Math.max(0, sel - 1)); }, { title: 'Delete this page?', message: 'The page will be removed from this scan. This cannot be undone.' });
  };

  return (
    <View>
      <View style={{ ...BOX, marginTop: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}><ScanIcon s={26} /></LinearGradient>
          <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 17, fontWeight: '800' }}>Scan to PDF</Text><Text style={{ color: dim, fontSize: 12.5, lineHeight: 18, marginTop: 2 }}>Any paper: a letter, a certificate, a receipt. Clean white pages, many pages in one PDF.</Text></View>
        </View>
        <Text style={{ ...LAB, marginTop: 14, marginBottom: 8 }}>QUALITY</Text>
        <EqPills tabs={SCAN_Q.map((x) => x.n)} index={qi} onChange={(i) => setQk(SCAN_Q[i].k)} colors={['#7c9cff', '#b794ff']} fontSize={12.5} />
        <Text style={{ color: dim, fontSize: 11.5, marginTop: 6 }}>{SCAN_Q[qi].note + '. The long side of each page is ' + SCAN_Q[qi].px + ' pixels' + (SCAN_Q[qi].k === 'hd' ? ' (2K).' : '.')}</Text>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <Btn main flex label="Scan pages" onPress={() => get('scan')} />
          <Btn flex label="From gallery" onPress={() => fromGallery()} />
        </View>
        <Text style={{ color: dim, fontSize: 11.5, lineHeight: 16, marginTop: 10 }}>The scanner finds the edges, straightens the page and lets you pick Auto clean, Colour, Grey or Black and white before you keep it.</Text>
        {msg ? <Text style={{ color: '#ffd593', fontSize: 12.5, fontWeight: '700', marginTop: 8 }}>{msg}</Text> : null}
      </View>
      <View style={{ marginTop: 10, gap: 4, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(143,233,226,.08)', borderWidth: 1, borderColor: 'rgba(143,233,226,.3)' }}>
        <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>THIS PHONE ONLY</Text>
        <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 11.5, lineHeight: 16 }}>Scans are kept on this phone only. They are not synced or uploaded. Share the PDF yourself when you need it.</Text>
      </View>
      {scans.length > 3 ? <View style={{ marginTop: 12 }}><SearchField value={q} onChangeText={setQ} placeholder="Search scans" /></View> : null}
      {list.length ? list.map((s) => (
        <Pressable key={s.id} onPress={() => { setSel(0); setOpen(s.id); }} accessibilityLabel={'Open ' + s.title} style={({ pressed }) => ({ marginTop: 10, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.07)' }}>
            <Thumb uri={s.pages[0]} w={52} h={68} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: '#8fe9e2', fontSize: 9.5, fontWeight: '800', letterSpacing: 1.1 }}>SCAN</Text>
              <Text numberOfLines={1} style={{ color: W, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{s.title}</Text>
              <Text numberOfLines={1} style={{ color: dim, fontSize: 12.5, marginTop: 2 }}>{s.pages.length + (s.pages.length === 1 ? ' page' : ' pages') + ' · ' + dstr(s.at)}</Text>
            </View>
            <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M9 5l7 7-7 7" {...stroke} /></Svg>
          </View>
        </Pressable>
      )) : (
        <View style={{ marginTop: 26, alignItems: 'center', paddingHorizontal: 20 }}>
          <ScanIcon s={44} />
          <Text style={{ color: W, fontSize: 16, fontWeight: '800', marginTop: 10 }}>{q.trim() ? 'Nothing found' : 'No scans yet'}</Text>
          <Text style={{ color: dim, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 }}>{q.trim() ? 'Try another word.' : 'Tap Scan pages to make your first PDF.'}</Text>
        </View>
      )}

      {draft ? (
        <Sheet title="Save this scan" onClose={() => (busy ? null : setDraft(null))}>
          <View style={BOX}>
            <Text style={LAB}>NAME</Text>
            <Inp style={{ marginTop: 8 }} value={draft.title} onChangeText={(x: string) => setDraft({ ...draft, title: x })} placeholder="e.g. Graduation letter" maxLength={60} />
            <Text style={{ ...LAB, marginTop: 16 }}>{draft.uris.length + (draft.uris.length === 1 ? ' PAGE' : ' PAGES')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8 }}>{draft.uris.map((u, i) => <Thumb key={u + i} uri={u} w={72} h={96} n={i + 1} onPress={() => setLook(u)} />)}</ScrollView>
            <Text style={{ ...LAB, marginTop: 16, marginBottom: 8 }}>QUALITY</Text>
            <EqPills tabs={SCAN_Q.map((x) => x.n)} index={qi} onChange={(i) => setQk(SCAN_Q[i].k)} colors={['#7c9cff', '#b794ff']} fontSize={12.5} />
            <Text style={{ color: dim, fontSize: 11.5, marginTop: 6 }}>{SCAN_Q[qi].note + '. The long side of each page is ' + SCAN_Q[qi].px + ' pixels.'}</Text>
            {big > 0 ? <Text style={{ color: dim, fontSize: 11.5, marginTop: 4 }}>{big <= SCAN_Q[qi].px ? 'Your photo is ' + big + ' pixels on its long side, already at or below this quality, so it stays as it is. Quality only shrinks bigger photos.' : 'Your photo is ' + big + ' pixels on its long side. It will be shrunk to ' + SCAN_Q[qi].px + '.'}</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Btn flex label="Cancel" disabled={!!busy} onPress={() => confirmDelete('these pages', () => { setDraft(null); }, { title: 'Discard these pages?', message: 'The scanned pages that are not saved will be removed.', yes: 'Discard' })} />
            <Btn main flex label="Save scan" disabled={!!busy} onPress={saveDraft} />
          </View>
        </Sheet>
      ) : null}

      {cur ? (
        <Sheet title={cur.title} onClose={() => setOpen(0)}>
          <View style={BOX}>
            <Text style={LAB}>NAME</Text>
            <Inp style={{ marginTop: 8 }} value={cur.title} onChangeText={(x: string) => update(cur.id, (s) => ({ ...s, title: x }))} placeholder="Scan name" maxLength={60} />
          </View>
          <View style={BOX}>
            <Text style={LAB}>{cur.pages.length + (cur.pages.length === 1 ? ' PAGE' : ' PAGES')}</Text>
            <View style={{ marginTop: 10, alignItems: 'center' }}><Thumb uri={cur.pages[Math.min(sel, cur.pages.length - 1)]} w={210} h={290} n={Math.min(sel, cur.pages.length - 1) + 1} /></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>{cur.pages.map((u, i) => <Thumb key={u + i} uri={u} w={54} h={72} n={i + 1} on={i === sel} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); setSel(i); }} />)}</ScrollView>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Btn flex label="Earlier" disabled={sel < 1} onPress={() => move(cur, -1)} />
              <Btn flex label="Later" disabled={sel >= cur.pages.length - 1} onPress={() => move(cur, 1)} />
              <Btn flex label="Turn" disabled={Platform.OS === 'web'} onPress={() => turn(cur)} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Btn flex label="Add by scan" onPress={() => get('scan', cur.id)} />
              <Btn flex label="Add from gallery" onPress={() => fromGallery(cur.id)} />
            </View>
            <View style={{ marginTop: 8 }}><Btn danger label="Delete this page" onPress={() => delPage(cur)} /></View>
          </View>
          <View style={{ marginTop: 14 }}><Btn main label="Make PDF and share" disabled={!!busy} onPress={() => setAsk({ s: cur, name: cur.title })} /></View>
          {msg ? <Text style={{ color: '#ffd593', fontSize: 12.5, fontWeight: '700', marginTop: 8 }}>{msg}</Text> : null}
          <View style={{ marginTop: 10 }}><Btn danger label="Delete this scan" onPress={() => delScan(cur)} /></View>
          <Text style={{ color: dim, fontSize: 11.5, lineHeight: 16, marginTop: 12 }}>The PDF is made on your phone with the file name you choose, and shared by you. Nothing is uploaded.</Text>
        </Sheet>
      ) : null}

      {look ? (
        <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => setLook('')}>
          <Pressable onPress={() => setLook('')} style={{ flex: 1, backgroundColor: 'rgba(5,8,25,.94)', padding: 16, justifyContent: 'center' }}>
            <Image source={{ uri: look }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
            <Text style={{ color: dim, fontSize: 12.5, textAlign: 'center', marginTop: 10 }}>Tap anywhere to close</Text>
          </Pressable>
        </Modal>
      ) : null}
      {ask ? (
        <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => setAsk(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.6)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 }}>
            <View style={{ alignSelf: 'stretch', padding: 18, borderRadius: 24, backgroundColor: '#241338', borderWidth: 1, borderColor: 'rgba(255,255,255,.25)' }}>
              <Text style={{ color: W, fontSize: 17, fontWeight: '800' }}>Name the PDF</Text>
              <Text style={{ color: dim, fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>This is the file name people will see when you share it.</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <View style={{ flex: 1 }}><Inp value={ask.name} onChangeText={(x: string) => setAsk({ ...ask, name: x })} placeholder="e.g. Graduation letter" maxLength={60} /></View>
                <Text style={{ color: dim, fontSize: 14, fontWeight: '700' }}>.pdf</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <Btn flex label="Cancel" onPress={() => setAsk(null)} />
                <Btn main flex label="Make PDF" onPress={() => { const a = ask; setAsk(null); doPdf(a.s, a.name); }} />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
      {busy ? (
        <Modal visible transparent animationType="fade" statusBarTranslucent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.55)', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ paddingVertical: 22, paddingHorizontal: 28, borderRadius: 22, backgroundColor: '#241338', borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', alignItems: 'center', gap: 12 }}><ActivityIndicator color="#b794ff" size="large" /><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>{busy}</Text></View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}
