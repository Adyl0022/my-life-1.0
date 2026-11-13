import React, { useState } from 'react';
import { PageIn } from '../../components/PageIn';
import { navScroll } from '../../lib/navbar';
import { View, ScrollView, Pressable, TextInput, Modal, Animated, Easing, Linking, Platform, Keyboard } from 'react-native';
import * as Notifications from 'expo-notifications';
import { setup } from '../../lib/adhan';
import { Text } from '../../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useRouter, useFocusEffect } from 'expo-router';
import { Glass } from '../../components/Glass';
import { Blob } from '../../components/Bg';
import { SettingsBg } from '../../components/SettingsBg';
import { useStored, clearMine, DEFAULT_NAME } from '../../lib/store';
import { Logo } from '../../components/AuthScreen';
import { useIsAdmin } from '../../lib/admin';
import { useLicense } from '../../lib/license';
import { supabase } from '../../lib/supabase';
import { Announcement } from '../../components/Announcement';
import { RegionCard } from '../../components/RegionCard';
import { ModulesCard } from '../../components/ModulesCard';
import { useHidden } from '../../lib/hidden';
import { markSeen, useAnnouncement } from '../../lib/announcement';
import { useSession, signOut, checkPassword, setNewPassword, deleteAccount } from '../../lib/auth';
import { call as famCall } from '../../lib/family';
import { syncNow, syncState, wipeCloud } from '../../lib/sync';
import { PRIVACY, TERMS, COPYRIGHT, WHATS_NEW, LICENCES, HOWTO, FAQ, SUPPORT_EMAIL, SUPPORT_EMAIL2, PRIVACY_URL, Sec } from '../../lib/legal';
import { TOP } from '../../lib/layout';
import { useLock, setPin, patchLock, disableLock, bioReady, AFTER } from '../../lib/lock';
import { PinDialog } from '../../components/LockScreen';
import { useKb } from '../../lib/keyboard';
import { storageInfo, clearTemp, fmtBytes, pickText, parseBackup, applyBackup, Backup } from '../../lib/storage';

const W = '#fff', DIM = 'rgba(255,255,255,.7)';
const G = ['#34d399', '#5ee7df'] as [string, string];
const GP = ['#7c9cff', '#b794ff'] as [string, string];

const Ttl = ({ t }: { t: string }) => <Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>{t}</Text>;
const Lbl = ({ t, style }: { t: string; style?: any }) => <Text style={[{ color: DIM, fontSize: 11.5, marginTop: 2, lineHeight: 16 }, style]}>{t}</Text>;
const TILE: Record<string, [string, string]> = {
  ev: ['#7c9cff', '#5b7bff'], pr: ['#34d399', '#12a58a'], zk: ['#ffc46b', '#ff8f5a'], wt: ['#5ee7df', '#4a8dff'], qh: ['#b794ff', '#7059e8'],
  export: ['#5ee7b5', '#26b8c9'], lang: ['#c79bff', '#ff8fab'], pw: ['#7c9cff', '#9a7bff'], nd: ['#ffc46b', '#ff7a6b'], dev: ['#8aa4d8', '#5d6fa8'], bk: ['#5ee7df', '#3aa6c9'], log: ['#ff8fab', '#b794ff'],
};
function Glyph({ k }: { k: string }) {
  const p = { stroke: '#fff', strokeWidth: 1.9, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      {k === 'ev' && <><Rect x={4} y={5} width={16} height={15} rx={3} {...p} /><Path d="M4 10h16M8 3v4M16 3v4M9 15l2 2 4-4" {...p} /></>}
      {k === 'pr' && <Path d="M3 21h18M5 21v-7M19 21v-7M7 14a5 5 0 0 1 10 0M12 4v3M10 21v-3a2 2 0 0 1 4 0v3" {...p} />}
      {k === 'zk' && <>{Array.from({ length: 8 }, (_, i) => { const t = (i / 8) * Math.PI * 2; return <Circle key={i} cx={12 + 7 * Math.cos(t)} cy={11 + 7 * Math.sin(t)} r={1.7} fill="#fff" />; })}<Path d="M12 18.5v3.2" {...p} /></>}
      {k === 'wt' && <Path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" {...p} />}
      {k === 'qh' && <Path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" {...p} />}
      {k === 'export' && <Path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14" {...p} />}
      {k === 'lang' && <><Circle cx={12} cy={12} r={9} {...p} /><Path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" {...p} /></>}
      {k === 'pw' && <><Rect x={5} y={11} width={14} height={10} rx={3} {...p} /><Path d="M8 11V8a4 4 0 0 1 8 0v3M12 15v2" {...p} /></>}
      {k === 'nd' && <Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM12 8v5M12 16v.4" {...p} />}
      {k === 'dev' && <><Rect x={7} y={2.5} width={10} height={19} rx={3} {...p} /><Path d="M11 18h2" {...p} /></>}
      {k === 'bk' && <Path d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9.5 3.7 3.7 0 0 1 17.5 18zM12 15v-5M9.5 12L12 9.5 14.5 12" {...p} />}
      {k === 'log' && <><Circle cx={12} cy={12} r={9} {...p} /><Path d="M12 7v5l3 2" {...p} /></>}
    </Svg>
  );
}
const Dot = ({ c = 'rgba(255,255,255,.14)', k }: { c?: string; k?: string }) => k && TILE[k]
  ? <LinearGradient colors={TILE[k]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><Glyph k={k} /></LinearGradient>
  : <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: c, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} /></View>;
// Admin only: how many devices are signed in to this account, and a button to sign out the others.
function Devices() {
  const [d, setD] = useState<{ count: number; last: string | null } | null>(null); const [busy, setB] = useState(false); const [done, setDone] = useState(false);
  const load = () => { supabase.rpc('my_devices').then(({ data, error }) => { if (!error && data) setD(data as any); }, () => {}); };
  React.useEffect(() => { load(); }, []);
  if (!d) return null;
  const out = async () => { setB(true); try { await supabase.auth.signOut({ scope: 'others' }); setDone(true); load(); } catch {} setB(false); };
  return (
    <Glass style={{ padding: 16 }}>
      <Ttl t="Devices signed in" />
      <Lbl t={d.count + (d.count === 1 ? ' device' : ' devices') + ' use your account' + (d.last ? '. Last active ' + new Date(d.last).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '')} />
      <View style={{ flexDirection: 'row', marginTop: 12 }}><Btn t={busy ? 'Signing out…' : done ? 'Other devices signed out' : 'Sign out other devices'} onPress={out} /></View>
    </Glass>
  );
}
const Chev = () => <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 20 }}>›</Text>;
const Sw = ({ on }: { on: boolean }) => (
  <LinearGradient colors={on ? G : ['rgba(255,255,255,.22)', 'rgba(255,255,255,.22)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 26, borderRadius: 13, padding: 3 }}>
    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', marginLeft: on ? 18 : 0 }} />
  </LinearGradient>
);
function Row({ ic, k, t, sub, right, onPress, last }: { ic?: string; k?: string; t: string; sub?: string; right?: React.ReactNode; onPress?: () => void; last?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(255,255,255,.1)' }}>
      {ic || k ? <Dot c={ic} k={k} /> : null}
      <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14, fontWeight: '600' }}>{t}</Text>{sub ? <Lbl t={sub} /> : null}</View>
      {right}
    </Pressable>
  );
}
const Btn = ({ t, onPress, kind = 'glass', style }: { t: string; onPress: () => void; kind?: 'glass' | 'danger' | 'warn' | 'primary'; style?: any }) => {
  const c = kind === 'danger' ? ['rgba(255,107,129,.28)', 'rgba(255,107,129,.28)'] : kind === 'warn' ? ['rgba(255,196,107,.26)', 'rgba(255,196,107,.26)'] : kind === 'primary' ? GP : ['rgba(255,255,255,.12)', 'rgba(255,255,255,.12)'];
  return (
    <Pressable onPress={onPress} style={[{ flex: 1 }, style]}>
      <LinearGradient colors={c as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}>
        <Text style={{ color: kind === 'danger' ? '#ffb3bf' : kind === 'warn' ? '#ffd593' : W, fontSize: 13.5, fontWeight: '700' }}>{t}</Text>
      </LinearGradient>
    </Pressable>
  );
};
const Inp = (p: any) => <TextInput placeholderTextColor="rgba(255,255,255,.4)" {...p} style={[{ color: W, fontSize: 14, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(0,0,0,.28)', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)', outlineStyle: 'none' } as any, p.style]} />;

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const kb = useKb();
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(5,8,25,.72)', justifyContent: 'center', padding: 24, paddingBottom: 24 + kb }}>
        <Pressable onPress={onClose} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        {children}
      </View>
    </Modal>
  );
}
function Float({ children }: { children: React.ReactNode }) {
  const v = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    a.start(); return () => a.stop();
  }, [v]);
  return <Animated.View style={{ transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [4, -8] }) }] }}>{children}</Animated.View>;
}

function Doc({ title, secs, onClose }: { title: string; secs: Sec[]; onClose: () => void }) {
  return (
    <Overlay onClose={onClose}>
      <View style={{ maxHeight: '82%', padding: 18, borderRadius: 26, backgroundColor: '#131845', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
        <Text style={{ color: W, fontSize: 18, fontWeight: '800', marginBottom: 18 }}>{title}</Text>
        <ScrollView>{secs.map((s) => (<View key={s.h} style={{ marginBottom: 16 }}><Text style={{ color: '#8fe9e2', fontSize: 12.5, fontWeight: '700' }}>{s.h}</Text><Text style={{ color: '#fff', fontSize: 13.5, lineHeight: 20, marginTop: 3 }}>{s.p}</Text></View>))}</ScrollView>
        <View style={{ flexDirection: 'row', marginTop: 8 }}><Btn t="Close" onPress={onClose} /></View>
      </View>
    </Overlay>
  );
}

type Dev = { id: string; name: string; note: string; cur: boolean };

export default function Settings() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [name, setName] = useStored<string>('ml_name', DEFAULT_NAME);
  const [draft, setDraft] = useState<string | null>(null);
  const [nameMsg, setNameMsg] = useState('');
  const [tg, setTg] = useStored<Record<string, boolean>>('ml_toggles', { ev: true, pr: true, zk: true, qh: true });
  const kb = useKb(); const sref = React.useRef<any>(null);
  const dlgR = React.useRef(''); 
  React.useEffect(() => { if (kb > 0 && !dlgR.current) setTimeout(() => sref.current?.scrollToEnd({ animated: true }), 80); }, [kb]);
  const [upd, setUpd] = useState<'' | 'busy' | 'latest' | 'new' | 'web' | 'err'>('');
  const lastChk = React.useRef(0);
  const checkUpd = async () => {
    const cur = String(process.env.EXPO_PUBLIC_BUILD_SHA || '').slice(0, 7);
    if (Platform.OS === 'web') return setUpd('web');
    if (upd === 'busy') return;
    // A result from the last half minute is still fresh: keep showing it instead of flashing "Checking" again.
    if ((upd === 'latest' || upd === 'new') && Date.now() - lastChk.current < 30000) return;
    setUpd('busy');
    const wait = new Promise((r) => setTimeout(r, 700));
    try {
      const r = await fetch('https://api.github.com/repos/Adyl0022/my-life-1.0/releases/tags/apk-latest', { headers: { Accept: 'application/vnd.github+json' } });
      if (!r.ok) throw new Error('x');
      const j = await r.json(); const m = /commit ([0-9a-f]{7})/.exec(String(j.body || ''));
      await wait; lastChk.current = Date.now();
      if (!m || !cur) return setUpd('err');
      setUpd(m[1] === cur ? 'latest' : 'new');
    } catch (e) { await wait; setUpd('err'); }
  };
    const [bkRem, setBkRem] = useStored<boolean>('ml_backup_rem', false);
  const [bkLast] = useStored<number>('ml_backup_last', 0);
  const mail = (subj: string, body: string) => Linking.openURL('mailto:' + SUPPORT_EMAIL + '?cc=' + SUPPORT_EMAIL2 + '&subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body)).catch(() => say('No email app found. Write to ' + SUPPORT_EMAIL + ' or ' + SUPPORT_EMAIL2));
  const info = 'App: My Life 1.0 (1.0.0, build 1)\nPhone: ' + Platform.OS + ' ' + String(Platform.Version) + '\n\n';
  const testNotif = async () => {
    if (Platform.OS === 'web') return say('Notifications work in the phone app only');
    try {
      if (!(await setup())) return say('Allow notifications for My Life in your phone settings');
      await Notifications.scheduleNotificationAsync({ identifier: 'test-now', content: { title: 'Test notification', body: 'Your reminders are working.', sound: true }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: 'prayer' } as any });
      say('Sent. It will appear in 3 seconds');
    } catch (e) { say('Could not send a test notification'); }
  };
  const [dlgState, setDlg0] = useState<'' | 'out' | 'reset' | 'delete' | 'pw' | 'fb' | 'privacy' | 'terms' | 'new' | 'lic' | 'backup' | 'log' | 'howto' | 'faq' | 'copy' | 'done' | 'restore' | 'confirm'>('');
  const dlg = dlgState; const setDlg = (v: typeof dlgState) => { dlgR.current = v; setDlg0(v); };
  const [bk, setBk] = useState<Backup | null>(null); const [bkErr, setBkErr] = useState('');
  const [sto, setSto] = useState<{ data: number; temp: number } | null>(null); const [stoMsg, setStoMsg] = useState('');
  React.useEffect(() => { if (tab === 2) storageInfo().then(setSto); }, [tab]);
  const [doneMsg, setDoneMsg] = useState('');
  const [typed, setTyped] = useState(''); const [pwv, setPwv] = useState('');
  const [p1, setP1] = useState(''); const [p2, setP2] = useState(''); const [p3, setP3] = useState(''); const [pwErr, setPwErr] = useState('');
  const [toast, setToast] = useState('');
  const { cfg: lk } = useLock();
  const [lkd, setLkd] = useState<'' | 'set' | 'off' | 'chk' | 'change'>('');
  const [bioAv, setBioAv] = useState(false);
  React.useEffect(() => { bioReady().then(setBioAv); }, []);
  const say = (t: string) => { setToast(t); setTimeout(() => setToast(''), 2200); };
  const close = () => { setDlg(''); setTyped(''); setPwv(''); setP1(''); setP2(''); setP3(''); setPwErr(''); };

  const TOG: [string, string, string][] = [['ev', 'Event reminders', 'Before each Planner event'], ['qh', 'Quiet hours', 'Mute alerts from 12 am to 5 am']];
  const hid = useHidden();
  const TOGSHOW = TOG.filter(([k]) => (k === 'ev' ? hid.on('planner') : true));
  const isDel = dlg === 'delete';
  const [fam, setFam] = useState<{ name: string; role: string; n: number } | null>(null);
  const askDelete = () => {
    setFam(null); setDlg('delete');
    famCall<any>('family_info').then((r) => { if (r && r.state === 'ready') setFam({ name: r.name, role: r.role, n: r.members.length }); }).catch(() => {});
  };
  const canGo = isDel ? typed.trim().toUpperCase() === 'DELETE' && pwv.length > 0 : typed.trim().toUpperCase() === 'RESET';

  const [sess] = useSession(); const lic = useLicense(); const isAdmin = useIsAdmin(); const [busy, setBusy] = useState(false); const [synced, setSynced] = useState(syncState.last);
  const { a: annNow } = useAnnouncement();
  useFocusEffect(React.useCallback(() => { const t = setTimeout(markSeen, 1200); return () => clearTimeout(t); }, [annNow?.id]));
  const [fbText, setFbText] = useState(''); const [fbMsg, setFbMsg] = useState('');
  const sendFb = async () => {
    if (busy) return; const m = fbText.trim(); if (!m) return setFbMsg('Please write something first.');
    setBusy(true); setFbMsg('');
    try { const { error } = await supabase.rpc('send_feedback', { p_msg: m }); if (error) setFbMsg(error.message.includes('too_many') ? 'Too many messages. Please try again later.' : 'Could not send. Check your internet and try again.'); else { setFbText(''); close(); say('Thank you! Your message was sent.'); } }
    catch { setFbMsg('No internet connection.'); }
    setBusy(false);
  };
  const savePw = async () => {
    if (busy) return;
    if (!p1) return setPwErr('Enter your current password.');
    if (p2.length < 8) return setPwErr('New password must be at least 8 characters.');
    if (p2 !== p3) return setPwErr('The two new passwords do not match.');
    if (p2 === p1) return setPwErr('Choose a password different from the current one.');
    setBusy(true);
    if (!(await checkPassword(p1))) { setBusy(false); return setPwErr('Your current password is wrong, or there is no internet.'); }
    const r = await setNewPassword(p2); setBusy(false);
    if (!r.ok) return setPwErr(r.err);
    close(); say('Password updated');
  };
  const doSync = async () => { if (busy) return; setBusy(true); const ok = await syncNow(); setBusy(false); setSynced(syncState.last); say(ok ? 'Synced' : 'Could not sync. Check your internet'); };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <LinearGradient colors={['#0a0f2c', '#1a1048', '#0c2b4d']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <SettingsBg tab={tab} />
      <PageIn i={3}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView ref={sref} onScroll={navScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 130 + kb }}>
          <Text style={{ color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Settings</Text>
          <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)', marginTop: 14 }}>
            {['General', 'Security', 'About'].map((n, i) => (
              <Pressable key={n} onPress={() => setTab(i)} style={{ flex: 1 }}>
                {tab === i ? <LinearGradient colors={GP} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 8, borderRadius: 999, alignItems: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{n}</Text></LinearGradient>
                  : <View style={{ paddingVertical: 8, alignItems: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{n}</Text></View>}
              </Pressable>
            ))}
          </View>

          {tab === 0 && (
            <View style={{ gap: 12, marginTop: 14 }}>
              <Announcement />
              <RegionCard />
              <ModulesCard />
              <Glass style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
                <View style={{ paddingTop: 8 }}><Ttl t="Reminders and notifications" /></View>
                {TOGSHOW.map(([k, t, s], i) => <Row key={k} k={k} ic="x" t={t} sub={s} last={i === TOGSHOW.length - 1} onPress={() => setTg({ ...tg, [k]: !tg[k] })} right={<Sw on={!!tg[k]} />} />)}
              </Glass>

              <Glass style={{ padding: 16 }}>
                <Ttl t="Notifications" />
                <View style={{ flexDirection: 'row', marginTop: 12 }}><Btn t="Send a test notification" onPress={testNotif} /></View>
              </Glass>

              {isAdmin ? <Pressable onPress={() => router.push('/admin' as any)}>
                <Glass style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1 }}><Ttl t="Admin" /><Lbl t="Users, activation codes and who has paid" /></View>
                  <Chev />
                </Glass>
              </Pressable> : null}
              {isAdmin ? <Devices /> : null}

              <Pressable onPress={() => router.push('/export' as any)}>
                <Glass style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Dot k="export" />
                  <View style={{ flex: 1 }}><Ttl t="Export all my data" /><Lbl t="Everything in one file: Excel, PDF, CSV or a full backup" /></View>
                  <Chev />
                </Glass>
              </Pressable>

              <Glass style={{ paddingHorizontal: 16 }}><Row k="lang" t="Language" last right={<Text style={{ color: DIM, fontSize: 12.5 }}>English</Text>} /></Glass>
              <Pressable onPress={() => setDlg('out')}><Glass style={{ paddingVertical: 14, alignItems: 'center' }}><Text style={{ color: '#ffb3bf', fontSize: 14, fontWeight: '700' }}>Log out</Text></Glass></Pressable>
            </View>
          )}

          {tab === 1 && (
            <View style={{ gap: 12, marginTop: 14 }}>
              <Glass style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Dot c="rgba(94,231,181,.4)" />
                <View style={{ flex: 1 }}><Ttl t="Saved on your phone, backed up online" /><Lbl t={sess ? 'Saved on this phone first, then backed up automatically to ' + (sess.user.email || 'your account') + '.' : 'Stored on this phone.'} /></View>
              </Glass>
              <Glass style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
                <Row k="pw" t="App lock" sub={lk.on ? 'On. Asks for ' + (lk.bio ? 'fingerprint or PIN' : 'your PIN') : 'Ask for a PIN or fingerprint to open the app'} last={!lk.on} onPress={() => setLkd(lk.on ? 'off' : 'set')} right={<Sw on={lk.on} />} />
                {lk.on ? (
                  <View style={{ paddingBottom: 12 }}>
                    {bioAv ? <Row k="pw" t="Use fingerprint or face" onPress={() => patchLock({ bio: !lk.bio })} right={<Sw on={lk.bio} />} /> : null}
                    <Text style={{ color: DIM, fontSize: 12, marginTop: 10, marginBottom: 6 }}>Lock again after the app has been closed for</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>{AFTER.map(([v, n]) => (
                      <Pressable key={v} onPress={() => patchLock({ after: v })} style={{ flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center', backgroundColor: lk.after === v ? 'rgba(124,156,255,.45)' : 'rgba(255,255,255,.1)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{n}</Text></Pressable>))}</View>
                    <Text style={{ color: DIM, fontSize: 12, marginTop: 12, marginBottom: 6 }}>What to lock</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>{([['all', 'Whole app'], ['sensitive', 'Finance, Notes, Records']] as const).map(([v, n]) => (
                      <Pressable key={v} onPress={() => patchLock({ scope: v })} style={{ flex: v === 'all' ? 1 : 1.6, paddingVertical: 8, borderRadius: 12, alignItems: 'center', backgroundColor: lk.scope === v ? 'rgba(124,156,255,.45)' : 'rgba(255,255,255,.1)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{n}</Text></Pressable>))}</View>
                    <View style={{ flexDirection: 'row', marginTop: 12 }}><Btn t="Change PIN" onPress={() => setLkd('chk')} /></View>
                  </View>
                ) : null}
              </Glass>
              <Glass style={{ padding: 16 }}>
                <Ttl t="Your account" />
                <Lbl t={'Activated  ·  ' + (lic.expires ? 'until ' + new Date(lic.expires).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'lifetime')} style={{ marginBottom: 4 }} />
                <Lbl t={(sess?.user?.email || '') + (synced ? '  ·  Last synced ' + new Date(synced).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '')} style={{ marginBottom: 10 }} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Btn t={busy ? 'Syncing…' : 'Sync now'} kind="primary" onPress={doSync} />
                  <Btn t="Change password" onPress={() => { setP1(''); setP2(''); setP3(''); setPwErr(''); setDlg('pw'); }} />
                </View>
                <View style={{ flexDirection: 'row', marginTop: 8 }}><Btn t="Send feedback" onPress={() => { setFbText(''); setFbMsg(''); setDlg('fb'); }} /></View>
              </Glass>
              <Glass style={{ paddingHorizontal: 16 }}>
                <Row k="bk" t="Backup reminder" sub={(bkLast ? 'Last backup ' + new Date(bkLast).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'You have not saved a backup yet') + (bkRem ? '. Reminds every 30 days' : '')} last onPress={() => setBkRem(!bkRem)} right={<Sw on={!!bkRem} />} />
              </Glass>
              <Glass style={{ paddingHorizontal: 16 }}>
                <Row k="bk" last t="Backup and restore" sub="Save a copy, or restore from a backup file" onPress={() => { setBkErr(''); setDlg('restore'); }} right={<Chev />} />
              </Glass>
              <Glass style={{ padding: 16 }}>
                <Ttl t="Account and data" />
                <Lbl t="Name shown on your Dashboard and in the assistant" style={{ marginBottom: 8 }} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Inp style={{ flex: 1 }} onFocus={() => setTimeout(() => sref.current?.scrollToEnd({ animated: true }), 350)} value={draft ?? name} onChangeText={(v: string) => { setDraft(v); setNameMsg(''); }} placeholder="Your name" maxLength={30} />
                  <Btn t="Save" kind="primary" style={{ flex: 0, minWidth: 80 }} onPress={() => { const v = (draft ?? name).trim(); if (!v) return setNameMsg('Please enter a name.'); setName(v); setDraft(null); setNameMsg('Saved. It will show on your Dashboard and assistant.'); }} />
                </View>
                {nameMsg ? <Text style={{ color: '#8fe9e2', fontSize: 12, marginTop: 6 }}>{nameMsg}</Text> : null}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <Btn t="Reset all data" kind="warn" onPress={() => setDlg('reset')} />
                  <Btn t="Delete account" kind="danger" onPress={askDelete} />
                </View>
              </Glass>
            </View>
          )}

          {tab === 2 && (
            <View style={{ gap: 12, marginTop: 14 }}>
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Float><View style={{ width: 110, height: 110, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 170, height: 170, transform: [{ scale: 0.62 }] }}><Logo waves={false} /></View></View></Float>
                <Text style={{ color: W, fontSize: 20, fontWeight: '800', marginTop: 10 }}>My Life 1.0</Text>
                <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginTop: 3 }}>YOUR LIFE, ALL IN ONE PLACE</Text>
                <Pressable onPress={checkUpd} style={{ marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, minWidth: 210, alignItems: 'center', borderRadius: 999, backgroundColor: upd === 'latest' || upd === 'web' ? 'rgba(94,231,181,.25)' : upd === 'new' ? 'rgba(124,156,255,.4)' : upd === 'err' ? 'rgba(255,196,107,.25)' : 'rgba(255,255,255,.12)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{upd === 'busy' ? 'Checking...' : upd === 'latest' ? "You're up to date" : upd === 'web' ? 'The web version is always the latest' : upd === 'new' ? 'A new version is available' : upd === 'err' ? 'Could not check. Tap to try again' : 'Check for updates'}</Text></Pressable>
                {upd === 'new' ? <Pressable onPress={() => Linking.openURL('https://github.com/Adyl0022/my-life-1.0/releases/tag/apk-latest')} style={{ marginTop: 8 }}><LinearGradient colors={GP} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 9, paddingHorizontal: 18, borderRadius: 999 }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>Download the new version</Text></LinearGradient></Pressable> : null}
              </View>
              <Glass style={{ paddingHorizontal: 16 }}>
                {[['Version', '1.0.0'], ['Build', '1'], ['Developed', 'November 2026'], ['Developer', 'Adli Syahmi']].map(([a, b], i) => <Row key={a} t={a} last={i === 3} right={<Text style={{ color: DIM, fontSize: 13 }}>{b}</Text>} />)}
              </Glass>
              <Glass style={{ paddingHorizontal: 16 }}>
                <Row t="What's new in 1.0.0" onPress={() => setDlg('new')} right={<Chev />} />
                <Row t="Privacy Policy" onPress={() => setDlg('privacy')} right={<Chev />} />
                <Row t="Privacy Policy on the web" onPress={() => Linking.openURL(PRIVACY_URL)} right={<Chev />} />
                <Row t="Terms of Use" onPress={() => setDlg('terms')} right={<Chev />} />
                <Row t="Copyright and licence" onPress={() => setDlg('copy')} right={<Chev />} />
                <Row t="Open-source licences" last onPress={() => setDlg('lic')} right={<Chev />} />
              </Glass>
              <Glass style={{ paddingHorizontal: 16 }}>
                <Row t="How to use My Life" onPress={() => setDlg('howto')} right={<Chev />} />
                <Row t="Help and FAQ" onPress={() => setDlg('faq')} right={<Chev />} />
                <Row t="Report a problem" onPress={() => mail('My Life: problem report', 'What happened?\n\n\nWhat did you expect?\n\n\n' + info)} right={<Chev />} />
                <Row t="Send feedback" last onPress={() => mail('My Life: feedback', 'My idea or comment:\n\n\n' + info)} right={<Chev />} />
              </Glass>
              <Glass style={{ padding: 16 }}>
                <Ttl t="Storage" />
                <Lbl t="What My Life uses on this phone" style={{ marginBottom: 10 }} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1, borderRadius: 14, padding: 12, backgroundColor: 'rgba(255,255,255,.08)' }}><Text style={{ color: W, fontSize: 16, fontWeight: '800' }}>{sto ? fmtBytes(sto.data) : '...'}</Text><Lbl t="Your data" /></View>
                  <View style={{ flex: 1, borderRadius: 14, padding: 12, backgroundColor: 'rgba(255,255,255,.08)' }}><Text style={{ color: W, fontSize: 16, fontWeight: '800' }}>{sto ? fmtBytes(sto.temp) : '...'}</Text><Lbl t="Temporary files" /></View>
                </View>
                <Lbl t="Temporary files are things like export files and leftovers. Clearing them is safe and never touches your data." style={{ marginTop: 10 }} />
                <View style={{ flexDirection: 'row', marginTop: 10 }}><Btn t="Clear temporary files" onPress={async () => { const n = await clearTemp(); setStoMsg(n > 0 ? 'Cleared ' + fmtBytes(n) : 'Nothing to clear'); setSto(await storageInfo()); }} /></View>
                {stoMsg ? <Text style={{ color: '#8fe9e2', fontSize: 12, marginTop: 6 }}>{stoMsg}</Text> : null}
              </Glass>
              <Glass style={{ padding: 16 }}>
                <Ttl t="Privacy at a glance" />
                {['Your data stays yours. It lives on your phone and is backed up to your own account.', 'Encrypted on your phone, with an optional PIN or fingerprint lock.', 'No ads, no tracking, never sold. Location is only used for prayer times.'].map((t) => (
                  <View key={t} style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}><Text style={{ color: '#5ee7df', fontSize: 13 }}>✓</Text><Text style={{ flex: 1, color: 'rgba(255,255,255,.82)', fontSize: 12.5, lineHeight: 18 }}>{t}</Text></View>
                ))}
              </Glass>
              <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11.5, textAlign: 'center' }}>© 2026 Adli Syahmi. All rights reserved.</Text>
            </View>
          )}
        </ScrollView>

        {lkd === 'set' && <PinDialog mode="new" onClose={() => setLkd('')} onOk={async (pin) => { await setPin(pin!, bioAv); setLkd(''); say('App lock is on'); }} />}
        {lkd === 'off' && <PinDialog mode="verify" bio={lk.bio} onClose={() => setLkd('')} onOk={async () => { await disableLock(); setLkd(''); say('App lock is off'); }} />}
        {lkd === 'chk' && <PinDialog mode="verify" bio={lk.bio} onClose={() => setLkd('')} onOk={() => setLkd('change')} />}
        {lkd === 'change' && <PinDialog mode="new" onClose={() => setLkd('')} onOk={async (pin) => { await setPin(pin!, lk.bio); setLkd(''); say('PIN changed'); }} />}
        {dlg === 'privacy' && <Doc title="Privacy Policy" secs={PRIVACY} onClose={close} />}
        {dlg === 'terms' && <Doc title="Terms of Use" secs={TERMS} onClose={close} />}
        {dlg === 'copy' && <Doc title="Copyright and licence" secs={COPYRIGHT} onClose={close} />}
        {dlg === 'new' && <Doc title="What's new in 1.0.0" secs={WHATS_NEW} onClose={close} />}
        {dlg === 'done' && (
          <Overlay onClose={() => { close(); router.replace('/' as any); }}><View style={{ padding: 22, borderRadius: 26, backgroundColor: '#131845', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', alignItems: 'center' }}>
            <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(94,231,181,.25)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#5ee7b5', fontSize: 28, fontWeight: '800' }}>✓</Text></View>
            <Text style={{ color: W, fontSize: 18, fontWeight: '800', marginTop: 12 }}>Done</Text>
            <Text style={{ color: DIM, fontSize: 13.5, lineHeight: 20, marginTop: 6, textAlign: 'center' }}>{doneMsg}</Text>
            <View style={{ flexDirection: 'row', marginTop: 16, alignSelf: 'stretch' }}><Btn t="Back to Home" kind="primary" onPress={() => { close(); router.replace('/' as any); }} /></View>
          </View></Overlay>
        )}
        {dlg === 'restore' && (
          <Overlay onClose={close}><ScrollView style={{ flexGrow: 0, maxHeight: '88%' }} contentContainerStyle={{ padding: 20, borderRadius: 26, backgroundColor: '#131845', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
            <Text style={{ color: W, fontSize: 18, fontWeight: '800' }}>Backup and restore</Text>
            <Text style={{ color: DIM, fontSize: 13, lineHeight: 19, marginTop: 6 }}>Save a copy of your data as a file, or bring it back from a file you saved before. This is how you move to a new phone until accounts arrive.</Text>
            <View style={{ marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: 'rgba(124,156,255,.12)', borderWidth: 1, borderColor: 'rgba(124,156,255,.28)' }}>
              <Text style={{ color: '#b9c8ff', fontSize: 12.5, fontWeight: '800', marginBottom: 6 }}>How to back up and restore</Text>
              {['Open Export all my data, choose Backup (JSON) and tap Export. The backup file is created and shared from your phone.', 'Save that file somewhere safe, such as Google Drive or Files. This is the file you upload later.', 'On the new phone, open Backup and restore, tap Restore from a file and choose the same Backup (JSON) file.', 'Check what is in the backup, then tap Restore to bring your data back.'].map((t, n) => (
                <View key={t} style={{ flexDirection: 'row', gap: 8, marginTop: 5 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 7, backgroundColor: 'rgba(124,156,255,.45)', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}><Text style={{ color: W, fontSize: 11.5, fontWeight: '800' }}>{n + 1}</Text></View>
                  <Text style={{ flex: 1, color: 'rgba(255,255,255,.86)', fontSize: 12.5, lineHeight: 18 }}>{t}</Text>
                </View>
              ))}
            </View>
            <View style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(94,231,223,.10)', borderWidth: 1, borderColor: 'rgba(94,231,223,.25)' }}>
              <Text style={{ color: '#8fe9e2', fontSize: 12.5, fontWeight: '800', marginBottom: 6 }}>Good to know</Text>
              {['Only the Backup (JSON) file can be restored. Excel, PDF and CSV files are for reading and sharing.', 'The file is named like my-life-backup-2026-11-06-1642.json.', 'Restoring replaces the parts found in the file. Receipt photos are not included.'].map((t) => (
                <View key={t} style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}><Text style={{ color: '#8fe9e2', fontSize: 12.5 }}>✓</Text><Text style={{ flex: 1, color: 'rgba(255,255,255,.82)', fontSize: 12.5, lineHeight: 18 }}>{t}</Text></View>
              ))}
            </View>
            {bkErr ? <Text style={{ color: '#ffb3bf', fontSize: 12.5, marginTop: 10 }}>{bkErr}</Text> : null}
            <View style={{ gap: 8, marginTop: 14 }}>
              <View style={{ flexDirection: 'row' }}><Btn t="Save a backup" kind="primary" onPress={() => { close(); router.push('/export' as any); }} /></View>
              <View style={{ flexDirection: 'row' }}><Btn t="Restore from a file" onPress={async () => {
                try { const t = await pickText(); if (t == null) return; const b = parseBackup(t); if (!b) return setBkErr('That file is not a My Life backup. Choose the Backup (JSON) file you saved from Export. Excel, PDF and CSV files cannot be restored.'); setBk(b); setDlg('confirm'); }
                catch (e) { setBkErr('Could not open that file.'); }
              }} /></View>
              <View style={{ flexDirection: 'row' }}><Btn t="Cancel" onPress={close} /></View>
            </View>
          </ScrollView></Overlay>
        )}
        {dlg === 'confirm' && bk && (
          <Overlay onClose={close}><View style={{ padding: 20, borderRadius: 26, backgroundColor: '#131845', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
            <Text style={{ color: W, fontSize: 18, fontWeight: '800' }}>Restore this backup?</Text>
            {bk.created ? <Text style={{ color: '#8fe9e2', fontSize: 12.5, marginTop: 4 }}>Saved {bk.created}</Text> : null}
            <Text style={{ color: DIM, fontSize: 13, lineHeight: 19, marginTop: 8 }}>This backup holds:</Text>
            {bk.parts.map((n) => <Text key={n} style={{ color: W, fontSize: 13.5, marginTop: 3 }}>•  {n}</Text>)}
            <Text style={{ color: '#ffd593', fontSize: 12.5, lineHeight: 18, marginTop: 10 }}>These parts will be replaced with what is in the file. Anything else on this phone stays as it is.{bk.images ? ' Receipt photos in the file are restored too.' : ''}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Btn t="Cancel" onPress={close} />
              <Btn t="Restore" kind="primary" onPress={async () => { const np = await applyBackup(bk); setDoneMsg('Your backup has been restored: ' + bk.parts.join(', ') + '.' + (np > 0 ? ' ' + np + (np === 1 ? ' receipt photo' : ' receipt photos') + ' restored.' : '')); setBk(null); setDlg('done'); }} />
            </View>
          </View></Overlay>
        )}
        {dlg === 'howto' && <Doc title="How to use My Life" secs={HOWTO} onClose={close} />}
        {dlg === 'faq' && <Doc title="Help and FAQ" secs={FAQ} onClose={close} />}
        {dlg === 'lic' && <Doc title="Open-source licences" secs={LICENCES} onClose={close} />}
        {dlg === 'backup' && <Doc title="Encrypted backup & restore" secs={[{ h: 'Coming with sync', p: 'Backups will be encrypted and tied to your account. For now you can save a full copy with Export, using the Backup (JSON) format.' }]} onClose={close} />}
        {dlg === 'log' && <Doc title="Security activity log" secs={[{ h: 'Last 30 days', p: 'Sign-ins, password changes and device removals will be listed here once your account is connected.' }]} onClose={close} />}

        {dlg === 'out' && (
          <Overlay onClose={close}><View style={{ padding: 20, borderRadius: 26, backgroundColor: '#131845', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
            <Text style={{ color: W, fontSize: 17, fontWeight: '800' }}>Log out of My Life?</Text>
            <Text style={{ color: DIM, fontSize: 13, lineHeight: 19, marginTop: 6 }}>Your data is backed up first. You will need your email and password to sign back in on this device.</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}><Btn t="Cancel" onPress={close} /><Btn t="Log out" kind="danger" onPress={async () => { await syncNow(); close(); await signOut(); }} /></View>
          </View></Overlay>
        )}
        {dlg === 'fb' && (
          <Overlay onClose={close}><View style={{ padding: 20, borderRadius: 26, backgroundColor: '#131845', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
            <Text style={{ color: W, fontSize: 17, fontWeight: '800' }}>Send feedback</Text>
            <Text style={{ color: DIM, fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>Found a problem, or have an idea? Tell us. Your email is sent with it so we can reply.</Text>
            <View style={{ marginTop: 12 }}><Inp multiline value={fbText} onChangeText={(v: string) => { setFbText(v.slice(0, 1000)); setFbMsg(''); }} placeholder="Your message" style={{ minHeight: 110, textAlignVertical: 'top' }} /></View>
            {fbMsg ? <Text style={{ color: '#ffb3bf', fontSize: 12, marginTop: 8 }}>{fbMsg}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}><Btn t="Cancel" onPress={close} /><Btn t={busy ? 'Sending…' : 'Send'} kind="primary" onPress={sendFb} /></View>
          </View></Overlay>
        )}
        {dlg === 'pw' && (
          <Overlay onClose={close}><View style={{ padding: 20, borderRadius: 26, backgroundColor: '#131845', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
            <Text style={{ color: W, fontSize: 17, fontWeight: '800' }}>Change password</Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              <Inp secureTextEntry placeholder="Current password" value={p1} onChangeText={setP1} />
              <Inp secureTextEntry placeholder="New password (8+ characters)" value={p2} onChangeText={setP2} />
              <Inp secureTextEntry placeholder="Repeat new password" value={p3} onChangeText={setP3} />
            </View>
            {pwErr ? <Text style={{ color: '#ffb3bf', fontSize: 12, marginTop: 8 }}>{pwErr}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}><Btn t="Cancel" onPress={close} /><Btn t="Update" kind="primary" onPress={savePw} /></View>
          </View></Overlay>
        )}
        {(dlg === 'reset' || dlg === 'delete') && (
          <Overlay onClose={close}><View style={{ padding: 20, borderRadius: 26, backgroundColor: '#131845', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
            <Text style={{ color: W, fontSize: 17, fontWeight: '800' }}>{isDel ? 'Delete your account?' : 'Reset all your data?'}</Text>
            <Text style={{ color: DIM, fontSize: 12.5, lineHeight: 18, marginTop: 6 }}>{isDel ? 'This permanently deletes your account and everything in it: planner, notes, finance, records and habits, on all your devices. This cannot be undone. Export your data first if you want a copy.' : 'This erases ALL your data: planner, notes, finance, records and habits. Your account and login stay, and the saved copy online is erased too. This cannot be undone. Export your data first if you want a copy.'}</Text>
            {isDel && fam ? <View style={{ marginTop: 10, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,213,147,.12)', borderWidth: 1, borderColor: 'rgba(255,213,147,.45)' }}><Text style={{ color: '#ffe0ad', fontSize: 12.5, lineHeight: 18 }}>{fam.role === 'owner' ? 'You are the owner of the family "' + fam.name + '" (' + fam.n + (fam.n === 1 ? ' member' : ' members') + '). Deleting your account also deletes that family for everyone: its members, tasks, activities and shopping list. To keep the family, close this and make another member the owner first (Daily Planner, Family, Members).' : 'You are in the family "' + fam.name + '". Deleting your account also removes you from it.'}</Text></View> : null}
            <Text style={{ color: W, fontSize: 12.5, fontWeight: '700', marginTop: 12, marginBottom: 6 }}>{isDel ? 'Type DELETE to confirm' : 'Type RESET to confirm'}</Text>
            <Inp autoCapitalize="characters" value={typed} onChangeText={setTyped} />
            {isDel && (<><Text style={{ color: W, fontSize: 12.5, fontWeight: '700', marginTop: 10, marginBottom: 6 }}>Enter your password</Text><Inp secureTextEntry value={pwv} onChangeText={setPwv} /></>)}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Btn t="Cancel" onPress={close} />
              {canGo ? <Btn t={isDel ? 'Delete forever' : 'Reset everything'} kind="danger" onPress={async () => {
                Keyboard.dismiss(); if (busy) return; setBusy(true);
                if (isDel) {
                  if (!(await checkPassword(pwv))) { setBusy(false); say('Wrong password, or no internet.'); return; }
                  const r = await deleteAccount(); if (!r.ok) { setBusy(false); say(r.err); return; }
                  await clearMine(false);
                } else {
                  if (!(await wipeCloud())) { setBusy(false); say('Could not reach the server. Check your internet.'); return; }
                  await clearMine(true); syncNow();
                }
                setBusy(false); close(); setDoneMsg(isDel ? 'Your account and all its data have been deleted.' : 'All your data has been erased. The app is now like new.'); setDlg('done');
              }} />
                : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: 'rgba(255,255,255,.45)', fontSize: 12.5 }}>{isDel ? 'Fill both fields' : 'Type RESET'}</Text></View>}
            </View>
          </View></Overlay>
        )}
        {toast ? <View pointerEvents="none" style={{ position: 'absolute', bottom: 110, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.75)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '600' }}>{toast}</Text></View> : null}
      </SafeAreaView>
      </PageIn>
    </View>
  );
}
