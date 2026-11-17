import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';

const ND = Platform.OS !== 'web';
const DOTS = 12;

// The counter for parts that are read several times (3x, 33x). It fills up as the count grows, the number pops on every tap,
// and a small burst of sparks marks the last one. No ripple or sweep, so it feels different from the other buttons.
export function CountButton({ cnt, tg, onPress }: { cnt: number; tg: number; onPress: () => void }) {
  const done = cnt >= tg;
  const fill = useRef(new Animated.Value(Math.min(cnt / tg, 1))).current;
  const press = useRef(new Animated.Value(1)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const burst = useRef(new Animated.Value(1)).current; // 1 = finished (invisible)
  const prev = useRef(cnt);
  const [w, setW] = React.useState(300);
  useEffect(() => {
    Animated.timing(fill, { toValue: Math.min(cnt / tg, 1), duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    if (cnt > prev.current) {
      pop.setValue(0.82);
      Animated.spring(pop, { toValue: 1, speed: 16, bounciness: 18, useNativeDriver: ND }).start();
      if (cnt >= tg) { burst.setValue(0); Animated.timing(burst, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: ND }).start(); }
    }
    prev.current = cnt;
  }, [cnt, tg]);
  const dots = Array.from({ length: DOTS }, (_, i) => i);
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={done ? 'Completed, tap to restart' : 'Tap to count'}
      onPressIn={() => { Animated.spring(press, { toValue: 0.97, speed: 40, bounciness: 0, useNativeDriver: ND }).start(); }}
      onPressOut={() => { Animated.spring(press, { toValue: 1, speed: 14, bounciness: 10, useNativeDriver: ND }).start(); }}
      onPress={onPress}
    >
      <Animated.View style={{ transform: [{ scale: press }] }}>
        <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: 64, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: done ? 'rgba(52,211,153,.9)' : 'rgba(255,196,107,.55)', backgroundColor: 'rgba(6,20,40,.55)', justifyContent: 'center' }}>
          <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: fill.interpolate({ inputRange: [0, 1], outputRange: [0, w] }) }}>
            <LinearGradient colors={done ? ['#34d399', '#5ee7df'] : ['#ffb457', '#ff8a5c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
          </Animated.View>
          <Animated.View style={{ alignItems: 'center', transform: [{ scale: pop }] }}>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800', textShadowColor: 'rgba(0,0,0,.45)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } }}>
              {done ? 'Completed ✓' : cnt + ' / ' + tg}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,.92)', fontSize: 11.5, fontWeight: '700', marginTop: 1, textShadowColor: 'rgba(0,0,0,.45)', textShadowRadius: 3 }}>{done ? 'Tap to start again' : 'Tap to count'}</Text>
          </Animated.View>
        </View>
        {dots.map((i) => {
          const a = (i / DOTS) * Math.PI * 2; const d = 54 + (i % 2) * 22;
          return (
            <Animated.View key={i} pointerEvents="none" style={{ position: 'absolute', left: '50%', top: '50%', width: 7, height: 7, marginLeft: -3.5, marginTop: -3.5, borderRadius: 4, backgroundColor: i % 3 === 0 ? '#ffd593' : i % 3 === 1 ? '#7df0c6' : '#ffffff',
              opacity: burst.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
              transform: [{ translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * d * 1.6] }) }, { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(a) * d * 0.7] }) }, { scale: burst.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.2, 0.3] }) }] }} />
          );
        })}
      </Animated.View>
    </Pressable>
  );
}
