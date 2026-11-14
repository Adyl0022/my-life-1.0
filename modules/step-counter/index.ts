import { requireOptionalNativeModule } from 'expo-modules-core';

// Total steps the phone has counted since it was switched on, or a negative code when it cannot be read:
// -1 no step sensor, -2 sensor could not start (permission), -3 no reading in time, -4 error, -5 native module missing.
const M: any = requireOptionalNativeModule('StepCounter');
export async function stepTotal(): Promise<number> {
  try { if (!M) return -5; const n = await M.getTotal(); return typeof n === 'number' ? n : -4; } catch (e) { return -4; }
}
export const stepWhy = (c: number) => c === -1 ? 'this phone has no step sensor' : c === -2 ? 'the sensor could not start (allow Physical activity permission)' : c === -3 ? 'the sensor gave no reading' : c === -5 ? 'step sensor is not in this build' : 'sensor error';
