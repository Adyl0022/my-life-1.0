import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export function Glass({ style, children, radius = 24, blur = 30, solid }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode; radius?: number; blur?: number; solid?: boolean }) {
  // solid = a nearly opaque panel with no blur (clearer to read and lighter to draw than the frosted glass)
  if (solid) return <View style={[{ borderRadius: radius, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', backgroundColor: 'rgba(30,42,92,.74)' }, style]}>{children}</View>;
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden', zIndex: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' }, style]}>
      <BlurView intensity={blur} tint="default" pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
      <LinearGradient colors={['rgba(255,255,255,.16)', 'rgba(255,255,255,.05)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
      {children}
    </View>
  );
}
