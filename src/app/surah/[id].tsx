import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text } from '../../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Glass } from '../../components/Glass';
import { ReadBg, Header, ToolBar, VerseBlock, Credit, ReadPicker } from '../../components/IslamicUi';
import { W } from '../../components/Ui';
import { SURAH, BISMILLAH, partVerses, useIslamic, useLang, useSize, useRead, AR_SIZE, QURAN_FONT } from '../../lib/islamic';

export default function SurahScreen() {
  const { id, v: jump } = useLocalSearchParams<{ id: string; v?: string }>();
  const scrollRef = React.useRef<any>(null);
  const ys = React.useRef<Record<number, number>>({});
  const top = React.useRef(0);
  const done = React.useRef(false);
  const modeR = React.useRef('tr');
  const tryJump = () => { const n = +(jump || 0); if (!n || done.current) return; let y = ys.current[n]; if (y === undefined && modeR.current === 'flow' && flowH.current > 0) { const vs = SURAH[String(id)] ? SURAH[String(id)].verses : []; const tot = vs.reduce((a, v) => a + v.ar.length, 0) || 1; let before = 0; for (const v of vs) { if (v.n >= n) break; before += v.ar.length; } y = (before / tot) * flowH.current; } if (y === undefined) return; done.current = true; setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, top.current + y - 80), animated: true }), 250); };
  const s = SURAH[String(id)] || SURAH.fatihah;
  const key = SURAH[String(id)] ? String(id) : 'fatihah';
  const [isl, setIsl] = useIslamic();
  const [lang, setLang] = useLang();
  const [size, setSize] = useSize();
  const [mode, setMode] = useRead();
  const [pick, setPick] = useState(false);
  modeR.current = mode;
  const flowH = React.useRef(0);
  const [toast, setToast] = useState('');
  const say = (t: string) => { setToast(t); setTimeout(() => setToast(''), 1600); };
  const saved = !!isl.bm[key];
  const lastV = isl.last[key];
  const marks: number[] = (isl.vb || {})[key] || [];
  const lastN = isl.last[key];
  const tapVerse = (n: number) => { if (lastN === n) { const nl = { ...isl.last }; delete nl[key]; setIsl({ ...isl, last: nl }); say('Last read cleared'); } else { setIsl({ ...isl, last: { ...isl.last, [key]: n }, lastKey: key }); say('Last read: verse ' + n); } };
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <ReadBg />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title={s.title} sub={s.sub} right={<Text style={{ color: W, fontSize: 22, lineHeight: 42, fontFamily: QURAN_FONT }}>{s.ar}</Text>} />
        <ScrollView ref={scrollRef} style={{ marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <View onLayout={(e) => { top.current = e.nativeEvent.layout.y; tryJump(); }}>
          <Glass solid radius={26} style={{ paddingHorizontal: 16, paddingVertical: 6, backgroundColor: 'rgba(46,84,116,.96)' }}>
            {s.bismillah && <View style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.1)' }}><Text style={{ color: W, fontSize: AR_SIZE[size] + 6, fontFamily: QURAN_FONT, textAlign: 'center', lineHeight: (AR_SIZE[size] + 6) * 1.95 }}>{BISMILLAH.ar}</Text></View>}
            {mode === 'flow' ? (
              <View onLayout={(e) => { flowH.current = e.nativeEvent.layout.height; tryJump(); }} style={{ paddingVertical: 14 }}>
                <Text style={{ color: W, fontSize: AR_SIZE[size] + 7, fontFamily: QURAN_FONT, lineHeight: (AR_SIZE[size] + 7) * 1.95, textAlign: 'justify', writingDirection: 'rtl' }}>
                  {s.verses.map((v) => (
                    <Text key={v.n} style={lastN === v.n ? { backgroundColor: 'rgba(125,240,198,.18)' } : undefined} onPress={() => { tapVerse(v.n); }}
                      onLongPress={() => { const nx = marks.includes(v.n) ? marks.filter((x) => x !== v.n) : [...marks, v.n].sort((a, b) => a - b); setIsl({ ...isl, vb: { ...(isl.vb || {}), [key]: nx } }); say(marks.includes(v.n) ? 'Verse bookmark removed' : 'Verse ' + v.n + ' bookmarked'); }}
                      >
                      {(key === 'kahfi10' && v.n === 101 ? ' ··· ' : '') + v.ar}<Text style={{ color: '#7df0c6', fontSize: 16 }}>{' ﴿' + v.n + '﴾' + (marks.includes(v.n) ? '★' : '') + ' '}</Text>
                    </Text>
                  ))}
                </Text>
              </View>
            ) : s.verses.map((v, i) => (
              <React.Fragment key={v.n}>
                {key === 'kahfi10' && v.n === 101 && (
                  <>
                  <View style={{ marginVertical: 14, marginHorizontal: -4, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 14, backgroundColor: 'rgba(125,240,198,.10)', borderWidth: 1, borderColor: 'rgba(125,240,198,.4)', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#7df0c6', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#06281c', fontSize: 13, fontWeight: '900' }}>✓</Text></View>
                      <Text style={{ color: '#7df0c6', fontSize: 14, fontWeight: '800' }}>Verses 1–10 finished</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginVertical: 10, gap: 8 }}>
                      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,.22)' }} />
                      <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 16 }}>۞</Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,.22)' }} />
                    </View>
                    <Text style={{ color: W, fontSize: 13.5, fontWeight: '700', textAlign: 'center' }}>Next: the last 10 verses</Text>
                    <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 12, marginTop: 2, textAlign: 'center' }}>Verses 101–110 · the middle part is not part of this reading</Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,.12)' }} />
                  </>
                )}
                <View onLayout={(e) => { ys.current[v.n] = e.nativeEvent.layout.y; if (v.n === +(jump || 0)) tryJump(); }}>
                <VerseBlock v={v} size={size} lang={lang} arOnly={mode === 'ar'} marked={marks.includes(v.n)} active={lastN === v.n} last={i === s.verses.length - 1}
                  onPress={() => { tapVerse(v.n); }}
                  onLong={() => { const nx = marks.includes(v.n) ? marks.filter((x) => x !== v.n) : [...marks, v.n].sort((a, b) => a - b); setIsl({ ...isl, vb: { ...(isl.vb || {}), [key]: nx } }); say(marks.includes(v.n) ? 'Verse bookmark removed' : 'Verse ' + v.n + ' bookmarked'); }} />
                </View>
              </React.Fragment>
            ))}
          </Glass>
          </View>
          {key === 'yasin' && (
            <Glass radius={22} style={{ marginTop: 12, padding: 14 }}>
              <Text style={{ color: '#ffd593', fontSize: 14, fontWeight: '800', marginBottom: 4 }}>Doa after Yasin</Text>
              {(partVerses({ name: 'Doa after Yasin', kind: 'Doa' }) || []).map((v, i, a) => <VerseBlock key={i} v={v} size={size} lang={lang} arOnly={mode === 'ar'} showNum={a.length > 1} last={i === a.length - 1} />)}
            </Glass>
          )}
          <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginHorizontal: 4, marginTop: 10 }}>Tap a verse to mark where you stopped. Long-press a verse to bookmark it (★).</Text>
          <Credit lang={lang} />
        </ScrollView>
        {toast ? <View pointerEvents="none" style={{ position: 'absolute', bottom: 90, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.75)' }}><Text style={{ color: W, fontSize: 12.5 }}>{toast}</Text></View> : null}
        {pick ? <ReadPicker opts={[{ k: 'tr', ic: '文', t: 'With translation', sub: 'Arabic with Malay or English' }, { k: 'ar', ic: 'ع', t: 'Arabic only', sub: 'No translation' }, { k: 'flow', ic: '☰', t: 'Continuous', sub: 'Flowing text, no breaks' }]} mode={mode} onMode={(k) => setMode(k as any)} lang={lang} onLang={setLang} onClose={() => setPick(false)} /> : null}
        <ToolBar saved={saved} onSave={() => { setIsl({ ...isl, bm: { ...isl.bm, [key]: !saved } }); say(saved ? 'Bookmark removed' : 'Bookmarked'); }} size={size} onSize={() => setSize((size + 1) % 3)} lang={lang} onLang={() => setPick(!pick)} langLabel={mode === 'ar' ? 'Arabic' : mode === 'flow' ? 'Flow' : lang === 'en' ? 'EN' : 'BM'} />
      </SafeAreaView>
    </View>
  );
}
