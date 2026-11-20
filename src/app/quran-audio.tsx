import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, TextInput, Dimensions } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Glass } from '../components/Glass';
import { LinearGradient } from 'expo-linear-gradient';
import { Header, VerseBlock, ReadBg } from '../components/IslamicUi';
import { W } from '../components/Ui';
import { SURAH_LIST, SURAH, BISMILLAH, useLang, useSize, QURAN_FONT } from '../lib/islamic';
import { useStored } from '../lib/store';
import { dlSupported, useDl, surahDone, juzDone, downloadSurah, downloadJuz, downloadAll, cancelDownload, deleteSurah, deleteAll, usage, fmtBytes, clearDlError, NET_KEY, NetPref } from '../lib/quranDl';
import { QariOpt, JUZ_NAMES, loadQaris, playSurah, playJuz, toggle, next, prev, stop, useQuranAudio, getResume, resumeLast, Resume } from '../lib/quranAudio';
import { SlidePills } from '../components/TabSlide';
import { Shine, GlowField } from '../components/Shine';
import { PlayIcon, PauseIcon, PrevIcon, NextIcon, DownloadIcon, CheckIcon, CloseIcon, SearchIcon } from '../components/AudioIcons';

import { confirmDelete } from '../lib/dialog';
const TEAL = '#7df0c6';
const Btn = ({ ic, onPress, big, label, pulse }: { ic: React.ReactNode; onPress: () => void; big?: boolean; label: string; pulse?: boolean }) => (
  <Shine label={label} hitSlop={8} onPress={onPress} pulse={pulse} radius={big ? 29 : 22} style={{ width: big ? 58 : 44, height: big ? 58 : 44, backgroundColor: big ? '#7df0c6' : 'rgba(255,255,255,.12)' }}>{ic}</Shine>
);
const RowPlay = ({ onPress }: { onPress: () => void }) => (
  <Shine label="Play" hitSlop={6} onPress={onPress} radius={19} style={{ width: 38, height: 38, backgroundColor: 'rgba(125,240,198,.16)', borderWidth: 1, borderColor: 'rgba(125,240,198,.4)' }}><PlayIcon size={17} color="#7df0c6" /></Shine>
);

const DlBtn = ({ state, pct, onPress }: { state: 'none' | 'busy' | 'done' | 'wait'; pct: number; onPress: () => void }) => (
  <Shine onPress={onPress} hitSlop={6} radius={19} disabled={state === 'done' || state === 'wait'} label={state === 'done' ? 'Saved on this phone' : state === 'busy' ? 'Cancel download' : 'Download to listen offline'} glow={state === 'busy' ? '#ffc46b' : '#7df0c6'} style={{ minWidth: 40, height: 38, paddingHorizontal: 8, backgroundColor: state === 'done' ? 'rgba(94,231,181,.3)' : 'rgba(255,255,255,.12)', opacity: state === 'wait' ? 0.4 : 1 }}>
    {state === 'busy' ? <Text style={{ color: W, fontSize: 11, fontWeight: '800' }}>{pct + '%'}</Text> : state === 'done' ? <CheckIcon size={17} color="#7df0c6" /> : <DownloadIcon size={17} color="rgba(255,255,255,.85)" />}
  </Shine>
);

export default function QuranAudio() {
  const [qid, setQid] = useStored<string>('ml_qari', 'alafasy');
  const [qs, setQs] = useState<QariOpt[] | null>(null);
  const [bad, setBad] = useState(false);
  const [tab, setTab] = useState(0);
  const [hintOff, setHintOff] = useStored<boolean>('ml_qdl_hint', false);
  const d = useDl();
  const [net, setNet] = useStored<NetPref>(NET_KEY, 'wifi');
  const pct = d.total > 0 ? Math.min(100, Math.round((d.done / d.total) * 100)) : 0;
  const [sure, setSure] = useState('');
  const a = useQuranAudio();
  const [find, setFind] = useState('');
  const [sf, setSf] = useState(false);
  const [last, setLast] = useState<Resume | null>(null);
  useEffect(() => { if (a.phase === 'idle') getResume().then((r) => setLast(r && r.title ? r : null)).catch(() => {}); }, [a.phase]);
  const [lang, setLang] = useLang(); const [size] = useSize();
  const [arOnly, setArOnly] = useState(false);
  const [text, setText] = useState(true);
  const scRef = React.useRef<any>(null); const ys = React.useRef<Record<string, number>>({});
  const load = () => { setBad(false); loadQaris().then((r) => setQs(r)).catch(() => { setBad(true); setQs(null); }); };
  useEffect(load, []);
  const avail = (qs || []).filter((q) => q.identifier);
  const cur = avail.find((q) => q.id === qid) || avail[0];
  const fq = find.trim().toLowerCase();
  const run = (f: (q: QariOpt) => void) => { if (cur) f(cur); };
  const it = a.items[a.index];
  const active = a.phase !== 'idle';
  const meta = it ? SURAH_LIST.find((x) => x.num === it.surah) : undefined;
  const info = meta ? SURAH[meta.key] : undefined;
  const follow = active && a.phase !== 'error' && text && !!info;
  const vkey = it ? it.surah + ':' + it.ayah : '';
  // Keep the verse being read in view.
  useEffect(() => { if (!follow || !it) return; const y = ys.current[vkey]; if (y !== undefined && scRef.current) scRef.current.scrollTo({ y: Math.max(0, y - Math.round(Dimensions.get('window').height * 0.3)), animated: true }); }, [vkey, follow]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <ReadBg />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Quran Audio" sub="Listen by juz or surah" />
        <ScrollView ref={scRef} style={{ marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: active ? 190 : 30, gap: 10 }}>
          {follow && info ? (
            <Glass solid radius={26} style={{ paddingHorizontal: 16, paddingVertical: 6, backgroundColor: 'rgba(46,84,116,.96)' }}>
              <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.1)' }}>
                <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2 }}>NOW READING</Text>
                <Text style={{ color: W, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{info.title}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.1)' }}>
                {([['ar', 'Arabic only'], ['ms', 'Melayu'], ['en', 'English']] as [string, string][]).map(([k, t]) => {
                  const on = k === 'ar' ? arOnly : !arOnly && lang === k;
                  return (
                    <Pressable key={k} onPress={() => { if (k === 'ar') setArOnly(true); else { setArOnly(false); setLang(k as 'ms' | 'en'); } }} style={{ paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, backgroundColor: on ? 'rgba(94,231,181,.4)' : 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: on ? TEAL : 'rgba(255,255,255,.14)' }}>
                      <Text style={{ color: W, fontSize: 12, fontWeight: '700' }}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {info.bismillah ? <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.1)' }}><Text style={{ color: W, fontSize: 24, lineHeight: 48, fontFamily: QURAN_FONT, textAlign: 'center', writingDirection: 'rtl' }}>{BISMILLAH.ar}</Text></View> : null}
              {info.verses.map((v, i) => (
                <View key={v.n} onLayout={(e) => { ys.current[info.num + ':' + v.n] = e.nativeEvent.layout.y + 90; }}>
                  <VerseBlock v={v} size={size} lang={lang} arOnly={arOnly} bleed={16} active={!!it && it.ayah === v.n} last={i === info.verses.length - 1} />
                </View>
              ))}
            </Glass>
          ) : (<>
          {last && a.phase === 'idle' && (qs || []).some((q) => q.id === last.qid && q.identifier) ? (
            <Glass solid radius={24} style={{ padding: 0, backgroundColor: '#0e2a3f', borderWidth: 1, borderColor: 'rgba(125,240,198,.35)' }}>
              <LinearGradient pointerEvents="none" colors={['rgba(125,240,198,.34)', 'rgba(94,231,223,.10)', 'rgba(124,156,255,.16)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(125,240,198,.2)', borderWidth: 1, borderColor: 'rgba(125,240,198,.5)' }}><PlayIcon size={20} color="#7df0c6" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#8fe9e2', fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4 }}>CONTINUE WHERE YOU STOPPED</Text>
                    <Text numberOfLines={1} style={{ color: W, fontSize: 17, fontWeight: '800', marginTop: 3 }}>{last.title}</Text>
                    <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.72)', fontSize: 12, marginTop: 2 }}>{last.qari + ' · ' + last.label}</Text>
                  </View>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.16)', marginTop: 14, overflow: 'hidden' }}>
                  <LinearGradient colors={['#7df0c6', '#7c9cff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: Math.max(4, Math.min(100, ((last.index + 1) / Math.max(1, last.total)) * 100)) + '%', height: 6, borderRadius: 3 }} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12.5, fontWeight: '600' }}>{'Verse ' + (last.index + 1) + ' of ' + last.total}</Text>
                  <Shine label="Continue" radius={22} onPress={() => { const q = (qs || []).find((x) => x.id === last.qid && x.identifier); if (q) resumeLast(last, q); }} style={{ flexDirection: 'row', gap: 8, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#7df0c6' }}>
                    <PlayIcon size={16} color="#06231c" /><Text style={{ color: '#06231c', fontWeight: '800', fontSize: 13.5 }}>Continue</Text>
                  </Shine>
                </View>
              </View>
            </Glass>
          ) : null}
          {dlSupported && !hintOff && usage().bytes === 0 ? (
            <Glass radius={20} style={{ padding: 14 }}>
              <Text style={{ color: W, fontSize: 13.5, fontWeight: '800' }}>Save your favourite recitations</Text>
              <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>Saved recitations play without internet, and keep working even if the online service is unavailable.</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <Pressable onPress={() => { setTab(2); setFind(''); }} style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(94,231,181,.4)', borderWidth: 1, borderColor: TEAL }}><Text style={{ color: W, fontWeight: '800', fontSize: 13 }}>Open Downloads</Text></Pressable>
                <Pressable onPress={() => setHintOff(true)} style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,107,129,.18)', borderWidth: 1, borderColor: 'rgba(255,107,129,.55)' }}><Text style={{ color: '#ffb3bf', fontWeight: '800', fontSize: 13 }}>Dismiss</Text></Pressable>
              </View>
            </Glass>
          ) : null}
          <Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>RECITER</Text>
          {bad ? (
            <Glass radius={20} style={{ padding: 14 }}>
              <Text style={{ color: '#ffd593', fontSize: 13, lineHeight: 19 }}>Could not load the reciters. Check your internet connection.</Text>
              <Pressable onPress={load} style={{ marginTop: 10, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.14)' }}><Text style={{ color: W, fontWeight: '700', fontSize: 13 }}>Try again</Text></Pressable>
            </Glass>
          ) : !qs ? <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 13 }}>Loading reciters…</Text> : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(qs || []).map((q) => {
                const on = !!cur && cur.id === q.id; const off = !q.identifier;
                return (
                  <Pressable key={q.id} disabled={off} onPress={() => setQid(q.id)} style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: on ? 'rgba(94,231,181,.4)' : 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: on ? TEAL : 'rgba(255,255,255,.14)', opacity: off ? 0.4 : 1 }}>
                    <Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{q.name}{off ? ' (not available)' : ''}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {qs && !avail.length ? <Text style={{ color: '#ffd593', fontSize: 12.5 }}>No reciter is available right now. Try again later.</Text> : null}

          {d.err ? (
            <Glass radius={22} style={{ padding: 14 }}>
              <Text style={{ color: '#ffd593', fontSize: 13, lineHeight: 19 }}>{d.err}</Text>
              <Pressable onPress={clearDlError} style={{ marginTop: 10, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.14)' }}><Text style={{ color: W, fontWeight: '700', fontSize: 13 }}>OK</Text></Pressable>
            </Glass>
          ) : null}
          <SlidePills tabs={['Juz (1 to 30)', 'Surah (1 to 114)'].concat(dlSupported ? ['Downloads'] : [])} index={tab} onChange={(i) => { setTab(i); setFind(''); }} colors={['rgba(94,231,181,.55)', 'rgba(94,231,223,.45)']} padX={16} padY={8} fontSize={12.5} style={{ marginTop: 6 }} />

          {tab < 2 ? (
            <GlowField focused={sf}>
              <SearchIcon size={18} color={sf ? '#7df0c6' : 'rgba(255,255,255,.6)'} />
              <TextInput value={find} onChangeText={setFind} onFocus={() => setSf(true)} onBlur={() => setSf(false)} placeholder={tab === 0 ? 'Search juz name or number' : 'Search surah name or number'} placeholderTextColor="rgba(255,255,255,.45)" style={{ flex: 1, color: W, fontSize: 14, paddingVertical: 11, outlineStyle: 'none' } as any} />
              {find ? <Pressable onPress={() => setFind('')} hitSlop={8} accessibilityLabel="Clear search"><CloseIcon size={16} color="rgba(255,255,255,.7)" /></Pressable> : null}
            </GlowField>
          ) : null}

          {tab === 0 ? JUZ_NAMES.map((n, i) => (
            fq && String(i + 1) !== fq && !n.toLowerCase().includes(fq) && !('juz ' + (i + 1)).includes(fq) ? null :
            <Pressable key={i} disabled={!cur} onPress={() => run((q) => playJuz(i + 1, q))}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(94,231,181,.3)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14.5, fontWeight: '700' }}>Juz {i + 1}</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 2 }}>{n}</Text></View>
                {dlSupported && cur ? <DlBtn state={juzDone(cur.id, i + 1) ? 'done' : d.busy ? (d.label === 'Juz ' + (i + 1) + ' · ' + n ? 'busy' : 'wait') : 'none'} pct={pct} onPress={() => (d.busy ? cancelDownload() : downloadJuz(cur.id, cur.identifier as string, i + 1, 'Juz ' + (i + 1) + ' · ' + n))} /> : null}
                <RowPlay onPress={() => run((q) => playJuz(i + 1, q))} />
              </View>
            </Pressable>
          )) : tab === 1 ? SURAH_LIST.map((x) => (
            fq && String(x.num) !== fq && !x.title.toLowerCase().includes(fq) && !(x.sub || '').toLowerCase().includes(fq) ? null :
            <Pressable key={x.key} disabled={!cur} onPress={() => run((q) => playSurah(x.num, x.title, q))}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(94,231,181,.3)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>{x.num}</Text></View>
                <View style={{ flex: 1, minWidth: 0 }}><Text style={{ color: W, fontSize: 14.5, fontWeight: '700' }}>{x.title}</Text><Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 2 }}>{x.sub}</Text></View>
                {dlSupported && cur ? <DlBtn state={surahDone(cur.id, x.num) ? 'done' : d.busy ? (d.label === x.title ? 'busy' : 'wait') : 'none'} pct={pct} onPress={() => (d.busy ? cancelDownload() : downloadSurah(cur.id, cur.identifier as string, x.num, x.title))} /> : null}
                <RowPlay onPress={() => run((q) => playSurah(x.num, x.title, q))} />
              </View>
            </Pressable>
          )) : (
            <View style={{ gap: 10 }}>
              <Glass radius={22} style={{ padding: 14 }}>
                <Text style={{ color: W, fontSize: 14.5, fontWeight: '800' }}>Download over</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {([['wifi', 'Wi-Fi only (recommended)'], ['any', 'Wi-Fi or mobile data']] as [NetPref, string][]).map(([k, t]) => (
                    <Pressable key={k} onPress={() => setNet(k)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: net === k ? 'rgba(94,231,181,.4)' : 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: net === k ? TEAL : 'rgba(255,255,255,.14)' }}>
                      <Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={{ color: 'rgba(255,255,255,.62)', fontSize: 11.5, lineHeight: 17, marginTop: 8 }}>Recitations are large files. Wi-Fi saves your mobile data.</Text>
              </Glass>
              {d.busy ? (
                <Glass radius={22} style={{ padding: 14 }}>
                  <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>Downloading {d.label}</Text>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.12)', marginTop: 10, overflow: 'hidden' }}><View style={{ width: pct + '%', height: 8, backgroundColor: TEAL }} /></View>
                  <Pressable onPress={cancelDownload} style={{ marginTop: 10, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.14)' }}><Text style={{ color: W, fontWeight: '700', fontSize: 13 }}>{d.stopping ? 'Stopping…' : 'Cancel'}</Text></Pressable>
                </Glass>
              ) : null}
              <Glass radius={22} style={{ padding: 14 }}>
                <Text style={{ color: W, fontSize: 14.5, fontWeight: '800' }}>Saved on this phone</Text>
                <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 3 }}>{'All reciters: ' + fmtBytes(usage().bytes)}</Text>
                {cur ? <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 2 }}>{cur.name + ': ' + fmtBytes(usage(cur.id).bytes)}</Text> : null}
                {cur && !d.busy ? (
                  <Pressable onPress={() => setSure(sure === 'all' ? '' : 'all')} style={{ marginTop: 10, alignSelf: 'flex-start', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(94,231,181,.4)' }}><Text style={{ color: W, fontWeight: '800', fontSize: 13 }}>Download the whole Quran</Text></Pressable>
                ) : null}
                {sure === 'all' && cur ? (
                  <View style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,196,107,.14)', borderWidth: 1, borderColor: 'rgba(255,196,107,.4)' }}>
                    <Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>Download all 114 surahs?</Text>
                    <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 12.5, lineHeight: 18, marginTop: 3 }}>{'This is the full recitation by ' + cur.name + '. It is a large download (it can be hundreds of MB) and takes a while. Wi-Fi is recommended. You can cancel any time and delete it later here.'}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <Pressable onPress={() => setSure('')} style={{ flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center' }}><Text style={{ color: W, fontWeight: '700', fontSize: 13 }}>Cancel</Text></Pressable>
                      <Pressable onPress={() => { setSure(''); downloadAll(cur.id, cur.identifier as string, SURAH_LIST.map((x) => x.title)); }} style={{ flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: '#7df0c6', alignItems: 'center' }}><Text style={{ color: '#06231c', fontWeight: '800', fontSize: 13 }}>Download</Text></Pressable>
                    </View>
                  </View>
                ) : null}
              </Glass>
              {cur && usage(cur.id).surahs.length ? (
                <Glass radius={22} style={{ paddingHorizontal: 14, paddingVertical: 4 }}>
                  {usage(cur.id).surahs.map((u, i) => {
                    const m = SURAH_LIST.find((x) => x.num === u.s);
                    return (
                      <View key={u.s} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: 'rgba(255,255,255,.1)' }}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text numberOfLines={1} style={{ color: W, fontSize: 14, fontWeight: '700' }}>{u.s + '. ' + (m ? m.title : 'Surah')}</Text>
                          <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 11.5, marginTop: 1 }}>{fmtBytes(u.bytes) + (u.total === 0 ? ' · part of a juz' : u.have < u.total ? ' · partly saved (' + u.have + '/' + u.total + ')' : '')}</Text>
                        </View>
                        <Pressable onPress={() => confirmDelete('this download', () => deleteSurah(cur.id, u.s), { title: 'Delete this download?', message: 'You can download it again later.' })} hitSlop={6} style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.1)' }}><Text style={{ color: '#ff9aa9', fontSize: 12.5, fontWeight: '800' }}>Delete</Text></Pressable>
                      </View>
                    );
                  })}
                </Glass>
              ) : <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 12.5, lineHeight: 18 }}>{cur ? 'Nothing saved for ' + cur.name + ' yet. Tap ⬇ next to a surah or juz to save it. Saved recitations keep working without internet or if the online service is unavailable.' : ''}</Text>}
              {usage().bytes > 0 && !d.busy ? (
                <Pressable onPress={() => setSure(sure === 'del' ? '' : 'del')} style={{ alignSelf: 'flex-start', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.1)' }}><Text style={{ color: '#ff9aa9', fontWeight: '800', fontSize: 13 }}>Delete all downloads</Text></Pressable>
              ) : null}
              {sure === 'del' ? (
                <Glass radius={22} style={{ padding: 14 }}>
                  <Text style={{ color: W, fontSize: 13, fontWeight: '800' }}>Delete every saved recitation?</Text>
                  <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 12.5, lineHeight: 18, marginTop: 3 }}>{'This frees ' + fmtBytes(usage().bytes) + ' on this phone. You can still stream them with internet.'}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <Pressable onPress={() => setSure('')} style={{ flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center' }}><Text style={{ color: W, fontWeight: '700', fontSize: 13 }}>Cancel</Text></Pressable>
                    <Pressable onPress={() => { setSure(''); deleteAll(); }} style={{ flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: '#ff9aa9', alignItems: 'center' }}><Text style={{ color: '#2a0710', fontWeight: '800', fontSize: 13 }}>Delete all</Text></Pressable>
                  </View>
                </Glass>
              ) : null}
            </View>
          )}

          <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, lineHeight: 16, marginTop: 8 }}>Audio streams over the internet by default. Tap ⬇ to save a surah or juz on this phone and listen offline; saved audio stays on this phone only and can be deleted in Downloads. The recitations come from the free Al-Quran Cloud service (alquran.cloud), with EveryAyah (everyayah.com) as a backup, and belong to their reciters. It keeps playing when the screen is off.</Text>
          </>)}
        </ScrollView>

        {active ? (
          <View style={{ position: 'absolute', left: 14, right: 14, bottom: 16 }}>
            <Glass radius={26} style={{ padding: 14, backgroundColor: 'rgba(14,30,60,.96)' }}>
              {a.phase === 'error' ? <Text style={{ color: '#ffd593', fontSize: 13, lineHeight: 19 }}>{a.err}</Text> : (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ color: W, fontSize: 15, fontWeight: '800' }}>{a.title}</Text>
                      <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,.72)', fontSize: 11.5, marginTop: 2 }}>{a.phase === 'loading' ? 'Loading…' : a.qari + (it ? ' · ' + it.label + ' · ' + (a.index + 1) + '/' + a.items.length : '')}</Text>
                    </View>
                    <Pressable onPress={() => setText(!text)} hitSlop={6} style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, backgroundColor: text ? 'rgba(94,231,181,.4)' : 'rgba(255,255,255,.12)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '800' }}>{text ? 'List' : 'Text'}</Text></Pressable>
                    <Btn label="Close player" ic={<CloseIcon size={18} />} onPress={() => stop()} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 10 }}>
                    <Btn label="Previous verse" ic={<PrevIcon size={20} />} onPress={prev} /><Btn big pulse={a.playing} label={a.playing ? 'Pause' : 'Play'} ic={a.playing ? <PauseIcon size={26} color="#06231c" /> : <PlayIcon size={26} color="#06231c" />} onPress={toggle} /><Btn label="Next verse" ic={<NextIcon size={20} />} onPress={next} />
                  </View>
                </View>
              )}
              {a.phase === 'error' ? <Pressable onPress={() => stop()} style={{ marginTop: 10, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.14)' }}><Text style={{ color: W, fontWeight: '700', fontSize: 13 }}>Close</Text></Pressable> : null}
            </Glass>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}
