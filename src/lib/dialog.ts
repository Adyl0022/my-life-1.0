import { Alert, Platform } from 'react-native';

// Alert.alert with buttons does nothing on the web version, so confirmations (Leave, Delete...) never appeared there.
// This works on the phone and on the web: on the web it uses the browser's own confirm / message box.
type B = { text?: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void };
export function showAlert(title: string, message?: string, buttons?: B[]) {
  if (Platform.OS !== 'web') { Alert.alert(title, message, buttons as any); return; }
  const w: any = globalThis;
  const list = buttons && buttons.length ? buttons : [{ text: 'OK' }];
  const act = list.find((b) => b.style !== 'cancel');
  const text = message ? title + '\n\n' + message : title;
  if (list.length > 1 && list.some((b) => b.style === 'cancel')) { if (w.confirm(text) && act && act.onPress) act.onPress(); }
  else { w.alert(text); if (act && act.onPress) act.onPress(); }
}
