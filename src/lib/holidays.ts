import type { MyEv } from './myEvents';

// Built-in public holidays for nearby countries, so the Planner is never empty even offline.
// Checked against official or government-linked lists (Singapore MOM, Indonesia SKB 3 Menteri, Brunei and Thailand calendars) for Dec 2026 to 2027.
// Lunar dates (moon: true) can move by a day. Years after the table use the fixed-date holidays below, or the online list when it is available.
const n = (date: string, name: string, kind: MyEv['kind'] = 'national', moon = false): MyEv => (moon ? { date, name, kind, moon } : { date, name, kind });

export const BUILTIN: Record<string, MyEv[]> = {
  SG: [
    n('2026-12-25', 'Christmas Day', 'cultural'),
    n('2027-01-01', "New Year's Day"),
    n('2027-02-06', 'Chinese New Year', 'cultural', true),
    n('2027-02-08', 'Chinese New Year (in lieu)', 'cultural', true),
    n('2027-03-10', 'Hari Raya Puasa', 'islam', true),
    n('2027-03-26', 'Good Friday', 'cultural'),
    n('2027-05-01', 'Labour Day'),
    n('2027-05-17', 'Hari Raya Haji', 'islam', true),
    n('2027-05-20', 'Vesak Day', 'cultural', true),
    n('2027-08-09', 'National Day'),
    n('2027-10-28', 'Deepavali', 'cultural', true),
    n('2027-12-25', 'Christmas Day', 'cultural'),
  ],
  ID: [
    n('2026-12-24', 'Christmas (joint leave)', 'cultural'),
    n('2026-12-25', 'Christmas Day', 'cultural'),
    n('2027-01-01', "New Year's Day"),
    n('2027-01-05', "Isra Mi'raj", 'islam', true),
    n('2027-02-05', 'Chinese New Year (joint leave)', 'cultural', true),
    n('2027-02-06', 'Chinese New Year', 'cultural', true),
    n('2027-03-08', 'Nyepi (Balinese New Year)', 'cultural'),
    n('2027-03-09', 'Eid al-Fitr (joint leave)', 'islam', true),
    n('2027-03-10', 'Eid al-Fitr', 'islam', true),
    n('2027-03-11', 'Eid al-Fitr', 'islam', true),
    n('2027-03-12', 'Eid al-Fitr (joint leave)', 'islam', true),
    n('2027-03-15', 'Eid al-Fitr (joint leave)', 'islam', true),
    n('2027-03-25', 'Good Friday (joint leave)', 'cultural'),
    n('2027-03-26', 'Good Friday', 'cultural'),
    n('2027-03-28', 'Easter Sunday', 'cultural'),
    n('2027-05-01', 'Labour Day'),
    n('2027-05-06', 'Ascension of Jesus Christ', 'cultural'),
    n('2027-05-17', 'Eid al-Adha', 'islam', true),
    n('2027-05-18', 'Eid al-Adha (joint leave)', 'islam', true),
    n('2027-05-19', 'Vesak (joint leave)', 'cultural', true),
    n('2027-05-20', 'Vesak Day', 'cultural', true),
    n('2027-06-01', 'Pancasila Day'),
    n('2027-06-06', 'Islamic New Year', 'islam', true),
    n('2027-08-15', "Prophet Muhammad's Birthday", 'islam', true),
    n('2027-08-17', 'Independence Day'),
    n('2027-12-24', 'Christmas (joint leave)', 'cultural'),
    n('2027-12-25', 'Christmas Day', 'cultural'),
    n('2027-12-26', "Isra Mi'raj", 'islam', true),
  ],
  BN: [
    n('2026-12-25', 'Christmas Day', 'cultural'),
    n('2026-12-26', 'Christmas Day (observed)', 'cultural'),
    n('2027-01-01', "New Year's Day"),
    n('2027-01-06', "Isra Mi'raj", 'islam', true),
    n('2027-02-06', 'Chinese New Year', 'cultural', true),
    n('2027-02-08', 'Start of Ramadan', 'islam', true),
    n('2027-02-23', 'National Day'),
    n('2027-02-24', 'Nuzul Al-Quran', 'islam', true),
    n('2027-03-10', 'Hari Raya Aidilfitri', 'islam', true),
    n('2027-03-11', 'Hari Raya Aidilfitri holiday', 'islam', true),
    n('2027-03-12', 'Hari Raya Aidilfitri holiday', 'islam', true),
    n('2027-05-17', 'Hari Raya Aidiladha', 'islam', true),
    n('2027-05-31', 'Royal Brunei Armed Forces Day'),
    n('2027-06-06', 'Awal Muharram', 'islam', true),
    n('2027-06-07', 'Awal Muharram (day off)', 'islam', true),
    n('2027-07-15', "Sultan's Birthday"),
    n('2027-08-15', 'Maulidur Rasul', 'islam', true),
    n('2027-08-16', 'Maulidur Rasul (observed)', 'islam', true),
    n('2027-12-25', 'Christmas Day', 'cultural'),
    n('2027-12-26', "Isra Mi'raj", 'islam', true),
    n('2027-12-27', "Isra Mi'raj (observed)", 'islam', true),
  ],
  TH: [
    n('2026-12-07', "King Bhumibol's Birthday (in lieu)"),
    n('2026-12-10', 'Constitution Day'),
    n('2026-12-31', "New Year's Eve"),
    n('2027-01-01', "New Year's Day"),
    n('2027-02-21', 'Makha Bucha', 'cultural', true),
    n('2027-02-22', 'Makha Bucha (in lieu)', 'cultural', true),
    n('2027-04-06', 'Chakri Day'),
    n('2027-04-13', 'Songkran', 'cultural'),
    n('2027-04-14', 'Songkran', 'cultural'),
    n('2027-04-15', 'Songkran', 'cultural'),
    n('2027-05-01', 'Labour Day'),
    n('2027-05-03', 'Labour Day (in lieu)'),
    n('2027-05-04', 'Coronation Day'),
    n('2027-05-20', 'Visakha Bucha', 'cultural', true),
    n('2027-06-03', "Queen's Birthday"),
    n('2027-07-19', 'Asahna Bucha', 'cultural', true),
    n('2027-07-28', "King's Birthday"),
    n('2027-08-12', "Queen Mother's Birthday"),
    n('2027-10-13', 'Anniversary of King Bhumibol'),
    n('2027-10-25', 'Chulalongkorn Day'),
    n('2027-12-06', "King Bhumibol's Birthday (in lieu)"),
    n('2027-12-10', 'Constitution Day'),
    n('2027-12-31', "New Year's Eve"),
  ],
};

// Holidays that stay on the same date every year, used after the table ends.
const FIXED: Record<string, [string, string, MyEv['kind']][]> = {
  SG: [['01-01', "New Year's Day", 'national'], ['05-01', 'Labour Day', 'national'], ['08-09', 'National Day', 'national'], ['12-25', 'Christmas Day', 'cultural']],
  ID: [['01-01', "New Year's Day", 'national'], ['05-01', 'Labour Day', 'national'], ['06-01', 'Pancasila Day', 'national'], ['08-17', 'Independence Day', 'national'], ['12-25', 'Christmas Day', 'cultural']],
  BN: [['01-01', "New Year's Day", 'national'], ['02-23', 'National Day', 'national'], ['05-31', 'Royal Brunei Armed Forces Day', 'national'], ['07-15', "Sultan's Birthday", 'national'], ['12-25', 'Christmas Day', 'cultural']],
  TH: [['01-01', "New Year's Day", 'national'], ['04-06', 'Chakri Day', 'national'], ['04-13', 'Songkran', 'cultural'], ['04-14', 'Songkran', 'cultural'], ['04-15', 'Songkran', 'cultural'], ['05-01', 'Labour Day', 'national'], ['05-04', 'Coronation Day', 'national'], ['06-03', "Queen's Birthday", 'national'], ['07-28', "King's Birthday", 'national'], ['08-12', "Queen Mother's Birthday", 'national'], ['10-13', 'Anniversary of King Bhumibol', 'national'], ['10-23', 'Chulalongkorn Day', 'national'], ['12-05', "King Bhumibol's Birthday", 'national'], ['12-10', 'Constitution Day', 'national'], ['12-31', "New Year's Eve", 'national']],
};

export const hasBuiltin = (cc: string) => !!BUILTIN[cc];

/** Built-in holidays for a country in one year: the checked table when it has the year, otherwise the fixed-date ones. */
export function builtinYear(cc: string, y: number): MyEv[] | null {
  const t = BUILTIN[cc]; if (!t) return null;
  if (y <= 2027) return t.filter((e) => e.date.slice(0, 4) === String(y)); // the table covers Dec 2026 to Dec 2027
  return (FIXED[cc] || []).map(([d, nm, k]) => n(y + '-' + d, nm, k));
}
