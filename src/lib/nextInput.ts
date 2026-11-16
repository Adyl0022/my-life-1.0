import { useEffect, useRef } from 'react';
import { Keyboard } from 'react-native';

// Enter on a single-line field jumps to the next field below it (or to the right on the same row).
// If there is no field after it, Enter just closes the keyboard. Fields that already do something on Enter keep doing it.
type R = { current: any };
const reg = new Set<R>();

function goNext(cur: R) {
  const me = cur.current;
  if (!me || !(me as any).measureInWindow) { Keyboard.dismiss(); return; }
  me.measureInWindow((cx: number, cy: number) => {
    const list: { r: any; x: number; y: number }[] = [];
    let left = 0;
    const done = () => {
      let best: { r: any; x: number; y: number } | null = null;
      for (const c of list) {
        if (c.r === me) continue;
        const below = c.y > cy + 8, same = Math.abs(c.y - cy) <= 8 && c.x > cx + 4;
        if (!(below || same) || c.y - cy > 320) continue; // far away = a field of some other screen
        if (!best || c.y < best.y - 8 || (Math.abs(c.y - best.y) <= 8 && c.x < best.x)) best = c;
      }
      if (best) best.r.focus(); else Keyboard.dismiss();
    };
    reg.forEach((r) => {
      const t = r.current;
      if (!t || !(t as any).measureInWindow) return;
      left++;
      t.measureInWindow((x: number, y: number, w: number, h: number) => {
        if (w > 0 && h > 0) list.push({ r: t, x, y });
        if (--left === 0) done();
      });
    });
    if (left === 0) done();
  });
}

export function useNextInput(p: any) {
  const ref = useRef<any>(null);
  useEffect(() => { reg.add(ref); return () => { reg.delete(ref); }; }, []);
  const own = !!p.onSubmitEditing || !!p.multiline || p.submitBehavior !== undefined || p.blurOnSubmit !== undefined;
  const extra: any = own ? {} : { submitBehavior: 'submit', onSubmitEditing: () => goNext(ref) };
  return { ref, extra };
}
