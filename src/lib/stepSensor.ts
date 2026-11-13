import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { getItem, setItem } from './store';
import { HData, HEMPTY, BLANK, dateOf, keyOfDate } from './habit';
import { stepTotal } from '../../modules/step-counter';

// Backup step counting for phones where Health Connect has no steps (for example Honor Health that does not share them).
// The phone counts steps all day on its own. Each time this runs it reads that total, takes the difference since the last
// reading and adds it to today. It runs when My Life opens, while the Habit screen is open and a few times a day in the background.
// If the phone was switched off and on again the total starts again from zero, so the new total counts as new steps.
const TASK = 'mylife-step-sync';
const BASE = 'ml_stepbase'; // kept on this phone only (never synced)
export const MODE = 'ml_stepmode'; // 'sensor' while the sensor is the source, 'hc' when Health Connect is

let busy = false;
export async function sensorSync(): Promise<number> {
  if (Platform.OS !== 'android' || busy) return 0;
  busy = true;
  try {
    if ((await AsyncStorage.getItem(MODE)) !== 'sensor') return 0;
    const h: HData = await getItem<HData>('ml_habit', HEMPTY);
    if (!h.auto) return 0;
    const total = await stepTotal();
    if (total < 0) return 0;
    let base: number | null = null; let at = 0;
    try { const r = await AsyncStorage.getItem(BASE); if (r != null) { const j = JSON.parse(r); const n = Number(j.t); if (isFinite(n)) { base = n; at = Number(j.at) || 0; } } } catch (e) {}
    await AsyncStorage.setItem(BASE, JSON.stringify({ t: total, at: Date.now() }));
    if (base == null || Date.now() - at > 24 * 3600 * 1000) return 0; // a gap of more than a day cannot be split between days, so it is skipped
    const delta = total >= base ? total - base : total;
    if (!(delta > 0) || delta > 60000) return 0;
    const cur: HData = await getItem<HData>('ml_habit', HEMPTY);
    const key = keyOfDate(dateOf(0));
    const td = { ...BLANK, ...(cur.days[key] || {}) };
    await setItem('ml_habit', { ...cur, days: { ...cur.days, [key]: { ...td, steps: td.steps + Math.round(delta) } } });
    return delta;
  } catch (e) { return 0; } finally { busy = false; }
}

// Must be defined when the app (or its background worker) starts.
if (Platform.OS === 'android') {
  try {
    TaskManager.defineTask(TASK, async () => {
      try { await sensorSync(); return BackgroundTask.BackgroundTaskResult.Success; } catch (e) { return BackgroundTask.BackgroundTaskResult.Failed; }
    });
  } catch (e) {}
  try { AppState.addEventListener('change', (s) => { if (s === 'active') sensorSync(); }); } catch (e) {}
}

export async function setStepSource(src: 'sensor' | 'hc' | 'off') {
  if (Platform.OS !== 'android') return;
  try { const was = await AsyncStorage.getItem(MODE); if (src === 'sensor' && was !== 'sensor') await AsyncStorage.removeItem(BASE); await AsyncStorage.setItem(MODE, src); } catch (e) {}
  try {
    const on = await TaskManager.isTaskRegisteredAsync(TASK);
    if (src === 'sensor' && !on) await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: 120 });
    if (src !== 'sensor' && on) await BackgroundTask.unregisterTaskAsync(TASK);
  } catch (e) {}
}
