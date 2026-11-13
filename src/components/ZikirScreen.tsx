import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from './Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Glass } from './Glass';
import { IslamicBg, Header, ToolBar, VerseBlock, Pending, Credit, ReadPicker } from './IslamicUi';
import { W } from './Ui';
import { Part, KIND_COL, partVerses, useIslamic, useLang, useSize, useZRead, AR_SIZE, M_SIZE, dayKey, nm } from '../lib/islamic';

export function ZikirScreen({ title, sub, parts, storeKey, bmKey, start, evening, headExtra, footNote }: { title: string; sub: string; parts: Part[]; storeKey: string; bmKey: string; start: number; evening?: boolean; headExtra?: React.ReactNode; footNote: string }) {
  const [isl, setIsl] = useIslamic();
  const [lang, setLang] = useLang(); const [size, setSize] = useSize();
  const [zr, setZr] = useZRead(); const [pick, setPick] = useState(false);
  const [sel, setSel] = useState(start);
  const [count, setCount] = useState(0);
  const [toast, setToast] = useState('');
  const sc = useRef<any>(null);
  useEffect(() => { sc.current?.scrollTo?.({ y: 0, animated: false }); }, [sel, storeKey]);
  useEffect(() => { setSel(start); setCount(0); }, [storeKey]);
  const say = (t: string) => { setToast(t); setTimeout(() => setToast(''), 1500); };
  const rd = isl.read[storeKey] || {};
  const nRead = Object.keys(rd).filter((k) => rd[k]).length;
  const p = parts[sel];
  const isRead = !!rd[sel];
  const setRead = (i: number, v: boolean) => setIsl({ ...isl, read: { ...isl.read, [storeKey]: { ...rd, [i]: v } } });
  const verses = partVerses(p, !!evening);
  const pc = KIND_COL[p.kind];
  const saved = !!isl.bm[bmKey];
  const tap33 = () => { if (count >= 33) { setCount(0); setRead(sel, false); return; } const c = count + 1; setCount(c); if (c >= 33) setRead(sel, true); };
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <IslamicBg />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title={title} sub={sub} />
        {headExtra}
        <Glass radius={26} style={{ marginHorizontal: 20, marginTop: 12, padding: 16, maxHeight: '46%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: isRead ? 'rgba(52,211,153,.55)' : pc[0], alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontWeight: '800' }}>{isRead ? '✓' : sel + 1}</Text></View>
            <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 15, fontWeight: '800' }} numberOfLines={2}>{nm(p.name, !!evening)}</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 1 }}>Part {sel + 1} of {parts.length} · {nRead} read today</Text></View>
          </View>
          <ScrollView ref={sc} style={{ marginTop: 8 }}>
            {p.custom === 'tahlil33' ? (
              <View style={{ alignItems: 'center', paddingVertical: 6 }}>
                <Text style={{ color: W, fontSize: AR_SIZE[size] + 8, lineHeight: (AR_SIZE[size] + 8) * 1.8, textAlign: 'center' }}>لَا إِلَٰهَ إِلَّا ٱللَّهُ</Text>
                {zr === 'ar' ? null : <Text style={{ color: 'rgba(255,255,255,.82)', fontSize: M_SIZE[size] + 1, marginTop: 4 }}>{lang === 'en' ? 'There is no god but Allah.' : 'Tiada Tuhan selain Allah.'}</Text>}
                <Pressable onPress={tap33} style={{ marginTop: 12, minWidth: 190, paddingVertical: 9, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: count >= 33 ? 'rgba(52,211,153,.7)' : 'rgba(255,255,255,.25)', backgroundColor: count >= 33 ? 'rgba(52,211,153,.4)' : 'rgba(255,196,107,.' + (20 + Math.round((count / 33) * 30)) + ')', alignItems: 'center' }}>
                  <Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{count >= 33 ? 'Completed ✓ · tap to restart' : 'Tap to count · ' + count + ' of 33'}</Text>
                </Pressable>
              </View>
            ) : verses ? verses.map((v, i) => <VerseBlock key={i} v={v} size={size} lang={lang} arOnly={zr === 'ar'} showNum={verses.length > 1} last={i === verses.length - 1} />)
              : <Pending kind={p.kind} />}
          </ScrollView>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
            <Pressable disabled={sel === 0} onPress={() => { setSel(sel - 1); setCount(0); }} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.1)', opacity: sel === 0 ? 0.35 : 1 }}>
              <Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>‹ Back</Text>
            </Pressable>
            {!p.custom ? (
              <Pressable onPress={() => setRead(sel, !isRead)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: isRead ? 'rgba(52,211,153,.7)' : 'rgba(255,255,255,.2)', backgroundColor: isRead ? 'rgba(52,211,153,.3)' : 'rgba(255,255,255,.12)' }}>
                <Text style={{ color: isRead ? '#bff7df' : W, fontSize: 12, fontWeight: '700' }}>{isRead ? 'Read ✓' : 'Mark read'}</Text>
              </Pressable>
            ) : <View />}
            <Pressable onPress={() => { if (sel >= parts.length - 1) { if (!p.custom) setRead(sel, true); say('Selesai · completed ✓'); return; } if (!p.custom && !isRead) setRead(sel, true); const n = sel + 1; setSel(n); setCount(parts[n].custom && rd[n] ? 33 : 0); }} style={{ paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999, backgroundColor: '#34d399' }}>
              <Text style={{ color: '#06281c', fontSize: 12.5, fontWeight: '800' }}>{sel >= parts.length - 1 ? 'Finish ✓' : 'Next ›'}</Text>
            </Pressable>
          </View>
        </Glass>
        <Glass radius={26} style={{ flex: 1, marginHorizontal: 20, marginTop: 12, marginBottom: 12 }}>
          <ScrollView contentContainerStyle={{ padding: 8 }}>
            {parts.map((x, i) => {
              const c = KIND_COL[x.kind]; const r = !!rd[i];
              return (
                <Pressable key={i} onPress={() => { setSel(i); setCount(r && x.custom ? 33 : 0); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 8, borderRadius: 14, backgroundColor: i === sel ? 'rgba(255,255,255,.12)' : 'transparent' }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: r ? 'rgba(52,211,153,.55)' : c[0], alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: r ? W : c[1], fontSize: 12, fontWeight: '800' }}>{r ? '✓' : i + 1}</Text></View>
                  <Text style={{ flex: 1, color: W, fontSize: 13, fontWeight: i === sel ? '800' : '600' }} numberOfLines={2}>{nm(x.name, !!evening)}</Text>
                  <Text style={{ color: c[1], fontSize: 11, fontWeight: '700' }}>{x.count || x.kind}</Text>
                </Pressable>
              );
            })}
            <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, lineHeight: 16, margin: 8 }}>{footNote}</Text>
            <View style={{ paddingHorizontal: 4 }}><Credit lang={lang} /></View>
          </ScrollView>
        </Glass>
        {toast ? <View pointerEvents="none" style={{ position: 'absolute', bottom: 100, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.75)' }}><Text style={{ color: W, fontSize: 12.5 }}>{toast}</Text></View> : null}
        {pick ? <ReadPicker opts={[{ k: 'tr', ic: '文', t: 'With translation', sub: 'Arabic with rumi and Malay or English' }, { k: 'ar', ic: 'ع', t: 'Arabic only', sub: 'No rumi, no translation' }]} mode={zr} onMode={(k) => setZr(k as any)} lang={lang} onLang={setLang} onClose={() => setPick(false)} /> : null}
        <ToolBar saved={saved} onSave={() => { setIsl({ ...isl, bm: { ...isl.bm, [bmKey]: !saved } }); say(saved ? 'Bookmark removed' : 'Bookmarked'); }} size={size} onSize={() => setSize((size + 1) % 3)} lang={lang} onLang={() => setPick(!pick)} langLabel={zr === 'ar' ? 'Arabic' : lang === 'en' ? 'EN' : 'BM'} />
      </SafeAreaView>
    </View>
  );
}
