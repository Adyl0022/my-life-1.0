// Voice for the Assistant: the phone's own speech recognition (listening) and speech (speaking).
// Both are optional. On the web preview and in an older build the native parts are missing, and voiceOk is false.
import { Platform } from 'react-native';
import { SEARCH_INDEX } from '../data/searchIndex';
import { ROUTES } from './routes';
import { getItem, setItem } from './store';

let SR: any = null; let SP: any = null;
try { if (Platform.OS === 'android') SR = require('expo-speech-recognition'); } catch (e) { SR = null; }
try { if (Platform.OS !== 'web') SP = require('expo-speech'); } catch (e) { SP = null; }
const preview = Platform.OS === 'web' && typeof window !== 'undefined' && !!(window as any).__mlVoicePreview;
const MOD = () => (SR && SR.ExpoSpeechRecognitionModule) || null;
export const voiceOk = !!MOD() || preview;

export type Lang = 'en' | 'ms';
import { XLANGS } from './xlate';

// The languages that can be spoken. English and Bahasa Malaysia are built in. Every other language is heard by the phone's speech service,
// translated to English on the phone, answered by the Assistant, translated back and read aloud (needs the language pack of that language).
export type VLang = { key: string; tag: string; name: string; native: string; x: boolean };
const TAGS: Record<string, string> = { id: 'id-ID', zh: 'zh-CN', ar: 'ar-SA', th: 'th-TH', vi: 'vi-VN', tl: 'fil-PH', hi: 'hi-IN', ta: 'ta-IN', bn: 'bn-BD', ur: 'ur-PK', ja: 'ja-JP', ko: 'ko-KR', tr: 'tr-TR', fa: 'fa-IR', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-PT', ru: 'ru-RU', it: 'it-IT', nl: 'nl-NL', sw: 'sw-KE' };
export const VLANGS: VLang[] = [
  { key: 'en', tag: 'en-US', name: 'English', native: 'English', x: false },
  { key: 'ms', tag: 'ms-MY', name: 'Bahasa Malaysia', native: 'Bahasa Malaysia', x: false },
  { key: 'mix', tag: 'ms-MY', name: 'Malay + English mixed', native: 'BM + EN', x: false },
  ...XLANGS.filter((x) => TAGS[x.code]).map((x) => ({ key: x.code, tag: TAGS[x.code], name: x.name, native: x.native, x: true })),
];
export const vlang = (key: string): VLang => VLANGS.find((l) => l.key === key) || VLANGS[0];

// What the person set on the voice screen (kept on this phone only).
export type VPref = { v: Record<string, string>; rate: number; pitch: number; lang: string; pause: number; talk: boolean };
const DEF: VPref = { v: {}, rate: 1, pitch: 1, lang: '', pause: 2600, talk: true };
let PREF: VPref = { ...DEF };
getItem('ml_voice_pref', null).then((o: any) => { if (o && typeof o === 'object') PREF = { ...DEF, ...o, v: { ...(o.v || {}) } }; });
export const voicePref = (): VPref => PREF;
export function setVoicePref(p: Partial<VPref>) { PREF = { ...PREF, ...p }; setItem('ml_voice_pref', PREF); }
export type VoiceOpt = { id: string; label: string; gender: 'female' | 'male' | '' };
// The voices installed on the phone for a speech tag. Android does not say if a voice is a woman or a man, so that is only shown when the voice name says it.
export async function voicesFor(tag: string): Promise<VoiceOpt[]> {
  if (!SP || !SP.getAvailableVoicesAsync) return [];
  try {
    const all: any[] = await SP.getAvailableVoicesAsync();
    const pre = tag.split('-')[0].toLowerCase();
    const list = (all || []).filter((v) => String(v.language || '').toLowerCase().replace('_', '-').split('-')[0] === pre || (pre === 'fil' && String(v.language || '').toLowerCase().startsWith('tl'))).sort((a, b) => String(a.identifier).localeCompare(String(b.identifier)));
    return list.slice(0, 16).map((v, i) => {
      const n = (String(v.identifier || '') + ' ' + String(v.name || '')).toLowerCase();
      const gender: 'female' | 'male' | '' = /female|perempuan|wanita|#f\b|_f_/.test(n) ? 'female' : /(^|[^a-z])male|lelaki|#m\b|_m_/.test(n) ? 'male' : '';
      return { id: String(v.identifier), label: 'Voice ' + (i + 1) + ' · ' + String(v.language || '').replace('_', '-'), gender };
    });
  } catch (e) { return []; }
}
// Asks the phone to download the offline speech pack for a language (Android 13 and above). Not needed when the phone is online.
export async function speechPack(tag: string): Promise<string> {
  const m = MOD(); if (!m || !m.androidTriggerOfflineModelDownload) return 'none';
  try { const r = await m.androidTriggerOfflineModelDownload({ locale: tag }); return String((r && r.status) || 'ok'); } catch (e) { return 'none'; }
}
const MIX_WORDS = ['ringgit', 'lunch', 'dinner', 'breakfast', 'petrol', 'grab', 'parking', 'toll', 'shopping', 'bills', 'savings', 'Maybank', 'CIMB', 'Touch n Go', 'GrabPay', 'ShopeePay', 'cash', 'e-wallet', 'transfer', 'task', 'reminder', 'water', 'sleep', 'steps', 'my spending', 'My Accounts', 'subscription', 'Netflix', 'Spotify'];

export async function micAllowed(): Promise<boolean> {
  const m = MOD(); if (!m) return preview;
  try { const r = await m.requestPermissionsAsync(); return !!(r && r.granted); } catch (e) { return false; }
}

export type Handlers = { onPartial: (t: string) => void; onFinal: (t: string) => void; onEnd: (gotText: boolean) => void; onError: (code: string) => void; onLevel?: (v: number) => void };
// Starts one round of listening. It ends by itself when the person stops talking. onLevel gives the loudness of the voice (0 to 1) for the live wave.
export function listen(tag: string, h: Handlers, mix = false): () => void {
  const m = MOD(); if (!m) { setTimeout(() => h.onEnd(false), 50); return () => {}; }
  const subs: any[] = []; let got = false, done = false;
  const finish = () => { if (done) return; done = true; subs.forEach((s) => { try { s.remove(); } catch (e) { /* already removed */ } }); h.onEnd(got); };
  subs.push(m.addListener('result', (e: any) => {
    const t = ((e && e.results && e.results[0] && e.results[0].transcript) || '').trim();
    if (!t) return;
    if (e.isFinal) { got = true; h.onFinal(t); } else h.onPartial(t);
  }));
  subs.push(m.addListener('error', (e: any) => { const c = String((e && e.error) || 'unknown'); if (c !== 'no-speech' && c !== 'aborted') h.onError(c); }));
  subs.push(m.addListener('end', finish));
  if (h.onLevel) subs.push(m.addListener('volumechange', (e: any) => { const v = Number(e && e.value); h.onLevel!(Math.max(0, Math.min(1, (v + 2) / 12))); }));
  const sil = PREF.pause || 2600;
  // A longer pause is allowed before it stops, so a sentence with breaths in it is not cut. A Malay and English mix is heard as Malay with the English words added.
  try { m.start({ lang: tag, interimResults: true, continuous: false, maxAlternatives: 1, ...(mix ? { contextualStrings: MIX_WORDS } : {}), ...(h.onLevel ? { volumeChangeEventOptions: { enabled: true, intervalMillis: 90 } } : {}), androidIntentOptions: { EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: sil, EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: sil, EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 1500 } }); } catch (e) { h.onError('start-failed'); finish(); }
  return () => { try { m.abort(); } catch (e) { /* not running */ } };
}

// What the Assistant says out loud: no marks, no emoji, short.
export function speechText(t: string): string {
  let s = String(t || '')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[*_`#>]+/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}•●▸→]/gu, ' ')
    .replace(/\bRM\s*([\d,.]+)/gi, '$1 ringgit')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length > 420) { const cut = s.slice(0, 420); const i = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? ')); s = i > 120 ? cut.slice(0, i + 1) : cut; }
  return s;
}
export function speak(text: string, tag: string, done: () => void): void {
  const t = speechText(text);
  if (!SP || !t || !PREF.talk) { setTimeout(done, 50); return; }
  let fired = false; const once = () => { if (!fired) { fired = true; done(); } };
  try { SP.speak(t, { language: tag, rate: PREF.rate, pitch: PREF.pitch, ...(PREF.v[tag] ? { voice: PREF.v[tag] } : {}), onDone: once, onStopped: once, onError: once }); } catch (e) { once(); }
}
// A short sample in the voice, speed and tone that are set now (an id can be given to try a voice before choosing it).
export function sample(tag: string, id?: string) {
  if (!SP) return; try { SP.stop(); SP.speak(tag.startsWith('ms') ? 'Hai, saya Sage. Beginilah bunyi suara saya.' : 'Hi, I am Sage. This is how I sound.', { language: tag, rate: PREF.rate, pitch: PREF.pitch, ...((id || PREF.v[tag]) ? { voice: id || PREF.v[tag] } : {}) }); } catch (e) { /* ignore */ }
}
export function stopSpeaking() { try { if (SP) SP.stop(); } catch (e) { /* nothing is playing */ } }

// ---- Spoken commands the Assistant handles itself (everything else is passed on as a normal question) ----
const norm = (s: string) => s.toLowerCase().replace(/[.,!?]/g, ' ').replace(/\s+/g, ' ').trim();
const YES = /^(ya|yes|yup|yep|betul|ok|okey|okay|boleh|setuju|simpan|save|confirm|sahkan|ya simpan|yes save|betul simpan)$/;
const NO = /^(tak|tidak|no|nope|batal|cancel|jangan|tak nak|tidak mahu|tak payah|jangan simpan)$/;
const STOP = /^(stop|berhenti|tutup|selesai|dah cukup|close|exit|keluar|bye|selamat tinggal|terima kasih|thank you|thanks)$/;
const ALIAS: [RegExp, string, string][] = [
  [/\b(subscriptions?|langganan)\b/, '/subscriptions', 'Subscriptions'],
  [/\b(accounts?|akaun)\b/, '/accounts', 'My Accounts'],
  [/\b(documents?|dokumen)\b/, '/documents', 'Documents'],
  [/\b(medicine|medicines|ubat)\b/, '/medicine', 'Medicine'],
  [/\b(savings?|simpanan)\b/, '/savings', 'Savings Goals'],
  [/\b(collection|koleksi)\b/, '/collection', 'Personal Collection'],
  [/\b(spending|belanja|perbelanjaan|my finance|finance|kewangan|duit|wang)\b/, '/finance', 'My Finance'],
  [/\b(tasks?|tugasan|planner|kalendar|calendar)\b/, '/planner', 'Daily Planner'],
  [/\b(settings?|tetapan)\b/, '/settings', 'Settings'],
  [/\b(stats?|statistik)\b/, '/stats', 'Stats'],
  [/\b(insights?)\b/, '/insights', 'Insights'],
  [/\b(prayer|solat|sembahyang|waktu solat)\b/, '/prayer', 'Prayer Times'],
  [/\b(habit|health|kesihatan|air|tidur|sleep|steps|langkah)\b/, '/habit', 'Habit & Health'],
  [/\b(notes?|nota)\b/, '/notes', 'Notes'],
  [/\b(vehicle|kenderaan|motor|motosikal)\b/, '/vehicle', 'My Vehicle'],
];
export type Cmd = { kind: 'yes' } | { kind: 'no' } | { kind: 'stop' } | { kind: 'open'; route: string; name: string } | { kind: 'openFail'; target: string } | null;
export function voiceCommand(raw: string, pending: boolean): Cmd {
  const t = norm(raw);
  if (!t) return null;
  if (pending) { if (YES.test(t)) return { kind: 'yes' }; if (NO.test(t)) return { kind: 'no' }; }
  if (STOP.test(t)) return { kind: 'stop' };
  const m = t.match(/^(?:tolong |please )?(?:buka|open|pergi ke|pergi|go to|bawa saya ke|tunjuk|show me|show)\s+(?:halaman |page |skrin |screen )?(.+)$/);
  if (!m) return null;
  const target = m[1].replace(/^(my|saya|ke)\s+/, '').trim();
  if (!target) return null;
  // The Assistant itself is already open, and a question like "open tasks I have" is better answered as a question.
  if (target.split(' ').length > 4) return null;
  for (const [re, route, name] of ALIAS) if (re.test(target)) return { kind: 'open', route, name };
  let best: { s: number; h: string; t: string } | null = null;
  for (const it of SEARCH_INDEX) {
    if (!ROUTES[it.h]) continue;
    const title = it.t.toLowerCase(); const keys = ' ' + it.k.toLowerCase() + ' ';
    let s = 0;
    if (title === target) s += 6; else if (title.includes(target) || (target.length > 3 && target.includes(title))) s += 4;
    target.split(' ').forEach((w) => { if (w.length > 2 && (title.includes(w) || keys.includes(' ' + w + ' '))) s += 1; });
    if (s > 0 && it.h.toLowerCase().startsWith(target.replace(/ /g, ''))) s += 2;
    if (s > 0 && (!best || s > best.s)) best = { s, h: it.h, t: it.t };
  }
  return best && (best.s >= 2 || target.split(' ').length === 1) ? { kind: 'open', route: ROUTES[best.h], name: best.t } : { kind: 'openFail', target };
}
