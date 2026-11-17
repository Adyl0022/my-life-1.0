import React from 'react';
import { View, Pressable, Modal, ScrollView, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Text } from './Txt';
import { useSmartChat, SMART_MB, PLUS_MB, GEMMA_MB } from '../lib/llm';

// The "Smart chat Pro" (Gemma 4) button: gold, with a crown and a small SMARTEST tag, so it reads as the top choice.
function ProButton({ onPress, title, sub, top }: { onPress: () => void; title: string; sub: string; top: number }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={{ marginTop: top }}>
      <LinearGradient colors={['#ffe08a', '#ffb547']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 18, padding: 1.5 }}>
        <View style={{ borderRadius: 16.5, backgroundColor: '#241d3a', paddingVertical: 11, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <LinearGradient colors={['#ffe08a', '#ffb547']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" fill="#4a2f00" stroke="#4a2f00" strokeWidth={1.2} strokeLinejoin="round" /><Path d="M18.5 16l.8 2.1 2.2.8-2.2.8-.8 2.1-.8-2.1-2.2-.8 2.2-.8z" fill="#4a2f00" /></Svg>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={{ color: '#ffe08a', fontSize: 15, fontWeight: '800' }}>{title}</Text>
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(255,224,138,.18)', borderWidth: 1, borderColor: 'rgba(255,224,138,.5)' }}><Text style={{ color: '#ffe08a', fontSize: 9.5, fontWeight: '900', letterSpacing: 0.8 }}>SMARTEST</Text></View>
            </View>
            <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12.5, marginTop: 3 }}>{sub}</Text>
          </View>
          <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M9 5l7 7-7 7" stroke="#ffe08a" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// 550 MB stays MB, 1600 MB reads 1.6 GB.
const sz = (mb: number) => (mb >= 1000 ? (Math.round(mb / 100) / 10) + ' GB' : mb + ' MB');

import { useOnlineAi } from '../lib/onlineAi';
import { useSession } from '../lib/auth';

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
  const [on, setOn] = useOnlineAi(); const [sess] = useSession();
  const start = async (which?: 'p' | 'g') => { setErr(''); const ok = await sc.get(which); if (!ok) setErr('The download did not finish. Check your internet and storage, then try again.'); };
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
            <View style={{ padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: on ? 'rgba(94,231,223,.55)' : 'rgba(255,255,255,.16)', marginBottom: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Online AI</Text>
                  <Text style={{ color: DIM, fontSize: 12, marginTop: 2 }}>Smarter answers, needs internet</Text>
                </View>
                <Switch value={on} onValueChange={setOn} trackColor={{ false: 'rgba(255,255,255,.2)', true: '#34d399' }} thumbColor="#fff" />
              </View>
              <Text style={{ color: 'rgba(255,255,255,.82)', fontSize: 12.5, lineHeight: 18, marginTop: 10 }}>When this is on, questions the Assistant cannot answer itself are sent over the internet to an AI service (through our server). When it is off, or the daily limit is used up, the AI on your phone answers instead.</Text>
              <View style={{ marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,190,90,.12)', borderWidth: 1, borderColor: 'rgba(255,190,90,.4)' }}>
                <Text style={{ color: '#ffd9a0', fontSize: 12.5, lineHeight: 18 }}>Please remember: what you ask leaves your phone, so do not type private details such as passwords, ID numbers or bank details. Your own data in My Life is never sent. The answer can be wrong or out of date, so check important facts with an official source. There is a daily limit, and you must be signed in.</Text>
              </View>
              {on && !sess ? <Text style={{ color: '#ffb3a0', fontSize: 12.5, marginTop: 10, lineHeight: 18 }}>You are not signed in, so Online AI cannot be used yet.</Text> : null}
            </View>
            {!sc.ok ? (
              <Text style={{ color: '#ffd9a0', fontSize: 13, lineHeight: 19 }}>Smart chat needs a newer version of the app and a phone with enough memory, so it is not available here.</Text>
            ) : (
              <>
                <Point t="Answers general questions the Assistant has no written answer for." />
                <Point t="Runs on this phone. What you ask never leaves it, and it works without internet." />
                <Point t="A small model, so it can be wrong. For religion, health, law and money it will tell you to ask a qualified person instead." />
                <Point t="It has no internet, so it does not know today's news or who holds a post now. For those it will say so." />
                <Point t={'One-time download of about ' + sz(SMART_MB) + '. Use Wi-Fi.'} />
                <Point t={'Smart chat+ (about ' + sz(PLUS_MB) + ', better sentences and Bahasa Malaysia) only appears on phones with about 6 GB of memory or more. Other phones use the ' + sz(SMART_MB) + ' Smart chat.'} />
                {sc.plusOk && <Point t="Your phone is strong enough for Smart chat+. It is slower and uses more memory." />}
                <Point t={'Smart chat Pro (Gemma 4, about ' + sz(GEMMA_MB) + ') is the smartest on-device choice. It only appears on phones with about 8 GB of memory or more, needs free space, and is slower. Use Wi-Fi. If the download stops, it can be resumed.'} />
                <View style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,190,90,.12)', borderWidth: 1, borderColor: 'rgba(255,190,90,.4)', marginBottom: 8 }}>
                  <Text style={{ flex: 1, color: '#ffd9a0', fontSize: 12.5, lineHeight: 18 }}>Please note: the AI on your phone is small. Sometimes it cannot answer correctly, and it may be wrong or give an answer that sounds sure but is not true. Check important facts, such as people, dates, numbers and news, with an official source.</Text>
                </View>
                <View style={{ marginTop: 10 }}>
                  {sc.ready ? (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18, backgroundColor: 'rgba(52,211,153,.14)', borderWidth: 1, borderColor: 'rgba(52,211,153,.45)' }}>
                        <Text style={{ flex: 1, color: '#8fe9c2', fontSize: 14, fontWeight: '800' }}>{sc.tier === 'g' ? 'Smart chat Pro (Gemma 4) is ready' : sc.tier === 'p' ? 'Smart chat+ is ready' : 'Smart chat is ready'}</Text>
                      </View>
                      {sc.plusOk && sc.tier === 's' && !sc.gemmaOk && (
                        <Pressable onPress={() => start('p')} style={{ marginTop: 12, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(94,231,223,.6)', backgroundColor: 'rgba(94,231,223,.1)' }}><Text style={{ color: '#8fe9e2', fontSize: 14, fontWeight: '800' }}>{'Upgrade to Smart chat+ · ' + sz(PLUS_MB)}</Text></Pressable>
                      )}
                      {sc.gemmaOk && sc.tier !== 'g' && <ProButton onPress={() => start('g')} title="Smart chat Pro" sub={'Upgrade · Free · Gemma 4 · ' + sz(GEMMA_MB)} top={12} />}
                      <Pressable onPress={sc.del} style={{ marginTop: 14, alignSelf: 'center', padding: 8 }}><Text style={{ color: '#ff8fab', fontSize: 13, fontWeight: '700' }}>Remove download</Text></Pressable>
                    </>
                  ) : sc.busy ? (
                    <View style={{ padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}>
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{'Downloading... ' + sc.pct + '%' + (sc.totalMB > 0 ? '  (' + sz(sc.doneMB) + ' of ' + sz(sc.totalMB) + ')' : '')}</Text>
                      <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.14)', overflow: 'hidden', marginTop: 10 }}><View style={{ height: 8, borderRadius: 4, width: sc.pct + '%', backgroundColor: '#5ee7df' }} /></View>
                      {sc.speed > 0 && <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 8 }}>{sc.speed.toFixed(1) + ' MB/s' + (sc.eta > 0 ? '  ·  about ' + (sc.eta >= 60 ? Math.ceil(sc.eta / 60) + ' min' : sc.eta + ' sec') + ' left' : '')}</Text>}
                      <Pressable onPress={sc.cancel} style={{ marginTop: 12, alignSelf: 'flex-start' }}><Text style={{ color: DIM, fontSize: 13, fontWeight: '700' }}>Cancel</Text></Pressable>
                    </View>
                  ) : (
                    <>
                    <Pressable onPress={() => start()}><LinearGradient colors={['#34d399', '#5ee7df']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#04201f', fontSize: 15, fontWeight: '800' }}>{'Download Smart chat · ' + sz(SMART_MB)}</Text></LinearGradient></Pressable>
                    {sc.plusOk && <Pressable onPress={() => start('p')} style={{ marginTop: 10, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(94,231,223,.6)', backgroundColor: 'rgba(94,231,223,.1)' }}><Text style={{ color: '#8fe9e2', fontSize: 14, fontWeight: '800' }}>{'Download Smart chat+ · ' + sz(PLUS_MB)}</Text></Pressable>}
                    {sc.gemmaOk && <ProButton onPress={() => start('g')} title="Smart chat Pro" sub={(sc.resumeMB > 0 ? 'Resume · ' + sz(sc.resumeMB) + ' of ' : 'Download · Free · Gemma 4 · ') + sz(GEMMA_MB)} top={10} />}
                    </>
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
