import AsyncStorage from '@react-native-async-storage/async-storage';
import { open } from './secure';

// Saved copies of the family are kept as plain text. A copy that an older version sealed (enc1:) is opened,
// and one that cannot be read at all is thrown away, so a bad copy can never stop the app from opening.
export async function readCache<T = any>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const txt = raw.startsWith('enc1:') ? await open(raw) : raw;
    return JSON.parse(txt) as T;
  } catch (e) {
    AsyncStorage.removeItem(key).catch(() => {});
    return null;
  }
}
