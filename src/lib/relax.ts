import { HData, HDay, getDay, dateOf, keyOfDate, RSess } from './habit';

export type Pat = { k: string; name: string; desc: string; ic: string; steps: [string, number][] };
export const BREATH: Pat[] = [
  { k: 'box', name: 'Box breathing', desc: 'In 4 · Hold 4 · Out 4 · Hold 4', ic: 'rbox', steps: [['Breathe in', 4], ['Hold', 4], ['Breathe out', 4], ['Hold', 4]] },
  { k: 'calm', name: 'Calm 4-7-8', desc: 'In 4 · Hold 7 · Out 8 · for winding down', ic: 'rcalm', steps: [['Breathe in', 4], ['Hold', 7], ['Breathe out', 8]] },
  { k: 'belly', name: 'Deep belly', desc: 'In 5 · Out 5 · slow and steady', ic: 'rwave', steps: [['Breathe in', 5], ['Breathe out', 5]] },
  { k: 'bal', name: 'Balance', desc: 'In 5.5 · Out 5.5 · even rhythm', ic: 'rinf', steps: [['Breathe in', 5.5], ['Breathe out', 5.5]] },
  { k: 'quick', name: 'Quick reset', desc: 'In 3 · Out 6 · for a stressful moment', ic: 'rdrop', steps: [['Breathe in', 3], ['Breathe out', 6]] },
];
export type Sty = { k: string; name: string; desc: string; ic: string; tips: string[] };
export const STYLES: Sty[] = [
  { k: 'sit', name: 'Silent sit', desc: 'Just sit. A soft bell at the end', ic: 'rsit', tips: ['Sit comfortably and let your shoulders drop.', 'Just be here. There is nothing to do.', 'If your mind wanders, that is fine. Come back gently.'] },
  { k: 'focus', name: 'Breath focus', desc: 'Count your breaths, gentle prompts', ic: 'reye', tips: ['Notice the air moving in and out.', 'Count each breath out, from one to ten, then start again.', 'Lost count? No problem. Start again at one.'] },
  { k: 'scan', name: 'Body scan', desc: 'Head to toe, one part at a time', ic: 'rbody', tips: ['Relax your forehead, eyes and jaw.', 'Let your neck and shoulders soften.', 'Notice your arms and hands. Let them be heavy.', 'Feel your chest and belly rise and fall.', 'Relax your hips, legs and feet.'] },
  { k: 'grat', name: 'Gratitude', desc: 'Think of three good things', ic: 'rheart', tips: ['Think of one good thing from today.', 'Now someone you are thankful for.', 'Now something small that made you smile.', 'Rest in that warm feeling.'] },
  { k: 'sleep', name: 'Sleep wind-down', desc: 'Slow, dim and quiet before bed', ic: 'rzz', tips: ['Let the day go. You are done for now.', 'Breathe slowly and let your body get heavy.', 'Nothing to solve tonight.'] },
];
export const LOOK: Record<string, { name: string; ic: string; med: boolean }> = {};
BREATH.forEach((b) => (LOOK[b.k] = { name: b.name, ic: b.ic, med: false }));
STYLES.forEach((b) => (LOOK[b.k] = { name: b.name, ic: b.ic, med: true }));

export const mins = (x: HDay) => Math.round(((x.rl || []).reduce((a, r) => a + r.s, 0) / 60) * 10) / 10;
export const fmtMin = (m: number) => (m >= 10 ? String(Math.round(m)) : String(Math.round(m * 10) / 10));
export const minsAt = (h: HData, off: number) => mins(getDay(h, off));
export const weekMins = (h: HData) => { let t = 0; for (let i = -6; i <= 0; i++) t += minsAt(h, i); return Math.round(t * 10) / 10; };
export const relaxStreak = (h: HData) => {
  let n = 0; let i = (getDay(h, 0).rl || []).length ? 0 : -1;
  for (; i > -400; i--) { if ((getDay(h, i).rl || []).length) n++; else break; }
  return n;
};
export const recentSess = (h: HData, max = 6) => {
  const out: { when: string; r: RSess; off: number; idx: number }[] = [];
  for (let i = 0; i > -30 && out.length < max; i--) {
    const x = getDay(h, i); const n = (x.rl || []).length; const list = [...(x.rl || [])].reverse();
    list.forEach((r, j) => { if (out.length >= max) return; out.push({ when: i === 0 ? 'Today' : i === -1 ? 'Yesterday' : dateOf(i).getDate() + '/' + (dateOf(i).getMonth() + 1), r, off: i, idx: n - 1 - j }); });
  }
  return out;
};
// Remove one saved session (day offset + position in that day's list).
export const delSess = (h: HData, off: number, idx: number): HData => { const k = keyOfDate(dateOf(off)); const x = getDay(h, off); return { ...h, days: { ...h.days, [k]: { ...x, rl: (x.rl || []).filter((_, i) => i !== idx) } } }; };
export const addSess = (h: HData, r: RSess): HData => { const k = keyOfDate(dateOf(0)); const x = getDay(h, 0); return { ...h, days: { ...h.days, [k]: { ...x, rl: [...(x.rl || []), r].slice(-40) } } }; };
export const nowHM = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
