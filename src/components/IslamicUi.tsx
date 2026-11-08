import React, { useEffect, useRef } from 'react';
import { View, Pressable, Animated, Easing } from 'react-native';
import { Text } from './Txt';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Glass } from './Glass';
import { Blob } from './Bg';
import { W } from './Ui';
import Svg, { Path, Circle, Rect, Defs, Pattern, G } from 'react-native-svg';
import { Verse, AR_SIZE, M_SIZE } from '../lib/islamic';

export function Ic({ n, size = 22, color = '#fff' }: { n: string; size?: number; color?: string }) {
  const p: any = { stroke: color, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {n === 'book' && <Path d="M12 6.5C10.4 5.2 8.3 4.5 6 4.5v13c2.3 0 4.4.7 6 2m0-13c1.6-1.3 3.7-2 6-2v13c-2.3 0-4.4.7-6 2m0-13v13" {...p} />}
      {n === 'beads' && <>{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Circle key={i} cx={12 + 7 * Math.cos((i * Math.PI) / 4 - Math.PI / 2)} cy={10 + 7 * Math.sin((i * Math.PI) / 4 - Math.PI / 2)} r={1.7} {...p} fill={color} />)}<Path d="M12 17.5v3.5M10.5 21h3" {...p} /></>}
      {n === 'scroll' && <Path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 8h6M9 12h6M9 16h4" {...p} />}
      {n === 'sun' && <><Circle cx={12} cy={12} r={4} {...p} /><Path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8" {...p} /></>}
      {n === 'sunrise' && <><Path d="M6.5 16a5.5 5.5 0 0 1 11 0M2.5 19.5h19M12 4v4M8.5 6.8l1.4 1.4M15.5 6.8l-1.4 1.4" {...p} /><Path d="M10 5.5l2-2 2 2" {...p} /></>}
      {n === 'sunset' && <><Path d="M6.5 16a5.5 5.5 0 0 1 11 0M2.5 19.5h19M12 4v4M8.5 6.8l1.4 1.4M15.5 6.8l-1.4 1.4" {...p} /><Path d="M10 6.5l2 2 2-2" {...p} /></>}
      {n === 'moon' && <Path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" {...p} />}
      {n === 'mosque' && <Path d="M3 21v-7h4v7M17 21v-7h4v7M5 14V9l0-2M19 14V9l0-2M7 21v-6a5 5 0 0 1 10 0v6M12 10V7.5M10.5 7.5h3M2 21h20" {...p} />}
      {n === 'clock' && <><Circle cx={12} cy={12} r={9} {...p} /><Path d="M12 7v5l3.5 2" {...p} /></>}
      {n === 'compass' && <><Circle cx={12} cy={12} r={9} {...p} /><Path d="M15.5 8.5l-2 5-5 2 2-5z" {...p} /></>}
      {n === 'bookmark' && <Path d="M6 3h12v18l-6-4.5L6 21z" {...p} />}
      {n === 'star' && <Path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" {...p} />}
      {n === 'heart' && <Path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" {...p} />}
      {n === 'bell' && <Path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21a2 2 0 0 0 4 0" {...p} />}
      {n === 'bellOff' && <Path d="M6 17V11a6 6 0 0 1 9-5.2M18 11v6l1.5 2H8M10 21a2 2 0 0 0 4 0M3 3l18 18" {...p} />}
      {n === 'pray' && <Path d="M12 3c2 3 4 4.5 4 8a4 4 0 0 1-8 0c0-3.5 2-5 4-8zM5 21h14M8 21v-3M16 21v-3" {...p} />}
    </Svg>
  );
}


const STARS: [number, number, number][] = [[8, 5, 2], [22, 11, 1], [40, 4, 2], [58, 8, 1], [74, 3, 2], [90, 12, 1], [14, 21, 1], [48, 17, 2], [84, 24, 1], [30, 29, 2], [66, 33, 1], [5, 38, 2], [94, 41, 1], [52, 38, 1]];
function Twinkle({ x, y, s, i }: { x: number; y: number; s: number; i: number }) {
  const v = useRef(new Animated.Value(0.1)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.delay(i * 260),
      Animated.timing(v, { toValue: 1, duration: 1300 + s * 350, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.1, duration: 1300 + s * 350, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, []);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: (x + '%') as any, top: (y + '%') as any, width: s + 1.5, height: s + 1.5, borderRadius: 4, backgroundColor: '#fff', opacity: v, shadowColor: '#fff', shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }} />;
}
function Shoot({ left, top, delay, gap }: { left: string; top: string; delay: number; gap: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration: 1000, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(gap),
      Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: left as any, top: top as any, width: 96, height: 2, opacity: v.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 0.9, 0] }), transform: [{ rotate: '28deg' }, { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-20, 190] }) }] }}>
      <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(143,233,226,.55)', '#fff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 2 }} />
    </Animated.View>
  );
}
function Mote({ left, delay, dur, size }: { left: string; delay: number; dur: number; size: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, []);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: left as any, bottom: 40, width: size, height: size, borderRadius: size, backgroundColor: '#ffd593', shadowColor: '#ffc46b', shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, opacity: v.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.85, 0.5, 0] }), transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -150] }) }, { translateX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 10, -6] }) }] }} />;
}
function Glow() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, []);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', right: -34, top: -4, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] }) }] }}><Blob size={130} color="rgba(255,196,107,.38)" style={{ position: 'relative' }} /></Animated.View>;
}
function Effects() {
  return (
    <>
      <Glow />
      {STARS.map((t, i) => <Twinkle key={i} x={t[0]} y={t[1]} s={t[2]} i={i} />)}
      <Shoot left="4%" top="7%" delay={1500} gap={4500} />
      <Shoot left="38%" top="16%" delay={5200} gap={6200} />
      <Mote left="14%" delay={0} dur={6500} size={4} />
      <Mote left="36%" delay={2200} dur={8000} size={3} />
      <Mote left="58%" delay={900} dur={7000} size={4} />
      <Mote left="78%" delay={3600} dur={7600} size={3} />
      <Mote left="90%" delay={1800} dur={6000} size={3} />
    </>
  );
}
function Lantern() {
  const sw = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(sw, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(sw, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', right: 14, top: 0, width: 28, height: 58, alignItems: 'center', transformOrigin: 'top center', transform: [{ rotate: sw.interpolate({ inputRange: [0, 1], outputRange: ['-3.5deg', '3.5deg'] }) }] }}>
      <LinearGradient colors={['#ffd593', 'rgba(255,213,147,.2)']} style={{ width: 2, height: 14 }} />
      <Svg width={27} height={40} viewBox="0 0 34 50">
        <Path d="M17 0v6M9 10h16l3 8c0 9-5 14-11 14S6 27 6 18z" fill="#ffc46b" opacity={0.85} />
        <Path d="M12 14c0 8 2 12 5 14M22 14c0 8-2 12-5 14" stroke="#fff3d6" strokeWidth={1.3} fill="none" opacity={0.7} />
        <Path d="M13 34h8l-2 7h-4z" fill="#ffc46b" opacity={0.85} />
        <Circle cx={17} cy={42} r={4} fill="#ffd593" />
      </Svg>
    </Animated.View>
  );
}
export const IslamicBg = ({ a = 'rgba(52,211,153,.4)', b = 'rgba(124,156,255,.35)', deco = false }: { a?: string; b?: string; deco?: boolean }) => (
  <>
    <LinearGradient colors={['#0a0f2c', '#0f1f3d', '#0c3a3f']} locations={[0, 0.5, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
    <Blob size={320} color={a} style={{ right: -100, top: -40 }} />
    <Blob size={340} color={b} style={{ left: -120, bottom: 40 }} />
    {deco && (
      <>
        <Svg pointerEvents="none" width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0 }}>
          <Defs>
            <Pattern id="geo" width={52} height={52} patternUnits="userSpaceOnUse">
              <Path d="M26 4l5.5 11.5L43 10l-5.5 11.5L49 26l-11.5 4.5L43 42l-11.5-5.5L26 48l-5.5-11.5L9 42l5.5-11.5L3 26l11.5-4.5L9 10l11.5 5.5z" fill="none" stroke="#fff" strokeWidth={1} opacity={0.09} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#geo)" />
        </Svg>
        <Svg pointerEvents="none" width="100%" height={164} viewBox="0 680 390 164" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <G opacity={0.16} fill="#7df0c6">
            <Path d="M0 844V760h30v-26l7-12 7 12v26h22v-40a52 52 0 0 1 104 0v40h20v-60l8-16 8 16v60h40v-30a30 30 0 0 1 60 0v30h24v-50l7-14 7 14v50h26V844z" />
            <Rect x={0} y={800} width={390} height={44} opacity={0.5} />
          </G>
          <Path d="M232 690a9 9 0 1 0 6 13 7.5 7.5 0 1 1-6-13z" fill="#fff" opacity={0.35} />
        </Svg>
        <Effects />
        <Lantern />
      </>
    )}
  </>
);
export function Header({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 16 }}>
      <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
      <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 21, fontWeight: '800', letterSpacing: -0.3 }}>{title}</Text>{sub ? <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>{sub}</Text> : null}</View>
      {right}
    </View>
  );
}
export function ToolBar({ saved, onSave, size, onSize, lang, onLang }: { saved: boolean; onSave: () => void; size: number; onSize: () => void; lang: string; onLang: () => void }) {
  const T = ({ a, b, onPress, c }: any) => <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}><Text style={{ color: c || 'rgba(255,255,255,.85)', fontSize: 15, fontWeight: '800' }}>{a}</Text><Text style={{ color: c || 'rgba(255,255,255,.75)', fontSize: 11.5, fontWeight: '600', marginTop: 1 }}>{b}</Text></Pressable>;
  return (
    <Glass radius={22} style={{ marginHorizontal: 20, marginBottom: 12, flexDirection: 'row' }}>
      <T a={saved ? '★' : '☆'} b={saved ? 'Saved' : 'Save'} c={saved ? '#ffd593' : undefined} onPress={onSave} />
      <T a="Aa" b={['S', 'M', 'L'][size]} onPress={onSize} />
      <T a="文" b={lang === 'en' ? 'EN' : 'BM'} onPress={onLang} />
    </Glass>
  );
}
export function VerseBlock({ v, size, lang, showNum = true, active, onPress, onLong, marked, last }: { v: Verse; size: number; lang: string; showNum?: boolean; active?: boolean; onPress?: () => void; onLong?: () => void; marked?: boolean; last?: boolean }) {
  return (
    <Pressable onPress={onPress} onLongPress={onLong} delayLongPress={380} style={{ paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(255,255,255,.1)', backgroundColor: active ? 'rgba(125,240,198,.12)' : 'transparent', borderRadius: active ? 14 : 0 }}>
      <Text style={{ color: W, fontSize: AR_SIZE[size] + 3, lineHeight: (AR_SIZE[size] + 3) * 1.9, textAlign: 'right', writingDirection: 'rtl' }}>{v.ar}{showNum ? <Text style={{ color: '#7df0c6', fontSize: 15 }}>{'  ﴿' + v.n + '﴾'}</Text> : null}{marked ? <Text style={{ color: '#ffd593', fontSize: 15 }}>{'  ★'}</Text> : null}</Text>
      {v.rumi ? <Text style={{ color: '#8fe9e2', fontSize: M_SIZE[size] + 1, fontStyle: 'italic', lineHeight: (M_SIZE[size] + 1) * 1.5, marginTop: 6 }}>{v.rumi}</Text> : null}
      <Text style={{ color: 'rgba(255,255,255,.82)', fontSize: M_SIZE[size] + 1, lineHeight: (M_SIZE[size] + 1) * 1.5, marginTop: 6 }}>{lang === 'en' ? v.en : v.ms}</Text>
    </Pressable>
  );
}
export const Credit = ({ lang }: { lang: string }) => (
  <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 10.5, lineHeight: 15, marginTop: 14, marginHorizontal: 4 }}>
    Arabic: Quran Uthmani (Hafs), King Fahd Quran Complex text. {lang === 'en' ? 'English: Marmaduke Pickthall (public domain).' : 'Malay: Abdullah Muhammad Basmeih (Tanzil edition).'} Dataset: github.com/fawazahmed0/quran-api. Texts checked by an ustaz.
  </Text>
);
export const Pending = ({ kind }: { kind: string }) => (
  <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 12 }}>
    <Text style={{ color: '#ffd593', fontSize: 13, fontWeight: '800' }}>Text to be added</Text>
    <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 12.5, lineHeight: 18, textAlign: 'center', marginTop: 6 }}>This {kind === 'Quran' ? 'part' : kind.toLowerCase()} will be added only from a verified source, checked by someone knowledgeable.</Text>
  </View>
);
