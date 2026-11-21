// Reads a spending out of a free sentence, with the AI on the phone. Nothing leaves the phone.
// The written rules in the Assistant go first. This only runs when they did not understand the sentence.
import { smartRaw } from './llm';
import { getItem } from './store';
import { cu, curCode } from './region';

export const SPEND_CATS = ['Food', 'Petrol', 'Bills', 'Shopping', 'Savings', 'Health', 'Other'];

export type AiSpend = { amt: number; cat: string; name: string; ydy: boolean; acc: number | null; accName: string };

// Cheap check first, so the AI is only woken for sentences that look like money was spent.
export function looksLikeSpend(q: string): boolean {
  if (q.length > 160 || !/\d/.test(q)) return false;
  if (/\b(berapa|how much|how many|apa|what|bila|when|siapa|who|kenapa|why)\b|\?/i.test(q)) return false;
  if (/\b(km|kg|jam|hours?|hrs?|langkah|steps?|minit|minutes?|bpm|mmhg)\b/i.test(q)) return false;
  return /\b(rm|ringgit|myr|usd|sgd|bayar|bayaran|paid|pay|beli|bought|buy|belanja|spent|spend|habis|makan|minum|lunch|dinner|breakfast|sarapan|petrol|topup|top up|grab|bil|bill|tol|parking|kopi|coffee)\b/i.test(q) || new RegExp('(' + cu().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '|\\b' + curCode() + '\\b)', 'i').test(q);
}

// One list of the accounts the person has (name and id), so "guna Maybank" can be matched to a real account.
async function accountList(): Promise<{ id: number; name: string }[]> {
  try { const d: any = await getItem('ml_accounts', { accs: [] }); return ((d && d.accs) || []).map((a: any) => ({ id: a.id, name: String(a.name || '') })).filter((a: any) => a.name); } catch (e) { return []; }
}

export async function aiSpend(q: string): Promise<AiSpend | null> {
  const accs = await accountList();
  const sys = 'You read one sentence about money the person spent and answer with ONE line of JSON only, nothing else. '
    + 'The sentence may be in Bahasa Malaysia, English or a mix. '
    + 'Keys: "amt" (number, the amount spent, no currency), "cat" (one of ' + SPEND_CATS.join(', ') + '), "name" (what it was for, 1 to 4 words, in the words of the sentence), '
    + '"day" ("today" or "yesterday"), "acc" (the account or wallet used, copied exactly from this list, or "" if none was said: ' + (accs.length ? accs.map((a) => a.name).join(', ') : 'no accounts') + '). '
    + 'If the sentence is not about money spent, answer {"amt":0}. Never guess an amount that is not in the sentence.';
  const raw = await smartRaw(q, sys);
  const m = raw.match(/\{[\s\S]*?\}/); if (!m) return null;
  let j: any; try { j = JSON.parse(m[0]); } catch (e) { return null; }
  const amt = typeof j.amt === 'number' ? j.amt : parseFloat(String(j.amt || '').replace(/,/g, ''));
  if (!(amt > 0) || amt >= 100000 || !isFinite(amt)) return null;
  // The amount must really be written in the sentence. A small model can make numbers up.
  const nums = (q.match(/\d[\d,]*(?:\.\d+)?/g) || []).map((x) => parseFloat(x.replace(/,/g, '')));
  if (!nums.some((n) => Math.abs(n - amt) < 0.005)) return null;
  const cat = SPEND_CATS.find((c) => c.toLowerCase() === String(j.cat || '').toLowerCase()) || 'Other';
  let name = String(j.name || '').replace(/[^\p{L}\p{N} '&./-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
  if (!name) name = cat === 'Other' ? 'Spending' : cat;
  name = name.charAt(0).toUpperCase() + name.slice(1);
  const want = String(j.acc || '').trim().toLowerCase();
  const hit = want ? accs.find((a) => a.name.toLowerCase() === want) || accs.find((a) => want.indexOf(a.name.toLowerCase()) >= 0 || a.name.toLowerCase().indexOf(want) >= 0) : null;
  return { amt: Math.round(amt * 100) / 100, cat, name, ydy: /yesterday|semalam/i.test(String(j.day || '')) || /\b(semalam|yesterday)\b/i.test(q), acc: hit ? hit.id : null, accName: hit ? hit.name : '' };
}
