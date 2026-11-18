// Islamic calendar events and an online Hijri date sync (JAKIM). The sync only stores a whole-day offset, so the card still works offline.
import { useEffect } from 'react';
import { useStored } from './store';
import { hijriOf, hijriStart, HMON, diffDays, keyD } from './fasting';

type Sync = { k: string; off: number };
const SYNC0: Sync = { k: '', off: 0 };

export const EVENTS: { m: number; d: number; n: string; tip: string }[] = [
  { m: 1, d: 1, n: 'Awal Muharram', tip: 'The Islamic new year. A good day to make a fresh start and a new intention.' },
  { m: 1, d: 10, n: 'Hari Asyura', tip: 'Sunnah to fast on the 10th of Muharram, and also the 9th.' },
  { m: 3, d: 12, n: 'Maulidur Rasul', tip: 'The birthday of the Prophet ﷺ. Send salawat upon him often.' },
  { m: 7, d: 27, n: "Isra' Mi'raj", tip: 'The night journey of the Prophet ﷺ, when the five daily prayers were given.' },
  { m: 8, d: 15, n: 'Nisfu Syaaban', tip: 'The middle of Syaaban. Many Muslims fast on the 13th to 15th.' },
  { m: 9, d: 1, n: 'Awal Ramadan', tip: 'The month of fasting begins. Prepare your intention and your make-up fasts.' },
  { m: 9, d: 17, n: 'Nuzul Quran', tip: 'The night the Quran began to be revealed. Read it with its meaning today.' },
  { m: 10, d: 1, n: 'Aidilfitri', tip: 'Eid al-Fitr. No fasting today. Say the takbir and give zakat al-fitr.' },
  { m: 12, d: 9, n: 'Hari Arafah', tip: 'Sunnah to fast on Arafah for those not performing Hajj.' },
  { m: 12, d: 10, n: 'Aidiladha', tip: 'Eid al-Adha. No fasting today. Qurban is offered from today.' },
];

export type Upcoming = { n: string; tip: string; date: Date; days: number; hText: string };
export function upcoming(today: Date, off: number, count = 4): Upcoming[] {
  const hy = hijriOf(today, off).y, out: Upcoming[] = [];
  for (const y of [hy, hy + 1, hy + 2]) for (const e of EVENTS) {
    const date = hijriStart(y, e.m, e.d, off), days = diffDays(date, today);
    if (days >= 0) out.push({ n: e.n, tip: e.tip, date, days, hText: e.d + ' ' + HMON[e.m - 1] + ' ' + y });
  }
  return out.sort((a, b) => a.days - b.days).slice(0, count);
}

// Reads today's Hijri date from JAKIM when online and keeps the difference to the built-in calendar. Returns the offset to use.
export function useHijriSync(manualOff: number): number {
  const [s, setS] = useStored<Sync>('ml_hijri_sync', SYNC0);
  useEffect(() => {
    const now = new Date(), k = keyD(now);
    if (s.k === k) return;
    let dead = false;
    (async () => {
      try {
        const r = await fetch('https://www.e-solat.gov.my/index.php?r=esolatApi/TakwimSolat&period=month&zone=WLY01');
        if (!r.ok) return;
        const j = await r.json();
        const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const want = String(now.getDate()).padStart(2, '0') + '-' + MON[now.getMonth()] + '-' + now.getFullYear();
        const row = (j.prayerTime || []).find((x: any) => String(x.date).toLowerCase() === want);
        const m = row && /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(row.hijri));
        if (!m || dead) return;
        // find the offset (-3..3) that makes the built-in calendar match JAKIM's date for today
        let best = 0, found = false;
        for (let o = -3; o <= 3 && !found; o++) { const h = hijriOf(now, o); if (h.y === +m[1] && h.m === +m[2] && h.d === +m[3]) { best = o; found = true; } }
        if (found) setS({ k, off: best });
      } catch (e) {}
    })();
    return () => { dead = true; };
  }, [s.k]);
  return s.k ? s.off : manualOff;
}
