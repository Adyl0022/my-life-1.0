import AsyncStorage from '@react-native-async-storage/async-storage';
// A tiny breadcrumb for the body hologram: the last step it reached is saved, so if the app is shut down by the phone the next start can tell where it stopped.
const K = 'ml_tmtrace';
export const mark = (s: string) => { try { AsyncStorage.setItem(K, s).catch(() => {}); } catch (e) {} };
export const readMark = async (): Promise<string | null> => { try { return await AsyncStorage.getItem(K); } catch (e) { return null; } };
export const stoppedAt = (m: string | null) => (m && m !== 'ok' && m !== 'left' ? m : null);
