import { LineIcon } from './LineIcon';
import { useSession } from '../lib/auth';
import React, { useState } from 'react';
import { KbScroll } from './KbScroll';
import { View, Pressable, Modal, ScrollView, Image, KeyboardAvoidingView, Platform, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Txt';
import { W } from './Ui';
import { INK } from '../lib/collection';
import { ColIcon, type ColIconName } from './ColIcon';
import { Blob } from './Bg';
import { FinArt } from './FinArt';

export const dim = 'rgba(255,255,255,.62)';
export const Lab = ({ t }: { t: string }) => <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginTop: 18, marginBottom: 8 }}>{t}</Text>;
export const chip = (on: boolean, c = '#8ea8ff') => ({ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, alignItems: 'center' as const, backgroundColor: on ? c + '55' : 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: on ? c : 'rgba(255,255,255,.14)' });

/** Glowing outlined tile with a thin line icon, used in lists. */
export const Tile = ({ icon, c, size = 54, breathe }: { icon: ColIconName; c: string; size?: number; breathe?: boolean }) => {
  const a = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (!breathe) return;
    const l = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    l.start(); return () => l.stop();
  }, [breathe, a]);
  const r = size * 0.31;
  return (
    <View style={{ width: size, height: size, borderRadius: r, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c, backgroundColor: 'rgba(255,255,255,.08)', shadowColor: c, shadowOpacity: 0.55, shadowRadius: 9, shadowOffset: { width: 0, height: 0 } }}>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -5, top: -5, right: -5, bottom: -5, borderRadius: r + 5, backgroundColor: c + '30', opacity: breathe ? a.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] }) : 0.55, transform: [{ scale: breathe ? a.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.08] }) : 1 }] }} />
      <LinearGradient colors={[c + '44', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: r }} />
      <ColIcon name={icon} c={c} size={size * 0.5} />
    </View>
  );
};

/** A list row: tile, small label, title, one line, and a coloured status. */
export function ItemRow({ tile, label, title, sub, status, statusCol, hot, photo, onPress, a11y }: { tile: React.ReactNode; label: string; title: string; sub?: string; status?: string; statusCol?: string; hot?: boolean; photo?: string; onPress: () => void; a11y: string }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={a11y} style={({ pressed }) => ({ marginTop: 10, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <View style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: hot ? 'rgba(255,107,129,.6)' : 'rgba(255,255,255,.2)' }}>
        <LinearGradient colors={hot ? ['rgba(255,107,129,.3)', 'rgba(255,107,129,.08)'] : ['rgba(255,255,255,.12)', 'rgba(255,255,255,.03)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 }}>
          {photo ? <Image source={{ uri: photo }} style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.1)' }} resizeMode="cover" /> : tile}
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#8fe9e2', fontSize: 9.5, fontWeight: '800', letterSpacing: 1.1 }}>{label}</Text>
            <Text numberOfLines={1} style={{ color: W, fontSize: 16.5, fontWeight: '800', marginTop: 2 }}>{title}</Text>
            {sub ? <Text numberOfLines={1} style={{ color: dim, fontSize: 12, marginTop: 2 }}>{sub}</Text> : null}
            {status ? <Text numberOfLines={1} style={{ color: statusCol || W, fontSize: 12.5, fontWeight: '800', marginTop: 3 }}>{status}</Text> : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/** Two summary boxes under the search box. */
export const Sums = ({ a, b }: { a: [string, string]; b?: [string, string] }) => (
  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
    {[a, b].filter(Boolean).map((x, i) => (
      <View key={i} style={{ flex: 1, borderRadius: 18, padding: 12, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
        <Text style={{ color: '#8fe9e2', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>{(x as string[])[0]}</Text>
        <Text style={{ color: W, fontSize: 19, fontWeight: '800', marginTop: 4 }}>{(x as string[])[1]}</Text>
      </View>
    ))}
  </View>
);

export const Empty = ({ e, t, s }: { e: string; t: string; s: string }) => (
  <View style={{ marginTop: 28, alignItems: 'center', paddingHorizontal: 20 }}>
    <LineIcon name={e} c="rgba(255,255,255,.85)" size={44} w={1.4} />
    <Text style={{ color: W, fontSize: 16, fontWeight: '800', marginTop: 10 }}>{t}</Text>
    <Text style={{ color: dim, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 }}>{s}</Text>
  </View>
);

export const BigBtn = ({ t, g, onPress, a11y, dark, outline }: { t: string; g?: [string, string]; onPress: () => void; a11y?: string; dark?: boolean; outline?: string }) => (
  <Pressable onPress={onPress} accessibilityLabel={a11y || t} style={{ marginTop: 12 }}>
    {outline ? (
      <View style={{ height: 50, borderRadius: 18, borderWidth: 1, borderColor: outline, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: outline, fontSize: 15, fontWeight: '800' }}>{t}</Text></View>
    ) : (
      <LinearGradient colors={g || ['#8ea8ff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: dark ? INK : W, fontSize: 16, fontWeight: '800' }}>{t}</Text></LinearGradient>
    )}
  </Pressable>
);

/** Full screen sheet used for adding and editing. */
/** Tells the person, where they type, that this stays on the phone. */
export function PrivateNote() {
  const [sess] = useSession();
  return (
    <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(143,233,226,.08)', borderWidth: 1, borderColor: 'rgba(143,233,226,.3)' }}>
      <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>PRIVATE</Text>
      <Text style={{ flex: 1, color: 'rgba(255,255,255,.78)', fontSize: 11.5, lineHeight: 16 }}>{sess ? 'Details are saved to your account. Photos stay on this phone only and are not synced online.' : 'Saved on this phone. Sign in to back up the details online. Photos always stay on this phone only.'}</Text>
    </View>
  );
}

/** Puts a form into bordered boxes: every Lab starts a new box, and a BigBtn ends it. Works through fragments, so conditional parts still line up. */
export function Sections({ children }: { children?: React.ReactNode }) {
  const head: React.ReactNode[] = []; const groups: { t: any; k: string; items: React.ReactNode[] }[] = []; const tail: React.ReactNode[] = [];
  let cur: { t: any; k: string; items: React.ReactNode[] } | null = null;
  const walk = (ch: React.ReactNode, path: string) => {
    React.Children.forEach(ch, (c, i) => {
      const k = path + '.' + i; if (c == null || typeof c === 'boolean') return;
      if (React.isValidElement(c)) {
        if (c.type === React.Fragment) { walk((c.props as any).children, k); return; }
        if (c.type === Lab) { cur = { t: (c.props as any).t, k, items: [] }; groups.push(cur); return; }
        if (c.type === BigBtn) { cur = null; tail.push(<React.Fragment key={k}>{c}</React.Fragment>); return; }
      }
      const el = <React.Fragment key={k}>{c}</React.Fragment>;
      if (cur) cur.items.push(el); else if (groups.length || tail.length) tail.push(el); else head.push(el);
    });
  };
  walk(children, 'f');
  return (
    <>
      {head}
      {groups.map((g) => (
        <View key={g.k} style={{ marginTop: 14, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', backgroundColor: 'rgba(255,255,255,.045)' }}>
          <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginBottom: 10 }}>{g.t}</Text>
          {g.items}
        </View>
      ))}
      {tail}
    </>
  );
}

export function SheetFrame({ title, sub, onClose, children, noNote, finance }: { title: string; sub?: string; onClose: () => void; children: React.ReactNode; noNote?: boolean; finance?: boolean }) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: finance ? '#1a1030' : '#1b0f26' }}>
        {finance ? (<>
          <LinearGradient colors={['#1a1030', '#2a1747', '#3a1d3d']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
          <Blob size={320} color="rgba(255,196,107,.34)" style={{ right: -100, top: -40 }} />
          <Blob size={340} color="rgba(183,148,255,.3)" style={{ left: -120, bottom: 0 }} />
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}><FinArt /></View>
        </>) : <LinearGradient colors={['#1b0f26', '#2c1340', '#10244a']} locations={[0, 0.48, 1]} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />}
        <KbScroll contentContainerStyle={{ padding: 20, paddingTop: 52, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={onClose} accessibilityLabel="Close"><View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 22 }}>‹</Text></View></Pressable>
              <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 22, fontWeight: '800' }}>{title}</Text>{sub ? <Text style={{ color: dim, fontSize: 12 }}>{sub}</Text> : null}</View>
            </View>
            {noNote ? null : <PrivateNote />}
            <Sections>{children}</Sections>
        </KbScroll>
      </View>
    </Modal>
  );
}

/** Detail page: optional photo, a box of lines, then action buttons. */
export function Detail({ label, title, tile, photo, lines, status, statusCol, hot, onClose, children }: { label: string; title: string; tile: React.ReactNode; photo?: string; lines: [string, string][]; status?: string; statusCol?: string; hot?: boolean; onClose: () => void; children: React.ReactNode }) {
  const [big, setBig] = useState(false);
  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#1b0f26' }}>
        <LinearGradient colors={['#1b0f26', '#2c1340', '#10244a']} locations={[0, 0.48, 1]} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 52, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={onClose} accessibilityLabel="Close"><View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 22 }}>‹</Text></View></Pressable>
            <View style={{ flex: 1 }}><Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 }}>{label}</Text><Text numberOfLines={2} style={{ color: W, fontSize: 22, fontWeight: '800' }}>{title}</Text></View>
          </View>
          {photo ? (
            <Pressable onPress={() => setBig(true)} accessibilityLabel="View photo" style={{ marginTop: 20 }}>
              <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.06)' }}><Image source={{ uri: photo }} style={{ width: '100%', aspectRatio: 1.4 }} resizeMode="contain" /></View>
              <Text style={{ color: dim, fontSize: 11.5, textAlign: 'center', marginTop: 8 }}>Tap the photo to see it full screen</Text>
            </Pressable>
          ) : <View style={{ alignItems: 'center', marginTop: 22 }}>{tile}</View>}
          <View style={{ marginTop: 18, borderRadius: 20, borderWidth: 1, borderColor: hot ? 'rgba(255,107,129,.5)' : 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.06)', paddingHorizontal: 16, paddingVertical: 6 }}>
            {status ? <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 13 }}><Text style={{ color: dim, fontSize: 13 }}>Status</Text><Text style={{ color: statusCol || W, fontSize: 14, fontWeight: '800' }}>{status}</Text></View> : null}
            {lines.map(([k, v], i) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 14, paddingVertical: 13, borderTopWidth: status || i ? 1 : 0, borderTopColor: 'rgba(255,255,255,.1)' }}>
                <Text style={{ color: dim, fontSize: 13 }}>{k}</Text><Text selectable style={{ color: W, fontSize: 14, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>{v}</Text>
              </View>
            ))}
          </View>
          {children}
        </ScrollView>
        {big && photo ? (
          <Modal transparent statusBarTranslucent animationType="fade" onRequestClose={() => setBig(false)}>
            <Pressable onPress={() => setBig(false)} style={{ flex: 1, backgroundColor: 'rgba(5,8,25,.94)', padding: 16, justifyContent: 'center' }}><Image source={{ uri: photo }} style={{ width: '100%', height: '85%' }} resizeMode="contain" /></Pressable>
          </Modal>
        ) : null}
      </View>
    </Modal>
  );
}

/** Small row of photos; tap one to see it full screen. */
export function PhotoStrip({ photos }: { photos: string[] }) {
  const [big, setBig] = useState(-1);
  if (photos.length < 2) return null;
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 }}>ALL PHOTOS ({photos.length})</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {photos.map((u, i) => (
          <Pressable key={u + i} onPress={() => setBig(i)} accessibilityLabel={'View photo ' + (i + 1)} style={({ pressed }) => ({ marginRight: 8, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
            <Image source={{ uri: u }} style={{ width: 78, height: 78, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,.25)' }} resizeMode="cover" />
          </Pressable>
        ))}
      </ScrollView>
      {big >= 0 ? (
        <Modal transparent statusBarTranslucent animationType="fade" onRequestClose={() => setBig(-1)}>
          <Pressable onPress={() => setBig(-1)} style={{ flex: 1, backgroundColor: 'rgba(5,8,25,.94)', padding: 16, justifyContent: 'center' }}>
            <Image source={{ uri: photos[big] }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
            <Text style={{ color: dim, fontSize: 12, textAlign: 'center', marginTop: 10 }}>{(big + 1) + ' of ' + photos.length + ' · tap to close'}</Text>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

/** Two-column card used by the grid view. */
export function GridCard({ tile, photo, label, title, sub, status, statusCol, onPress, a11y }: { tile: React.ReactNode; photo?: string; label: string; title: string; sub?: string; status?: string; statusCol?: string; onPress: () => void; a11y?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={a11y} style={({ pressed }) => ({ width: '48.5%', marginTop: 10, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      <View style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.06)' }}>
        {photo ? <Image source={{ uri: photo }} style={{ width: '100%', height: 110, backgroundColor: 'rgba(255,255,255,.1)' }} resizeMode="cover" /> : <View style={{ height: 110, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.05)' }}>{tile}</View>}
        <View style={{ padding: 11 }}>
          <Text style={{ color: '#8fe9e2', fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>{label}</Text>
          <Text numberOfLines={1} style={{ color: W, fontSize: 14.5, fontWeight: '800', marginTop: 2 }}>{title}</Text>
          {sub ? <Text numberOfLines={1} style={{ color: dim, fontSize: 11.5, marginTop: 2 }}>{sub}</Text> : null}
          {status ? <Text numberOfLines={1} style={{ color: statusCol || W, fontSize: 11.5, fontWeight: '800', marginTop: 3 }}>{status}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}
