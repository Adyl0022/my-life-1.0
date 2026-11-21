// Voice for the Assistant: the phone's own speech recognition (listening) and speech (speaking).
// Both are optional. On the web preview and in an older build the native parts are missing, and voiceOk is false.
import { Platform } from 'react-native';
import { SEARCH_INDEX } from '../data/searchIndex';
import { ROUTES } from './routes';

let SR: any = null; let SP: any = null;
try { if (Platform.OS === 'android') SR = require('expo-speech-recognition'); } catch (e) { SR = null; }
try { if (Platform.OS !== 'web') SP = require('expo-speech'); } catch (e) { SP = null; }
const preview = Platform.OS === 'web' && typeof window !== 'undefined' && !!(window as any).__mlVoicePreview;
const MOD = () => (SR && SR.ExpoSpeechRecognitionModule) || null;
export const voiceOk = !!MOD() || preview;

export type Lang = 'en' | 'ms';
const tag = (l: Lang) => (l === 'ms' ? 'ms-MY' : 'en-US');

export async function micAllowed(): Promise<boolean> {
  const m = MOD(); if (!m) return preview;
  try { const r = await m.requestPermissionsAsync(); return !!(r && r.granted); } catch (e) { return false; }
}

export type Handlers = { onPartial: (t: string) => void; onFinal: (t: string) => void; onEnd: (gotText: boolean) => void; onError: (code: string) => void };
// Starts one round of listening. It ends by itself when the person stops talking.
export function listen(lang: Lang, h: Handlers): () => void {
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
  try { m.start({ lang: tag(lang), interimResults: true, continuous: false, maxAlternatives: 1 }); } catch (e) { h.onError('start-failed'); finish(); }
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
export function speak(text: string, lang: Lang, done: () => void): void {
  const t = speechText(text);
  if (!SP || !t) { setTimeout(done, 50); return; }
  let fired = false; const once = () => { if (!fired) { fired = true; done(); } };
  try { SP.speak(t, { language: tag(lang), rate: 1, onDone: once, onStopped: once, onError: once }); } catch (e) { once(); }
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
