// Works out which family reminders should ring. Pure logic (no phone features) so it is easy to check.
export type PlanTask = { id: string; title: string; due_at: string | null; remind_min: number | null; assignees: string[]; done: boolean };
export type PlanEvent = { id: string; title: string; starts_at: string; remind_min: number | null; attendees: string[] };
export type Planned = { id: string; at: Date; title: string; body: string };

const lead = (m: number, what: string) => (m === 0 ? what + ' now' : m < 60 ? what + ' in ' + m + ' minutes' : m < 1440 ? what + ' in ' + m / 60 + (m === 60 ? ' hour' : ' hours') : what + ' tomorrow');

// A task or activity reminds you when it is for you, or for everyone (nobody chosen). The soonest 50 are kept.
export function planFamilyAlerts(me: string, tasks: PlanTask[], events: PlanEvent[], now: number, quiet: (d: Date) => boolean): Planned[] {
  const out: Planned[] = [];
  const mine = (ids: string[]) => !ids.length || ids.indexOf(me) >= 0;
  for (const t of tasks) {
    if (t.done || !t.due_at || t.remind_min === null || !mine(t.assignees)) continue;
    const at = new Date(new Date(t.due_at).getTime() - t.remind_min * 60000);
    if (at.getTime() <= now + 5000 || quiet(at)) continue;
    out.push({ id: 'fam-t-' + t.id + '-' + at.getTime(), at, title: t.title, body: lead(t.remind_min, 'Task due') });
  }
  for (const e of events) {
    if (e.remind_min === null || !mine(e.attendees)) continue;
    const at = new Date(new Date(e.starts_at).getTime() - e.remind_min * 60000);
    if (at.getTime() <= now + 5000 || quiet(at)) continue;
    out.push({ id: 'fam-e-' + e.id + '-' + at.getTime(), at, title: e.title, body: lead(e.remind_min, 'Family activity starts') });
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 50);
}
