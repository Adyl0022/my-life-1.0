import { SUB_EMPTY, detect as detectSubs, monthlyTotal, rm as rmSub, type SubStore } from '../lib/subs';
import { LineIcon } from '../components/LineIcon';
import { SubChargeCard } from '../components/SubChargeCard';
import { SAV_EMPTY, SavData, goalSaved, kindOf } from '../lib/savings';
import { DEBT_EMPTY, DebtData } from '../lib/debts';
import { ACC_EMPTY, AccData, balanceOf, commitTotal, groupOf, incomeFeed, isLiab, keepOf, reservedTotal, totals } from '../lib/accounts';
import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { Pressable } from '../components/Press';
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
import { FinArt } from '../components/FinArt';
import { MoneyLeft } from '../components/MoneyLeft';
import { TodaySpend } from '../components/TodaySpend';
import { useMergedSpends, useVehMode, VEH_CAT, VEH_COLOR } from '../lib/vehicleSpend';
import { TOP } from '../lib/layout';
import { cs, cu, cw, useRegion } from '../lib/region';

import { confirmDelete, showAlert } from '../lib/dialog';
import { pn, tryForm } from '../lib/num';
type Sp = { id: number; name: string; cat: string; amt: number; date: string; goal?: number; note?: string; acc?: number };
type Data = { inc: Record<string, Record<string, number>>; cnt: Record<string, Record<string, number>>; spends: Sp[]; nextId: number; limits?: Record<string, number>; hideCats?: string[]; cats?: [string, string][]; incAcc?: Record<string, { acc: number; date: string; name: string }> };
const EMPTY: Data = { inc: {}, cnt: {}, spends: [], nextId: 1 };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEFS: [string, string, string][] = [['salary', 'Basic salary', '#7c9cff'], ['overtime', 'Overtime', '#ffc46b'], ['claim', 'Claim', '#8fe9e2'], ['sunday', 'Sunday work', '#b794ff'], ['holiday', 'Public holiday work', '#ff8fab'], ['other', 'Other', '#5ee7b5']];
const UN: Record<string, [string, string, string]> = { sunday: ['Days', 'day', 'Number of days worked'], holiday: ['Days', 'day', 'Number of days worked'], overtime: ['Hours', 'hour', 'Number of overtime hours'] };
const ymdNow = () => { const x = new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const CATS: [string, string][] = [['Food', '#ffc46b'], ['Petrol', '#7c9cff'], ['Bills', '#ff8fab'], ['Shopping', '#b794ff'], ['Savings', '#5ee7b5'], ['Health', '#ff8fab'], ['Other', '#8fe9e2']];
const money = (n: number) => n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rnd = (n: number) => Math.round(n).toLocaleString('en-MY');
const keyOf = (y: number, m: number) => y + '-' + String(m + 1).padStart(2, '0');
const CAT_COL = ['#ffa86b', '#6bd6ff', '#c3ff7a', '#ff7ad9', '#ffe36b', '#7affc8', '#a58bff', '#ff9a7a'];
const WARM = ['#ffc46b', '#ff8fab'] as [string, string];

const Coin = () => (
  <Svg width={44} height={44} viewBox="0 0 44 44">
    <Ellipse cx="22" cy="34" rx="15" ry="5" fill="#d98f1f" /><Rect x="7" y="26" width="30" height="8" fill="#f4b13d" /><Ellipse cx="22" cy="26" rx="15" ry="5" fill="#ffd27a" />
    <Ellipse cx="22" cy="19" rx="15" ry="5" fill="#d98f1f" /><Rect x="7" y="12" width="30" height="7" fill="#f4b13d" /><Ellipse cx="22" cy="12" rx="15" ry="5" fill="#ffe3a0" />
    <SvgText x="22" y="15" textAnchor="middle" fontSize="7" fontWeight="800" fill="#a86a00">{cu().slice(0, 3)}</SvgText>
  </Svg>
);
const Chip = ({ t, on, c, onPress, onDel }: { t: string; on: boolean; c?: string; onPress: () => void; onDel?: () => void }) => (
  <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingLeft: 11, paddingRight: onDel ? 7 : 11, borderRadius: 999, borderWidth: 1, borderColor: on ? (c || 'transparent') : 'rgba(255,255,255,.2)', backgroundColor: on ? (c || '#ffc46b') : 'rgba(255,255,255,.08)' }}>
    <Text style={{ color: on ? '#2a1030' : W, fontSize: 12, fontWeight: '700' }}>{t}</Text>
    {onDel ? <Pressable onPress={onDel} hitSlop={8} accessibilityLabel={'Delete category ' + t} style={{ width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? 'rgba(42,16,48,.2)' : 'rgba(255,255,255,.16)' }}><Text style={{ color: on ? '#2a1030' : W, fontSize: 10, fontWeight: '900' }}>✕</Text></Pressable> : null}
  </Pressable>
);
const SEC = { marginTop: 12, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.06)' } as const;
const SIN = { marginTop: 16 } as const;
const SECL = { color: 'rgba(255,255,255,.65)', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 } as const;
const Stat = ({ l, v, bg, vc }: { l: string; v: string; bg?: string; vc?: string }) => (
  <View style={{ flex: 1, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: bg || 'rgba(255,255,255,.08)' }}>
    <Text style={{ color: 'rgba(255,255,255,.68)', fontSize: 10.5 }}>{l}</Text><Text style={{ color: vc || W, fontSize: 14.5, fontWeight: '800', marginTop: 2 }}>{v}</Text>
  </View>
);

export default function Finance() {
  useRegion();
  const router = useRouter();
  const [d, setD] = useStored<Data>('ml_finance', EMPTY);
  const all = useMergedSpends(d.spends); const [vmode] = useVehMode();
  const now = new Date(); const curY = now.getFullYear(); const curKey = keyOf(curY, now.getMonth());
  const [ym, setYm] = useState(curKey);
  const [editKey, setEditKey] = useState(''); const [editUnit, setEditUnit] = useState<'rm' | 'cnt'>('rm'); const [editVal, setEditVal] = useState(''); const [editAcc, setEditAcc] = useState(0);
  const [limKey, setLimKey] = useState(''); const [limVal, setLimVal] = useState('');
  const [fDate, setFDate] = useState(todayStr()); const [fName, setFName] = useState(''); const [fAmt, setFAmt] = useState(''); const [fCat, setFCat] = useState('Food'); const [fGoal, setFGoal] = useState(0); const [fPre, setFPre] = useState('');
  const [fNote, setFNote] = useState(''); const [remId, setRemId] = useState(0); const [remF, setRemF] = useState({ name: '', amt: '', date: '', cat: 'Food', note: '', acc: 0 });
  const [accD] = useStored<AccData>('ml_accounts', ACC_EMPTY); const [fAcc, setFAcc] = useState(0);
  const NOTE_QUICK = ['Cash', 'Card', 'E-wallet', 'With family', 'Debt'];
  const quickNote = (t: string) => { const parts = fNote.split(',').map((x) => x.trim()).filter(Boolean); setFNote((parts.includes(t) ? parts.filter((x) => x !== t) : [...parts, t]).join(', ')); };
  const [sbs, setSbs] = useStored<SubStore>('ml_subs', SUB_EMPTY);
  const [sav, setSav] = useStored<SavData>('ml_savings', SAV_EMPTY); const [dbt] = useStored<DebtData>('ml_debts', DEBT_EMPTY); const accTot = totals(accD, d.spends as any, commitTotal(dbt.debts), { debts: dbt.debts as any, incomes: incomeFeed(d.inc, d.incAcc) });

  const selY = parseInt(ym.slice(0, 4), 10), selM = parseInt(ym.slice(5, 7), 10) - 1;
  const sumOf = (o?: Record<string, number>) => DEFS.reduce((a, x) => a + ((o || {})[x[0]] || 0), 0);
  const incM = d.inc[ym] || {}; const cntM = d.cnt[ym] || {}; const total = sumOf(incM);
  const pickYm = (k: string) => { setYm(k); setEditKey(''); setEditVal(''); };
  const goYear = (dy: number) => { const ny = Math.min(curY, Math.max(2024, selY + dy)); let k = keyOf(ny, selM); if (k > curKey) k = curKey; pickYm(k); };
  const open = (k: string, u: 'rm' | 'cnt') => { const n = ((u === 'cnt' ? d.cnt : d.inc)[ym] || {})[k] || 0; setEditKey(k); setEditUnit(u); setEditVal(n > 0 ? String(n) : ''); const L = (d.incAcc || {})[ym + '|' + k]; setEditAcc(L && accD.accs.some((a) => a.id === L.acc) ? L.acc : 0); };
  const saveLine = (k: string) => {
    const n = pn(editVal); const un = UN[k]; const store = editUnit === 'cnt' && un ? 'cnt' : 'inc';
    const alls = { ...d[store] }; alls[ym] = { ...alls[ym], [k]: n > 0 ? n : 0 };
    const link = { ...(d.incAcc || {}) }; const lk = ym + '|' + k;
    if (store === 'inc') { if (editAcc && n > 0) { const old = link[lk]; const td = todayStr(); link[lk] = { acc: editAcc, date: old && old.acc === editAcc ? old.date : (td.slice(0, 7) === ym ? td : ym + '-01'), name: (DEFS.find((x) => x[0] === k) || ['', k])[1] }; } else delete link[lk]; }
    setD({ ...d, [store]: alls, incAcc: link }); setEditKey(''); setEditVal('');
  };
  const spendIn = (key: string) => all.filter((p) => p.cat !== 'Savings' && (p.date || '').slice(0, 7) === key).reduce((a, p) => a + p.amt, 0);
  const gk = (back: number) => { const x = new Date(curY, now.getMonth() - back, 1); return { key: keyOf(x.getFullYear(), x.getMonth()), label: MON[x.getMonth()] }; };
  const gm = [5, 4, 3, 2, 1, 0].map((b) => { const k = gk(b); return { key: k.key, label: k.label, v: spendIn(k.key), prev: spendIn(gk(b + 1).key) }; });
  const gMax = Math.max(...gm.map((x) => x.v), 1);
  const gc = gm[5].v, gp = gm[4].v, gd = gc - gp; const gPct = gp > 0 ? Math.round(Math.abs(gd) / gp * 100) : 0;
  const spent = all.filter((p) => p.cat !== 'Savings').reduce((a, p) => a + p.amt, 0);
  // The list follows the Sort by choice: newest date first (default), oldest date first, or the order the entries were added.
  const [sortBy, setSortBy] = useStored<'new' | 'old' | 'add'>('ml_spend_sort', 'new');
  const byDate = [...all].sort((a, b) => sortBy === 'add' ? b.id - a.id : sortBy === 'old' ? (a.date || '').localeCompare(b.date || '') || a.id - b.id : (b.date || '').localeCompare(a.date || '') || b.id - a.id);
  // Categories: the ready-made ones plus your own. One list feeds the Add spending form, the edit form and Spending by Category, and Other stays last.
  const cats: [string, string][] = [...CATS.slice(0, -1).filter((c) => !(d.hideCats || []).includes(c[0])), ...(d.cats || []), CATS[CATS.length - 1]];
  const isDefault = (n: string) => CATS.some((c) => c[0] === n);
  useEffect(() => { if (!cats.some((c) => c[0] === fCat)) setFCat('Other'); }, [JSON.stringify(cats)]); // eslint-disable-line react-hooks/exhaustive-deps
  const colorOf = (n: string) => n === VEH_CAT ? VEH_COLOR : (cats.find((c) => c[0] === n) || cats[cats.length - 1])[1];
  const [newCatOn, setNewCatOn] = useState(false); const [newCat, setNewCat] = useState(''); const [catMsg, setCatMsg] = useState('');
  const addCat = () => {
    const nm = newCat.trim().replace(/\s+/g, ' ');
    if (!nm) { tryForm('cat'); setCatMsg('Please type a name for the category.'); return; }
    if (nm.length > 20) { setCatMsg('Keep the name to 20 letters or fewer.'); return; }
    if (cats.some((c) => c[0].toLowerCase() === nm.toLowerCase()) || nm.toLowerCase() === VEH_CAT.toLowerCase()) { setCatMsg('You already have a category called ' + nm + '.'); return; }
    if ((d.cats || []).length >= 12) { setCatMsg('You can add up to 12 of your own categories.'); return; }
    const back = CATS.find((c) => c[0].toLowerCase() === nm.toLowerCase() && (d.hideCats || []).includes(c[0]));
    if (back) { setD({ ...d, hideCats: (d.hideCats || []).filter((x) => x !== back[0]) }); setFCat(back[0]); setNewCat(''); setNewCatOn(false); setCatMsg(''); return; }
    const col = CAT_COL[(d.cats || []).length % CAT_COL.length];
    setD({ ...d, cats: [...(d.cats || []), [nm, col]] }); setFCat(nm); setNewCat(''); setNewCatOn(false); setCatMsg('');
  };
  // The person chooses what happens to the spending inside: keep it (moved to Other) or delete it together with the category.
  const removeCat = (n: string) => {
    const cnt = d.spends.filter((x) => x.cat === n).length;
    const go = (keep: boolean) => {
      const lm = { ...(d.limits || {}) }; delete lm[n];
      setD({ ...d, cats: (d.cats || []).filter((c) => c[0] !== n), hideCats: isDefault(n) ? [...(d.hideCats || []), n] : d.hideCats, limits: lm, spends: keep ? d.spends.map((x) => x.cat === n ? { ...x, cat: 'Other' } : x) : d.spends.filter((x) => x.cat !== n) });
      if (fCat === n) setFCat('Other'); setLimKey(''); setLimVal('');
    };
    if (cnt === 0) { confirmDelete('the category ' + n, () => go(true), { title: 'Delete this category?', message: 'It has no spending in it.' }); return; }
    showAlert('Delete the category ' + n + '?', 'It has ' + cnt + (cnt === 1 ? ' spending' : ' spendings') + '. What should happen to ' + (cnt === 1 ? 'it' : 'them') + '?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete them too', style: 'destructive', onPress: () => go(false) },
      { text: 'Move to Other', onPress: () => go(true) },
    ]);
  };
  const [hm, setHm] = useState(''); const [pickM, setPickM] = useState(false);
  const curM = hm || ym;
  const addM = (k: string, d: number) => { const n = parseInt(k.slice(0, 4), 10) * 12 + parseInt(k.slice(5), 10) - 1 + d; return Math.floor(n / 12) + '-' + String((n % 12) + 1).padStart(2, '0'); };
  const monthsWith = Array.from(new Set(all.map((x) => (x.date || '').slice(0, 7)).filter((x) => x.length === 7).concat([ym]))).sort().reverse();
  const earliest = monthsWith[monthsWith.length - 1] || ym;
  const FULLM = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const mLabel = (k: string) => FULLM[parseInt(k.slice(5), 10) - 1] + ' ' + k.slice(0, 4);
  const shown = byDate.filter((x) => (x.date || '').slice(0, 7) === curM);
  const [full, setFull] = useState('');
  const vis = full === curM ? shown : shown.slice(0, 6);
  const shownTotal = shown.filter((x) => x.cat !== 'Savings').reduce((a, x) => a + x.amt, 0);
  const monthSpent = all.filter((p) => p.cat !== 'Savings' && (p.date || '').slice(0, 7) === ym).reduce((a, p) => a + p.amt, 0);
  const tr = [5, 4, 3, 2, 1, 0].map((b) => { const k = gk(b); return { key: k.key, label: k.label, t: sumOf(d.inc[k.key]) }; });
  const maxT = Math.max(...tr.map((x) => x.t), 1);
  const saveLimit = (k: string) => {
    const n = pn(limVal); const lm = { ...(d.limits || {}) };
    if (!(n > 0)) { tryForm('limit'); return; }
    lm[k] = n;
    setD({ ...d, limits: lm }); setLimKey(''); setLimVal('');
  };
  const removeLimit = (k: string) => confirmDelete('the limit for ' + k, () => { const lm = { ...(d.limits || {}) }; delete lm[k]; setD({ ...d, limits: lm }); setLimKey(''); setLimVal(''); });
  // Goal choices for the Savings category: ready-made goals first, your own in the middle, Wedding last.
  const PRE = ['motor', 'car', 'house', 'emergency', 'medical', 'travel', 'other'];
  const opts: { key: string; id: number; name: string; kind: string }[] = [];
  PRE.forEach((k) => { const ex = sav.goals.filter((g) => g.kind === k); if (ex.length) ex.forEach((g) => opts.push({ key: 'g' + g.id, id: g.id, name: g.name, kind: k })); else opts.push({ key: 'p' + k, id: 0, name: kindOf(k).name || 'Other', kind: k }); });
  sav.goals.filter((g) => PRE.indexOf(g.kind) < 0 && g.kind !== 'wedding').forEach((g) => opts.push({ key: 'g' + g.id, id: g.id, name: g.name, kind: g.kind }));
  { const ex = sav.goals.filter((g) => g.kind === 'wedding'); if (ex.length) ex.forEach((g) => opts.push({ key: 'g' + g.id, id: g.id, name: g.name, kind: 'wedding' })); else opts.push({ key: 'pwedding', id: 0, name: kindOf('wedding').name, kind: 'wedding' }); }
  const addSpend = () => {
    const n = pn(fAmt); if (!(n > 0)) { tryForm('spend'); return; }
    let fGoal2 = fGoal;
    if (fCat === 'Savings' && fPre) {
      const k = fPre.slice(1); const g = { id: sav.nextId, name: kindOf(k).name || 'Other', kind: k, target: 0, place: '', due: '', start: 0, out: [], made: todayStr() } as any;
      setSav({ goals: [...sav.goals, g], nextId: sav.nextId + 1 }); fGoal2 = g.id;
    }
    setD({ ...d, spends: [{ id: d.nextId, name: fName.trim() || (fCat === 'Savings' ? (fPre ? (kindOf(fPre.slice(1)).name || 'Other') : ((sav.goals.find((g) => g.id === fGoal) || { name: fCat }).name)) : fCat), cat: fCat, amt: n, date: fDate || todayStr(), ...(fNote.trim() ? { note: fNote.trim() } : {}), ...(fAcc && accD.accs.some((a) => a.id === fAcc) ? { acc: fAcc } : {}), ...(fCat === 'Savings' && fGoal2 ? { goal: fGoal2 } : {}) }, ...d.spends], nextId: d.nextId + 1 });
    setFName(''); setFAmt(''); setFGoal(0); setFPre(''); setFNote('');
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
            <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Track every {cw()}</Text><Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12, marginTop: 4 }}>Income and spending at a glance</Text></View>
          </Glass>

          <Pressable onPress={() => router.push('/accounts' as any)} accessibilityLabel="Open My Accounts" style={({ pressed }) => ({ marginTop: 14, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
            <View style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', padding: 16 }}>
              <LinearGradient colors={['rgba(124,156,255,.4)', 'rgba(183,148,255,.3)', 'rgba(255,180,94,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2 }}>MY ACCOUNTS</Text>
                <Text style={{ color: '#8fe9e2', fontSize: 12.5, fontWeight: '800' }}>{accD.accs.length ? 'Manage ›' : 'Add ›'}</Text>
              </View>
              {accD.accs.length ? (<>
                <Text style={{ color: accTot.assets < 0 ? '#ff8fab' : W, fontSize: 28, fontWeight: '800', marginTop: 4 }}>{(accTot.assets < 0 ? '-' : '') + cs()}{money(Math.abs(accTot.assets))}</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <Stat l="Liabilities" v={cs() + money(accTot.liab)} vc="#ff8fab" /><Stat l="After debts" v={(accTot.total < 0 ? '-' : '') + cs() + money(Math.abs(accTot.total))} vc={accTot.total < 0 ? '#ff8fab' : '#9fb6ff'} />
                </View>
                {reservedTotal(accD) > 0 ? <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, lineHeight: 17, marginTop: 8 }}>{'Available to spend ' + cs() + money(Math.max(0, accTot.assets - reservedTotal(accD)))}</Text> : null}
              </>) : (
                <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 13, lineHeight: 19, marginTop: 6 }}>Add your cash, bank, wallet and cards to see your total money. Balances go up and down when you log spending.</Text>
              )}
            </View>
          </Pressable>

          <SubChargeCard subs={sbs} setSubs={setSbs} spends={d.spends} nextId={d.nextId} addSpend={(sp) => setD({ ...d, spends: [sp, ...d.spends], nextId: d.nextId + 1 })} today={ymdNow()} accName={(id) => { const a = accD.accs.find((x) => x.id === id); return a ? a.name : ''; }} accWarn={(id, am) => { const fa = accD.accs.find((x) => x.id === id); if (!fa || !(am > 0) || keepOf(fa) <= 0) return ''; const left = balanceOf(fa, accD, d.spends as any, { debts: dbt.debts as any, incomes: incomeFeed(d.inc, d.incAcc) }) - am; return left < keepOf(fa) ? 'Careful: this leaves ' + cs() + money(Math.max(0, left)) + ' in ' + fa.name + ', below the ' + cs() + money(keepOf(fa)) + ' you keep in it. You can still continue.' : ''; }} />
          <MoneyLeft ym={ym} income={total} spends={all} canSpend={accD.accs.some((a) => !isLiab(a)) ? Math.max(0, accTot.assets - reservedTotal(accD)) : undefined} />
          <TodaySpend spends={d.spends} />

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


          {(() => {
            const list = (sbs && sbs.subs) || []; const n = list.filter((x: any) => !x.status || x.status === 'active').length; const fd = detectSubs(all as any, list, (sbs && sbs.no) || [], ymdNow()).length;
            const sub = n === 0 && list.length ? 'All paused or cancelled' : n === 0 ? (fd ? fd + ' found in your spending' : 'Netflix, YouTube, Spotify and more') : rmSub(monthlyTotal(list)) + ' a month · ' + n + ' active';
            return (
              <Pressable onPress={() => router.push('/subscriptions' as any)} accessibilityLabel="Subscriptions" style={({ pressed }) => ({ marginTop: 12, transform: [{ scale: pressed ? 0.985 : 1 }], borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', borderTopColor: 'rgba(255,255,255,.4)' })}>
                <LinearGradient colors={['rgba(124,156,255,.4)', 'rgba(183,148,255,.3)', 'rgba(255,180,94,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)' }}><LineIcon name="repeat" c="#fff" size={22} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Subscriptions</Text>
                    <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, marginTop: 2, lineHeight: 16 }}>{sub}</Text>
                  </View>
                  {n > 0 && fd > 0 ? <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(94,231,181,.22)', borderWidth: 1, borderColor: 'rgba(94,231,181,.6)' }}><Text style={{ color: '#5ee7b5', fontSize: 10.5, fontWeight: '800' }}>{fd + ' FOUND'}</Text></View> : null}
                  <Text style={{ color: '#fff', fontSize: 22 }}>›</Text>
                </LinearGradient>
              </Pressable>
            );
          })()}

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
                      {unit === 'rm' && accD.accs.some((a) => !isLiab(a)) ? (
                        <View>
                          <Text style={{ color: dim, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 6 }}>PUT INTO ACCOUNT (OPTIONAL)</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            <Chip t="Not linked" on={!editAcc} onPress={() => setEditAcc(0)} />
                            {accD.accs.filter((a) => !isLiab(a)).map((a) => <Chip key={a.id} t={a.name} on={editAcc === a.id} c={groupOf(a.g).c} onPress={() => setEditAcc(editAcc === a.id ? 0 : a.id)} />)}
                          </View>
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
            <View style={SEC}>
            <Text style={SECL}>THIS MONTH AND LAST 6 MONTHS</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
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
            </View>



              <View style={SEC}>
              <Text style={SECL}>ADD SPENDING</Text>
              <View style={SIN}>
                <Text style={SECL}>WHAT AND HOW MUCH</Text>
                <Inp value={fName} onChangeText={setFName} placeholder="What did you buy?" />
                <Inp form="spend" need="an amount" style={{ marginTop: 8 }} keyboardType="decimal-pad" value={fAmt} onChangeText={setFAmt} placeholder={'Amount (' + cu() + ')'} onSubmitEditing={addSpend} />
              </View>
              <View style={SIN}>
                <Text style={SECL}>CATEGORY</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {cats.map(([n, c]) => <Chip key={n} t={n} on={fCat === n} c={c} onPress={() => setFCat(n)} onDel={n !== 'Other' ? () => removeCat(n) : undefined} />)}
                  <Chip t={newCatOn ? 'Cancel' : '+ New category'} on={false} onPress={() => { setNewCatOn(!newCatOn); setNewCat(''); setCatMsg(''); }} />
                </View>
                {newCatOn ? (
                  <View style={{ marginTop: 10 }}>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <Inp style={{ flex: 1 }} autoFocus form="cat" need="a category name" value={newCat} onChangeText={(t: string) => { setNewCat(t); setCatMsg(''); }} placeholder="Category name, e.g. Gifts" maxLength={20} onSubmitEditing={addCat} />
                      <Pressable onPress={addCat}><LinearGradient colors={WARM} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999 }}><Text style={{ color: '#2a1030', fontSize: 12, fontWeight: '800' }}>Add</Text></LinearGradient></Pressable>
                    </View>
                    {catMsg ? <Text style={{ color: '#ffb3c6', fontSize: 12, marginTop: 6 }}>{catMsg}</Text> : null}
                    <Text style={{ color: dim, fontSize: 11.5, marginTop: 6 }}>It also appears in Spending by Category, where you can set a monthly limit for it.</Text>
                  </View>
                ) : null}
                {fCat === 'Savings' ? (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ color: dim, fontSize: 11.5 }}>Which savings goal is this for?</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {opts.map((o) => { const on = o.id ? fGoal === o.id && !fPre : fPre === o.key; return <Chip key={o.key} t={o.name} on={on} c="#5ee7b5" onPress={() => { if (on) { setFGoal(0); setFPre(''); } else if (o.id) { setFGoal(o.id); setFPre(''); } else { setFGoal(0); setFPre(o.key); } }} />; })}
                    </View>
                  </View>
                ) : null}
              </View>
              <View style={SIN}>
                <Text style={SECL}>DATE AND REMARK (OPTIONAL)</Text>
                <DateField value={fDate} onChange={setFDate} />
                <Inp style={{ marginTop: 8 }} value={fNote} onChangeText={setFNote} placeholder="Remark (optional)" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {NOTE_QUICK.map((t) => { const on = fNote.split(',').map((x) => x.trim()).includes(t); return (
                    <Pressable key={t} onPress={() => quickNote(t)} style={{ paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, backgroundColor: on ? 'rgba(255,196,107,.35)' : 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: on ? '#ffc46b' : 'rgba(255,255,255,.2)' }}><Text style={{ color: W, fontSize: 11.5, fontWeight: '600' }}>{t}</Text></Pressable>
                  ); })}
                </View>
              </View>
              {accD.accs.length ? (
                <View style={SIN}>
                  <Text style={SECL}>PAID FROM (OPTIONAL)</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    <Chip t="Not linked" on={!fAcc} onPress={() => setFAcc(0)} />
                    {accD.accs.filter((a) => a.g !== 'loan').map((a) => <Chip key={a.id} t={a.name} on={fAcc === a.id} c={groupOf(a.g).c} onPress={() => setFAcc(fAcc === a.id ? 0 : a.id)} />)}
                  </View>
                  {(() => { const fa = accD.accs.find((a) => a.id === fAcc); const am = parseFloat(String(fAmt).replace(',', '.')); if (!fa || !(am > 0) || keepOf(fa) <= 0) return null; const left = balanceOf(fa, accD, d.spends as any, { debts: dbt.debts as any, incomes: incomeFeed(d.inc, d.incAcc) }) - am; return left < keepOf(fa) ? <Text style={{ color: '#ffc46b', fontSize: 12, lineHeight: 17, marginTop: 8 }}>{'Careful: this leaves ' + cs() + money(Math.max(0, left)) + ' in ' + fa.name + ', below the ' + cs() + money(keepOf(fa)) + ' you keep in it. You can still add it.'}</Text> : null; })()}
                </View>
              ) : null}
              <Pressable onPress={addSpend} style={{ marginTop: 12 }}><LinearGradient colors={WARM} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#2a1030', fontSize: 14, fontWeight: '800' }}>+ Add spending</Text></LinearGradient></Pressable>
              </View>

            {/* Spending history */}
            <View style={SEC}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={{ ...SECL, marginBottom: 0 }}>SPENDING HISTORY</Text>
                <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>{shown.length + (shown.length === 1 ? ' item' : ' items')}</Text>
              </View>
              {all.length > 0 ? (
                <View style={{ marginTop: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Pressable accessibilityLabel="Earlier month" disabled={curM <= earliest} onPress={() => setHm(addM(curM, -1))} style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.1)', opacity: curM <= earliest ? 0.35 : 1 }}><Text style={{ color: W, fontSize: 18, fontWeight: '800' }}>‹</Text></Pressable>
                    <Pressable accessibilityLabel="Pick a month" onPress={() => setPickM(!pickM)} style={{ flex: 1, minWidth: 0, alignItems: 'center', paddingVertical: 6, borderRadius: 13, backgroundColor: 'rgba(255,196,107,.14)', borderWidth: 1, borderColor: 'rgba(255,196,107,.35)' }}>
                      <Text style={{ color: '#ffd593', fontSize: 14, fontWeight: '800' }}>{mLabel(curM) + '  ▾'}</Text>
                      <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 1 }}>{cs() + money(shownTotal) + ' spent' + (curM === ym ? ' · this month' : '')}</Text>
                    </Pressable>
                    <Pressable accessibilityLabel="Later month" disabled={curM >= ym} onPress={() => setHm(addM(curM, 1) >= ym ? '' : addM(curM, 1))} style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.1)', opacity: curM >= ym ? 0.35 : 1 }}><Text style={{ color: W, fontSize: 18, fontWeight: '800' }}>›</Text></Pressable>
                  </View>
                  {pickM ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {monthsWith.slice(0, 12).map((k) => (
                        <Pressable key={k} onPress={() => { setHm(k === ym ? '' : k); setPickM(false); }} style={{ paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999, backgroundColor: k === curM ? '#ffc46b' : 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: k === curM ? '#ffc46b' : 'rgba(255,255,255,.22)' }}><Text style={{ color: k === curM ? '#0b1030' : W, fontSize: 12, fontWeight: '700' }}>{MON[parseInt(k.slice(5), 10) - 1] + ' ' + k.slice(0, 4)}</Text></Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}
              {all.length === 0 ? (
                <View style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.3)' }}><Text style={{ textAlign: 'center', color: 'rgba(255,255,255,.7)', fontSize: 12, lineHeight: 18 }}>No spending yet. Fill in Add Spending above and tap Add.</Text></View>
              ) : null}
              {all.length > 0 && shown.length === 0 ? <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12.5, textAlign: 'center', marginTop: 14 }}>{'No spending in ' + mLabel(curM) + '.'}</Text> : null}
              {shown.length > 1 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, fontWeight: '700' }}>Sort by</Text>
                  {([['new', 'Newest'], ['old', 'Oldest'], ['add', 'Added']] as ['new' | 'old' | 'add', string][]).map(([k, t]) => (
                    <Pressable key={k} onPress={() => setSortBy(k)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: sortBy === k ? '#ffc46b' : 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: sortBy === k ? '#ffc46b' : 'rgba(255,255,255,.22)' }}>
                      <Text style={{ color: sortBy === k ? '#0b1030' : W, fontSize: 12, fontWeight: '700' }}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            <View style={{ marginTop: 6 }}>
              {vis.map((p, i) => (
              <React.Fragment key={p.id}>
                <View style={{ paddingVertical: 9, borderBottomWidth: i === vis.length - 1 ? 0 : 1, borderBottomColor: 'rgba(255,255,255,.1)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colorOf(p.cat) }} />
                    <Pressable disabled={p.src === 'record'} style={{ flex: 1, minWidth: 0 }} onPress={() => { if (remId === p.id) setRemId(0); else { setRemId(p.id); setRemF({ name: p.name || '', amt: String(p.amt), date: p.date || todayStr(), cat: p.cat, note: p.note || '', acc: p.acc || 0 }); } }}>
                      <Text style={{ color: W, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>{p.name}</Text>
                      <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 12, marginTop: 1 }} numberOfLines={1}>{p.cat + ' · ' + dateText(p.date)}</Text>
                      {p.note ? <Text style={{ color: '#ffd593', fontSize: 12, marginTop: 1 }} numberOfLines={2}>{p.note}</Text> : null}
                    </Pressable>
                    <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{cs()}{money(p.amt)}</Text>
                    {p.src === 'record' ? <View style={{ width: 34 }} /> : <Pressable accessibilityLabel="Delete" onPress={() => confirmDelete('this spending', () => setD({ ...d, spends: d.spends.filter((x) => x.id !== p.id) }))} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ff9aa9', fontSize: 14 }}>✕</Text></Pressable>}
                  </View>
                  {remId === p.id ? (
                    <View style={{ marginTop: 8 }}>
                      <DateField value={remF.date} onChange={(v: string) => setRemF({ ...remF, date: v })} />
                      <Inp style={{ marginTop: 8 }} value={remF.name} onChangeText={(v: string) => setRemF({ ...remF, name: v })} placeholder="What did you buy?" />
                      <Inp form="spendEdit" need="an amount" style={{ marginTop: 8 }} value={remF.amt} onChangeText={(v: string) => setRemF({ ...remF, amt: v })} keyboardType="decimal-pad" placeholder={'Amount (' + cu() + ')'} />
                      {p.cat !== 'Savings' ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                          {cats.filter((x) => x[0] !== 'Savings').map(([n, c]) => <Chip key={n} t={n} on={remF.cat === n} c={c} onPress={() => setRemF({ ...remF, cat: n })} />)}
                        </View>
                      ) : null}
                      {accD.accs.length ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                          <Chip t="Not linked" on={!remF.acc} onPress={() => setRemF({ ...remF, acc: 0 })} />
                          {accD.accs.filter((a) => a.g !== 'loan').map((a) => <Chip key={a.id} t={a.name} on={remF.acc === a.id} c={groupOf(a.g).c} onPress={() => setRemF({ ...remF, acc: remF.acc === a.id ? 0 : a.id })} />)}
                        </View>
                      ) : null}
                      <Inp style={{ marginTop: 8 }} value={remF.note} onChangeText={(v: string) => setRemF({ ...remF, note: v })} placeholder="Remark (optional)" />
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                        <Pressable onPress={() => setRemId(0)} style={{ flex: 1, paddingVertical: 11, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center' }}><Text style={{ color: W, fontWeight: '700', fontSize: 13 }}>Cancel</Text></Pressable>
                        <Pressable onPress={() => {
                          const n = pn(remF.amt); if (!(n > 0)) { tryForm('spendEdit'); return; }
                          const v = remF.note.trim();
                          setD({ ...d, spends: d.spends.map((x) => x.id === p.id ? { ...x, name: remF.name.trim() || x.name, amt: n, date: remF.date || x.date, cat: p.cat === 'Savings' ? 'Savings' : remF.cat, note: v || undefined, acc: remF.acc && accD.accs.some((a) => a.id === remF.acc) ? remF.acc : undefined } : x) });
                          setRemId(0);
                        }} style={{ flex: 1, paddingVertical: 11, borderRadius: 14, backgroundColor: '#ffc46b', alignItems: 'center' }}><Text style={{ color: '#0b1030', fontWeight: '800', fontSize: 13 }}>Save</Text></Pressable>
                      </View>
                    </View>
                  ) : null}
                </View>
              </React.Fragment>
              ))}
              {shown.length > 6 ? (
                <Pressable onPress={() => setFull(full === curM ? '' : curM)} style={{ alignSelf: 'center', marginTop: 10, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,.3)', backgroundColor: 'rgba(255,255,255,.08)' }}>
                  <Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>{full === curM ? 'Show less' : 'Show all ' + shown.length}</Text>
                </Pressable>
              ) : null}
              {all.length > 0 ? <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 8 }}>Tap an item to change anything in it.</Text> : null}
            </View>
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
              {[...cats.filter((x) => x[0] !== 'Savings'), ...(vmode === 'yes' ? [[VEH_CAT, VEH_COLOR] as [string, string]] : [])].map(([n, c]) => {
                const t = all.filter((p) => p.cat === n && (p.date || '').slice(0, 7) === ym).reduce((a, p) => a + p.amt, 0);
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
                    {editing ? (<>
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 }}>
                        <Inp style={{ flex: 1 }} autoFocus form="limit" need="a monthly limit" keyboardType="decimal-pad" value={limVal} onChangeText={setLimVal} placeholder={n + ' limit per month (' + cu() + ')'} onSubmitEditing={() => saveLimit(n)} />
                        <Pressable onPress={() => saveLimit(n)}><LinearGradient colors={WARM} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999 }}><Text style={{ color: '#2a1030', fontSize: 12, fontWeight: '800' }}>Save</Text></LinearGradient></Pressable>
                        <Pressable accessibilityLabel="Cancel" onPress={() => { setLimKey(''); setLimVal(''); }} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 14 }}>✕</Text></Pressable>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 18, marginTop: 8 }}>
                        {lim > 0 ? <Pressable onPress={() => removeLimit(n)}><Text style={{ color: '#ff9aa9', fontSize: 12, fontWeight: '800' }}>Remove limit</Text></Pressable> : null}
                        {n !== 'Other' ? <Pressable onPress={() => removeCat(n)}><Text style={{ color: '#ff9aa9', fontSize: 12, fontWeight: '800' }}>Delete category</Text></Pressable> : null}
                      </View>
                    </>) : (
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>Income Trend</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 4 }}>Last 6 months · tap to open</Text></View>
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
