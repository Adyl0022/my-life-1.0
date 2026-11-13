export type HDay = { mood: number; cups: number; sleep: number; steps: number; note?: string; fast?: boolean; bed?: string; wake?: string; hc?: number; adj?: number };
export type HData = { goal: number; days: Record<string, HDay>; kg?: { d: string; v: number }[]; cm?: number; goalKg?: number; age?: number; sex?: 'm' | 'f'; auto?: boolean };
export const HEMPTY: HData = { goal: 8000, days: {}, kg: [] };
export const BLANK: HDay = { mood: -1, cups: 0, sleep: 0, steps: 0 };
export const GLASS = 250;
export const MOODS: [string, string][] = [['Awful', '#ff8fab'], ['Low', '#ffc46b'], ['Okay', '#8fe9e2'], ['Good', '#7df0c6'], ['Great', '#7c9cff']];
export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const dateOf = (off: number) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + off); return d; };
export const keyOfDate = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const getDay = (h: HData, off: number): HDay => ({ ...BLANK, ...(h.days[keyOfDate(dateOf(off))] || {}) });
export const latestKg = (h: HData) => { const l = (h.kg || []).slice().sort((a, b) => (a.d < b.d ? -1 : 1)); return l.length ? l[l.length - 1].v : 0; };
// Water goal from body weight: about 33 ml per kg a day, in 250 ml glasses (4 to 16). 8 glasses until a weight is logged.
export const cupsGoal = (h: HData) => { const k = latestKg(h); return k > 0 ? Math.max(4, Math.min(16, Math.round((k * 33) / GLASS))) : 8; };
export const goalPctOf = (x: HDay, goal: number, cg = 8) => Math.round(((Math.min(x.cups / cg, 1)) + Math.min(x.sleep / 7, 1) + Math.min(x.steps / goal, 1)) / 3 * 100);
export const actOf = (x: HDay, goal: number) => Math.round(Math.min(x.steps / goal, 1) * 5);
export const scoreOf = (x: HDay, goal: number, cg = 8) => Math.round(((Math.min(x.cups / cg, 1)) + (actOf(x, goal) / 5) + Math.min(x.sleep / 7, 1)) / 3 * 4);
// Keeps only digits (max 4) and puts the colon in for the person: 0830 -> 08:30.
export const fmtTime = (s: string) => { const d = s.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + ':' + d.slice(2) : d; };
export const hoursBetween = (bed: string, wake: string) => {
  const re = /^([01]?\d|2[0-3]):([0-5]\d)$/; const a = re.exec(bed), b = re.exec(wake); if (!a || !b) return 0;
  let m = (+b[1] * 60 + +b[2]) - (+a[1] * 60 + +a[2]); if (m <= 0) m += 1440; return Math.round(m / 6) / 10;
};
export const bestStreakAll = (h: HData) => { const cg = cupsGoal(h); let best = 0, run = 0; for (let o = -400; o <= 0; o++) { if (goalPctOf(getDay(h, o), h.goal || 8000, cg) >= 70) { run++; best = Math.max(best, run); } else run = 0; } return best; };
export const avgOf = (h: HData, from: number, to: number, f: (x: HDay) => number) => { const l = []; for (let o = from; o <= to; o++) { const x = getDay(h, o); if (x.cups > 0 || x.sleep > 0 || x.steps > 0) l.push(f(x)); } return l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0; };
