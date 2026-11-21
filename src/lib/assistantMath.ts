// Sums the Assistant can do by itself, in English or Bahasa Malaysia: add, subtract, times, divide, percent, power, square root.
// It never uses eval: a small parser reads the numbers and signs, so nothing else can run.
const STOP = new Set(['berapa', 'kira', 'hitung', 'kiraan', 'calculate', 'compute', 'what', 'whats', 'is', 'apa', 'adalah', 'ialah', 'the', 'answer', 'jawapan', 'sama', 'dengan', 'equals', 'equal', 'rm', 'ringgit', 'tolong', 'please', 'boleh', 'awak', 'can', 'you', 'how', 'much', 'many', 'if', 'then', 'result', 'hasil', 'hasilnya', 'ke', 'kah', 'lah', 'of', 'dari', 'daripada', 'a', 'to', 'sum', 'total', 'jumlah', 'jumlahnya', 'dia', 'ni', 'nie', 'itu', 'tu', 'cuba', 'try']);
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
/** An answer when the question is a sum, otherwise an empty string. */
export function mathReply(q: string, lang: string): string {
  const ms = lang === 'ms';
  let t = ' ' + (q || '').toLowerCase().replace(/[?!=]+/g, ' ').replace(/(\d),(\d{3})(?!\d)/g, '$1$2').replace(/\s+/g, ' ').trim() + ' ';
  if (t.length > 90 || !/\d/.test(t)) return '';
  if (/\d{1,4}[-/.]\d{1,2}[-/.]\d{2,4}/.test(t)) return ''; // a date, not a sum
  // square root: "punca kuasa dua 144", "square root of 144", "sqrt 144"
  const sq = /(?:punca\s*kuasa\s*dua|punca\s*kuasa|punca\s*dua|akar\s*kuasa\s*dua|akar\s*dua|akar|square\s*root(?:\s+of)?|sq\s*root|sqrt|root(?:\s+of)?|√)\s*(?:bagi|untuk|of|\()?\s*(\d+(?:\.\d+)?)/.exec(t);
  if (sq) { const v = Math.sqrt(parseFloat(sq[1])); const a = fmt(v); return a ? (ms ? 'Punca kuasa dua ' + fmt(parseFloat(sq[1])) + ' = ' + a : 'The square root of ' + fmt(parseFloat(sq[1])) + ' = ' + a) : ''; }
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
