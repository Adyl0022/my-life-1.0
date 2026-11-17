import React from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';
import { Glass } from './Glass';
import { XLANGS, xlOk, useAssistLang, useLangPacks } from '../lib/xlate';

const DIM = 'rgba(255,255,255,.7)';

// Settings card: pick the language you chat with the Assistant in. The pack is downloaded once, then it works offline.
export function AssistLangCard() {
  const [cur, setCur] = useAssistLang(); const packs = useLangPacks();
  const [open, setOpen] = React.useState(false); const [msg, setMsg] = React.useState('');
  const sel = XLANGS.find((x) => x.code === cur);
  const pick = async (code: string) => {
    setMsg('');
    if (!code) { setCur(''); return; }
    if (!packs.ready(code)) {
      const ok = await packs.get(code);
      if (!ok) { setMsg('Could not download the language pack. Check your internet and try again.'); return; }
    }
    setCur(code); setOpen(false);
  };
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
      {open ? (
        <View style={{ marginTop: 12 }}>
          {!xlOk ? <Text style={{ color: '#ffd9a0', fontSize: 12, lineHeight: 17 }}>Other languages are not in this version of the app yet.</Text> : (
            <>
              <Text style={{ color: DIM, fontSize: 12, lineHeight: 17, marginBottom: 8 }}>Chat with the Assistant in your own language. Your words are translated on this phone, with no internet after a one-time download of about 30 MB.</Text>
              <Row t="English / Bahasa Malaysia" sub="Built in" on={!cur} onPress={() => pick('')} />
              {XLANGS.map((x) => {
                const have = packs.ready(x.code); const busy = packs.busy === x.code;
                return <Row key={x.code} t={x.native} sub={x.name + (have ? ' · downloaded' : ' · about 30 MB')} on={cur === x.code} busy={busy} onPress={() => { if (!packs.busy) pick(x.code); }} onRemove={have && cur !== x.code && !busy ? () => packs.del(x.code) : undefined} />;
              })}
              {msg ? <Text style={{ color: '#ffd9a0', fontSize: 12, marginTop: 8 }}>{msg}</Text> : null}
              <Text style={{ color: DIM, fontSize: 11.5, lineHeight: 16, marginTop: 10 }}>Menus and buttons stay in English. Translations are made by the phone and can be imperfect, so check amounts and dates.</Text>
            </>
          )}
        </View>
      ) : null}
    </Glass>
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
