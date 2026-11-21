import { useRegion } from '../lib/region';
import React from 'react';
import { View } from 'react-native';
import { Pressable } from '../components/Press';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Text } from '../components/Txt';
import { LineIcon } from '../components/LineIcon';
import { RecordPage, Intro } from '../components/RecordHubUi';
import { ColArt } from '../components/ColArt';
import { CollectionCarousel } from '../components/CollectionCarousel';
import { Tile } from '../components/ColUi';
import { type ColIconName } from '../components/ColIcon';
import { W } from '../components/Ui';
import { CATS, ACC, EMPTY_COL, type ColStore } from '../lib/collection';
import * as Haptics from '../lib/haptics';
import { useStored } from '../lib/store';
import { itemsPdf } from '../lib/colPdf';
import { showAlert } from '../lib/dialog';
import { useName } from '../lib/store';

function Card({ icon, title, sub, c, wide, onPress }: { icon: ColIconName; title: string; sub: string; c: string; wide?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={'Open ' + title} style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <View style={{ height: wide ? 92 : 126, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 7, shadowOffset: { width: 0, height: 5 } }}>
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
  useRegion(); // follows the chosen currency
  const router = useRouter();
  const go = (p: string) => router.push(p as any);
  const [st] = useStored<ColStore>('ml_collection', EMPTY_COL); const items = (st && st.items) || []; const nm = useName(); const [busy, setBusy] = React.useState(false);
  const pdf = async () => { if (busy) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); setBusy(true); try { const ok = await itemsPdf(items, nm); if (!ok) showAlert('Could not share', 'The PDF was made, but this phone has no way to share it.'); } catch (e) { showAlert('Could not make the PDF', 'Please try again.'); } setBusy(false); };
  return (
    <RecordPage title="Personal Collection" sub="What you own, what you owe" bg={<ColArt />}>
      <Intro plain title="Your things" text="Photos, prices and warranties for your things, plus reminders for anything you lend out" colors={['rgba(142,168,255,.5)', 'rgba(183,148,255,.4)']} />
      <View style={{ gap: 12, marginTop: 14 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Card icon="gadget" title={CATS.gadget.title} sub={CATS.gadget.sub} c={ACC.gadget} onPress={() => go('/collection-items?c=gadget')} />
          <Card icon="life" title={CATS.lifestyle.title} sub={CATS.lifestyle.sub} c={ACC.lifestyle} onPress={() => go('/collection-items?c=lifestyle')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Card icon="prop" title={CATS.property.title} sub={CATS.property.sub} c={ACC.property} onPress={() => go('/collection-items?c=property')} />
          <Card icon="car" title={CATS.vehicle.title} sub={CATS.vehicle.sub} c={ACC.vehicle} onPress={() => go('/collection-items?c=vehicle')} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Card wide icon="lent" title="Lent & Borrowed" sub="Money and things" c={ACC.loans} onPress={() => go('/loans')} />
        </View>
        <CollectionCarousel />
      </View>
      {items.length ? (
        <Pressable onPress={pdf} accessibilityLabel="Export my things as PDF" style={({ pressed }) => ({ marginTop: 16, transform: [{ scale: pressed ? 0.98 : 1 }] })}>
          <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.26)' }}>
            <LinearGradient colors={['rgba(142,168,255,.32)', 'rgba(183,148,255,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
            <View style={{ padding: 16 }}>
              <Text style={{ color: W, fontSize: 16, fontWeight: '800' }}>My things as a PDF</Text>
              <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12.5, marginTop: 4, lineHeight: 18 }}>A list of everything you own with price, date and a photo. Handy for an insurance claim. It is made on this phone and nothing is uploaded.</Text>
              <LinearGradient colors={['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ marginTop: 14, height: 46, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <LineIcon name="agreement" c="#0b1030" size={22} />
                <Text style={{ color: '#0b1030', fontSize: 15, fontWeight: '800' }}>{busy ? 'Making your PDF...' : 'Export as PDF'}</Text>
              </LinearGradient>
            </View>
          </View>
        </Pressable>
      ) : null}
      <View style={{ height: 10 }} />
    </RecordPage>
  );
}
