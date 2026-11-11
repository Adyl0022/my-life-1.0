import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { FREEMIUM } from './edition';
import { useSession } from './auth';

// The yearly subscription that opens every feature. It renews each year until the person cancels in Google Play.
// Google Play handles the payment. RevenueCat only keeps track of who has an active subscription.
export const PRICE = 'RM15';
export const PER = 'a year';
export type BuyResult = { ok: boolean; msg: string };

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY || '';
const ENTITLEMENT = 'pro';
// Billing only runs in the Play edition on Android and only when the RevenueCat key was set at build time.
export const BILLING_READY = FREEMIUM && Platform.OS === 'android' && !!API_KEY;

let mod: any = null;
let configured = false;
let boundTo = '';
let active = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function sdk(): any {
  if (!mod) { try { mod = require('react-native-purchases').default; } catch { mod = null; } }
  return mod;
}
const hasPro = (info: any) => !!info?.entitlements?.active?.[ENTITLEMENT];
function setActive(v: boolean) { if (active !== v) { active = v; emit(); } }

// Ties the purchase to the signed-in account, so the subscription follows the person to a new phone.
async function bind(uid: string) {
  if (!BILLING_READY) return;
  if (!uid && !configured) return;
  const m = sdk(); if (!m) return;
  try {
    if (!configured) {
      m.configure({ apiKey: API_KEY, appUserID: uid || null });
      m.addCustomerInfoUpdateListener((info: any) => setActive(hasPro(info)));
      configured = true; boundTo = uid;
    } else if (uid && uid !== boundTo) {
      boundTo = uid; await m.logIn(uid);
    } else if (!uid && boundTo) {
      boundTo = ''; await m.logOut(); setActive(false); return;
    }
    if (uid) setActive(hasPro(await m.getCustomerInfo()));
  } catch { /* offline: keep the last answer */ }
}

// True when this account has an active subscription. False when billing is off (GitHub edition or no key).
export function useSubscribed(): boolean {
  const [sess] = useSession(); const [, n] = useState(0);
  useEffect(() => { const f = () => n((x) => x + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  const id = sess?.user?.id || '';
  useEffect(() => { bind(id); }, [id]);
  return BILLING_READY && active;
}

export async function buyPro(): Promise<BuyResult> {
  if (!BILLING_READY) return { ok: false, msg: 'Purchases will open when the app is available on Google Play.' };
  const m = sdk(); if (!m) return { ok: false, msg: 'Purchases are not available on this phone.' };
  try {
    const offerings = await m.getOfferings();
    const cur = offerings?.current;
    const pkg = cur?.annual || cur?.availablePackages?.[0];
    if (!pkg) return { ok: false, msg: 'The subscription is not available yet. Please try again later.' };
    const res = await m.purchasePackage(pkg);
    if (hasPro(res?.customerInfo)) { setActive(true); return { ok: true, msg: 'Thank you! Everything is unlocked.' }; }
    return { ok: false, msg: 'The purchase did not finish. You have not been charged.' };
  } catch (e: any) {
    if (e?.userCancelled) return { ok: false, msg: '' };
    return { ok: false, msg: /network|internet|offline/i.test(String(e?.message)) ? 'No internet connection. Please try again.' : 'Could not complete the purchase. Please try again.' };
  }
}

export async function restorePurchases(): Promise<BuyResult> {
  if (!BILLING_READY) return { ok: false, msg: 'Restoring purchases will open when the app is available on Google Play.' };
  const m = sdk(); if (!m) return { ok: false, msg: 'Purchases are not available on this phone.' };
  try {
    const info = await m.restorePurchases();
    if (hasPro(info)) { setActive(true); return { ok: true, msg: 'Your subscription is back. Everything is unlocked.' }; }
    return { ok: false, msg: 'No active subscription was found for this account.' };
  } catch (e: any) {
    return { ok: false, msg: /network|internet|offline/i.test(String(e?.message)) ? 'No internet connection. Please try again.' : 'Could not restore. Please try again.' };
  }
}
