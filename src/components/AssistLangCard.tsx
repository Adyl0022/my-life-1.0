import React from 'react';
import { View, ActivityIndicator, Modal, ScrollView, Animated, Easing } from 'react-native';
import { Pressable } from './Press';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Text } from './Txt';
import { XLANGS, xlOk, useAssistLang, useLangPacks, flagOf, xlLang } from '../lib/xlate';

import { confirmDelete } from '../lib/dialog';
const DIM = 'rgba(255,255,255,.7)';
const TONES: [string, string][] = [['#7c9cff', '#b794ff'], ['#34d399', '#5ee7df'], ['#ffc46b', '#ff8f5a'], ['#ff8fab', '#c79bff'], ['#5ee7df', '#4a8dff'], ['#b794ff', '#7059e8']];
const sv = { stroke: '#fff', strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const Globe = ({ s = 22, c = '#06281c' }: { s?: number; c?: string }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={2} fill="none" /><Path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round" /></Svg>
);

// The list of languages. Picking one downloads its pack once (if needed) and switches the Assistant to it.
// `auto` starts the download of that language straight away, used when the Assistant offers to set one up.
export function AssistLangList({ onDone, auto }: { onDone?: (code: string) => void; auto?: string }) {
  const [cur, setCur] = useAssistLang(); const packs = useLangPacks();
  const [msg, setMsg] = React.useState('');
  const pick = async (code: string) => {
    setMsg('');
    if (!code) { setCur(''); onDone && onDone(''); return; }
    if (!packs.ready(code)) {
      const ok = await packs.get(code);
      if (!ok) { setMsg('Could not download the language pack. Check your internet and try again.'); return; }
    }
    setCur(code); onDone && onDone(code);
  };
  const started = React.useRef(false);
  React.useEffect(() => { if (auto && xlOk && !started.current) { started.current = true; pick(auto); } }, [auto]);
  if (!xlOk) return <Text style={{ color: '#ffd9a0', fontSize: 12.5, lineHeight: 18 }}>Other languages are not in this version of the app yet.</Text>;
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 18, backgroundColor: 'rgba(94,231,223,.1)', borderWidth: 1, borderColor: 'rgba(94,231,223,.3)', marginBottom: 16 }}>
        <Svg width={18} height={18} viewBox="0 0 24 24" style={{ marginTop: 1 }}><Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" {...sv} stroke="#8fe9e2" /><Path d="M9 12l2.2 2.2L15.5 10" {...sv} stroke="#8fe9e2" /></Svg>
        <Text style={{ flex: 1, color: 'rgba(255,255,255,.85)', fontSize: 12.5, lineHeight: 18 }}>Your words are translated on this phone. Download a language once (about 30 MB) and it works without internet.</Text>
      </View>
      <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 8, marginLeft: 4 }}>BUILT IN</Text>
      <Item mono="EN·BM" tone={TONES[0]} t="English / Bahasa Malaysia" sub="Works offline, no download" on={!cur} have onPress={() => pick('')} />
      <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginTop: 10, marginBottom: 8, marginLeft: 4 }}>MORE LANGUAGES</Text>
      {XLANGS.map((x, i) => {
        const have = packs.ready(x.code); const busy = packs.busy === x.code;
        return <Item key={x.code} mono={flagOf(x.code)} flag tone={TONES[(i + 1) % TONES.length]} t={x.native} sub={x.name} on={cur === x.code} have={have} busy={busy} onPress={() => { if (!packs.busy) pick(x.code); }} onRemove={have && cur !== x.code && !busy ? () => packs.del(x.code) : undefined} />;
      })}
      {msg ? <Text style={{ color: '#ffd9a0', fontSize: 12.5, marginTop: 4, marginBottom: 6 }}>{msg}</Text> : null}
      <Text style={{ color: DIM, fontSize: 11.5, lineHeight: 17, marginTop: 6 }}>Menus and buttons stay in English. The phone makes the translation, so check amounts and dates.</Text>
    </>
  );
}

// The same list as a sheet inside the Assistant, opened from the "Chat in your language" card or from the Assistant's offer.
export function AssistLangSheet({ visible, onClose, auto, onPicked }: { visible: boolean; onClose: () => void; auto?: string; onPicked?: (code: string) => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(5,8,28,.74)', justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} accessibilityLabel="Close" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <View style={{ maxHeight: '86%', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(255,255,255,.22)', backgroundColor: '#151a4a' }}>
          <LinearGradient colors={['#1d1856', '#151a4a', '#0e2650']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <LinearGradient colors={['rgba(94,231,223,.22)', 'rgba(94,231,223,0)']} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 140 }} />
          <View style={{ alignItems: 'center', paddingTop: 10 }}><View style={{ width: 42, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.28)' }} /></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14 }}>
            <LinearGradient colors={['#34d399', '#5ee7df']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Globe s={24} /></LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>Chat in your language</Text>
              <Text style={{ color: DIM, fontSize: 12, marginTop: 2 }}>Pick one and the Assistant follows</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' }}><Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Close</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 34, paddingTop: 4 }} showsVerticalScrollIndicator={false}>
            <AssistLangList auto={auto} onDone={(c) => { onClose(); onPicked && onPicked(c); }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Item({ mono, flag, tone, t, sub, on, have, busy, onPress, onRemove }: { mono: string; flag?: boolean; tone: [string, string]; t: string; sub: string; on: boolean; have?: boolean; busy?: boolean; onPress: () => void; onRemove?: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, backgroundColor: on ? 'rgba(94,231,223,.14)' : 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: on ? 'rgba(94,231,223,.75)' : 'rgba(255,255,255,.14)' }}>
        {flag ? <View style={{ width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' }}><Text style={{ fontSize: 25 }}>{mono}</Text></View> : <LinearGradient colors={['#34d399', '#5ee7df']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={27} height={27} viewBox="0 0 24 24" fill="none" stroke="#06281c" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M4 5h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-3 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" /><Path d="M11 17h2l3 3v-3h2a2 2 0 0 0 2-2v-4" /></Svg>
        </LinearGradient>}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{t}</Text>
          <Text numberOfLines={1} style={{ color: DIM, fontSize: 12, marginTop: 2 }}>{busy ? 'Downloading...' : sub}</Text>
          {onRemove ? <Pressable onPress={() => confirmDelete(t, onRemove, { title: 'Remove ' + t + '?', message: 'The downloaded files are deleted from your phone. You can download them again later.', yes: 'Remove' })} hitSlop={8} accessibilityLabel={'Remove ' + t} style={{ alignSelf: 'flex-start', marginTop: 4 }}><Text style={{ color: 'rgba(255,143,171,.95)', fontSize: 11.5, fontWeight: '700' }}>Remove download</Text></Pressable> : null}
        </View>
        {busy ? <ActivityIndicator color="#8fe9e2" /> : on ? (
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#34d399', alignItems: 'center', justifyContent: 'center' }}><Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M5 12.5l4.5 4.5L19 7" stroke="#06281c" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg></View>
        ) : have ? (
          <View style={{ paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(52,211,153,.2)', borderWidth: 1, borderColor: 'rgba(52,211,153,.5)' }}><Text style={{ color: '#8fe9c2', fontSize: 11.5, fontWeight: '800' }}>Ready</Text></View>
        ) : (
          <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 }}>
            <Svg width={13} height={13} viewBox="0 0 24 24"><Path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14" {...sv} strokeWidth={2.4} /></Svg>
            <Text style={{ color: '#fff', fontSize: 11.5, fontWeight: '800' }}>30 MB</Text>
          </LinearGradient>
        )}
      </View>
    </Pressable>
  );
}

// A quiet popup after a language is chosen: a glass card with a thin gradient edge, a ring with a tick (or the flag), the language(s) in small pills,
// one line of text, and a thin line that runs out as it closes.
const SHOW_MS = 2800;
export function LangPickedPopup({ code, onHide }: { code: string | null; onHide: () => void }) {
  const a = React.useRef(new Animated.Value(0)).current;
  const bar = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    if (code === null) return;
    a.setValue(0); bar.setValue(1);
    Animated.timing(a, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    Animated.timing(bar, { toValue: 0, duration: SHOW_MS, easing: Easing.linear, useNativeDriver: false }).start();
    const t = setTimeout(() => { Animated.timing(a, { toValue: 0, duration: 220, useNativeDriver: false }).start(() => onHide()); }, SHOW_MS);
    return () => clearTimeout(t);
  }, [code]);
  if (code === null) return null;
  const lg = code ? xlLang(code) : null;
  const pills: string[][] = lg
    ? [[lg.name, 'rgba(124,156,255,.22)', 'rgba(124,156,255,.55)']].concat(lg.native !== lg.name ? [[lg.native, 'rgba(183,148,255,.22)', 'rgba(183,148,255,.55)']] : [])
    : [['English', 'rgba(124,156,255,.22)', 'rgba(124,156,255,.55)'], ['Bahasa Malaysia', 'rgba(183,148,255,.22)', 'rgba(183,148,255,.55)']];
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(4,6,24,.55)' }}>
      <Animated.View style={{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }], alignSelf: 'stretch' }}>
        <Pressable onPress={onHide}>
          <LinearGradient colors={['rgba(143,233,226,.75)', 'rgba(183,148,255,.55)', 'rgba(124,156,255,.15)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, padding: 1 }}>
            <View style={{ borderRadius: 27, overflow: 'hidden', backgroundColor: '#141238' }}>
              <LinearGradient colors={['rgba(143,233,226,.16)', 'rgba(20,18,56,0)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.55 }} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
              <View style={{ paddingTop: 30, paddingBottom: 24, paddingHorizontal: 22, alignItems: 'center' }}>
                <LinearGradient colors={['rgba(143,233,226,.9)', 'rgba(124,156,255,.9)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 58, height: 58, borderRadius: 29, padding: 1.5 }}>
                  <View style={{ flex: 1, borderRadius: 28, backgroundColor: '#17154a', alignItems: 'center', justifyContent: 'center' }}>
                    {lg ? <Text style={{ fontSize: 28 }}>{flagOf(code)}</Text> : <Svg width={26} height={26} viewBox="0 0 24 24"><Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#8fe9e2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>}
                  </View>
                </LinearGradient>
                <Text style={{ color: 'rgba(143,233,226,.9)', fontSize: 12.5, fontWeight: '700', marginTop: 16, letterSpacing: 0.4 }}>Language selected</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 12 }}>
                  {pills.map((x) => <View key={x[0]} style={{ paddingVertical: 7, paddingHorizontal: 16, borderRadius: 999, backgroundColor: x[1], borderWidth: 1, borderColor: x[2] }}><Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{x[0]}</Text></View>)}
                </View>
                <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, lineHeight: 21, marginTop: 12, textAlign: 'center' }}>{lg ? 'You can now type in this language. Your words are translated on this phone.' : 'The Assistant answers in English or Bahasa Malaysia again. No download needed.'}</Text>
                <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, marginTop: 16 }}>Tap to close</Text>
              </View>
              <View style={{ height: 2, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,.08)' }}>
                <Animated.View style={{ height: 2, width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: 'rgba(143,233,226,.7)' }} />
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}
