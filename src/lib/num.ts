// Strict number reading for what people type. A wrong entry gives NaN, so every save that checks `n > 0` (or similar) refuses it, and the box already shows why.
const fmtN = (n: number) => n.toLocaleString('en-MY', { maximumFractionDigits: 2 });
// Checks what was typed in a number box. Returns a short message, or '' when it is fine (or empty). min and max can be passed as props; sensible limits are used otherwise.
export const numberError = (raw: string, o: { min?: number; max?: number; ph?: string } = {}): string => {
  const t = String(raw == null ? '' : raw).trim(); if (!t) return '';
  if (t.indexOf(':') >= 0) return '';
  if (/^-/.test(t)) return 'Cannot be negative';
  if (!/^\d+([.,]\d+)?$/.test(t) && !/^[.,]\d+$/.test(t)) return 'Not a valid number';
  const v = parseFloat(t.replace(',', '.')); if (!isFinite(v)) return 'Not a valid number';
  const ph = (o.ph || '').toLowerCase(); const max = o.max != null ? o.max : /odometer|meter|\bkm\b/.test(ph) ? 2000000 : /litre/.test(ph) ? 200 : 99999999;
  if (v > max) return 'Too high. The most allowed is ' + fmtN(max);
  if (o.min != null && v < o.min) return 'Too low. The least allowed is ' + fmtN(o.min);
  return '';
};
export const pn = (s: string, o?: { min?: number; max?: number }): number => (numberError(s, o) || String(s).indexOf(':') >= 0 ? NaN : parseFloat(String(s == null ? '' : s).replace(',', '.')));
export const pi = (s: string, o?: { min?: number; max?: number }): number => (numberError(s, o) || String(s).indexOf(':') >= 0 ? NaN : parseInt(String(s == null ? '' : s).replace(/[.,].*$/, ''), 10));
