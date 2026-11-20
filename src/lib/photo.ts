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
