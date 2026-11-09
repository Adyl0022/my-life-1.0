import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const KEY = 'ml_usage_v1';
export type Day = { opens: number; sec: number; mods?: Record<string, number>; hrs?: number[] };
type Store = Record<string, Day>;

const dkey = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
let cache: Store = {};
let loaded = false;
let boot: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());

function prune(s: Store) {
  const cut = new Date(); cut.setDate(cut.getDate() - 30);
  const ck = dkey(cut);
  Object.keys(s).forEach((k) => { if (k < ck) delete s[k]; });
  return s;
}
async function save() { try { await AsyncStorage.setItem(KEY, JSON.stringify(prune(cache))); } catch (e) {} }
function bump(fn: (d: Day) => void) {
  const k = dkey(new Date());
  const d = cache[k] || { opens: 0, sec: 0 };
  fn(d); cache[k] = d; emit();
}
export function startUsage(): Promise<void> {
  if (!boot) boot = run();
  return boot;
}
async function run() {
  try { const raw = await AsyncStorage.getItem(KEY); cache = raw ? JSON.parse(raw) : {}; } catch (e) { cache = {}; }
  loaded = true;
  bump((d) => { d.opens += 1; });
  save();
  let last = Date.now(); let active = AppState.currentState !== 'background';
  setInterval(() => {
    const now = Date.now();
    if (active) bump((d) => { d.sec += Math.round((now - last) / 1000); });
    last = now;
  }, 5000);
  setInterval(save, 20000);
  AppState.addEventListener('change', (s) => {
    const now = Date.now();
    if (active) bump((d) => { d.sec += Math.round((now - last) / 1000); });
    last = now;
    if (s === 'active' && !active) bump((d) => { d.opens += 1; });
    active = s === 'active';
    save();
  });
}
// Counts a visit to a module (and the hour of day) inside the same saved record as the time used, which is known to work.
export async function trackVisit(mod: string) {
  await startUsage();
  bump((d) => {
    d.mods = d.mods || {}; d.mods[mod] = (d.mods[mod] || 0) + 1;
    d.hrs = Array.isArray(d.hrs) && d.hrs.length === 24 ? d.hrs : new Array(24).fill(0);
    d.hrs[new Date().getHours()] += 1;
  });
  await save();
}
export function useUsage(daysBack = 16) {
  const [, force] = useState(0);
  useEffect(() => { startUsage(); const f = () => force((n) => n + 1); listeners.add(f); return () => { listeners.delete(f); }; }, []);
  const today = cache[dkey(new Date())] || { opens: 0, sec: 0 };
  const series: number[] = [];
  for (let i = daysBack - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const v = cache[dkey(d)]; series.push(v ? v.sec / 60 : 0); }
  const days: { min: number; opens: number }[] = [];
  for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const v = cache[dkey(d)]; days.push({ min: v ? v.sec / 60 : 0, opens: v ? v.opens : 0 }); }
  const mods: Record<string, number> = {}; const hours: number[] = new Array(24).fill(0);
  Object.values(cache).forEach((v) => {
    Object.keys(v.mods || {}).forEach((m) => { mods[m] = (mods[m] || 0) + (v.mods as any)[m]; });
    (v.hrs || []).forEach((n, h) => { if (h < 24) hours[h] += n || 0; });
  });
  return { loaded, today, series, days, mods, hours };
}
