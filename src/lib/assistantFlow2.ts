// More guided entries in My Life Assistant: tasks, events, transfers between accounts, subscriptions and lent or borrowed.
// The same idea as assistantFlow.ts: ask one thing at a time, show a summary, save only after the person says yes.
import { getItem } from './store';
import { cs } from './region';
import { bl, norm, hasW, QUESTION, START_VERB, SKIP, CANCEL, dstr, parseAmount, parseAcc, parseDate } from './assistantFlow';

type Kind = 'task' | 'event' | 'xfer' | 'sub' | 'loan';
export type Flow2 = { kind: Kind; step: string; d: any };
const KINDS = ['task', 'event', 'xfer', 'sub', 'loan'];
const DAYS: [string, number][] = [['ahad', 0], ['sunday', 0], ['isnin', 1], ['monday', 1], ['selasa', 2], ['tuesday', 2], ['rabu', 3], ['wednesday', 3], ['khamis', 4], ['thursday', 4], ['jumaat', 5], ['friday', 5], ['sabtu', 6], ['saturday', 6]];

// A date that may be today or later: esok, lusa, 3 hari lagi, minggu depan, Jumaat, 15/12, 15 disember.
export function parseWhen(text: string, now = new Date()): string | null {
  const t = norm(text); const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const add = (n: number) => dstr(new Date(day0.getFullYear(), day0.getMonth(), day0.getDate() + n));
  if (/ (hari ini|harini|hari nie|hari ni|today|tonight|malam ini) /.test(t)) return add(0);
  if (/ (esok|besok|tomorrow|tmrw) /.test(t)) return add(1);
  if (/ (lusa|day after tomorrow) /.test(t)) return add(2);
  let m = t.match(/ (\d{1,3}) (?:hari|days?) (?:lagi|dari sekarang|later|from now)/) || t.match(/ in (\d{1,3}) days? /);
  if (m) return add(parseInt(m[1], 10));
  if (/ (minggu depan|next week|seminggu lagi) /.test(t)) return add(7);
  if (/ (bulan depan|next month|sebulan lagi) /.test(t)) return dstr(new Date(day0.getFullYear(), day0.getMonth() + 1, day0.getDate()));
  for (const [w, n] of DAYS) if (t.indexOf(' ' + w + ' ') >= 0) { let k = (n - day0.getDay() + 7) % 7; if (k === 0) k = 7; return add(k); }
  m = t.match(/ (\d{4})-(\d{1,2})-(\d{1,2}) /);
  if (m) { const d = new Date(+m[1], +m[2] - 1, +m[3]); return isNaN(+d) ? null : dstr(d); }
  m = t.match(/ (\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))? /);
  if (m) {
    const dd = +m[1], mo = +m[2]; if (dd < 1 || dd > 31 || mo < 1 || mo > 12) return null;
    let y = m[3] ? +m[3] : day0.getFullYear(); if (y < 100) y += 2000;
    let d = new Date(y, mo - 1, dd); if (!m[3] && d < day0) d = new Date(y + 1, mo - 1, dd);
    return isNaN(+d) ? null : dstr(d);
  }
  const MS = ['jan', 'feb', 'mar', 'apr', 'mei|may', 'jun', 'jul', 'ogos|aug', 'sep', 'okt|oct', 'nov', 'dis|dec'];
  for (let i = 0; i < 12; i++) {
    const mm = t.match(new RegExp(' (\\d{1,2}) (?:' + MS[i] + ')[a-z]* '));
    if (mm) { const dd = +mm[1]; if (dd < 1 || dd > 31) return null; let d = new Date(day0.getFullYear(), i, dd); if (d < day0) d = new Date(day0.getFullYear() + 1, i, dd); return dstr(d); }
  }
  const p = parseDate(text, now); return p ? p.date : null;
}

const TASK_NOUN = /\b(tugasan|tugas|task|todo|to do)\b/, EVENT_NOUN = /\b(acara|event|temujanji|appointment|janji temu|jadual)\b/, SUB_NOUN = /\b(langganan|subscription|subscriptions|subscribe)\b/;
const XFER = /\b(pindah|pindahkan|transfer|pindahan)\b/, LOAN = /\b(pinjam|pinjamkan|lend|lent|borrow|borrowed|meminjam)\b/;
const FILL = /\b(tolong|please|boleh|saya|sy|aku|i|my|baru|baharu|new|satu|a|an|untuk|for|nak|mahu|want|to|ke|dalam|in|app|duit|wang|money|akaun|account|dan|and)\b/g;
const rest = (t: string, extra: RegExp) => t.replace(START_VERB, ' ').replace(extra, ' ').replace(FILL, ' ').replace(/\s+/g, ' ').trim();

export function startsGen(q: string): { kind: Kind; name?: string } | null {
  const t = String(q || '').toLowerCase();
  if (!t.trim() || QUESTION.test(t) || /\d/.test(t)) return null;
  const verb = START_VERB.test(t) || /\b(buat|create|buka)\b/.test(t);
  if (XFER.test(t) && t.split(/\s+/).length <= 8) return { kind: 'xfer' };
  if (LOAN.test(t) && (verb || /\b(saya|aku|i)\b/.test(t)) && t.split(/\s+/).length <= 9) return { kind: 'loan' };
  if (verb && SUB_NOUN.test(t)) { const r = rest(t, SUB_NOUN); return { kind: 'sub', name: r || undefined }; }
  if (verb && EVENT_NOUN.test(t)) { const r = rest(t, EVENT_NOUN); return { kind: 'event', name: r || undefined }; }
  if (verb && TASK_NOUN.test(t)) { return rest(t, TASK_NOUN) ? null : { kind: 'task' }; }
  return null;
}

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
const PRIO: [string, string[]][] = [['High', ['tinggi', 'high', 'penting', 'urgent', 'segera', 'mustahak']], ['Low', ['rendah', 'low', 'tak penting', 'santai']], ['Medium', ['sederhana', 'medium', 'biasa', 'normal', 'okay', 'ok']]];
const REMS: [string, string[]][] = [['None', ['tiada', 'tak payah', 'none', 'no', 'tidak', 'tak perlu', 'takde']], ['On the day', ['hari tu', 'on the day', 'hari kejadian', 'pada hari', 'same day']], ['1 day before', ['sehari', '1 hari', 'satu hari', '1 day', 'one day', 'sehari sebelum', 'day before']], ['1 week before', ['seminggu', '1 minggu', 'satu minggu', '1 week', 'one week', 'week before']]];
const CYC: [string, string[]][] = [['week', ['mingguan', 'seminggu', 'weekly', 'week', 'minggu']], ['month', ['bulanan', 'sebulan', 'monthly', 'month', 'bulan']], ['quarter', ['3 bulan', 'tiga bulan', '3 months', 'quarter', 'suku tahun']], ['half', ['6 bulan', 'enam bulan', '6 months', 'half year', 'setengah tahun']], ['year', ['tahunan', 'setahun', 'yearly', 'annual', 'annually', 'year', 'tahun']]];
const pick = (text: string, list: [string, string[]][]) => { const t = norm(text); const x = list.find(([n, w]) => w.some((k) => hasW(t, k)) || hasW(t, n.toLowerCase())); return x ? x[0] : null; };
const CYC_LAB: Record<string, [string, string]> = { week: ['weekly', 'mingguan'], month: ['monthly', 'bulanan'], quarter: ['every 3 months', 'setiap 3 bulan'], half: ['every 6 months', 'setiap 6 bulan'], year: ['yearly', 'tahunan'] };
const PRIO_LAB: Record<string, string> = { High: 'tinggi', Medium: 'sederhana', Low: 'rendah' };
const REM_LAB: Record<string, string> = { 'None': 'tiada', 'On the day': 'pada hari itu', '1 day before': 'sehari sebelum', '1 week before': 'seminggu sebelum' };

const ORDER: Record<Kind, string[]> = { task: ['name', 'due', 'prio'], event: ['name', 'date', 'remind'], xfer: ['from', 'to', 'amt'], sub: ['name', 'price', 'cycle', 'next'], loan: ['dir', 'what', 'who', 'item', 'due'] };

export async function genTurn(host: any, q: string, lang: string): Promise<any | null> {
  const s = host.state; let f: Flow2 | null = s.flow || null;
  if (f && KINDS.indexOf(f.kind) < 0) return null;
  const L = (en: string, ms: string) => (lang === 'ms' ? ms : en);
  const mk = (text: string, x?: any) => host.mk(text, x);
  const out = (text: string, flow: Flow2 | null) => ({ m: mk(text), patch: { flow }, act: null });
  let accs: { id: number; name: string }[] = [];
  const first = !f;
  if (!f) {
    const st = startsGen(q); if (!st) return null;
    f = { kind: st.kind, step: '', d: {} };
    if (st.name) f.d.name = cap(st.name).slice(0, 80);
    if (st.kind === 'xfer' || st.kind === 'loan') {
      if (st.kind === 'xfer') {
        const a: any = await getItem('ml_accounts', { accs: [] });
        accs = ((a && a.accs) || []).filter((x: any) => x && x.name).map((x: any) => ({ id: x.id, name: String(x.name) }));
        if (accs.length < 2) return out(L('Money transfers need at least two accounts. Add them in My Accounts first, then ask me again.', 'Pindah duit perlukan sekurang-kurangnya dua akaun. Tambah dulu dalam My Accounts, kemudian minta saya semula.'), null);
      } else {
        const t = ' ' + q.toLowerCase() + ' ';
        if (/(pinjamkan|bagi pinjam|beri pinjam|lend|lent)/.test(t)) f.d.dir = 'lent'; else if (/(meminjam|borrow|saya pinjam|aku pinjam|i pinjam)/.test(t)) f.d.dir = 'borrowed';
      }
    }
  } else {
    const t = String(q || '').trim(); const n = norm(t).trim();
    if (CANCEL.test(n)) return out(L('Okay, I did not save it.', 'Baik, saya tidak simpan.'), null);
    if (QUESTION.test(t.toLowerCase()) && !/^\d/.test(n)) return null;
    const d = f.d; const bad = (en: string, ms: string) => out(L(en, ms), f);
    if (f.kind === 'xfer') { const a: any = await getItem('ml_accounts', { accs: [] }); accs = ((a && a.accs) || []).filter((x: any) => x && x.name).map((x: any) => ({ id: x.id, name: String(x.name) })); }
    const st = f.step;
    if (st === 'name') { const v = t.replace(/^(nama|name)\s*[:\-]?\s*/i, '').trim(); if (!v) return bad('Please type a name.', 'Sila taip nama.'); d.name = cap(v).slice(0, 80); }
    else if (st === 'due' || st === 'date' || st === 'next') {
      const optional = st === 'due' && f.kind !== 'loan' || (f.kind === 'loan' && st === 'due');
      if (optional && SKIP.test(n)) d[st] = ''; else { const w = parseWhen(t); if (!w) return bad('I did not catch the date. Say for example tomorrow, Friday, next week or 15/12.', 'Saya tak dapat tangkap tarikh itu. Sebut contohnya esok, Jumaat, minggu depan atau 15/12.'); d[st] = w; }
    }
    else if (st === 'prio') { const v = pick(t, PRIO); if (!v) return bad('Say High, Medium or Low.', 'Sebut tinggi, sederhana atau rendah.'); d.prio = v; }
    else if (st === 'remind') { const v = pick(t, REMS); if (!v) return bad('Say none, on the day, a day before or a week before.', 'Sebut tiada, pada hari itu, sehari sebelum atau seminggu sebelum.'); d.remind = v; }
    else if (st === 'from' || st === 'to') {
      const x = parseAcc(t, accs); if (!x) return bad('I did not find that account. Say one of: ' + bl(accs.map((a) => a.name)), 'Saya tak jumpa akaun itu. Sebut salah satu: ' + bl(accs.map((a) => a.name)));
      if (st === 'to' && x.id === d.from) return bad('That is the same account. Pick a different one.', 'Itu akaun yang sama. Pilih akaun lain.');
      d[st] = x.id; d[st + 'Name'] = x.name;
    }
    else if (st === 'amt' || st === 'price') { const a = parseAmount(t); if (a == null || !(a > 0) || a > 9999999) return bad('That is not a valid amount. Please say a number, for example 12 or 12.50.', 'Itu bukan jumlah yang betul. Sila sebut nombor, contohnya 12 atau 12.50.'); d[st] = Math.round(a * 100) / 100; }
    else if (st === 'cycle') { const v = pick(t, CYC); if (!v) return bad('Say weekly, monthly, every 3 months, every 6 months or yearly.', 'Sebut mingguan, bulanan, setiap 3 bulan, setiap 6 bulan atau tahunan.'); d.cycle = v; }
    else if (st === 'dir') { const tt = ' ' + t.toLowerCase() + ' '; if (/(lent|lend|pinjamkan|bagi pinjam|saya bagi|aku bagi)/.test(tt)) d.dir = 'lent'; else if (/(borrow|meminjam|pinjam|saya ambil)/.test(tt)) d.dir = 'borrowed'; else return bad('Say lent (you gave) or borrowed (you took).', 'Sebut dipinjamkan (awak bagi) atau meminjam (awak ambil).'); }
    else if (st === 'what') { const tt = ' ' + t.toLowerCase() + ' '; if (/(duit|wang|money|cash|tunai|rm|ringgit)/.test(tt)) d.what = 'money'; else if (/(barang|thing|item|benda|alat)/.test(tt)) d.what = 'thing'; else return bad('Say money or thing.', 'Sebut duit atau barang.'); }
    else if (st === 'who') { const v = t.trim(); if (!v) return bad('Please type a name.', 'Sila taip nama.'); d.who = cap(v).slice(0, 60); }
    else if (st === 'item') {
      if (d.what === 'money') { const a = parseAmount(t); if (a == null || !(a > 0) || a > 9999999) return bad('That is not a valid amount. Please say a number, for example 50.', 'Itu bukan jumlah yang betul. Sila sebut nombor, contohnya 50.'); d.amt = Math.round(a * 100) / 100; }
      else { const v = t.trim(); if (!v) return bad('Please type what the thing is.', 'Sila taip barang apa.'); d.title = cap(v).slice(0, 80); }
    }
  }
  const d = f.d;
  const key = (k: string) => k === 'item' ? (d.what === 'money' ? d.amt : d.title) : d[k];
  const need = ORDER[f.kind].find((k) => key(k) === undefined || key(k) === null || key(k) === 0 && k !== 'due' || (k === 'due' && f!.kind === 'loan' ? d.due === undefined : false) || (k === 'due' && f!.kind === 'task' ? d.due === undefined : false));
  const Q: Record<string, [string, string]> = {
    'task:name': ['What is the task?', 'Apa tugasannya?'], 'task:due': ['When is it due? Say for example tomorrow or Friday, or "no" for no date.', 'Bila tarikh akhirnya? Sebut contohnya esok atau Jumaat, atau "tiada" kalau tiada tarikh.'], 'task:prio': ['How important is it? High, Medium or Low.', 'Seberapa penting? Tinggi, sederhana atau rendah.'],
    'event:name': ['What is the event?', 'Apa acaranya?'], 'event:date': ['Which date? Say for example tomorrow, Friday or 15/12.', 'Tarikh bila? Sebut contohnya esok, Jumaat atau 15/12.'], 'event:remind': ['When should I remind you? None, on the day, a day before or a week before.', 'Bila nak diingatkan? Tiada, pada hari itu, sehari sebelum atau seminggu sebelum.'],
    'xfer:from': ['Move money from which account? ' + bl(accs.map((a) => a.name)), 'Pindah dari akaun mana? ' + bl(accs.map((a) => a.name))], 'xfer:to': ['To which account?', 'Ke akaun mana?'], 'xfer:amt': ['How much in ' + cs() + '?', 'Berapa ' + cs() + '?'],
    'sub:name': ['Which subscription? For example Netflix or Spotify.', 'Langganan apa? Contohnya Netflix atau Spotify.'], 'sub:price': ['How much each time in ' + cs() + '?', 'Berapa ' + cs() + ' setiap kali bayar?'], 'sub:cycle': ['How often? Weekly, monthly, every 3 months, every 6 months or yearly.', 'Berapa kerap? Mingguan, bulanan, setiap 3 bulan, setiap 6 bulan atau tahunan.'], 'sub:next': ['When is the next charge? Say a date like 15/12 or "next week".', 'Bila bayaran seterusnya? Sebut tarikh seperti 15/12 atau "minggu depan".'],
    'loan:dir': ['Did you lend it (you gave) or borrow it (you took)?', 'Awak yang pinjamkan (awak bagi) atau awak yang meminjam (awak ambil)?'], 'loan:what': ['Is it money or a thing?', 'Duit atau barang?'], 'loan:who': ['With whom?', 'Dengan siapa?'], 'loan:item': [d.what === 'money' ? 'How much in ' + cs() + '?' : 'What is the thing?', d.what === 'money' ? 'Berapa ' + cs() + '?' : 'Barang apa?'], 'loan:due': ['When should it be returned? Say a date or "no".', 'Bila patut dipulangkan? Sebut tarikh atau "tiada".'],
  };
  if (need) {
    f.step = need;
    const intro = first ? ({ task: ['Sure, let us add a task. ', 'Boleh, kita tambah tugasan. '], event: ['Sure, let us add an event. ', 'Boleh, kita tambah acara. '], xfer: ['Sure, let us move some money. ', 'Boleh, kita pindah duit. '], sub: ['Sure, let us add a subscription. ', 'Boleh, kita tambah langganan. '], loan: ['Sure, let us note it down. ', 'Boleh, kita catat. '] } as any)[f.kind] : null;
    const qq = Q[f.kind + ':' + need];
    return out((intro ? L(intro[0], intro[1]) : '') + L(qq[0], qq[1]), f);
  }
  const id = (s.pid || 0) + 1; const dw = (x: string) => x || L('none', 'tiada');
  let text = '', p: any, big = '', bigLbl = '', color = '#8fe9e2';
  if (f.kind === 'task') { p = { type: 'task', name: d.name, prio: d.prio, due: d.due || '' }; text = L('Got it. Add this task?\n• ' + d.name + '\n• Due: ' + dw(d.due) + '\n• Importance: ' + d.prio, 'Faham. Tambah tugasan ini?\n• ' + d.name + '\n• Tarikh akhir: ' + dw(d.due) + '\n• Kepentingan: ' + PRIO_LAB[d.prio]); p.doneEn = 'Done. I added "' + d.name + '" to your Daily Planner tasks.'; p.doneMs = 'Siap. Saya dah tambah "' + d.name + '" dalam tugasan Daily Planner.'; p.lbl = ['Open Daily Planner', 'Buka Daily Planner']; p.href = 'Planner.dc.html'; big = '✓'; bigLbl = d.name; color = '#7c9cff'; }
  else if (f.kind === 'event') { p = { type: 'event', name: d.name, date: d.date, remind: d.remind }; text = L('Got it. Add this event?\n• ' + d.name + '\n• Date: ' + d.date + '\n• Reminder: ' + d.remind, 'Faham. Tambah acara ini?\n• ' + d.name + '\n• Tarikh: ' + d.date + '\n• Peringatan: ' + REM_LAB[d.remind]); p.doneEn = 'Done. I added "' + d.name + '" on ' + d.date + ' to your Daily Planner events.'; p.doneMs = 'Siap. Saya dah tambah "' + d.name + '" pada ' + d.date + ' dalam acara Daily Planner.'; p.lbl = ['Open Daily Planner', 'Buka Daily Planner']; p.href = 'Planner.dc.html'; big = d.date.slice(8) + '/' + d.date.slice(5, 7); bigLbl = d.name; color = '#7c9cff'; }
  else if (f.kind === 'xfer') { p = { type: 'xfer', from: d.from, to: d.to, amt: d.amt, name: d.fromName + ' → ' + d.toName }; text = L('Got it. Move this money?\n• From: ' + d.fromName + '\n• To: ' + d.toName, 'Faham. Pindah duit ini?\n• Dari: ' + d.fromName + '\n• Ke: ' + d.toName); p.doneEn = 'Done. Moved ' + cs() + d.amt.toFixed(2) + ' from ' + d.fromName + ' to ' + d.toName + '.'; p.doneMs = 'Siap. Dah pindah ' + cs() + d.amt.toFixed(2) + ' dari ' + d.fromName + ' ke ' + d.toName + '.'; p.lbl = ['Open My Accounts', 'Buka My Accounts']; p.href = 'Accounts.dc.html'; big = cs() + d.amt.toFixed(2); bigLbl = d.fromName + ' → ' + d.toName; color = '#7c9cff'; }
  else if (f.kind === 'sub') { p = { type: 'sub', name: d.name, price: d.price, cycle: d.cycle, next: d.next }; text = L('Got it. Add this subscription?\n• ' + d.name + '\n• ' + CYC_LAB[d.cycle][0] + '\n• Next charge: ' + d.next, 'Faham. Tambah langganan ini?\n• ' + d.name + '\n• ' + CYC_LAB[d.cycle][1] + '\n• Bayaran seterusnya: ' + d.next); p.doneEn = 'Done. I added ' + d.name + ' (' + cs() + d.price.toFixed(2) + ' ' + CYC_LAB[d.cycle][0] + ') to Subscriptions.'; p.doneMs = 'Siap. Saya dah tambah ' + d.name + ' (' + cs() + d.price.toFixed(2) + ' ' + CYC_LAB[d.cycle][1] + ') dalam Subscriptions.'; p.lbl = ['Open Subscriptions', 'Buka Subscriptions']; p.href = 'Subscriptions.dc.html'; big = cs() + d.price.toFixed(2); bigLbl = d.name; color = '#b794ff'; }
  else { const what = d.what === 'money' ? cs() + d.amt.toFixed(2) : d.title; p = { type: 'loan', dir: d.dir, what: d.what, who: d.who, title: d.what === 'money' ? '' : d.title, amount: d.what === 'money' ? String(d.amt) : '', due: d.due || '' }; text = L('Got it. Note this down?\n• ' + (d.dir === 'lent' ? 'You lent ' : 'You borrowed ') + what + (d.dir === 'lent' ? ' to ' : ' from ') + d.who + '\n• Return by: ' + dw(d.due), 'Faham. Catat ini?\n• Awak ' + (d.dir === 'lent' ? 'pinjamkan ' : 'meminjam ') + what + (d.dir === 'lent' ? ' kepada ' : ' daripada ') + d.who + '\n• Pulangkan pada: ' + dw(d.due)); p.doneEn = 'Done. Noted: you ' + (d.dir === 'lent' ? 'lent ' : 'borrowed ') + what + (d.dir === 'lent' ? ' to ' : ' from ') + d.who + '.'; p.doneMs = 'Siap. Dah dicatat: awak ' + (d.dir === 'lent' ? 'pinjamkan ' : 'meminjam ') + what + (d.dir === 'lent' ? ' kepada ' : ' daripada ') + d.who + '.'; p.lbl = ['Open Lent & Borrowed', 'Buka Lent & Borrowed']; p.href = 'Collection.dc.html'; big = d.what === 'money' ? cs() + d.amt.toFixed(2) : ''; bigLbl = d.who; color = '#ffb86b'; }
  p.id = id; p.name = p.name || d.who;
  return { m: mk(text, { pid: id, big, bigLbl, color }), patch: { flow: null, pending: p, pid: id }, act: null };
}
