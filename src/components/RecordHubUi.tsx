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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, zIndex: 2, elevation: 2 }}>
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

// Top banner of My Record: same shape as the Daily Planner banner, in this page's pink and violet.
export function Intro({ title, text }: { title: string; text: string }) {
  return (
    <View style={{ marginTop: 16, borderRadius: 26, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}>
      <View style={{ borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)', borderTopColor: 'rgba(255,255,255,.5)' }}>
        <LinearGradient colors={['rgba(255,143,171,.5)', 'rgba(150,120,255,.42)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 18, paddingVertical: 20 }}>
          <Svg width={150} height={150} viewBox="0 0 150 150" pointerEvents="none" style={{ position: 'absolute', right: -34, top: -40 }}>
            <G fill="none" stroke="#fff" strokeOpacity={0.22} strokeWidth={1.2}>
              <Circle cx={75} cy={75} r={70} /><Circle cx={75} cy={75} r={52} strokeDasharray="3 5" /><Circle cx={75} cy={75} r={34} />
            </G>
          </Svg>
          <Text style={{ color: W, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 }}>{title}</Text>
          <Text style={{ color: 'rgba(255,255,255,.82)', fontSize: 14, marginTop: 4 }}>{text}</Text>
        </LinearGradient>
      </View>
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
    <Pressable onPress={onPress} accessibilityLabel={'Open ' + title} style={({ pressed }) => ({ marginTop: 14, marginBottom: 2, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <View style={{ borderRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.26, shadowRadius: 8, elevation: 5 }}>
      <View style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)', borderTopColor: 'rgba(255,255,255,.45)', borderBottomColor: 'rgba(0,0,0,.2)' }}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 112, paddingHorizontal: 16, justifyContent: 'center' }}>
          <LinearGradient colors={['rgba(255,255,255,.1)', 'rgba(255,255,255,0)']} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 44 }} />
          <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,.12)']} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 30 }} />
          <Pat kind={pat} />
          <Text style={{ position: 'absolute', right: -4, bottom: -10, fontSize: 80, opacity: 0.2, transform: [{ rotate: '-10deg' }] }}>{e}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, zIndex: 2, elevation: 2 }}>
            <GlassTile><Text style={{ fontSize: 27 }}>{e}</Text></GlassTile>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: W, fontSize: 18, fontWeight: '800', letterSpacing: -0.2 }}>{title}</Text>
              <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.82)', fontSize: 12, marginTop: 3 }}>{sub}</Text>
            </View>
            <Chev />
          </View>
        </LinearGradient>
      </View>
      </View>
    </Pressable>
  );
}

// My Vehicle: dark rose gold, circuit-board lines and a glass speedometer tile.
export function VehicleCard({ onPress }: { onPress: () => void }) {
  const gold = '#ffe3c2';
  return (
    <Pressable onPress={onPress} accessibilityLabel="Open My Vehicle" style={({ pressed }) => ({ marginTop: 14, marginBottom: 2, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
      <View style={{ borderRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.26, shadowRadius: 8, elevation: 5 }}>
      <View style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.28)', borderTopColor: 'rgba(255,255,255,.45)', borderBottomColor: 'rgba(0,0,0,.2)' }}>
        <LinearGradient colors={['#8c5468', '#5b2d4e', '#2d1840']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 112, paddingHorizontal: 16, justifyContent: 'center' }}>
          <LinearGradient colors={['rgba(255,255,255,.1)', 'rgba(255,255,255,0)']} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 44 }} />
          <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,.12)']} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 30 }} />
          <Svg width="48%" height="100%" viewBox="0 0 160 112" preserveAspectRatio="none" style={{ position: 'absolute', right: 0, top: 0 }}>
            <Defs>
              <SvgGrad id="rd" x1="0" y1="0" x2="160" y2="0" gradientUnits="userSpaceOnUse"><Stop offset="0.15" stopColor={gold} stopOpacity={0} /><Stop offset="0.55" stopColor={gold} stopOpacity={0.62} /><Stop offset="1" stopColor={gold} stopOpacity={0.7} /></SvgGrad>
            </Defs>
            <G stroke="url(#rd)" strokeWidth={1.2} fill="none">
              <Path d="M0 20H50L64 34H110L124 20H160" /><Path d="M0 56H40L52 68H96L108 56H160" /><Path d="M0 92H60L72 80H120L132 92H160" /><Path d="M80 0V34M80 112V80M140 34V56M30 56V20" />
            </G>
            <G fill="url(#rd)">
              <Circle cx={50} cy={20} r={2.5} /><Circle cx={110} cy={34} r={2.5} /><Circle cx={96} cy={68} r={2.5} /><Circle cx={72} cy={80} r={2.5} /><Circle cx={140} cy={56} r={2.5} /><Circle cx={80} cy={34} r={2.5} />
            </G>
          </Svg>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, zIndex: 2, elevation: 2 }}>
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
