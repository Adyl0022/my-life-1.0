import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { seal, open } from './secure';

export const DEFAULT_NAME = 'Adli Syahmi';
const listeners = new Set<() => void>();
// When the app comes back to the front, read everything again, so a read that failed while the phone was asleep is repaired.
AppState.addEventListener('change', (st) => { if (st === 'active') listeners.forEach((f) => f()); });
export async function getItem<T>(k: string, d: T): Promise<T> {
  try { const r = await AsyncStorage.getItem(k); return r == null ? d : (JSON.parse(await open(r)) as T); } catch (e) { return d; }
}
export async function setItem(k: string, v: unknown) {
  try { await AsyncStorage.setItem(k, await seal(JSON.stringify(v))); } catch (e) {}
  listeners.forEach((f) => f());
  import('./sync').then((m) => m.markDirty(k)).catch(() => {});
  if (k === 'ml_finance' || k === 'ml_debts') import('./budgetAlert').then((m) => m.checkBudget()).catch(() => {});
}
// Writes a value that came from the cloud: saved like normal but not marked as a local edit.
export async function applyRemote(k: string, v: unknown) {
  try { await AsyncStorage.setItem(k, await seal(JSON.stringify(v))); } catch (e) {}
  listeners.forEach((f) => f());
}
// Raw readable JSON text of a saved key (used by Export).
export async function getText(k: string): Promise<string | null> {
  try { const r = await AsyncStorage.getItem(k); return r == null ? null : await open(r); } catch (e) { return null; }
}
// One-time pass after the update: encrypts everything that was saved as plain text before.
export async function encryptExisting() {
  try {
    const ks = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('ml_') && !k.startsWith('ml_pt_') && !k.startsWith('ml_usage'));
    for (const k of ks) {
      const r = await AsyncStorage.getItem(k);
      if (r != null && !r.startsWith('enc1:')) { const e = await seal(r); if (e !== r) await AsyncStorage.setItem(k, e); }
    }
  } catch (e) {}
}
export async function clearMine(keepName: boolean) {
  try {
    const ks = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('ml_') && !(keepName && k === 'ml_name'));
    await AsyncStorage.multiRemove(ks);
  } catch (e) {}
  try { await (await import('./sync')).forgetSyncState(); } catch (e) {}
  listeners.forEach((f) => f());
}
export function useStored<T>(k: string, d: T): [T, (v: T) => void, boolean] {
  const [v, setV] = useState<T>(d); const [ok, setOk] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = () => getItem<T>(k, d).then((x) => { if (alive) { setV(x); setOk(true); } });
    load(); listeners.add(load);
    return () => { alive = false; listeners.delete(load); };
  }, [k]);
  return [v, (x: T) => { setV(x); setItem(k, x); }, ok];
}
export const useName = () => { const [n] = useStored<string>('ml_name', DEFAULT_NAME); return n; };
