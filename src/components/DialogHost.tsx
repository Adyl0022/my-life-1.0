import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, View, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';
import { onDialog, DialogState, DialogButton } from '../lib/dialog';

// One nice confirmation box for the whole app: dark card, rounded, with the app's buttons (pink-gold, red for delete).
export function DialogHost() {
  const [d, setD] = useState<DialogState | null>(null);
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { onDialog((x) => { setD(x); if (x) { a.setValue(0); Animated.timing(a, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); } }); return () => onDialog(null); }, [a]);
  if (!d) return null;
  const close = (b?: DialogButton) => { setD(null); if (b && b.onPress) setTimeout(() => b.onPress!(), 30); };
  const cancel = d.buttons.find((b) => b.style === 'cancel');
  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={() => close(cancel)}>
      <Pressable onPress={() => close(cancel)} style={{ flex: 1, backgroundColor: 'rgba(5,8,24,.72)', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <Animated.View style={{ width: '100%', maxWidth: 380, opacity: a, transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }}>
          <Pressable onPress={() => {}} style={{ borderRadius: 26, padding: 22, backgroundColor: '#1a2250', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' }}>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>{d.title}</Text>
            {d.message ? <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, lineHeight: 20, marginTop: 8 }}>{d.message}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
              {d.buttons.map((b, i) => {
                const main = b.style !== 'cancel' && b.style !== 'destructive'; const red = b.style === 'destructive';
                const inner = <Text style={{ color: main ? '#2a1030' : red ? '#ffb3bf' : '#fff', fontSize: 14, fontWeight: '800' }}>{b.text || 'OK'}</Text>;
                return (
                  <Pressable key={i} onPress={() => close(b)} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
                    {main
                      ? <LinearGradient colors={['#ff8fab', '#ffc46b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 13, borderRadius: 999, alignItems: 'center' }}>{inner}</LinearGradient>
                      : <View style={{ paddingVertical: 13, borderRadius: 999, alignItems: 'center', backgroundColor: red ? '#3d2c4c' : '#343d5a', borderWidth: red ? 1 : 0, borderColor: 'rgba(255,120,140,.4)' }}>{inner}</View>}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
