// The one-time unlock. The real Google Play purchase is connected later, once the app exists in Play Console.
export const PRICE = 'RM12';
export type BuyResult = { ok: boolean; msg: string };
export async function buyPro(): Promise<BuyResult> {
  return { ok: false, msg: 'Purchases will open when the app is available on Google Play.' };
}
export async function restorePurchases(): Promise<BuyResult> {
  return { ok: false, msg: 'Restoring purchases will open when the app is available on Google Play.' };
}
