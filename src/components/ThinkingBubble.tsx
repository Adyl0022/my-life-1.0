import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing } from 'react-native';
import { Text } from './Txt';
import { Glass } from './Glass';

// The "Assistant is writing" bubble: three dots that bounce one after the other. If the answer takes a while (the AI on the phone or on the
// internet is working), it says so and counts the seconds, so the screen never looks frozen.
function Dot({ i }: { i: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.delay(i * 160),
      Animated.timing(t, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(t, { toValue: 0, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.delay((2 - i) * 160 + 200),
    ]));
    l.start();
    return () => l.stop();
  }, []);
  return <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }), transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }, { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) }] }} />;
}

export function ThinkingBubble({ ms }: { ms: boolean }) {
  const [sec, setSec] = useState(0);
  useEffect(() => { const t = setInterval(() => setSec((s) => s + 1), 1000); return () => clearInterval(t); }, []);
  const long = sec >= 3;
  return (
    <Glass radius={20} style={{ paddingVertical: 13, paddingHorizontal: 16, borderBottomLeftRadius: 6, maxWidth: '84%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Dot i={0} /><Dot i={1} /><Dot i={2} />
        {long ? <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 13, fontWeight: '700', marginLeft: 6 }}>{(ms ? 'Sedang berfikir... ' : 'Thinking... ') + sec + 's'}</Text> : null}
      </View>
      {sec >= 8 ? <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 11.5, marginTop: 7, lineHeight: 16 }}>{ms ? 'AI sedang menyediakan jawapan. Ini boleh ambil masa sehingga seminit, terutama kali pertama.' : 'The AI is preparing the answer. This can take up to a minute, especially the first time.'}</Text> : null}
    </Glass>
  );
}

// Shown under an answer that is still being written: a small soft glowing dot that breathes, instead of a blinking text cursor.
export function LiveTail() {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(t, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, []);
  return (
    <View style={{ height: 16, marginTop: 6, justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', left: -3, width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(183,148,255,.30)', opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.9] }), transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.25] }) }] }} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#c9b3ff' }} />
    </View>
  );
}
