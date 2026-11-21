import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, ScrollView, Animated, Easing } from 'react-native';
import { Pressable } from './Press';
import { Text } from './Txt';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Glass } from './Glass';
import { OrbLive } from './OrbLive';
import { Blob } from './Bg';
import { micAllowed, listen, speak, stopSpeaking, voiceCommand, Lang, voicesFor, voicePref, setVoicePref, sample, VoiceOpt } from '../lib/voice';

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking';
const stroke = { stroke: '#fff', strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const errText = (c: string, ms: boolean) => {
  if (c === 'not-allowed') return ms ? 'Benarkan mikrofon untuk My Life 1.0 dalam tetapan telefon.' : 'Allow the microphone for My Life 1.0 in your phone settings.';
  if (c === 'language-not-supported' || c === 'service-not-allowed') return ms ? 'Pengecaman suara tiada untuk bahasa ini pada telefon awak.' : 'Speech recognition is not available for this language on your phone.';
  if (c === 'network') return ms ? 'Tiada internet untuk pengecaman suara. Sambung internet dan cuba lagi.' : 'No internet for speech recognition. Connect and try again.';
  return ms ? 'Saya tak dengar awak. Cuba lagi.' : 'I could not hear you. Try again.';
};

// The Assistant by voice. It talks to the same Assistant as the chat screen (chat.current), so everything it can do by typing it can do by voice,
// and the whole talk is also kept in the chat afterwards.
export function VoiceAssistant({ visible, chat, onClose, onOpen }: { visible: boolean; chat: React.MutableRefObject<any>; onClose: () => void; onOpen: (route: string) => void }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [heard, setHeard] = useState(''); const [reply, setReply] = useState(''); const [err, setErr] = useState('');
  const [lang, setLang] = useState<Lang>('en'); const [mix, setMix] = useState(false); const mixR = useRef(false);
  const [panel, setPanel] = useState(false); const [vopts, setVopts] = useState<VoiceOpt[]>([]); const [pref, setPref] = useState(voicePref());
  const live = useRef(false); const stopL = useRef<() => void>(() => {}); const quiet = useRef(0); const pause = useRef(false);
  const C = () => chat.current;
  const curLang = (): Lang => (C() && C().state && C().state.lang === 'ms' ? 'ms' : 'en');
  const L = (en: string, ms: string) => (curLang() === 'ms' ? ms : en);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    live.current = true; quiet.current = 0; pause.current = false; if (C()) C().voice = true; setPanel(false);
    setLang(curLang()); setHeard(''); setReply(''); setErr(''); setPhase('idle');
    begin();
    return () => { live.current = false; if (C()) C().voice = false; stopL.current(); stopSpeaking(); };
  }, [visible]);
  useEffect(() => {
    if (phase !== 'listening') { pulse.setValue(0); return; }
    const a = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true })); a.start();
    return () => a.stop();
  }, [phase]);

  const begin = async () => {
    setErr('');
    if (!(await micAllowed())) { if (live.current) { setErr(errText('not-allowed', curLang() === 'ms')); setPhase('idle'); } return; }
    listenOnce();
  };
  const listenOnce = () => {
    if (!live.current) return;
    setPhase('listening'); setHeard('');
    let final = ''; let fatal = false;
    stopL.current = listen(curLang(), {
      onPartial: (t) => setHeard(t),
      onFinal: (t) => { final = t; },
      onError: (c) => { fatal = true; setErr(errText(c, curLang() === 'ms')); },
      onEnd: () => {
        if (!live.current) return;
        if (pause.current || fatal) { pause.current = false; setPhase('idle'); return; }
        if (final) { quiet.current = 0; handle(final); return; }
        quiet.current += 1;
        if (quiet.current >= 2) setPhase('idle'); else listenOnce();
      },
    }, mixR.current);
  };
  const say = (text: string, after: () => void) => {
    setReply(text); setPhase('speaking');
    speak(text, curLang(), () => { if (live.current) after(); });
  };
  const again = () => listenOnce();
  const handle = (text: string) => {
    const c = C(); if (!c) { setPhase('idle'); return; }
    setHeard(text);
    const pending = !!(c.state && c.state.pending);
    const cmd = voiceCommand(text, pending);
    if (cmd && cmd.kind === 'stop') { say(L('Okay. Talk to me any time.', 'Baik. Panggil saya bila-bila masa.'), onClose); return; }
    if (cmd && cmd.kind === 'open') { say(L('Opening ' + cmd.name + '.', 'Membuka ' + cmd.name + '.'), () => onOpen(cmd.route)); return; }
    if (cmd && cmd.kind === 'openFail') { say(L('I could not find a page called ' + cmd.target + '.', 'Saya tak jumpa halaman ' + cmd.target + '.'), again); return; }
    setPhase('thinking'); setReply('');
    const before = (c.state.msgs || []).length;
    if (cmd && cmd.kind === 'yes') c.confirm(true); else if (cmd && cmd.kind === 'no') c.confirm(false); else c.ask(text);
    const t0 = Date.now();
    const wait = () => {
      if (!live.current) return;
      const s = c.state || {}; const ms = s.msgs || [];
      const last = ms[ms.length - 1];
      if (ms.length > before && last && !last.me && !s.typing) { answer(last, s); return; }
      if (Date.now() - t0 > 30000) { say(L('Sorry, that took too long.', 'Maaf, ia ambil masa terlalu lama.'), again); return; }
      setTimeout(wait, 250);
    };
    setTimeout(wait, 400);
  };
  const answer = (m: any, s: any) => {
    const online = m.src === 'online';
    const text = String(m.text || '').replace(/\n\n\((An AI answer|Online AI answer|Jawapan AI)[\s\S]*$/, '').trim();
    const askSave = !!(s.pending && m.pid && s.pending.id === m.pid);
    const prompt = L('Shall I save it? Say yes or no.', 'Nak simpan? Cakap ya atau tidak.');
    setReply(text + (online ? '\n\n' + L('Online AI: your question was sent over the internet.', 'AI dalam talian: soalan awak dihantar melalui internet.') : '') + (askSave ? '\n\n' + prompt : '')); setPhase('speaking');
    speak(text, curLang(), () => {
      if (!live.current) return;
      if (askSave) speak(prompt, curLang(), () => { if (live.current) listenOnce(); }); else listenOnce();
    });
  };
  const tapMic = () => {
    if (phase === 'idle') { quiet.current = 0; begin(); }
    else if (phase === 'listening') { pause.current = true; stopL.current(); }
    else if (phase === 'speaking') { stopSpeaking(); }
  };
  const pickLang = (l: Lang | 'mix') => {
    stopSpeaking();
    if (l === 'mix') { mixR.current = true; setMix(true); setLang('ms'); if (C()) C().setState({ lang: 'ms' }); return; }
    mixR.current = false; setMix(false); setLang(l); if (C()) C().setState({ lang: l });
  };
  const openPanel = async () => { const o = await voicesFor(lang); setVopts(o); setPref(voicePref()); setPanel(true); };
  const choose = (id: string) => { setVoicePref({ [lang]: id } as any); setPref(voicePref()); sample(lang, id); };
  const tune = (k: 'rate' | 'pitch', v: number) => { setVoicePref({ [k]: v } as any); setPref(voicePref()); sample(lang); };
  const ms = lang === 'ms';
  const status = phase === 'listening' ? (ms ? 'Saya mendengar…' : 'Listening…') : phase === 'thinking' ? (ms ? 'Sedang fikir…' : 'Thinking…') : phase === 'speaking' ? (ms ? 'Bercakap…' : 'Speaking…') : (ms ? 'Tekan mikrofon untuk bercakap' : 'Tap the microphone to talk');
  const tries = ms ? ['"belanja makan 12 ringgit"', '"buka akaun"', '"berapa belanja saya hari ini?"'] : ['"spent 12 ringgit on lunch"', '"open My Accounts"', '"how much did I spend today?"', '"what do you think about saving first?"'];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
        <LinearGradient colors={['#0a0f2c', '#1a1048', '#0c2b4d']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <Blob size={320} color="rgba(183,148,255,.5)" style={{ right: -100, top: -40 }} />
        <Blob size={340} color="rgba(94,231,223,.3)" style={{ left: -120, bottom: 80 }} />
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={onClose} accessibilityLabel="Close voice">
              <Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <View><Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M6 6l12 12M18 6L6 18" {...stroke} /></Svg></View>
              </Glass>
            </Pressable>
            <Text style={{ flex: 1, color: '#fff', fontSize: 18, fontWeight: '800' }}>{ms ? 'Suara Assistant' : 'Voice Assistant'}</Text>
            <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)' }}>
              {([['en', 'EN'], ['ms', 'BM'], ['mix', 'BM+EN']] as [Lang | 'mix', string][]).map(([k, t]) => (
                <Pressable key={k} onPress={() => pickLang(k)}>
                  {(mix ? k === 'mix' : lang === k) ? (
                    <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 }}><Text style={{ color: '#fff', fontSize: 11.5, fontWeight: '800' }}>{t}</Text></LinearGradient>
                  ) : (<View style={{ paddingVertical: 6, paddingHorizontal: 10 }}><Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, fontWeight: '600' }}>{t}</Text></View>)}
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ alignItems: 'center', marginTop: 18 }}>
            <OrbLive size={phase === 'idle' ? 110 : 128} />
            <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 15, fontWeight: '700', marginTop: 8 }}>{status}</Text>
          </View>

          <ScrollView style={{ flex: 1, marginTop: 14 }} contentContainerStyle={{ gap: 12, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
            {heard ? <Text style={{ color: '#fff', fontSize: 19, lineHeight: 26, textAlign: 'center', fontWeight: '600' }}>{'“' + heard + '”'}</Text> : null}
            {reply ? <Glass radius={22} style={{ paddingVertical: 14, paddingHorizontal: 16 }}><Text style={{ color: '#fff', fontSize: 14.5, lineHeight: 22 }}>{reply}</Text></Glass> : null}
            {err ? <Text style={{ color: '#ffb3a0', fontSize: 13, lineHeight: 19, textAlign: 'center' }}>{err}</Text> : null}
            {!heard && !reply && !err ? (
              <View style={{ gap: 8, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5 }}>{ms ? 'Cuba sebut atau bersembang:' : 'Try saying or just chat:'}</Text>
                {tries.map((t) => <Text key={t} style={{ color: 'rgba(255,255,255,.9)', fontSize: 14, fontWeight: '600' }}>{t}</Text>)}
              </View>
            ) : null}
          </ScrollView>

          <Pressable onPress={() => (panel ? setPanel(false) : openPanel())} accessibilityLabel="Choose the voice">
            <View style={{ alignSelf: 'center', paddingVertical: 7, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', marginBottom: 8 }}><Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{panel ? (ms ? 'Tutup pilihan suara' : 'Close voice options') : (ms ? 'Pilih suara' : 'Choose voice')}</Text></View>
          </Pressable>
          {panel ? (
            <Glass radius={22} style={{ padding: 14, marginBottom: 8, maxHeight: 250 }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6 }}>{(ms ? 'SUARA ' : 'VOICE ') + (lang === 'ms' ? 'BAHASA MELAYU' : 'ENGLISH')}</Text>
                {vopts.length ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {vopts.map((o) => { const on = pref[lang] === o.id; return (
                      <Pressable key={o.id} onPress={() => choose(o.id)}>
                        <View style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: on ? '#b794ff' : 'rgba(255,255,255,.25)', backgroundColor: on ? 'rgba(183,148,255,.35)' : 'rgba(255,255,255,.06)' }}>
                          <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: on ? '800' : '600' }}>{o.label + (o.gender === 'female' ? (ms ? ' · perempuan' : ' · female') : o.gender === 'male' ? (ms ? ' · lelaki' : ' · male') : '')}</Text>
                        </View>
                      </Pressable>); })}
                  </View>
                ) : <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, lineHeight: 18, marginTop: 8 }}>{ms ? 'Tiada senarai suara pada telefon ini. Guna Tona di bawah untuk suara lebih halus (perempuan) atau lebih dalam (lelaki).' : 'This phone gives no voice list. Use Tone below for a higher (female) or deeper (male) sound.'}</Text>}
                <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, marginTop: 14 }}>{ms ? 'TONA' : 'TONE'}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  {([[ms ? 'Lelaki (dalam)' : 'Male (deep)', 0.7], [ms ? 'Biasa' : 'Normal', 1], [ms ? 'Perempuan (halus)' : 'Female (high)', 1.35]] as [string, number][]).map(([t, v]) => { const on = Math.abs(pref.pitch - v) < 0.05; return (
                    <Pressable key={t} onPress={() => tune('pitch', v)}><View style={{ paddingVertical: 8, paddingHorizontal: 11, borderRadius: 14, borderWidth: 1, borderColor: on ? '#b794ff' : 'rgba(255,255,255,.25)', backgroundColor: on ? 'rgba(183,148,255,.35)' : 'rgba(255,255,255,.06)' }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: on ? '800' : '600' }}>{t}</Text></View></Pressable>); })}
                </View>
                <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6, marginTop: 14 }}>{ms ? 'KELAJUAN' : 'SPEED'}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  {([[ms ? 'Perlahan' : 'Slow', 0.8], [ms ? 'Biasa' : 'Normal', 1], [ms ? 'Laju' : 'Fast', 1.25]] as [string, number][]).map(([t, v]) => { const on = Math.abs(pref.rate - v) < 0.05; return (
                    <Pressable key={t} onPress={() => tune('rate', v)}><View style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: on ? '#b794ff' : 'rgba(255,255,255,.25)', backgroundColor: on ? 'rgba(183,148,255,.35)' : 'rgba(255,255,255,.06)' }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: on ? '800' : '600' }}>{t}</Text></View></Pressable>); })}
                </View>
                <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, lineHeight: 16, marginTop: 12 }}>{ms ? 'Suara yang ada bergantung pada telefon awak. Tambah suara lain di Tetapan telefon > Pengurusan am > Teks ke pertuturan.' : 'The voices available depend on your phone. Add more in phone Settings > General management > Text-to-speech.'}</Text>
              </ScrollView>
            </Glass>
          ) : null}
          <View style={{ alignItems: 'center', paddingBottom: 6 }}>
            <View style={{ width: 92, height: 92, alignItems: 'center', justifyContent: 'center' }}>
              {phase === 'listening' ? <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 92, height: 92, borderRadius: 46, backgroundColor: 'rgba(124,156,255,.45)', opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.35] }) }] }} /> : null}
              <Pressable onPress={tapMic} buzz accessibilityLabel={phase === 'listening' ? 'Stop listening' : 'Start listening'}>
                <LinearGradient colors={phase === 'listening' ? ['#ff8fab', '#ffb36b'] : ['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' }}>
                  {phase === 'listening' ? <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#fff' }} /> : (
                    <Svg width={32} height={32} viewBox="0 0 24 24"><Path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3" {...stroke} /></Svg>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
            <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 8, paddingHorizontal: 10 }}>{ms ? 'Suara awak ditukar kepada teks oleh perkhidmatan suara telefon (Google pada kebanyakan telefon). My Life 1.0 tidak menyimpan rakaman.' : 'Your voice is turned into text by your phone\'s speech service (Google on most phones). My Life 1.0 does not keep any recording.'}</Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
