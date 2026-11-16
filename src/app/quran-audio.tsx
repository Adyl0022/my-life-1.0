import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Glass } from '../components/Glass';
import { IslamicBg, Header, VerseBlock } from '../components/IslamicUi';
import { W } from '../components/Ui';
import { SURAH_LIST, SURAH, BISMILLAH, useLang, useSize } from '../lib/islamic';
import { useStored } from '../lib/store';
import { QariOpt, JUZ_NAMES, loadQaris, playSurah, playJuz, toggle, next, prev, stop, useQuranAudio } from '../lib/quranAudio';

// Calm background for the text view: the same dark teal as the Islamic Hub with a soft star pattern, and no glowing lights behind the words.
const TextBg = () => (
  <>
    <LinearGradient colors={['#0a0f2c', '#0f1f3d', '#0c3a3f']} locations={[0, 0.5, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
    <Svg pointerEvents="none" width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0 }}>
      <Defs>
        <Pattern id="qgeo" width={52} height={52} patternUnits="userSpaceOnUse">
          <Path d="M26 4l5.5 11.5L43 10l-5.5 11.5L49 26l-11.5 4.5L43 42l-11.5-5.5L26 48l-5.5-11.5L9 42l5.5-11.5L3 26l11.5-4.5L9 10l11.5 5.5z" fill="none" stroke="#7df0c6" strokeWidth={1} opacity={0.1} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#qgeo)" />
    </Svg>
  </>
);

const TEAL = '#7df0c6';
const Btn = ({ t, onPress, big }: { t: string; onPress: () => void; big?: boolean }) => (
  <Pressable onPress={onPress} hitSlop={8} style={{ width: big ? 52 : 40, height: big ? 52 : 40, borderRadius: 26, backgroundColor: big ? 'rgba(94,231,181,.45)' : 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: W, fontSize: big ? 20 : 16, fontWeight: '800' }}>{t}</Text>
  </Pressable>
);

export default function QuranAudio() {
  const [qid, setQid] = useStored<string>('ml_qari', 'alafasy');
  const [qs, setQs] = useState<QariOpt[] | null>(null);
  const [bad, setBad] = useState(false);
  const [tab, setTab] = useState(0);
  const a = useQuranAudio();
  const [lang, setLang] = useLang(); const [size] = useSize();
  const [arOnly, setArOnly] = useState(false);
  const [text, setText] = useState(true);
  const scRef = React.useRef<any>(null); const ys = React.useRef<Record<string, number>>({});
  const load = () => { setBad(false); loadQaris().then((r) => setQs(r)).catch(() => { setBad(true); setQs(null); }); };
  useEffect(load, []);
  const avail = (qs || []).filter((q) => q.identifier);
  const cur = avail.find((q) => q.id === qid) || avail[0];
  const run = (f: (q: QariOpt) => void) => { if (cur) f(cur); };
  const it = a.items[a.index];
  const active = a.phase !== 'idle';
  const meta = it ? SURAH_LIST.find((x) => x.num === it.surah) : undefined;
  const info = meta ? SURAH[meta.key] : undefined;
  const follow = active && a.phase !== 'error' && text && !!info;
  const vkey = it ? it.surah + ':' + it.ayah : '';
  // Keep the verse being read in view.
  useEffect(() => { if (!follow || !it) return; const y = ys.current[vkey]; if (y !== undefined && scRef.current) scRef.current.scrollTo({ y: Math.max(0, y - 90), animated: true }); }, [vkey, follow]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      {follow ? <TextBg /> : <IslamicBg />}
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Quran Audio" sub="Listen by juz or surah" />
        <ScrollView ref={scRef} style={{ marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: active ? 190 : 30, gap: 10 }}>
          {follow && info ? (
            <Glass radius={26} style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
              <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.1)' }}>
                <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 }}>NOW READING</Text>
                <Text style={{ color: W, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{info.title}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.1)' }}>
                {([['ar', 'Arabic only'], ['ms', 'Melayu'], ['en', 'English']] as [string, string][]).map(([k, t]) => {
                  const on = k === 'ar' ? arOnly : !arOnly && lang === k;
                  return (
                    <Pressable key={k} onPress={() => { if (k === 'ar') setArOnly(true); else { setArOnly(false); setLang(k as 'ms' | 'en'); } }} style={{ paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, backgroundColor: on ? 'rgba(94,231,181,.4)' : 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: on ? TEAL : 'rgba(255,255,255,.14)' }}>
                      <Text style={{ color: W, fontSize: 12, fontWeight: '700' }}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {info.bismillah ? <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.1)' }}><Text style={{ color: W, fontSize: 24, textAlign: 'center', writingDirection: 'rtl' }}>{BISMILLAH.ar}</Text></View> : null}
              {info.verses.map((v, i) => (
                <View key={v.n} onLayout={(e) => { ys.current[info.num + ':' + v.n] = e.nativeEvent.layout.y + 90; }}>
                  <VerseBlock v={v} size={size} lang={lang} arOnly={arOnly} active={!!it && it.ayah === v.n} last={i === info.verses.length - 1} />
                </View>
              ))}
            </Glass>
          ) : (<>
          <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>RECITER</Text>
          {bad ? (
            <Glass radius={20} style={{ padding: 14 }}>
              <Text style={{ color: '#ffd593', fontSize: 13, lineHeight: 19 }}>Could not load the reciters. Check your internet connection.</Text>
              <Pressable onPress={load} style={{ marginTop: 10, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.14)' }}><Text style={{ color: W, fontWeight: '700', fontSize: 13 }}>Try again</Text></Pressable>
            </Glass>
          ) : !qs ? <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 13 }}>Loading reciters…</Text> : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(qs || []).map((q) => {
                const on = !!cur && cur.id === q.id; const off = !q.identifier;
                return (
                  <Pressable key={q.id} disabled={off} onPress={() => setQid(q.id)} style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: on ? 'rgba(94,231,181,.4)' : 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: on ? TEAL : 'rgba(255,255,255,.14)', opacity: off ? 0.4 : 1 }}>
                    <Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{q.name}{off ? ' (not available)' : ''}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {qs && !avail.length ? <Text style={{ color: '#ffd593', fontSize: 12.5 }}>No reciter is available right now. Try again later.</Text> : null}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            {['Juz (1 to 30)', 'Surah (1 to 114)'].map((t, i) => (
              <Pressable key={t} onPress={() => setTab(i)} style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: tab === i ? 'rgba(94,231,181,.4)' : 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: tab === i ? TEAL : 'rgba(255,255,255,.14)' }}>
                <Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{t}</Text>
              </Pressable>
            ))}
          </View>

          {tab === 0 ? JUZ_NAMES.map((n, i) => (
            <Pressable key={i} disabled={!cur} onPress={() => run((q) => playJuz(i + 1, q))}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(94,231,181,.3)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14.5, fontWeight: '700' }}>Juz {i + 1}</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 2 }}>{n}</Text></View>
                <Text style={{ color: TEAL, fontSize: 18 }}>▶</Text>
              </View>
            </Pressable>
          )) : SURAH_LIST.map((x) => (
            <Pressable key={x.key} disabled={!cur} onPress={() => run((q) => playSurah(x.num, x.title, q))}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(94,231,181,.3)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>{x.num}</Text></View>
                <View style={{ flex: 1, minWidth: 0 }}><Text style={{ color: W, fontSize: 14.5, fontWeight: '700' }}>{x.title}</Text><Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 2 }}>{x.sub}</Text></View>
                <Text style={{ color: TEAL, fontSize: 18 }}>▶</Text>
              </View>
            </Pressable>
          ))}

          <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, lineHeight: 16, marginTop: 8 }}>Audio is streamed from the free Al-Quran Cloud service (alquran.cloud) and needs internet. The recitations belong to their reciters. It keeps playing when the screen is off.</Text>
          </>)}
        </ScrollView>

        {active ? (
          <View style={{ position: 'absolute', left: 14, right: 14, bottom: 16 }}>
            <Glass radius={26} style={{ padding: 14, backgroundColor: 'rgba(14,30,60,.96)' }}>
              {a.phase === 'error' ? <Text style={{ color: '#ffd593', fontSize: 13, lineHeight: 19 }}>{a.err}</Text> : (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ color: W, fontSize: 15, fontWeight: '800' }}>{a.title}</Text>
                      <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.72)', fontSize: 11.5, marginTop: 2 }}>{a.phase === 'loading' ? 'Loading…' : a.qari + (it ? ' · ' + it.label + ' · ' + (a.index + 1) + '/' + a.items.length : '')}</Text>
                    </View>
                    <Pressable onPress={() => setText(!text)} hitSlop={6} style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: text ? 'rgba(94,231,181,.4)' : 'rgba(255,255,255,.12)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>{text ? 'List' : 'Text'}</Text></Pressable>
                    <Btn t="✕" onPress={() => stop()} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 10 }}>
                    <Btn t="⏮" onPress={prev} /><Btn big t={a.playing ? '❚❚' : '▶'} onPress={toggle} /><Btn t="⏭" onPress={next} />
                  </View>
                </View>
              )}
              {a.phase === 'error' ? <Pressable onPress={() => stop()} style={{ marginTop: 10, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.14)' }}><Text style={{ color: W, fontWeight: '700', fontSize: 13 }}>Close</Text></Pressable> : null}
            </Glass>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}
