import React, { useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '../components/Txt';
import { Glass } from '../components/Glass';
import { Header } from '../components/IslamicUi';
import { FamilyBg } from '../components/FamilyBg';
import { Rise } from '../components/Anim';
import { Avatar, Ico, Label, NewBtn, Note, W, DIM } from '../components/FamilyUi';
import { useFamily } from '../lib/family';
import { useFamEvents, peopleOf, dayDiff, timeText, FEvent, useReloadOnFocus } from '../lib/familyData';

const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Family activities: a visit, a school event, a trip. Everyone sees them and anyone can edit.
export default function FamilyEvents() {
  const router = useRouter();
  const f = useFamily();
  const info = f.info;
  const e = useFamEvents(info?.id);
  useReloadOnFocus(e.reload);
  const people = useMemo(() => peopleOf(info), [info]);
  const next = e.rows.filter((x) => dayDiff(x.starts_at) >= 0);
  const past = e.rows.filter((x) => dayDiff(x.starts_at) < 0).sort((a, b) => b.starts_at.localeCompare(a.starts_at)).slice(0, 10);
  const edit = (id?: string) => router.push({ pathname: '/family-event-edit', params: id ? { id } : {} } as any);

  const Row = ({ x, old }: { x: FEvent; old?: boolean }) => {
    const d = new Date(x.starts_at); const n = dayDiff(x.starts_at);
    const who = x.attendees.map((id) => people.find((p) => p.id === id)).filter(Boolean) as typeof people;
    return (
      <Pressable onPress={() => edit(x.id)}>
        <Glass radius={20} style={{ marginBottom: 8, opacity: old ? 0.6 : 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 12 }}>
            <View style={{ width: 48, alignItems: 'center', paddingVertical: 6, borderRadius: 14, backgroundColor: n === 0 ? 'rgba(255,196,107,.28)' : 'rgba(255,255,255,.1)' }}>
              <Text style={{ color: n === 0 ? '#ffc46b' : DIM, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>{MON[d.getMonth()]}</Text>
              <Text style={{ color: W, fontSize: 20, fontWeight: '800', marginTop: -1 }}>{d.getDate()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: W, fontSize: 14.5, fontWeight: '700' }} numberOfLines={2}>{x.title}</Text>
              <Text style={{ color: DIM, fontSize: 11.5, marginTop: 2 }}>{n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : DAY[d.getDay()]} {timeText(d)}{x.ends_at ? ' – ' + timeText(new Date(x.ends_at)) : ''}{x.place ? ' · ' + x.place : ''}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              {who.slice(0, 3).map((p, i) => <View key={p.id} style={{ marginLeft: i ? -9 : 0 }}><Avatar name={p.name} color={p.color} size={26} ring /></View>)}
              {who.length > 3 ? <View style={{ marginLeft: -9 }}><Avatar name={'+' + (who.length - 3)} color="#7c9cff" size={26} ring /></View> : null}
            </View>
          </View>
        </Glass>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <FamilyBg />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Activities" sub="Plans the family does together" right={<NewBtn onPress={() => edit()} />} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
          {e.offline ? <Note t="You are offline. Showing the last saved list. Changes need an internet connection." /> : null}
          <Rise>
            {next.length ? <><Label t="Coming up" />{next.map((x) => <Row key={x.id} x={x} />)}</> : null}
            {past.length ? <><Label t="Earlier" />{past.map((x) => <Row key={x.id} x={x} old />)}</> : null}
          </Rise>
          {e.ready && !e.rows.length ? <View style={{ marginTop: 18 }}><Note t="No activities yet. Tap + New to plan one, like a visit to grandma or a family trip." /></View> : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
