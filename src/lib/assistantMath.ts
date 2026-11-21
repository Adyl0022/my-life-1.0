// Sums the Assistant can do by itself, in English or Bahasa Malaysia: add, subtract, times, divide, percent, power, square root.
// It never uses eval: a small parser reads the numbers and signs, so nothing else can run.
const STOP = new Set(['berapa', 'kira', 'hitung', 'kiraan', 'calculate', 'compute', 'what', 'whats', 'is', 'apa', 'adalah', 'ialah', 'the', 'answer', 'jawapan', 'sama', 'dengan', 'equals', 'equal', 'rm', 'ringgit', 'tolong', 'please', 'boleh', 'awak', 'can', 'you', 'how', 'much', 'many', 'if', 'then', 'result', 'hasil', 'hasilnya', 'ke', 'kah', 'lah', 'of', 'dari', 'daripada', 'a', 'to', 'sum', 'total', 'jumlah', 'jumlahnya', 'dia', 'ni', 'nie', 'itu', 'tu', 'cuba', 'try', 'tell', 'me', 'give', 'find', 'work', 'out', 'saya', 'i', 'want', 'know', 'tahu', 'nak', 'mahu', 'bagi', 'beritahu', 'kasi', 'hey', 'hai', 'hi', 'so', 'jadi', 'pula', 'eh', 'ya', 'ye']);
const WORDS: [RegExp, string][] = [
  [/\b(tambah|campur|campurkan|ditambah|plus|add)\b/g, ' + '],
  [/\b(tolak|ditolak|kurang|kurangkan|minus|subtract)\b/g, ' - '],
  [/\b(darab|didarab|kali|times|multiplied by|multiply by|multiply)\b/g, ' * '],
  [/\b(bahagi|dibahagi|bahagikan|divided by|divide by|divide|over)\b/g, ' / '],
  [/\b(kuasa|power|pangkat)\b/g, ' ^ '],
];
function fmt(n: number): string {
  if (!isFinite(n)) return '';
  const r = Math.round(n * 1e6) / 1e6; const [a, b] = String(r).split('.');
  return a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (b ? '.' + b : '');
}
// number sign number, with brackets, ^ and unary minus
function evalExpr(src: string): number | null {
  const t = src.match(/\d+(?:\.\d+)?|[+\-*/^()]/g); if (!t) return null; let i = 0; let bad = false;
  const peek = () => t[i]; const next = () => t[i++];
  const prim = (): number => {
    const x = next();
    if (x === '(') { const v = add(); if (next() !== ')') bad = true; return v; }
    if (x === '-') return -prim(); if (x === '+') return prim();
    if (x == null || !/^\d/.test(x)) { bad = true; return 0; }
    return parseFloat(x);
  };
  const pow = (): number => { const b = prim(); if (peek() === '^') { next(); return Math.pow(b, pow()); } return b; };
  const mul = (): number => { let v = pow(); while (peek() === '*' || peek() === '/') { const o = next(); const r = pow(); v = o === '*' ? v * r : v / r; } return v; };
  const add = (): number => { let v = mul(); while (peek() === '+' || peek() === '-') { const o = next(); const r = mul(); v = o === '+' ? v + r : v - r; } return v; };
  const v = add(); if (bad || i < t.length) return null; return v;
}

// Numbers written as words ("twenty five", "dua puluh lima") become digits, so people can speak or type naturally.
const UNIT: Record<string, number> = { zero: 0, kosong: 0, one: 1, satu: 1, two: 2, dua: 2, three: 3, tiga: 3, four: 4, empat: 4, five: 5, lima: 5, six: 6, enam: 6, seven: 7, tujuh: 7, eight: 8, lapan: 8, nine: 9, sembilan: 9, ten: 10, sepuluh: 10, eleven: 11, sebelas: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, seratus: 100, seribu: 1000, sejuta: 1000000 };
const MAG: Record<string, number> = { hundred: 100, ratus: 100, thousand: 1000, ribu: 1000, million: 1000000, juta: 1000000 };
function numWords(text: string): string {
  const tk = text.split(' '); const out: string[] = []; let i = 0;
  const isNum = (w?: string) => !!w && (w in UNIT || w in MAG || w === 'puluh' || w === 'belas');
  while (i < tk.length) {
    if (!isNum(tk[i])) { out.push(tk[i]); i++; continue; }
    let total = 0; let cur = 0; let used = 0;
    while (i < tk.length) {
      const w = tk[i];
      if (w === 'and' && isNum(tk[i + 1]) && used && /^(hundred|thousand|ratus|ribu)$/.test(tk[i - 1])) { i++; continue; }
      if (!isNum(w)) break;
      if (w in UNIT) { const v = UNIT[w]; if (v >= 100) { total += v; } else cur += v; }
      else if (w === 'puluh') cur = (cur || 1) * 10;
      else if (w === 'belas') cur = 10 + cur;
      else { const m = MAG[w]; if (m === 100) cur = (cur || 1) * 100; else { total += (cur || 1) * m; cur = 0; } }
      used++; i++;
    }
    out.push(String(total + cur));
  }
  return out.join(' ');
}
const NUM = '(\\d+(?:\\.\\d+)?)';
// Phrases people really say. Returns an answer, or '' when it is none of these.
function phrases(t: string, ms: boolean): string {
  const f = (n: number) => fmt(n);
  const two = (a: number, o: string, b: number, v: number) => f(a) + ' ' + o + ' ' + f(b) + ' = ' + f(v);
  let m: RegExpExecArray | null;
  if ((m = new RegExp('(?:half|separuh|setengah)\\s*(?:of|daripada|dari)?\\s*' + NUM).exec(t))) { const a = parseFloat(m[1]); return (ms ? 'Separuh daripada ' : 'Half of ') + f(a) + ' = ' + f(a / 2); }
  if ((m = new RegExp('(?:a\\s+)?(?:quarter|suku)\\s*(?:of|daripada|dari)?\\s*' + NUM).exec(t))) { const a = parseFloat(m[1]); return (ms ? 'Suku daripada ' : 'A quarter of ') + f(a) + ' = ' + f(a / 4); }
  if ((m = new RegExp('(?:double|twice|dua\\s*kali\\s*ganda)\\s*(?:of|daripada|dari)?\\s*' + NUM).exec(t))) { const a = parseFloat(m[1]); return (ms ? 'Dua kali ganda ' : 'Double ') + f(a) + ' = ' + f(a * 2); }
  if ((m = new RegExp('(?:triple|three\\s*times|tiga\\s*kali\\s*ganda)\\s*(?:of|daripada|dari)?\\s*' + NUM).exec(t))) { const a = parseFloat(m[1]); return (ms ? 'Tiga kali ganda ' : 'Triple ') + f(a) + ' = ' + f(a * 3); }
  if ((m = new RegExp('(?:square\\s*of|kuasa\\s*dua\\s*(?:bagi|untuk)?)\\s*' + NUM + '|' + NUM + '\\s*(?:squared|kuasa\\s*dua)').exec(t))) { const a = parseFloat(m[1] || m[2]); return f(a) + (ms ? ' kuasa dua = ' : ' squared = ') + f(a * a); }
  if ((m = new RegExp('(?:cube\\s*of|kuasa\\s*tiga\\s*(?:bagi|untuk)?)\\s*' + NUM + '|' + NUM + '\\s*(?:cubed|kuasa\\s*tiga)').exec(t))) { const a = parseFloat(m[1] || m[2]); return f(a) + (ms ? ' kuasa tiga = ' : ' cubed = ') + f(a * a * a); }
  if ((m = new RegExp('(?:add|plus|sum\\s*of|tambah|campur|jumlah(?:\\s*bagi)?)\\s*' + NUM + '\\s*(?:and|with|to|dan|dengan|ke|serta)\\s*' + NUM).exec(t))) { const a = parseFloat(m[1]), b = parseFloat(m[2]); return two(a, '+', b, a + b); }
  if ((m = new RegExp('(?:subtract|tolak)\\s*' + NUM + '\\s*(?:from|daripada|dari)\\s*' + NUM).exec(t))) { const a = parseFloat(m[1]), b = parseFloat(m[2]); return two(b, '-', a, b - a); }
  if ((m = new RegExp('(?:multiply|darab)\\s*' + NUM + '\\s*(?:by|with|and|dengan|dan)\\s*' + NUM).exec(t))) { const a = parseFloat(m[1]), b = parseFloat(m[2]); return two(a, '×', b, a * b); }
  if ((m = new RegExp('(?:divide|bahagi(?:kan)?)\\s*' + NUM + '\\s*(?:by|with|dengan)\\s*' + NUM).exec(t))) { const a = parseFloat(m[1]), b = parseFloat(m[2]); return b === 0 ? (ms ? 'Tak boleh dibahagi dengan sifar.' : 'You cannot divide by zero.') : two(a, '÷', b, a / b); }
  return '';
}
/** An answer when the question is a sum, otherwise an empty string. */
export function mathReply(q: string, lang: string): string {
  const ms = lang === 'ms';
  let t = ' ' + (q || '').toLowerCase().replace(/[?!=]+/g, ' ').replace(/(\d),(\d{3})(?!\d)/g, '$1$2').replace(/\s+/g, ' ').trim() + ' ';
  t = t.replace(/\b(kuasa|punca|akar)\s+(dua|tiga)\b/g, '$1$2').replace(/\b(dua|tiga)\s+kali\s+ganda\b/g, '$1kaliganda');
  t = ' ' + numWords(t.replace(/(\d)\s*(?:per\s*cent)/g, '$1 percent').trim()) + ' ';
  if (t.length > 120 || !/\d/.test(t)) return '';
  if (/\d{1,4}[-/.]\d{1,2}[-/.]\d{2,4}/.test(t)) return ''; // a date, not a sum
  // square root: "punca kuasa dua 144", "square root of 144", "sqrt 144"
  const sq = /(?:punca\s*kuasa\s*dua|punca\s*kuasa|punca\s*dua|akar\s*kuasa\s*dua|akar\s*dua|akar|square\s*root(?:\s+of)?|sq\s*root|sqrt|root(?:\s+of)?|√)\s*(?:bagi|untuk|of|\()?\s*(\d+(?:\.\d+)?)/.exec(t);
  if (sq) { const v = Math.sqrt(parseFloat(sq[1])); const a = fmt(v); return a ? (ms ? 'Punca kuasa dua ' + fmt(parseFloat(sq[1])) + ' = ' + a : 'The square root of ' + fmt(parseFloat(sq[1])) + ' = ' + a) : ''; }
  { const ph = phrases(t, ms); if (ph) return ph; }
  // percent: "15% daripada 200", "what is 15 percent of 200", "berapa 10 peratus dari 350"
  const pc = /(\d+(?:\.\d+)?)\s*(?:%|peratus|percent|per cent)\s*(?:of|dari|daripada|from)\s*(\d+(?:\.\d+)?)/.exec(t);
  if (pc) { const a = parseFloat(pc[1]), b = parseFloat(pc[2]); return fmt(a) + '% ' + (ms ? 'daripada ' : 'of ') + fmt(b) + ' = ' + fmt((a * b) / 100); }
  // "x is what percent of y": "20 daripada 80 berapa peratus"
  const pr = /(\d+(?:\.\d+)?)\s*(?:of|dari|daripada|out of)\s*(\d+(?:\.\d+)?)\s*(?:is\s+)?(?:what|berapa)\s*(?:percent|peratus|%)/.exec(t);
  if (pr && parseFloat(pr[2]) !== 0) { const a = parseFloat(pr[1]), b = parseFloat(pr[2]); return fmt(a) + (ms ? ' daripada ' : ' of ') + fmt(b) + ' = ' + fmt((a / b) * 100) + '%'; }
  for (const [re, to] of WORDS) t = t.replace(re, to);
  t = t.replace(/(\d)\s*[x×]\s*(?=[\d(])/g, '$1 * ').replace(/×/g, ' * ').replace(/÷/g, ' / ').replace(/(\d)\s*:\s*(?=\d)/g, '$1 / ');
  t = t.replace(/\^/g, ' ^ ');
  const left = t.replace(/\d+(?:\.\d+)?|[+\-*/^()]/g, ' ').split(/\s+/).filter(Boolean);
  if (left.some((w) => !STOP.has(w.replace(/[^a-z]/g, '')))) return '';
  const expr = t.replace(/[a-z]+/g, ' ');
  if (!/[+*/^]/.test(expr) && !/\d\s+-\s*\d/.test(expr) && !/\)\s*\(|\d\s*\(/.test(expr)) return '';
  if ((expr.match(/\d+(?:\.\d+)?/g) || []).length < 2) return '';
  const v = evalExpr(expr); if (v == null) return '';
  if (!isFinite(v)) return ms ? 'Tak boleh dibahagi dengan sifar.' : 'You cannot divide by zero.';
  const shown = expr.replace(/\s+/g, ' ').replace(/\*/g, '×').replace(/\//g, '÷').replace(/\d+(?:\.\d+)?/g, (n) => fmt(parseFloat(n))).trim();
  return shown + ' = ' + fmt(v);
}
