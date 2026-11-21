import { useEffect } from 'react';
import { Platform, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { endSleep, syncSleepNative } from '../lib/sleepNow';
import { doneStored } from '../lib/maintTasks';

const act = (r: Notifications.NotificationResponse | null | undefined) => {
  if (!r) return;
  if (r.actionIdentifier === 'awake') endSleep();
  else if (r.actionIdentifier === 'taskdone') { const dd: any = r.notification.request.content.data || {}; if (dd.cat != null && dd.tid != null) doneStored(String(dd.cat), Number(dd.tid)); }
};

// Keeps the app in step with the sleep timer. On Android the timer runs inside the phone; this saves the finished sleeps when the app opens.
export function SleepNowSync() {
  const last = Platform.OS === 'web' ? null : Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const s = Notifications.addNotificationResponseReceivedListener((r) => act(r));
    return () => s.remove();
  }, []);
  useEffect(() => { act(last); }, [last]);
  // Android: the phone runs the sleep timer by itself, so catch up whenever the app opens or comes back to the front.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    syncSleepNative();
    const s = AppState.addEventListener('change', (st) => { if (st === 'active') syncSleepNative(); });
    const i = setInterval(() => { if (AppState.currentState === 'active') syncSleepNative(); }, 4000); // so the Quick log follows the notification button and the tile while the app is open
    return () => { s.remove(); clearInterval(i); };
  }, []);
  return null;
}
