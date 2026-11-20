import { useEffect, useRef, useState } from 'react';
import { Platform, AppState } from 'react-native';
import * as LocalAuth from 'expo-local-authentication';
import { secGet, secSet } from './secure';

// An optional lock just for Documents. It uses the phone's own fingerprint, face or screen lock, and the choice stays on this phone.
const KEY = 'ml_doclock';
let on = false; let loaded = false; let authed = false;
const subs = new Set<() => void>(); const emit = () => subs.forEach((f) => f());

export async function loadDocLock() { try { on = (await secGet(KEY)) === '1'; } catch (e) { on = false; } loaded = true; emit(); }
export const canLock = async () => { if (Platform.OS === 'web') return false; try { return (await LocalAuth.hasHardwareAsync()) && (await LocalAuth.isEnrolledAsync()); } catch (e) { return false; } };
export async function askUnlock(): Promise<boolean> {
  try { const r = await LocalAuth.authenticateAsync({ promptMessage: 'Open Documents', cancelLabel: 'Cancel' }); if (r.success) { authed = true; emit(); } return !!r.success; } catch (e) { return false; }
}
export async function setDocLock(v: boolean): Promise<boolean> {
  if (v) { if (!(await canLock())) return false; if (!(await askUnlock())) return false; }
  on = v; authed = v; try { await secSet(KEY, v ? '1' : '0'); } catch (e) { /* kept for this session */ } emit(); return true;
}
export const relockDocs = () => { authed = false; emit(); };

export function useDocLock() {
  const [, tick] = useState(0);
  useEffect(() => { const f = () => tick((n) => n + 1); subs.add(f); if (!loaded) loadDocLock(); return () => { subs.delete(f); }; }, []);
  // leaving the app locks it again
  const last = useRef('active');
  useEffect(() => { const s = AppState.addEventListener('change', (n) => { if (n === 'background') relockDocs(); last.current = n; }); return () => s.remove(); }, []);
  return { on, loaded, locked: on && !authed };
}
