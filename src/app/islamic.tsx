import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, TextInput, Animated, Easing, PanResponder, LayoutAnimation } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { Glass } from '../components/Glass';
import { IslamicBg, Header, Ic } from '../components/IslamicUi';
import { W } from '../components/Ui';
import { useIslamic, SURAH, SURAH_LIST, FEATURED, QURAN_FONT } from '../lib/islamic';
import { usePrayer } from '../lib/prayer';
import { TOP } from '../lib/layout';
import { useStored } from '../lib/store';
import { useHijriSync, upcoming } from '../lib/hijriSync';
import { HubLog, weekDays, ayatOfDay } from '../lib/hubInsight';
import { PUASA_EMPTY, PuasaData, ramadanState, qadhaOwed, sunatToday, isHaram, keyD } from '../lib/fasting';

const Ring = ({ v, max, label, c }: { v: number; max: number; label: string; c: string }) => {
  const R = 20, C = 2 * Math.PI * R, f = Math.min(1, v / max);
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <View style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={52} height={52} style={{ position: 'absolute' }}>
          <Circle cx={26} cy={26} r={R} stroke="rgba(255,255,255,.16)" strokeWidth={5} fill="none" />
          <Circle cx={26} cy={26} r={R} stroke={c} strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray={C + ' ' + C} strokeDashoffset={C * (1 - f)} rotation={-90} origin="26, 26" />
        </Svg>
        <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>{v}</Text>
      </View>
      <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 11.5, fontWeight: '600', marginTop: 4 }}>{label}</Text>
    </View>
  );
};

const Item = ({ t, s, c, ic = 'book', onPress }: { t: string; s: string; c: string; ic?: string; onPress: () => void }) => (
  <Pressable onPress={onPress}><Glass radius={22} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: c, alignItems: 'center', justifyContent: 'center' }}><Ic n={ic} size={22} /></View>
    <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 15, fontWeight: '700' }}>{t}</Text><Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 12, marginTop: 4 }}>{s}</Text></View>
    <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 20 }}>›</Text>
  </Glass></Pressable>
);

export default function IslamicHub() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState('');
  const [isl, setIsl] = useIslamic();
  const pr = usePrayer();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  const h = now.getHours();
  const z = h >= 5 && h < 12 ? ['GOOD MORNING', "Morning zikir · Al-Ma'thurat", 'Best read after Subuh'] : h >= 12 && h < 15 ? ['COMING UP', "Evening zikir · Al-Ma'thurat", 'Opens after Asar'] : ['GOOD EVENING', "Evening zikir · Al-Ma'thurat", 'Best read after Asar'];
  const lk = isl.lastKey && SURAH[isl.lastKey] ? isl.lastKey : 'kahfi';
  const lv = isl.last[lk];
  const go = (p: string) => router.push(p as any);
  const [pz] = useStored<PuasaData>('ml_puasa', PUASA_EMPTY);
  const [qres] = useStored<{ title?: string; label?: string; index?: number; total?: number } | null>('ml_qresume', null);
  const pst = (() => {
    const d = new Date(), rs = ramadanState(pz, d), ow = qadhaOwed(pz, d), po = pz.off || 0, marked = !!(pz.days || {})[keyD(d)];
    if (rs.phase === 'during') return { h: 'Ramadan day ' + rs.day + ' of ' + rs.r.len, b: marked ? 'Today is marked. ' + rs.fasted + ' days fasted so far.' : 'Mark today\'s fast. ' + rs.fasted + ' days fasted so far.' };
    const sn = sunatToday(d, po);
    if (isHaram(d, po)) return { h: 'Eid today', b: 'No fasting today. It is a day of Eid.' };
    if (sn && !marked) return { h: 'Today: ' + sn, b: ow > 0 ? 'You also have ' + ow + ' missed ' + (ow === 1 ? 'fast' : 'fasts') + ' to make up.' : 'A good day to fast.' };
    if (ow > 0) return { h: ow + ' missed ' + (ow === 1 ? 'fast' : 'fasts') + ' to make up', b: rs.phase === 'before' ? 'Ramadan is ' + rs.daysTo + ' days away.' : 'Try to finish before next Ramadan.' };
    return { h: 'Fasting log', b: rs.phase === 'before' ? 'Ramadan in ' + rs.daysTo + ' days. Track make-up fasts and sunnah fasts.' : 'Track Ramadan, make-up fasts and sunnah fasts.' };
  })();
  const hoff = useHijriSync();
  const evs = upcoming(now, hoff, 4);
  const hasRead = !!(isl.lastKey && SURAH[isl.lastKey]);
  const kinds = hasRead ? ['read', 'ev', 'ins'] : ['ev', 'ins'];
  const [slide, setSlide] = useState(evs[0] && evs[0].days <= 3 ? kinds.indexOf('ev') : 0);
  const cur = kinds[Math.min(slide, kinds.length - 1)];
  const [hl] = useStored<HubLog>('ml_hub_log', {});
  const rs0 = ramadanState(pz, now), ow0 = qadhaOwed(pz, now);
  const ay = ayatOfDay(now, rs0.phase === 'during');
  const ayv = SURAH[ay.key] ? SURAH[ay.key].verses[ay.n - 1] : null;
  let sunnahWk = 0; for (let i = 0; i < 7; i++) if ((pz.days || {})[keyD(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i))] === 's') sunnahWk++;
  const [openEv, setOpenEv] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const prog = useRef(new Animated.Value(0)).current;
  const [held, setHeld] = useState(false);
  const busy = useRef(false);
  const swap = (dir: number) => {
    if (busy.current || kinds.length < 2) return; busy.current = true;
    Animated.parallel([Animated.timing(tx, { toValue: -dir * 24, duration: 200, useNativeDriver: true }), Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true })]).start(() => {
      LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity')); setSlide((v) => (v + dir + kinds.length) % kinds.length); tx.setValue(dir * 24);
      Animated.parallel([Animated.timing(tx, { toValue: 0, duration: 300, useNativeDriver: true }), Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true })]).start(() => { busy.current = false; });
    });
  };
  const swapRef = useRef(swap); swapRef.current = swap;
  useEffect(() => {
    prog.setValue(0);
    if (kinds.length < 2 || held || openEv) return;
    const a = Animated.timing(prog, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: false });
    a.start(({ finished }) => { if (finished) swapRef.current(1); });
    return () => a.stop();
  }, [kinds.length, held, openEv, slide]);
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
    onPanResponderRelease: (_e, g) => { if (g.dx < -40) swapRef.current(1); else if (g.dx > 40) swapRef.current(-1); },
  })).current;
  const ev0 = evs[0];
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <IslamicBg deco />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Islamic Hub" right={<Pressable onPress={() => router.push('/islamic-settings' as any)} accessibilityLabel="Islamic Hub settings"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Circle cx={12} cy={12} r={3} /><Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Svg></Glass></Pressable>} />
        <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)', marginHorizontal: 20, marginTop: 14 }}>
          {['Today', 'Quran', 'Zikir', 'Saved'].map((n, i) => (
            <Pressable key={n} onPress={() => setTab(i)} style={{ flex: 1 }}>
              {tab === i ? <LinearGradient colors={['#34d399', '#5ee7df']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 8, borderRadius: 999, alignItems: 'center' }}><Text style={{ color: '#06281c', fontSize: 13, fontWeight: '800' }}>{n}</Text></LinearGradient>
                : <View style={{ paddingVertical: 8, alignItems: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{n}</Text></View>}
            </Pressable>
          ))}
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14 + TOP, paddingBottom: 50, gap: 12 }}>
          {tab === 0 && (<>
            <Pressable onPress={() => go('/prayer')}>
              <Glass radius={26} style={{ padding: 18 }}>
                <LinearGradient colors={['rgba(52,211,153,.3)', 'rgba(94,231,223,.15)']} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
                <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>NEXT PRAYER</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12, marginTop: 6 }}>
                  <Text style={{ color: W, fontSize: 30, fontWeight: '800' }}>{pr.nextSolat ? pr.nextSolat.name : '—'}</Text>
                  <Text style={{ color: W, fontSize: 22, fontWeight: '700' }}>{pr.nextSolat ? pr.nextSolat.time12 : ''}</Text>
                </View>
                <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12.5, marginTop: 6 }}>{pr.status === 'ready' ? 'Assalamualaikum · tap for all prayer times' : pr.status === 'loading' ? 'Loading prayer times…' : 'Tap to open prayer times'}</Text>
              </Glass>
            </Pressable>
            <Pressable onPress={() => go('/mathurat')}><Glass radius={22} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,196,107,.4)', alignItems: 'center', justifyContent: 'center' }}><Ic n={h >= 5 && h < 12 ? 'sunrise' : 'sunset'} size={24} /></View>
              <View style={{ flex: 1 }}><Text style={{ color: '#ffd593', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 }}>{z[0]}</Text><Text style={{ color: W, fontSize: 14.5, fontWeight: '700', marginTop: 2 }}>{z[1]}</Text><Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 12, marginTop: 1 }}>{z[2]}</Text></View>
              <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 20 }}>›</Text>
            </Glass></Pressable>
            <Animated.View {...pan.panHandlers} style={{ opacity: fade, transform: [{ translateX: tx }] }}>
            {cur === 'read' ? (
            <Pressable onPressIn={() => setHeld(true)} onPressOut={() => setHeld(false)} onPress={() => go('/surah/' + lk + (lv ? '?v=' + lv : ''))}><Glass radius={22} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(94,231,181,.4)', alignItems: 'center', justifyContent: 'center' }}><Ic n="book" size={24} /></View>
              <View style={{ flex: 1 }}><Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 }}>CONTINUE READING</Text><Text style={{ color: W, fontSize: 14.5, fontWeight: '700', marginTop: 2 }}>{SURAH[lk].title}</Text><Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 12, marginTop: 1 }}>{lv ? 'Last read: verse ' + lv : 'Start reading'}</Text></View>
              <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 20 }}>›</Text>
            </Glass></Pressable>
            ) : cur === 'ins' ? (
            <Pressable onPressIn={() => setHeld(true)} onPressOut={() => setHeld(false)} onPress={() => go('/surah/' + ay.key + '?v=' + ay.n)}><Glass radius={22} style={{ padding: 14 }}>
              <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 }}>YOUR WEEK · INSIGHT</Text>
              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <Ring v={weekDays(hl, 'q')} max={7} label="Quran days" c="#5ee7b5" />
                <Ring v={weekDays(hl, 'z')} max={7} label="Zikir days" c="#ffd593" />
                <Ring v={sunnahWk} max={2} label="Sunnah fasts" c="#7c9cff" />
              </View>
              {rs0.phase === 'before' || rs0.phase === 'during' ? (<Text style={{ color: '#ffd593', fontSize: 12.5, fontWeight: '700', marginTop: 12 }}>{rs0.phase === 'during' ? 'Ramadan day ' + rs0.day + ' of ' + rs0.r.len : 'Ramadan in ' + rs0.daysTo + ' days'}{ow0 > 0 ? ' · ' + ow0 + ' make-up ' + (ow0 === 1 ? 'fast' : 'fasts') + ' to finish' : ' · no make-up fasts owed'}</Text>) : ow0 > 0 ? (<Text style={{ color: '#ffd593', fontSize: 12.5, fontWeight: '700', marginTop: 12 }}>{ow0 + ' make-up ' + (ow0 === 1 ? 'fast' : 'fasts') + ' to finish before Ramadan'}</Text>) : null}
              {ayv ? (<View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.14)' }}>
                <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.1 }}>{ay.why.toUpperCase()} · {SURAH[ay.key].title.replace('Surah ', '')} {SURAH[ay.key].num}:{ay.n}</Text>
                <Text numberOfLines={2} style={{ color: W, fontFamily: QURAN_FONT, fontSize: 21, lineHeight: 36, textAlign: 'right', marginTop: 4 }}>{ayv.ar}</Text>
                <Text numberOfLines={2} style={{ color: 'rgba(255,255,255,.75)', fontSize: 12, lineHeight: 17, marginTop: 2 }}>{ayv.en}</Text>
              </View>) : null}
            </Glass></Pressable>
            ) : ev0 ? (
            <Pressable onPressIn={() => setHeld(true)} onPressOut={() => setHeld(false)} onPress={() => setOpenEv((v) => !v)}><Glass radius={22} style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(52,211,153,.4)', alignItems: 'center', justifyContent: 'center' }}><Ic n="moon" size={24} /></View>
                <View style={{ flex: 1 }}><Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 }}>UPCOMING · ISLAMIC CALENDAR</Text><Text style={{ color: W, fontSize: 14.5, fontWeight: '700', marginTop: 2 }}>{ev0.n}</Text><Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 12, marginTop: 1 }}>{ev0.days === 0 ? 'Today' : ev0.days === 1 ? 'Tomorrow' : 'In ' + ev0.days + ' days'} · {ev0.hText}</Text></View>
                <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 20 }}>{openEv ? '⌃' : '⌄'}</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, lineHeight: 18, marginTop: 10 }}>{ev0.tip}</Text>
              {openEv ? (<View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.14)' }}>
                {evs.slice(1).map((e) => (<View key={e.n + e.hText} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{e.n}</Text><Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 12 }}>{e.days === 1 ? 'Tomorrow' : 'In ' + e.days + ' days'}</Text></View>))}
                <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 6 }}>Dates are estimates and follow JAKIM when you are online. The final date depends on the moon sighting.</Text>
              </View>) : null}
            </Glass></Pressable>
            ) : null}
            </Animated.View>
            {kinds.length > 1 ? (<View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: -4 }}>{kinds.map((_k, i) => i).map((i) => (<View key={i} style={{ width: 34, height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,.22)' }}>{slide === i ? <Animated.View style={{ height: 4, borderRadius: 2, backgroundColor: '#5ee7df', width: prog.interpolate({ inputRange: [0, 1], outputRange: [6, 34] }) }} /> : null}</View>))}</View>) : null}
            <Pressable onPress={() => go('/puasa')}><Glass radius={22} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(52,211,153,.4)', alignItems: 'center', justifyContent: 'center' }}><Ic n="moon" size={24} /></View>
              <View style={{ flex: 1 }}><Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 }}>RAMADAN · SUNNAH</Text><Text style={{ color: W, fontSize: 14.5, fontWeight: '700', marginTop: 2 }}>{pst.h}</Text><Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 12, marginTop: 2 }}>{pst.b}</Text></View>
              <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 20 }}>›</Text>
            </Glass></Pressable>
          </>)}
          {tab === 1 && (<>
            <Pressable onPress={() => go('/quran-audio')}><Glass radius={22} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(94,231,181,.4)', alignItems: 'center', justifyContent: 'center' }}><Ic n="book" size={24} /></View>
              <View style={{ flex: 1 }}><Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 }}>LISTEN</Text><Text style={{ color: W, fontSize: 14.5, fontWeight: '700', marginTop: 2 }}>Quran Audio</Text><Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.72)', fontSize: 12, marginTop: 1 }}>{qres && qres.title ? 'Continue · ' + qres.title + ' · ' + qres.label : 'All 30 juz and 114 surahs, 4 reciters'}</Text></View>
              <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 20 }}>›</Text>
            </Glass></Pressable>
            <Pressable onPress={() => go('/hafazan')}><Glass radius={22} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(124,156,255,.4)', alignItems: 'center', justifyContent: 'center' }}><Ic n="book" size={24} /></View>
              <View style={{ flex: 1 }}><Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 }}>MEMORISE</Text><Text style={{ color: W, fontSize: 14.5, fontWeight: '700', marginTop: 2 }}>Hafazan Check</Text><Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.72)', fontSize: 12, marginTop: 1 }}>Recite from memory and see your mistakes</Text></View>
              <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 20 }}>›</Text>
            </Glass></Pressable>
            <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>FEATURED READINGS</Text>
            {FEATURED.map((k) => <Item key={k} ic="star" t={SURAH[k].title} s={SURAH[k].sub + (isl.bm[k] ? ' · Saved' : '')} c="rgba(255,196,107,.4)" onPress={() => go('/surah/' + k)} />)}
            <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginTop: 6 }}>ALL 114 SURAHS</Text>
            <Glass radius={16} style={{ paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,.6)' }}>⌕</Text>
              <TextInput value={q} onChangeText={setQ} placeholder="Search surah name or number" placeholderTextColor="rgba(255,255,255,.45)" style={{ flex: 1, color: W, fontSize: 14, paddingVertical: 11, outlineStyle: 'none' } as any} />
            </Glass>
            {SURAH_LIST.filter((x) => { const t = q.trim().toLowerCase(); return !t || x.title.toLowerCase().includes(t) || String(x.num) === t || x.sub.toLowerCase().includes(t); }).map((x) => (
              <Pressable key={x.key} onPress={() => go('/surah/' + x.key)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' }}>
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(94,231,181,.3)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>{x.num}</Text></View>
                  <View style={{ flex: 1, minWidth: 0 }}><Text style={{ color: W, fontSize: 14.5, fontWeight: '700' }}>{x.title}{isl.bm[x.key] ? '  ★' : ''}</Text><Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 2 }}>{x.sub} · {x.place}</Text></View>
                  <Text numberOfLines={1} style={{ color: W, fontSize: 19, lineHeight: 38, fontFamily: QURAN_FONT, flexShrink: 0 }}>{x.ar}</Text>
                </View>
              </Pressable>
            ))}
          </>)}
          {tab === 2 && (<>
            <Item ic="beads" t="Tasbih Counter" s="Count your zikir" c="rgba(255,196,107,.4)" onPress={() => go('/tasbih')} />
            <Item ic="scroll" t="Tahlil Arwah" s="Standard reading · 25 parts" c="rgba(124,156,255,.4)" onPress={() => go('/tahlil')} />
            <Item ic="sun" t="Al-Ma'thurat" s="Sughra · 31 parts" c="rgba(255,143,171,.4)" onPress={() => go('/mathurat')} />
            <Item ic="mosque" t="Prayer Times" s="Alerts & Qibla" c="rgba(94,231,223,.4)" onPress={() => go('/prayer')} />
          </>)}
          {tab === 3 && (() => {
            const OTHER: Record<string, [string, string, string]> = { tahlil: ['Tahlil Arwah', 'Standard reading', '/tahlil'], mathurat: ["Al-Ma'thurat", 'Sughra', '/mathurat'] };
            const keys = Object.keys(isl.bm).filter((k) => isl.bm[k] && (SURAH[k] || OTHER[k]));
            const verses: { k: string; n: number }[] = []; Object.keys(isl.vb || {}).forEach((k) => { if (SURAH[k]) ((isl.vb || {})[k] || []).forEach((n) => verses.push({ k, n })); });
            if (!keys.length && !verses.length) return <Glass radius={22} style={{ padding: 20 }}><Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>No bookmarks yet</Text><Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 13, marginTop: 6, lineHeight: 19 }}>Open a surah, Tahlil or Al-Ma'thurat and tap the bookmark button. Your saved items will appear here.</Text></Glass>;
            const vrows = verses.map(({ k, n }) => { const vs = SURAH[k].verses.find((x) => x.n === n); return (
              <View key={k + ':' + n} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Pressable style={{ flex: 1 }} onPress={() => go('/surah/' + k + '?v=' + n)}><Glass radius={22} style={{ padding: 14 }}>
                  <Text style={{ color: '#ffd593', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>★ {SURAH[k].title.toUpperCase()} · VERSE {n}</Text>
                  <Text numberOfLines={2} style={{ color: 'rgba(255,255,255,.85)', fontSize: 13, lineHeight: 18, marginTop: 4 }}>{vs ? vs.ms : ''}</Text>
                </Glass></Pressable>
                <Pressable onPress={() => setIsl({ ...isl, vb: { ...(isl.vb || {}), [k]: ((isl.vb || {})[k] || []).filter((x) => x !== n) } })} accessibilityLabel="Remove verse bookmark"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ffb3bf', fontSize: 15 }}>✕</Text></Glass></Pressable>
              </View>); });
            return [...vrows, ...keys.map((k) => {
              const t = SURAH[k] ? SURAH[k].title : OTHER[k][0], sub = SURAH[k] ? SURAH[k].sub : OTHER[k][1], path = SURAH[k] ? '/surah/' + k : OTHER[k][2];
              return (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1 }}><Item t={t} s={sub} c="rgba(255,196,107,.4)" ic={SURAH[k] ? "book" : k === "tahlil" ? "scroll" : "sun"} onPress={() => go(path)} /></View>
                  <Pressable onPress={() => setIsl({ ...isl, bm: { ...isl.bm, [k]: false } })} accessibilityLabel="Remove bookmark"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ffb3bf', fontSize: 15 }}>✕</Text></Glass></Pressable>
                </View>
              );
            })];
          })()}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
