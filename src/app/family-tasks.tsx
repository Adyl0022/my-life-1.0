import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '../components/Txt';
import { Glass } from '../components/Glass';
import { Header } from '../components/IslamicUi';
import { FamilyBg } from '../components/FamilyBg';
import { Rise } from '../components/Anim';
import { Avatar, Chip, Ico, Label, NewBtn, Note, Tick, W, DIM } from '../components/FamilyUi';
import { useFamily, famError } from '../lib/family';
import { useFamTasks, peopleOf, taskDone, dueText, dayDiff, FTask, useReloadOnFocus } from '../lib/familyData';

export default function FamilyTasks() {
  const router = useRouter();
  const f = useFamily();
  const info = f.info;
  const t = useFamTasks(info?.id);
  useReloadOnFocus(t.reload);
  const people = useMemo(() => peopleOf(info), [info]);
  const [who, setWho] = useState('all');
  const [msg, setMsg] = useState('');

  const mine = t.rows.filter((x) => who === 'all' || x.assignees.indexOf(who) >= 0);
  const open = mine.filter((x) => !x.done);
  const byDue = (a: FTask, b: FTask) => (a.due_at || '9').localeCompare(b.due_at || '9');
  const today = open.filter((x) => x.due_at && dayDiff(x.due_at) <= 0).sort(byDue);
  const later = open.filter((x) => x.due_at && dayDiff(x.due_at) > 0).sort(byDue);
  const anytime = open.filter((x) => !x.due_at);
  const done = mine.filter((x) => x.done).sort((a, b) => (b.done_at || '').localeCompare(a.done_at || '')).slice(0, 15);

  const tick = async (x: FTask) => {
    setMsg('');
    const nowDone = !x.done;
    if (x.repeat === 'none' || !x.due_at) t.patch(x.id, { done: nowDone, done_at: nowDone ? new Date().toISOString() : null });
    try { await taskDone(x.id, nowDone); if (x.repeat !== 'none') await t.reload(); }
    catch (e) { setMsg(famError(e)); t.reload(); }
  };
  const edit = (id?: string) => router.push({ pathname: '/family-task-edit', params: id ? { id } : {} } as any);

  const Row = ({ x }: { x: FTask }) => {
    const late = !x.done && x.due_at ? dayDiff(x.due_at) < 0 : false;
    const who2 = x.assignees.map((id) => people.find((p) => p.id === id)).filter(Boolean) as typeof people;
    return (
      <Glass radius={20} style={{ marginBottom: 8, opacity: x.done ? 0.6 : 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 13 }}>
          <Tick on={x.done} onPress={() => tick(x)} />
          <Pressable style={{ flex: 1 }} onPress={() => edit(x.id)}>
            <Text style={{ color: W, fontSize: 14.5, fontWeight: '700', textDecorationLine: x.done ? 'line-through' : 'none' }} numberOfLines={2}>{x.title}</Text>
            {x.due_at || x.repeat !== 'none' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                {x.repeat !== 'none' ? <Ico k="repeat" c={DIM} s={12} w={2.2} /> : null}
                <Text style={{ color: late ? '#ff9db0' : DIM, fontSize: 11.5 }}>{late ? 'Overdue · ' : ''}{dueText(x.due_at)}{x.repeat !== 'none' ? ' · ' + x.repeat : ''}</Text>
              </View>
            ) : null}
          </Pressable>
          <View style={{ flexDirection: 'row' }}>
            {who2.slice(0, 3).map((p, i) => <View key={p.id} style={{ marginLeft: i ? -9 : 0 }}><Avatar name={p.name} color={p.color} size={26} ring /></View>)}
            {who2.length > 3 ? <View style={{ marginLeft: -9 }}><Avatar name={'+' + (who2.length - 3)} color="#7c9cff" size={26} ring /></View> : null}
          </View>
        </View>
      </Glass>
    );
  };
  const Group = ({ title, list }: { title: string; list: FTask[] }) => list.length ? <><Label t={title} />{list.map((x) => <Row key={x.id} x={x} />)}</> : null;

  const none = t.ready && !t.rows.length;
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <FamilyBg />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Tasks" sub="Everyone in the family can edit" right={<NewBtn onPress={() => edit()} />} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
          {people.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
              <Chip t="All" on={who === 'all'} onPress={() => setWho('all')} />
              {people.map((p) => <Chip key={p.id} t={p.name} color={p.color} on={who === p.id} onPress={() => setWho(p.id)} />)}
            </ScrollView>
          ) : null}
          {msg ? <View style={{ marginTop: 12 }}><Note warm t={msg} /></View> : null}
          {t.offline ? <View style={{ marginTop: 12 }}><Note t={t.msg || "You are offline. Showing the last saved list."} /></View> : null}
          <Rise>
            <Group title="Today" list={today} />
            <Group title="Coming up" list={later} />
            <Group title="Anytime" list={anytime} />
            <Group title="Done" list={done} />
          </Rise>
          {none ? <View style={{ marginTop: 18 }}><Note t="No tasks yet. Tap + New to add the first one. Everyone in the family sees it straight away." /></View> : null}
          {t.ready && t.rows.length && !mine.length ? <View style={{ marginTop: 18 }}><Note t="Nothing assigned to this person." /></View> : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
