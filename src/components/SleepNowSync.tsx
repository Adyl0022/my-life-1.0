import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { endSleep } from '../lib/sleepNow';
import { doneStored } from '../lib/maintTasks';

const act = (r: Notifications.NotificationResponse | null | undefined) => {
  if (!r) return;
  if (r.actionIdentifier === 'awake') endSleep();
  else if (r.actionIdentifier === 'taskdone') { const dd: any = r.notification.request.content.data || {}; if (dd.cat != null && dd.tid != null) doneStored(String(dd.cat), Number(dd.tid)); }
};

// Listens for the "I'm awake" button on the sleeping notification, also when the app was closed.
export function SleepNowSync() {
  const last = Platform.OS === 'web' ? null : Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const s = Notifications.addNotificationResponseReceivedListener((r) => act(r));
    return () => s.remove();
  }, []);
  useEffect(() => { act(last); }, [last]);
  return null;
}
