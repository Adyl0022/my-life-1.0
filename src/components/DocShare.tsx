import { Toggle } from './Toggle';
import { fileStamp } from '../lib/exporter';
import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Image, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { Pressable } from './Press';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';
import { Text } from './Txt';
import { Inp, W } from './Ui';

const dim = 'rgba(255,255,255,.62)';
const buzz = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };

/** Copy a value. The clipboard is emptied after a minute, if it still holds what we copied. */
export async function copyText(v: string): Promise<boolean> {
  try {
    const C = await import('expo-clipboard'); await C.setStringAsync(v);
    setTimeout(async () => { try { if ((await C.getStringAsync()) === v) await C.setStringAsync(''); } catch (e) { /* ignore */ } }, 60000);
    return true;
  } catch (e) { return false; }
}

export function CopyRow({ number, name }: { number?: string; name?: string }) {
  const [done, setDone] = useState('');
  const go = async (k: string, v: string) => { buzz(); const ok = await copyText(v); setDone(ok ? k : 'fail'); setTimeout(() => setDone(''), 1800); };
  const btn = (k: string, label: string, v?: string) => v ? (
    <Pressable key={k} onPress={() => go(k, v)} accessibilityLabel={label} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.95 : 1 }] })}>
      <View style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: done === k ? 'rgba(94,231,181,.3)' : 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: done === k ? '#5ee7b5' : 'rgba(255,255,255,.22)' }}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{done === k ? 'Copied' : label}</Text></View>
    </Pressable>
  ) : null;
  if (!number && !name) return null;
  return (
    <View style={{ marginTop: 14 }}>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>{btn('n', 'Copy number', number)}{btn('t', 'Copy name', name)}</View>
      <Text style={{ color: done === 'fail' ? '#ffd593' : dim, fontSize: 11.5, marginTop: 7 }}>{done === 'fail' ? 'Could not copy on this phone.' : 'The copy is cleared from the clipboard after a minute.'}</Text>
    </View>
  );
}

/** A picture with a note printed across it, so a copy sent to someone cannot be used for something else. */
export function ShareSheet({ pages, title, onClose }: { pages: string[]; title: string; onClose: () => void }) {
  const [note, setNote] = useState(''); const [mark, setMark] = useState(true); const [i, setI] = useState(0); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  const ref = useRef<any>(null); const { width } = useWindowDimensions(); const maxW = Math.min(width - 40, 420);
  const uri = pages[Math.min(i, pages.length - 1)];
  // The picture box takes the shape of the photo itself, so there are no black bars at the sides.
  const [ratio, setRatio] = useState(1.45);
  useEffect(() => { let on = true; Image.getSize(uri, (iw, ih) => { if (on && iw > 0 && ih > 0) setRatio(Math.max(0.5, Math.min(2.4, iw / ih))); }, () => {}); return () => { on = false; }; }, [uri]);
  let w = maxW; let h = w / ratio; if (h > 460) { h = 460; w = h * ratio; }
  const text = (note.trim() || 'FOR PURPOSE ONLY').toUpperCase();
  const chord = Math.hypot(0.63 * w, 0.435 * h); const bar = { cx: 0.315 * w, cy: 0.2175 * h, len: chord * 1.1, deg: (Math.atan2(-0.435 * h, 0.63 * w) * 180) / Math.PI, fs: Math.max(8, Math.min(13, (chord * 0.9 - text.length) / (text.length * 0.66))) };
  const go = async () => {
    buzz(); setBusy(true); setMsg('');
    try {
      if (Platform.OS === 'web') { setMsg('Sharing works in the Android app.'); setBusy(false); return; }
      const VS = await import('react-native-view-shot'); const SH = await import('expo-sharing');
      const f = await VS.captureRef(ref.current, { format: 'jpg', quality: 0.92, result: 'tmpfile' });
      if (!(await SH.isAvailableAsync())) { setMsg('Sharing is not available on this phone.'); setBusy(false); return; }
      let out = f; try { const FS = await import('expo-file-system/legacy'); const to = (FS.cacheDirectory || '') + 'Document-my-life-share-' + fileStamp() + '.jpg'; await FS.deleteAsync(to, { idempotent: true }); await FS.copyAsync({ from: f, to }); out = to; } catch (e) { /* keep the original file */ }
      await SH.shareAsync(out, { mimeType: 'image/jpeg', dialogTitle: 'Share ' + title });
    } catch (e) { setMsg('Could not share the picture. Please try again.'); }
    setBusy(false);
  };
  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#1b0f26' }}>
        <LinearGradient colors={['#1b0f26', '#2c1340', '#10244a']} locations={[0, 0.48, 1]} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 52, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={onClose} accessibilityLabel="Close"><View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 22 }}>‹</Text></View></Pressable>
            <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 22, fontWeight: '800' }}>Share safely</Text><Text numberOfLines={1} style={{ color: dim, fontSize: 12 }}>{title}</Text></View>
          </View>
          <View style={{ marginTop: 20, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', backgroundColor: 'rgba(255,255,255,.045)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Write the purpose on the picture</Text>
                <Text style={{ color: dim, fontSize: 11.5, marginTop: 3, lineHeight: 16 }}>{mark ? 'A bar with your note is printed on the picture, so it cannot be used for something else.' : 'The picture is shared as it is, with nothing written on it.'}</Text>
              </View>
              <Toggle on={mark} onPress={() => setMark(!mark)} label="Write the purpose on the picture" />
            </View>
            {mark ? (<>
              <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginTop: 16, marginBottom: 8 }}>WHY ARE YOU SHARING IT?</Text>
              <Inp value={note} onChangeText={setNote} placeholder="e.g. For hotel booking only" maxLength={40} />
            </>) : null}
            <Text style={{ color: dim, fontSize: 11.5, marginTop: 10, lineHeight: 16 }}>Nothing is uploaded: the picture is made on this phone and then you pick the app to send it with.</Text>
          </View>
          {pages.length > 1 ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              {pages.map((p, k) => (<Pressable key={k} onPress={() => { buzz(); setI(k); }} accessibilityLabel={'Page ' + (k + 1)}><Image source={{ uri: p }} style={{ width: 52, height: 52, borderRadius: 10, borderWidth: 2, borderColor: k === i ? '#8ea8ff' : 'rgba(255,255,255,.2)' }} /></Pressable>))}
            </View>
          ) : null}
          <View ref={ref} collapsable={false} style={{ marginTop: 16, width: w, height: h, alignSelf: 'center', borderRadius: 14, overflow: 'hidden', backgroundColor: '#0d0a18' }}>
            <Image source={{ uri }} style={{ width: w, height: h }} resizeMode="cover" />
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' }}>
              {mark ? <>{/* One bar across the top-left corner, like the tip from Jabatan Pendaftaran Negara: two straight lines with the purpose written between them. */}
              <View style={{ position: 'absolute', left: bar.cx - bar.len, width: bar.len * 2, top: bar.cy - 15, height: 30, justifyContent: 'center', transform: [{ rotate: bar.deg + 'deg' }], borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: 'rgba(255,255,255,.92)', backgroundColor: 'rgba(0,0,0,.22)' }}>
                <Text numberOfLines={1} style={{ color: '#fff', fontSize: bar.fs, fontWeight: '800', letterSpacing: 1, textAlign: 'center', textShadowColor: 'rgba(0,0,0,.9)', textShadowRadius: 2, textShadowOffset: { width: 1, height: 1 } }}>{text}</Text>
              </View></> : null}
            </View>
          </View>
          {msg ? <Text style={{ color: '#ffd593', fontSize: 12.5, fontWeight: '700', marginTop: 12 }}>{msg}</Text> : null}
          <Pressable onPress={go} disabled={busy} accessibilityLabel="Share the picture" style={({ pressed }) => ({ marginTop: 18, transform: [{ scale: pressed ? 0.98 : 1 }], opacity: busy ? 0.6 : 1 })}>
            <LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#1a1030', fontSize: 15.5, fontWeight: '800' }}>{busy ? 'Getting it ready…' : 'Share the picture'}</Text></LinearGradient>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

/** All pages into one PDF, made on the phone. */
export async function exportPdf(pages: string[], title: string): Promise<'ok' | 'web' | 'fail'> {
  if (Platform.OS === 'web') return 'web';
  try {
    const FS = await import('expo-file-system/legacy'); const PR = await import('expo-print'); const SH = await import('expo-sharing');
    const imgs: string[] = [];
    for (const p of pages) { const b64 = await FS.readAsStringAsync(p, { encoding: 'base64' as any }); imgs.push('<div style="page-break-after:always;text-align:center"><img style="max-width:100%;max-height:96vh" src="data:image/jpeg;base64,' + b64 + '"/></div>'); }
    const html = '<html><body style="margin:0;padding:12px">' + imgs.join('') + '</body></html>';
    const r = await PR.printToFileAsync({ html });
    let uri = r.uri; try { const to = (FS.cacheDirectory || '') + 'Document-my-life-export-' + fileStamp() + '.pdf'; await FS.deleteAsync(to, { idempotent: true }); await FS.copyAsync({ from: r.uri, to }); uri = to; } catch (e) { /* keep the original file */ }
    if (await SH.isAvailableAsync()) await SH.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: title, UTI: 'com.adobe.pdf' });
    return 'ok';
  } catch (e) { return 'fail'; }
}
