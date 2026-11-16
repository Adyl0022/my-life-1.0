import { Coordinates, CalculationMethod, CalculationParameters, HighLatitudeRule, Madhab, PrayerTimes } from 'adhan';

// Prayer times worked out on the phone for places outside Malaysia. Malaysia keeps using the official JAKIM zones.
// Nothing is sent over the internet for this: only the place on the map and the date are needed.

type Pt = [number, number]; // [lat, lon]
const inPoly = (lat: number, lon: number, poly: Pt[]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i], [yj, xj] = poly[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
// Rough outlines of Malaysia (Peninsular, Sabah and Sarawak). Only the border areas can be off by a few kilometres.
const PENINSULA: Pt[] = [[6.75, 100.0], [6.45, 100.7], [6.2, 101.6], [6.3, 102.1], [6.0, 102.5], [5.3, 103.6], [3.5, 103.6], [2.5, 104.2], [1.5, 104.4], [1.46, 103.9], [1.46, 103.6], [1.3, 103.45], [1.3, 103.3], [1.9, 102.5], [2.2, 102.0], [3.0, 101.2], [4.0, 100.6], [5.0, 100.2], [5.5, 100.2], [6.2, 99.6], [6.5, 99.7]];
const BORNEO: Pt[] = [[2.1, 109.6], [1.3, 110.3], [1.2, 111.4], [1.5, 112.9], [2.0, 114.0], [3.2, 115.3], [4.2, 115.7], [4.2, 117.8], [4.4, 118.3], [5.5, 119.4], [7.4, 117.0], [6.2, 115.8], [5.0, 115.0], [4.7, 113.9], [3.2, 112.5], [2.2, 111.0]];
export const inMalaysiaArea = (lat: number, lon: number) => inPoly(lat, lon, PENINSULA) || inPoly(lat, lon, BORNEO);

type Box = [number, number, number, number]; // latMin, latMax, lonMin, lonMax
const inBox = (lat: number, lon: number, b: Box) => lat >= b[0] && lat <= b[1] && lon >= b[2] && lon <= b[3];
type Rule = { name: string; box: Box; make: () => CalculationParameters; hanafi?: boolean };
// The first rule that contains the place decides the method. Specific small countries come before the big regions.
const RULES: Rule[] = [
  { name: 'Qatar', box: [24.4, 26.3, 50.6, 51.7], make: () => CalculationMethod.Qatar() },
  { name: 'Kuwait', box: [28.4, 30.2, 46.5, 48.6], make: () => CalculationMethod.Kuwait() },
  { name: 'UAE', box: [22.5, 26.2, 51.5, 56.5], make: () => CalculationMethod.Dubai() },
  { name: 'Saudi Arabia (Umm al-Qura)', box: [16, 32.2, 34.5, 55.7], make: () => CalculationMethod.UmmAlQura() },
  { name: 'Egypt', box: [22, 31.7, 24.7, 36.9], make: () => CalculationMethod.Egyptian() },
  { name: 'Turkey (Diyanet)', box: [36, 42.2, 26, 45], make: () => CalculationMethod.Turkey(), hanafi: true },
  { name: 'Iran', box: [25, 39.8, 44, 63.4], make: () => CalculationMethod.Tehran() },
  { name: 'University of Islamic Sciences, Karachi', box: [5.5, 37.5, 60.5, 92.8], make: () => CalculationMethod.Karachi(), hanafi: true },
  { name: 'Singapore / Southeast Asia', box: [-11.5, 8.5, 95, 141.5], make: () => CalculationMethod.Singapore() },
  { name: 'ISNA (North America)', box: [14, 72, -170, -50], make: () => CalculationMethod.NorthAmerica() },
];
export function methodFor(lat: number, lon: number): { name: string; params: CalculationParameters } {
  const r = RULES.find((x) => inBox(lat, lon, x.box));
  const params = r ? r.make() : CalculationMethod.MuslimWorldLeague();
  params.madhab = r && r.hanafi ? Madhab.Hanafi : Madhab.Shafi;
  params.highLatitudeRule = HighLatitudeRule.recommended(new Coordinates(lat, lon));
  return { name: r ? r.name : 'Muslim World League', params };
}

export type CalcRow = { day: number; fajr: number; syuruk: number; dhuhr: number; asr: number; maghrib: number; isha: number; off: number };
// One whole month, in the same shape the online source uses (seconds since 1970), plus the phone's own clock offset for each day.
export function calcMonth(lat: number, lon: number, y: number, mo: number): { prayers: CalcRow[]; method: string } {
  const { name, params } = methodFor(lat, lon);
  const co = new Coordinates(lat, lon);
  const dim = new Date(y, mo, 0).getDate();
  const prayers: CalcRow[] = [];
  for (let d = 1; d <= dim; d++) {
    const date = new Date(y, mo - 1, d, 12, 0, 0);
    const t = new PrayerTimes(co, date, params);
    prayers.push({
      day: d,
      fajr: Math.round(t.fajr.getTime() / 1000), syuruk: Math.round(t.sunrise.getTime() / 1000), dhuhr: Math.round(t.dhuhr.getTime() / 1000),
      asr: Math.round(t.asr.getTime() / 1000), maghrib: Math.round(t.maghrib.getTime() / 1000), isha: Math.round(t.isha.getTime() / 1000),
      off: -date.getTimezoneOffset() * 60,
    });
  }
  return { prayers, method: name + (params.madhab === Madhab.Hanafi ? ', Hanafi Asr' : '') };
}
