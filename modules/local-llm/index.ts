import { requireOptionalNativeModule } from 'expo-modules-core';

// A small language model on the phone (MediaPipe). The native part is missing in older builds and on the web, so every call is safe to make.
const M: any = requireOptionalNativeModule('LocalLlm');
export const llmAvailable = !!M;
export function llmRam(): number { try { return M ? (M.ramMb() as number) : 0; } catch (e) { return 0; } }
export function llmReadyNow(): boolean { try { return M ? !!M.ready() : false; } catch (e) { return false; } }
export function llmProgress(): [number, number] { try { return M ? (M.progress() as [number, number]) : [0, 0]; } catch (e) { return [0, 0]; } }
export async function llmDownload(url: string): Promise<boolean> { try { return M ? !!(await M.download(url)) : false; } catch (e) { return false; } }
export function llmCancel() { try { if (M) M.cancel(); } catch (e) { } }
export async function llmRemove(): Promise<boolean> { try { return M ? !!(await M.remove()) : false; } catch (e) { return false; } }
export async function llmUnload() { try { if (M) await M.unload(); } catch (e) { } }
export async function llmGenerate(prompt: string): Promise<string> { try { return M ? (((await M.generate(prompt)) as string) || '') : ''; } catch (e) { return ''; } }

export function llmLive(): string { try { return M ? ((M.live() as string) || '') : ''; } catch (e) { return ''; } }
export async function llmWarm(): Promise<boolean> { try { return M ? !!(await M.warm()) : false; } catch (e) { return false; } }
