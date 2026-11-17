import React from 'react';
import { View, Pressable, ActivityIndicator, Modal, ScrollView, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Text } from './Txt';
import { XLANGS, xlOk, useAssistLang, useLangPacks, flagOf, xlLang } from '../lib/xlate';

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
          {onRemove ? <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel={'Remove ' + t} style={{ alignSelf: 'flex-start', marginTop: 4 }}><Text style={{ color: 'rgba(255,143,171,.95)', fontSize: 11.5, fontWeight: '700' }}>Remove download</Text></Pressable> : null}
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

// A popup after a language is chosen: a flag with rings of light, a "language selected" badge, the name of the language and a bar that runs out as it closes.
const SHOW_MS = 3000;
export function LangPickedPopup({ code, onHide }: { code: string | null; onHide: () => void }) {
  const a = React.useRef(new Animated.Value(0)).current;
  const pulse = React.useRef(new Animated.Value(0)).current;
  const sweep = React.useRef(new Animated.Value(0)).current;
  const bar = React.useRef(new Animated.Value(1)).current;
  const [w, setW] = React.useState(300);
  React.useEffect(() => {
    if (code === null) return;
    a.setValue(0); sweep.setValue(0); bar.setValue(1); pulse.setValue(0);
    Animated.timing(a, { toValue: 1, duration: 300, easing: Easing.out(Easing.back(1.3)), useNativeDriver: false }).start();
    Animated.timing(sweep, { toValue: 1, duration: 1000, delay: 250, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
    Animated.timing(bar, { toValue: 0, duration: SHOW_MS, easing: Easing.linear, useNativeDriver: false }).start();
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: false }));
    loop.start();
    const t = setTimeout(() => { Animated.timing(a, { toValue: 0, duration: 220, useNativeDriver: false }).start(() => onHide()); }, SHOW_MS);
    return () => { clearTimeout(t); loop.stop(); };
  }, [code]);
  if (code === null) return null;
  const lg = code ? xlLang(code) : null;
  const rings = [0, 1, 2].map((k) => {
    const sc = pulse.interpolate({ inputRange: [0, 1], outputRange: [1 + k * 0.1, 1.45 + k * 0.1] });
    const op = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5 - k * 0.12, 0] });
    return <Animated.View key={k} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 60, borderWidth: 2, borderColor: '#7df0c6', opacity: op, transform: [{ scale: sc }] }} />;
  });
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(4,6,24,.55)' }}>
      <Animated.View style={{ opacity: a, transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }], alignSelf: 'stretch' }}>
        <Pressable onPress={onHide}>
          <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ borderRadius: 32, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(125,240,198,.75)', backgroundColor: '#17204f', paddingTop: 30, alignItems: 'center' }}>
            <LinearGradient colors={['#2c4a8f', '#17204f', '#151a4a']} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
            <LinearGradient colors={['rgba(94,231,223,.4)', 'rgba(94,231,223,0)']} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 190 }} />
            <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, width: w * 0.3, transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-w * 0.4, w * 1.1] }) }, { skewX: '-20deg' }], opacity: sweep.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] }) }}>
              <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,.14)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
            </Animated.View>
            <View style={{ width: 112, height: 112, alignItems: 'center', justifyContent: 'center' }}>
              <View pointerEvents="none" style={{ position: 'absolute', left: 8, right: 8, top: 8, bottom: 8 }}>{rings}</View>
              <View style={{ width: 92, height: 92, borderRadius: 46, overflow: 'hidden', borderWidth: 3, borderColor: 'rgba(255,255,255,.35)' }}>
                <LinearGradient colors={['#34d399', '#5ee7df']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  {lg ? <Text style={{ fontSize: 44 }}>{flagOf(code)}</Text> : <Chat />}
                </LinearGradient>
              </View>
              <View style={{ position: 'absolute', right: 2, bottom: 2, width: 34, height: 34, borderRadius: 17, backgroundColor: '#34d399', borderWidth: 3, borderColor: '#17204f', alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M5 12.5l4.5 4.5L19 7" stroke="#04201f" strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
              </View>
              <Text style={{ position: 'absolute', left: -2, top: 6, color: '#b9fff0', fontSize: 14 }}>✦</Text>
              <Text style={{ position: 'absolute', right: -4, top: 14, color: '#b9fff0', fontSize: 10 }}>✦</Text>
              <Text style={{ position: 'absolute', right: 6, top: -8, color: '#b9fff0', fontSize: 11 }}>✦</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 22, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(52,211,153,.18)', borderWidth: 1, borderColor: 'rgba(52,211,153,.55)' }}>
              <Text style={{ color: '#8fe9c2', fontSize: 12, fontWeight: '800', letterSpacing: 0.6 }}>✓ LANGUAGE SELECTED</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 12, textAlign: 'center' }}>{lg ? lg.name : 'English'}</Text>
            <Text style={{ color: '#7df0e0', fontSize: 28, fontWeight: '800', marginTop: 2, textAlign: 'center' }}>{lg ? (lg.native !== lg.name ? lg.native : '') : 'Bahasa Malaysia'}</Text>
            <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 13, lineHeight: 19, marginTop: 12, paddingHorizontal: 22, textAlign: 'center' }}>{lg ? 'You can now type in this language. Your words are translated on this phone.' : 'The Assistant answers in English or Bahasa Malaysia again. No download needed.'}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 16 }}>
              {['Works offline', 'Private', 'Tap to close'].map((t) => <View key={t} style={{ paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}><Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 11.5, fontWeight: '600' }}>{t}</Text></View>)}
            </View>
            <View style={{ height: 4, alignSelf: 'stretch', marginTop: 22, backgroundColor: 'rgba(255,255,255,.1)' }}>
              <Animated.View style={{ height: 4, width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: '#5ee7df' }} />
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
const Chat = () => (
  <Svg width={46} height={46} viewBox="0 0 24 24"><Path d="M4 5h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-3 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" stroke="#06281c" strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" /><Path d="M11 17h2l3 3v-3h2a2 2 0 0 0 2-2v-4" stroke="#06281c" strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
);
