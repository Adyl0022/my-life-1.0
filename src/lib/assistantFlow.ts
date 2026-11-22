// Guided spending in My Life Assistant: when someone says they want to add their spending without giving all the details,
// the Assistant asks for what is missing, one thing at a time (category, date, remark, account, amount), then shows a summary to confirm.
// Anything the person already said ("makan semalam guna Maybank") is not asked again. Nothing is saved until they confirm.
import { getItem } from './store';
import { cs, curCode } from './region';
import { keepWarn } from './assistantKeep';

export type Flow = { kind: 'spend' | 'inc' | 'mtc' | 'odo'; step: 'cat' | 'date' | 'note' | 'acc' | 'amt' | 'odo'; d: { odo?: number; cat?: string; date?: string; ydy?: boolean; note?: string; acc?: number; accName?: string; amt?: number; noAcc?: boolean; noteDone?: boolean }; tries: number };

const DEFAULT_CATS = ['Food', 'Petrol', 'Bills', 'Shopping', 'Health', 'Other'];
// Words people really use, by category. A custom category is matched by its own name first.
const SYN: Record<string, string[]> = {
  Food: ['makan', 'food', 'minum', 'kopi', 'coffee', 'nasi', 'mee', 'teh', 'roti', 'snack', 'lunch', 'dinner', 'breakfast', 'sarapan', 'tengah hari', 'makanan', 'minuman', 'mamak', 'restoran', 'restaurant', 'kedai makan', 'grabfood', 'foodpanda', 'mcd', 'kfc', 'barang dapur', 'groceries', 'grocery', 'pasar', 'ayam', 'burger', 'pizza', 'cafe', 'kafe'],
  Petrol: ['petrol', 'minyak', 'fuel', 'parking', 'parkir', 'tol', 'toll', 'grab', 'bas', 'bus', 'lrt', 'mrt', 'transport', 'tambang', 'pengangkutan', 'teksi', 'taxi', 'touch n go', 'tng', 'bahan api'],
  Bills: ['bil', 'bill', 'bills', 'api', 'air', 'elektrik', 'electric', 'electricity', 'internet', 'wifi', 'telco', 'phone bill', 'prepaid', 'postpaid', 'sewa', 'rent', 'insurans', 'insurance', 'ansuran', 'installment', 'instalment', 'astro', 'netflix', 'langganan', 'subscription', 'cukai', 'tax'],
  Shopping: ['shopping', 'beli belah', 'belibelah', 'barang', 'baju', 'kasut', 'shopee', 'lazada', 'tiktok shop', 'hadiah', 'gift', 'pakaian', 'beg', 'bag', 'gadget', 'online'],
  Health: ['health', 'kesihatan', 'klinik', 'clinic', 'hospital', 'ubat', 'medicine', 'farmasi', 'pharmacy', 'doktor', 'doctor', 'gigi', 'dental', 'vitamin', 'gym', 'rawatan'],
  Other: ['other', 'lain', 'lain lain', 'lainlain', 'entah', 'tak tahu', 'tidak tahu', 'miscellaneous', 'misc'],
};

// One name per line, so a long list is easy to read.
export const bl = (xs: string[]) => '\n' + xs.map((x) => '• ' + x).join('\n');
export const norm = (s: string) => ' ' + String(s || '').toLowerCase().replace(/[^a-z0-9À-ɏ/.:,\- ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
export const hasW = (t: string, w: string) => t.indexOf(' ' + w + ' ') >= 0 || t.indexOf(' ' + w) >= 0 && w.length >= 4 && t.indexOf(' ' + w) >= 0;

export const QUESTION = /(\?|\b(berapa|how much|how many|what|apa|bila|when|siapa|who|adakah|macam mana|how|kenapa|why|mana)\b)/;
export const START_VERB = /\b(isi|isikan|masuk|masukkan|tambah|tambahkan|rekod|rekodkan|catat|catatkan|simpan|log|add|record|enter|key in|keyin|input|fill in|fill|save|note down)\b/;
const START_NOUN = /\b(belanja|perbelanjaan|belanjawan|spend|spending|spendings|expense|expenses|kos)\b/;
const PAST_SPEND = /\b(saya|sy|aku|i|ive|i ve)\s+((baru|dah|sudah|just|tadi|ada)\s+)*(belanja|spent|spend|beli|bought|bayar|paid|makan)\b/;

// Does this sentence start the guided spending (no amount typed with digits)?
export function startsSpend(q: string): boolean {
  const t = String(q || '').toLowerCase();
  if (!t.trim() || QUESTION.test(t)) return false;
  if (/\d/.test(t)) return false;
  if (START_VERB.test(t) && START_NOUN.test(t)) return true;
  if (PAST_SPEND.test(t) && t.split(/\s+/).length <= 8) return true;
  return false;
}

const MS_UNITS: Record<string, number> = { satu: 1, se: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, lapan: 8, sembilan: 9, kosong: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, sepuluh: 10, sebelas: 11 };
const EN_TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

// "dua belas", "lima puluh", "seratus dua puluh", "twelve", "twenty five", "one hundred". Returns null when the words are not a number.
export function wordsToNum(text: string): number | null {
  const toks = String(text || '').toLowerCase().replace(/[^a-z ]+/g, ' ').split(/\s+/).filter(Boolean).filter((x) => x !== 'dan' && x !== 'and' && x !== 'ringgit' && x !== 'rm' && x !== 'dollars' && x !== 'dollar' && x !== 'sen' && x !== 'cents' && x !== 'cent');
  if (!toks.length) return null;
  let total = 0, cur = 0, last = 0, seen = false;
  for (const t of toks) {
    if (t === 'seratus') { cur += 100; last = 0; seen = true; }
    else if (t === 'seribu') { total += 1000; last = 0; seen = true; }
    else if (t === 'belas') { cur += 10; last = 0; seen = true; }
    else if (t === 'puluh') { cur += last * 9; last = 0; seen = true; }
    else if (t === 'ratus' || t === 'hundred') { cur += (last ? last * 99 : cur ? cur * 99 : 100); last = 0; seen = true; }
    else if (t === 'ribu' || t === 'thousand') { total += (cur || 1) * 1000; cur = 0; last = 0; seen = true; }
    else if (EN_TENS[t] != null) { cur += EN_TENS[t]; last = 0; seen = true; }
    else if (MS_UNITS[t] != null && t !== 'se') { cur += MS_UNITS[t]; last = MS_UNITS[t]; seen = true; }
    else return null;
  }
  return seen ? total + cur : null;
}

// An amount from what was said: "12", "RM 12.50", "12 ringgit 50 sen", "dua belas ringgit", "lima puluh sen". Null when there is none.
export function parseAmount(text: string): number | null {
  const t = String(text || '').toLowerCase();
  // Rupiah and dong are written with a dot for thousands: 50.000 means fifty thousand.
  if ((curCode() === 'IDR' || curCode() === 'VND') && /^\D*\d{1,3}(?:\.\d{3})+\D*$/.test(t)) { const v = parseFloat((t.match(/\d{1,3}(?:\.\d{3})+/) || ['0'])[0].replace(/\./g, '')); return isFinite(v) && v > 0 ? v : null; }
  const rg = t.match(/(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:[.,]\d{1,2})?)\s*(?:ringgit|rm\b|dollars?|usd|sgd|rupiah|idr|rp\b|baht|thb|pesos?|php|pounds?|gbp|euros?|eur|yen|jpy|riyals?|dirhams?|aed|rupees?|inr|vnd|dong)?\s*(?:(?:dan|and)?\s*(\d{1,2})\s*(?:sen|cents?))?/);
  if (rg) {
    let a = parseFloat(rg[1].replace(/,(?=\d{3}\b)/g, '').replace(',', '.'));
    if (rg[2]) a += parseInt(rg[2], 10) / 100;
    return isFinite(a) ? a : null;
  }
  const parts = t.split(/ringgit|dollars?|rupiah|baht|pesos?|pounds?|euros?|riyals?|dirhams?|rupees?/);
  if (parts.length > 1) {
    const l = wordsToNum(parts[0]);
    const r = /sen|cents?/.test(parts[1]) ? wordsToNum(parts[1]) : null;
    if (l != null) return l + (r != null ? r / 100 : 0);
  }
  if (/\b(sen|cents?)\b/.test(t)) { const w = wordsToNum(t); if (w != null) return w / 100; }
  const w = wordsToNum(t);
  return w;
}

export const dstr = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'mei|may', 'jun', 'jul', 'ogos|aug', 'sep', 'okt|oct', 'nov', 'dis|dec'];

// A date from what was said: today, yesterday, "2 hari lepas", "15/11", "15 november". Never in the future. Null when there is none.
export function parseDate(text: string, now = new Date()): { date: string; ydy: boolean } | null {
  const t = norm(text);
  const mk = (back: number) => { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back); return { date: dstr(d), ydy: back === 1 }; };
  if (/ (hari ini|harini|hari nie|hari ni|ari ni|ari nie|today|tdy|2day|sekarang|now|tadi|td|petang tadi|pagi tadi|tengah hari tadi) /.test(t)) return mk(0);
  if (/ (semalam|semlm|smlm|yesterday|yday|malam tadi|last night) /.test(t)) return mk(1);
  if (/ (kelmarin|kemarin|sehari sebelum semalam|day before yesterday) /.test(t)) return mk(2);
  let m = t.match(/ (\d{1,2}) (?:hari|days?|hr) (?:lepas|lalu|yang lalu|ago|sebelum)/);
  if (m) { const n = parseInt(m[1], 10); if (n >= 0 && n <= 90) return mk(n); }
  m = t.match(/ (\d{4})-(\d{1,2})-(\d{1,2}) /);
  if (m) { const d = new Date(+m[1], +m[2] - 1, +m[3]); if (!isNaN(+d) && d <= now) return { date: dstr(d), ydy: false }; }
  m = t.match(/ (\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))? /);
  if (m) {
    const dd = +m[1], mo = +m[2]; let y = m[3] ? +m[3] : now.getFullYear(); if (y < 100) y += 2000;
    let d = new Date(y, mo - 1, dd);
    if (d > now && !m[3]) d = new Date(y - 1, mo - 1, dd);
    if (dd >= 1 && dd <= 31 && mo >= 1 && mo <= 12 && !isNaN(+d) && d <= now) return { date: dstr(d), ydy: false };
  }
  for (let i = 0; i < 12; i++) {
    const mm = t.match(new RegExp(' (\\d{1,2}) (?:' + MONTHS[i] + ')[a-z]* '));
    if (mm) { const dd = +mm[1]; let d = new Date(now.getFullYear(), i, dd); if (d > now) d = new Date(now.getFullYear() - 1, i, dd); if (dd >= 1 && dd <= 31 && !isNaN(+d)) return { date: dstr(d), ydy: false }; }
  }
  return null;
}

// Which category was meant. Own category names first, then the words people really use.
export function parseCat(text: string, cats: string[]): string | null {
  const t = norm(text);
  const own = cats.slice().sort((a, b) => b.length - a.length).find((c) => c && hasW(t, c.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').trim()));
  if (own) return own;
  for (const c of Object.keys(SYN)) {
    if (!cats.includes(c)) continue;
    if (SYN[c].some((w) => hasW(t, w))) return c;
  }
  return null;
}

export const SKIP = /^(tiada|takde|tak ada|tak de|xde|x de|tidak ada|tidak|tak|no|none|nope|nothing|skip|langkau|kosong|tak perlu|tak payah|tidak perlu|tiada apa|takda|nope thanks|no thanks|no remark|tiada remark|tak ada remark)$/;
export const CANCEL = /^(batal|cancel|tak jadi|tidak jadi|lupakan|forget it|never ?mind|abaikan|berhenti|stop)$/;

// What past spending says: if a word the person used (like "kopi") was saved before, suggest the category it went under most.
export function learnCat(text: string, spends: { name: string; cat: string }[], cats: string[]): { cat: string; word: string } | null {
  const t = norm(text); const cnt: Record<string, number> = {}; let word = '';
  for (const x of spends) {
    const nm = x.name.replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (nm.length < 3 || nm === 'spending' || nm === x.cat.toLowerCase() || !cats.includes(x.cat)) continue;
    if (t.indexOf(' ' + nm + ' ') >= 0) { cnt[x.cat] = (cnt[x.cat] || 0) + 1; if (nm.length > word.length) word = nm; }
  }
  const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
  return top ? { cat: top, word: cap1(word) } : null;
}
const cap1 = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

export function isFlowActive(host: any): boolean { return !!(host && host.state && host.state.flow); }

const need = (f: Flow): Flow['step'] | null => {
  const d = f.d;
  if (!d.cat) return 'cat';
  if (!d.date) return 'date';
  if (!d.noteDone) return 'note';
  if (!d.acc && !d.noAcc && (f as any).hasAcc) return 'acc';
  if (!d.amt) return 'amt';
  return null;
};

type Ctx = { spends: { name: string; cat: string }[]; cats: string[]; accs: { id: number; name: string }[]; L: (en: string, ms: string) => string };

async function load(host: any, lang: string): Promise<Ctx> {
  const L = (en: string, ms: string) => (lang === 'ms' ? ms : en);
  const f: any = await getItem('ml_finance', { cats: [], hideCats: [] });
  const base = DEFAULT_CATS.filter((c) => !((f && f.hideCats) || []).includes(c));
  const custom = ((f && f.cats) || []).map((c: any) => c[0]).filter(Boolean);
  const cats = [...base.filter((c) => c !== 'Other'), ...custom, 'Other'];
  const a: any = await getItem('ml_accounts', { accs: [] });
  const accs = ((a && a.accs) || []).filter((x: any) => x && x.name).map((x: any) => ({ id: x.id, name: String(x.name) }));
  const spends = ((f && f.spends) || []).filter((x: any) => x && x.name && x.cat).slice(-600).map((x: any) => ({ name: String(x.name).toLowerCase().trim(), cat: String(x.cat) }));
  return { spends, cats, accs, L };
}

// Short names people say for the same bank or wallet.
const BANKS: string[][] = [['maybank', 'mbb', 'maybank2u', 'm2u'], ['cimb', 'cimb clicks'], ['rhb'], ['public bank', 'pbe', 'pbb', 'public'], ['bank islam', 'bimb'], ['bsn'], ['bank rakyat', 'rakyat'], ['affin', 'affin bank'], ['ambank', 'am bank'], ['hong leong', 'hlb'], ['agrobank', 'agro'], ['uob'], ['ocbc'], ['hsbc'], ['standard chartered', 'scb'], ['touch n go', 'touch and go', 'tng', 'tng ewallet', 'tng e-wallet', 'touch n go ewallet'], ['grabpay', 'grab pay', 'grab'], ['shopeepay', 'shopee pay', 'spay'], ['boost'], ['mae', 'mae maybank'], ['gxbank', 'gx bank', 'gx'], ['boost bank'], ['bigpay', 'big pay'], ['setel'], ['tabung haji', 'th'], ['asb', 'asb loan', 'amanah saham bumiputera'], ['dbs', 'posb', 'dbs paylah', 'paylah'], ['paynow', 'pay now'], ['citibank', 'citi'], ['bca', 'bank central asia'], ['bni'], ['bri'], ['mandiri', 'bank mandiri'], ['cimb niaga', 'niaga'], ['gopay', 'go pay'], ['ovo'], ['dana'], ['linkaja', 'link aja'], ['paypal'], ['wise', 'transferwise'], ['revolut'], ['apple pay', 'applepay'], ['gcash', 'g cash'], ['maya', 'paymaya'], ['bdo'], ['bpi'], ['kasikorn', 'kbank'], ['scb easy', 'siam commercial'], ['bangkok bank', 'bbl'], ['promptpay', 'prompt pay'], ['chase'], ['wells fargo'], ['bank of america', 'bofa'], ['lloyds'], ['barclays'], ['monzo'], ['natwest']];
const sameBank = (a: string, b: string) => BANKS.some((g) => g.some((x) => a.indexOf(x) >= 0) && g.some((x) => b.indexOf(x) >= 0));

export function parseAcc(text: string, accs: { id: number; name: string }[]) {
  const t = ' ' + String(text || '').toLowerCase() + ' ';
  const hit = accs.slice().sort((a, b) => b.name.length - a.name.length).find((a) => t.indexOf(a.name.toLowerCase()) >= 0);
  if (hit) return hit;
  const words = (g: string[]) => g.filter((x) => t.indexOf(' ' + x + ' ') >= 0 || t.indexOf(' ' + x + ',') >= 0);
  const alias = accs.find((a) => BANKS.some((g) => words(g).length > 0 && g.some((x) => a.name.toLowerCase().indexOf(x) >= 0)));
  if (alias) return alias;
  if (/\b(cash|tunai|duit tunai|duit cash)\b/.test(t)) return accs.find((a) => /cash|tunai/i.test(a.name)) || null;
  return null;
}

// Pull out everything already said in one sentence.
function fill(f: Flow, text: string, c: Ctx, only?: string[]) {
  const can = (k: string) => !only || only.includes(k);
  if (can('cat') && !f.d.cat) { const x = parseCat(text, c.cats); if (x) f.d.cat = x; }
  if (can('date') && !f.d.date) { const x = parseDate(text); if (x) { f.d.date = x.date; f.d.ydy = x.ydy; } }
  if (can('acc') && !f.d.acc && c.accs.length) { const x = parseAcc(text, c.accs); if (x) { f.d.acc = x.id; f.d.accName = x.name; } }
}

function question(f: Flow, c: Ctx, first: boolean): string {
  const { L } = c; const s = need(f);
  const intro = first ? L('Sure, let us add your spending. ', 'Boleh, kita isikan perbelanjaan awak. ') : '';
  if (s === 'cat') return intro + L('Which category was it? ' + bl(c.cats), 'Kategori apa? ' + bl(c.cats));
  if (s === 'date') return intro + L('Which date was it? Say today, yesterday, or a date like 15/11.', 'Tarikh bila? Sebut hari ini, semalam, atau tarikh seperti 15/11.');
  if (s === 'note') return intro + L('Any remark? Say "no" to skip.', 'Ada catatan? Sebut "tiada" untuk langkau.');
  if (s === 'acc') return intro + L('Paid from which account? ' + bl(c.accs.map((a) => a.name)) + '\n' + 'Or say "none".', 'Bayar guna akaun mana? ' + bl(c.accs.map((a) => a.name)) + '\n' + 'Atau sebut "tiada".');
  return intro + L('How much was it in ' + cs() + '?', 'Berapa ' + cs() + ' jumlahnya?');
}

function dateWords(f: Flow, L: Ctx['L']) {
  const d = f.d; const today = dstr(new Date());
  if (d.date === today) return L('today', 'hari ini');
  if (d.ydy) return L('yesterday', 'semalam');
  return d.date || '';
}

const INC_TYPES: [string, string[]][] = [['Salary', ['gaji', 'salary', 'pay']], ['Overtime', ['overtime', 'ot', 'kerja lebih masa']], ['Bonus', ['bonus']], ['Claim', ['claim', 'tuntutan']], ['Income', ['income', 'pendapatan', 'lain', 'other', 'elaun', 'allowance', 'sampingan', 'side income']]];
const MTC_TYPES: [string, string[]][] = [['Oil change', ['tukar minyak', 'minyak hitam', 'oil', 'minyak enjin', 'engine oil']], ['Service', ['servis', 'service']], ['Tyres', ['tayar', 'tyre', 'tire', 'tyres']], ['Brakes', ['brek', 'brake', 'brakes', 'pad']], ['Chain', ['rantai', 'chain', 'sprocket']], ['Battery', ['bateri', 'battery']], ['Repair', ['baiki', 'repair', 'rosak', 'bengkel', 'workshop']], ['Other', ['lain', 'other']]];
const pickType = (text: string, list: [string, string[]][]) => { const t = norm(text); const x = list.find(([n, w]) => hasW(t, n.toLowerCase()) || w.some((k) => hasW(t, k))); return x ? x[0] : null; };
const INC_START = /\b(pendapatan|gaji|income|salary|overtime|bonus|claim|tuntutan|elaun|allowance)\b/;
const MTC_START = /\b(servis|service|penyelenggaraan|maintenance|baiki|repair|motosikal|motor|motorcycle|bengkel)\b/;
const ODO_START = /\b(odometer|odo|mileage|milage|meter|bacaan)\b/;
export function startsKind(q: string): Flow['kind'] | null {
  const t = String(q || '').toLowerCase();
  if (!t.trim() || QUESTION.test(t) || /\d/.test(t)) return null;
  if (startsSpend(q)) return 'spend';
  const verb = START_VERB.test(t);
  if (verb && ODO_START.test(t)) return 'odo';
  if (verb && MTC_START.test(t)) return 'mtc';
  if (verb && INC_START.test(t)) return 'inc';
  return null;
}

// Income, motorcycle spending and odometer: same idea, fewer steps.
async function otherTurn(host: any, q: string, lang: string, f: Flow | null): Promise<any | null> {
  const L = (en: string, ms: string) => (lang === 'ms' ? ms : en);
  const s = host.state; const mk = (text: string, x?: any) => host.mk(text, x);
  const out = (text: string, flow: Flow | null, x?: any) => ({ m: mk(text, x), patch: { flow }, act: null });
  let first = false;
  if (!f) {
    const kind = startsKind(q); if (!kind || kind === 'spend') return null;
    first = true; f = { kind, step: 'cat', d: {}, tries: 0 } as Flow;
    if (kind === 'inc') { const x = pickType(q, INC_TYPES); if (x) f.d.cat = x; }
    if (kind === 'mtc') { const x = pickType(q, MTC_TYPES); if (x) f.d.cat = x; }
  } else {
    const t = String(q || '').trim(); const n = norm(t).trim();
    if (CANCEL.test(n)) return out(L('Okay, I did not save it.', 'Baik, saya tidak simpan.'), null);
    if (QUESTION.test(t.toLowerCase()) && !/^\d/.test(n)) return null;
    const st = f.step;
    if (st === 'cat') {
      const x = pickType(t, f.kind === 'inc' ? INC_TYPES : MTC_TYPES);
      if (!x) return out(f.kind === 'inc' ? L('I did not catch the type. Say one of:' + bl(['Salary', 'Overtime', 'Bonus', 'Claim', 'Income']), 'Saya tak dapat tangkap jenis itu. Sebut salah satu:' + bl(['Gaji', 'Overtime', 'Bonus', 'Claim', 'Income'])) : L('I did not catch the work done. Say one of:' + bl(['Oil change', 'Service', 'Tyres', 'Brakes', 'Chain', 'Battery', 'Repair', 'Other']), 'Saya tak dapat tangkap kerja itu. Sebut salah satu:' + bl(['Tukar minyak', 'Servis', 'Tayar', 'Brek', 'Rantai', 'Bateri', 'Baiki', 'Lain-lain'])), f);
      f.d.cat = x;
    } else if (st === 'amt') {
      const a = parseAmount(t);
      if (a == null || !(a > 0) || a > 9999999) return out(L('That is not a valid amount. Please say a number, for example 12 or 12.50.', 'Itu bukan jumlah yang betul. Sila sebut nombor, contohnya 12 atau 12.50.'), f);
      f.d.amt = Math.round(a * 100) / 100;
    } else if (st === 'odo') {
      if (f.kind === 'mtc' && SKIP.test(n)) f.d.noteDone = true;
      else {
        const a = parseAmount(t);
        if (a == null || a < 1000 || a > 2000000) return out(L('That is not a valid odometer reading. Please say the number of kilometres, for example 24500.', 'Itu bukan bacaan odometer yang betul. Sila sebut jumlah kilometer, contohnya 24500.'), f);
        if (f.kind === 'odo' && a <= (s.odo || 0)) return out(L('That is not higher than your last reading (' + Math.round(s.odo) + ' km). Please check the number.', 'Itu tidak lebih tinggi daripada bacaan terakhir (' + Math.round(s.odo) + ' km). Sila semak nombor itu.'), f);
        f.d.odo = Math.round(a); f.d.noteDone = true;
      }
    }
  }
  const k = f.kind;
  const nx = k === 'odo' ? (f.d.odo ? null : 'odo') : !f.d.cat ? 'cat' : !f.d.amt ? 'amt' : k === 'mtc' && !f.d.noteDone ? 'odo' : null;
  if (nx) {
    f.step = nx;
    const intro = first ? (k === 'inc' ? L('Sure, let us add your income. ', 'Boleh, kita isikan pendapatan awak. ') : k === 'mtc' ? L('Sure, let us add your motorcycle spending. ', 'Boleh, kita isikan belanja motosikal awak. ') : L('Sure, let us add your odometer. ', 'Boleh, kita isikan odometer awak. ')) : '';
    const qs = nx === 'cat' ? (k === 'inc' ? L('What kind of income?' + bl(['Salary', 'Overtime', 'Bonus', 'Claim', 'Income']), 'Pendapatan jenis apa?' + bl(['Gaji', 'Overtime', 'Bonus', 'Claim', 'Income'])) : L('What was done?' + bl(['Oil change', 'Service', 'Tyres', 'Brakes', 'Chain', 'Battery', 'Repair', 'Other']), 'Apa yang dibuat?' + bl(['Tukar minyak', 'Servis', 'Tayar', 'Brek', 'Rantai', 'Bateri', 'Baiki', 'Lain-lain']))) : nx === 'amt' ? L('How much was it in ' + cs() + '?', 'Berapa ' + cs() + ' jumlahnya?') : k === 'mtc' ? L('What is the odometer now, in km? Say "no" to skip.', 'Berapa odometer sekarang, dalam km? Sebut "tiada" untuk langkau.') : L('What is the odometer now, in km?' + (s.odo ? ' Your last reading was ' + Math.round(s.odo) + ' km.' : ''), 'Berapa odometer sekarang, dalam km?' + (s.odo ? ' Bacaan terakhir awak ' + Math.round(s.odo) + ' km.' : ''));
    return out(intro + qs, f);
  }
  const d = f.d; const id = (s.pid || 0) + 1;
  if (k === 'odo') return { m: mk(L('Got it. Save this odometer reading?', 'Faham. Simpan bacaan odometer ini?'), { pid: id, big: String(d.odo), bigLbl: 'km', color: '#ff8fab' }), patch: { flow: null, pending: { id, type: 'odo', val: d.odo }, pid: id }, act: null };
  if (k === 'inc') return { m: mk(L('Got it. Save this income to this month?\n• ' + d.cat, 'Faham. Simpan pendapatan ini untuk bulan ini?\n• ' + d.cat), { pid: id, big: cs() + String(d.amt), bigLbl: d.cat, color: '#34d399' }), patch: { flow: null, pending: { id, type: 'inc', amt: d.amt, name: d.cat }, pid: id }, act: null };
  return { m: mk(L('Got it. Save this motorcycle record?\n• ' + d.cat + (d.odo ? '\n• Odometer: ' + d.odo + ' km' : '') + '\n• Date: today', 'Faham. Simpan rekod motosikal ini?\n• ' + d.cat + (d.odo ? '\n• Odometer: ' + d.odo + ' km' : '') + '\n• Tarikh: hari ini'), { pid: id, big: cs() + String(d.amt), bigLbl: d.cat, color: '#ff8fab' }), patch: { flow: null, pending: { id, type: 'mtc', amt: d.amt, name: d.cat, odo: d.odo || null }, pid: id }, act: null };
}

// One turn. Returns the Assistant's reply, or null when this sentence is not part of the guided spending.
export async function flowTurn(host: any, q: string, lang: string): Promise<any | null> {
  const s = host.state; let f: Flow | null = s.flow || null;
  if (f && ['spend', 'inc', 'mtc', 'odo'].indexOf(f.kind) < 0) return null;
  if ((f && f.kind !== 'spend') || (!f && startsKind(q) && startsKind(q) !== 'spend')) return otherTurn(host, q, lang, f);
  if (!f && !startsSpend(q)) return null;
  const c = await load(host, lang);
  const { L } = c;
  const mk = (text: string, x?: any) => host.mk(text, x);
  const out = (text: string, flow: Flow | null, x?: any) => ({ m: mk(text, x), patch: { flow }, act: null });
  const hasAcc = c.accs.length > 0;
  let first = false;
  if (!f) {
    first = true;
    f = { kind: 'spend', step: 'cat', d: {}, tries: 0 } as Flow; (f as any).hasAcc = hasAcc;
    fill(f, q, c);
    const am = /\b(rm|ringgit)\b/i.test(q) ? parseAmount(q) : null; if (am && am > 0) f.d.amt = am;
  } else {
    (f as any).hasAcc = hasAcc;
    const t = String(q || '').trim(); const n = norm(t).trim();
    if (CANCEL.test(n)) return out(L('Okay, I did not save it.', 'Baik, saya tidak simpan.'), null);
    // Someone asking something else halfway: let go of the guided spending and answer normally.
    if (QUESTION.test(t.toLowerCase()) && !/^\d/.test(n) && f.step !== 'note') return null;
    const step = need(f);
    if (step === 'cat') {
      const sg = (f.d as any).sugg as string | undefined;
      if (sg) {
        // Answering "Is it X?": yes keeps it, no or another category changes it.
        if (/^(ya|yes|yep|yup|betul|boleh|ok|okay|setuju|sah|haah|ha|yelah|ye|sure|correct|right)\b/.test(n)) { f.d.cat = sg; (f.d as any).sugg = undefined; }
        else if (/^(tidak|tak|bukan|no|nope|x|salah|tak betul|tidak betul|not)\b/.test(n) && !parseCat(t, c.cats)) { (f.d as any).sugg = undefined; (f.d as any).noSugg = true; return out(L('Okay. Which category then? ' + bl(c.cats), 'Baik. Kategori apa pula? ' + bl(c.cats)), f); }
        else { (f.d as any).sugg = undefined; }
      }
      if (!f.d.cat && !(f.d as any).noSugg) {
        const g = learnCat(t, c.spends, c.cats);
        const own = c.cats.some((x) => norm(t).indexOf(' ' + x.toLowerCase() + ' ') >= 0);
        if (g && !own) { (f.d as any).sugg = g.cat; return out(L('"' + g.word + '" is usually under ' + g.cat + ' for you. Is that right? Say yes, or say another category.', '"' + g.word + '" biasanya awak letak bawah ' + g.cat + '. Betul? Sebut ya, atau sebut kategori lain.'), f); }
      }
      if (!f.d.cat) fill(f, t, c, ['cat', 'date', 'acc']);
      if (!f.d.cat) { f.tries++; return out(L('I did not catch the category. Please pick one: ' + bl(c.cats), 'Saya tak dapat tangkap kategori itu. Sila pilih satu: ' + bl(c.cats)), f); }
    } else if (step === 'date') {
      const x = parseDate(t);
      if (!x) { f.tries++; return out(L('I did not catch the date. Say today, yesterday, or a date like 15/11.', 'Saya tak dapat tangkap tarikh itu. Sebut hari ini, semalam, atau tarikh seperti 15/11.'), f); }
      f.d.date = x.date; f.d.ydy = x.ydy;
    } else if (step === 'note') {
      f.d.noteDone = true;
      if (!SKIP.test(n)) { const nt = t.replace(/^(catatan|remark|note|nota)\s*[:\-]?\s*/i, '').trim().slice(0, 80); if (nt) f.d.note = nt.charAt(0).toUpperCase() + nt.slice(1); }
    } else if (step === 'acc') {
      if (SKIP.test(n) || /\b(tiada akaun|no account|none)\b/.test(n)) f.d.noAcc = true;
      else { const x = parseAcc(t, c.accs); if (!x) { f.tries++; return out(L('I did not find that account. Say one of: ' + bl(c.accs.map((a) => a.name)) + '\nOr "none".', 'Saya tak jumpa akaun itu. Sebut salah satu: ' + bl(c.accs.map((a) => a.name)) + '\nAtau "tiada".'), f); } f.d.acc = x.id; f.d.accName = x.name; }
    } else if (step === 'amt') {
      const a = parseAmount(t);
      if (a == null || !(a > 0) || a > 9999999) { f.tries++; return out(L('That is not a valid amount. Please say a number, for example 12 or 12.50.', 'Itu bukan jumlah yang betul. Sila sebut nombor, contohnya 12 atau 12.50.'), f); }
      f.d.amt = Math.round(a * 100) / 100;
    }
  }
  f.tries = 0;
  const nx = need(f);
  if (nx) { f.step = nx; return out(question(f, c, first), f); }
  // Everything is known: show the summary and wait for "save" (the same confirm step as a spending said in one sentence).
  const d = f.d; const id = (s.pid || 0) + 1;
  const act = { type: 'spend', amt: d.amt, cat: d.cat, name: d.cat, date: d.date, ydy: !!d.ydy, ...(d.acc ? { acc: d.acc, accName: d.accName } : {}), ...(d.note ? { note: d.note } : {}) };
  const lines = L('Got it. Save this spending?', 'Faham. Simpan perbelanjaan ini?') + '\n• ' + (L('Category: ', 'Kategori: ') + d.cat) + (d.accName ? '\n• ' + L('Paid from: ', 'Dibayar dari: ') + d.accName : '') + '\n• ' + L('Date: ', 'Tarikh: ') + dateWords(f, L) + (d.note ? '\n• ' + L('Remark: ', 'Catatan: ') + d.note : '');
  return { m: mk(lines + (await keepWarn(d.acc, d.amt || 0, lang)), { pid: id, big: cs() + String(Math.round((d.amt || 0) * 100) / 100), bigLbl: d.cat, color: '#ffc46b' }), patch: { flow: null, pending: Object.assign({ id }, act), pid: id }, act: null };
}
