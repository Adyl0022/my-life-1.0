import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { createAudioPlaylist, setAudioModeAsync } from 'expo-audio';
import { localItems, saveQariCache, readQariCache } from './quranDl';
import { getItem, setItem } from './store';

// Quran audio, streamed verse by verse from the free Al-Quran Cloud service (nothing is stored on our side).
// The reciter list is read from the service when the screen opens, so a reciter that is not offered there simply does not show.
import { DEFAULT_ID, fallbackItems, reachable } from './quranFallback';
const API = 'https://api.alquran.cloud/v1';

export type Qari = { id: string; name: string; match: string[]; skip?: string[] };
export const QARIS: Qari[] = [
  { id: 'alafasy', name: 'Mishary Alafasy', match: ['alafasy', 'afasy'] },
  { id: 'sudais', name: 'Abdul Rahman As-Sudais', match: ['sudais', 'sudays'] },
  { id: 'muaiqly', name: 'Maher Al-Muaiqly', match: ['muaiqly', 'mu\'aiqly', 'muaiqaly', 'maher'] },
  { id: 'husary', name: 'Mahmoud Khalil Al-Husary', match: ['husary', 'hussary', 'husari'], skip: ['mujawwad', 'muallim', 'teacher'] },
];
export type QariOpt = Qari & { identifier: string | null };

export const JUZ_NAMES = ['Alif Lam Mim', 'Sayaqul', 'Tilkal Rusul', 'Lan Tanalu', 'Wal Muhsanat', 'La Yuhibbullah', 'Wa Iza Sami\'u', 'Wa Lau Annana', 'Qalal Mala\'u', 'Wa A\'lamu', 'Ya\'taziruna', 'Wa Ma Min Dabbah', 'Wa Ma Ubarri\'u', 'Rubama', 'Subhanalladzi', 'Qal Alam', 'Iqtaraba', 'Qad Aflaha', 'Wa Qalalladzina', 'A\'man Khalaqa', 'Utlu Ma Uhiya', 'Wa Man Yaqnut', 'Wa Mali', 'Fa Man Azlamu', 'Ilayhi Yuraddu', 'Ha Mim', 'Qala Fama Khatbukum', 'Qad Sami\'allah', 'Tabarakalladzi', 'Amma'];

// Where the person stopped, kept on this phone so they can carry on after leaving the app.
export type Resume = { qid: string; kind: 's' | 'j'; n: number; title: string; qari: string; index: number; label: string; total: number };
export const RESUME_KEY = 'ml_qresume';
export const getResume = () => getItem<Resume | null>(RESUME_KEY, null);
export const clearResume = () => setItem(RESUME_KEY, null as any).catch(() => {});

export type Item = { url: string; surah: number; ayah: number; label: string };
export type AState = {
  phase: 'idle' | 'loading' | 'ready' | 'error';
  title: string; qari: string; items: Item[]; index: number; playing: boolean; err: string;
};
let st: AState = { phase: 'idle', title: '', qari: '', items: [], index: 0, playing: false, err: '' };
const subs = new Set<() => void>();
const set = (p: Partial<AState>) => { st = { ...st, ...p }; subs.forEach((f) => f()); };
export const getAudioState = () => st;
export function useQuranAudio(): AState {
  const [, tick] = useState(0);
  useEffect(() => { const f = () => tick((n) => n + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  return st;
}

let pl: any = null;
let modeSet = false;
let token = 0;

export async function loadQaris(): Promise<QariOpt[]> {
  let eds: any[] = [];
  try {
    const r = await fetch(API + '/edition?format=audio&type=versebyverse');
    const j = await r.json();
    eds = (j && j.data) || [];
    if (!eds.length) throw new Error('empty');
    const m: Record<string, string> = {}; QARIS.forEach((q) => { const h = eds.find((e) => { const t = (String(e.identifier) + ' ' + String(e.englishName) + ' ' + String(e.name)).toLowerCase(); return q.match.some((x) => t.includes(x)) && !(q.skip || []).some((x) => t.includes(x)); }); if (h) m[q.id] = String(h.identifier); });
    saveQariCache(m);
  } catch (e) {
    // No internet: use the reciters seen last time, so downloaded recitations can still be played.
    const m = await readQariCache(); const ids = Object.keys(m || {});
    // Nothing saved either: use the built-in names, so downloads and the backup source still work.
    return QARIS.map((q) => ({ ...q, identifier: (ids.length && m[q.id]) || DEFAULT_ID[q.id] || null }));
  }
  return QARIS.map((q) => {
    const hit = eds.find((e) => {
      const h = (String(e.identifier) + ' ' + String(e.englishName) + ' ' + String(e.name)).toLowerCase();
      return q.match.some((m) => h.includes(m)) && !(q.skip || []).some((s) => h.includes(s));
    });
    return { ...q, identifier: hit ? String(hit.identifier) : null };
  });
}

const toItems = (ayahs: any[], fallbackSurah?: number): Item[] => ayahs.filter((a) => a && a.audio).map((a) => {
  const sn = (a.surah && a.surah.number) || fallbackSurah || 0; const an = a.numberInSurah || 0;
  return { url: String(a.audio).replace(/^http:/, 'https:'), surah: sn, ayah: an, label: sn + ':' + an };
});

async function start(title: string, q: QariOpt, path: string, fallbackSurah?: number, kind: 's' | 'j' = 's', n = 0, startAt = 0) {
  const my = ++token;
  stop(true);
  set({ phase: 'loading', title, qari: q.name, items: [], index: 0, playing: false, err: '' });
  try {
    // Saved on this phone? Play from there (no internet, no data). Otherwise stream.
    let items: Item[] | null = null;
    try { items = await localItems(q.id, kind, n); } catch (e) { items = null; }
    if (!items) {
      // Main service first; if it cannot be reached (or its audio address is dead), use the backup source.
      try {
        if (!q.identifier) throw new Error('no edition');
        const r = await fetch(API + path + '/' + q.identifier);
        const j = await r.json();
        items = toItems((j && j.data && j.data.ayahs) || [], fallbackSurah);
        if (items.length && !(await reachable(items[0].url))) items = null;
      } catch (e) { items = null; }
      if (my !== token) return;
      if (!items || !items.length) items = fallbackItems(q.id, kind, n);
    }
    if (my !== token) return;
    if (!items.length) throw new Error('empty');
    if (Platform.OS !== 'web' && !modeSet) { modeSet = true; try { await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' }); } catch (e) { /* ignore */ } }
    const from = Math.max(0, Math.min(items.length - 1, startAt));
    let armed = from === 0; if (!armed) setTimeout(() => { armed = true; }, 2500); // ignore the first updates (verse 1) until the jump to the saved verse happened
    pl = createAudioPlaylist({ sources: items.map((i) => ({ uri: i.url })), updateInterval: 400 });
    pl.addListener('playlistStatusUpdate', (s: any) => {
      if (my !== token) return;
      const i = Math.max(0, Math.min(items.length - 1, s.currentIndex || 0));
      if (!armed) { if (i === from) armed = true; else return; }
      const finished = !s.playing && i === items.length - 1 && s.duration > 0 && s.currentTime >= s.duration - 0.3;
      if (i !== st.index || !!s.playing !== st.playing) { set({ index: i, playing: !!s.playing }); setItem(RESUME_KEY, { qid: q.id, kind, n, title, qari: q.name, index: i, label: items![i].label, total: items!.length } as Resume).catch(() => {}); }
      if (finished) { set({ playing: false }); clearResume(); }
    });
    set({ phase: 'ready', items, index: from, playing: true });
    try { pl.setActiveForLockScreen(true, { title: title, artist: q.name }); } catch (e) { /* ignore */ }
    if (from > 0) { try { pl.skipTo(from); } catch (e) { /* start from the first verse */ } }
    pl.play();
  } catch (e) {
    if (my === token) set({ phase: 'error', err: 'Could not load the recitation. Check your internet and try again, or download it first to listen offline.' });
  }
}

export const playSurah = (num: number, title: string, q: QariOpt) => start(title, q, '/surah/' + num, num, 's', num);
export const playJuz = (juz: number, q: QariOpt) => start('Juz ' + juz + ' · ' + JUZ_NAMES[juz - 1], q, '/juz/' + juz, undefined, 'j', juz);

export const resumeLast = (r: Resume, q: QariOpt) => r.kind === 's' ? start(r.title, q, '/surah/' + r.n, r.n, 's', r.n, r.index) : start(r.title, q, '/juz/' + r.n, undefined, 'j', r.n, r.index);

export function toggle() { if (!pl) return; try { if (st.playing) { pl.pause(); set({ playing: false }); } else { pl.play(); set({ playing: true }); } } catch (e) { /* ignore */ } }
export function next() { if (!pl) return; try { pl.next(); } catch (e) { /* ignore */ } }
export function prev() { if (!pl) return; try { pl.previous(); } catch (e) { /* ignore */ } }
export function stop(keepToken = false) {
  if (!keepToken) token++;
  try { if (pl) { pl.pause(); pl.clearLockScreenControls && pl.clearLockScreenControls(); pl.destroy && pl.destroy(); } } catch (e) { /* ignore */ }
  pl = null;
  if (!keepToken) set({ phase: 'idle', title: '', qari: '', items: [], index: 0, playing: false, err: '' });
}
