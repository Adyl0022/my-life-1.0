import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import { showAlert } from '../lib/dialog';
import { KbScroll } from '../components/KbScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Text } from '../components/Txt';
import { Header } from '../components/IslamicUi';
import { FamilyBg } from '../components/FamilyBg';
import { Avatar, Btn, Chip, Field, Label, Note, W, DIM } from '../components/FamilyUi';
import { useFamily, famError } from '../lib/family';
import { useFamEvents, peopleOf, eventSave, famDelete, REMINDS, dateText, timeText } from '../lib/familyData';

// Add or edit one activity. Everyone in the family can do this (and delete, which is undoable for 7 days).
export default function FamilyEventEdit() {
  const router = useRouter();
  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();
  const f = useFamily();
  const info = f.info;
  const ev = useFamEvents(info?.id);
  const people = useMemo(() => peopleOf(info), [info]);
  const old = id ? ev.rows.find((x) => x.id === id) : undefined;

  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [note, setNote] = useState('');
  const [who, setWho] = useState<string[]>([]);
  const [start, setStart] = useState<Date>(() => { const m = date ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date)) : null; const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(); if (!m) d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; });
  const [end, setEnd] = useState<Date | null>(null);
  const [remind, setRemind] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const filled = useRef(false);

  useEffect(() => {
    if (!old || filled.current) return;
    filled.current = true;
    setTitle(old.title); setPlace(old.place || ''); setNote(old.note || ''); setWho(old.attendees);
    setStart(new Date(old.starts_at)); setEnd(old.ends_at ? new Date(old.ends_at) : null); setRemind(old.remind_min);
  }, [old]);

  const pick = (which: 'date' | 'start' | 'end') => {
    if (Platform.OS !== 'android') return;
    const base = which === 'end' ? (end || new Date(start.getTime() + 3600000)) : start;
    DateTimePickerAndroid.open({
      value: base, mode: which === 'date' ? 'date' : 'time', is24Hour: false,
      onChange: (e: any, x?: Date) => {
        if (e.type !== 'set' || !x) return;
        if (which === 'date') {
          const n = new Date(start); n.setFullYear(x.getFullYear(), x.getMonth(), x.getDate()); setStart(n);
          if (end) { const m = new Date(end); m.setFullYear(x.getFullYear(), x.getMonth(), x.getDate()); setEnd(m); }
        } else if (which === 'start') {
          const n = new Date(start); n.setHours(x.getHours(), x.getMinutes(), 0, 0); setStart(n);
        } else {
          const n = new Date(start); n.setHours(x.getHours(), x.getMinutes(), 0, 0); setEnd(n);
        }
      },
    });
  };
  const toggle = (pid: string) => setWho((w) => (w.indexOf(pid) >= 0 ? w.filter((x) => x !== pid) : [...w, pid]));

  const save = async () => {
    setErr('');
    if (!title.trim()) { setErr('Please type a title.'); return; }
    setBusy(true);
    try {
      await eventSave({ id: old ? old.id : null, title, place, note, starts: start.toISOString(), ends: null, attendees: who, remind });
      router.back();
    } catch (e) { setErr(famError(e)); setBusy(false); }
  };
  const del = () => showAlert('Delete this activity?', 'It moves to Recently deleted for 7 days. Anyone in the family can bring it back.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { setBusy(true); try { await famDelete('event', old!.id); router.back(); } catch (e) { setErr(famError(e)); setBusy(false); } } },
  ]);

  const box = { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: 'rgba(0,0,0,.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)' } as const;
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <FamilyBg />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title={old ? 'Edit activity' : 'New activity'} sub="Visible to the whole family" />
        <KbScroll contentContainerStyle={{ padding: 20, paddingBottom: 150 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {id && !old && ev.ready ? <Note warm t="This activity was deleted or changed by someone else." /> : null}
          <Field label="Title" value={title} onChange={setTitle} ph="Visit grandma" max={120} />
          <Field label="Place (optional)" value={place} onChange={setPlace} ph="Kuala Lumpur" max={80} />

          <Label t="When" />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={{ flex: 1.3, ...box }} onPress={() => pick('date')}><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>{dateText(start)}</Text></Pressable>
            <Pressable style={{ flex: 1, ...box }} onPress={() => pick('start')}><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>{timeText(start)}</Text></Pressable>
          </View>

          <Label t="Who is going" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {people.map((p) => {
              const on = who.indexOf(p.id) >= 0;
              return (
                <Pressable key={p.id} onPress={() => toggle(p.id)} style={{ alignItems: 'center', paddingVertical: 8, paddingHorizontal: 11, borderRadius: 16, minWidth: 64, backgroundColor: on ? 'rgba(255,196,107,.16)' : 'rgba(255,255,255,.06)', borderWidth: 1.5, borderColor: on ? '#ffc46b' : 'transparent' }}>
                  <Avatar name={p.name} color={p.color} size={30} />
                  <Text style={{ color: W, fontSize: 11.5, marginTop: 4 }} numberOfLines={1}>{p.name}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={{ color: DIM, fontSize: 11.5, marginTop: 8 }}>Leave empty if the whole family is going.</Text>

          <Label t="Remind" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {REMINDS.map((r) => <Chip key={String(r.k)} t={r.t} color="#ffc46b" on={remind === r.k} onPress={() => setRemind(r.k)} />)}
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, fontWeight: '600' }}>Note (optional)</Text>
            <TextInput value={note} onChangeText={setNote} multiline maxLength={500} placeholder="Any detail" placeholderTextColor="rgba(255,255,255,.4)" style={{ ...box, marginTop: 6, color: W, fontSize: 15, minHeight: 70, textAlignVertical: 'top' }} />
          </View>

          {err ? <View style={{ marginTop: 16 }}><Note warm t={err} /></View> : null}
          <View style={{ marginTop: 22 }}><Btn t={old ? 'Save changes' : 'Save activity'} kind="main" onPress={save} busy={busy} /></View>
          {old ? <View style={{ marginTop: 10 }}><Btn t="Delete activity" kind="danger" onPress={del} disabled={busy} /></View> : null}
        </KbScroll>
      </SafeAreaView>
    </View>
  );
}
