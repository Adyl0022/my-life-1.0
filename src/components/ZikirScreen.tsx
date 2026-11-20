import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Modal, PanResponder } from 'react-native';
import { Pressable } from './Press';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { Text } from './Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Glass } from './Glass';
import { Shine } from './Shine';
import { CountButton } from './CountButton';
import { ReadBg, Header, ToolBar, Pending, Credit, ReadPicker } from './IslamicUi';
import { W } from './Ui';
import { markHub } from '../lib/hubInsight';
import { Part, KIND_COL, partVerses, useIslamic, useLang, useZRead, dayKey, nm, QURAN_FONT } from '../lib/islamic';
import { useStored } from '../lib/store';

// Reading sizes for dhikr, tahlil and Al-Ma'thurat. Larger than the rest of the Islamic Hub, because these are read aloud, often by older people.
const Z_AR = [24, 29, 34, 40, 48];
const Z_M = [13, 14.5, 16, 18, 21];
const Z_LAB = ['S', 'M', 'L', 'XL', 'XXL'];
const hap = (k: 'tap' | 'ok') => { try { if (k === 'ok') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) { } };
// "3×" or "33×" on a part means it is read that many times.
const target = (p: Part): number => (p.custom === 'tahlil33' ? 33 : /^\s*(\d+)\s*[×x]/i.test(p.count || '') ? parseInt((p.count || '').replace(/[^0-9]/g, ''), 10) : 0);

export function ZikirScreen({ title, sub, parts, storeKey, bmKey, start, evening, headExtra, footNote }: { title: string; sub: string; parts: Part[]; storeKey: string; bmKey: string; start: number; evening?: boolean; headExtra?: React.ReactNode; footNote: string }) {
  useKeepAwake(); // the screen stays on while reading
  const [isl, setIsl] = useIslamic();
  const [lang, setLang] = useLang(); const [size, setSize] = useStored<number>('ml_zsize', 2);
  const [zr, setZr] = useZRead(); const [pick, setPick] = useState(false);
  const [showTr, setShowTr] = useStored<boolean>('ml_ztr', false);
  const [gen, setGen] = useStored<string>('ml_zgen', 'm');
  useEffect(() => { markHub('z'); }, []);
  const [list, setList] = useState(false);
  const [sel, setSel] = useState(start);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [toast, setToast] = useState('');
  const sc = useRef<any>(null);
  useEffect(() => { sc.current?.scrollTo?.({ y: 0, animated: false }); }, [sel, storeKey]);
  useEffect(() => { setSel(start); setCounts({}); }, [storeKey]);
  const say = (t: string) => { setToast(t); setTimeout(() => setToast(''), 1500); };
  const rd = isl.read[storeKey] || {};
  const nRead = Object.keys(rd).filter((k) => rd[k]).length;
  const sz = Math.min(Math.max(size, 0), 4);
  const p = parts[sel];
  const isRead = !!rd[sel];
  const setRead = (i: number, v: boolean) => setIsl({ ...isl, read: { ...isl.read, [storeKey]: { ...rd, [i]: v } } });
  const verses0 = partVerses(p, !!evening);
  // A line written "al-marhum / al-marhumah" is shown once, for the person to choose: male or female.
  const twoWay = !!verses0 && verses0.some((v) => /\S+\s\/\s\S+/.test(v.ar));
  const verses = verses0 ? verses0.map((v) => ({ ...v, ar: v.ar.replace(/(\S+)\s\/\s(\S+)/g, (_m: string, a: string, b: string) => (gen === 'f' ? b : a)) })) : verses0;
  const pc = KIND_COL[p.kind];
  const saved = !!isl.bm[bmKey];
  const tg = target(p);
  const cnt = tg ? (counts[sel] !== undefined ? counts[sel] : (isRead ? tg : 0)) : 0;
  const tapCount = () => {
    if (cnt >= tg) { setCounts({ ...counts, [sel]: 0 }); setRead(sel, false); hap('tap'); return; }
    const c = cnt + 1; setCounts({ ...counts, [sel]: c });
    if (c >= tg) { setRead(sel, true); hap('ok'); } else hap('tap');
  };
  const go = (n: number) => { if (n < 0 || n > parts.length - 1) return; setSel(n); };
  const next = () => {
    if (sel >= parts.length - 1) { if (!p.custom) setRead(sel, true); say('Selesai · completed ✓'); hap('ok'); return; }
    if (!p.custom && !isRead) setRead(sel, true);
    go(sel + 1);
  };
  // Swipe sideways to move between parts. Vertical scrolling of long texts is not affected.
  const swipe = useRef<any>({});
  swipe.current = { sel, next, back: () => go(sel - 1) };
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
    onPanResponderRelease: (_e, g) => { if (g.dx < -60) swipe.current.next(); else if (g.dx > 60) swipe.current.back(); }
  })).current;
  const arS = Z_AR[sz]; const mS = Z_M[sz];
  const Meaning = ({ v }: { v: any }) => (showTr && zr !== 'ar') ? (
    <View style={{ marginTop: 6 }}>
      {v.rumi ? <Text style={{ color: '#8fe9e2', fontSize: mS, fontStyle: 'italic', lineHeight: mS * 1.55 }}>{v.rumi}</Text> : null}
      <Text style={{ color: 'rgba(255,255,255,.84)', fontSize: mS, lineHeight: mS * 1.55, marginTop: 6 }}>{lang === 'en' ? v.en : v.ms}</Text>
    </View>
  ) : null;
  // Buttons use the same press effect as the search field and play button in Quran Audio: they spring in, a ring of light spreads and a shine runs across.
  const bigBtn = (label: string, onPress: () => void, o?: { on?: boolean; tint?: 'amber' | 'blue'; dis?: boolean; flex?: number }) => {
    const t = o && o.on ? ['rgba(52,211,153,.3)', 'rgba(52,211,153,.7)', '#bff7df', '#34d399'] : o && o.tint === 'blue' ? ['rgba(124,156,255,.3)', 'rgba(124,156,255,.65)', '#dbe4ff', '#a9bcff'] : o && o.tint === 'amber' ? ['rgba(255,196,107,.22)', 'rgba(255,196,107,.55)', '#ffe2b0', '#ffc46b'] : ['rgba(255,255,255,.12)', 'rgba(255,255,255,.22)', W, '#ffffff'];
    return (
      <View style={{ flex: (o && o.flex) || 1, opacity: o && o.dis ? 0.35 : 1 }}>
        <Shine disabled={!!(o && o.dis)} onPress={onPress} radius={20} glow={t[3]} label={label} style={{ height: 58, borderWidth: 1, borderColor: t[1], backgroundColor: t[0] }}>
          <Text style={{ color: t[2], fontSize: 16, fontWeight: '800' }}>{label}</Text>
        </Shine>
      </View>
    );
  };
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <ReadBg />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title={title} sub={sub} />
        {headExtra}
        <View style={{ marginHorizontal: 20, marginTop: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: 'rgba(255,255,255,.82)', fontSize: 13, fontWeight: '700' }}>{'Part ' + (sel + 1) + ' of ' + parts.length + ' · ' + nRead + ' read today'}</Text>
            <Pressable onPress={() => setList(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="All parts" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(125,240,198,.45)', backgroundColor: 'rgba(125,240,198,.12)' }}>
              <Text style={{ color: '#7df0c6', fontSize: 13, fontWeight: '800' }}>☰  Parts</Text>
            </Pressable>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.14)', marginTop: 14, overflow: 'hidden' }}><View style={{ height: 6, borderRadius: 3, width: ((sel + 1) / parts.length) * 100 + '%', backgroundColor: '#7df0c6' }} /></View>
        </View>
        <Glass solid radius={26} style={{ flex: 1, marginHorizontal: 20, marginTop: 20, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14, backgroundColor: 'rgba(46,84,116,.96)' }}>
          <View {...pan.panHandlers} style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: isRead ? 'rgba(52,211,153,.55)' : pc[0], alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontWeight: '800', fontSize: 15 }}>{isRead ? '✓' : sel + 1}</Text></View>
              <Text style={{ flex: 1, color: W, fontSize: 17, fontWeight: '800' }} numberOfLines={3}>{nm(p.name, !!evening)}</Text>
              {p.count ? <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: pc[0] }}><Text style={{ color: pc[1], fontSize: 13, fontWeight: '800' }}>{p.count}</Text></View> : null}
            </View>
            <ScrollView ref={sc} style={{ flex: 1, marginTop: 6 }} contentContainerStyle={{ paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
              {p.custom === 'tahlil33' ? (
                <View style={{ alignItems: 'center', paddingVertical: 14 }}>
                  <Text style={{ color: W, fontSize: arS + 8, fontFamily: QURAN_FONT, lineHeight: (arS + 8) * 1.95, textAlign: 'center' }}>لَا إِلَٰهَ إِلَّا ٱللَّهُ</Text>
                  {zr === 'ar' || !showTr ? null : <Text style={{ color: 'rgba(255,255,255,.84)', fontSize: mS + 1, marginTop: 6 }}>{lang === 'en' ? 'There is no god but Allah.' : 'Tiada Tuhan selain Allah.'}</Text>}
                </View>
              ) : verses ? (twoWay ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingTop: 6 }}>
                  <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12.5, fontWeight: '700' }}>Read for:</Text>
                  {[['m', 'Male (al-marhum)'], ['f', 'Female (al-marhumah)']].map(([k, t]) => (
                    <Pressable key={k} onPress={() => setGen(k)} style={{ paddingVertical: 6, paddingHorizontal: 13, borderRadius: 999, backgroundColor: gen === k ? 'rgba(94,231,181,.4)' : 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: gen === k ? '#7df0c6' : 'rgba(255,255,255,.16)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{t}</Text></Pressable>
                  ))}
                </View>
              ) : null) : null}
              {p.custom === 'tahlil33' ? null : verses ? verses.map((v, i) => (
                <View key={i} style={{ paddingVertical: 14, borderBottomWidth: i === verses.length - 1 ? 0 : 1, borderBottomColor: 'rgba(255,255,255,.1)' }}>
                  <Text style={{ color: W, fontSize: arS, fontFamily: QURAN_FONT, lineHeight: arS * 1.95, textAlign: 'right', writingDirection: 'rtl' }}>{v.ar}{verses.length > 1 ? <Text style={{ color: '#7df0c6', fontSize: 15 }}>{'  ﴿' + v.n + '﴾'}</Text> : null}</Text>
                  <Meaning v={v} />
                </View>
              )) : <Pending kind={p.kind} />}
              {zr !== 'ar' && (verses || p.custom) ? (
                <Pressable onPress={() => setShowTr(!showTr)} style={{ alignSelf: 'center', marginTop: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', backgroundColor: 'rgba(255,255,255,.08)' }}>
                  <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 13, fontWeight: '700' }}>{showTr ? 'Hide meaning ▴' : 'Show meaning ▾'}</Text>
                </Pressable>
              ) : null}
            </ScrollView>
            {tg ? (
              <View style={{ marginTop: 8 }}><CountButton cnt={cnt} tg={tg} onPress={tapCount} /></View>
            ) : null}
          </View>
        </Glass>
        <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 14 }}>
          {bigBtn('‹ Back', () => go(sel - 1), { dis: sel === 0, tint: 'amber' })}
          {!p.custom ? bigBtn(isRead ? 'Read ✓' : 'Mark read', () => setRead(sel, !isRead), { on: isRead, tint: isRead ? undefined : 'blue', flex: 1.2 }) : null}
          <View style={{ flex: 1.5 }}>
            <Shine onPress={next} radius={20} glow="#bff7df" label="Next" style={{ height: 58 }}>
              <LinearGradient colors={['#34d399', '#5ee7df']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
              <Text style={{ color: '#06281c', fontSize: 16, fontWeight: '800' }}>{sel >= parts.length - 1 ? 'Finish ✓' : 'Next ›'}</Text>
            </Shine>
          </View>
        </View>
        <View style={{ height: 12 }} />
        {toast ? <View pointerEvents="none" style={{ position: 'absolute', bottom: 160, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.75)' }}><Text style={{ color: W, fontSize: 12.5 }}>{toast}</Text></View> : null}
        {pick ? <ReadPicker opts={[{ k: 'tr', ic: '文', t: 'With translation', sub: 'Arabic with rumi and Malay or English' }, { k: 'ar', ic: 'ع', t: 'Arabic only', sub: 'No rumi, no translation' }]} mode={zr} onMode={(k) => setZr(k as any)} lang={lang} onLang={setLang} onClose={() => setPick(false)} /> : null}
        <ToolBar saved={saved} onSave={() => { setIsl({ ...isl, bm: { ...isl.bm, [bmKey]: !saved } }); say(saved ? 'Bookmark removed' : 'Bookmarked'); }} size={sz} sizeLabel={Z_LAB[sz]} onSize={() => setSize((sz + 1) % 5)} lang={lang} onLang={() => setPick(!pick)} langLabel={zr === 'ar' ? 'Arabic' : lang === 'en' ? 'EN' : 'BM'} />
      </SafeAreaView>
      <Modal visible={list} transparent animationType="fade" onRequestClose={() => setList(false)} statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: 'rgba(5,8,28,.7)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => setList(false)} accessibilityLabel="Close" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <View style={{ maxHeight: '82%', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden', borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(125,240,198,.3)', backgroundColor: '#0e2f3a' }}>
            <View style={{ alignItems: 'center', paddingTop: 10 }}><View style={{ width: 42, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.28)' }} /></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 19, fontWeight: '800' }}>All parts</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 2 }}>{nRead + ' of ' + parts.length + ' read today'}</Text></View>
              <Pressable onPress={() => setList(false)} hitSlop={8} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' }}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>Close</Text></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 30 }}>
              {parts.map((x, i) => {
                const c = KIND_COL[x.kind]; const r = !!rd[i];
                return (
                  <Pressable key={i} onPress={() => { setSel(i); setList(false); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 16, backgroundColor: i === sel ? 'rgba(125,240,198,.14)' : 'transparent' }}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: r ? 'rgba(52,211,153,.55)' : c[0], alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: r ? W : c[1], fontSize: 13, fontWeight: '800' }}>{r ? '✓' : i + 1}</Text></View>
                    <Text style={{ flex: 1, color: W, fontSize: 15, fontWeight: i === sel ? '800' : '600' }} numberOfLines={2}>{nm(x.name, !!evening)}</Text>
                    <Text style={{ color: c[1], fontSize: 12, fontWeight: '700' }}>{x.count || x.kind}</Text>
                  </Pressable>
                );
              })}
              <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, lineHeight: 16, margin: 8 }}>{footNote}</Text>
              <View style={{ paddingHorizontal: 4 }}><Credit lang={lang} /></View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
