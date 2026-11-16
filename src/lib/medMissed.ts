import { HData, Med, dateOf, getDay, medDue } from './habit';

// A dose is "overdue" for the first hour after its time, then "missed" if it was not ticked. Only doses after the medicine was added count,
// and ticking a dose late still counts as taken. A personal record, not medical advice.
export const GRACE_MIN = 60;
export type Dose = { off: number; date: Date; med: Med; status: 'overdue' | 'missed' };

export function missedDoses(h: HData, now: Date, days = 7): Dose[] {
  const out: Dose[] = [];
  for (const m of h.meds || []) {
    const t = /^(\d{1,2}):(\d{2})$/.exec(m.time || ''); if (!t) continue;
    const created = Number(m.since || m.id) || 0; // since: set when the time or days were edited, so the old schedule is not judged by the new one
    for (let o = -(days - 1); o <= 0; o++) {
      const d = dateOf(o);
      if (!medDue(m, d)) continue;
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), +t[1], +t[2], 0, 0).getTime();
      if (at < created || at > now.getTime()) continue;
      if ((getDay(h, o).med || []).includes(m.id)) continue;
      out.push({ off: o, date: d, med: m, status: now.getTime() - at > GRACE_MIN * 60000 ? 'missed' : 'overdue' });
    }
  }
  return out.sort((a, b) => a.off - b.off || (a.med.time < b.med.time ? -1 : 1));
}
