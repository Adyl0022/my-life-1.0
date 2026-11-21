// @ts-nocheck
import { lessonOfDay } from './lessonOfDay';
// The thinking part of the Assistant. Works fully offline, on the saved data of the app.
// 1) fix() repairs typos and chat spelling   2) period() understands "yesterday", "this week", "last month"
// 3) think() answers analysis questions, small talk and new actions, and remembers the last topic (ctx).
import * as DB from './debts';
import { calcLeft } from './moneyLeft';
import { cs } from './region';
import { modOn } from './hidden';
import { expState } from './patterns';
import { medDue, to12 } from './habit';
import { missedDoses } from './medMissed';

const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WD_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WD_MS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

// ---------- spelling ----------
const SLANG = {
  brp: 'berapa', berapaa: 'berapa', bln: 'bulan', mggu: 'minggu', mgu: 'minggu', hr: 'hari', sy: 'saya', blnja: 'belanja', belnja: 'belanja', blanja: 'belanja', bljnja: 'belanja', tdo: 'tidur', tido: 'tidur', x: 'tak', xde: 'tiada', xda: 'tiada', tkde: 'tiada', dpt: 'dapat', utk: 'untuk', dgn: 'dengan', yg: 'yang',
  blm: 'belum', dh: 'dah', sdh: 'sudah', knp: 'kenapa', kenape: 'kenapa', camne: 'macam mana', cmne: 'macam mana', macamana: 'macam mana', macamne: 'macam mana', smlm: 'semalam', esk: 'esok', bsk: 'esok', besok: 'esok', tgk: 'tengok', hrini: 'hari ini', harini: 'hari ini',
  ni: 'ini', nie: 'ini', tu: 'itu', jgn: 'jangan', tlg: 'tolong', pls: 'please', plz: 'please', btw: 'by the way', gaji: 'gaji', duitt: 'duit', wang: 'duit', ringgit: 'rm', bajet: 'budget', kt: 'kat', lg: 'lagi', jer: 'je', jek: 'je', spt: 'seperti', byk: 'banyak', sket: 'sikit', skit: 'sikit', kje: 'kerja', kerjaa: 'kerja', mkn: 'makan', mkan: 'makan', sleeep: 'sleep', thx: 'thanks', tq: 'terima kasih', tqvm: 'terima kasih',
};
Object.assign(SLANG, { scor: 'score', scre: 'score', spnt: 'spent', spnd: 'spend', blja: 'belanja', slpt: 'slept', wtr: 'water', stps: 'steps', tsk: 'task', tsks: 'tasks', mkn: 'makan', mnggu: 'minggu', hri: 'hari', tdr: 'tidur', lngkh: 'langkah', lngkah: 'langkah', gelaas: 'gelas', mnum: 'minum', mnm: 'minum', smlm: 'semalam', skrg: 'sekarang', skrang: 'sekarang', xpe: 'tak apa', tkpe: 'tak apa', brpe: 'berapa', brape: 'berapa' });
const VOC = ('siapa berapa bulan minggu semalam kelmarin esok lusa belanja perbelanjaan pendapatan gaji tidur langkah tugasan acara solat puasa hutang servis motosikal odometer kesihatan makan petrol minyak elektrik kenapa bagaimana macam mana boleh tambah padam buang catat nota ingatkan jangan lupa tandakan selesai siap sudah belum kategori paling banyak jimat bajet baki simpan bandingkan banding ringkasan cadangan nasihat penting segera tolong terima kasih hari ini tahun lepas depan sikit tinggi rendah purata jumlah jumpa doktor temujanji bengkel '
  + 'spending spent income salary budget savings steps sleep water mood tasks events prayer fasting debts service mileage motorcycle summary weekly week month year yesterday tomorrow today average total biggest expensive cheaper higher lower compare comparison reminder remind note delete remove undo done finished complete mark afford priority progress review advice suggest why reduce cut fuel lunch dinner breakfast coffee groceries shopping bills health appointment doctor meeting birthday').split(' ');
('hologram pulse pressure blood heart experiment experiments medicine medication relax meditation breathing patterns progress nadi denyutan tekanan darah jantung eksperimen ubat meditasi pernafasan corak kemajuan').split(' ').forEach((w) => { if (VOC.indexOf(w) < 0) VOC.push(w); });
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

// Finds a time of day ("pukul 12 tengah hari", "9pm", "tonight") or a wait ("in 1 hour", "30 minit lagi") in a sentence.
export function findTime(text) {
  const t = ' ' + (text || '').toLowerCase() + ' '; let m;
  if ((m = t.match(/\b(?:dalam|in)\s+(\d{1,3})\s*(jam|hours?|hrs?|h|minit|minutes?|mins?)\b(?:\s+lagi)?/)) || (m = t.match(/\b(\d{1,3})\s*(jam|hours?|minit|minutes?|min)\s+lagi\b/))) {
    const n = Number(m[1]); const hr = /^(jam|h)/.test(m[2]); const d = new Date(Date.now() + n * (hr ? 3600000 : 60000)); d.setSeconds(0, 0);
    return { rel: d.getTime(), h: 0, m: 0, spans: [m[0].trim()] };
  }
  if ((m = t.match(/\b(?:(?:pukul|jam|at|@|pada)\s*)?(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|pagi|petang|malam|tengah hari|tengahari|tghari)\b/))) {
    let h = Number(m[1]); const mi = m[2] ? Number(m[2]) : 0; const k = m[3];
    if (h > 12 || mi > 59) return null;
    if (k === 'am' || k === 'pagi') { if (h === 12) h = 0; }
    else if (k === 'pm' || k === 'petang') { if (h < 12) h += 12; }
    else if (k === 'malam') { if (h === 12) h = 0; else if (h >= 6) h += 12; }
    else { if (h < 6) h += 12; }
    return { rel: 0, h, m: mi, spans: [m[0].trim()] };
  }
  if ((m = t.match(/\b(?:pukul|jam)\s+(\d{1,2})(?:[:.](\d{2}))?\b/)) && Number(m[1]) <= 23) {
    let h = Number(m[1]); if (h < 12 && /\b(tonight|tonite|malam|petang|evening)\b/.test(t) && (h >= 6 || /petang|evening/.test(t))) h += 12;
    return { rel: 0, h, m: m[2] ? Number(m[2]) : 0, spans: [m[0].trim()] };
  }
  if ((m = t.match(/\b(tonight|tonite|malam ini|malam ni)\b/))) return { rel: 0, h: 21, m: 0, spans: [m[0]] };
  if ((m = t.match(/\b(this evening|petang ini|petang ni|petang)\b/))) return { rel: 0, h: 18, m: 0, spans: [m[0]] };
  if ((m = t.match(/\b(this morning|morning|pagi ini|pagi ni|pagi)\b/))) return { rel: 0, h: 8, m: 0, spans: [m[0]] };
  if ((m = t.match(/\b(noon|tengah hari|tengahari)\b/))) return { rel: 0, h: 12, m: 0, spans: [m[0]] };
  return null;
}
// The moment a reminder should ring, from an optional date and a time.
function remindAt(fd, tm) {
  if (tm.rel) return tm.rel;
  const now = new Date(); let d;
  if (fd) { const p = fd.date.split('-'); d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), tm.h, tm.m, 0, 0); }
  else { d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), tm.h, tm.m, 0, 0); if (d.getTime() <= now.getTime() + 60000) d.setDate(d.getDate() + 1); }
  return d.getTime();
}
const WDS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const rtxt = (ms) => {
  const d = new Date(ms); const a = new Date(); const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()) / 86400000);
  const h = d.getHours(); const c = (h % 12 || 12) + ':' + pad(d.getMinutes()) + ' ' + (h < 12 ? 'AM' : 'PM');
  return (diff === 0 ? 'Today ' : diff === 1 ? 'Tomorrow ' : WDS[d.getDay()] + ' ' + d.getDate() + ' ' + MN[d.getMonth()] + ', ') + c;
};

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
  // reminder that rings at a time: ingatkan saya esok pukul 12 ... / remind me in 1 hour to ...
  let mt = ql.match(/^(?:tolong\s+)?(?:ingatkan saya|ingatkan|remind me|set (?:a )?reminder)\s*(?:(?:about|tentang|pasal|to|untuk|that|supaya)\b)?\s*(.+)$/);
  if (mt && mt[1].trim()) {
    const tm = findTime(mt[1]);
    if (tm) {
      const fd = findDate(mt[1]); let name = mt[1];
      [fd && fd.span, ...tm.spans].forEach((sp) => { if (sp) name = name.replace(String(sp).trim(), ' '); });
      name = name.replace(/\b(tonight|tonite|malam ini|malam ni|this evening|petang ini|petang ni|this morning|pagi ini|pagi ni)\b/g, ' ');
      for (let i = 0; i < 3; i++) name = name.replace(/^\s*(pada|on|at|by|untuk|for|to|that|supaya|tentang|about|pukul|jam|then|dan|and)\b\s*/, ' ').replace(/\b(pada|on|at|by|untuk|for|pukul|jam|to)\s*$/, ' ');
      name = name.replace(/\s+/g, ' ').trim() || 'Reminder'; name = name.charAt(0).toUpperCase() + name.slice(1);
      const at = remindAt(fd, tm);
      if (at <= Date.now() + 30000) return done(mk(L('That time has already passed. Tell me a time later than now, for example "remind me tomorrow 9am to ' + name.toLowerCase() + '".', 'Masa itu sudah lepas. Beritahu saya masa selepas sekarang, contohnya "ingatkan saya esok pukul 9 pagi ' + name.toLowerCase() + '".')), {}, null, {});
      return done(mk(L('Reminder set for ' + rtxt(at) + ': "' + name + '". It will ring at that time.', 'Peringatan ditetapkan pada ' + rtxt(at) + ': "' + name + '". Ia akan berbunyi pada masa itu.'), { big: rtxt(at), bigLbl: name, color: '#ffc46b', label: L('Open Notes & Reminders', 'Buka Notes & Reminders'), href: 'Notes.dc.html' }), {}, { type: 'remind', title: name, rm: at });
    }
  }
  // which reminders do I have
  if (/\b(reminders?|peringatan)\b/.test(ql) && !/\b(how|macam mana|bagaimana|turn|off|on|matikan|hidupkan|setting|settings|sound|bunyi|quiet|senyap|ubah|change|cara|notification|notifikasi)\b/.test(ql) && /\b(apa|what|show|senarai|list|ada|my|saya|lihat|tunjuk|which|mana)\b/.test(ql)) {
    const all = (R.noteList || []).filter((n) => n.rm && !n.rd).sort((a, b) => a.rm - b.rm); const fd0 = findDate(ql);
    const rows = fd0 ? all.filter((n) => iso(new Date(n.rm)) === fd0.date) : all;
    const od = rows.filter((n) => n.rm < Date.now()).length;
    const link = { label: L('Open Notes & Reminders', 'Buka Notes & Reminders'), href: 'Notes.dc.html' };
    if (!rows.length) return done(mk(fd0 ? L('No reminders for that day. Say "remind me tomorrow 12pm to charge laptop" to add one.', 'Tiada peringatan untuk hari itu. Sebut "ingatkan saya esok pukul 12 tengah hari cas laptop" untuk tambah.') : L('You have no reminders yet. Say "remind me tomorrow 12pm to charge laptop" to add one.', 'Awak belum ada peringatan. Sebut "ingatkan saya esok pukul 12 tengah hari cas laptop" untuk tambah.'), link), {}, null, {});
    return done(mk(L('Your reminders' + (od ? ' (' + od + ' overdue)' : '') + ':\n', 'Peringatan awak' + (od ? ' (' + od + ' lewat)' : '') + ':\n') + rows.slice(0, 8).map((n) => '• ' + rtxt(n.rm) + ' · ' + (n.t || 'Reminder')).join('\n') + (rows.length > 8 ? '\n+' + (rows.length - 8) + L(' more', ' lagi') : ''), Object.assign({ big: String(rows.length), bigLbl: L('reminders', 'peringatan'), color: '#ffc46b' }, link)), {}, null, {});
  }
  // note
  mt = ql.match(/^(?:tolong\s+)?(?:buat\s+(?:satu\s+)?(?:nota|note)|make a note|create a note|add a note|new note|catat|catatkan|nota|note|tulis|jot|simpan nota|save note|write down)\s*(?:nota|note|that|bahawa)?\s*[:\-]?\s*(.+)$/);
  if (mt && mt[1].trim().length > 1 && !/^(saya|i)\s+(belanja|spent)/.test(mt[1])) {
    const text = mt[1].trim(); const body = text.charAt(0).toUpperCase() + text.slice(1);
    return done(mk(L('Saved to Notes: "' + body + '".', 'Disimpan dalam Nota: "' + body + '".'), { label: L('Open Notes', 'Buka Nota'), href: 'Notes.dc.html' }), {}, { type: 'note', title: body.slice(0, 40), text: body });
  }
  // shopping list (a checklist note on this phone; the Family shopping list is shared online, so it stays in Family Planner)
  if (/(senarai\s+(?:membeli[- ]?belah|beli[- ]?belah|belian|barang(?: dapur)?|runcit|shopping|dapur)|shopping\s*list|grocer(?:y|ies)\s*list|membeli[- ]?belah)/.test(ql)) {
    const fam = /\b(family|keluarga)\b/.test(ql);
    const ms = ql.match(/^(?:tolong\s+)?(?:tambah|tambahkan|add|masukkan|letak|put)\s+(.+?)\s+(?:ke dalam|ke|dalam|in|into|to|on)\s+.*$/);
    if (fam) return done(mk(L('The Family shopping list is shared online with your family, so I cannot add to it from here. Open Family Planner, Household, Shopping and tap +. I can add it to your own Shopping list instead: say "add milk to my shopping list".', 'Senarai membeli-belah Family dikongsi dalam talian dengan keluarga, jadi saya tak boleh tambah dari sini. Buka Family Planner, Household, Shopping dan tekan +. Saya boleh tambah dalam senarai Shopping awak sendiri: sebut "tambah susu ke senarai membeli belah".'), { label: L('Open Family shopping', 'Buka Family shopping'), href: 'FamilyShop.dc.html' }), {}, null, {});
    if (ms) {
      let txt = ms[1]; for (let i = 0; i < 3; i++) txt = txt.replace(/^\s*(barang|item|items|beli|buy|tolong)\b\s*/, ' ');
      const items = txt.split(/\s*(?:,|\bdan\b|\band\b|&|\+)\s*/).map((x) => x.trim()).filter((x) => x && x.length < 40).slice(0, 12).map((x) => x.charAt(0).toUpperCase() + x.slice(1));
      if (items.length) return done(mk(L('Added to your Shopping list: ' + items.join(', ') + '. It is a checklist in Notes, so you can tick items off.', 'Dah tambah dalam senarai Shopping awak: ' + items.join(', ') + '. Ia senarai semak dalam Notes, jadi awak boleh tanda bila dah beli.'), { label: L('Open Notes', 'Buka Notes'), href: 'Notes.dc.html' }), {}, { type: 'shop', items });
    }
    const ex = (R.noteList || []).find((n) => (n.t || '').trim().toLowerCase() === 'shopping list');
    const open = ex ? ex.s.split('\n').filter((l) => l.indexOf('☐') === 0).map((l) => l.slice(1).trim()) : [];
    if (open.length) return done(mk(L('Still to buy:\n', 'Masih perlu dibeli:\n') + open.slice(0, 15).map((x) => '• ' + x).join('\n'), { label: L('Open Notes', 'Buka Notes'), href: 'Notes.dc.html' }), {}, null, {});
    return done(mk(L('Your Shopping list is empty. Say "add milk and eggs to my shopping list".', 'Senarai Shopping awak kosong. Sebut "tambah susu dan telur ke senarai membeli belah".')), {}, null, {});
  }
  // event
  mt = ql.match(/^(?:tolong\s+)?(?:tambah|tambahkan|add|buat|set|create|simpan|book)\s+(?:satu\s+|an?\s+)?(?:acara|event|temujanji|appointment|janji temu|meeting|mesyuarat|birthday|hari lahir)\s*(.*)$/)
    || ql.match(/^(?:tolong\s+)?(?:ingatkan saya|remind me)\s+(?:(?:about|tentang|pasal|to|untuk)\b\s*)?(.+)$/);
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
  // undo: the last thing saved (water, mood, steps, sleep, task, event, task done) or the latest spending
  if (has(['undo', 'buat asal', 'tarik balik', 'revert', 'batalkan']) && qn.split(' ').length <= 4 && !has(['belanja', 'spending', 'spend', 'rekod', 'record'])) {
    const u = s.lastUndo;
    if (!u) return done(mk(L('There is nothing to undo right now. I can undo the last thing I saved for you, like water, mood, steps, sleep, a task or an event. For spending, say "remove my last spending".', 'Tiada apa untuk dibuat asal sekarang. Saya boleh buat asal benda terakhir yang saya simpan, seperti air, mood, langkah, tidur, tugasan atau event. Untuk belanja, sebut "padam belanja terakhir".')));
    if (u.askSpend) return think(A, L('undo last spending', 'padam belanja terakhir'), lang);
    return done(mk(L('Done, I undid that.', 'Siap, saya dah buat asal.')), { lastUndo: null }, u.act);
  }
  // how much can I spend today (the daily amount from My Finance, less what is already spent today)
  if (modOn('finance') && !/\d/.test(qn) && !/(mampu|afford|worth)/.test(qn) && ((has(['boleh', 'can', 'able', 'berapa lagi', 'how much more']) && has(['belanja', 'spend', 'guna', 'habiskan'])) || has(['baki hari ini', 'baki harini', 'left today', 'remaining today', 'budget today', 'bajet hari ini', 'today budget', 'budget left', 'baki bajet', 'baki budget', 'budget baki', 'bajet tinggal', 'budget tinggal']))) {
    const m1 = ML(); const al = m1.allowance; const td = D.spendToday;
    if (!(m1.income > 0)) return done(mk(L('I need your income to work out a daily amount. Add it in My Finance, Monthly Income.', 'Saya perlukan pendapatan awak untuk kira jumlah harian. Masukkan di My Finance, Monthly Income.'), FIN), {}, null, { intent: 'left' });
    if (!(al > 0)) return done(mk(L('Nothing is left to spend this month after commitments and spending, so today\'s amount is ' + rm(0) + '.', 'Tiada baki untuk dibelanjakan bulan ini selepas komitmen dan belanja, jadi jumlah hari ini ialah ' + rm(0) + '.'), FIN), {}, null, { intent: 'left' });
    const lf = al - td; const over = lf < 0; const pct = Math.max(0, Math.min(100, Math.round((lf / al) * 100)));
    const text = over
      ? L('You can spend about ' + rm(al) + ' a day. Today you have spent ' + rm(td) + ', which is ' + rm(-lf) + ' over.', 'Awak boleh belanja kira-kira ' + rm(al) + ' sehari. Hari ini awak dah belanja ' + rm(td) + ', lebih ' + rm(-lf) + '.')
      : L('You can spend about ' + rm(al) + ' a day. Today you have spent ' + rm(td) + ', so about ' + rm(lf) + ' is left for today.', 'Awak boleh belanja kira-kira ' + rm(al) + ' sehari. Hari ini awak dah belanja ' + rm(td) + ', jadi baki lebih kurang ' + rm(lf) + ' untuk hari ini.');
    return done(mk(text, { big: rm(Math.max(0, lf)), bigLbl: L('left today', 'baki hari ini'), pct, color: over ? '#ff6b81' : pct <= 25 ? '#ffc46b' : '#7df0c6', label: FIN.label, href: FIN.href }), {}, null, { intent: 'left' });
  }
  // Life Score: what it is made of, and what would lift it
  if (has(['life score', 'skor life', 'skor hidup', 'markah life', 'my score', 'skor saya']) && (R.parts || []).length) {
    const parts = R.parts.slice().sort((a, b) => a.pct - b.pct); const low = parts[0];
    const TIP = {
      habit: L('Log your water and sleep, and take a short walk.', 'Rekod air dan tidur, dan jalan kaki sebentar.'),
      tasks: L('Finish the tasks that are due or overdue in Daily Planner.', 'Siapkan tugasan yang hampir tarikh atau lewat di Daily Planner.'),
      bills: L('Tick your commitments as paid in My Finance when you pay them.', 'Tanda komitmen sebagai dah bayar di My Finance bila awak bayar.'),
      spend: L('Keep today\'s spending under your daily amount from My Finance.', 'Kekalkan belanja hari ini di bawah jumlah harian daripada My Finance.'),
      faith: L('A few minutes of tasbih lifts this one.', 'Beberapa minit tasbih akan menaikkan bahagian ini.'),
    };
    const lines = parts.slice().reverse().map((p) => '• ' + p.label + ' ' + p.pct + '%');
    const why = has(['kenapa', 'why', 'rendah', 'low', 'naik', 'improve', 'tingkat', 'tambah', 'increase', 'bagaimana', 'macam mana', 'how', 'lift', 'better']);
    const tail = why && low ? L('\n\nThe lowest part is ' + low.label + ' at ' + low.pct + '% (' + low.detail + '). ' + (TIP[low.k] || ''), '\n\nBahagian paling rendah ialah ' + low.label + ' pada ' + low.pct + '% (' + low.detail + '). ' + (TIP[low.k] || '')) : '';
    return done(mk(L('Your Life Score is ' + D.score + ' out of 100. It is the average of what you have logged today:\n' + lines.join('\n') + tail, 'Skor Life awak ialah ' + D.score + ' daripada 100. Ia purata apa yang awak dah rekod hari ini:\n' + lines.join('\n') + tail), { big: String(D.score), bigLbl: L('Life Score', 'Skor Life'), pct: D.score, color: '#8fe9e2', label: L('Open Insights', 'Buka Insights'), href: 'Insights.dc.html' }), {}, null, { intent: 'score' });
  }
  // Quran Audio: how to listen, download and continue
  if (modOn('islamic') && has(['quran audio', 'audio quran', 'dengar quran', 'listen quran', 'listen to quran', 'bacaan quran', 'qari', 'reciter', 'download quran', 'muat turun quran', 'quran offline', 'quran luar talian', 'mengaji audio'])) {
    return done(mk(L('Open Islamic Hub, then the Quran tab, and tap Quran Audio. Pick a reciter (Alafasy, As-Sudais, Al-Muaiqly or Al-Husary) and play any of the 30 juz or 114 surahs. It streams over the internet. Tap the download arrow to save a surah or juz and listen offline. In the Downloads tab you can choose Wi-Fi only or Wi-Fi and mobile data, see the space used and delete what you saved. Tap Continue to pick up where you stopped.', 'Buka Islamic Hub, kemudian tab Quran, dan ketuk Quran Audio. Pilih qari (Alafasy, As-Sudais, Al-Muaiqly atau Al-Husary) dan mainkan mana-mana daripada 30 juzuk atau 114 surah. Ia distrim melalui internet. Ketuk anak panah muat turun untuk simpan surah atau juzuk dan dengar tanpa internet. Di tab Downloads awak boleh pilih Wi-Fi sahaja atau Wi-Fi dan data mudah alih, lihat ruang digunakan dan padam yang disimpan. Ketuk Continue untuk sambung dari tempat awak berhenti.'), { label: L('Open Quran Audio', 'Buka Quran Audio'), href: 'QuranAudio.dc.html' }), {}, null, { intent: 'quranaudio-help' });
  }
  // My Accounts: how to add an account, link spending, transfer
  if (modOn('finance') && !/\d/.test(qn) && has(['akaun', 'account', 'accounts', 'baki akaun', 'account balance', 'bank balance', 'baki bank', 'net worth', 'kad kredit', 'credit card', 'transfer', 'pindah duit']) && has(['how', 'macam mana', 'where', 'mana', 'add', 'tambah', 'set', 'link', 'sambung', 'guna', 'use'])) {
    return done(mk(L('Open My Finance. The My Accounts card is at the top. Tap it, then Add account: pick Cash, E-wallet, Bank, Savings or Credit card, give it a name and type how much is in it (or how much you owe) on a date. When you add spending, tap Paid from and choose the account, and its balance goes down by itself. For a credit card the amount you owe goes up instead. Use Transfer to move money between accounts or pay off a card, and Set balance to match what your bank shows. What you owe in Commitments shows up under What you owe by itself, and in Commitments you can pick Pay from so a ticked month comes off that account. In Income you can pick Put into account so your salary goes into it.', 'Buka My Finance. Kad My Accounts ada di bahagian atas. Tekan, kemudian Add account: pilih Cash, E-wallet, Bank, Savings atau Credit card, bagi nama dan isi jumlah di dalamnya (atau berapa awak berhutang) pada satu tarikh. Bila tambah belanja, tekan Paid from dan pilih akaun, baki akan turun sendiri. Untuk kad kredit, jumlah hutang pula yang naik. Guna Transfer untuk pindah duit antara akaun atau bayar kad, dan Set balance untuk samakan dengan baki bank awak.'), [{ label: L('Open My Finance', 'Buka My Finance'), href: 'Finance.dc.html' }]));
  }
  // Country, currency and week start: how to change them and what follows
  if (!/\d/.test(qn) && has(['voice', 'suara', 'mikrofon', 'microphone', 'mic', 'cakap dengan awak', 'talk to you', 'speak to you', 'bercakap']) && has(['assistant', 'awak', 'you', 'boleh', 'can', 'how', 'macam mana', 'guna', 'use'])) {
    return done(mk(L('Yes. In this chat, tap the microphone next to the send button. Then just talk: say "spent 12 ringgit on lunch" and I ask if I should save it (say yes or no), say "open My Accounts" to open a page, or just chat with me about anything and I answer out loud. In the voice screen, tap Choose voice to pick a voice, a male or female tone and the speed, and use BM+EN if you mix Malay and English. Your phone\'s speech service turns your voice into text, and My Life 1.0 keeps no recording. It works in English and Bahasa Malaysia: switch with EN or BM at the top of the voice screen.', 'Boleh. Dalam chat ini, tekan mikrofon di sebelah butang hantar. Kemudian terus bercakap: sebut "belanja makan 12 ringgit" dan saya tanya nak simpan atau tidak (cakap ya atau tidak), sebut "buka akaun" untuk buka halaman, atau tanya soalan dan saya jawab dengan suara. Perkhidmatan suara telefon awak menukar suara kepada teks, dan My Life 1.0 tidak menyimpan rakaman. Ia berfungsi dalam bahasa Inggeris dan Bahasa Malaysia: tukar dengan EN atau BM di atas skrin suara.')));
  }
  if (!/\d/.test(qn) && has(['currency', 'mata wang', 'negara', 'country', 'week start', 'minggu mula', 'hari mula minggu', 'ringgit ke', 'tukar rm', 'change rm', 'dollar', 'region']) && has(['how', 'macam mana', 'where', 'mana', 'change', 'tukar', 'ubah', 'set', 'pilih', 'choose', 'switch'])) {
    return done(mk(L('Open Settings, General, then Region. Pick your country and the currency changes with it, or pick a currency by itself. The symbol then follows everywhere: My Finance, Accounts, Commitments, Savings, Subscriptions, Lent & Borrowed, Personal Collection, reminders, exports and the Assistant. Amounts are never converted, so 50 stays 50 and only the symbol changes. The country also sets the public holidays in the Planner, and you can choose which day the week starts on.', 'Buka Settings, General, kemudian Region. Pilih negara dan mata wang akan ikut, atau pilih mata wang sahaja. Simbol itu kemudian ikut di mana-mana: My Finance, Accounts, Commitments, Savings, Subscriptions, Lent & Borrowed, Personal Collection, peringatan, eksport dan Assistant. Jumlah tidak ditukar, jadi 50 kekal 50 dan hanya simbol yang berubah. Negara juga menentukan cuti umum dalam Planner, dan awak boleh pilih hari permulaan minggu.'), { label: L('Open Settings', 'Buka Settings'), href: 'Settings.dc.html' }));
  }
  // Vehicle maintenance counted in My Finance (a question, not a new entry)
  if (modOn('finance') && modOn('record') && !/\d/.test(qn) && has(['my finance', 'finance', 'today spending', 'today\'s spending', 'belanja hari ini']) && has(['maintenance', 'penyelenggaraan', 'servis', 'service']) && has(['how', 'macam mana', 'kenapa', 'why', 'kira', 'count', 'masuk', 'included', 'termasuk', 'tak keluar', 'not showing'])) {
    return done(mk(L('When you add maintenance spending in My Record, Today\'s spending asks once whether to count it in My Finance. If you say yes, it shows as a Vehicle category in your spending, Stats and Insights, and you can only change it in My Record. Tap the note under the total on Today\'s spending to switch it on or off.', 'Bila awak tambah belanja penyelenggaraan di My Record, Today\'s spending akan tanya sekali sama ada nak kira dalam My Finance. Kalau awak pilih ya, ia muncul sebagai kategori Vehicle dalam belanja, Stats dan Insights, dan hanya boleh diubah di My Record. Ketuk nota di bawah jumlah pada Today\'s spending untuk hidup atau matikan.'), { label: L('Open My Finance', 'Buka My Finance'), href: 'Finance.dc.html' }), {}, null, { intent: 'vehspend-help' });
  }
  // the newer Habit & Health tools: how to find and use them
  if (modOn('habit')) {
    const open = { label: L('Open Habit & Health', 'Buka Habit & Health'), href: 'Habit.dc.html' };
    if (has(['ubat', 'medicine', 'medication', 'medicines', 'pil ']) && has(['reminder', 'peringatan', 'ingat', 'how', 'macam mana', 'set', 'tambah', 'add', 'where', 'mana', 'edit', 'ubah', 'tukar', 'kemaskini', 'change']) && !has(['terlepas', 'missed', 'lupa', 'miss']))
      return done(mk(L('Open Habit & Health, then the Today tab, and tap the Medication card. Tap + to add a medicine with its dose, time and the days it repeats. You get a reminder at that time, and again an hour later if you have not ticked it. To change a medicine later, open Medicine, All medicines, and tap Edit. A dose not ticked an hour after its time is marked Missed. Type the dose from your doctor or the label. I cannot give dose advice.', 'Buka Habit & Health, kemudian tab Today, dan ketuk kad Medication. Ketuk + untuk tambah ubat dengan dos, masa dan hari ulang. Awak dapat peringatan pada masa itu, dan sekali lagi 1 jam kemudian kalau belum ditanda. Untuk ubah ubat kemudian, buka Medicine, All medicines, dan ketuk Edit. Dos yang tidak ditanda 1 jam selepas masanya ditanda Missed. Taip dos daripada doktor atau label. Saya tidak boleh bagi nasihat dos.'), open), {}, null, { intent: 'meds-help' });
    if (has(['meditat', 'meditasi', 'breathing', 'breathe', 'pernafasan', 'tarik nafas', 'relax', 'relaks', 'tenangkan']) && has(['how', 'macam mana', 'where', 'mana', 'app', 'ada', 'timer', 'exercise', 'latihan']))
      return done(mk(L('Open Habit & Health, then the Today tab, and tap the Relax card. Breathe has 5 breathing patterns (Box, Calm 4-7-8, Deep belly, Balance, Quick reset). Meditate has 5 styles and a timer from 5 minutes. Record shows your minutes, streak and a daily goal. It is for relaxing only, not medical treatment.', 'Buka Habit & Health, kemudian tab Today, dan ketuk kad Relax. Breathe ada 5 corak pernafasan (Box, Calm 4-7-8, Deep belly, Balance, Quick reset). Meditate ada 5 gaya dan pemasa dari 5 minit. Record tunjuk minit, streak dan sasaran harian. Ia untuk relaks sahaja, bukan rawatan.'), open), {}, null, { intent: 'relax-help' });
    if (has(['energy', 'tenaga']) && has(['how', 'macam mana', 'dikira', 'calculated', 'worked out', 'kira', 'estimate', 'anggar']))
      return done(mk(L('Your energy is an estimate from what you logged today: sleep counts most, then water, steps and mood. You need at least 2 of them. Tap how you really feel on the Energy card to replace the estimate. Patterns only use the energy you rate yourself.', 'Tenaga awak ialah anggaran daripada apa yang awak rekod hari ini: tidur paling berpengaruh, kemudian air, langkah dan mood. Perlu sekurang-kurangnya 2 daripadanya. Ketuk perasaan sebenar awak pada kad Energy untuk ganti anggaran. Patterns hanya guna tenaga yang awak nilai sendiri.'), open), {}, null, { intent: 'energy-help' });
    // the Body hologram (Time Machine): the word alone is enough
    if (has(['hologram', 'time machine', 'mesin masa', '3d view', 'badan 3d', '3d body']))
      return done(mk(L('The Body hologram is in Habit & Health, on the Patterns tab: scroll to Time Machine and tap Body hologram. Tap a day at the top to see that day (More goes further back). Tap a part of the body, or the buttons Whole body, Brain, Heart, Lungs and Muscles, to see your own records for it. Compare shows two days side by side. Future gives a simple estimate 7, 30 or 90 days ahead, and 3D view turns the body so you can drag it around. It only shows what you recorded, it is not a medical reading.', 'Body hologram ada di Habit & Health, tab Patterns: skrol ke Time Machine dan tekan Body hologram. Tekan satu hari di atas untuk lihat hari itu (More pergi lebih jauh ke belakang). Tekan bahagian badan, atau butang Whole body, Brain, Heart, Lungs dan Muscles, untuk lihat rekod awak sendiri. Compare tunjuk dua hari sebelah-menyebelah. Future bagi anggaran ringkas 7, 30 atau 90 hari ke depan, dan 3D view pusingkan badan supaya awak boleh seret. Ia hanya tunjuk apa yang awak rekod, bukan bacaan perubatan.'), open), {}, null, { intent: 'hologram-help' });
    // Heart log: answers from the readings the person typed, never a judgement
    const heartHelp = L('You can type your own pulse and blood pressure in the Heart log. Open Habit & Health, then the Today tab, under Sleep Tracker, or tap Heart on the Body hologram. You can also just tell me, for example "pulse 72" or "blood pressure 120/80". My Life only keeps the numbers you type. It does not measure them, and I cannot say whether a reading is good or bad. Please ask a doctor or nurse about your readings.', 'Awak boleh taip sendiri denyutan dan tekanan darah dalam Heart log. Buka Habit & Health, kemudian tab Body, atau tekan Heart pada Body hologram. Awak juga boleh beritahu saya terus, contohnya "nadi 72" atau "tekanan darah 120/80". My Life hanya simpan nombor yang awak taip. Ia tidak mengukurnya, dan saya tidak boleh kata sama ada bacaan itu baik atau tidak. Sila tanya doktor atau jururawat tentang bacaan awak.');
    const otherTopic = /(belanja|spend|spent|langkah|step|tidur|sleep|slept|water|mood|duit|money|gaji|income|task|tugas|budget|bajet|ubat|medicine)/.test(qn);
    const heartW = has(['heart log', 'heart rate', 'pulse', 'blood pressure', 'tekanan darah', 'denyutan', 'nadi', 'degupan', 'bpm', 'log jantung', 'rekod jantung']);
    if (heartW || (ctx.intent === 'heart' && per && qn.split(' ').length <= 6 && !otherTopic)) {
      const all = ((R.hd && R.hd.heart) || []).slice().sort((x, y) => (x.d + x.at < y.d + y.at ? -1 : 1));
      const howto = has(['how', 'macam mana', 'cara', 'where', 'mana']) && has(['log', 'rekod', 'record', 'add', 'tambah', 'taip', 'type', 'save', 'simpan', 'masuk', 'enter']);
      if (!all.length || howto) return done(mk(heartHelp, open), {}, null, { intent: 'heart-help' });
      const p = per || period(' last 7 days '); const inP = all.filter((x) => x.d >= p.from && x.d < p.to);
      const pu = inP.filter((x) => x.bpm != null), bp = inP.filter((x) => x.sys != null && x.dia != null);
      const av = (l, f) => Math.round(l.reduce((t, x) => t + f(x), 0) / l.length);
      const last = all[all.length - 1]; const lastT = [last.bpm != null ? last.bpm + ' bpm' : '', last.sys != null ? last.sys + '/' + last.dia + ' mmHg' : ''].filter(Boolean).join(', ');
      const out = [];
      if (!inP.length) out.push(L('No heart readings were logged ' + p.en + '.', 'Tiada bacaan jantung direkod ' + p.ms + '.'));
      else {
        out.push(L('Heart log, ' + p.en + ': ' + inP.length + (inP.length === 1 ? ' reading.' : ' readings.'), 'Heart log, ' + p.ms + ': ' + inP.length + ' bacaan.'));
        if (pu.length) out.push(L('• Average pulse: ' + av(pu, (x) => x.bpm) + ' bpm (' + pu.length + ')', '• Purata nadi: ' + av(pu, (x) => x.bpm) + ' bpm (' + pu.length + ')'));
        if (bp.length) out.push(L('• Average blood pressure: ' + av(bp, (x) => x.sys) + '/' + av(bp, (x) => x.dia) + ' mmHg (' + bp.length + ')', '• Purata tekanan darah: ' + av(bp, (x) => x.sys) + '/' + av(bp, (x) => x.dia) + ' mmHg (' + bp.length + ')'));
      }
      out.push(L('Latest reading: ' + lastT + ' on ' + fmt(last.d) + ' at ' + to12(last.at) + '.', 'Bacaan terkini: ' + lastT + ' pada ' + fmt(last.d) + ', ' + to12(last.at) + '.'));
      out.push(L('These are the numbers you typed. I cannot say whether they are good or bad. Please ask a doctor or nurse.', 'Ini nombor yang awak taip. Saya tidak boleh kata sama ada ia baik atau tidak. Sila tanya doktor atau jururawat.'));
      return done(mk(out.join('\n'), Object.assign({ big: pu.length ? av(pu, (x) => x.bpm) + ' bpm' : (bp.length ? av(bp, (x) => x.sys) + '/' + av(bp, (x) => x.dia) : ''), bigLbl: pu.length ? L('average pulse', 'purata nadi') : (bp.length ? L('average blood pressure', 'purata tekanan darah') : ''), color: '#ff8fab' }, open)), {}, null, { intent: 'heart', pObj: p });
    }
    // Missed medicine in the last 7 days (counted on the phone from what was ticked)
    if ((R.hd && R.hd.meds && R.hd.meds.length) && has(['ubat', 'medicine', 'medication', 'medicines', 'pil ']) && has(['terlepas', 'missed', 'miss', 'lupa', 'tertinggal', 'skip', 'tak makan', 'tidak makan'])) {
      const md = missedDoses(R.hd, new Date(), 7).filter((x) => x.status === 'missed');
      const by = {}; md.forEach((x) => { by[x.med.name] = (by[x.med.name] || 0) + 1; });
      const names = Object.keys(by).sort((x, y) => by[y] - by[x]);
      const txt = !md.length ? L('No missed doses in the last 7 days. Doses not ticked an hour after their time count as missed.', 'Tiada dos terlepas dalam 7 hari lepas. Dos yang tidak ditanda 1 jam selepas masanya dikira terlepas.')
        : L('You missed ' + md.length + (md.length === 1 ? ' dose' : ' doses') + ' in the last 7 days:\n', 'Awak terlepas ' + md.length + ' dos dalam 7 hari lepas:\n') + names.map((n) => '• ' + n + ' (' + by[n] + ')').join('\n') + L('\nOpen Medicine, Week tab, to see which ones. I cannot give medical advice.', '\nBuka Medicine, tab Week, untuk lihat yang mana. Saya tidak boleh bagi nasihat perubatan.');
      return done(mk(txt, Object.assign({ big: md.length ? String(md.length) : '0', bigLbl: L('missed in 7 days', 'terlepas 7 hari'), pct: -1, color: md.length ? '#ff9db5' : '#7df0c6' }, open)), {}, null, { intent: 'medmiss' });
    }
    // Cycle & Wellbeing: how to turn it on
    if (has(['haid', 'kitaran haid', 'cycle tracking', 'cycle card', 'cycle & wellbeing', 'period tracking', 'period tracker', 'datang bulan']) && has(['how', 'macam mana', 'cara', 'where', 'mana', 'turn on', 'hidupkan', 'on kan', 'ada', 'boleh']))
      return done(mk(L('Cycle & Wellbeing is private and off by default. Turn it on in Settings, Cycle & Wellbeing. Then open Habit & Health, Today tab, and tap the Cycle card to mark your period days and symptoms. My Life works out estimates on your phone, and Insights and Stats show them. It is not medical advice. Turn it off any time and it disappears everywhere.', 'Cycle & Wellbeing bersifat peribadi dan dimatikan secara lalai. Hidupkan di Settings, Cycle & Wellbeing. Kemudian buka Habit & Health, tab Today, dan ketuk kad Cycle untuk tanda hari haid dan simptom. My Life kira anggaran di telefon awak, dan Insights serta Stats menunjukkannya. Ia bukan nasihat perubatan. Matikan bila-bila masa dan ia hilang di semua tempat.'), open), {}, null, { intent: 'cycle-help' });
    // Medicine today: what is ticked and what is left
    const medList = (R.hd && R.hd.meds) || [];
    if (medList.length && has(['ubat', 'medicine', 'medication', 'medicines', 'pil ']) && !has(['how', 'macam mana', 'add', 'tambah', 'set', 'reminder', 'peringatan', 'where', 'dose', 'dos'])) {
      const due = medList.filter((m) => medDue(m, todayD)); const took = (((R.hd.days || {})[todayS] || {}).med) || [];
      const left = due.filter((m) => took.indexOf(m.id) < 0); const doneN = due.length - left.length;
      const txt = !due.length ? L('No medicine is set for today.', 'Tiada ubat ditetapkan untuk hari ini.')
        : !left.length ? L('All ' + due.length + ' of today\'s medicines are ticked as taken. Well done.', 'Semua ' + due.length + ' ubat hari ini sudah ditanda diambil. Syabas.')
          : L('Today ' + doneN + ' of ' + due.length + ' medicines are ticked as taken. Not ticked yet:\n', 'Hari ini ' + doneN + ' daripada ' + due.length + ' ubat sudah ditanda diambil. Belum ditanda:\n') + left.map((m) => '• ' + m.name + (m.time ? ' (' + to12(m.time) + ')' : '')).join('\n') + L('\nTick them in Habit & Health, Medication. I cannot give dose advice.', '\nTandakan di Habit & Health, Medication. Saya tidak boleh bagi nasihat dos.');
      return done(mk(txt, Object.assign({ big: due.length ? doneN + '/' + due.length : '', bigLbl: due.length ? L('taken today', 'diambil hari ini') : '', pct: due.length ? Math.round(doneN / due.length * 100) : -1, color: '#5ee7df' }, open)), {}, null, { intent: 'meds' });
    }
    // Relax minutes
    if (has(['relax', 'relaks', 'meditat', 'meditasi', 'breathing', 'pernafasan']) && has(['berapa', 'how long', 'how many', 'how much', 'minit', 'minutes', 'minggu', 'week', 'today', 'hari ini', 'lama']) && !has(['how to', 'macam mana', 'cara', 'where'])) {
      const dz = (R.hd && R.hd.days) || {}; const mins = (k) => Math.round((((dz[k] || {}).rl || []).reduce((t, r) => t + r.s, 0) / 60) * 10) / 10;
      let wk = 0, dn = 0; for (let i = 0; i < 7; i++) { const v = mins(iso(addDays(todayD, -i))); wk += v; if (v > 0) dn++; }
      wk = Math.round(wk * 10) / 10; const td0 = mins(todayS);
      return done(mk(wk > 0 ? L('Today you relaxed for ' + td0 + ' minutes. In the last 7 days: ' + wk + ' minutes over ' + dn + (dn === 1 ? ' day.' : ' days.'), 'Hari ini awak relaks ' + td0 + ' minit. Dalam 7 hari lepas: ' + wk + ' minit dalam ' + dn + ' hari.') : L('No Relax sessions in the last 7 days yet. Open Habit & Health, Today, and tap the Relax card to start one.', 'Belum ada sesi Relax dalam 7 hari lepas. Buka Habit & Health, Today, dan tekan kad Relax untuk mula.'), Object.assign({ big: wk > 0 ? wk + ' min' : '', bigLbl: wk > 0 ? L('last 7 days', '7 hari lepas') : '', color: '#7c9cff' }, open)), {}, null, { intent: 'relax' });
    }
    // Experiments: status when one is running, otherwise how to start
    if (has(['experiment', 'eksperimen'])) {
      const sts = ((R.hd && R.hd.exps) || []).map((e) => expState(e, R.hd)).filter(Boolean);
      const live = sts.filter((x) => !x.done); const fin = sts.filter((x) => x.done);
      const howto = has(['how', 'macam mana', 'cara', 'start', 'mula', 'new', 'baru', 'what is', 'apa itu', 'apa tu']) && !has(['going', 'doing', 'jalan', 'status', 'saya', 'my']);
      if (live.length && !howto) return done(mk(L('Your running experiment' + (live.length > 1 ? 's' : '') + ':\n', 'Eksperimen awak yang sedang berjalan:\n') + live.map((x) => L('• ' + x.tpl.title + ': day ' + x.dayNo + ' of ' + x.tpl.days + ', target met on ' + x.hit + ' of ' + x.logged + ' recorded days', '• ' + x.tpl.title + ': hari ' + x.dayNo + ' daripada ' + x.tpl.days + ', sasaran dicapai ' + x.hit + ' daripada ' + x.logged + ' hari direkod')).join('\n'), Object.assign({ big: live[0].hit + '/' + live[0].logged, bigLbl: L('days on target', 'hari capai sasaran'), color: '#5ee7df' }, open)), {}, null, { intent: 'experiments' });
      if (fin.length && !howto) { const x = fin[fin.length - 1]; return done(mk(L('No experiment is running now. Your last one, "' + x.tpl.title + '", met the target on ' + x.hit + ' of ' + x.logged + ' recorded days. Start a new one in Habit & Health, Patterns, Experiments.', 'Tiada eksperimen sedang berjalan. Yang terakhir, "' + x.tpl.title + '", capai sasaran ' + x.hit + ' daripada ' + x.logged + ' hari direkod. Mula yang baru di Habit & Health, Patterns, Experiments.'), open), {}, null, { intent: 'experiments' }); }
      return done(mk(L('Experiments are small tests of your own habits. Open Habit & Health, then the Patterns tab, and scroll to Experiments. Tap + New experiment and pick one, for example sleeping before 10:30 pm for 7 days. Each day is ticked from what you record, and at the end you see how many days you met the target. Tap Stop this experiment to end it early.', 'Experiments ialah ujian kecil untuk tabiat awak sendiri. Buka Habit & Health, kemudian tab Patterns, dan skrol ke Experiments. Tekan + New experiment dan pilih satu, contohnya tidur sebelum 10:30 malam selama 7 hari. Setiap hari ditanda daripada apa yang awak rekod, dan di hujungnya awak nampak berapa hari sasaran dicapai. Tekan Stop this experiment untuk tamatkan awal.'), open), {}, null, { intent: 'experiments-help' });
    }
    if (has(['pattern', 'patterns', 'corak']) && has(['how', 'macam mana', 'where', 'mana', 'what', 'apa', 'beza', 'difference', 'different', 'start', 'mula', 'tab']))
      return done(mk(L('Open Habit & Health, then the Patterns tab. It shows your day at a glance, patterns found in your own records, and a Time Machine with your calendar, graphs, a future guess and memories. Tap Body hologram in it to tap your brain, lungs or muscles, go back to any day, compare two days, or see an estimate 7, 30 or 90 days ahead (flat or 3D view). The Progress tab is different: it shows how you are doing, with your streak, this week against last week and badges. Under Experiments you can start a 7 or 14 day challenge, like sleeping before 11 pm, and see before and after.', 'Buka Habit & Health, kemudian tab Patterns. Ia tunjuk hari awak sekilas pandang, corak daripada rekod awak sendiri, dan Time Machine dengan kalendar, graf, anggaran masa depan dan kenangan. Tekan Body hologram di dalamnya untuk ketuk otak, paru-paru atau otot, pergi ke mana-mana hari lepas, bandingkan dua hari, atau lihat anggaran 7, 30 atau 90 hari ke depan (rata atau 3D view). Tab Progress pula berbeza: ia tunjuk kemajuan awak, dengan streak, minggu ini berbanding minggu lepas dan lencana. Di bawah Experiments awak boleh mula cabaran 7 atau 14 hari, contohnya tidur sebelum 11 malam, dan lihat sebelum dan selepas.'), open), {}, null, { intent: 'patterns-help' });
  }
  // where the steps come from
  if (modOn('habit') && has(['langkah', 'step', 'steps']) && has(['dari mana', 'sumber', 'source', 'macam mana dikira', 'how are steps counted', 'how do you count', 'how does step', 'how is step', 'dikira macam mana', 'counted'])) {
    const hc = ((R.days || {})[todayS] || {}).hc;
    return done(mk(hc != null
      ? L('Your steps are counted automatically from Health Connect or your phone\'s own step sensor, whichever is higher, plus anything you added by hand. Open My Life now and then to refresh the total.', 'Langkah awak dikira automatik daripada Health Connect atau sensor langkah telefon, mana yang lebih tinggi, ditambah apa yang awak masukkan sendiri. Buka My Life sekali-sekala untuk kemas kini jumlah.')
      : L('Right now your steps are only what you typed in. Turn on Count steps automatically in Habit & Health to count them from your phone.', 'Setakat ini langkah awak hanya yang awak taip. Hidupkan Count steps automatically di Habit & Health untuk kira daripada telefon.'),
      { label: L('Open Habit & Health', 'Buka Habit & Health'), href: 'Habit.dc.html' }), {}, null, { intent: 'steps' });
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
    const g = night ? L('Good night, ' + A.fn() + '. Rest well.' + (modOn('islamic') ? ' Fajr is not far away.' : ''), 'Selamat malam, ' + A.fn() + '. Rehat secukupnya.' + (modOn('islamic') ? ' Subuh pun tak lama lagi.' : ''))
      : (pg || (!tg && h < 12)) ? L('Good morning, ' + A.fn() + '!', 'Selamat pagi, ' + A.fn() + '!') : h < 17 ? L('Good afternoon, ' + A.fn() + '!', 'Selamat tengah hari, ' + A.fn() + '!') : L('Good evening, ' + A.fn() + '!', (h < 20 ? 'Selamat petang, ' : 'Selamat malam, ') + A.fn() + '!');
    const np = A.nextPrayer(); const open = s.tasks.filter((t) => t.s !== 'done');
    const bits = []; if (!night) { if (np && modOn('islamic')) bits.push(L('Next prayer: ' + np.name + ' at ' + np.time + '.', 'Solat seterusnya: ' + np.name + ' pada ' + np.time + '.')); if (open.length && modOn('planner')) bits.push(L('You have ' + open.length + ' open tasks.', 'Awak ada ' + open.length + ' tugasan belum siap.')); }
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
  if (/(sedih|sad|down|kecewa|lonely|sunyi|bosan|bored)/.test(ql) && !has(['berapa']) && !/(sindrom down|down syndrome|down'?s syndrome)/.test(ql)) {
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
  // A module that is turned off in Settings is not answered here.
  // Pulse from a smart watch
  if (modOn('habit') && has(['smart watch', 'smartwatch', 'watch', 'jam pintar', 'band', 'heart rate', 'nadi', 'pulse']) && has(['automatic', 'automatically', 'auto', 'sync', 'connect', 'from my watch', 'dari jam', 'secara automatik'])) {
    return done(mk(L('Yes. In Habit and Health, open the Today tab, then Heart log under Sleep Tracker, and turn on Pulse from my smart watch. It works with any watch or band whose app can share to Health Connect (for example Honor Health, Samsung Health, Mi Fitness, Zepp, Fitbit or Garmin Connect). First open your watch app, go to Settings, Health Connect and allow it to share Heart rate. Then allow My Life 1.0 to read it. You see your latest pulse and the last 24 hours, and one reading every 6 hours is saved to your notebook. Your night pulse also helps the Energy estimate.', 'Boleh. Dalam Habit and Health, buka tab Body, kemudian Heart log, dan hidupkan Pulse from my smart watch. Ia berfungsi dengan mana-mana jam atau band yang app-nya boleh kongsi ke Health Connect (contohnya Honor Health, Samsung Health, Mi Fitness, Zepp, Fitbit atau Garmin Connect). Mula-mula buka app jam awak, pergi Settings, Health Connect dan benarkan kongsi Heart rate. Lepas tu benarkan My Life 1.0 membacanya. Awak nampak nadi terkini dan 24 jam lepas, dan satu bacaan setiap 3 jam disimpan dalam buku nota. Nadi malam awak juga membantu anggaran Energy.'), { label: L('Open Habit and Health', 'Buka Habit and Health'), href: 'Habit.dc.html' }));
  }
  // Subscriptions: how to cancel
  if (modOn('finance') && has(['cancel', 'unsubscribe', 'unsubscription', 'batalkan', 'berhenti langgan', 'batal langganan', 'nak berhenti']) && has(['subscription', 'subscriptions', 'langganan', 'netflix', 'spotify', 'youtube', 'claude', 'chatgpt', 'disney', 'icloud', 'google one', 'dropbox', 'adobe', 'notion', 'xbox', 'playstation', 'canva', 'duolingo', 'linkedin'])) {
    return done(mk(L('Open My Finance, then Subscriptions, tap the subscription, then tap How to cancel. It shows the steps one by one, with a link to the service\'s own page. My Life 1.0 cannot cancel for you, so cancel in the service first, then mark it as cancelled in the app.', 'Buka My Finance, kemudian Subscriptions, tekan langganan itu, lepas tu tekan How to cancel. Ia tunjuk langkah satu demi satu, dengan pautan ke laman rasmi servis. My Life 1.0 tak boleh batalkan untuk awak, jadi batalkan dalam servis itu dulu, kemudian tanda sebagai dibatalkan dalam app.'), { label: L('Open Subscriptions', 'Buka Subscriptions'), href: 'Finance.dc.html' }));
  }
  // Subscriptions: the Summary tabs (costliest, per day, by payment, save)
  if (modOn('finance') && has(['subscription', 'subscriptions', 'langganan']) && has(['per day', 'a day', 'sehari', 'costliest', 'most expensive', 'paling mahal', 'summary', 'ringkasan', 'save money', 'jimat', 'by payment', 'cara bayar', 'income', 'pendapatan'])) {
    return done(mk(L('Open My Finance, then Subscriptions, and look at Summary. It is one card that turns by itself, and you can press and hold to pause it or swipe to turn it. Costliest shows your subscriptions from the most expensive, with the cost a year. Per day shows what they cost every day and what share of your income this month. By payment shows how much leaves each card or e-wallet. Save shows the three that would free up the most money a year. Next 5 months shows what will be charged.', 'Buka My Finance, kemudian Subscriptions, dan tengok Summary. Ia satu kad yang berpusing sendiri, dan awak boleh tekan tahan untuk jeda atau leret untuk tukar halaman. Costliest tunjuk langganan dari yang paling mahal, dengan kos setahun. Per day tunjuk kos sehari dan peratus daripada pendapatan bulan ini. By payment tunjuk berapa keluar dari setiap kad atau e-wallet. Save tunjuk tiga yang paling banyak jimat setahun. Next 5 months tunjuk caj akan datang.'), { label: L('Open Subscriptions', 'Buka Subscriptions'), href: 'Finance.dc.html' }));
  }
  // Subscriptions: what charges soon and the monthly total
  if (modOn('finance') && has(['subscription', 'subscriptions', 'langganan', 'netflix', 'spotify', 'youtube', 'claude pro', 'chatgpt', 'disney', 'icloud', 'google one'])) {
    const sl = (R.subs || []).slice().sort((a, b) => a.n - b.n);
    if (sl.length) {
      const nm = sl.find((x) => qn.includes(x.name.toLowerCase().split(' ')[0]));
      const rmf = (v) => cs() + v.toFixed(2);
      const say = (x) => x.name + ' ' + (x.trial ? L('free trial ends ', 'percubaan percuma tamat ') : L('charges ', 'dicaj ')) + (x.n <= 0 ? L('today', 'hari ini') : x.n === 1 ? L('tomorrow', 'esok') : L('in ' + x.n + ' days', 'dalam ' + x.n + ' hari')) + ' (' + rmf(x.price) + ')';
      if (nm) return done(mk(say(nm) + '.', { label: L('Open Subscriptions', 'Buka Subscriptions'), href: 'Finance.dc.html' }));
      return done(mk(L('You pay about ' + rmf(R.subsMonth) + ' a month on ' + sl.length + ' subscriptions. Next: ', 'Awak bayar kira-kira ' + rmf(R.subsMonth) + ' sebulan untuk ' + sl.length + ' langganan. Seterusnya: ') + sl.slice(0, 3).map(say).join('; ') + '.', { label: L('Open Subscriptions', 'Buka Subscriptions'), href: 'Finance.dc.html' }));
    }
    return done(mk(L('You have no subscriptions yet. Open My Finance, then Subscriptions, tap + to add one or scan a bill. My Life also looks in your spending for payments that repeat every month and suggests them.', 'Belum ada langganan. Buka My Finance, kemudian Subscriptions, tekan + untuk tambah atau imbas bil. My Life juga mencari bayaran berulang dalam belanja awak dan mencadangkannya.'), { label: L('Open My Finance', 'Buka My Finance'), href: 'Finance.dc.html' }));
  }
  // Documents data: what ends soon
  if (modOn('record') && has(['expire', 'expiry', 'expires', 'tamat', 'luput', 'renew', 'warranty', 'waranti', 'passport', 'pasport', 'mykad', 'cidb', 'permit', 'insurance', 'insurans']) && has(['when', 'bila', 'soon', 'tak lama', 'which', 'mana', 'expire', 'expires', 'tamat', 'luput', 'status', 'left', 'baki'])) {
    const dl = (R.docs || []).filter((x) => x.n != null).slice().sort((a, b) => a.n - b.n);
    if (dl.length) {
      const say = (x) => x.title + (x.n < 0 ? L(' expired ' + -x.n + ' days ago', ' tamat ' + -x.n + ' hari lalu') : x.n === 0 ? L(' ends today', ' tamat hari ini') : L(' ends in ' + x.n + ' days (' + x.expiry.split('-').reverse().join('/') + ')', ' tamat dalam ' + x.n + ' hari (' + x.expiry.split('-').reverse().join('/') + ')'));
      return done(mk(L('Soonest in Documents: ', 'Paling dekat dalam Documents: ') + dl.slice(0, 3).map(say).join('; ') + '.', { label: L('Open Documents', 'Buka Documents'), href: 'Record.dc.html' }));
    }
  }
  // Lent and Borrowed data: who owes what
  if (modOn('record') && has(['owe', 'owes', 'hutang', 'pinjam', 'lent', 'borrowed', 'berhutang']) && has(['who', 'siapa', 'how much', 'berapa', 'total', 'jumlah', 'owe', 'owes'])) {
    const open = (R.loans || []).filter((x) => !x.done); const lent = open.filter((x) => x.dir === 'lent'), bor = open.filter((x) => x.dir === 'borrowed');
    const sum = (a) => a.filter((x) => x.what === 'money').reduce((t, x) => t + x.amount, 0);
    if (open.length) {
      const nm = (a) => a.slice(0, 4).map((x) => x.who + (x.what === 'money' ? ' ' + rm(x.amount) : ' (' + (x.title || L('thing', 'barang')) + ')')).join(', ');
      return done(mk((lent.length ? L('Owed to you: ', 'Orang berhutang dengan awak: ') + rm(sum(lent)) + (nm(lent) ? ' · ' + nm(lent) : '') + '. ' : '') + (bor.length ? L('You owe: ', 'Awak berhutang: ') + rm(sum(bor)) + ' · ' + nm(bor) + '.' : ''), { label: L('Open Lent & Borrowed', 'Buka Lent & Borrowed'), href: 'Record.dc.html' }));
    }
  }
  // Today's life lesson (the same one the Dashboard card shows)
  if (has(['lesson of the day', 'lesson today', 'today lesson', 'life lesson today', 'pengajaran hari ini', 'pengajaran harini', 'pengajaran today', 'nasihat hari ini', 'nasihat harini', 'give me a lesson', 'bagi pengajaran', 'bagi nasihat'])) {
    const ld = lessonOfDay(R.lessons);
    return done(mk((ld.mine ? L('One you wrote: ', 'Yang awak tulis: ') : L('Today\'s lesson: ', 'Pengajaran hari ini: ')) + ld.title + '. ' + ld.text, { label: L('Open Life Lessons', 'Buka Life Lessons'), href: 'Record.dc.html' }));
  }
  // Personal Collection help (how to, not data)
  if (modOn('record') && !/\d/.test(qn) && has(['lent', 'borrow', 'pinjam', 'hutang orang', 'gadget', 'lesson', 'pengajaran', 'personal collection'])) {
    return done(mk(L('Open My Record, then Personal Collection. Gadgets, Lifestyle and Property keep what you own with a photo and price. Lent & Borrowed tracks money and things with a due date and a 9 am reminder. Gadgets also show what they are worth now (type it yourself, or get a guess from price, age, brand and condition), the days of warranty left, and the receipt you link from Documents. Lent & Borrowed can open a polite message in WhatsApp or any other app that you send yourself, shows your history with each person, and lets you add part payments. Personal Collection can also make a PDF list of everything you own for an insurance claim. Each item can have up to 5 photos, shown as a list or a grid. Life Lessons keeps short notes, and one lesson shows on the Dashboard card each day. Tap the plus button inside each part to add.', 'Buka My Record, kemudian Personal Collection. Gadgets, Lifestyle dan Property simpan barang awak dengan gambar dan harga. Lent & Borrowed jejak duit dan barang yang dipinjam dengan tarikh pulang dan peringatan jam 9 pagi. Gadget juga tunjuk nilai sekarang (isi sendiri, atau anggaran daripada harga, umur, jenama dan keadaan), baki hari waranti, dan resit yang awak pautkan dari Documents. Lent & Borrowed boleh buka mesej sopan dalam WhatsApp atau app lain untuk awak hantar sendiri, tunjuk sejarah dengan setiap orang, dan boleh catat bayaran separa. Personal Collection juga boleh buat senarai PDF semua barang awak untuk tuntutan insurans. Setiap barang boleh ada sehingga 5 gambar, dalam paparan senarai atau grid. Life Lessons simpan nota pendek, dan satu pengajaran dipaparkan pada kad Dashboard setiap hari. Tekan butang tambah di dalam setiap bahagian.'), { label: L('Open My Record', 'Buka My Record'), href: 'Record.dc.html' }));
  }
  // Documents help (how to, not data)
  if (modOn('record') && !/\d/.test(qn) && has(['passport', 'pasport', 'mykad', 'cidb', 'warranty', 'waranti', 'dokumen', 'documents', 'member card', 'kad ahli', 'scan', 'imbas'])) {
    return done(mk(L('Open My Record, then Documents. Pick a tab (Identity, Cards, Warranty or Other), tap the plus button, and either scan with the camera (it finds the page, straightens and cleans it up like a scanner app) or choose a photo to fill in the details, or type them. Choose a reminder before the expiry date. Details are saved to your account, photos stay on your phone only.', 'Buka My Record, kemudian Documents. Pilih tab (Identity, Cards, Warranty atau Other), tekan butang tambah, dan imbas dengan kamera (ia cari halaman, luruskan dan bersihkan seperti app pengimbas) atau pilih foto untuk isi butiran, atau taip sendiri. Pilih peringatan sebelum tarikh tamat. Butiran disimpan ke akaun anda, foto kekal di telefon sahaja.'), { label: L('Open Documents', 'Buka Documents'), href: 'Record.dc.html' }));
  }
  const offAns = (name, nameBm) => done(mk(L(name + ' is turned off. You can turn it on again in Settings, Modules.', nameBm + ' dimatikan. Hidupkan semula di Settings, Modules.')));
  if (!modOn('habit') && ['steps', 'dist', 'sleep', 'water', 'mood'].indexOf(intent) >= 0) return offAns('Habit & Health', 'Habit & Health');
  if (!modOn('planner') && ['tasks', 'due', 'events'].indexOf(intent) >= 0) return offAns('Daily Planner', 'Daily Planner');
  if (!modOn('finance') && (isSpend || ['spend', 'income', 'left'].indexOf(intent) >= 0 || has(['tabung', 'simpanan', 'savings goal', 'savings goals', 'bajet', 'budget', 'hutang', 'komitmen', 'commitment', 'gaji', 'salary']))) return offAns('My Finance', 'My Finance');
  if (!modOn('islamic') && has(['solat', 'prayer', 'subuh', 'zohor', 'asar', 'maghrib', 'isyak', 'quran', 'tahlil', 'zikir', 'tasbih', 'puasa', 'fasting', 'qadha', 'kiblat', 'mathurat'])) return offAns('Islamic Hub', 'Islamic Hub');
  if (!modOn('record') && has(['motor', 'motosikal', 'servis', 'service', 'odometer', 'mileage', 'milage', 'cukai jalan', 'road tax', 'insurans', 'insurance', 'kenderaan', 'vehicle'])) return offAns('My Record', 'My Record');

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
  if ((intent === 'tasks' || intent === 'due' || intent === 'events' || has(['agenda', 'jadual', 'schedule', 'apa ada', 'ada apa', 'whats on', 'what is on', 'apa yang ada', 'what do i have', 'plan', 'rancangan'])) && (findDate(ql) || per)) {
    const fd = findDate(ql); let from, to, lab;
    if (fd && !(per && per.k === 'week')) { from = fd.date; to = iso(addDays(new Date(fd.date + 'T12:00:00'), 1)); lab = fmt(fd.date); } else { const p = per || period(' this week '); from = p.from; to = p.to; lab = L(p.en, p.ms); }
    if (!fd && per && (per.k === 'week')) { to = iso(addDays(new Date(per.from + 'T12:00:00'), 7)); }
    const tk = (R.plTasks || []).filter((t) => t.status !== 'done' && t.due && t.due >= from && t.due < to);
    const ev = (R.plEvents || []).filter((e) => !e.done && e.date >= from && e.date < to);
    const lines = ev.map((e) => '• ' + L('Event', 'Acara') + ': ' + e.name + ' (' + fmt(e.date) + ')').concat(tk.map((t) => '• ' + L('Task', 'Tugasan') + ': ' + t.name + ' (' + fmt(t.due) + ')'));
    return done(mk(lines.length ? L('On your list for ' + lab + ':\n', 'Dalam senarai awak untuk ' + lab + ':\n') + lines.join('\n') : L('Nothing planned for ' + lab + '. A clear day.', 'Tiada rancangan untuk ' + lab + '. Hari yang lapang.'), { label: L('Open Daily Planner', 'Buka Daily Planner'), href: 'Planner.dc.html' }));
  }
  // follow-up questions that rely on the last topic
  if (ctx.intent && short && (follow || per || cat) && (!hasOwn || ((per || cat) && ['mmonth', 'mcmp', 'spend', 'spendM', 'steps', 'sleep', 'water', 'mood', 'dist'].indexOf(intent) >= 0) || has(['pula', 'pulak', 'how about', 'what about', 'macam mana dengan']))) {
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
    const small = cur.filter((x) => x.amt <= 15); if (small.length >= 5) out.push(L('• ' + small.length + ' small spends of ' + cs() + '15 or less add up to ' + rm(sum(small, (x) => x.amt)) + '. Small things add up.', '• ' + small.length + ' belanja kecil ' + cs() + '15 ke bawah berjumlah ' + rm(sum(small, (x) => x.amt)) + '. Yang kecil pun terkumpul.'));
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
