import { requireOptionalNativeModule } from 'expo-modules-core';

// Total steps the phone has counted since it was switched on, or a negative code when it cannot be read:
// -1 no step sensor, -2 sensor could not start (permission), -3 no reading in time, -4 error, -5 native module missing.
const M: any = requireOptionalNativeModule('StepCounter');
export async function stepTotal(): Promise<number> {
  try { if (!M) return -5; const n = await M.getTotal(); return typeof n === 'number' ? n : -4; } catch (e) { return -4; }
}
export const stepWhy = (c: number) => c === -1 ? 'this phone has no step sensor' : c === -2 ? 'the sensor could not start (allow Physical activity permission)' : c === -3 ? 'the sensor gave no reading' : c === -5 ? 'step sensor is not in this build' : 'sensor error';

// Quick Settings tile for the sleep timer.
export function setSleepTile(start: number) { try { if (M && M.setSleepTile) M.setSleepTile(start); } catch (e) {} }
// 2 added, 1 already there, 0 not added, -1 not available on this phone.
export async function addSleepTile(): Promise<number> { try { if (!M || !M.addSleepTile) return -1; const r = await M.addSleepTile(); return typeof r === 'number' ? r : -1; } catch (e) { return -1; } }

// The sleep timer run by Android itself, so the tile and the notification button work without opening the app.
export const sleepNativeOk = (): boolean => !!(M && M.sleepStart && M.sleepEnd && M.sleepState);
export function sleepNativeStart() { try { if (sleepNativeOk()) M.sleepStart(); } catch (e) {} }
export function sleepNativeEnd() { try { if (sleepNativeOk()) M.sleepEnd(); } catch (e) {} }
export function sleepNativeClear() { try { if (M && M.sleepClearPending) M.sleepClearPending(); } catch (e) {} }
// start = when the current sleep began (0 = not sleeping); pending = finished sleeps not yet saved in the app.
export function sleepNativeState(): { start: number; pending: { s: number; e: number }[] } | null {
  try {
    if (!sleepNativeOk()) return null;
    const t = String(M.sleepState()); const i = t.indexOf(';'); const a = i < 0 ? t : t.slice(0, i); const b = i < 0 ? '' : t.slice(i + 1);
    const pending = b.split(',').filter(Boolean).map((x) => { const [s, e] = x.split(':'); return { s: Number(s), e: Number(e) }; }).filter((x) => x.s > 0 && x.e > x.s);
    return { start: Number(a) || 0, pending };
  } catch (e) { return null; }
}
