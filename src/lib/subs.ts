// Subscriptions (under My Finance): what you pay every week, month or year, when the next charge is, and a quiet detector
// that spots payments in your own spending that keep coming back. Everything here runs on the phone.
import type { Sp } from './moneyLeft';
import { useStored } from './store';
export type Cycle = 'week' | 'month' | 'year';
export type Sub = { id: number; name: string; cat: string; price: string; cycle: Cycle; next: string; remind: number; trial: boolean; note: string; photo?: string };
export type SubStore = { subs: Sub[]; next: number; no: string[] };
export const SUB_EMPTY: SubStore = { subs: [], next: 1, no: [] };

export const SUB_CATS: { k: string; n: string; icon: string; c: string }[] = [
  { k: 'video', n: 'Video', icon: 'play', c: '#b794ff' }, { k: 'music', n: 'Music', icon: 'music', c: '#ff8fab' }, { k: 'ai', n: 'AI', icon: 'spark', c: '#ffb378' },
  { k: 'cloud', n: 'Cloud', icon: 'cloud', c: '#7c9cff' }, { k: 'games', n: 'Games', icon: 'game', c: '#5ee7b5' }, { k: 'other', n: 'Other', icon: 'repeat', c: '#8ea8ff' },
];
export const catOf = (k: string) => SUB_CATS.find((c) => c.k === k) || SUB_CATS[SUB_CATS.length - 1];
export const CYCLES: { k: Cycle; n: string; per: string }[] = [{ k: 'week', n: 'Week', per: 'every week' }, { k: 'month', n: 'Month', per: 'every month' }, { k: 'year', n: 'Year', per: 'every year' }];
export const REM: { d: number; n: string }[] = [{ d: 0, n: 'None' }, { d: 1, n: '1 day' }, { d: 3, n: '3 days' }, { d: 7, n: '1 week' }];

// Names only, so the app can recognise a service. No prices are stored here because they change.
export const SERVICES: { n: string; cat: string; re: RegExp }[] = [
  { n: 'Netflix', cat: 'video', re: /netflix/i }, { n: 'YouTube Premium', cat: 'video', re: /youtube|google\s*\*?\s*youtube/i }, { n: 'Disney+', cat: 'video', re: /disney\s*\+?|hotstar/i },
  { n: 'Prime Video', cat: 'video', re: /prime\s*video|amazon\s*prime/i }, { n: 'Apple TV+', cat: 'video', re: /apple\s*tv/i }, { n: 'Viu', cat: 'video', re: /\bviu\b/i }, { n: 'iQIYI', cat: 'video', re: /iqiyi/i },
  { n: 'Astro', cat: 'video', re: /\bastro\b|njoi/i }, { n: 'Spotify', cat: 'music', re: /spotify/i }, { n: 'Apple Music', cat: 'music', re: /apple\s*music/i }, { n: 'Joox', cat: 'music', re: /joox/i },
  { n: 'Claude', cat: 'ai', re: /claude|anthropic/i }, { n: 'ChatGPT', cat: 'ai', re: /chatgpt|openai/i }, { n: 'Gemini', cat: 'ai', re: /gemini\s*(advanced|pro)?|google\s*ai/i }, { n: 'GitHub Copilot', cat: 'ai', re: /copilot|github/i },
  { n: 'iCloud', cat: 'cloud', re: /icloud|apple\.com\/bill/i }, { n: 'Google One', cat: 'cloud', re: /google\s*one|google\s*storage/i }, { n: 'Dropbox', cat: 'cloud', re: /dropbox/i }, { n: 'Microsoft 365', cat: 'cloud', re: /microsoft\s*365|office\s*365|onedrive/i },
  { n: 'Canva', cat: 'cloud', re: /canva/i }, { n: 'Adobe', cat: 'cloud', re: /adobe/i }, { n: 'Notion', cat: 'cloud', re: /notion/i },
  { n: 'Xbox Game Pass', cat: 'games', re: /game\s*pass|xbox/i }, { n: 'PlayStation Plus', cat: 'games', re: /playstation|ps\s*plus/i }, { n: 'Nintendo Online', cat: 'games', re: /nintendo/i },
  { n: 'Duolingo', cat: 'other', re: /duolingo/i }, { n: 'LinkedIn Premium', cat: 'other', re: /linkedin/i },
];
// Phone and internet plans are not subscriptions here: they are monthly commitments, which Money Left already takes off for you.
const NOT_SUB = /maxis|hotlink|celcom|digi\b|unifi|\btm\b|u\s?mobile|umobile|yes\s?4g|redone|tune\s?talk|xox|telco|postpaid|prepaid|reload|top\s?-?up|broadband|internet|wifi/i;
export const matchService = (text: string) => SERVICES.find((s) => s.re.test(text || '')) || null;
const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
export const dayN = (s: string) => Math.round(parse(s).getTime() / 86400000);
export const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && ymd(parse(s)) === s;
export const num = (s: string) => { const n = parseFloat(String(s || '').replace(',', '.')); return isFinite(n) ? n : 0; };
export const rm = (n: number) => 'RM ' + n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** One step forward by the cycle. A bill on the 31st lands on the last day of a shorter month. */
export function addCycle(s: string, c: Cycle, n = 1): string {
  const d = parse(s);
  if (c === 'week') { d.setDate(d.getDate() + 7 * n); return ymd(d); }
  const day = d.getDate(); const months = c === 'month' ? n : 12 * n;
  const t = new Date(d.getFullYear(), d.getMonth() + months, 1, 12); const dim = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  t.setDate(Math.min(day, dim)); return ymd(t);
}
/** The next charge on or after today. */
export function nextCharge(sub: Sub, today: string): string {
  if (!validDate(sub.next)) return '';
  let d = sub.next; let i = 0;
  while (d < today && i++ < 600) d = addCycle(d, sub.cycle);
  return d;
}
export const monthly = (s: Sub) => { const p = num(s.price); return s.cycle === 'year' ? p / 12 : s.cycle === 'week' ? (p * 52) / 12 : p; };
export const monthlyTotal = (list: Sub[]) => list.reduce((a, s) => a + monthly(s), 0);

export type Due = { date: string; days: number; hot: boolean; warn: boolean; col: string; pill: string; txt: string };
/** Yellow when the charge is close (3 days or less). Red only for the last day to cancel a free trial. */
export function dueOf(sub: Sub, today: string): Due {
  const date = nextCharge(sub, today); const days = date ? dayN(date) - dayN(today) : 999;
  const hot = sub.trial && days <= 1; const warn = !hot && days <= 3;
  const col = hot ? '#ff6b81' : warn ? '#ffd24a' : '#5ee7b5';
  const pill = sub.trial ? (days <= 0 ? 'TRIAL ENDS TODAY' : days === 1 ? 'TRIAL ENDS TOMORROW' : 'TRIAL · ' + days + ' DAYS') : days <= 0 ? 'TODAY' : days === 1 ? 'TOMORROW' : days + ' DAYS';
  const txt = (sub.trial ? 'Free trial ends ' : 'Charges ') + (days <= 0 ? 'today' : days === 1 ? 'tomorrow' : 'in ' + days + ' days');
  return { date, days, hot, warn, col, pill, txt };
}

// ---- Money Left: charges still to come this month ----
let SUBS_G: SubStore = SUB_EMPTY;
export const setSubsG = (s: SubStore | null | undefined) => { SUBS_G = s && Array.isArray(s.subs) ? s : SUB_EMPTY; };
/** What your subscriptions will still charge between today and the end of this month. Only the current month is counted. */
export function subsStillToCome(ym: string, now: Date): number {
  if (ymd(now).slice(0, 7) !== ym) return 0; const today = ymd(now); let sum = 0;
  SUBS_G.subs.forEach((s) => { const p = num(s.price); if (!(p > 0) || !validDate(s.next)) return; let d = nextCharge(s, today), i = 0; while (d && d.slice(0, 7) === ym && i++ < 6) { sum += p; d = addCycle(d, s.cycle); } });
  return sum;
}
export function useSubsG(): SubStore { const [s] = useStored<SubStore>('ml_subs', SUB_EMPTY); setSubsG(s); return s; }

// ---- Finding subscriptions in your own spending ----
const clean = (s: string) => String(s || '').toLowerCase().replace(/[0-9]/g, ' ').replace(/[^a-z ]/g, ' ').replace(/\b(sub|subscription|monthly|payment|bill|plan|premium|membership|renewal|the|for|my|com|www|bayar|bil)\b/g, ' ').replace(/\s+/g, ' ').trim();
export const keyOf = (name: string) => { const s = matchService(name); return s ? s.n.toLowerCase() : clean(name).split(' ')[0] || ''; };
export type Found = { key: string; name: string; amt: number; months: number; day: number; cat: string };
export function detect(spends: Sp[], subs: Sub[], no: string[], today: string): Found[] {
  const have = new Set(subs.map((s) => keyOf(s.name))); const skip = new Set(no || []);
  const by = new Map<string, Sp[]>();
  (spends || []).forEach((p) => { if (!p || p.cat === 'Savings' || !(p.amt > 0) || !validDate(p.date)) return; if (NOT_SUB.test(p.name || '')) return; const k = keyOf(p.name); if (k.length < 3) return; (by.get(k) || by.set(k, []).get(k)!).push(p); });
  const out: Found[] = [];
  by.forEach((list, key) => {
    if (have.has(key) || skip.has(key)) return;
    list.sort((a, b) => (a.date < b.date ? 1 : -1)); const last = list[0]; const svc = matchService(last.name);
    if (dayN(today) - dayN(last.date) > 50) return; // not paid lately, so probably stopped
    const near = list.filter((p) => Math.abs(p.amt - last.amt) <= Math.max(1, last.amt * 0.12));
    const months = new Set(near.map((p) => p.date.slice(0, 7))).size;
    if (months < (svc ? 2 : 3)) return;
    const days = near.map((p) => +p.date.slice(8, 10)).sort((a, b) => a - b); const med = days[Math.floor(days.length / 2)];
    if (days.some((d) => Math.abs(d - med) > 5 && Math.abs(d - med) < 25)) return; // the date wanders too much to be a bill
    out.push({ key, name: svc ? svc.n : last.name.trim().replace(/\s+/g, ' ').slice(0, 40), amt: last.amt, months, day: med, cat: svc ? svc.cat : 'other' });
  });
  return out.sort((a, b) => b.months - a.months).slice(0, 5);
}
/** A new subscription made from what was found: the next charge is the next time that day comes round. */
export function fromFound(f: Found, today: string, id: number): Sub {
  const t = parse(today); let d = new Date(t.getFullYear(), t.getMonth(), Math.min(f.day, new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()), 12);
  if (ymd(d) < today) d = new Date(t.getFullYear(), t.getMonth() + 1, Math.min(f.day, new Date(t.getFullYear(), t.getMonth() + 2, 0).getDate()), 12);
  return { id, name: f.name, cat: f.cat, price: String(f.amt), cycle: 'month', next: ymd(d), remind: 3, trial: false, note: '' };
}

// ---- Reading a bill or receipt (the words come from the phone's own text reader) ----
const MON: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12, mac: 3, mei: 5, ogos: 8, okt: 10, dis: 12 };
export type Billed = { name?: string; cat?: string; price?: string; cycle?: Cycle; next?: string; trial?: boolean; usd?: boolean };
export function readBill(text: string, today: string): Billed | null {
  const t = String(text || ''); if (t.trim().length < 6) return null;
  const out: Billed = {}; const svc = matchService(t); if (svc) { out.name = svc.n; out.cat = svc.cat; }
  const am = [...t.matchAll(/(RM|MYR|USD|US\$|\$)\s*(\d{1,4}(?:[.,]\d{2})?)/gi)];
  if (am.length) {
    const tot = am.find((m) => /total|amount|jumlah|charged|dicaj|pay/i.test(t.slice(Math.max(0, (m.index || 0) - 40), m.index))) || am[0];
    out.price = String(num(tot[2])); if (/usd|us\$|\$/i.test(tot[1]) && !/rm|myr/i.test(tot[1])) out.usd = true;
  }
  if (/annual|yearly|per year|\/\s*year|\/yr|tahunan|setahun/i.test(t)) out.cycle = 'year'; else if (/weekly|per week|\/\s*week|mingguan/i.test(t)) out.cycle = 'week'; else if (/monthly|per month|\/\s*month|bulanan|sebulan|every month/i.test(t)) out.cycle = 'month';
  if (/free trial|trial period|percubaan percuma/i.test(t)) out.trial = true;
  const ds: string[] = [];
  [...t.matchAll(/(\d{4})-(\d{2})-(\d{2})/g)].forEach((m) => ds.push(m[0]));
  [...t.matchAll(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\b/g)].forEach((m) => ds.push(m[3] + '-' + pad(+m[2]) + '-' + pad(+m[1])));
  [...t.matchAll(/\b(\d{1,2})\s+([A-Za-z]{3,5})[a-z]*\.?,?\s+(\d{4})\b/g)].forEach((m) => { const mo = MON[m[2].toLowerCase().slice(0, 4)] || MON[m[2].toLowerCase().slice(0, 3)]; if (mo) ds.push(m[3] + '-' + pad(mo) + '-' + pad(+m[1])); });
  [...t.matchAll(/\b([A-Za-z]{3,5})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/g)].forEach((m) => { const mo = MON[m[1].toLowerCase().slice(0, 4)] || MON[m[1].toLowerCase().slice(0, 3)]; if (mo) ds.push(m[3] + '-' + pad(mo) + '-' + pad(+m[2])); });
  const ok = ds.filter(validDate).sort(); const fut = ok.find((d) => d >= today);
  if (fut) out.next = fut; else if (ok.length) out.next = addCycle(ok[ok.length - 1], (out.cycle || 'month') as Cycle);
  return out.name || out.price || out.next ? out : null;
}
export const aiPrompt = (text: string) => 'From this bill or receipt text, reply with ONLY one line of JSON and nothing else: {"name":"service name","price":number,"cycle":"week|month|year","next":"YYYY-MM-DD or empty","trial":true|false}. Use 0 for price if unknown.\n\n' + String(text).slice(0, 1500);
export function readAi(reply: string): Billed | null {
  const m = /\{[\s\S]*?\}/.exec(String(reply || '')); if (!m) return null;
  try {
    const j = JSON.parse(m[0]); const out: Billed = {};
    if (typeof j.name === 'string' && j.name.trim()) { const nm = j.name.trim().slice(0, 40); const s = matchService(nm); out.name = s ? s.n : nm; if (s) out.cat = s.cat; }
    if (typeof j.price === 'number' && j.price > 0 && j.price < 100000) out.price = String(j.price);
    if (j.cycle === 'week' || j.cycle === 'month' || j.cycle === 'year') out.cycle = j.cycle;
    if (typeof j.next === 'string' && validDate(j.next)) out.next = j.next;
    if (j.trial === true) out.trial = true;
    return out.name || out.price || out.next ? out : null;
  } catch (e) { return null; }
}
