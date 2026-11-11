import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, Modal, Animated, Easing } from 'react-native';
import { Text } from './Txt';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname } from 'expo-router';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Blob } from './Bg';
import { Inp } from './Ui';
import { Logo } from './AuthScreen';
import { checkPassword, getSession } from '../lib/auth';
import { useName } from '../lib/store';
import { useLock, checkPin, unlock, bioAuth, bioReady, wipeEverything, setPin, SENSITIVE } from '../lib/lock';

const W = '#fff';
const GP = ['#7c9cff', '#b794ff'] as [string, string];

// One round key: shrinks and glows while the finger is down, then springs back, with a soft ripple ring.
function Key({ k, label, ghost, onPress }: { k: string; label: string; ghost?: boolean; onPress: () => void }) {
  const sc = useRef(new Animated.Value(1)).current;
  const gl = useRef(new Animated.Value(0)).current;
  const rp = useRef(new Animated.Value(1)).current;
  const down = () => { Animated.parallel([Animated.timing(sc, { toValue: 0.86, duration: 70, useNativeDriver: true }), Animated.timing(gl, { toValue: 1, duration: 70, useNativeDriver: false })]).start(); };
  const up = () => {
    Animated.parallel([Animated.spring(sc, { toValue: 1, friction: 4, tension: 220, useNativeDriver: true }), Animated.timing(gl, { toValue: 0, duration: 380, useNativeDriver: false })]).start();
    rp.setValue(0); Animated.timing(rp, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };
  const plain = k === 'bio';
  const isOk = k === 'ok';
  return (
    <Pressable onPressIn={down} onPressOut={up} onPress={onPress} disabled={ghost} style={{ width: 76, height: 76, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderColor: '#8fe9e2', opacity: rp.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }), transform: [{ scale: rp.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.5] }) }] }} />
      <Animated.View style={{ opacity: ghost ? 0.3 : 1, transform: [{ scale: sc }] }}>
      <Animated.View style={{ width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', borderWidth: plain ? 0 : 1, borderColor: gl.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,.18)', 'rgba(143,233,226,.9)'] }) as any,
        backgroundColor: plain ? 'transparent' : gl.interpolate({ inputRange: [0, 1], outputRange: [isOk ? 'rgba(143,233,226,.22)' : 'rgba(255,255,255,.1)', 'rgba(143,233,226,.42)'] }) as any,
        }}>
        <Text style={{ color: W, fontSize: isOk || plain ? 14 : 28, fontWeight: isOk || plain ? '700' : '500' }}>{label}</Text>
      </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
// A PIN dot pops up when it is filled.
function PinDot({ on }: { on: boolean }) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => { if (on) { v.setValue(0.4); Animated.spring(v, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }).start(); } }, [on]);
  return <Animated.View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: on ? '#8fe9e2' : 'transparent', borderWidth: 1.5, borderColor: on ? '#8fe9e2' : 'rgba(255,255,255,.4)', shadowColor: '#5ee7df', shadowOpacity: on ? 0.9 : 0, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, transform: [{ scale: v }] }} />;
}

// Six-dot PIN entry with a keypad. 4 to 6 digits; it submits itself at 6 or when OK is pressed.
// Bump `shake` to make the dots wobble after a wrong PIN.
export function PinPad({ title, sub, err, onDone, onBio, extra, shake = 0 }: { title: string; sub?: string; err?: string; onDone: (pin: string) => void | Promise<void>; onBio?: () => void; extra?: React.ReactNode; shake?: number }) {
  const [pin, setP] = useState('');
  const sx = useRef(new Animated.Value(0)).current;
  useEffect(() => { if (shake) Animated.sequence([-12, 12, -9, 9, -5, 5, 0].map((t) => Animated.timing(sx, { toValue: t, duration: 50, useNativeDriver: true }))).start(); }, [shake]);
  const [busy, setBusy] = useState(false);
  // The last dot stays filled while the PIN is being checked, so the keypad never looks frozen.
  const go = async (v: string) => { setBusy(true); try { await onDone(v); } finally { setP(''); setBusy(false); } };
  const add = (d: string) => { if (busy) return; const n = (pin + d).slice(0, 6); setP(n); if (n.length === 6) go(n); };
  const left = pin.length >= 4 ? 'ok' : onBio ? 'bio' : 'ok';
  const lab = (k: string) => (k === '<' ? '⌫' : k === 'ok' ? 'OK' : k === 'bio' ? 'Scan' : k);
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: W, fontSize: 20, fontWeight: '800' }}>{title}</Text>
      {sub ? <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 18, paddingHorizontal: 12 }}>{sub}</Text> : null}
      <Animated.View style={{ flexDirection: 'row', gap: 12, marginTop: 20, height: 16, transform: [{ translateX: sx }] }}>
        {[0, 1, 2, 3, 4, 5].map((i) => <PinDot key={i} on={i < pin.length} />)}
      </Animated.View>
      <Text style={{ color: '#ffb3bf', fontSize: 12.5, marginTop: 12, minHeight: 18, textAlign: 'center' }}>{err || ' '}</Text>
      <View style={{ marginTop: 10, width: 76 * 3 + 16 * 2 }}>
        {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], [left, '0', '<']].map((r, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: i ? 12 : 0 }}>
            {r.map((k) => <Key key={k} k={k} label={lab(k)} ghost={k === 'ok' && pin.length < 4} onPress={() => busy ? null : (k === '<' ? setP(pin.slice(0, -1)) : k === 'ok' ? (pin.length >= 4 ? go(pin) : null) : k === 'bio' ? onBio && onBio() : add(k))} />)}
          </View>
        ))}
      </View>
      <View style={{ height: 14 }} />
      {extra}
    </View>
  );
}

// Used by Settings to set a new PIN (enter, then enter again) or to confirm the current one.
export function PinDialog({ mode, onClose, onOk, bio }: { mode: 'new' | 'verify'; onClose: () => void; onOk: (pin?: string) => void; bio?: boolean }) {
  const [first, setFirst] = useState<string | null>(null); const [err, setErr] = useState(''); const [shake, setShake] = useState(0);
  const bioTried = useRef(false);
  useEffect(() => { if (mode === 'verify' && bio && !bioTried.current) { bioTried.current = true; bioAuth('Confirm it is you').then((ok) => ok && onOk()); } }, []);
  const done = async (pin: string) => {
    if (mode === 'new') {
      if (pin.length < 4) return setErr('Use at least 4 digits.');
      if (first == null) { setFirst(pin); setErr(''); return; }
      if (first !== pin) { setFirst(null); return setErr('The two PINs did not match. Start again.'); }
      return onOk(pin);
    }
    const r = await checkPin(pin);
    if (r.r === 'ok') return onOk();
    setErr(r.r === 'wait' ? 'Too many tries. Wait ' + r.secs + ' seconds.' : 'Wrong PIN. ' + r.left + ' tries left.'); setShake((n) => n + 1);
  };
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(5,8,25,.85)', justifyContent: 'center', padding: 20 }}>
        <View style={{ padding: 20, borderRadius: 28, backgroundColor: '#131845', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
          <PinPad key={String(first)} title={mode === 'verify' ? 'Enter your PIN' : first == null ? 'Create a PIN' : 'Repeat your PIN'}
            sub={mode === 'verify' ? 'Confirm it is you to continue.' : first == null ? 'Choose 4 to 6 digits.' : 'Enter the same PIN once more.'}
            err={err} shake={shake} onDone={done} onBio={mode === 'verify' && bio ? () => bioAuth('Confirm it is you').then((ok) => ok && onOk()) : undefined}
            extra={mode === 'new' && first == null ? <Text style={{ color: '#ffd593', fontSize: 12, lineHeight: 17, marginTop: 6, textAlign: 'center', paddingHorizontal: 8 }}>If you forget the PIN and cannot use your fingerprint, the only way back in is to erase the app data. Save a copy with Export first.</Text> : null} />
          <Pressable onPress={onClose} style={{ alignSelf: 'center', marginTop: 14 }}><Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 13.5, fontWeight: '700' }}>Cancel</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Full-screen cover. Shown while the app is locked (for the whole app, or only Finance, Notes and Records).
export function LockScreen() {
  const { cfg, locked } = useLock();
  const path = usePathname();
  const [err, setErr] = useState(''); const [shake, setShake] = useState(0); const [forgot, setForgot] = useState<'' | 'menu' | 'erase' | 'newpin' | 'pw'>('');
  const [pw, setPw] = useState(''); const [pwErr, setPwErr] = useState(''); const [pwBusy, setPwBusy] = useState(false);
  const [bioOk, setBioOk] = useState(false); const tried = useRef(false);
  const guard = locked && (cfg.scope === 'all' || SENSITIVE.some((p) => path.startsWith(p)));
  useEffect(() => { bioReady().then((b) => setBioOk(b && cfg.bio)); }, [cfg.bio]);
  useEffect(() => {
    if (!guard) { tried.current = false; return; }
    if (bioOk && !tried.current) { tried.current = true; bioAuth().then((ok) => ok && unlock()); }
  }, [guard, bioOk]);
  if (!guard) return null;
  const done = async (pin: string) => {
    const r = await checkPin(pin);
    if (r.r === 'ok') { setErr(''); unlock(); } else { setErr(r.r === 'wait' ? 'Too many tries. Wait ' + r.secs + ' seconds.' : 'Wrong PIN. ' + r.left + ' tries left.'); setShake((n) => n + 1); }
  };
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: '#0a0f2c', alignItems: 'center', justifyContent: 'center', zIndex: 999, overflow: 'hidden' }}>
      <LinearGradient colors={['#0a0f2c', '#1b1466', '#0a0f2c']} locations={[0, 0.45, 1]} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={380} color="rgba(106,77,240,0.55)" style={{ left: -140, top: -90 }} />
      <Blob size={320} color="rgba(94,231,223,0.3)" style={{ right: -130, top: 260 }} />
      <Blob size={300} color="rgba(255,143,224,0.25)" style={{ left: -120, bottom: -60 }} />
      <LockArt />
      <Header forgot={forgot} />
      {forgot === 'menu' ? (
        <View style={{ width: 300, gap: 10 }}>
          <Text style={{ color: W, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>Forgot your PIN?</Text>
          {bioOk ? <Pressable onPress={async () => { if (await bioAuth('Confirm it is you to set a new PIN')) setForgot('newpin'); }} style={BTN}><Text style={BT}>Use fingerprint, then set a new PIN</Text></Pressable> : null}
          {getSession() ? <Pressable onPress={() => { setPw(''); setPwErr(''); setForgot('pw'); }} style={BTN}><Text style={BT}>Use my account password</Text></Pressable> : null}
          <Pressable onPress={() => setForgot('erase')} style={[BTN, { backgroundColor: 'rgba(255,107,129,.25)' }]}><Text style={[BT, { color: '#ffb3bf' }]}>Erase app data and start fresh</Text></Pressable>
          <Pressable onPress={() => setForgot('')} style={{ alignSelf: 'center', padding: 8 }}><Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 13.5 }}>Back</Text></Pressable>
        </View>
      ) : forgot === 'pw' ? (
        <View style={{ width: 300, gap: 10 }}>
          <Text style={{ color: W, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>Account password</Text>
          <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, lineHeight: 19, textAlign: 'center' }}>Enter the password of {getSession()?.user?.email}. Then you can set a new PIN. Your data is kept.</Text>
          <Inp value={pw} onChangeText={setPw} placeholder="Password" secureTextEntry autoCapitalize="none" autoCorrect={false} />
          {pwErr ? <Text style={{ color: '#ffb3bf', fontSize: 12.5, textAlign: 'center' }}>{pwErr}</Text> : null}
          <Pressable onPress={async () => { if (pwBusy || !pw) return; setPwBusy(true); const ok = await checkPassword(pw); setPwBusy(false); if (ok) setForgot('newpin'); else setPwErr('Wrong password, or no internet.'); }} style={BTN}><Text style={BT}>{pwBusy ? 'Checking…' : 'Continue'}</Text></Pressable>
          <Pressable onPress={() => setForgot('menu')} style={{ alignSelf: 'center', padding: 8 }}><Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 13.5 }}>Back</Text></Pressable>
        </View>
      ) : forgot === 'erase' ? (
        <View style={{ width: 300, gap: 10 }}>
          <Text style={{ color: W, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>Erase everything?</Text>
          <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, lineHeight: 19, textAlign: 'center' }}>All your notes, finance, records and habits on this phone will be deleted, and the lock is removed. If you are signed in, your saved copy online stays and comes back on the next sync.</Text>
          <Pressable onPress={async () => { await wipeEverything(); setForgot(''); }} style={[BTN, { backgroundColor: 'rgba(255,107,129,.35)' }]}><Text style={[BT, { color: '#ffb3bf' }]}>Yes, erase everything</Text></Pressable>
          <Pressable onPress={() => setForgot('menu')} style={{ alignSelf: 'center', padding: 8 }}><Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 13.5 }}>Keep my data</Text></Pressable>
        </View>
      ) : forgot === 'newpin' ? (
        <NewPin onDone={async (p) => { await setPin(p, cfg.bio); setForgot(''); }} />
      ) : (
        <PinPad title="Enter your PIN" sub="My Life is locked" err={err} shake={shake} onDone={done}
          onBio={bioOk ? () => bioAuth().then((ok) => ok && unlock()) : undefined}
          extra={<Pressable onPress={() => setForgot('menu')} style={{ marginTop: 6, paddingVertical: 9, paddingHorizontal: 20, borderRadius: 999, backgroundColor: 'rgba(143,233,226,.12)', borderWidth: 1, borderColor: 'rgba(143,233,226,.35)' }}><Text style={{ color: '#8fe9e2', fontSize: 13.5, fontWeight: '700' }}>Forgot PIN?</Text></Pressable>} />
      )}
    </View>
  );
}
const BTN = { paddingVertical: 14, borderRadius: 16, alignItems: 'center' as const, backgroundColor: 'rgba(255,255,255,.12)' };
const BT = { color: '#fff', fontSize: 14, fontWeight: '700' as const };

function NewPin({ onDone }: { onDone: (p: string) => void }) {
  const [first, setFirst] = useState<string | null>(null); const [err, setErr] = useState('');
  return <PinPad key={String(first)} title={first == null ? 'Set a new PIN' : 'Repeat your PIN'} sub="Choose 4 to 6 digits." err={err}
    onDone={(p) => { if (p.length < 4) return setErr('Use at least 4 digits.'); if (first == null) { setFirst(p); setErr(''); } else if (first === p) onDone(p); else { setFirst(null); setErr('The two PINs did not match.'); } }} />;
}

function Header({ forgot }: { forgot: string }) {
  const name = useName().split(' ')[0];
  if (forgot) return <View style={{ marginBottom: 20 }}><Tile /></View>;
  return (
    <View style={{ alignItems: 'center', marginBottom: 14 }}>
      <Tile />
      <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, marginTop: 16, letterSpacing: 0.4 }}>Welcome back</Text>
      {name ? <Text style={{ color: W, fontSize: 26, fontWeight: '800', marginTop: 2 }}>{name}</Text> : null}
    </View>
  );
}
function Tile() {
  return (
    <View style={{ width: 118, height: 118, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 170, height: 170, alignItems: 'center', justifyContent: 'center', transform: [{ scale: 0.68 }] }}><Logo /></View>
      <View style={{ position: 'absolute', right: 18, bottom: 18, width: 28, height: 28, borderRadius: 14, backgroundColor: '#0f1550', borderWidth: 1.5, borderColor: 'rgba(255,255,255,.35)', alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#8fe9e2" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><Rect x={5} y={11} width={14} height={9} rx={2.5} /><Path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>
      </View>
    </View>
  );
}

// Little floating glass tiles, one for each part of the app, so the lock screen feels like My Life and not a blank wall.
type Art = { x: number | string; y: number | string; s: number; r: number; c: [string, string]; d: number; icon: 'moon' | 'cal' | 'wallet' | 'note' | 'heart' | 'bike' | 'star' };
const ARTS: Art[] = [
  { x: 22, y: 58, s: 52, r: -10, c: ['#34d399', '#5ee7df'], d: 0, icon: 'moon' },
  { x: '78%', y: 86, s: 46, r: 12, c: ['#7c9cff', '#b794ff'], d: 500, icon: 'cal' },
  { x: 8, y: '36%', s: 40, r: 8, c: ['#ffc46b', '#ff8fab'], d: 900, icon: 'wallet' },
  { x: '88%', y: '40%', s: 38, r: -8, c: ['#ff8fe0', '#b794ff'], d: 300, icon: 'note' },
  { x: 14, y: '86%', s: 42, r: -12, c: ['#ff8fab', '#ffb36b'], d: 700, icon: 'heart' },
  { x: '82%', y: '88%', s: 44, r: 10, c: ['#5ee7df', '#7c9cff'], d: 1100, icon: 'bike' },
];
function Icon({ k }: { k: Art['icon'] }) {
  const p = { fill: 'none', stroke: '#fff', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width="58%" height="58%" viewBox="0 0 24 24">
      {k === 'moon' && <><Path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.8 6.8 0 0 0 20 14.5z" {...p} /><Path d="M17 4v3M15.5 5.5h3" {...p} /></>}
      {k === 'cal' && <><Rect x={3.5} y={5} width={17} height={15} rx={3} {...p} /><Path d="M8 3v4M16 3v4M3.5 10h17M9 15l2 2 4-4" {...p} /></>}
      {k === 'wallet' && <><Path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" {...p} /><Rect x={3.5} y={8} width={17} height={12} rx={3} {...p} /><Circle cx={16} cy={14} r={1.2} fill="#fff" /></>}
      {k === 'note' && <><Path d="M6 3.5h9l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V5A1.5 1.5 0 0 1 6 3.5z" {...p} /><Path d="M8.5 12h7M8.5 16h5" {...p} /></>}
      {k === 'heart' && <Path d="M12 20s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z" {...p} />}
      {k === 'bike' && <><Circle cx={6} cy={16} r={3.5} {...p} /><Circle cx={18} cy={16} r={3.5} {...p} /><Path d="M6 16l3-7h5l4 7M9 9H7M14 9l-2 7" {...p} /></>}
    </Svg>
  );
}
function Tile3({ a }: { a: Art }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => { Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start(); }, a.d);
    return () => clearTimeout(t);
  }, [v]);
  return (
    <Animated.View style={{ position: 'absolute', left: a.x as any, top: a.y as any, width: a.s, height: a.s, borderRadius: a.s * 0.32, backgroundColor: '#24207a', opacity: 0.9,
      shadowColor: a.c[0], shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
      transform: [{ rotate: a.r + 'deg' }, { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [3, -7] }) }] }}>
      <LinearGradient colors={a.c} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: a.s * 0.32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.4)', opacity: 0.78 }}>
        <Icon k={a.icon} />
      </LinearGradient>
    </Animated.View>
  );
}
function LockArt() {
  const stars = [[60, 170, 3], [300, 60, 2.5], [340, 250, 2], [30, 520, 2.5], [350, 600, 3], [110, 40, 2], [330, 770, 2]];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      {stars.map(([x, y, r], i) => <View key={i} style={{ position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: '#fff', opacity: 0.55 }} />)}
      {ARTS.map((a, i) => <Tile3 key={i} a={a} />)}
    </View>
  );
}
