import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export function Glass({ style, children, radius = 24, blur = 30 }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode; radius?: number; blur?: number }) {
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden', zIndex: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' }, style]}>
      <BlurView intensity={blur} tint="default" pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
      <LinearGradient colors={['rgba(255,255,255,.16)', 'rgba(255,255,255,.05)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
      {children}
    </View>
  );
}
