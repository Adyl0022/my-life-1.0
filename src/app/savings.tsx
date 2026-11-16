import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Glass } from '../components/Glass';
import { Blob } from '../components/Bg';
import { Inp, DateField, todayStr, W } from '../components/Ui';
import { useStored } from '../lib/store';
import { TOP } from '../lib/layout';
import { useReveal } from '../lib/keyboard';
import { DEBT_EMPTY, DebtData } from '../lib/debts';
import { SAV_EMPTY, SavData, Goal, KINDS, kindOf, goalLines, goalSaved, perMonth, monthsUntil } from '../lib/savings';
import { cs, cu, useRegion } from '../lib/region';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ICON: Record<string, string> = { motor: '🏍️', car: '🚗', house: '🏠', wedding: '💍', travel: '✈️', hajj: '🕋', emergency: '🛟', medical: '🩺', other: '⭐' };
const money = (n: number) => n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rnd = (n: number) => Math.round(n).toLocaleString('en-MY');
const dimC = 'rgba(255,255,255,.65)';
const WARM = ['#5ee7b5', '#7c9cff'] as [string, string];
const nice = (v: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? Number(m[3]) + ' ' + MON[Number(m[2]) - 1] + ' ' + m[1] : ''; };
const num = (s: string) => parseFloat((s || '').replace(',', '.'));

const Btn = ({ t, onPress, c, dark }: { t: string; onPress: () => void; c?: string; dark?: boolean }) => (
  <Pressable onPress={onPress} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: c || 'rgba(255,255,255,.12)' }}>
    <Text style={{ color: dark ? '#0c2a28' : W, fontSize: 12.5, fontWeight: '800' }}>{t}</Text>
  </Pressable>
);
const Chip = ({ t, on, c, onPress }: { t: string; on: boolean; c?: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={{ paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1, borderColor: on ? 'transparent' : 'rgba(255,255,255,.2)', backgroundColor: on ? (c || '#5ee7b5') : 'rgba(255,255,255,.08)' }}>
    <Text style={{ color: on ? '#0c2a28' : W, fontSize: 12, fontWeight: '700' }}>{t}</Text>
  </Pressable>
);
const Lbl = ({ t }: { t: string }) => <Text style={{ color: dimC, fontSize: 11.5, marginTop: 2 }}>{t}</Text>;

export default function Savings() {
  useRegion();
  const router = useRouter(); const { kb, ref: sref, onScroll: sScroll, reveal } = useReveal();
  const [sv, setSv] = useStored<SavData>('ml_savings', SAV_EMPTY);
  const [fin, setFin] = useStored<any>('ml_finance', { inc: {}, cnt: {}, spends: [], nextId: 1 });
  const [debts, setDebts] = useStored<DebtData>('ml_debts', DEBT_EMPTY);
  const spends = (fin && fin.spends) || [];
  const goals = sv.goals || [];

  // new goal form
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState('motor'); const [name, setName] = useState('Motorcycle');
  const [target, setTarget] = useState(''); const [place, setPlace] = useState(''); const [start, setStart] = useState(''); const [due, setDue] = useState('');
  const [msg, setMsg] = useState('');
  // per goal panel: which goal is open and in what mode
  const [open, setOpen] = useState(0); const [mode, setMode] = useState<'' | 'add' | 'out' | 'hist' | 'edit' | 'del'>('');
  const [amt, setAmt] = useState(''); const [note, setNote] = useState(''); const [dt, setDt] = useState(todayStr());
  const [eName, setEName] = useState(''); const [ePlace, setEPlace] = useState(''); const [eTarget, setETarget] = useState(''); const [eDue, setEDue] = useState('');
  const [ok, setOk] = useState('');

  const saved = (g: Goal) => goalSaved(g, spends, debts);
  const totS = goals.reduce((a, g) => a + saved(g), 0); const totT = goals.reduce((a, g) => a + g.target, 0);
  const totP = totT > 0 ? Math.min(100, Math.round((totS / totT) * 100)) : 0;

  const pickKind = (k: string) => { const prev = kindOf(kind); setKind(k); if (!name.trim() || name === prev.name) setName(kindOf(k).name); };
  const create = () => {
    const t = num(target); const st = num(start) > 0 ? num(start) : 0;
    if (!name.trim() || !(t > 0)) { setMsg('Give the goal a name and a target amount.'); return; }
    const g: Goal = { id: sv.nextId, name: name.trim(), kind, target: t, place: place.trim(), due, start: st, out: [], made: todayStr() };
    setSv({ goals: [...goals, g], nextId: sv.nextId + 1 });
    setAdding(false); setMsg(''); setTarget(''); setPlace(''); setStart(''); setDue(''); setOpen(g.id); setMode('');
  };
  const openMode = (g: Goal, m: typeof mode) => { setOk(''); if (open === g.id && mode === m) { setMode(''); return; } setOpen(g.id); setMode(m); setAmt(''); setNote(''); setDt(todayStr()); if (m === 'edit') { setEName(g.name); setEPlace(g.place); setETarget(String(g.target)); setEDue(g.due); } };
  const addMoney = (g: Goal) => {
    const n = num(amt); if (!(n > 0)) return;
    const id = (fin && fin.nextId) || 1;
    setFin({ ...fin, spends: [{ id, name: note.trim() || g.name, cat: 'Savings', amt: n, date: dt || todayStr(), goal: g.id }, ...spends], nextId: id + 1 });
    setAmt(''); setNote(''); setMode(''); setOk(cs() + money(n) + ' added to ' + g.name + '. It is also in your Spending Tracker and Money Left.');
  };
  const withdraw = (g: Goal) => {
    const n = num(amt); if (!(n > 0)) return; const s = saved(g);
    const take = Math.min(n, s);
    setSv({ ...sv, goals: goals.map((x) => (x.id === g.id ? { ...x, out: [...(x.out || []), { id: Date.now(), amt: take, date: dt || todayStr(), note: note.trim() }] } : x)) });
    setAmt(''); setNote(''); setMode(''); setOk('Took ' + cs() + money(take) + ' out of ' + g.name + '.');
  };
  const saveEdit = (g: Goal) => {
    const t = num(eTarget); if (!eName.trim() || !(t > 0)) return;
    setSv({ ...sv, goals: goals.map((x) => (x.id === g.id ? { ...x, name: eName.trim(), place: ePlace.trim(), target: t, due: eDue } : x)) });
    setMode(''); setOk('Saved.');
  };
  const del = (g: Goal) => {
    setSv({ ...sv, goals: goals.filter((x) => x.id !== g.id) });
    setDebts({ ...debts, debts: (debts.debts || []).map((x: any) => (x.goal === g.id ? { ...x, goal: undefined } : x)) });
    setFin({ ...fin, spends: spends.map((p: any) => (p.goal === g.id ? { ...p, goal: undefined } : p)) });
    setOpen(0); setMode('');
  };
  const rmLine = (g: Goal, l: ReturnType<typeof goalLines>[number]) => {
    if (l.src === 'tracker' && l.spId) setFin({ ...fin, spends: spends.filter((p: any) => p.id !== l.spId) });
    else if (l.src === 'out' && l.outId) setSv({ ...sv, goals: goals.map((x) => (x.id === g.id ? { ...x, out: (x.out || []).filter((o) => o.id !== l.outId) } : x)) });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0d1e2e' }}>
      <LinearGradient colors={['#0d1e2e', '#12303a', '#1b2b4a']} locations={[0, 0.5, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(94,231,181,.3)" style={{ right: -100, top: -40 }} />
      <Blob size={340} color="rgba(124,156,255,.28)" style={{ left: -120, bottom: 0 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView ref={sref} onScroll={sScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 70 + kb }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
            <Text style={{ flex: 1, color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Savings Goals</Text>
            <Pressable onPress={() => { setAdding(!adding); setMsg(''); }}><LinearGradient colors={WARM} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999 }}><Text style={{ color: '#0c2a28', fontSize: 13, fontWeight: '800' }}>{adding ? 'Close' : '+ New goal'}</Text></LinearGradient></Pressable>
          </View>

          <Glass radius={26} style={{ marginTop: 14, paddingVertical: 14, paddingHorizontal: 16 }}>
            <LinearGradient colors={['rgba(94,231,181,.3)', 'rgba(124,156,255,.16)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
            <Text style={{ color: '#bff5df', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>TOTAL SAVED</Text>
            <Text style={{ color: W, fontSize: 30, fontWeight: '800', marginTop: 3, letterSpacing: -0.5 }}>{cs()}{money(totS)}</Text>
            <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12.5, marginTop: 2 }}>{goals.length === 0 ? 'No goals yet. Tap New goal to start your first one.' : 'across ' + goals.length + (goals.length === 1 ? ' goal' : ' goals') + (totT > 0 ? ' · target ' + cs() + rnd(totT) + ' · ' + totP + '%' : '')}</Text>
            {goals.length > 0 ? <View style={{ marginTop: 10, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.14)', overflow: 'hidden' }}><View style={{ width: totP + '%', height: '100%', borderRadius: 4, backgroundColor: '#5ee7b5' }} /></View> : null}
          </Glass>

          {adding ? (
            <Glass radius={24} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
              <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>New savings goal</Text>
              <Lbl t="What are you saving for?" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {KINDS.map((k) => <Chip key={k.k} t={ICON[k.k] + ' ' + k.label} on={kind === k.k} c={k.color} onPress={() => pickKind(k.k)} />)}
              </View>
              <Inp onFocus={reveal} style={{ marginTop: 10 }} value={name} onChangeText={setName} placeholder="Name your goal, for example Wedding fund" />
              <Inp onFocus={reveal} style={{ marginTop: 8 }} keyboardType="decimal-pad" value={target} onChangeText={setTarget} placeholder={'Target (' + cu() + ')'} />
              <Inp onFocus={reveal} style={{ marginTop: 8 }} value={place} onChangeText={setPlace} placeholder="Kept in, e.g. Maybank" />
              <Inp onFocus={reveal} style={{ marginTop: 8 }} keyboardType="decimal-pad" value={start} onChangeText={setStart} placeholder={'Already saved (' + cu() + '), optional'} />
              <Text style={{ color: dimC, fontSize: 11.5, marginTop: 10 }}>Target date (optional)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <View style={{ flex: 1 }}><DateField value={due || todayStr()} onChange={setDue} /></View>
                {due ? <Pressable onPress={() => setDue('')} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: W, fontSize: 12, fontWeight: '700' }}>No date</Text></Pressable> : null}
              </View>
              {!due ? <Text style={{ color: dimC, fontSize: 11, marginTop: 4 }}>No date set. Pick one if you want to know how much to save each month.</Text> : null}
              {msg ? <Text style={{ color: '#ffb3a0', fontSize: 12, marginTop: 8 }}>{msg}</Text> : null}
              <Pressable onPress={create} style={{ marginTop: 12 }}><LinearGradient colors={WARM} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#0c2a28', fontSize: 14, fontWeight: '800' }}>Create goal</Text></LinearGradient></Pressable>
            </Glass>
          ) : null}

          {ok ? <Text style={{ color: '#8fe9e2', fontSize: 12.5, marginTop: 12, textAlign: 'center' }}>{ok}</Text> : null}

          {goals.map((g) => {
            const k = kindOf(g.kind); const s = saved(g); const left = Math.max(0, g.target - s); const pct = g.target > 0 ? Math.min(100, Math.round((s / g.target) * 100)) : 0;
            const noT = !(g.target > 0); const done = !noT && s >= g.target; const pm = perMonth(g, s); const mu = g.due ? monthsUntil(g.due) : null;
            const isOpen = open === g.id; const lines = isOpen && mode === 'hist' ? goalLines(g, spends, debts) : [];
            const linked = (debts.debts || []).filter((x: any) => x.goal === g.id);
            return (
              <Glass key={g.id} radius={24} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
                <LinearGradient colors={[k.color + '33', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: k.color + '40', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 22 }}>{ICON[g.kind] || '⭐'}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: W, fontSize: 16, fontWeight: '800' }} numberOfLines={2}>{g.name}</Text>
                    <Text style={{ color: dimC, fontSize: 12, marginTop: 1 }}>{g.place ? 'Kept in ' + g.place : 'No place set'}{g.due ? ' · by ' + nice(g.due) : ''}</Text>
                  </View>
                  {noT ? null : done ? <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#5ee7b5' }}><Text style={{ color: '#0c2a28', fontSize: 11, fontWeight: '800' }}>Reached</Text></View> : <Text style={{ color: k.color, fontSize: 16, fontWeight: '800' }}>{pct}%</Text>}
                </View>
                <View style={{ marginTop: 12, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,.14)', overflow: 'hidden' }}><View style={{ width: pct + '%', height: '100%', borderRadius: 5, backgroundColor: done ? '#5ee7b5' : k.color }} /></View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>{cs()}{money(s)}</Text>
                  <Text style={{ color: dimC, fontSize: 13 }}>{noT ? 'No target yet' : 'of ' + cs() + money(g.target)}</Text>
                </View>
                <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12.5, marginTop: 4 }}>
                  {noT ? 'Tap Edit and set a target amount to see your progress.' : done ? 'You have reached this goal. Well done.' : cs() + money(left) + ' to go' + (pm ? ' · save about ' + cs() + rnd(pm) + ' a month to finish by ' + nice(g.due) : mu !== null && mu < 0 ? ' · the target date has passed' : '')}
                </Text>
                {linked.length > 0 ? <Text style={{ color: '#bff5df', fontSize: 11.5, marginTop: 4 }}>{'Monthly commitment linked: ' + linked.map((x: any) => x.name + ' ' + cs() + rnd(x.monthly)).join(', ')}</Text> : null}

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  <Btn t="+ Add money" c="#5ee7b5" dark onPress={() => openMode(g, 'add')} />
                  <Btn t="Take out" onPress={() => openMode(g, 'out')} />
                  <Btn t={isOpen && mode === 'hist' ? 'Hide history' : 'History'} onPress={() => openMode(g, 'hist')} />
                  <Btn t="Edit" onPress={() => openMode(g, 'edit')} />
                </View>

                {isOpen && (mode === 'add' || mode === 'out') ? (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    <Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{mode === 'add' ? 'Add money to this goal' : 'Take money out of this goal'}</Text>
                    <Inp onFocus={reveal} autoFocus keyboardType="decimal-pad" value={amt} onChangeText={setAmt} placeholder={'Amount (' + cu() + ')'} onSubmitEditing={() => (mode === 'add' ? addMoney(g) : withdraw(g))} />
                    <Inp onFocus={reveal} value={note} onChangeText={setNote} placeholder={mode === 'add' ? 'Note (optional), e.g. March saving' : 'Why? (optional)'} />
                    <DateField value={dt} onChange={setDt} />
                    <Lbl t={mode === 'add' ? 'This is saved in your Spending Tracker under Savings, so Money Left counts it too.' : 'This lowers the goal only. Add the money back to your spending or income if you need to track it.'} />
                    <Pressable onPress={() => (mode === 'add' ? addMoney(g) : withdraw(g))}><LinearGradient colors={WARM} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#0c2a28', fontSize: 13, fontWeight: '800' }}>{mode === 'add' ? 'Add' : 'Take out'}</Text></LinearGradient></Pressable>
                  </View>
                ) : null}

                {isOpen && mode === 'edit' ? (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    <Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>Edit goal</Text>
                    <Inp onFocus={reveal} value={eName} onChangeText={setEName} placeholder="Goal name" />
                    <Inp onFocus={reveal} value={ePlace} onChangeText={setEPlace} placeholder="Kept in, e.g. Maybank" />
                    <Inp onFocus={reveal} keyboardType="decimal-pad" value={eTarget} onChangeText={setETarget} placeholder={'Target (' + cu() + ')'} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ flex: 1 }}><DateField value={eDue || todayStr()} onChange={setEDue} /></View>
                      {eDue ? <Pressable onPress={() => setEDue('')} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: W, fontSize: 12, fontWeight: '700' }}>No date</Text></Pressable> : null}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable style={{ flex: 1 }} onPress={() => saveEdit(g)}><LinearGradient colors={WARM} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#0c2a28', fontSize: 13, fontWeight: '800' }}>Save changes</Text></LinearGradient></Pressable>
                      <Pressable onPress={() => setMode('del')} style={{ paddingHorizontal: 16, height: 42, borderRadius: 999, backgroundColor: 'rgba(255,122,138,.2)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ff9aa9', fontSize: 13, fontWeight: '800' }}>Delete</Text></Pressable>
                    </View>
                  </View>
                ) : null}

                {isOpen && mode === 'del' ? (
                  <View style={{ marginTop: 12, borderRadius: 16, padding: 12, backgroundColor: 'rgba(255,122,138,.15)' }}>
                    <Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>Delete "{g.name}"?</Text>
                    <Text style={{ color: dimC, fontSize: 12, marginTop: 4, lineHeight: 17 }}>The goal is removed. Your savings entries stay in the Spending Tracker, so Money Left does not change.</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <Btn t="Yes, delete" c="#ff7a8a" dark onPress={() => del(g)} />
                      <Btn t="Keep it" onPress={() => setMode('')} />
                    </View>
                  </View>
                ) : null}

                {isOpen && mode === 'hist' ? (
                  <View style={{ marginTop: 10 }}>
                    {lines.length === 0 ? <Text style={{ color: dimC, fontSize: 12, marginTop: 4 }}>Nothing saved yet. Tap Add money, or choose Savings in the Spending Tracker.</Text> : null}
                    {lines.map((l, i) => (
                      <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: 'rgba(255,255,255,.1)' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: W, fontSize: 13.5, fontWeight: '600' }} numberOfLines={1}>{l.note}</Text>
                          <Text style={{ color: dimC, fontSize: 11 }}>{(l.date ? nice(l.date.length === 7 ? l.date + '-01' : l.date) + ' · ' : '') + (l.src === 'tracker' ? 'Spending Tracker' : l.src === 'commit' ? 'Monthly commitment' : l.src === 'out' ? 'Taken out' : 'Opening amount')}</Text>
                        </View>
                        <Text style={{ color: l.amt < 0 ? '#ff9aa9' : '#7df0c6', fontSize: 13.5, fontWeight: '800' }}>{(l.amt < 0 ? '- ' : '+ ') + cs() + money(Math.abs(l.amt))}</Text>
                        {l.src === 'tracker' || l.src === 'out' ? <Pressable accessibilityLabel="Delete" onPress={() => rmLine(g, l)} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ff9aa9', fontSize: 13 }}>✕</Text></Pressable> : <View style={{ width: 32 }} />}
                      </View>
                    ))}
                  </View>
                ) : null}
              </Glass>
            );
          })}

          {goals.length > 0 ? (
            <Glass radius={22} style={{ marginTop: 12, paddingVertical: 12, paddingHorizontal: 16 }}>
              <Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>How it stays in sync</Text>
              <Text style={{ color: dimC, fontSize: 12, lineHeight: 18, marginTop: 4 }}>In My Finance, pick the Savings category in the Spending Tracker and choose a goal. The money lands here and in Money Left automatically.</Text>
            </Glass>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
