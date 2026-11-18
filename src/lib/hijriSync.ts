// Islamic calendar events. Dates come from a built-in Umm al-Qura table (works offline). When online, today's Hijri date from JAKIM is compared with the table and a 1-day difference is applied to events in the next 45 days only.
import { useEffect } from 'react';
import { useStored } from './store';
import { OFFICIAL_LIST } from './myEvents';
import { HMON, diffDays, keyD, addDays, parseK } from './fasting';

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

// First day of each Hijri month (Umm al-Qura), Hijri year -> 12 dates.
const MS: Record<number, string[]> = {
  1448: ["2026-06-16", "2026-07-15", "2026-08-14", "2026-09-12", "2026-10-12", "2026-11-11", "2026-12-10", "2027-01-09", "2027-02-08", "2027-03-09", "2027-04-08", "2027-05-07"],
  1449: ["2027-06-06", "2027-07-05", "2027-08-03", "2027-09-02", "2027-10-01", "2027-10-31", "2027-11-29", "2027-12-29", "2028-01-28", "2028-02-26", "2028-03-27", "2028-04-26"],
  1450: ["2028-05-25", "2028-06-24", "2028-07-23", "2028-08-22", "2028-09-20", "2028-10-19", "2028-11-18", "2028-12-17", "2029-01-16", "2029-02-14", "2029-03-16", "2029-04-15"],
  1451: ["2029-05-14", "2029-06-13", "2029-07-13", "2029-08-12", "2029-09-10", "2029-10-09", "2029-11-08", "2029-12-07", "2030-01-05", "2030-02-04", "2030-03-06", "2030-04-04"],
  1452: ["2030-05-04", "2030-06-03", "2030-07-02", "2030-08-01", "2030-08-31", "2030-09-29", "2030-10-28", "2030-11-27", "2030-12-26", "2031-01-24", "2031-02-23", "2031-03-24"]
};

// Same events in the Daily Planner's Malaysia calendar. Where it has a date within 2 days of ours, its date is used so both screens agree.
const PLAN: Record<string, string> = { 'Awal Ramadan': 'Start of Ramadan', 'Nuzul Quran': 'Nuzul Al-Quran', 'Aidilfitri': 'Hari Raya Aidilfitri', 'Aidiladha': 'Hari Raya Haji (Aidiladha)', 'Awal Muharram': 'Awal Muharram', 'Maulidur Rasul': 'Maulidur Rasul' };

export type Upcoming = { n: string; tip: string; date: Date; days: number; hText: string };
export function upcoming(today: Date, delta: number, count = 4): Upcoming[] {
  const out: Upcoming[] = [];
  for (const y of Object.keys(MS).map(Number)) for (const e of EVENTS) {
    const base = addDays(parseK(MS[y][e.m - 1]), e.d - 1), days0 = diffDays(base, today);
    let date = days0 <= 45 ? addDays(base, delta) : base;
    const pe = PLAN[e.n] && OFFICIAL_LIST.find((o) => o.name === PLAN[e.n] && Math.abs(diffDays(parseK(o.date), date)) <= 2);
    if (pe) date = parseK(pe.date);
    const days = diffDays(date, today);
    if (days >= 0) out.push({ n: e.n, tip: e.tip, date, days, hText: e.d + ' ' + HMON[e.m - 1] + ' ' + y });
  }
  return out.sort((a, b) => a.days - b.days).slice(0, count);
}

// Reads today's Hijri date from JAKIM when online and keeps the day difference to the table (-2..2). Returns it.
export function useHijriSync(): number {
  const [s, setS] = useStored<Sync>('ml_hijri_sync2', SYNC0);
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
        if (!m || dead || !MS[+m[1]]) return;
        const start = addDays(now, -(+m[3] - 1)), tbl = parseK(MS[+m[1]][+m[2] - 1]), d = diffDays(start, tbl);
        if (d >= -2 && d <= 2) setS({ k, off: d });
      } catch (e) {}
    })();
    return () => { dead = true; };
  }, [s.k]);
  return s.k ? s.off : 0;
}
