import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { supabase } from './supabase';
import { getSession } from './auth';
import { getText, applyRemote, clearMine, readPlain } from './store';

// Data that follows the account. Lock/PIN, keys, caches and per-phone switches stay on the phone.
export const SYNC_KEYS = ['ml_planner', 'ml_notes', 'ml_islamic', 'ml_tasbih', 'ml_puasa', 'ml_finance', 'ml_debts', 'ml_savings', 'ml_record', 'ml_habit', 'ml_name', 'ml_budget', 'ml_mean', 'ml_region', 'ml_toggles', 'ml_prayer_alerts', 'ml_prayer_lead', 'ml_backup_rem', 'ml_commit_order', 'ml_size', 'ml_tips_off', 'ml_read', 'ml_read_z'];
const META = 'ml_sync_meta', UID = 'ml_sync_uid';
type Meta = Record<string, number>;
let meta: Meta | null = null; let dirty = new Set<string>(); let timer: any = null; let busy = false; let again = false;
export const syncState = { last: 0, err: '' };

// Edit times that could not be written into the sync record yet (it was not readable at that moment).
const stamp: Meta = {};
// True when nothing has ever been synced on this install or login (the sync record on the phone was empty).
let fresh = false;
// Throws when the sync record exists but cannot be read right now. The caller then skips this round instead of
// treating every key as never synced (which would load the cloud copy over newer data on the phone).
async function loadMeta(): Promise<Meta> {
  if (meta) return meta;
  const raw = await readPlain(META);
  let m: Meta; try { m = JSON.parse(raw || '{}') || {}; } catch (e) { m = {}; }
  fresh = Object.keys(m).length === 0;
  meta = m; return m;
}
async function saveMeta() { try { await AsyncStorage.setItem(META, JSON.stringify(meta || {})); } catch (e) {} }

// Called by setItem after every local save.
export async function markDirty(k: string) {
  if (!SYNC_KEYS.includes(k) || !getSession()) return;
  stamp[k] = Date.now(); dirty.add(k);
  try { const m = await loadMeta(); m[k] = Math.max(m[k] || 0, stamp[k]); delete stamp[k]; await saveMeta(); } catch (e) {}
  clearTimeout(timer); timer = setTimeout(() => { syncNow(); }, 2500);
}

async function pushKeys(uid: string, keys: string[]) {
  const m = await loadMeta(); const rows: any[] = [];
  for (const k of keys) {
    const t = await getText(k); if (t == null) continue;
    let v: any; try { v = JSON.parse(t); } catch (e) { continue; }
    rows.push({ user_id: uid, key: k, value: v, updated_at: new Date(m[k] || Date.now()).toISOString() });
  }
  if (!rows.length) return;
  const { error } = await supabase.from('user_data').upsert(rows, { onConflict: 'user_id,key' });
  if (error) throw error;
}

// Two-way merge per key: the newest edit wins. Safe to call often; it quietly does nothing when offline or signed out.
export async function syncNow(): Promise<boolean> {
  const s = getSession(); if (!s) return false;
  if (busy) { again = true; return false; }
  busy = true;
  try {
    const uid = s.user.id;
    // The phone's data is cleared only when a different account really signed in. If the saved id cannot be read
    // right now, readPlain throws and this round is skipped: never clear on a guess.
    const prev = await readPlain(UID);
    if (prev && prev !== uid) { await clearMine(false); meta = {}; fresh = true; dirty = new Set(); Object.keys(stamp).forEach((k) => delete stamp[k]); await saveMeta(); }
    await AsyncStorage.setItem(UID, uid);
    // Show the name typed at sign-up at once, before the network round trip. A name saved in the cloud still wins on the first sync.
    if ((await getText('ml_name')) == null) {
      const nm0 = (s.user.user_metadata as any)?.name;
      if (typeof nm0 === 'string' && nm0.trim()) await applyRemote('ml_name', nm0.trim());
    }
    const m = await loadMeta();
    Object.keys(stamp).forEach((k) => { m[k] = Math.max(m[k] || 0, stamp[k]); delete stamp[k]; });
    // First sync of this install or login (nothing synced here before): the cloud copy wins, so a quick edit made on
    // an empty screen before the data arrived can never replace the real data in the cloud.
    const first = fresh && !m.__init;
    const { data, error } = await supabase.from('user_data').select('key,value,updated_at').eq('user_id', uid);
    if (error) throw error;
    const remote = new Map<string, { v: any; t: number }>();
    (data || []).forEach((r: any) => { if (SYNC_KEYS.includes(r.key)) remote.set(r.key, { v: r.value, t: new Date(r.updated_at).getTime() }); });
    if (!remote.has('ml_name') && (await getText('ml_name')) == null) {
      const nm = (s.user.user_metadata as any)?.name;
      if (typeof nm === 'string' && nm.trim()) await applyRemote('ml_name', nm.trim());
    }
    const toPush: string[] = [];
    for (const k of SYNC_KEYS) {
      const r = remote.get(k); const lt = m[k] || 0;
      if (r && (r.t > lt || first)) { await applyRemote(k, r.v); m[k] = r.t; dirty.delete(k); }
      else if (r && lt > r.t) toPush.push(k);
      else if (!r && (dirty.has(k) || (await getText(k)) != null)) { if (!m[k]) m[k] = Date.now(); toPush.push(k); }
    }
    m.__init = 1; fresh = false;
    await saveMeta();
    if (toPush.length) { await pushKeys(uid, toPush); toPush.forEach((k) => dirty.delete(k)); }
    syncState.last = Date.now(); syncState.err = '';
    return true;
  } catch (e: any) { syncState.err = e?.message || 'sync failed'; return false; }
  finally { busy = false; if (again) { again = false; setTimeout(syncNow, 1500); } }
}

let started = false;
export function startSync() {
  if (started) return; started = true;
  AppState.addEventListener('change', (s) => { if (s === 'active') syncNow(); });
}
export async function forgetSyncState() { meta = {}; fresh = true; dirty = new Set(); try { await AsyncStorage.multiRemove([META, UID]); } catch (e) {} }
// Removes this account's saved copy from the cloud (used by "Reset all data").
export async function wipeCloud(): Promise<boolean> {
  const s = getSession(); if (!s) return true;
  const { error } = await supabase.from('user_data').delete().eq('user_id', s.user.id);
  return !error;
}
