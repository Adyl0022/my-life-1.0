import { validDate, ymd } from './documents';

export type ItemCat = 'gadget' | 'lifestyle' | 'property';
export type Item = { id: number; cat: ItemCat; kind: string; name: string; price: string; bought: string; warranty: string; photo: string; note: string };
export type Loan = { id: number; dir: 'lent' | 'borrowed'; what: 'money' | 'thing'; who: string; title: string; amount: string; date: string; due: string; done: boolean; doneAt: string; note: string };
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
export const rm = (n: number) => 'RM ' + n.toLocaleString('en-MY', { maximumFractionDigits: 2 });
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
