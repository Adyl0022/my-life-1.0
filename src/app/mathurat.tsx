import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '../components/Txt';
import { ZikirScreen } from '../components/ZikirScreen';
import { MATHURAT, dayKey } from '../lib/islamic';
export default function Mathurat() {
  const [pe, setPe] = useState(new Date().getHours() >= 12 ? 1 : 0);
  const pill = (on: boolean, t: string, f: () => void) => <Pressable key={t} onPress={f} style={{ paddingVertical: 7, paddingHorizontal: 16, borderRadius: 999, backgroundColor: on ? 'rgba(124,156,255,.3)' : 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: on ? 'rgba(124,156,255,.6)' : 'rgba(255,255,255,.2)' }}><Text style={{ color: on ? '#fff' : 'rgba(255,255,255,.8)', fontSize: 12, fontWeight: on ? '700' : '600' }}>{t}</Text></Pressable>;
  const head = (
    <View style={{ paddingHorizontal: 20, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {pill(pe === 0, 'Morning', () => setPe(0))}{pill(pe === 1, 'Evening', () => setPe(1))}
      <Text numberOfLines={1} style={{ flex: 1, color: 'rgba(255,255,255,.7)', fontSize: 11.5, textAlign: 'right' }}>{pe === 0 ? 'Read after Subuh' : 'Read after Asar'}</Text>
    </View>
  );
  return <ZikirScreen title="Al-Ma'thurat Sughra" sub="31 parts · Malaysian edition" parts={MATHURAT} storeKey={'mathurat_' + dayKey() + '_' + pe} bmKey="mathurat" start={0} evening={pe === 1} headExtra={head}
    footNote="Morning (Asbahna) and evening (Amsaina) differ only in a few doa wordings. Quran parts come from the full Quran text." />;
}
