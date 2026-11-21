import React from 'react';
import { View, ScrollView } from 'react-native';
import { Pressable } from '../components/Press';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../components/Txt';
import { Glass } from '../components/Glass';
import { IslamicBg, Header } from '../components/IslamicUi';
import { W } from '../components/Ui';
import { useStored } from '../lib/store';
import { Toggle } from '../components/Toggle';

const DIM = 'rgba(255,255,255,.7)';
const Sw = ({ on }: { on: boolean }) => <Toggle on={on} colors={['#34d399', '#5ee7df']} />;

// Islamic alerts live here (not in the general Settings) so people who do not use the Hub never see them.
export default function IslamicSettings() {
  const [tg, setTg] = useStored<Record<string, boolean>>('ml_toggles', { ev: true, pr: true, zk: true, qh: true });
  const [lead, setLead] = useStored<number>('ml_prayer_lead', 0);
  const rows: [string, string, string][] = [['pr', 'Prayer times', 'Alert at each solat time'], ['zk', 'Daily zikir', "Morning and evening Al-Ma'thurat"]];
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <IslamicBg />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Islamic Hub settings" sub="Alerts and reminders" />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 12 }} showsVerticalScrollIndicator={false}>
          <Glass style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
            {rows.map(([k, t, s], i) => (
              <Pressable key={k} onPress={() => setTg({ ...tg, [k]: !tg[k] })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: i === rows.length - 1 ? 0 : 1, borderBottomColor: 'rgba(255,255,255,.1)' }}>
                <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14.5, fontWeight: '700' }}>{t}</Text><Text style={{ color: DIM, fontSize: 12, marginTop: 4 }}>{s}</Text></View>
                <Sw on={!!tg[k]} />
              </Pressable>
            ))}
          </Glass>
          <Glass style={{ padding: 16 }}>
            <Text style={{ color: W, fontSize: 14.5, fontWeight: '700' }}>Prayer alert timing</Text>
            <Text style={{ color: DIM, fontSize: 12, marginTop: 2, marginBottom: 10 }}>When to ring, relative to the solat time</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {([[0, 'On time'], [5, '5 min'], [10, '10 min'], [15, '15 min']] as const).map(([v, n]) => (
                <Pressable key={v} onPress={() => setLead(v)} style={{ flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center', backgroundColor: lead === v ? 'rgba(52,211,153,.5)' : 'rgba(255,255,255,.1)' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{n}</Text></Pressable>
              ))}
            </View>
            {lead ? <Text style={{ color: DIM, fontSize: 12, marginTop: 8 }}>{'Rings ' + lead + ' minutes before each prayer'}</Text> : null}
          </Glass>
          <Text style={{ color: DIM, fontSize: 12, lineHeight: 17, paddingHorizontal: 4 }}>Alerts only ring when notifications are allowed for My Life 1.0. You can send a test notification from Settings.</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
