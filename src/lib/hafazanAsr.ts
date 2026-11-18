import { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

// Offline Quran recitation recognition (Whisper tuned for the Quran, running on the phone with whisper.cpp).
// The recording never leaves the phone. Only the one-time model download (about 43 MB) uses the internet.
// Model: ggml-quran-tiny-q8_0 (Apache-2.0), a Quran fine-tune of OpenAI Whisper by Tarteel AI, converted for whisper.cpp.
const MODEL_URL = 'https://github.com/mano270699/watazawwadu-models/releases/download/quran-whisper-tiny-v1/ggml-quran-tiny-q8_0.bin';
const MODEL_BYTES = 43537433;
export const MODEL_MB = Math.round(MODEL_BYTES / 1048576);
export const asrSupported = Platform.OS === 'android';

export type AsrState = { phase: 'none' | 'downloading' | 'ready' | 'loading' | 'error'; pct: number; err: string };
let st: AsrState = { phase: 'none', pct: 0, err: '' };
const subs = new Set<() => void>();
const set = (p: Partial<AsrState>) => { st = { ...st, ...p }; subs.forEach((f) => f()); };
export const useAsr = (): AsrState => {
  const [, f] = useState(0);
  useEffect(() => { const u = () => f((x) => x + 1); subs.add(u); refresh(); return () => { subs.delete(u); }; }, []);
  return st;
};

const FS = async () => { const m: any = await import('expo-file-system/legacy'); return { m, path: (m.documentDirectory || '') + 'hafazan/quran-tiny-q8.bin' }; };

async function refresh() {
  if (!asrSupported || st.phase === 'downloading' || st.phase === 'loading') return;
  try { const { m, path } = await FS(); const i = await m.getInfoAsync(path); set({ phase: i.exists && i.size === MODEL_BYTES ? 'ready' : 'none' }); } catch (e) { /* keep state */ }
}

export async function downloadModel(): Promise<void> {
  if (!asrSupported || st.phase === 'downloading') return;
  set({ phase: 'downloading', pct: 0, err: '' });
  try {
    const { m, path } = await FS();
    await m.makeDirectoryAsync(path.replace(/[^/]+$/, ''), { intermediates: true }).catch(() => {});
    const tmp = path + '.part';
    const dl = m.createDownloadResumable(MODEL_URL, tmp, {}, (p: any) => set({ pct: p.totalBytesExpectedToWrite > 0 ? p.totalBytesWritten / p.totalBytesExpectedToWrite : p.totalBytesWritten / MODEL_BYTES }));
    const r = await dl.downloadAsync();
    if (!r || (r.status && r.status >= 400)) throw new Error('The download failed. Check your internet and try again.');
    const i = await m.getInfoAsync(tmp);
    if (!i.exists || i.size !== MODEL_BYTES) { await m.deleteAsync(tmp, { idempotent: true }); throw new Error('The downloaded file looks incomplete. Please try again.'); }
    await m.moveAsync({ from: tmp, to: path });
    set({ phase: 'ready', pct: 1 });
  } catch (e: any) { set({ phase: 'error', err: String((e && e.message) || e) }); }
}

export async function deleteModel(): Promise<void> {
  try { await release(); const { m, path } = await FS(); await m.deleteAsync(path, { idempotent: true }); } catch (e) { /* ignore */ }
  set({ phase: 'none', pct: 0, err: '' });
}

let ctx: any = null;
async function load() {
  if (ctx) return ctx;
  const { path } = await FS();
  // @ts-ignore
  const w: any = await import('whisper.rn');
  ctx = await w.initWhisper({ filePath: path, useGpu: false });
  return ctx;
}
async function release() { try { if (ctx) await ctx.release(); } catch (e) { /* ignore */ } ctx = null; }

// ---- recording: raw 16 kHz mono PCM, kept in memory while the person recites
let chunks: Uint8Array[] = [];
let rec: any = null;
let level = 0;
let got = 0;
export const micLevel = () => level;

const b64 = (s: string): Uint8Array => {
  const bin = (globalThis as any).atob(s); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

export async function micPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const P = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
  try { if (await PermissionsAndroid.check(P)) return true; } catch (e) { /* ask below */ }
  // The answer can come back late (or not at all) on some phones, so ask the system again instead of waiting forever.
  const ask = PermissionsAndroid.request(P).then((r) => r === PermissionsAndroid.RESULTS.GRANTED);
  const late = new Promise<boolean>((res) => setTimeout(async () => { try { res(await PermissionsAndroid.check(P)); } catch (e) { res(false); } }, 15000));
  return Promise.race([ask, late]);
}

export async function startRecording(): Promise<void> {
  // @ts-ignore
  const mod: any = await import('@fugood/react-native-audio-pcm-stream');
  rec = mod.default || mod;
  chunks = []; level = 0;
  if (!rec || typeof rec.init !== 'function') throw new Error('The microphone module is not available in this build.');
  chunks = []; got = 0;
  try { await rec.init({ sampleRate: 16000, channels: 1, bitsPerSample: 16, audioSource: 6, bufferSize: 8192, wavFile: '' }); }
  catch (e: any) { throw new Error('The microphone could not be opened (' + String((e && (e.message || e.code)) || e) + '). Close other apps that use the microphone and try again.'); }
  rec.on('data', (d: string) => {
    got++;
    const u = b64(d); chunks.push(u);
    let peak = 0; for (let i = 0; i + 1 < u.length; i += 8) { const v = Math.abs(((u[i + 1] << 8) | u[i]) << 16 >> 16); if (v > peak) peak = v; }
    level = Math.min(1, peak / 12000);
  });
  rec.start();
  // Make sure sound is really arriving, otherwise tell the person instead of silently waiting.
  const t0 = Date.now();
  while (got === 0 && Date.now() - t0 < 4000) await new Promise((r) => setTimeout(r, 100));
  if (got === 0) { try { await rec.stop(); } catch (e) { /* ignore */ } throw new Error('No sound is coming from the microphone. Check that the microphone is allowed for My Life in the phone settings, then try again.'); }
}

export type Heard = { text: string; seconds: number; pcm: Float32Array };

// Stops recording and turns the speech into text. The loaded model stays in memory for the next try.
export async function stopAndTranscribe(): Promise<Heard> {
  try { await rec.stop(); } catch (e) { /* already stopped */ }
  level = 0;
  let n = 0; chunks.forEach((c) => { n += c.length; });
  const bytes = new Uint8Array(n); let o = 0; chunks.forEach((c) => { bytes.set(c, o); o += c.length; });
  const samples = new Float32Array(Math.floor(n / 2));
  for (let i = 0; i < samples.length; i++) samples[i] = (((bytes[2 * i + 1] << 8) | bytes[2 * i]) << 16 >> 16) / 32768;
  chunks = [];
  const seconds = samples.length / 16000;
  if (seconds < 0.8) return { text: '', seconds, pcm: samples };
  set({ phase: 'loading' });
  try {
    const c = await load();
    const { promise } = c.transcribeData(samples.buffer, { language: 'ar', maxLen: 0, temperature: 0, beamSize: 5 });
    const r = await promise;
    set({ phase: 'ready' });
    return { text: String((r && r.result) || '').trim(), seconds, pcm: samples };
  } catch (e: any) { set({ phase: 'ready' }); throw e; }
}

export async function cancelRecording() { try { if (rec) await rec.stop(); } catch (e) { /* ignore */ } chunks = []; level = 0; }
