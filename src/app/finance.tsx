import { SAV_EMPTY, SavData, goalSaved, kindOf } from '../lib/savings';
import { DEBT_EMPTY, DebtData } from '../lib/debts';
import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Ellipse, G, Path, Pattern, Rect, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Glass } from '../components/Glass';
import { Blob } from '../components/Bg';
import { Inp, DateField, todayStr, W } from '../components/Ui';
import { useStored } from '../lib/store';
import { Commitments } from '../components/Commitments';
import { MoneyLeft } from '../components/MoneyLeft';
import { TOP } from '../lib/layout';
import { cs, cu, useRegion } from '../lib/region';

type Sp = { id: number; name: string; cat: string; amt: number; date: string; goal?: number };
type Data = { inc: Record<string, Record<string, number>>; cnt: Record<string, Record<string, number>>; spends: Sp[]; nextId: number; limits?: Record<string, number> };
const EMPTY: Data = { inc: {}, cnt: {}, spends: [], nextId: 1 };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEFS: [string, string, string][] = [['salary', 'Basic salary', '#7c9cff'], ['overtime', 'Overtime', '#ffc46b'], ['claim', 'Claim', '#8fe9e2'], ['sunday', 'Sunday work', '#b794ff'], ['holiday', 'Public holiday work', '#ff8fab'], ['other', 'Other', '#5ee7b5']];
const UN: Record<string, [string, string, string]> = { sunday: ['Days', 'day', 'Number of days worked'], holiday: ['Days', 'day', 'Number of days worked'], overtime: ['Hours', 'hour', 'Number of overtime hours'] };
const CATS: [string, string][] = [['Food', '#ffc46b'], ['Petrol', '#7c9cff'], ['Bills', '#ff8fab'], ['Shopping', '#b794ff'], ['Savings', '#5ee7b5'], ['Health', '#ff8fab'], ['Other', '#8fe9e2']];
const money = (n: number) => n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rnd = (n: number) => Math.round(n).toLocaleString('en-MY');
const keyOf = (y: number, m: number) => y + '-' + String(m + 1).padStart(2, '0');
const colorOf = (n: string) => (CATS.find((c) => c[0] === n) || CATS[CATS.length - 1])[1];
const WARM = ['#ffc46b', '#ff8fab'] as [string, string];

const FinArt = () => (
  <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
    <Defs><Pattern id="fgrid" width="44" height="44" patternUnits="userSpaceOnUse"><Circle cx="22" cy="22" r="14" fill="none" stroke="#fff" strokeWidth=".8" opacity=".08" /><Circle cx="22" cy="22" r="8" fill="none" stroke="#fff" strokeWidth=".8" opacity=".08" /></Pattern></Defs>
    <Rect width="390" height="844" fill="url(#fgrid)" />
    <G fill="#ffc46b" opacity=".15"><Path d="M0 844V760l30-10 30 14 30-30 30 16 30-34 30 20 30-40 30 18 30-36 30 22 30-30 30 14 30-20V844z" /></G>
    <G stroke="#fff" opacity=".35" strokeWidth="1.5" strokeLinecap="round"><Path d="M358 90v10M353 95h10M30 640v8M26 644h8" /></G>
  </Svg>
);
const Coin = () => (
  <Svg width={44} height={44} viewBox="0 0 44 44">
    <Ellipse cx="22" cy="34" rx="15" ry="5" fill="#d98f1f" /><Rect x="7" y="26" width="30" height="8" fill="#f4b13d" /><Ellipse cx="22" cy="26" rx="15" ry="5" fill="#ffd27a" />
    <Ellipse cx="22" cy="19" rx="15" ry="5" fill="#d98f1f" /><Rect x="7" y="12" width="30" height="7" fill="#f4b13d" /><Ellipse cx="22" cy="12" rx="15" ry="5" fill="#ffe3a0" />
    <SvgText x="22" y="15" textAnchor="middle" fontSize="7" fontWeight="800" fill="#a86a00">{cu().slice(0, 3)}</SvgText>
  </Svg>
);
const Chip = ({ t, on, c, onPress }: { t: string; on: boolean; c?: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={{ paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1, borderColor: on ? (c || 'transparent') : 'rgba(255,255,255,.2)', backgroundColor: on ? (c || '#ffc46b') : 'rgba(255,255,255,.08)' }}>
    <Text style={{ color: on ? '#2a1030' : W, fontSize: 12, fontWeight: '700' }}>{t}</Text>
  </Pressable>
);
const Stat = ({ l, v, bg, vc }: { l: string; v: string; bg?: string; vc?: string }) => (
  <View style={{ flex: 1, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: bg || 'rgba(255,255,255,.08)' }}>
    <Text style={{ color: 'rgba(255,255,255,.68)', fontSize: 10.5 }}>{l}</Text><Text style={{ color: vc || W, fontSize: 14.5, fontWeight: '800', marginTop: 2 }}>{v}</Text>
  </View>
);

export default function Finance() {
  useRegion();
  const router = useRouter();
  const [d, setD] = useStored<Data>('ml_finance', EMPTY);
  const now = new Date(); const curY = now.getFullYear(); const curKey = keyOf(curY, now.getMonth());
  const [ym, setYm] = useState(curKey);
  const [editKey, setEditKey] = useState(''); const [editUnit, setEditUnit] = useState<'rm' | 'cnt'>('rm'); const [editVal, setEditVal] = useState('');
  const [limKey, setLimKey] = useState(''); const [limVal, setLimVal] = useState('');
  const [fDate, setFDate] = useState(todayStr()); const [fName, setFName] = useState(''); const [fAmt, setFAmt] = useState(''); const [fCat, setFCat] = useState('Food'); const [fGoal, setFGoal] = useState(0); const [fPre, setFPre] = useState('');
  const [sav, setSav] = useStored<SavData>('ml_savings', SAV_EMPTY); const [dbt] = useStored<DebtData>('ml_debts', DEBT_EMPTY);

  const selY = parseInt(ym.slice(0, 4), 10), selM = parseInt(ym.slice(5, 7), 10) - 1;
  const sumOf = (o?: Record<string, number>) => DEFS.reduce((a, x) => a + ((o || {})[x[0]] || 0), 0);
  const incM = d.inc[ym] || {}; const cntM = d.cnt[ym] || {}; const total = sumOf(incM);
  const pickYm = (k: string) => { setYm(k); setEditKey(''); setEditVal(''); };
  const goYear = (dy: number) => { const ny = Math.min(curY, Math.max(2024, selY + dy)); let k = keyOf(ny, selM); if (k > curKey) k = curKey; pickYm(k); };
  const open = (k: string, u: 'rm' | 'cnt') => { const n = ((u === 'cnt' ? d.cnt : d.inc)[ym] || {})[k] || 0; setEditKey(k); setEditUnit(u); setEditVal(n > 0 ? String(n) : ''); };
  const saveLine = (k: string) => {
    const n = parseFloat(editVal.replace(',', '.')); const un = UN[k]; const store = editUnit === 'cnt' && un ? 'cnt' : 'inc';
    const all = { ...d[store] }; all[ym] = { ...all[ym], [k]: n > 0 ? n : 0 };
    setD({ ...d, [store]: all }); setEditKey(''); setEditVal('');
  };
  const spendIn = (key: string) => d.spends.filter((p) => p.cat !== 'Savings' && (p.date || '').slice(0, 7) === key).reduce((a, p) => a + p.amt, 0);
  const gk = (back: number) => { const x = new Date(curY, now.getMonth() - back, 1); return { key: keyOf(x.getFullYear(), x.getMonth()), label: MON[x.getMonth()] }; };
  const gm = [5, 4, 3, 2, 1, 0].map((b) => { const k = gk(b); return { key: k.key, label: k.label, v: spendIn(k.key), prev: spendIn(gk(b + 1).key) }; });
  const gMax = Math.max(...gm.map((x) => x.v), 1);
  const gc = gm[5].v, gp = gm[4].v, gd = gc - gp; const gPct = gp > 0 ? Math.round(Math.abs(gd) / gp * 100) : 0;
  const spent = d.spends.filter((p) => p.cat !== 'Savings').reduce((a, p) => a + p.amt, 0);
  const monthSpent = d.spends.filter((p) => p.cat !== 'Savings' && (p.date || '').slice(0, 7) === ym).reduce((a, p) => a + p.amt, 0);
  const tr = [5, 4, 3, 2, 1, 0].map((b) => { const k = gk(b); return { key: k.key, label: k.label, t: sumOf(d.inc[k.key]) }; });
  const maxT = Math.max(...tr.map((x) => x.t), 1);
  const saveLimit = (k: string) => {
    const n = parseFloat(limVal.replace(',', '.')); const lm = { ...(d.limits || {}) };
    if (n > 0) lm[k] = n; else delete lm[k];
    setD({ ...d, limits: lm }); setLimKey(''); setLimVal('');
  };
  // Goal choices for the Savings category: ready-made goals first, your own in the middle, Wedding last.
  const PRE = ['motor', 'car', 'house', 'emergency', 'medical', 'travel', 'hajj', 'other'];
  const opts: { key: string; id: number; name: string; kind: string }[] = [];
  PRE.forEach((k) => { const ex = sav.goals.filter((g) => g.kind === k); if (ex.length) ex.forEach((g) => opts.push({ key: 'g' + g.id, id: g.id, name: g.name, kind: k })); else opts.push({ key: 'p' + k, id: 0, name: kindOf(k).name || 'Other', kind: k }); });
  sav.goals.filter((g) => PRE.indexOf(g.kind) < 0 && g.kind !== 'wedding').forEach((g) => opts.push({ key: 'g' + g.id, id: g.id, name: g.name, kind: g.kind }));
  { const ex = sav.goals.filter((g) => g.kind === 'wedding'); if (ex.length) ex.forEach((g) => opts.push({ key: 'g' + g.id, id: g.id, name: g.name, kind: 'wedding' })); else opts.push({ key: 'pwedding', id: 0, name: kindOf('wedding').name, kind: 'wedding' }); }
  const addSpend = () => {
    const n = parseFloat(fAmt.replace(',', '.')); if (!(n > 0)) return;
    let fGoal2 = fGoal;
    if (fCat === 'Savings' && fPre) {
      const k = fPre.slice(1); const g = { id: sav.nextId, name: kindOf(k).name || 'Other', kind: k, target: 0, place: '', due: '', start: 0, out: [], made: todayStr() } as any;
      setSav({ goals: [...sav.goals, g], nextId: sav.nextId + 1 }); fGoal2 = g.id;
    }
    setD({ ...d, spends: [{ id: d.nextId, name: fName.trim() || (fCat === 'Savings' ? (fPre ? (kindOf(fPre.slice(1)).name || 'Other') : ((sav.goals.find((g) => g.id === fGoal) || { name: fCat }).name)) : fCat), cat: fCat, amt: n, date: fDate || todayStr(), ...(fCat === 'Savings' && fGoal2 ? { goal: fGoal2 } : {}) }, ...d.spends], nextId: d.nextId + 1 });
    setFName(''); setFAmt(''); setFGoal(0); setFPre('');
  };
  const dateText = (s: string) => { const p = (s || '').split('-'); return p.length === 3 ? parseInt(p[2], 10) + ' ' + MON[parseInt(p[1], 10) - 1] : ''; };
  const diffTxt = gc === 0 && gp === 0 ? '-' : gd === 0 ? 'Same' : (gd > 0 ? '+' : '-') + cs() + rnd(Math.abs(gd));
  const note = gc === 0 && gp === 0 ? 'Add your spending to see how this month compares with last month.' : gd === 0 ? 'Same spending as last month.' : gp > 0 ? (gd > 0 ? 'Up ' : 'Down ') + gPct + '% compared with last month.' : 'No spending recorded last month to compare with.';
  const dim = 'rgba(255,255,255,.65)';

  return (
    <View style={{ flex: 1, backgroundColor: '#1a1030' }}>
      <LinearGradient colors={['#1a1030', '#2a1747', '#3a1d3d']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(255,196,107,.34)" style={{ right: -100, top: -40 }} />
      <Blob size={340} color="rgba(183,148,255,.3)" style={{ left: -120, bottom: 0 }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}><FinArt /></View>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 60 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
            <Text style={{ flex: 1, color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>My Finance</Text>
            <Glass radius={999} style={{ paddingVertical: 9, paddingHorizontal: 14 }}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{MON[now.getMonth()] + ' ' + curY}</Text></Glass>
          </View>

          <Glass radius={24} style={{ marginTop: 14, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <LinearGradient colors={['rgba(255,196,107,.4)', 'rgba(255,143,171,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
            <Coin />
            <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Track every ringgit</Text><Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12, marginTop: 1 }}>Income and spending at a glance</Text></View>
          </Glass>

          <MoneyLeft ym={ym} income={total} spends={d.spends} />

          <Pressable onPress={() => router.push('/savings')}>
            <Glass radius={24} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <LinearGradient colors={['rgba(94,231,181,.32)', 'rgba(124,156,255,.16)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
              <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(94,231,181,.25)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 22 }}>💰</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Savings Goals</Text>
                <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12, marginTop: 1 }}>{sav.goals.length === 0 ? 'Save for a motorcycle, wedding, travel and more' : cs() + rnd(sav.goals.reduce((a, g) => a + goalSaved(g, d.spends, dbt), 0)) + ' saved across ' + sav.goals.length + (sav.goals.length === 1 ? ' goal' : ' goals')}</Text>
              </View>
              <Text style={{ color: W, fontSize: 22 }}>›</Text>
            </Glass>
          </Pressable>

          <Commitments income={sumOf(d.inc[curKey])} />

          {/* Monthly income */}
          <Glass radius={26} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, fontWeight: '600', flexShrink: 1 }}>Monthly Income · {MON[selM] + ' ' + selY}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Pressable accessibilityLabel="Previous year" onPress={() => goYear(-1)} style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center', opacity: selY > 2024 ? 1 : 0.35 }}><Text style={{ color: W, fontSize: 18, marginTop: -2 }}>‹</Text></Pressable>
                <Text style={{ color: W, fontSize: 13, fontWeight: '800', minWidth: 38, textAlign: 'center' }}>{selY}</Text>
                <Pressable accessibilityLabel="Next year" onPress={() => goYear(1)} style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center', opacity: selY < curY ? 1 : 0.35 }}><Text style={{ color: W, fontSize: 18, marginTop: -2 }}>›</Text></Pressable>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {MON.map((n, m) => {
                const key = keyOf(selY, m); const fut = key > curKey; const sel = key === ym;
                const has = sumOf(d.inc[key]) > 0;
                return (
                  <Pressable key={n} onPress={() => { if (!fut) pickYm(key); }} style={{ width: '14.6%', minWidth: 46, flexGrow: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 999, borderWidth: 1, borderColor: sel ? 'transparent' : 'rgba(255,255,255,.2)', backgroundColor: sel ? '#ffc46b' : 'rgba(255,255,255,.08)', opacity: fut ? 0.35 : 1 }}>
                    <Text style={{ color: sel ? '#2a1030' : W, fontSize: 12, fontWeight: '700' }}>{n}</Text>
                    <View style={{ height: 4, width: 4, borderRadius: 2, marginTop: 2, backgroundColor: has ? (sel ? '#2a1030' : '#ffc46b') : 'transparent' }} />
                  </Pressable>
                );
              })}
            </View>
            <Text style={{ color: dim, fontSize: 11.5, marginTop: 8 }}>Pick any month to add or edit its income, for example Jul to Oct. Days and hours are only recorded and never added to the {cu()} total.</Text>
            <Text style={{ color: total > 0 ? W : 'rgba(255,255,255,.55)', fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginTop: 8 }}>{cs()}{money(total)}</Text>
            <View style={{ marginTop: 6 }}>
              {DEFS.map(([k, label, color], i) => {
                const v = incM[k] || 0; const c = cntM[k] || 0; const un = UN[k]; const editing = editKey === k;
                const border = { borderBottomWidth: i === DEFS.length - 1 ? 0 : 1, borderBottomColor: 'rgba(255,255,255,.1)' };
                if (!editing) {
                  const has = v > 0 || c > 0;
                  return (
                    <View key={k} style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 }, border]}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
                      <Text style={{ flex: 1, color: W, fontSize: 14, fontWeight: '600' }}>{label}</Text>
                      {has ? (<>
                        <View style={{ alignItems: 'flex-end' }}>
                          {v > 0 ? <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{cs()}{money(v)}</Text> : null}
                          {c > 0 && un ? <Text style={{ color: '#ffd593', fontSize: 12, fontWeight: '700' }}>{c + ' ' + un[1] + (c === 1 ? '' : 's')}</Text> : null}
                        </View>
                        <Pressable accessibilityLabel="Edit" onPress={() => open(k, un && c > 0 && !(v > 0) ? 'cnt' : 'rm')} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ffd593', fontSize: 15 }}>✎</Text></Pressable>
                      </>) : (
                        <Pressable onPress={() => open(k, 'rm')}><LinearGradient colors={WARM} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999 }}><Text style={{ color: '#2a1030', fontSize: 12, fontWeight: '800' }}>+ Add</Text></LinearGradient></Pressable>
                      )}
                    </View>
                  );
                }
                const unit = un ? editUnit : 'rm';
                return (
                  <View key={k} style={[{ flexDirection: 'row', gap: 10, paddingVertical: 9 }, border]}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginTop: 5 }} />
                    <View style={{ flex: 1, gap: 8 }}>
                      <Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{label}</Text>
                      {un ? (
                        <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)' }}>
                          <Pressable onPress={() => open(k, 'rm')} style={{ flex: 1, paddingVertical: 7, borderRadius: 999, alignItems: 'center', backgroundColor: unit === 'rm' ? '#ffc46b' : 'transparent' }}><Text style={{ color: unit === 'rm' ? '#2a1030' : W, fontSize: 12.5, fontWeight: '800' }}>{cu()}</Text></Pressable>
                          <Pressable onPress={() => open(k, 'cnt')} style={{ flex: 1, paddingVertical: 7, borderRadius: 999, alignItems: 'center', backgroundColor: unit === 'cnt' ? '#8b7cff' : 'transparent' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>{un[0]}</Text></Pressable>
                        </View>
                      ) : null}
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <Inp style={{ flex: 1 }} autoFocus keyboardType="decimal-pad" value={editVal} onChangeText={setEditVal} placeholder={unit === 'cnt' && un ? un[2] : label + ' (' + cu() + ')'} onSubmitEditing={() => saveLine(k)} />
                        <Pressable onPress={() => saveLine(k)}><LinearGradient colors={WARM} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 }}><Text style={{ color: '#2a1030', fontSize: 12, fontWeight: '800' }}>Save</Text></LinearGradient></Pressable>
                        <Pressable accessibilityLabel="Cancel" onPress={() => { setEditKey(''); setEditVal(''); }} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 14 }}>✕</Text></Pressable>
                      </View>
                      {un ? <Text style={{ color: dim, fontSize: 11.5 }}>{un[0] + ' are recorded for your own reference and are not added to the total income.'}</Text> : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </Glass>

          {/* Spending tracker */}
          <Glass radius={24} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>Spending Tracker</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <Stat l="This month" v={cs() + rnd(gc)} />
              <Stat l="Last month" v={cs() + rnd(gp)} />
              <Stat l="Change" v={diffTxt} vc={gd > 0 ? '#ffb3a0' : gd < 0 ? '#7df0c6' : W} bg={gd > 0 ? 'rgba(255,143,107,.16)' : gd < 0 ? 'rgba(94,231,181,.16)' : undefined} />
            </View>
            <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 11.5, marginTop: 6 }}>{note}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 150, marginTop: 22 }}>
              {gm.map((x, i) => {
                const dd = x.v - x.prev;
                return (
                  <View key={x.key} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: '100%' }}>
                    <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 10 }}>{x.v > 0 ? rnd(x.v) : ''}</Text>
                    {i === 5 && x.v > 0
                      ? <LinearGradient colors={['#ffc46b', '#ff8fab']} style={{ width: '100%', height: Math.max(8, Math.round((x.v / gMax) * 74)), borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }} />
                      : <View style={{ width: '100%', height: x.v > 0 ? Math.max(8, Math.round((x.v / gMax) * 74)) : 6, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: x.v > 0 ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.18)' }} />}
                    <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11 }}>{x.label}</Text>
                    <Text style={{ height: 13, fontSize: 10.5, fontWeight: '700', color: dd > 0 ? '#ffb3a0' : dd < 0 ? '#7df0c6' : 'rgba(255,255,255,.6)' }}>{x.prev > 0 && (x.v > 0 || i === 5) ? (dd === 0 ? 'same' : (dd > 0 ? '▲ ' : '▼ ') + rnd(Math.abs(dd))) : ''}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 11.5, marginTop: 6 }}>Last 6 months, in {cu()}. Under each month: ▲ orange means you spent that much more than the month before, ▼ green means that much less.</Text>
            <DateField value={fDate} onChange={setFDate} style={{ marginTop: 12 }} />
            <Inp style={{ marginTop: 8 }} value={fName} onChangeText={setFName} placeholder="What did you buy?" />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <Inp style={{ flex: 1 }} keyboardType="decimal-pad" value={fAmt} onChangeText={setFAmt} placeholder={'Amount (' + cu() + ')'} onSubmitEditing={addSpend} />
              <Pressable onPress={addSpend}><LinearGradient colors={WARM} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 42, paddingHorizontal: 18, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#2a1030', fontSize: 12, fontWeight: '800' }}>+ Add</Text></LinearGradient></Pressable>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {CATS.map(([n, c]) => <Chip key={n} t={n} on={fCat === n} c={c} onPress={() => setFCat(n)} />)}
            </View>
            {fCat === 'Savings' ? (
              <View style={{ marginTop: 10 }}>
                <Text style={{ color: dim, fontSize: 11.5 }}>Which savings goal is this for?</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {opts.map((o) => { const on = o.id ? fGoal === o.id && !fPre : fPre === o.key; return <Chip key={o.key} t={o.name} on={on} c="#5ee7b5" onPress={() => { if (on) { setFGoal(0); setFPre(''); } else if (o.id) { setFGoal(o.id); setFPre(''); } else { setFGoal(0); setFPre(o.key); } }} />; })}
                </View>
              </View>
            ) : null}
            {d.spends.length === 0 ? (
              <View style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.3)' }}><Text style={{ textAlign: 'center', color: 'rgba(255,255,255,.7)', fontSize: 12, lineHeight: 18 }}>No spending yet. Type what you bought, the amount, pick a category and tap Add.</Text></View>
            ) : null}
            <View style={{ marginTop: 6 }}>
              {d.spends.map((p, i) => (
                <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: i === d.spends.length - 1 ? 0 : 1, borderBottomColor: 'rgba(255,255,255,.1)' }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colorOf(p.cat) }} />
                  <Text style={{ flex: 1, color: W, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>{p.name}<Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: '400' }}>{'  · ' + p.cat + ' · ' + dateText(p.date)}</Text></Text>
                  <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{cs()}{money(p.amt)}</Text>
                  <Pressable accessibilityLabel="Delete" onPress={() => setD({ ...d, spends: d.spends.filter((x) => x.id !== p.id) })} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ff9aa9', fontSize: 14 }}>✕</Text></Pressable>
                </View>
              ))}
            </View>
          </Glass>

          {/* By category */}
          <Glass radius={24} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>Spending by Category</Text>
              <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>{MON[selM] + ' ' + selY}</Text>
            </View>
            <Text style={{ color: dim, fontSize: 11.5, marginTop: 4 }}>Set a monthly limit for a category. The bar turns yellow when you are close and red when you go over.</Text>
            <View style={{ marginTop: 12, gap: 14 }}>
              {CATS.filter((x) => x[0] !== 'Savings').map(([n, c]) => {
                const t = d.spends.filter((p) => p.cat === n && (p.date || '').slice(0, 7) === ym).reduce((a, p) => a + p.amt, 0);
                const lim = (d.limits || {})[n] || 0; const ratio = lim > 0 ? t / lim : 0;
                const col = lim > 0 ? (ratio > 1 ? '#ff7a8a' : ratio >= 0.8 ? '#ffd24a' : c) : c;
                const w = lim > 0 ? Math.min(100, Math.round(ratio * 100)) : monthSpent > 0 ? Math.round((t / monthSpent) * 100) : 0;
                const editing = limKey === n;
                return (
                  <View key={n}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <Text style={{ color: W, fontSize: 13, fontWeight: '600' }}>{n}</Text>
                      <Text style={{ color: lim > 0 && ratio > 1 ? '#ff9aa9' : 'rgba(255,255,255,.8)', fontSize: 12, fontWeight: '600' }}>{cs() + money(t) + (lim > 0 ? ' of ' + cs() + rnd(lim) : '')}</Text>
                    </View>
                    <View style={{ marginTop: 5, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.12)', overflow: 'hidden' }}><View style={{ width: w + '%', height: '100%', borderRadius: 4, backgroundColor: col }} /></View>
                    {editing ? (
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 }}>
                        <Inp style={{ flex: 1 }} autoFocus keyboardType="decimal-pad" value={limVal} onChangeText={setLimVal} placeholder={n + ' limit per month (' + cu() + ')'} onSubmitEditing={() => saveLimit(n)} />
                        <Pressable onPress={() => saveLimit(n)}><LinearGradient colors={WARM} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999 }}><Text style={{ color: '#2a1030', fontSize: 12, fontWeight: '800' }}>Save</Text></LinearGradient></Pressable>
                        <Pressable accessibilityLabel="Cancel" onPress={() => { setLimKey(''); setLimVal(''); }} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 14 }}>✕</Text></Pressable>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
                        <Text style={{ color: lim > 0 ? (ratio > 1 ? '#ff9aa9' : ratio >= 0.8 ? '#ffd24a' : dim) : dim, fontSize: 11.5, fontWeight: lim > 0 ? '700' : '400' }}>
                          {lim > 0 ? (ratio > 1 ? cs() + rnd(t - lim) + ' over the limit' : ratio >= 0.8 ? 'Close to the limit, ' + cs() + rnd(lim - t) + ' left' : cs() + rnd(lim - t) + ' left · ' + Math.round(ratio * 100) + '% used') : (monthSpent > 0 ? w + '% of this month' : 'No limit set')}
                        </Text>
                        <Pressable onPress={() => { setLimKey(n); setLimVal(lim > 0 ? String(lim) : ''); }}>
                          <Text style={{ color: '#ffd593', fontSize: 12, fontWeight: '800' }}>{lim > 0 ? 'Edit limit' : '+ Set limit'}</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </Glass>

          {/* Income trend */}
          <Glass radius={24} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>Income Trend</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>Last 6 months · tap to open</Text></View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 104, marginTop: 18 }}>
              {tr.map((x) => {
                const h = x.t > 0 ? Math.max(8, Math.round((x.t / maxT) * 56)) : 6; const sel = x.key === ym;
                const r = { width: '100%' as const, height: h, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 };
                return (
                  <Pressable key={x.key} onPress={() => pickYm(x.key)} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: '100%' }}>
                    <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 10 }}>{x.t > 0 ? rnd(x.t) : ''}</Text>
                    {sel && x.t > 0 ? <LinearGradient colors={['#ffc46b', '#ff8fab']} style={r} /> : <View style={[r, { backgroundColor: sel ? 'rgba(255,196,107,.5)' : x.t > 0 ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.2)' }]} />}
                    <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11 }}>{x.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {total <= 0 ? <Text style={{ marginTop: 8, color: dim, fontSize: 12 }}>No income saved for {MON[selM] + ' ' + selY} yet.</Text> : null}
          </Glass>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
