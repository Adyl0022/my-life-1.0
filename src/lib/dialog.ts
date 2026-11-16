import { Platform } from 'react-native';

// Confirmation boxes (Leave, Delete...). They are drawn by the app itself (see DialogHost) so they match the dark look on the phone
// and also work on the web version, where the system Alert with buttons does nothing.
export type DialogButton = { text?: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void };
export type DialogState = { title: string; message?: string; buttons: DialogButton[] };
let listener: ((d: DialogState | null) => void) | null = null;
export const onDialog = (fn: ((d: DialogState | null) => void) | null) => { listener = fn; };

export function showAlert(title: string, message?: string, buttons?: DialogButton[]) {
  const list = buttons && buttons.length ? buttons : [{ text: 'OK' }];
  if (listener) { listener({ title, message, buttons: list }); return; }
  // fallback if the host is not mounted yet
  if (Platform.OS === 'web') {
    const w: any = globalThis; const act = list.find((b) => b.style !== 'cancel'); const text = message ? title + '\n\n' + message : title;
    if (list.length > 1 && list.some((b) => b.style === 'cancel')) { if (w.confirm(text) && act && act.onPress) act.onPress(); } else { w.alert(text); if (act && act.onPress) act.onPress(); }
  }
}
