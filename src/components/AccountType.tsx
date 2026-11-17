import React from 'react';
import { View, Pressable, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Text } from './Txt';
import { Glass } from './Glass';
import { openPaywall, Shine } from './Paywall';
import { usePro } from '../lib/pro';
import { PER, usePrice, useSubscribed } from '../lib/purchase';

const G = ['#34d399', '#5ee7df'] as [string, string];
const GP = ['#7c9cff', '#b794ff'] as [string, string];
const GOLD = ['#ffd9a0', '#ffc46b'] as [string, string];
const SUBS_URL = 'https://play.google.com/store/account/subscriptions';

const User = ({ s = 26 }: { s?: number }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><Circle cx={12} cy={8.5} r={3.6} /><Path d="M4.5 20c.9-3.7 3.9-5.6 7.5-5.6s6.6 1.9 7.5 5.6" /></Svg>
);
const Crown = ({ s = 26 }: { s?: number }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round"><Path d="M3.5 8l4.5 4 4-6.5 4 6.5 4.5-4-1.8 10.5H5.3z" /><Path d="M6 21h12" /></Svg>
);
const Tick = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#8fe9e2" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><Path d="M5 12.5l4.5 4.5L19 7" /></Svg>
);

// "Account type" card for Settings > About. Plain account without a subscription, Pro with one.
export function AccountType() {
  const pro = usePro(); const paid = useSubscribed(); const price = usePrice();
  if (!pro) {
    return (
      <Glass style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)' }}><User /></View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>ACCOUNT TYPE</Text>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 }}>Standard</Text>
          </View>
          <View style={{ paddingVertical: 4, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,.3)' }}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>FREE</Text></View>
        </View>
        <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, lineHeight: 18, marginTop: 12 }}>Your planner, prayer times, money, habits and health are free. Go Pro for the Assistant, Family Planner, Time Machine and more.</Text>
        <Pressable onPress={openPaywall} accessibilityRole="button" style={{ marginTop: 14, borderRadius: 999, overflow: 'hidden' }}>
          <LinearGradient colors={GP} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, alignItems: 'center', borderRadius: 999 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Upgrade to Pro · {price} {PER}</Text>
          </LinearGradient>
          <Shine delay={600} />
        </Pressable>
      </Glass>
    );
  }
  return (
    <View style={{ borderRadius: 24, padding: 1.5, overflow: 'hidden' }}>
      <LinearGradient colors={['#5ee7df', '#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <View style={{ borderRadius: 23, overflow: 'hidden', backgroundColor: '#141a4a', padding: 16 }}>
        <LinearGradient colors={['rgba(94,231,223,.22)', 'rgba(124,156,255,.1)', 'rgba(183,148,255,.18)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <LinearGradient colors={G} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}><Crown /></LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>ACCOUNT TYPE</Text>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 }}>Pro</Text>
          </View>
          <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999 }}><Text style={{ color: '#4a2e00', fontSize: 11, fontWeight: '900', letterSpacing: 1.6 }}>PRO</Text></LinearGradient>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}><Tick /><Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 12.5, flex: 1, lineHeight: 18 }}>{paid ? 'Thank you for subscribing. Every feature is unlocked.' : 'Every feature is unlocked on this account.'}</Text></View>
        {paid ? <Pressable onPress={() => Linking.openURL(SUBS_URL)} accessibilityRole="link" style={{ marginTop: 12, paddingVertical: 10, borderRadius: 999, alignItems: 'center', backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,.25)' }}><Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Manage subscription in Google Play</Text></Pressable> : null}
        <Shine delay={900} />
      </View>
    </View>
  );
}
