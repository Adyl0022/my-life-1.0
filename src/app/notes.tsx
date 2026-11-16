import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, TextInput, Keyboard, Platform, BackHandler } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Glass } from '../components/Glass';
import { Blob } from '../components/Bg';
import { NotesArt } from '../components/NotesArt';
import Svg, { Path } from 'react-native-svg';
import { Inp, SBtn, Sheet, Toast, W, GP } from '../components/Ui';
import { useStored } from '../lib/store';
import { AheadPicker } from '../components/QuickRemind';
import { TOP } from '../lib/layout';

// rm: when to remind (a time in ms), rd: the reminder is done
type Note = { id: number; t: string; s: string; c: number; pin: boolean; u: number; r: string; rm?: number; rd?: boolean; ra?: number[] };
type Data = { notes: Note[]; seq: number };
const COL = ['#7c9cff', '#5ee7df', '#ffc46b', '#ff8fb1', '#a78bfa', '#9be37a', '#94a3b8'];
const PAPER = [['#4f6bff', '#8a6cff', '#3fb0ff'], ['#0fae9f', '#2f84d8', '#3fd1a8'], ['#f5a623', '#ef6a3a', '#e8436b'], ['#e0518a', '#a24fe0', '#ff8f6b'], ['#7a50e6', '#c05fd8', '#5b7cff'], ['#2fae64', '#2f93c4', '#8bd45a'], ['#334155', '#475569', '#94a3b8']];
const FILTERS = ['Reminders', 'All', 'Pinned', 'Checklist', 'Recent'];
const SORTS = ['Newest', 'Oldest', 'A–Z'];
const days = (u: number) => Math.floor((Date.now() - u) / 86400000);
const when = (u: number) => { const d = days(u); return d <= 0 ? 'Today' : d === 1 ? 'Yesterday' : d + ' days ago'; };
const isChk = (n: Note) => /[☐☑]/.test(n.s);
const WDN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; const MONN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const clock = (d: Date) => { const h = d.getHours(); return (h % 12 || 12) + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + (h < 12 ? 'AM' : 'PM'); };
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
// "Today 12:00 PM", "Tomorrow 12:00 PM", "Wed 18 Nov, 12:00 PM"
const remText = (ms: number) => { const d = new Date(ms); const diff = Math.round((dayStart(d) - dayStart(new Date())) / 86400000); return (diff === 0 ? 'Today ' : diff === 1 ? 'Tomorrow ' : WDN[d.getDay()] + ' ' + d.getDate() + ' ' + MONN[d.getMonth()] + ', ') + clock(d); };
// A shorter one for the small note cards: "Today 12:00 PM", "Wed 12:00 PM", "18 Nov 12:00 PM"
const remShort = (ms: number) => { const d = new Date(ms); const diff = Math.round((dayStart(d) - dayStart(new Date())) / 86400000); return (diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : diff > 1 && diff < 7 ? WDN[d.getDay()] : d.getDate() + ' ' + MONN[d.getMonth()]) + ' ' + clock(d); };
const dayText = (ms: number) => { const d = new Date(ms); const diff = Math.round((dayStart(d) - dayStart(new Date())) / 86400000); return (diff === 0 ? 'Today, ' : diff === 1 ? 'Tomorrow, ' : WDN[d.getDay()] + ', ') + d.getDate() + ' ' + MONN[d.getMonth()]; };
const Bell = ({ c = '#fff', z = 14 }: { c?: string; z?: number }) => <Svg width={z} height={z} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><Path d="M13.7 21a2 2 0 0 1-3.4 0" /></Svg>;
const overdue = (n: Note) => !!n.rm && !n.rd && n.rm < Date.now();

export default function Notes() {
  const router = useRouter();
  const [data, setData, ok] = useStored<Data>('ml_notes', { notes: [], seq: 1 });
  const [filter, setFilter] = useState(1); const [sort, setSort] = useState(0); const [grid, setGrid] = useState(true); const [q, setQ] = useState('');
  const [editId, setEditId] = useState(0); const [draft, setDraft] = useState<Note | null>(null); const [isNew, setIsNew] = useState(false);
  const [menuId, setMenuId] = useState(0); const [confirmDel, setConfirmDel] = useState(false);
  const [toast, setToast] = useState('');
  const [rmOpen, setRmOpen] = useState(false); const [rmAt, setRmAt] = useState(0); const [rmRa, setRmRa] = useState<number[]>([]);
  const lp = useRef(false);
  const say = (t: string) => { setToast(t); setTimeout(() => setToast(''), 1600); };
  const notes = data.notes;
  const nRem = notes.filter((n) => n.rm && !n.rd).length;

  const qq = q.trim().toLowerCase();
  const FIL = [(n: Note) => !!n.rm, () => true, (n: Note) => n.pin, isChk, (n: Note) => days(n.u) <= 2];
  const list = notes.filter((n) => FIL[filter](n) && (!qq || (n.t + ' ' + n.s).toLowerCase().includes(qq)));
  const key = (a: Note, b: Note) => (filter === 0 ? (a.rd ? 1 : 0) - (b.rd ? 1 : 0) || (a.rm || 0) - (b.rm || 0) : sort === 1 ? a.u - b.u : sort === 2 ? (a.t || '').localeCompare(b.t || '') : b.u - a.u);
  const sorted = [...list.filter((n) => n.pin).sort(key), ...list.filter((n) => !n.pin).sort(key)];
  const menuNote = notes.find((n) => n.id === menuId);

  const openNew = () => { cur.current = { s: 0, e: 0 }; const id = data.seq; setDraft({ id, t: '', s: '', c: 6, pin: false, u: Date.now(), r: '' }); setIsNew(true); setEditId(id); setFilter(1); setQ(''); };
  const openEdit = (n: Note) => { cur.current = { s: n.s.length, e: n.s.length }; setDraft({ ...n }); setIsNew(false); setEditId(n.id); };
  const closeEd = () => { setEditId(0); setDraft(null); setConfirmDel(false); };
  const edOpen = useRef(false); edOpen.current = !!draft;
  const closeRef = useRef(closeEd);
  // Android back button: close the open note straight away instead of leaving the whole screen (that felt laggy).
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const h = BackHandler.addEventListener('hardwareBackPress', () => { if (!edOpen.current) return false; Keyboard.dismiss(); closeRef.current(); return true; });
    return () => h.remove();
  }, []);
  const upd = (p: Partial<Note>) => setDraft((d) => (d ? { ...d, ...p } : d));
  // Reminder sheet: quick choices plus date, hour and minute steppers.
  const at9 = (plus: number) => { const d = new Date(); d.setDate(d.getDate() + plus); d.setHours(9, 0, 0, 0); return d.getTime(); };
  const hourLater = () => { const d = new Date(Date.now() + 3600000); d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0); return d.getTime(); };
  const tonight = () => { const d = new Date(); d.setHours(20, 0, 0, 0); return d.getTime(); };
  const openRem = () => { Keyboard.dismiss(); setRmAt(draft?.rm && draft.rm > Date.now() ? draft.rm : at9(1)); setRmRa(draft?.ra || []); setRmOpen(true); };
  const shift = (field: 'd' | 'h' | 'm', by: number) => { const d = new Date(rmAt); if (field === 'd') d.setDate(d.getDate() + by); else if (field === 'h') d.setHours(d.getHours() + by); else d.setMinutes(d.getMinutes() + by); d.setSeconds(0, 0); setRmAt(Math.max(d.getTime(), 0)); };
  const setRem = () => { if (rmAt <= Date.now() + 30000) return say('Pick a time in the future'); { const ok = rmRa.filter((m) => rmAt - m * 60000 > Date.now() + 10000); upd({ rm: rmAt, rd: false, ra: ok.length ? ok : undefined }); } setRmOpen(false); say('Reminder set for ' + remText(rmAt)); };
  const save = () => {
    if (!draft) return;
    if (!(draft.t.trim() || draft.s.trim())) return say('Add a title or some text first');
    const nn = { ...draft, u: Date.now() };
    setData(isNew ? { notes: [nn, ...notes], seq: data.seq + 1 } : { ...data, notes: notes.map((x) => (x.id === nn.id ? nn : x)) });
    closeEd(); say('Note saved');
  };
  // Back saves what was typed (new note with text, or a changed note) so nothing is lost when "Save" is forgotten.
  const back = () => {
    if (!draft) return closeEd();
    const orig = isNew ? null : notes.find((x) => x.id === draft.id);
    const has = !!(draft.t.trim() || draft.s.trim());
    const changed = isNew || !orig || draft.t !== orig.t || draft.s !== orig.s || draft.c !== orig.c || draft.pin !== orig.pin || draft.rm !== orig.rm || !!draft.rd !== !!orig.rd || JSON.stringify(draft.ra || []) !== JSON.stringify(orig.ra || []);
    if (has && changed) save(); else closeEd();
  };
  closeRef.current = back;
  const del = (id: number) => { setData({ ...data, notes: notes.filter((x) => x.id !== id) }); };
  const foc = useRef(false); const inp = useRef<any>(null); const cur = useRef({ s: 0, e: 0 });
  const [selOv, setSelOv] = useState<{ start: number; end: number } | null>(null);
  const [kb, setKb] = useState(0);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const a = Keyboard.addListener('keyboardDidShow', (e: any) => setKb(e.endCoordinates.height));
    const b = Keyboard.addListener('keyboardDidHide', () => setKb(0));
    return () => { a.remove(); b.remove(); };
  }, []);
  // One editor for the whole note (like Apple Notes / Keep): focus never moves, so the keyboard never blinks.
  const PRE = /^(☐|☑) |^• |^\d+\. /;
  const put = (ns: string, caret: number) => { upd({ s: ns }); cur.current = { s: caret, e: caret }; setSelOv({ start: caret, end: caret }); setTimeout(() => setSelOv(null), 350); if (!foc.current) inp.current?.focus?.(); };
  const onText = (v: string) => {
    const old = draft?.s ?? '';
    let i = 0; while (i < old.length && i < v.length && old[i] === v[i]) i++;
    if (v.length === old.length + 1 && v[i] === '\n' && v.slice(i + 1) === old.slice(i)) {
      const ls = v.lastIndexOf('\n', i - 1) + 1; const line = v.slice(ls, i); const m = PRE.exec(line);
      if (m) {
        if (!line.slice(m[0].length).trim()) return put(v.slice(0, ls) + v.slice(i + 1), ls);
        const n = /^(\d+)\. /.exec(line); const cont = /^[☐☑]/.test(line) ? '☐ ' : n ? (+n[1] + 1) + '. ' : '• ';
        return put(v.slice(0, i + 1) + cont + v.slice(i + 1), i + 1 + cont.length);
      }
    }
    if (v.length === old.length - 1) {
      const ls = old.lastIndexOf('\n', i - 1) + 1; const m = PRE.exec(old.slice(ls));
      if (m && i === ls + m[0].length - 1) return put(old.slice(0, ls) + old.slice(ls + m[0].length), ls);
    }
    upd({ s: v });
  };
  const lineAt = () => { const t = draft?.s ?? ''; const p = Math.min(cur.current.s, t.length); const ls = t.lastIndexOf('\n', p - 1) + 1; return { t, p, ls }; };
  const mark = (kind: 'chk' | 'dot' | 'num') => {
    if (!draft) return; const { t, p, ls } = lineAt(); const le = t.indexOf('\n', ls) < 0 ? t.length : t.indexOf('\n', ls); const line = t.slice(ls, le); const m = PRE.exec(line);
    const isK = (k: string) => (k === 'chk' ? /^[☐☑]/ : k === 'dot' ? /^•/ : /^\d/).test(line);
    if (kind === 'chk' && m && isK('chk')) return put(t.slice(0, ls) + (line[0] === '☑' ? '☐' : '☑') + t.slice(ls + 1), p);
    if (m && isK(kind)) return put(t.slice(0, ls) + t.slice(ls + m[0].length), Math.max(ls, p - m[0].length));
    const prev = ls > 0 ? t.slice(t.lastIndexOf('\n', ls - 2) + 1, ls - 1) : ''; const pn = /^(\d+)\. /.exec(prev);
    const mk = kind === 'chk' ? '☐ ' : kind === 'dot' ? '• ' : (pn ? +pn[1] + 1 : 1) + '. ';
    const base = m ? t.slice(0, ls) + t.slice(ls + m[0].length) : t; const cut = m ? m[0].length : 0;
    put(base.slice(0, ls) + mk + base.slice(ls), Math.max(ls, p - cut) + mk.length);
  };
  // Tap on a checklist box: the caret lands at the start of that line, so toggle the box (no need to measure wrapped lines).
  const tp = useRef({ x: 0, y: 0, t: 0, lx: 99 });
  const tapStart = (e: any) => { const n = e.nativeEvent; tp.current = { x: n.pageX, y: n.pageY, t: Date.now(), lx: n.locationX }; };
  const tapEnd = (e: any) => {
    const n = e.nativeEvent; const d = tp.current;
    if (Math.abs(n.pageX - d.x) > 8 || Math.abs(n.pageY - d.y) > 8 || Date.now() - d.t > 350 || d.lx > 24) return;
    setTimeout(() => {
      const { t, p, ls } = lineAt(); if (!/^[☐☑]/.test(t.slice(ls)) || p - ls > 1) return;
      put(t.slice(0, ls) + (t[ls] === '☑' ? '☐' : '☑') + t.slice(ls + 1), ls + 2);
    }, 90);
  };
  const stamp = () => { if (!draft) return; const d = new Date(); const x = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); const t = draft.s; const p = Math.min(cur.current.s, t.length); put(t.slice(0, p) + x + t.slice(p), p + x.length); };
  const words = draft ? (draft.t + ' ' + draft.s).trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <LinearGradient colors={['#0b1030', '#231452', '#0b2c46']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={300} color="rgba(255,196,107,.14)" style={{ right: -120, top: -70 }} />
      <Blob size={300} color="rgba(124,156,255,.12)" style={{ left: -130, top: 380 }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: 0.72 }}><NotesArt /></View>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16 + TOP, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
          <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Notes &amp; Reminders</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 4 }}>{(sorted.length === notes.length ? notes.length + (notes.length === 1 ? ' note' : ' notes') : sorted.length + ' of ' + notes.length + ' notes') + (nRem ? ' · ' + nRem + (nRem === 1 ? ' reminder' : ' reminders') : '')}</Text></View>
          <Pressable onPress={openNew} accessibilityLabel="New note"><LinearGradient colors={['#ffc46b', '#ff8f5a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 26, marginTop: -2 }}>+</Text></LinearGradient></Pressable>
        </View>
        <View style={{ paddingHorizontal: 20, marginTop: 12, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Glass radius={16} style={{ flex: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,.6)' }}>⌕</Text>
            <TextInput value={q} onChangeText={setQ} placeholder="Search title or text" placeholderTextColor="rgba(255,255,255,.45)" style={{ flex: 1, color: W, fontSize: 14, paddingVertical: 11, outlineStyle: 'none' } as any} />
          </Glass>
          <Pressable onPress={() => setSort((sort + 1) % 3)}><Glass radius={16} style={{ paddingHorizontal: 12, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{SORTS[sort]}</Text></Glass></Pressable>
          <Pressable onPress={() => setGrid(!grid)} accessibilityLabel="Layout"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 16 }}>{grid ? '☰' : '▦'}</Text></Glass></Pressable>
        </View>
        {(() => {
          const act = notes.filter((n) => n.rm && !n.rd); const od = act.filter((n) => (n.rm as number) < Date.now()).length;
          const nx = act.filter((n) => (n.rm as number) >= Date.now()).sort((x, y) => (x.rm as number) - (y.rm as number))[0];
          const sub = act.length ? [od ? od + ' overdue' : '', nx ? 'Next: ' + remShort(nx.rm as number) : ''].filter(Boolean).join(' · ') : 'Open a note and tap the bell to add one';
          const on = filter === 0;
          return (
            <Pressable onPress={() => setFilter(on ? 1 : 0)} accessibilityLabel="Show only notes with reminders" style={{ marginHorizontal: 20, marginTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: on ? '#ffd593' : 'rgba(255,213,147,.55)', backgroundColor: on ? 'rgba(255,196,107,.3)' : 'rgba(255,196,107,.12)' }}>
                <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,196,107,.25)', alignItems: 'center', justifyContent: 'center' }}><Bell c="#ffd593" z={18} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{'Reminders' + (act.length ? ' · ' + act.length : '')}</Text>
                  <Text numberOfLines={1} style={{ color: od ? '#ffb3c4' : 'rgba(255,255,255,.75)', fontSize: 11.5, marginTop: 2 }}>{sub}</Text>
                </View>
                <Text style={{ color: '#ffd593', fontSize: 12, fontWeight: '800' }}>{on ? 'Showing' : 'View'}</Text>
              </View>
            </Pressable>
          );
        })()}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0, marginTop: 10 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 2, alignItems: 'center' }}>
          {FILTERS.map((n, i) => i === 0 ? null : (
            <Pressable key={n} onPress={() => setFilter(i)}><View style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: filter === i ? 'rgba(255,196,107,.3)' : 'rgba(255,255,255,.1)' }}><Text style={{ color: filter === i ? W : 'rgba(255,255,255,.85)', fontSize: 12.5, lineHeight: 17, fontWeight: filter === i ? '800' : '600' }}>{n}</Text></View></Pressable>
          ))}
        </ScrollView>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {sorted.map((n) => {
              const tot = (n.s.match(/[☐☑]/g) || []).length, dn = (n.s.match(/☑/g) || []).length;
              return (
                <Pressable key={n.id} style={{ width: grid ? '47.8%' : '100%' }} delayLongPress={450}
                  onPress={() => openEdit(n)} onLongPress={() => setMenuId(n.id)}>
                  <Glass radius={22} style={{ padding: 14, minHeight: 110, ...(grid ? { height: 178, overflow: 'hidden' } : {}) }}>
                    <View style={{ width: 28, height: 4, borderRadius: 2, backgroundColor: COL[n.c], marginBottom: 8 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text numberOfLines={1} style={{ flex: 1, color: W, fontSize: 14.5, fontWeight: '800' }}>{n.t.trim() || 'Untitled'}</Text>{n.pin ? <Text style={{ color: '#ffd593', fontSize: 10, fontWeight: '800' }}>PIN</Text> : null}</View>
                    <View style={{ marginTop: 4 }}>
                      {(n.s.trim() ? n.s.split('\n').map((l, i) => ({ l, i })).filter((o) => o.l.trim()).slice(0, grid ? 4 : 3) : [{ l: 'No additional text', i: -1 }]).map(({ l: ln, i: li }) => {
                        const ck = /^\s*[☐☑]/.test(ln);
                        if (!ck) return <Text key={li} numberOfLines={1} style={{ color: 'rgba(255,255,255,.75)', fontSize: 12.5, lineHeight: 18 }}>{ln || ' '}</Text>;
                        const on = /^\s*☑/.test(ln);
                        return (
                          <Pressable key={li} hitSlop={4} onPress={() => { const all = n.s.split('\n'); all[li] = all[li].replace(/[☐☑]/, on ? '☐' : '☑'); setData({ ...data, notes: notes.map((x) => x.id === n.id ? { ...x, s: all.join('\n') } : x) }); }}>
                            <Text numberOfLines={1} style={{ color: on ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.85)', fontSize: 12.5, lineHeight: 20, textDecorationLine: on ? 'line-through' : 'none' }}>{on ? '☑' : '☐'}<Text>{ln.replace(/^\s*[☐☑]/, '')}</Text></Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={{ marginTop: grid ? 'auto' : 8, paddingTop: grid ? 6 : 0 }}>
                      {n.rm ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', maxWidth: '100%', marginBottom: 6, paddingVertical: 3, paddingHorizontal: 7, borderRadius: 999, borderWidth: 1, backgroundColor: n.rd ? 'rgba(255,255,255,.08)' : overdue(n) ? 'rgba(255,143,171,.2)' : 'rgba(255,196,107,.2)', borderColor: n.rd ? 'rgba(255,255,255,.2)' : overdue(n) ? 'rgba(255,143,171,.6)' : 'rgba(255,196,107,.55)' }}>
                          <Bell c={n.rd ? 'rgba(255,255,255,.55)' : overdue(n) ? '#ff8fab' : '#ffd593'} z={11} />
                          <Text numberOfLines={1} style={{ flexShrink: 1, fontSize: 10, fontWeight: '800', color: n.rd ? 'rgba(255,255,255,.55)' : overdue(n) ? '#ffb3c4' : '#ffd593', textDecorationLine: n.rd ? 'line-through' : 'none' }}>{n.rd ? 'Done' : overdue(n) ? 'Overdue' : remShort(n.rm)}</Text>
                        </View>
                      ) : null}
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                        <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 10.5 }}>{when(n.u)}</Text>
                        {tot ? <Text style={{ color: '#8fe9e2', fontSize: 10.5 }}>✓ {dn}/{tot}</Text> : null}
                      </View>
                    </View>
                  </Glass>
                </Pressable>
              );
            })}
          </View>
          {ok && sorted.length === 0 && <Text style={{ color: 'rgba(255,255,255,.65)', textAlign: 'center', marginTop: 40, fontSize: 13.5 }}>{notes.length ? 'No notes found' : 'No notes yet. Tap + to write your first one.'}</Text>}
          {notes.length > 0 && <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 11.5, textAlign: 'center', marginTop: 20 }}>Long-press a note for options</Text>}
        </ScrollView>

        {menuNote && (
          <Sheet onClose={() => setMenuId(0)}>
            <View style={{ padding: 16, gap: 8, borderRadius: 24, backgroundColor: '#131845', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
              <Text style={{ color: W, fontSize: 15, fontWeight: '800', marginBottom: 4 }} numberOfLines={1}>{menuNote.t || 'Untitled'}</Text>
              <SBtn t={menuNote.pin ? 'Unpin' : 'Pin to top'} style={{ flex: 0 }} onPress={() => { setData({ ...data, notes: notes.map((x) => (x.id === menuNote.id ? { ...x, pin: !x.pin } : x)) }); setMenuId(0); say(menuNote.pin ? 'Unpinned' : 'Pinned to top'); }} />
              {menuNote.rm ? <SBtn t={menuNote.rd ? 'Remind me again' : 'Mark reminder done'} style={{ flex: 0 }} onPress={() => { const again = menuNote.rd && (menuNote.rm as number) <= Date.now(); setData({ ...data, notes: notes.map((x) => (x.id === menuNote.id ? { ...x, rd: !x.rd } : x)) }); setMenuId(0); say(again ? 'Reminder is in the past. Open the note to set a new time.' : menuNote.rd ? 'Reminder is on again' : 'Reminder done'); }} /> : null}
              {menuNote.rm ? <SBtn t="Remove reminder" style={{ flex: 0 }} onPress={() => { setData({ ...data, notes: notes.map((x) => { if (x.id !== menuNote.id) return x; const { rm, rd, ra, ...rest } = x; return rest as Note; }) }); setMenuId(0); say('Reminder removed'); }} /> : null}
              <SBtn t="Delete" kind="danger" style={{ flex: 0 }} onPress={() => { del(menuNote.id); setMenuId(0); say('Note deleted'); }} />
            </View>
          </Sheet>
        )}

        {draft && (
          <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
            <LinearGradient colors={PAPER[draft.c] as any} locations={[0, 0.55, 1]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
            <View pointerEvents="none" style={{ position: 'absolute', right: -90, top: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,.18)' }} />
            <View pointerEvents="none" style={{ position: 'absolute', left: -110, bottom: 140, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,.10)' }} />
            <SafeAreaView style={{ flex: 1, paddingBottom: kb }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 12 }}>
                <Pressable onPress={back} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
                <View style={{ flex: 1 }} />
                <Pressable onPress={openRem} accessibilityLabel="Set a reminder"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', ...(draft.rm && !draft.rd ? { borderWidth: 1.5, borderColor: '#ffd593' } : {}) }}><Bell c={draft.rm && !draft.rd ? '#ffd593' : '#fff'} z={19} /></Glass></Pressable>
                <Pressable onPress={() => upd({ pin: !draft.pin })} accessibilityLabel="Pin"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: draft.pin ? '#ffd593' : W, fontSize: 12, fontWeight: '800' }}>PIN</Text></Glass></Pressable>
                {!isNew && <Pressable onPress={() => setConfirmDel(true)} accessibilityLabel="Delete"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ffb3bf', fontSize: 16 }}>✕</Text></Glass></Pressable>}
                <Pressable onPress={save}><LinearGradient colors={['#34d399', '#5ee7df']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 18, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#06241d', fontSize: 14, fontWeight: '800' }}>Save</Text></LinearGradient></Pressable>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {[['☐', 'Checklist', () => mark('chk')], ['•', 'Bullet', () => mark('dot')], ['1.', 'Numbered list', () => mark('num')], ['Date', 'Insert date and time', stamp]].map(([t, l, f]: any) => (
                  <Pressable key={l} accessibilityLabel={l} onPress={f} style={{ minWidth: 34, height: 34, paddingHorizontal: t === 'Date' ? 8 : 0, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', borderTopColor: 'rgba(255,255,255,.5)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: t.length > 1 ? 12 : 17, fontWeight: t.length > 1 ? '700' : '400' }}>{t}</Text></Pressable>
                ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  {COL.map((c, i) => (
                    <Pressable key={c} accessibilityLabel="Colour" hitSlop={4} onPress={() => upd({ c: i })} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: c }}>
                      <LinearGradient colors={['rgba(255,255,255,.55)', 'rgba(255,255,255,.08)', 'rgba(0,0,0,.18)']} locations={[0, 0.5, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ flex: 1, borderRadius: 9, borderWidth: draft.c === i ? 2 : 1, borderColor: draft.c === i ? '#fff' : 'rgba(255,255,255,.3)', borderTopColor: draft.c === i ? '#fff' : 'rgba(255,255,255,.7)' }} />
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={{ flex: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14 }}>
               <View style={{ flex: 1, borderRadius: 30, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14, backgroundColor: 'rgba(255,255,255,.17)', borderWidth: 1, borderColor: 'rgba(255,255,255,.4)', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6 }}>
                <TextInput value={draft.t} onChangeText={(v) => upd({ t: v })} placeholder="Title" placeholderTextColor="rgba(255,255,255,.62)" style={{ color: W, fontSize: 26, fontWeight: '800', outlineStyle: 'none' } as any} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
                  <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 12 }}>{words} {words === 1 ? 'word' : 'words'}</Text>
                </View>
                {draft.rm ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.22)', borderWidth: 1, borderColor: 'rgba(255,255,255,.4)' }}>
                    <Pressable onPress={openRem} accessibilityLabel="Change the reminder" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingLeft: 12, paddingRight: 8 }}><Bell z={13} /><Text style={{ color: W, fontSize: 12.5, fontWeight: '800', textDecorationLine: draft.rd ? 'line-through' : 'none' }}>{(overdue(draft) ? 'Overdue · ' : '') + remText(draft.rm) + (draft.ra && draft.ra.length ? ' · +' + draft.ra.length : '')}</Text></Pressable>
                    <Pressable onPress={() => { const { rm, rd, ra, ...rest } = draft; setDraft(rest as Note); }} accessibilityLabel="Remove the reminder" hitSlop={6} style={{ paddingVertical: 7, paddingRight: 12, paddingLeft: 4 }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>✕</Text></Pressable>
                  </View>
                ) : null}
                <TextInput ref={inp} multiline onTouchStart={tapStart} onTouchEnd={tapEnd} onFocus={() => { foc.current = true; }} onBlur={() => { foc.current = false; }} value={draft.s} onChangeText={onText} selection={selOv ?? undefined} onSelectionChange={(e: any) => { const sl = e.nativeEvent.selection; cur.current = { s: sl.start, e: sl.end }; }} placeholder="Start writing..." placeholderTextColor="rgba(255,255,255,.6)" style={{ flex: 1, marginTop: 14, color: W, fontSize: 16, lineHeight: 24, padding: 0, paddingVertical: 0, textAlignVertical: 'top', outlineStyle: 'none' } as any} />
               </View>
              </View>
              {rmOpen && (
                <Sheet onClose={() => setRmOpen(false)}>
                  <View style={{ padding: 18, borderRadius: 26, backgroundColor: '#131845', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
                    <Text style={{ color: W, fontSize: 17, fontWeight: '800' }}>Remind me</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                      {([['In 1 hour', hourLater()], ...(tonight() > Date.now() + 600000 ? [['Tonight 8 PM', tonight()]] : []), ['Tomorrow 9 AM', at9(1)]] as [string, number][]).map(([l, v]) => (
                        <Pressable key={l} onPress={() => setRmAt(v)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: Math.abs(rmAt - v) < 60000 ? '#ffc46b' : 'rgba(255,255,255,.12)' }}><Text style={{ color: Math.abs(rmAt - v) < 60000 ? '#3a2200' : W, fontSize: 12.5, fontWeight: '800' }}>{l}</Text></Pressable>
                      ))}
                    </View>
                    {([['Date', dayText(rmAt), 'd', 1], ['Hour', (new Date(rmAt).getHours() % 12 || 12) + ' ' + (new Date(rmAt).getHours() < 12 ? 'AM' : 'PM'), 'h', 1], ['Minute', ':' + String(new Date(rmAt).getMinutes()).padStart(2, '0'), 'm', 5]] as [string, string, 'd' | 'h' | 'm', number][]).map(([l, v, f, by]) => (
                      <View key={l} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                        <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 13 }}>{l}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Pressable onPress={() => shift(f, -by)} accessibilityLabel={'Earlier ' + l} hitSlop={4} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 18, fontWeight: '800', marginTop: -2 }}>−</Text></Pressable>
                          <Text style={{ color: W, fontSize: 14.5, fontWeight: '800', minWidth: 118, textAlign: 'center' }}>{v}</Text>
                          <Pressable onPress={() => shift(f, by)} accessibilityLabel={'Later ' + l} hitSlop={4} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 18, fontWeight: '800', marginTop: -2 }}>+</Text></Pressable>
                        </View>
                      </View>
                    ))}
                    <AheadPicker when={rmAt} ra={rmRa} setRa={setRmRa} />
                    <Text style={{ color: '#ffd593', fontSize: 12.5, fontWeight: '700', marginTop: 14 }}>{'You will be reminded ' + remText(rmAt)}</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}><SBtn t="Cancel" onPress={() => setRmOpen(false)} /><SBtn t="Set reminder" kind="primary" onPress={setRem} /></View>
                  </View>
                </Sheet>
              )}
              {confirmDel && (
                <Sheet onClose={() => setConfirmDel(false)}>
                  <View style={{ padding: 20, borderRadius: 26, backgroundColor: '#131845', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
                    <Text style={{ color: W, fontSize: 17, fontWeight: '800' }}>Delete this note?</Text>
                    <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 13, marginTop: 4 }}>This can't be undone.</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}><SBtn t="Cancel" onPress={() => setConfirmDel(false)} /><SBtn t="Delete" kind="danger" onPress={() => { del(draft.id); closeEd(); say('Note deleted'); }} /></View>
                  </View>
                </Sheet>
              )}
              <Toast t={toast} />
            </SafeAreaView>
          </View>
        )}
        {!draft && <Toast t={toast} />}
      </SafeAreaView>
    </View>
  );
}
