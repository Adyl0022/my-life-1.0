import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Glass } from '../components/Glass';
import { Header, ReadBg } from '../components/IslamicUi';
import { W } from '../components/Ui';
import { SURAH, SURAH_LIST, QURAN_FONT } from '../lib/islamic';
import { locate, Found } from '../lib/hafazanFind';
import { expectedWords, checkRecitation, tajwidTips, closeNote, CheckResult, WResult } from '../lib/hafazan';
import { playVerse, stopVerse } from '../lib/hafazanPlay';
import { stop as stopQuranAudio } from '../lib/quranAudio';
import { asrSupported, useAsr, downloadModel, deleteModel, micPermission, startRecording, stopAndTranscribe, cancelRecording, micLevel, MODEL_MB } from '../lib/hafazanAsr';

const TEAL = '#7df0c6';
const COL: Record<string, string> = { ok: '#7df0c6', close: '#ffd593', wrong: '#ff8fab', missing: '#ff8fab', pending: 'rgba(255,255,255,.35)' };

const Chip = ({ t, on, onPress }: { t: string; on: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} style={{ paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, backgroundColor: on ? 'rgba(94,231,181,.4)' : 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: on ? TEAL : 'rgba(255,255,255,.14)' }}>
    <Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{t}</Text>
  </Pressable>
);

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
  const [lvl, setLvl] = useState(0);
  const [pick, setPick] = useState('');
  const [open, setOpen] = useState<number>(-1);
  const timer = useRef<any>(null);

  const s = SURAH[sKey];
  const total = s ? s.verses.length : 0;
  const a = Math.max(1, Math.min(total, parseInt(from, 10) || 1));
  const b = Math.max(a, Math.min(total, parseInt(to, 10) || a));
  const words: { word: string; verse: number }[] = [];
  if (s) s.verses.filter((v) => v.n >= a && v.n <= b).forEach((v) => expectedWords(v.ar).forEach((w) => words.push({ word: w, verse: v.n })));

  useEffect(() => { if (rec) { timer.current = setInterval(() => setLvl(micLevel()), 120); } return () => { if (timer.current) clearInterval(timer.current); }; }, [rec]);
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
  const start = async () => {
    stopVerse(); setPlaying(false);
    setMsg(''); setRes(null); setOpen(-1); setBusy(true); setStep('Asking for microphone permission…');
    try {
      if (!(await micPermission())) { setMsg('Microphone permission is needed to listen to your recitation. Allow it in the phone settings (App info, Permissions, Microphone), then try again.'); return; }
      setStep('Starting the microphone…');
      await startRecording(); setRec(true);
    } catch (e: any) { setMsg(String((e && e.message) || 'Could not start the microphone.')); }
    finally { setBusy(false); setStep(''); }
  };
  const stop = async () => {
    setRec(false); setBusy(true);
    try {
      const h = await stopAndTranscribe();
      if (!h.text) { setMsg(h.seconds < 0.8 ? 'That was too short. Tap the microphone and recite.' : 'Nothing was heard clearly. Move closer to the microphone and try again in a quiet place.'); setBusy(false); return; }
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

  const mist = res ? res.words.filter((w) => w.status === 'wrong' || w.status === 'missing' || w.status === 'close') : [];
  const list = SURAH_LIST.filter((x) => { const t = pick.trim().toLowerCase(); return !t || x.title.toLowerCase().includes(t) || String(x.num) === t; }).slice(0, 8);

  return (
    <View style={{ flex: 1 }}>
      <ReadBg />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header title="Hafazan Check" sub="Test your memorisation" />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80, gap: 14 }} keyboardShouldPersistTaps="handled">
          {!asrSupported ? (
            <Glass radius={22} style={{ padding: 16 }}><Text style={{ color: W, fontSize: 14, lineHeight: 21 }}>Hafazan Check listens through the phone microphone and works on the Android app.</Text></Glass>
          ) : asr.phase === 'none' || asr.phase === 'error' || asr.phase === 'downloading' ? (
            <Glass radius={24} style={{ padding: 18 }}>
              <Text style={{ color: TEAL, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 }}>ONE-TIME SETUP</Text>
              <Text style={{ color: W, fontSize: 16, fontWeight: '800', marginTop: 6 }}>Download the Quran listening model</Text>
              <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, lineHeight: 20, marginTop: 6 }}>{'It is about ' + MODEL_MB + ' MB and works offline after this. Your voice is checked on this phone only and is never uploaded. Use Wi-Fi if you can.'}</Text>
              {asr.phase === 'downloading' ? (
                <View style={{ marginTop: 14 }}>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.14)', overflow: 'hidden' }}><View style={{ width: Math.round(asr.pct * 100) + '%', height: 8, backgroundColor: TEAL }} /></View>
                  <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, marginTop: 6 }}>{'Downloading ' + Math.round(asr.pct * 100) + '%'}</Text>
                </View>
              ) : (
                <Pressable onPress={downloadModel} style={{ marginTop: 14, height: 46, borderRadius: 23, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#06241d', fontSize: 14.5, fontWeight: '800' }}>{'Download (' + MODEL_MB + ' MB)'}</Text></Pressable>
              )}
              {asr.phase === 'error' ? <Text style={{ color: '#ff8fab', fontSize: 12.5, marginTop: 10, lineHeight: 18 }}>{asr.err}</Text> : null}
            </Glass>
          ) : (<>
            <Glass radius={24} style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <Chip t="Learn to recite" on={mode === 'learn'} onPress={() => { setMode('learn'); setRes(null); setFound(null); setCur(a); }} />
                <Chip t="Test myself" on={mode === 'test'} onPress={() => { setMode('test'); setRes(null); setFound(null); stopVerse(); setPlaying(false); }} />
                <Chip t="Find my verse" on={mode === 'auto'} onPress={() => { setMode('auto'); setRes(null); setFound(null); stopVerse(); setPlaying(false); }} />
              </View>
              {mode === 'auto' ? <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, lineHeight: 19 }}>Recite any verses you know. The app listens, finds the surah and the verse by itself, and checks the words from there.</Text> : (<>
              <Text style={{ color: TEAL, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 }}>CHOOSE WHAT TO RECITE</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.08)' }}>
                <Text style={{ color: 'rgba(255,255,255,.6)' }}>⌕</Text>
                <TextInput value={pick} onChangeText={setPick} placeholder={s ? s.title + ' (tap to change)' : 'Search surah name or number'} placeholderTextColor="rgba(255,255,255,.5)" style={{ flex: 1, color: W, fontSize: 14, paddingVertical: 10 }} />
              </View>
              {pick.trim() ? (
                <View style={{ marginTop: 8, gap: 6 }}>
                  {list.map((x) => (
                    <Pressable key={x.key} onPress={() => { setSKey(x.key); setFrom('1'); setTo(String(SURAH[x.key].verses.length)); setPick(''); }} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.07)' }}>
                      <Text style={{ color: W, fontSize: 13.5, fontWeight: '700' }}>{x.num + '. ' + x.title}</Text>
                      <Text style={{ color: W, fontSize: 17, lineHeight: 34, fontFamily: QURAN_FONT }}>{x.ar}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13 }}>Verses</Text>
                <TextInput value={from} onChangeText={(t) => setFrom(t.replace(/\D/g, ''))} keyboardType="number-pad" style={{ width: 56, textAlign: 'center', color: W, fontSize: 15, fontWeight: '700', paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.1)' }} />
                <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13 }}>to</Text>
                <TextInput value={to} onChangeText={(t) => setTo(t.replace(/\D/g, ''))} keyboardType="number-pad" style={{ width: 56, textAlign: 'center', color: W, fontSize: 15, fontWeight: '700', paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.1)' }} />
                <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 12 }}>{'of ' + total}</Text>
              </View>
              </>)}
              {mode === 'test' ? (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <Chip t="Hide text (test myself)" on={hide} onPress={() => setHide(true)} />
                  <Chip t="Show text" on={!hide} onPress={() => setHide(false)} />
                </View>
              ) : null}
            </Glass>

            {!res && mode === 'learn' && s ? (
              <Glass radius={24} style={{ padding: 18 }}>
                <Text style={{ color: TEAL, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 }}>{'LEARN · VERSE ' + cur + ' OF ' + b}</Text>
                <Text style={{ color: W, fontSize: 28, fontFamily: QURAN_FONT, lineHeight: 56, textAlign: 'right', writingDirection: 'rtl' as any, marginTop: 8 }}>{(s.verses.find((v) => v.n === cur) || { ar: '' }).ar}</Text>
                <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, lineHeight: 19, marginTop: 6 }}>{(s.verses.find((v) => v.n === cur) || { ms: '' }).ms}</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <Pressable onPress={listen} style={{ flex: 1, height: 52, borderRadius: 26, backgroundColor: playing ? 'rgba(125,240,198,.3)' : 'rgba(125,240,198,.18)', borderWidth: 1, borderColor: 'rgba(125,240,198,.55)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{playing ? 'Listening…' : '1. Listen'}</Text></Pressable>
                  <Pressable onPress={rec ? stop : busy ? undefined : start} style={{ flex: 1, height: 52, borderRadius: 26, backgroundColor: rec ? '#ff8fab' : TEAL, alignItems: 'center', justifyContent: 'center', transform: [{ scale: rec ? 1 + lvl * 0.08 : 1 }] }}><Text style={{ color: rec ? '#3a0716' : '#06241d', fontSize: 14, fontWeight: '800' }}>{step ? 'Please wait…' : busy ? 'Checking…' : rec ? 'Stop and check' : '2. Your turn'}</Text></Pressable>
                </View>
                <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 12, lineHeight: 18, marginTop: 10 }}>Listen to the verse first, as many times as you like. Then tap Your turn, recite it, and tap Stop. The app will point out words to fix.</Text>
                {step ? <Text style={{ color: TEAL, fontSize: 12.5, fontWeight: '700', marginTop: 8 }}>{step}</Text> : null}
                {msg ? <Text style={{ color: '#ffd593', fontSize: 12.5, lineHeight: 19, marginTop: 8 }}>{msg}</Text> : null}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                  <Pressable onPress={() => { if (cur > a) { stopVerse(); setPlaying(false); setCur(cur - 1); setMsg(''); } }}><Text style={{ color: cur > a ? TEAL : 'rgba(255,255,255,.3)', fontSize: 13, fontWeight: '800' }}>‹ Previous verse</Text></Pressable>
                  <Pressable onPress={() => { if (cur < b) { stopVerse(); setPlaying(false); setCur(cur + 1); setMsg(''); } }}><Text style={{ color: cur < b ? TEAL : 'rgba(255,255,255,.3)', fontSize: 13, fontWeight: '800' }}>Next verse ›</Text></Pressable>
                </View>
              </Glass>
            ) : null}

            {!res && (mode === 'test' || mode === 'auto') ? (
              <Glass radius={24} style={{ padding: 18, alignItems: 'center' }}>
                {mode === 'test' && !hide && s ? (
                  <View style={{ alignSelf: 'stretch', marginBottom: 14 }}>
                    <Text style={{ color: W, fontSize: 24, fontFamily: QURAN_FONT, lineHeight: 50, textAlign: 'right', writingDirection: 'rtl' as any }}>{s.verses.filter((v) => v.n >= a && v.n <= b).map((v) => v.ar + ' ﴿' + v.n + '﴾').join('  ')}</Text>
                  </View>
                ) : (
                  <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginBottom: 14 }}>{mode === 'auto' ? 'Tap the microphone and recite from memory. Say a full verse or more, from any surah.' : (s ? s.title : '') + ', verse ' + a + (b > a ? ' to ' + b : '') + '. The text is hidden. Tap the microphone and recite from memory.'}</Text>
                )}
                <Pressable onPress={rec ? stop : busy ? undefined : start} accessibilityLabel={rec ? 'Stop and check' : 'Start reciting'} style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: rec ? '#ff8fab' : TEAL, alignItems: 'center', justifyContent: 'center', transform: [{ scale: rec ? 1 + lvl * 0.18 : 1 }] }}>
                  {rec ? <View style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: '#3a0716' }} /> : <Text style={{ fontSize: 34 }}>🎙</Text>}
                </Pressable>
                <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 13, fontWeight: '700', marginTop: 12 }}>{step ? step : busy ? (asr.phase === 'loading' ? 'Loading the model, then checking…' : 'Checking…') : rec ? 'Listening… tap to stop and check' : 'Tap to recite'}</Text>
                {msg ? <Text style={{ color: '#ffd593', fontSize: 12.5, lineHeight: 19, marginTop: 10, textAlign: 'center' }}>{msg}</Text> : null}
              </Glass>
            ) : res ? (
              <Glass radius={24} style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: TEAL, fontSize: 11, fontWeight: '800', letterSpacing: 1.3 }}>RESULT</Text>
                    <Text style={{ color: W, fontSize: 28, fontWeight: '800' }}>{res.score + '%'}</Text>
                    <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12.5 }}>{mist.length ? mist.length + (mist.length === 1 ? ' word to check' : ' words to check') : 'No mistakes found'}{mode === 'auto' ? ' · ' + res.reached + ' words heard' : res.reached < res.total ? ' · recited ' + res.reached + ' of ' + res.total + ' words' : ''}</Text>
                  </View>
                  <Pressable onPress={() => { setRes(null); setFound(null); setMsg(''); setOpen(-1); }} style={{ flexShrink: 0, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(125,240,198,.2)', borderWidth: 1, borderColor: 'rgba(125,240,198,.5)' }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>Try again</Text></Pressable>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                  {[['ok', 'Correct'], ['close', 'Close'], ['wrong', 'Wrong / missing'], ['pending', 'Not reached']].map(([k, t]) => <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: COL[k] }} /><Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5 }}>{t}</Text></View>)}
                </View>
                {mode === 'auto' && found && found.cands[ci] ? (
                  <View style={{ marginTop: 12, padding: 10, borderRadius: 14, backgroundColor: 'rgba(125,240,198,.14)' }}>
                    <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>{'Found: ' + found.cands[ci].title + ', verse ' + found.cands[ci].ayah + (found.cands[ci].endAyah !== found.cands[ci].ayah || found.cands[ci].endSurah !== found.cands[ci].surah ? ' to ' + found.cands[ci].endAyah : '')}</Text>
                    {found.ambiguous ? (<>
                      <Text style={{ color: '#ffd593', fontSize: 12, lineHeight: 17, marginTop: 4 }}>These verses sound the same in several places. Tap the one you recited:</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {found.cands.map((c, k) => <Chip key={k} t={c.title + ':' + c.ayah} on={k === ci} onPress={() => { setCi(k); setRes(c.res); setOpen(-1); }} />)}
                      </View>
                    </>) : null}
                  </View>
                ) : null}
                <View style={{ marginTop: 14, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, rowGap: 10 }}>
                  {res.words.map((w: WResult, i: number) => (
                    <Pressable key={i} onPress={() => setOpen(open === i ? -1 : i)}>
                      <Text style={{ color: COL[w.status], fontSize: 25, fontFamily: QURAN_FONT, lineHeight: 52, paddingHorizontal: 3, borderBottomWidth: w.status === 'ok' || w.status === 'pending' ? 0 : 2, borderBottomColor: COL[w.status], textDecorationLine: w.status === 'missing' ? 'line-through' : 'none' }}>{w.word}</Text>
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
              </Glass>
            ) : null}

            {msg && res ? <Text style={{ color: '#ffd593', fontSize: 12.5, lineHeight: 19 }}>{msg}</Text> : null}

            <Glass radius={20} style={{ padding: 14 }}>
              <Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>Please note</Text>
              <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, lineHeight: 18, marginTop: 4 }}>This is a practice helper, not a teacher. It checks which words you recited, and it can make mistakes, especially with fast recitation, a noisy room or a weak microphone. It cannot judge tajwid, the length of madd or the harakat from your voice. Please learn and confirm your hafazan with a qualified teacher.</Text>
              <Pressable onPress={deleteModel} style={{ marginTop: 10 }}><Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 12, textDecorationLine: 'underline' }}>Remove the downloaded model from this phone</Text></Pressable>
            </Glass>
          </>)}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
