// The one place the app talks to the phone's vibration. It remembers when the phone last buzzed, so a button that already
// gives its own buzz is not given a second one by the shared button (see components/Press.tsx).
import * as H from 'expo-haptics';
let last = 0;
export const lastBuzz = () => last;
export const ImpactFeedbackStyle = H.ImpactFeedbackStyle;
export const NotificationFeedbackType = H.NotificationFeedbackType;
export const impactAsync = (s?: H.ImpactFeedbackStyle) => { last = Date.now(); return H.impactAsync(s); };
export const notificationAsync = (t?: H.NotificationFeedbackType) => { last = Date.now(); return H.notificationAsync(t); };
export const selectionAsync = () => { last = Date.now(); return H.selectionAsync(); };
