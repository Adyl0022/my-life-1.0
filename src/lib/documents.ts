// My Record > Documents: the kinds of paper, how much time is left, and reading a photo of a passport, MyKad, card or letter.
export type DocTab = 'identity' | 'cards' | 'warranty' | 'other';
export type Remind = 'off' | '1w' | '1m' | '3m' | '6m';
export type Doc = { id: number; type: string; title: string; number?: string; expiry?: string; remind: Remind; photo?: string; photos?: string[]; note?: string };
export type DocStore = { docs: Doc[]; next: number };
export const EMPTY_DOCS: DocStore = { docs: [], next: 1 };

export type DocType = { key: string; label: string; e: string; tab: DocTab; c: string; lab: string };
export const DOC_TYPES: DocType[] = [
  { key: 'passport', label: 'Passport', e: 'passport', tab: 'identity', c: '#8ea8ff', lab: 'PASSPORT' },
  { key: 'mykad', label: 'MyKad', e: 'mykad', tab: 'identity', c: '#b794ff', lab: 'IDENTITY' },
  { key: 'cidb', label: 'CIDB', e: 'cidb', tab: 'identity', c: '#ffd24a', lab: 'CIDB' },
  { key: 'permit', label: 'Permit', e: 'permit', tab: 'identity', c: '#7df0c6', lab: 'PERMIT' },
  { key: 'idother', label: 'Other ID', e: 'idother', tab: 'identity', c: '#8ea8ff', lab: 'ID' },
  { key: 'bank', label: 'Bank card', e: 'bank', tab: 'cards', c: '#ffb3c6', lab: 'BANK CARD' },
  { key: 'member', label: 'Member', e: 'member', tab: 'cards', c: '#ff8fab', lab: 'MEMBER CARD' },
  { key: 'warranty', label: 'Warranty', e: 'warranty', tab: 'warranty', c: '#7df0c6', lab: 'WARRANTY' },
  { key: 'insurance', label: 'Insurance', e: 'insurance', tab: 'other', c: '#ffd24a', lab: 'INSURANCE' },
  { key: 'agreement', label: 'Agreement', e: 'agreement', tab: 'other', c: '#7df0c6', lab: 'AGREEMENT' },
  { key: 'certificate', label: 'Certificate', e: 'certificate', tab: 'other', c: '#ffb3c6', lab: 'CERTIFICATE' },
  { key: 'property', label: 'Property', e: 'property', tab: 'other', c: '#b794ff', lab: 'PROPERTY' },
  { key: 'other', label: 'Other', e: 'other', tab: 'other', c: '#8ea8ff', lab: 'PAPER' },
];
export const typeOf = (k: string): DocType => DOC_TYPES.find((t) => t.key === k) || DOC_TYPES[DOC_TYPES.length - 1];
export const TABS: { k: DocTab; n: string; title: string; text: string }[] = [
  { k: 'identity', n: 'Identity', title: 'Your important papers', text: 'Passport, permits and licences, all in one place' },
  { k: 'cards', n: 'Cards', title: 'Cards and memberships', text: 'Bank and member cards, so none runs out' },
  { k: 'warranty', n: 'Warranty', title: 'Warranty', text: 'Know how long things last' },
  { k: 'other', n: 'Other', title: 'Other papers', text: 'Certificates, insurance and agreements' },
];
export const REMINDS: { k: Remind; n: string; days: number }[] = [
  { k: 'off', n: 'None', days: 0 }, { k: '1w', n: '1 week', days: 7 }, { k: '1m', n: '1 month', days: 30 }, { k: '3m', n: '3 months', days: 90 }, { k: '6m', n: '6 months', days: 180 },
];

const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const dayN = (s: string) => { const p = s.split('-'); return Math.round(new Date(+p[0], +p[1] - 1, +p[2], 12).getTime() / 86400000); };
export const validDate = (s?: string) => { if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; const [y, m, d] = s.split('-').map(Number); const t = new Date(y, m - 1, d); return t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === d && y >= 1950 && y <= 2100; };
export const daysLeft = (s: string, now = new Date()) => dayN(s) - dayN(ymd(now));

export type Status = { n: number | null; txt: string; col: string; val: string; ring: number | null; hot: boolean };
export function statusOf(d: Doc, now = new Date()): Status {
  if (!d.expiry || !validDate(d.expiry)) return { n: null, txt: 'No expiry', col: 'rgba(255,255,255,.7)', val: '∞', ring: null, hot: false };
  const n = daysLeft(d.expiry, now);
  if (n < 0) return { n, txt: 'Expired ' + -n + (n === -1 ? ' day ago' : ' days ago'), col: '#ff9aa9', val: 'Late', ring: 1, hot: true };
  const left = n === 0 ? 'Ends today' : n < 60 ? n + (n === 1 ? ' day left' : ' days left') : n < 365 ? Math.round(n / 30.4) + ' months left' : (() => { const y = Math.floor(n / 365), m = Math.round((n - y * 365) / 30.4); return y + (y === 1 ? ' year' : ' years') + (m >= 1 && m < 12 ? ' ' + m + (m === 1 ? ' month' : ' months') : '') + ' left'; })();
  const col = n <= 14 ? '#ff9aa9' : n <= 180 ? '#ffd593' : '#5ee7b5';
  const val = n < 60 ? n + 'd' : n < 365 ? Math.round(n / 30.4) + 'm' : Math.floor(n / 365) + 'y';
  return { n, txt: left, col, val, ring: Math.min(n, 365) / 365, hot: n <= 7 };
}
/** Soonest to end first; papers without an end date go last. */
export const bySoon = (a: Doc, b: Doc) => { const x = a.expiry && validDate(a.expiry) ? dayN(a.expiry) : 9e9, y = b.expiry && validDate(b.expiry) ? dayN(b.expiry) : 9e9; return x - y || a.title.localeCompare(b.title); };

// ---- Reading a passport (two lines of 44 characters at the bottom of the photo page) ----
const MAP = (c: string) => (c === '<' ? 0 : c >= '0' && c <= '9' ? +c : c >= 'A' && c <= 'Z' ? c.charCodeAt(0) - 55 : -1);
const check = (s: string) => { let t = 0; for (let i = 0; i < s.length; i++) { const v = MAP(s[i]); if (v < 0) return -1; t += v * [7, 3, 1][i % 3]; } return t % 10; };
const toDigits = (s: string) => s.replace(/O/g, '0').replace(/Q/g, '0').replace(/D/g, '0').replace(/[IL]/g, '1').replace(/Z/g, '2').replace(/S/g, '5').replace(/B/g, '8').replace(/G/g, '6');
const yymmdd = (s: string, future: boolean) => {
  if (!/^\d{6}$/.test(s)) return '';
  const yy = +s.slice(0, 2), cur = new Date().getFullYear() % 100; const y = future ? 2000 + yy : yy > cur ? 1900 + yy : 2000 + yy;
  const out = y + '-' + s.slice(2, 4) + '-' + s.slice(4, 6); return validDate(out) ? out : '';
};
export type Read = { name?: string; number?: string; expiry?: string; dob?: string; sure: boolean; kind: string };
export function readPassport(text: string): Read | null {
  const lines = text.toUpperCase().replace(/«/g, '<').split(/\r?\n/).map((l) => l.replace(/\s+/g, '')).filter((l) => l.length >= 30 && (l.match(/</g) || []).length >= 3);
  for (let i = 0; i + 1 < lines.length; i++) {
    const a = lines[i], b = lines[i + 1].padEnd(44, '<').slice(0, 44);
    if (!/^P/.test(a)) continue;
    const no = b.slice(0, 9), dob = toDigits(b.slice(13, 19)), exp = toDigits(b.slice(21, 27));
    const ok = check(no) === +toDigits(b[9]) && check(dob) === +toDigits(b[19]) && check(exp) === +toDigits(b[27]);
    const parts = a.slice(5).split('<<'); const nm = [parts[0], (parts[1] || '').replace(/</g, ' ')].map((x) => x.replace(/</g, ' ').trim()).filter(Boolean);
    return { name: nm.reverse().join(' ').replace(/\s+/g, ' '), number: no.replace(/</g, ''), dob: yymmdd(dob, false), expiry: yymmdd(exp, true), sure: ok, kind: 'passport' };
  }
  return null;
}
// ---- MyKad: the 12 digit number gives the birth date ----
export function readMyKad(text: string): Read | null {
  const t = text.toUpperCase(); const m = t.match(/\b(\d{6})[-\s]?(\d{2})[-\s]?(\d{4})\b/); if (!m) return null;
  const dob = yymmdd(m[1], false); const lines = t.split(/\r?\n/).map((l) => l.trim());
  const at = lines.findIndex((l) => l.includes(m[1])); let name = '';
  for (let i = at + 1; i < lines.length && i < at + 4; i++) { const l = lines[i]; if (/^[A-Z@'/. ]{5,}$/.test(l) && l.split(/\s+/).length >= 2 && !/KAD|PENGENALAN|MALAYSIA|WARGANEGARA|ISLAM|LELAKI|PEREMPUAN/.test(l)) { name = l; break; } }
  return { number: m[1] + '-' + m[2] + '-' + m[3], dob, name: name || undefined, sure: false, kind: 'mykad' };
}
// ---- Any other paper: look for an end date ----
const MON: Record<string, number> = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, MEI: 5, JUN: 6, JUL: 7, AUG: 8, OGOS: 8, SEP: 9, SEPT: 9, OCT: 10, OKT: 10, NOV: 11, DEC: 12, DIS: 12 };
const mk = (y: number, m: number, d: number) => { if (y < 100) y += 2000; const s = y + '-' + pad(m) + '-' + pad(d); return validDate(s) ? s : ''; };
export function readPaper(text: string): Read | null {
  const T = text.toUpperCase(); const found: { s: string; near: boolean }[] = [];
  const add = (s: string, idx: number) => { if (s) found.push({ s, near: /EXP|VALID|TAMAT|SEHINGGA|UNTIL|END|LUPUT|GOOD THRU|THRU/.test(T.slice(Math.max(0, idx - 28), idx)) }); };
  let m: RegExpExecArray | null;
  const r1 = /\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})\b/g; while ((m = r1.exec(T))) add(mk(+m[3], +m[2], +m[1]), m.index);
  const r2 = /\b(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})\b/g; while ((m = r2.exec(T))) add(mk(+m[1], +m[2], +m[3]), m.index);
  const r3 = /\b(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|MEI|JUN|JUL|AUG|OGOS|SEPT?|OCT|OKT|NOV|DEC|DIS)[A-Z]*\.?,?\s*(\d{4})\b/g; while ((m = r3.exec(T))) add(mk(+m[3], MON[m[2]], +m[1]), m.index);
  const r4 = /\b(0[1-9]|1[0-2])\s*\/\s*(\d{2})\b/g; while ((m = r4.exec(T))) { const y = 2000 + +m[2], mo = +m[1]; add(ymd(new Date(y, mo, 0)), m.index + 40); }
  const good = found.filter((f) => f.s); if (!good.length) return null;
  const near = good.filter((f) => f.near); const pick = (near.length ? near : good).map((f) => f.s).sort().pop() as string;
  return { expiry: pick, sure: false, kind: 'paper' };
}
const luhn = (d: string) => { let t = 0; for (let i = 0; i < d.length; i++) { let n = +d[d.length - 1 - i]; if (i % 2) { n *= 2; if (n > 9) n -= 9; } t += n; } return t % 10 === 0; };
/** A bank card number found in the text. Only the last 4 digits are kept. */
const cardTail = (text: string) => { const m = text.replace(/[Oo]/g, '0').match(/\b(?:\d[ -]?){15,18}\d\b/g) || []; for (const x of m) { const d = x.replace(/\D/g, ''); if (d.length >= 15 && d.length <= 19 && luhn(d)) return d.slice(-4); } return ''; };
/** Guess what kind of paper it is from its words. Best effort: returns null when it cannot tell. */
export function guessType(text: string): { type: string; sure: boolean } | null {
  const T = text.toUpperCase();
  if (readPassport(text)) return { type: 'passport', sure: true };
  if (/\bP[<«]\s*[A-Z]{3}/.test(T.replace(/\s+/g, ''))) return { type: 'passport', sure: false };
  if (/KAD PENGENALAN|MYKAD|WARGANEGARA/.test(T) || /\b\d{6}[-\s]\d{2}[-\s]\d{4}\b/.test(T)) return { type: 'mykad', sure: /KAD PENGENALAN|MYKAD/.test(T) };
  if (/\bCIDB\b|PEMBANGUNAN INDUSTRI BINAAN|GREEN CARD|KAD HIJAU/.test(T)) return { type: 'cidb', sure: true };
  if (/WARRANTY|WARANTI|JAMINAN|PROOF OF PURCHASE/.test(T)) return { type: 'warranty', sure: true };
  if (/INSURANCE|INSURANS|TAKAFUL|POLICY NO|POLISI/.test(T)) return { type: 'insurance', sure: false };
  if (/PERMIT|ENTRY VISA|PAS LAWATAN|PEKERJA ASING|WORK PASS/.test(T)) return { type: 'permit', sure: false };
  if (/CERTIFICATE|SIJIL|DIPLOMA/.test(T)) return { type: 'certificate', sure: false };
  if (/AGREEMENT|PERJANJIAN|TENANCY|SEWA/.test(T)) return { type: 'agreement', sure: false };
  if (cardTail(text) || /\b(VISA|MASTERCARD|MAESTRO|AMEX|DEBIT|CREDIT|MYDEBIT)\b/.test(T)) return { type: 'bank', sure: !!cardTail(text) };
  if (/MEMBER|AHLI|LOYALTY|REWARDS|POINTS|MATAWANG|WATSONS|AEON|MYDIN|GUARDIAN|BIG\b|TESCO|LOTUS/.test(T)) return { type: 'member', sure: false };
  return null;
}
export function readText(type: string, text: string): Read | null {
  if (type === 'passport') return readPassport(text) || readPaper(text);
  if (type === 'mykad') return readMyKad(text);
  if (type === 'bank') { const tail = cardTail(text); const r = readPaper(text); if (!tail) return r; return { ...(r || { sure: false, kind: 'paper' }), number: '•••• ' + tail }; }
  return readPaper(text);
}
/** Reads the words in a photo on the phone itself. Nothing is sent anywhere. Returns null when it cannot (web, or the reader is missing). */
export async function scanPhoto(uri: string): Promise<string | null> {
  try {
    const M: any = await import('@react-native-ml-kit/text-recognition');
    const r = await (M.default || M).recognize(uri);
    return r && r.text ? String(r.text) : '';
  } catch (e) { return null; }
}
