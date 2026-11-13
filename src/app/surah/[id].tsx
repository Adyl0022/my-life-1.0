import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '../../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Glass } from '../../components/Glass';
import { IslamicBg, Header, ToolBar, VerseBlock, Credit } from '../../components/IslamicUi';
import { W } from '../../components/Ui';
import { SURAH, BISMILLAH, partVerses, useIslamic, useLang, useSize, useRead, AR_SIZE } from '../../lib/islamic';

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
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <IslamicBg />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title={s.title} sub={s.sub} right={<Text style={{ color: W, fontSize: 22 }}>{s.ar}</Text>} />
        <ScrollView ref={scrollRef} style={{ marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <View onLayout={(e) => { top.current = e.nativeEvent.layout.y; tryJump(); }}>
          <Glass radius={26} style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
            {s.bismillah && <View style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.1)' }}><Text style={{ color: W, fontSize: AR_SIZE[size] + 3, textAlign: 'center', lineHeight: (AR_SIZE[size] + 3) * 1.8 }}>{BISMILLAH.ar}</Text></View>}
            {mode === 'flow' ? (
              <View onLayout={(e) => { flowH.current = e.nativeEvent.layout.height; tryJump(); }} style={{ paddingVertical: 14 }}>
                <Text style={{ color: W, fontSize: AR_SIZE[size] + 4, lineHeight: (AR_SIZE[size] + 4) * 2.1, textAlign: 'justify', writingDirection: 'rtl' }}>
                  {s.verses.map((v) => (
                    <Text key={v.n} onPress={() => { setIsl({ ...isl, last: { ...isl.last, [key]: v.n }, lastKey: key }); say('Last read: verse ' + v.n); }}
                      onLongPress={() => { const nx = marks.includes(v.n) ? marks.filter((x) => x !== v.n) : [...marks, v.n].sort((a, b) => a - b); setIsl({ ...isl, vb: { ...(isl.vb || {}), [key]: nx } }); say(marks.includes(v.n) ? 'Verse bookmark removed' : 'Verse ' + v.n + ' bookmarked'); }}
                      style={lastV === v.n || +(jump || 0) === v.n ? { backgroundColor: 'rgba(125,240,198,.18)' } : undefined}>
                      {(key === 'kahfi10' && v.n === 101 ? ' ··· ' : '') + v.ar}<Text style={{ color: '#7df0c6', fontSize: 16 }}>{' ﴿' + v.n + '﴾' + (marks.includes(v.n) ? '★' : '') + ' '}</Text>
                    </Text>
                  ))}
                </Text>
              </View>
            ) : s.verses.map((v, i) => (
              <React.Fragment key={v.n}>
                {key === 'kahfi10' && v.n === 101 && <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11.5, textAlign: 'center', paddingVertical: 10 }}>· · · verses 11 to 100 omitted · · ·</Text>}
                <View onLayout={(e) => { ys.current[v.n] = e.nativeEvent.layout.y; if (v.n === +(jump || 0)) tryJump(); }}>
                <VerseBlock v={v} size={size} lang={lang} arOnly={mode === 'ar'} active={lastV === v.n || +(jump || 0) === v.n} marked={marks.includes(v.n)} last={i === s.verses.length - 1}
                  onPress={() => { setIsl({ ...isl, last: { ...isl.last, [key]: v.n }, lastKey: key }); say('Last read: verse ' + v.n); }}
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
        {pick ? (
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 84, borderRadius: 22, backgroundColor: '#0e2f3a', borderWidth: 1, borderColor: 'rgba(125,240,198,.3)', padding: 8 }}>
            {([['tr', '文', 'With translation', 'Arabic with Malay or English'], ['ar', 'ع', 'Arabic only', 'No translation'], ['flow', '☰', 'Continuous', 'Flowing text, no breaks']] as const).map(([k, ic, t, sub]) => (
              <Pressable key={k} onPress={() => { setMode(k); if (k !== 'tr') setPick(false); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderRadius: 14, backgroundColor: mode === k ? 'rgba(125,240,198,.2)' : 'transparent', borderWidth: mode === k ? 1.5 : 0, borderColor: 'rgba(125,240,198,.65)' }}>
                <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 14 }}>{ic}</Text></View>
                <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 13.5, fontWeight: '700' }}>{t}</Text><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11 }}>{sub}</Text></View>
                {k === 'tr' && mode === 'tr' ? (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {(['ms', 'en'] as const).map((l) => <Pressable key={l} onPress={() => { setLang(l); setPick(false); }} style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: lang === l ? 'rgba(125,240,198,.45)' : 'rgba(255,255,255,.12)' }}><Text style={{ color: W, fontSize: 12, fontWeight: '800' }}>{l === 'ms' ? 'BM' : 'EN'}</Text></Pressable>)}
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}
        <ToolBar saved={saved} onSave={() => { setIsl({ ...isl, bm: { ...isl.bm, [key]: !saved } }); say(saved ? 'Bookmark removed' : 'Bookmarked'); }} size={size} onSize={() => setSize((size + 1) % 3)} lang={lang} onLang={() => setPick(!pick)} langLabel={mode === 'ar' ? 'Arabic' : mode === 'flow' ? 'Flow' : lang === 'en' ? 'EN' : 'BM'} />
      </SafeAreaView>
    </View>
  );
}
