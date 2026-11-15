import AsyncStorage from '@react-native-async-storage/async-storage';
import { open } from './secure';
// A tiny breadcrumb for the body hologram: the last step it reached is saved, so if the phone shuts the app down the next start can tell where it stopped.
const K = 'ml_tmtrace2';
export const mark = (s: string) => { try { AsyncStorage.setItem(K, s).catch(() => {}); } catch (e) {} };
export const readMark = async (): Promise<string | null> => { try { const r = await AsyncStorage.getItem(K); if (r == null) return null; return r.startsWith('enc1:') ? await open(r) : r; } catch (e) { return null; } };
export const stoppedAt = (m: string | null) => (m && m !== 'ok' && m !== 'left' && m !== 'opened' ? m : null);
