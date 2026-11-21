import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, ScrollView, Animated, Easing, useWindowDimensions } from 'react-native';
import { Pressable } from './Press';
import { Text } from './Txt';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Glass } from './Glass';
import { OrbLive } from './OrbLive';
import { Blob } from './Bg';
import { micAllowed, listen, speak, stopSpeaking, voiceCommand, VLANGS, vlang, voicesFor, voicePref, setVoicePref, sample, speechPack, VoiceOpt } from '../lib/voice';
import { useLangPacks, xlText, flagOf } from '../lib/xlate';

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking';
const stroke = { stroke: '#fff', strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const NAME = 'My Life Live';
// The live wave: soft ribbons of light that flow across the screen. They swell with the loudness of your voice while you talk,
// flow calmly while the Assistant answers, and breathe slowly when it is quiet.
const LAYERS = [
  { f: 0.012, sp: 1.5, ph: 0, a: 1, w: 3, o: 0.95, g: 0 },
  { f: 0.017, sp: -1.1, ph: 1.7, a: 0.78, w: 2.4, o: 0.75, g: 1 },
  { f: 0.009, sp: 0.8, ph: 3.2, a: 0.6, w: 2, o: 0.6, g: 2 },
  { f: 0.022, sp: -1.9, ph: 4.6, a: 0.42, w: 1.6, o: 0.5, g: 0 },
];
function Wave({ target, width }: { target: React.MutableRefObject<number>; width: number }) {
  const H = 170; const [d, setD] = useState<string[]>(LAYERS.map(() => ''));
  useEffect(() => {
    let raf = 0; let cur = 0.1; let t0 = Date.now(); let last = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = Date.now(); if (now - last < 33) return; last = now;
      const t = (now - t0) / 1000; cur += (target.current - cur) * 0.18;
      setD(LAYERS.map((L) => {
        let p = '';
        for (let x = 0; x <= width; x += 5) {
          const env = Math.pow(Math.sin((x / width) * Math.PI), 2);
          const y = H / 2 + (Math.sin(x * L.f * 2 + t * L.sp + L.ph) * 0.65 + Math.sin(x * L.f * 3.1 - t * L.sp * 0.7) * 0.35) * (H * 0.46) * L.a * cur * env;
          p += (x === 0 ? 'M' : 'L') + x + ' ' + y.toFixed(1) + ' ';
        }
        return p;
      }));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [width]);
  const gid = ['wa', 'wb', 'wc'];
  const cols = [['#5ee7df', '#7c9cff', '#b794ff'], ['#b794ff', '#ff8fab', '#ffb36b'], ['#7c9cff', '#5ee7df', '#b794ff']];
  return (
    <Svg width={width} height={H}>
      <Defs>
        {cols.map((c, i) => (
          <SvgGrad key={i} id={gid[i]} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={c[0]} stopOpacity="0" /><Stop offset="0.25" stopColor={c[0]} stopOpacity="1" /><Stop offset="0.55" stopColor={c[1]} stopOpacity="1" /><Stop offset="0.8" stopColor={c[2]} stopOpacity="1" /><Stop offset="1" stopColor={c[2]} stopOpacity="0" />
          </SvgGrad>
        ))}
      </Defs>
      {LAYERS.map((L, i) => d[i] ? (
        <React.Fragment key={i}>
          <Path d={d[i]} stroke={'url(#' + gid[L.g] + ')'} strokeWidth={L.w * 5} strokeOpacity={0.16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d={d[i]} stroke={'url(#' + gid[L.g] + ')'} strokeWidth={L.w} strokeOpacity={L.o} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </React.Fragment>
      ) : null)}
    </Svg>
  );
}

// The Assistant by voice. It talks to the same Assistant as the chat screen (chat.current), so everything it can do by typing it can do by voice,
// and the whole talk is also kept in the chat afterwards.
export function VoiceAssistant({ visible, chat, onClose, onOpen }: { visible: boolean; chat: React.MutableRefObject<any>; onClose: () => void; onOpen: (route: string) => void }) {
  const packs = useLangPacks();
  const [phase, setPhase] = useState<Phase>('idle');
  const [heard, setHeard] = useState(''); const [reply, setReply] = useState(''); const [err, setErr] = useState('');
  const [vk, setVk] = useState('en'); const vkR = useRef('en');
  const [sheet, setSheet] = useState(false); const [vopts, setVopts] = useState<VoiceOpt[]>([]); const [pref, setPref] = useState(voicePref());
  const [note, setNote] = useState('');
  const live = useRef(false); const stopL = useRef<() => void>(() => {}); const quiet = useRef(0); const pause = useRef(false);
  const C = () => chat.current;
  const vl = () => vlang(vkR.current);
  const isX = () => vl().x;
  const msUi = () => vkR.current === 'ms' || vkR.current === 'mix' || (!isX() && !!C() && !!C().state && C().state.lang === 'ms');
  const L = (en: string, ms: string) => (msUi() ? ms : en);
  // The tag the Assistant speaks with: English or Malay follows the language of the answer, any other language is the chosen one.
  const outTag = () => (isX() ? vl().tag : (C() && C().state && C().state.lang === 'ms' ? 'ms-MY' : 'en-US'));
  const tr = async (en: string, ms: string) => { if (!isX()) return L(en, ms); try { return await xlText(en, 'en', vkR.current); } catch (e) { return en; } };
  const { width: sw } = useWindowDimensions();
  const amp = useRef(new Animated.Value(0.08)).current; const ampT = useRef(0.1);
  const glow = useRef(new Animated.Value(0)).current;
  const setAmp = (v: number, ms = 220) => { ampT.current = v; Animated.timing(amp, { toValue: v, duration: ms, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(); };

  useEffect(() => {
    if (!visible) return;
    live.current = true; quiet.current = 0; pause.current = false; if (C()) C().voice = true; setSheet(false);
    const start = voicePref().lang || (C() && C().state && C().state.lang === 'ms' ? 'ms' : 'en');
    pickLang(start, true);
    setHeard(''); setReply(''); setErr(''); setPhase('idle'); setNote('');
    begin();
    return () => { live.current = false; if (C()) C().voice = false; stopL.current(); stopSpeaking(); };
  }, [visible]);
  useEffect(() => {
    setAmp(phase === 'speaking' ? 0.6 : phase === 'thinking' ? 0.3 : phase === 'listening' ? 0.22 : 0.12, 320);
    const a = Animated.loop(Animated.sequence([Animated.timing(glow, { toValue: 1, duration: phase === 'idle' ? 2600 : 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(glow, { toValue: 0, duration: phase === 'idle' ? 2600 : 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true })]));
    a.start();
    // The orb and the wave follow the voice: the Assistant's own speech gives a natural pulse, thinking is a slow breath.
    const iv = phase === 'speaking' ? setInterval(() => setAmp(0.3 + Math.random() * 0.55, 160), 170) : phase === 'thinking' ? setInterval(() => setAmp(ampT.current > 0.3 ? 0.2 : 0.42, 800), 900) : null;
    return () => { a.stop(); if (iv) clearInterval(iv); };
  }, [phase]);

  const errText = (c: string) => {
    if (c === 'not-allowed') return L('Allow the microphone for My Life 1.0 in your phone settings.', 'Benarkan mikrofon untuk My Life 1.0 dalam tetapan telefon.');
    if (c === 'language-not-supported' || c === 'service-not-allowed') return L('Speech recognition is not available for this language on your phone. Try getting the offline speech pack in the settings.', 'Pengecaman suara tiada untuk bahasa ini pada telefon awak. Cuba muat turun pek suara luar talian dalam tetapan.');
    if (c === 'network') return L('No internet for speech recognition. Connect and try again.', 'Tiada internet untuk pengecaman suara. Sambung internet dan cuba lagi.');
    return L('I could not hear you. Try again.', 'Saya tak dengar awak. Cuba lagi.');
  };
  const begin = async () => {
    setErr('');
    if (!(await micAllowed())) { if (live.current) { setErr(errText('not-allowed')); setPhase('idle'); } return; }
    if (isX() && !packs.ready(vkR.current)) { setErr(L('Download the ' + vl().name + ' language pack first (settings, top right).', 'Muat turun pek bahasa ' + vl().name + ' dahulu (tetapan, kanan atas).')); setSheet(true); setPhase('idle'); return; }
    listenOnce();
  };
  const listenOnce = () => {
    if (!live.current) return;
    setPhase('listening'); setHeard('');
    let final = ''; let fatal = false;
    stopL.current = listen(vl().tag, {
      onPartial: (t) => setHeard(t),
      onFinal: (t) => { final = t; },
      onLevel: (v) => setAmp(0.18 + v * 0.82, 90),
      onError: (c) => { fatal = true; setErr(errText(c)); },
      onEnd: () => {
        if (!live.current) return;
        if (pause.current || fatal) { pause.current = false; setPhase('idle'); return; }
        if (final) { quiet.current = 0; handle(final); return; }
        quiet.current += 1;
        if (quiet.current >= 2) setPhase('idle'); else listenOnce();
      },
    }, vkR.current === 'mix');
  };
  const say = (text: string, after: () => void) => {
    setReply(text); setPhase('speaking');
    speak(text, outTag(), () => { if (live.current) after(); });
  };
  const again = () => listenOnce();
  const handle = async (text: string) => {
    const c = C(); if (!c) { setPhase('idle'); return; }
    setHeard(text); setPhase('thinking');
    let probe = text;
    if (isX()) { try { probe = await xlText(text, vkR.current, 'en'); } catch (e) { probe = text; } }
    if (!live.current) return;
    const pending = !!(c.state && c.state.pending);
    const cmd = voiceCommand(probe, pending);
    if (cmd && cmd.kind === 'stop') { say(await tr('Okay. Talk to me any time.', 'Baik. Panggil saya bila-bila masa.'), onClose); return; }
    if (cmd && cmd.kind === 'open') { say(await tr('Opening ' + cmd.name + '.', 'Membuka ' + cmd.name + '.'), () => onOpen(cmd.route)); return; }
    if (cmd && cmd.kind === 'openFail') { say(await tr('I could not find a page called ' + cmd.target + '.', 'Saya tak jumpa halaman ' + cmd.target + '.'), again); return; }
    setReply('');
    const before = (c.state.msgs || []).length;
    if (cmd && cmd.kind === 'yes') c.confirm(true); else if (cmd && cmd.kind === 'no') c.confirm(false); else if (isX()) c.askX(text, vkR.current); else c.ask(text);
    const t0 = Date.now();
    const wait = async () => {
      if (!live.current) return;
      const s = c.state || {}; const ms = s.msgs || [];
      const last = ms[ms.length - 1];
      if (ms.length > before && last && !last.me && !s.typing) { answer(last, s); return; }
      if (Date.now() - t0 > 45000) { say(await tr('Sorry, that took too long.', 'Maaf, ia ambil masa terlalu lama.'), again); return; }
      setTimeout(wait, 250);
    };
    setTimeout(wait, 400);
  };
  const answer = async (m: any, s: any) => {
    const online = m.src === 'online';
    const text = String(m.text || '').replace(/\n\n\((An AI answer|Online AI answer|Jawapan AI)[\s\S]*$/, '').trim();
    const askSave = !!(s.pending && m.pid && s.pending.id === m.pid);
    const prompt = askSave ? await tr('Shall I save it? Say yes or no.', 'Nak simpan? Cakap ya atau tidak.') : '';
    const tag = await tr('Online AI: your question was sent over the internet.', 'AI dalam talian: soalan awak dihantar melalui internet.');
    setReply(text + (online ? '\n\n' + tag : '') + (askSave ? '\n\n' + prompt : '')); setPhase('speaking');
    speak(text, outTag(), () => {
      if (!live.current) return;
      if (askSave) speak(prompt, outTag(), () => { if (live.current) listenOnce(); }); else listenOnce();
    });
  };
  const tapMic = () => {
    if (phase === 'idle') { quiet.current = 0; begin(); }
    else if (phase === 'listening') { pause.current = true; stopL.current(); }
    else if (phase === 'speaking') { stopSpeaking(); }
  };
  const pickLang = (k: string, silent = false) => {
    vkR.current = k; setVk(k);
    const l = vlang(k);
    if (!silent) { stopSpeaking(); setVoicePref({ lang: k }); }
    if (C()) C().setState({ lang: k === 'ms' || k === 'mix' ? 'ms' : 'en' });
    voicesFor(l.tag).then(setVopts);
  };
  const choosePack = async (k: string) => {
    if (packs.ready(k)) { pickLang(k); setNote(''); return; }
    setNote(L('Downloading the language pack (about 30 MB, once). Keep the internet on.', 'Memuat turun pek bahasa (lebih kurang 30 MB, sekali sahaja). Biar internet hidup.'));
    const ok = await packs.get(k);
    if (ok) { pickLang(k); setNote(L('Ready. You can talk in ' + vlang(k).name + ' now.', 'Siap. Awak boleh bercakap dalam ' + vlang(k).name + ' sekarang.')); } else setNote(L('Could not download. Check the internet and try again.', 'Tak dapat muat turun. Semak internet dan cuba lagi.'));
  };
  const setP = (p: any) => { setVoicePref(p); setPref(voicePref()); };
  const choose = (id: string) => { setP({ v: { ...voicePref().v, [vl().tag]: id } }); sample(vl().tag, id); };
  const tune = (k: 'rate' | 'pitch', v: number) => { setP({ [k]: v }); sample(vl().tag); };
  const openSheet = () => { setPref(voicePref()); voicesFor(vl().tag).then(setVopts); setNote(''); setSheet(true); };

  const ms = msUi();
  const lg = vl();
  const status = phase === 'listening' ? L('Listening…', 'Saya mendengar…') : phase === 'thinking' ? L('Thinking…', 'Sedang fikir…') : phase === 'speaking' ? L('Speaking…', 'Bercakap…') : L('Tap the microphone to talk', 'Tekan mikrofon untuk bercakap');
  const tries = ms ? ['"belanja makan 12 ringgit"', '"buka akaun"', '"apa pendapat awak pasal menyimpan dulu?"'] : ['"spent 12 ringgit on lunch"', '"open My Accounts"', '"what do you think about saving first?"'];
  const chip = (on: boolean) => ({ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: on ? '#b794ff' : 'rgba(255,255,255,.25)', backgroundColor: on ? 'rgba(183,148,255,.35)' : 'rgba(255,255,255,.06)' } as const);
  const box = { marginTop: 12, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.06)' } as const;
  const lab = { color: 'rgba(255,255,255,.75)', fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6 } as const;
  const gear = (
    <Svg width={20} height={20} viewBox="0 0 24 24"><Circle cx="12" cy="12" r="3" {...stroke} /><Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" {...stroke} /></Svg>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => (sheet ? setSheet(false) : onClose())}>
      <View style={{ flex: 1, backgroundColor: '#070a22' }}>
        <LinearGradient colors={['#070a22', '#150d3e', '#0a2848']} locations={[0, 0.5, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <Blob size={320} color="rgba(183,148,255,.5)" style={{ right: -100, top: -40 }} />
        <Blob size={340} color="rgba(94,231,223,.3)" style={{ left: -120, bottom: 80 }} />
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={onClose} accessibilityLabel="Close">
              <Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <View><Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M6 9l6 6 6-6" {...stroke} /></Svg></View>
              </Glass>
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800', letterSpacing: 0.3 }}>{NAME}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: phase === 'idle' ? 'rgba(255,255,255,.4)' : '#5ee7df' }} />
                <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, fontWeight: '600' }}>{(lg.x ? flagOf(lg.key) + ' ' : '') + lg.native}</Text>
              </View>
            </View>
            <Pressable onPress={() => (sheet ? setSheet(false) : openSheet())} accessibilityLabel="Voice settings">
              <Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><View>{gear}</View></Glass>
            </Pressable>
          </View>

          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <View style={{ width: 150, height: 150, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: phase === 'listening' ? 'rgba(255,143,171,.30)' : 'rgba(124,156,255,.28)', opacity: amp.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.95] }), transform: [{ scale: amp.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }] }} />
              <Animated.View style={{ transform: [{ scale: Animated.add(amp.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.14] }), glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.03] })) }] }}><OrbLive size={104} /></Animated.View>
            </View>
            <View style={{ marginTop: 2, marginHorizontal: -20 }}><Wave target={ampT} width={sw} /></View>
            <Text style={{ color: 'rgba(255,255,255,.9)', fontSize: 15, fontWeight: '700' }}>{status}</Text>
          </View>

          <ScrollView style={{ flex: 1, marginTop: 12 }} contentContainerStyle={{ gap: 12, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
            {heard ? <Text style={{ color: '#fff', fontSize: 20, lineHeight: 28, textAlign: 'center', fontWeight: '600' }}>{'“' + heard + '”'}</Text> : null}
            {reply ? <Glass radius={22} style={{ paddingVertical: 14, paddingHorizontal: 16 }}><Text style={{ color: '#fff', fontSize: 14.5, lineHeight: 22 }}>{reply}</Text></Glass> : null}
            {err ? <Text style={{ color: '#ffb3a0', fontSize: 13, lineHeight: 19, textAlign: 'center' }}>{err}</Text> : null}
            {!heard && !reply && !err ? (
              <View style={{ gap: 8, alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5 }}>{L('Try saying or just chat:', 'Cuba sebut atau bersembang:')}</Text>
                {tries.map((t) => <Text key={t} style={{ color: 'rgba(255,255,255,.9)', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>{t}</Text>)}
              </View>
            ) : null}
          </ScrollView>

          <View style={{ alignItems: 'center', paddingBottom: 6 }}>
            <View style={{ width: 92, height: 92, alignItems: 'center', justifyContent: 'center' }}>
              {phase === 'listening' ? <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 92, height: 92, borderRadius: 46, backgroundColor: 'rgba(124,156,255,.45)', opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.7] }), transform: [{ scale: amp.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.4] }) }] }} /> : null}
              <Pressable onPress={tapMic} buzz accessibilityLabel={phase === 'listening' ? 'Stop listening' : 'Start listening'}>
                <LinearGradient colors={phase === 'listening' ? ['#ff8fab', '#ffb36b'] : ['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' }}>
                  {phase === 'listening' ? <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#fff' }} /> : (
                    <Svg width={32} height={32} viewBox="0 0 24 24"><Path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3" {...stroke} /></Svg>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
            <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 8, paddingHorizontal: 10 }}>{L('Your voice is turned into text by your phone\'s speech service (Google on most phones). My Life 1.0 does not keep any recording.', 'Suara awak ditukar kepada teks oleh perkhidmatan suara telefon (Google pada kebanyakan telefon). My Life 1.0 tidak menyimpan rakaman.')}</Text>
          </View>
        </SafeAreaView>

        {sheet ? (
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
            <Pressable onPress={() => setSheet(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.45)' }}><View style={{ flex: 1 }} /></Pressable>
            <View style={{ maxHeight: '78%', borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#17154a', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ flex: 1, color: '#fff', fontSize: 17, fontWeight: '800' }}>{L('Voice settings', 'Tetapan suara')}</Text>
                <Pressable onPress={() => setSheet(false)} accessibilityLabel="Close settings"><View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.12)' }}><Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M6 6l12 12M18 6L6 18" {...stroke} /></Svg></View></Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
                <View style={box}>
                  <Text style={lab}>{L('LANGUAGE', 'BAHASA')}</Text>
                  <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, lineHeight: 16, marginTop: 4 }}>{L('English and Bahasa Malaysia work right away. Other languages need a language pack on your phone (about 30 MB, downloaded once).', 'English dan Bahasa Malaysia terus boleh guna. Bahasa lain perlukan pek bahasa dalam telefon (lebih kurang 30 MB, muat turun sekali).')}</Text>
                  <View style={{ marginTop: 8, gap: 6 }}>
                    {VLANGS.map((l) => { const on = vk === l.key; const ready = !l.x || packs.ready(l.key); const busy = packs.busy === l.key; return (
                      <Pressable key={l.key} onPress={() => (l.x ? choosePack(l.key) : pickLang(l.key))}>
                        <View style={{ ...chip(on), flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 16, width: 28 }}>{l.x ? flagOf(l.key) : l.key === 'en' ? '🇬🇧' : '🇲🇾'}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#fff', fontSize: 13.5, fontWeight: on ? '800' : '600', textAlign: 'left', writingDirection: 'ltr' }}>{l.native}</Text>
                            {l.x && l.name !== l.native ? <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11 }}>{l.name}</Text> : null}
                          </View>
                          <Text style={{ color: on ? '#fff' : ready ? '#8fe9e2' : '#ffd479', fontSize: 11.5, fontWeight: '800' }}>{busy ? L('Downloading…', 'Memuat turun…') : on ? L('In use', 'Digunakan') : ready ? (l.x ? L('Ready', 'Sedia') : '') : L('Download', 'Muat turun')}</Text>
                        </View>
                      </Pressable>); })}
                  </View>
                  {note ? <Text style={{ color: '#8fe9e2', fontSize: 12, lineHeight: 17, marginTop: 8 }}>{note}</Text> : null}
                  {lg.x ? <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, lineHeight: 16, marginTop: 8 }}>{L('For ' + lg.name + ', your words are translated on your phone, the Assistant answers, and the answer is translated back. Nothing extra is sent to our server.', 'Untuk ' + lg.name + ', kata awak diterjemah dalam telefon, Assistant menjawab, dan jawapan diterjemah semula. Tiada tambahan dihantar ke pelayan kami.')}</Text> : null}
                  <Pressable onPress={async () => { const r = await speechPack(lg.tag); setNote(r === 'none' ? L('Your phone does not offer an offline speech pack. Online speech recognition still works.', 'Telefon awak tak sediakan pek suara luar talian. Pengecaman suara dalam talian masih berfungsi.') : L('Your phone is getting the offline speech pack for ' + lg.name + '.', 'Telefon awak sedang mendapatkan pek suara luar talian untuk ' + lg.name + '.')); }}>
                    <View style={{ ...chip(false), marginTop: 10, alignSelf: 'flex-start' }}><Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{L('Get offline speech pack', 'Muat turun pek suara luar talian')}</Text></View>
                  </Pressable>
                </View>

                <View style={box}>
                  <Text style={lab}>{L('VOICE', 'SUARA')}</Text>
                  {vopts.length ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {vopts.map((o) => { const on = pref.v[lg.tag] === o.id; return (
                        <Pressable key={o.id} onPress={() => choose(o.id)}><View style={chip(on)}><Text style={{ color: '#fff', fontSize: 12.5, fontWeight: on ? '800' : '600' }}>{o.label + (o.gender === 'female' ? (ms ? ' · perempuan' : ' · female') : o.gender === 'male' ? (ms ? ' · lelaki' : ' · male') : '')}</Text></View></Pressable>); })}
                    </View>
                  ) : <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, lineHeight: 18, marginTop: 8 }}>{L('No voice list for this language on your phone. Use Tone below, or install the language in phone Settings > General management > Text-to-speech.', 'Tiada senarai suara untuk bahasa ini pada telefon. Guna Tona di bawah, atau pasang bahasa itu di Tetapan telefon > Pengurusan am > Teks ke pertuturan.')}</Text>}
                  <Text style={{ ...lab, marginTop: 14 }}>{L('TONE', 'TONA')}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {([[L('Male (deep)', 'Lelaki (dalam)'), 0.7], [L('Normal', 'Biasa'), 1], [L('Female (high)', 'Perempuan (halus)'), 1.35]] as [string, number][]).map(([t, v]) => (
                      <Pressable key={t} onPress={() => tune('pitch', v)}><View style={chip(Math.abs(pref.pitch - v) < 0.05)}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{t}</Text></View></Pressable>))}
                  </View>
                  <Text style={{ ...lab, marginTop: 14 }}>{L('SPEED', 'KELAJUAN')}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    {([[L('Slow', 'Perlahan'), 0.8], [L('Normal', 'Biasa'), 1], [L('Fast', 'Laju'), 1.25]] as [string, number][]).map(([t, v]) => (
                      <Pressable key={t} onPress={() => tune('rate', v)}><View style={chip(Math.abs(pref.rate - v) < 0.05)}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{t}</Text></View></Pressable>))}
                  </View>
                  <Text style={{ ...lab, marginTop: 14 }}>{L('READ ANSWERS ALOUD', 'BACA JAWAPAN DENGAN SUARA')}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    {([[L('On', 'Hidup'), true], [L('Off', 'Mati'), false]] as [string, boolean][]).map(([t, v]) => (
                      <Pressable key={t} onPress={() => setP({ talk: v })} buzz><View style={chip(pref.talk === v)}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{t}</Text></View></Pressable>))}
                  </View>
                </View>

                <View style={box}>
                  <Text style={lab}>{L('HOW LONG IT WAITS WHEN YOU PAUSE', 'BERAPA LAMA IA TUNGGU BILA AWAK BERHENTI')}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    {([[L('Short', 'Pendek'), 1800], [L('Normal', 'Biasa'), 2600], [L('Long', 'Panjang'), 3800]] as [string, number][]).map(([t, v]) => (
                      <Pressable key={t} onPress={() => setP({ pause: v })}><View style={chip(pref.pause === v)}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{t}</Text></View></Pressable>))}
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, lineHeight: 16, marginTop: 10 }}>{L('These choices are kept on this phone only.', 'Pilihan ini disimpan dalam telefon ini sahaja.')}</Text>
                </View>
              </ScrollView>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
