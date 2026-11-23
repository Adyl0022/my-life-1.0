type L = (c: boolean) => void;
const ls = new Set<L>();
let last = 0;
let col = false;
export function subscribeNav(f: L) { ls.add(f); return () => { ls.delete(f); }; }
export function setNavCollapsed(c: boolean) { if (c !== col) { col = c; ls.forEach((f) => f(c)); } }
// Always bring the bar back to full size, even if the stored state already says expanded (the animation can be left half-way).
export function resetNav() { col = false; acc = 0; last = 0; ls.forEach((f) => f(false)); }
// Collapse after a real downward push and expand after a real upward one, so small wobbles never flip it.
let acc = 0;
export function navScroll(e: any) {
  const y = e?.nativeEvent?.contentOffset?.y ?? 0;
  const dy = y - last;
  last = y;
  if (y < 30) { acc = 0; setNavCollapsed(false); return; }
  if (dy === 0) return;
  acc = (acc > 0) === (dy > 0) ? acc + dy : dy;
  if (acc > 36) setNavCollapsed(true);
  else if (acc < -28) setNavCollapsed(false);
}
