import { useStored } from './store';
import data from '../data/quranData.json';
import full from '../data/quranFull.json';
import { ZTEXT } from '../data/zikirText';

export type Verse = { n: number; ar: string; ms: string; en: string; rumi?: string };
const FULL: any[] = (full as any).default || (full as any);
const LEGACY: Record<number, [string, string, string, string]> = { 1: ['fatihah', 'Surah Al-Fatihah', 'ٱلْفَاتِحَة', '7 verses'], 18: ['kahfi', 'Surah Al-Kahfi', 'ٱلْكَهْف', '110 verses'], 36: ['yasin', 'Surah Yasin', 'يسٓ', 'With doa after recitation'], 67: ['mulk', 'Surah Al-Mulk', 'ٱلْمُلْك', '30 verses'] };
export type SurahInfo = { title: string; ar: string; sub: string; verses: Verse[]; bismillah: boolean; num: number };
export const SURAH: Record<string, SurahInfo> = {};
export const SURAH_LIST: { key: string; num: number; title: string; ar: string; sub: string; place: string }[] = [];
FULL.forEach((f: any) => {
  const L = LEGACY[f.n];
  const key = L ? L[0] : String(f.n);
  const title = L ? L[1] : 'Surah ' + f.t;
  const sub = L ? L[3] : f.tr + ' · ' + f.v.length + ' verses';
  const info: any = { title, ar: L ? L[2] : f.a, sub, bismillah: f.n !== 1 && f.n !== 9, num: f.n };
  Object.defineProperty(info, 'verses', { enumerable: true, get: () => f.v.map((x: string[], i: number) => ({ n: i + 1, ar: x[0], ms: x[1], en: x[2] })) });
  SURAH[key] = info;
  SURAH_LIST.push({ key, num: f.n, title, ar: info.ar, sub: f.tr + ' · ' + f.v.length + ' verses', place: f.ty === 'meccan' ? 'Makkiyyah' : 'Madaniyyah' });
});
// Four featured readings: Al-Mulk, Al-Kahfi (first 10 + last 10 verses), Yasin, As-Sajdah
const kahf = SURAH['kahfi'];
SURAH['kahfi10'] = { title: 'Al-Kahfi · first 10 & last 10', ar: kahf.ar, sub: 'Friday reading · verses 1–10 and 101–110', bismillah: true, num: 18 } as SurahInfo;
Object.defineProperty(SURAH['kahfi10'], 'verses', { enumerable: true, get: () => kahf.verses.filter((v) => v.n <= 10 || v.n >= 101) });
export const FEATURED = ['mulk', 'kahfi10', 'yasin', '32'];
export const REFS: Record<string, Verse[]> = (data as any).refs;
export const BISMILLAH = (data as any).surah.fatihah[0] as Verse;

export type Islamic = { bm: Record<string, boolean>; vb?: Record<string, number[]>; last: Record<string, number>; lastKey: string; read: Record<string, Record<string, boolean>> };
export const EMPTY_ISL: Islamic = { bm: {}, vb: {}, last: {}, lastKey: '', read: {} };
export const useIslamic = () => useStored<Islamic>('ml_islamic', EMPTY_ISL);
export const useLang = () => useStored<'ms' | 'en'>('ml_mean', 'ms');
export type ReadMode = 'tr' | 'ar' | 'flow';
// How the Quran screens show a surah: with translation, Arabic only, or one continuous flow.
export const useRead = () => useStored<ReadMode>('ml_read', 'tr');
// Tahlil, Mathurat and other dhikr screens: with translation or Arabic only.
export const useZRead = () => useStored<'tr' | 'ar'>('ml_read_z', 'tr');
export const useSize = () => useStored<number>('ml_size', 1);
export const AR_SIZE = [18, 21, 25];
export const M_SIZE = [11.5, 12.5, 14];
export const dayKey = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

export type Part = { name: string; kind: string; refs?: string[]; count?: string; custom?: 'tahlil33'; surah?: string };
export const TAHLIL: Part[] = [
  { name: 'Opening dedication (Ayat Pembuka)', kind: 'Intro' }, { name: 'Al-Fatihah', kind: 'Quran', surah: 'fatihah' }, { name: 'Al-Ikhlas (3×)', kind: 'Quran', refs: ['ikhlas'] },
  { name: 'Tahlil and Takbir', kind: 'Dhikr' }, { name: 'Al-Falaq', kind: 'Quran', refs: ['falaq'] }, { name: 'Tahlil and Takbir', kind: 'Dhikr' }, { name: 'An-Nas', kind: 'Quran', refs: ['nas'] },
  { name: 'Tahlil and Takbir', kind: 'Dhikr' }, { name: 'Al-Fatihah', kind: 'Quran', surah: 'fatihah' }, { name: 'Al-Baqarah 1 to 5', kind: 'Quran', refs: ['baq1-5'] },
  { name: 'Al-Baqarah 163', kind: 'Quran', refs: ['baq163'] }, { name: 'Ayat Al-Kursi (Al-Baqarah 255)', kind: 'Quran', refs: ['baq255'] }, { name: 'Al-Baqarah 284 to 286', kind: 'Quran', refs: ['baq284', 'baq285', 'baq286'] },
  { name: 'Hud 73 (3×)', kind: 'Quran', refs: ['hud73'] }, { name: 'Al-Ahzab 33', kind: 'Quran', refs: ['ahzab33'] }, { name: 'Al-Ahzab 56', kind: 'Quran', refs: ['ahzab56'] },
  { name: 'Selawat upon the Prophet (11×)', kind: 'Selawat' }, { name: 'Salam upon the Prophet', kind: 'Selawat' }, { name: 'Ali Imran 173 and Al-Anfal 40', kind: 'Quran', refs: ['imran173', 'anfal40'] },
  { name: 'Hauqalah', kind: 'Dhikr' }, { name: 'Istighfar (3×)', kind: 'Dhikr' }, { name: 'Tahlil (33×)', kind: 'Dhikr', custom: 'tahlil33' },
  { name: 'Syahadah (La ilaha illallah Muhammadur Rasulullah)', kind: 'Dhikr' }, { name: 'Al-Fatihah (closing)', kind: 'Quran', surah: 'fatihah' }, { name: 'Doa Tahlil', kind: 'Doa' },
];
export const MATHURAT: Part[] = [
  { name: "Ta'awwudh", kind: 'Dhikr' }, { name: 'Al-Fatihah', kind: 'Quran', surah: 'fatihah' }, { name: 'Al-Baqarah 1 to 5', kind: 'Quran', refs: ['baq1-5'] },
  { name: 'Ayat Al-Kursi (Al-Baqarah 255)', kind: 'Quran', refs: ['baq255'] }, { name: 'Al-Baqarah 256', kind: 'Quran', refs: ['baq256'] }, { name: 'Al-Baqarah 257', kind: 'Quran', refs: ['baq257'] },
  { name: 'Al-Baqarah 284', kind: 'Quran', refs: ['baq284'] }, { name: 'Al-Baqarah 285', kind: 'Quran', refs: ['baq285'] }, { name: 'Al-Baqarah 286', kind: 'Quran', refs: ['baq286'] },
  { name: 'Surah Al-Ikhlas', kind: 'Quran', refs: ['ikhlas'] }, { name: 'Surah Al-Falaq', kind: 'Quran', refs: ['falaq'] }, { name: 'Surah An-Nas', kind: 'Quran', refs: ['nas'] },
  { name: 'Doa: Asbahna / Amsaina wa amsal-mulku lillah', kind: 'Doa', count: '3×' }, { name: 'Doa: Asbahna / Amsaina, firm upon Islam', kind: 'Doa' }, { name: 'Doa: Allahumma inni asbahtu / amsaytu', kind: 'Doa' },
  { name: 'Doa: Allahumma ma asbaha / ma amsa', kind: 'Doa' }, { name: 'Doa: Ya Rabbi lakal-hamdu', kind: 'Doa' }, { name: 'Radhitu billahi Rabban', kind: 'Dhikr', count: '3×' },
  { name: 'Subhanallahi wa bihamdihi', kind: 'Dhikr', count: '3×' }, { name: 'Bismillahil-lazi la yadurru', kind: 'Dhikr', count: '3×' }, { name: "Allahumma inna na'udzu bika (from shirk)", kind: 'Doa', count: '3×' },
  { name: "A'udzu bi kalimatillahit-tammat", kind: 'Doa', count: '3×' }, { name: 'Doa: refuge from worry, sadness and debt', kind: 'Doa' }, { name: 'Doa: Allahumma afini fi badani', kind: 'Doa' },
  { name: 'Doa: refuge from disbelief and poverty', kind: 'Doa', count: '3×' }, { name: 'Sayyidul Istighfar: Allahumma anta Rabbi', kind: 'Dhikr' }, { name: 'Astaghfirullahal-lazi', kind: 'Dhikr', count: '3×' },
  { name: 'Subhanaka Allahumma wa bihamdika', kind: 'Selawat' },
  { name: 'Doa: Allahumma bika asbahna / amsayna', kind: 'Doa' }, { name: 'Doa Rabithah', kind: 'Doa' }, { name: "Doa Penutup Al-Ma'thurat", kind: 'Doa' },
];
export const KIND_COL: Record<string, [string, string]> = { Quran: ['rgba(94,231,181,.25)', '#7df0c6'], Dhikr: ['rgba(255,196,107,.25)', '#ffd593'], Selawat: ['rgba(124,156,255,.28)', '#a9bcff'], Doa: ['rgba(255,143,171,.25)', '#ffb3c6'], Intro: ['rgba(255,255,255,.14)', '#ffffff'] };
export function partVerses(p: Part, evening = false): Verse[] | null {
  const z = ZTEXT[p.name];
  if (z) { const t = evening && z.e ? z.e : z.m; return [t, ...(z.more || [])].map((x, i) => ({ n: i + 1, ar: x.ar, ms: x.ms, en: x.en, rumi: x.rumi })); }
  if (p.surah) return SURAH[p.surah].verses;
  if (p.refs) return p.refs.flatMap((r) => REFS[r]);
  return null;
}
export const nm = (n: string, evening: boolean) => n.replace('Asbahna / Amsaina wa amsal-mulku lillah', evening ? 'Amsaina wa amsal-mulku lillah' : 'Asbahna wa asbahal-mulku lillah').replace('Asbahna / Amsaina, firm', evening ? 'Amsaina, firm' : 'Asbahna, firm').replace('asbahtu / amsaytu', evening ? 'amsaytu' : 'asbahtu').replace('ma asbaha / ma amsa', evening ? 'ma amsa' : 'ma asbaha').replace('bika asbahna / amsayna', evening ? 'bika amsayna' : 'bika asbahna');
