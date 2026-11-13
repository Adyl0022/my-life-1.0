// @ts-nocheck
// The thinking part of the Assistant. Works fully offline, on the saved data of the app.
// 1) fix() repairs typos and chat spelling   2) period() understands "yesterday", "this week", "last month"
// 3) think() answers analysis questions, small talk and new actions, and remembers the last topic (ctx).
import * as DB from './debts';
import { calcLeft } from './moneyLeft';
import { cs } from './region';

const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WD_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WD_MS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

// ---------- spelling ----------
const SLANG = {
  brp: 'berapa', berapaa: 'berapa', bln: 'bulan', mggu: 'minggu', mgu: 'minggu', hr: 'hari', sy: 'saya', blnja: 'belanja', belnja: 'belanja', blanja: 'belanja', bljnja: 'belanja', tdo: 'tidur', tido: 'tidur', x: 'tak', xde: 'tiada', xda: 'tiada', tkde: 'tiada', dpt: 'dapat', utk: 'untuk', dgn: 'dengan', yg: 'yang',
  blm: 'belum', dh: 'dah', sdh: 'sudah', knp: 'kenapa', kenape: 'kenapa', camne: 'macam mana', cmne: 'macam mana', macamana: 'macam mana', macamne: 'macam mana', smlm: 'semalam', esk: 'esok', bsk: 'esok', besok: 'esok', tgk: 'tengok', hrini: 'hari ini', harini: 'hari ini',
  ni: 'ini', nie: 'ini', tu: 'itu', jgn: 'jangan', tlg: 'tolong', pls: 'please', plz: 'please', btw: 'by the way', gaji: 'gaji', duitt: 'duit', wang: 'duit', ringgit: 'rm', bajet: 'budget', kt: 'kat', lg: 'lagi', jer: 'je', jek: 'je', spt: 'seperti', byk: 'banyak', sket: 'sikit', skit: 'sikit', kje: 'kerja', kerjaa: 'kerja', mkn: 'makan', mkan: 'makan', sleeep: 'sleep', thx: 'thanks', tq: 'terima kasih', tqvm: 'terima kasih',
};
const VOC = ('siapa berapa bulan minggu semalam kelmarin esok lusa belanja perbelanjaan pendapatan gaji tidur langkah tugasan acara solat puasa hutang servis motosikal odometer kesihatan makan petrol minyak elektrik kenapa bagaimana macam mana boleh tambah padam buang catat nota ingatkan jangan lupa tandakan selesai siap sudah belum kategori paling banyak jimat bajet baki simpan bandingkan banding ringkasan cadangan nasihat penting segera tolong terima kasih hari ini tahun lepas depan sikit tinggi rendah purata jumlah jumpa doktor temujanji bengkel '
  + 'spending spent income salary budget savings steps sleep water mood tasks events prayer fasting debts service mileage motorcycle summary weekly week month year yesterday tomorrow today average total biggest expensive cheaper higher lower compare comparison reminder remind note delete remove undo done finished complete mark afford priority progress review advice suggest why reduce cut fuel lunch dinner breakfast coffee groceries shopping bills health appointment doctor meeting birthday').split(' ');
const VSET = {}; VOC.forEach((w) => { VSET[w] = 1; });

function dist(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length, n = b.length; let prev = []; for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    const cur = [i]; let best = i;
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < best) best = cur[j];
    }
    if (best > max) return max + 1; prev = cur;
  }
  return prev[n];
}
function fixWord(w) {
  if (SLANG[w]) return SLANG[w];
  if (w.length < 6 || VSET[w] || /\d/.test(w)) return w;
  const max = w.length >= 9 ? 2 : 1; let best = null; let bd = max + 1; let tie = false;
  for (let i = 0; i < VOC.length; i++) {
    const v = VOC[i]; if (v.length < 4 || v[0] !== w[0]) continue;
    const d = dist(w, v, max);
    if (d < bd) { bd = d; best = v; tie = false; } else if (d === bd && d <= max && best !== v) tie = true;
  }
  return best && !tie ? best : w;
}
// Spelling repair used for understanding only, never for the text that gets saved.
export function fix(q) {
  const s = (q || '').toLowerCase().replace(/rm\s*(\d)/g, 'rm $1');
  return s.replace(/[a-z]+/g, (w) => fixWord(w)).replace(/\bbulan ini\b/g, 'bulan ini').replace(/\s+/g, ' ');
}

// ---------- dates ----------
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; };
const fmt = (s) => { const p = (s || '').split('-'); return p.length === 3 ? Number(p[2]) + ' ' + MN[Number(p[1]) - 1] : s; };
const MONTHS = { jan: 0, januari: 0, january: 0, feb: 1, februari: 1, february: 1, mac: 2, mar: 2, march: 2, apr: 3, april: 3, mei: 4, may: 4, jun: 5, june: 5, jul: 6, julai: 6, july: 6, ogos: 7, aug: 7, august: 7, sep: 8, sept: 8, september: 8, okt: 9, oct: 9, oktober: 9, october: 9, nov: 10, november: 10, dis: 11, dec: 11, disember: 11, december: 11 };
const WDAYS = { ahad: 0, sunday: 0, isnin: 1, monday: 1, selasa: 2, tuesday: 2, rabu: 3, wednesday: 3, khamis: 4, thursday: 4, jumaat: 5, friday: 5, sabtu: 6, saturday: 6 };

// Finds one date inside a sentence. Returns { date: 'YYYY-MM-DD', span: [text that was used] } or null.
export function findDate(text) {
  const t = ' ' + (text || '').toLowerCase() + ' '; const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let m;
  if ((m = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/))) return { date: m[0], span: m[0] };
  if ((m = t.match(/\b(dalam|in)\s+(\d{1,3})\s+(hari|days?)\b/)) || (m = t.match(/\b(\d{1,3})\s+hari\s+lagi\b/))) { const n = Number(m[2] && /^\d/.test(m[2]) ? m[2] : m[1]); return { date: iso(addDays(today, n)), span: m[0] }; }
  if ((m = t.match(/\b(lusa|day after tomorrow)\b/))) return { date: iso(addDays(today, 2)), span: m[0] };
  if ((m = t.match(/\b(esok|tomorrow|besok)\b/))) return { date: iso(addDays(today, 1)), span: m[0] };
  if ((m = t.match(/\b(hari ini|hari ni|today|harini)\b/))) return { date: iso(today), span: m[0] };
  if ((m = t.match(/\b(kelmarin)\b/))) return { date: iso(addDays(today, -2)), span: m[0] };
  if ((m = t.match(/\b(semalam|yesterday)\b/))) return { date: iso(addDays(today, -1)), span: m[0] };
  if ((m = t.match(/\b(minggu depan|next week)\b/))) return { date: iso(addDays(today, 7)), span: m[0] };
  if ((m = t.match(/\b(bulan depan|next month)\b/))) { const d = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()); return { date: iso(d), span: m[0] }; }
  if ((m = t.match(/\b(\d{1,2})\s*(jan|januari|january|feb|februari|february|mac|mar|march|apr|april|mei|may|jun|june|jul|julai|july|ogos|aug|august|sep|sept|september|okt|oct|oktober|october|nov|november|dis|dec|disember|december)\b(?:\s*(\d{4}))?/))) {
    const mo = MONTHS[m[2]]; let y = m[3] ? Number(m[3]) : today.getFullYear(); let d = new Date(y, mo, Number(m[1]));
    if (!m[3] && d < today) d = new Date(y + 1, mo, Number(m[1])); return { date: iso(d), span: m[0] };
  }
  if ((m = t.match(/\b(jan|januari|january|feb|februari|february|mac|mar|march|apr|april|mei|may|jun|june|jul|julai|july|ogos|aug|august|sep|sept|september|okt|oct|oktober|october|nov|november|dis|dec|disember|december)\s+(\d{1,2})\b(?!\s*(?:rm|ringgit|km))/))) {
    const mo = MONTHS[m[1]]; let d = new Date(today.getFullYear(), mo, Number(m[2])); if (d < today) d = new Date(today.getFullYear() + 1, mo, Number(m[2])); return { date: iso(d), span: m[0] };
  }
  if ((m = t.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/)) && Number(m[2]) <= 12 && Number(m[1]) <= 31) {
    let y = m[3] ? Number(m[3]) : today.getFullYear(); if (y < 100) y += 2000; let d = new Date(y, Number(m[2]) - 1, Number(m[1]));
    if (!m[3] && d < today) d = new Date(y + 1, Number(m[2]) - 1, Number(m[1])); return { date: iso(d), span: m[0] };
  }
  if ((m = t.match(/\b(?:(depan|next|pada hari|hari|on)\s+)?(ahad|isnin|selasa|rabu|khamis|jumaat|sabtu|sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?:\s+(depan|ini|next))?\b/))) {
    const target = WDAYS[m[2]]; let diff = (target - today.getDay() + 7) % 7; if (diff === 0) diff = 7;
    return { date: iso(addDays(today, diff)), span: m[0] };
  }
  return null;
}

// A period such as "this week" as a [from, to) range of date strings.
export function period(qn) {
  const t = ' ' + qn + ' '; const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mk = (k, from, to, en, ms) => ({ k, from: iso(from), to: iso(to), en, ms, days: Math.round((to - from) / 86400000) });
  const dow = (today.getDay() + 6) % 7; const wk = addDays(today, -dow);
  let m;
  if (/ (semalam|yesterday) /.test(t)) return mk('yday', addDays(today, -1), today, 'yesterday', 'semalam');
  if (/ kelmarin /.test(t)) return mk('yday2', addDays(today, -2), addDays(today, -1), 'the day before yesterday', 'kelmarin');
  if (/ (minggu lepas|minggu lalu|last week) /.test(t)) return mk('lweek', addDays(wk, -7), wk, 'last week', 'minggu lepas');
  if (/ (minggu ini|this week) /.test(t)) return mk('week', wk, addDays(today, 1), 'this week', 'minggu ini');
  if (/ (bulan lepas|bulan lalu|last month) /.test(t)) return mk('lmonth', new Date(today.getFullYear(), today.getMonth() - 1, 1), new Date(today.getFullYear(), today.getMonth(), 1), 'last month', 'bulan lepas');
  if (/ (bulan ini|this month) /.test(t)) return mk('month', new Date(today.getFullYear(), today.getMonth(), 1), addDays(today, 1), 'this month', 'bulan ini');
  if (/ (tahun ini|this year) /.test(t)) return mk('year', new Date(today.getFullYear(), 0, 1), addDays(today, 1), 'this year', 'tahun ini');
  if ((m = t.match(/ (?:(\d{1,3}) hari (?:lepas|lalu|kebelakangan|terakhir)|(?:last|past) (\d{1,3}) days?) /))) { const n = Number(m[1] || m[2]); return mk('last' + n, addDays(today, -(n - 1)), addDays(today, 1), 'the last ' + n + ' days', n + ' hari lepas'); }
  if (/ (hari ini|today) /.test(t)) return mk('today', today, addDays(today, 1), 'today', 'hari ini');
  return null;
}

const sum = (a, f) => a.reduce((x, y) => x + (f ? f(y) : y), 0);
const r2 = (n) => Math.round(n * 100) / 100;
const CATK = [
  ['Food', ['makan', 'food', 'lunch', 'dinner', 'breakfast', 'sarapan', 'kopi', 'coffee', 'minum', 'groceries', 'grocery', 'runcit']],
  ['Petrol', ['petrol', 'minyak', 'fuel', 'tol', 'toll', 'parking', 'parkir']],
  ['Bills', ['bil', 'bill', 'bills', 'elektrik', 'internet', 'telco']],
  ['Shopping', ['shopping', 'baju', 'kasut', 'membeli belah', 'beli belah']],
  ['Health', ['ubat', 'klinik', 'doktor', 'medicine', 'clinic']],
];

function metricsOf(A) {
  const D = A.D();
  return { steps: { key: 'steps', goal: D.goal, en: 'steps', ms: 'langkah', unit: '' }, sleep: { key: 'sleep', goal: 7, en: 'sleep', ms: 'tidur', unit: 'h' }, water: { key: 'cups', goal: D.cupGoal, en: 'glasses of water', ms: 'gelas air', unit: '' }, mood: { key: 'mood', goal: 5, en: 'mood', ms: 'mood', unit: '/5' } };
}

// ---------- the main entry ----------
export function think(A, q, lang) {
  const L = (en, ms) => (lang === 'ms' ? ms : en);
  const s = A.state; const D = A.D(); const R = A.R();
  const ql = (q || '').toLowerCase().trim();
  const qn = A.norm(fix(q));
  const has = (l) => A.has(qn, l);
  const mk = (t, x) => A.mk(t, x);
  const ctx = s.ctx || {};
  const done = (m, patch, act, c) => ({ m, patch: Object.assign({}, patch || {}, c !== undefined ? { ctx: c } : {}), act: act || null });
  const per = period(qn);
  const rm = (n) => cs() + A.num(r2(n));
  const FIN = { label: L('Open My Finance', 'Buka My Finance'), href: 'Finance.dc.html' };
  const todayD = new Date(); const todayS = iso(todayD);
  const daysInMonth = new Date(todayD.getFullYear(), todayD.getMonth() + 1, 0).getDate();
  const dayNo = todayD.getDate();
  const spends = R.spends || [];

  const spendIn = (from, to, cat) => spends.filter((x) => x.date >= from && x.date < to && (cat ? x.cat === cat : x.cat !== 'Savings'));
  const debtLeft = () => { try { return DB.debtSummary(R.debts || DB.DEBT_EMPTY).toPay || 0; } catch (e) { return 0; } };
  const monthSpend = () => sum(spendIn(todayS.slice(0, 7) + '-01', iso(addDays(todayD, 1))), (x) => x.amt);
  const ML = () => calcLeft({ ym: todayS.slice(0, 7), income: s.income || 0, commit: R.commit || 0, spends });
  const free = () => ML().left;

  // --- safety first ---
  if (/(bunuh diri|nak mati|tak nak hidup|taknak hidup|mahu mati|suicide|kill myself|end my life|hurt myself|cederakan diri|tamatkan hidup)/.test(ql)) {
    return done(mk(L('I am really sorry you feel this heavy. You matter, and you do not have to carry this alone. Please reach out to someone you trust right now, or call Befrienders KL at 03-7627 2929 (24 hours), Talian Kasih at 15999, or 999 if you are in danger. I can stay with you here too.', 'Saya sangat bersimpati awak rasa seberat ini. Awak penting dan awak tak perlu tanggung seorang diri. Tolong hubungi orang yang awak percaya sekarang, atau telefon Befrienders KL di 03-7627 2929 (24 jam), Talian Kasih 15999, atau 999 jika awak dalam bahaya. Saya pun ada di sini menemani awak.')));
  }

  // --- yes / no is handled in ask(); here: waiting for a missing piece (event date) ---
  if (ctx.await && ctx.await.type === 'eventdate') {
    const fd = findDate(ql);
    if (fd) {
      const ev = { type: 'event', name: ctx.await.name, date: fd.date, remind: '1 day before' };
      return done(mk(L('Added "' + ev.name + '" on ' + fmt(ev.date) + ' to Date & Events, with a reminder 1 day before.', 'Dah tambah "' + ev.name + '" pada ' + fmt(ev.date) + ' dalam Date & Events, dengan peringatan 1 hari sebelum.'), { big: fmt(ev.date), bigLbl: ev.name, color: '#7c9cff', label: L('Open Daily Planner', 'Buka Daily Planner'), href: 'Planner.dc.html' }), {}, ev, {});
    }
    if (has(['batal', 'cancel', 'tak jadi', 'tidak jadi', 'skip', 'forget'])) return done(mk(L('Okay, I dropped it.', 'Baik, saya batalkan.')), {}, null, {});
  }

  // --- actions ---
  // note
  let mt = ql.match(/^(?:tolong\s+)?(?:catat|catatkan|nota|note|tulis|jot|simpan nota|save note|write down)\s*(?:nota|note|that|bahawa)?\s*[:\-]?\s*(.+)$/);
  if (mt && mt[1].trim().length > 1 && !/^(saya|i)\s+(belanja|spent)/.test(mt[1])) {
    const text = mt[1].trim(); const body = text.charAt(0).toUpperCase() + text.slice(1);
    return done(mk(L('Saved to Notes: "' + body + '".', 'Disimpan dalam Nota: "' + body + '".'), { label: L('Open Notes', 'Buka Nota'), href: 'Notes.dc.html' }), {}, { type: 'note', title: body.slice(0, 40), text: body });
  }
  // event
  mt = ql.match(/^(?:tolong\s+)?(?:tambah|tambahkan|add|buat|set|create|simpan|book)\s+(?:satu\s+|an?\s+)?(?:acara|event|temujanji|appointment|janji temu|meeting|mesyuarat|birthday|hari lahir)\s*(.*)$/)
    || ql.match(/^(?:tolong\s+)?(?:ingatkan saya|remind me)\s+(?:about|tentang|pasal|to|untuk)?\s*(.+)$/);
  if (mt && mt[1] && mt[1].trim()) {
    const fd = findDate(mt[1]); let name = mt[1];
    if (fd) name = name.replace(fd.span.trim(), ' ');
    name = name.replace(/\b(pada|on|at|by|untuk|for|sebelum|before|ke|tarikh|date)\b\s*$/g, ' ').replace(/^\s*(pada|on|at|untuk|for|tentang|about)\b/, ' ').replace(/\s+/g, ' ').trim();
    if (name) {
      name = name.charAt(0).toUpperCase() + name.slice(1);
      if (!fd) return done(mk(L('Sure. What date is "' + name + '"? You can say tomorrow, Friday or 20 Nov.', 'Boleh. "' + name + '" pada tarikh bila? Awak boleh cakap esok, Jumaat atau 20 Nov.')), {}, null, { await: { type: 'eventdate', name } });
      const ev = { type: 'event', name, date: fd.date, remind: '1 day before' };
      return done(mk(L('Added "' + name + '" on ' + fmt(fd.date) + ' to Date & Events, with a reminder 1 day before.', 'Dah tambah "' + name + '" pada ' + fmt(fd.date) + ' dalam Date & Events, dengan peringatan 1 hari sebelum.'), { big: fmt(fd.date), bigLbl: name, color: '#7c9cff', label: L('Open Daily Planner', 'Buka Daily Planner'), href: 'Planner.dc.html' }), {}, ev, {});
    }
  }
  // task with a due date / priority, or "remind me / don't forget"
  mt = ql.match(/^(?:tolong\s+)?(?:tambah|tambahkan|add|buat|create|new)\s+(?:satu\s+)?(?:tugasan|tugas|task|todo)\s*[:\-]?\s*(.*)$/)
    || ql.match(/^(?:tolong\s+)?(?:jangan lupa|don't forget|dont forget|kena ingat|ingat untuk|remember to)\s+(.+)$/);
  if (mt && mt[1] && mt[1].trim()) {
    const fd = findDate(mt[1]); let name = mt[1]; let prio = 'Medium';
    if (/\b(penting|urgent|segera|high priority|keutamaan tinggi|important)\b/.test(name)) { prio = 'High'; name = name.replace(/\b(penting|urgent|segera|high priority|keutamaan tinggi|important)\b/g, ' '); }
    if (/\b(low priority|tak penting|tidak penting|keutamaan rendah)\b/.test(name)) { prio = 'Low'; name = name.replace(/\b(low priority|tak penting|tidak penting|keutamaan rendah)\b/g, ' '); }
    if (fd) name = name.replace(fd.span.trim(), ' ');
    name = name.replace(/\b(pada|on|by|sebelum|before|due)\s*$/g, ' ').replace(/\s+/g, ' ').trim();
    if (name) {
      name = name.charAt(0).toUpperCase() + name.slice(1);
      const open = s.tasks.filter((t) => t.s !== 'done');
      const act = { type: 'task', name, due: fd ? fd.date : '', prio };
      return done(mk(L('Added task "' + name + '"' + (fd ? ', due ' + fmt(fd.date) : '') + (prio !== 'Medium' ? ', priority ' + prio : '') + '. You now have ' + (open.length + 1) + ' open tasks.', 'Dah tambah tugasan "' + name + '"' + (fd ? ', tarikh ' + fmt(fd.date) : '') + (prio !== 'Medium' ? ', keutamaan ' + prio : '') + '. Awak ada ' + (open.length + 1) + ' tugasan belum siap.'), { big: String(open.length + 1), bigLbl: L('open tasks', 'tugasan belum siap'), color: '#7c9cff', label: L('Open Daily Planner', 'Buka Daily Planner'), href: 'Planner.dc.html' }), { tasks: s.tasks.concat([{ n: name, d: fd ? fd.date : '', s: 'todo' }]) }, act, {});
    }
  }
  // mark a task done
  if (has(['tandakan', 'mark', 'dah siap', 'sudah siap', 'dah settle', 'selesai', 'siap', 'done', 'finished', 'completed', 'complete', 'settled']) && !has(['berapa', 'how many', 'apa', 'what', 'bila', 'when'])) {
    const open = (R.plTasks || []).filter((t) => t.status !== 'done');
    const stop = ['tandakan', 'mark', 'dah', 'sudah', 'siap', 'selesai', 'done', 'finished', 'completed', 'complete', 'tugasan', 'task', 'as', 'sebagai', 'saya', 'i', 'the', 'itu', 'ini', 'yang', 'tu', 'dengan', 'dah', 'settle', 'settled'];
    const qt = qn.split(' ').filter((w) => w.length > 2 && stop.indexOf(w) < 0);
    let best = null, bs = 0, tie = false;
    open.forEach((t) => { const nt = A.norm(t.name).split(' '); const sc = qt.filter((w) => nt.some((x) => x === w || (w.length > 3 && (x.indexOf(w) === 0 || w.indexOf(x) === 0)))).length; if (sc > bs) { bs = sc; best = t; tie = false; } else if (sc === bs && sc > 0) tie = true; });
    if (best && bs > 0 && !tie) {
      return done(mk(L('Nice. I marked "' + best.name + '" as done.', 'Bagus. Saya dah tandakan "' + best.name + '" siap.'), { label: L('Open Daily Planner', 'Buka Daily Planner'), href: 'Planner.dc.html' }), { tasks: s.tasks.map((t) => (t.n === best.name ? { ...t, s: 'done' } : t)) }, { type: 'taskdone', id: best.id });
    }
    if (tie) return done(mk(L('I found more than one task like that. Please say a bit more of the task name.', 'Ada lebih daripada satu tugasan seakan itu. Sila sebut sedikit lagi nama tugasan.')));
    if (open.length && has(['tandakan', 'mark']) ) return done(mk(L('I could not find that task. Your open tasks:\n', 'Saya tak jumpa tugasan itu. Tugasan belum siap:\n') + open.slice(0, 5).map((t) => '• ' + t.name).join('\n')));
  }
  // undo the last spending
  if (has(['padam', 'buang', 'delete', 'remove', 'undo', 'batalkan']) && has(['belanja', 'spending', 'spend', 'rekod terakhir', 'last record', 'terakhir', 'last', 'tadi'])) {
    const last = spends.slice().sort((a, b) => b.id - a.id)[0];
    if (!last) return done(mk(L('There is no spending to remove.', 'Tiada belanja untuk dibuang.')));
    const id = s.pid + 1;
    return done(mk(L('Remove your latest spending?\n• ' + last.name + ' (' + last.cat + ')\n• ' + fmt(last.date), 'Buang belanja terbaru awak?\n• ' + last.name + ' (' + last.cat + ')\n• ' + fmt(last.date)), { pid: id, big: rm(last.amt), bigLbl: last.name, color: '#ff8fab' }), { pending: { id, type: 'undoSpend', sid: last.id, name: last.name, amt: last.amt }, pid: id });
  }

  // --- everyday questions ---
  if (/(pukul berapa|jam berapa|what time|time now|time is it|masa sekarang)/.test(ql)) {
    const d = new Date(); return done(mk(L('It is ' + A.hm() + ' now.', 'Sekarang pukul ' + A.hm() + '.')));
  }
  if (/(hari apa|what day|tarikh hari|today.s date|date today|tarikh berapa|what.s the date|tarikh ini)/.test(ql)) {
    const d = new Date(); const nm = lang === 'ms' ? WD_MS[d.getDay()] : WD_EN[d.getDay()];
    return done(mk(L('Today is ' + nm + ', ' + d.getDate() + ' ' + MN[d.getMonth()] + ' ' + d.getFullYear() + '.', 'Hari ini ' + nm + ', ' + d.getDate() + ' ' + MN[d.getMonth()] + ' ' + d.getFullYear() + '.')));
  }
  // calculator
  const pc = ql.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of|daripada|dari|drpd)\s*(?:rm\s*)?(\d+(?:\.\d+)?)/);
  if (pc) { const v = r2(Number(pc[1]) / 100 * Number(pc[2])); return done(mk(L(pc[1] + '% of ' + pc[2] + ' is ' + A.num(v) + '.', pc[1] + '% daripada ' + pc[2] + ' ialah ' + A.num(v) + '.'), { big: A.num(v), bigLbl: pc[1] + '% × ' + pc[2], color: '#8fe9e2' })); }
  const ex = ql.replace(/rm\s*/g, '').replace(/[×x](?=\s*\d)/g, '*').replace(/÷/g, '/').replace(/,/g, '').match(/(?:^|[^\w.])(\(?\s*\d+(?:\.\d+)?\s*(?:[+\-*\/]\s*\(?\s*\d+(?:\.\d+)?\s*\)?\s*)+)/);
  if (ex && /[+*]|\s[-\/]\s/.test(ex[1])) {
    const v = calc(ex[1]); if (v !== null && isFinite(v)) return done(mk(L(ex[1].trim() + ' = ' + A.num(r2(v)), ex[1].trim() + ' = ' + A.num(r2(v))), { big: A.num(r2(v)), bigLbl: ex[1].trim(), color: '#8fe9e2' }));
  }
  // small talk
  if (/^(apa khabar|how are you|how r u|you ok|awak ok|kau ok|sihat ke|apa cerita|how.s it going)/.test(ql)) {
    return done(mk(L('I am doing well, thank you for asking. I am ready whenever you need me. How is your day going, ' + A.fn() + '?', 'Saya baik, terima kasih tanya. Saya sedia bila-bila masa. Macam mana hari awak, ' + A.fn() + '?')));
  }
  if (/(selamat pagi|good morning|selamat tengah hari|selamat petang|good afternoon|good evening|selamat malam|good night)/.test(ql)) {
    const h = todayD.getHours(); const night = /(selamat malam|good night)/.test(ql);
    const pg = /pagi|morning/.test(ql), tg = /tengah hari|afternoon/.test(ql);
    const g = night ? L('Good night, ' + A.fn() + '. Rest well. Fajr is not far away.', 'Selamat malam, ' + A.fn() + '. Rehat secukupnya. Subuh pun tak lama lagi.')
      : (pg || (!tg && h < 12)) ? L('Good morning, ' + A.fn() + '!', 'Selamat pagi, ' + A.fn() + '!') : h < 18 ? L('Good afternoon, ' + A.fn() + '!', 'Selamat petang, ' + A.fn() + '!') : L('Good evening, ' + A.fn() + '!', 'Selamat petang, ' + A.fn() + '!');
    const np = A.nextPrayer(); const open = s.tasks.filter((t) => t.s !== 'done');
    const bits = []; if (!night) { if (np) bits.push(L('Next prayer: ' + np.name + ' at ' + np.time + '.', 'Solat seterusnya: ' + np.name + ' pada ' + np.time + '.')); if (open.length) bits.push(L('You have ' + open.length + ' open tasks.', 'Awak ada ' + open.length + ' tugasan belum siap.')); }
    return done(mk(g + (bits.length ? ' ' + bits.join(' ') : '')));
  }
  if (/(assalamualaikum|salam)\b/.test(ql) && !/(terima|kenapa)/.test(ql)) return done(mk(L('Waalaikumussalam, ' + A.fn() + '. How can I help you today?', 'Waalaikumussalam, ' + A.fn() + '. Apa yang boleh saya bantu hari ini?')));
  if (/(joke|lawak|jenaka|buat lawak|funny)/.test(ql)) {
    const J = [
      [L('Why did the phone go to the doctor? It lost its signal.', 'Kenapa telefon pergi jumpa doktor? Sebab hilang signal.')],
      [L('I told my wallet we are saving this month. It laughed.', 'Saya cakap kat dompet kita nak jimat bulan ni. Dia gelak.')],
      [L('My step counter and I have the same goal: both of us just want a rest.', 'Pengira langkah dan saya ada matlamat sama: dua-dua nak berehat.')],
      [L('Why do programmers love dark mode? Because light attracts bugs.', 'Kenapa pengaturcara suka mod gelap? Sebab cahaya tarik pepijat.')],
    ];
    return done(mk(J[Math.floor(Math.random() * J.length)][0]));
  }
  if (/(motivasi|motivation|motivate|semangat|inspire|beri semangat|kata.kata)/.test(ql)) {
    const M = [
      L('Small steps, taken every day, go further than big plans that never start.', 'Langkah kecil setiap hari pergi lebih jauh daripada rancangan besar yang tak pernah bermula.'),
      L('You do not have to do everything today. Do the next one thing well.', 'Awak tak perlu buat semuanya hari ini. Buat satu perkara seterusnya dengan baik.'),
      L('Progress is progress, even when it is slow. Keep going.', 'Kemajuan tetap kemajuan, walaupun perlahan. Teruskan.'),
      L('Be kind to yourself. Rest is part of the work.', 'Berbaik dengan diri sendiri. Rehat sebahagian daripada kerja.'),
    ];
    return done(mk(M[Math.floor(Math.random() * M.length)]));
  }
  if (/(penat|letih|tired|exhausted|kepenatan|lesu)/.test(ql) && !has(['berapa', 'how many'])) {
    const tips = []; if (D.sleep && D.sleep < 6) tips.push(L('You only slept ' + D.sleep + ' hours, so it makes sense.', 'Awak tidur ' + D.sleep + ' jam sahaja, jadi memang patut penat.')); if (s.cups < D.cupGoal / 2) tips.push(L('A glass of water may help, you have had ' + s.cups + ' so far.', 'Segelas air mungkin membantu, awak baru minum ' + s.cups + ' gelas.'));
    return done(mk(L('That sounds tiring. ', 'Kedengarannya memang memenatkan. ') + tips.join(' ') + L(' Try a short break, some water and a few slow breaths. If it stays like this for days, it is worth resting properly or seeing a doctor.', ' Cuba rehat sekejap, minum air dan tarik nafas perlahan. Kalau berterusan beberapa hari, elok rehat secukupnya atau jumpa doktor.')));
  }
  if (/(stress|stres|serabut|tertekan|overwhelm|pening kepala|risau|worried|anxious|cemas|runsing)/.test(ql)) {
    const top = priority(A).slice(0, 1)[0];
    return done(mk(L('That is a lot to carry. Take a slow breath in and out first. ', 'Memang banyak yang awak tanggung. Tarik nafas perlahan dulu. ') + (top ? L('If you want, just do one thing now: "' + top.name + '". The rest can wait. ', 'Kalau boleh, buat satu perkara sahaja sekarang: "' + top.name + '". Yang lain boleh tunggu. ') : '') + L('A short zikir or prayer can also settle the heart. If this feels too heavy, please talk to someone you trust.', 'Zikir atau solat ringkas juga boleh menenangkan hati. Kalau terasa terlalu berat, cakaplah dengan orang yang awak percaya.'), { label: L('Open Al-Ma\'thurat', 'Buka Al-Ma\'thurat'), href: 'Mathurat.dc.html' }));
  }
  if (/(sedih|sad|down|kecewa|lonely|sunyi|bosan|bored)/.test(ql) && !has(['berapa'])) {
    return done(mk(/(bosan|bored)/.test(ql) ? L('Bored? You could walk a bit, read a few pages of the Quran, or plan tomorrow. Want me to show your open tasks?', 'Bosan? Awak boleh berjalan sekejap, baca beberapa ayat Quran atau rancang esok. Nak saya tunjuk tugasan awak?') : L('I am sorry you feel that way. It is okay not to be okay. Maybe talk to someone close, take a short walk, or rest a bit. I am here if you want to chat.', 'Saya bersimpati awak rasa begitu. Tak apa kalau tak okey. Mungkin bercakap dengan orang rapat, berjalan sekejap atau berehat. Saya ada kalau awak nak berbual.')));
  }
  if (/(siapa saya|who am i|nama saya|my name)/.test(ql)) return done(mk(A.props.userName ? L('You are ' + A.props.userName + '. It is good to have you here.', 'Awak ialah ' + A.props.userName + '. Seronok awak ada di sini.') : L('I do not know your name yet. You can add it in Settings.', 'Saya belum tahu nama awak lagi. Awak boleh tambah dalam Settings.')));
  if (/(umur awak|how old are you|awak umur)/.test(ql)) return done(mk(L('I am brand new, so let us say I am very young. But I never forget your data.', 'Saya baru sangat, jadi boleh kata saya muda. Tapi saya sentiasa ingat data awak.')));
  if (/(jom borak|jom sembang|let.s chat|nak borak|nak sembang|boring la|temankan saya|accompany me)/.test(ql)) return done(mk(L('Sure, I am here. How was your day so far? You can also tell me what is on your mind.', 'Boleh, saya ada di sini. Macam mana hari awak setakat ini? Awak boleh cerita apa yang ada di fikiran.')));
  if (/(nak makan apa|makan apa|what to eat|what should i eat|lapar|hungry)/.test(ql)) { const lt = (todayD.getHours() < 11) ? L('breakfast', 'sarapan') : (todayD.getHours() < 16 ? L('lunch', 'makan tengah hari') : L('dinner', 'makan malam')); return done(mk(L('For ' + lt + ', something simple with protein and vegetables is a good choice, and drink water first. You have spent ' + rm(D.spendToday) + ' today' + (s.income ? ', and about ' + rm(Math.max(0, free()) / Math.max(1, daysInMonth - dayNo + 1)) + ' a day is available.' : '.'), 'Untuk ' + lt + ', pilih yang ringkas dengan protein dan sayur, dan minum air dulu. Awak dah belanja ' + rm(D.spendToday) + ' hari ini' + (s.income ? ', dan kira-kira ' + rm(Math.max(0, free()) / Math.max(1, daysInMonth - dayNo + 1)) + ' sehari masih ada.' : '.')))); }
  if (/(awak boleh buat apa|what can you do|apa yang awak boleh)/.test(ql)) return null; // base 'help'
  if (/(siapa awak|siapa kamu|awak siapa|who are you|what are you|awak ni apa)/.test(ql)) return null; // base 'who' text below
  if (/^(ya|yes|yup|ok|okay|boleh|tak|no|tidak|nope)$/.test(ql) && !s.pending) return done(mk(L('There is nothing waiting for me to confirm. What would you like to do?', 'Tiada apa yang menunggu pengesahan. Apa yang awak nak buat?')));
  if (/(cuaca|weather|hujan|rain|berita|news|harga emas|gold price|bola|football score|siapa perdana menteri|prime minister|saham|stock price|kurs|exchange rate)/.test(ql)) return done(mk(L('I work offline and only know your own data, so I cannot check things like weather, news or prices. I can help with your spending, health, prayers, motorcycle and tasks.', 'Saya berfungsi tanpa internet dan hanya tahu data awak sendiri, jadi saya tak boleh semak cuaca, berita atau harga. Saya boleh bantu tentang belanja, kesihatan, solat, motosikal dan tugasan.')));

  // --- analysis ---
  const isSpend = has(['belanja', 'spend', 'spent', 'spending', 'habis', 'perbelanjaan', 'expense', 'expenses', 'kos', 'cost', 'bayar', 'paid', 'duit keluar']);
  let cat = null; CATK.forEach((c) => { if (!cat && c[1].some((w) => (' ' + qn + ' ').indexOf(' ' + w + ' ') >= 0)) cat = c[0]; });
  const intent = A.pick(qn);

  if (has(['tabung', 'simpanan', 'savings goal', 'saving goal', 'savings goals', 'my savings', 'goal saya', 'matlamat simpanan', 'down payment', 'deposit motor', 'dana kahwin', 'wedding fund', 'travel fund', 'emergency fund', 'emergency savings']) && !has(['belanja', 'spend'])) {
    const G = R.goals || [];
    if (!G.length) return done(mk(L('You have no savings goal yet. Open My Finance, Savings Goals, then tap New goal.', 'Awak belum ada tabung. Buka My Finance, Savings Goals, kemudian tekan New goal.'), FIN), {}, null, {intent:'goals'});
    const AL = { kahwin: 'wedding', nikah: 'wedding', kereta: 'car', rumah: 'house', motosikal: 'motor', cuti: 'travel', kecemasan: 'emergency', perubatan: 'medical' }; const pick = G.filter((g) => qn.split(' ').some((w) => w.length > 3 && g.name.toLowerCase().indexOf(AL[w] || w) >= 0));
    const use = pick.length ? pick : G;
    const rows = use.map((g) => { const pc = g.target > 0 ? Math.min(100, Math.round(g.saved / g.target * 100)) : 0; return '• ' + g.name + (g.place ? ' (' + g.place + ')' : '') + ': ' + rm(g.saved) + (g.target > 0 ? ' / ' + rm(g.target) + ' (' + pc + '%)' : '') + (!(g.target > 0) ? L(' (no target set yet)', ' (belum ada sasaran)') : g.saved >= g.target ? L(', reached', ', tercapai') : L(', ' + rm(g.target - g.saved) + ' to go', ', baki ' + rm(g.target - g.saved))); });
    const tot = G.reduce((a, g) => a + g.saved, 0);
    return done(mk(L('Your savings goals:\n', 'Tabung awak:\n') + rows.join('\n') + (use.length > 1 ? L('\nTotal saved: ', '\nJumlah simpanan: ') + rm(tot) : ''), FIN), {}, null, {intent:'goals'});
  }
  if (has(['baki hutang', 'hutang tinggal', 'hutang saya', 'berapa hutang', 'debt left', 'how much debt', 'my debt', 'my debts'])) {
    try { const ds = DB.debtSummary(R.debts || DB.DEBT_EMPTY); return done(mk(ds.totalLeft > 0 ? L('Your debt balance left is ' + rm(ds.totalLeft) + '. This month you still have ' + rm(ds.toPay) + ' of commitments to pay.', 'Baki hutang awak ' + rm(ds.totalLeft) + '. Bulan ini awak masih ada ' + rm(ds.toPay) + ' komitmen untuk dibayar.') : L('You have no debt balance. This month you still have ' + rm(ds.toPay) + ' of commitments to pay.', 'Awak tiada baki hutang. Bulan ini masih ada ' + rm(ds.toPay) + ' komitmen untuk dibayar.'), Object.assign({ big: rm(ds.totalLeft), bigLbl: L('debt left', 'baki hutang'), color: '#ff8fab' }, FIN))); } catch (e) { /* fall through */ }
  }
  if (has(['had', 'limit', 'limits', 'bajet kategori', 'budget kategori', 'category budget', 'budget limit']) && !has(['sehari', 'daily', 'hari ini']) && (cat || has(['kategori', 'category', 'semua', 'all']))) {
    const LM = R.limits || {}; const m0 = todayS.slice(0, 7) + '-01'; const cur = spendIn(m0, iso(addDays(todayD, 1)));
    const cats = cat ? [cat] : Object.keys(LM);
    const rows = cats.filter((k) => LM[k] > 0).map((k) => { const t = sum(cur.filter((x) => x.cat === k), (x) => x.amt); const r = t / LM[k]; return '• ' + k + ': ' + rm(t) + ' / ' + rm(LM[k]) + (r > 1 ? L(' (over by ' + rm(t - LM[k]) + ')', ' (lebih ' + rm(t - LM[k]) + ')') : L(' (' + rm(LM[k] - t) + ' left)', ' (baki ' + rm(LM[k] - t) + ')')); });
    return done(rows.length ? mk(L('Your category limits this month:\n', 'Had kategori awak bulan ini:\n') + rows.join('\n'), FIN) : mk(L('No category limit is set yet. Open My Finance, Spending by Category, and tap Set limit.', 'Belum ada had kategori. Buka My Finance, Spending by Category, dan tekan Set limit.'), FIN), {}, null, { intent: 'spend' });
  }
  const blockL = has(['hutang', 'debt', 'odometer', 'servis', 'service', 'langkah', 'steps', 'solat', 'prayer', 'tugasan', 'task', 'gelas', 'minum', 'quran', 'puasa']);
  const moneyW = has(['duit', 'wang', 'gaji', 'income', 'pendapatan', 'money', 'belanja', 'bulan', 'month', 'rm', 'spend', 'baki', 'komitmen']);
  if (!blockL && moneyW && has(['kenapa', 'why', 'sebab']) && has(['baki', 'tinggal', 'left', 'money', 'duit', 'wang']) && has(['rendah', 'kurang', 'sikit', 'low', 'habis', 'little', 'cepat', 'less', 'small', 'tak banyak'])) return done(whyLow(), {}, null, { intent: 'left' });
  if (!blockL && (moneyW || intent === 'left' || /\b(how much|what|whats|berapa|apa)\b.*\b(left|baki|tinggal)\b/.test(qn)) && (has(['baki', 'tinggal', 'sisa', 'money left', 'left to spend', 'remaining', 'berapa lagi']) || /\bleft\b/.test(qn) || intent === 'left') && !has(['hari lagi', 'days left']) && (!per || per.k === 'month')) return done(leftMsg(), {}, null, { intent: 'left' });
  if (has(['amaran', 'alert', 'alerts', 'notifikasi bajet', 'budget alert']) && has(['bajet', 'budget', 'belanja', 'baki', 'money'])) return done(mk(L('Budget alerts are in My Finance, under Money Left. Turn them on and I notify you when you have used 80% of your income, when you go over the daily limit, or when you go over budget.', 'Amaran bajet ada dalam My Finance, di bawah Money Left. Hidupkan dan saya akan beritahu bila awak dah guna 80% pendapatan, melebihi had harian, atau terlebih bajet.'), FIN));
  if (has(['kenapa', 'why', 'sebab apa', 'punca']) && (isSpend || has(['banyak', 'tinggi', 'high', 'mahal', 'much', 'duit']))) {
    return done(analyseSpend(), {}, null, { intent: 'spend', period: 'month' });
  }
  if (has(['jimat', 'save money', 'saving tips', 'tips jimat', 'kurangkan', 'reduce spending', 'cut spending', 'boleh jimat', 'simpan lebih', 'save more'])) return done(savings(), {}, null, { intent: 'spend', period: 'month' });
  if (has(['bajet', 'budget', 'baki sehari', 'boleh belanja sehari', 'daily budget', 'per day', 'sehari']) && (has(['berapa', 'how much', 'boleh', 'can', 'baki', 'left', 'bajet', 'budget']))) return done(budget());
  const af = ql.match(/(?:mampu|afford|boleh ke saya beli|boleh saya beli|can i afford|can i buy|patut ke saya beli|should i buy|worth it).*?rm\s*([\d,]+(?:\.\d+)?)/) || ql.match(/rm\s*([\d,]+(?:\.\d+)?).*?(?:mampu|afford|boleh ke|patut ke|worth)/);
  if (af) return done(afford(parseFloat(af[1].replace(/,/g, ''))));
  if (has(['akhir bulan', 'end of month', 'ramal', 'predict', 'projection', 'anggaran belanja', 'forecast']) && (isSpend || has(['bulan', 'month']))) return done(projection());
  if ((has(['prestasi', 'progress', 'ulasan', 'review', 'rumusan minggu', 'weekly review', 'how was my week', 'how is my week']) || (has(['macam mana minggu']) && ['steps', 'dist', 'sleep', 'water', 'mood', 'spend'].indexOf(intent) < 0 && !isSpend)) || (has(['minggu ini', 'this week']) && has(['ringkasan', 'summary', 'macam mana', 'how']) && ['steps', 'dist', 'sleep', 'water', 'mood', 'spend'].indexOf(intent) < 0 && !isSpend))
    return done(review(), {}, null, { intent: 'review' });
  if (has(['patut buat dulu', 'buat dulu', 'keutamaan', 'priority', 'prioritise', 'prioritize', 'do first', 'what first', 'mana dulu', 'urgent', 'paling penting', 'most important']) && !has(['tambah', 'add'])) return done(priorityMsg());
  if (has(['belanja terakhir', 'last spending', 'latest spending', 'last expense', 'rekod terakhir', 'belanja tadi', 'recent spending', 'belanja terkini'])) {
    const last = spends.slice().sort((a, b) => b.id - a.id).slice(0, 4);
    return done(mk(last.length ? L('Your latest spending:\n', 'Belanja terkini awak:\n') + last.map((x) => '• ' + fmt(x.date) + ' · ' + x.name + ' · ' + rm(x.amt)).join('\n') : L('No spending logged yet.', 'Belum ada belanja direkod.'), FIN));
  }
  if (has(['paling mahal', 'biggest purchase', 'most expensive', 'terbesar', 'largest']) && isSpend) {
    const pr = per || period(' bulan ini '); const l = spendIn(pr.from, pr.to).sort((a, b) => b.amt - a.amt)[0];
    return done(l ? mk(L('Your biggest single spending ' + pr.en + ' was ' + l.name + ' at ' + rm(l.amt) + ' on ' + fmt(l.date) + '.', 'Belanja tunggal terbesar ' + pr.ms + ' ialah ' + l.name + ' sebanyak ' + rm(l.amt) + ' pada ' + fmt(l.date) + '.'), Object.assign({ big: rm(l.amt), bigLbl: l.name, color: '#ffc46b' }, FIN)) : mk(L('No spending found ' + pr.en + '.', 'Tiada belanja ' + pr.ms + '.')));
  }

  // --- periods and follow-ups ---
  const metrics = metricsOf(A);
  const mkey = intent === 'steps' || intent === 'dist' ? 'steps' : intent === 'sleep' ? 'sleep' : intent === 'water' ? 'water' : intent === 'mood' ? 'mood' : null;
  const short = qn.split(' ').length <= 6;
  const follow = has(['pula', 'lagi', 'how about', 'what about', 'and', 'dan', 'macam mana dengan', 'yang']) || /^(bulan|minggu|semalam|last|this|yesterday|kelmarin|tahun)/.test(qn);
  const hasOwn = intent && ['greet', 'thanks', 'who', 'help'].indexOf(intent) < 0;

  // spend with a period or category
  if ((isSpend || intent === 'spend') && (per || cat)) {
    const p = per || period(' bulan ini '); return done(spendAnswer(p, cat, has(['senarai', 'list', 'apa je', 'what all', 'semua', 'butir', 'detail', 'details'])), {}, null, { intent: 'spend', period: p.k, pObj: p, cat });
  }
  if (isSpend && has(['purata', 'average', 'avg', 'min'])) { const p = per || period(' bulan ini '); return done(spendAnswer(p, cat, false), {}, null, { intent: 'spend', period: p.k, pObj: p, cat }); }
  // health numbers over a period
  if (mkey && per && per.k !== 'today') return done(metricAnswer(mkey, per), {}, null, { intent: 'metric', mkey, pObj: per });
  if (mkey && has(['purata', 'average', 'avg', 'biasa', 'usually', 'selalu']) && !per) { const p = period(' last 7 days '); return done(metricAnswer(mkey, p), {}, null, { intent: 'metric', mkey, pObj: p }); }
  // income last month
  if ((intent === 'income' || has(['gaji', 'pendapatan', 'income', 'salary'])) && per && per.k === 'lmonth') {
    const v = R.incomeLast || 0; return done(mk(v ? L('Last month your income was ' + rm(v) + '.', 'Pendapatan bulan lepas ialah ' + rm(v) + '.') : L('No income was logged last month.', 'Tiada pendapatan direkod bulan lepas.'), Object.assign({ big: v ? rm(v) : '', bigLbl: L('last month', 'bulan lepas'), color: '#34d399' }, FIN)));
  }
  // tasks / events on a day or week
  if ((intent === 'tasks' || intent === 'due' || intent === 'events' || has(['agenda', 'jadual', 'schedule', 'apa ada', 'what do i have', 'plan', 'rancangan'])) && (findDate(ql) || per)) {
    const fd = findDate(ql); let from, to, lab;
    if (fd && !(per && per.k === 'week')) { from = fd.date; to = iso(addDays(new Date(fd.date + 'T12:00:00'), 1)); lab = fmt(fd.date); } else { const p = per || period(' this week '); from = p.from; to = p.to; lab = L(p.en, p.ms); }
    if (!fd && per && (per.k === 'week')) { to = iso(addDays(new Date(per.from + 'T12:00:00'), 7)); }
    const tk = (R.plTasks || []).filter((t) => t.status !== 'done' && t.due && t.due >= from && t.due < to);
    const ev = (R.plEvents || []).filter((e) => !e.done && e.date >= from && e.date < to);
    const lines = ev.map((e) => '• ' + L('Event', 'Acara') + ': ' + e.name + ' (' + fmt(e.date) + ')').concat(tk.map((t) => '• ' + L('Task', 'Tugasan') + ': ' + t.name + ' (' + fmt(t.due) + ')'));
    return done(mk(lines.length ? L('On your list for ' + lab + ':\n', 'Dalam senarai awak untuk ' + lab + ':\n') + lines.join('\n') : L('Nothing planned for ' + lab + '. A clear day.', 'Tiada rancangan untuk ' + lab + '. Hari yang lapang.'), { label: L('Open Daily Planner', 'Buka Daily Planner'), href: 'Planner.dc.html' }));
  }
  // follow-up questions that rely on the last topic
  if (ctx.intent && short && (follow || per || cat) && (!hasOwn || ((per || cat) && ['mmonth', 'mcmp', 'spend', 'spendM', 'steps', 'sleep', 'water', 'mood', 'dist', 'income'].indexOf(intent) >= 0) || has(['pula', 'pulak', 'how about', 'what about', 'macam mana dengan']))) {
    const p = per || ctx.pObj || null;
    if (ctx.intent === 'spend') { const pp = per || ctx.pObj || period(' bulan ini '); return done(spendAnswer(pp, cat || ctx.cat || null, false), {}, null, { intent: 'spend', period: pp.k, pObj: pp, cat: cat || ctx.cat || null }); }
    if (ctx.intent === 'metric' && p) return done(metricAnswer(ctx.mkey, p), {}, null, { intent: 'metric', mkey: ctx.mkey, pObj: p });
  }
  if (ctx.intent === 'spend' && has(['kenapa', 'why', 'terangkan', 'explain', 'lagi', 'detail', 'butiran']) && short) return done(analyseSpend(), {}, null, ctx);
  if (ctx.intent === 'spend' && has(['senarai', 'list', 'apa je', 'semua']) && short) { const pp = ctx.pObj || period(' bulan ini '); return done(spendAnswer(pp, ctx.cat || null, true), {}, null, ctx); }
  if (has(['yang tadi', 'tadi tu', 'ulang', 'repeat', 'again', 'sekali lagi']) && short && s.msgs.length) {
    const prev = s.msgs.slice().reverse().find((m) => !m.me); if (prev) return done(Object.assign({}, prev, { time: A.hm() }));
  }

  return null;

  // ======== helpers (closures over the data above) ========
  function spendAnswer(p, c, list) {
    const sp = spendIn(p.from, p.to, c); const tot = sum(sp, (x) => x.amt);
    const lab = L(p.en, p.ms) + (c ? ' · ' + c : '');
    if (!sp.length) return mk(L('No spending logged ' + p.en + (c ? ' for ' + c : '') + '.', 'Tiada belanja direkod ' + p.ms + (c ? ' untuk ' + c : '') + '.'), FIN);
    const end = p.to > iso(addDays(todayD, 1)) ? iso(addDays(todayD, 1)) : p.to;
    const el = Math.max(1, Math.round((new Date(end + 'T12:00:00') - new Date(p.from + 'T12:00:00')) / 86400000));
    const avg = tot / el;
    const len = p.days; const pf = iso(addDays(new Date(p.from + 'T12:00:00'), -len)); const prevT = sum(spendIn(pf, p.from, c), (x) => x.amt);
    const by = {}; sp.forEach((x) => { by[x.cat] = (by[x.cat] || 0) + x.amt; }); const cats = Object.keys(by).sort((a, b) => by[b] - by[a]).slice(0, 3);
    let t = L('You spent ' + rm(tot) + ' ' + p.en + (c ? ' on ' + c : '') + ', in ' + sp.length + ' records, about ' + rm(avg) + ' a day.', 'Awak belanja ' + rm(tot) + ' ' + p.ms + (c ? ' untuk ' + c : '') + ', dalam ' + sp.length + ' rekod, kira-kira ' + rm(avg) + ' sehari.');
    if (!c && cats.length > 1) t += '\n' + L('Top: ', 'Teratas: ') + cats.map((k) => k + ' ' + rm(by[k])).join(', ') + '.';
    if (prevT > 0 && p.k !== 'year' && tot / prevT < 6) { const df = tot - prevT; const pp = Math.round(Math.abs(df) / prevT * 100); t += '\n' + L('Before that period: ' + rm(prevT) + ' (' + (df >= 0 ? '+' : '-') + pp + '%).', 'Tempoh sebelum itu: ' + rm(prevT) + ' (' + (df >= 0 ? '+' : '-') + pp + '%).'); }
    if (list) t += '\n' + sp.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6).map((x) => '• ' + fmt(x.date) + ' · ' + x.name + ' · ' + rm(x.amt)).join('\n');
    return mk(t, Object.assign({ big: rm(tot), bigLbl: lab, color: '#ffc46b' }, FIN));
  }
  function metricAnswer(key, p) {
    const M = metrics[key]; const days = R.days || {}; const vals = [];
    for (let d = new Date(p.from + 'T12:00:00'); iso(d) < p.to; d = addDays(d, 1)) { const x = days[iso(d)]; if (!x) continue; let v = x[M.key]; if (key === 'mood') v = v >= 0 ? v + 1 : 0; if (v > 0) vals.push([iso(d), v]); }
    const nm = L(M.en, M.ms); const hab = { label: L('Open Habit & Health', 'Buka Habit & Health'), href: 'Habit.dc.html' };
    if (!vals.length) return mk(L('Nothing logged for ' + nm + ' ' + p.en + '.', 'Tiada rekod ' + nm + ' ' + p.ms + '.'), hab);
    const tot = sum(vals, (x) => x[1]); const avg = tot / vals.length; const best = vals.slice().sort((a, b) => b[1] - a[1])[0]; const worst = vals.slice().sort((a, b) => a[1] - b[1])[0];
    const f = (n) => (key === 'sleep' || key === 'mood' ? String(r2(n)) : A.num(Math.round(n)));
    const pc = Math.round(avg / M.goal * 100);
    let t = L('Over ' + vals.length + ' logged days ' + p.en + ', your average ' + nm + ' is ' + f(avg) + M.unit + ' a day (' + pc + '% of goal).', 'Dalam ' + vals.length + ' hari direkod ' + p.ms + ', purata ' + nm + ' awak ' + f(avg) + M.unit + ' sehari (' + pc + '% sasaran).');
    if (vals.length > 1) t += '\n' + L('Best day: ' + fmt(best[0]) + ' (' + f(best[1]) + M.unit + '). Lowest: ' + fmt(worst[0]) + ' (' + f(worst[1]) + M.unit + ').', 'Hari terbaik: ' + fmt(best[0]) + ' (' + f(best[1]) + M.unit + '). Terendah: ' + fmt(worst[0]) + ' (' + f(worst[1]) + M.unit + ').');
    if (key === 'steps' && vals.length > 1) t += '\n' + L('Total: ' + A.num(tot) + ' steps.', 'Jumlah: ' + A.num(tot) + ' langkah.');
    return mk(t, Object.assign({ big: f(avg) + M.unit, bigLbl: L('daily average', 'purata harian'), pct: Math.min(100, pc), color: key === 'sleep' ? '#b794ff' : key === 'mood' ? '#ff8fab' : '#5ee7df' }, hab));
  }
  function analyseSpend() {
    const m0 = todayS.slice(0, 7) + '-01'; const lm = iso(new Date(todayD.getFullYear(), todayD.getMonth() - 1, 1));
    const cur = spendIn(m0, iso(addDays(todayD, 1))); const prev = spendIn(lm, m0); const tc = sum(cur, (x) => x.amt); const tp = sum(prev, (x) => x.amt);
    if (!cur.length) return mk(L('There is no spending logged this month yet, so there is nothing high to explain.', 'Belum ada belanja direkod bulan ini, jadi tiada yang tinggi untuk diterangkan.'), FIN);
    const by = (l) => { const o = {}; l.forEach((x) => { o[x.cat] = (o[x.cat] || 0) + x.amt; }); return o; }; const bc = by(cur), bp = by(prev);
    const top = Object.keys(bc).sort((a, b) => bc[b] - bc[a])[0]; const big = cur.slice().sort((a, b) => b.amt - a.amt)[0];
    const lines = [];
    lines.push(L('This month so far: ' + rm(tc) + (tp ? ' versus ' + rm(tp) + ' for all of last month.' : '.'), 'Bulan ini setakat ini: ' + rm(tc) + (tp ? ' berbanding ' + rm(tp) + ' untuk sebulan penuh bulan lepas.' : '.')));
    lines.push(L('• Biggest category: ' + top + ' ' + rm(bc[top]) + ' (' + Math.round(bc[top] / tc * 100) + '%).', '• Kategori terbesar: ' + top + ' ' + rm(bc[top]) + ' (' + Math.round(bc[top] / tc * 100) + '%).'));
    lines.push(L('• Biggest single item: ' + big.name + ' ' + rm(big.amt) + '.', '• Satu belanja terbesar: ' + big.name + ' ' + rm(big.amt) + '.'));
    let up = null, ud = 0; Object.keys(bc).forEach((k) => { const d = bc[k] - (bp[k] || 0); if (d > ud) { ud = d; up = k; } });
    if (up && tp) lines.push(L('• Rose the most vs last month: ' + up + ' (+' + rm(ud) + ').', '• Naik paling banyak berbanding bulan lepas: ' + up + ' (+' + rm(ud) + ').'));
    lines.push(L('• About ' + rm(tc / dayNo) + ' a day, from ' + cur.length + ' records.', '• Kira-kira ' + rm(tc / dayNo) + ' sehari, daripada ' + cur.length + ' rekod.'));
    return mk(lines.join('\n'), Object.assign({ big: rm(tc), bigLbl: L('this month', 'bulan ini'), color: '#ffc46b' }, FIN));
  }
  function savings() {
    const m0 = todayS.slice(0, 7) + '-01'; const cur = spendIn(m0, iso(addDays(todayD, 1))); const tc = sum(cur, (x) => x.amt);
    if (!cur.length) return mk(L('Log a few spending records first and I can show you where to save.', 'Rekod beberapa belanja dulu dan saya boleh tunjuk di mana untuk jimat.'), FIN);
    const o = {}; cur.forEach((x) => { o[x.cat] = (o[x.cat] || 0) + x.amt; });
    const flex = ['Food', 'Shopping', 'Other', 'Petrol'].filter((k) => o[k]).sort((a, b) => o[b] - o[a]);
    const out = [L('Based on what you logged this month (' + rm(tc) + '):', 'Berdasarkan apa yang awak rekod bulan ini (' + rm(tc) + '):')];
    flex.slice(0, 2).forEach((k) => out.push(L('• ' + k + ' is ' + rm(o[k]) + '. Cutting it by 10% saves about ' + rm(o[k] * 0.1) + ' a month.', '• ' + k + ' ialah ' + rm(o[k]) + '. Kurangkan 10% jimat kira-kira ' + rm(o[k] * 0.1) + ' sebulan.')));
    const small = cur.filter((x) => x.amt <= 15); if (small.length >= 5) out.push(L('• ' + small.length + ' small spends of ' + cs() + '15 or less add up to ' + rm(sum(small, (x) => x.amt)) + '. Small things add up.', '• ' + small.length + ' belanja kecil RM15 ke bawah berjumlah ' + rm(sum(small, (x) => x.amt)) + '. Yang kecil pun terkumpul.'));
    if (s.income) out.push(L('• You have spent ' + Math.round(tc / s.income * 100) + '% of this month\'s income. A common goal is to keep ' + '20% for savings.', '• Awak dah belanja ' + Math.round(tc / s.income * 100) + '% pendapatan bulan ini. Sasaran biasa ialah simpan 20%.'));
    return mk(out.join('\n'), FIN);
  }
  function leftMsg() {
    const c = ML();
    if (!c.income) return mk(L('I do not see income for this month yet. Add it in My Finance, then ask again.', 'Saya belum nampak pendapatan bulan ini. Tambah dalam My Finance, kemudian tanya semula.'), FIN);
    const head = c.over ? L('You are over budget by ' + rm(-c.left) + ' this month.', 'Awak terlebih bajet ' + rm(-c.left) + ' bulan ini.') : L('You have ' + rm(c.left) + ' left to spend this month.', 'Awak ada ' + rm(c.left) + ' untuk dibelanjakan bulan ini.');
    const lines = [head, L('• Income ' + rm(c.income), '• Pendapatan ' + rm(c.income)), L('• Commitments ' + rm(c.commit), '• Komitmen ' + rm(c.commit)), L('• Spent ' + rm(c.spent), '• Belanja ' + rm(c.spent))];
    if (!c.over && c.daysLeft > 0) lines.push(L('About ' + rm(c.allowance) + ' a day for ' + c.daysLeft + ' days.', 'Kira-kira ' + rm(c.allowance) + ' sehari untuk ' + c.daysLeft + ' hari.'));
    return mk(lines.join('\n'), Object.assign({ big: rm(Math.abs(c.left)), bigLbl: c.over ? L('over budget', 'terlebih') : L('left this month', 'baki bulan ini'), pct: Math.min(100, Math.round(c.used * 100)), color: c.over ? '#ff8fab' : '#34d399' }, FIN));
  }
  function whyLow() {
    const c = ML();
    if (!c.income) return mk(L('I need this month\'s income first. Add it in My Finance and ask again.', 'Saya perlukan pendapatan bulan ini dulu. Tambah dalam My Finance dan tanya semula.'), FIN);
    const pc = (v) => Math.round(v / c.income * 100) + '%';
    const lines = [L('Here is where your income of ' + rm(c.income) + ' went:', 'Ini ke mana pendapatan ' + rm(c.income) + ' awak pergi:'), L('• Commitments ' + rm(c.commit) + ' (' + pc(c.commit) + ')', '• Komitmen ' + rm(c.commit) + ' (' + pc(c.commit) + ')'), L('• Spending ' + rm(c.spent) + ' (' + pc(c.spent) + ')', '• Belanja ' + rm(c.spent) + ' (' + pc(c.spent) + ')')];
    const by = {}; spendIn(todayS.slice(0, 7) + '-01', iso(addDays(todayD, 1))).forEach((x) => { by[x.cat] = (by[x.cat] || 0) + x.amt; }); const top = Object.keys(by).sort((a, b) => by[b] - by[a])[0];
    if (top) lines.push(L('Biggest spending category: ' + top + ' ' + rm(by[top]) + '.', 'Kategori belanja terbesar: ' + top + ' ' + rm(by[top]) + '.'));
    if (c.oneOff > 0) lines.push(L('Bills and big one-off buys so far: ' + rm(c.oneOff) + '.', 'Bil dan belian besar setakat ini: ' + rm(c.oneOff) + '.'));
    const big = c.commit >= c.spent ? L('Most of it goes to commitments, which are fixed. Focus on keeping daily spending small.', 'Kebanyakannya untuk komitmen yang tetap. Fokus kekalkan belanja harian kecil.') : L('Spending is the larger part, so that is where you have the most control.', 'Belanja bahagian terbesar, jadi di situlah awak ada paling banyak kawalan.');
    lines.push(big);
    return mk(lines.join('\n'), Object.assign({ big: rm(c.left), bigLbl: L('left', 'baki'), color: c.over ? '#ff8fab' : '#ffc46b' }, FIN));
  }
  function budget() {
    const c = ML();
    if (!s.income) return mk(L('I do not see income for this month yet, so I cannot work out a daily budget. So far you spend about ' + rm(monthSpend() / dayNo) + ' a day. Add your income in My Finance.', 'Saya belum nampak pendapatan bulan ini, jadi tak dapat kira bajet harian. Setakat ini awak belanja kira-kira ' + rm(monthSpend() / dayNo) + ' sehari. Tambah pendapatan dalam My Finance.'), FIN);
    if (c.left <= 0) return mk(L('Your income is already used up this month (commitments ' + rm(c.commit) + ', spent ' + rm(c.spent) + '). Try to spend only on what is essential.', 'Pendapatan bulan ini dah habis (komitmen ' + rm(c.commit) + ', belanja ' + rm(c.spent) + '). Cuba belanja yang perlu sahaja.'), Object.assign({ big: rm(c.left), bigLbl: L('left', 'baki'), color: '#ff8fab' }, FIN));
    return mk(L('After commitments ' + rm(c.commit) + ' and spending ' + rm(c.spent) + ', you have ' + rm(c.left) + ' left for ' + c.daysLeft + ' days. You can spend about ' + rm(c.allowance) + ' a day' + (c.today ? ' (today so far ' + rm(c.today) + ')' : '') + '.', 'Selepas komitmen ' + rm(c.commit) + ' dan belanja ' + rm(c.spent) + ', awak ada ' + rm(c.left) + ' untuk ' + c.daysLeft + ' hari. Awak boleh belanja kira-kira ' + rm(c.allowance) + ' sehari' + (c.today ? ' (hari ini setakat ini ' + rm(c.today) + ')' : '') + '.'), Object.assign({ big: rm(c.allowance), bigLbl: L('per day', 'sehari'), color: '#34d399' }, FIN));
  }
  function afford(amt) {
    const left = free();
    if (!s.income) return mk(L('I cannot judge without this month\'s income. Add it in My Finance, then ask again. For reference you spend about ' + rm(monthSpend() / dayNo) + ' a day.', 'Saya tak dapat nilai tanpa pendapatan bulan ini. Tambah dalam My Finance, kemudian tanya semula. Sebagai rujukan, awak belanja kira-kira ' + rm(monthSpend() / dayNo) + ' sehari.'), FIN);
    const v = amt > left ? L('That is more than what is left (' + rm(left) + '), so it would put you over for this month.', 'Itu melebihi baki (' + rm(left) + '), jadi bulan ini awak akan terlebih belanja.') : amt <= left * 0.2 ? L('Yes, it fits comfortably. You would still have ' + rm(left - amt) + ' left.', 'Ya, muat dengan selesa. Awak masih ada ' + rm(left - amt) + '.') : L('It fits, but it takes a big part of what is left. You would have ' + rm(left - amt) + ' for the rest of the month.', 'Muat, tetapi ia ambil bahagian besar baki awak. Awak tinggal ' + rm(left - amt) + ' untuk baki bulan ini.');
    return mk(v + L(' (Based only on what you logged.)', ' (Berdasarkan rekod awak sahaja.)'), Object.assign({ big: rm(amt), bigLbl: L('you asked about', 'yang ditanya'), color: amt > left ? '#ff8fab' : '#34d399' }, FIN));
  }
  function projection() {
    const c = ML(); if (!c.spent) return mk(L('Nothing spent yet this month, so there is nothing to project.', 'Belum ada belanja bulan ini, jadi tiada yang boleh diramal.'), FIN);
    
    const t = c.runOutDay ? L(' At this pace your money runs out around the ' + c.runOutDay + 'th.', ' Dengan kadar ini duit habis sekitar haribulan ' + c.runOutDay + '.') : '';
    return mk(L('At your usual pace of ' + rm(c.pace) + ' a day (bills and big one-off buys left out), you would spend about ' + rm(c.projSpent) + ' by the end of the month' + (s.income ? (c.projLeft < 0 ? ' and be ' + rm(-c.projLeft) + ' short after commitments.' : ' and finish with about ' + rm(c.projLeft) + ' left.') : '.') + t, 'Dengan kadar biasa awak ' + rm(c.pace) + ' sehari (bil dan belian besar sekali sahaja tidak dikira), awak akan belanja kira-kira ' + rm(c.projSpent) + ' hingga akhir bulan' + (s.income ? (c.projLeft < 0 ? ' dan kurang ' + rm(-c.projLeft) + ' selepas komitmen.' : ' dan baki kira-kira ' + rm(c.projLeft) + '.') : '.') + t), Object.assign({ big: rm(c.projLeft), bigLbl: L('at month end', 'hujung bulan'), color: c.projLeft < 0 ? '#ff8fab' : '#ffc46b' }, FIN));
  }
  function review() {
    const p = period(' last 7 days '); const out = [L('Your last 7 days:', '7 hari lepas awak:')];
    const days = R.days || {}; const st = [], sl = [], wa = [];
    for (let d = new Date(p.from + 'T12:00:00'); iso(d) < p.to; d = addDays(d, 1)) { const x = days[iso(d)]; if (!x) continue; if (x.steps > 0) st.push(x.steps); if (x.sleep > 0) sl.push(x.sleep); if (x.cups > 0) wa.push(x.cups); }
    const good = [], work = [];
    if (st.length) { const a = sum(st) / st.length; (a >= D.goal * 0.8 ? good : work).push(L('Steps average ' + A.num(Math.round(a)) + ' a day (goal ' + A.num(D.goal) + ')', 'Purata langkah ' + A.num(Math.round(a)) + ' sehari (sasaran ' + A.num(D.goal) + ')')); }
    if (sl.length) { const a = sum(sl) / sl.length; (a >= 6.5 ? good : work).push(L('Sleep averages ' + r2(a) + 'h (goal 7h)', 'Purata tidur ' + r2(a) + 'j (sasaran 7j)')); }
    if (wa.length) { const a = sum(wa) / wa.length; (a >= D.cupGoal * 0.8 ? good : work).push(L('Water averages ' + r2(a) + ' glasses', 'Purata air ' + r2(a) + ' gelas')); }
    const w1 = sum(spendIn(p.from, p.to), (x) => x.amt); const pf = iso(addDays(new Date(p.from + 'T12:00:00'), -7)); const w0 = sum(spendIn(pf, p.from), (x) => x.amt);
    if (w1 || w0) { const t = L('Spending ' + rm(w1) + (w0 ? ' (' + (w1 <= w0 ? 'down' : 'up') + ' from ' + rm(w0) + ')' : ''), 'Belanja ' + rm(w1) + (w0 ? ' (' + (w1 <= w0 ? 'turun' : 'naik') + ' daripada ' + rm(w0) + ')' : '')); (w1 <= w0 || !w0 ? good : work).push(t); }
    const od = (R.plTasks || []).filter((t) => t.status !== 'done' && t.due && t.due < todayS);
    if (od.length) work.push(L(od.length + ' overdue tasks', od.length + ' tugasan lewat')); else if (s.tasks.length) good.push(L('No overdue tasks', 'Tiada tugasan lewat'));
    if (!good.length && !work.length) return mk(L('There is not enough logged in the last 7 days for a review. Log steps, sleep, water or spending and ask again.', 'Belum cukup rekod dalam 7 hari lepas untuk ulasan. Rekod langkah, tidur, air atau belanja dan tanya semula.'), { label: L('Open Insights', 'Buka Insights'), href: 'Insights.dc.html' });
    if (good.length) out.push(L('Going well:', 'Yang baik:')); good.forEach((x) => out.push('• ' + x));
    if (work.length) out.push(L('To improve:', 'Boleh dibaiki:')); work.forEach((x) => out.push('• ' + x));
    return mk(out.join('\n'), { label: L('Open Insights', 'Buka Insights'), href: 'Insights.dc.html' });
  }
  function priorityMsg() {
    const l = priority(A);
    if (!l.length) return mk(L('You have no open tasks. Nice and clear.', 'Tiada tugasan belum siap. Bagus.'));
    return mk(L('Here is what I would do first:\n', 'Ini yang saya buat dulu:\n') + l.slice(0, 4).map((t, i) => (i + 1) + '. ' + t.name + ' (' + t.why + ')').join('\n'), { label: L('Open Daily Planner', 'Buka Daily Planner'), href: 'Planner.dc.html' });
  }
}

function priority(A) {
  const L = (en, ms) => (A.state.lang === 'ms' ? ms : en); const R = A.R();
  return (R.plTasks || []).filter((t) => t.status !== 'done').map((t) => {
    const n = A.daysTo(t.due); let sc = 0, why = L('no date', 'tiada tarikh');
    if (n !== null) { if (n < 0) { sc = 100 + Math.min(-n, 30); why = L('overdue ' + (-n) + ' d', 'lewat ' + (-n) + ' hari'); } else if (n === 0) { sc = 90; why = L('due today', 'hari ini'); } else if (n <= 3) { sc = 80 - n; why = L('in ' + n + ' d', 'dalam ' + n + ' hari'); } else { sc = 40 - Math.min(n, 30); why = L('in ' + n + ' d', 'dalam ' + n + ' hari'); } }
    if (t.prio === 'High') sc += 20; else if (t.prio === 'Medium') sc += 8;
    return { name: t.name, sc, why: t.prio === 'High' ? why + ', ' + L('high priority', 'keutamaan tinggi') : why };
  }).sort((a, b) => b.sc - a.sc);
}

// small safe calculator: numbers, + - * / and brackets
function calc(src) {
  const t = src.replace(/\s+/g, '').match(/\d+(?:\.\d+)?|[()+\-*\/]/g); if (!t) return null; let i = 0;
  const ex = () => { let v = tm(); while (t[i] === '+' || t[i] === '-') { const o = t[i++]; const r = tm(); v = o === '+' ? v + r : v - r; } return v; };
  const tm = () => { let v = fc(); while (t[i] === '*' || t[i] === '/') { const o = t[i++]; const r = fc(); v = o === '*' ? v * r : v / r; } return v; };
  const fc = () => { if (t[i] === '(') { i++; const v = ex(); i++; return v; } if (t[i] === '-') { i++; return -fc(); } return Number(t[i++]); };
  try { const v = ex(); return i === t.length ? v : null; } catch (e) { return null; }
}
