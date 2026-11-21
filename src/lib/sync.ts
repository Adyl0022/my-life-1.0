import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { supabase } from './supabase';
import { getSession } from './auth';
import { getText, applyRemote, clearMine, readPlain } from './store';

// Data that follows the account. Lock/PIN, keys, caches and per-phone switches stay on the phone.
export const SYNC_KEYS = ['ml_planner', 'ml_notes', 'ml_islamic', 'ml_tasbih', 'ml_puasa', 'ml_finance', 'ml_debts', 'ml_savings', 'ml_accounts', 'ml_record', 'ml_habit', 'ml_name', 'ml_budget', 'ml_mean', 'ml_region', 'ml_toggles', 'ml_prayer_alerts', 'ml_prayer_lead', 'ml_backup_rem', 'ml_commit_order', 'ml_size', 'ml_tips_off', 'ml_read', 'ml_read_z', 'ml_hidden', 'ml_morder', 'ml_dcard', 'ml_memories', 'ml_dashpages', 'ml_documents', 'ml_collection', 'ml_subs'];
// Written details sync. Photos go online only for the accounts in PHOTO_OWNERS; for everyone else they never leave the phone (they would fill the cloud storage). Photos are cut out before saving to the cloud and a phone keeps its own photos when the cloud copy arrives.
const NO_PHOTO_KEYS = ['ml_documents', 'ml_collection', 'ml_subs', 'ml_accounts'];
const noPhotos = (v: any): any => Array.isArray(v) ? v.map(noPhotos) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === 'photo' ? '' : k === 'photos' ? [] : noPhotos(x)])) : v;
async function keepMyPhotos(k: string, remote: any): Promise<any> {
  if (!NO_PHOTO_KEYS.includes(k) || !remote || typeof remote !== 'object') return remote;
  try {
    const t = await getText(k); if (!t) return remote; const mine = JSON.parse(t); const out: any = { ...remote };
    Object.keys(out).forEach((f) => {
      if (!Array.isArray(out[f]) || !Array.isArray(mine && mine[f])) return;
      const ph = new Map<any, string>(); const pgs = new Map<any, string[]>(); mine[f].forEach((x: any) => { if (x && x.photo) ph.set(x.id, x.photo); if (x && Array.isArray(x.photos) && x.photos.length) pgs.set(x.id, x.photos); });
      out[f] = out[f].map((x: any) => { if (!x) return x; let y = x; if (!y.photo && ph.has(y.id)) y = { ...y, photo: ph.get(y.id) }; if ((!y.photos || !y.photos.length) && pgs.has(y.id)) y = { ...y, photos: pgs.get(y.id) }; return y; });
    });
    return out;
  } catch (e) { return remote; }
}
// Photos can go online only for accounts on this list (they are stored in a private Supabase bucket that the server also locks to the same account).
const PHOTO_OWNERS = ['adlisyahmi324@gmail.com'];
const BUCKET = 'my-photos';
export function photoSyncOn(): boolean { const s = getSession(); const e = ((s && s.user && s.user.email) || '').toLowerCase(); return !!e && PHOTO_OWNERS.includes(e); }
const b64Bytes = (b: string): Uint8Array => {
  const T = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; const clean = b.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor(clean.length * 3 / 4)); let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = T.indexOf(clean[i]), c = T.indexOf(clean[i + 1]), d = i + 2 < clean.length ? T.indexOf(clean[i + 2]) : -1, e = i + 3 < clean.length ? T.indexOf(clean[i + 3]) : -1;
    out[o++] = (a << 2) | (c >> 4); if (d >= 0) out[o++] = ((c & 15) << 4) | (d >> 2); if (e >= 0) out[o++] = ((d & 3) << 6) | e;
  }
  return out.subarray(0, o);
};
const UPKEY = 'ml_photo_up'; let upped: Set<string> | null = null;
async function loadUp(): Promise<Set<string>> { if (upped) return upped; try { upped = new Set(JSON.parse((await AsyncStorage.getItem(UPKEY)) || '[]')); } catch (e) { upped = new Set(); } return upped as Set<string>; }
// Walks the saved data and runs fn on every photo (the photo text and each entry of photos).
async function mapPhotos(v: any, fn: (u: string) => Promise<string>): Promise<any> {
  if (Array.isArray(v)) return Promise.all(v.map((x) => mapPhotos(x, fn)));
  if (!v || typeof v !== 'object') return v;
  const out: any = {};
  for (const k of Object.keys(v)) {
    const x = v[k];
    if (k === 'photo' && typeof x === 'string') out[k] = x ? await fn(x) : x;
    else if (k === 'photos' && Array.isArray(x)) out[k] = (await Promise.all(x.map((u: any) => (typeof u === 'string' && u ? fn(u) : Promise.resolve(u))))).filter((u: any) => u !== '');
    else out[k] = await mapPhotos(x, fn);
  }
  return out;
}
// Phone to cloud: uploads a picture once and returns its cloud name. A picture that cannot be read is left out.
async function upPhoto(uid: string, uri: string): Promise<string> {
  if (uri.startsWith('sb:')) return uri;
  if (!/^(file:|\/)/.test(uri)) return '';
  const name = uid + '/' + ((uri.split('/').pop() || 'x.jpg').split('?')[0]);
  const set = await loadUp();
  if (!set.has(name)) {
    let b64 = ''; try { const FS = await import('expo-file-system/legacy'); b64 = await FS.readAsStringAsync(uri, { encoding: FS.EncodingType.Base64 }); } catch (e) { return ''; }
    if (!b64) return '';
    const { error } = await supabase.storage.from(BUCKET).upload(name, b64Bytes(b64), { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    set.add(name); try { await AsyncStorage.setItem(UPKEY, JSON.stringify([...set].slice(-3000))); } catch (e) {}
  }
  return 'sb:' + name;
}
// Cloud to phone: downloads a picture into the app's own storage (once). If it cannot be fetched now, the cloud name is kept and tried again at the next sync.
async function downPhoto(ref: string): Promise<string> {
  if (!ref.startsWith('sb:')) return ref;
  try {
    const FS = await import('expo-file-system/legacy');
    const name = ref.slice(3); const dir = (FS.documentDirectory || '') + 'docs/'; const to = dir + name.replace(/\//g, '_');
    const info = await FS.getInfoAsync(to); if (info.exists) return to;
    await FS.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(name, 300);
    if (error || !data) return ref;
    const r = await FS.downloadAsync(data.signedUrl, to);
    return r.status === 200 ? to : ref;
  } catch (e) { return ref; }
}
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
    if (NO_PHOTO_KEYS.includes(k)) v = photoSyncOn() ? await mapPhotos(v, (u) => upPhoto(uid, u)) : noPhotos(v);
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
      if (r && (r.t > lt || first)) { let nv = await keepMyPhotos(k, r.v); if (NO_PHOTO_KEYS.includes(k) && photoSyncOn()) nv = await mapPhotos(nv, downPhoto); await applyRemote(k, nv); m[k] = r.t; dirty.delete(k); }
      else if (r && lt > r.t) toPush.push(k);
      else if (!r && (dirty.has(k) || (await getText(k)) != null)) { if (!m[k]) m[k] = Date.now(); toPush.push(k); }
    }
    // Photo sync just turned on for this account: send the pictures already on this phone once.
    const ph = photoSyncOn();
    if (ph && !m.__ph) NO_PHOTO_KEYS.forEach((k) => { if (!toPush.includes(k) && remote.has(k)) toPush.push(k); });
    m.__init = 1; fresh = false;
    await saveMeta();
    if (toPush.length) { await pushKeys(uid, toPush); toPush.forEach((k) => dirty.delete(k)); }
    if (ph && !m.__ph) { m.__ph = 1; await saveMeta(); }
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
  if (photoSyncOn()) { try { const { data } = await supabase.storage.from(BUCKET).list(s.user.id, { limit: 1000 }); if (data && data.length) await supabase.storage.from(BUCKET).remove(data.map((f: any) => s.user.id + '/' + f.name)); upped = new Set(); await AsyncStorage.removeItem(UPKEY); } catch (e) {} }
  return !error;
}
