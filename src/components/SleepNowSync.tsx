import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { endSleep } from '../lib/sleepNow';

// Listens for the "I'm awake" button on the sleeping notification, also when the app was closed.
export function SleepNowSync() {
  const last = Platform.OS === 'web' ? null : Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const s = Notifications.addNotificationResponseReceivedListener((r) => { if (r.actionIdentifier === 'awake') endSleep(); });
    return () => s.remove();
  }, []);
  useEffect(() => { if (last && last.actionIdentifier === 'awake') endSleep(); }, [last]);
  return null;
}
