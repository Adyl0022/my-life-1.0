import { Platform } from 'react-native';
// In the installed web app (fullscreen) there is no status-bar inset, so add breathing room at the top.
export const TOP = Platform.OS === 'web' ? 22 : 0;
