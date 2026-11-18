import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Glass } from '../components/Glass';
import { IslamicBg, Header, Ic } from '../components/IslamicUi';
import { Inp, W } from '../components/Ui';
import { FastMonths } from '../components/FastMonths';
import { PuasaSky, RamadanHero, Crescent, Lantern, TipIcon, Bob } from '../components/PuasaArt';
import { Rise, FillBar, GrowBar } from '../components/Anim';
import { useStored } from '../lib/store';
import { HEMPTY, HData, cupsGoal } from '../lib/habit';
import { PUASA_EMPTY, PuasaData, FKind, ramadanState, ramadanOf, qadhaOwed, hijriText, hijriOf, hijriStart, HMON, DAYN, isHaram, sunatToday, sunatYear, sunatLabel, keyD, addDays, diffDays, parseK } from '../lib/fasting';
import { QURAN_FONT } from '../lib/islamic';

const dim = 'rgba(255,255,255,.68)';
const G = '#34d399';
const MS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fdate = (d: Date) => d.getDate() + ' ' + MS[d.getMonth()] + ' ' + d.getFullYear();
const Stat = ({ l, v, c }: { l: string; v: string; c?: string }) => (
  <View style={{ flex: 1, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,.08)' }}>
    <Text style={{ color: 'rgba(255,255,255,.68)', fontSize: 10.5 }}>{l}</Text><Text style={{ color: c || W, fontSize: 15, fontWeight: '800', marginTop: 2 }}>{v}</Text>
  </View>
);
const Btn = ({ t, onPress, on, c = G, style }: { t: string; onPress: () => void; on?: boolean; c?: string; style?: any }) => (
  <Pressable onPress={onPress} style={[{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, alignItems: 'center', backgroundColor: on ? c : 'rgba(255,255,255,.12)' }, style]}><Text style={{ color: on ? '#06281c' : W, fontSize: 13, fontWeight: '800' }}>{t}</Text></Pressable>
);
const Card = ({ children, tint, style, art }: { children: React.ReactNode; tint?: [string, string]; style?: any; art?: boolean }) => (
  <Glass radius={24} style={[{ paddingVertical: 14, paddingHorizontal: 16 }, style]}>
    {art ? <RamadanHero height={150} /> : null}
    {tint ? <LinearGradient colors={tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} /> : null}
    {children}
  </Glass>
);
const H = ({ t, s }: { t: string; s?: string }) => <View><Text style={{ color: W, fontSize: 14.5, fontWeight: '800' }}>{t}</Text>{s ? <Text style={{ color: dim, fontSize: 11.5, marginTop: 2 }}>{s}</Text> : null}</View>;

const VERSES = [
  { ar: 'يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ كَمَا كُتِبَ عَلَى الَّذِينَ مِنْ قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ', ms: 'Wahai orang-orang yang beriman! Diwajibkan ke atas kamu berpuasa sebagaimana diwajibkan ke atas orang-orang yang terdahulu daripada kamu, supaya kamu bertakwa.', en: 'O you who believe! Fasting is prescribed for you as it was prescribed for those before you, so that you may become mindful of Allah.', ref: 'Al-Baqarah 2:183' },
  { ar: 'شَهْرُ رَمَضَانَ الَّذِي أُنْزِلَ فِيهِ الْقُرْآنُ هُدًى لِلنَّاسِ', ms: 'Bulan Ramadan yang di dalamnya diturunkan Al-Quran sebagai petunjuk bagi manusia.', en: 'The month of Ramadan in which the Quran was revealed as guidance for mankind.', ref: 'Al-Baqarah 2:185' },
];
const HADITH = [
  ['Whoever fasts Ramadan with faith and hoping for reward, his past sins are forgiven.', 'Bukhari and Muslim', 'Sesiapa yang berpuasa Ramadan dengan penuh iman dan mengharapkan pahala, diampunkan dosanya yang lalu.'],
  ['Fasting is a shield.', 'Bukhari and Muslim', 'Puasa itu perisai.'],
  ['The one who fasts has two joys: when he breaks his fast, and when he meets his Lord.', 'Bukhari and Muslim', 'Orang yang berpuasa mendapat dua kegembiraan: ketika dia berbuka, dan ketika dia bertemu Tuhannya.'],
  ['Eat sahur, for in sahur there is blessing.', 'Bukhari and Muslim', 'Bersahurlah kamu, kerana pada sahur itu ada keberkatan.'],
  ['Deeds are presented on Monday and Thursday, and I love that my deeds are presented while I am fasting.', 'Tirmizi', 'Amalan-amalan dibentangkan pada hari Isnin dan Khamis, dan aku suka amalanku dibentangkan ketika aku sedang berpuasa.'],
  ['Whoever fasts Ramadan then follows it with six days of Syawal, it is as if he fasted the whole year.', 'Muslim', 'Sesiapa yang berpuasa Ramadan kemudian mengikutinya dengan enam hari Syawal, seolah-olah dia berpuasa sepanjang tahun.'],
  ['Fasting the day of Arafah wipes out the sins of the year before and the year after. Fasting Asyura wipes out the sins of the year before.', 'Muslim', 'Puasa hari Arafah menghapuskan dosa setahun yang lalu dan setahun yang akan datang. Puasa Asyura menghapuskan dosa setahun yang lalu.'],
];
const TIPS: [string, string, string][] = [
  ['sahur', 'Do not skip sahur', 'Eat slowly and late, close to Subuh. Choose oats, eggs, rice or bread with some protein so you stay full.'],
  ['dates', 'Break your fast gently', 'Start with dates and water, pray Maghrib, then eat your meal. This is kinder to your stomach.'],
  ['water', 'Spread your water', 'Sip through the night between iftar and sahur instead of drinking it all at once.'],
  ['fried', 'Go easy on fried and sugary food', 'Heavy, oily food makes you thirsty and sleepy the next day.'],
  ['sleep', 'Sleep enough', 'Short nights make fasting harder. If you work night shifts, a short nap before your shift helps.'],
  ['walk', 'Keep moving a little', 'A light walk after iftar helps digestion. Save hard exercise for after you have eaten.'],
  ['calendar', 'Make up your missed days early', 'Do not leave your make-up fasts until the last minute. Aishah said she could only make up her fasts in Syaaban (Bukhari and Muslim).'],
  ['heart', 'If you cannot fast for a long time', 'If you have a long-term illness, ask an ustaz about fidyah.'],
];

export default function Puasa() {
  const router = useRouter();
  const [p, setP] = useStored<PuasaData>('ml_puasa', PUASA_EMPTY);
  const [hd, setHd] = useStored<HData>('ml_habit', HEMPTY);
  const [tab, setTab] = useState(0);
  const [logAs, setLogAs] = useState<'s' | 'q'>('s'); const [wkOff, setWkOff] = useState(0);
  const [qIn, setQIn] = useState(''); const [qEd, setQEd] = useState(false); const [adj, setAdj] = useState(false);
  const today = new Date(); const tk = keyD(today); const off = p.off || 0;
  const st = ramadanState(p, today); const owed = qadhaOwed(p, today);
  const hj = hijriOf(today, off);
  const isRam = st.phase === 'during';

  const mark = (date: Date, kind: FKind | null) => {
    const k = keyD(date); const days = { ...(p.days || {}) };
    if (kind) days[k] = kind; else delete days[k];
    setP({ ...p, days });
    const hdays = { ...(hd.days || {}) };
    const old = hdays[k] || { mood: -1, cups: 0, sleep: 0, steps: 0 };
    hdays[k] = { ...old, fast: kind === 'r' || kind === 's' || kind === 'q' };
    setHd({ ...hd, days: hdays });
  };
  const at = (date: Date): FKind | undefined => { const k = keyD(date); return p.days[k] || (hd.days && hd.days[k] && hd.days[k].fast ? 's' : undefined); };
  const cycleRam = (date: Date) => { const v = p.days[keyD(date)]; mark(date, !v ? 'r' : v === 'r' ? 'x' : null); };
  const toggleLog = (date: Date) => { if (isHaram(date, off)) return; const v = p.days[keyD(date)]; mark(date, v === logAs ? null : logAs); };
  const saveQ = () => { const n = parseInt(qIn, 10); if (n >= 0 && n <= 999) { const done = Object.keys(p.days).filter((k) => p.days[k] === 'q').length; const logged = owed + done - (p.qBase || 0); setP({ ...p, qBase: Math.max(0, n + done - logged) }); } setQEd(false); setQIn(''); };
  const setRam = (y: number, patch: { start?: string; len?: number }) => setP({ ...p, start: patch.start ? { ...p.start, [String(y)]: patch.start } : p.start, len: patch.len ? { ...p.len, [String(y)]: patch.len } : p.len });

  const sunToday = sunatToday(today, off);
  const todayVal = at(today);
  const yr = sunatYear(p, today);

  // upcoming sunnah fasts: the next two Monday/Thursday fasts plus the next special days
  const upcoming: { d: Date; n: string; w: number }[] = [];
  { let reg = 0, spc = 0;
    for (let i = 1; i <= 150 && (reg < 2 || spc < 3); i++) {
      const d = addDays(today, i); if (isHaram(d, off)) continue;
      if (ramadanState(p, d).phase === 'during') continue;
      const lab = sunatToday(d, off); if (!lab) continue;
      const prev = sunatToday(addDays(d, -1), off);
      const regular = lab === 'Monday sunnah fast' || lab === 'Thursday sunnah fast';
      if (regular) { if (reg < 2) { upcoming.push({ d, n: lab, w: i }); reg++; } }
      else if (lab !== prev && spc < 3) { upcoming.push({ d, n: lab, w: i }); spc++; }
    }
    upcoming.sort((x, y) => x.w - y.w); }
  const advice = () => {
    if (st.phase === 'during') {
      const left = st.left, done = st.fasted;
      if (st.unmarked > 0) return { tone: 'warn', t: st.unmarked + (st.unmarked === 1 ? ' day is' : ' days are') + ' not marked yet', b: 'Tick the days you fasted. If you missed any, they will be added to your make-up when Ramadan ends.' };
      if (left <= 3 && done >= st.day - 1 - st.excused) return { tone: 'good', t: 'Almost there, only ' + (left + 1) + (left === 0 ? ' day' : ' days') + ' left', b: 'Finish strong. Keep your sahur, your prayers and your Quran reading steady until the last day.' };
      if (st.day > 20) return { tone: 'good', t: 'The last ten days', b: 'Look for Lailatul Qadr in the last ten nights, especially the odd nights. Give extra time to prayer, Quran and dua.' };
      if (st.day > 10) return { tone: 'good', t: 'You are past the first third', b: 'Keep your rhythm. Steady small deeds each day are better than big ones that you cannot keep.' };
      return { tone: 'good', t: 'A good start', b: 'Build your rhythm early. Sahur, enough water and enough sleep make the rest of the month easier.' };
    }
    return null;
  };
  const adv = advice();

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <IslamicBg />
      <PuasaSky />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Fasting" sub={hijriText(today, off)} />
        <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)', marginHorizontal: 20, marginTop: 14 }}>
          {['Ramadan', 'Sunnah', 'Tips'].map((n, i) => (
            <Pressable key={n} onPress={() => setTab(i)} style={{ flex: 1 }}>
              {tab === i ? <LinearGradient colors={['#34d399', '#5ee7df']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 8, borderRadius: 999, alignItems: 'center' }}><Text style={{ color: '#06281c', fontSize: 13, fontWeight: '800' }}>{n}</Text></LinearGradient>
                : <View style={{ paddingVertical: 8, alignItems: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{n}</Text></View>}
            </Pressable>
          ))}
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 50, gap: 12 }}>
          {tab === 0 && (<>
            {st.phase === 'during' ? (
              <Rise i={0}><Card art tint={['rgba(52,211,153,.32)', 'rgba(94,231,223,.14)']}>
                <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>RAMADAN {st.r.y}</Text>
                <Text style={{ color: W, fontSize: 26, fontWeight: '800', marginTop: 4 }}>Day {st.day} of {st.r.len}</Text>
                <View style={{ marginTop: 10 }}><FillBar p={(st.fasted / st.r.len) * 100} color={G} h={9} dep={st.fasted} /></View>
                <Text style={{ color: dim, fontSize: 12, marginTop: 6 }}>{st.fasted} {st.fasted === 1 ? 'day' : 'days'} fasted · {st.left} left after today</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <Btn t={st.todayDone === 'r' ? 'Fasting today ✓' : 'I am fasting today'} on={st.todayDone === 'r'} onPress={() => mark(today, st.todayDone === 'r' ? null : 'r')} style={{ flex: 1 }} />
                  <Btn t={st.todayDone === 'x' ? 'Excused ✓' : 'Excused'} on={st.todayDone === 'x'} c="#ffc46b" onPress={() => mark(today, st.todayDone === 'x' ? null : 'x')} />
                </View>
                <Text style={{ color: dim, fontSize: 11.5, marginTop: 8 }}>Excused is for days you cannot fast, such as illness, travel or monthly cycle. These days are made up later.</Text>
              </Card></Rise>
            ) : st.phase === 'before' ? (
              <Rise i={0}><Card art tint={['rgba(52,211,153,.32)', 'rgba(94,231,223,.14)']}>
                <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>NEXT RAMADAN</Text>
                <Text style={{ color: W, fontSize: 26, fontWeight: '800', marginTop: 4 }}>{st.daysTo} {st.daysTo === 1 ? 'day' : 'days'} to go</Text>
                <Text style={{ color: dim, fontSize: 12.5, marginTop: 4 }}>Ramadan {st.r.y} begins around {fdate(st.r.start)}. The date is a calendar estimate, so confirm it with the official announcement.</Text>
              </Card></Rise>
            ) : (
              <Rise i={0}><Card art tint={['rgba(52,211,153,.32)', 'rgba(94,231,223,.14)']}>
                <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>LAST RAMADAN {st.r.y}</Text>
                <Text style={{ color: W, fontSize: 26, fontWeight: '800', marginTop: 4 }}>{st.fasted} of {st.r.len} days</Text>
                <View style={{ marginTop: 10 }}><FillBar p={(st.fasted / st.r.len) * 100} color={G} h={9} dep={st.fasted} /></View>
                <Text style={{ color: dim, fontSize: 12, marginTop: 6 }}>Next Ramadan is in {st.daysTo} days.</Text>
              </Card></Rise>
            )}

            {adv ? (
              <Rise i={1}><Card tint={adv.tone === 'warn' ? ['rgba(255,196,107,.3)', 'rgba(255,143,171,.14)'] : ['rgba(124,156,255,.28)', 'rgba(52,211,153,.12)']}>
                <Text style={{ color: adv.tone === 'warn' ? '#ffd593' : '#bcd0ff', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }}>{adv.tone === 'warn' ? 'PLEASE CHECK' : 'KEEP GOING'}</Text>
                <Text style={{ color: W, fontSize: 15, fontWeight: '800', marginTop: 4 }}>{adv.t}</Text>
                <Text style={{ color: 'rgba(255,255,255,.82)', fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>{adv.b}</Text>
              </Card></Rise>
            ) : null}

            {st.phase === 'during' ? (
              <Rise i={2}><Card>
                <H t="Ramadan calendar" s="Tap a day: fasted, then excused, then clear. Past days and today only." />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
                  {Array.from({ length: st.r.len }).map((_, i) => {
                    const d = addDays(st.r.start, i); const v = p.days[keyD(d)]; const fut = diffDays(d, today) > 0; const isT = diffDays(d, today) === 0;
                    return (
                      <Pressable key={i} disabled={fut} onPress={() => cycleRam(d)} style={{ width: '12.2%', aspectRatio: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: v === 'r' ? G : v === 'x' ? '#ffc46b' : 'rgba(255,255,255,.1)', opacity: fut ? 0.35 : 1, borderWidth: isT ? 1.5 : 0, borderColor: '#fff' }}>
                        <Text style={{ color: v ? '#06281c' : W, fontSize: 12.5, fontWeight: '800' }}>{i + 1}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={{ flexDirection: 'row', gap: 14, marginTop: 10 }}>
                  {[[G, 'Fasted'], ['#ffc46b', 'Excused'], ['rgba(255,255,255,.2)', 'Not marked']].map(([c, t]) => <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c }} /><Text style={{ color: dim, fontSize: 11 }}>{t}</Text></View>)}
                </View>
              </Card></Rise>
            ) : null}

            {st.phase !== 'during' && (st.phase === 'before' ? st.fastedLast : st.fasted) < (st.phase === 'before' ? st.last.len : st.r.len) && (st.phase === 'before' ? st.fastedLast : st.fasted) > 0 ? (
              <Card tint={['rgba(255,196,107,.28)', 'rgba(255,143,171,.12)']}>
                <Text style={{ color: '#ffd593', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }}>MISSED DAYS</Text>
                <Text style={{ color: W, fontSize: 15, fontWeight: '800', marginTop: 4 }}>You fasted {st.phase === 'before' ? st.fastedLast : st.fasted} of {st.phase === 'before' ? st.last.len : st.r.len} days last Ramadan</Text>
                <Text style={{ color: 'rgba(255,255,255,.82)', fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>The missed days are in your make-up fasts count below. Start making them up soon, and try to finish before the next Ramadan.</Text>
              </Card>
            ) : null}

            <Card tint={owed > 0 ? ['rgba(255,143,171,.26)', 'rgba(255,196,107,.12)'] : undefined}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <H t="Make-up fasts (qadha)" s="Days of Ramadan you still owe" />
                <Text style={{ color: owed > 0 ? '#ffd593' : '#7df0c6', fontSize: 30, fontWeight: '800' }}>{owed}</Text>
              </View>
              {owed > 0 ? (
                <Text style={{ color: 'rgba(255,255,255,.82)', fontSize: 12.5, lineHeight: 18, marginTop: 8 }}>
                  {st.phase === 'before' ? (() => { const wks = Math.max(1, Math.floor(st.daysTo / 7)); const per = owed / wks; return 'Ramadan is ' + st.daysTo + ' days away. To finish in time, fast about ' + (per <= 1 ? 'once a week.' : Math.ceil(per) + ' days a week. That is a lot, so start now and use Mondays and Thursdays.'); })() : 'Try to make these up before the next Ramadan. Mondays and Thursdays are a good time. Tick them on the Sunnah tab and choose Make-up.'}
                </Text>
              ) : <Text style={{ color: dim, fontSize: 12.5, marginTop: 8 }}>You have no missed fasts to make up. Alhamdulillah.</Text>}
              {qEd ? (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
                  <Inp style={{ flex: 1 }} keyboardType="number-pad" value={qIn} onChangeText={setQIn} placeholder="Days you owe now" onSubmitEditing={saveQ} />
                  <Btn t="Save" on onPress={saveQ} />
                </View>
              ) : <Pressable onPress={() => { setQEd(true); setQIn(String(owed)); }}><Text style={{ color: '#8fe9e2', fontSize: 12, fontWeight: '700', marginTop: 10 }}>Set how many days you owe from before ✎</Text></Pressable>}
              {!isRam && owed > 0 ? <Btn t={todayVal === 'q' ? 'Make-up logged for today ✓' : 'I am making up a fast today'} on={todayVal === 'q'} style={{ marginTop: 10 }} onPress={() => { if (!isHaram(today, off)) mark(today, todayVal === 'q' ? null : 'q'); }} /> : null}
            </Card>

            <Card>
              <Pressable onPress={() => setAdj(!adj)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 10 }}><H t="Match the official date" s="Tap Adjust if the date is a day or two off" /></View>
                <View style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: adj ? 'rgba(255,255,255,.14)' : 'rgba(94,231,223,.2)', borderWidth: 1, borderColor: adj ? 'rgba(255,255,255,.25)' : 'rgba(94,231,223,.6)' }}><Text style={{ color: adj ? W : '#8fe9e2', fontSize: 12.5, fontWeight: '800' }}>{adj ? 'Close' : 'Adjust'}</Text></View>
              </Pressable>
              {adj ? (
                <View style={{ marginTop: 12, gap: 12 }}>
                  <View>
                    <Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>Hijri date correction: {off > 0 ? '+' : ''}{off} {Math.abs(off) === 1 ? 'day' : 'days'}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>{[-2, -1, 0, 1, 2].map((n) => <Btn key={n} t={(n > 0 ? '+' : '') + n} on={off === n} onPress={() => setP({ ...p, off: n, start: {}, })} style={{ flex: 1, paddingHorizontal: 0 }} />)}</View>
                  </View>
                  <View>
                    <Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>Ramadan {st.r.y} starts {fdate(st.r.start)} and lasts {st.r.len} days</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                      <Btn t="Start 1 day earlier" onPress={() => setRam(st.r.y, { start: keyD(addDays(st.r.start, -1)) })} style={{ flex: 1, paddingHorizontal: 4 }} />
                      <Btn t="Start 1 day later" onPress={() => setRam(st.r.y, { start: keyD(addDays(st.r.start, 1)) })} style={{ flex: 1, paddingHorizontal: 4 }} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <Btn t="29 days" on={st.r.len === 29} onPress={() => setRam(st.r.y, { len: 29 })} style={{ flex: 1 }} />
                      <Btn t="30 days" on={st.r.len === 30} onPress={() => setRam(st.r.y, { len: 30 })} style={{ flex: 1 }} />
                    </View>
                  </View>
                </View>
              ) : null}
            </Card>
          </>)}

          {tab === 1 && (<>
            <Rise i={0}><Card tint={['rgba(52,211,153,.28)', 'rgba(124,156,255,.14)']}>
              <View style={{ position: 'absolute', right: 6, top: -6 }} pointerEvents="none"><Bob><Lantern h={52} color="#ffc46b" /></Bob></View>
              <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>TODAY · {DAYN[today.getDay()].toUpperCase()}</Text>
              {isHaram(today, off) ? (
                <><Text style={{ color: W, fontSize: 18, fontWeight: '800', marginTop: 4 }}>Do not fast today</Text><Text style={{ color: dim, fontSize: 12.5, marginTop: 4 }}>Fasting is not allowed on the days of Eid and the three days after Eid al-Adha.</Text></>
              ) : isRam ? (
                <><Text style={{ color: W, fontSize: 18, fontWeight: '800', marginTop: 4 }}>It is Ramadan</Text><Text style={{ color: dim, fontSize: 12.5, marginTop: 4 }}>Mark your fast on the Ramadan tab.</Text></>
              ) : (
                <>
                  <Text style={{ color: W, fontSize: 18, fontWeight: '800', marginTop: 4 }}>{sunToday || 'No special fast today'}</Text>
                  <Text style={{ color: dim, fontSize: 12.5, marginTop: 4 }}>{sunToday ? 'A recommended day to fast.' : 'You can still fast any day for extra reward.'}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <Btn t={todayVal === 's' ? 'Sunnah ✓' : 'Fasting (sunnah)'} on={todayVal === 's'} style={{ flex: 1 }} onPress={() => mark(today, todayVal === 's' ? null : 's')} />
                    {owed > 0 ? <Btn t={todayVal === 'q' ? 'Make-up ✓' : 'Fasting (make-up)'} on={todayVal === 'q'} c="#ffc46b" style={{ flex: 1 }} onPress={() => mark(today, todayVal === 'q' ? null : 'q')} /> : null}
                  </View>
                </>
              )}
            </Card></Rise>

            <Rise i={1}><Card>
              <H t="Log past days" s="Tap a day to mark or clear it" />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <Btn t="Sunnah" on={logAs === 's'} onPress={() => setLogAs('s')} style={{ flex: 1 }} />
                <Btn t="Make-up" on={logAs === 'q'} c="#ffc46b" onPress={() => setLogAs('q')} style={{ flex: 1 }} />
              </View>
              {(() => {
                const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const dow = (today.getDay() + 6) % 7; const mon = addDays(today, -dow + wkOff * 7); const days = Array.from({ length: 7 }, (_, k) => addDays(mon, k));
                const a = days[0], z = days[6]; const label = a.getDate() + (a.getMonth() === z.getMonth() ? '' : ' ' + MN[a.getMonth()]) + ' – ' + z.getDate() + ' ' + MN[z.getMonth()] + (a.getFullYear() !== today.getFullYear() ? ' ' + z.getFullYear() : '');
                const nav = (t: string, on: boolean, f: () => void) => <Pressable disabled={!on} onPress={f} hitSlop={8} style={{ width: 38, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center', opacity: on ? 1 : 0.35 }}><Text style={{ color: W, fontSize: 18, fontWeight: '800', marginTop: -2 }}>{t}</Text></Pressable>;
                return (
                  <View style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      {nav('‹', wkOff > -52, () => setWkOff(wkOff - 1))}
                      <View style={{ alignItems: 'center' }}><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{label}</Text>{wkOff !== 0 ? <Pressable hitSlop={8} onPress={() => setWkOff(0)}><Text style={{ color: '#8fe9e2', fontSize: 11.5, fontWeight: '800', marginTop: 2 }}>Back to this week</Text></Pressable> : <Text style={{ color: dim, fontSize: 11.5, marginTop: 2 }}>This week</Text>}</View>
                      {nav('›', wkOff < 0, () => setWkOff(wkOff + 1))}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((n) => <Text key={n} style={{ flex: 1, textAlign: 'center', color: dim, fontSize: 10.5, fontWeight: '700' }}>{n}</Text>)}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 5 }}>
                      {days.map((d, k) => {
                        const v = at(d); const fut = d.getTime() > today.getTime() && keyD(d) !== keyD(today); const ram = ramadanState(p, d).phase === 'during'; const bad = isHaram(d, off);
                        const mt = d.getDay() === 1 || d.getDay() === 4; const blocked = fut || bad || ram; const isT = keyD(d) === keyD(today);
                        return (
                          <Pressable key={k} disabled={blocked} onPress={() => toggleLog(d)} style={{ flex: 1, aspectRatio: 0.8, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: isT ? '#fff' : 'transparent', backgroundColor: v === 's' ? G : v === 'q' ? '#ffc46b' : v === 'r' ? 'rgba(52,211,153,.5)' : mt ? 'rgba(52,211,153,.22)' : 'rgba(255,255,255,.1)', opacity: blocked ? 0.35 : 1 }}>
                            <Text style={{ color: v ? '#06281c' : W, fontSize: 15, fontWeight: '800', textAlign: 'center' }}>{d.getDate()}</Text>
                            {v ? <Text style={{ color: '#06281c', fontSize: 11, fontWeight: '900', marginTop: 2 }}>✓</Text> : null}
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={{ marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,.2)', gap: 5 }}>
                      <Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>How to use this</Text>
                      <Text style={{ color: dim, fontSize: 12, lineHeight: 17 }}>1. Choose Sunnah or Make-up above.</Text>
                      <Text style={{ color: dim, fontSize: 12, lineHeight: 17 }}>2. Tap a day you fasted. It turns solid green (Sunnah) or orange (Make-up) with a tick.</Text>
                      <Text style={{ color: dim, fontSize: 12, lineHeight: 17 }}>3. Tap it again to clear it.</Text>
                      <Text style={{ color: dim, fontSize: 12, lineHeight: 17 }}>4. Use the arrows to go to earlier weeks.</Text>
                      <Text style={{ color: dim, fontSize: 12, lineHeight: 17, marginTop: 3 }}>Light green is Monday or Thursday, the recommended days. Faded days are Eid, Ramadan or still to come.</Text>
                    </View>
                  </View>
                );
              })()}
            </Card></Rise>

            <Rise i={2}><Card>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}><H t="Your year" s="Last 12 months" /></View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <Stat l="Sunnah fasts" v={String(yr.total)} c="#7df0c6" />
                <Stat l="Make-up fasts" v={String(yr.qadha)} c="#ffd593" />
              </View>
              {Object.keys(yr.by).length ? (
                <View style={{ gap: 10, marginTop: 14 }}>
                  {Object.keys(yr.by).sort((a, b) => yr.by[b] - yr.by[a]).map((k, i) => (
                    <View key={k}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}><Text style={{ color: W, fontSize: 12.5 }}>{k}</Text><Text style={{ color: dim, fontSize: 12 }}>{yr.by[k]}</Text></View>
                      <FillBar p={(yr.by[k] / Math.max(...Object.values(yr.by))) * 100} color={G} delay={i * 70} dep={yr.total} />
                    </View>
                  ))}
                </View>
              ) : <Text style={{ color: dim, fontSize: 12.5, lineHeight: 18, marginTop: 10 }}>Log your sunnah fasts and they will be counted here by type: Monday and Thursday, White Days (13th to 15th of the Hijri month), Arafah, Asyura and Syawal.</Text>}
              <FastMonths months={yr.months} now={today} color={G} />
            </Card></Rise>

            {upcoming.length ? (
              <Card>
                <H t="Coming up" s="The next sunnah fasts" />
                <View style={{ gap: 10, marginTop: 10 }}>
                  {upcoming.map((u) => (
                    <View key={u.n + u.w} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(52,211,153,.3)', alignItems: 'center', justifyContent: 'center' }}><Ic n="moon" size={20} /></View>
                      <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 13.5, fontWeight: '700' }}>{u.n.replace(' (13th to 15th of the Hijri month)', '')}</Text><Text style={{ color: dim, fontSize: 11.5, marginTop: 4 }}>{fdate(u.d)} · {hijriText(u.d, off)}</Text></View>
                      <Text style={{ color: '#8fe9e2', fontSize: 12, fontWeight: '800' }}>{u.w === 1 ? 'Tomorrow' : 'In ' + u.w + ' days'}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}
          </>)}

          {tab === 2 && (<>
            <Rise i={0}><Card tint={['rgba(52,211,153,.26)', 'rgba(124,156,255,.12)']}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><H t="Why fasting is good" s="From the Quran" /><Bob><Crescent size={54} /></Bob></View>
              {VERSES.map((v) => (
                <View key={v.ref} style={{ marginTop: 14 }}>
                  <Text style={{ color: W, fontSize: 22, fontFamily: QURAN_FONT, lineHeight: 44, textAlign: 'right', writingDirection: 'rtl' as any }}>{v.ar}</Text>
                  <Text style={{ color: 'rgba(255,255,255,.9)', fontSize: 13, lineHeight: 20, marginTop: 8 }}>{v.ms}</Text>
                  <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, lineHeight: 19, marginTop: 6, fontStyle: 'italic' }}>{v.en}</Text>
                  <Text style={{ color: '#8fe9e2', fontSize: 11.5, fontWeight: '700', marginTop: 4 }}>{v.ref}</Text>
                </View>
              ))}
            </Card></Rise>
            <Rise i={1}><Card>
              <H t="From the hadith" s="Reminders about the reward of fasting" />
              <View style={{ gap: 12, marginTop: 12 }}>
                {HADITH.map(([t, s, m]) => (
                  <View key={t} style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ width: 4, borderRadius: 2, backgroundColor: G }} />
                    <View style={{ flex: 1 }}><Text style={{ color: 'rgba(255,255,255,.92)', fontSize: 13, lineHeight: 20 }}>{t}</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, lineHeight: 19, marginTop: 5, fontStyle: 'italic' }}>{m}</Text><Text style={{ color: '#8fe9e2', fontSize: 11.5, marginTop: 5, fontWeight: '700' }}>{s}</Text></View>
                  </View>
                ))}
              </View>
            </Card></Rise>
            <Rise i={2}><Card>
              <H t="Tips for a good fast" />
              <View style={{ gap: 12, marginTop: 12 }}>
                {TIPS.map(([ic, t, b], i) => <Rise key={t} i={i}><View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}><View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: ['rgba(255,196,107,.3)', 'rgba(255,143,171,.28)', 'rgba(94,231,223,.3)', 'rgba(255,196,107,.3)', 'rgba(124,156,255,.32)', 'rgba(94,231,181,.3)', 'rgba(183,148,255,.3)', 'rgba(255,143,171,.28)'][i % 8], alignItems: 'center', justifyContent: 'center' }}><TipIcon n={ic} size={34} /></View><View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 13.5, fontWeight: '700' }}>{t}</Text><Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>{b}</Text></View></View></Rise>)}
              </View>
              <Pressable onPress={() => router.push('/habit' as any)}><Text style={{ color: '#8fe9e2', fontSize: 12.5, fontWeight: '700', marginTop: 14 }}>Your water goal is {cupsGoal(hd)} glasses. Track it in Habit & Health ›</Text></Pressable>
            </Card></Rise>
            <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, lineHeight: 16, marginHorizontal: 4 }}>Dates come from a calendar calculation and may differ from the official announcement. For rulings about your own situation, please ask an ustaz.</Text>
          </>)}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
