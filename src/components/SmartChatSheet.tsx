import React from 'react';
import { View, Pressable, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Text } from './Txt';
import { useSmartChat, SMART_MB } from '../lib/llm';

const DIM = 'rgba(255,255,255,.7)';
const Spark = ({ s = 24, c = '#06281c' }: { s?: number; c?: string }) => (
  <Svg width={s} height={s} viewBox="0 0 24 24"><Path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" stroke={c} strokeWidth={1.8} fill="none" strokeLinejoin="round" /><Path d="M18.5 16l.8 2.1 2.2.8-2.2.8-.8 2.1-.8-2.1-2.2-.8 2.2-.8z" stroke={c} strokeWidth={1.4} fill="none" strokeLinejoin="round" /></Svg>
);
const Point = ({ t }: { t: string }) => (
  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(52,211,153,.22)', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}><Svg width={12} height={12} viewBox="0 0 24 24"><Path d="M5 12.5l4.5 4.5L19 7" stroke="#8fe9c2" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg></View>
    <Text style={{ flex: 1, color: 'rgba(255,255,255,.86)', fontSize: 13, lineHeight: 19 }}>{t}</Text>
  </View>
);

// Smart chat: a small AI model on the phone for questions the Assistant has no written answer for.
export function SmartChatSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const sc = useSmartChat(); const [err, setErr] = React.useState('');
  const start = async () => { setErr(''); const ok = await sc.get(); if (!ok) setErr('The download did not finish. Check your internet and storage, then try again.'); };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(5,8,28,.74)', justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} accessibilityLabel="Close" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <View style={{ maxHeight: '86%', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(255,255,255,.22)', backgroundColor: '#151a4a' }}>
          <LinearGradient colors={['#1d1856', '#151a4a', '#0e2650']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <LinearGradient colors={['rgba(94,231,223,.22)', 'rgba(94,231,223,0)']} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 140 }} />
          <View style={{ alignItems: 'center', paddingTop: 10 }}><View style={{ width: 42, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.28)' }} /></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14 }}>
            <LinearGradient colors={['#34d399', '#5ee7df']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Spark /></LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>Smart chat</Text>
              <Text style={{ color: DIM, fontSize: 12, marginTop: 2 }}>Beta · general questions, on your phone</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' }}><Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Close</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 34, paddingTop: 4 }} showsVerticalScrollIndicator={false}>
            {!sc.ok ? (
              <Text style={{ color: '#ffd9a0', fontSize: 13, lineHeight: 19 }}>Smart chat needs a newer version of the app and a phone with enough memory, so it is not available here.</Text>
            ) : (
              <>
                <Point t="Answers general questions the Assistant has no written answer for." />
                <Point t="Runs on this phone. What you ask never leaves it, and it works without internet." />
                <Point t="A small model, so it can be wrong. For religion, health, law and money it will tell you to ask a qualified person instead." />
                <Point t={'One-time download of about ' + SMART_MB + ' MB. Use Wi-Fi.'} />
                <View style={{ marginTop: 10 }}>
                  {sc.ready ? (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18, backgroundColor: 'rgba(52,211,153,.14)', borderWidth: 1, borderColor: 'rgba(52,211,153,.45)' }}>
                        <Text style={{ flex: 1, color: '#8fe9c2', fontSize: 14, fontWeight: '800' }}>Smart chat is ready</Text>
                      </View>
                      <Pressable onPress={sc.del} style={{ marginTop: 14, alignSelf: 'center', padding: 8 }}><Text style={{ color: '#ff8fab', fontSize: 13, fontWeight: '700' }}>Remove download</Text></Pressable>
                    </>
                  ) : sc.busy ? (
                    <View style={{ padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{'Downloading... ' + sc.pct + '%'}</Text>
                      <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.14)', overflow: 'hidden', marginTop: 10 }}><View style={{ height: 8, borderRadius: 4, width: sc.pct + '%', backgroundColor: '#5ee7df' }} /></View>
                      <Pressable onPress={sc.cancel} style={{ marginTop: 12, alignSelf: 'flex-start' }}><Text style={{ color: DIM, fontSize: 13, fontWeight: '700' }}>Cancel</Text></Pressable>
                    </View>
                  ) : (
                    <Pressable onPress={start}><LinearGradient colors={['#34d399', '#5ee7df']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#04201f', fontSize: 15, fontWeight: '800' }}>{'Download Smart chat · ' + SMART_MB + ' MB'}</Text></LinearGradient></Pressable>
                  )}
                  {!!err && <Text style={{ color: '#ffb3a0', fontSize: 12.5, marginTop: 10, lineHeight: 18 }}>{err}</Text>}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
