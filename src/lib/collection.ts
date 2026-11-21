import { validDate, ymd } from './documents';
import { cs } from './region';

export type Cond = 'new' | 'good' | 'worn' | 'broken';
export const CONDS: { k: Cond; n: string; f: number }[] = [{ k: 'new', n: 'Like new', f: 1.08 }, { k: 'good', n: 'Good', f: 1 }, { k: 'worn', n: 'Worn', f: 0.8 }, { k: 'broken', n: 'Broken', f: 0.4 }];
export type ItemCat = 'gadget' | 'lifestyle' | 'property';
export type Item = { id: number; cat: ItemCat; kind: string; name: string; price: string; bought: string; warranty: string; photo: string; photos?: string[]; docIds?: number[]; worth?: string; cond?: Cond; note: string };
export type Loan = { id: number; dir: 'lent' | 'borrowed'; what: 'money' | 'thing'; who: string; title: string; amount: string; date: string; due: string; done: boolean; doneAt: string; note: string; remind?: 'off' | 'day' | '3d'; pays?: { d: string; a: number }[] };
export type Lesson = { id: number; title: string; text: string; date: string; tag: string };
export type ColStore = { items: Item[]; loans: Loan[]; lessons: Lesson[]; next: number };
export const EMPTY_COL: ColStore = { items: [], loans: [], lessons: [], next: 1 };

export const GRAD: Record<string, [string, string]> = {
  gadget: ['#3df0ff', '#3d7bff'], lifestyle: ['#ff6ad5', '#ffa23d'], property: ['#c6ff5a', '#1fe0a5'], loans: ['#ffe84d', '#ff9a3d'], lessons: ['#b07bff', '#4de1ff'],
};
export const INK = '#0b1030';
export const ACC: Record<string, string> = { gadget: '#7c9cff', lifestyle: '#ff8fab', property: '#8fe9e2', loans: '#ffe3c2', lessons: '#b794ff' };
export const BTN: [string, string] = ['#8ea8ff', '#b794ff'];
export type KindIcon = 'gadget' | 'life' | 'prop' | 'laptop' | 'watch' | 'audio';
export const kindIcon = (cat: ItemCat, kind: string): KindIcon => (cat === 'lifestyle' ? 'life' : cat === 'property' ? 'prop' : kind === 'Laptop' ? 'laptop' : kind === 'Watch' ? 'watch' : kind === 'Audio' ? 'audio' : 'gadget');

export const CATS: Record<ItemCat, { title: string; one: string; e: string; sub: string; text: string; kinds: [string, string][]; warranty: boolean }> = {
  gadget: { title: 'Gadgets', one: 'gadget', e: 'phone', sub: 'Phone, laptop, watch', text: 'Your devices, with their price and warranty', warranty: true, kinds: [['Phone', 'phone'], ['Laptop', 'laptop'], ['Watch', 'watch'], ['Audio', 'audio'], ['Camera', 'camera'], ['Other', 'plug']] },
  lifestyle: { title: 'Lifestyle', one: 'item', e: 'shoes', sub: 'Shoes, bags, perfume', text: 'The nice things you own and what they cost', warranty: false, kinds: [['Shoes', 'shoes'], ['Bag', 'bag'], ['Clothes', 'shirt'], ['Perfume', 'perfume'], ['Jewellery', 'ring'], ['Other', 'gift']] },
  property: { title: 'Property', one: 'property', e: 'house', sub: 'House, land, rent', text: 'Houses, land and anything you rent', warranty: false, kinds: [['House', 'house'], ['Land', 'land'], ['Rent', 'rent'], ['Shop', 'shop'], ['Other', 'building']] },
};
export const kindEmoji = (cat: ItemCat, kind: string) => (CATS[cat].kinds.find((k) => k[0] === kind) || CATS[cat].kinds[CATS[cat].kinds.length - 1])[1];

export const TAGS = ['Work', 'Money', 'People', 'Self', 'Other'];

export const num = (s: string) => { const v = parseFloat(String(s || '').replace(',', '.')); return isFinite(v) ? v : 0; };
export const rm = (n: number) => cs() + n.toLocaleString('en-MY', { maximumFractionDigits: 2 });
export const dmy = (s: string) => (validDate(s) ? s.split('-').reverse().join('/') : '');
export const today = () => ymd(new Date());

/** Due text for a loan that is still open. */
export function dueOf(l: Loan, now = new Date()): { txt: string; col: string; hot: boolean } {
  if (l.done) return { txt: 'Returned ' + dmy(l.doneAt), col: '#5ee7b5', hot: false };
  if (!l.due || !validDate(l.due)) return { txt: 'No due date', col: 'rgba(255,255,255,.7)', hot: false };
  const day = (s: string) => { const p = s.split('-'); return Math.round(new Date(+p[0], +p[1] - 1, +p[2], 12).getTime() / 86400000); };
  const n = day(l.due) - day(ymd(now));
  if (n < 0) { const m = Math.round(-n / 30.4); return { txt: 'Overdue by ' + (-n < 60 ? -n + (n === -1 ? ' day' : ' days') : m + ' months'), col: '#ff9aa9', hot: true }; }
  if (n === 0) return { txt: 'Due today', col: '#ff9aa9', hot: true };
  return { txt: 'Due in ' + n + (n === 1 ? ' day' : ' days'), col: n <= 14 ? '#ffd593' : '#5ee7b5', hot: false };
}

/** All the photos of an item, oldest field first. */
export const photosOf = (x: Item): string[] => (x.photos && x.photos.length ? x.photos : x.photo ? [x.photo] : []);

const dayN = (s: string) => { const p = s.split('-'); return Math.round(new Date(+p[0], +p[1] - 1, +p[2], 12).getTime() / 86400000); };

/** What a gadget is worth today. The person's own number wins. Otherwise a guess: a big drop in the first year, a slower drop after, kinder for brands that keep their price, and adjusted for the condition. Only a guess, not a market price. */
const DROP1: Record<string, number> = { Phone: 0.25, Laptop: 0.2, Tablet: 0.2, Audio: 0.2, Watch: 0.08 };
const DROPN: Record<string, number> = { Phone: 0.15, Laptop: 0.15, Tablet: 0.15, Audio: 0.15, Watch: 0.06 };
const KEEPERS = /iphone|ipad|macbook|apple|airpods|rolex|seiko|casio|g-shock|garmin/i;
export const worthMine = (x: Item): number => (x.cat === 'gadget' ? num(x.worth || '') : 0);
export function worthNow(x: Item, now = new Date()): number | null {
  if (x.cat !== 'gadget') return null;
  const mine = worthMine(x); if (mine > 0) return Math.round(mine);
  const price = num(x.price); if (!(price > 0) || !x.bought || !validDate(x.bought)) return null;
  const yrs = Math.max(0, (dayN(ymd(now)) - dayN(x.bought)) / 365);
  const k = KEEPERS.test(x.name) ? 0.75 : 1;
  const d1 = (DROP1[x.kind] != null ? DROP1[x.kind] : 0.15) * k, dn = (DROPN[x.kind] != null ? DROPN[x.kind] : 0.12) * k;
  const base = yrs <= 1 ? 1 - d1 * yrs : (1 - d1) * Math.pow(1 - dn, yrs - 1);
  const cf = (CONDS.find((c) => c.k === (x.cond || 'good')) || CONDS[1]).f;
  return Math.round(Math.min(price, price * Math.max(0.12, base) * cf));
}

/** Warranty progress: days left, and how much of the time is already used (0 to 1). */
export function warrantyBar(x: Item, now = new Date()): { left: number; used: number } | null {
  if (!x.warranty || !validDate(x.warranty)) return null;
  const left = dayN(x.warranty) - dayN(ymd(now));
  const start = x.bought && validDate(x.bought) ? dayN(x.bought) : dayN(x.warranty) - 365;
  const total = Math.max(1, dayN(x.warranty) - start);
  return { left, used: Math.min(1, Math.max(0, 1 - left / total)) };
}

/** A polite message the person sends themselves. */
export function politeAsk(l: Loan): string {
  const what = l.what === 'money' ? cs() + leftOf(l).toLocaleString('en-MY', { maximumFractionDigits: 2 }) : l.title;
  const due = l.due && validDate(l.due) ? ' (we agreed on ' + dmy(l.due) + ')' : '';
  return 'Hi ' + l.who + ', hope you are well. Just a gentle reminder about the ' + what + ' I lent you' + due + '. No rush if you need a little more time, just let me know. Thank you!';
}

/** Money already paid back, and what is still owed. */
export const paidOf = (l: Loan): number => (l.what === 'money' ? (l.pays || []).reduce((t, p) => t + (p.a > 0 ? p.a : 0), 0) : 0);
export const leftOf = (l: Loan): number => (l.what === 'money' ? Math.max(0, num(l.amount) - paidOf(l)) : 0);
