import { useName, useStored } from '../lib/store';
import { usePrayer } from '../lib/prayer';
import { useReal, persist } from '../lib/assistantData';
import React from 'react';
import { View, TextInput, ScrollView, Keyboard, Platform } from 'react-native';
import { Pressable } from '../components/Press';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Glass } from '../components/Glass';
import { Blob } from '../components/Bg';
import { OrbSvg } from '../components/Orb';
import { OrbLive } from '../components/OrbLive';
import { AssistantBase } from '../lib/assistantBase';
import { ROUTES } from '../lib/routes';
import { TOP } from '../lib/layout';
import { useAssistLang, useLangPacks, xlOk, xlLang } from '../lib/xlate';
import { AssistLangSheet, LangPickedPopup } from '../components/AssistLangCard';
import { ThinkingBubble } from '../components/ThinkingBubble';
import { RichText } from '../components/RichText';
import { ShimmerText, OrbBreath } from '../components/LiveFx';
import { smartWarm } from '../lib/llm';
import { LangWelcomeCard } from '../components/LangWelcomeCard';
import { SmartChatSheet } from '../components/SmartChatSheet';
import { getItem } from '../lib/store';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { voiceOk } from '../lib/voice';

const STARS: [number, number, number, number][] = Array.from({ length: 34 }, (_, i) => [(i * 37 + 11) % 100, (i * 53 + 7) % 96, 0.6 + ((i * 7) % 6) / 10, 0.25 + ((i * 13) % 6) / 10]);
const stroke = { stroke: '#fff', strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

class Chat extends AssistantBase {
  scrollRef: any = null;
  note = '';
  constructor(props: any) {
    super(props);
    (this as any).scrollRef = null;
  }
  panelRef: any = null;
  subs: any[] = [];
  kb = 0;
  kbOpen = false;
  componentDidMount() {
    (this as any).weekly();
    try { smartWarm(); } catch (e) { /* the AI on the phone is optional */ }
    getItem('ml_sm_no', false).then((v: any) => { if (v) (this as any).setState({ smNo: true }); });
    getItem('ml_xl_nosug', false).then((v: any) => { if (v) (this as any).setState({ xlNo: true }); });
    if (Platform.OS === 'web') return;
    const set = (n: number) => { this.kb = n; (this as any).setState({ kbLift: n }); };
    // Work out how far the input bar must rise. The bar's own current lift is added back, so a second keyboard event
    // (the keyboard changing height, for example) can never wrongly drop the bar behind the keyboard.
    const fit = (top: number, h: number) => {
      if (this.panelRef && this.panelRef.measureInWindow) this.panelRef.measureInWindow((_x: number, y: number, _w: number, ph: number) => set(Math.max(0, Math.round(y + ph + (this.kb || 0) - top))));
      else set(h);
    };
    this.subs = [
      Keyboard.addListener('keyboardDidShow', (e: any) => {
        const top = e.endCoordinates.screenY, h = e.endCoordinates.height;
        fit(top, h);
        setTimeout(() => { if (this.kbOpen) fit(top, h); }, 120); // measure again once the layout has settled
        this.kbOpen = true;
      }),
      Keyboard.addListener('keyboardDidHide', () => { this.kbOpen = false; set(0); }),
    ];
  }
  componentWillUnmount() { this.subs.forEach((x) => x.remove()); }
  render() {
    const v: any = this.renderVals();
    const { go } = this.props as any;
    const st: any = this.state;
    const ms = st.lang === 'ms';
    const empty = st.msgs.length === 0;
    const more = !!st.more;
    // Four starter cards: the usual ones first, then any others that are left when some modules are turned off.
    const pick = [0, 4, 5, 7, 1, 6, 8, 2, 3, 9].map((id) => v.starters.find((q: any) => q.id === id)).filter(Boolean).slice(0, 4);
    const pill = (on: boolean, t: string, f: any) => (
      <Pressable key={t} onPress={f}>
        {on ? (
          <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 }}><Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '800' }}>{t}</Text></LinearGradient>
        ) : (<View style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)' }}><Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, fontWeight: '600' }}>{t}</Text></View>)}
      </Pressable>
    );
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={['rgba(11,15,46,0)', 'rgba(11,15,46,.96)', 'rgba(11,15,46,.96)']} locations={[0, 0.4, 1]} style={{ marginHorizontal: -20, marginTop: -28, paddingTop: 28, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.08)' }}>
          <Pressable onPress={() => this.props.onBack()} accessibilityLabel="Back">
            <Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <View><Svg width={20} height={20} viewBox="0 0 24 24"><Path d="M15 5l-7 7 7 7" {...stroke} /></Svg></View>
            </Glass>
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>My Life Assistant</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#34d399' }} />
              <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 11 }} numberOfLines={1}>{v.sub}</Text>
            </View>
          </View>
          {(this.props as any).tlang ? (
            <View style={{ padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)' }}>
              <LinearGradient colors={['#34d399', '#5ee7df']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 }}><Text style={{ color: '#04201f', fontSize: 11.5, fontWeight: '800' }}>{String((this.props as any).tlang).toUpperCase()}</Text></LinearGradient>
            </View>
          ) : (
          <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)' }}>
            {[['EN', v.goEn, v.l1], ['BM', v.goMs, v.l2]].map(([t, f, on]: any) => (
              <Pressable key={t} onPress={f}>
                {on === 'on' ? (
                  <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 }}><Text style={{ color: '#fff', fontSize: 11.5, fontWeight: '800' }}>{t}</Text></LinearGradient>
                ) : (<View style={{ paddingVertical: 6, paddingHorizontal: 10 }}><Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, fontWeight: '600' }}>{t}</Text></View>)}
              </Pressable>
            ))}
          </View>
          )}
        </LinearGradient>

        <ScrollView ref={(r) => { (this as any).scrollRef = r; }} style={{ flex: 1 }} contentContainerStyle={{ gap: 14, paddingBottom: 16, paddingTop: 16, flexGrow: empty ? 1 : 0 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} onContentSizeChange={() => { if (v.typD === 'flex') this.scroll(); }}>
          {empty && (
            <View style={{ flex: 1, alignItems: 'center' }}>
              {/* The orb and greeting sit in the middle of the space that is left, so the orb has room for its animation. */}
              <View style={{ flex: 1, minHeight: 270, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', paddingBottom: 16 }}>
                <OrbLive size={92} />
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginTop: 0 }}>{this.clean((ms ? 'Hai ' : 'Hi ') + this.fn())}</Text>
                <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 15, marginTop: 6, textAlign: 'center' }}>{ms ? 'Apa awak nak tahu hari ini?' : 'What would you like to know today?'}</Text>
              </View>
              {/* Small cards and the language card stay near the input, where the thumb reaches. */}
              <View style={{ alignSelf: 'stretch', gap: 10 }}>
                {[0, 2].map((i) => pick.slice(i, i + 2).length ? (
                  <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                    {pick.slice(i, i + 2).map((q: any) => (
                      <Pressable key={q.label} onPress={q.go} style={{ flex: 1 }}>
                        <Glass radius={20} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 10, minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <LinearGradient colors={gradOf(q.bg)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}>
                            <Svg width={19} height={19} viewBox="0 0 24 24"><Path d={q.d} {...stroke} /></Svg>
                          </LinearGradient>
                          <Text numberOfLines={3} style={{ flex: 1, color: '#fff', fontSize: 13, fontWeight: '700', lineHeight: 17 }}>{q.label}</Text>
                        </Glass>
                      </Pressable>
                    ))}
                    {pick.slice(i, i + 2).length === 1 ? <View style={{ flex: 1 }} /> : null}
                  </View>
                ) : null)}
              </View>
              <LangWelcomeCard
                showLang={!!xlOk}
                ms={ms}
                onLang={() => (this.props as any).onMore && (this.props as any).onMore()}
                onAI={() => (this.props as any).onSmart && (this.props as any).onSmart()}
                langName={(this.props as any).tlang ? ((xlLang((this.props as any).tlang) || { native: (this.props as any).tlang }).native) : undefined}
              />
              <Pressable onPress={() => (this as any).setState({ more: !more })} style={{ marginTop: 14, marginBottom: 6, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: 'rgba(255,255,255,.88)', fontSize: 12.5, fontWeight: '700' }}>{more ? (ms ? 'Tutup' : 'Show less') : (ms ? 'Lagi idea' : 'More ideas')}</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24"><Path d={more ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} {...stroke} strokeWidth={2.4} /></Svg>
              </Pressable>
              {more && (
                <View style={{ alignSelf: 'stretch', marginTop: 16 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {v.cats.map((c: any) => pill(c.cls === 'cat on', c.name, c.go))}
                  </View>
                  <View style={{ gap: 8, marginTop: 14 }}>
                    {v.chips.map((q: any) => (
                      <Pressable key={q.label} onPress={q.go}><Glass radius={16} style={{ paddingVertical: 12, paddingHorizontal: 16 }}><Text style={{ color: '#fff', fontSize: 13.5, fontWeight: '600' }}>{q.label}</Text></Glass></Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
          {v.msgs.map((m: any, i: number) => {
            const me = m.just === 'flex-end';
            const body = (
              <>
                {m.bigD === 'block' && (
                  <View style={{ marginBottom: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(0,0,0,.25)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}><Text style={{ color: '#fff', fontSize: 26, fontWeight: '800' }}>{m.big}</Text><Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 11.5, fontWeight: '600', flexShrink: 1 }}>{m.bigLbl}</Text></View>
                    {m.barD === 'block' && <View style={{ height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.14)', overflow: 'hidden', marginTop: 8 }}><View style={{ height: 7, borderRadius: 4, width: `${Math.min(100, m.pct)}%`, backgroundColor: m.color }} /></View>}
                  </View>
                )}
                {me ? <Text style={{ color: '#fff', fontSize: 14.5, lineHeight: 22 }}>{m.text}</Text> : <RichText text={m.text} onPick={i === v.msgs.length - 1 ? (t: string) => (this as any).ask(t) : undefined} />}
                {m.xlD === 'flex' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 }}>
                    <Pressable onPress={m.xlYes}><LinearGradient colors={['#34d399', '#5ee7df']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999 }}><Text style={{ color: '#04201f', fontSize: 13, fontWeight: '800' }}>{m.xlL}</Text></LinearGradient></Pressable>
                    <Pressable onPress={m.xlNo} hitSlop={8}><Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, fontWeight: '600' }}>Not now</Text></Pressable>
                  </View>
                )}
                {m.btnD === 'flex' && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <Pressable onPress={m.no} style={{ flex: 1, height: 38, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{m.noL}</Text></Pressable>
                    <Pressable onPress={m.yes} style={{ flex: 1.4 }}><LinearGradient colors={['#34d399', '#5ee7df']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#06281c', fontSize: 13, fontWeight: '800' }}>{m.yesL}</Text></LinearGradient></Pressable>
                  </View>
                )}
                {m.linkD === 'block' && (
                  <Pressable onPress={() => go(m.href)} style={{ marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center' }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{m.label}</Text></Pressable>
                )}
                {m.undoD === 'flex' && (
                  <Pressable onPress={m.undo} style={{ marginTop: 8, alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,.28)', backgroundColor: 'rgba(255,255,255,.08)' }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{m.undoL}</Text></Pressable>
                )}
                {m.srcD === 'flex' && (
                  <View style={{ alignSelf: 'flex-start', marginTop: 8, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: m.srcOn ? 'rgba(183,148,255,.18)' : 'rgba(143,233,226,.14)', borderWidth: 1, borderColor: m.srcOn ? 'rgba(183,148,255,.45)' : 'rgba(143,233,226,.4)' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: m.srcOn ? '#d9c8ff' : '#8fe9e2' }}>{(m.srcOn ? '☁ ' : '▣ ') + m.srcT}</Text>
                  </View>
                )}
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,.55)', marginTop: 6, textAlign: 'right' }}>{m.time}</Text>
              </>
            );
            return (
              <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', justifyContent: me ? 'flex-end' : 'flex-start' }}>
                {!me && <OrbSvg size={32} uid={'m' + i} spin={i === v.msgs.map((x: any) => !x.me).lastIndexOf(true) ? 10 : undefined} />}
                {me ? (
                  <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ maxWidth: '84%', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 20, borderBottomRightRadius: 6 }}>{body}</LinearGradient>
                ) : (
                  <Glass radius={20} style={{ maxWidth: '84%', paddingVertical: 13, paddingHorizontal: 16, borderBottomLeftRadius: 6 }}>{body}</Glass>
                )}
              </View>
            );
          })}
          {v.typD === 'flex' && (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
              <OrbBreath />
              {v.live ? (
                <Glass radius={20} style={{ maxWidth: '84%', flexShrink: 1, paddingVertical: 13, paddingHorizontal: 16, borderBottomLeftRadius: 6 }}><ShimmerText text={v.live} /></Glass>
              ) : <ThinkingBubble ms={ms} />}
            </View>
          )}
        </ScrollView>

        <View ref={(r: any) => { this.panelRef = r; }} collapsable={false} style={{ marginHorizontal: -20, paddingBottom: 16, paddingTop: 10, marginBottom: (this.state as any).kbLift || 0, backgroundColor: 'rgba(10,15,44,.94)' }}>
          {!empty && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }} style={{ flexGrow: 0 }}>
              {v.chips.map((q: any) => (
                <Pressable key={q.label} onPress={q.go}><Glass radius={16} style={{ paddingVertical: 9, paddingHorizontal: 14 }}><Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '600' }}>{q.label}</Text></Glass></Pressable>
              ))}
            </ScrollView>
          )}
          <Glass radius={26} style={{ marginHorizontal: 20, marginTop: empty ? 0 : 12, minHeight: 54, flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 18, paddingRight: 6, paddingVertical: 7, gap: 8 }}>
            <TextInput value={v.draft} onChangeText={(t) => this.setState({ draft: t })} placeholder={v.ph} placeholderTextColor="rgba(255,255,255,.5)" multiline {...(Platform.OS === 'web' ? ({ rows: 1 } as any) : {})} blurOnSubmit={false} textAlignVertical="center" style={{ flex: 1, minWidth: 0, minHeight: 40, maxHeight: 120, paddingTop: 10, paddingBottom: 10, color: '#fff', fontSize: 14, fontWeight: '600', outlineStyle: 'none' } as any} />
            {voiceOk && !(this.state as any).draft ? (
              <Pressable onPress={() => (this.props as any).onVoice && (this.props as any).onVoice()} accessibilityLabel="Talk to My Life Assistant" buzz>
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(94,231,223,.14)', borderWidth: 1, borderColor: 'rgba(143,233,226,.5)' }}>
                  <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M3 10v4M7 7v10M11 4v16M15 8v8M19 10.5v3" {...stroke} stroke="#8fe9e2" /><Path d="M21 3l.6 1.6L23 5l-1.4.5L21 7l-.6-1.5L19 5l1.4-.4z" fill="#fff" stroke="none" /></Svg>
                </View>
              </Pressable>
            ) : null}
            <Pressable onPress={v.send} accessibilityLabel="Send">
              <LinearGradient colors={['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M5 12h14M13 6l6 6-6 6" {...stroke} /></Svg>
              </LinearGradient>
            </Pressable>
          </Glass>
        </View>
      </View>
    );
  }
}
function gradOf(css: string): [string, string] {
  const m = css.match(/#[0-9a-f]{6}/gi) || ['#7c9cff', '#b794ff'];
  return [m[0], m[1] || m[0]];
}

// Reads today's prayer times only when the app already knows the place, so opening the Assistant never asks for location.
function PrayerFeed({ onTimes }: { onTimes: (p: [string, number, number][]) => void }) {
  const pr = usePrayer(true);
  const key = JSON.stringify((pr.times || []).map((t: any) => [t.name, t.h, t.m]));
  React.useEffect(() => { onTimes((pr.times || []).filter((t: any) => t.key !== 'syuruk').map((t: any) => [t.name, t.h, t.m])); }, [key]);
  return null;
}

export default function Assistant() {
  const name = useName();
  const router = useRouter();
  const [note, setNote] = React.useState('');
  const [picked, setPicked] = React.useState<string | null>(null);
  const chat = React.useRef<any>(null);
  const [P, setP] = React.useState<[string, number, number][]>([]);
  const [last] = useStored<any>('ml_prayer_last', null);
  const real = useReal(P);
  const [xl] = useAssistLang(); const packs = useLangPacks();
  // The chosen language is used only when its pack is on the phone, otherwise the Assistant keeps to English or Bahasa Malaysia.
  const tlang = xlOk && xl && packs.ready(xl) ? xl : '';
  const { live } = useLocalSearchParams<{ live?: string }>(); const liveStart = React.useRef(false); const fromDash = live === '1';
  const [voice, setVoice] = React.useState(false); const [smart, setSmart] = React.useState(false); const [sheet, setSheet] = React.useState(false); const [auto, setAuto] = React.useState('');
  // Opened from the Home card: go straight to the talking screen once the Assistant is ready.
  React.useEffect(() => { if (fromDash && real.ready && voiceOk && !liveStart.current) { liveStart.current = true; setTimeout(() => setVoice(true), 350); } }, [fromDash, real.ready]);
  const go = (h: string) => {
    const r = ROUTES[h];
    if (r) router.push(r as any); else { setNote('This screen is being built and will open here soon.'); setTimeout(() => setNote(''), 2200); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <LinearGradient colors={['#0a0f2c', '#1a1048', '#0c2b4d']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(183,148,255,.5)" style={{ right: -100, top: -40 }} />
      <Blob size={340} color="rgba(94,231,223,.3)" style={{ left: -120, bottom: 80 }} />
      <Blob size={300} color="rgba(255,143,171,.28)" style={{ left: -110, top: 150 }} />
      <Blob size={260} color="rgba(124,156,255,.35)" style={{ right: -90, top: 420 }} />
      <Svg pointerEvents="none" width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0 }}>
        {STARS.map((t, i) => <Circle key={i} cx={t[0] + '%'} cy={t[1] + '%'} r={t[2]} fill="#fff" opacity={t[3]} />)}
        <Circle cx="88%" cy="9%" r={70} stroke="rgba(255,255,255,.07)" strokeWidth={1.2} fill="none" />
        <Circle cx="88%" cy="9%" r={110} stroke="rgba(255,255,255,.05)" strokeWidth={1.2} fill="none" />
        <Circle cx="88%" cy="9%" r={150} stroke="rgba(255,255,255,.035)" strokeWidth={1.2} fill="none" />
        <Circle cx="6%" cy="70%" r={90} stroke="rgba(94,231,223,.08)" strokeWidth={1.2} fill="none" />
      </Svg>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12 + TOP }}>
        {last ? <PrayerFeed onTimes={setP} /> : null}
        {real.ready ? <Chat ref={chat} onVoice={() => setVoice(true)} tlang={tlang} onSmart={() => setSmart(true)} onMore={() => { setAuto(''); setSheet(true); }} onXl={(c: string) => { setAuto(c); setSheet(true); }} real={real} persist={persist} userName={name} onBack={() => router.back()} go={go} onScroll={() => chat.current?.scrollRef?.scrollToEnd({ animated: true })} /> : null}
        <VoiceAssistant visible={voice} chat={chat} onClose={() => { setVoice(false); if (fromDash) router.back(); }} onAI={() => { setVoice(false); setTimeout(() => setSmart(true), 300); }} onOpen={(r: string) => { setVoice(false); setTimeout(() => router.push(r as any), 250); }} />
        <SmartChatSheet visible={smart} onClose={() => setSmart(false)} />
        <AssistLangSheet visible={sheet} auto={auto} onClose={() => { setSheet(false); setAuto(''); }} onPicked={(c: string) => setPicked(c)} />
        <LangPickedPopup code={picked} onHide={() => setPicked(null)} />
        {!!note && <View style={{ position: 'absolute', left: 20, right: 20, bottom: 230, alignItems: 'center' }}><Glass radius={999} style={{ paddingVertical: 9, paddingHorizontal: 18, backgroundColor: 'rgba(20,26,70,.92)' }}><Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{note}</Text></Glass></View>}
      </SafeAreaView>
    </View>
  );
}
