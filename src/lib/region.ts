import { useStored } from './store';

// Country and currency choice. It only changes how money is written and which public holidays the Planner shows.
// Amounts are never converted: 50 stays 50, only the symbol in front of it changes.

export type Cur = { code: string; sym: string; name: string; where: string; flag: string; grp: 'Nearby' | 'Popular' | 'More' };
export const CURRENCIES: Cur[] = [
  { code: 'MYR', sym: 'RM', name: 'Malaysian ringgit', where: 'Malaysia', flag: '🇲🇾', grp: 'Nearby' },
  { code: 'SGD', sym: 'S$', name: 'Singapore dollar', where: 'Singapore', flag: '🇸🇬', grp: 'Nearby' },
  { code: 'IDR', sym: 'Rp', name: 'Indonesian rupiah', where: 'Indonesia', flag: '🇮🇩', grp: 'Nearby' },
  { code: 'THB', sym: '฿', name: 'Thai baht', where: 'Thailand', flag: '🇹🇭', grp: 'Nearby' },
  { code: 'BND', sym: 'B$', name: 'Brunei dollar', where: 'Brunei', flag: '🇧🇳', grp: 'Nearby' },
  { code: 'PHP', sym: '₱', name: 'Philippine peso', where: 'Philippines', flag: '🇵🇭', grp: 'Nearby' },
  { code: 'VND', sym: '₫', name: 'Vietnamese dong', where: 'Vietnam', flag: '🇻🇳', grp: 'Nearby' },
  { code: 'USD', sym: '$', name: 'US dollar', where: 'United States', flag: '🇺🇸', grp: 'Popular' },
  { code: 'GBP', sym: '£', name: 'Pound sterling', where: 'United Kingdom', flag: '🇬🇧', grp: 'Popular' },
  { code: 'EUR', sym: '€', name: 'Euro', where: 'Eurozone', flag: '🇪🇺', grp: 'Popular' },
  { code: 'AUD', sym: 'A$', name: 'Australian dollar', where: 'Australia', flag: '🇦🇺', grp: 'Popular' },
  { code: 'NZD', sym: 'NZ$', name: 'New Zealand dollar', where: 'New Zealand', flag: '🇳🇿', grp: 'Popular' },
  { code: 'CAD', sym: 'C$', name: 'Canadian dollar', where: 'Canada', flag: '🇨🇦', grp: 'Popular' },
  { code: 'CHF', sym: 'CHF', name: 'Swiss franc', where: 'Switzerland', flag: '🇨🇭', grp: 'Popular' },
  { code: 'JPY', sym: '¥', name: 'Japanese yen', where: 'Japan', flag: '🇯🇵', grp: 'Popular' },
  { code: 'CNY', sym: 'CN¥', name: 'Chinese yuan', where: 'China', flag: '🇨🇳', grp: 'Popular' },
  { code: 'KRW', sym: '₩', name: 'South Korean won', where: 'South Korea', flag: '🇰🇷', grp: 'Popular' },
  { code: 'INR', sym: '₹', name: 'Indian rupee', where: 'India', flag: '🇮🇳', grp: 'Popular' },
  { code: 'HKD', sym: 'HK$', name: 'Hong Kong dollar', where: 'Hong Kong', flag: '🇭🇰', grp: 'Popular' },
  { code: 'PKR', sym: 'Rs', name: 'Pakistani rupee', where: 'Pakistan', flag: '🇵🇰', grp: 'More' },
  { code: 'BDT', sym: '৳', name: 'Bangladeshi taka', where: 'Bangladesh', flag: '🇧🇩', grp: 'More' },
  { code: 'SAR', sym: 'SAR', name: 'Saudi riyal', where: 'Saudi Arabia', flag: '🇸🇦', grp: 'More' },
  { code: 'AED', sym: 'AED', name: 'UAE dirham', where: 'United Arab Emirates', flag: '🇦🇪', grp: 'More' },
  { code: 'QAR', sym: 'QAR', name: 'Qatari riyal', where: 'Qatar', flag: '🇶🇦', grp: 'More' },
  { code: 'TRY', sym: '₺', name: 'Turkish lira', where: 'Türkiye', flag: '🇹🇷', grp: 'More' },
  { code: 'EGP', sym: 'E£', name: 'Egyptian pound', where: 'Egypt', flag: '🇪🇬', grp: 'More' },
  { code: 'ZAR', sym: 'R', name: 'South African rand', where: 'South Africa', flag: '🇿🇦', grp: 'More' },
  { code: 'KHR', sym: '៛', name: 'Cambodian riel', where: 'Cambodia', flag: '🇰🇭', grp: 'Nearby' },
  { code: 'LAK', sym: '₭', name: 'Lao kip', where: 'Laos', flag: '🇱🇦', grp: 'Nearby' },
  { code: 'MMK', sym: 'K', name: 'Myanmar kyat', where: 'Myanmar', flag: '🇲🇲', grp: 'Nearby' },
  { code: 'MVR', sym: 'Rf', name: 'Maldivian rufiyaa', where: 'Maldives', flag: '🇲🇻', grp: 'More' },
  { code: 'TWD', sym: 'NT$', name: 'New Taiwan dollar', where: 'Taiwan', flag: '🇹🇼', grp: 'More' },
  { code: 'KWD', sym: 'KWD', name: 'Kuwaiti dinar', where: 'Kuwait', flag: '🇰🇼', grp: 'More' },
  { code: 'BHD', sym: 'BHD', name: 'Bahraini dinar', where: 'Bahrain', flag: '🇧🇭', grp: 'More' },
];

export type Country = { cc: string; name: string; flag: string; cur: string };
export const COUNTRIES: Country[] = [
  { cc: 'MY', name: 'Malaysia', flag: '🇲🇾', cur: 'MYR' },
  { cc: 'SG', name: 'Singapore', flag: '🇸🇬', cur: 'SGD' },
  { cc: 'ID', name: 'Indonesia', flag: '🇮🇩', cur: 'IDR' },
  { cc: 'TH', name: 'Thailand', flag: '🇹🇭', cur: 'THB' },
  { cc: 'BN', name: 'Brunei', flag: '🇧🇳', cur: 'BND' },
  { cc: 'PH', name: 'Philippines', flag: '🇵🇭', cur: 'PHP' },
  { cc: 'VN', name: 'Vietnam', flag: '🇻🇳', cur: 'VND' },
  { cc: 'US', name: 'United States', flag: '🇺🇸', cur: 'USD' },
  { cc: 'GB', name: 'United Kingdom', flag: '🇬🇧', cur: 'GBP' },
  { cc: 'AU', name: 'Australia', flag: '🇦🇺', cur: 'AUD' },
  { cc: 'NZ', name: 'New Zealand', flag: '🇳🇿', cur: 'NZD' },
  { cc: 'CA', name: 'Canada', flag: '🇨🇦', cur: 'CAD' },
  { cc: 'CH', name: 'Switzerland', flag: '🇨🇭', cur: 'CHF' },
  { cc: 'DE', name: 'Germany', flag: '🇩🇪', cur: 'EUR' },
  { cc: 'FR', name: 'France', flag: '🇫🇷', cur: 'EUR' },
  { cc: 'ES', name: 'Spain', flag: '🇪🇸', cur: 'EUR' },
  { cc: 'IT', name: 'Italy', flag: '🇮🇹', cur: 'EUR' },
  { cc: 'NL', name: 'Netherlands', flag: '🇳🇱', cur: 'EUR' },
  { cc: 'JP', name: 'Japan', flag: '🇯🇵', cur: 'JPY' },
  { cc: 'CN', name: 'China', flag: '🇨🇳', cur: 'CNY' },
  { cc: 'KR', name: 'South Korea', flag: '🇰🇷', cur: 'KRW' },
  { cc: 'IN', name: 'India', flag: '🇮🇳', cur: 'INR' },
  { cc: 'HK', name: 'Hong Kong', flag: '🇭🇰', cur: 'HKD' },
  { cc: 'PK', name: 'Pakistan', flag: '🇵🇰', cur: 'PKR' },
  { cc: 'BD', name: 'Bangladesh', flag: '🇧🇩', cur: 'BDT' },
  { cc: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', cur: 'SAR' },
  { cc: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', cur: 'AED' },
  { cc: 'QA', name: 'Qatar', flag: '🇶🇦', cur: 'QAR' },
  { cc: 'TR', name: 'Türkiye', flag: '🇹🇷', cur: 'TRY' },
  { cc: 'EG', name: 'Egypt', flag: '🇪🇬', cur: 'EGP' },
  { cc: 'ZA', name: 'South Africa', flag: '🇿🇦', cur: 'ZAR' },
  { cc: 'KH', name: 'Cambodia', flag: '🇰🇭', cur: 'KHR' },
  { cc: 'LA', name: 'Laos', flag: '🇱🇦', cur: 'LAK' },
  { cc: 'MM', name: 'Myanmar', flag: '🇲🇲', cur: 'MMK' },
  { cc: 'MV', name: 'Maldives', flag: '🇲🇻', cur: 'MVR' },
  { cc: 'TW', name: 'Taiwan', flag: '🇹🇼', cur: 'TWD' },
  { cc: 'KW', name: 'Kuwait', flag: '🇰🇼', cur: 'KWD' },
  { cc: 'BH', name: 'Bahrain', flag: '🇧🇭', cur: 'BHD' },
];

export type Region = { cc: string; cur: string };
export const REGION_DEFAULT: Region = { cc: 'MY', cur: 'MYR' };

export const curOf = (code: string): Cur => CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
export const countryOf = (cc: string): Country => COUNTRIES.find((c) => c.cc === cc) || COUNTRIES[0];

// The choice currently in use. Screens set it when they read the saved choice, and plain code (the assistant, exports, PDF) reads it from here.
let active: Region = REGION_DEFAULT;
const clean = (r: Region | null | undefined): Region => ({ cc: countryOf((r && r.cc) || '').cc, cur: curOf((r && r.cur) || '').code });

/** The symbol on its own, for example "RM" or "$". */
export const cu = () => curOf(active.cur).sym;
/** The symbol ready to go in front of an amount: "RM " or "S$ " for letter symbols, "$" or "£" for single marks. */
export const cs = () => { const s = cu(); return /[A-Za-z]/.test(s) ? s + ' ' : s; };
/** The everyday word for one unit of the chosen currency, for example "ringgit", "dollar" or "yen". */
export const cw = () => { const n = curOf(active.cur).name; return /sterling$/i.test(n) ? 'pound' : n.split(' ').pop()!.toLowerCase(); };
/** Currency code of the chosen currency, for example "MYR". */
export const curCode = () => curOf(active.cur).code;
/** Country code of the chosen country, for example "MY". */
export const regionCC = () => active.cc;
export const regionCountry = () => countryOf(active.cc);

/** Reads the saved choice and keeps the screen up to date when it changes. Call it once in any screen that writes money. */
export function useRegion(): [Region, (r: Region) => void, boolean] {
  const [r, set, ok] = useStored<Region>('ml_region', REGION_DEFAULT);
  active = clean(r);
  return [active, (x: Region) => set(clean(x)), ok];
}
