import { useStored } from './store';

// Modules the person turned off in Settings. Their data stays saved; the module just disappears from the app
// (Dashboard, Search, Stats, Insights, Assistant and its reminders).
export type Mod = 'planner' | 'islamic' | 'finance' | 'record' | 'habit';
export const ALL_MODS: { k: Mod; name: string; sub: string; ic: string; c: string }[] = [
  { k: 'planner', name: 'Daily Planner', sub: 'Events, tasks and notes', ic: 'calendar', c: 'rgba(124,156,255,.4)' },
  { k: 'islamic', name: 'Islamic Hub', sub: 'Prayer times, Quran, Zikir', ic: 'mosque', c: 'rgba(52,211,153,.4)' },
  { k: 'finance', name: 'My Finance', sub: 'Income, spending, savings', ic: 'coin', c: 'rgba(255,196,107,.4)' },
  { k: 'record', name: 'My Record', sub: 'Vehicle logs and records', ic: 'record', c: 'rgba(255,143,171,.4)' },
  { k: 'habit', name: 'Habit & Health', sub: 'Mood, sleep, water, goals', ic: 'habit', c: 'rgba(183,148,255,.4)' },
];

let active: string[] = [];
const clean = (l: any): string[] => (Array.isArray(l) ? l.filter((x) => ALL_MODS.some((m) => m.k === x)) : []);
/** True when the module is switched on. Plain code (reminders, the assistant) reads it from here. */
export const modOn = (k: Mod) => active.indexOf(k) < 0;
/** Search uses names like "Planner", "Islamic". */
export const modOnName = (n: string) => { const k = n.toLowerCase(); return ALL_MODS.some((m) => m.k === k) ? modOn(k as Mod) : true; };

/** Reads the saved choice and keeps the screen up to date. Returns the off list, a helper and a switch function. */
export function useHidden(): { off: string[]; on: (k: Mod) => boolean; toggle: (k: Mod) => boolean; ready: boolean } {
  const [h, setH, ok] = useStored<string[]>('ml_hidden', []);
  const off = clean(h); active = off;
  const on = (k: Mod) => off.indexOf(k) < 0;
  // Turns a module off or on. At least one module has to stay on, so the Dashboard is never empty.
  const toggle = (k: Mod) => {
    if (on(k)) { if (off.length >= ALL_MODS.length - 1) return false; setH([...off, k]); }
    else setH(off.filter((x) => x !== k));
    return true;
  };
  return { off, on, toggle, ready: ok };
}

// Order of the four small Dashboard cards, and whether the wide Habit & Health banner sits above or below them.
export type ModOrder = { order: Mod[]; habitTop: boolean };
export const ORDER_DEFAULT: ModOrder = { order: ['planner', 'islamic', 'finance', 'record'], habitTop: false };
const cleanOrder = (o: any): ModOrder => {
  const base = ORDER_DEFAULT.order; const got: Mod[] = Array.isArray(o && o.order) ? o.order.filter((x: any) => base.indexOf(x) >= 0) : [];
  const seen = got.filter((x, i) => got.indexOf(x) === i);
  return { order: [...seen, ...base.filter((x) => seen.indexOf(x) < 0)], habitTop: !!(o && o.habitTop) };
};
/** The saved Dashboard order. move() shifts a small card up or down one place; setHabitTop() puts the banner above or below. */
export function useModOrder(): { order: Mod[]; habitTop: boolean; move: (k: Mod, dir: -1 | 1) => void; setHabitTop: (top: boolean) => void } {
  const [o, setO] = useStored<ModOrder>('ml_morder', ORDER_DEFAULT);
  const v = cleanOrder(o);
  const move = (k: Mod, dir: -1 | 1) => {
    const i = v.order.indexOf(k); const j = i + dir; if (i < 0 || j < 0 || j >= v.order.length) return;
    const n = v.order.slice(); [n[i], n[j]] = [n[j], n[i]]; setO({ ...v, order: n });
  };
  return { order: v.order, habitTop: v.habitTop, move, setHabitTop: (top: boolean) => setO({ ...v, habitTop: top }) };
}
