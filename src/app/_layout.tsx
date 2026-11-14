import { Stack, usePathname } from 'expo-router';
import { DialogHost } from '../components/DialogHost';
import { useEffect, useRef } from 'react';
import { trackModule } from '../lib/modules';
import { useRegion } from '../lib/region';
import { useHidden } from '../lib/hidden';
import { warmKey } from '../lib/secure';
warmKey();
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { Platform, View, ActivityIndicator, Pressable, AppState } from 'react-native';
import { useState } from 'react';
import { Text } from '../components/Txt';
import { usePrayer } from '../lib/prayer';
import { useStored, encryptExisting } from '../lib/store';
import { useLockWatcher } from '../lib/lock';
import { LockScreen } from '../components/LockScreen';
import { AuthScreen } from '../components/AuthScreen';
import { useSession } from '../lib/auth';
import { useLicense, refreshLicense } from '../lib/license';
import { ActivationScreen } from '../components/ActivationScreen';
import { startSync, syncNow } from '../lib/sync';
import { DEBT_EMPTY, DebtData, syncDebtAlerts } from '../lib/debts';
import { syncEventAlerts, syncZikirAlerts, syncBackupAlert, syncRenewAlerts, syncWeekAlert, PEvent } from '../lib/alerts';
import { TG_DEFAULT, Toggles } from '../lib/adhan';
import { useFamily } from '../lib/family';
import { useFamTasks, useFamEvents } from '../lib/familyData';
import { syncFamilyAlerts } from '../lib/familyAlerts';

// Keeps prayer alerts scheduled after the user has opened Prayer Times once (never asks for location on first launch).
function Runner() { usePrayer(); return null; }
function PrayerSync() {
  const [last] = useStored<{ lat: number; lon: number; zone: string } | null>('ml_prayer_last', null);
  return Platform.OS !== 'web' && last ? <Runner /> : null;
}
// Re-plans debt due reminders whenever the app opens or the debts change.
function DebtSync() {
  const [d, , ok] = useStored<DebtData>('ml_debts', DEBT_EMPTY);
  const hid = useHidden(); const fin = hid.on('finance');
  // The reminder text carries the currency, so wait until the chosen one is loaded and re-plan if it changes.
  const [rg, , rok] = useRegion();
  // Finance turned off: the due reminders are cleared too.
  useEffect(() => { if (ok && rok && hid.ready && Platform.OS !== 'web') syncDebtAlerts(fin ? d : { ...d, notify: false }); }, [ok, rok, rg.cur, hid.ready, fin, JSON.stringify(d)]);
  return null;
}
// Re-plans Planner event and daily zikir reminders when the app opens, or when events or the switches in Settings change.
function AlertSync() {
  const [pl, , ok] = useStored<{ events: PEvent[] }>('ml_planner', { events: [] });
  const [tg, , ok2] = useStored<Partial<Toggles>>('ml_toggles', {});
  const hid = useHidden();
  // A module that is turned off also stops its reminders.
  const t = { ...TG_DEFAULT, ...tg }; t.ev = t.ev && hid.on('planner'); t.zk = t.zk && hid.on('islamic');
  useEffect(() => { if (ok && ok2 && hid.ready && Platform.OS !== 'web') syncEventAlerts(pl.events || [], t); }, [ok, ok2, hid.ready, JSON.stringify(pl.events || []), t.ev, t.qh]);
  useEffect(() => { if (ok2 && hid.ready && Platform.OS !== 'web') syncZikirAlerts(t); }, [ok2, hid.ready, t.zk, t.qh]);
  useEffect(() => { if (ok2 && Platform.OS !== 'web') syncWeekAlert({ ...t, ev: tg.ev !== false }); }, [ok2, tg.ev]);
  const [rc, , okr] = useStored<{ data?: Record<string, any> }>('ml_record', { data: {} });
  useEffect(() => { if (okr && ok2 && hid.ready && Platform.OS !== 'web') syncRenewAlerts(rc, { ...t, ev: tg.ev !== false }, hid.on('record')); }, [okr, ok2, hid.ready, JSON.stringify((rc && rc.data) || {}), tg.ev, t.qh]);
  const [bk, , okb] = useStored<number>('ml_backup_last', 0);
  const [bo, , okc] = useStored<boolean>('ml_backup_rem', false);
  useEffect(() => { if (okb && okc && Platform.OS !== 'web') syncBackupAlert(!!bo, bk); }, [okb, okc, bk, bo]);
  return null;
}
// Plans reminders for family tasks and activities. It waits until the family lists are loaded, so a slow start never wipes them.
function FamilySync() {
  const [sess] = useSession(); const lic = useLicense();
  const [tg, , ok] = useStored<Partial<Toggles>>('ml_toggles', {});
  const hid = useHidden();
  const f = useFamily();
  const fid = f.info && lic.status === 'active' ? f.info.id : undefined;
  const tk = useFamTasks(fid); const ev = useFamEvents(fid);
  const t = { ...TG_DEFAULT, ...tg }; const plannerOn = hid.on('planner');
  const had = useRef(false);
  useEffect(() => { if (sess) had.current = true; else if (had.current && Platform.OS !== 'web') { had.current = false; syncFamilyAlerts('', [], [], t as Toggles, false); } }, [!!sess]);   // signed out: no family reminders of the old account
  const key = JSON.stringify([f.info?.me, tk.rows.map((x) => [x.id, x.due_at, x.remind_min, x.done, x.assignees, x.title]), ev.rows.map((x) => [x.id, x.starts_at, x.remind_min, x.attendees, x.title])]);
  useEffect(() => {
    if (!ok || !hid.ready || Platform.OS === 'web' || !sess) return;
    if (lic.status === 'locked' || f.state === 'none' || f.state === 'locked') { syncFamilyAlerts('', [], [], t as Toggles, false); return; }
    if (!f.info || lic.status !== 'active' || !tk.ready || !ev.ready) return;
    syncFamilyAlerts(f.info.me, tk.rows, ev.rows, t as Toggles, plannerOn);
  }, [ok, hid.ready, sess?.user?.id, lic.status, f.state, tk.ready, ev.ready, plannerOn, t.ev, t.qh, key]);
  return null;
}
// Starts syncing as soon as the user is signed in, and again when the app comes back to the front.
function SyncRunner() {
  const [sess] = useSession(); const lic = useLicense();
  useEffect(() => { if (sess && lic.status === 'active') { startSync(); syncNow(); } }, [sess?.user?.id, lic.status]);
  return null;
}
// Shown while the account is being checked. It never stays silent: after a few seconds it offers a retry.
function Checking() {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSlow(true), 6000); return () => clearTimeout(t); }, []);
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: '#0a0f2c', zIndex: 54, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <ActivityIndicator color="#8fe9e2" />
      {slow ? <>
        <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 13 }}>Taking longer than usual…</Text>
        <Pressable onPress={() => { setSlow(false); refreshLicense(); setTimeout(() => setSlow(true), 6000); }} style={{ paddingVertical: 10, paddingHorizontal: 22, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.16)' }}><Text style={{ color: '#fff', fontWeight: '700' }}>Try again</Text></Pressable>
      </> : null}
    </View>
  );
}
export { ErrorBoundary } from 'expo-router';
function Tracker() { const p = usePathname(); useEffect(() => { trackModule(p); }, [p]); return null; }
export default function Root() {
  useRegion(); // keeps the chosen currency ready for every screen and notification
  useLockWatcher();
  const [sess, authReady] = useSession(); const lic = useLicense();
  useEffect(() => { encryptExisting(); }, []);
  return (<><Tracker /><StatusBar style="light" />{Platform.OS === 'android' ? <NavigationBar hidden style="light" /> : null}<SyncRunner /><PrayerSync /><DebtSync /><AlertSync /><FamilySync /><DialogHost /><View style={{ flex: 1, backgroundColor: '#0a0f2c', alignItems: 'center' }}><View style={{ flex: 1, width: '100%', maxWidth: 520, overflow: 'hidden' }}><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0f2c' }, animation: 'slide_from_right' }} /><LockScreen />{sess && lic.status === 'locked' ? <ActivationScreen email={sess.user.email || ''} expired={!!lic.expires} /> : null}{sess && lic.status === 'unknown' ? <Checking /> : null}{authReady && !sess ? <AuthScreen /> : null}</View></View></>);
}
