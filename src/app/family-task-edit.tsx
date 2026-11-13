import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import { showAlert } from '../lib/dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Text } from '../components/Txt';
import { Header } from '../components/IslamicUi';
import { FamilyBg } from '../components/FamilyBg';
import { Avatar, Btn, Chip, Field, Label, Note, W, DIM } from '../components/FamilyUi';
import { useFamily, famError } from '../lib/family';
import { useFamTasks, peopleOf, taskSave, famDelete, REPEATS, REMINDS, dateText, timeText, Repeat } from '../lib/familyData';

// Add or edit one task. Everyone in the family can do this (and delete, which is undoable for 7 days).
export default function FamilyTaskEdit() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const f = useFamily();
  const info = f.info;
  const t = useFamTasks(info?.id);
  const people = useMemo(() => peopleOf(info), [info]);
  const old = id ? t.rows.find((x) => x.id === id) : undefined;

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [who, setWho] = useState<string[]>([]);
  const [due, setDue] = useState<Date | null>(null);
  const [repeat, setRepeat] = useState<Repeat>('none');
  const [remind, setRemind] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const filled = useRef(false);

  useEffect(() => {
    if (!old || filled.current) return;
    filled.current = true;
    setTitle(old.title); setNote(old.note || ''); setWho(old.assignees); setDue(old.due_at ? new Date(old.due_at) : null);
    setRepeat(old.repeat); setRemind(old.remind_min);
  }, [old]);

  const pick = (mode: 'date' | 'time') => {
    if (Platform.OS !== 'android') return;
    const base = due || (() => { const d = new Date(); d.setHours(9, 0, 0, 0); return d; })();
    DateTimePickerAndroid.open({
      value: base, mode, is24Hour: false,
      onChange: (e: any, x?: Date) => {
        if (e.type !== 'set' || !x) return;
        const n = new Date(base);
        if (mode === 'date') n.setFullYear(x.getFullYear(), x.getMonth(), x.getDate()); else n.setHours(x.getHours(), x.getMinutes(), 0, 0);
        setDue(n);
      },
    });
  };
  const toggle = (pid: string) => setWho((w) => (w.indexOf(pid) >= 0 ? w.filter((x) => x !== pid) : [...w, pid]));

  const save = async () => {
    setErr('');
    if (!title.trim()) { setErr('Please type a title.'); return; }
    if (repeat !== 'none' && !due) { setErr('A repeating task needs a date.'); return; }
    setBusy(true);
    try {
      await taskSave({ id: old ? old.id : null, title, note, due: due ? due.toISOString() : null, repeat, remind, assignees: who });
      router.back();
    } catch (e) { setErr(famError(e)); setBusy(false); }
  };
  const del = () => showAlert('Delete this task?', 'It moves to Recently deleted for 7 days. Anyone in the family can bring it back.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { setBusy(true); try { await famDelete('task', old!.id); router.back(); } catch (e) { setErr(famError(e)); setBusy(false); } } },
  ]);

  const box = { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: 'rgba(0,0,0,.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' } as const;
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <FamilyBg />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title={old ? 'Edit task' : 'New task'} sub="Visible to the whole family" />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 150 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {id && !old && t.ready ? <Note warm t="This task was deleted or changed by someone else." /> : null}
          <Field label="Title" value={title} onChange={setTitle} ph="What needs doing?" max={120} />
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, fontWeight: '600' }}>Note (optional)</Text>
            <TextInput value={note} onChangeText={setNote} multiline maxLength={500} placeholder="Any detail" placeholderTextColor="rgba(255,255,255,.4)" style={{ ...box, marginTop: 6, color: W, fontSize: 15, minHeight: 70, textAlignVertical: 'top' }} />
          </View>

          <Label t="Assign to" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {people.map((p) => {
              const on = who.indexOf(p.id) >= 0;
              return (
                <Pressable key={p.id} onPress={() => toggle(p.id)} style={{ alignItems: 'center', paddingVertical: 8, paddingHorizontal: 11, borderRadius: 16, minWidth: 64, backgroundColor: on ? 'rgba(94,231,223,.16)' : 'rgba(255,255,255,.06)', borderWidth: 1.5, borderColor: on ? '#5ee7df' : 'transparent' }}>
                  <Avatar name={p.name} color={p.color} size={30} />
                  <Text style={{ color: W, fontSize: 11.5, marginTop: 4 }} numberOfLines={1}>{p.name}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={{ color: DIM, fontSize: 11.5, marginTop: 8 }}>Leave empty if it is for everyone.</Text>

          <Label t="Due" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={{ flex: 1.3, ...box }} onPress={() => pick('date')}><Text style={{ color: due ? W : DIM, fontSize: 14, fontWeight: '700' }}>{due ? dateText(due) : 'No date'}</Text></Pressable>
            <Pressable style={{ flex: 1, ...box, opacity: due ? 1 : 0.5 }} onPress={() => pick('time')}><Text style={{ color: due ? W : DIM, fontSize: 14, fontWeight: '700' }}>{due ? timeText(due) : 'Time'}</Text></Pressable>
          </View>
          {due ? <Pressable onPress={() => { setDue(null); setRepeat('none'); setRemind(null); }} style={{ marginTop: 8, marginLeft: 4 }}><Text style={{ color: '#ffb3bf', fontSize: 12, fontWeight: '700' }}>Remove date</Text></Pressable> : <Pressable onPress={() => pick('date')} style={{ marginTop: 8, marginLeft: 4 }}><Text style={{ color: '#5ee7df', fontSize: 12, fontWeight: '700' }}>Pick a date</Text></Pressable>}

          <Label t="Repeat" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {REPEATS.map((r) => <Chip key={r.k} t={r.t} color="#ffc46b" on={repeat === r.k} onPress={() => { if (r.k !== 'none' && !due) pick('date'); setRepeat(r.k); }} />)}
          </View>

          {due ? (
            <>
              <Label t="Remind" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {REMINDS.map((r) => <Chip key={String(r.k)} t={r.t} color="#ffc46b" on={remind === r.k} onPress={() => setRemind(r.k)} />)}
              </View>
            </>
          ) : null}

          {err ? <View style={{ marginTop: 16 }}><Note warm t={err} /></View> : null}
          <View style={{ marginTop: 22 }}><Btn t={old ? 'Save changes' : 'Save task'} kind="main" onPress={save} busy={busy} /></View>
          {old ? <View style={{ marginTop: 10 }}><Btn t="Delete task" kind="danger" onPress={del} disabled={busy} /></View> : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
