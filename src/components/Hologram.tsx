import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Image, Pressable } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Region, REGIONS } from '../lib/twin';

// The flat hologram: the same body as the 3D one, drawn as a picture, with tap zones. Used when 3D is off or not available.
const IMG = require('../../assets/body2d.png');
const VW = 540, VH = 560, FLOOR = 60;

export function Hologram({ w, sel, onPick, glow, reduce }: { w: number; sel: Region; onPick: (r: Region) => void; glow: number; reduce: boolean }) {
  const sc = w / VW; const H = (VH + FLOOR) * sc;
  const scan = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) { scan.setValue(0.5); return; }
    const a = Animated.loop(Animated.timing(scan, { toValue: 1, duration: 3600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }));
    a.start(); return () => { a.stop(); };
  }, [reduce]);
  const on = (r: Region) => sel === r;
  const col = (r: Region) => REGIONS.find((x) => x.k === r)!.c;
  const mus = col('muscles'); const mo = on('muscles') ? 0.5 : 0.1; const ms = on('muscles') ? 1.6 : 0.8;
  // Tap zones are plain React Native views (no touchable SVG), placed over the picture in the same 540x600 space.
  const Z = ({ r, x, y, ww, hh, rad, fo, sw }: { r: Region; x: number; y: number; ww: number; hh: number; rad: number; fo: number; sw: number }) => (
    <Pressable onPress={() => onPick(r)} style={{ position: 'absolute', left: x * sc, top: y * sc, width: ww * sc, height: hh * sc, borderRadius: rad * sc, borderWidth: sw, borderColor: col(r), backgroundColor: col(r) + Math.round(fo * 255).toString(16).padStart(2, '0') }} />
  );
  return (
    <View style={{ width: w, height: H, alignSelf: 'center' }}>
      <Image source={IMG} resizeMode="stretch" style={{ position: 'absolute', left: 0, top: 0, width: w, height: VH * sc, opacity: 0.55 + 0.45 * glow }} />
      <Svg pointerEvents="none" width={w} height={H} viewBox={'0 0 ' + VW + ' ' + (VH + FLOOR)} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Ellipse cx="270" cy="578" rx="200" ry="22" fill="none" stroke="#5ee7df" strokeOpacity="0.6" strokeWidth="2" />
        <Ellipse cx="270" cy="578" rx="150" ry="16" fill="none" stroke="#7c9cff" strokeOpacity="0.6" strokeWidth="2" />
        <Ellipse cx="270" cy="578" rx="100" ry="11" fill="none" stroke="#b794ff" strokeOpacity="0.7" strokeWidth="2" />
        <Ellipse cx="270" cy="578" rx="50" ry="6" fill="#5ee7df" fillOpacity="0.25" />
      </Svg>
      <Pressable onPress={() => onPick('body')} style={{ position: 'absolute', left: 0, top: 0, width: w, height: VH * sc }} />
      <Z r="muscles" x={316} y={103} ww={120} hh={58} rad={26} fo={mo} sw={ms} />
      <Z r="muscles" x={102} y={103} ww={120} hh={58} rad={26} fo={mo} sw={ms} />
      <Z r="muscles" x={218} y={262} ww={50} hh={110} rad={22} fo={mo} sw={ms} />
      <Z r="muscles" x={272} y={262} ww={50} hh={110} rad={22} fo={mo} sw={ms} />
      <Z r="lungs" x={237} y={148} ww={26} hh={50} rad={13} fo={on('lungs') ? 0.6 : 0.3} sw={on('lungs') ? 2 : 1.2} />
      <Z r="lungs" x={277} y={148} ww={26} hh={50} rad={13} fo={on('lungs') ? 0.6 : 0.3} sw={on('lungs') ? 2 : 1.2} />
      <Z r="heart" x={268} y={168} ww={24} hh={26} rad={12} fo={on('heart') ? 0.85 : 0.5} sw={on('heart') ? 2 : 1.2} />
      <Z r="brain" x={250} y={51} ww={40} hh={34} rad={17} fo={on('brain') ? 0.7 : 0.35} sw={on('brain') ? 2 : 1.2} />
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: w * 0.1, right: w * 0.1, top: 0, height: 36 * sc * 1.6, transform: [{ translateY: scan.interpolate({ inputRange: [0, 1], outputRange: [0, VH * sc - 36 * sc * 1.6] }) }] }}>
        <LinearGradient colors={['rgba(94,231,223,0)', 'rgba(94,231,223,.4)', 'rgba(94,231,223,0)']} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}
