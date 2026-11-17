import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from './Txt';
import { Glass } from './Glass';

const ND = Platform.OS !== 'web';
const FLAGS = '\u{1F1E8}\u{1F1F3} \u{1F1F8}\u{1F1E6} \u{1F1F9}\u{1F1ED} \u{1F1EE}\u{1F1F3} \u{1F1EF}\u{1F1F5}'.split(' ');

// The "Chat in your language" card on the Assistant welcome screen: a round arrow button, a row of flags,
// and one soft glow (halo, bright border, shine) the moment the screen opens.
export function LangWelcomeCard({ onPress, title, sub }: { onPress: () => void; title: string; sub?: string }) {
  const glow = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const nudge = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(320);
  useEffect(() => {
    const t = setTimeout(() => {
      glow.setValue(0); sweep.setValue(0);
      Animated.parallel([
        Animated.timing(glow, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(sweep, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: ND }),
      ]).start();
    }, 500);
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(1400),
      Animated.timing(nudge, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: ND }),
      Animated.timing(nudge, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: ND }),
    ]));
    loop.start();
    return () => { clearTimeout(t); loop.stop(); };
  }, [glow, sweep, nudge]);
  // 0 -> 1 -> 0 envelope so the glow rises fast and fades out.
  const env = glow.interpolate({ inputRange: [0, 0.25, 0.6, 1], outputRange: [0, 1, 1, 0] });
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Chat in your language" style={{ alignSelf: 'stretch', marginTop: 10 }}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -6, right: -6, top: -6, bottom: -6, borderRadius: 26, backgroundColor: '#7df0c6', opacity: env.interpolate({ inputRange: [0, 1], outputRange: [0, 0.2] }) }} />
        <Glass radius={20} style={{ paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderColor: 'rgba(94,231,223,.55)', overflow: 'hidden' }}>
          <LinearGradient colors={['#34d399', '#5ee7df']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={20} height={20} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={9} stroke="#06281c" strokeWidth={2} fill="none" /><Path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" stroke="#06281c" strokeWidth={2} fill="none" strokeLinecap="round" /></Svg>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{title}</Text>
            {sub ? (
              <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.72)', fontSize: 11.5, marginTop: 2 }}>{sub}</Text>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                {FLAGS.map((f) => <Text key={f} style={{ fontSize: 14 }}>{f}</Text>)}
                <Text style={{ color: '#8fe9e2', fontSize: 11.5, fontWeight: '800', marginLeft: 2 }}>+17</Text>
              </View>
            )}
          </View>
          <LinearGradient colors={['#34d399', '#5ee7df']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={{ transform: [{ translateX: nudge.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }) }] }}>
              <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M5 12h13M13 6l6 6-6 6" stroke="#06281c" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
            </Animated.View>
          </LinearGradient>
          <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(125,240,198,.95)', opacity: env }} />
          <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, width: w * 0.35, opacity: sweep.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-w * 0.4, w * 1.1] }) }, { skewX: '-20deg' }] }}>
            <LinearGradient colors={['rgba(125,240,198,0)', 'rgba(125,240,198,.32)', 'rgba(125,240,198,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
          </Animated.View>
        </Glass>
      </View>
    </Pressable>
  );
}
