// How to cancel, step by step. Every service below was checked against its own official page.
// Services we could not check get only the steps that are the same for everyone (the Apple and Google Play ones),
// plus an honest note. My Life 1.0 never cancels anything for the person: it only shows the way.
export type Way = { tab: string; steps: string[] };
export type Guide = { ways: Way[]; url?: string; note?: string; checked: boolean };

const APPLE: Way = { tab: 'iPhone (Apple)', steps: ['Open **Settings** and tap your name.', 'Tap **Subscriptions** and pick the one you want to end.', 'Tap **Cancel Subscription**. You may need to scroll down.'] };
const PLAY: Way = { tab: 'Android (Google Play)', steps: ['Open your subscriptions page in **Google Play**.', 'Pick the subscription.', 'Tap **Cancel subscription** and follow the screen.'] };
const APPLE_URL = 'https://support.apple.com/118428';
const PLAY_URL = 'https://support.google.com/googleplay/answer/7018481';

export const GUIDES: Record<string, Guide> = {
  Netflix: { checked: true, url: 'https://help.netflix.com/en/node/407', ways: [
    { tab: 'Website', steps: ['Go to **netflix.com/cancelplan** and sign in.', 'Tap **Cancel**.', 'Tap **Finish Cancellation**.', 'Look for the confirmation e-mail.'] },
    { tab: 'Billed by a partner', steps: ['Go to **netflix.com/account** and check the Membership section.', 'Follow the cancellation link if one shows up.', 'If not, contact the company that bills you (for example your phone or internet provider).'] },
  ], note: 'Deleting the Netflix app does not cancel your account.' },
  'YouTube Premium': { checked: true, url: 'https://support.google.com/youtube/answer/6308278', ways: [
    { tab: 'Android', steps: ['Tap your profile picture, then **Paid memberships**.', 'Pick the membership and tap **Continue**.', 'Choose a reason, then tap **Yes, cancel**.'] },
    { tab: 'Computer', steps: ['Go to **youtube.com/paid_memberships** and sign in.', 'Pick the membership and follow the steps to cancel.'] },
    { tab: 'iPhone (Apple)', steps: ['If you joined from the YouTube app on iPhone, Apple bills you.', 'Open **Settings**, tap your name, then **Subscriptions**.', 'Pick YouTube and tap **Cancel Subscription**.'] },
  ] },
  Spotify: { checked: true, url: 'https://support.spotify.com/us/article/how-to-cancel-subscription/', ways: [
    { tab: 'Website', steps: ['Go to **spotify.com/account/subscription/manage** and sign in.', 'Tap **Cancel subscription**.', 'Premium stays on until your next billing date, then your account becomes free.'] },
    { tab: 'Family or Duo', steps: ['The plan manager cancelling ends the plan for everyone, so tell the members first.', 'If you are only a member, the steps only remove you. Ask the manager to cancel.'] },
    { tab: 'Billed by a partner', steps: ['Go to **Manage your plan** and open **Payment**.', 'Use the contact link there for the company that bills you.', 'If an app store bills you, cancel in that store instead.'] },
  ], note: 'Cancelling during a free trial switches you to free straight away.' },
  Claude: { checked: true, url: 'https://support.claude.com/en/articles/8325617-cancel-your-pro-or-max-plan', ways: [
    { tab: 'Website', steps: ['Click your name in the lower-left corner.', 'Open **Settings**, then **Billing**.', 'Click **Cancel**.'] },
    { tab: 'iPhone', steps: ['In the Claude app, tap your initials at the top right.', 'Tap **Billing**, then **Manage subscription**.', 'Follow the screen to cancel. If the app is gone, use the Apple steps.'] },
    { tab: 'Android', steps: ['In the Claude app, tap your initials at the top right.', 'Tap **Billing**, then **Manage subscription**.', 'Follow the screen to cancel. If the app is gone, use the Google Play steps.'] },
  ], note: 'Your plan stays on until the period ends. To avoid the next charge, cancel at least 24 hours before your billing date.' },
  ChatGPT: { checked: true, url: 'https://help.openai.com/en/articles/7232927-how-do-i-cancel-my-chatgpt-plus-subscription', ways: [
    { tab: 'Website', steps: ['Open **My Plan** in the ChatGPT sidebar.', 'Tap **Manage my subscription**.', 'On the next page, choose **Cancel Plan**.'] },
    APPLE, PLAY,
  ], note: 'To avoid the next charge, cancel at least 24 hours before your billing date. Fees are not refundable.' },
  'Prime Video': { checked: true, url: 'https://www.aboutamazon.com/news/retail/how-to-cancel-amazon-prime-membership', ways: [
    { tab: 'Website', steps: ['Go to Amazon and hover over **Accounts & Lists**, then **Prime Membership**.', 'Hover over **Manage Membership**, then tap **End Membership**.', 'Follow the screen to finish.'] },
    { tab: 'Amazon app', steps: ['Open the Amazon Shopping app and tap the **Profile** icon.', 'Scroll to **Manage Prime Membership**.', 'Open **Manage Membership**, tap **End Membership**, then follow the screen.'] },
  ], note: 'These steps end the whole Prime membership. Prime Video add-on channels are billed separately.' },
  iQIYI: { checked: true, url: 'https://www.astro.com.my/support/question/how-do-i-cancel-my-iqiyi-vip-subscription', ways: [
    { tab: 'In the app', steps: ['Open the iQIYI app and go to the home page.', 'Tap **VIP subscription**.', 'Tap the gear icon **Manage VIP subscription**.', 'Tap **Cancel VIP subscription**.'] },
    APPLE, PLAY,
  ], note: 'If Astro bills you, contact Astro support (WhatsApp +603 9543 3838).' },
  'Apple Music': { checked: true, url: APPLE_URL, ways: [APPLE, { tab: 'Android', steps: ['Go to **account.apple.com** and sign in with your Apple Account.', 'Open the subscriptions section and follow the screen.'] }] },
  'Apple TV+': { checked: true, url: APPLE_URL, ways: [APPLE, { tab: 'Android', steps: ['Go to **account.apple.com** and sign in with your Apple Account.', 'Open the subscriptions section and follow the screen.'] }] },
  iCloud: { checked: true, url: APPLE_URL, ways: [APPLE] },
  'Google One': { checked: true, url: 'https://support.google.com/googleone/answer/9056360', ways: [
    { tab: 'Android', steps: ['Open the **Google One** app and tap **Menu**, then **Settings**.', 'Tap **Cancel membership** and confirm.'] },
    { tab: 'iPhone (Apple)', steps: ['Open **Settings**, tap your name, then **Subscriptions**.', 'Tap **Google One**, then **Cancel Subscription**.'] },
  ], note: 'Benefits end when the billing period ends. Storage plans are usually not refundable.' },
  'GitHub Copilot': { checked: true, url: 'https://docs.github.com/en/copilot/how-tos/manage-your-account/view-and-change-your-copilot-plan', ways: [
    { tab: 'Website', steps: ['On github.com tap your profile picture, then **Settings**.', 'Open **Billing & licensing**, then **Licensing**.', 'In the Copilot section open **Manage subscription**, then **Cancel subscription**, and confirm.'] },
  ], note: 'If you get Copilot free as a student or through a company, you cannot cancel it here.' },
  Dropbox: { checked: true, url: 'https://help.dropbox.com/plans/downgrade-dropbox-individual-plans', ways: [
    { tab: 'Website', steps: ['Sign in at **dropbox.com**.', 'Click your picture at the bottom left, then **Manage account**.', 'Scroll down and click **Cancel plan**.', 'Pick a reason and confirm. You should get an e-mail saying the plan will not renew.'] },
    { tab: 'Bought on a phone', steps: ['If you do not see **Cancel plan**, you probably bought it on a phone.', 'Cancel in the store on that phone (the Apple or Google Play steps).'] },
  ] },
  'Microsoft 365': { checked: true, url: 'https://support.microsoft.com/help/46e2634c-c64b-4c65-94b9-2cc9c960e91b', ways: [
    { tab: 'Website', steps: ['Go to **account.microsoft.com/services/microsoft365** and sign in.', 'Tap **Cancel subscription** (it may say Upgrade or Cancel).', 'At the bottom choose **I don\'t want my subscription**.'] },
    { tab: 'Bought in a store', steps: ['If you bought it through Apple or Google Play, cancel with that store.', 'If you bought it from a shop such as Amazon, contact that shop.'] },
  ], note: 'If you see Turn on recurring billing instead, it already ends on the date shown and will not renew.' },
  'Xbox Game Pass': { checked: true, url: 'https://support.microsoft.com/help/4028425', ways: [
    { tab: 'Website', steps: ['Go to **account.microsoft.com/services** and sign in.', 'Find Game Pass and tap **Manage**.', 'Tap **Cancel** (or Upgrade or Cancel) and follow the screen.'] },
  ], note: 'If you see Turn on recurring billing instead, it already ends on the date shown and will not renew.' },
  'PlayStation Plus': { checked: true, url: 'https://www.playstation.com/en-us/support/subscriptions/cancel-playstation-plus/', ways: [
    { tab: 'Website', steps: ['Sign in to Account Management on the PlayStation website.', 'Tap **Subscription** in the left menu.', 'Tap **Cancel Subscription** next to PlayStation Plus.'] },
    { tab: 'PS5', steps: ['Go to **Settings**, then **Users and Accounts**.', 'Open **Account**, **Payment and Subscriptions**, then **Subscriptions**.', 'Pick **PlayStation Plus** and tap **Cancel Subscription**.'] },
    { tab: 'PS4', steps: ['Go to **PlayStation Plus**, then **Manage Membership**, then **Subscription**.', 'Tap **Cancel Subscription**.'] },
  ], note: 'You keep your benefits until the current period ends.' },
  'Nintendo Online': { checked: true, url: 'https://nintendo.com/au/support/articles/how-to-turn-off-the-auto-renewal-settings-for-nintendo-switch-online', ways: [
    { tab: 'Website', steps: ['Go to **accounts.nintendo.com/portal** and sign in.', 'Open the **Nintendo Switch Online** section.', 'Choose **Terminate automatic renewal** and confirm.'] },
    { tab: 'On the Switch', steps: ['Open **Nintendo eShop** and choose your account.', 'Tap your user icon at the top right to open Account Information.', 'Select **Nintendo Switch Online** and end the automatic renewal.'] },
  ], note: 'Once automatic renewal is ended it cannot be turned back on. Payment is taken 48 hours before the pass ends, so do it before then.' },
  Adobe: { checked: true, url: 'https://helpx.adobe.com/creative-cloud/help/cancel-membership.html', ways: [
    { tab: 'Website', steps: ['Sign in at **account.adobe.com/plans**.', 'Tap **Manage plan** on the plan you want to end.', 'Tap **Cancel your plan**, then **Continue to cancel**.', 'Pick a reason, then tap **Confirm cancellation**.'] },
  ], note: 'Each plan is cancelled separately. If Apple, Google or Microsoft bills you, cancel there. Most plans give a full refund within 14 days of the first purchase.' },
  Notion: { checked: true, url: 'https://www.notion.com/help/upgrade-or-downgrade-your-plan', ways: [
    { tab: 'Website', steps: ['Open the sidebar and go to **Settings**, then **Billing**, then **Change plan**.', 'Pick the plan you want to switch to and tap **Continue**.', 'Give feedback, then tap **Downgrade**.'] },
    { tab: 'Billed by Apple or Google', steps: ['Notion cannot change these plans.', 'Cancel in the Apple App Store or Google Play.'] },
  ], note: 'You keep your paid features until the end of the billing period.' },
};

/** Services we could not check on their own pages: only the steps everyone shares, plus an honest note. */
export const GENERIC: Guide = {
  checked: false,
  ways: [
    { tab: 'In the service', steps: ['Sign in to the service in its app or website.', 'Look for **Account**, **Settings**, **Membership** or **Subscription**.', 'Choose **Cancel** and follow the screen. Keep the confirmation e-mail.'] },
    APPLE, PLAY,
  ],
  note: 'We have not checked this service\'s own steps, so the first tab is a general guide. If you cannot find it, look at the service\'s help page or contact its support.',
};

export const guideFor = (name: string, matched: string | null): Guide => GUIDES[name] || (matched && GUIDES[matched]) || GENERIC;
export const hasCheckedGuide = (name: string, matched: string | null) => !!(GUIDES[name] || (matched && GUIDES[matched]));
export { APPLE_URL, PLAY_URL };
