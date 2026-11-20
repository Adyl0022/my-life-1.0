import { Platform } from 'react-native';
// Picks or takes a photo and keeps a copy in the app's own storage. Camera permission is asked only when the camera is used.
export async function takePhoto(camera: boolean): Promise<string | null> {
  const IP = await import('expo-image-picker');
  if (camera) { const p = await IP.requestCameraPermissionsAsync(); if (!p.granted) throw new Error('camera'); }
  const r = camera ? await IP.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 }) : await IP.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: Platform.OS === 'web' });
  if (r.canceled || !r.assets || !r.assets[0]) return null;
  const a: any = r.assets[0];
  if (Platform.OS === 'web') return a.base64 ? 'data:' + (a.mimeType || 'image/jpeg') + ';base64,' + a.base64 : a.uri;
  return keepCopy(a.uri);
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
