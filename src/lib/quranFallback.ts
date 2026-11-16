// Backup source for Quran audio. If the main service (Al-Quran Cloud) cannot be reached, verse files are taken from EveryAyah instead.
// Needs no list from any server: surah sizes and juz starts are built in, and EveryAyah names its files surah+verse (e.g. 002255.mp3).
const COUNTS = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];
// first verse of each juz: [surah, verse]
const JUZ: [number, number][] = [[1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111], [7, 88], [8, 41], [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56], [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1]];
const FOLDER: Record<string, string> = {
  alafasy: 'Alafasy_128kbps',
  sudais: 'Abdurrahmaan_As-Sudais_192kbps',
  muaiqly: 'MaherAlMuaiqly128kbps',
  husary: 'Husary_128kbps',
};
// Edition names used by Al-Quran Cloud, for when its reciter list cannot be loaded and nothing was saved earlier.
export const DEFAULT_ID: Record<string, string> = { alafasy: 'ar.alafasy', sudais: 'ar.abdurrahmaansudais', muaiqly: 'ar.mahermuaiqly', husary: 'ar.husary' };

const p3 = (n: number) => String(n).padStart(3, '0');
export const fallbackUrl = (qid: string, s: number, a: number) => 'https://everyayah.com/data/' + (FOLDER[qid] || FOLDER.alafasy) + '/' + p3(s) + p3(a) + '.mp3';

export function fallbackList(kind: 's' | 'j', n: number): [number, number][] {
  const out: [number, number][] = [];
  if (kind === 's') { for (let a = 1; a <= (COUNTS[n - 1] || 0); a++) out.push([n, a]); return out; }
  const st = JUZ[n - 1]; if (!st) return out;
  const en: [number, number] = JUZ[n] || [115, 1];
  let s = st[0], a = st[1];
  while (s <= 114 && (s < en[0] || (s === en[0] && a < en[1]))) { out.push([s, a]); a++; if (a > COUNTS[s - 1]) { s++; a = 1; } }
  return out;
}
export const fallbackItems = (qid: string, kind: 's' | 'j', n: number) => fallbackList(kind, n).map(([s, a]) => ({ url: fallbackUrl(qid, s, a), surah: s, ayah: a, label: s + ':' + a }));

// Can this address be reached right now? (short check, so a dead service does not leave the player waiting)
export async function reachable(url: string, ms = 5000): Promise<boolean> {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try { const r = await fetch(url, { method: 'HEAD', signal: ac.signal }); return r.ok; } catch (e) { return false; } finally { clearTimeout(t); }
}
