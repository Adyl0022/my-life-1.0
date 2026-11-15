import { useStored } from './store';
import { HData, getDay, dateOf, keyOfDate } from './habit';
import { PUASA_EMPTY, PuasaData } from './fasting';
import { reconcileHaid } from './cycle';
import { modOn } from './hidden';

// Saves a change to the cycle marks and keeps the Fasting record in step (period days in Ramadan become excused days).
export function useCycleSave(h: HData, setH: (v: HData) => void) {
  const [pz, setPz, okp] = useStored<PuasaData>('ml_puasa', PUASA_EMPTY);
  const save = (next: HData) => {
    // Only people who use the Islamic module get period days linked to fasting and qadha.
    if (!okp || !modOn('islamic')) { setH(next); return; }
    const r = reconcileHaid(pz, next);
    setH({ ...next, px: r.px });
    if (JSON.stringify(r.p.days) !== JSON.stringify(pz.days)) setPz(r.p);
  };
  // Marks or clears one day (offset 0 = today).
  const setPeriod = (off: number, on: boolean) => {
    if (off > 0) return;
    const k = keyOfDate(dateOf(off)); const x = getDay(h, off);
    const nx = { ...x, pd: on || undefined, ...(on ? {} : { fl: undefined }) } as any;
    if (!on) delete nx.pd; if (nx.fl === undefined) delete nx.fl;
    save({ ...h, days: { ...h.days, [k]: nx } });
  };
  const patch = (off: number, p: Record<string, any>) => { const k = keyOfDate(dateOf(off)); save({ ...h, days: { ...h.days, [k]: { ...getDay(h, off), ...p } } }); };
  return { setPeriod, patch };
}
