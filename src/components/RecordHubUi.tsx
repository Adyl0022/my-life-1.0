import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, G, Line, LinearGradient as SvgGrad, Path, Pattern, Rect, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Text } from './Txt';
import { Glass } from './Glass';
import { Blob } from './Bg';
import { W } from './Ui';
import { TOP } from '../lib/layout';

// The soft dark-pink page used by every My Record screen.
export function RecordPage({ title, sub, children, art }: { title: string; sub: string; children: React.ReactNode; art?: boolean }) {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#1b0f26' }}>
      <LinearGradient colors={['#1b0f26', '#2c1340', '#10244a']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(255,143,171,.38)" style={{ right: -100, top: -40 }} />
      <Blob size={340} color="rgba(124,156,255,.32)" style={{ left: -120, bottom: 10 }} />
      {art ? <PageArt /> : null}
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 60 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>{title}</Text>
              <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 12, marginTop: 1 }}>{sub}</Text>
            </View>
          </View>
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// A quiet pattern laid over a coloured card. kind picks the shape.
export function Pat({ kind }: { kind: 'dots' | 'lines' | 'rings' | 'grid' }) {
  const id = 'p' + kind;
  return (
    <Svg pointerEvents="none" width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: 0.55 }}>
      <Defs>
        {kind === 'dots' ? <Pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse"><Circle cx="7" cy="7" r="1.3" fill="rgba(255,255,255,.4)" /></Pattern> : null}
        {kind === 'lines' ? <Pattern id={id} width="13" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><Line x1="0" y1="0" x2="0" y2="13" stroke="rgba(255,255,255,.26)" strokeWidth="1.5" /></Pattern> : null}
        {kind === 'grid' ? <Pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse"><Line x1="0" y1="0" x2="16" y2="0" stroke="rgba(255,255,255,.2)" strokeWidth="1" /><Line x1="0" y1="0" x2="0" y2="16" stroke="rgba(255,255,255,.2)" strokeWidth="1" /></Pattern> : null}
      </Defs>
      {kind === 'rings' ? [24, 46, 68, 90].map((r) => <Circle key={r} cx="100%" cy="0" r={r} stroke="rgba(255,255,255,.28)" strokeWidth="1.5" fill="none" />) : <Rect width="100%" height="100%" fill={'url(#' + id + ')'} />}
    </Svg>
  );
}

export function ModCard({ e, title, sub, chip, colors, pat, onPress }: { e: string; title: string; sub: string; chip?: string; colors: [string, string]; pat: 'dots' | 'lines' | 'rings' | 'grid'; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={'Open ' + title} style={({ pressed }) => ({ marginTop: 14, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <View style={{ borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.26)', borderTopColor: 'rgba(255,255,255,.45)' }}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, minHeight: 124, justifyContent: 'center' }}>
          <Pat kind={pat} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <GlassTile><Text style={{ fontSize: 27 }}>{e}</Text></GlassTile>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: W, fontSize: 19, fontWeight: '800', letterSpacing: -0.2 }}>{title}</Text>
              <Text numberOfLines={2} style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, marginTop: 3, lineHeight: 17 }}>{sub}</Text>
              {chip ? <View style={{ alignSelf: 'flex-start', marginTop: 8, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(6,16,40,.38)', borderWidth: 1, borderColor: 'rgba(255,255,255,.22)' }}><Text style={{ color: W, fontSize: 11, fontWeight: '800' }}>{chip}</Text></View> : null}
            </View>
            <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 26 }}>›</Text>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

// Quiet decoration behind the hub: a faint grid at the top and dots fading up from the bottom.
function PageArt() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      <Svg width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
        <Defs>
          <Pattern id="pg" width="26" height="26" patternUnits="userSpaceOnUse"><Line x1="0" y1="0" x2="26" y2="0" stroke="rgba(255,255,255,.05)" strokeWidth="1" /><Line x1="0" y1="0" x2="0" y2="26" stroke="rgba(255,255,255,.05)" strokeWidth="1" /></Pattern>
          <Pattern id="pd" width="18" height="18" patternUnits="userSpaceOnUse"><Circle cx="9" cy="9" r="1.3" fill="rgba(255,255,255,.22)" /></Pattern>
        </Defs>
        <Rect width="100%" height="50%" fill="url(#pg)" />
        {[0, 1, 2, 3, 4, 5].map((i) => <Rect key={i} y={(64 + i * 6) + '%'} width="100%" height="6.2%" fill="url(#pd)" opacity={0.12 + i * 0.16} />)}
      </Svg>
    </View>
  );
}

export function Hero({ e, label, title }: { e: string; label: string; title: string }) {
  return (
    <View style={{ marginTop: 14, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)', borderTopColor: 'rgba(255,255,255,.45)' }}>
      <LinearGradient colors={['rgba(255,143,171,.42)', 'rgba(183,148,255,.26)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <GlassTile size={50} radius={17}><Text style={{ fontSize: 24 }}>{e}</Text></GlassTile>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#8fe9e2', fontSize: 9.5, fontWeight: '800', letterSpacing: 1 }}>{label}</Text>
          <Text numberOfLines={1} style={{ color: W, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{title}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// A raised glass tile for the icon: lighter on top, a bright rim and a soft shadow under it.
export function GlassTile({ size = 56, radius = 19, tint = 'rgba(255,255,255,.14)', rim = 'rgba(255,255,255,.4)', children }: { size?: number; radius?: number; tint?: string; rim?: string; children: React.ReactNode }) {
  return (
    <View style={{ width: size, height: size, borderRadius: radius, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 9, elevation: 7 }}>
      <View style={{ flex: 1, borderRadius: radius, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: tint, borderWidth: 1, borderColor: rim, borderTopColor: 'rgba(255,255,255,.7)' }}>
        <LinearGradient colors={['rgba(255,255,255,.36)', 'rgba(255,255,255,.04)']} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: 4, right: 4, top: 2, height: size * 0.38, borderRadius: radius, backgroundColor: 'rgba(255,255,255,.12)' }} />
        {children}
      </View>
    </View>
  );
}

export function Chev() {
  return <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,.35)' }}><Text style={{ color: W, fontSize: 20, marginTop: -2 }}>›</Text></View>;
}

// Documents and Personal Collection: gradient, a pattern, a big faint picture and the icon tile.
export function PicCard({ e, title, sub, colors, pat, onPress }: { e: string; title: string; sub: string; colors: [string, string]; pat: 'dots' | 'lines' | 'rings' | 'grid'; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={'Open ' + title} style={({ pressed }) => ({ marginTop: 12, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <View style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)', borderTopColor: 'rgba(255,255,255,.5)' }}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 112, paddingHorizontal: 16, justifyContent: 'center' }}>
          <Pat kind={pat} />
          <Text style={{ position: 'absolute', right: -4, bottom: -10, fontSize: 80, opacity: 0.2, transform: [{ rotate: '-10deg' }] }}>{e}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <GlassTile><Text style={{ fontSize: 27 }}>{e}</Text></GlassTile>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: W, fontSize: 18, fontWeight: '800', letterSpacing: -0.2 }}>{title}</Text>
              <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.82)', fontSize: 12, marginTop: 3 }}>{sub}</Text>
            </View>
            <Chev />
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

// My Vehicle: rose gold, a road running to the horizon and a glass speedometer tile.
export function VehicleCard({ onPress }: { onPress: () => void }) {
  const gold = '#ffe3c2';
  return (
    <Pressable onPress={onPress} accessibilityLabel="Open My Vehicle" style={({ pressed }) => ({ marginTop: 12, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <View style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)', borderTopColor: 'rgba(255,255,255,.5)' }}>
        <LinearGradient colors={['#bb7189', '#82416a', '#472454']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 112, paddingHorizontal: 16, justifyContent: 'center' }}>
          <Svg width="55%" height="100%" viewBox="0 0 120 112" preserveAspectRatio="none" style={{ position: 'absolute', right: 0, top: 0 }}>
            <Defs>
              <SvgGrad id="rd" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse"><Stop offset="0" stopColor={gold} stopOpacity={0} /><Stop offset="0.55" stopColor={gold} stopOpacity={0.62} /><Stop offset="1" stopColor={gold} stopOpacity={0.68} /></SvgGrad>
            </Defs>
            <G stroke="url(#rd)" strokeWidth={1.5} fill="none">
              <Path d="M120 56 L0 56" /><Path d="M120 56 L0 20" /><Path d="M120 56 L0 92" /><Path d="M120 56 L40 0" /><Path d="M120 56 L40 112" /><Path d="M70 0V112" /><Path d="M40 0V112" />
            </G>
          </Svg>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <GlassTile rim="rgba(255,227,194,.55)">
              <Svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#fff1dc" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3.8 17.5a9 9 0 1 1 16.4 0" /><Path d="M12 16L15.8 9.6" /><Circle cx={12} cy={16.3} r={1.4} /><Path d="M6.2 12.4l1 .6M9 8.4l.6 1M15 8.4l-.6 1M17.8 12.4l-1 .6M12 6.4v1.2" />
              </Svg>
            </GlassTile>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: W, fontSize: 18, fontWeight: '800', letterSpacing: -0.2 }}>My Vehicle</Text>
              <Text numberOfLines={1} style={{ color: 'rgba(255,236,214,.85)', fontSize: 12, marginTop: 3 }}>Mileage, service and road tax</Text>
            </View>
            <Chev />
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

export function TipStrip({ text }: { text: string }) {
  return (
    <View style={{ marginTop: 28, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' }}>
      <Text style={{ fontSize: 22 }}>💡</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#8fe9e2', fontSize: 9.5, fontWeight: '800', letterSpacing: 1 }}>TIP</Text>
        <Text style={{ color: W, fontSize: 12.5, fontWeight: '700', marginTop: 2, lineHeight: 17 }}>{text}</Text>
      </View>
    </View>
  );
}
