import { Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { trackModule } from '../lib/modules';
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
import { PaywallHost } from '../components/Paywall';
import { FREEMIUM } from '../lib/edition';
import { startSync, syncNow } from '../lib/sync';
import { DEBT_EMPTY, DebtData, syncDebtAlerts } from '../lib/debts';
import { syncEventAlerts, syncZikirAlerts, syncBackupAlert, PEvent } from '../lib/alerts';
import { TG_DEFAULT, Toggles } from '../lib/adhan';

// Keeps prayer alerts scheduled after the user has opened Prayer Times once (never asks for location on first launch).
function Runner() { usePrayer(); return null; }
function PrayerSync() {
  const [last] = useStored<{ lat: number; lon: number; zone: string } | null>('ml_prayer_last', null);
  return Platform.OS !== 'web' && last ? <Runner /> : null;
}
// Re-plans debt due reminders whenever the app opens or the debts change.
function DebtSync() {
  const [d, , ok] = useStored<DebtData>('ml_debts', DEBT_EMPTY);
  useEffect(() => { if (ok && Platform.OS !== 'web') syncDebtAlerts(d); }, [ok, JSON.stringify(d)]);
  return null;
}
// Re-plans Planner event and daily zikir reminders when the app opens, or when events or the switches in Settings change.
function AlertSync() {
  const [pl, , ok] = useStored<{ events: PEvent[] }>('ml_planner', { events: [] });
  const [tg, , ok2] = useStored<Partial<Toggles>>('ml_toggles', {});
  const t = { ...TG_DEFAULT, ...tg };
  useEffect(() => { if (ok && ok2 && Platform.OS !== 'web') syncEventAlerts(pl.events || [], t); }, [ok, ok2, JSON.stringify(pl.events || []), t.ev, t.qh]);
  useEffect(() => { if (ok2 && Platform.OS !== 'web') syncZikirAlerts(t); }, [ok2, t.zk, t.qh]);
  const [bk, , okb] = useStored<number>('ml_backup_last', 0);
  const [bo, , okc] = useStored<boolean>('ml_backup_rem', false);
  useEffect(() => { if (okb && okc && Platform.OS !== 'web') syncBackupAlert(!!bo, bk); }, [okb, okc, bk, bo]);
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
  useLockWatcher();
  const [sess, authReady] = useSession(); const lic = useLicense();
  useEffect(() => { encryptExisting(); }, []);
  return (<><Tracker /><StatusBar style="light" />{Platform.OS === 'android' ? <NavigationBar hidden style="light" /> : null}<SyncRunner /><PrayerSync /><DebtSync /><AlertSync /><View style={{ flex: 1, backgroundColor: '#0a0f2c', alignItems: 'center' }}><View style={{ flex: 1, width: '100%', maxWidth: 520, overflow: 'hidden' }}><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0f2c' }, animation: 'slide_from_right' }} /><LockScreen />{sess && !FREEMIUM && lic.status === 'locked' ? <ActivationScreen email={sess.user.email || ''} expired={!!lic.expires} /> : null}{sess && !FREEMIUM && lic.status === 'unknown' ? <Checking /> : null}<PaywallHost />{authReady && !sess ? <AuthScreen /> : null}</View></View></>);
}
