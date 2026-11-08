import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Pressable, Share, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { Drift } from '../components/AuthScreen';
import { Inp, W } from '../components/Ui';
import { CodeBoxes } from '../components/CodeBoxes';
import { TOP } from '../lib/layout';
import { adminCall, useIsAdmin } from '../lib/admin';

const dim = 'rgba(255,255,255,.62)';
const GOLD = '#f5c76b'; const EM = '#5ee7b5'; const CARD = '#14231f'; const LINE = 'rgba(245,199,107,.22)';
const GR = ['#f5c76b', '#5ee7b5'] as [string, string];   // gold to emerald: the admin colours
const day = (s?: string | null) => s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
type Ov = { users: number; active: number; codes_unused: number; codes_used: number; new_7d: number; income: number; income_month: number; sold_month: number; free_total: number };
type U = { id: string; email: string; name?: string; created_at: string; last_sign_in_at?: string; active: boolean; confirmed: boolean };
type Dv = { user_id: string; n: number; last_at: string };
type Gr = { days: { d: string; n: number }[]; active7: number };
type Fb = { id: number; email?: string; msg: string; created_at: string };
type At = { email: string; tries: number; tries_24h: number; last_at: string };
type C = { code: string; note?: string; price?: number | null; method?: string | null; free?: boolean; created_at: string; redeemed_at?: string; used_by?: string };
const METHODS = ['DuitNow', 'Bank', 'Cash', 'Other'];
const rm = (n: number) => 'RM ' + (Number(n) || 0).toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const Pill = ({ t, on, onPress, c }: { t: string; on: boolean; onPress: () => void; c?: string }) => (
  <Pressable onPress={onPress} style={{ paddingVertical: 7, paddingHorizontal: 13, borderRadius: 10, borderWidth: 1, borderColor: on ? 'transparent' : 'rgba(255,255,255,.18)', backgroundColor: on ? (c || GOLD) : CARD, ...RAISED, elevation: on ? 0 : 3 }}>
    <Text style={{ color: on ? '#0b1512' : W, fontSize: 12.5, fontWeight: '800' }}>{t}</Text>
  </Pressable>
);

// Wallpaper of the admin page. Different from the rest of the app on purpose (no stars, no Islamic pattern).
function Grid() {
  return (
    <Svg pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} width="100%" height="100%">
      <Defs><Pattern id="s" width="18" height="18" patternUnits="userSpaceOnUse"><Path d="M-5 5L5 -5M0 18L18 0M13 23L23 13" stroke="rgba(245,199,107,0.09)" strokeWidth="1.2" /></Pattern></Defs>
      <Rect width="100%" height="100%" fill="url(#s)" />
    </Svg>
  );
}
// Raised look: lighter top edge, darker bottom edge, soft shadow and a little shine.
const RAISED = { borderTopColor: 'rgba(255,255,255,.22)', borderBottomColor: 'rgba(0,0,0,.6)', borderBottomWidth: 2.5, elevation: 5, shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } } as any;
const Shine = ({ h = 54 }: { h?: number }) => <LinearGradient colors={['rgba(255,255,255,.09)', 'rgba(255,255,255,0)']} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: h }} />;
const Mini = ({ l, v, c, ic }: { l: string; v: number | string; c: string; ic: string }) => (
  <View style={{ flex: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 10, backgroundColor: CARD, borderWidth: 1, borderColor: 'rgba(255,255,255,.09)', alignItems: 'flex-start', overflow: 'hidden', ...RAISED }}>
    <Shine h={40} />
    <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: c + '2e', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 14 }}>{ic}</Text></View>
    <Text style={{ color: W, fontSize: 22, fontWeight: '800', marginTop: 8 }}>{v}</Text>
    <Text style={{ color: dim, fontSize: 11, marginTop: 1 }}>{l}</Text>
  </View>
);
const initial = (u: { name?: string; email: string }) => ((u.name || u.email || '?').trim()[0] || '?').toUpperCase();

export default function Admin() {
  const router = useRouter(); const isAdmin = useIsAdmin();
  const [ov, setOv] = useState<Ov | null>(null); const [users, setUsers] = useState<U[]>([]); const [codes, setCodes] = useState<C[]>([]);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [note, setNote] = useState(''); const [cnt, setCnt] = useState('1');
  const [fresh, setFresh] = useState<string[]>([]); const [tab, setTab] = useState<'users' | 'codes' | 'inbox' | 'log'>('users');
  const [gr, setGr] = useState<Gr | null>(null); const [fb, setFb] = useState<Fb[]>([]); const [att, setAtt] = useState<At[]>([]); const [dv, setDv] = useState<Record<string, Dv>>({}); const [ann, setAnn] = useState(''); const [tmp, setTmp] = useState<{ id: string; pw: string } | null>(null); const [annText, setAnnText] = useState('');
  const [free, setFree] = useState(false); const [price, setPrice] = useState(''); const [method, setMethod] = useState('DuitNow');
  const [q, setQ] = useState(''); const [open, setOpen] = useState(''); const [ask, setAsk] = useState('');
  const [gate, setGate] = useState<'loading' | 'set' | 'enter' | 'open'>('loading'); const [pin, setPin] = useState(''); const [pin1, setPin1] = useState(''); const [gmsg, setGmsg] = useState('');
  const [calm, setCalm] = useState(false);
  useEffect(() => { const h = setTimeout(() => setCalm(true), 380); return () => clearTimeout(h); }, []);
  useEffect(() => {
    if (!isAdmin || !calm) return;
    adminCall<{ has_pin: boolean; unlocked: boolean }>('admin_pin_status').then((r) => { if (!r.ok) { setErr(r.err); return; } setGate(r.data.unlocked ? 'open' : r.data.has_pin ? 'enter' : 'set'); });
  }, [isAdmin, calm]);
  useEffect(() => {
    if (pin.length < 6 || gate === 'open' || gate === 'loading') return;
    (async () => {
      setBusy(true); setGmsg('');
      if (gate === 'enter') {
        const r = await adminCall<any>('admin_unlock', { p_pin: pin }); setBusy(false);
        if (!r.ok) { setGmsg(r.err); setPin(''); return; }
        if (r.data?.ok) { setPin(''); setGate('open'); return; }
        setGmsg(r.data?.error === 'locked' ? 'Too many wrong codes. Try again in ' + Math.max(1, Math.ceil((r.data.seconds || 900) / 60)) + ' minutes.' : 'Wrong code. ' + (r.data?.tries_left ?? 0) + ' tries left.'); setPin('');
      } else if (!pin1) { setBusy(false); setPin1(pin); setPin(''); }
      else if (pin !== pin1) { setBusy(false); setGmsg('The two codes are not the same. Start again.'); setPin(''); setPin1(''); }
      else {
        const r = await adminCall<any>('admin_set_pin', { p_pin: pin }); setBusy(false);
        if (!r.ok) { setGmsg(r.err); setPin(''); setPin1(''); return; }
        setPin(''); setPin1(''); setGate('open');
      }
    })();
  }, [pin]);
  const lockNow = async () => { await adminCall('admin_lock'); setGate('enter'); setOv(null); setUsers([]); setCodes([]); };
  const load = useCallback(async () => {
    setErr(''); setBusy(true);
    const [a, b, c] = await Promise.all([adminCall<Ov>('admin_overview'), adminCall<U[]>('admin_users'), adminCall<C[]>('admin_codes')]);
    setBusy(false);
    if (!a.ok) { if (a.err === 'admin_locked') { setGate('enter'); setErr(''); } else setErr(a.err); return; }
    setOv(a.data); if (b.ok) setUsers(b.data); if (c.ok) setCodes(c.data);
    const dd = await adminCall<Dv[]>('admin_devices'); if (dd.ok) { const m: Record<string, Dv> = {}; (dd.data || []).forEach((x) => { m[x.user_id] = x; }); setDv(m); }
    const [g, f, t, n] = await Promise.all([adminCall<Gr>('admin_growth'), adminCall<Fb[]>('admin_feedback'), adminCall<At[]>('admin_attempts'), adminCall<{ id: number; msg: string } | null>('get_announcement')]);
    if (g.ok) setGr(g.data); if (f.ok) setFb(f.data || []); if (t.ok) setAtt(t.data || []); if (n.ok) setAnn(n.data?.msg || '');
  }, []);
  useEffect(() => { if (isAdmin && gate === 'open') load(); }, [isAdmin, gate]);
  const make = async () => {
    const n = Math.max(1, Math.min(50, parseInt(cnt, 10) || 1));
    const pr = parseFloat(price.replace(',', '.'));
    if (!free && !(pr > 0)) { setErr('Enter the price, or switch to Free.'); return; }
    setBusy(true);
    const r = await adminCall<string[]>('admin_make_codes', { p_count: n, p_note: note, p_price: free ? null : pr, p_method: free ? null : method, p_free: free }); setBusy(false);
    if (!r.ok) { if (r.err === 'admin_locked') { setGate('enter'); return; } setErr(r.err); return; }
    setErr(''); setFresh(r.data); setNote(''); setPrice(''); load();
  };
  const act = async (fn: string, args: Record<string, unknown>, key: string) => {
    if (ask !== key) { setAsk(key); return; }   // tap twice to confirm
    setAsk(''); setBusy(true); const r = await adminCall<boolean>(fn, args); setBusy(false);
    if (!r.ok) { if (r.err === 'admin_locked') { setGate('enter'); return; } setErr(r.err.includes('cannot_revoke') ? 'You cannot remove your own access.' : r.err); return; }
    setErr(''); load();
  };
  const csv = (rows: (string | number | null | undefined)[][], name: string) => Share.share({ title: name, message: rows.map((r) => r.map((v) => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\n') });
  const exportUsers = () => csv([['Email', 'Name', 'Joined', 'Last sign in', 'Active', 'Email confirmed'], ...users.map((u) => [u.email, u.name, day(u.created_at), day(u.last_sign_in_at), u.active ? 'yes' : 'no', u.confirmed ? 'yes' : 'no'])], 'my-life-users.csv');
  const exportCodes = () => csv([['Code', 'Note', 'Price (RM)', 'Method', 'Free', 'Made', 'Used on', 'Used by'], ...codes.map((c) => [c.code, c.note, c.price, c.method, c.free ? 'yes' : '', day(c.created_at), c.redeemed_at ? day(c.redeemed_at) : '', c.used_by || (c.redeemed_at ? 'deleted account' : '')])], 'my-life-codes.csv');
  const publish = async (text: string) => { setBusy(true); const r = await adminCall<boolean>('admin_announce', { p_msg: text }); setBusy(false); if (!r.ok) { if (r.err === 'admin_locked') { setGate('enter'); return; } setErr(r.err); return; } setErr(''); setAnnText(''); setAnn(text.trim().slice(0, 300)); };
  const resetPw = async (id: string) => {
    if (ask !== 'pw' + id) { setAsk('pw' + id); return; }
    setAsk(''); setBusy(true); const r = await adminCall<string>('admin_reset_password', { p_user: id }); setBusy(false);
    if (!r.ok) { if (r.err === 'admin_locked') { setGate('enter'); return; } setErr(r.err); return; }
    setErr(''); setTmp({ id, pw: r.data });
  };
  const send = (code: string) => Share.share({ message: 'Your My Life activation code: ' + code + '\nOpen the app, sign in, then type the 8 characters after ML-.' });
  return (
    <View style={{ flex: 1, backgroundColor: '#06100d', overflow: 'hidden' }}>
      <LinearGradient colors={['#06100d', '#0b1a16', '#090d14']} locations={[0, 0.5, 1]} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      {calm && <Drift size={360} color="rgba(245,199,107,0.20)" x={140} y={-120} dx={-30} dy={30} dur={9000} />}
      {calm && <Drift size={360} color="rgba(94,231,181,0.17)" x={-170} y={380} dx={40} dy={-30} dur={11000} />}
      {calm && <Grid />}
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={busy} onRefresh={load} tintColor="#fff" />} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 44 + TOP, paddingBottom: 80 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Back"><View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: CARD, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center', ...RAISED }}><Text style={{ color: GOLD, fontSize: 24, marginTop: -3 }}>‹</Text></View></Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: W, fontSize: 26, fontWeight: '800', letterSpacing: -0.4 }}>Admin</Text>
              <Text style={{ color: GOLD, fontSize: 10.5, fontWeight: '800', letterSpacing: 2.4, marginTop: 2 }}>CONTROL ROOM</Text>
            </View>
            {busy ? <ActivityIndicator color="#fff" /> : null}
            {gate === 'open' ? <Pressable onPress={lockNow} hitSlop={8}><View style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, backgroundColor: CARD, borderWidth: 1, borderColor: LINE, ...RAISED }}><Text style={{ color: GOLD, fontWeight: '800', fontSize: 12.5 }}>🔒 Lock</Text></View></Pressable> : null}
          </View>
          {!isAdmin ? <Text style={{ color: dim, marginTop: 24 }}>This page is only for the app owner.</Text> : gate !== 'open' ? (
            <View style={{ marginTop: 40, borderRadius: 22, padding: 20, backgroundColor: CARD, borderWidth: 1, borderColor: LINE, overflow: 'hidden', ...RAISED }}>
              <Shine h={80} />
              <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: GOLD }} />
              <Text style={{ fontSize: 28 }}>🔐</Text>
              <Text style={{ color: W, fontSize: 20, fontWeight: '800', marginTop: 8 }}>{gate === 'set' ? (pin1 ? 'Type it again' : 'Set your admin code') : 'Enter your admin code'}</Text>
              <Text style={{ color: dim, fontSize: 12.5, marginTop: 4, marginBottom: 16, lineHeight: 18 }}>{gate === 'set' ? (pin1 ? 'Type the same 6 digits once more to confirm.' : 'Choose 6 digits that only you know. You will need them every time you open Admin.') : 'This extra code keeps the admin page safe even if someone learns your password.'}</Text>
              {gate === 'loading' ? <ActivityIndicator color={GOLD} /> : <CodeBoxes key={gate + (pin1 ? '2' : '1')} value={pin} onChange={setPin} length={6} mask shake={gmsg} />}
              {gmsg ? <Text style={{ color: '#ffb3bf', fontSize: 12.5, lineHeight: 18 }}>{gmsg}</Text> : null}
              {err ? <Text style={{ color: '#ffb3bf', fontSize: 12.5, marginTop: 6 }}>{err}</Text> : null}
            </View>
          ) : <>
            {err ? <Text style={{ color: '#ffc2cc', marginTop: 14 }}>{err}</Text> : null}
            {ov ? <View style={{ marginTop: 28 }}>
              <View style={{ borderRadius: 22, padding: 18, backgroundColor: CARD, borderWidth: 1, borderColor: LINE, overflow: 'hidden', ...RAISED }}>
                <Shine h={70} />
                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: GOLD }} />
                <Text style={{ color: GOLD, fontSize: 11, fontWeight: '800', letterSpacing: 2 }}>TOTAL INCOME</Text>
                <Text style={{ color: W, fontSize: 38, fontWeight: '800', letterSpacing: -1, marginTop: 4 }}>{rm(ov.income)}</Text>
                <View style={{ flexDirection: 'row', marginTop: 12, gap: 10 }}>
                  <View style={{ flex: 1, borderRadius: 12, padding: 10, backgroundColor: 'rgba(245,199,107,.1)' }}><Text style={{ color: dim, fontSize: 11 }}>This month</Text><Text style={{ color: GOLD, fontSize: 17, fontWeight: '800', marginTop: 1 }}>{rm(ov.income_month)}</Text></View>
                  <View style={{ flex: 1, borderRadius: 12, padding: 10, backgroundColor: 'rgba(94,231,181,.1)' }}><Text style={{ color: dim, fontSize: 11 }}>Sold this month</Text><Text style={{ color: EM, fontSize: 17, fontWeight: '800', marginTop: 1 }}>{ov.sold_month}</Text></View>
                </View>
              </View>
              <View style={{ borderRadius: 18, padding: 14, backgroundColor: CARD, borderWidth: 1, borderColor: 'rgba(255,255,255,.09)', marginTop: 10, overflow: 'hidden', ...RAISED }}>
                <Shine h={44} />
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={{ color: W, fontSize: 22, fontWeight: '800' }}>{ov.active}</Text>
                  <Text style={{ color: dim, fontSize: 13 }}>{' of ' + ov.users + ' users activated'}</Text>
                </View>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.1)', marginTop: 10, overflow: 'hidden' }}>
                  <LinearGradient colors={GR} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 8, width: (ov.users ? Math.max(3, Math.round((ov.active / ov.users) * 100)) : 0) + '%' }} />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <Mini l="New this week" v={ov.new_7d} c="#8fe9e2" ic="✨" /><Mini l="Codes unused" v={ov.codes_unused} c={GOLD} ic="🔑" /><Mini l="Given free" v={ov.free_total} c="#ff9ecb" ic="🎁" />
              </View>
            </View> : null}

            {gr ? (() => { const mx = Math.max(1, ...gr.days.map((x) => x.n)); const tot = gr.days.reduce((a, x) => a + x.n, 0); return (
              <View style={{ marginTop: 10, borderRadius: 18, padding: 14, backgroundColor: CARD, borderWidth: 1, borderColor: 'rgba(255,255,255,.09)', overflow: 'hidden', ...RAISED }}>
                <Shine h={44} />
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}><Text style={{ flex: 1, color: W, fontWeight: '800', fontSize: 15 }}>Growth</Text><Text style={{ color: dim, fontSize: 12 }}>{tot + ' new in 14 days  ·  ' + gr.active7 + ' signed in this week'}</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 70, gap: 4, marginTop: 12 }}>
                  {gr.days.map((x) => <View key={x.d} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 70 }}><LinearGradient colors={GR} style={{ width: '100%', borderRadius: 4, height: x.n ? Math.max(6, Math.round((x.n / mx) * 62)) : 3, opacity: x.n ? 1 : 0.35 }} /></View>)}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}><Text style={{ color: dim, fontSize: 10.5 }}>{gr.days[0] ? day(gr.days[0].d) : ''}</Text><Text style={{ color: dim, fontSize: 10.5 }}>Today</Text></View>
              </View>); })() : null}

            <View style={{ marginTop: 10, borderRadius: 18, padding: 14, backgroundColor: CARD, borderWidth: 1, borderColor: 'rgba(255,255,255,.09)', overflow: 'hidden', ...RAISED }}>
              <Shine h={44} />
              <Text style={{ color: W, fontWeight: '800', fontSize: 15 }}>Announcement</Text>
              <Text style={{ color: dim, fontSize: 12, marginTop: 3, marginBottom: 10 }}>{ann ? 'Showing now: ' + ann : 'Nothing showing. Write a message and every user sees it on their Dashboard.'}</Text>
              <Inp value={annText} onChangeText={(t: string) => setAnnText(t.slice(0, 300))} placeholder="e.g. A new version is ready. Please update." multiline />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <Pill t="Publish" on c={EM} onPress={() => { if (annText.trim()) publish(annText); }} />
                {ann ? <Pill t={ask === 'ann' ? 'Tap again to remove' : 'Remove'} on={ask === 'ann'} c="#ff8fa0" onPress={() => { if (ask !== 'ann') { setAsk('ann'); return; } setAsk(''); publish(''); }} /> : null}
              </View>
            </View>

            <View style={{ marginTop: 22, borderRadius: 22, padding: 18, backgroundColor: CARD, borderWidth: 1, borderColor: LINE, overflow: 'hidden', ...RAISED }}>
              <Shine h={80} />
              <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: EM }} />
              <Text style={{ color: W, fontSize: 18, fontWeight: '800' }}>Make activation codes</Text>
              <Text style={{ color: dim, fontSize: 12, marginTop: 3, marginBottom: 14 }}>One code works for one person, once, for life.</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                <Pill t="Paid" on={!free} onPress={() => setFree(false)} c={EM} /><Pill t="Free (gift)" on={free} onPress={() => setFree(true)} c="#ff9ecb" />
              </View>
              <Inp value={note} onChangeText={setNote} placeholder="Who is it for? (optional)" />
              {!free ? <>
                <View style={{ marginTop: 8 }}><Inp value={price} onChangeText={(t: string) => setPrice(t.replace(/[^0-9.,]/g, '').slice(0, 7))} keyboardType="decimal-pad" placeholder="Price paid (RM)" /></View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>{METHODS.map((m) => <Pill key={m} t={m} on={method === m} onPress={() => setMethod(m)} />)}</View>
              </> : <Text style={{ color: '#ffc2dd', fontSize: 12, marginTop: 8 }}>Free codes are not counted in your income.</Text>}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'center' }}>
                <View style={{ width: 80 }}><Inp value={cnt} onChangeText={(t: string) => setCnt(t.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" placeholder="How many" /></View>
                <Pressable onPress={make} disabled={busy} style={{ flex: 1 }}><LinearGradient colors={GR} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#0b1512', fontSize: 15, fontWeight: '800' }}>Make code</Text></LinearGradient></Pressable>
              </View>
              {fresh.map((c) => (
                <View key={c} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(94,231,181,.14)', borderWidth: 1, borderColor: 'rgba(94,231,181,.4)' }}>
                  <Text selectable style={{ flex: 1, color: '#bff5df', fontSize: 18, fontWeight: '800', letterSpacing: 1.5 }}>{c}</Text>
                  <Pressable onPress={() => send(c)} hitSlop={8}><Text style={{ color: GOLD, fontWeight: '800' }}>Send</Text></Pressable>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 26 }}>
              {(['users', 'codes', 'inbox', 'log'] as const).map((t) => (
                <Pressable key={t} onPress={() => setTab(t)} style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: tab === t ? GOLD : CARD, borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', ...RAISED }}>
                  <Text style={{ color: tab === t ? '#0b1512' : W, fontWeight: '800', fontSize: 13 }}>{t === 'users' ? 'Users (' + users.length + ')' : t === 'codes' ? 'Codes (' + codes.length + ')' : t === 'inbox' ? 'Inbox (' + fb.length + ')' : 'Log (' + att.length + ')'}</Text>
                </Pressable>
              ))}
            </View>
            {tab === 'users' ? <View style={{ marginTop: 12, flexDirection: 'row', gap: 8, alignItems: 'center' }}><View style={{ flex: 1 }}><Inp value={q} onChangeText={setQ} placeholder="Search by name or email" autoCapitalize="none" /></View><Pill t="Export" on={false} onPress={exportUsers} /></View> : null}
            {tab === 'codes' ? <View style={{ marginTop: 12, flexDirection: 'row' }}><Pill t="Export all codes" on={false} onPress={exportCodes} /></View> : null}
            {tab === 'users' ? users.filter((u) => !q.trim() || (u.email + ' ' + (u.name || '')).toLowerCase().includes(q.trim().toLowerCase())).map((u) => (
              <Pressable key={u.id} onPress={() => { setOpen(open === u.id ? '' : u.id); setAsk(''); }} style={{ marginTop: 10, padding: 12, borderRadius: 18, backgroundColor: CARD, borderWidth: 1, borderColor: open === u.id ? 'rgba(245,199,107,.55)' : 'rgba(255,255,255,.09)', overflow: 'hidden', ...RAISED }}>
                <Shine h={36} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <LinearGradient colors={GR} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#0b1512', fontSize: 18, fontWeight: '800' }}>{initial(u)}</Text></LinearGradient>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ flex: 1, color: W, fontWeight: '700' }} numberOfLines={1}>{u.name || u.email}</Text>
                      <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, backgroundColor: u.active ? 'rgba(94,231,181,.18)' : 'rgba(255,196,107,.18)' }}><Text style={{ color: u.active ? '#5ee7b5' : '#ffc46b', fontSize: 10.5, fontWeight: '800' }}>{u.active ? 'ACTIVE' : 'NOT ACTIVE'}</Text></View>
                    </View>
                    <Text style={{ color: dim, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{u.email}</Text>
                    <Text style={{ color: dim, fontSize: 11.5, marginTop: 1 }}>{'Joined ' + day(u.created_at) + '  ·  Last sign in ' + day(u.last_sign_in_at)}</Text>
                    {dv[u.id] ? <Text style={{ color: dv[u.id].n > 3 ? '#ffb86b' : dim, fontSize: 11.5, marginTop: 1 }}>{dv[u.id].n + (dv[u.id].n === 1 ? ' device' : ' devices') + ' signed in  ·  last active ' + day(dv[u.id].last_at)}</Text> : null}
                    {!u.confirmed ? <Text style={{ color: '#ffc46b', fontSize: 11.5, fontWeight: '700', marginTop: 2 }}>Email not confirmed</Text> : null}
                  </View>
                </View>
                {open === u.id ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {u.active
                      ? <Pill t={ask === 'off' + u.id ? 'Tap again to remove access' : 'Remove access'} on={ask === 'off' + u.id} c="#ff8fa0" onPress={() => act('admin_set_license', { p_user: u.id, p_on: false }, 'off' + u.id)} />
                      : <Pill t={ask === 'on' + u.id ? 'Tap again to activate' : 'Activate without a code'} on={ask === 'on' + u.id} c="#5ee7b5" onPress={() => act('admin_set_license', { p_user: u.id, p_on: true }, 'on' + u.id)} />}
                    {dv[u.id] ? <Pill t={ask === 'so' + u.id ? 'Tap again to sign out' : 'Sign out all devices'} on={ask === 'so' + u.id} c="#ffb86b" onPress={() => act('admin_signout_user', { p_user: u.id }, 'so' + u.id)} /> : null}
                    <Pill t={ask === 'pw' + u.id ? 'Tap again to reset' : 'Reset password'} on={ask === 'pw' + u.id} c="#8fb4ff" onPress={() => resetPw(u.id)} />
                    {!u.confirmed ? <Pill t={ask === 'cf' + u.id ? 'Tap again to confirm' : 'Confirm email'} on={ask === 'cf' + u.id} c="#ffc46b" onPress={() => act('admin_confirm_email', { p_user: u.id }, 'cf' + u.id)} /> : null}
                  </View>
                ) : null}
                {tmp && tmp.id === u.id ? (
                  <View style={{ marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(143,180,255,.14)', borderWidth: 1, borderColor: 'rgba(143,180,255,.4)' }}>
                    <Text style={{ color: dim, fontSize: 11.5 }}>Temporary password. They were signed out. Send it to them; they can change it in Settings.</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <Text selectable style={{ flex: 1, color: '#cfe0ff', fontSize: 17, fontWeight: '800', letterSpacing: 1 }}>{tmp.pw}</Text>
                      <Pressable onPress={() => Share.share({ message: 'Your temporary My Life password: ' + tmp.pw + '\nSign in with it, then change it in Settings > Change password.' })} hitSlop={8}><Text style={{ color: GOLD, fontWeight: '800' }}>Send</Text></Pressable>
                    </View>
                  </View>
                ) : null}
              </Pressable>
            )) : tab === 'codes' ? codes.map((c) => (
              <View key={c.code} style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: CARD, borderWidth: 1, borderColor: 'rgba(255,255,255,.09)', overflow: 'hidden', ...RAISED }}>
                <Shine h={36} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text selectable style={{ flex: 1, color: W, fontWeight: '800', letterSpacing: 1 }}>{c.code}</Text>
                  {c.redeemed_at ? <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}><Text style={{ color: dim, fontSize: 11.5, fontWeight: '800' }}>USED</Text><Pressable onPress={() => act('admin_delete_code', { p_code: c.code }, 'dc' + c.code)} hitSlop={8}><Text style={{ color: '#ff8fa0', fontWeight: '800', fontSize: 12.5 }}>{ask === 'dc' + c.code ? 'Tap again' : 'Clear'}</Text></Pressable></View> : <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}><Pressable onPress={() => send(c.code)} hitSlop={8}><Text style={{ color: GOLD, fontWeight: '800' }}>Send</Text></Pressable><Pressable onPress={() => act('admin_delete_code', { p_code: c.code }, 'dc' + c.code)} hitSlop={8}><Text style={{ color: '#ff8fa0', fontWeight: '800' }}>{ask === 'dc' + c.code ? 'Tap again' : 'Delete'}</Text></Pressable></View>}
                </View>
                <Text style={{ color: dim, fontSize: 12, marginTop: 2 }}>{(c.note ? c.note + '  ·  ' : '') + (c.free ? 'Free  ·  ' : c.price != null ? rm(c.price) + (c.method ? ' ' + c.method : '') + '  ·  ' : '') + (c.redeemed_at ? 'Used by ' + (c.used_by || 'a deleted account') + ' on ' + day(c.redeemed_at) : 'Made ' + day(c.created_at))}</Text>
              </View>
            )) : tab === 'inbox' ? (fb.length ? fb.map((f) => (
              <View key={f.id} style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: CARD, borderWidth: 1, borderColor: 'rgba(255,255,255,.09)', overflow: 'hidden', ...RAISED }}>
                <Shine h={36} />
                <Text selectable style={{ color: W, fontSize: 13.5, lineHeight: 19 }}>{f.msg}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Text style={{ flex: 1, color: dim, fontSize: 11.5 }} numberOfLines={1}>{(f.email || '') + '  ·  ' + day(f.created_at)}</Text>
                  <Pressable onPress={() => act('admin_feedback_delete', { p_id: f.id }, 'fb' + f.id)} hitSlop={8}><Text style={{ color: '#ff8fa0', fontWeight: '800', fontSize: 12.5 }}>{ask === 'fb' + f.id ? 'Tap again to delete' : 'Delete'}</Text></Pressable>
                </View>
              </View>
            )) : <Text style={{ color: dim, marginTop: 16 }}>No messages yet. Users can send feedback from Settings.</Text>)
            : (att.length ? att.map((a) => (
              <View key={a.email} style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: CARD, borderWidth: 1, borderColor: a.tries_24h >= 8 ? 'rgba(255,143,160,.5)' : 'rgba(255,255,255,.09)', overflow: 'hidden', ...RAISED }}>
                <Shine h={36} />
                <Text style={{ color: W, fontWeight: '700' }} numberOfLines={1}>{a.email}</Text>
                <Text style={{ color: dim, fontSize: 12, marginTop: 2 }}>{a.tries + ' wrong tries  ·  ' + a.tries_24h + ' in the last 24 hours  ·  last ' + day(a.last_at)}</Text>
              </View>
            )) : <Text style={{ color: dim, marginTop: 16 }}>No wrong codes in the last 30 days.</Text>)}
          </>}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
