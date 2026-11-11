// @ts-nocheck
import React from 'react';
import * as F from './fasting';
import { upcomingMy } from './myEvents';
import * as DB from './debts';
import { think, fix } from './assistantBrain';
// Answer engine. It reads the real saved data of the app, handed in through this.props.real, and saves through this.props.persist.
export class AssistantBase extends React.Component<any, any> {
  render(): any { return null; }
  constructor(props) {
    super(props);
    this.state = {
      msgs: [], draft: '', lang: 'en', cat: 0, typing: false, cups: 0,
      steps: 0, sleep: 0, mood: 0, odo: 0, nextSvc: 0, kmMonth: 0, mtcMonth: 0, income: 0, pending: null, pid: 0,
      tasks: []
    };
    Object.assign(this.state, this.fromReal(props.real));
  }
  // The numbers on screen come from the saved data of the app (this.props.real), never from samples.
  R() { return this.props.real || {}; }
  fromReal(r) {
    r = r || {};
    return { steps: r.steps || 0, cups: r.cups || 0, sleep: r.sleep || 0, mood: r.mood || 0, odo: r.odo || 0, kmMonth: r.kmMonth || 0, mtcMonth: r.mtcMonth || 0, income: r.income || 0, tasks: r.tasks || [], nextSvc: r.nextSvc || 0 };
  }
  componentDidMount() { this.setState(this.fromReal(this.props.real)); }
  componentDidUpdate(prev) { if (prev.real !== this.props.real) this.setState(this.fromReal(this.props.real)); }
  todayStr(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  rm(n) { return String(Math.round(n * 100) / 100); }
  mk(text, x) { return Object.assign({ me: false, text: this.clean(text), time: this.hm(), big: '', bigLbl: '', pct: -1, color: '#8fe9e2', label: '', href: '', pid: 0 }, x || {}); }
  D() {
    const s = this.state; const r = this.R();
    const cats = r.cats || {}; let top = ''; let topAmt = 0;
    Object.keys(cats).forEach(k => { if (cats[k] > topAmt) { top = k; topAmt = cats[k]; } });
    const rr = (n) => Math.round(n * 100) / 100;
    return {
      steps: s.steps, goal: r.goal || 8000, sleep: s.sleep, sleepGoal: 7, cupGoal: r.cupGoal || 8, mood: s.mood, score: r.score || 0, streak: r.streak || 0,
      spendToday: rr(r.spendToday || 0), spendMonth: rr(r.spendMonth || 0), income: s.income, topCat: top, topAmt: rr(topAmt), hasSpend: !!r.hasSpend,
      kmMonth: r.kmMonth, kmLast: r.kmLast, odo: s.odo, nextSvc: r.nextSvc, nextSvcName: r.nextSvcName || '', mtcMonth: rr(s.mtcMonth), hasVehicle: !!r.hasVehicle,
      P: r.P || [], events: r.events || []
    };
  }
  has(qn, list) { const p = ' ' + qn + ' '; return list.some(k => p.indexOf(' ' + k) >= 0); }
  parseAct(q, qn) {
    const ql = q.toLowerCase(); const has = (l) => this.has(qn, l);
    if (has(['berapa', 'how much', 'how many', 'what', 'apa', 'bila', 'when', 'macam mana', 'how', 'siapa', 'adakah', 'is my', 'are my'])) return null;
    let money = null; const mm = ql.match(/rm\s*([\d,]+(?:\.\d+)?)/) || ql.match(/([\d,]+(?:\.\d+)?)\s*(?:ringgit|rm\b)/);
    if (mm) { const v = parseFloat(mm[1].replace(/,/g, '')); if (v > 0) money = v; }
    const kmm = ql.match(/([\d,]{4,7})\s*km/) || ql.match(/(?:odometer|odo|mileage|milage|meter)\D{0,15}?([\d,]{4,7})/);
    const kmv = kmm ? parseInt(kmm[1].replace(/,/g, ''), 10) : null;
    const svc = [['tukar minyak', 'Oil change'], ['oil', 'Oil change'], ['servis', 'Service'], ['service', 'Service'], ['tayar', 'Tyres'], ['tyre', 'Tyres'], ['tire', 'Tyres'], ['brek', 'Brakes'], ['brake', 'Brakes'], ['rantai', 'Chain'], ['chain', 'Chain'], ['bateri', 'Battery'], ['battery', 'Battery'], ['baiki', 'Repair'], ['repair', 'Repair']];
    const hit = svc.filter(x => has([x[0]]))[0];
    if (money != null && hit) return { type: 'mtc', amt: money, name: hit[1], odo: kmv && kmv >= 1000 ? kmv : null };
    if (money != null && has(['gaji', 'salary', 'income', 'pendapatan', 'overtime', 'claim', 'tuntutan', 'bonus', 'elaun', 'allowance']) && has(['masuk', 'received', 'dapat', 'terima', 'got', 'earned', 'tambah', 'add', 'record', 'rekod', 'simpan', 'save'])) {
      const nm = has(['overtime']) ? 'Overtime' : has(['claim', 'tuntutan']) ? 'Claim' : has(['bonus']) ? 'Bonus' : has(['gaji', 'salary']) ? 'Salary' : 'Income';
      return { type: 'inc', amt: money, name: nm };
    }
    if (kmv != null && kmv >= 1000 && has(['tambah', 'add', 'set', 'update', 'kemas', 'rekod', 'record', 'simpan', 'save', 'sekarang', 'now', 'dah', 'already', 'log', 'masuk', 'current', 'semasa', 'bacaan', 'odometer', 'odo', 'mileage', 'milage'])) return { type: 'odo', val: kmv };
    if (money != null && (has(['spend', 'spent', 'belanja', 'beli', 'bayar', 'paid', 'pay', 'buy', 'bought', 'expense', 'habis', 'makan', 'lunch', 'dinner', 'breakfast', 'sarapan', 'petrol', 'topup', 'simpan', 'record', 'rekod', 'save', 'tambah', 'add']))) {
      const cat = has(['makan', 'food', 'lunch', 'dinner', 'breakfast', 'sarapan', 'minum', 'kopi', 'coffee', 'nasi', 'mee', 'teh', 'roti', 'snack']) ? 'Food' : has(['petrol', 'minyak', 'fuel', 'parking', 'tol', 'toll', 'grab', 'bas', 'bus', 'lrt']) ? 'Petrol' : has(['bil', 'bill', 'elektrik', 'internet', 'phone', 'telco', 'topup', 'sewa', 'rent']) ? 'Bills' : has(['shop', 'shopping', 'baju', 'kasut', 'shirt', 'shoes', 'beli barang']) ? 'Shopping' : 'Other';
      let nm = ql.replace(/rm\s*[\d,.]+/g, ' ').replace(/[\d,.]+\s*(ringgit|rm)/g, ' ');
      const g = nm.match(/(?:untuk|for|on|beli|buat|bought|buy)\s+(.+)$/);
      nm = g ? g[1] : '';
      nm = nm.replace(/\b(hari ini|harini|hari nie|today|semalam|yesterday|tadi|saya|i|nie|ini)\b/g, ' ').replace(/^\s*(beli|buy|bought|untuk|for)\s+/, '').replace(/\s+/g, ' ').trim();
      if (!nm) nm = cat === 'Other' ? 'Spending' : cat;
      nm = nm.charAt(0).toUpperCase() + nm.slice(1);
      const y = has(['semalam', 'yesterday']);
      const d = new Date(); if (y) d.setDate(d.getDate() - 1);
      return { type: 'spend', amt: money, cat: cat, name: nm, date: this.todayStr(d), ydy: y };
    }
    const sh = ql.match(/(\d+(?:\.\d+)?)\s*(jam|hours?|hrs?|h\b)/);
    if (sh && has(['tidur', 'sleep', 'slept']) && parseFloat(sh[1]) <= 14) return { type: 'sleep', h: parseFloat(sh[1]) };
    if (has(['mood', 'perasaan', 'rasa', 'feel', 'feeling'])) {
      const v = has(['awful', 'teruk', 'terrible', 'bad']) ? 1 : has(['low', 'sedih', 'sad', 'rendah']) ? 2 : has(['great', 'hebat', 'excellent', 'bagus', 'best']) ? 5 : has(['good', 'baik', 'happy', 'gembira', 'seronok']) ? 4 : has(['okay', 'biasa', 'ok']) ? 3 : 0;
      if (v) return { type: 'mood', v: v };
    }
    const sm = qn.match(/(\d{2,6})/);
    if (sm && has(['langkah', 'step', 'steps']) && has(['tambah', 'add', 'log', 'rekod', 'jalan', 'walked', 'dah', 'took'])) return { type: 'steps', n: parseInt(sm[1], 10) };
    if (has(['dah', 'sudah', 'telah', 'prayed', 'done', 'tunai', 'siap']) && has(['subuh', 'zohor', 'zuhur', 'asar', 'maghrib', 'isyak', 'fajr', 'dhuhr', 'asr', 'isha', 'solat', 'prayer'])) {
      const nm = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'].filter(x => has([x.toLowerCase()]))[0] || (has(['fajr']) ? 'Subuh' : has(['dhuhr', 'zuhur']) ? 'Zohor' : has(['asr']) ? 'Asar' : has(['isha']) ? 'Isyak' : '');
      return { type: 'pray', name: nm };
    }
    return null;
  }
  confirm(yes) {
    const s = this.state; const p = s.pending; if (!p) return;
    const L = (en, ms) => (s.lang === 'ms' ? ms : en);
    const D = this.D(); let patch = { pending: null }; let m;
    if (!yes) m = this.mk(L('Okay, I did not save it.', 'Baik, saya tidak simpan.'));
    else if (p.type === 'undoSpend') {
      m = this.mk(L('Removed "' + p.name + '" (RM ' + this.rm(p.amt) + ') from My Finance.', 'Dah buang "' + p.name + '" (RM ' + this.rm(p.amt) + ') daripada My Finance.'), { label: L('Open My Finance', 'Buka My Finance'), href: 'Finance.dc.html' });
    } else if (p.type === 'spend') {
      const tdy = D.spendToday + (p.date === this.todayStr() ? p.amt : 0);
      m = this.mk(L('Saved RM ' + this.rm(p.amt) + ' under ' + p.cat + ' in My Finance. You have spent RM ' + this.rm(tdy) + ' today.', 'Dah disimpan RM ' + this.rm(p.amt) + ' di bawah ' + p.cat + ' dalam My Finance. Awak dah belanja RM ' + this.rm(tdy) + ' hari ini.'), { big: 'RM ' + this.rm(tdy), bigLbl: L('spent today', 'belanja hari ini'), color: '#ffc46b', label: L('Open Spending Tracker', 'Buka Spending Tracker'), href: 'Finance.dc.html' });
    } else if (p.type === 'mtc') {
      patch.mtcMonth = s.mtcMonth + p.amt;
      let extra = '';
      if (p.odo && p.odo > s.odo) { patch.kmMonth = s.kmMonth + (p.odo - s.odo); patch.odo = p.odo; extra = L(' Odometer updated to ' + this.num(p.odo) + ' km.', ' Odometer dikemas kini kepada ' + this.num(p.odo) + ' km.'); }
      if (p.name === 'Service' || p.name === 'Oil change') { patch.nextSvc = (patch.odo || s.odo) + 3000; extra += L(' Next service is at ' + this.num(patch.nextSvc) + ' km.', ' Servis seterusnya pada ' + this.num(patch.nextSvc) + ' km.'); }
      m = this.mk(L('Saved ' + p.name + ' RM ' + this.rm(p.amt) + ' in My Record. Maintenance this month is RM ' + this.rm(s.mtcMonth + p.amt) + '.', 'Dah disimpan ' + p.name + ' RM ' + this.rm(p.amt) + ' dalam My Record. Penyelenggaraan bulan ini RM ' + this.rm(s.mtcMonth + p.amt) + '.') + extra, { big: 'RM ' + this.rm(p.amt), bigLbl: p.name, color: '#ffc46b', label: L('Open My Record', 'Buka My Record'), href: 'Record.dc.html' });
    } else if (p.type === 'inc') {
      patch.income = s.income + p.amt;
      m = this.mk(L('Saved ' + p.name + ' RM ' + this.rm(p.amt) + ' in Monthly Income. This month total is RM ' + this.num(s.income + p.amt) + '.', 'Dah disimpan ' + p.name + ' RM ' + this.rm(p.amt) + ' dalam Pendapatan Bulanan. Jumlah bulan ini RM ' + this.num(s.income + p.amt) + '.'), { big: 'RM ' + this.num(s.income + p.amt), bigLbl: L('income this month', 'pendapatan bulan ini'), color: '#34d399', label: L('Open Monthly Income', 'Buka Pendapatan Bulanan'), href: 'Finance.dc.html' });
    } else if (p.type === 'odo') {
      const diff = p.val - s.odo; patch.odo = p.val; patch.kmMonth = s.kmMonth + diff;
      m = this.mk(L('Odometer saved: ' + this.num(p.val) + ' km. That is ' + diff + ' km since the last reading, so this month is ' + (s.kmMonth + diff) + ' km.', 'Odometer disimpan: ' + this.num(p.val) + ' km. Itu ' + diff + ' km sejak bacaan terakhir, jadi bulan ini ' + (s.kmMonth + diff) + ' km.'), { big: this.num(p.val), bigLbl: 'km', color: '#ff8fab', label: L('Open My Record', 'Buka My Record'), href: 'Record.dc.html' });
    }
    this.setState(Object.assign({ msgs: s.msgs.concat([m]) }, patch));
    if (yes && this.props.persist) this.props.persist(p.type === 'undoSpend' ? { type: 'undoSpend', id: p.sid } : p);
    this.scroll();
  }
  hm() { const d = new Date(); let h = d.getHours(); const m = String(d.getMinutes()).padStart(2, '0'); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + m + ' ' + ap; }
  num(n) { return Number(n).toLocaleString('en-US'); }
  norm(q) { return (q || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  daysTo(s) { if (!s) return null; const p = s.split('-'); const a = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); const n = new Date(); const b = new Date(n.getFullYear(), n.getMonth(), n.getDate()); return Math.round((a - b) / 86400000); }
  dueText(d, L) {
    const n = this.daysTo(d);
    if (n === null) return L('no due date', 'tiada tarikh');
    if (n < 0) return L('overdue by ' + (-n) + ' d', 'lewat ' + (-n) + ' hari');
    if (n === 0) return L('due today', 'hari ini');
    if (n === 1) return L('due tomorrow', 'esok');
    return L('in ' + n + ' days', 'dalam ' + n + ' hari');
  }
  // With no name yet fn() returns a marker that clean() removes together with the comma or space before it, so "Hi \u0001!" reads "Hi!".
  fn() { return String(this.props.userName || '').trim().split(/\s+/)[0] || '\u0001'; }
  clean(t) { return typeof t === 'string' ? t.replace(/,?\s?\u0001/g, '') : t; }
  nextPrayer() {
    const D = this.D(); if (!D.P.length) return null; const now = new Date(); const cur = now.getHours() * 60 + now.getMinutes();
    let pick = null; let add = 0;
    for (let i = 0; i < D.P.length; i++) { const t = D.P[i][1] * 60 + D.P[i][2]; if (t > cur) { pick = D.P[i]; break; } }
    if (!pick) { pick = D.P[0]; add = 1440; }
    const diff = pick[1] * 60 + pick[2] + add - cur;
    let h = pick[1]; const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    return { name: pick[0], time: h + ':' + String(pick[2]).padStart(2, '0') + ' ' + ap, mins: diff, hh: Math.floor(diff / 60), mm: diff % 60 };
  }
  detect(q) {
    const t = this.norm(q).split(' ');
    const ms = ['berapa', 'saya', 'hari', 'ini', 'macam', 'mana', 'tahap', 'belanja', 'tidur', 'langkah', 'tugasan', 'solat', 'tambah', 'bila', 'apa', 'bulan', 'lepas', 'awak', 'boleh', 'jauh', 'baki', 'gaji', 'servis', 'kesihatan', 'adakah', 'siapa', 'tolong', 'sekarang', 'esok', 'kiblat'];
    const en = ['what', 'how', 'my', 'today', 'am', 'the', 'is', 'many', 'much', 'did', 'can', 'who', 'when', 'steps', 'sleep', 'this', 'month', 'mileage', 'spent', 'spend', 'add', 'next', 'left', 'income', 'tasks', 'task', 'water', 'prayer', 'fasting', 'debts', 'reminders', 'lock', 'service', 'odometer', 'are', 'on', 'i', 'show', 'tell'];
    if (t.some(x => ms.indexOf(x) >= 0)) return 'ms';
    if (t.some(x => en.indexOf(x) >= 0)) return 'en';
    return null;
  }
  intents() {
    return [
      { id: 'steps', k: ['step', 'steps', 'langkah', 'pedometer', 'berjalan kaki'] },
      { id: 'dist', k: ['jauh', 'jarak jalan', 'distance walked', 'walked', 'walk', 'berjalan', 'jalan kaki', 'how far'] },
      { id: 'health', k: ['kesihatan', 'health', 'sihat', 'healthy', 'keadaan', 'tahap', 'condition', 'fit', 'badan', 'body', 'wellbeing'] },
      { id: 'sleep', k: ['tidur', 'sleep', 'slept', 'mengantuk', 'bangun', 'sleeping'] },
      { id: 'water', k: ['air', 'water', 'minum', 'drink', 'hydrate', 'hydration', 'gelas', 'glass', 'glasses', 'dahaga'] },
      { id: 'mood', k: ['mood', 'perasaan', 'emosi', 'feel', 'feeling', 'rasa'] },
      { id: 'score', k: ['skor', 'score', 'life score', 'markah'] },
      { id: 'streak', k: ['streak', 'konsisten', 'berturut', 'consecutive'] },
      { id: 'next', k: ['next prayer', 'solat seterusnya', 'bila solat', 'bila waktu', 'azan', 'when is prayer', 'prayer next'] },
      { id: 'times', k: ['prayer times', 'waktu solat', 'jadual solat', 'prayer schedule', 'subuh', 'zohor', 'zuhur', 'asar', 'maghrib', 'isyak', 'fajr', 'dhuhr', 'asr', 'isha'] },
      { id: 'done', k: ['pray', 'tunai', 'prayed', 'berapa solat', 'solat saya', 'prayers done', 'prayers today', 'prayers on time', 'my prayers'] },
      { id: 'quran', k: ['quran', 'kahfi', 'bacaan', 'surah', 'mengaji', 'recite', 'reading'] },
      { id: 'zikir', k: ['zikir', 'zikr', 'dhikr', 'tasbih', 'mathurat', 'wirid'] },
      { id: 'qibla', k: ['kiblat', 'qibla'] },
      { id: 'spend', k: ['belanja', 'spent', 'spend', 'spending', 'perbelanjaan', 'expense', 'expenses', 'habis duit', 'guna duit'] },
      { id: 'income', k: ['gaji', 'pendapatan', 'income', 'salary', 'earn', 'earned', 'pendapatan bulan ini'] },
      { id: 'balance', k: ['baki', 'left', 'remaining', 'save', 'saved', 'simpan', 'saving', 'balance', 'tinggal', 'lebihan'] },
      { id: 'top', k: ['paling banyak', 'top spending', 'most', 'kategori', 'category', 'tertinggi', 'biggest'] },
      { id: 'mmonth', k: ['motor', 'motosikal', 'motorcycle', 'mileage', 'jarak motor', 'tunggang', 'ride', 'riding'] },
      { id: 'mcmp', k: ['banding', 'compare', 'perbezaan', 'difference', 'bulan lepas', 'last month'] },
      { id: 'odo', k: ['odometer', 'odo', 'bacaan odometer'] },
      { id: 'svc', k: ['servis', 'service', 'tukar minyak', 'oil change', 'oil'] },
      { id: 'mtc', k: ['maintenance spending', 'belanja penyelenggaraan', 'penyelenggaraan', 'maintenance', 'repair', 'baiki', 'bengkel'] },
      { id: 'tasks', k: ['tugasan', 'tugas', 'task', 'tasks', 'todo', 'to do', 'kerja'] },
      { id: 'due', k: ['hampir', 'due', 'tarikh', 'deadline', 'tamat', 'urgent', 'lewat', 'overdue'] },
      { id: 'events', k: ['acara', 'event', 'events', 'birthday', 'hari lahir', 'kalendar', 'calendar', 'upcoming', 'cuti', 'holiday', 'public holiday', 'hari raya', 'deepavali', 'cuti umum', 'malaysia events'] },
      { id: 'summary', k: ['ringkasan', 'summary', 'overview', 'rumusan', 'laporan', 'how am i doing', 'macam mana hari', 'my day'] },
      { id: 'advice', k: ['patut', 'should', 'cadang', 'suggest', 'nasihat', 'advice', 'buat sekarang', 'tips', 'do next', 'what next'] },
      { id: 'greet', k: ['hi', 'hello', 'hai', 'salam', 'assalamualaikum', 'hey', 'helo'] },
      { id: 'thanks', k: ['terima kasih', 'thanks', 'thank', 'tq', 'makasih', 'thx'] },
      { id: 'who', k: ['siapa', 'who are you', 'who', 'kamu', 'nama awak', 'are you ai', 'adakah awak ai', 'chatgpt'] },
      { id: 'help', k: ['boleh tanya', 'help', 'bantuan', 'apa boleh', 'what can', 'tolong', 'can i ask', 'commands'] },
      { id: 'puasa', k: ['puasa', 'fasting', 'fast', 'ramadan', 'ramadhan', 'qadha', 'qada', 'sunat', 'sunnah', 'berpuasa'] },
      { id: 'debt', k: ['hutang', 'debt', 'debts', 'komitmen', 'commitment', 'commitments', 'ansuran', 'installment', 'bayaran bulanan', 'monthly payment', 'bil bulanan'] },
      { id: 'lock', k: ['kunci', 'app lock', 'lock', 'pin', 'biometrik', 'biometric', 'fingerprint', 'cap jari'] },
      { id: 'remind', k: ['peringatan', 'reminder', 'reminders', 'notifikasi', 'notification', 'notifications', 'quiet hours', 'waktu senyap', 'alert', 'alerts'] },
      { id: 'export', k: ['export', 'eksport', 'backup', 'sandaran', 'muat turun data'] },
      { id: 'privacy', k: ['selamat', 'safe', 'privasi', 'privacy', 'private', 'secure', 'keselamatan', 'security', 'data saya', 'my data'] }
    ];
  }
  pick(qn) {
    const padded = ' ' + qn + ' '; const toks = qn.split(' ');
    let best = null; let bs = 0;
    this.intents().forEach(it => {
      let s = 0;
      it.k.forEach(k => {
        if (k.indexOf(' ') >= 0) { if (padded.indexOf(' ' + k + ' ') >= 0) s += 3; }
        else if (toks.some(t => t === k || (k.length >= 4 && t.indexOf(k) === 0))) s += 2;
      });
      if (s > bs) { bs = s; best = it.id; }
    });
    return best;
  }
  comps() {
    const D = this.D(); const s = this.state;
    return [
      { k: 'water', r: Math.min(s.cups / D.cupGoal, 1), en: 'water', ms: 'air', tipEn: 'Drink a glass of water now.', tipMs: 'Minum segelas air sekarang.' },
      { k: 'sleep', r: Math.min(D.sleep / D.sleepGoal, 1), en: 'sleep', ms: 'tidur', tipEn: 'Try to sleep earlier tonight.', tipMs: 'Cuba tidur awal malam ini.' },
      { k: 'steps', r: Math.min(D.steps / D.goal, 1), en: 'steps', ms: 'langkah', tipEn: 'A 20 minute walk would help.', tipMs: 'Jalan santai 20 minit boleh membantu.' }
    ];
  }
  reply(q, lang) {
    const s = this.state; const D = this.D(); const qn = this.norm(q);
    const L = (en, ms) => (lang === 'ms' ? ms : en);
    const mk = (text, x) => Object.assign({ me: false, text: text, time: this.hm(), big: '', bigLbl: '', pct: -1, color: '#8fe9e2', label: '', href: '' }, x || {});
    let patch = {}; let m = null; let doAct = null;
    const cmdTask = q.trim().match(/^(tambah|add|buat|create|new)\s+(tugasan|tugas|task|todo)\b\s*:?\s*(.*)$/i);
    const cmdWater = /^(tambah|add|log|minum|drink)\b/.test(qn) && /(air|water|gelas|segelas|glass|cup)/.test(qn);
    const pc = Math.round(D.steps / D.goal * 100);
    const cs = this.comps();
    const avg = Math.round(cs.reduce((a, c) => a + c.r, 0) / cs.length * 100);
    const weak = cs.slice().sort((a, b) => a.r - b.r)[0];
    const np = this.nextPrayer();
    const R = this.R();
    const open = s.tasks.filter(t => t.s !== 'done');
    const dnow = s.tasks.filter(t => t.s === 'done').length;
    const isAfford = /(mampu|afford|boleh ke|boleh saya beli|patut ke|should i buy|can i buy|worth it)/i.test(q);
    const act = isAfford ? null : this.parseAct(q, qn);
    if (!act && !cmdWater) {
      let th = null;
      try { th = think(this, q, lang); } catch (e) { th = null; }
      if (th) return { m: th.m, patch: Object.assign({}, th.patch), act: th.act };
    }
    if (act) {
      const id = s.pid + 1;
      if (act.type === 'spend' || act.type === 'mtc' || act.type === 'inc' || act.type === 'odo') {
        patch.pending = Object.assign({ id: id }, act); patch.pid = id;
        if (act.type === 'odo' && act.val <= s.odo) { patch.pending = null; m = mk(L('That is not higher than your last reading (' + this.num(s.odo) + ' km). Please check the number.', 'Itu tidak lebih tinggi daripada bacaan terakhir (' + this.num(s.odo) + ' km). Sila semak nombor itu.')); }
        else if (act.type === 'spend') m = mk(L('Got it. Save this spending?\n• ' + act.name + '\n• Category: ' + act.cat + '\n• Date: ' + (act.ydy ? 'yesterday' : 'today'), 'Faham. Simpan perbelanjaan ini?\n• ' + act.name + '\n• Kategori: ' + act.cat + '\n• Tarikh: ' + (act.ydy ? 'semalam' : 'hari ini')), { pid: id, big: 'RM ' + this.rm(act.amt), bigLbl: act.cat, color: '#ffc46b' });
        else if (act.type === 'mtc') m = mk(L('Got it. Save this motorcycle record?\n• ' + act.name + (act.odo ? '\n• Odometer: ' + this.num(act.odo) + ' km' : '') + '\n• Date: today', 'Faham. Simpan rekod motosikal ini?\n• ' + act.name + (act.odo ? '\n• Odometer: ' + this.num(act.odo) + ' km' : '') + '\n• Tarikh: hari ini'), { pid: id, big: 'RM ' + this.rm(act.amt), bigLbl: act.name, color: '#ff8fab' });
        else if (act.type === 'inc') m = mk(L('Got it. Save this income to this month?\n• ' + act.name, 'Faham. Simpan pendapatan ini untuk bulan ini?\n• ' + act.name), { pid: id, big: 'RM ' + this.rm(act.amt), bigLbl: act.name, color: '#34d399' });
        else m = mk(L('Got it. Save this odometer reading?', 'Faham. Simpan bacaan odometer ini?'), { pid: id, big: this.num(act.val), bigLbl: 'km', color: '#ff8fab' });
      } else if (act.type === 'steps') {
        doAct = act; patch.steps = s.steps + act.n; const pp = Math.min(100, Math.round(patch.steps / D.goal * 100));
        m = mk(L('Added ' + this.num(act.n) + ' steps. You are at ' + this.num(patch.steps) + ' today (' + pp + '% of goal).', 'Ditambah ' + this.num(act.n) + ' langkah. Sekarang ' + this.num(patch.steps) + ' hari ini (' + pp + '% sasaran).'), { big: this.num(patch.steps), bigLbl: L('steps today', 'langkah hari ini'), pct: pp, color: '#5ee7df', label: L('Open Habit & Health', 'Buka Habit & Health'), href: 'Habit.dc.html' });
      } else if (act.type === 'sleep') {
        doAct = act; patch.sleep = act.h;
        m = mk(L('Saved: you slept ' + act.h + ' hours.', 'Disimpan: awak tidur ' + act.h + ' jam.') + (act.h < 6 ? L(' That is short. Rest early tonight.', ' Itu kurang. Rehat awal malam ini.') : ''), { big: act.h + 'h', bigLbl: L('of 7h goal', 'daripada 7j'), pct: Math.round(Math.min(act.h / 7, 1) * 100), color: '#b794ff', label: L('Open Habit & Health', 'Buka Habit & Health'), href: 'Habit.dc.html' });
      } else if (act.type === 'mood') {
        doAct = act; patch.mood = act.v; const nm = L(['Awful', 'Low', 'Okay', 'Good', 'Great'][act.v - 1], ['Teruk', 'Rendah', 'Okay', 'Baik', 'Hebat'][act.v - 1]);
        m = mk(L('Saved: your mood today is "' + nm + '".', 'Disimpan: mood awak hari ini "' + nm + '".'), { big: act.v + '/5', bigLbl: nm, pct: act.v * 20, color: '#ff8fab', label: L('Open Habit & Health', 'Buka Habit & Health'), href: 'Habit.dc.html' });
      } else if (act.type === 'pray') {
        m = mk(L('My Life does not track which prayers you have done yet. It reminds you at each prayer time. You can set the alerts in Prayer Times.', 'My Life belum merekod solat yang sudah ditunaikan. Ia hanya mengingatkan pada setiap waktu solat. Awak boleh atur peringatan di Waktu Solat.'), { label: L('Open Prayer Times', 'Buka Waktu Solat'), href: 'Prayer.dc.html' });
      }
    } else if (cmdTask) {
      let name = (cmdTask[3] || '').trim();
      if (!name) { m = mk(L('Sure. What is the task? Type for example: add task buy milk.', 'Boleh. Apa tugasannya? Contoh: tambah tugasan beli susu.')); }
      else {
        name = name.charAt(0).toUpperCase() + name.slice(1);
        doAct = { type: 'task', name: name }; patch.tasks = s.tasks.concat([{ n: name, d: '', s: 'todo' }]);
        m = mk(L('Done. I added "' + name + '" to your Daily Planner tasks. You now have ' + (open.length + 1) + ' open tasks.', 'Siap. Saya dah tambah "' + name + '" dalam tugasan Daily Planner. Awak ada ' + (open.length + 1) + ' tugasan belum siap.'), { big: String(open.length + 1), bigLbl: L('open tasks', 'tugasan belum siap'), color: '#7c9cff', label: L('Open Daily Planner', 'Buka Daily Planner'), href: 'Planner.dc.html' });
      }
    } else if (cmdWater) {
      const wn = (qn.match(/(\d+)\s*(gelas|glass|cup)/) || [0, 1])[1]; const c = Math.min(D.cupGoal, s.cups + Number(wn));
      patch.cups = c; doAct = { type: 'cups', c: c };
      m = mk(c === s.cups ? L('You already reached your water goal today. Well done.', 'Awak dah capai sasaran air hari ini. Syabas.') : L('Logged. That is ' + c + ' of ' + D.cupGoal + ' glasses today.', 'Dah direkod. Sekarang ' + c + ' daripada ' + D.cupGoal + ' gelas hari ini.'), { big: c + '/' + D.cupGoal, bigLbl: L('glasses', 'gelas'), pct: Math.round(c / D.cupGoal * 100), color: '#5ee7df', label: L('Open Habit & Health', 'Buka Habit & Health'), href: 'Habit.dc.html' });
    } else {
      let id = this.pick(this.norm(fix(q)));
      if (id === 'spend' && /(bulan|month)/.test(qn)) id = 'spendM';
      if (id === 'mmonth' && /(banding|compare|lepas|last)/.test(qn)) id = 'mcmp';
      switch (id) {
        case 'steps':
          m = mk(L('You have walked ' + this.num(D.steps) + ' steps today, ' + pc + '% of your ' + this.num(D.goal) + ' goal. ' + this.num(Math.max(0, D.goal - D.steps)) + ' to go. A relaxed 30 minute walk after Asar would get you close.', 'Hari ini awak dah jalan ' + this.num(D.steps) + ' langkah, ' + pc + '% daripada sasaran ' + this.num(D.goal) + '. Tinggal ' + this.num(Math.max(0, D.goal - D.steps)) + ' langkah lagi. Jalan santai 30 minit lepas Asar boleh hampirkan awak ke sasaran.'), { big: this.num(D.steps), bigLbl: L('steps · ' + pc + '% of goal', 'langkah · ' + pc + '% sasaran'), pct: pc, color: '#5ee7df', label: L('Open Habit & Health', 'Buka Habit & Health'), href: 'Habit.dc.html' });
          break;
        case 'dist': {
          const km = (D.steps * 0.00075).toFixed(1);
          m = mk(L('Today you moved about ' + km + ' km on foot, from ' + this.num(D.steps) + ' steps. This is an estimate based on your average stride.', 'Hari ini awak bergerak lebih kurang ' + km + ' km berjalan kaki, daripada ' + this.num(D.steps) + ' langkah. Ini anggaran berdasarkan purata langkah awak.'), { big: km + ' km', bigLbl: L('walked today', 'berjalan hari ini'), pct: pc, color: '#5ee7df', label: L('See 7-day graph', 'Lihat graf 7 hari'), href: 'Habit.dc.html' });
          break;
        }
        case 'health':
          m = mk(L('Your health score today is ' + avg + '%, which is ' + (avg >= 75 ? 'good' : avg >= 50 ? 'fair' : 'low') + '.\nWater ' + s.cups + '/' + D.cupGoal + ' · Sleep ' + D.sleep + 'h · Steps ' + this.num(D.steps) + '\nWeakest area: ' + weak.en + '. ' + weak.tipEn, 'Skor kesihatan awak hari ini ' + avg + '%, iaitu ' + (avg >= 75 ? 'baik' : avg >= 50 ? 'sederhana' : 'rendah') + '.\nAir ' + s.cups + '/' + D.cupGoal + ' · Tidur ' + D.sleep + 'j · Langkah ' + this.num(D.steps) + '\nPaling lemah: ' + weak.ms + '. ' + weak.tipMs), { big: avg + '%', bigLbl: L('daily goal', 'sasaran harian'), pct: avg, color: avg >= 75 ? '#34d399' : avg >= 50 ? '#ffc46b' : '#ff8fab', label: L('Open Habit & Health', 'Buka Habit & Health'), href: 'Habit.dc.html' });
          break;
        case 'sleep': {
          if (!D.sleep) { m = mk(L('You have not logged last night\'s sleep yet. Tell me, for example, "I slept 7 hours".', 'Awak belum rekod tidur semalam. Beritahu saya, contohnya "saya tidur 7 jam".'), { label: L('Open Habit & Health', 'Buka Habit & Health'), href: 'Habit.dc.html' }); break; }
          const gap = Math.max(0, D.sleepGoal - D.sleep);
          m = mk(L('You slept ' + D.sleep + ' hours, ' + gap + ' hours short of your ' + D.sleepGoal + ' hour goal. ' + (gap > 1 ? 'Short sleep lowers focus and mood. Try to be in bed 1 to 2 hours earlier tonight.' : 'That is close to your goal. Keep it up.'), 'Awak tidur ' + D.sleep + ' jam, kurang ' + gap + ' jam daripada sasaran ' + D.sleepGoal + ' jam. ' + (gap > 1 ? 'Tidur kurang menjejaskan fokus dan mood. Cuba berbaring 1 hingga 2 jam lebih awal malam ini.' : 'Hampir capai sasaran. Teruskan.')), { big: D.sleep + 'h', bigLbl: L('of ' + D.sleepGoal + 'h goal', 'daripada ' + D.sleepGoal + 'j'), pct: Math.round(Math.min(D.sleep / D.sleepGoal, 1) * 100), color: '#b794ff', label: L('Open Sleep tracker', 'Buka penjejak tidur'), href: 'Habit.dc.html' });
          break;
        }
        case 'water':
          m = mk(L('You have had ' + s.cups + ' of ' + D.cupGoal + ' glasses today. ' + (s.cups < D.cupGoal ? (D.cupGoal - s.cups) + ' more to reach your goal. Tell me "add a glass of water" and I will log it.' : 'Goal reached. Well done.'), 'Awak dah minum ' + s.cups + ' daripada ' + D.cupGoal + ' gelas hari ini. ' + (s.cups < D.cupGoal ? 'Tinggal ' + (D.cupGoal - s.cups) + ' gelas lagi. Cakap "tambah segelas air" dan saya akan rekodkan.' : 'Sasaran dicapai. Syabas.')), { big: s.cups + '/' + D.cupGoal, bigLbl: L('glasses', 'gelas'), pct: Math.round(s.cups / D.cupGoal * 100), color: '#5ee7df', label: L('Open Habit & Health', 'Buka Habit & Health'), href: 'Habit.dc.html' });
          break;
        case 'mood': {
          if (!D.mood) { m = mk(L('You have not logged your mood today. Tell me, for example, "my mood is good".', 'Awak belum rekod mood hari ini. Beritahu saya, contohnya "mood saya baik".'), { label: L('Open Habit & Health', 'Buka Habit & Health'), href: 'Habit.dc.html' }); break; }
          const nm = L(['Awful', 'Low', 'Okay', 'Good', 'Great'][D.mood - 1], ['Teruk', 'Rendah', 'Okay', 'Baik', 'Hebat'][D.mood - 1]);
          m = mk(L('Your mood today is "' + nm + '". ' + (D.sleep < 6 ? 'Low sleep may be affecting it. Rest early tonight.' : 'Keep doing what works for you.'), 'Mood awak hari ini "' + nm + '". ' + (D.sleep < 6 ? 'Tidur yang kurang mungkin menjejaskannya. Rehat awal malam ini.' : 'Teruskan apa yang berkesan untuk awak.')), { big: D.mood + '/5', bigLbl: nm, pct: D.mood * 20, color: '#ff8fab', label: L('Update mood', 'Kemas kini mood'), href: 'Habit.dc.html' });
          break;
        }
        case 'score':
          m = mk(D.score > 0 ? L('Your Life Score is ' + D.score + ' out of 100. It blends your habits, tasks, commitments, spending, zikir and fasting, using only what you have logged.', 'Skor Life awak ' + D.score + ' daripada 100. Ia gabungan habit, tugasan, komitmen, belanja, zikir dan puasa, berdasarkan apa yang awak dah rekod.') : L('There is not enough logged yet to give a Life Score. Log steps, water or sleep, and it will appear.', 'Belum cukup rekod untuk skor Life. Rekod langkah, air atau tidur dan ia akan muncul.'), { big: D.score > 0 ? String(D.score) : '', bigLbl: L('of 100', 'daripada 100'), pct: D.score > 0 ? D.score : -1, color: '#8fe9e2', label: L('Open Insights', 'Buka Insights'), href: 'Insights.dc.html' });
          break;
        case 'streak':
          m = mk(D.streak > 0 ? L('Your best habit streak is ' + D.streak + ' days in a row (days at 70% or more of your goals).', 'Streak habit terbaik awak ' + D.streak + ' hari berturut-turut (hari dengan 70% atau lebih sasaran).') : L('No streak yet. A day counts when you reach 70% of your steps, water and sleep goals.', 'Belum ada streak. Satu hari dikira bila awak capai 70% sasaran langkah, air dan tidur.'), { big: D.streak > 0 ? D.streak + ' d' : '', bigLbl: L('streak', 'streak'), color: '#ffc46b', label: L('Open Habit & Health', 'Buka Habit & Health'), href: 'Habit.dc.html' });
          break;
        case 'next': {
          if (!np) { m = mk(L('I do not have your prayer times yet. Open Prayer Times once so the app can find your zone, then ask me again.', 'Saya belum ada waktu solat awak. Buka Waktu Solat sekali supaya app cari zon awak, kemudian tanya semula.'), { label: L('Open Prayer Times', 'Buka Waktu Solat'), href: 'Prayer.dc.html' }); break; }
          const when = np.hh > 0 ? np.hh + 'h ' + np.mm + 'm' : np.mm + ' min';
          m = mk(L('Next prayer is ' + np.name + ' at ' + np.time + ', in ' + when + '.', 'Solat seterusnya ialah ' + np.name + ' pada ' + np.time + ', lagi ' + when + '.'), { big: np.time, bigLbl: np.name, color: '#34d399', label: L('Open Prayer Times', 'Buka Waktu Solat'), href: 'Prayer.dc.html' });
          break;
        }
        case 'times':
          m = D.P.length ? mk(L('Prayer times today:\n', 'Waktu solat hari ini:\n') + D.P.map(p => { let h = p[1]; const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return p[0] + '  ' + h + ':' + String(p[2]).padStart(2, '0') + ' ' + ap; }).join('\n'), { label: L('Open Prayer Times', 'Buka Waktu Solat'), href: 'Prayer.dc.html' })
            : mk(L('I do not have your prayer times yet. Open Prayer Times once so the app can find your zone.', 'Saya belum ada waktu solat awak. Buka Waktu Solat sekali supaya app cari zon awak.'), { label: L('Open Prayer Times', 'Buka Waktu Solat'), href: 'Prayer.dc.html' });
          break;
        case 'done':
          m = mk(L('My Life does not track which prayers you have done yet. It reminds you at each prayer time' + (np ? ', and the next is ' + np.name + ' at ' + np.time : '') + '.', 'My Life belum merekod solat yang sudah ditunaikan. Ia mengingatkan pada setiap waktu solat' + (np ? ', dan yang seterusnya ' + np.name + ' pada ' + np.time : '') + '.'), { label: L('Open Prayer Times', 'Buka Waktu Solat'), href: 'Prayer.dc.html' });
          break;
        case 'quran':
          m = mk(L('Open the Islamic Hub to read or continue your Quran. ' + (new Date().getDay() === 5 ? 'Today is Friday, a good day for Surah Al-Kahfi.' : 'Friday is a good day for Surah Al-Kahfi.'), 'Buka Islamic Hub untuk membaca atau sambung Quran. ' + (new Date().getDay() === 5 ? 'Hari ini Jumaat, sesuai untuk Surah Al-Kahfi.' : 'Jumaat sesuai untuk Surah Al-Kahfi.')), { label: L('Open Islamic Hub', 'Buka Islamic Hub'), href: 'Islamic.dc.html' });
          break;
        case 'zikir': {
          const h = new Date().getHours();
          const w = h >= 5 && h < 11 ? L('Morning Al-Ma\'thurat suits this time.', 'Al-Ma\'thurat pagi sesuai pada waktu ini.') : h >= 16 && h < 20 ? L('Evening Al-Ma\'thurat is best after Asar.', 'Al-Ma\'thurat petang paling elok selepas Asar.') : L('A short tasbih session fits well now.', 'Sesi tasbih ringkas sesuai sekarang.');
          m = mk(w + L(' It takes about 10 minutes.', ' Ia ambil masa lebih kurang 10 minit.'), { label: L('Open Al-Ma\'thurat', 'Buka Al-Ma\'thurat'), href: 'Mathurat.dc.html' });
          break;
        }
        case 'qibla':
          m = mk(L('The Qibla compass is in Prayer Times. It uses your location to point the way.', 'Kompas kiblat ada dalam Waktu Solat. Ia guna lokasi awak untuk tunjuk arah.'), { label: L('Open Prayer Times', 'Buka Waktu Solat'), href: 'Prayer.dc.html' });
          break;
        case 'puasa': {
          const P = R.puasa || {}; const rs = F.ramadanState(P, new Date()); const sn = F.sunatToday(new Date(), P.off || 0); const qd = F.qadhaOwed(P, new Date());
          const lines = [];
          if (rs.phase === 'during') lines.push(L('It is Ramadan, day ' + rs.day + '. You have fasted ' + rs.fasted + ' days so far.', 'Sekarang Ramadan, hari ke-' + rs.day + '. Awak dah puasa ' + rs.fasted + ' hari setakat ini.'));
          else if (rs.phase === 'before') lines.push(L('Ramadan is in about ' + rs.daysTo + ' days.', 'Ramadan lagi kira-kira ' + rs.daysTo + ' hari.'));
          if (sn) lines.push(L('Today: ' + sn + '.', 'Hari ini: ' + sn + '.'));
          lines.push(qd > 0 ? L('Missed fasts to make up: ' + qd + ' days.', 'Qadha tertunggak: ' + qd + ' hari.') : L('No missed fasts to make up.', 'Tiada qadha tertunggak.'));
          m = mk(lines.join('\n'), { big: qd > 0 ? String(qd) : '', bigLbl: L('missed fasts', 'hari qadha'), color: '#34d399', label: L('Open Fasting', 'Buka Puasa'), href: 'Puasa.dc.html' });
          break;
        }
        case 'debt': {
          const ds = DB.debtSummary(R.debts || DB.DEBT_EMPTY);
          if (!ds.list.length) { m = mk(L('You have not added any commitments or debts yet. You can add them in My Finance.', 'Awak belum tambah komitmen atau hutang. Boleh tambah dalam My Finance.'), { label: L('Open My Finance', 'Buka My Finance'), href: 'Finance.dc.html' }); break; }
          const un = ds.unpaid.slice(0, 4).map(x => '• ' + x.name + ' RM ' + this.rm(DB.amountDue(x, ds.ym)) + ' (' + L('day ', 'hari ') + x.due + ')').join('\n');
          m = mk(L('This month: RM ' + this.rm(ds.paid) + ' paid of RM ' + this.rm(ds.commit) + '. ' + (ds.toPay > 0.004 ? 'Still to pay RM ' + this.rm(ds.toPay) + ':\n' + un : 'All settled.') + (ds.totalLeft > 0 ? '\nDebt balance left: RM ' + this.num(this.rm(ds.totalLeft)) + '.' : ''), 'Bulan ini: RM ' + this.rm(ds.paid) + ' dibayar daripada RM ' + this.rm(ds.commit) + '. ' + (ds.toPay > 0.004 ? 'Belum bayar RM ' + this.rm(ds.toPay) + ':\n' + un : 'Semua selesai.') + (ds.totalLeft > 0 ? '\nBaki hutang: RM ' + this.num(this.rm(ds.totalLeft)) + '.' : '')), { big: 'RM ' + this.rm(ds.toPay), bigLbl: L('left to pay', 'belum dibayar'), pct: ds.commit > 0 ? Math.round(ds.paid / ds.commit * 100) : -1, color: '#ff8fab', label: L('Open My Finance', 'Buka My Finance'), href: 'Finance.dc.html' });
          break;
        }
        case 'lock': {
          const lk = R.lock || {};
          m = mk(lk.on ? L('App lock is on. It asks for ' + (lk.bio ? 'your fingerprint or PIN' : 'your PIN') + ' and locks again after ' + (lk.after === 0 ? 'you leave the app' : lk.after / 60 + ' min') + '. You can change it in Settings, Security.', 'Kunci app sedang hidup. Ia minta ' + (lk.bio ? 'cap jari atau PIN' : 'PIN') + ' dan kunci semula selepas ' + (lk.after === 0 ? 'awak keluar app' : lk.after / 60 + ' minit') + '. Boleh ubah di Settings, Security.') : L('App lock is off. Turn it on in Settings, Security, to protect My Life with a PIN or fingerprint.', 'Kunci app belum hidup. Hidupkan di Settings, Security, untuk lindungi My Life dengan PIN atau cap jari.'), { label: L('Open Settings', 'Buka Settings'), href: 'Settings.dc.html' });
          break;
        }
        case 'remind': {
          const tg = R.tg || {}; const on = (b) => (b ? L('on', 'hidup') : L('off', 'mati'));
          m = mk(L('Reminders:\n• Prayer times: ' + on(tg.pr) + '\n• Planner events: ' + on(tg.ev) + '\n• Daily zikir: ' + on(tg.zk) + '\n• Quiet hours (12 am to 5 am): ' + on(tg.qh), 'Peringatan:\n• Waktu solat: ' + on(tg.pr) + '\n• Acara Planner: ' + on(tg.ev) + '\n• Zikir harian: ' + on(tg.zk) + '\n• Waktu senyap (12 pagi hingga 5 pagi): ' + on(tg.qh)), { label: L('Open Settings', 'Buka Settings'), href: 'Settings.dc.html' });
          break;
        }
        case 'export':
          m = mk(L('You can export all your data from Settings, Export all my data, as Excel, PDF, CSV or a full backup. It includes your savings goals, category limits and Money Left for each month. For a motorcycle PDF, open My Record and tap Export Report. Keep a backup before you change phones.', 'Awak boleh eksport semua data di Settings, Export all my data, dalam Excel, PDF, CSV atau backup penuh. Ia termasuk tabung, had kategori dan baki wang setiap bulan. Untuk PDF motosikal, buka My Record dan tekan Export Report. Simpan backup sebelum tukar telefon.'), { label: L('Open Export', 'Buka Export'), href: 'Export.dc.html' });
          break;
        case 'spend':
          m = mk(L('You spent RM ' + D.spendToday + ' today. Your month so far is RM ' + D.spendMonth + '.', 'Awak belanja RM ' + D.spendToday + ' hari ini. Bulan ini setakat ini RM ' + D.spendMonth + '.'), { big: 'RM ' + D.spendToday, bigLbl: L('spent today', 'belanja hari ini'), label: L('Open Spending Tracker', 'Buka Spending Tracker'), href: 'Finance.dc.html' });
          break;
        case 'spendM':
          m = mk(L('You have spent RM ' + D.spendMonth + ' this month. Your biggest category is ' + D.topCat + ' at RM ' + D.topAmt + '.', 'Awak dah belanja RM ' + D.spendMonth + ' bulan ini. Kategori terbesar ialah ' + D.topCat + ' sebanyak RM ' + D.topAmt + '.'), { big: 'RM ' + D.spendMonth, bigLbl: L('this month', 'bulan ini'), pct: Math.round(D.spendMonth / D.income * 100), color: '#ffc46b', label: L('Open My Finance', 'Buka My Finance'), href: 'Finance.dc.html' });
          break;
        case 'income':
          m = mk(L('Your income this month is RM ' + this.num(D.income) + '. You can edit each line (salary, overtime, claim) in My Finance.', 'Pendapatan awak bulan ini RM ' + this.num(D.income) + '. Awak boleh ubah setiap baris (gaji, overtime, tuntutan) dalam My Finance.'), { big: 'RM ' + this.num(D.income), bigLbl: L('this month', 'bulan ini'), label: L('Open Monthly Income', 'Buka Pendapatan Bulanan'), href: 'Finance.dc.html' });
          break;
        case 'balance': {
          const left = D.income - D.spendMonth;
          m = mk(L('Income RM ' + this.num(D.income) + ' minus spending RM ' + D.spendMonth + ' leaves RM ' + this.num(left) + ' this month.', 'Pendapatan RM ' + this.num(D.income) + ' tolak belanja RM ' + D.spendMonth + ' tinggal RM ' + this.num(left) + ' bulan ini.'), { big: 'RM ' + this.num(left), bigLbl: L('left this month', 'baki bulan ini'), pct: Math.round(left / D.income * 100), color: '#34d399', label: L('Open My Finance', 'Buka My Finance'), href: 'Finance.dc.html' });
          break;
        }
        case 'top':
          if (!D.topCat) { m = mk(L('No spending logged this month yet.', 'Belum ada belanja direkod bulan ini.'), { label: L('Open My Finance', 'Buka My Finance'), href: 'Finance.dc.html' }); break; }
          m = mk(L('Your top spending category this month is ' + D.topCat + ': RM ' + D.topAmt + ', about ' + Math.round(D.topAmt / D.spendMonth * 100) + '% of your spending.', 'Kategori belanja tertinggi bulan ini ialah ' + D.topCat + ': RM ' + D.topAmt + ', kira-kira ' + Math.round(D.topAmt / D.spendMonth * 100) + '% daripada belanja awak.'), { big: 'RM ' + D.topAmt, bigLbl: D.topCat, pct: Math.round(D.topAmt / D.spendMonth * 100), color: '#ffc46b', label: L('See Spending by Category', 'Lihat Belanja ikut Kategori'), href: 'Finance.dc.html' });
          break;
        case 'mmonth':
        case 'mcmp':
        case 'odo':
        case 'svc':
        case 'mtc': {
          const rec = { label: L('Open My Record', 'Buka My Record'), href: 'Record.dc.html' };
          if (!D.hasVehicle && id !== 'mtc') { m = mk(L('You have no odometer readings yet. Add one in My Record, or tell me, for example, "add mileage 18500 km".', 'Belum ada bacaan odometer. Tambah dalam My Record, atau beritahu saya, contohnya "tambah milage 18500 km".'), rec); break; }
          if (id === 'mmonth') m = mk(D.kmMonth == null ? L('Not enough readings to work out this month. Add another odometer reading.', 'Bacaan belum cukup untuk bulan ini. Tambah satu lagi bacaan odometer.') : L('Your motorcycle travelled ' + this.num(D.kmMonth) + ' km this month' + (D.kmLast != null ? '. Last month was ' + this.num(D.kmLast) + ' km.' : '.'), 'Motosikal awak bergerak ' + this.num(D.kmMonth) + ' km bulan ini' + (D.kmLast != null ? '. Bulan lepas ' + this.num(D.kmLast) + ' km.' : '.')), Object.assign({ big: D.kmMonth == null ? '' : this.num(D.kmMonth) + ' km', bigLbl: L('this month', 'bulan ini'), color: '#ff8fab' }, rec));
          else if (id === 'mcmp') {
            if (D.kmMonth == null || D.kmLast == null || !D.kmLast) m = mk(L('I need readings for both this month and last month to compare.', 'Saya perlukan bacaan untuk bulan ini dan bulan lepas untuk banding.'), rec);
            else { const df = D.kmMonth - D.kmLast; const pp = Math.round(Math.abs(df) / D.kmLast * 100); m = mk(L('This month ' + this.num(D.kmMonth) + ' km vs last month ' + this.num(D.kmLast) + ' km. That is ' + this.num(Math.abs(df)) + ' km ' + (df >= 0 ? 'more' : 'less') + ' (' + pp + '%).', 'Bulan ini ' + this.num(D.kmMonth) + ' km berbanding bulan lepas ' + this.num(D.kmLast) + ' km. Ia ' + this.num(Math.abs(df)) + ' km ' + (df >= 0 ? 'lebih' : 'kurang') + ' (' + pp + '%).'), Object.assign({ big: (df >= 0 ? '+' : '-') + this.num(Math.abs(df)) + ' km', bigLbl: L('vs last month', 'berbanding bulan lepas'), color: df > 0 ? '#ffb3a0' : '#7df0c6' }, rec)); }
          } else if (id === 'odo') m = mk(L('Your last odometer reading is ' + this.num(D.odo) + ' km.', 'Bacaan odometer terakhir awak ialah ' + this.num(D.odo) + ' km.'), Object.assign({ big: this.num(D.odo), bigLbl: 'km', color: '#ff8fab' }, rec));
          else if (id === 'svc') {
            if (D.nextSvc == null || !D.nextSvc) m = mk(L('No service is set up yet. Add a part in My Record, for example Engine oil with the odometer when you changed it and how long it lasts.', 'Belum ada servis ditetapkan. Tambah bahagian dalam My Record, contohnya Minyak enjin dengan odometer semasa tukar dan jangka hayatnya.'), rec);
            else { const left = D.nextSvc - D.odo; m = mk(left > 0 ? L(D.nextSvcName + ' is due at ' + this.num(D.nextSvc) + ' km, which is ' + this.num(left) + ' km away.', D.nextSvcName + ' perlu ditukar pada ' + this.num(D.nextSvc) + ' km, lagi ' + this.num(left) + ' km.') : L(D.nextSvcName + ' is overdue by ' + this.num(-left) + ' km.', D.nextSvcName + ' sudah lewat ' + this.num(-left) + ' km.'), Object.assign({ big: this.num(Math.abs(left)), bigLbl: left > 0 ? L('km to go', 'km lagi') : L('km overdue', 'km lewat'), color: left > 0 ? '#ff8fab' : '#ffb3a0' }, rec)); }
          } else m = mk(L('You spent RM ' + this.rm(D.mtcMonth) + ' on motorcycle maintenance this month.', 'Awak belanja RM ' + this.rm(D.mtcMonth) + ' untuk penyelenggaraan motosikal bulan ini.'), Object.assign({ big: 'RM ' + this.rm(D.mtcMonth), bigLbl: L('maintenance', 'penyelenggaraan'), color: '#ffc46b' }, rec));
          break;
        }
        case 'tasks': {
          const lines = open.slice(0, 5).map(t => '• ' + t.n + ' (' + this.dueText(t.d, L) + ')').join('\n');
          m = mk(open.length ? L('You have ' + open.length + ' open tasks:\n', 'Awak ada ' + open.length + ' tugasan belum siap:\n') + lines : L('No open tasks. Nice and clear.', 'Tiada tugasan tertunggak. Bagus.'), { big: String(open.length), bigLbl: L('open · ' + dnow + ' done', 'belum siap · ' + dnow + ' siap'), pct: Math.round(dnow / Math.max(1, s.tasks.length) * 100), color: '#7c9cff', label: L('Open Daily Planner', 'Buka Daily Planner'), href: 'Planner.dc.html' });
          break;
        }
        case 'due': {
          const soon = open.filter(t => t.d && this.daysTo(t.d) <= 3).sort((a, b) => this.daysTo(a.d) - this.daysTo(b.d));
          m = mk(soon.length ? L('These are due soon:\n', 'Ini hampir tarikh:\n') + soon.map(t => '• ' + t.n + ' (' + this.dueText(t.d, L) + ')').join('\n') : L('Nothing is due in the next 3 days.', 'Tiada yang tamat dalam 3 hari akan datang.'), { label: L('Open Daily Planner', 'Buka Daily Planner'), href: 'Planner.dc.html' });
          break;
        }
        case 'events': {
          const od = D.events.filter(e => e.d && this.daysTo(e.d) < 0).sort((a, b) => this.daysTo(b.d) - this.daysTo(a.d));
          const ev = D.events.filter(e => this.daysTo(e.d) >= 0).sort((a, b) => this.daysTo(a.d) - this.daysTo(b.d));
          const t0 = new Date(); const ts = t0.getFullYear() + '-' + String(t0.getMonth() + 1).padStart(2, '0') + '-' + String(t0.getDate()).padStart(2, '0');
          const ql2 = String(q || '').toLowerCase();
          const want = [['raya', 'aidilfitri'], ['haji', 'adha'], ['deepavali', 'deepavali'], ['cina', 'chinese'], ['chinese', 'chinese'], ['thaipusam', 'thaipusam'], ['merdeka', 'national'], ['krismas', 'christmas'], ['christmas', 'christmas'], ['maulid', 'maulidur'], ['muharram', 'muharram'], ['ramadan', 'ramadan'], ['wesak', 'wesak'], ['tahun baru', "new year's"]].filter(w => ql2.includes(w[0])).map(w => w[1]);
          const my = want.length ? upcomingMy(ts, 60).filter(e => want.some(w => e.name.toLowerCase().includes(w))).slice(0, 3) : upcomingMy(ts, 5);
          const mine = (ev.length ? L('Upcoming events:\n', 'Acara akan datang:\n') + ev.map(e => '• ' + e.n + ' (' + this.dueText(e.d, L) + ')').join('\n') : L('No upcoming events.', 'Tiada acara akan datang.'))
            + (od.length ? L('\n\nOverdue:\n', '\n\nTertunggak:\n') + od.map(e => '• ' + e.n + ' (' + this.dueText(e.d, L) + ')').join('\n') : '')
            + L('\n\nBig Malaysia events:\n', '\n\nEvent besar Malaysia:\n') + my.map(e => '• ' + e.name + ' (' + (e.days === 0 ? L('today', 'hari ini') : e.days === 1 ? L('tomorrow', 'esok') : L('in ' + e.days + ' days', e.days + ' hari lagi')) + ')').join('\n');
          m = mk(mine, { label: L('Open Date & Events', 'Buka Date & Events'), href: 'Planner.dc.html' });
          break;
        }
        case 'summary':
          m = mk(L('Your day so far:\nSteps ' + this.num(D.steps) + ' (' + pc + '%)\nWater ' + s.cups + '/' + D.cupGoal + ' · Sleep ' + D.sleep + 'h\nSpent RM ' + D.spendToday + '\nOpen tasks ' + open.length, 'Hari awak setakat ini:\nLangkah ' + this.num(D.steps) + ' (' + pc + '%)\nAir ' + s.cups + '/' + D.cupGoal + ' · Tidur ' + D.sleep + 'j\nBelanja RM ' + D.spendToday + '\nTugasan belum siap ' + open.length), { big: avg + '%', bigLbl: L('daily goal', 'sasaran harian'), pct: avg, color: '#8fe9e2', label: L('Open Insights', 'Buka Insights'), href: 'Insights.dc.html' });
          break;
        case 'advice': {
          const a = [];
          if (np && np.mins <= 45) a.push(L('Get ready for ' + np.name + ' in ' + np.mins + ' minutes.', 'Bersedia untuk ' + np.name + ' dalam ' + np.mins + ' minit.'));
          a.push(L(weak.tipEn + ' Your ' + weak.en + ' is the lowest today.', weak.tipMs + ' ' + weak.ms.charAt(0).toUpperCase() + weak.ms.slice(1) + ' awak paling rendah hari ini.'));
          const soon = open.filter(t => t.d && this.daysTo(t.d) <= 2).sort((x, y) => this.daysTo(x.d) - this.daysTo(y.d))[0];
          if (soon) a.push(L('Finish "' + soon.n + '" (' + this.dueText(soon.d, L) + ').', 'Siapkan "' + soon.n + '" (' + this.dueText(soon.d, L) + ').'));
          const h = new Date().getHours();
          if (h >= 16 && h < 20) a.push(L('Read evening Al-Ma\'thurat.', 'Baca Al-Ma\'thurat petang.'));
          else if (h >= 5 && h < 10) a.push(L('Read morning Al-Ma\'thurat.', 'Baca Al-Ma\'thurat pagi.'));
          if (D.nextSvc && D.nextSvc - D.odo < 2000) a.push(L('Plan your motorcycle service soon.', 'Rancang servis motosikal tidak lama lagi.'));
          m = mk(L('Here is what I would do next:\n', 'Ini yang saya cadang seterusnya:\n') + a.slice(0, 3).map((x, i) => (i + 1) + '. ' + x).join('\n'));
          break;
        }
        case 'greet':
          m = mk(L('Hi ' + this.fn() + '! Ask me about your steps, sleep, prayers, spending, motorcycle or tasks.', 'Hai ' + this.fn() + '! Tanya saya tentang langkah, tidur, solat, belanja, motosikal atau tugasan.'));
          break;
        case 'thanks':
          m = mk(L('You are welcome. I am here whenever you need me.', 'Sama-sama. Saya ada bila-bila masa awak perlukan.'));
          break;
        case 'who':
          m = mk(L('I am the My Life assistant. I am not a chatbot on the internet. I read your own data on this device and put the answer together using rules written for this app.', 'Saya pembantu My Life. Saya bukan chatbot di internet. Saya baca data awak sendiri dalam peranti ini dan susun jawapan menggunakan peraturan yang ditulis untuk app ini.'));
          break;
        case 'privacy':
          m = mk(L('Your data is encrypted on this phone and backed up to your own account when you are signed in. I work offline, and nothing is sent to an AI service. You can also lock the app with a PIN or fingerprint in Settings, Security.', 'Data awak disulitkan dalam telefon ini dan disimpan ke akaun awak sendiri bila awak log masuk. Saya berfungsi tanpa internet, dan tiada apa dihantar ke perkhidmatan AI. Awak juga boleh kunci app dengan PIN atau cap jari di Settings, Security.'), { label: L('Open Security', 'Buka Security'), href: 'Settings.dc.html' });
          break;
        case 'help':
          m = mk(L('You can ask me about:\n• Health: steps, distance, sleep, water, mood\n• Faith: next prayer, prayer times, Quran, zikir, fasting\n• Money: spending, income, money left, category limits, budget alerts, commitments and debts\n• Savings goals: how much saved, progress, what is left to reach a goal\n• Motorcycle: mileage, service, odometer\n• Tasks: open tasks, due soon, events\n• App: reminders, app lock, export (includes savings goals and Money Left)\nI can save for you: "spent RM10 on lunch", "service motor RM120", "add mileage 18500 km", "I slept 7 hours", "add task buy milk".', 'Awak boleh tanya saya tentang:\n• Kesihatan: langkah, jarak, tidur, air, mood\n• Ibadah: solat seterusnya, waktu solat, Quran, zikir, puasa dan qadha\n• Wang: belanja, pendapatan, baki, had kategori, amaran bajet, komitmen dan hutang\n• Tabung: berapa simpanan, kemajuan, baki untuk capai sasaran\n• Motosikal: jarak, servis, odometer\n• Tugasan: tugasan, hampir tarikh, acara\n• App: peringatan, kunci app, eksport (termasuk tabung dan baki wang)\nSaya boleh simpankan: "belanja RM10 untuk makan", "servis motor RM120", "tambah milage 18500 km", "saya tidur 7 jam", "tambah tugasan beli susu".'));
          break;
        default:
          m = mk(L('I did not quite get that. I answer from your own data, so you can say it in your own words, for example:\n• "How much did I spend last week?"\n• "Why is my spending high?"\n• "Add task send report on Friday"\n• "Can I afford RM300?"', 'Saya kurang faham ayat itu. Saya jawab berdasarkan data awak sendiri, jadi awak boleh cakap dengan cara awak, contohnya:\n• "Berapa saya belanja minggu lepas?"\n• "Kenapa belanja saya tinggi?"\n• "Tambah tugasan hantar laporan Jumaat"\n• "Boleh ke saya beli RM300?"'));
      }
    }
    if (!patch.ctx) { const mkm = { steps: 'steps', dist: 'steps', sleep: 'sleep', water: 'water', mood: 'mood' }; const idd = this.pick(this.norm(fix(q))); patch.ctx = mkm[idd] ? { intent: 'metric', mkey: mkm[idd] } : (idd === 'spend' || idd === 'spendM') ? { intent: 'spend' } : {}; }
    return { m: m, patch: patch, act: doAct };
  }
  scroll() { setTimeout(() => { try { this.props.onScroll && this.props.onScroll(); } catch (e) { } }, 80); }
  ask(q) {
    q = (q || '').trim();
    if (!q || this.state.typing) return;
    const lang = this.detect(q) || this.state.lang;
    this.setState({ msgs: this.state.msgs.concat([{ me: true, text: q, time: this.hm(), big: '', bigLbl: '', pct: -1, color: '', label: '', href: '' }]), draft: '', typing: true, lang: lang });
    this.scroll();
    setTimeout(() => {
      const r = this.reply(q, lang);
      this.setState(Object.assign({ msgs: this.state.msgs.concat([r.m]), typing: false }, r.patch));
      if (r.act && this.props.persist) this.props.persist(r.act);
      this.scroll();
    }, 700);
  }
  renderVals() {
    const s = this.state; const ms = s.lang === 'ms';
    const L = (en, bm) => (ms ? bm : en);
    const Q = {
      0: [['Summary of my day', 'Ringkasan hari ini'], ['How am I doing today?', 'Macam mana hari saya setakat ini?'], ['What should I do next?', 'Apa patut saya buat sekarang?'], ['My Life Score', 'Skor Life saya'], ['My habit streak', 'Streak habit saya']],
      1: [['How many steps today?', 'Berapa step saya hari ini?'], ['How far did I walk?', 'Berapa jauh saya jalan?'], ['How is my health now?', 'Macam mana tahap kesihatan saya sekarang?'], ['How did I sleep?', 'Berapa jam saya tidur?'], ['How much water have I had?', 'Berapa air saya minum?'], ['How is my mood?', 'Mood saya hari ini?'], ['Add a glass of water', 'Tambah segelas air']],
      2: [['When is the next prayer?', 'Bila waktu solat seterusnya?'], ['My fasting', 'Puasa dan qadha saya'], ['Prayer times today', 'Waktu solat hari ini'], ['Continue my Quran reading', 'Sambung bacaan Quran saya'], ['Suggest a zikir', 'Cadangan zikir untuk saya'], ['Qibla direction', 'Arah kiblat']],
      3: [['What did I spend today?', 'Berapa saya belanja hari ini?'], ['What did I spend this month?', 'Belanja bulan ini?'], ['My income this month', 'Pendapatan saya bulan ini'], ['How much is left?', 'Berapa baki saya?'], ['Top spending category', 'Kategori belanja paling banyak'], ['My commitments and debts', 'Komitmen dan hutang saya']],
      4: [['Motorcycle mileage this month', 'Jarak motor bulan ini'], ['Compare with last month', 'Banding dengan bulan lepas'], ['What is my odometer?', 'Bacaan odometer saya?'], ['When is my next service?', 'Bila servis seterusnya?'], ['Maintenance spending', 'Belanja penyelenggaraan']],
      5: [['My open tasks', 'Tugasan saya'], ['What is due soon?', 'Apa yang hampir tarikh?'], ['Upcoming events', 'Acara akan datang'], ['Add task buy milk', 'Tambah tugasan beli susu'], ['Add task call mom', 'Tambah tugasan call mak']],
      7: [['I spent RM10 on lunch', 'Saya belanja RM10 untuk makan'], ['Paid RM50 for petrol', 'Bayar RM50 untuk minyak'], ['Service motorcycle RM120', 'Servis motor RM120'], ['Add mileage 18500 km', 'Tambah milage 18500 km'], ['Overtime received RM180', 'Overtime masuk RM180'], ['Add 2 glasses of water', 'Tambah 2 gelas air'], ['Add 1000 steps', 'Tambah 1000 langkah'], ['I slept 7 hours', 'Saya tidur 7 jam'], ['My mood is good', 'Mood saya baik'], ['Add task buy milk', 'Tambah tugasan beli susu']],
      6: [['What can I ask?', 'Apa boleh saya tanya?'], ['Is my data safe?', 'Adakah data saya selamat?'], ['Are my reminders on?', 'Peringatan saya hidup?'], ['Is app lock on?', 'Kunci app hidup?'], ['Who are you?', 'Siapa awak?'], ['Hello', 'Hai']]
    };
    const catNames = [['Today', 'Hari ini'], ['Health', 'Kesihatan'], ['Faith', 'Ibadah'], ['Money', 'Wang'], ['Motor', 'Motor'], ['Tasks', 'Tugasan'], ['Help', 'Bantuan'], ['Save record', 'Simpan rekod']];
    const order = [0, 7, 1, 2, 3, 4, 5, 6];
    const ix = ms ? 1 : 0;
    const S = [
      [0, 0, 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z', 'linear-gradient(140deg,#8fe9e2,#7c9cff)'],
      [1, 0, 'M3 12h4l3-8 4 16 3-8h4', 'linear-gradient(140deg,#5ee7df,#34d399)'],
      [1, 2, 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z', 'linear-gradient(140deg,#ff8fab,#b794ff)'],
      [1, 3, 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z', 'linear-gradient(140deg,#b794ff,#7c9cff)'],
      [2, 0, 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2', 'linear-gradient(140deg,#34d399,#5ee7df)'],
      [3, 0, 'M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM16 13h5', 'linear-gradient(140deg,#ffc46b,#ff8f5a)'],
      [4, 0, 'M6 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM18 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 16l4-7h5l3 7', 'linear-gradient(140deg,#ff8fab,#ff8f5a)'],
      [5, 0, 'M5 12l4 4 10-10', 'linear-gradient(140deg,#7c9cff,#b794ff)'],
      [7, 0, 'M12 5v14M5 12h14', 'linear-gradient(140deg,#34d399,#5ee7df)'],
      [7, 2, 'M14.7 6.3a4 4 0 0 0-5 5L4 17l3 3 5.7-5.7a4 4 0 0 0 5-5l-2.4 2.4-2.3-.7-.7-2.3z', 'linear-gradient(140deg,#ff8fab,#ff8f5a)']
    ];
    const msgs = s.msgs.map(m => {
      const me = m.me;
      return {
        just: me ? 'flex-end' : 'flex-start', avD: me ? 'none' : 'flex',
        cls: me ? '' : 'glass', bg: me ? 'linear-gradient(140deg,#7c9cff,#b794ff)' : '',
        rad: me ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
        bigD: m.big ? 'block' : 'none', barD: m.pct >= 0 ? 'block' : 'none',
        big: m.big, bigLbl: m.bigLbl, pct: m.pct < 0 ? 0 : m.pct, color: m.color || '#8fe9e2',
        text: m.text, time: m.time, linkD: m.href ? 'block' : 'none', href: m.href || '#', label: m.label,
        btnD: m.pid && s.pending && s.pending.id === m.pid ? 'flex' : 'none', yes: () => this.confirm(true), no: () => this.confirm(false), yesL: L('Save', 'Simpan'), noL: L('Cancel', 'Batal')
      };
    });
    return {
      sub: L('Private · offline', 'Peribadi · luar talian'),
      l1: ms ? '' : 'on', l2: ms ? 'on' : '',
      goEn: () => this.setState({ lang: 'en' }), goMs: () => this.setState({ lang: 'ms' }),
      clear: () => this.setState({ msgs: [], typing: false }),
      welcome: this.clean(L('Hi ' + this.fn() + '! I am your My Life assistant. I answer from your own data, on this device, with no internet or AI service. You can type in your own words, like "how much did I spend last week?" or "remind me to call mom tomorrow". Tap a question below or type your own.', 'Hai ' + this.fn() + '! Saya pembantu My Life awak. Saya jawab berdasarkan data awak sendiri, dalam peranti ini, tanpa internet atau perkhidmatan AI. Taip dengan cara awak sendiri, contohnya "berapa belanja minggu lepas?" atau "ingatkan saya telefon mak esok". Tekan soalan di bawah atau taip sendiri.')),
      startDisp: s.msgs.length === 0 ? 'grid' : 'none',
      starters: S.map(x => { const q = Q[x[0]][x[1]][ix]; return { label: q, d: x[2], bg: x[3], go: () => this.ask(q) }; }),
      msgs: msgs,
      typD: s.typing ? 'flex' : 'none',
      cats: order.map((i) => ({ name: catNames[i][ix], cls: i === s.cat ? 'cat on' : 'cat', go: () => this.setState({ cat: i }) })),
      chips: Q[s.cat].map(x => ({ label: x[ix], go: () => this.ask(x[ix]) })),
      draft: s.draft,
      ph: L('Ask or say "spent RM10 on lunch"...', 'Tanya atau cakap "belanja RM10 makan"...'),
      onDraft: (e) => this.setState({ draft: e.target.value }),
      onKey: (e) => { if (e && e.key === 'Enter') this.ask(e.target.value); },
      send: () => this.ask(this.state.draft)
    };
  }
}
