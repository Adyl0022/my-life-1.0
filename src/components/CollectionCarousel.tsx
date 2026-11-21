import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, PanResponder, LayoutAnimation } from 'react-native';
import { Pressable } from './Press';
import { useRouter } from 'expo-router';
import { Text } from './Txt';
import { LinearGradient } from 'expo-linear-gradient';
import { W } from './Ui';
import { useStored } from '../lib/store';
import { EMPTY_COL, type ColStore, type Item, num, rm, dueOf, worthNow, CATS } from '../lib/collection';
import { validDate } from '../lib/documents';

// Personal Collection top card: turns by itself every 10 seconds, swipe to change, hold to pause. Same behaviour as the My Record and Islamic Hub cards.
const CH = 196;
function Glass({ children, style, radius = 22 }: { children: React.ReactNode; style?: any; radius?: number }) {
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)', backgroundColor: 'rgba(255,255,255,.035)' }, style]}>
      <LinearGradient colors={['rgba(255,255,255,.08)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      {children}
    </View>
  );
}
const pad = (n: number) => String(n).padStart(2, '0');
const dayN = (s: string) => { const p = s.split('-'); return Math.round(new Date(+p[0], +p[1] - 1, +p[2], 12).getTime() / 86400000); };
const leftText = (n: number) => (n < 0 ? 'Ended ' + -n + (n === -1 ? ' day ago' : ' days ago') : n === 0 ? 'Ends today' : n + (n === 1 ? ' day left' : ' days left'));
const tone = (n: number) => (n <= 7 ? '#ff6b81' : n <= 30 ? '#ffd593' : '#5ee7b5');
const countOf = (n: number, one: string) => n + ' ' + (n === 1 ? one : one + 's');

export function CollectionCarousel() {
  const router = useRouter();
  const [st] = useStored<ColStore>('ml_collection', EMPTY_COL);
  const items: Item[] = ((st && st.items) || []);
  const loans = ((st && st.loans) || []).filter((l) => !l.done);
  const now = new Date(); const today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  const of = (c: string) => items.filter((x) => x.cat === c).sort((a, b) => b.id - a.id);
  const gad = of('gadget'), lif = of('lifestyle'), prop = of('property');
  const spent = (l: Item[]) => l.reduce((s, x) => s + num(x.price), 0);
  const gadWorth = gad.reduce((s, x) => { const w = worthNow(x, now); return s + (w != null ? w : num(x.price)); }, 0);
  const war = gad.filter((x) => x.warranty && validDate(x.warranty)).map((x) => ({ x, n: dayN(x.warranty) - dayN(today) })).sort((a, b) => a.n - b.n);
  const lent = loans.filter((l) => l.dir === 'lent' && l.what === 'money').reduce((s, l) => s + num(l.amount), 0);
  const borrowed = loans.filter((l) => l.dir === 'borrowed' && l.what === 'money').reduce((s, l) => s + num(l.amount), 0);
  const loanRows = loans.map((l) => ({ l, d: dueOf(l, now) })).sort((a, b) => (a.d.hot === b.d.hot ? 0 : a.d.hot ? -1 : 1));

const kinds = ['gadget', 'lifestyle', 'property', 'loans'];
  const [slide, setSlide] = useState(0);
  const cur = kinds[Math.min(slide, kinds.length - 1)];
  const fade = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const prog = useRef(new Animated.Value(0)).current;
  const [held, setHeld] = useState(false);
  const busy = useRef(false);
  const swap = (dir: number) => {
    if (busy.current) return; busy.current = true;
    Animated.parallel([Animated.timing(tx, { toValue: -dir * 24, duration: 200, useNativeDriver: true }), Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true })]).start(() => {
      LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity')); setSlide((v) => (v + dir + kinds.length) % kinds.length); tx.setValue(dir * 24);
      Animated.parallel([Animated.timing(tx, { toValue: 0, duration: 300, useNativeDriver: true }), Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true })]).start(() => { busy.current = false; });
    });
  };
  const swapRef = useRef(swap); swapRef.current = swap;
  useEffect(() => {
    prog.setValue(0);
    if (held) return;
    const a = Animated.timing(prog, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: false });
    a.start(({ finished }) => { if (finished) swapRef.current(1); });
    return () => a.stop();
  }, [held, slide]);
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
    onPanResponderRelease: (_e, g) => { if (g.dx < -40) swapRef.current(1); else if (g.dx > 40) swapRef.current(-1); },
  })).current;
  const hold = { onPressIn: () => setHeld(true), onPressOut: () => setHeld(false) };
  const lab = { color: '#8fe9e2', fontSize: 10.5, fontWeight: '800' as const, letterSpacing: 1.2 };
  const Row = ({ l, r, c }: { l: string; r: string; c: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c, marginRight: 10 }} />
      <Text numberOfLines={1} style={{ flex: 1, color: W, fontSize: 13, fontWeight: '700' }}>{l}</Text>
      <Text numberOfLines={1} style={{ color: c, fontSize: 12.5, fontWeight: '700', marginLeft: 8 }}>{r}</Text>
    </View>
  );
  const Foot = ({ l, r }: { l: string; r: string }) => (
    <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.14)', flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: '#ffd593', fontSize: 12.5, fontWeight: '700' }}>{l}</Text>
      <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, fontWeight: '600' }}>{r}</Text>
    </View>
  );
  const go = (p: string) => router.push(p as any);
  const Empty = ({ t, s }: { t: string; s: string }) => (
    <View style={{ flex: 1, justifyContent: 'center' }}><Text style={{ color: W, fontSize: 17, fontWeight: '800' }}>{t}</Text><Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12.5, lineHeight: 18, marginTop: 6 }}>{s}</Text></View>
  );
  const Slide = ({ label, to, rows, foot, empty }: { label: string; to: string; rows: { l: string; r: string; c: string }[]; foot?: [string, string]; empty: [string, string] }) => (
    <Pressable {...hold} onPress={() => go(to)}><Glass radius={22} style={{ padding: 14, paddingBottom: 26, height: CH }}>
      <Text style={lab}>{label}</Text>
      {rows.length ? rows.slice(0, 3).map((x, i) => <Row key={i} l={x.l} r={x.r} c={x.c} />) : <Empty t={empty[0]} s={empty[1]} />}
      {rows.length ? <View style={{ flex: 1 }} /> : null}
      {rows.length && foot ? <Foot l={foot[0]} r={foot[1]} /> : null}
    </Glass></Pressable>
  );
  return (
    <View style={{ height: CH }}>
      <Animated.View {...pan.panHandlers} style={{ opacity: fade, transform: [{ translateX: tx }] }}>
        {cur === 'gadget' ? (
          <Slide label="GADGETS" to="/collection-items?c=gadget"
            rows={war.length ? war.map((w) => ({ l: w.x.name, r: 'Warranty · ' + leftText(w.n), c: tone(w.n) })) : gad.map((x) => ({ l: x.name, r: num(x.price) > 0 ? rm(num(x.price)) : x.kind, c: '#8ea8ff' }))}
            foot={[countOf(gad.length, 'gadget'), 'Worth about ' + rm(Math.round(gadWorth)) + ' ›']} empty={['Phone, laptop, watch', 'Keep your devices with their price and warranty date, so you never lose a receipt.']} />
        ) : cur === 'lifestyle' ? (
          <Slide label="LIFESTYLE" to="/collection-items?c=lifestyle"
            rows={lif.map((x) => ({ l: x.name, r: num(x.price) > 0 ? rm(num(x.price)) : x.kind, c: '#ff8fab' }))}
            foot={[countOf(lif.length, 'item'), 'Spent ' + rm(Math.round(spent(lif))) + ' ›']} empty={['Shoes, bags, perfume', 'Keep the nice things you own and what they cost.']} />
        ) : cur === 'property' ? (
          <Slide label="PROPERTY" to="/collection-items?c=property"
            rows={prop.map((x) => ({ l: x.name, r: num(x.price) > 0 ? rm(num(x.price)) : x.kind, c: '#8fe9e2' }))}
            foot={[countOf(prop.length, 'property').replace('propertys', 'properties'), 'Total ' + rm(Math.round(spent(prop))) + ' ›']} empty={['House, land, rent', 'Keep your houses, land and anything you rent in one place.']} />
        ) : (
          <Slide label="LENT & BORROWED" to="/loans"
            rows={loanRows.map(({ l, d }) => ({ l: (l.dir === 'lent' ? 'To ' : 'From ') + (l.who || 'someone') + ' · ' + (l.what === 'money' ? rm(num(l.amount)) : l.title || 'thing'), r: d.txt, c: d.hot ? '#ff9aa9' : d.col }))}
            foot={[lent > 0 ? 'Lent ' + rm(lent) : 'Nothing lent', borrowed > 0 ? 'Borrowed ' + rm(borrowed) + ' ›' : 'Open ›']} empty={['Money and things', 'Write down what you lent or borrowed, with a due date, and the app reminds you.']} />
        )}
      </Animated.View>
      <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: 10, flexDirection: 'row', gap: 6 }}>{kinds.map((_k, i) => (<View key={i} style={{ flex: 1, height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,.2)' }}>{slide === i ? <Animated.View style={{ height: 3, borderRadius: 2, backgroundColor: '#5ee7df', width: prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} /> : null}</View>))}</View>
    </View>
  );
}
