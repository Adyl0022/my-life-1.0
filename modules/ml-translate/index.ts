import { requireOptionalNativeModule } from 'expo-modules-core';

// On-phone translation (Google ML Kit). The native part is missing in older builds and on the web, so every call is safe to make.
const M: any = requireOptionalNativeModule('MlTranslate');
export const mlAvailable = !!M;
export async function mlDownloaded(): Promise<string[]> { try { return M ? ((await M.downloaded()) as string[]) : []; } catch (e) { return []; } }
export async function mlDownload(lang: string): Promise<boolean> { try { return M ? !!(await M.download(lang)) : false; } catch (e) { return false; } }
export async function mlRemove(lang: string): Promise<boolean> { try { return M ? !!(await M.remove(lang)) : false; } catch (e) { return false; } }
export async function mlTranslate(text: string, from: string, to: string): Promise<string> { if (!M) throw new Error('no module'); return (await M.translate(text, from, to)) as string; }
