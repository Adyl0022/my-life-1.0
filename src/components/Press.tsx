import React from 'react';
import { Pressable, Platform, StyleSheet, View, type PressableProps, type PressableStateCallbackType } from 'react-native';
import { impactAsync, ImpactFeedbackStyle, lastBuzz } from '../lib/haptics';

// The app's one button. It works exactly like a normal Pressable, and every press also does two things:
// the button shrinks a little while it is held, and the phone gives a short tap when it is pressed.
// A button that already buzzes by itself is not given a second buzz. Give it fx={false} to turn both off (rarely needed).
// Full-screen backdrops (a dark layer behind a pop-up) never shrink, and a button that already sets its own transform keeps it.
const covers = (f: any) => !!f && f.position === 'absolute' && f.left != null && f.right != null && f.top != null && f.bottom != null;
export const Pressable_ = React.forwardRef<View, PressableProps & { fx?: boolean }>(function Press({ onPress, style, fx = true, ...rest }, ref) {
  const press = onPress ? (e: any) => {
    const t = Date.now();
    onPress(e);
    if (fx !== false && Platform.OS !== 'web' && lastBuzz() < t) { try { impactAsync(ImpactFeedbackStyle.Light); } catch (e2) { /* no vibration on this phone */ } }
  } : undefined;
  const sty = (s: PressableStateCallbackType) => {
    const st = typeof style === 'function' ? style(s) : style;
    if (fx === false || !onPress || !s.pressed) return st;
    const f: any = StyleSheet.flatten(st) || {};
    if (f.transform || covers(f)) return st;
    return [st, { transform: [{ scale: 0.97 }] }];
  };
  return <Pressable ref={ref as any} {...rest} onPress={press} style={sty} />;
});
export { Pressable_ as Pressable };
