import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import aesjs from 'aes-js';

// Data on the phone is encrypted with AES-256 (CTR). The key is random, made on first use, and lives in the
// phone's secure keystore, never next to the data. On the web build there is no keystore, so data stays plain there.
const KEY_NAME = 'ml_data_key';
const PREFIX = 'enc1:';
let keyP: Promise<Uint8Array | null> | null = null;

const toHex = (b: Uint8Array) => aesjs.utils.hex.fromBytes(b as any);
const fromHex = (h: string) => aesjs.utils.hex.toBytes(h) as unknown as Uint8Array;

function getKey(): Promise<Uint8Array | null> {
  if (Platform.OS === 'web') return Promise.resolve(null);
  if (!keyP) keyP = (async () => {
    // The phone's keystore can be slow or stuck right after the app wakes up. Try twice, and never wait on it forever.
    for (let i = 0; i < 2; i++) {
      try {
        const have = await Promise.race([SecureStore.getItemAsync(KEY_NAME), new Promise<never>((_, rej) => setTimeout(() => rej(new Error('keystore timeout')), 6000))]);
        if (have) return fromHex(have);
        const k = Crypto.getRandomBytes(32);
        await SecureStore.setItemAsync(KEY_NAME, toHex(k));
        return k;
      } catch (e) { /* try again once */ }
    }
    keyP = null; return null;
  })();
  return keyP;
}
// Wakes the keystore as soon as the app starts, so the first save after a long break does not have to wait for it.
export function warmKey() { getKey().catch(() => {}); }

export async function seal(plain: string): Promise<string> {
  const key = await getKey(); if (!key) return plain;
  const iv = Crypto.getRandomBytes(16);
  const ctr = new aesjs.ModeOfOperation.ctr(key as any, new aesjs.Counter(iv as any));
  return PREFIX + toHex(iv) + toHex(ctr.encrypt(aesjs.utils.utf8.toBytes(plain)));
}

// Values saved before encryption was added are still read as plain text, and get encrypted on their next save.
export async function open(raw: string): Promise<string> {
  if (!raw.startsWith(PREFIX)) return raw;
  const key = await getKey(); if (!key) throw new Error('no key');
  const iv = fromHex(raw.slice(PREFIX.length, PREFIX.length + 32));
  const body = fromHex(raw.slice(PREFIX.length + 32));
  const ctr = new aesjs.ModeOfOperation.ctr(key as any, new aesjs.Counter(iv as any));
  return aesjs.utils.utf8.fromBytes(ctr.decrypt(body));
}

// Small secrets (app-lock settings and PIN hash) go straight into the keystore.
export async function secGet(k: string): Promise<string | null> {
  try { return Platform.OS === 'web' ? (typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null) : await SecureStore.getItemAsync(k); } catch (e) { return null; }
}
export async function secSet(k: string, v: string) {
  try { if (Platform.OS === 'web') { if (typeof localStorage !== 'undefined') localStorage.setItem(k, v); } else await SecureStore.setItemAsync(k, v); } catch (e) {}
}
export async function secDel(k: string) {
  try { if (Platform.OS === 'web') { if (typeof localStorage !== 'undefined') localStorage.removeItem(k); } else await SecureStore.deleteItemAsync(k); } catch (e) {}
}
export const randHex = (n: number) => toHex(Crypto.getRandomBytes(n));
