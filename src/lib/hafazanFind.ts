import { norm, expectedWords, checkRecitation, CheckResult } from './hafazan';

export type Src = { key: string; num: number; title: string; verses: { n: number; ar: string }[] }[];
// Finds where in the Quran a recitation is from, using only what the speech model heard (no surah chosen by the person).
// The whole Quran is turned into one long list of words, and 3-word groups of the heard text are looked up in it.
type W = { word: string; key: string; s: number; key_s: string; a: number };
let stream: W[] | null = null;
let grams: Map<string, number[]> | null = null;

// Loose key: no small marks and no alif at all, so the plain spelling (العالمين) and the Uthmani spelling (ٱلْعَٰلَمِينَ) look the same.
const loose = (w: string) => norm(w).replace(/ا/g, '');

function build(src: Src) {
  if (stream && grams) return;
  const st: W[] = [];
  src.forEach((x) => x.verses.forEach((v) => expectedWords(v.ar).forEach((w) => st.push({ word: w, key: loose(w), s: x.num, key_s: x.key, a: v.n }))));
  const g = new Map<string, number[]>();
  for (let i = 0; i + 2 < st.length; i++) { const k = st[i].key + ' ' + st[i + 1].key + ' ' + st[i + 2].key; const l = g.get(k); if (l) l.push(i); else g.set(k, [i]); }
  stream = st; grams = g;
}

export type Candidate = { start: number; surah: number; surahKey: string; title: string; ayah: number; endAyah: number; endSurah: number; res: CheckResult };
export type Found = { ok: boolean; reason?: 'short' | 'none'; cands: Candidate[]; ambiguous: boolean };

export function locate(heardText: string, src: Src): Found {
  build(src);
  const titles: Record<string, string> = {}; src.forEach((x) => { titles[x.key] = x.title; });
  const st = stream as W[], g = grams as Map<string, number[]>;
  const H = (heardText || '').split(/\s+/).map(norm).filter(Boolean);
  if (H.length < 4) return { ok: false, reason: 'short', cands: [], ambiguous: false };
  const K = H.map((w) => w.replace(/ا/g, ''));
  const votes = new Map<number, number>();
  for (let j = 0; j + 2 < K.length; j++) {
    const hits = g.get(K[j] + ' ' + K[j + 1] + ' ' + K[j + 2]);
    if (!hits || hits.length > 60) continue; // a group that appears everywhere says nothing
    hits.forEach((p) => { const s0 = p - j; votes.set(s0, (votes.get(s0) || 0) + 1); });
  }
  if (!votes.size) return { ok: false, reason: 'none', cands: [], ambiguous: false };
  // starts that are within 2 words of each other are the same place: merge them
  const top = [...votes.entries()].sort((x, y) => y[1] - x[1]).slice(0, 12);
  const cands: Candidate[] = [];
  const seen: number[] = [];
  const score = (r: CheckResult) => r.words.filter((w) => w.status === 'ok').length + r.words.filter((w) => w.status === 'close').length * 0.5;
  for (const [s0] of top) {
    if (seen.some((x) => Math.abs(x - s0) <= 3)) continue;
    seen.push(s0);
    // a missed or extra word makes the guessed start off by a word or two: try the nearby starts and keep the best
    let bestStart = -1, bestRes: CheckResult | null = null;
    for (const d of [0, -1, -2, 1, 2]) {
      const start = Math.max(0, s0 + d);
      const exp = st.slice(start, start + Math.ceil(H.length * 1.15) + 2);
      if (!exp.length) continue;
      const res = checkRecitation(exp.map((e) => ({ word: e.word, verse: e.a })), heardText);
      if (!bestRes || score(res) > score(bestRes) + 0.01) { bestRes = res; bestStart = start; }
    }
    if (!bestRes) continue;
    const exp = st.slice(bestStart, bestStart + Math.ceil(H.length * 1.15) + 2);
    const res = bestRes;
    const lastIdx = Math.max(0, res.reached - 1);
    const first = exp[0], last = exp[Math.min(exp.length - 1, lastIdx)];
    cands.push({ start: bestStart, surah: first.s, surahKey: first.key_s, title: titles[first.key_s] || 'Surah ' + first.s, ayah: first.a, endAyah: last.a, endSurah: last.s, res });
  }
  // best = most correct words matched, with a small penalty for words not reached
  const val = (c: Candidate) => c.res.words.filter((w) => w.status === 'ok').length + c.res.words.filter((w) => w.status === 'close').length * 0.5;
  cands.sort((x, y) => val(y) - val(x));
  const best = cands[0];
  if (!best || val(best) < Math.min(4, H.length * 0.4)) return { ok: false, reason: 'none', cands: [], ambiguous: false };
  const close = cands.filter((c) => val(c) >= val(best) - 1.5 && (c.surah !== best.surah || c.ayah !== best.ayah));
  const keep = [best, ...close].slice(0, 4);
  return { ok: true, cands: keep, ambiguous: close.length > 0 };
}
