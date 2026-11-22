import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useStored } from '../lib/store';
import { SLEEP_KEY, SleepNow, startSleep, endSleep, fmtDur } from '../lib/sleepNow';
import { addSleepTile } from '../../modules/step-counter';
import * as Haptics from '../lib/haptics';
const buzz = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };

/** At the bottom of the Sleep card in Habit and Health: start or end the sleep timer, and add its tile to the phone's Quick Settings. */
export function SleepQuick() {
  const [sn] = useStored<SleepNow>(SLEEP_KEY, null); const [msg, setMsg] = React.useState(''); const [, tick] = React.useState(0);
  React.useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(i); }, []);
  const sleeping = !!(sn && sn.start);
  const tile = async () => { buzz(); const r = await addSleepTile(); setMsg(r === 2 ? 'Added to Quick Settings. Pull the top of your screen down twice to find it.' : r === 1 ? 'It is already in your Quick Settings.' : r === 0 ? 'Not added.' : 'Open Quick Settings, tap the pencil and drag Going to sleep up.'); };
  const Btn = ({ t, onPress, main }: { t: string; onPress: () => void; main?: boolean }) => (
    <Pressable onPress={() => { buzz(); onPress(); }} accessibilityLabel={t} style={({ pressed }) => ({ flex: 1, paddingVertical: 11, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: main ? '#b794ff' : 'rgba(255,255,255,.3)', backgroundColor: main ? 'rgba(183,148,255,.4)' : 'rgba(255,255,255,.1)', transform: [{ scale: pressed ? 0.96 : 1 }] })}>
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{t}</Text>
    </Pressable>
  );
  return (
    <View style={{ marginTop: 12, padding: 13, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', backgroundColor: 'rgba(255,255,255,.1)' }}>
      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{sleeping ? 'You are sleeping' : 'Sleep timer'}</Text>
      <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12, marginTop: 4, lineHeight: 17 }}>{sleeping && sn ? 'Since ' + new Date(sn.start).toTimeString().slice(0, 5) + ' · ' + fmtDur(Date.now() - sn.start) + '. Tap I\'m awake when you wake up and the hours are saved here.' : 'Tap Going to sleep when you go to bed, then I\'m awake when you wake up. The hours and times are saved in your Sleep Tracker.'}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        {sleeping ? <Btn main t="I'm awake" onPress={async () => setMsg(await endSleep())} /> : <Btn main t="Going to sleep" onPress={async () => { setMsg(''); await startSleep(); }} />}
        {Platform.OS === 'android' ? <Btn t="Add to Quick Settings" onPress={tile} /> : null}
      </View>
      {Platform.OS === 'android' ? <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, marginTop: 8, lineHeight: 16 }}>Once added, you can start and end your sleep from the top of your phone without opening My Life 1.0. It stays on your phone only.</Text> : null}
      {msg ? <Text style={{ color: '#d9c7ff', fontSize: 12, marginTop: 8, lineHeight: 17 }}>{msg}</Text> : null}
    </View>
  );
}
