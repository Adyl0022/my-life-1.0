import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Animated, Easing, Platform } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './Txt';
import { Pressable } from './Press';
import { Glass } from './Glass';
import * as Haptics from '../lib/haptics';
import { cs } from '../lib/region';

const AnimPath = Animated.createAnimatedComponent(Path);
const AnimCircle = Animated.createAnimatedComponent(Circle);
const money = (n: number) => n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type TransferInfo = { amt: number; from: string; to: string; date: string; ref: string; pay: boolean };

// A short "bank" moment after a transfer: the money moves from one account to the other, then a tick and a receipt.
// The transfer is already saved when this opens. This only shows it.
export function TransferDone({ info, onClose }: { info: TransferInfo | null; onClose: () => void }) {
  const [done, setDone] = useState(false);
  const run = useRef(new Animated.Value(0)).current;      // 0..1, the money travelling
  const tick = useRef(new Animated.Value(0)).current;     // the tick being drawn
  const pop = useRef(new Animated.Value(0)).current;      // the success circle popping in
  const ripple = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;     // receipt fading in
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!info) return;
    setDone(false); run.setValue(0); tick.setValue(0); pop.setValue(0); ripple.setValue(0); fade.setValue(0); spin.setValue(0);
    const ND = Platform.OS !== 'web';
    if (ND) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const loop = Animated.loop(Animated.timing(run, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: false }));
    const sp = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: false }));
    loop.start(); sp.start();
    const t = setTimeout(() => {
      loop.stop(); sp.stop(); setDone(true);
      if (ND) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.sequence([
        Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: false }),
        Animated.timing(tick, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      ]).start();
      Animated.timing(ripple, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
      Animated.timing(fade, { toValue: 1, duration: 500, delay: 450, useNativeDriver: false }).start();
    }, 1900);
    return () => { clearTimeout(t); loop.stop(); sp.stop(); };
  }, [info]);

  if (!info) return null;
  const word = info.pay ? 'Payment' : 'Transfer';
  const trackW = 120;
  const dotX = run.interpolate({ inputRange: [0, 1], outputRange: [0, trackW - 14] });
  const dotO = run.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });
  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rs = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.9] });
  const ro = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const dash = tick.interpolate({ inputRange: [0, 1], outputRange: [60, 0] });
  const Row = ({ k, v }: { k: string; v: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, gap: 12 }}>
      <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 13 }}>{k}</Text>
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>{v}</Text>
    </View>
  );
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={done ? onClose : undefined}>
      <View style={{ flex: 1, backgroundColor: '#070a22' }}>
        <LinearGradient colors={['#070a22', '#14104a', '#0a2848']} locations={[0, 0.55, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            {!done ? (
              <>
                <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
                  <Animated.View style={{ transform: [{ rotate: rot }] }}>
                    <Svg width={96} height={96} viewBox="0 0 96 96"><Circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,.14)" strokeWidth="6" fill="none" /><Path d="M48 8a40 40 0 0 1 40 40" stroke="#8fe9e2" strokeWidth="6" strokeLinecap="round" fill="none" /></Svg>
                  </Animated.View>
                </View>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 22 }}>{'Processing ' + word.toLowerCase() + '…'}</Text>
                <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, marginTop: 6 }}>Please wait a moment</Text>
                <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800', marginTop: 26 }}>{cs() + money(info.amt)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 26, gap: 10 }}>
                  <View style={{ width: 84, alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' }} numberOfLines={2}>{info.from}</Text></View>
                  <View style={{ width: trackW, height: 14, justifyContent: 'center' }}>
                    <View style={{ height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,.22)' }} />
                    <Animated.View style={{ position: 'absolute', left: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#8fe9e2', opacity: dotO, transform: [{ translateX: dotX }] }} />
                  </View>
                  <View style={{ width: 84, alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'center' }} numberOfLines={2}>{info.to}</Text></View>
                </View>
              </>
            ) : (
              <>
                <View style={{ width: 130, height: 130, alignItems: 'center', justifyContent: 'center' }}>
                  <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(94,231,181,.5)', opacity: ro, transform: [{ scale: rs }] }} />
                  <Animated.View style={{ transform: [{ scale: pop }] }}>
                    <LinearGradient colors={['#5ee7b5', '#2fbf8f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' }}>
                      <Svg width={52} height={52} viewBox="0 0 52 52"><AnimPath d="M13 27l9 9 17-19" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray="60" strokeDashoffset={dash as any} /></Svg>
                    </LinearGradient>
                  </Animated.View>
                </View>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 14 }}>{word + ' successful'}</Text>
                <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800', marginTop: 6 }}>{cs() + money(info.amt)}</Text>
                <Animated.View style={{ width: '100%', marginTop: 22, opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
                  <Glass radius={22} style={{ paddingHorizontal: 18, paddingVertical: 8 }}>
                    <Row k="From" v={info.from} />
                    <Row k={info.pay ? 'Paid to' : 'To'} v={info.to} />
                    <Row k="Date" v={info.date} />
                    <Row k="Reference" v={info.ref} />
                  </Glass>
                  <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, lineHeight: 16, textAlign: 'center', marginTop: 12 }}>This only moves money between your own accounts inside My Life 1.0. It does not send money at a real bank.</Text>
                  <Pressable onPress={onClose} buzz accessibilityLabel="Done">
                    <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ marginTop: 18, paddingVertical: 15, borderRadius: 18, alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Done</Text></LinearGradient>
                  </Pressable>
                </Animated.View>
              </>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
