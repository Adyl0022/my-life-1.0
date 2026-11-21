// What to do when a paper is about to end. Each guide says where its steps come from, so nobody is told something we did not check.
// 'official' = read on the issuer's own page. 'news' = from news reports (the issuer's page could not be opened). 'general' = steps that fit most cases.
export type RWay = { tab: string; steps: string[] };
export type RGuide = { title: string; ways: RWay[]; bring?: string[]; url?: string; note?: string; source: 'official' | 'news' | 'general' };

export const SOURCE_TEXT: Record<RGuide['source'], string> = {
  official: 'Steps checked on the issuer\'s own page. They can change, so look at the official page too.',
  news: 'Steps taken from news reports, because the official page could not be checked. Please look at the official page before you go.',
  general: 'General steps, because we could not check this one. Ask the company or office that gave you the paper.',
};

const PASSPORT: RGuide = { title: 'Passport', source: 'news', url: 'https://www.imi.gov.my/index.php/perkhidmatan-utama/pasport/pasport-malaysia-antarabangsa/',
  ways: [
    { tab: 'Online', steps: ['Go to the **Immigration Department website** and open **MyOnline Passport**.', 'Enter your full name as on your MyKad, your MyKad number, your old passport number, a working e-mail and the branch where you will collect it.', 'Upload a recent photo (plain white background, taken within the last 6 months).', 'Pay online and keep the receipt.', 'Collect it in person at the branch you picked.'] },
    { tab: 'Abroad', steps: ['Contact the nearest **Malaysian embassy or consulate**.', 'Ask which documents and forms they need for a renewal.'] },
  ],
  bring: ['Original MyKad', 'Old passport', 'Payment receipt (printed or on your phone)'],
  note: 'This is for renewing only. A lost or damaged passport is handled differently. Many countries want at least 6 months left on your passport, so start early.' };

// Papers from another country: no Malaysian office or app is named, only steps that fit anywhere.
const PASSPORT_ANY: RGuide = { title: 'Passport', source: 'general',
  ways: [
    { tab: 'In your country', steps: ['Find the **passport office** of the country that gave you the passport. Use its official website.', 'Check what it asks for: forms, photos, your old passport, an ID and the fee.', 'Book an appointment or apply online if your country allows it.', 'Renew, then **save the new passport here** in Documents.'] },
    { tab: 'Abroad', steps: ['Contact the nearest **embassy or consulate** of the country that gave you the passport.', 'Ask which documents and forms they need for a renewal, and how long it takes.'] },
  ],
  bring: ['Your old passport', 'Your national ID, if your country asks for it', 'Passport photos and payment, if needed'],
  note: 'These are general steps, because every country has its own rules. Many countries want at least 6 months left on your passport, so start early.' };

const LICENCE_ANY: RGuide = { title: 'Driving licence', source: 'general',
  ways: [{ tab: 'What to do', steps: ['Find the **office that gives driving licences** in the country that gave you yours.', 'Check on its official website whether you can renew online or must go to a counter.', 'Gather what it asks for, renew, then **save the new licence here** in Documents.'] }],
  bring: ['Your current licence', 'Your ID'],
  note: 'These are general steps, because every country has its own rules. Some countries ask for an eye test or a new photo.' };

const MYKAD: RGuide = { title: 'MyKad', source: 'news', url: 'https://www.jpn.gov.my',
  ways: [
    { tab: 'MyGOV app', steps: ['Install the **MyGOV** app and set up your **MyDigital ID** (you need it to log in).', 'Log in, tap **Digital Identity**, then **Identity Card**.', 'Scroll down and tap **Penggantian MyKad**.', 'Read the terms, tick the box, then tap **Agree & Next**.', 'Fill in the form, pick a collection centre, check your details and pay.'] },
    { tab: 'At JPN', steps: ['Visit your nearest **National Registration Department (JPN)** office.', 'Ask what to bring for a replacement before you go, or look at the JPN website.'] },
  ],
  bring: ['Your old MyKad, if you still have it'],
  note: 'The app is for damaged or lost cards and chip upgrades, for a MyKad issued in the last 10 years. It is one-to-one, so you cannot change your address or photo. It works on weekdays in office hours only. Collection at some JPN offices takes about 30 minutes, at others a few working days.' };

const LICENCE: RGuide = { title: 'Driving licence', source: 'news', url: 'https://www.malaysia.gov.my/en/categories/transportation/driving-license/renewing-driving-licenses',
  ways: [
    { tab: 'MyJPJ app', steps: ['Open the **MyJPJ** app and sign in.', 'Pick the **driving licence renewal** option.', 'Follow the screen to confirm your details and pay.'] },
    { tab: 'At a counter', steps: ['Visit a **JPJ** counter, or ask the post office or a licensed service whether they renew licences.', 'Ask what to bring before you go.'] },
  ],
  bring: ['Your MyKad', 'Your current licence'],
  note: 'A report said online renewal in the app is for Malaysians only. The rules may have changed since then, so check the official page.' };

const CIMB: RGuide = { title: 'CIMB debit card', source: 'official', url: 'https://www.cimb.com.my/en/personal/help-support/faq/debit-cards/cimb-debit-card/how-do-i-change-my-expired-debit-card.html',
  ways: [
    { tab: 'CIMB OCTO app', steps: ['Log in to the app and tap **More**.', 'Go to **Services**, then **Manage Card**, then **Debit Card Renewal**.', 'Pick the expired card.', 'Confirm the delivery address, or update it.', 'Review the details and approve with your **SecureTAC**.'] },
    { tab: 'At a branch', steps: ['Visit any **CIMB branch** and ask to renew the card.'] },
  ], note: 'Overseas? E-mail contactus@cimb.com or call the CIMB contact centre.' };

const BANK: RGuide = { title: 'Bank card', source: 'general',
  ways: [{ tab: 'Bank app', steps: ['Open your bank\'s app and look for **Cards**, **Manage card** or **Card renewal**.', 'Pick the card that is ending and confirm the delivery address.', 'If you cannot find it, visit a branch or call the bank.'] }],
  note: 'Many banks send the new card before the old one ends. Check your letters and e-mail first, and activate the new card when it comes.' };

const CIDB: RGuide = { title: 'CIDB card', source: 'general', url: 'https://www.cidb.gov.my',
  ways: [{ tab: 'Online', steps: ['Sign in to the **CIDB** online system with your account.', 'Look for the **renewal** option for your card.', 'Follow the screen and pay, then wait for the new card.'] }],
  note: 'We could not check the current steps. Look at the CIDB website, or ask CIDB, before your card ends.' };

const WARRANTY: RGuide = { title: 'Warranty', source: 'general',
  ways: [{ tab: 'Before it ends', steps: ['Check the item **now**: does everything work?', 'If something is wrong, contact the shop or service centre **before** the date.', 'Take the receipt and this warranty with you.', 'Ask if an extended warranty is possible.'] }],
  bring: ['Receipt', 'Warranty card or photo', 'The item'], note: 'Repairs are usually free only until the warranty date, so use the time you have left.' };

const INSURANCE: RGuide = { title: 'Insurance', source: 'general',
  ways: [{ tab: 'Renew', steps: ['Contact your **agent or insurer** a month before it ends.', 'Check what is covered and the new price, and ask about a better offer.', 'Pay, then **save the new policy** here in Documents.'] }],
  note: 'If cover ends even for a day, you may not be protected, so renew on time.' };

const GENERIC: RGuide = { title: 'This paper', source: 'general',
  ways: [{ tab: 'What to do', steps: ['Find out **who gave it** to you: the office or company.', 'Ask what is needed to renew and how long it takes. Do this early.', 'Gather what they ask for, renew, then **save the new one** here.'] }] };

/** Pick the guide for a paper by its type and its name. */
export function renewFor(type: string, title: string, country: 'MY' | 'other' = 'MY'): RGuide {
  const t = (title || '').toLowerCase();
  const my = country !== 'other';
  if (/licen[cs]e|lesen|\bl[dc]\b|jpj|cdl|memandu|driving/.test(t)) return my ? LICENCE : LICENCE_ANY;
  if (type === 'passport') return my ? PASSPORT : PASSPORT_ANY;
  if (type === 'mykad') return MYKAD;
  if (type === 'cidb') return CIDB;
  if (type === 'bank') return my && /cimb/.test(t) ? CIMB : BANK;
  if (type === 'warranty') return WARRANTY;
  if (type === 'insurance') return INSURANCE;
  return GENERIC;
}
