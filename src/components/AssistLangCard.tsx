import React from 'react';
import { View, Pressable, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';
import { Glass } from './Glass';
import { XLANGS, xlOk, useAssistLang, useLangPacks } from '../lib/xlate';

const DIM = 'rgba(255,255,255,.7)';

// The list of languages. Picking one downloads its pack once (if needed) and switches the Assistant to it.
// `auto` starts the download of that language straight away, used when the Assistant offers to set one up.
export function AssistLangList({ onDone, auto }: { onDone?: () => void; auto?: string }) {
  const [cur, setCur] = useAssistLang(); const packs = useLangPacks();
  const [msg, setMsg] = React.useState('');
  const pick = async (code: string) => {
    setMsg('');
    if (!code) { setCur(''); onDone && onDone(); return; }
    if (!packs.ready(code)) {
      const ok = await packs.get(code);
      if (!ok) { setMsg('Could not download the language pack. Check your internet and try again.'); return; }
    }
    setCur(code); onDone && onDone();
  };
  const started = React.useRef(false);
  React.useEffect(() => { if (auto && xlOk && !started.current) { started.current = true; pick(auto); } }, [auto]);
  if (!xlOk) return <Text style={{ color: '#ffd9a0', fontSize: 12, lineHeight: 17 }}>Other languages are not in this version of the app yet.</Text>;
  return (
    <>
      <Text style={{ color: DIM, fontSize: 12, lineHeight: 17, marginBottom: 8 }}>Chat with the Assistant in your own language. Your words are translated on this phone, with no internet after a one-time download of about 30 MB.</Text>
      <Row t="English / Bahasa Malaysia" sub="Built in" on={!cur} onPress={() => pick('')} />
      {XLANGS.map((x) => {
        const have = packs.ready(x.code); const busy = packs.busy === x.code;
        return <Row key={x.code} t={x.native} sub={x.name + (busy ? ' · downloading...' : have ? ' · downloaded' : ' · about 30 MB')} on={cur === x.code} busy={busy} onPress={() => { if (!packs.busy) pick(x.code); }} onRemove={have && cur !== x.code && !busy ? () => packs.del(x.code) : undefined} />;
      })}
      {msg ? <Text style={{ color: '#ffd9a0', fontSize: 12, marginTop: 8 }}>{msg}</Text> : null}
      <Text style={{ color: DIM, fontSize: 11.5, lineHeight: 16, marginTop: 10 }}>Menus and buttons stay in English. Translations are made by the phone and can be imperfect, so check amounts and dates.</Text>
    </>
  );
}

// Settings card: pick the language you chat with the Assistant in.
export function AssistLangCard() {
  const [cur] = useAssistLang();
  const [open, setOpen] = React.useState(false);
  const sel = XLANGS.find((x) => x.code === cur);
  return (
    <Glass style={{ padding: 16 }}>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <LinearGradient colors={['#c79bff', '#ff8fab']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>文A</Text></LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Assistant language</Text>
          <Text style={{ color: DIM, fontSize: 11.5, marginTop: 3 }}>{sel ? sel.native + ' · ' + sel.name : 'English and Bahasa Malaysia'}</Text>
        </View>
        <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 20 }}>{open ? '⌄' : '›'}</Text>
      </Pressable>
      {open ? <View style={{ marginTop: 12 }}><AssistLangList /></View> : null}
    </Glass>
  );
}

// The same list as a sheet inside the Assistant, opened from the "More languages" button or from the Assistant's offer.
export function AssistLangSheet({ visible, onClose, auto }: { visible: boolean; onClose: () => void; auto?: string }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(5,8,28,.72)', justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} accessibilityLabel="Close" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <View style={{ maxHeight: '82%', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', backgroundColor: '#141a4a' }}>
          <LinearGradient colors={['rgba(94,231,223,.16)', 'rgba(124,156,255,.08)', 'rgba(183,148,255,.14)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 6 }}>
            <Text style={{ flex: 1, color: '#fff', fontSize: 18, fontWeight: '800' }}>Assistant language</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button"><Text style={{ color: '#8fe9e2', fontSize: 14, fontWeight: '700' }}>Close</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 28, paddingTop: 6 }}>
            <AssistLangList auto={auto} onDone={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Row({ t, sub, on, busy, onPress, onRemove }: { t: string; sub: string; on: boolean; busy?: boolean; onPress: () => void; onRemove?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 14, backgroundColor: on ? 'rgba(124,156,255,.32)' : 'transparent', marginBottom: 2 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{t}</Text>
        <Text style={{ color: DIM, fontSize: 11, marginTop: 1 }}>{sub}</Text>
      </View>
      {busy ? <ActivityIndicator color="#8fe9e2" /> : on ? <Text style={{ color: '#8fe9e2', fontSize: 15, fontWeight: '800' }}>✓</Text> : onRemove ? <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel={'Remove ' + t}><Text style={{ color: 'rgba(255,143,171,.9)', fontSize: 12, fontWeight: '700' }}>Remove</Text></Pressable> : null}
    </Pressable>
  );
}
