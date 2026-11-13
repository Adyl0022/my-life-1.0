import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Text as SText } from 'react-native-svg';
import { Glass } from '../components/Glass';
import { IslamicBg, Header, Ic } from '../components/IslamicUi';
import { Sheet, SBtn, W } from '../components/Ui';
import { usePrayer, ZONES, qiblaBearing, inMalaysia } from '../lib/prayer';
import { useStored } from '../lib/store';

const COL: any = { fajr: 'rgba(124,156,255,.35)', syuruk: 'rgba(255,196,107,.35)', dhuhr: 'rgba(255,196,107,.35)', asr: 'rgba(255,143,171,.35)', maghrib: 'rgba(183,148,255,.35)', isha: 'rgba(94,231,223,.3)' };

export default function Prayer() {
  const pr = usePrayer();
  const [alarms, setAlarms] = useStored<Record<string, boolean>>('ml_prayer_alerts', { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true });
  const [pick, setPick] = useState(false);
  const pl = pr.place;
  const zn = pl ? (ZONES.find((x) => x.code === pl.zone)?.name.split(' (')[0] || 'Zone ' + pl.zone) : 'Choose location';
  const label = pr.mode.auto ? 'Auto · ' + zn : zn;
  const q = pl ? qiblaBearing(pl.lat, pl.lon) : 292;
  const [heading, setHeading] = useState<number | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let sub: any; let dead = false;
    (async () => { try { const p = await Location.getForegroundPermissionsAsync(); if (p.status !== 'granted') return; sub = await Location.watchHeadingAsync((h) => { if (!dead) setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading); }); } catch (e) {} })();
    return () => { dead = true; sub && sub.remove(); };
  }, [pr.status]);
  const off = heading === null ? 0 : ((q - heading + 540) % 360) - 180;
  const aligned = heading !== null && Math.abs(off) < 6;
  const n = pr.next;
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <IslamicBg a="rgba(124,156,255,.4)" b="rgba(94,231,223,.3)" />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Prayer Times" />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50, gap: 12 }}>
          <Glass radius={26} style={{ padding: 18 }}>
            <LinearGradient colors={['rgba(52,211,153,.3)', 'rgba(94,231,223,.15)']} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: '#8fe9e2', fontSize: 11, fontWeight: '700', letterSpacing: 1.4 }}>NEXT PRAYER</Text>
              <Pressable onPress={() => setPick(true)}><Text style={{ color: W, fontSize: 12, fontWeight: '700' }}>{label} ▾</Text></Pressable></View>
            {n ? (<>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12, marginTop: 6 }}><Text style={{ color: W, fontSize: 32, fontWeight: '800' }}>{n.name}</Text><Text style={{ color: W, fontSize: 24, fontWeight: '700' }}>{n.time12}</Text></View>
              <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, marginTop: 6 }}>In {Math.floor(n.diff / 60)} h {n.diff % 60} min{n.tomorrow ? ' (tomorrow)' : ''}</Text>
            </>) : (
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: W, fontSize: 15, fontWeight: '700' }}>{pr.status === 'loading' ? 'Finding your location…' : pr.status === 'denied' ? 'Location is off' : 'Could not load prayer times'}</Text>
                {(pr.status === 'error' || pr.status === 'denied') && <><Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12.5, marginTop: 4, lineHeight: 18 }}>{pr.status === 'denied' ? 'Allow location so My Life can find your JAKIM zone, or choose your zone yourself.' : 'Check your internet connection. Times are saved for the month after the first successful load.'}</Text><View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}><SBtn t="Try again" kind="primary" onPress={pr.retry} /><SBtn t="Choose zone" onPress={() => setPick(true)} /></View></>}
              </View>
            )}
          </Glass>
          <Glass radius={22} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(52,211,153,.25)', alignItems: 'center', justifyContent: 'center' }}><Ic n="compass" color="#7df0c6" size={18} /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10.5, fontWeight: '700', letterSpacing: 1.2 }}>{pr.mode.auto ? 'YOUR LOCATION' : 'SELECTED ZONE'}</Text>
              <Text style={{ color: W, fontSize: 14, fontWeight: '800', marginTop: 1 }} numberOfLines={2}>{pr.mode.auto && pr.locName ? pr.locName : zn}</Text>
              <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, marginTop: 1 }}>{pl ? 'Zone ' + pl.zone + (pr.mode.auto ? ' · ' + pl.lat.toFixed(3) + ', ' + pl.lon.toFixed(3) : '') : '—'}</Text>
              {pr.updAt ? <Text style={{ color: 'rgba(255,255,255,.45)', fontSize: 10.5, marginTop: 2 }}>{'Last update at ' + (() => { const u = new Date(pr.updAt); return u.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][u.getMonth()] + ', ' + (((u.getHours() + 11) % 12) + 1) + ':' + String(u.getMinutes()).padStart(2, '0') + (u.getHours() < 12 ? ' am' : ' pm'); })()}</Text> : null}
            </View>
            {pr.mode.auto ? <Pressable onPress={pr.refreshLoc} accessibilityLabel="Refresh location" style={{ paddingVertical: 9, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(52,211,153,.3)', borderWidth: 1, borderColor: 'rgba(52,211,153,.6)' }}><Text style={{ color: W, fontSize: 12, fontWeight: '800' }}>{pr.status === 'loading' ? 'Finding…' : '⟳ Refresh'}</Text></Pressable> : null}
          </Glass>
          {pl && pl.auto && !inMalaysia(pl.lat, pl.lon) ? (
            <Glass radius={22} style={{ padding: 14, borderWidth: 1, borderColor: 'rgba(255,213,147,.45)' }}>
              <Text style={{ color: '#ffd593', fontSize: 13.5, fontWeight: '800' }}>You seem to be outside Malaysia</Text>
              <Text style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5, marginTop: 4, lineHeight: 18 }}>These times follow Malaysian (JAKIM) zones and may not be correct where you are. Please confirm with your local mosque or authority.</Text>
            </Glass>
          ) : null}
          {pr.times.length > 0 && (
            <Glass radius={24} style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
              {pr.times.map((p, i) => (
                <View key={p.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: i === pr.times.length - 1 ? 0 : 1, borderBottomColor: 'rgba(255,255,255,.1)' }}>
                  <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: COL[p.key], alignItems: 'center', justifyContent: 'center' }}><Ic n={({ fajr: 'moon', syuruk: 'sunrise', dhuhr: 'sun', asr: 'sun', maghrib: 'sunset', isha: 'moon' } as any)[p.key]} size={20} /></View>
                  <Text style={{ flex: 1, color: n && n.idx === i ? '#7df0c6' : W, fontSize: 15, fontWeight: n && n.idx === i ? '800' : '600' }}>{p.name}</Text>
                  <Text style={{ color: n && n.idx === i ? '#7df0c6' : W, fontSize: 15, fontWeight: '700' }}>{p.time12}</Text>
                  {p.key !== 'syuruk' ? <Pressable accessibilityLabel="Toggle alert" onPress={() => setAlarms({ ...alarms, [p.key]: !alarms[p.key] })} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: alarms[p.key] ? 'rgba(52,211,153,.45)' : 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}><Ic n={alarms[p.key] ? 'bell' : 'bellOff'} size={18} color={alarms[p.key] ? '#fff' : 'rgba(255,255,255,.55)'} /></Pressable> : <View style={{ width: 34 }} />}
                </View>
              ))}
            </Glass>
          )}
          <Glass radius={24} style={{ padding: 16, alignItems: 'center' }}>
            <View style={{ alignSelf: 'stretch' }}><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>Qibla</Text><Text style={{ color: aligned ? '#7df0c6' : 'rgba(255,255,255,.72)', fontSize: 11.5, marginTop: 2, fontWeight: aligned ? '800' : '400' }}>{aligned ? 'You are facing the Qibla' : 'Qibla ' + q + '° from North (' + zn + ')'}{heading !== null ? '  ·  Facing ' + Math.round(heading) + '°' : ''}</Text></View>
            <Svg width={210} height={210} viewBox="0 0 210 210" style={{ marginTop: 6 }}>
              <Circle cx={105} cy={105} r={92} stroke="rgba(255,255,255,.25)" strokeWidth={2} fill="rgba(255,255,255,.05)" />
              <G rotation={heading === null ? 0 : -heading} origin="105, 105">
                <G fill="rgba(255,255,255,.75)" fontSize={13} fontWeight="700"><SText x={99} y={22} fill="#ff8fab">N</SText><SText x={99} y={196}>S</SText><SText x={193} y={109}>E</SText><SText x={13} y={109}>W</SText></G>
                <G rotation={q} origin="105, 105">
                  <Path d="M105 30l12 62h-24z" fill={aligned ? '#7df0c6' : '#34d399'} /><Path d="M105 180l10-52h-20z" fill="rgba(255,255,255,.3)" />
                </G>
              </G>
              <Path d="M105 6l5 9h-10z" fill="#fff" />
              <Circle cx={105} cy={105} r={8} fill="#fff" />
            </Svg>
            <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 11.5, textAlign: 'center' }}>The green arrow points to the Kaaba. On your phone the dial turns as you turn; hold the phone flat and away from metal. On the web it shows the fixed bearing.</Text>
          </Glass>
          <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 12, lineHeight: 18, marginHorizontal: 4 }}>Prayer times use official Malaysian (JAKIM) zones and are only accurate in Malaysia. In Auto mode your location finds the zone; only the coordinates are sent, and they are not saved to your account. Data comes through the public Waktu Solat API, which republishes e-solat JAKIM and is not affiliated with JAKIM. Alerts are saved here; phone notifications arrive with the phone build.</Text>
        </ScrollView>
        {pick && <Sheet onClose={() => setPick(false)}><View style={{ padding: 14, maxHeight: '75%', borderRadius: 24, backgroundColor: '#131845', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' }}><Text style={{ color: W, fontSize: 16, fontWeight: '800', marginBottom: 6 }}>Location</Text><ScrollView><Pressable onPress={() => { pr.setMode({ ...pr.mode, auto: true }); setPick(false); }} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.1)' }}><Text style={{ color: pr.mode.auto ? '#7df0c6' : W, fontSize: 14, fontWeight: '800' }}>Automatic (use my location)</Text></Pressable>{ZONES.map((x) => <Pressable key={x.code} onPress={() => { pr.setMode({ auto: false, zone: x.code }); setPick(false); }} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.1)' }}><Text style={{ color: !pr.mode.auto && x.code === pr.mode.zone ? '#7df0c6' : W, fontSize: 14, fontWeight: !pr.mode.auto && x.code === pr.mode.zone ? '800' : '600' }}>{x.name}</Text></Pressable>)}</ScrollView></View></Sheet>}
      </SafeAreaView>
    </View>
  );
}
