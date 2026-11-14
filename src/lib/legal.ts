export type Sec = { h: string; p: string };
export const WHATS_NEW: Sec[] = [
  { h: 'Version 1.0.1', p: 'A big update with Family Planner, more countries and currencies, and a calmer Settings.' },
  { h: 'Family Planner', p: '•  Share tasks, activities and a shopping list with your family\n•  Repeating tasks and reminders for everyone\n•  Anything deleted can be brought back for 7 days\n•  The family owner can turn the invite code off or on, or delete the family' },
  { h: 'More in 1.0.1', p: '•  Steps count all day from your phone\'s step sensor, even when your health app does not share with Health Connect\n•  Life Score has Budget left, which compares today\'s spending with the daily amount in My Finance\n•  Family Planner can also sit on the Dashboard as a module (Settings, Modules). The Dashboard shows up to 5 modules\n•  Smoother Family Planner screens\n•  The Assistant can undo what it just saved, gives a short brief of your day, explains Life Score and Budget left, and understands more chat spelling' },
  { h: 'Region and currency', p: 'Public holidays, currency symbols and money words now follow the country you choose. New countries: Cambodia, Laos, Myanmar, United Kingdom, United States, Maldives, Taiwan, Kuwait, Bahrain, New Zealand and Germany.' },
  { h: 'Islamic Hub settings', p: 'Prayer times, daily zikir and prayer alert timing moved from Settings into the Islamic Hub (tap the gear icon). You can also hide modules you do not use.' },
  { h: 'Quran and zikir', p: 'Read with translation, Arabic only, or continuous. The same choices are in Tahlil, Mathurat and dhikr.' },
  { h: 'Dashboard and backup', p: 'The bottom Dashboard card can be tapped to switch views, and Dashboard cards can be reordered. Backups now include My Record receipt photos.' },
  { h: 'New logo', p: 'The My Life logo inside the app now matches the icon on your home screen, with a soft glass look and gentle moving lights.' },
  { h: 'Fixes', p: '•  Sleep tracker times type and clear properly\n•  Budget alerts show while the app is open\n•  Reminder settings now sync between your devices\n•  Clearer steps to connect Honor Health or Samsung Health' },
  { h: 'Version 1.0.0', p: 'The first release of My Life, with everything you need for your day in one app.' },
  { h: 'What you can do', p: '•  Plan tasks and events\n•  Prayer times, Quran and zikir\n•  Track money in Finance\n•  Keep vehicle records (motorcycle, car and more)\n•  Log habits, sleep and steps\n•  Share tasks, shopping and plans in Family Planner\n•  Ask the Assistant or use Search\n•  See progress in Stats and Insights' },
  { h: 'Private by design', p: 'Your data lives on your phone and is encrypted there. When you are signed in, a private copy is backed up to your own account so you can use it on other devices. You can add an optional PIN or fingerprint lock.' },
  { h: 'Reminders', p: 'Alerts for prayer times, Planner events and daily zikir. Quiet hours mute them from 12 am to 5 am.' },
  { h: 'Your data, your control', p: 'Export your data to Excel, PDF or CSV, and back it up or restore it from a file whenever you like.' },
  { h: 'Made to be calm', p: 'A glass look that changes with the time of day, and no ads.' },
];
export const PRIVACY: Sec[] = [
  { h: 'What we store', p: 'Your account (name, email and a password that we only keep in scrambled form), and what you enter yourself: notes, events, finance entries, records and habits. Stats about how long you use the app are kept on your device for 30 days. For security and to protect licences, the app owner can see how many devices are signed in to each account and when the account was last active. This does not include your notes, finances or other personal data. The app itself does not store IP addresses or device names, but the sign-in service we use (Supabase) may keep technical records, such as an IP address, for security.' },
  { h: 'Where it lives', p: 'Your data lives first on your phone, encrypted there. When you are signed in, a copy is also saved to your account on our server (Supabase, hosted in Singapore) so you can use it on other phones and get it back if you lose this one. Each account can only read its own data, plus the shared Family Planner space of the family it belongs to. Receipt photos stay on the phone and are not uploaded.' },
  { h: 'Family Planner', p: 'If you use Family Planner, what you add there is saved on our server in a space shared by your family: the family name, members\' names and colours, birthdays you add, tasks, chores and reward points, the shopping list, menu, wishes and activities. Every member can see and change it. This is the one place where data is shared between accounts, and only people who joined with your family code can see it. The owner can add profiles for people without an account, such as children; we only keep a name, a colour and, if you add it, a birthday for them. Deleted items stay in Recently deleted for 7 days. Anyone can leave a family. The owner can remove members or delete the family, which deletes everything in it. If the owner deletes their account, the family and its data are deleted too.' },
  { h: 'What we never do', p: 'We do not show ads, track you across other apps or sell your data. We only send data to the services the app needs in order to work, listed under Other services, and only what each one needs. The server stores your data so the app can sync it; it is not end-to-end encrypted, so the developer could technically access it, but does not read it.' },
  { h: 'Location', p: 'Prayer times use your location only to work out the times. Your coordinates are sent to the prayer-time service (waktusolat.app) to look up your zone. The last place found is kept on your phone only, so times can show without asking again, and it is not saved to your account. You can choose your zone by hand instead.' },
  { h: 'Steps and health', p: 'If you allow it, My Life reads your step count from your phone\'s step sensor or Health Connect to fill in your daily goal. Steps are kept with your habit data: saved on your phone and, when you are signed in, in your online copy. They are not used for anything else.' },
  { h: 'Other services', p: 'To work, the app contacts these services: waktusolat.app and e-solat.gov.my for prayer times (your location is sent to waktusolat.app, see Location); date.nager.at for Malaysian public holidays (no personal data is sent); and Supabase for sign-in and sync. In the GitHub edition, GitHub is contacted when you tap Check for updates. As with any internet request, each service can see your device\'s IP address.' },
  { h: 'App lock', p: 'If you turn on App lock, your PIN is stored only on your phone in scrambled (hashed) form. We cannot see it or reset it for you.' },
  { h: 'Your control', p: 'You can export everything at any time from Settings, reset all your data (this also erases the online copy), or delete your account in Settings, which permanently removes your account and everything saved online. If you own a family, deleting your account also deletes the family. Removing the app from your phone removes only the data on that phone.' },
  { h: 'Contact', p: 'Questions about privacy go to the developer, Adli Syahmi. Email adlisyahmi324@gmail.com or mylifeapp.support@gmail.com.' },
];
export const TERMS: Sec[] = [
  { h: 'Using My Life', p: 'My Life is a personal organiser for your own use. Keep your phone and your PIN private. You are responsible for what is done on your device.' },
  { h: 'Your content', p: 'Everything you add belongs to you. We only store and show it back to you.' },
  { h: 'Religious content', p: 'Quran text, zikir and prayer times are provided as a convenience. Prayer times follow JAKIM and are only accurate in Malaysia. Please confirm with your local authority where it matters.' },
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
  { h: '3. Islamic Hub', p: 'Prayer times, Quran, zikir, fasting log and more. Prayer times use official Malaysian (JAKIM) zones, so they are only accurate in Malaysia. Allow location once so the right zone is found.' },
  { h: '4. Money and vehicles', p: 'My Finance tracks spending, income and commitments. My Record keeps mileage, service and fuel for your vehicles.' },
  { h: '5. Habit and Health', p: 'Log steps, sleep, mood and water. Turn on Count steps automatically to take steps from Health Connect or your phone\'s step sensor. Your streaks and score show up in Stats and Insights.' },
  { h: '6. Family Planner', p: 'Open it from the Family Planner button in Daily Planner, or turn it on as a Dashboard module in Settings, Modules. The owner creates the family and shares the invite code from the Members page. Others join with the code, and children without a phone can be added as profiles. Together you share Tasks (chores and rewards), Household (shopping, menu and wishes) and Activities (a calendar with holidays and birthdays). Deleted things stay in Recently deleted for 7 days.' },
  { h: '7. Ask the Assistant', p: 'Type things like "I spent RM10 on lunch". It answers from your own data and can save entries for you after you confirm.' },
  { h: '8. Keep it safe', p: 'Turn on App lock in Settings, Security. Save a backup now and then from Settings, Export. Hide modules you do not use in Settings, Modules.' },
];
export const FAQ: Sec[] = [
  { h: 'How do I activate the app?', p: 'Create an account, then enter the activation code you receive from the developer after payment. Each code works once and unlocks your account on all your devices.' },
  { h: 'Where is my data?', p: 'On your phone, encrypted, and backed up to your account online when you are signed in. Each account can only read its own data, apart from the Family Planner space you share with your family. The online copy is not end-to-end encrypted, so the developer could technically access it, but does not read it.' },
  { h: 'Can I use it on a new phone?', p: 'Yes. Install My Life, sign in with the same email and password, and your data comes back. Receipt photos are not included.' },
  { h: 'I changed phone. How do I move my data?', p: 'On the old phone, go to Settings, Export, choose Backup (JSON) and keep the file. On the new phone, open Settings, Security, Backup and restore, then Restore from a file. Receipt photos in My Record come along in the backup file (up to 25 photos).' },
  { h: 'Steps do not count by themselves.', p: 'In Habit, turn on Count steps automatically and allow Physical activity. My Life uses Health Connect when it has steps and your phone\'s own step sensor otherwise, and shows the larger number so nothing is counted twice. Open My Life now and then to refresh the total. You can always add or correct steps by hand.' },
  { h: 'What does Budget left on Life Score mean?', p: 'It compares today\'s spending with the daily amount shown in My Finance. 100% means the whole daily amount is still free. 0% means it is used up or you are over. It only appears on days you have spent something.' },
  { h: 'How do I add my family?', p: 'Turn on Family Planner from Daily Planner or in Settings, Modules. The owner creates the family and shares the invite code from the Members page. Each person who joins needs their own account. Children without a phone can be added as profiles.' },
  { h: 'What happens to the family if I delete my account?', p: 'If you are a member, you leave the family and what you added stays for the others. If you are the owner, the family and everything in it are deleted. Hand over ownership first from the Members page if you want to keep it.' },
  { h: 'I forgot my PIN.', p: 'On the lock screen tap Forgot PIN. You can use your fingerprint or your account password to set a new PIN, or erase the app data and start fresh.' },
  { h: 'Notifications do not ring.', p: 'Use Settings, General, Send a test notification. If nothing shows, allow notifications for My Life in your phone settings and turn off battery saving for the app.' },
  { h: 'Prayer times look wrong.', p: 'Open Islamic Hub and refresh your location. Times follow JAKIM and are only accurate in Malaysia. Please confirm with your local authority.' },
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
