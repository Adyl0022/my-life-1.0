import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { withNavBar } from './permNav';
import { getItem } from './store';

export type Toggles = { ev: boolean; pr: boolean; zk: boolean; qh: boolean };
export const TG_DEFAULT: Toggles = { ev: true, pr: true, zk: true, qh: true };
export const readToggles = async (): Promise<Toggles> => ({ ...TG_DEFAULT, ...(await getItem<Partial<Toggles>>('ml_toggles', {})) });
// Quiet hours: nothing rings between 12 am and 5 am.
export const inQuiet = (at: Date, tg: Toggles) => !!tg.qh && at.getHours() < 5;
const OWN = ['debt-', 'event-', 'zikir-', 'backup-', 'fam-'];

export type Alert = { key: string; name: string; at: Date };
let ready = false;
let handled = false;
// Lets a notification show as a banner while the app is open. Needed by anything that rings right away (budget alerts, test).
export function ensureHandler() {
  if (handled || Platform.OS === 'web') return;
  handled = true;
  try { Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) }); } catch (e) {}
}
export async function setup(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    if (!ready) {
      ensureHandler();
      if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('prayer', { name: 'Prayer times', importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 250, 150, 250], lightColor: '#6a4df0' });
      ready = true;
    }
    let p = await Notifications.getPermissionsAsync();
    if (p.status !== 'granted' && p.canAskAgain) p = await withNavBar(() => Notifications.requestPermissionsAsync());
    return p.status === 'granted';
  } catch (e) { return false; }
}
// Replaces every scheduled prayer alert with the given list.
export async function syncPrayerAlerts(list: Alert[], zoneName: string): Promise<void> {
  try {
    if (!(await setup())) return;
    await cancelPrayer();
    const tg = await readToggles(); if (!tg.pr) return;
    const now = Date.now();
    const lead = Number(await getItem<number>('ml_prayer_lead', 0)) || 0;
    const fire = (x: Alert) => new Date(x.at.getTime() - lead * 60000);
    for (const a of list.filter((x) => fire(x).getTime() > now + 5000 && !inQuiet(fire(x), tg)).slice(0, 60)) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'prayer-' + a.key + '-' + a.at.getTime(),
        content: lead ? { title: a.name + ' in ' + lead + ' minutes', body: 'Get ready for ' + a.name + (zoneName ? ' · ' + zoneName : ''), sound: true }
          : { title: a.name + ' prayer time', body: 'It is time for ' + a.name + ' prayer' + (zoneName ? ' · ' + zoneName : ''), sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fire(a), channelId: 'prayer' } as any,
      });
    }
  } catch (e) {}
}
async function cancelPrayer() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of all) if (!OWN.some((p) => String(n.identifier).startsWith(p))) await Notifications.cancelScheduledNotificationAsync(n.identifier);
}
export async function cancelPrefix(prefix: string) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of all) if (String(n.identifier).startsWith(prefix)) await Notifications.cancelScheduledNotificationAsync(n.identifier);
}
export async function clearPrayerAlerts() { try { if (Platform.OS !== 'web') await cancelPrayer(); } catch (e) {} }
