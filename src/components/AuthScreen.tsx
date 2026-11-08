import React, { useEffect, useRef, useState } from 'react';
import { View, Keyboard, useWindowDimensions, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, TextInput, Animated, Easing } from 'react-native';
import { Text } from './Txt';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Defs, Pattern, Stop, RadialGradient as SRG } from 'react-native-svg';
import { GP, W } from './Ui';
import { Blob } from './Bg';
import { CodeBoxes } from './CodeBoxes';
import { pwLevel, PW_TEXT } from '../lib/pwstrength';
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
export function Field({ icon, secret, bad, ...p }: any) {
  const [f, setF] = useState(false); const [show, setShow] = useState(false);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 15, paddingHorizontal: 14, marginBottom: 9, backgroundColor: f ? '#2c5a78' : '#2e2d6c', borderWidth: 1.2, borderColor: bad ? 'rgba(255,107,129,.85)' : f ? 'rgba(143,233,226,.75)' : 'rgba(255,255,255,.13)', shadowColor: TEAL, shadowOpacity: f ? 0.55 : 0, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }}>
      <Ico n={icon} c={f ? TEAL : undefined} />
      <TextInput {...p} secureTextEntry={secret && !show} onFocus={() => setF(true)} onBlur={(e: any) => { setF(false); p.onBlur && p.onBlur(e); }} placeholderTextColor="rgba(255,255,255,.38)" underlineColorAndroid="transparent" importantForAutofill="no" selectionColor="#8fe9e2" maxFontSizeMultiplier={1.1}
        style={[{ flex: 1, minWidth: 0, backgroundColor: 'transparent', color: W, fontSize: 15, marginLeft: 11, paddingVertical: 0, outlineStyle: 'none' } as any, p.style]} />
      {secret ? <Pressable onPress={() => setShow(!show)} hitSlop={10}><Ico n={show ? 'eye' : 'eyeoff'} /></Pressable> : null}
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
      {waves ? <><Wave delay={0} /><Wave delay={1600} /></> : null}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 150, height: 150, borderRadius: 75, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }] }}>
        <Blob size={150} color="rgba(138,123,255,0.55)" />
      </Animated.View>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 170, height: 170, transform: [{ rotate: orbit }] }}>
        <View style={{ position: 'absolute', left: 82, top: 2, width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff', shadowColor: '#fff', shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 170, height: 170, transform: [{ rotate: orbit2 }] }}>
        <View style={{ position: 'absolute', left: 83, top: 160, width: 5, height: 5, borderRadius: 3, backgroundColor: '#ffd593', shadowColor: '#ffc46b', shadowOpacity: 1, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } }} />
      </Animated.View>
      <View style={{ width: 112, height: 112, borderRadius: 34, overflow: 'hidden', backgroundColor: '#1e2255', borderWidth: 1.2, borderColor: 'rgba(255,255,255,.26)' }}>
        <LinearGradient colors={['#4b5889', '#262962', '#1a2250', '#2f7580']} locations={[0, 0.42, 0.7, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, width: 112, height: 112 }} />
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: 112, height: 112, transform: [{ rotate: inner }] }}>
          <View style={{ position: 'absolute', left: 60, top: -30 }}><Blob size={90} color="rgba(94,231,223,0.35)" /></View>
        </Animated.View>
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: 112, height: 112, transform: [{ rotate: inner2 }] }}>
          <View style={{ position: 'absolute', left: -34, top: 62 }}><Blob size={90} color="rgba(183,148,255,0.35)" /></View>
        </Animated.View>
        <Svg width={112} height={112} viewBox="0 0 112 112" fill="none" style={{ position: 'absolute', left: 0, top: 0 }}><Path d="M27 82V30L56 63L85 30V82" stroke="#fff" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" /></Svg>
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
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [code, setCode] = useState('');
  const [emailSeen, setEmailSeen] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [info, setInfo] = useState('');
  // The logo stays pinned at the top; it hides while the keyboard is open so the form always has room.
  const [kb, setKb] = useState(false);
  // Same starting height on sign in and register, a little lower on taller phones.
  const { height: winH } = useWindowDimensions();
  const top = Math.max(40, Math.min(150, Math.round(winH * 0.135)));
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
    if (pw !== pw2) { setErr('The two passwords are not the same.'); return; }
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
    if (pw !== pw2) { setErr('The two passwords are not the same.'); return; }
    const v = await verifyCode(email, code, 'recovery'); if (!v.ok) { setErr(v.err); return; }
    const r = await setNewPassword(pw); if (!r.ok) setErr(r.err);
  });

  const head = { in: ['Welcome back', 'Sign in to pick up where you left off.'], up: ['Create your account', 'Your data stays yours.'], verify: ['Check your email', 'Type the 6-digit code we sent you.'], forgot: ['Forgot password?', 'We will email you a 6-digit code.'], reset: ['New password', 'Enter the code and choose a new password.'] }[mode];
  const main = { in: ['Sign in', doIn], up: ['Create account', doUp], verify: ['Confirm', doVerify], forgot: ['Send code', doForgot], reset: ['Save password', doReset] }[mode] as [string, () => void];
  const tabs = mode === 'in' || mode === 'up';
  const link = (t: string, f: () => void) => <Pressable onPress={f} hitSlop={8}><Text style={{ color: TEAL, fontSize: 13.5, fontWeight: '700' }}>{t}</Text></Pressable>;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0a0f2c', zIndex: 60, overflow: 'hidden' }}>
      <LinearGradient colors={['#0a0f2c', '#1b1466', '#0a0f2c']} locations={[0, 0.45, 1]} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Drift size={420} color="rgba(106,77,240,0.6)" x={-160} y={-110} dx={50} dy={40} dur={7000} />
      <Drift size={340} color="rgba(94,231,223,0.32)" x={150} y={250} dx={-45} dy={50} dur={9000} />
      <Drift size={320} color="rgba(255,143,224,0.26)" x={-130} y={520} dx={55} dy={-40} dur={8000} />
      <Wallpaper />
      <Sky />
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-start', paddingTop: top, paddingBottom: 16 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {kb ? null : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 0, paddingBottom: 14, paddingLeft: 22, paddingRight: 70 }}>
            <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 170, height: 170, transform: [{ scale: 0.52 }] }}><Logo /></View></View>
            <View style={{ marginLeft: 6 }}>
              <Text style={{ color: W, fontSize: 28, fontWeight: '800', letterSpacing: 0.3 }}>My Life</Text>
              <Text style={{ color: TEAL, fontSize: 11, fontWeight: '700', letterSpacing: 2.2, marginTop: 9 }}>YOUR DAY, ONE APP</Text>
            </View>
          </View>
        )}
        <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ justifyContent: 'flex-start', paddingHorizontal: 22, paddingTop: 6, paddingBottom: 20 }}>

          <View style={{ borderRadius: 26, padding: 16, backgroundColor: '#3b3a7e', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.42)', borderBottomColor: 'rgba(0,0,0,.38)', borderBottomWidth: 2, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 22, shadowOffset: { width: 0, height: 14 }, elevation: 16 }}>
            <LinearGradient colors={['rgba(255,255,255,.22)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 120 }} />
            {tabs ? (
              <View style={{ flexDirection: 'row', padding: 4, borderRadius: 16, backgroundColor: 'rgba(15,12,60,.45)', marginBottom: 12 }}>
                {(['in', 'up'] as const).map((m) => (
                  <Pressable key={m} onPress={() => { if (m !== mode) { setPw(''); setPw2(''); } go(m); }} style={{ flex: 1 }}>
                    {mode === m
                      ? <LinearGradient colors={GP} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 10, borderRadius: 12, alignItems: 'center' }}><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{m === 'in' ? 'Sign in' : 'Register'}</Text></LinearGradient>
                      : <View style={{ paddingVertical: 10, alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, fontWeight: '700' }}>{m === 'in' ? 'Sign in' : 'Register'}</Text></View>}
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Animated.View style={{ opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
              <Text style={{ color: W, fontSize: 20, fontWeight: '800' }}>{head[0]}</Text>
              <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 12.5, marginTop: 2, marginBottom: 12, lineHeight: 17 }}>{head[1]}</Text>

              {mode === 'up' ? <Field icon="user" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" autoComplete="name" maxLength={30} /> : null}
              {mode !== 'verify' && mode !== 'reset' ? <><Field icon="mail" bad={emailBad} value={email} onChangeText={setEmail} onBlur={() => setEmailSeen(true)} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />{emailBad ? <Text style={{ color: '#ff9aa9', fontSize: 11.5, marginTop: -4, marginBottom: 9 }}>That does not look like a real email address.</Text> : null}</> : null}
              {mode === 'in' ? <Field icon="lock" secret value={pw} onChangeText={setPw} placeholder="Password" autoCapitalize="none" autoCorrect={false} autoComplete="current-password" /> : null}
              {mode === 'up' ? <><Field icon="lock" secret value={pw} onChangeText={setPw} placeholder="Password (8+ characters)" autoCapitalize="none" autoCorrect={false} autoComplete="new-password" /><PwMeter pw={pw} /><Field icon="lock" secret value={pw2} onChangeText={setPw2} placeholder="Repeat password" autoCapitalize="none" autoCorrect={false} autoComplete="new-password" /></> : null}
              {mode === 'verify' || mode === 'reset' ? <CodeBoxes value={code} onChange={setCode} length={6} shake={err} /> : null}
              {mode === 'reset' ? <><Field icon="lock" secret value={pw} onChangeText={setPw} placeholder="New password (8+ characters)" autoCapitalize="none" autoCorrect={false} autoComplete="new-password" /><PwMeter pw={pw} /><Field icon="lock" secret value={pw2} onChangeText={setPw2} placeholder="Repeat new password" autoCapitalize="none" autoCorrect={false} autoComplete="new-password" /></> : null}

              {err ? <View style={{ padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,107,129,.16)', borderWidth: 1, borderColor: 'rgba(255,107,129,.4)', marginBottom: 12 }}><Text style={{ color: '#ffc2cc', fontSize: 12.5, lineHeight: 17 }}>{err}</Text></View> : null}
              {info ? <View style={{ padding: 10, borderRadius: 12, backgroundColor: 'rgba(143,233,226,.12)', borderWidth: 1, borderColor: 'rgba(143,233,226,.35)', marginBottom: 12 }}><Text style={{ color: TEAL, fontSize: 12.5, lineHeight: 17 }}>{info}</Text></View> : null}

              <Pressable onPress={main[1]} disabled={busy} style={{ shadowColor: '#8a7bff', shadowOpacity: 0.7, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8, borderRadius: 18 }}>
                <LinearGradient colors={['#7c9cff', '#9a8cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.75 : 1 }}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: W, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 }}>{main[0]}</Text>}
                </LinearGradient>
              </Pressable>

              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 22, marginTop: 12 }}>
                {mode === 'in' ? link('Forgot password?', () => go('forgot')) : null}
                {mode === 'verify' ? <>{link('Resend code', doResend)}{link('Back', () => go('in'))}</> : null}
                {mode === 'forgot' || mode === 'reset' ? link('Back to sign in', () => go('in')) : null}
              </View>
            </Animated.View>
          </View>

          <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 18, lineHeight: 19, letterSpacing: 0.3 }}>{'Planner  ·  Budget  ·  Finance\nHabits & Health  ·  Record  ·  Islamic Hub'}</Text>
          <Text style={{ color: 'rgba(255,255,255,.4)', fontSize: 11.5, textAlign: 'center', marginTop: 12, lineHeight: 16 }}>Your life, kept private and always with you.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
