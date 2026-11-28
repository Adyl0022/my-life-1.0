import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, PanResponder, LayoutAnimation } from 'react-native';
import { Pressable } from './Press';
import { useRouter } from 'expo-router';
import { Text } from './Txt';
import { LinearGradient } from 'expo-linear-gradient';
import { W } from './Ui';
import { useStored } from '../lib/store';
import { odoEstimate, taskState } from '../lib/maintTasks';
import { DocStore, EMPTY_DOCS, daysLeft } from '../lib/documents';

// My Record top card: turns by itself every 10 seconds, swipe to change, hold to pause. Same behaviour as the Islamic Hub card.
const CH = 196;
// Clear glass: no blur and only a faint tint, so the page shows through.
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
const TIPS = [
  'Add a passport or card date once. The app reminds you before it ends.',
  'Take a clear photo of important papers and keep it somewhere safe too.',
  'Check your road tax and insurance dates every few months.',
  'Keep warranty slips together so a repair never costs more than it should.',
  'Note the odometer once a month. Service reminders get more accurate.',
  'A passport should have at least six months left before you travel.',
  'Save the serial number of every gadget you own. It helps with warranty and repairs.',
  'Photograph the front and back of each card, then keep the photos away from your gallery.',
  'Set a renewal reminder one month early, so there is time to book an appointment.',
  'A warranty only helps if you can find the receipt. Add it the day you buy.',
  'Write down what each item cost. Later you will know what it is worth today.',
  'Check your tyre pressure every two weeks. It saves fuel and keeps the ride safe.',
  'Spray the chain after a wet ride, not only on a schedule.',
  'Keep one list of every policy: car, health, life and home.',
  'Note the expiry date of your driving licence and renew before the last month.',
  'Back up your records in Settings now and then, so a lost phone is not a lost life.',
  'Give each document a clear name, like "Passport - front page", so you find it in seconds.',
  'Keep a note of your vehicle chassis and engine numbers for insurance claims.',
  'Record every service, even small ones. A full history raises the resale value.',
  'Check the dates on your children’s and parents’ papers too, not only your own.',
  'Take a photo of your belongings once a year. It makes any claim much easier.',
  'Store visa and travel insurance dates before every trip.',
  'Keep gadget manuals and invoices in one place, so nothing gets thrown away by mistake.',
  'Review your records on the first day of every month. Five minutes is enough.',
  'Mark items you lent out, so you remember who has them.',
  'Fuel up and note the odometer together. It builds a true picture of your mileage.',
  'A cracked tyre or a worn brake pad is cheaper to fix early.',
  'Keep your emergency contacts and policy numbers where you can reach them fast.',
  'Add a custom category for anything special, such as hobby gear or collections.',
  'When you sell or give away an item, mark it so your list stays honest.',
  'Keep scanned copies of your ID separate from your daily documents.',
  'Wash your vehicle regularly. It is the easiest time to spot rust, leaks and wear.',
  'Renew your road tax early if you plan to travel. Avoid last-minute queues.',
  'Keep a record of oil type and grade, so you never buy the wrong one.',
  'Note the battery age of your vehicle. Most need changing every two to four years.',
  'Photograph any damage right after it happens, with the date visible.',
  'Keep your warranty cards for electronics until the warranty period ends.',
  'Check expiry dates on your medical cards and insurance together.',
  'A short note beside each record, such as where the original is kept, saves a long search.',
  'Once a year, remove records you no longer need. A tidy list is easier to trust.',
];
const dueText = (n: number) => (n < 0 ? 'Expired ' + -n + (n === -1 ? ' day ago' : ' days ago') : n === 0 ? 'Today' : n + (n === 1 ? ' day left' : ' days left'));
const tone = (n: number) => (n <= 7 ? '#ff6b81' : n <= 30 ? '#ffd593' : '#5ee7b5');

export function RecordCarousel() {
  const router = useRouter();
  const [rec] = useStored<any>('ml_record', { data: {} });
  const [dst] = useStored<DocStore>('ml_documents', EMPTY_DOCS);
  const dsoon = ((dst && dst.docs) || []).filter(d => d.expiry).map(d => ({ label: d.title, n: daysLeft(d.expiry as string) })).filter(x => x.n !== null && x.n !== undefined).sort((a, b) => (a.n as number) - (b.n as number)) as { label: string; n: number }[];
  const now = new Date(); const today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  const jobs: { name: string; text: string; lv: number; di: number; veh: string }[] = [];
  const rens: { label: string; n: number; veh: string }[] = [];
  let lastKm = 0, lastDate = '', lastVeh = '';
  const entries = Object.entries((rec && rec.data) || {}).filter(([, v]: any) => !!v);
  // With more than one vehicle, every line says which vehicle it is about.
  const multi = entries.length > 1;
  entries.forEach(([vn, v]: any) => {
    const oe = odoEstimate(v);
    if (oe.last > 0 && (!lastKm || (oe.lastDate || '') > lastDate || ((oe.lastDate || '') === lastDate && oe.last > lastKm))) { lastKm = oe.last; lastDate = oe.lastDate || ''; lastVeh = vn; }
    (v.tasks || []).forEach((t: any) => {
      if (!t || !t.name || (t.kind === 'part' && t.km > 0 && t.odo != null && !t.days)) return;
      const s = taskState(t, oe.odo, oe.est); jobs.push({ name: t.name, text: s.text.split(' · ')[0], lv: s.level, di: s.dueIn, veh: multi ? vn : '' });
    });
    const r = v.renew || {};
    ([['roadtax', 'Road tax'], ['insurance', 'Insurance'], ['licence', 'Driving licence']] as [string, string][]).forEach(([k, label]) => {
      const d = r[k]; if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) rens.push({ label, n: dayN(d) - dayN(today), veh: multi ? vn : '' });
    });
  });
  jobs.sort((a, b) => b.lv - a.lv || a.di - b.di); rens.sort((a, b) => a.n - b.n);
  // A different tip every time the tip card comes round. Stepping by 7 through 40 tips never repeats until all have been shown.
  const [tipI, setTipI] = useState(() => Math.floor(Math.random() * TIPS.length));
  const tip = TIPS[tipI % TIPS.length];

  const kinds = ['veh', 'ren', 'doc', 'tip'];
  const [slide, setSlide] = useState(0);
  const cur = kinds[Math.min(slide, kinds.length - 1)];
  useEffect(() => { if (cur === 'tip') setTipI((i) => (i + 7) % TIPS.length); }, [cur]);
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
  const Row = ({ l, r, c, sub }: { l: string; r: string; c: string; sub?: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c, marginRight: 10 }} />
      <Text numberOfLines={1} style={{ flex: 1, color: W, fontSize: 13, fontWeight: '700' }}>{l}{sub ? <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, fontWeight: '500' }}>{'  ' + sub}</Text> : null}</Text>
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
  return (
    <View style={{ height: CH }}>
      <Animated.View {...pan.panHandlers} style={{ opacity: fade, transform: [{ translateX: tx }] }}>
        {cur === 'veh' ? (
          <Pressable {...hold} onPress={() => go('/vehicle')}><Glass radius={22} style={{ padding: 14, paddingBottom: 26, height: CH }}>
            <Text style={lab}>MAINTENANCE TASK</Text>
            {jobs.length ? jobs.slice(0, 3).map((j, i) => <Row key={i} l={j.name} sub={j.veh} r={j.text} c={j.lv === 2 ? '#ff6b81' : j.lv === 1 ? '#ffd593' : '#5ee7b5'} />) : (
              <View style={{ flex: 1, justifyContent: 'center' }}><Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>No jobs yet</Text><Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>Add oil change, chain spray or tyre checks and the app tells you when they are due.</Text></View>
            )}
            {jobs.length ? <View style={{ flex: 1 }} /> : null}
            {jobs.length ? <Foot l={lastKm ? (multi && lastVeh ? lastVeh + ' · ' : 'Last reading ') + lastKm.toLocaleString('en-MY') + ' km' : 'No odometer reading yet'} r="Open ›" /> : null}
          </Glass></Pressable>
        ) : cur === 'ren' ? (
          <Pressable {...hold} onPress={() => go('/vehicle')}><Glass radius={22} style={{ padding: 14, paddingBottom: 26, height: CH }}>
            <Text style={lab}>RENEWALS · ROAD TAX, INSURANCE, LICENCE</Text>
            {rens.length ? rens.slice(0, 3).map((x, i) => <Row key={i} l={x.label} sub={x.veh} r={dueText(x.n)} c={tone(x.n)} />) : (
              <View style={{ flex: 1, justifyContent: 'center' }}><Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>No dates saved</Text><Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>Add your road tax, insurance and licence dates. The app reminds you before they end.</Text></View>
            )}
            {rens.length ? <View style={{ flex: 1 }} /> : null}
            {rens.length ? <Foot l={rens[0].n < 0 ? 'Something has expired' : rens[0].n <= 30 ? 'Renew soon' : 'All up to date'} r="Open ›" /> : null}
          </Glass></Pressable>
        ) : cur === 'doc' ? (
          <Pressable {...hold} onPress={() => go('/documents')}><Glass radius={22} style={{ padding: 14, paddingBottom: 26, height: CH }}>
            <Text style={lab}>DOCUMENTS</Text>
            {dsoon.length ? dsoon.slice(0, 3).map((x, i) => <Row key={i} l={x.label} r={dueText(x.n)} c={tone(x.n)} />) : (
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ color: W, fontSize: 18, fontWeight: '800' }}>Passport, cards and warranty</Text>
                <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12.5, lineHeight: 18, marginTop: 6 }}>Keep every paper in one place with its end date, so nothing runs out without you knowing.</Text>
              </View>
            )}
            {dsoon.length ? <View style={{ flex: 1 }} /> : null}
            {dsoon.length ? <Foot l={dsoon[0].n < 0 ? 'Something has expired' : dsoon[0].n <= 30 ? 'Renew soon' : 'All up to date'} r="Open ›" /> : null}
          </Glass></Pressable>
        ) : (
          <Pressable {...hold}><Glass radius={22} style={{ padding: 14, paddingBottom: 26, height: CH }}>
            <Text style={lab}>TIP OF THE DAY</Text>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={{ color: W, fontSize: 18, fontWeight: '800', lineHeight: 25 }}>{tip}</Text>
            </View>
          </Glass></Pressable>
        )}
      </Animated.View>
      <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: 10, flexDirection: 'row', gap: 6 }}>{kinds.map((_k, i) => (<View key={i} style={{ flex: 1, height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,.2)' }}>{slide === i ? <Animated.View style={{ height: 3, borderRadius: 2, backgroundColor: '#5ee7df', width: prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} /> : null}</View>))}</View>
    </View>
  );
}
