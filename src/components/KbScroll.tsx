import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform, ScrollView, TextInput } from 'react-native';

// A ScrollView that never lets the keyboard cover the field being typed in: it adds room under the content while the keyboard is up
// and scrolls the active field into view.
export function KbScroll({ contentContainerStyle, children, ...rest }: any) {
  const ref = useRef<any>(null);
  const y = useRef(0);
  const [kb, setKb] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e: any) => {
      const h = e?.endCoordinates?.height || 0; setKb(h);
      setTimeout(() => {
        const f: any = (TextInput as any).State?.currentlyFocusedInput?.(); if (!f || !f.measureInWindow) return;
        f.measureInWindow((_x: number, fy: number, _w: number, fh: number) => {
          const limit = Dimensions.get('window').height - h - 24; const bottom = fy + fh;
          if (bottom > limit) ref.current?.scrollTo({ y: y.current + (bottom - limit), animated: true });
        });
      }, 60);
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKb(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const base = contentContainerStyle || {};
  return (
    <ScrollView ref={ref} onScroll={(e) => { y.current = e.nativeEvent.contentOffset.y; }} scrollEventThrottle={32} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} {...rest} contentContainerStyle={{ ...base, paddingBottom: (base.paddingBottom || 0) + kb }}>
      {children}
    </ScrollView>
  );
}
