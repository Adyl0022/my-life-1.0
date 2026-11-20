import React, { useMemo, useState } from 'react';
import { View, Pressable, Animated, Linking, Share } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../components/Txt';
import { RecordPage, Intro } from '../components/RecordHubUi';
import { SearchField } from '../components/Shine';
import { Inp, DateField, W } from '../components/Ui';
import { ItemRow, Tile, Sums, Empty, BigBtn, SheetFrame, Detail, Lab, chip, dim } from '../components/ColUi';
import { useTabSlide, useTabPill, SlidePills } from '../components/TabSlide';
import { useStored } from '../lib/store';
import { confirmDelete } from '../lib/dialog';
import { tryForm, pn, numberError } from '../lib/num';
import { validDate } from '../lib/documents';
import { ColArt } from '../components/ColArt';
import { ACC, BTN, EMPTY_COL, dueOf, dmy, num, rm, today, politeAsk, paidOf, leftOf, type ColStore, type Loan } from '../lib/collection';

const g = BTN;
const TABS = [['lent', 'Lent'], ['borrowed', 'Borrowed'], ['done', 'Done']] as const;
type Form = Omit<Loan, 'id'> & { id: number; noDue: boolean };
const blank = (dir: 'lent' | 'borrowed'): Form => ({ id: 0, dir, what: 'money', who: '', title: '', amount: '', date: today(), due: today(), done: false, doneAt: '', note: '', remind: 'day', noDue: true });

function Sheet({ f, setF, onSave, onDelete, onClose }: { f: Form; setF: (x: Form) => void; onSave: () => void; onDelete?: () => void; onClose: () => void }) {
  const [tried, setTried] = useState(false); const set = (p: Partial<Form>) => setF({ ...f, ...p });
  const money = f.what === 'money'; const amt = pn(f.amount);
  const badAmt = money && (!!numberError(f.amount) || !(amt > 0)); const badDue = !f.noDue && !validDate(f.due); const badDate = !validDate(f.date);
  const save = () => { setTried(true); tryForm('loan'); if (!f.who.trim() || (!money && !f.title.trim()) || badAmt || badDue || badDate) return; onSave(); };
  const two = (a: [string, string], b: [string, string], cur: string, fn: (v: string) => void) => (
    <View style={{ flexDirection: 'row', gap: 8 }}>{[a, b].map(([k, t]) => <Pressable key={k} onPress={() => fn(k)} accessibilityLabel={t} style={{ flex: 1 }}><View style={chip(cur === k, ACC.loans)}><Text style={{ color: W, fontSize: 13.5, fontWeight: '700' }}>{t}</Text></View></Pressable>)}</View>
  );
  return (
    <SheetFrame title={f.id ? 'Edit' : 'Add'} sub="Lent & Borrowed" onClose={onClose}>
      <Lab t="WHO HAS IT?" />
      {two(['lent', 'I lent it'], ['borrowed', 'I borrowed it'], f.dir, (v) => set({ dir: v as any }))}
      <Lab t="WHAT" />
      {two(['money', 'Money'], ['thing', 'A thing'], f.what, (v) => set({ what: v as any }))}
      <Lab t="DETAILS" />
      <Inp value={f.who} onChangeText={(x: string) => set({ who: x })} placeholder={f.dir === 'lent' ? 'Lent to, e.g. a friend' : 'Borrowed from, e.g. a friend'} maxLength={50} />
      {tried && !f.who.trim() ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please enter a name.</Text> : null}
      {money ? (<>
        <Inp form="loan" need="an amount" style={{ marginTop: 9 }} value={f.amount} onChangeText={(x: string) => set({ amount: x })} keyboardType="decimal-pad" placeholder="Amount in RM" />
        {tried && f.amount.trim() && !numberError(f.amount) && !(amt > 0) ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please enter an amount above 0.</Text> : null}
      </>) : (<>
        <Inp style={{ marginTop: 9 }} value={f.title} onChangeText={(x: string) => set({ title: x })} placeholder="What, e.g. Drill set" maxLength={60} />
        {tried && !f.title.trim() ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please enter what it is.</Text> : null}
      </>)}
      <Lab t={f.dir === 'lent' ? 'DATE LENT' : 'DATE BORROWED'} />
      <DateField value={f.date} onChange={(v: string) => set({ date: v })} past />
      {tried && badDate ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please pick a valid date.</Text> : null}
      <Lab t="DUE DATE" />
      <Pressable onPress={() => set({ noDue: !f.noDue })} accessibilityLabel="No due date" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: 'rgba(255,255,255,.5)', backgroundColor: f.noDue ? 'rgba(94,231,223,.5)' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{f.noDue ? <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>✓</Text> : null}</View>
        <Text style={{ color: W, fontSize: 14 }}>No due date</Text>
      </Pressable>
      {!f.noDue ? <DateField value={f.due} onChange={(v: string) => set({ due: v })} /> : null}
      {tried && badDue ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please pick a valid date.</Text> : null}
      {!f.noDue ? (<>
        <Lab t="REMIND ME" />
        <SlidePills tabs={['None', 'On the day', '3 days before']} index={f.remind === 'off' ? 0 : f.remind === '3d' ? 2 : 1} onChange={(i) => set({ remind: i === 0 ? 'off' : i === 2 ? '3d' : 'day' })} colors={['#ffe84d', '#ff9a3d']} textOn="#0b1030" fontSize={12.5} padX={14} padY={9} />
        <Text style={{ color: dim, fontSize: 11.5, marginTop: 6 }}>{f.remind === 'off' ? 'No reminder for this one.' : 'You get a reminder at 9 am' + (f.remind === '3d' ? ', 3 days before the due date.' : ' on the due date.')}</Text>
      </>) : null}
      <Lab t="NOTE (OPTIONAL)" />
      <Inp value={f.note} onChangeText={(x: string) => set({ note: x })} placeholder="e.g. For his car repair" maxLength={200} />
      <BigBtn t="Save" onPress={save} a11y="Save loan" />
      {onDelete ? <BigBtn t="Delete" outline="#ff8da1" onPress={onDelete} a11y="Delete loan" /> : null}
    </SheetFrame>
  );
}

function PaySheet({ loan, v, setV, onSave, onClose }: { loan: Loan; v: { a: string; d: string }; setV: (x: { a: string; d: string }) => void; onSave: () => void; onClose: () => void }) {
  const [tried, setTried] = useState(false); const a = pn(v.a); const left = leftOf(loan);
  const bad = !!numberError(v.a) || !(a > 0) || a > left + 0.001; const badD = !validDate(v.d);
  const go = () => { setTried(true); tryForm('pay'); if (bad || badD) return; onSave(); };
  return (
    <SheetFrame title="Add a payment" sub={loan.who + ' · still ' + rm(left)} onClose={onClose}>
      <Lab t="AMOUNT PAID BACK" />
      <Inp form="pay" need="an amount" value={v.a} onChangeText={(x: string) => setV({ ...v, a: x })} keyboardType="decimal-pad" placeholder="Amount in RM" />
      {tried && v.a.trim() && !numberError(v.a) && a > left + 0.001 ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>{'That is more than the ' + rm(left) + ' still owed.'}</Text> : null}
      <Lab t="DATE" />
      <DateField value={v.d} onChange={(x: string) => setV({ ...v, d: x })} past />
      {tried && badD ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please pick a valid date.</Text> : null}
      <Text style={{ color: dim, fontSize: 11.5, marginTop: 10, lineHeight: 16 }}>When the full amount is paid back, this record moves to Done by itself.</Text>
      <BigBtn t="Save payment" onPress={go} a11y="Save payment" />
    </SheetFrame>
  );
}

export default function Screen() {
  const [st, setSt] = useStored<ColStore>('ml_collection', EMPTY_COL);
  const all = (st && st.loans) || [];
  const [tab, setTab] = useState<'lent' | 'borrowed' | 'done'>('lent'); const [q, setQ] = useState(''); const [f, setF] = useState<Form | null>(null); const [det, setDet] = useState(0);
  const idx = TABS.findIndex((x) => x[0] === tab); const slide = useTabSlide(idx); const pill = useTabPill(idx, 3, g);
  const shown = all.filter((l) => (tab === 'done' ? l.done : !l.done && l.dir === tab));
  const list = useMemo(() => { const n = q.trim().toLowerCase(); return shown.filter((l) => !n || (l.who + ' ' + l.title + ' ' + l.note).toLowerCase().includes(n)).sort((a, b) => (a.done ? (b.doneAt || '').localeCompare(a.doneAt || '') : (a.due || '9999').localeCompare(b.due || '9999'))); }, [all, tab, q]);
  const open = all.filter((l) => !l.done);
  const sumMoney = (d: string) => open.filter((l) => l.dir === d && l.what === 'money').reduce((t, l) => t + leftOf(l), 0);
  const things = (d: string) => open.filter((l) => l.dir === d && l.what === 'thing').length;
  const openNew = () => setF(blank(tab === 'borrowed' ? 'borrowed' : 'lent'));
  const openEdit = (l: Loan) => setF({ ...l, remind: l.remind || 'day', noDue: !l.due, due: l.due || today() });
  const save = () => {
    if (!f) return; const { noDue, ...rest } = f; const l: Loan = { ...rest, who: f.who.trim(), title: f.what === 'thing' ? f.title.trim() : '', amount: f.what === 'money' ? String(pn(f.amount)) : '', due: noDue ? '' : f.due, note: f.note.trim() };
    if (l.id) setSt({ ...st, loans: all.map((x) => (x.id === l.id ? l : x)) });
    else setSt({ ...st, loans: [...all, { ...l, id: st.next }], next: st.next + 1 });
    setF(null);
  };
  const del = () => { if (!f || !f.id) return; confirmDelete('this record', () => { setSt({ ...st, loans: all.filter((x) => x.id !== f.id) }); setF(null); setDet(0); }, { title: 'Delete this record?', message: 'It will be removed from this phone. This cannot be undone.' }); };
  const mark = (l: Loan, done: boolean) => { setSt({ ...st, loans: all.map((x) => (x.id === l.id ? { ...x, done, doneAt: done ? today() : '' } : x)) }); setDet(0); };
  const plus = <Pressable onPress={openNew} accessibilityLabel="Add record"><LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 28, fontWeight: '300', marginTop: -2 }}>+</Text></LinearGradient></Pressable>;
  const cur = all.find((x) => x.id === det);
  const hist = cur ? all.filter((x) => x.id !== cur.id && x.who.trim().toLowerCase() === cur.who.trim().toLowerCase()).sort((a, b) => b.date.localeCompare(a.date)) : [];
  const [pay, setPay] = useState<{ a: string; d: string } | null>(null);
  const what = (l: Loan) => (l.what === 'money' ? l.who : l.title);
  const sub = (l: Loan) => (l.what === 'money' ? (paidOf(l) > 0 ? rm(leftOf(l)) + ' left of ' + rm(num(l.amount)) : rm(num(l.amount))) + ' · ' + (l.dir === 'lent' ? 'lent ' : 'borrowed ') + dmy(l.date) : (l.dir === 'lent' ? 'Lent to ' : 'Borrowed from ') + l.who + ' · ' + dmy(l.date));
  return (
    <RecordPage title="Lent & Borrowed" sub={open.length + ' open'} right={plus} bg={<ColArt />}>
      <Intro plain title="Never forget who has what" text="Money and things you lent or borrowed" colors={['rgba(142,168,255,.5)', 'rgba(183,148,255,.4)']} />
      <View onLayout={pill.onLayout} style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)', marginTop: 12 }}>
        {pill.indicator}
        {TABS.map(([k, n]) => <Pressable key={k} onPress={() => setTab(k)} style={{ flex: 1 }} accessibilityLabel={n}><View style={{ paddingVertical: 9, alignItems: 'center' }}><Text style={{ color: tab === k ? W : 'rgba(255,255,255,.85)', fontSize: 13, fontWeight: tab === k ? '800' : '700' }}>{n}</Text></View></Pressable>)}
      </View>
      <View style={{ marginTop: 12 }}><SearchField value={q} onChangeText={setQ} placeholder="Search names and things" /></View>
      {tab === 'lent' ? <Sums a={['OWED TO YOU', rm(sumMoney('lent'))]} b={['THINGS OUT', String(things('lent'))]} /> : tab === 'borrowed' ? <Sums a={['YOU OWE', rm(sumMoney('borrowed'))]} b={['THINGS YOU HAVE', String(things('borrowed'))]} /> : <Sums a={['RETURNED', String(all.filter((l) => l.done).length)]} />}
      <Animated.View style={slide}>
        {list.length ? list.map((l) => { const d = dueOf(l); return <ItemRow key={l.id} a11y={'Open ' + what(l)} tile={<Tile icon={l.what === 'money' ? 'cash' : 'tool'} c={l.what === 'money' ? ACC.loans : ACC.lifestyle} />} label={(l.what === 'money' ? 'MONEY' : 'THING') + (tab === 'done' ? (l.dir === 'lent' ? ' · LENT' : ' · BORROWED') : '')} title={what(l)} sub={sub(l)} status={d.txt} statusCol={d.col} hot={d.hot} onPress={() => setDet(l.id)} />; })
          : <Empty e={q.trim() ? 'search' : 'swap'} t={q.trim() ? 'Nothing found' : tab === 'done' ? 'Nothing returned yet' : 'Nothing here yet'} s={q.trim() ? 'Try another word.' : tab === 'done' ? 'Things you mark as returned appear here.' : 'Tap + to add money or a thing you ' + (tab === 'lent' ? 'lent.' : 'borrowed.')} />}
      </Animated.View>
      {cur && !f ? (
        <Detail label={(cur.what === 'money' ? 'MONEY' : 'THING') + (cur.dir === 'lent' ? ' · LENT' : ' · BORROWED')} title={what(cur)} tile={<Tile icon={cur.what === 'money' ? 'cash' : 'tool'} c={ACC.loans} size={84} />}
          lines={[[cur.dir === 'lent' ? 'Lent to' : 'Borrowed from', cur.who], ...(cur.what === 'money' ? [['Amount', rm(num(cur.amount))] as [string, string], ...(paidOf(cur) > 0 ? [['Paid back', rm(paidOf(cur))] as [string, string], ['Still owed', rm(leftOf(cur))] as [string, string]] : [])] : []), [cur.dir === 'lent' ? 'Date lent' : 'Date borrowed', dmy(cur.date)], ['Due', cur.due ? dmy(cur.due) : 'No due date'], ...(cur.done ? [['Returned', dmy(cur.doneAt)] as [string, string]] : []), ...(cur.note ? [['Note', cur.note] as [string, string]] : [])]}
          status={dueOf(cur).txt} statusCol={dueOf(cur).col} hot={dueOf(cur).hot} onClose={() => setDet(0)}>
          {cur.what === 'money' && (cur.pays || []).length ? (
            <View style={{ marginTop: 16 }}>
              <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 }}>PAYMENTS</Text>
              {(cur.pays || []).map((p, i) => (
                <View key={p.d + i} style={{ paddingVertical: 9, borderTopWidth: i ? 1 : 0, borderTopColor: 'rgba(255,255,255,.1)', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ flex: 1, color: W, fontSize: 13 }}>{dmy(p.d) + ' · ' + rm(p.a)}</Text>
                  <Pressable onPress={() => confirmDelete('this payment', () => setSt({ ...st, loans: all.map((x) => (x.id === cur.id ? { ...x, pays: (x.pays || []).filter((_, k) => k !== i) } : x)) }), { title: 'Remove this payment?', message: 'The amount will count as still owed again.' })} accessibilityLabel="Remove payment"><Text style={{ color: '#ff9aa9', fontSize: 12.5, fontWeight: '700' }}>Remove</Text></Pressable>
                </View>
              ))}
            </View>
          ) : null}
          {cur.what === 'money' && !cur.done ? <BigBtn t="Add a payment" g={['#ffe84d', '#ff9a3d']} dark onPress={() => { setPay({ a: '', d: today() }); }} a11y="Add a payment" /> : null}
          {hist.length ? (
            <View style={{ marginTop: 16 }}>
              <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 }}>{'HISTORY WITH ' + cur.who.toUpperCase()}</Text>
              <Text style={{ color: dim, fontSize: 12, marginBottom: 4 }}>{hist.length + (hist.length === 1 ? ' other record' : ' other records') + ' · returned ' + hist.filter((h) => h.done).length + ' of ' + hist.length}</Text>
              {hist.slice(0, 8).map((h) => (
                <View key={h.id} style={{ paddingVertical: 9, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.1)', flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                  <Text numberOfLines={1} style={{ flex: 1, color: W, fontSize: 13 }}>{(h.dir === 'lent' ? 'Lent ' : 'Borrowed ') + (h.what === 'money' ? rm(num(h.amount)) : h.title) + ' · ' + dmy(h.date)}</Text>
                  <Text style={{ color: h.done ? '#5ee7b5' : '#ffd593', fontSize: 12.5, fontWeight: '800' }}>{h.done ? 'Returned' : 'Open'}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {!cur.done && cur.dir === 'lent' ? (<>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); Linking.openURL('https://wa.me/?text=' + encodeURIComponent(politeAsk(cur))).catch(() => {}); }} accessibilityLabel="Remind on WhatsApp" style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
                <LinearGradient colors={['#5ee7b5', '#3df0ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#0b1030', fontSize: 14.5, fontWeight: '800' }}>WhatsApp</Text></LinearGradient>
              </Pressable>
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); Share.share({ message: politeAsk(cur) }).catch(() => {}); }} accessibilityLabel="Send a reminder with another app" style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
                <View style={{ height: 54, borderRadius: 18, borderWidth: 1, borderColor: '#5ee7b5', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#5ee7b5', fontSize: 14.5, fontWeight: '800' }}>Other apps</Text></View>
              </Pressable>
            </View>
            <Text style={{ color: dim, fontSize: 11.5, marginTop: 6, lineHeight: 16 }}>Sends a polite message ready to go. WhatsApp opens straight away, or pick SMS, Telegram, e-mail or any other app. You choose who gets it and press send yourself. My Life 1.0 sends nothing for you.</Text>
          </>) : null}
          {cur.done ? <BigBtn t="Not returned after all" outline="#ffd593" onPress={() => mark(cur, false)} a11y="Mark not returned" /> : <BigBtn t="Mark as returned" onPress={() => mark(cur, true)} a11y="Mark as returned" />}
          <BigBtn t="Edit" outline="rgba(255,255,255,.6)" onPress={() => { setDet(0); openEdit(cur); }} a11y="Edit record" />
        </Detail>
      ) : null}
      {pay && cur ? <PaySheet loan={cur} v={pay} setV={setPay} onClose={() => setPay(null)} onSave={() => {
        const a = pn(pay.a); const np = [...(cur.pays || []), { d: pay.d, a }]; const left = Math.max(0, num(cur.amount) - np.reduce((t, p) => t + p.a, 0));
        setSt({ ...st, loans: all.map((x) => (x.id === cur.id ? { ...x, pays: np, done: left <= 0 ? true : x.done, doneAt: left <= 0 ? today() : x.doneAt } : x)) }); setPay(null);
      }} /> : null}
      {f ? <Sheet f={f} setF={setF} onSave={save} onDelete={f.id ? del : undefined} onClose={() => setF(null)} /> : null}
    </RecordPage>
  );
}
