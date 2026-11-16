import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getItem, setItem } from './store';

// Downloaded Quran audio. Streaming stays the default; the person can save any surah or juz on this phone to listen offline.
// Files are kept per verse (so a juz and a surah share them) in the app's own folder. Nothing here is synced or sent anywhere.
const API = 'https://api.alquran.cloud/v1';
export type NetPref = 'wifi' | 'any';
export const NET_KEY = 'ml_dl_net';

type SurahIdx = { total: number; files: Record<string, number> }; // ayah -> bytes
type QIdx = { s: Record<string, SurahIdx>; j: Record<string, [number, number][]> }; // j: juz -> list of [surah, ayah]
type Idx = Record<string, QIdx>;
let idx: Idx | null = null;
const ROOT = async () => { const FS: any = await import('expo-file-system/legacy'); return { FS, dir: (FS.documentDirectory || '') + 'quran-audio/' }; };

export const dlSupported = Platform.OS !== 'web';
export const fmtBytes = (n: number) => n <= 0 ? '0 KB' : n < 1024 * 1024 ? Math.max(1, Math.round(n / 1024)) + ' KB' : n < 1024 * 1024 * 1024 ? (n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0) + ' MB' : (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';

export async function loadIdx(): Promise<Idx> {
  if (idx) return idx;
  idx = {};
  if (!dlSupported) return idx;
  try { const { FS, dir } = await ROOT(); const t = await FS.readAsStringAsync(dir + 'index.json'); idx = JSON.parse(t) || {}; } catch (e) { idx = {}; }
  return idx as Idx;
}
async function saveIdx() {
  if (!dlSupported || !idx) return;
  try { const { FS, dir } = await ROOT(); await FS.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {}); await FS.writeAsStringAsync(dir + 'index.json', JSON.stringify(idx)); } catch (e) { /* ignore */ }
}
const q = (qid: string): QIdx => { const i = idx as Idx; if (!i[qid]) i[qid] = { s: {}, j: {} }; return i[qid]; };
export const fileUri = (dir: string, qid: string, s: number, a: number) => dir + qid + '/' + s + '_' + a + '.mp3';

// ---- progress state shared with the screen
export type DlState = { busy: boolean; label: string; done: number; total: number; err: string; version: number; stopping: boolean };
let st: DlState = { busy: false, label: '', done: 0, total: 0, err: '', version: 0, stopping: false };
const subs = new Set<() => void>();
const set = (p: Partial<DlState>) => { st = { ...st, ...p }; subs.forEach((f) => f()); };
export const useDl = (): DlState => {
  const [, tick] = useState(0);
  useEffect(() => { const f = () => tick((n) => n + 1); subs.add(f); loadIdx().then(() => tick((n) => n + 1)); return () => { subs.delete(f); }; }, []);
  return st;
};
let cancel = false;
const live = new Set<any>(); // downloads in flight, so Cancel can stop them at once
let abortCtl: AbortController | null = null;
export const cancelDownload = () => {
  if (!st.busy || cancel) return;
  cancel = true; set({ stopping: true });
  live.forEach((d) => { try { d.cancelAsync(); } catch (e) { /* ignore */ } });
  try { abortCtl && abortCtl.abort(); } catch (e) { /* ignore */ }
};
// One verse file, with a time limit so a stuck connection can never freeze the download or the Cancel button.
async function getFile(FS: any, url: string, to: string): Promise<boolean> {
  const d = FS.createDownloadResumable(url, to);
  live.add(d);
  const timer = setTimeout(() => { try { d.cancelAsync(); } catch (e) { /* ignore */ } }, 30000);
  try { const r = await d.downloadAsync(); return !!r && r.status === 200; } catch (e) { return false; }
  finally { clearTimeout(timer); live.delete(d); }
}
let bProg: { done: number } | null = null; // verses finished in a whole-Quran download

// ---- what is on the phone
export const surahDone = (qid: string, s: number): boolean => { const x = idx && idx[qid] && idx[qid].s[String(s)]; return !!x && x.total > 0 && Object.keys(x.files).length >= x.total; };
export const juzDone = (qid: string, j: number): boolean => {
  const qi = idx && idx[qid]; const list = qi && qi.j[String(j)]; if (!list || !list.length) return false;
  return list.every(([s, a]) => !!(qi as QIdx).s[String(s)] && (qi as QIdx).s[String(s)].files[String(a)] !== undefined);
};
export function usage(qid?: string): { bytes: number; surahs: { s: number; bytes: number; have: number; total: number }[] } {
  let bytes = 0; const out: { s: number; bytes: number; have: number; total: number }[] = [];
  Object.keys(idx || {}).forEach((id) => {
    if (qid && id !== qid) return;
    const qi = (idx as Idx)[id];
    Object.keys(qi.s).forEach((s) => { const x = qi.s[s]; const b = Object.keys(x.files).reduce((a, k) => a + x.files[k], 0); bytes += b; if (qid && b > 0) out.push({ s: +s, bytes: b, have: Object.keys(x.files).length, total: x.total }); });
  });
  return { bytes, surahs: out.sort((a, b) => a.s - b.s) };
}
export const totalBytes = () => usage().bytes;

// Local items for a surah or juz, or null when some verse is missing (then it is streamed instead).
export async function localItems(qid: string, kind: 's' | 'j', n: number): Promise<{ url: string; surah: number; ayah: number; label: string }[] | null> {
  if (!dlSupported) return null;
  await loadIdx();
  const { dir } = await ROOT(); const qi = (idx as Idx)[qid]; if (!qi) return null;
  let list: [number, number][] | null = null;
  if (kind === 's') { const x = qi.s[String(n)]; if (x && x.total > 0 && Object.keys(x.files).length >= x.total) list = Array.from({ length: x.total }, (_, i) => [n, i + 1] as [number, number]); }
  else if (juzDone(qid, n)) list = qi.j[String(n)];
  if (!list) return null;
  return list.map(([s, a]) => ({ url: fileUri(dir, qid, s, a), surah: s, ayah: a, label: s + ':' + a }));
}

// ---- network rule
export async function netOk(): Promise<{ ok: boolean; msg: string }> {
  let pref: NetPref = 'wifi';
  try { pref = (await getItem<NetPref>(NET_KEY, 'wifi')) === 'any' ? 'any' : 'wifi'; } catch (e) { /* keep default */ }
  try {
    const N: any = await import('expo-network');
    const s = await N.getNetworkStateAsync();
    if (!s || s.isConnected === false || s.isInternetReachable === false) return { ok: false, msg: 'No internet connection.' };
    if (pref === 'wifi' && s.type === N.NetworkStateType.CELLULAR) return { ok: false, msg: 'You are on mobile data. Connect to Wi-Fi, or choose "Wi-Fi or mobile data" below.' };
  } catch (e) { /* cannot tell the connection type: allow */ }
  return { ok: true, msg: '' };
}

async function getList(qid: string, ident: string, kind: 's' | 'j', n: number): Promise<[number, number][]> {
  const ac = new AbortController(); abortCtl = ac; const to = setTimeout(() => ac.abort(), 20000);
  let r: any; try { r = await fetch(API + (kind === 's' ? '/surah/' : '/juz/') + n + '/' + ident, { signal: ac.signal }); } finally { clearTimeout(to); }
  const j = await r.json(); const ay: any[] = (j && j.data && j.data.ayahs) || [];
  const out: [number, number][] = []; const urls: Record<string, string> = {};
  ay.forEach((a) => { if (!a || !a.audio) return; const s = (a.surah && a.surah.number) || n; const k = s + ':' + a.numberInSurah; out.push([s, a.numberInSurah]); urls[k] = String(a.audio).replace(/^http:/, 'https:'); });
  if (!out.length) throw new Error('empty');
  pending = urls;
  return out;
}
let pending: Record<string, string> = {};

// Download one unit (a surah or a juz). Verses already on the phone are skipped, so it can be resumed.
async function oneUnit(qid: string, ident: string, kind: 's' | 'j', n: number, label: string, batch: boolean) {
  const { FS, dir } = await ROOT();
  await FS.makeDirectoryAsync(dir + qid, { intermediates: true }).catch(() => {});
  const list = await getList(qid, ident, kind, n); const urls = pending;
  const qi = q(qid);
  // total verses of each surah touched (a juz covers parts of several surahs)
  const counts: Record<string, number> = {}; list.forEach(([s]) => { counts[s] = (counts[s] || 0) + 1; });
  if (kind === 's') qi.s[String(n)] = qi.s[String(n)] || { total: list.length, files: {} };
  if (kind === 's') qi.s[String(n)].total = list.length;
  else list.forEach(([s]) => { if (!qi.s[String(s)]) qi.s[String(s)] = { total: 0, files: {} }; });
  const todo = list.filter(([s, a]) => !(qi.s[String(s)] && qi.s[String(s)].files[String(a)] !== undefined));
  let done = 0; if (!batch) set({ label, done: 0, total: Math.max(1, todo.length) });
  let at = 0;
  const worker = async () => {
    while (at < todo.length && !cancel) {
      const [s, a] = todo[at++]; const to = fileUri(dir, qid, s, a);
      let ok = false;
      for (let t = 0; t < 3 && !ok && !cancel; t++) {
        ok = await getFile(FS, urls[s + ':' + a], to);
        if (!ok) await FS.deleteAsync(to, { idempotent: true }).catch(() => {});
      }
      if (!ok) { if (!cancel) { cancel = true; throw new Error('download'); } return; }
      let bytes = 0; try { const i = await FS.getInfoAsync(to); bytes = (i && i.size) || 1; } catch (e) { bytes = 1; }
      if (!qi.s[String(s)]) qi.s[String(s)] = { total: 0, files: {} };
      qi.s[String(s)].files[String(a)] = bytes; done++;
      if (!batch) set({ done }); else if (bProg) { bProg.done++; set({ done: bProg.done }); }
    }
  };
  if (batch && bProg) { bProg.done += list.length - todo.length; set({ done: bProg.done }); }
  await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
  if (cancel) { await saveIdx(); return false; }
  if (kind === 'j') qi.j[String(n)] = list;
  await saveIdx(); set({ version: st.version + 1 });
  return true;
}

export async function downloadSurah(qid: string, ident: string, s: number, title: string): Promise<boolean> {
  return run(async () => { const ok = await oneUnit(qid, ident, 's', s, title, false); return ok; }, title, 1);
}
export async function downloadJuz(qid: string, ident: string, j: number, title: string): Promise<boolean> {
  return run(async () => { const ok = await oneUnit(qid, ident, 'j', j, title, false); return ok; }, title, 1);
}
export async function downloadAll(qid: string, ident: string, names: string[]): Promise<boolean> {
  return run(async () => {
    bProg = { done: 0 };
    try {
      for (let s = 1; s <= 114 && !cancel; s++) {
        const label = 'Surah ' + s + ' of 114 · ' + (names[s - 1] || '');
        set({ label });
        if (surahDone(qid, s)) { bProg.done += ((idx as Idx)[qid].s[String(s)] || { total: 0 }).total; set({ done: bProg.done }); continue; }
        const ok = await oneUnit(qid, ident, 's', s, label, true); if (!ok) return false;
      }
      return !cancel;
    } finally { bProg = null; }
  }, 'Whole Quran', 6236);
}
async function run(f: () => Promise<boolean>, label: string, total: number): Promise<boolean> {
  if (!dlSupported) return false;
  if (st.busy) { set({ err: 'Another download is running. Wait for it or cancel it first.' }); return false; }
  const n = await netOk(); if (!n.ok) { set({ err: n.msg }); return false; }
  cancel = false; await loadIdx(); set({ busy: true, label, done: 0, total, err: '', stopping: false });
  try { const ok = await f(); set({ busy: false, stopping: false, err: ok ? '' : cancel ? 'Download stopped. What was saved stays on the phone.' : '' }); return ok; }
  catch (e) { await saveIdx(); set({ busy: false, stopping: false, err: cancel ? 'Download stopped. What was saved stays on the phone.' : 'Download failed. Check your internet and try again. What was saved stays on the phone.' }); return false; }
}
export const clearDlError = () => set({ err: '' });

// ---- delete
export async function deleteSurah(qid: string, s: number) {
  await loadIdx(); const { FS, dir } = await ROOT(); const qi = q(qid); const x = qi.s[String(s)];
  if (x) { for (const a of Object.keys(x.files)) await FS.deleteAsync(fileUri(dir, qid, s, +a), { idempotent: true }).catch(() => {}); delete qi.s[String(s)]; }
  Object.keys(qi.j).forEach((j) => { if (qi.j[j].some(([ss]) => ss === s)) delete qi.j[j]; });
  await saveIdx(); set({ version: st.version + 1 });
}
export async function deleteAll(qid?: string) {
  await loadIdx(); const { FS, dir } = await ROOT();
  for (const id of Object.keys(idx as Idx)) { if (qid && id !== qid) continue; await FS.deleteAsync(dir + id, { idempotent: true }).catch(() => {}); delete (idx as Idx)[id]; }
  await saveIdx(); set({ version: st.version + 1 });
}

// ---- reciter list kept for offline use
export const QARI_CACHE = 'ml_qari_ids';
export const saveQariCache = (m: Record<string, string>) => setItem(QARI_CACHE, m).catch(() => {});
export const readQariCache = () => getItem<Record<string, string>>(QARI_CACHE, {});
