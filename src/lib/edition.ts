// The Google Play edition has no activation code. Everyone can open the app, and some features need the yearly subscription.
// The GitHub edition (default) keeps the activation code, so every signed-in user there already has everything.
// The Play build sets EXPO_PUBLIC_EDITION=play.
export const FREEMIUM = process.env.EXPO_PUBLIC_EDITION === 'play';
