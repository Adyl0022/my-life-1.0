import { useCallback, useEffect, useState } from 'react';
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
export const XKEY = 'ml_assist_lang';
export const xlOk = mlAvailable;

// The language the person chose for the Assistant: '' means the built-in English or Bahasa Malaysia.
export function useAssistLang(): [string, (c: string) => void] {
  const [c, setC] = useStored<string>(XKEY, '');
  return [c || '', setC];
}

// Which language packs are on this phone, and a way to download or remove one.
export function useLangPacks() {
  const [have, setHave] = useState<string[]>([]); const [busy, setBusy] = useState('');
  const load = useCallback(() => { mlDownloaded().then(setHave); }, []);
  useEffect(() => { if (xlOk) load(); }, [load]);
  const get = async (code: string) => { setBusy(code); const ok = await mlDownload(code); await load(); setBusy(''); return ok; };
  const del = async (code: string) => { setBusy(code); await mlRemove(code); await load(); setBusy(''); };
  return { have, busy, get, del, ready: (code: string) => have.indexOf(code) >= 0 };
}

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
