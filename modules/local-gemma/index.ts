import { requireOptionalNativeModule } from 'expo-modules-core';

// Gemma 4 on the phone (LiteRT-LM). The native part is missing in older builds and on the web, so every call is safe to make.
const M: any = requireOptionalNativeModule('LocalGemma');
export const gemAvailable = !!M;
export function gemReadyNow(): boolean { try { return M ? !!M.ready() : false; } catch (e) { return false; } }
export function gemPartial(): number { try { return M ? (M.partial() as number) : 0; } catch (e) { return 0; } }
export function gemProgress(): [number, number] { try { return M ? (M.progress() as [number, number]) : [0, 0]; } catch (e) { return [0, 0]; } }
export async function gemDownload(url: string): Promise<boolean> { try { return M ? !!(await M.download(url)) : false; } catch (e) { return false; } }
export function gemCancel() { try { if (M) M.cancel(); } catch (e) { } }
export async function gemRemove(): Promise<boolean> { try { return M ? !!(await M.remove()) : false; } catch (e) { return false; } }
export async function gemUnload() { try { if (M) await M.unload(); } catch (e) { } }
export async function gemGenerate(prompt: string): Promise<string> { try { return M ? (((await M.generate(prompt)) as string) || '') : ''; } catch (e) { return ''; } }

export function gemLive(): string { try { return M ? ((M.live() as string) || '') : ''; } catch (e) { return ''; } }
export async function gemWarm(): Promise<boolean> { try { return M ? !!(await M.warm()) : false; } catch (e) { return false; } }
