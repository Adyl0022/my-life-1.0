// Hafazan check: compares what the person recited (as text from the speech model) with the real Quran text, word by word.
// Pure functions only (no phone APIs), so they can be tested anywhere.

// Removes every small mark (harakat, shadda, madd, waqf signs, dagger alif ...) and unifies letter shapes,
// because the speech model writes plain letters and this is the part we can compare reliably.
export function norm(s: string): string {
  return (s || '')
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿ‌-‏ﹰ-ﹿ]/g, '')
    .replace(/ـ/g, '')
    .replace(/[ٱآأإٲٳٵ]/g, 'ا')
    .replace(/[ىیئ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ة/g, 'ه')
    .replace(/[^ء-ي]/g, '');
}

// A "word" in the Quran text that is only a stop sign (e.g. ۖ) is not a word to recite.
// Same as norm, but a dagger alif (the small alif above a letter) is written out as a full alif, the way plain Arabic spelling
// writes it (e.g. العالمين). The speech model may write either way, so both spellings are accepted.
export const normFull = (s: string) => norm((s || '').replace(/\u0670/g, '\u0627'));
const isMark = (w: string) => !norm(w);
export const expectedWords = (ar: string): string[] => (ar || '').split(/\s+/).filter((w) => w && !isMark(w));

// Letters that are easily confused with each other when the sound is not right (makhraj).
const SIMILAR: [string, string][] = [['ص', 'س'], ['ث', 'س'], ['ث', 'ت'], ['ذ', 'ز'], ['ذ', 'د'], ['ظ', 'ض'], ['ض', 'د'], ['ط', 'ت'], ['ح', 'ه'], ['ع', 'ا'], ['ق', 'ك'], ['غ', 'خ'], ['ش', 'س'], ['ظ', 'ز'], ['ء', 'ا']];
const sim = (a: string, b: string) => a === b || SIMILAR.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

function lev(a: string, b: string): number {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

export type WStatus = 'ok' | 'close' | 'wrong' | 'missing' | 'pending';
export type WResult = { word: string; status: WStatus; heard?: string; verse: number; hint?: string };

// How close two normalised words are: 0 equal, 1 near (one letter off / similar sounding), 2 different.
function wordDist(a: string, b: string): number {
  if (a === b) return 0;
  if (!a || !b) return 2;
  // the model sometimes joins or splits a word, or drops a long vowel: treat one-letter differences as near
  const d = lev(a, b);
  if (d === 0) return 0;
  if (d === 1 && Math.max(a.length, b.length) >= 3) return 1;
  if (a.length === b.length && d <= 2 && [...a].every((c, i) => sim(c, b[i]) || c === b[i])) return 1;
  if (d === 1) return 1.5;
  return 2;
}

export type CheckResult = { words: WResult[]; extra: string[]; score: number; reached: number; total: number };

// Needleman-Wunsch alignment of expected words against heard words.
// Words after the last heard word are "pending" (the person simply stopped), not mistakes.
export function checkRecitation(expected: { word: string; verse: number }[], heardText: string): CheckResult {
  const E = expected.map((e) => norm(e.word));
  const E2 = expected.map((e) => normFull(e.word));
  const wd = (i: number, h: string) => Math.min(wordDist(E[i], h), wordDist(E2[i], h));
  const H = (heardText || '').split(/\s+/).map(norm).filter(Boolean);
  const m = E.length, n = H.length;
  const GAP = -1, SUB = (d: number) => { return d === 0 ? 2 : d === 1 ? 0.8 : d === 1.5 ? 0.3 : -1; };
  const S: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  const T: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) { S[i][0] = i * GAP; T[i][0] = 1; }
  for (let j = 1; j <= n; j++) { S[0][j] = j * GAP; T[0][j] = 2; }
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const dg = S[i - 1][j - 1] + SUB(wd(i - 1, H[j - 1])), up = S[i - 1][j] + GAP, lf = S[i][j - 1] + GAP;
    const best = Math.max(dg, up, lf);
    S[i][j] = best; T[i][j] = best === dg ? 0 : best === up ? 1 : 2;
  }
  const res: WResult[] = new Array(m);
  const extra: string[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    const t = i > 0 && j > 0 ? T[i][j] : i > 0 ? 1 : 2;
    if (t === 0) {
      const d = wd(i - 1, H[j - 1]);
      res[i - 1] = { word: expected[i - 1].word, verse: expected[i - 1].verse, heard: H[j - 1], status: d === 0 ? 'ok' : d === 1 ? 'close' : 'wrong' };
      i--; j--;
    } else if (t === 1) { res[i - 1] = { word: expected[i - 1].word, verse: expected[i - 1].verse, status: 'missing' }; i--; }
    else { extra.unshift(H[j - 1]); j--; }
  }
  // Everything after the last word that was matched to something is "not reached yet".
  let last = -1; res.forEach((r, k) => { if (r.status !== 'missing') last = k; });
  for (let k = last + 1; k < m; k++) res[k] = { ...res[k], status: 'pending' };
  const reached = last + 1;
  const ok = res.filter((r) => r.status === 'ok').length + res.filter((r) => r.status === 'close').length * 0.5;
  return { words: res, extra, reached, total: m, score: reached ? Math.round((ok / reached) * 100) : 0 };
}

// ---- Tajwid reminders (from the written text, NOT heard from the audio) ----
// These are shown only for words the person got wrong or nearly wrong, as a reminder of rules in that word.
const QALQ = 'قطبجد';
export function tajwidTips(w: string): string[] {
  const t: string[] = [];
  if (/ٓ/.test(w)) t.push('Madd: hold the long vowel (usually 4-6 counts).');
  if (/[نم]ّ/.test(w)) t.push('Ghunnah: nasal sound for about 2 counts on the shaddah.');
  if (new RegExp('[' + QALQ + ']ْ').test(w) || new RegExp('[' + QALQ + ']$').test(norm(w))) t.push('Qalqalah: a light echo on this letter when it has sukun or you stop on it.');
  if (/[ًࣰٌࣱٍࣲ]/.test(w) || /نْ/.test(w)) t.push('Noon sakinah / tanwin: check idgham, ikhfa, iqlab or idhhar with the next letter.');
  if (/لّ?ه|الله/.test(norm(w))) t.push('Lafzul Jalalah: the lam is full or light depending on the vowel before it.');
  return t;
}

// What was probably wrong: a short note for a close word, from the letters that differ.
export function closeNote(exp: string, heard: string): string {
  const a = norm(exp), b = norm(heard || '');
  for (let k = 0; k < Math.min(a.length, b.length); k++) if (a[k] !== b[k]) return 'Heard "' + b[k] + '" where "' + a[k] + '" is expected: check the makhraj (place of the letter).';
  return a.length > b.length ? 'A letter sounded missing at the end.' : 'An extra sound was heard.';
}
