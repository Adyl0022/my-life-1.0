// The Google Play edition has no activation code. Everyone can open the app, and some features need the yearly subscription.
// The GitHub edition (default) keeps the activation code, so every signed-in user there already has everything.
// The Play build sets EXPO_PUBLIC_EDITION=play.
export const FREEMIUM = process.env.EXPO_PUBLIC_EDITION === 'play';
// Closed-testing builds on Google Play set EXPO_PUBLIC_PLAY_TESTING=1, which opens every feature for the testers
// while the real subscription is still being connected. The final public build leaves it unset.
export const PLAY_TESTING = process.env.EXPO_PUBLIC_PLAY_TESTING === '1';
