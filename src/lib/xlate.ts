import { useEffect, useState } from 'react';
import { useStored } from './store';
import { mlAvailable, mlDownloaded, mlDownload, mlRemove, mlTranslate } from '../../modules/ml-translate';

// The Assistant already speaks English and Bahasa Malaysia itself. Every other language goes through on-phone translation:
// the question is translated to English, the Assistant answers from the person's own data, and the answer is translated back.
export type XLang = { code: string; name: string; native: string };
export const XLANGS: XLang[] = [
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'tl', name: 'Tagalog', native: 'Tagalog' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'fa', name: 'Persian', native: 'فارسی' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
];
export const XFLAG: Record<string, string> = { id: 'ID', zh: 'CN', ar: 'SA', th: 'TH', vi: 'VN', tl: 'PH', hi: 'IN', ta: 'IN', bn: 'BD', ur: 'PK', ja: 'JP', ko: 'KR', tr: 'TR', fa: 'IR', es: 'ES', fr: 'FR', de: 'DE', pt: 'PT', ru: 'RU', it: 'IT', nl: 'NL', sw: 'KE' };
export const flagOf = (code: string) => { const c = XFLAG[code]; return c ? String.fromCodePoint(...Array.from(c).map((ch) => 127397 + ch.charCodeAt(0))) : ''; };
export const XKEY = 'ml_assist_lang';
export const xlOk = mlAvailable;

// The language the person chose for the Assistant: '' means the built-in English or Bahasa Malaysia.
export function useAssistLang(): [string, (c: string) => void] {
  const [c, setC] = useStored<string>(XKEY, '');
  return [c || '', setC];
}

// Which language packs are on this phone, shared by every screen so a download made in one place shows up in the others.
let HAVE: string[] = []; let loaded = false;
const subs = new Set<() => void>();
async function refresh() { HAVE = await mlDownloaded(); loaded = true; subs.forEach((f) => f()); }
export function useLangPacks() {
  const [, n] = useState(0); const [busy, setBusy] = useState('');
  useEffect(() => { const f = () => n((x) => x + 1); subs.add(f); if (xlOk) refresh(); return () => { subs.delete(f); }; }, []);
  const get = async (code: string) => { setBusy(code); const ok = await mlDownload(code); await refresh(); setBusy(''); return ok; };
  const del = async (code: string) => { setBusy(code); await mlRemove(code); await refresh(); setBusy(''); };
  return { have: HAVE, busy, get, del, loaded, ready: (code: string) => HAVE.indexOf(code) >= 0 };
}

// Guess the language from the writing system when someone types in a script the built-in Assistant does not know.
// Only scripts that point to one language (or one main language) are used. Latin text is never guessed.
export function scriptLang(q: string): string {
  if (/[\u3040-\u30FF]/.test(q)) return 'ja';
  if (/[\uAC00-\uD7AF]/.test(q)) return 'ko';
  if (/[\u4E00-\u9FFF]/.test(q)) return 'zh';
  if (/[\u0E00-\u0E7F]/.test(q)) return 'th';
  if (/[\u0600-\u06FF]/.test(q)) return 'ar';
  if (/[\u0900-\u097F]/.test(q)) return 'hi';
  if (/[\u0980-\u09FF]/.test(q)) return 'bn';
  if (/[\u0B80-\u0BFF]/.test(q)) return 'ta';
  if (/[\u0400-\u04FF]/.test(q)) return 'ru';
  return '';
}
export const xlLang = (code: string) => XLANGS.find((x) => x.code === code);

// Translate text line by line so bullets and line breaks survive. Numbers, money and times are left as the phone returns them.
export async function xlText(text: string, from: string, to: string): Promise<string> {
  if (!text || !text.trim()) return text;
  const lines = text.split('\n');
  const out: string[] = [];
  for (const ln of lines) {
    const m = ln.match(/^(\s*[•\-*]?\s*)(.*)$/);
    const lead = m ? m[1] : ''; const body = m ? m[2] : ln;
    if (!body.trim() || !/[A-Za-zÀ-ɏЀ-ӿ؀-ۿ฀-๿぀-ヿ一-鿿가-힯ऀ-ॿঀ-৿஀-௿]/.test(body)) { out.push(ln); continue; }
    try { out.push(lead + (await mlTranslate(body, from, to))); } catch (e) { out.push(ln); }
  }
  return out.join('\n');
}

// Translate the visible words of one Assistant message. Figures, colours and links stay as they are.
export async function xlMsg(m: any, to: string): Promise<any> {
  const r = Object.assign({}, m);
  r.text = await xlText(m.text, 'en', to);
  if (m.bigLbl) r.bigLbl = await xlText(m.bigLbl, 'en', to);
  if (m.label) r.label = await xlText(m.label, 'en', to);
  return r;
}
