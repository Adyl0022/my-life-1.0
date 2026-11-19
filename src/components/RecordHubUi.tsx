import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Line, Pattern, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Text } from './Txt';
import { Glass } from './Glass';
import { Blob } from './Bg';
import { W } from './Ui';
import { TOP } from '../lib/layout';

// The soft dark-pink page used by every My Record screen.
export function RecordPage({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#1b0f26' }}>
      <LinearGradient colors={['#1b0f26', '#2c1340', '#10244a']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(255,143,171,.38)" style={{ right: -100, top: -40 }} />
      <Blob size={340} color="rgba(124,156,255,.32)" style={{ left: -120, bottom: 10 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 60 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>{title}</Text>
              <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 12, marginTop: 1 }}>{sub}</Text>
            </View>
          </View>
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// A quiet pattern laid over a coloured card. kind picks the shape.
export function Pat({ kind }: { kind: 'dots' | 'lines' | 'rings' | 'grid' }) {
  const id = 'p' + kind;
  return (
    <Svg pointerEvents="none" width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: 0.55 }}>
      <Defs>
        {kind === 'dots' ? <Pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse"><Circle cx="7" cy="7" r="1.3" fill="rgba(255,255,255,.4)" /></Pattern> : null}
        {kind === 'lines' ? <Pattern id={id} width="13" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><Line x1="0" y1="0" x2="0" y2="13" stroke="rgba(255,255,255,.26)" strokeWidth="1.5" /></Pattern> : null}
        {kind === 'grid' ? <Pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse"><Line x1="0" y1="0" x2="16" y2="0" stroke="rgba(255,255,255,.2)" strokeWidth="1" /><Line x1="0" y1="0" x2="0" y2="16" stroke="rgba(255,255,255,.2)" strokeWidth="1" /></Pattern> : null}
      </Defs>
      {kind === 'rings' ? [24, 46, 68, 90].map((r) => <Circle key={r} cx="100%" cy="0" r={r} stroke="rgba(255,255,255,.28)" strokeWidth="1.5" fill="none" />) : <Rect width="100%" height="100%" fill={'url(#' + id + ')'} />}
    </Svg>
  );
}

export function ModCard({ e, title, sub, chip, colors, pat, onPress }: { e: string; title: string; sub: string; chip?: string; colors: [string, string]; pat: 'dots' | 'lines' | 'rings' | 'grid'; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={'Open ' + title} style={({ pressed }) => ({ marginTop: 14, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <View style={{ borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.26)', borderTopColor: 'rgba(255,255,255,.45)' }}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, minHeight: 124, justifyContent: 'center' }}>
          <Pat kind={pat} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 56, height: 56, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,.4)' }}><Text style={{ fontSize: 27 }}>{e}</Text></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: W, fontSize: 19, fontWeight: '800', letterSpacing: -0.2 }}>{title}</Text>
              <Text numberOfLines={2} style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, marginTop: 3, lineHeight: 17 }}>{sub}</Text>
              {chip ? <View style={{ alignSelf: 'flex-start', marginTop: 8, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(6,16,40,.38)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' }}><Text style={{ color: W, fontSize: 11, fontWeight: '800' }}>{chip}</Text></View> : null}
            </View>
            <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 26 }}>›</Text>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}
