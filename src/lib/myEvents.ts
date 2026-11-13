// Big Malaysian events (federal public holidays + major Islamic dates), built into the app so it works offline.
// Source: official Malaysian public holiday lists (2026–2027). Lunar dates (Raya, Haji, Awal Muharram, Maulidur Rasul,
// Ramadan, Deepavali) can move by a day depending on moon sighting; the app shows a note for those.
import { builtinYear } from './holidays';
export type MyEv = { date: string; name: string; kind: 'islam' | 'national' | 'cultural'; moon?: boolean };

const L: MyEv[] = [
  { date: '2026-11-08', name: 'Deepavali', kind: 'cultural', moon: true },
  { date: '2026-12-25', name: 'Christmas Day', kind: 'cultural' },
  { date: '2027-01-01', name: "New Year's Day", kind: 'national' },
  { date: '2027-01-22', name: 'Thaipusam', kind: 'cultural' },
  { date: '2027-02-06', name: 'Chinese New Year', kind: 'cultural' },
  { date: '2027-02-08', name: 'Start of Ramadan', kind: 'islam', moon: true },
  { date: '2027-02-24', name: 'Nuzul Al-Quran', kind: 'islam', moon: true },
  { date: '2027-03-10', name: 'Hari Raya Aidilfitri', kind: 'islam', moon: true },
  { date: '2027-05-01', name: 'Labour Day', kind: 'national' },
  { date: '2027-05-17', name: 'Hari Raya Haji (Aidiladha)', kind: 'islam', moon: true },
  { date: '2027-05-20', name: 'Wesak Day', kind: 'cultural' },
  { date: '2027-06-06', name: 'Awal Muharram', kind: 'islam', moon: true },
  { date: '2027-06-07', name: "Agong's Birthday", kind: 'national' },
  { date: '2027-08-15', name: 'Maulidur Rasul', kind: 'islam', moon: true },
  { date: '2027-08-31', name: 'National Day (Merdeka)', kind: 'national' },
  { date: '2027-09-16', name: 'Malaysia Day', kind: 'national' },
  { date: '2027-10-29', name: 'Deepavali', kind: 'cultural', moon: true },
  { date: '2027-12-25', name: 'Christmas Day', kind: 'cultural' },
];

// Fixed-date holidays continue automatically after the table ends.
function fixed(y: number): MyEv[] {
  return [
    { date: y + '-01-01', name: "New Year's Day", kind: 'national' },
    { date: y + '-05-01', name: 'Labour Day', kind: 'national' },
    { date: y + '-08-31', name: 'National Day (Merdeka)', kind: 'national' },
    { date: y + '-09-16', name: 'Malaysia Day', kind: 'national' },
    { date: y + '-12-25', name: 'Christmas Day', kind: 'cultural' },
  ];
}

export type MyCache = { at: number; years: Record<string, MyEv[]>; cc?: string };
export const EMPTY_CACHE: MyCache = { at: 0, years: {} };

const kindOf = (n: string): MyEv['kind'] =>
  /raya|aidil|haji|adha|muharram|maulid|ramadan|nuzul|isra|hijri|prophet/i.test(n) ? 'islam' : /new year's day|labour|national|merdeka|malaysia day|agong|yang di|king/i.test(n) ? 'national' : 'cultural';
const MOON = /raya|aidil|haji|adha|muharram|maulid|ramadan|nuzul|deepavali|diwali|chinese|thaipusam|wesak|vesak/i;

// Federal (nationwide) public holidays from a free public holiday service. Silent on any failure.
export async function fetchMy(cache: MyCache, today: string, force = false, cc = 'MY'): Promise<MyCache | null> {
  const week = 7 * 86400000;
  const same = (cache.cc || 'MY') === cc;
  if (!force && same && Object.keys(cache.years).length > 0 && Date.now() - cache.at < week) return null; // an empty list is always asked for again
  const y0 = +today.slice(0, 4); const years: Record<string, MyEv[]> = same ? { ...cache.years } : {}; let got = 0;
  for (const y of [y0, y0 + 1]) {
    try {
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null; const tm = setTimeout(() => ctl && ctl.abort(), 8000);
      const r = await fetch('https://date.nager.at/api/v3/PublicHolidays/' + y + '/' + cc, ctl ? { signal: ctl.signal } : undefined); clearTimeout(tm);
      if (!r.ok) continue; const j: any[] = await r.json(); if (!Array.isArray(j)) continue;
      const items: MyEv[] = [];
      for (const h of j) {
        const date = String(h.date || ''); const name = String(h.name || h.localName || '');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !name) continue;
        const wide = h.global === true || !h.counties || (Array.isArray(h.counties) && h.counties.length >= (cc === 'MY' ? 10 : 5)); // countries with states (Australia, Germany...) list most holidays per state: count the ones most states share
        if (!wide) continue;
        items.push({ date, name, kind: kindOf(name), moon: MOON.test(name) });
      }
      if (items.length >= (cc === 'MY' ? 8 : 3)) { years[String(y)] = items; got++; }
    } catch (e) { /* offline: keep what we have */ }
  }
  if (got) return { at: Date.now(), years, cc };
  return same ? null : { at: 0, years: {}, cc }; // country changed and nothing came back: forget the old country's dates, and ask again next time (at: 0 = not fresh)
}

export function upcomingMy(today: string, n = 6, cache: MyCache = EMPTY_CACHE, cc = 'MY'): (MyEv & { days: number })[] {
  const y0 = +today.slice(0, 4);
  const mine = (cache.cc || 'MY') === cc; const cy = mine ? cache.years : {};
  if (cc !== 'MY') { // other countries: the built-in table where we have one, otherwise what the online service gave us
    const oAll: MyEv[] = [];
    const ys = new Set<string>(Object.keys(cy)); for (let y = y0; y <= y0 + 2; y++) ys.add(String(y));
    for (const y of ys) { const b = builtinYear(cc, +y); if (b && b.length) oAll.push(...b); else if (cy[y]) oAll.push(...cy[y]); }
    const sn = new Set<string>(); const o = oAll.filter((e) => { const k = e.date + '|' + e.name; if (sn.has(k)) return false; sn.add(k); return e.date >= today; }).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, n);
    const tt = new Date(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10)).getTime();
    return o.map((e) => ({ ...e, days: Math.round((new Date(+e.date.slice(0, 4), +e.date.slice(5, 7) - 1, +e.date.slice(8, 10)).getTime() - tt) / 86400000) }));
  }
  const byYear: Record<string, MyEv[]> = {};
  for (const e of L) (byYear[e.date.slice(0, 4)] = byYear[e.date.slice(0, 4)] || []).push(e);
  const all: MyEv[] = [];
  const yrs = new Set<string>([...Object.keys(byYear), ...Object.keys(cy)]);
  for (let y = y0; y <= Math.max(y0 + 2, 2028); y++) yrs.add(String(y));
  for (const y of yrs) {
    const online = cy[y];
    if (byYear[y]) all.push(...byYear[y]); // checked by hand, kept as is
    else if (online && online.length) all.push(...online);
    else all.push(...fixed(+y));
  }
  const seen = new Set<string>(); const uniq = all.filter((e) => { const k = e.date + '|' + e.name; if (seen.has(k)) return false; seen.add(k); return true; });
  all.length = 0; all.push(...uniq);
  const t = new Date(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10)).getTime();
  return all.filter((e) => e.date >= today).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, n)
    .map((e) => ({ ...e, days: Math.round((new Date(+e.date.slice(0, 4), +e.date.slice(5, 7) - 1, +e.date.slice(8, 10)).getTime() - t) / 86400000) }));
}
