import { requireOptionalNativeModule } from 'expo-modules-core';

// Total steps the phone has counted since it was switched on, or -1 when it cannot be read (no sensor, no permission, not Android).
const M: any = requireOptionalNativeModule('StepCounter');
export async function stepTotal(): Promise<number> {
  try { if (!M) return -1; const n = await M.getTotal(); return typeof n === 'number' ? n : -1; } catch (e) { return -1; }
}
