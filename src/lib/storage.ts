import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setItem } from './store';
import { MODS } from './exporter';

export const fmtBytes = (n: number) => (n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB' : (n / 1048576).toFixed(1) + ' MB');

async function dirSize(FS: any, uri: string): Promise<number> {
  try {
    const info = await FS.getInfoAsync(uri);
    if (!info.exists) return 0;
    if (!info.isDirectory) return info.size || 0;
    let t = 0; const names: string[] = await FS.readDirectoryAsync(uri);
    for (const n of names) t += await dirSize(FS, uri.replace(/\/?$/, '/') + n);
    return t;
  } catch (e) { return 0; }
}

// "Your data" is what you saved (entries, notes, receipt photos). "Temporary files" are exports and other leftovers that are safe to delete.
export async function storageInfo(): Promise<{ data: number; temp: number }> {
  let data = 0, temp = 0;
  try {
    const ks = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('ml_'));
    const rows = await AsyncStorage.multiGet(ks);
    rows.forEach(([, v]) => { data += (v || '').length; });
  } catch (e) {}
  if (Platform.OS !== 'web') {
    try {
      const FS: any = await import('expo-file-system/legacy');
      data += await dirSize(FS, (FS.documentDirectory || '') + 'receipts/');
      temp = await dirSize(FS, FS.cacheDirectory || '');
    } catch (e) {}
  }
  return { data, temp };
}

export async function clearTemp(): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const FS: any = await import('expo-file-system/legacy');
  const root: string = FS.cacheDirectory || ''; if (!root) return 0;
  const before = await dirSize(FS, root);
  try { for (const n of await FS.readDirectoryAsync(root)) await FS.deleteAsync(root.replace(/\/?$/, '/') + n, { idempotent: true }); } catch (e) {}
  return Math.max(0, before - (await dirSize(FS, root)));
}

export async function pickText(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return new Promise((res) => {
      const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json';
      i.onchange = async () => { const f = i.files && i.files[0]; res(f ? await f.text() : null); };
      i.click();
    });
  }
  const DP = await import('expo-document-picker');
  const r: any = await DP.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (r.canceled || !r.assets || !r.assets[0]) return null;
  const FS: any = await import('expo-file-system/legacy');
  return FS.readAsStringAsync(r.assets[0].uri);
}

export type Backup = { created: string; parts: string[]; data: Record<string, Record<string, any>>; images?: Record<string, string> };

// Receipt photos live as files on this phone. A backup can carry them (as text) so they come along to a new phone.
// Limits keep the backup file at a size the phone can still open.
export const RECEIPT_MAX_N = 25;
export const RECEIPT_MAX_CHARS = 15000000;
const isReceipt = (v: any) => typeof v === 'string' && v.indexOf('/receipts/') >= 0 && v.indexOf('data:') !== 0;
const walkStr = (v: any, f: (s: string) => void) => { if (typeof v === 'string') f(v); else if (Array.isArray(v)) v.forEach((x) => walkStr(x, f)); else if (v && typeof v === 'object') Object.keys(v).forEach((k) => walkStr(v[k], f)); };
export async function packReceipts(data: any): Promise<{ images: Record<string, string>; skipped: number }> {
  const images: Record<string, string> = {}; let skipped = 0; let chars = 0;
  if (Platform.OS === 'web') return { images, skipped };
  const uris: string[] = [];
  walkStr(data, (x) => { if (isReceipt(x) && uris.indexOf(x) < 0) uris.push(x); });
  if (!uris.length) return { images, skipped };
  const FS: any = await import('expo-file-system/legacy');
  for (const u of uris) {
    try {
      const info = await FS.getInfoAsync(u); if (!info.exists) continue;
      if (Object.keys(images).length >= RECEIPT_MAX_N || chars + (info.size || 0) * 1.34 > RECEIPT_MAX_CHARS) { skipped++; continue; }
      const b64: string = await FS.readAsStringAsync(u, { encoding: FS.EncodingType.Base64 });
      images[u] = b64; chars += b64.length;
    } catch (e) { skipped++; }
  }
  return { images, skipped };
}
// Writes the photos from a backup back into this phone's receipts folder and points the records at the new files.
async function restoreReceipts(b: Backup): Promise<number> {
  const keys = Object.keys(b.images || {});
  if (!keys.length || Platform.OS === 'web') return 0;
  const FS: any = await import('expo-file-system/legacy');
  const dir = (FS.documentDirectory || '') + 'receipts/';
  await FS.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
  const map: Record<string, string> = {}; let n = 0;
  for (const u of keys) {
    try {
      const ext = (u.split('.').pop() || 'jpg').split('?')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 5) || 'jpg';
      const to = dir + 'r' + Date.now() + '-' + n + '.' + ext;
      await FS.writeAsStringAsync(to, (b.images as any)[u], { encoding: FS.EncodingType.Base64 });
      map[u] = to; n++;
    } catch (e) {}
  }
  const swap = (v: any): any => (typeof v === 'string' ? (map[v] || v) : Array.isArray(v) ? v.map(swap) : v && typeof v === 'object' ? Object.keys(v).reduce((o: any, k) => { o[k] = swap(v[k]); return o; }, {}) : v);
  Object.keys(b.data).forEach((m) => { b.data[m] = swap(b.data[m]); });
  return n;
}
// Reads a backup file made by Export. Only the known My Life keys are accepted, anything else in the file is ignored.
export function parseBackup(text: string): Backup | null {
  try {
    const j = JSON.parse(text.replace(/^﻿/, ''));
    if (!j || typeof j !== 'object' || !/^My Life/.test(String(j.app || '')) || !j.data || typeof j.data !== 'object') return null;
    const data: Record<string, Record<string, any>> = {}; const parts: string[] = [];
    for (const m of MODS) {
      const src = j.data[m.k]; if (!src || typeof src !== 'object') continue;
      const keep: Record<string, any> = {};
      m.keys.forEach((k) => { if (src[k] != null && typeof src[k] === 'object') keep[k] = src[k]; });
      if (Object.keys(keep).length) { data[m.k] = keep; parts.push(m.name); }
    }
    if (!parts.length) return null;
    const images: Record<string, string> = {};
    if (j.images && typeof j.images === 'object') Object.keys(j.images).slice(0, RECEIPT_MAX_N).forEach((u) => { if (typeof j.images[u] === 'string' && isReceipt(u)) images[u] = j.images[u]; });
    return { created: String(j.created || j.createdAt || ''), parts, data, images: Object.keys(images).length ? images : undefined };
  } catch (e) { return null; }
}
export async function applyBackup(b: Backup): Promise<number> {
  let photos = 0;
  try { photos = await restoreReceipts(b); } catch (e) {}
  for (const m of Object.keys(b.data)) for (const k of Object.keys(b.data[m])) await setItem(k, b.data[m][k]);
  return photos;
}
