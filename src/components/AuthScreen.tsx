import React, { useEffect, useRef, useState } from 'react';
import { View, Keyboard, Linking, useWindowDimensions, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, TextInput, Animated, Easing, Image } from 'react-native';
import { Text } from './Txt';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line, Defs, Pattern, Stop, RadialGradient as SRG } from 'react-native-svg';
import { GP, W } from './Ui';
import { Blob } from './Bg';
import { CodeBoxes } from './CodeBoxes';
import { pwLevel, PW_TEXT } from '../lib/pwstrength';
import { SUPPORT_EMAIL2, PRIVACY_URL } from '../lib/legal';
import { signIn, signUp, verifyCode, resendSignup, sendReset, setNewPassword } from '../lib/auth';

type Mode = 'in' | 'up' | 'verify' | 'forgot' | 'reset';
const OK = /^[^\s@.]+(\.[^\s@.]+)*@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/;
export const TEAL = '#8fe9e2';

const Ico = ({ n, c = 'rgba(255,255,255,.55)' }: { n: 'user' | 'mail' | 'lock' | 'key' | 'eye' | 'eyeoff'; c?: string }) => (
  <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    {n === 'user' && <><Circle cx="12" cy="8" r="4" /><Path d="M4 21c1-4.2 4.2-6 8-6s7 1.8 8 6" /></>}
    {n === 'mail' && <><Rect x="3" y="5" width="18" height="14" rx="3" /><Path d="M3.5 7.5l8.5 6 8.5-6" /></>}
    {n === 'lock' && <><Rect x="5" y="11" width="14" height="10" rx="3" /><Path d="M8 11V8a4 4 0 0 1 8 0v3" /></>}
    {n === 'key' && <><Circle cx="8" cy="15" r="4" /><Path d="M11 12l9-9M16 7l3 3" /></>}
    {n === 'eye' && <><Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><Circle cx="12" cy="12" r="3" /></>}
    {n === 'eyeoff' && <><Path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 7.6A16.6 16.6 0 0 0 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1" /></>}
  </Svg>
);

// One input row: icon on the left, glowing border while typing, optional show/hide for passwords.
export function Field({ icon, secret, bad, label, ...p }: any) {
  const [f, setF] = useState(false); const [show, setShow] = useState(false);
  return (
    <View style={label ? { marginBottom: 12 } : undefined}>
    {label ? <Text style={{ color: f ? TEAL : 'rgba(255,255,255,.72)', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginLeft: 4, marginBottom: 6 }}>{String(label).toUpperCase()}</Text> : null}
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 15, paddingHorizontal: 14, marginBottom: label ? 0 : 9, backgroundColor: f ? '#2c5a78' : '#2e2d6c', borderWidth: 1.2, borderColor: bad ? 'rgba(255,107,129,.85)' : f ? 'rgba(143,233,226,.75)' : 'rgba(255,255,255,.13)', shadowColor: TEAL, shadowOpacity: f ? 0.55 : 0, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }}>
      <Ico n={icon} c={f ? TEAL : undefined} />
      <TextInput {...p} secureTextEntry={secret && !show} onFocus={() => setF(true)} onBlur={(e: any) => { setF(false); p.onBlur && p.onBlur(e); }} placeholderTextColor="rgba(255,255,255,.38)" underlineColorAndroid="transparent" importantForAutofill="no" selectionColor="#8fe9e2" maxFontSizeMultiplier={1.1}
        style={[{ flex: 1, minWidth: 0, backgroundColor: 'transparent', color: W, fontSize: 15, marginLeft: 11, paddingVertical: 0, outlineStyle: 'none' } as any, p.style]} />
      {secret ? <Pressable onPress={() => setShow(!show)} hitSlop={10} accessibilityLabel={show ? 'Hide password' : 'Show password'}><Ico n={show ? 'eye' : 'eyeoff'} /></Pressable> : null}
    </View>
    </View>
  );
}

// A soft light that drifts slowly, so the background feels alive.
export function Drift({ size, color, x, y, dx, dy, dur }: any) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.timing(t, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(t, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true })])); a.start(); return () => a.stop(); }, []);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: x, top: y, transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) }, { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) }] }}><Blob size={size} color={color} /></Animated.View>;
}
// Same night-sky effects as the Islamic Hub: twinkling stars, shooting stars and little lights floating up.
const SKY: [number, number, number][] = [[6, 4, 2], [18, 9, 1], [31, 3, 2], [46, 7, 1], [60, 4, 2], [74, 9, 1], [88, 5, 2], [95, 14, 1], [10, 19, 1], [26, 24, 2], [52, 21, 1], [68, 27, 2], [84, 22, 1], [4, 33, 2], [92, 36, 1], [38, 33, 1], [14, 47, 1], [80, 46, 2], [56, 52, 1], [6, 60, 2], [93, 58, 1], [30, 66, 1], [72, 64, 2], [48, 72, 1], [12, 78, 2], [88, 76, 1], [62, 84, 2], [24, 90, 1], [78, 92, 1], [42, 96, 2]];
function Twinkle({ x, y, s, i }: { x: number; y: number; s: number; i: number }) {
  const v = useRef(new Animated.Value(0.1)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.delay((i * 230) % 2600),
      Animated.timing(v, { toValue: 1, duration: 1200 + s * 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.1, duration: 1200 + s * 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    l.start(); return () => l.stop();
  }, []);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: (x + '%') as any, top: (y + '%') as any, width: s + 1.5, height: s + 1.5, borderRadius: 4, backgroundColor: '#fff', opacity: v, shadowColor: '#fff', shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }} />;
}
function Shoot({ left, top, delay, gap, angle = 28 }: { left: string; top: string; delay: number; gap: number; angle?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(gap),
      Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    l.start(); return () => l.stop();
  }, []);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: left as any, top: top as any, width: 120, height: 2.5, opacity: v.interpolate({ inputRange: [0, 0.08, 0.7, 1], outputRange: [0, 1, 0.9, 0] }), transform: [{ rotate: angle + 'deg' }, { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-20, 230] }) }] }}>
      <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(143,233,226,.6)', '#fff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 2 }} />
      <View style={{ position: 'absolute', right: -2, top: -2, width: 6.5, height: 6.5, borderRadius: 4, backgroundColor: '#fff', shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }} />
    </Animated.View>
  );
}
function Mote({ left, delay, dur, size, color }: { left: string; delay: number; dur: number; size: number; color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    l.start(); return () => l.stop();
  }, []);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', left: left as any, bottom: 20, width: size, height: size, borderRadius: size, backgroundColor: color, shadowColor: color, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, opacity: v.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 0.9, 0.7, 0] }), transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -640] }) }, { translateX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 14, -8] }) }] }} />;
}
export function Sky() {
  return (
    <>
      {SKY.map((t, i) => <Twinkle key={i} x={t[0]} y={t[1]} s={t[2]} i={i} />)}
      <Shoot left="2%" top="4%" delay={900} gap={3800} />
      <Shoot left="40%" top="10%" delay={3600} gap={5200} angle={32} />
      <Shoot left="-6%" top="38%" delay={6400} gap={6800} angle={22} />
      <Shoot left="30%" top="62%" delay={9000} gap={7600} angle={26} />
      <Mote left="10%" delay={0} dur={7500} size={4} color="#8fe9e2" />
      <Mote left="30%" delay={2400} dur={9000} size={3} color="#ffd593" />
      <Mote left="52%" delay={1100} dur={8000} size={4} color="#ff8fe0" />
      <Mote left="72%" delay={3900} dur={8600} size={3} color="#8fe9e2" />
      <Mote left="90%" delay={1900} dur={7000} size={3} color="#ffd593" />
    </>
  );
}


// Animated logo: neon border that turns, slow lights moving inside the icon, soft waves going out and two tiny stars orbiting.
function useSpin(dur: number, rev = false) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = Animated.loop(Animated.timing(t, { toValue: 1, duration: dur, easing: Easing.linear, useNativeDriver: true })); a.start(); return () => a.stop(); }, []);
  return t.interpolate({ inputRange: [0, 1], outputRange: rev ? ['360deg', '0deg'] : ['0deg', '360deg'] });
}
function Wave({ delay }: { delay: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.delay(delay), Animated.timing(t, { toValue: 1, duration: 3200, easing: Easing.out(Easing.quad), useNativeDriver: true }), Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true })])); a.start(); return () => a.stop(); }, []);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 108, height: 108, borderRadius: 34, borderWidth: 1.5, borderColor: 'rgba(143,233,226,.7)', opacity: t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.6, 0] }), transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }] }} />;
}
export function Logo({ waves = true }: { waves?: boolean }) {
  const inner = useSpin(9000); const inner2 = useSpin(13000, true); const orbit = useSpin(7000); const orbit2 = useSpin(11000, true);
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(pulse, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true })])); a.start(); return () => a.stop(); }, []);
  return (
    <View style={{ width: 170, height: 170, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 170, height: 170, transform: [{ rotate: orbit }] }}>
        <View style={{ position: 'absolute', left: 82, top: 2, width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff', shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 170, height: 170, transform: [{ rotate: orbit2 }] }}>
        <View style={{ position: 'absolute', left: 83, top: 160, width: 5, height: 5, borderRadius: 3, backgroundColor: '#ffd593', shadowColor: '#ffc46b', shadowOpacity: 1, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } }} />
      </Animated.View>
      {/* The same soft breathing glow as the old logo: one round purple light just beyond the icon. */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 150, height: 150, borderRadius: 75, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }] }}>
        <Blob size={150} color="rgba(138,123,255,0.55)" />
      </Animated.View>
      <View style={{ width: 112, height: 112, borderRadius: 28, backgroundColor: '#1e2255' }}>
      <View style={{ width: 112, height: 112, borderRadius: 28, overflow: 'hidden' }}>
        {/* Same icon as the home screen, built in layers: the three colour lights turn slowly behind the raised glass tile. */}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -28, top: -28, width: 168, height: 168, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }), transform: [{ rotate: inner }] }}>
          <Image source={require('../../assets/android-icon-background.png')} style={{ width: 168, height: 168 }} />
        </Animated.View>
        <Image source={require('../../assets/android-icon-foreground.png')} style={{ position: 'absolute', left: -10, top: -10, width: 132, height: 132 }} />
        {/* Glass sheen on the raised tile only (the icon's own background stays as it is). */}
        <View pointerEvents="none" style={{ position: 'absolute', left: 21, top: 21, width: 70, height: 70, borderRadius: 20, overflow: 'hidden' }}>
          <LinearGradient colors={['rgba(255,255,255,.3)', 'rgba(255,255,255,.06)', 'rgba(255,255,255,0)']} locations={[0, 0.4, 0.7]} start={{ x: 0.1, y: 0 }} end={{ x: 0.7, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, width: 70, height: 70 }} />
        </View>
      </View>
      </View>
    </View>
  );
}

// Wallpaper for the sign in and register screens.
const FULL: any = { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 };
function Geo() {
  // Eight-pointed star tiles, a pattern used all over Islamic art. Faint, with a soft glow from the top.
  return (
    <View pointerEvents="none" style={FULL}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="geo" width="60" height="60" patternUnits="userSpaceOnUse">
            <Path d="M30 4L36.5 17L50.5 13.5L47 27.5L60 34L47 40.5L50.5 54.5L36.5 51L30 64L23.5 51L9.5 54.5L13 40.5L0 34L13 27.5L9.5 13.5L23.5 17Z" transform="translate(0 -4)" fill="none" stroke="rgba(143,233,226,0.2)" strokeWidth={1} />
            <Circle cx="30" cy="30" r="2" fill="rgba(255,213,147,0.35)" />
            <Circle cx="0" cy="0" r="1.4" fill="rgba(255,255,255,0.22)" /><Circle cx="60" cy="0" r="1.4" fill="rgba(255,255,255,0.22)" /><Circle cx="0" cy="60" r="1.4" fill="rgba(255,255,255,0.22)" /><Circle cx="60" cy="60" r="1.4" fill="rgba(255,255,255,0.22)" />
          </Pattern>
          <SRG id="gl" cx="50%" cy="8%" r="70%"><Stop offset="0" stopColor="#8a7bff" stopOpacity="0.45" /><Stop offset="1" stopColor="#0a0f2c" stopOpacity="0" /></SRG>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#geo)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#gl)" />
      </Svg>
    </View>
  );
}
export function Wallpaper() { return <Geo />; }

// Background of the sign in and register screens: slow aurora lights, a crown of Islamic star pattern that fades out toward the form, and a calm night sky.
// The background tells what the app holds: one logo in the middle and small tiles for each part of the app drifting around it,
// joined by faint dotted lines. Each tile uses the colour of its module (Planner blue, Islamic Hub green, Finance amber, Record pink, Habit purple).
type SatK = 'calendar' | 'crescent' | 'coin' | 'heart' | 'book' | 'check' | 'drop' | 'bike';
const SAT: { k: SatK; dx: number; dy: number; rgb: string; dur: number; amp: number }[] = [
  { k: 'crescent', dx: -148, dy: -26, rgb: '94,231,181', dur: 5200, amp: 6 },
  { k: 'calendar', dx: 150, dy: -44, rgb: '124,156,255', dur: 6100, amp: 5 },
  { k: 'coin', dx: 160, dy: 34, rgb: '255,196,107', dur: 5600, amp: 6 },
  { k: 'heart', dx: -160, dy: 40, rgb: '183,148,255', dur: 6600, amp: 5 },
  { k: 'book', dx: -92, dy: -74, rgb: '94,231,181', dur: 7000, amp: 4 },
  { k: 'check', dx: 96, dy: -80, rgb: '124,156,255', dur: 5900, amp: 5 },
  { k: 'drop', dx: -112, dy: 96, rgb: '94,231,223', dur: 6400, amp: 4 },
  { k: 'bike', dx: 118, dy: 100, rgb: '255,143,171', dur: 5400, amp: 5 },
];
const SatGlyph = ({ k, c }: { k: SatK; c: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {k === 'calendar' && <><Rect x="3.5" y="5" width="17" height="15.5" rx="3" /><Path d="M3.5 10h17M8 3v4M16 3v4" /><Circle cx="8.5" cy="14.5" r="1" /><Circle cx="12.5" cy="14.5" r="1" /></>}
    {k === 'crescent' && <><Path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /><Path d="M17 3.5v3M15.5 5h3" /></>}
    {k === 'coin' && <><Circle cx="12" cy="12" r="8.5" /><Path d="M12 7v10M14.6 9.6c-.4-1-1.4-1.5-2.6-1.5-1.5 0-2.6.7-2.6 1.8 0 2.4 5.4 1.2 5.4 3.6 0 1.1-1.1 1.9-2.8 1.9-1.3 0-2.3-.6-2.7-1.6" /></>}
    {k === 'heart' && <><Path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" /><Path d="M7.5 12h2.2l1.4-2.4 2 5 1.4-2.6h2" /></>}
    {k === 'book' && <><Path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5M12 6.5C14 5 17 4.5 20 5v13c-3-.5-6 0-8 1.5M12 6.5v13" /></>}
    {k === 'check' && <><Circle cx="12" cy="12" r="8.5" /><Path d="M8 12.3l2.8 2.8 5.4-5.6" /></>}
    {k === 'drop' && <Path d="M12 3.5s6 6.2 6 10.6a6 6 0 0 1-12 0C6 9.7 12 3.5 12 3.5z" />}
    {k === 'bike' && <><Circle cx="6" cy="16" r="3.2" /><Circle cx="18" cy="16" r="3.2" /><Path d="M6 16l3.6-7h4.2l4.2 7M13.8 9l-1.4-3H10M9.6 9l2.6 7" /></>}
  </Svg>
);
function Sat({ k, x, y, rgb, dur, amp, i, on }: { k: SatK; x: number; y: number; rgb: string; dur: number; amp: number; i: number; on: boolean }) {
  const t = useRef(new Animated.Value(0)).current; const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.timing(t, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(t, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true })])); a.start(); return () => a.stop(); }, []);
  useEffect(() => { Animated.timing(fade, { toValue: on ? 1 : 0, duration: on ? 700 : 150, delay: on ? 250 + i * 110 : 0, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [on]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: x - 23, top: y - 23, width: 46, height: 46, opacity: fade, transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-amp, amp] }) }, { scale: fade.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }}>
      <View style={{ flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(' + rgb + ',.14)', borderWidth: 1, borderColor: 'rgba(' + rgb + ',.42)', shadowColor: 'rgb(' + rgb + ')', shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }}>
        <SatGlyph k={k} c={'rgb(' + rgb + ')'} />
      </View>
    </Animated.View>
  );
}
function Satellites({ w, cy, scale, on }: { w: number; cy: number; scale: number; on: boolean }) {
  const cx = w / 2; const pts = SAT.filter((a) => scale >= 0.8 || (a.dy > -60 && a.dy < 90)).map((a) => ({ ...a, x: cx + a.dx * scale, y: Math.max(30, cy + a.dy * scale) }));
  return (
    <View pointerEvents="none" style={FULL}>
      <Svg width="100%" height="100%" style={{ opacity: on ? 1 : 0 }}>
        {pts.map((a, i) => {
          const dx = a.x - cx, dy = a.y - cy, len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len;
          return <Line key={i} x1={cx + ux * 62 * scale} y1={cy + uy * 62 * scale} x2={a.x - ux * 28} y2={a.y - uy * 28} stroke={'rgba(' + a.rgb + ',.34)'} strokeWidth={1.1} strokeDasharray="2 6" strokeLinecap="round" />;
        })}
      </Svg>
      {pts.map((a, i) => <Sat key={a.k} k={a.k} x={a.x} y={a.y} rgb={a.rgb} dur={a.dur} amp={a.amp} i={i} on={on} />)}
    </View>
  );
}
function AuthBg({ w, cy, scale, on }: { w: number; cy: number; scale: number; on: boolean }) {
  return (
    <>
      <LinearGradient colors={['#080c27', '#171061', '#0d1f55', '#08122e']} locations={[0, 0.38, 0.72, 1]} style={FULL} />
      <Drift size={460} color="rgba(106,77,240,0.55)" x={-170} y={-120} dx={60} dy={40} dur={9000} />
      <Drift size={380} color="rgba(94,231,223,0.30)" x={140} y={300} dx={-50} dy={50} dur={11000} />
      <Drift size={360} color="rgba(255,143,224,0.24)" x={-150} y={560} dx={55} dy={-45} dur={10000} />
      <Svg width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none"><Defs><SRG id="halo2" cx="50%" cy="16%" r="55%"><Stop offset="0" stopColor="#8a7bff" stopOpacity="0.5" /><Stop offset="1" stopColor="#0a0f2c" stopOpacity="0" /></SRG></Defs><Rect x="0" y="0" width="100%" height="100%" fill="url(#halo2)" /></Svg>
      {SKY.filter((_, i) => i % 3 === 0).map((t, i) => <Twinkle key={i} x={t[0]} y={t[1]} s={t[2]} i={i} />)}
      <Satellites w={w} cy={cy} scale={scale} on={on} />
      <Shoot left="4%" top="5%" delay={1500} gap={6500} />
      <Mote left="14%" delay={0} dur={9000} size={3} color="#8fe9e2" />
      <Mote left="62%" delay={3000} dur={10000} size={3} color="#ffd593" />
      <Mote left="86%" delay={1800} dur={9500} size={3} color="#ff8fe0" />
    </>
  );
}

function PwMeter({ pw }: { pw: string }) {
  if (!pw) return null;
  const lv = pwLevel(pw); const col = ['#ff7a8f', '#ffc46b', '#5ee7b5'][lv];
  return (
    <View style={{ marginTop: -2, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', gap: 5 }}>{[0, 1, 2].map((i) => <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= lv ? col : 'rgba(255,255,255,.14)' }} />)}</View>
      <Text style={{ color: col, fontSize: 11.5, lineHeight: 16, marginTop: 5, fontWeight: '600' }}>{PW_TEXT[lv]}</Text>
    </View>
  );
}

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('in');
  const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const [pw, setPw] = useState(''); const [code, setCode] = useState('');
  const [emailSeen, setEmailSeen] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [info, setInfo] = useState('');
  // The logo stays pinned at the top; it hides while the keyboard is open so the form always has room.
  const [kb, setKb] = useState(false);
  // Every mode starts at the same height so the logo never jumps. Short phones get a smaller header.
  const { height: winH, width: winW0 } = useWindowDimensions();
  const winW = Math.min(winW0, 520);
  const compact = winH < 720;
  const topPad = compact ? 20 : Math.max(24, Math.min(90, Math.round((winH - 755) / 2)));
  useEffect(() => {
    const a = Keyboard.addListener('keyboardDidShow', () => setKb(true)); const b = Keyboard.addListener('keyboardDidHide', () => setKb(false));
    return () => { a.remove(); b.remove(); };
  }, []);
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => { enter.setValue(0); Animated.timing(enter, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [mode]);
  const go = (m: Mode) => { setEmailSeen(false); setMode(m); setErr(''); setInfo(''); setCode(''); };
  const run = async (f: () => Promise<void>) => { if (busy) return; setBusy(true); setErr(''); setInfo(''); try { await f(); } finally { setBusy(false); } };
  const emailBad = email.trim().length > 0 && !OK.test(email.trim()) && (emailSeen || email.includes('@'));
  const needEmail = () => { if (!OK.test(email.trim())) { setErr('Enter a valid email address.'); return false; } return true; };

  const doIn = () => run(async () => {
    if (!needEmail()) return; if (!pw) { setErr('Enter your password.'); return; }
    const r = await signIn(email, pw);
    if (!r.ok) { if (r.unconfirmed) { await resendSignup(email); go('verify'); setInfo('Your email is not confirmed yet. We sent you a new code.'); } else setErr(r.err); }
  });
  const doUp = () => run(async () => {
    if (name.trim().length < 2) { setErr('Enter your name.'); return; }
    if (!needEmail()) return;
    if (pw.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    const r = await signUp(name, email, pw);
    if (!r.ok) setErr(r.err); else if (r.confirm) { go('verify'); setInfo('We sent a 6-digit code to ' + email.trim() + '.'); }
  });
  const doVerify = () => run(async () => {
    if (code.trim().length < 6) { setErr('Enter the code from your email.'); return; }
    const r = await verifyCode(email, code, 'signup'); if (!r.ok) setErr(r.err);
  });
  const doResend = () => run(async () => { const r = await resendSignup(email); if (!r.ok) setErr(r.err); else setInfo('A new code was sent.'); });
  const doForgot = () => run(async () => {
    if (!needEmail()) return; const r = await sendReset(email);
    if (!r.ok) setErr(r.err); else { go('reset'); setInfo('If this email has an account, a 6-digit code is on its way.'); }
  });
  const doReset = () => run(async () => {
    if (code.trim().length < 6) { setErr('Enter the code from your email.'); return; }
    if (pw.length < 8) { setErr('Password must be at least 8 characters.'); return; }
    const v = await verifyCode(email, code, 'recovery'); if (!v.ok) { setErr(v.err); return; }
    const r = await setNewPassword(pw); if (!r.ok) setErr(r.err);
  });

  const head = { in: ['Welcome back', 'Sign in to pick up where you left off.'], up: ['Create your account', 'It takes a minute. Your data stays yours.'], verify: ['Check your email', 'Type the 6-digit code we sent you.'], forgot: ['Forgot password?', 'We will email you a 6-digit code.'], reset: ['New password', 'Enter the code and choose a new password.'] }[mode];
  const main = { in: ['Sign in', doIn], up: ['Create account', doUp], verify: ['Confirm', doVerify], forgot: ['Send code', doForgot], reset: ['Save password', doReset] }[mode] as [string, () => void];
  const tabs = mode === 'in' || mode === 'up';
  const link = (t: string, f: () => void) => <Pressable onPress={f} hitSlop={8}><Text style={{ color: TEAL, fontSize: 13.5, fontWeight: '700' }}>{t}</Text></Pressable>;

  const lbl = (t: string) => ({ label: t });
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#080c27', zIndex: 60, overflow: 'hidden' }}>
      <AuthBg w={winW} cy={topPad + (compact ? 42 : 56)} scale={compact ? 0.72 : winW < 360 ? 0.85 : 1} on={!kb} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start', paddingHorizontal: 22, paddingTop: topPad, paddingBottom: 28 }}>
          {kb ? null : (
            <View style={{ alignItems: 'center', marginBottom: compact ? 14 : 22 }}>
              <View style={{ width: compact ? 84 : 112, height: compact ? 84 : 112, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 170, height: 170, transform: [{ scale: compact ? 0.48 : 0.64 }] }}><Logo /></View></View>
              <Text style={{ color: W, fontSize: compact ? 26 : 32, fontWeight: '800', letterSpacing: 0.4, marginTop: 4 }}>My Life</Text>
              {compact ? null : <Text style={{ color: TEAL, fontSize: 11.5, fontWeight: '700', letterSpacing: 2.4, marginTop: 8 }}>YOUR DAY, ONE APP</Text>}
            </View>
          )}

          <View style={{ borderRadius: 28, padding: 18, backgroundColor: 'rgba(36,34,102,.86)', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)', borderTopColor: 'rgba(255,255,255,.4)', borderBottomColor: 'rgba(0,0,0,.35)', borderBottomWidth: 2, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 16 }}>
            <LinearGradient colors={['rgba(255,255,255,.2)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 120 }} />
            {tabs ? (
              <View style={{ flexDirection: 'row', padding: 4, borderRadius: 16, backgroundColor: 'rgba(12,10,52,.55)', marginBottom: 16 }}>
                {(['in', 'up'] as const).map((m) => (
                  <Pressable key={m} onPress={() => { if (m !== mode) setPw(''); go(m); }} style={{ flex: 1 }}>
                    {mode === m
                      ? <LinearGradient colors={GP} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 11, borderRadius: 12, alignItems: 'center' }}><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{m === 'in' ? 'Sign in' : 'Register'}</Text></LinearGradient>
                      : <View style={{ paddingVertical: 11, alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,.68)', fontSize: 14, fontWeight: '700' }}>{m === 'in' ? 'Sign in' : 'Register'}</Text></View>}
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Animated.View style={{ opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
              <Text style={{ color: W, fontSize: 21, fontWeight: '800' }}>{head[0]}</Text>
              <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 13, marginTop: 3, marginBottom: 16, lineHeight: 18 }}>{head[1]}</Text>

              {mode === 'up' ? <Field {...lbl('Name')} icon="user" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" autoComplete="name" maxLength={30} /> : null}
              {mode !== 'verify' && mode !== 'reset' ? <><Field {...lbl('Email')} icon="mail" bad={emailBad} value={email} onChangeText={setEmail} onBlur={() => setEmailSeen(true)} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />{emailBad ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: -6, marginBottom: 12, marginLeft: 4 }}>That does not look like a real email address.</Text> : null}</> : null}
              {mode === 'in' ? <>
                <Field {...lbl('Password')} icon="lock" secret value={pw} onChangeText={setPw} placeholder="Your password" autoCapitalize="none" autoCorrect={false} autoComplete="current-password" />
                <View style={{ alignItems: 'flex-end', marginTop: -4, marginBottom: 16 }}>{link('Forgot password?', () => go('forgot'))}</View>
              </> : null}
              {mode === 'up' ? <><Field {...lbl('Password')} icon="lock" secret value={pw} onChangeText={setPw} placeholder="At least 8 characters" autoCapitalize="none" autoCorrect={false} autoComplete="new-password" /><PwMeter pw={pw} /></> : null}
              {mode === 'verify' || mode === 'reset' ? <CodeBoxes value={code} onChange={setCode} length={6} shake={err} /> : null}
              {mode === 'reset' ? <><Field {...lbl('New password')} icon="lock" secret value={pw} onChangeText={setPw} placeholder="At least 8 characters" autoCapitalize="none" autoCorrect={false} autoComplete="new-password" /><PwMeter pw={pw} /></> : null}

              {err ? <View style={{ padding: 11, borderRadius: 12, backgroundColor: 'rgba(255,107,129,.16)', borderWidth: 1, borderColor: 'rgba(255,107,129,.45)', marginBottom: 14 }}><Text style={{ color: '#ffc2cc', fontSize: 13, lineHeight: 18 }}>{err}</Text></View> : null}
              {info ? <View style={{ padding: 11, borderRadius: 12, backgroundColor: 'rgba(143,233,226,.12)', borderWidth: 1, borderColor: 'rgba(143,233,226,.35)', marginBottom: 14 }}><Text style={{ color: TEAL, fontSize: 13, lineHeight: 18 }}>{info}</Text></View> : null}

              <Pressable onPress={main[1]} disabled={busy} style={{ shadowColor: '#8a7bff', shadowOpacity: 0.7, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8, borderRadius: 18 }}>
                <LinearGradient colors={['#7c9cff', '#9a8cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.75 : 1 }}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: W, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 }}>{main[0]}</Text>}
                </LinearGradient>
              </Pressable>

              {mode === 'up' ? (
                <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 12 }}>
                  {'By creating an account you agree to the '}
                  <Text onPress={() => Linking.openURL(PRIVACY_URL + '#terms').catch(() => {})} accessibilityRole="link" style={{ color: TEAL, fontWeight: '700' }}>Terms</Text>
                  {' and '}
                  <Text onPress={() => Linking.openURL(PRIVACY_URL + '#privacy').catch(() => {})} accessibilityRole="link" style={{ color: TEAL, fontWeight: '700' }}>Privacy Policy</Text>
                  {'.'}
                </Text>
              ) : null}
              {mode === 'verify' || mode === 'forgot' || mode === 'reset' ? (
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 22, marginTop: 14 }}>
                  {mode === 'verify' ? <>{link('Resend code', doResend)}{link('Back', () => go('in'))}</> : null}
                  {mode === 'forgot' || mode === 'reset' ? link('Back to sign in', () => go('in')) : null}
                </View>
              ) : null}
            </Animated.View>
          </View>

          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Ico n="lock" c="rgba(143,233,226,.9)" />
              <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12.5, fontWeight: '600' }}>Encrypted on your phone  ·  No ads</Text>
            </View>
            <Pressable onPress={() => Linking.openURL('mailto:' + SUPPORT_EMAIL2).catch(() => {})} hitSlop={8} style={{ marginTop: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,.66)', fontSize: 12.5 }}>Need help? <Text style={{ color: TEAL, fontWeight: '700' }}>Contact support</Text></Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
