import React, { useEffect, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Text } from './Txt';
import { LinearGradient } from 'expo-linear-gradient';
import { useStored } from '../lib/store';
import { WHATS_NEW } from '../lib/legal';

const VER: string = String(require('../../app.json').expo.version || '');

// Shown once after an update (and once on a fresh install), above the app but below the lock and sign-in screens.
export function WhatsNewPop({ ready }: { ready: boolean }) {
  const [seen, setSeen, ok] = useStored<string>('ml_seen_ver', '');
  const [gone, setGone] = useState(false);
  const [wait, setWait] = useState(false);
  useEffect(() => { if (!ready) return; const t = setTimeout(() => setWait(true), 1500); return () => clearTimeout(t); }, [ready]);
  if (!ready || !ok || !wait || gone || !VER || seen === VER) return null;
  const close = () => { setGone(true); setSeen(VER); };
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(5,8,28,.72)', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
      <View style={{ width: '100%', maxHeight: '80%', padding: 20, borderRadius: 26, backgroundColor: '#131845', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>What's new in {VER}</Text>
        <ScrollView style={{ marginTop: 10 }} showsVerticalScrollIndicator={false}>
          {WHATS_NEW.slice(0, 3).map((s) => (
            <View key={s.h} style={{ marginBottom: 12 }}>
              <Text style={{ color: '#fff', fontSize: 13.5, fontWeight: '700' }}>{s.h}</Text>
              <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12.5, lineHeight: 18, marginTop: 3 }}>{s.p}</Text>
            </View>
          ))}
          <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11.5 }}>The full list is in Settings, What's new.</Text>
        </ScrollView>
        <Pressable onPress={close} style={{ marginTop: 14 }}>
          <LinearGradient colors={['#7c9cff', '#5b7bff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 11, borderRadius: 999, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Got it</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
