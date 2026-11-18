import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, ScrollView, Pressable, TextInput, Platform, Linking, AppState, PermissionsAndroid } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Glass } from '../components/Glass';
import { useStored } from '../lib/store';
import { GlowField } from '../components/Shine';
import { SearchIcon, CloseIcon } from '../components/AudioIcons';
import { Header, ReadBg } from '../components/IslamicUi';
import { W } from '../components/Ui';
import { SURAH, SURAH_LIST, QURAN_FONT } from '../lib/islamic';
import { locate, Found } from '../lib/hafazanFind';
import { expectedWords, checkRecitation, tajwidTips, closeNote, CheckResult, WResult } from '../lib/hafazan';
import { playVerse, playUri, stopVerse } from '../lib/hafazanPlay';
import { stop as stopQuranAudio } from '../lib/quranAudio';
import { asrSupported, useAsr, downloadModel, deleteModel, micPermission, startRecording, stopAndTranscribe, cancelRecording, micLevel, lastRecordingUri, MODEL_MB } from '../lib/hafazanAsr';

const TEAL = '#7df0c6';
const COL: Record<string, string> = { ok: '#7df0c6', close: '#ffd593', wrong: '#ff8fab', missing: '#ff8fab', pending: 'rgba(255,255,255,.35)' };

const Chip = ({ t, on, onPress }: { t: string; on: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} style={{ paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, backgroundColor: on ? 'rgba(94,231,181,.4)' : 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: on ? TEAL : 'rgba(255,255,255,.14)' }}>
    <Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{t}</Text>
  </Pressable>
);

// The microphone orb: soft rings that swell with the voice while recording.
const Orb = ({ rec, busy, lvl, onPress }: { rec: boolean; busy: boolean; lvl: number; onPress?: () => void }) => {
  const c = rec ? '#ff8fab' : TEAL;
  const r2 = 132 + (rec ? lvl * 30 : 0), r1 = 112 + (rec ? lvl * 16 : 0);
  return (
    <Pressable onPress={onPress} accessibilityLabel={rec ? 'Stop and check' : 'Start reciting'} style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: r2, height: r2, borderRadius: r2 / 2, backgroundColor: rec ? 'rgba(255,143,171,.10)' : 'rgba(125,240,198,.08)' }} />
      <View style={{ position: 'absolute', width: r1, height: r1, borderRadius: r1 / 2, backgroundColor: rec ? 'rgba(255,143,171,.18)' : 'rgba(125,240,198,.16)', borderWidth: 1, borderColor: rec ? 'rgba(255,143,171,.5)' : 'rgba(125,240,198,.45)' }} />
      <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: c, alignItems: 'center', justifyContent: 'center', opacity: busy && !rec ? 0.6 : 1, shadowColor: c, shadowOpacity: 0.6, shadowRadius: 16, elevation: 8 }}>
        {rec ? <View style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: '#3a0716' }} /> : <Text style={{ fontSize: 36 }}>🎙</Text>}
      </View>
    </Pressable>
  );
};

// Live voice bars while the person recites.
const Wave = ({ h }: { h: number[] }) => (
  <View style={{ height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
    {Array.from({ length: 32 }, (_, i) => { const v = h[h.length - 32 + i] || 0; return <View key={i} style={{ width: 4, height: 4 + Math.min(1, v * 1.6) * 28, borderRadius: 2, backgroundColor: 'rgba(255,143,171,' + (0.35 + Math.min(1, v) * 0.65) + ')' }} />; })}
  </View>
);

const Ring = ({ pct }: { pct: number }) => {
  const R = 40, C = 2 * Math.PI * R;
  const col = pct >= 85 ? '#7df0c6' : pct >= 50 ? '#ffd593' : '#ff8fab';
  return (
    <View style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={100} height={100} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={50} cy={50} r={R} stroke="rgba(255,255,255,.12)" strokeWidth={9} fill="none" />
        <Circle cx={50} cy={50} r={R} stroke={col} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - Math.max(0, Math.min(100, pct)) / 100)} />
      </Svg>
      <Text style={{ color: W, fontSize: 19, fontWeight: '800' }}>{pct + '%'}</Text>
    </View>
  );
};

const TR_OPTS: (string | number)[][] = [['off', 'No translation', 112], ['ms', 'BM', 56], ['en', 'English', 76]];
const trLeft = (i: number) => TR_OPTS.slice(0, i).reduce((a, o) => a + (o[2] as number), 3);
// Translation switch: the green pill slides between the choices
function TrBar({ tr, setTr, style }: { tr: string; setTr: (k: any) => void; style?: any }) {
  const idx = Math.max(0, TR_OPTS.findIndex((o) => o[0] === tr));
  const x = useRef(new Animated.Value(trLeft(idx))).current;
  const w = useRef(new Animated.Value(TR_OPTS[idx][2] as number)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(x, { toValue: trLeft(idx), duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(w, { toValue: TR_OPTS[idx][2] as number, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [idx]);
  return (
    <View style={[{ flexDirection: 'row', alignSelf: 'center', marginTop: 12, padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.22)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' }, style]}>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 3, bottom: 3, left: 0, width: w, transform: [{ translateX: x }], borderRadius: 999, backgroundColor: 'rgba(125,240,198,.3)', borderWidth: 1, borderColor: 'rgba(125,240,198,.5)' }} />
      {TR_OPTS.map(([k, t, wd]) => (
        <Pressable key={k as string} onPress={() => setTr(k)} style={{ width: wd as number, paddingVertical: 6, alignItems: 'center' }}><Text style={{ color: tr === k ? W : 'rgba(255,255,255,.65)', fontSize: 11.5, fontWeight: '700' }}>{t}</Text></Pressable>
      ))}
    </View>
  );
}
// Translation text that fades in whenever it changes
function FadeText({ text, style }: { text: string; style?: any }) {
  const o = useRef(new Animated.Value(1)).current;
  useEffect(() => { o.setValue(0); Animated.timing(o, { toValue: 1, duration: 320, useNativeDriver: false }).start(); }, [text]);
  return <Animated.Text style={[{ color: 'rgba(255,255,255,.8)', fontSize: 13, lineHeight: 19, textAlign: 'center' }, style, { opacity: o }]}>{text}</Animated.Text>;
}
const trText = (vs: { n: number; ms: string; en: string }[], tr: string, max = 6) => vs.slice(0, max).map((v) => (vs.length > 1 ? v.n + '. ' : '') + (tr === 'en' ? v.en : v.ms)).join('\n') + (vs.length > max ? '\n…' : '');
export default function Hafazan() {
  const asr = useAsr();
  const [sKey, setSKey] = useState(SURAH_LIST[0].key);
  const [from, setFrom] = useState('1');
  const [to, setTo] = useState('7');
  const [hide, setHide] = useState(true);
  const [mode, setMode] = useState<'test' | 'learn' | 'auto'>('test');
  const [found, setFound] = useState<Found | null>(null);
  const [ci, setCi] = useState(0);
  const [cur, setCur] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState('');
  const [rec, setRec] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [res, setRes] = useState<CheckResult | null>(null);
  const [heard, setHeard] = useState('');
  const [take, setTake] = useState<{ pcm: Float32Array; seconds: number; peak: number } | null>(null);
  const [hearing, setHearing] = useState(false);
  const [micAsk, setMicAsk] = useState(false);
  const [lvl, setLvl] = useState(0);
  const [hist, setHist] = useState<number[]>([]);
  const [showPick, setShowPick] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [tr, setTr] = useStored<'off' | 'ms' | 'en'>('ml_hz_tr', 'ms');
  const [pick, setPick] = useState('');
  const [pf, setPf] = useState(false);
  const [open, setOpen] = useState<number>(-1);
  const timer = useRef<any>(null);

  const s = SURAH[sKey];
  const total = s ? s.verses.length : 0;
  const a = Math.max(1, Math.min(total, parseInt(from, 10) || 1));
  const b = Math.max(a, Math.min(total, parseInt(to, 10) || a));
  const words: { word: string; verse: number }[] = [];
  if (s) s.verses.filter((v) => v.n >= a && v.n <= b).forEach((v) => expectedWords(v.ar).forEach((w) => words.push({ word: w, verse: v.n })));

  useEffect(() => { if (rec) { timer.current = setInterval(() => { const l = micLevel(); setLvl(l); setHist((h) => [...h.slice(-31), l]); }, 110); } else { setHist([]); } return () => { if (timer.current) clearInterval(timer.current); }; }, [rec]);
  useEffect(() => () => { cancelRecording(); stopVerse(); }, []);
  useEffect(() => { setRes(null); setHeard(''); setMsg(''); setOpen(-1); setCur(a); stopVerse(); setPlaying(false); setFound(null); }, [sKey, from, to]);

  const listen = async () => {
    if (!s || playing || rec) return;
    setMsg(''); setPlaying(true);
    try { stopQuranAudio(); } catch (e) { /* ignore */ }
    const ok = await playVerse(s.num, cur);
    setPlaying(false);
    if (!ok) setMsg('Could not play the verse. Check your internet and try again.');
  };
  // After the person allows the microphone in the phone settings and comes back, clear the warning by itself.
  useEffect(() => {
    if (!micAsk && !(msg && msg.startsWith('Microphone permission'))) return;
    const sub = AppState.addEventListener('change', async (st) => {
      if (st !== 'active') return;
      try { if (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)) { setMicAsk(false); setMsg('Microphone is allowed now. Tap the microphone to start.'); }; } catch (e) { /* ignore */ }
    });
    return () => sub.remove();
  }, [msg, micAsk]);
  const start = async () => {
    stopVerse(); setPlaying(false);
    // First time: say what will happen, and keep the phone settings one tap away in case the phone's own box does not react.
    if (!micAsk) { try { if (!(await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO))) { setMsg(''); setMicAsk(true); return; } } catch (e) { /* ask below */ } }
    setMicAsk(false);
    setMsg(''); setRes(null); setOpen(-1); setBusy(true); setStep('Asking for microphone permission…');
    try {
      if (!(await micPermission())) { setMsg('Microphone permission is needed to listen to your recitation. Tap the button below, open Permissions, choose Microphone and select Allow only while using the app. If the permission box does not react to your taps, stop any screen recording or floating bubble first (the phone blocks taps on that box while another app draws over it).'); return; }
      setStep('Starting the microphone…');
      await startRecording(); setRec(true);
    } catch (e: any) { setMsg(String((e && e.message) || 'Could not start the microphone.')); }
    finally { setBusy(false); setStep(''); }
  };
  const stop = async () => {
    setRec(false); setBusy(true);
    try {
      const h = await stopAndTranscribe();
      setTake({ pcm: h.pcm, seconds: h.seconds, peak: h.peak });
      if (!h.text) { setMsg(h.seconds < 0.8 ? 'That was too short. Tap the microphone and recite.' : (h.bad ? 'The model could not make out the recitation (recorded ' + Math.round(h.seconds) + ' s, voice level ' + Math.round(Math.min(1, h.peak) * 100) + '%). Hold the phone closer, recite one or two verses at a time, in a quiet place, and try again.' : 'Nothing was heard clearly. Move closer to the microphone and try again in a quiet place.')); setBusy(false); return; }
      setHeard(h.text);
      if (mode === 'auto') {
        const f = locate(h.text, SURAH_LIST.map((x) => ({ key: x.key, num: x.num, title: x.title, verses: SURAH[x.key].verses })));
        if (!f.ok) { setMsg(f.reason === 'short' ? 'Please recite a little longer (at least one full verse) so the app can find where it is from.' : 'The app could not find these verses. Try again closer to the microphone, or choose the surah yourself in Test myself.'); setBusy(false); return; }
        setFound(f); setCi(0); setRes(f.cands[0].res); setBusy(false); return;
      }
      const r = checkRecitation(mode === 'learn' ? words.filter((w) => w.verse === cur) : words, h.text);
      setRes(r);
      if (r.reached > 0 && r.reached < r.total * 0.3) setMsg('Only a small part was recognised. If you did recite the verses, try again closer to the microphone.');
    } catch (e: any) { setMsg('Could not check the recitation. ' + String((e && e.message) || '')); }
    setBusy(false);
  };

  const hearTake = async () => {
    if (!take || hearing) return;
    setHearing(true);
    try { stopVerse(); const uri = await lastRecordingUri(take.pcm); await playUri(uri); } catch (e) { setMsg('Could not play your recording.'); }
    setHearing(false);
  };
  const takeRow = take && take.seconds >= 0.8 ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
      <Pressable onPress={hearTake} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>{hearing ? '▶  Playing…' : '▶  Hear my recording'}</Text></Pressable>
      <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5 }}>{'Recorded ' + Math.round(take.seconds) + ' s · voice level ' + Math.round(Math.min(1, take.peak) * 100) + '%'}</Text>
    </View>
  ) : null;
  const mist = res ? res.words.filter((w) => w.status === 'wrong' || w.status === 'missing' || w.status === 'close') : [];
  const chooseSurah = (k: string) => { setSKey(k); setFrom('1'); setTo(String(SURAH[k].verses.length)); setPick(''); setShowPick(false); };
  const list = SURAH_LIST.filter((x) => { const t = pick.trim().toLowerCase(); return !t || x.title.toLowerCase().includes(t) || String(x.num) === t; }).slice(0, 8);

  const cnt = (k: string) => (res ? res.words.filter((w) => w.status === k).length : 0);
  const cv = s ? s.verses.find((v) => v.n === cur) : undefined;
  const sInfo = SURAH_LIST.find((x) => x.key === sKey);
  const stepIdx = playing ? 0 : rec || busy ? 1 : res ? 2 : 0;
  const status = step ? step : busy ? (asr.phase === 'loading' ? 'Loading the model, then checking…' : 'Checking…') : rec ? 'Listening… tap to stop and check' : playing ? 'Listen carefully…' : 'Tap the microphone to recite';
  const setBtn = (label: string, onPress: () => void) => (
    <Pressable onPress={onPress} style={{ alignSelf: 'center', marginTop: 10, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: 'rgba(125,240,198,.2)', borderWidth: 1, borderColor: 'rgba(125,240,198,.5)' }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>{label}</Text></Pressable>
  );
  const askBlock = micAsk && !msg ? (
    <View style={{ alignSelf: 'stretch', marginTop: 10, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
      <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>Allow the microphone</Text>
      <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>The app needs the microphone to hear your recitation. The recording stays on this phone. Choose "While using the app" when the phone asks. If the phone's box does not react to your taps, use the second button.</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <Pressable onPress={start} style={{ flex: 1, height: 42, borderRadius: 21, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#06241d', fontSize: 13, fontWeight: '800' }}>Allow now</Text></Pressable>
        <Pressable onPress={() => { try { Linking.openSettings(); } catch (e) { /* ignore */ } }} style={{ flex: 1, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>Open phone settings</Text></Pressable>
      </View>
    </View>
  ) : null;
  const msgBlock = msg ? (
    <View style={{ alignSelf: 'stretch', marginTop: 10 }}>
      <Text style={{ color: '#ffd593', fontSize: 12.5, lineHeight: 19, textAlign: 'center' }}>{msg}</Text>
      {msg.startsWith('Microphone permission') ? setBtn('Open phone settings', () => { try { Linking.openSettings(); } catch (e) { /* ignore */ } }) : null}
    </View>
  ) : null;
  const tabs: [typeof mode, string, string][] = [['learn', '📖', 'Learn'], ['test', '📝', 'Test'], ['auto', '🔎', 'Find']];
  const pickMode = (m: typeof mode) => { setMode(m); setRes(null); setFound(null); setMsg(''); if (m === 'learn') setCur(a); else { stopVerse(); setPlaying(false); } };

  return (
    <View style={{ flex: 1 }}>
      <ReadBg />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header title="Hafazan Check" sub="Test your memorisation" />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80, gap: 16 }} keyboardShouldPersistTaps="handled">
          {!asrSupported ? (
            <Glass radius={22} style={{ padding: 16 }}><Text style={{ color: W, fontSize: 14, lineHeight: 21 }}>Hafazan Check listens through the phone microphone and works on the Android app.</Text></Glass>
          ) : asr.phase === 'none' || asr.phase === 'error' || asr.phase === 'downloading' ? (
            <Glass radius={28} style={{ padding: 20, alignItems: 'center' }}>
              <View style={{ width: 74, height: 74, borderRadius: 37, backgroundColor: 'rgba(125,240,198,.16)', borderWidth: 1, borderColor: 'rgba(125,240,198,.5)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 32 }}>🎧</Text></View>
              <Text style={{ color: TEAL, fontSize: 11, fontWeight: '800', letterSpacing: 1.3, marginTop: 14 }}>ONE-TIME SETUP</Text>
              <Text style={{ color: W, fontSize: 17, fontWeight: '800', marginTop: 6, textAlign: 'center' }}>Download the Quran listening model</Text>
              <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center' }}>{'Everything below is unlocked after one download. Use Wi-Fi if you can.'}</Text>
              <View style={{ alignSelf: 'stretch', marginTop: 14, padding: 14, borderRadius: 18, backgroundColor: 'rgba(0,0,0,.2)', gap: 10 }}>
                <Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>What you can do in Hafazan Check</Text>
                {[
                  ['📖', 'Learn', 'The app plays a verse, you repeat it, and the app tells you which words to fix. Go verse by verse.'],
                  ['📝', 'Test', 'Recite a surah or a range of verses from memory, with the text hidden. The app marks the words that were correct, close or wrong.'],
                  ['🔎', 'Find', 'Recite any verses you know. The app finds the surah and the verse by itself, then checks your words.'],
                ].map(([ic, h, t]) => (
                  <View key={h} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 20 }}>{ic}</Text>
                    <Text style={{ flex: 1, color: 'rgba(255,255,255,.82)', fontSize: 12.5, lineHeight: 18 }}><Text style={{ color: W, fontWeight: '800' }}>{h + ': '}</Text>{t}</Text>
                  </View>
                ))}
                <Text style={{ color: '#ffd593', fontSize: 12, lineHeight: 17 }}>It checks the words you say. It cannot judge tajwid or harakat, so keep learning with a teacher.</Text>
              </View>
              <View style={{ alignSelf: 'stretch', marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: 'rgba(0,0,0,.2)', gap: 8 }}>
                <Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>What will be downloaded</Text>
                {[
                  ['1 file only', 'The Quran listening model (' + MODEL_MB + ' MB). It is a speech model for Arabic recitation, based on OpenAI Whisper and tuned for the Quran by Tarteel AI (open licence).'],
                  ['From where', 'This app\'s own GitHub page. After this it is saved inside the app and works offline.'],
                  ['Your voice', 'Recorded and checked on this phone only. It is never uploaded.'],
                  ['Still needs internet', 'The Listen button in Learn mode plays the verse recording online (Mishary Alafasy), so it uses a little data each time.'],
                  ['Remove anytime', 'After downloading, the link at the bottom of Hafazan Check deletes the model and frees the space.'],
                ].map(([h, t]) => (
                  <View key={h} style={{ flexDirection: 'row', gap: 8 }}>
                    <Text style={{ color: TEAL, fontSize: 13, fontWeight: '800' }}>•</Text>
                    <Text style={{ flex: 1, color: 'rgba(255,255,255,.82)', fontSize: 12.5, lineHeight: 18 }}><Text style={{ color: W, fontWeight: '800' }}>{h + ': '}</Text>{t}</Text>
                  </View>
                ))}
              </View>
              {asr.phase === 'downloading' ? (
                <View style={{ marginTop: 16, alignSelf: 'stretch' }}>
                  <View style={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,.14)', overflow: 'hidden' }}><View style={{ width: Math.round(asr.pct * 100) + '%', height: 10, backgroundColor: TEAL }} /></View>
                  <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, marginTop: 6, textAlign: 'center' }}>{'Downloading ' + Math.round(asr.pct * 100) + '%'}</Text>
                </View>
              ) : (
                <Pressable onPress={downloadModel} style={{ marginTop: 16, alignSelf: 'stretch', height: 50, borderRadius: 25, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#06241d', fontSize: 15, fontWeight: '800' }}>{'Download (' + MODEL_MB + ' MB)'}</Text></Pressable>
              )}
              {asr.phase === 'error' ? <Text style={{ color: '#ff8fab', fontSize: 12.5, marginTop: 10, lineHeight: 18, textAlign: 'center' }}>{asr.err}</Text> : null}
            </Glass>
          ) : (<>
            {/* three ways to practise */}
            <View style={{ flexDirection: 'row', padding: 5, borderRadius: 24, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', gap: 4 }}>
              {tabs.map(([m, ic, t]) => (
                <Pressable key={m} onPress={() => pickMode(m)} style={{ flex: 1, paddingVertical: 10, borderRadius: 19, alignItems: 'center', backgroundColor: mode === m ? 'rgba(94,231,181,.38)' : 'transparent', borderWidth: 1, borderColor: mode === m ? TEAL : 'transparent' }}>
                  <Text style={{ fontSize: 18 }}>{ic}</Text>
                  <Text style={{ color: W, fontSize: 12.5, fontWeight: mode === m ? '800' : '600', marginTop: 2 }}>{t}</Text>
                </Pressable>
              ))}
            </View>

            {/* what to recite */}
            {mode !== 'auto' ? (
              <View>
                <Pressable onPress={() => setShowPick(!showPick)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 22, backgroundColor: showPick ? 'rgba(125,240,198,.14)' : 'rgba(255,255,255,.08)', borderWidth: 1.2, borderColor: showPick ? 'rgba(125,240,198,.65)' : 'rgba(125,240,198,.35)' }}>
                  <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(125,240,198,.2)', borderWidth: 1, borderColor: 'rgba(125,240,198,.5)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{s ? s.num : ''}</Text></View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: W, fontSize: 15, fontWeight: '800' }} numberOfLines={1}>{s ? s.title : ''}</Text>
                    <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>{'Verses ' + a + (b > a ? ' – ' + b : '') + ' of ' + total}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={{ color: W, fontSize: 20, lineHeight: 36, fontFamily: QURAN_FONT }}>{sInfo ? sInfo.ar : ''}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(125,240,198,.22)', borderWidth: 1, borderColor: 'rgba(125,240,198,.55)' }}>
                      <Text style={{ color: '#bff7e1', fontSize: 11.5, fontWeight: '800' }}>{showPick ? 'Close' : 'Change surah'}</Text>
                      <SearchIcon size={12} color="#bff7e1" />
                    </View>
                  </View>
                </Pressable>
                {showPick ? (
                  <Glass radius={22} style={{ padding: 14, marginTop: 10 }}>
                    <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, fontWeight: '800', letterSpacing: 1, marginBottom: 8 }}>CHOOSE A SURAH</Text>
                    <GlowField focused={pf}>
                      <SearchIcon size={18} color={pf ? '#7df0c6' : 'rgba(255,255,255,.6)'} />
                      <TextInput value={pick} onChangeText={setPick} onFocus={() => setPf(true)} onBlur={() => setPf(false)} placeholder="Search surah name or number" placeholderTextColor="rgba(255,255,255,.45)" style={{ flex: 1, color: W, fontSize: 14, paddingVertical: 11, outlineStyle: 'none' } as any} />
                      {pick ? <Pressable onPress={() => setPick('')} hitSlop={8} accessibilityLabel="Clear search"><CloseIcon size={16} color="rgba(255,255,255,.7)" /></Pressable> : null}
                    </GlowField>
                    {pick.trim() ? (
                      <View style={{ marginTop: 10, gap: 6 }}>
                        {list.length === 0 ? <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 12.5, paddingVertical: 6 }}>No surah found. Try another name or a number from 1 to 114.</Text> : null}
                        {list.map((x) => (
                          <Pressable key={x.key} onPress={() => chooseSurah(x.key)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' }}>
                            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(125,240,198,.18)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 12, fontWeight: '800' }}>{x.num}</Text></View>
                            <Text style={{ flex: 1, color: W, fontSize: 13.5, fontWeight: '700' }} numberOfLines={1}>{x.title}</Text>
                            <Text style={{ color: W, fontSize: 17, lineHeight: 34, fontFamily: QURAN_FONT }}>{x.ar}</Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : (
                      <View style={{ marginTop: 12 }}>
                        <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, marginBottom: 8 }}>Popular surahs</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {[[1, 'Al-Fatihah'], [36, 'Yasin'], [55, 'Ar-Rahman'], [56, "Al-Waqi'ah"], [67, 'Al-Mulk'], [112, 'Al-Ikhlas'], [113, 'Al-Falaq'], [114, 'An-Nas']].map(([n, t]) => {
                            const it = SURAH_LIST.find((x) => x.num === n);
                            return it ? <Pressable key={n as number} onPress={() => chooseSurah(it.key)} style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(125,240,198,.12)', borderWidth: 1, borderColor: 'rgba(125,240,198,.35)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{t as string}</Text></Pressable> : null;
                          })}
                        </View>
                      </View>
                    )}

                    <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,.1)', marginVertical: 14 }} />
                    <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, fontWeight: '800', letterSpacing: 1, marginBottom: 10 }}>WHICH VERSES</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      {[['From', from, setFrom, a], ['To', to, setTo, b]].map(([lab, val, set, cur]: any) => (
                        <View key={lab} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 18, backgroundColor: 'rgba(125,240,198,.08)', borderWidth: 1, borderColor: 'rgba(125,240,198,.28)' }}>
                          <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 11, fontWeight: '700' }}>{lab}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <Pressable onPress={() => set(String(Math.max(1, cur - 1)))} hitSlop={6} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 18, fontWeight: '700', lineHeight: 22 }}>−</Text></Pressable>
                            <TextInput value={val} onChangeText={(t) => set(t.replace(/\D/g, ''))} keyboardType="number-pad" style={{ width: 46, textAlign: 'center', color: W, fontSize: 18, fontWeight: '800', paddingVertical: 2 }} />
                            <Pressable onPress={() => set(String(Math.min(total, cur + 1)))} hitSlop={6} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 18, fontWeight: '700', lineHeight: 22 }}>+</Text></Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                      <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 12 }}>{'This surah has ' + total + ' verses'}</Text>
                      <Pressable onPress={() => { setFrom('1'); setTo(String(total)); }} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' }}><Text style={{ color: W, fontSize: 12, fontWeight: '700' }}>Whole surah</Text></Pressable>
                    </View>
                  </Glass>
                ) : null}
              </View>
            ) : null}

            {!res ? (<>
              {/* the mihrab: an arched frame that holds the verse */}
              <LinearGradient colors={['rgba(125,240,198,.26)', 'rgba(125,240,198,.06)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ borderTopLeftRadius: 110, borderTopRightRadius: 110, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, borderWidth: 1.5, borderColor: 'rgba(125,240,198,.5)', paddingTop: 58, paddingBottom: 24, paddingHorizontal: 26, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 28, height: 1, backgroundColor: 'rgba(125,240,198,.6)' }} />
                  <Text style={{ color: TEAL, fontSize: 11, fontWeight: '800', letterSpacing: 1.6 }}>{mode === 'learn' ? 'VERSE ' + cur + ' OF ' + b : mode === 'test' ? 'FROM MEMORY' : 'ANY VERSE'}</Text>
                  <View style={{ width: 28, height: 1, backgroundColor: 'rgba(125,240,198,.6)' }} />
                </View>
                {mode === 'learn' && s ? (<>
                  <Text style={{ color: W, fontSize: 30, fontFamily: QURAN_FONT, lineHeight: 62, alignSelf: 'stretch', textAlign: 'center', writingDirection: 'rtl' as any, marginTop: 10 }}>{cv ? cv.ar : ''}</Text>
                  {tr !== 'off' ? <FadeText text={cv ? (tr === 'en' ? cv.en : cv.ms) : ''} style={{ marginTop: 4 }} /> : null}
                  <TrBar tr={tr} setTr={setTr} />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7, marginTop: 14 }}>
                    {Array.from({ length: b - a + 1 }, (_, i) => a + i).slice(0, 40).map((n) => (
                      <Pressable key={n} hitSlop={6} onPress={() => { if (!rec && !busy) { stopVerse(); setPlaying(false); setCur(n); setMsg(''); } }} style={{ width: n === cur ? 22 : 9, height: 9, borderRadius: 5, backgroundColor: n === cur ? TEAL : n < cur ? 'rgba(125,240,198,.55)' : 'rgba(255,255,255,.22)' }} />
                    ))}
                  </View>
                </>) : mode === 'test' && s ? (
                  !hide ? <View style={{ alignSelf: 'stretch' }}><Text style={{ color: W, fontSize: 25, fontFamily: QURAN_FONT, lineHeight: 52, alignSelf: 'stretch', textAlign: 'center', writingDirection: 'rtl' as any, marginTop: 10 }}>{s.verses.filter((v) => v.n >= a && v.n <= b).map((v) => v.ar + ' ﴿' + v.n + '﴾').join('  ')}</Text>
                    {tr !== 'off' ? <FadeText text={trText(s.verses.filter((v) => v.n >= a && v.n <= b), tr)} style={{ marginTop: 6 }} /> : null}
                    <TrBar tr={tr} setTr={setTr} />
                  </View> : (
                    <View style={{ alignItems: 'center', marginTop: 12 }}>
                      <Text style={{ color: W, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>{s.title}</Text>
                      <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13.5, textAlign: 'center', marginTop: 4 }}>{'Verse ' + a + (b > a ? ' to ' + b : '') + ' · the text is hidden'}</Text>
                    </View>
                  )
                ) : (
                  <View style={{ alignItems: 'center', marginTop: 12 }}>
                    <Text style={{ color: W, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>Find my verse</Text>
                    <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6 }}>Recite any verses you know, from any surah. The app listens, finds the surah and the verse by itself, and checks the words from there.</Text>
                  </View>
                )}
                {mode === 'test' ? (
                  <Pressable onPress={() => setHide(!hide)} style={{ marginTop: 14, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{hide ? 'Show the text' : 'Hide the text'}</Text></Pressable>
                ) : null}
              </LinearGradient>

              {/* the dock: listen, recite, next */}
              <View style={{ alignItems: 'center' }}>
                {rec ? <Wave h={hist} /> : <View style={{ height: 34 }} />}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {mode === 'learn' ? (
                    <View style={{ alignItems: 'center', width: 76 }}>
                      <Pressable onPress={listen} style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: playing ? 'rgba(125,240,198,.35)' : 'rgba(125,240,198,.16)', borderWidth: 1, borderColor: 'rgba(125,240,198,.55)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 24 }}>{playing ? '🔊' : '🎧'}</Text></Pressable>
                      <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 11.5, fontWeight: '700', marginTop: 4 }}>{playing ? 'Playing' : 'Listen'}</Text>
                    </View>
                  ) : <View style={{ width: 76 }} />}
                  <Orb rec={rec} busy={busy} lvl={lvl} onPress={rec ? stop : busy ? undefined : start} />
                  {mode === 'learn' ? (
                    <View style={{ alignItems: 'center', width: 76, opacity: cur < b ? 1 : 0.35 }}>
                      <Pressable onPress={() => { if (cur < b && !rec && !busy) { stopVerse(); setPlaying(false); setCur(cur + 1); setMsg(''); } }} style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 26, fontWeight: '800' }}>›</Text></Pressable>
                      <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 11.5, fontWeight: '700', marginTop: 4 }}>Next verse</Text>
                    </View>
                  ) : <View style={{ width: 76 }} />}
                </View>
                <Text style={{ color: step ? TEAL : 'rgba(255,255,255,.88)', fontSize: 13.5, fontWeight: '700', marginTop: 4, textAlign: 'center' }}>{status}</Text>
                {mode === 'learn' ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    {['Listen', 'Recite', 'Review'].map((t, i) => (
                      <React.Fragment key={t}>
                        {i > 0 ? <Text style={{ color: 'rgba(255,255,255,.3)', fontSize: 12 }}>›</Text> : null}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: i === stepIdx ? TEAL : 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: i === stepIdx ? '#06241d' : 'rgba(255,255,255,.7)', fontSize: 10.5, fontWeight: '800' }}>{i + 1}</Text></View>
                          <Text style={{ color: i === stepIdx ? W : 'rgba(255,255,255,.55)', fontSize: 12, fontWeight: i === stepIdx ? '800' : '600' }}>{t}</Text>
                        </View>
                      </React.Fragment>
                    ))}
                  </View>
                ) : null}
                {askBlock}
                {msgBlock}
                {msg && !msg.startsWith('Microphone') ? takeRow : null}
              </View>
            </>) : (
              <Glass radius={28} style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <Ring pct={res.score} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: TEAL, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 }}>RESULT</Text>
                    <Text style={{ color: W, fontSize: 15, fontWeight: '800', marginTop: 2 }}>{mist.length ? mist.length + (mist.length === 1 ? ' word to check' : ' words to check') : 'No mistakes found'}</Text>
                    <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 12, marginTop: 2 }}>{mode === 'auto' ? res.reached + ' words heard' : res.reached < res.total ? 'Recited ' + res.reached + ' of ' + res.total + ' words' : 'All ' + res.total + ' words recited'}</Text>
                    <Pressable onPress={() => { setRes(null); setFound(null); setMsg(''); setOpen(-1); }} style={{ alignSelf: 'flex-start', marginTop: 8, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(125,240,198,.2)', borderWidth: 1, borderColor: 'rgba(125,240,198,.5)' }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>Try again</Text></Pressable>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                  {[['ok', 'Correct', cnt('ok')], ['close', 'Close', cnt('close')], ['wrong', 'Wrong / missing', cnt('wrong') + cnt('missing')], ['pending', 'Not reached', cnt('pending')]].map(([k, t, n]) => (
                    <View key={String(k)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.08)' }}>
                      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: COL[String(k)] }} />
                      <Text style={{ color: W, fontSize: 12, fontWeight: '700' }}>{n + ' ' + t}</Text>
                    </View>
                  ))}
                </View>
                {mode === 'auto' && found && found.cands[ci] ? (
                  <View style={{ marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: 'rgba(125,240,198,.14)', borderWidth: 1, borderColor: 'rgba(125,240,198,.4)' }}>
                    <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{'Found: ' + found.cands[ci].title + ', verse ' + found.cands[ci].ayah + (found.cands[ci].endAyah !== found.cands[ci].ayah || found.cands[ci].endSurah !== found.cands[ci].surah ? ' to ' + found.cands[ci].endAyah : '')}</Text>
                    {(() => { const c = found.cands[ci]; const sv = SURAH[c.surahKey]; if (!sv) return null; const last = c.endSurah === c.surah ? c.endAyah : sv.verses.length; const vs = sv.verses.filter((v) => v.n >= c.ayah && v.n <= last); return (<>
                      {tr !== 'off' ? <FadeText text={trText(vs, tr)} style={{ marginTop: 6, textAlign: 'left' }} /> : null}
                      <TrBar tr={tr} setTr={setTr} style={{ marginTop: 10, alignSelf: 'flex-start' }} />
                    </>); })()}
                    {found.ambiguous ? (<>
                      <Text style={{ color: '#ffd593', fontSize: 12, lineHeight: 17, marginTop: 4 }}>These verses sound the same in several places. Tap the one you recited:</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {found.cands.map((c, k) => <Chip key={k} t={c.title + ':' + c.ayah} on={k === ci} onPress={() => { setCi(k); setRes(c.res); setOpen(-1); }} />)}
                      </View>
                    </>) : null}
                  </View>
                ) : null}
                <View style={{ marginTop: 14, padding: 12, borderRadius: 22, backgroundColor: 'rgba(0,0,0,.2)', flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, rowGap: 10 }}>
                  {res.words.map((w: WResult, i: number) => (
                    <Pressable key={i} onPress={() => setOpen(open === i ? -1 : i)}>
                      <Text style={{ color: COL[w.status], fontSize: 25, fontFamily: QURAN_FONT, lineHeight: 52, paddingHorizontal: 3, borderBottomWidth: w.status === 'ok' || w.status === 'pending' ? 0 : 2, borderBottomColor: COL[w.status], textDecorationLine: w.status === 'missing' ? 'line-through' : 'none', backgroundColor: open === i ? 'rgba(255,255,255,.12)' : 'transparent' }}>{w.word}</Text>
                    </Pressable>
                  ))}
                </View>
                {open >= 0 && res.words[open] ? (() => {
                  const w = res.words[open]; const tips = tajwidTips(w.word);
                  return (
                    <View style={{ marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.08)' }}>
                      <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{'Verse ' + w.verse + ' · ' + (w.status === 'ok' ? 'Correct' : w.status === 'close' ? 'Close' : w.status === 'wrong' ? 'Different word heard' : w.status === 'missing' ? 'Not heard' : 'Not reached')}</Text>
                      {w.status === 'close' ? <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>{closeNote(w.word, w.heard || '')}</Text> : null}
                      {w.status === 'wrong' ? <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>{'The model heard a different word here.'}</Text> : null}
                      {(w.status === 'wrong' || w.status === 'close' || w.status === 'missing') && tips.length ? <Text style={{ color: '#ffd593', fontSize: 12, lineHeight: 18, marginTop: 6 }}>{'Tajwid reminder (from the text, not heard from your voice):\n' + tips.join('\n')}</Text> : null}
                    </View>
                  );
                })() : null}
                {res.extra.length ? <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, lineHeight: 18, marginTop: 12 }}>{'Extra words heard that are not in these verses: ' + res.extra.join(' · ')}</Text> : null}
                {mode === 'learn' ? (
                  <View style={{ marginTop: 14, padding: 12, borderRadius: 16, backgroundColor: res.score >= 85 && res.reached >= res.total ? 'rgba(125,240,198,.16)' : 'rgba(255,213,147,.14)' }}>
                    <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{res.score >= 85 && res.reached >= res.total ? 'Well done! That sounded right.' : 'Almost. Listen again and repeat.'}</Text>
                    <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>{res.score >= 85 && res.reached >= res.total ? (cur < b ? 'You can go to the next verse.' : 'You have finished the verses you chose.') : 'Tap the coloured words to see what to fix, then listen to the verse again.'}</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                      <Pressable onPress={() => { setRes(null); setOpen(-1); setTimeout(listen, 50); }} style={{ flex: 1, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>Listen again</Text></Pressable>
                      {cur < b ? <Pressable onPress={() => { setRes(null); setOpen(-1); setCur(cur + 1); }} style={{ flex: 1, height: 42, borderRadius: 21, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#06241d', fontSize: 13, fontWeight: '800' }}>Next verse</Text></Pressable> : null}
                    </View>
                  </View>
                ) : null}
                <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11.5, lineHeight: 17, marginTop: 12 }}>{'What the model heard: ' + heard}</Text>
                {takeRow}
              </Glass>
            )}

            {msg && res ? <Text style={{ color: '#ffd593', fontSize: 12.5, lineHeight: 19 }}>{msg}</Text> : null}

            <Glass radius={20} style={{ padding: 14 }}>
              <Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>Please note</Text>
              <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, lineHeight: 18, marginTop: 4 }}>This is a practice helper, not a teacher. It checks which words you recited, and it can make mistakes, especially with fast recitation, a noisy room or a weak microphone. It cannot judge tajwid, the length of madd or the harakat from your voice. Please learn and confirm your hafazan with a qualified teacher.</Text>
              {confirmDel ? (
                <View style={{ marginTop: 12, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,107,129,.12)', borderWidth: 1, borderColor: 'rgba(255,107,129,.4)' }}>
                  <Text style={{ color: '#ffb3bf', fontSize: 14, fontWeight: '800' }}>Remove the model?</Text>
                  <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>{'This frees about ' + MODEL_MB + ' MB on your phone. You can download it again anytime.'}</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <Pressable onPress={() => setConfirmDel(false)} style={{ flex: 1, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 13.5, fontWeight: '700' }}>Cancel</Text></Pressable>
                    <Pressable onPress={() => { setConfirmDel(false); deleteModel(); }} style={{ flex: 1, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,107,129,.35)', borderWidth: 1, borderColor: 'rgba(255,107,129,.6)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ffb3bf', fontSize: 13.5, fontWeight: '800' }}>Yes, remove</Text></Pressable>
                  </View>
                </View>
              ) : (
                <Pressable onPress={() => setConfirmDel(true)} style={{ marginTop: 12, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,107,129,.16)', borderWidth: 1, borderColor: 'rgba(255,107,129,.45)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ffb3bf', fontSize: 13.5, fontWeight: '800' }}>Remove the downloaded model</Text></Pressable>
              )}
            </Glass>
          </>)}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
