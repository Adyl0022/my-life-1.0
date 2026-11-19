import { Platform } from 'react-native';
// Picks or takes a photo and keeps a copy in the app's own storage. Camera permission is asked only when the camera is used.
export async function takePhoto(camera: boolean): Promise<string | null> {
  const IP = await import('expo-image-picker');
  if (camera) { const p = await IP.requestCameraPermissionsAsync(); if (!p.granted) throw new Error('camera'); }
  const r = camera ? await IP.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 }) : await IP.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: Platform.OS === 'web' });
  if (r.canceled || !r.assets || !r.assets[0]) return null;
  const a: any = r.assets[0];
  if (Platform.OS === 'web') return a.base64 ? 'data:' + (a.mimeType || 'image/jpeg') + ';base64,' + a.base64 : a.uri;
  try {
    const FS = await import('expo-file-system/legacy');
    const dir = (FS.documentDirectory || '') + 'docs/';
    await FS.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const to = dir + Date.now() + '.' + ((a.uri.split('.').pop() || 'jpg').split('?')[0]);
    await FS.copyAsync({ from: a.uri, to }); return to;
  } catch (e) { return a.uri; }
}
