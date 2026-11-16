import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Glass } from '../components/Glass';
import { IslamicBg, Header } from '../components/IslamicUi';
import { W } from '../components/Ui';
import { SURAH_LIST } from '../lib/islamic';
import { useStored } from '../lib/store';
import { QariOpt, JUZ_NAMES, loadQaris, playSurah, playJuz, toggle, next, prev, stop, useQuranAudio } from '../lib/quranAudio';

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
  const load = () => { setBad(false); loadQaris().then((r) => setQs(r)).catch(() => { setBad(true); setQs(null); }); };
  useEffect(load, []);
  const avail = (qs || []).filter((q) => q.identifier);
  const cur = avail.find((q) => q.id === qid) || avail[0];
  const run = (f: (q: QariOpt) => void) => { if (cur) f(cur); };
  const it = a.items[a.index];
  const active = a.phase !== 'idle';

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <IslamicBg />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Quran Audio" sub="Listen by juz or surah" />
        <ScrollView style={{ marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: active ? 150 : 30, gap: 10 }}>
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
        </ScrollView>

        {active ? (
          <View style={{ position: 'absolute', left: 14, right: 14, bottom: 16 }}>
            <Glass radius={26} style={{ padding: 14, backgroundColor: 'rgba(14,30,60,.96)' }}>
              {a.phase === 'error' ? <Text style={{ color: '#ffd593', fontSize: 13, lineHeight: 19 }}>{a.err}</Text> : (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ color: W, fontSize: 15, fontWeight: '800' }}>{a.title}</Text>
                      <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.72)', fontSize: 11.5, marginTop: 2 }}>{a.phase === 'loading' ? 'Loading…' : a.qari + (it ? ' · Verse ' + it.label + ' (' + (a.index + 1) + ' of ' + a.items.length + ')' : '')}</Text>
                    </View>
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
