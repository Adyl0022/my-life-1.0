import { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

// Offline Quran recitation recognition (Whisper tuned for the Quran, running on the phone with whisper.cpp).
// The recording never leaves the phone. Only the one-time model download (about 57 MB) uses the internet.
// Model: Tarteel "whisper-base-ar-quran" (Apache-2.0), a Quran fine-tune of OpenAI Whisper base, converted for whisper.cpp
// (ggml, q5_1, about 60 MB). It is kept in this project's own GitHub repository (branch quran-model); see NOTICE.txt there.
// On 40 real recitations it made 11% word mistakes, against 35% for the smaller tiny model used before.
// Two places hold the same file: the backup repo first, then the original branch. If one cannot be reached the other is tried.
const MODEL_URLS = [
  'https://raw.githubusercontent.com/Adyl0022/my-life-1.0-backupfiles/main/ggml-quran-base-q5_1.bin',
  'https://raw.githubusercontent.com/Adyl0022/my-life-1.0/quran-model/ggml-quran-base-q5_1.bin',
];
const MODEL_BYTES = 59707625;
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

const FS = async () => { const m: any = await import('expo-file-system/legacy'); return { m, path: (m.documentDirectory || '') + 'hafazan/quran-base-q5.bin' }; };

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
    let ok = false;
    for (const url of MODEL_URLS) {
      try {
        set({ pct: 0 });
        await m.deleteAsync(tmp, { idempotent: true }).catch(() => {});
        const dl = m.createDownloadResumable(url, tmp, {}, (p: any) => set({ pct: p.totalBytesExpectedToWrite > 0 ? p.totalBytesWritten / p.totalBytesExpectedToWrite : p.totalBytesWritten / MODEL_BYTES }));
        const r = await dl.downloadAsync();
        if (!r || (r.status && r.status >= 400)) continue;
        const i = await m.getInfoAsync(tmp);
        if (i.exists && i.size === MODEL_BYTES) { ok = true; break; }
      } catch (e) { /* try the next place */ }
    }
    if (!ok) { await m.deleteAsync(tmp, { idempotent: true }).catch(() => {}); throw new Error('The download failed. Check your internet and try again.'); }
    await m.moveAsync({ from: tmp, to: path });
    // the smaller model from the first version is not needed any more
    try { await m.deleteAsync(path.replace(/[^/]+$/, '') + 'quran-tiny-q8.bin', { idempotent: true }); } catch (e) { /* ignore */ }
    set({ phase: 'ready', pct: 1 });
  } catch (e: any) { set({ phase: 'error', err: String((e && e.message) || e) }); }
}

export async function deleteModel(): Promise<void> {
  try { await release(); const { m, path } = await FS(); await m.deleteAsync(path, { idempotent: true }); await m.deleteAsync(path.replace(/[^/]+$/, '') + 'quran-tiny-q8.bin', { idempotent: true }); } catch (e) { /* ignore */ }
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


// The speech model was trained on one verse at a time, so a long recitation is cut at the pauses between verses and each part is heard on its own.
export function splitAtPauses(x: Float32Array, rate = 16000): [number, number][] {
  const win = Math.round(rate * 0.02), nf = Math.floor(x.length / win);
  if (nf < 50 || x.length < rate * 6) return [[0, x.length]];
  const rms = new Float32Array(nf);
  for (let f = 0; f < nf; f++) { let a = 0; for (let i = f * win; i < (f + 1) * win; i++) a += x[i] * x[i]; rms[f] = Math.sqrt(a / win); }
  const sorted = Array.from(rms).sort((a, b) => a - b);
  const loud = sorted[Math.floor(sorted.length * 0.9)] || 0;
  const thr = Math.max(0.004, loud * 0.08);
  const minGap = Math.round(0.55 / 0.02); // a pause of at least 0.55 s
  const cuts: number[] = [];
  let run = 0;
  for (let f = 0; f < nf; f++) {
    if (rms[f] < thr) run++; else { if (run >= minGap) cuts.push(Math.round((f - run / 2) * win)); run = 0; }
  }
  const bounds = [0, ...cuts, x.length];
  const parts: [number, number][] = [];
  for (let k = 0; k + 1 < bounds.length; k++) parts.push([bounds[k], bounds[k + 1]]);
  // a part shorter than 1.2 s is joined to its neighbour, so a short word is never heard alone
  const out: [number, number][] = [];
  for (const q of parts) {
    const last = out[out.length - 1];
    if (last && (q[1] - q[0] < rate * 1.2 || last[1] - last[0] < rate * 1.2)) last[1] = q[1]; else out.push([q[0], q[1]]);
  }
  // a part with almost no voice in it is only silence or noise: the model must not hear it (it would invent words)
  const voiced = out.filter(([a, b]) => { let c = 0; for (let f = Math.floor(a / win); f < Math.min(nf, Math.floor(b / win)); f++) if (rms[f] >= thr) c++; return c * 0.02 >= 0.5; });
  return voiced.length ? voiced : [[0, x.length]];
}

export type Heard = { text: string; seconds: number; pcm: Float32Array; peak: number; bad?: boolean };

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
  let peak = 0; for (let i = 0; i < samples.length; i++) { const v = Math.abs(samples[i]); if (v > peak) peak = v; }
  if (seconds < 0.8) return { text: '', seconds, pcm: samples, peak };
  if (peak < 0.008) return { text: '', seconds, pcm: samples, peak, bad: true };
  // Quiet phones record very softly: bring the voice up to a normal level so the model can hear it.
  if (peak < 0.5) { const g = Math.min(40, 0.8 / peak); for (let i = 0; i < samples.length; i++) samples[i] = Math.max(-1, Math.min(1, samples[i] * g)); }
  set({ phase: 'loading' });
  try {
    const c = await load();
    // whisper.rn reads the ArrayBuffer as signed 16-bit PCM (its own comment says float32, but the native code decodes int16).
    const pcm16 = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) pcm16[i] = Math.max(-32767, Math.min(32767, Math.round(samples[i] * 32767)));
    const parts = splitAtPauses(samples);
    const texts: string[] = [];
    for (const [a, b] of parts) {
      const seg = pcm16.slice(a, b);
      // one second of silence around each part, like the clips the model learned from
      const pad = new Int16Array(seg.length + 16000); pad.set(seg, 8000);
      const { promise } = c.transcribeData(pad.buffer, { language: 'ar', maxLen: 0, temperature: 0, temperatureInc: 0.2, maxContext: 0, beamSize: 5 });
      const r = await promise;
      const t = String((r && r.result) || '').trim();
      if (t) texts.push(t);
    }
    set({ phase: 'ready' });
    const text = texts.join(' ').trim();
    // A speech model that could not hear anything sometimes fills the page with one repeated sound: do not treat that as a recitation.
    const letters = text.replace(/[^\u0621-\u064A]/g, '');
    const loop = /(.{1,3})\1{7,}/.test(letters) || (letters.length > 40 && new Set(letters).size < 8);
    return { text: loop ? '' : text, seconds, pcm: samples, peak, bad: loop };
  } catch (e: any) { set({ phase: 'ready' }); throw e; }
}

// The last recording as a small WAV file, so the person can hear what the phone really recorded.
export async function lastRecordingUri(pcm: Float32Array): Promise<string> {
  const { m } = await FS();
  const n = pcm.length, buf = new Uint8Array(44 + n * 2), dv = new DataView(buf.buffer);
  const w = (o: number, t: string) => { for (let i = 0; i < t.length; i++) buf[o + i] = t.charCodeAt(i); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, 16000, true); dv.setUint32(28, 32000, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, pcm[i])) * 32767, true);
  let bin = ''; for (let i = 0; i < buf.length; i += 8192) bin += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + 8192)) as any);
  const uri = (m.cacheDirectory || '') + 'hafazan-last.wav';
  await m.writeAsStringAsync(uri, (globalThis as any).btoa(bin), { encoding: m.EncodingType.Base64 });
  return uri;
}

export async function cancelRecording() { try { if (rec) await rec.stop(); } catch (e) { /* ignore */ } chunks = []; level = 0; }
