import { useMemo } from 'react';
import { useStored } from './store';

// Vehicle maintenance noted in My Record can be counted as spending in My Finance. One switch (saved on the phone)
// decides it everywhere: Money Left, totals, charts, Insights, Stats, the Assistant, budget alerts and the Excel export.
export type VMode = 'ask' | 'yes' | 'no';
export const VEH_KEY = 'ml_today_veh';
export const VEH_CAT = 'Vehicle';
export const VEH_COLOR = '#ff9f6b';

type Rec = { data?: Record<string, { exps?: { name?: string; amt: number; date: string }[] }> } | null | undefined;

// My Record services as spending rows. They get negative ids so they never clash with real entries, and src 'record'
// so My Finance shows them as read-only (they are changed in My Record).
export function vehicleSpends(rec: Rec): any[] {
  const out: any[] = []; const data = (rec && rec.data) || {}; const names = Object.keys(data); let n = 0;
  names.forEach((v) => ((data[v] && data[v].exps) || []).forEach((e) => {
    if (!e || !(e.amt > 0) || !e.date) return;
    n++; out.push({ id: -(1000 + n), name: e.name || 'Service', cat: VEH_CAT, amt: e.amt, date: e.date, note: 'From My Record' + (names.length > 1 ? ' · ' + v : ''), src: 'record' });
  }));
  return out;
}
export const mergeVeh = (spends: any[] | undefined, rec: Rec, mode: VMode | undefined): any[] => (mode === 'yes' ? [...(spends || []), ...vehicleSpends(rec)] : (spends || []));

export function useVehMode(): [VMode, (m: VMode) => void] {
  const [mode, setMode] = useStored<VMode>(VEH_KEY, 'ask');
  return [mode, setMode];
}
export function useMergedSpends(spends: any[] | undefined): any[] {
  const [mode] = useStored<VMode>(VEH_KEY, 'ask');
  const [rec] = useStored<Rec>('ml_record', { data: {} } as any);
  return useMemo(() => mergeVeh(spends, rec, mode), [spends, rec, mode]);
}
