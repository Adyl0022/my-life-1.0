import React, { useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../components/Txt';
import { Inp, DateField, todayStr, W } from '../components/Ui';
import { SheetFrame, Lab, Sections, BigBtn, chip, dim } from '../components/ColUi';
import { RecordPage } from '../components/RecordHubUi';
import { useStored } from '../lib/store';
import { confirmDelete } from '../lib/dialog';
import { pn, tryForm } from '../lib/num';
import { cs, useRegion } from '../lib/region';
import { ACC_EMPTY, GROUPS, groupOf, isLiab, balanceOf, linesOf, totals, type Acc, type AccData, type AccGroup, type AccSpend, type Move } from '../lib/accounts';

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
type Ctx = { data: AccData; setData: (v: AccData) => void; spends: Spends };
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
    <SheetFrame noNote title={edit ? 'Edit account' : 'Add account'} sub="Where your money is kept, or what you owe" onClose={onClose}>
      <Sections>
        <Lab t="TYPE" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GROUPS.map((x) => (<Pressable key={x.k} onPress={() => { buzz(); setG(x.k); }} accessibilityLabel={x.t}><View style={chip(g === x.k, x.c)}><Text style={{ color: W, fontSize: 13, fontWeight: g === x.k ? '800' : '600' }}>{x.t}</Text></View></Pressable>))}
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
  const { data, setData, spends } = ctx; const accs = data.accs;
  const first = accs.find((a) => a.id === mv.acc) || accs[0];
  const [from, setFrom] = useState<number>(mv.mode === 'transfer' ? (first && !isLiab(first) ? first.id : (accs.find((a) => !isLiab(a)) || first).id) : 0);
  const [to, setTo] = useState<number>(mv.mode === 'transfer' ? (first && isLiab(first) ? first.id : ((accs.find((a) => a.id !== (first || { id: 0 }).id) || first).id)) : mv.mode === 'deposit' ? (first && !isLiab(first) ? first.id : (accs.find((a) => !isLiab(a)) || first).id) : first.id);
  const [amt, setAmt] = useState(''); const [date, setDate] = useState(todayStr()); const [note, setNote] = useState(''); const [tried, setTried] = useState(false);
  const target = accs.find((a) => a.id === to); const cur = target ? balanceOf(target, data, spends) : 0;
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
    <SheetFrame noNote title={title} sub={mv.mode === 'transfer' ? 'Move money between your accounts' : mv.mode === 'deposit' ? 'Salary, a gift, or any money you receive' : 'Match it to what your bank or wallet shows'} onClose={onClose}>
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
  const { data, setData, spends } = ctx; const a = data.accs.find((x) => x.id === id); const [all, setAll] = useState(false);
  if (!a) return null;
  const grp = groupOf(a.g); const liab = grp.liab; const b = balanceOf(a, data, spends); const ls = linesOf(a, data, spends); const shown = all ? ls : ls.slice(0, 8);
  return (
    <SheetFrame noNote title={a.name} sub={grp.t + ' · as of ' + nice(a.since)} onClose={onClose}>
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
            <Text style={{ color: dim, fontSize: 11.5, marginTop: 2 }}>{nice(l.date) + (l.kind === 'spend' ? ' · Spending Tracker' : '')}</Text>
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
  const [data, setData] = useStored<AccData>('ml_accounts', ACC_EMPTY);
  const [fin] = useStored<{ spends?: Spends }>('ml_finance', {});
  const spends = (fin && fin.spends) || [];
  const ctx: Ctx = { data, setData, spends };
  const [form, setForm] = useState<null | { edit?: Acc }>(null); const [mv, setMv] = useState<null | MoveMode>(null); const [open, setOpen] = useState(0);
  const t = totals(data, spends);
  return (
    <RecordPage title="My Accounts" sub="Where your money is, and what you owe">
      <View style={{ marginTop: 16, padding: 16, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', overflow: 'hidden' }}>
        <LinearGradient colors={['rgba(124,156,255,.4)', 'rgba(183,148,255,.3)', 'rgba(255,180,94,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2 }}>TOTAL MONEY</Text>
        <Text style={{ color: t.total < 0 ? PINK : '#fff', fontSize: 32, fontWeight: '800', marginTop: 4 }}>{(t.total < 0 ? '-' : '') + cs() + money(Math.abs(t.total))}</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <View style={{ flex: 1, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.1)' }}><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11 }}>Assets</Text><Text style={{ color: '#9fb6ff', fontSize: 16, fontWeight: '800', marginTop: 2 }}>{cs() + money(t.assets)}</Text></View>
          <View style={{ flex: 1, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.1)' }}><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11 }}>Liabilities</Text><Text style={{ color: PINK, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{cs() + money(t.liab)}</Text></View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <Act basis="28%" t="+ Add account" c="#8ea8ff" onPress={() => setForm({})} />
        {data.accs.length > 1 ? <Act basis="28%" t="Transfer" c={BLUE} onPress={() => setMv({ mode: 'transfer' })} /> : null}
        {data.accs.some((a) => !isLiab(a)) ? <Act basis="28%" t="Money in" c="#5ee7b5" onPress={() => setMv({ mode: 'deposit' })} /> : null}
      </View>
      {data.accs.length === 0 ? (
        <View style={{ marginTop: 22, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', backgroundColor: 'rgba(255,255,255,.05)' }}>
          <Text style={{ color: W, fontSize: 16, fontWeight: '800' }}>Add your first account</Text>
          <Text style={{ color: dim, fontSize: 13, lineHeight: 19, marginTop: 6 }}>Add your cash, bank, wallet and savings, and any card or loan you owe on. Then choose an account when you log spending, and its balance goes up and down by itself.</Text>
        </View>
      ) : null}
      {GROUPS.map((g) => {
        const list = data.accs.filter((a) => a.g === g.k); if (!list.length) return null;
        const sub = list.reduce((s, a) => s + balanceOf(a, data, spends), 0);
        return (
          <View key={g.k} style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 8 }}>
              <Text style={{ color: g.c, fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2 }}>{g.plural.toUpperCase()}</Text>
              <Text style={{ color: g.liab ? PINK : 'rgba(255,255,255,.75)', fontSize: 12.5, fontWeight: '800' }}>{cs() + money(sub)}</Text>
            </View>
            {list.map((a) => {
              const b = balanceOf(a, data, spends);
              return (
                <Tap key={a.id} onPress={() => setOpen(a.id)} label={'Open ' + a.name} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', overflow: 'hidden' }}>
                    <LinearGradient colors={['rgba(255,255,255,.12)', 'rgba(255,255,255,.04)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
                    <View style={{ width: 8, alignSelf: 'stretch', borderRadius: 4, backgroundColor: g.c }} />
                    <Text numberOfLines={1} style={{ flex: 1, color: W, fontSize: 15, fontWeight: '700' }}>{a.name}</Text>
                    <Text style={{ color: g.liab ? PINK : '#9fb6ff', fontSize: 15, fontWeight: '800' }}>{cs() + money(b)}</Text>
                  </View>
                </Tap>
              );
            })}
          </View>
        );
      })}
      <Text style={{ color: dim, fontSize: 11.5, lineHeight: 17, marginTop: 20 }}>Balances are worked out on your phone from what you enter and from the spending you link to an account. They are saved with your My Life 1.0 data and synced to your account like your other finance entries. My Life 1.0 never connects to your bank.</Text>
      {form ? <AccountForm ctx={ctx} edit={form.edit} onClose={() => setForm(null)} /> : null}
      {mv ? <MoveSheet ctx={ctx} mv={mv} onClose={() => setMv(null)} /> : null}
      {open ? <Detail ctx={ctx} id={open} onClose={() => setOpen(0)} onEdit={() => setForm({ edit: data.accs.find((a) => a.id === open) })} onMove={setMv} /> : null}
    </RecordPage>
  );
}
