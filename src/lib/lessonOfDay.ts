import { LESSON_LINES } from '../data/lessonLines';
import type { Lesson } from './collection';

export type DayLesson = { mine: boolean; tag: string; title: string; text: string };
const dayN = (d: Date) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTime() / 86400000);

/** The lesson for a day. Every third day shows one of your own lessons (when you have written any), the other days a built-in one. It stays the same all day. */
export function lessonOfDay(mine: Lesson[] | undefined, now = new Date()): DayLesson {
  const n = dayN(now); const own = (mine || []).filter((l) => l && l.title && l.text);
  if (own.length && n % 3 === 0) { const l = own[Math.floor(n / 3) % own.length]; return { mine: true, tag: l.tag || 'Self', title: l.title, text: l.text }; }
  const i = ((n - Math.floor(n / 3)) % LESSON_LINES.length + LESSON_LINES.length) % LESSON_LINES.length;
  const b = LESSON_LINES[i]; return { mine: false, tag: b.tag, title: b.title, text: b.text };
}
