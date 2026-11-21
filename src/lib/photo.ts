import { Platform } from 'react-native';
// Picks or takes a photo and keeps a copy in the app's own storage. Camera permission is asked only when the camera is used.
// With square: true the phone's own crop screen opens so you pick the square part (for a logo or icon), and the result is made small (192 px) so it stays light.
export async function takePhoto(camera: boolean, o: { square?: boolean } = {}): Promise<string | null> {
  const IP = await import('expo-image-picker');
  if (camera) { const p = await IP.requestCameraPermissionsAsync(); if (!p.granted) throw new Error('camera'); }
  const ed = o.square ? { allowsEditing: true, aspect: [1, 1] as [number, number] } : {};
  const r = camera ? await IP.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, ...ed }) : await IP.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: Platform.OS === 'web', ...ed });
  if (r.canceled || !r.assets || !r.assets[0]) return null;
  const a: any = r.assets[0];
  if (Platform.OS === 'web') return a.base64 ? 'data:' + (a.mimeType || 'image/jpeg') + ';base64,' + a.base64 : a.uri;
  return keepCopy(o.square ? await toIcon(a.uri) : a.uri);
}
// Makes a picture a small square icon. If that is not possible the picture is used as it is.
async function toIcon(uri: string): Promise<string> {
  try {
    const M = await import('expo-image-manipulator');
    const ref = await M.ImageManipulator.manipulate(uri).resize({ width: 192 }).renderAsync();
    const out = await ref.saveAsync({ format: M.SaveFormat.JPEG, compress: 0.85 });
    return out.uri;
  } catch (e) { return uri; }
}
// Keeps a copy of a picture in the app's own storage, so it is still there after the camera clears its cache.
async function keepCopy(uri: string): Promise<string> {
  try {
    const FS = await import('expo-file-system/legacy');
    const dir = (FS.documentDirectory || '') + 'docs/';
    await FS.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const to = dir + Date.now() + '.' + ((uri.split('.').pop() || 'jpg').split('?')[0]);
    await FS.copyAsync({ from: uri, to }); return to;
  } catch (e) { return uri; }
}
/** Scans a paper like a scanner app: the phone finds the edges, straightens and crops the page and clears up the colours.
 *  This is Google's document scanner and it works on the phone, nothing is uploaded. If it is not available (the web, or a phone without Google Play services), the normal camera opens instead. */
export async function scanDocument(): Promise<string | null> {
  if (Platform.OS !== 'android') return takePhoto(true);
  let DS: any = null;
  try { DS = require('react-native-document-scanner-plugin').default; } catch (e) { DS = null; }
  if (!DS) return takePhoto(true);
  const IP = await import('expo-image-picker');
  const p = await IP.requestCameraPermissionsAsync(); if (!p.granted) throw new Error('camera');
  let r: any;
  try { r = await DS.scanDocument({ maxNumDocuments: 1, croppedImageQuality: 90 }); } catch (e) { return takePhoto(true); }
  if (!r || r.status === 'cancel' || !r.scannedImages || !r.scannedImages.length) return null;
  return keepCopy(String(r.scannedImages[0]));
}

/** Scans several pages in one go (up to 30). The phone's scanner shows the filters (auto clean, colour, grey, black and white) before the pages are kept.
 *  Without the scanner (the web or a phone without Google Play services) the camera or the gallery gives one picture at a time. */
export async function scanPages(max = 30): Promise<string[]> {
  if (Platform.OS === 'android') {
    let DS: any = null;
    try { DS = require('react-native-document-scanner-plugin').default; } catch (e) { DS = null; }
    if (DS) {
      const IP = await import('expo-image-picker');
      const p = await IP.requestCameraPermissionsAsync(); if (!p.granted) throw new Error('camera');
      try {
        const r: any = await DS.scanDocument({ maxNumDocuments: max, croppedImageQuality: 100 });
        if (!r || r.status === 'cancel' || !r.scannedImages) return [];
        return (r.scannedImages as string[]).map(String);
      } catch (e) { /* fall through to the camera */ }
    }
  }
  const one = await takePhoto(Platform.OS !== 'web');
  return one ? [one] : [];
}
/** Pictures chosen from the gallery, several at once. */
export async function pickPages(): Promise<string[]> {
  const IP = await import('expo-image-picker');
  const r: any = await IP.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 30, quality: 1, base64: Platform.OS === 'web' });
  if (r.canceled || !r.assets) return [];
  return r.assets.map((a: any) => (Platform.OS === 'web' ? (a.base64 ? 'data:' + (a.mimeType || 'image/jpeg') + ';base64,' + a.base64 : a.uri) : a.uri));
}
export type ScanQ = 'std' | 'hd' | 'max';
export const SCAN_Q: { k: ScanQ; n: string; px: number; note: string }[] = [
  { k: 'std', n: 'Standard', px: 1600, note: 'Small file' },
  { k: 'hd', n: 'High 2K', px: 2048, note: 'Sharp text' },
  { k: 'max', n: 'Maximum', px: 3000, note: 'Largest file' },
];
/** Makes a page sharp but light: the long side is brought to the chosen size (never enlarged) and the copy is kept in the app's own storage. */
export async function keepScan(uri: string, q: ScanQ, turn = 0): Promise<string> {
  if (Platform.OS === 'web') return uri;
  try {
    const px = (SCAN_Q.find((x) => x.k === q) || SCAN_Q[1]).px;
    const RN = await import('react-native');
    const size: { w: number; h: number } = await new Promise((res, rej) => RN.Image.getSize(uri, (w, h) => res({ w, h }), rej));
    const M = await import('expo-image-manipulator');
    let ctx = M.ImageManipulator.manipulate(uri);
    if (turn) ctx = ctx.rotate(turn);
    const long = Math.max(size.w, size.h);
    if (long > px) ctx = size.h >= size.w ? ctx.resize({ height: px }) : ctx.resize({ width: px });
    const ref = await ctx.renderAsync();
    const out = await ref.saveAsync({ format: M.SaveFormat.JPEG, compress: 0.88 });
    const FS = await import('expo-file-system/legacy');
    const dir = (FS.documentDirectory || '') + 'scans/';
    await FS.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const to = dir + Date.now() + '-' + Math.floor(Math.random() * 1e4) + '.jpg';
    await FS.copyAsync({ from: out.uri, to }); return to;
  } catch (e) { return uri; }
}
export async function dropScanFiles(uris: string[]) {
  if (Platform.OS === 'web') return;
  try { const FS = await import('expo-file-system/legacy'); for (const u of uris) if (u.indexOf('/scans/') >= 0) await FS.deleteAsync(u, { idempotent: true }).catch(() => {}); } catch (e) { /* nothing to remove */ }
}
