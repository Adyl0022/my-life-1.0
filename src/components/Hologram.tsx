import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Image } from 'react-native';
import Svg, { Ellipse, Path, Rect, G } from 'react-native-svg';
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
  const Hot = ({ r, children }: { r: Region; children: React.ReactNode }) => <G onPress={() => onPick(r)}>{children}</G>;
  const mus = col('muscles'); const mo = on('muscles') ? 0.5 : 0.1; const ms = on('muscles') ? 1.6 : 0.8;
  return (
    <View style={{ width: w, height: H, alignSelf: 'center' }}>
      <Image source={IMG} resizeMode="stretch" style={{ position: 'absolute', left: 0, top: 0, width: w, height: VH * sc, opacity: 0.55 + 0.45 * glow }} />
      <Svg width={w} height={H} viewBox={'0 0 ' + VW + ' ' + (VH + FLOOR)} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Ellipse cx="270" cy="578" rx="200" ry="22" fill="none" stroke="#5ee7df" strokeOpacity="0.6" strokeWidth="2" />
        <Ellipse cx="270" cy="578" rx="150" ry="16" fill="none" stroke="#7c9cff" strokeOpacity="0.6" strokeWidth="2" />
        <Ellipse cx="270" cy="578" rx="100" ry="11" fill="none" stroke="#b794ff" strokeOpacity="0.7" strokeWidth="2" />
        <Ellipse cx="270" cy="578" rx="50" ry="6" fill="#5ee7df" fillOpacity="0.25" />
        <Rect x="0" y="0" width={VW} height={VH} fill="transparent" onPress={() => onPick('body')} />
        <Hot r="muscles">
          <Rect x="316" y="103" width="120" height="58" rx="26" fill={mus} fillOpacity={mo} stroke={mus} strokeWidth={ms} />
          <Rect x="102" y="103" width="120" height="58" rx="26" fill={mus} fillOpacity={mo} stroke={mus} strokeWidth={ms} />
          <Rect x="218" y="262" width="50" height="110" rx="22" fill={mus} fillOpacity={mo} stroke={mus} strokeWidth={ms} />
          <Rect x="272" y="262" width="50" height="110" rx="22" fill={mus} fillOpacity={mo} stroke={mus} strokeWidth={ms} />
        </Hot>
        <Hot r="lungs">
          <Ellipse cx="250" cy="173" rx="13" ry="25" fill={col('lungs')} fillOpacity={on('lungs') ? 0.6 : 0.3} stroke={col('lungs')} strokeWidth={on('lungs') ? 2 : 1.2} />
          <Ellipse cx="290" cy="173" rx="13" ry="25" fill={col('lungs')} fillOpacity={on('lungs') ? 0.6 : 0.3} stroke={col('lungs')} strokeWidth={on('lungs') ? 2 : 1.2} />
        </Hot>
        <Hot r="heart"><Ellipse cx="280" cy="181" rx="12" ry="13" fill={col('heart')} fillOpacity={on('heart') ? 0.85 : 0.5} stroke={col('heart')} strokeWidth={on('heart') ? 2 : 1.2} /></Hot>
        <Hot r="brain"><Ellipse cx="270" cy="68" rx="20" ry="17" fill={col('brain')} fillOpacity={on('brain') ? 0.7 : 0.35} stroke={col('brain')} strokeWidth={on('brain') ? 2 : 1.2} /></Hot>
      </Svg>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: w * 0.1, right: w * 0.1, top: 0, height: 36 * sc * 1.6, transform: [{ translateY: scan.interpolate({ inputRange: [0, 1], outputRange: [0, VH * sc - 36 * sc * 1.6] }) }] }}>
        <LinearGradient colors={['rgba(94,231,223,0)', 'rgba(94,231,223,.4)', 'rgba(94,231,223,0)']} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}
