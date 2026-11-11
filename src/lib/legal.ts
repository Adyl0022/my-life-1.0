import { FREEMIUM } from './edition';
export type Sec = { h: string; p: string };
export const WHATS_NEW: Sec[] = [
  { h: 'Version 1.0.0', p: 'The first release of My Life, with everything you need for your day in one app.' },
  { h: 'What you can do', p: '•  Plan tasks and events\n•  Prayer times, Quran and zikir\n•  Track money in Finance\n•  Keep vehicle records (motorcycle, car and more)\n•  Log habits, sleep and steps\n•  Ask the Assistant or use Search\n•  See progress in Stats and Insights' },
  { h: 'Private by design', p: 'Your data lives on your phone and is encrypted there. When you are signed in, a private copy is backed up to your own account so you can use it on other devices. You can add an optional PIN or fingerprint lock.' },
  { h: 'Reminders', p: 'Alerts for prayer times, Planner events and daily zikir. Quiet hours mute them from 12 am to 5 am.' },
  { h: 'Your data, your control', p: 'Export your data to Excel, PDF or CSV, and back it up or restore it from a file whenever you like.' },
  { h: 'Made to be calm', p: 'A glass look that changes with the time of day, and no ads.' },
];
export const PRIVACY: Sec[] = [
  { h: 'What we store', p: 'Your account (name, email and a password that we only keep in scrambled form), and what you enter yourself: notes, events, finance entries, records and habits. Stats about how long you use the app are kept on your device for 30 days. For security and to protect licences, the app owner can see how many devices are signed in to each account and when the account was last active. This does not include your notes, finances or other personal data. The app itself does not store IP addresses or device names, but the sign-in service we use (Supabase) may keep technical records, such as an IP address, for security.' },
  { h: 'Where it lives', p: 'Your data lives first on your phone, encrypted there. When you are signed in, a copy is also saved to your account on our server (Supabase, hosted in Singapore) so you can use it on other phones and get it back if you lose this one. Each account can only read its own data. Receipt photos stay on the phone and are not uploaded.' },
  { h: 'What we never do', p: 'We do not show ads, track you across other apps or sell your data. We only send data to the services the app needs in order to work, listed under Other services, and only what each one needs. The server stores your data so the app can sync it; it is not end-to-end encrypted, so the developer could technically access it, but does not read it.' },
  { h: 'Location', p: 'Prayer times use your location only to work out the times. Your coordinates are sent to the prayer-time service (waktusolat.app) to look up your zone. The last place found is kept on your phone only, so times can show without asking again, and it is not saved to your account. You can choose your zone by hand instead.' },
  { h: 'Steps and health', p: 'If you allow it, My Life reads your step count from your phone\'s step sensor or Health Connect to fill in your daily goal. Steps are kept with your habit data: saved on your phone and, when you are signed in, in your online copy. They are not used for anything else.' },
  { h: 'Other services', p: 'To work, the app contacts these services: waktusolat.app and e-solat.gov.my for prayer times (your location is sent to waktusolat.app, see Location); date.nager.at for Malaysian public holidays (no personal data is sent); and Supabase for sign-in and sync. In the Google Play edition, subscriptions are handled by Google Play, and RevenueCat is told your account ID and whether your subscription is active (it never sees your card details). In the GitHub edition of the app, GitHub is contacted when you tap Check for updates. As with any internet request, each service can see your device\'s IP address.' },
  { h: 'App lock', p: 'If you turn on App lock, your PIN is stored only on your phone in scrambled (hashed) form. We cannot see it or reset it for you.' },
  { h: 'Your control', p: 'You can export everything at any time from Settings, reset all your data (this also erases the online copy), or delete your account in Settings, which permanently removes your account and everything saved online. Removing the app from your phone removes only the data on that phone.' },
  { h: 'Contact', p: 'Questions about privacy go to the developer, Adli Syahmi. Email adlisyahmi324@gmail.com or mylifeapp.support@gmail.com.' },
];
export const TERMS: Sec[] = [
  { h: 'Using My Life', p: 'My Life is a personal organiser for your own use. Keep your phone and your PIN private. You are responsible for what is done on your device.' },
  { h: 'Your content', p: 'Everything you add belongs to you. We only store and show it back to you.' },
  { h: 'Religious content', p: 'Quran text, zikir and prayer times are provided as a convenience. Prayer times follow JAKIM. Please confirm with your local authority where it matters.' },
  { h: 'Assistant', p: 'My Life Assistant answers from your own data and is not a financial, medical or religious adviser.' },
  { h: 'No warranty', p: 'The app is provided as is. Keep a backup using Export. We are not liable for loss of data.' },
  { h: 'Changes', p: 'These terms may change as the app grows. The latest version is always in Settings, under About.' },
];
export const LICENCES: Sec[] = [
  { h: 'Open-source software', p: 'My Life is built with React Native, Expo (including expo-router, expo-notifications, expo-location, SheetJS (xlsx), expo-secure-store, expo-local-authentication and expo-crypto), react-native-svg, react-native-reanimated, AsyncStorage, aes-js and noble-hashes. They are released under the MIT licence.' },
];

export const SUPPORT_EMAIL = 'adlisyahmi324@gmail.com';
export const SUPPORT_EMAIL2 = 'mylifeapp.support@gmail.com';
export const PRIVACY_URL = 'https://adyl0022.github.io/my-life-1.0/privacy.html';
export const HOWTO: Sec[] = [
  { h: '1. Start on Home', p: 'The Dashboard shows your day: next prayer, tasks, spending and habits. Use the bottom bar to move between Home, Stats, Insights and Settings.' },
  { h: '2. Plan your days', p: 'Planner holds your tasks and events. Add an event and choose when to be reminded.' },
  { h: '3. Islamic Hub', p: 'Prayer times, Quran, zikir, fasting log and more. Allow location once so prayer times are right for where you are.' },
  { h: '4. Money and vehicles', p: 'My Finance tracks spending, income and commitments. My Record keeps mileage, service and fuel for your vehicles.' },
  { h: '5. Habit and Health', p: 'Log steps, sleep, mood and water. Your streaks and score show up in Stats and Insights.' },
  { h: '6. Ask the Assistant', p: 'Type things like "I spent RM10 on lunch". It answers from your own data and can save entries for you after you confirm.' },
  { h: '7. Keep it safe', p: 'Turn on App lock in Settings, Security. Save a backup now and then from Settings, Export.' },
];
export const FAQ: Sec[] = [
  FREEMIUM
    ? { h: 'What do I get with the subscription?', p: 'The subscription (RM15 a year) unlocks the Assistant, Spending by Category and Income Trend in Finance, PDF export and new categories in My Record, and every tip in Insights. Everything else is open to all. It renews every year until you cancel in Google Play, and your data stays with you if you stop.' }
    : { h: 'How do I activate the app?', p: 'Create an account, then enter the activation code you receive from the developer after payment. Each code works once and unlocks your account on all your devices.' },
  { h: 'Where is my data?', p: 'On your phone, encrypted, and backed up to your account online when you are signed in. Each account can only read its own data. The online copy is not end-to-end encrypted, so the developer could technically access it, but does not read it.' },
  { h: 'Can I use it on a new phone?', p: 'Yes. Install My Life, sign in with the same email and password, and your data comes back. Receipt photos are not included.' },
  { h: 'I changed phone. How do I move my data?', p: 'On the old phone, go to Settings, Export, choose Backup (JSON) and keep the file. On the new phone, open Settings, Security, Backup and restore, then Restore from a file. Photos such as receipts are not included.' },
  { h: 'I forgot my PIN.', p: 'On the lock screen tap Forgot PIN. You can use your fingerprint or your account password to set a new PIN, or erase the app data and start fresh.' },
  { h: 'Notifications do not ring.', p: 'Use Settings, General, Send a test notification. If nothing shows, allow notifications for My Life in your phone settings and turn off battery saving for the app.' },
  { h: 'Prayer times look wrong.', p: 'Open Islamic Hub and refresh your location. Times follow JAKIM. Please confirm with your local authority.' },
];

export const COPYRIGHT: Sec[] = [
  { h: 'Copyright', p: '© 2026 Adli Syahmi. All rights reserved. My Life 1.0, including its name, logo, design, screens, text, icons, artwork, animations and source code, is the private property of Adli Syahmi and is protected by copyright law.' },
  { h: 'Licence to use', p: 'You are given a personal, non-exclusive, non-transferable and revocable licence to install and use My Life on your own devices for your own non-commercial use. This is a licence to use the app, not a sale of it or of any part of it.' },
  { h: 'What is not allowed', p: 'Without written permission from the developer you may not:\n•  copy, reproduce or redistribute the app or any part of it\n•  modify it, or make new apps or works based on it\n•  decompile, reverse engineer or try to extract its source code, design or data\n•  sell, rent, lend, sublicense or share the app file (APK) with others\n•  remove or change any copyright or ownership notice\n•  use its name, logo or design in a way that suggests it is yours or that it is approved by the developer' },
  { h: 'Third-party software', p: 'My Life uses open-source software that stays under its own licences. See Open-source licences in this screen. These licences do not give you rights over the My Life code, design or name.' },
  { h: 'No warranty', p: 'The app is provided as it is, without any promise that it is free of mistakes or will always be available. Use the figures and reminders as a helper and not as professional financial, medical or religious advice.' },
  { h: 'Breaking these terms', p: 'If you break these terms your licence ends automatically, and the developer may take action to protect the app, including under copyright law.' },
  { h: 'Contact', p: 'For permission or questions about copyright and licence, contact the developer, Adli Syahmi, at adlisyahmi324@gmail.com or mylifeapp.support@gmail.com.' },
];
