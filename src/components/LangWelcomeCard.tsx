import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from './Txt';
import { Glass } from './Glass';

const ND = Platform.OS !== 'web';
const FLAGS = '\u{1F1E8}\u{1F1F3} \u{1F1F8}\u{1F1E6} \u{1F1F9}\u{1F1ED} \u{1F1EE}\u{1F1F3} \u{1F1EF}\u{1F1F5}'.split(' ');

// One card on the Assistant welcome screen for the two things that change how it answers: the chat language and the AI (Smart chat / Online AI).
// Two tap areas sit inside it. Keeps one soft glow (halo, bright border, shine) the moment the screen opens.
function Tile({ onPress, label, sub, colors, children, ink, nudge }: any) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ flex: 1 }}>
      <View style={{ flex: 1, minHeight: 56, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>{children}</LinearGradient>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{label}</Text>
          <Text numberOfLines={1} style={{ color: ink || 'rgba(255,255,255,.7)', fontSize: 11, marginTop: 2 }}>{sub}</Text>
        </View>
        <LinearGradient colors={['#34d399', '#5ee7df']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{ transform: [{ translateX: nudge.interpolate({ inputRange: [0, 1], outputRange: [0, 3] }) }] }}>
            <Svg width={12} height={12} viewBox="0 0 24 24"><Path d="M5 12h13M13 6l6 6-6 6" stroke="#06281c" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
          </Animated.View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

export function LangWelcomeCard({ onLang, onAI, langName, showLang, ms }: { onLang: () => void; onAI: () => void; langName?: string; showLang: boolean; ms?: boolean }) {
  const glow = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const nudge = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(320);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(1400),
      Animated.timing(nudge, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: ND }),
      Animated.timing(nudge, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: ND }),
    ]));
    loop.start();
    const t = setTimeout(() => {
      glow.setValue(0); sweep.setValue(0);
      Animated.parallel([
        Animated.timing(glow, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(sweep, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: ND }),
      ]).start();
    }, 500);
    return () => { clearTimeout(t); loop.stop(); };
  }, [glow, sweep, nudge]);
  // 0 -> 1 -> 0 envelope so the glow rises fast and fades out.
  const env = glow.interpolate({ inputRange: [0, 0.25, 0.6, 1], outputRange: [0, 1, 1, 0] });
  const flags = FLAGS.slice(0, 4).join(' ');
  return (
    <View style={{ alignSelf: 'stretch', marginTop: 10 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -6, right: -6, top: -6, bottom: -6, borderRadius: 28, backgroundColor: '#7df0c6', opacity: env.interpolate({ inputRange: [0, 1], outputRange: [0, 0.2] }) }} />
      <Glass radius={22} style={{ paddingVertical: 10, paddingHorizontal: 10, borderColor: 'rgba(94,231,223,.5)', overflow: 'hidden' }}>
        <Text style={{ color: 'rgba(255,255,255,.9)', fontSize: 12.5, fontWeight: '800', letterSpacing: 0.3, marginLeft: 4, marginBottom: 8 }}>{showLang ? (ms ? 'Bahasa dan Online AI' : 'Language and Online AI') : 'Online AI'}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {showLang ? (
            <Tile onPress={onLang} label={langName ? langName : (ms ? 'Bahasa' : 'Language')} sub={langName ? (ms ? 'Ketik untuk tukar' : 'Tap to change') : flags} colors={['#34d399', '#5ee7df']} nudge={nudge}>
              <Svg width={19} height={19} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={9} stroke="#06281c" strokeWidth={2} fill="none" /><Path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" stroke="#06281c" strokeWidth={2} fill="none" strokeLinecap="round" /></Svg>
            </Tile>
          ) : null}
          <Tile onPress={onAI} label="Online AI" sub={ms ? 'Atau telefon' : 'Or on phone'} colors={['#7c9cff', '#b794ff']} nudge={nudge}>
            <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" stroke="#fff" strokeWidth={1.8} fill="none" strokeLinejoin="round" /><Path d="M18.5 16l.8 2.1 2.2.8-2.2.8-.8 2.1-.8-2.1-2.2-.8 2.2-.8z" stroke="#fff" strokeWidth={1.4} fill="none" strokeLinejoin="round" /></Svg>
          </Tile>
        </View>
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(125,240,198,.95)', opacity: env }} />
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, width: w * 0.35, opacity: sweep.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-w * 0.4, w * 1.1] }) }, { skewX: '-20deg' }] }}>
          <LinearGradient colors={['rgba(125,240,198,0)', 'rgba(125,240,198,.32)', 'rgba(125,240,198,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
        </Animated.View>
      </Glass>
    </View>
  );
}
