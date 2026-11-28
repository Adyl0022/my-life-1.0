import { useMemo } from 'react';
import { useCore, Core } from './insights';
import { useHidden } from './hidden';
import { cupsGoal } from './habit';
import { cs, useRegion } from './region';
import { useStored } from './store';
import { buildMonth, ymKey, lastMonthOf, MIn, MSum, DASH_DAYS } from './monthSummary';

const EMPTY = (y: number, m0: number): MSum => ({ ym: ymKey(y, m0), label: '', name: '', partial: false, daysIn: 30, upto: 0, logged: 0, hasData: false, score: null, headline: '', story: '', daily: [], stats: [], sections: [], wins: [], improve: [], advice: [], focus: [] });
const rm = (n: number) => cs() + (Math.round(n * 100) / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "Your month": last month's summary and the month so far, worked out on this phone. Modules the person turned off are left out. */
export function useMonths() { return useMonthsFrom(useCore()); }
/** Same, for a screen that already has the core data (the Dashboard card), so it is not read twice. */
export function useMonthsFrom(c: Core): { last: MSum; cur: MSum; day: number } {
  useRegion();
  const hid = useHidden();
  const today = new Date(); const dk = today.getFullYear() + '-' + today.getMonth() + '-' + today.getDate();
  const off = hid.off.join();
  return useMemo(() => {
    const t = new Date();
    const i: MIn = {
      hd: c.hd, fin: c.fin, pl: c.pl, rec: c.rec, debts: c.debts, puasa: c.puasa, sav: c.sav, cg: cupsGoal(c.hd), goal: c.hd.goal || 8000, rm, today: t,
      on: { habit: hid.on('habit'), finance: hid.on('finance'), planner: hid.on('planner'), islamic: hid.on('islamic'), record: hid.on('record') },
    };
    const [ly, lm] = lastMonthOf(t);
    // The summary is a bonus: if odd saved data ever makes it fail, it stays empty and the rest of the app still opens.
    const safe = (y: number, m0: number): MSum => { try { return buildMonth(i, y, m0); } catch { return EMPTY(y, m0); } };
    return { last: safe(ly, lm), cur: safe(t.getFullYear(), t.getMonth()), day: t.getDate() };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.hd, c.fin, c.pl, c.rec, c.debts, c.puasa, c.sav, off, dk]);
}

/** The Dashboard card shows from the 1st for a week, until the person opens the summary. The choice is kept on this phone only. */
export function useMonthSeen(): [string, (ym: string) => void] {
  const [seen, setSeen] = useStored<string>('ml_month_seen', '');
  return [seen, setSeen];
}
export const showOnDash = (m: { last: MSum; day: number }, seen: string) => m.day <= DASH_DAYS && m.last.hasData && seen !== m.last.ym;
