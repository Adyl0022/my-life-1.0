import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Linking, Animated, Easing, useWindowDimensions } from 'react-native';
import { Text } from './Txt';
import { LinearGradient } from 'expo-linear-gradient';
import { GP, W } from './Ui';
import { CodeBoxes } from './CodeBoxes';
import { Drift, Sky, Wallpaper, Logo, TEAL } from './AuthScreen';
import { redeemCode } from '../lib/license';
import { signOut } from '../lib/auth';
import { SUPPORT_EMAIL, SUPPORT_EMAIL2 } from '../lib/legal';

export function ActivationScreen({ email, expired }: { email: string; expired: boolean }) {
  const [code, setCode] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const { height: winH } = useWindowDimensions();
  const top = Math.max(40, Math.min(150, Math.round(winH * 0.135)));
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(enter, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, []);
  const go = async () => {
    if (busy) return; if (code.length < 8) { setErr('Enter your full activation code.'); return; }
    setBusy(true); setErr(''); const r = await redeemCode('ML-' + code.slice(0, 4) + '-' + code.slice(4)); setBusy(false); if (!r.ok) setErr(r.err);
  };
  const link = (t: string, f: () => void) => <Pressable onPress={f} hitSlop={8}><Text style={{ color: TEAL, fontSize: 13.5, fontWeight: '700' }}>{t}</Text></Pressable>;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0a0f2c', zIndex: 55, overflow: 'hidden' }}>
      <LinearGradient colors={['#0a0f2c', '#1b1466', '#0a0f2c']} locations={[0, 0.45, 1]} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Drift size={420} color="rgba(106,77,240,0.6)" x={-160} y={-110} dx={50} dy={40} dur={7000} />
      <Drift size={340} color="rgba(94,231,223,0.32)" x={150} y={250} dx={-45} dy={50} dur={9000} />
      <Wallpaper />
      <Sky />
      <KeyboardAvoidingView style={{ flex: 1, paddingTop: top, paddingBottom: 16 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 20 }}>
          <View style={{ alignItems: 'center', marginBottom: 6 }}><View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 170, height: 170, transform: [{ scale: 0.52 }] }}><Logo /></View></View></View>
          <View style={{ borderRadius: 26, padding: 16, backgroundColor: '#3b3a7e', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.42)', borderBottomColor: 'rgba(0,0,0,.38)', borderBottomWidth: 2, overflow: 'hidden' }}>
            <LinearGradient colors={['rgba(255,255,255,.22)', 'rgba(255,255,255,0)']} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 120 }} />
            <Animated.View style={{ opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
              <Text style={{ color: W, fontSize: 20, fontWeight: '800' }}>{expired ? 'Your access has ended' : 'Activate My Life'}</Text>
              <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 12.5, marginTop: 2, marginBottom: 12, lineHeight: 17 }}>{expired ? 'Enter a new activation code to continue.' : 'Enter the activation code you received to unlock the app.'}</Text>
              <Text style={{ color: TEAL, fontSize: 12, fontWeight: '800', letterSpacing: 1.6, marginBottom: 8 }}>TYPE THE 8 CHARACTERS AFTER ML-</Text>
              <CodeBoxes value={code} onChange={setCode} length={8} kind="alnum" group={4} shake={err} />
              {err ? <View style={{ padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,107,129,.16)', borderWidth: 1, borderColor: 'rgba(255,107,129,.4)', marginBottom: 12 }}><Text style={{ color: '#ffc2cc', fontSize: 12.5, lineHeight: 17 }}>{err}</Text></View> : null}
              <Pressable onPress={go} disabled={busy} style={{ borderRadius: 18 }}>
                <LinearGradient colors={['#7c9cff', '#9a8cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.75 : 1 }}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: W, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 }}>Activate</Text>}
                </LinearGradient>
              </Pressable>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 22, marginTop: 14 }}>
                {link('Get a code', () => Linking.openURL('mailto:' + SUPPORT_EMAIL + '?cc=' + SUPPORT_EMAIL2 + '&subject=' + encodeURIComponent('My Life activation code')))}
                {link('Sign out', () => { signOut(); })}
              </View>
            </Animated.View>
          </View>
          <Text style={{ color: 'rgba(255,255,255,.45)', fontSize: 11.5, textAlign: 'center', marginTop: 16, lineHeight: 16 }}>{'Signed in as ' + email}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
