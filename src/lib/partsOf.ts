// Parts you replace (tyres, battery, brake pads) now live in the Maintenance list as "Replace" items.
// Older data may still have them in the separate parts list, so both are read here.
export type PartRow = { id: number; name: string; date: string; odo: number; life: number };
export function partsOf(v: any): PartRow[] {
  const old: PartRow[] = ((v && v.parts) || []) as PartRow[];
  const now: PartRow[] = (((v && v.tasks) || []) as any[]).filter((t) => t && t.kind === 'part' && t.km > 0 && t.odo != null).map((t) => ({ id: t.id, name: t.name, date: t.last, odo: t.odo, life: t.km }));
  return [...old, ...now];
}
