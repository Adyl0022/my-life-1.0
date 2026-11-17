import { mlDownloaded, mlDownload } from '../../modules/ml-translate';
import { XLANGS, xlText } from './xlate';

// "Translate to Chinese: ..." typed to the Assistant. The words are translated on the phone with ML Kit (a real translator, better than the small chat AI).
const ALIAS: Record<string, string> = {
  en: 'english|inggeris|bahasa inggeris|bi', ms: 'malay|melayu|bahasa melayu|bahasa malaysia|bm', zh: 'chinese|mandarin|cina|china|bahasa cina|bahasa mandarin',
  ta: 'tamil|bahasa tamil', hi: 'hindi|bahasa hindi', ar: 'arabic|arab|bahasa arab', ja: 'japanese|jepun|bahasa jepun', ko: 'korean|korea|bahasa korea',
  id: 'indonesian|indonesia|bahasa indonesia', th: 'thai|siam|bahasa thai', vi: 'vietnamese|vietnam|bahasa vietnam', tl: 'tagalog|filipino',
};
const NAMES: [string, string][] = [];
const add = (code: string, n: string) => { if (n) NAMES.push([n.toLowerCase(), code]); };
Object.keys(ALIAS).forEach((c) => ALIAS[c].split('|').forEach((n) => add(c, n)));
XLANGS.forEach((x) => { add(x.code, x.name); });
add('?india', 'india'); add('?india', 'bahasa india');
NAMES.sort((a, b) => b[0].length - a[0].length);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const LG = '(' + NAMES.map((n) => esc(n[0])).join('|') + ')';
const code = (n: string) => { const f = NAMES.find((x) => x[0] === n.toLowerCase()); return f ? f[1] : ''; };
const strip = (s: string) => s.replace(/^[\s"'“”‘’:\-]+|[\s"'“”‘’:\-?.!]+$/g, '').trim();

export type TrCmd = { to: string; text: string };
export function parseTranslate(q: string): TrCmd | null {
  const s = (q || '').trim();
  if (!s || s.length > 400) return null;
  let m: RegExpMatchArray | null;
  // translate to Chinese: text   |   terjemah ke bahasa cina: text
  m = s.match(new RegExp('^(?:please |tolong )?(?:translate|terjemah(?:kan)?|tukar)\\s+(?:this |ini )?(?:to|into|ke|kepada|dalam)\\s+(?:bahasa )?' + LG + '\\s*[:,\\-]?\\s*(.+)$', 'i'));
  if (m) { const t = strip(m[2]); if (t) return { to: code(m[1]), text: t }; }
  // translate text to Chinese   |   terjemahkan text ke bahasa cina
  m = s.match(new RegExp('^(?:please |tolong )?(?:translate|terjemah(?:kan)?)\\s+(.+?)\\s+(?:to|into|ke|kepada|dalam)\\s+(?:bahasa )?' + LG + '\\s*[?.!]*$', 'i'));
  if (m) { const t = strip(m[1]); if (t) return { to: code(m[2]), text: t }; }
  // how do I say text in Chinese   |   macam mana nak cakap text dalam bahasa cina
  m = s.match(new RegExp('^(?:how (?:do|to) (?:i |you )?say|macam mana (?:nak )?(?:cakap|sebut|kata)|bagaimana (?:nak )?(?:cakap|sebut))\\s+(.+?)\\s+(?:in|dalam|ke)\\s+(?:bahasa )?' + LG + '\\s*[?.!]*$', 'i'));
  if (m) { const t = strip(m[1]); if (t) return { to: code(m[2]), text: t }; }
  // text dalam bahasa cina apa?   |   text in Chinese?
  m = s.match(new RegExp('^(.+?)\\s+(?:dalam|in)\\s+(?:bahasa\\s+' + LG + '|' + LG + '\\s+apa)\\s*[?.!]*$', 'i'));
  if (m) { const t = strip(m[1]); const n = m[2] || m[3]; if (t && n) return { to: code(n), text: t }; }
  return null;
}

// Translates on the phone. Missing language packs are downloaded first (about 30 MB each, once).
export async function runTranslate(text: string, from: string, to: string): Promise<{ ok: boolean; text: string; why?: string }> {
  if (from === to) return { ok: true, text };
  try {
    const have = await mlDownloaded();
    for (const c of [from, to]) {
      if (c === 'en' || have.indexOf(c) >= 0) continue;
      const ok = await mlDownload(c);
      if (!ok) return { ok: false, text: '', why: 'download' };
    }
    const out = await xlText(text, from, to);
    if (!out || out === text) return { ok: false, text: '', why: 'translate' };
    return { ok: true, text: out };
  } catch (e) { return { ok: false, text: '', why: 'translate' }; }
}
