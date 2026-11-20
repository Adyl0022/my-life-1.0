import React, { useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../components/Txt';
import { Inp, DateField, todayStr, W } from '../components/Ui';
import { SheetFrame, Lab, Sections, BigBtn, chip, dim } from '../components/ColUi';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Glass } from '../components/Glass';
import { Blob } from '../components/Bg';
import { FinArt } from '../components/FinArt';
import { TOP } from '../lib/layout';
import { useStored } from '../lib/store';
import { confirmDelete } from '../lib/dialog';
import { pn, tryForm } from '../lib/num';
import { cs, useRegion } from '../lib/region';
import { DEBT_EMPTY, DebtData, remaining } from '../lib/debts';
import { ACC_EMPTY, type AccDebt, type Feeds, incomeFeed, commitTotal, GROUPS, groupOf, isLiab, balanceOf, linesOf, totals, type Acc, type AccData, type AccGroup, type AccSpend, type Move } from '../lib/accounts';

const money = (n: number) => n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const nice = (v: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? Number(m[3]) + ' ' + MON[Number(m[2]) - 1] + ' ' + m[1] : ''; };
const buzz = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
const BLUE = '#7c9cff', PINK = '#ff8fab';

/** A button that shrinks a little and vibrates when pressed. */
const Tap = ({ onPress, children, style, label }: { onPress: () => void; children: React.ReactNode; style?: any; label?: string }) => (
  <Pressable onPress={() => { buzz(); onPress(); }} accessibilityLabel={label} style={({ pressed }) => [style, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}>{children}</Pressable>
);
const Act = ({ t, onPress, c, basis }: { t: string; onPress: () => void; c?: string; basis?: string }) => (
  <Tap onPress={onPress} label={t} style={{ flexGrow: 1, flexBasis: (basis || '46%') as any, paddingVertical: 11, borderRadius: 14, alignItems: 'center', backgroundColor: c ? c + '30' : 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: c || 'rgba(255,255,255,.2)' }}>
    <Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>{t}</Text>
  </Tap>
);
const Err = ({ t }: { t: string }) => <Text style={{ color: '#ff8fa3', fontSize: 12, fontWeight: '700', marginTop: 6 }}>{t}</Text>;

type Spends = AccSpend[];
type Ctx = { data: AccData; setData: (v: AccData) => void; spends: Spends; feeds: Feeds };
type MoveMode = { mode: 'transfer' | 'deposit' | 'adjust'; acc?: number };

// ---------- Add or edit an account ----------
function AccountForm({ ctx, edit, onClose }: { ctx: Ctx; edit?: Acc; onClose: () => void }) {
  const { data, setData } = ctx;
  const [name, setName] = useState(edit ? edit.name : ''); const [g, setG] = useState<AccGroup>(edit ? edit.g : 'bank');
  const [start, setStart] = useState(edit ? String(edit.start || '') : ''); const [since, setSince] = useState(edit ? edit.since : todayStr()); const [tried, setTried] = useState(false);
  const liab = groupOf(g).liab; const n = start.trim() === '' ? 0 : pn(start);
  const save = () => {
    setTried(true); if (!name.trim()) return; if (start.trim() !== '' && !(n >= 0)) { tryForm('acc'); return; }
    if (edit) setData({ ...data, accs: data.accs.map((a) => a.id === edit.id ? { ...a, name: name.trim(), g, start: n, since } : a) });
    else setData({ ...data, accs: [...data.accs, { id: data.nextId, name: name.trim(), g, start: n, since }], nextId: data.nextId + 1 });
    onClose();
  };
  return (
    <SheetFrame noNote finance title={edit ? 'Edit account' : 'Add account'} sub="Where your money is kept, or what you owe" onClose={onClose}>
      <Sections>
        <Lab t="TYPE" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GROUPS.filter((x) => x.k !== 'loan' || (edit && edit.g === 'loan')).map((x) => (<Pressable key={x.k} onPress={() => { buzz(); setG(x.k); }} accessibilityLabel={x.t}><View style={chip(g === x.k, x.c)}><Text style={{ color: W, fontSize: 13, fontWeight: g === x.k ? '800' : '600' }}>{x.t}</Text></View></Pressable>))}
        </View>
        <Text style={{ color: dim, fontSize: 12, marginTop: 8 }}>{groupOf(g).hint}</Text>
        <Lab t="NAME" />
        <Inp value={name} onChangeText={setName} placeholder="e.g. Main bank, Wallet app, Card 1" maxLength={30} />
        {tried && !name.trim() ? <Err t="Please enter a name." /> : null}
        <Lab t={liab ? 'HOW MUCH YOU OWE' : 'HOW MUCH IS IN IT'} />
        <Inp form="acc" need="an amount" zeroOk value={start} onChangeText={setStart} keyboardType="decimal-pad" placeholder={liab ? 'Amount owed in ' + cs() + ' (0 if none)' : 'Balance in ' + cs() + ' (0 if empty)'} />
        <Lab t="AS OF" />
        <DateField value={since} onChange={setSince} />
        <Text style={{ color: dim, fontSize: 11.5, marginTop: 8, lineHeight: 16 }}>{'The balance above is how much it was on this date. Spending, money in and transfers after it change the balance by themselves. Saved with your account data and synced like your other finance entries.'}</Text>
        <BigBtn t={edit ? 'Save changes' : 'Add account'} g={['#8ea8ff', '#b794ff']} onPress={save} />
      </Sections>
    </SheetFrame>
  );
}

// ---------- Transfer, money in, or set the balance ----------
function MoveSheet({ ctx, mv, onClose }: { ctx: Ctx; mv: MoveMode; onClose: () => void }) {
  const { data, setData, spends, feeds } = ctx; const accs = data.accs;
  const first = accs.find((a) => a.id === mv.acc) || accs[0];
  const [from, setFrom] = useState<number>(mv.mode === 'transfer' ? (first && !isLiab(first) ? first.id : (accs.find((a) => !isLiab(a)) || first).id) : 0);
  const [to, setTo] = useState<number>(mv.mode === 'transfer' ? (first && isLiab(first) ? first.id : ((accs.find((a) => a.id !== (first || { id: 0 }).id) || first).id)) : mv.mode === 'deposit' ? (first && !isLiab(first) ? first.id : (accs.find((a) => !isLiab(a)) || first).id) : first.id);
  const [amt, setAmt] = useState(''); const [date, setDate] = useState(todayStr()); const [note, setNote] = useState(''); const [tried, setTried] = useState(false);
  const target = accs.find((a) => a.id === to); const cur = target ? balanceOf(target, data, spends, feeds) : 0;
  const n = pn(amt);
  const title = mv.mode === 'transfer' ? (target && isLiab(target) ? 'Pay off' : 'Transfer') : mv.mode === 'deposit' ? 'Money in' : 'Set balance';
  const pickChips = (sel: number, set: (id: number) => void, skip?: number, only?: (a: Acc) => boolean) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {accs.filter((a) => a.id !== skip && (!only || only(a))).map((a) => (<Pressable key={a.id} onPress={() => { buzz(); set(a.id); }} accessibilityLabel={a.name}><View style={chip(sel === a.id, groupOf(a.g).c)}><Text style={{ color: W, fontSize: 13, fontWeight: sel === a.id ? '800' : '600' }}>{a.name}</Text></View></Pressable>))}
    </View>
  );
  const save = () => {
    setTried(true);
    if (mv.mode === 'adjust') {
      if (!(n >= 0)) { tryForm('mov'); return; }
      const delta = Math.round((n - cur) * 100) / 100; if (delta !== 0) setData({ ...data, moves: [...data.moves, { id: data.nextId, date, kind: 'adjust', to, amt: delta, note: note.trim() || undefined }], nextId: data.nextId + 1 });
      onClose(); return;
    }
    if (!(n > 0)) { tryForm('mov'); return; }
    if (mv.mode === 'transfer' && (!from || from === to)) return;
    const m: Move = mv.mode === 'deposit' ? { id: data.nextId, date, kind: 'deposit', to, amt: n, note: note.trim() || undefined } : { id: data.nextId, date, kind: 'transfer', from, to, amt: n, note: note.trim() || undefined };
    setData({ ...data, moves: [...data.moves, m], nextId: data.nextId + 1 }); onClose();
  };
  return (
    <SheetFrame noNote finance title={title} sub={mv.mode === 'transfer' ? 'Move money between your accounts' : mv.mode === 'deposit' ? 'Salary, a gift, or any money you receive' : 'Match it to what your bank or wallet shows'} onClose={onClose}>
      <Sections>
        {mv.mode === 'transfer' ? (<><Lab t="FROM" />{pickChips(from, (id) => { setFrom(id); if (id === to) { const o = accs.find((a) => a.id !== id); if (o) setTo(o.id); } })}</>) : null}
        <Lab t={mv.mode === 'transfer' ? 'TO' : 'ACCOUNT'} />
        {pickChips(to, setTo, mv.mode === 'transfer' ? from : undefined, mv.mode === 'deposit' ? (a) => !isLiab(a) : undefined)}
        {mv.mode === 'transfer' && target && isLiab(target) ? <Text style={{ color: dim, fontSize: 12, marginTop: 8 }}>This lowers what you owe on {target.name}.</Text> : null}
        {mv.mode === 'transfer' && tried && from === to ? <Err t="Pick two different accounts." /> : null}
        <Lab t={mv.mode === 'adjust' ? 'BALANCE NOW' : 'AMOUNT'} />
        <Inp form="mov" need="an amount" zeroOk={mv.mode === 'adjust'} value={amt} onChangeText={setAmt} keyboardType="decimal-pad" placeholder={mv.mode === 'adjust' ? 'What it should be, in ' + cs() : 'Amount in ' + cs()} />
        {mv.mode === 'adjust' && target ? <Text style={{ color: dim, fontSize: 12, marginTop: 8 }}>{'My Life 1.0 shows ' + cs() + money(cur) + ' now.' + (amt && n >= 0 ? ' This ' + (n - cur >= 0 ? 'adds ' : 'takes off ') + cs() + money(Math.abs(n - cur)) + '.' : '')}</Text> : null}
        <Lab t="DATE" />
        <DateField value={date} onChange={setDate} />
        <Lab t="NOTE (OPTIONAL)" />
        <Inp value={note} onChangeText={setNote} placeholder={mv.mode === 'deposit' ? 'e.g. Salary' : mv.mode === 'adjust' ? 'e.g. Bank fee' : 'e.g. Card payment'} maxLength={40} />
        <BigBtn t={mv.mode === 'adjust' ? 'Set balance' : mv.mode === 'deposit' ? 'Add money' : title} g={['#8ea8ff', '#b794ff']} onPress={save} />
      </Sections>
    </SheetFrame>
  );
}

// ---------- One account ----------
function Detail({ ctx, id, onClose, onEdit, onMove }: { ctx: Ctx; id: number; onClose: () => void; onEdit: () => void; onMove: (m: MoveMode) => void }) {
  const { data, setData, spends, feeds } = ctx; const a = data.accs.find((x) => x.id === id); const [all, setAll] = useState(false);
  if (!a) return null;
  const grp = groupOf(a.g); const liab = grp.liab; const b = balanceOf(a, data, spends, feeds); const ls = linesOf(a, data, spends, feeds); const shown = all ? ls : ls.slice(0, 8);
  return (
    <SheetFrame noNote finance title={a.name} sub={grp.t + ' · as of ' + nice(a.since)} onClose={onClose}>
      <View style={{ marginTop: 14, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', overflow: 'hidden' }}>
        <LinearGradient colors={[grp.c + '55', 'rgba(255,255,255,.06)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2 }}>{liab ? 'YOU OWE' : 'BALANCE'}</Text>
        <Text style={{ color: liab ? PINK : '#fff', fontSize: 32, fontWeight: '800', marginTop: 4 }}>{cs() + money(b)}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        {liab ? <Act t="Pay off" c={PINK} onPress={() => { onClose(); onMove({ mode: 'transfer', acc: a.id }); }} /> : <Act t="Money in" c="#5ee7b5" onPress={() => { onClose(); onMove({ mode: 'deposit', acc: a.id }); }} />}
        {!liab && data.accs.length > 1 ? <Act t="Transfer" c={BLUE} onPress={() => { onClose(); onMove({ mode: 'transfer', acc: a.id }); }} /> : null}
        <Act t="Set balance" onPress={() => { onClose(); onMove({ mode: 'adjust', acc: a.id }); }} />
        <Act t="Edit" onPress={() => { onClose(); onEdit(); }} />
      </View>
      <Lab t="WHAT CHANGED" />
      {ls.length === 0 ? <Text style={{ color: dim, fontSize: 13, lineHeight: 19 }}>Nothing yet. When you log spending and choose this account, or add money or a transfer, it shows here.</Text> : null}
      {shown.map((l) => (
        <View key={l.key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.08)', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: W, fontSize: 14, fontWeight: '700' }}>{l.text}</Text>
            <Text style={{ color: dim, fontSize: 11.5, marginTop: 2 }}>{nice(l.date) + (l.kind === 'spend' ? ' · Spending Tracker' : l.kind === 'debt' ? ' · Commitments' : l.kind === 'income' ? ' · My Finance income' : '')}</Text>
          </View>
          <Text style={{ color: (liab ? l.delta > 0 : l.delta < 0) ? PINK : '#5ee7b5', fontSize: 14, fontWeight: '800' }}>{(l.delta > 0 ? '+' : '-') + cs() + money(Math.abs(l.delta))}</Text>
          {l.kind === 'move' ? <Pressable onPress={() => { buzz(); confirmDelete('this entry', () => setData({ ...data, moves: data.moves.filter((m) => m.id !== l.ref) })); }} hitSlop={8} accessibilityLabel="Delete entry"><Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 18, fontWeight: '800' }}>×</Text></Pressable> : null}
        </View>
      ))}
      {ls.length > 8 ? <Tap onPress={() => setAll(!all)} style={{ marginTop: 8, alignSelf: 'flex-start' }}><Text style={{ color: '#8fe9e2', fontSize: 13, fontWeight: '800' }}>{all ? 'Show fewer' : 'Show all ' + ls.length}</Text></Tap> : null}
      <Tap onPress={() => confirmDelete(a.name, () => { setData({ ...data, accs: data.accs.filter((x) => x.id !== a.id), moves: data.moves.filter((m) => m.from !== a.id && m.to !== a.id) }); onClose(); }, { message: 'The account and its money movements are removed. Your spending stays, but it is no longer linked to an account.' })} style={{ marginTop: 22, alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,143,163,.5)' }}>
        <Text style={{ color: '#ff8fa3', fontSize: 13.5, fontWeight: '800' }}>Delete account</Text>
      </Tap>
    </SheetFrame>
  );
}

export default function Accounts() {
  useRegion();
  const router = useRouter();
  const [data, setData] = useStored<AccData>('ml_accounts', ACC_EMPTY);
  const [fin] = useStored<{ spends?: Spends; inc?: Record<string, Record<string, number>>; incAcc?: Record<string, { acc: number; date: string; name: string }> }>('ml_finance', {});
  const spends = (fin && fin.spends) || [];
  const [dbt] = useStored<DebtData>('ml_debts', DEBT_EMPTY);
  const debts = (((dbt && dbt.debts) || []) as unknown) as AccDebt[];
  const feeds: Feeds = { debts, incomes: incomeFeed((fin && fin.inc) || {}, fin && fin.incAcc) };
  const ctx: Ctx = { data, setData, spends, feeds };
  const [form, setForm] = useState<null | { edit?: Acc }>(null); const [mv, setMv] = useState<null | MoveMode>(null); const [open, setOpen] = useState(0);
  const cms = ((dbt && dbt.debts) || []).filter((x) => !x.fixed && remaining(x) > 0);
  const t = totals(data, spends, commitTotal((dbt && dbt.debts) || []), feeds); const [fold, setFold] = useStored<string[]>('ml_acc_fold', []);
  const Stat = ({ l, v, vc }: { l: string; v: string; vc?: string }) => (
    <View style={{ flex: 1, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,.08)' }}>
      <Text style={{ color: 'rgba(255,255,255,.68)', fontSize: 10.5 }}>{l}</Text><Text style={{ color: vc || W, fontSize: 14.5, fontWeight: '800', marginTop: 2 }}>{v}</Text>
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: '#1a1030' }}>
      <LinearGradient colors={['#1a1030', '#2a1747', '#3a1d3d']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(255,196,107,.34)" style={{ right: -100, top: -40 }} />
      <Blob size={340} color="rgba(183,148,255,.3)" style={{ left: -120, bottom: 0 }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}><FinArt /></View>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 60 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 22, fontWeight: '800', marginTop: -2 }}>‹</Text></Glass></Pressable>
            <Text style={{ flex: 1, color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>My Accounts</Text>
            <Glass radius={999} style={{ paddingVertical: 9, paddingHorizontal: 14 }}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{data.accs.length + (data.accs.length === 1 ? ' account' : ' accounts')}</Text></Glass>
          </View>

          <Glass radius={24} style={{ marginTop: 14, padding: 16 }}>
            <LinearGradient colors={['rgba(255,196,107,.4)', 'rgba(255,143,171,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
            <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2 }}>TOTAL MONEY</Text>
            <Text style={{ color: t.total < 0 ? PINK : W, fontSize: 30, fontWeight: '800', marginTop: 4 }}>{(t.total < 0 ? '-' : '') + cs() + money(Math.abs(t.total))}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Stat l="Assets" v={cs() + money(t.assets)} vc="#9fb6ff" /><Stat l="Liabilities" v={cs() + money(t.liab)} vc={PINK} />
            </View>
          </Glass>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Tap onPress={() => setForm({})} label="Add account" style={{ flex: 1.2 }}>
              <LinearGradient colors={['#ffc46b', '#ff8fab']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#2a1030', fontSize: 14, fontWeight: '800' }}>+ Add account</Text></LinearGradient>
            </Tap>
            {data.accs.length > 1 ? <Tap onPress={() => setMv({ mode: 'transfer' })} label="Transfer" style={{ flex: 1, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' }}><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>Transfer</Text></Tap> : null}
            {data.accs.some((a) => !isLiab(a)) ? <Tap onPress={() => setMv({ mode: 'deposit' })} label="Money in" style={{ flex: 1, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' }}><Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>Money in</Text></Tap> : null}
          </View>

          {data.accs.length === 0 ? (
            <Glass radius={24} style={{ marginTop: 12, padding: 16 }}>
              <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Add your first account</Text>
              <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12.5, lineHeight: 18, marginTop: 6 }}>Add your cash, bank, wallet and savings, and any card or loan you owe on. Then choose an account when you log spending, and its balance goes up and down by itself.</Text>
            </Glass>
          ) : null}

          {[{ title: 'MONEY YOU HAVE', liab: false, tint: ['rgba(124,156,255,.22)', 'rgba(94,231,181,.1)'] as [string, string], sum: t.assets }, { title: 'WHAT YOU OWE', liab: true, tint: ['rgba(255,143,171,.22)', 'rgba(183,148,255,.12)'] as [string, string], sum: t.liab }].map((sec) => {
            const gs = GROUPS.filter((g) => g.liab === sec.liab && data.accs.some((a) => a.g === g.k)); const showCm = sec.liab && cms.length > 0; if (!gs.length && !showCm) return null;
            return (
              <Glass key={sec.title} radius={24} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
                <LinearGradient colors={sec.tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 11.5, fontWeight: '800', letterSpacing: 1.3 }}>{sec.title}</Text>
                  <Text style={{ color: sec.liab ? PINK : '#9fb6ff', fontSize: 15, fontWeight: '800' }}>{cs() + money(sec.sum)}</Text>
                </View>
                {gs.map((g) => {
                  const list = data.accs.filter((a) => a.g === g.k); const sub = list.reduce((x, a) => x + balanceOf(a, data, spends, feeds), 0); const shut = fold.includes(g.k);
                  return (
                    <View key={g.k} style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.12)' }}>
                      <Tap onPress={() => setFold(shut ? fold.filter((x) => x !== g.k) : [...fold, g.k])} label={(shut ? 'Open ' : 'Close ') + g.plural} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, paddingBottom: shut ? 2 : 4 }}>
                        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: g.c }} />
                        <Text style={{ flex: 1, color: g.c, fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2 }}>{g.plural.toUpperCase() + (shut ? '  ·  ' + list.length : '')}</Text>
                        {list.length > 1 || shut ? <Text style={{ color: g.liab ? PINK : 'rgba(255,255,255,.75)', fontSize: 12.5, fontWeight: '800' }}>{cs() + money(sub)}</Text> : null}
                        <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 15, width: 14, textAlign: 'center' }}>{shut ? '▸' : '▾'}</Text>
                      </Tap>
                      {shut ? null : list.map((a) => {
                        const b = balanceOf(a, data, spends, feeds);
                        return (
                          <Tap key={a.id} onPress={() => setOpen(a.id)} label={'Open ' + a.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingLeft: 17 }}>
                            <Text numberOfLines={1} style={{ flex: 1, color: W, fontSize: 15, fontWeight: '600' }}>{a.name}</Text>
                            <Text style={{ color: g.liab ? PINK : W, fontSize: 15, fontWeight: '800' }}>{cs() + money(b)}</Text>
                            <Text style={{ color: 'rgba(255,255,255,.4)', fontSize: 17 }}>›</Text>
                          </Tap>
                        );
                      })}
                    </View>
                  );
                })}
                {showCm ? (
                  <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.12)' }}>
                    <Tap onPress={() => setFold(fold.includes('commit') ? fold.filter((x) => x !== 'commit') : [...fold, 'commit'])} label={(fold.includes('commit') ? 'Open ' : 'Close ') + 'Commitments'} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, paddingBottom: 4 }}>
                      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#b794ff' }} />
                      <Text style={{ flex: 1, color: '#b794ff', fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2 }}>{'COMMITMENTS' + (fold.includes('commit') ? '  ·  ' + cms.length : '')}</Text>
                      {cms.length > 1 || fold.includes('commit') ? <Text style={{ color: PINK, fontSize: 12.5, fontWeight: '800' }}>{cs() + money(commitTotal(cms))}</Text> : null}
                      <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 15, width: 14, textAlign: 'center' }}>{fold.includes('commit') ? '▸' : '▾'}</Text>
                    </Tap>
                    {fold.includes('commit') ? null : (<>
                      {cms.map((x) => (
                        <Tap key={x.id} onPress={() => router.push('/finance' as any)} label={'Open ' + x.name + ' in My Finance'} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingLeft: 17 }}>
                          <Text numberOfLines={1} style={{ flex: 1, color: W, fontSize: 15, fontWeight: '600' }}>{x.name}</Text>
                          <Text style={{ color: PINK, fontSize: 15, fontWeight: '800' }}>{cs() + money(remaining(x))}</Text>
                          <Text style={{ color: 'rgba(255,255,255,.4)', fontSize: 17 }}>›</Text>
                        </Tap>
                      ))}
                      <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11.5, lineHeight: 16, paddingLeft: 17, paddingBottom: 4 }}>Taken from Commitments in My Finance. Pay them there and the balance goes down here.</Text>
                    </>)}
                  </View>
                ) : null}
              </Glass>
            );
          })}
          <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11.5, lineHeight: 17, marginTop: 16 }}>Balances are worked out on your phone from what you enter and from the spending you link to an account. They are saved with your My Life 1.0 data and synced to your account like your other finance entries. My Life 1.0 never connects to your bank.</Text>
        </ScrollView>
      </SafeAreaView>
      {form ? <AccountForm ctx={ctx} edit={form.edit} onClose={() => setForm(null)} /> : null}
      {mv ? <MoveSheet ctx={ctx} mv={mv} onClose={() => setMv(null)} /> : null}
      {open ? <Detail ctx={ctx} id={open} onClose={() => setOpen(0)} onEdit={() => setForm({ edit: data.accs.find((a) => a.id === open) })} onMove={setMv} /> : null}
    </View>
  );
}
