import React, { useState } from 'react';
import { View, Pressable, ScrollView, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';
import { W } from './Ui';
import { SheetFrame, BigBtn, dim } from './ColUi';
import { SlidePills } from './TabSlide';
import { renewFor, SOURCE_TEXT } from '../lib/renewGuide';

const Rich = ({ s }: { s: string }) => (
  <Text style={{ color: W, fontSize: 14.5, lineHeight: 21, flex: 1 }}>{s.split('**').map((p, i) => (i % 2 ? <Text key={i} style={{ fontWeight: '800' }}>{p}</Text> : p))}</Text>
);
const box = { marginTop: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', backgroundColor: 'rgba(255,255,255,.045)' } as const;

export function RenewGuideSheet({ type, title, country, suggest, suggestLabel, onClose, onRemind }: { type: string; title: string; country?: 'MY' | 'other'; suggest?: string; suggestLabel?: string; onClose: () => void; onRemind?: () => void }) {
  const g = renewFor(type, title, country); const [i, setI] = useState(0); const way = g.ways[Math.min(i, g.ways.length - 1)];
  return (
    <SheetFrame title="How to renew" sub={title || g.title} onClose={onClose}>
      {g.ways.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }} contentContainerStyle={{ paddingRight: 8 }}>
          <SlidePills key={g.ways.map((w) => w.tab).join('|')} tabs={g.ways.map((w) => w.tab)} index={i} onChange={setI} colors={['#7c9cff', '#b794ff']} fontSize={12.5} padX={14} padY={9} />
        </ScrollView>
      ) : null}
      <View style={{ ...box, marginTop: 14 }}>
        <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 }}>STEPS</Text>
        {way.steps.map((st, k) => (
          <View key={k} style={{ flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
            <LinearGradient colors={['#7c5cff', '#5b3fe0']} style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '800' }}>{k + 1}</Text></LinearGradient>
            <Rich s={st} />
          </View>
        ))}
        {g.note ? <Text style={{ color: dim, fontSize: 12, lineHeight: 17 }}>{g.note}</Text> : null}
      </View>
      {g.bring && g.bring.length ? (
        <View style={box}>
          <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 }}>BRING THESE</Text>
          {g.bring.map((b) => <Text key={b} style={{ color: W, fontSize: 14, lineHeight: 22 }}>•  {b}</Text>)}
        </View>
      ) : null}
      {g.url ? (
        <Pressable onPress={() => Linking.openURL(g.url as string).catch(() => {})} accessibilityLabel="Open the official page" style={({ pressed }) => ({ marginTop: 12, height: 46, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.97 : 1 }] })}>
          <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>Open the official page ↗</Text>
        </Pressable>
      ) : null}
      <View style={box}><Text style={{ color: dim, fontSize: 12, lineHeight: 17 }}>{SOURCE_TEXT[g.source]} My Life 1.0 cannot renew anything for you.</Text></View>
      {onRemind && suggestLabel ? <BigBtn t={suggestLabel} onPress={onRemind} a11y="Set my reminder" /> : null}
    </SheetFrame>
  );
}
