import React from 'react';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Text } from '../components/Txt';
import { RecordPage, Intro } from '../components/RecordHubUi';
import { ColArt } from '../components/ColArt';
import { Tile } from '../components/ColUi';
import { type ColIconName } from '../components/ColIcon';
import { W } from '../components/Ui';
import { CATS, ACC } from '../lib/collection';

function Card({ icon, title, sub, c, wide, onPress }: { icon: ColIconName; title: string; sub: string; c: string; wide?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={'Open ' + title} style={({ pressed }) => ({ width: wide ? '100%' : '48.2%', transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <View style={{ height: wide ? 92 : 126, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.34)', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 7, shadowOffset: { width: 0, height: 5 }, elevation: 4 }}>
        <LinearGradient colors={['rgba(255,255,255,.13)', 'rgba(255,255,255,.04)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <LinearGradient colors={[c + '59', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <View style={wide ? { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 } : { flex: 1, padding: 14, justifyContent: 'space-between' }}>
          <Tile icon={icon} c={c} size={46} breathe />
          <View style={wide ? { flex: 1 } : undefined}><Text style={{ color: W, fontSize: 16.5, fontWeight: '800' }}>{title}</Text><Text numberOfLines={wide ? 2 : 1} style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 1 }}>{sub}</Text></View>
        </View>
      </View>
    </Pressable>
  );
}

export default function Screen() {
  const router = useRouter();
  const go = (p: string) => router.push(p as any);
  return (
    <RecordPage title="Personal Collection" sub="Your things, your lessons" bg={<ColArt />}>
      <Intro title="Your things, your lessons" text="Gadgets, belongings, property, what you lent or borrowed, and what you learned" colors={['rgba(142,168,255,.5)', 'rgba(183,148,255,.4)']} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
        <Card icon="gadget" title={CATS.gadget.title} sub={CATS.gadget.sub} c={ACC.gadget} onPress={() => go('/collection-items?c=gadget')} />
        <Card icon="life" title={CATS.lifestyle.title} sub={CATS.lifestyle.sub} c={ACC.lifestyle} onPress={() => go('/collection-items?c=lifestyle')} />
        <Card icon="prop" title={CATS.property.title} sub={CATS.property.sub} c={ACC.property} onPress={() => go('/collection-items?c=property')} />
        <Card icon="lent" title="Lent & Borrowed" sub="Money and things" c={ACC.loans} onPress={() => go('/loans')} />
        <Card wide icon="less" title="Life Lessons" sub="What you learned, so you do not forget" c={ACC.lessons} onPress={() => go('/lessons')} />
      </View>
      <View style={{ height: 10 }} />
    </RecordPage>
  );
}
