import React from 'react';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Text } from '../components/Txt';
import { RecordPage, Intro, Pat } from '../components/RecordHubUi';
import { useStored } from '../lib/store';
import { CATS, GRAD, INK, EMPTY_COL, type ColStore, type ItemCat } from '../lib/collection';

function Card({ e, title, sub, n, g, wide, onPress }: { e: string; title: string; sub: string; n: number; g: [string, string]; wide?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={'Open ' + title} style={({ pressed }) => ({ width: wide ? '100%' : '48.2%', transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <View style={{ height: wide ? 96 : 128, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.55)', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, elevation: 5 }}>
        <LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <Pat kind="grid" />
        <LinearGradient colors={['rgba(255,255,255,.4)', 'rgba(255,255,255,0)']} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, height: '48%' }} />
        <View style={{ flex: 1, padding: 14, justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 28 }}>{e}</Text>
          <View><Text style={{ color: INK, fontSize: 16, fontWeight: '800' }}>{title}</Text><Text numberOfLines={1} style={{ color: INK, opacity: 0.8, fontSize: 11.5 }}>{sub}</Text></View>
        </View>
        <View style={{ position: 'absolute', right: 12, top: 12, minWidth: 26, height: 22, borderRadius: 11, paddingHorizontal: 8, backgroundColor: 'rgba(255,255,255,.6)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: INK, fontSize: 12, fontWeight: '800' }}>{n}</Text></View>
      </View>
    </Pressable>
  );
}

export default function Screen() {
  const router = useRouter();
  const [st] = useStored<ColStore>('ml_collection', EMPTY_COL);
  const items = (st && st.items) || [], loans = (st && st.loans) || [], lessons = (st && st.lessons) || [];
  const cnt = (c: ItemCat) => items.filter((x) => x.cat === c).length;
  const go = (p: string) => router.push(p as any);
  return (
    <RecordPage title="Personal Collection" sub="Your things, your lessons">
      <Intro title="Your things, your lessons" text="Gadgets, belongings, property, what you lent or borrowed, and what you learned" colors={['rgba(61,240,255,.55)', 'rgba(255,106,213,.5)']} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
        {(['gadget', 'lifestyle', 'property'] as ItemCat[]).map((c) => <Card key={c} e={CATS[c].e} title={CATS[c].title} sub={CATS[c].sub} n={cnt(c)} g={GRAD[c]} onPress={() => go('/collection-items?c=' + c)} />)}
        <Card e="🤝" title="Lent & Borrowed" sub="Money and things" n={loans.filter((l) => !l.done).length} g={GRAD.loans} onPress={() => go('/loans')} />
        <Card wide e="💡" title="Life Lessons" sub="Things you learned, so you do not forget" n={lessons.length} g={GRAD.lessons} onPress={() => go('/lessons')} />
      </View>
      <View style={{ height: 10 }} />
    </RecordPage>
  );
}
