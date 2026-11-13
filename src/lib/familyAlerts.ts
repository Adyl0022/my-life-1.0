import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { setup, cancelPrefix, inQuiet, Toggles } from './adhan';
import { planFamilyAlerts, PlanTask, PlanEvent } from './familyPlan';

// Reminders for family tasks and activities (set in the task or activity form). They are planned on this phone from the
// shared lists, so they need no server push. Re-planned whenever the lists change or the app opens.
export async function syncFamilyAlerts(me: string, tasks: PlanTask[], events: PlanEvent[], tg: Toggles, on: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelPrefix('fam-');
    if (!on || !tg.ev) return;
    const todo = planFamilyAlerts(me, tasks, events, Date.now(), (d) => inQuiet(d, tg));
    if (!todo.length) return;
    if (!(await setup())) return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('family', { name: 'Family reminders', importance: Notifications.AndroidImportance.HIGH, lightColor: '#ff8fab' });
    for (const t of todo) {
      await Notifications.scheduleNotificationAsync({
        identifier: t.id,
        content: { title: t.title, body: t.body, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t.at, channelId: 'family' } as any,
      });
    }
  } catch (e) { /* ignore */ }
}
