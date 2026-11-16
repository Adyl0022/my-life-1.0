import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { showAlert } from '../lib/dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/Txt';
import { Glass } from '../components/Glass';
import { Header } from '../components/IslamicUi';
import { FamilyBg } from '../components/FamilyBg';
import { Rise } from '../components/Anim';
import { Ico, Note, W, DIM } from '../components/FamilyUi';
import { useFamily, famError } from '../lib/family';
import { trashList, famRestore, trashRemove, trashEmpty, nameOf, daysLeft, Trashed } from '../lib/familyData';

const KIND: Record<string, { t: string; ic: string; c: string }> = {
  task: { t: 'Task', ic: 'tasks', c: '#5ee7df' },
  event: { t: 'Activity', ic: 'star', c: '#ffc46b' },
  shop: { t: 'Shopping', ic: 'shop', c: '#ff8fab' },
};

// Everything the family deleted in the last 7 days. Anyone can bring an item back; after 7 days it is removed for good.
export default function FamilyTrash() {
  const f = useFamily();
  const info = f.info;
  const [list, setList] = useState<Trashed[] | null>(null);
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    try { setList(await trashList()); setMsg(''); } catch (e) { setMsg(famError(e)); setList((l) => l || []); }
  }, []);
  useEffect(() => { if (info) load(); }, [info, load]);

  const act = async (fn: () => Promise<any>) => { try { await fn(); await load(); } catch (e) { setMsg(famError(e)); } };
  const forever = (x: Trashed) => showAlert('Delete for good?', '"' + x.title + '" cannot be brought back after this.', [
    { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => act(() => trashRemove(x.kind, x.id)) },
  ]);
  const empty = () => showAlert('Empty Recently deleted?', 'Everything here is removed for good.', [
    { text: 'Cancel', style: 'cancel' }, { text: 'Empty', style: 'destructive', onPress: () => act(trashEmpty) },
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <FamilyBg />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Recently deleted" sub="Kept for 7 days, then removed" right={list && list.length ? <Pressable onPress={empty} hitSlop={8}><Text style={{ color: '#ffb3bf', fontSize: 13, fontWeight: '800' }}>Empty</Text></Pressable> : undefined} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
          {msg ? <Note warm t={msg} /> : null}
          <Rise>
            {(list || []).map((x) => {
              const k = KIND[x.kind] || KIND.task;
              return (
                <Glass flat key={x.kind + x.id} radius={20} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: k.c + '2b', alignItems: 'center', justifyContent: 'center' }}><Ico k={k.ic} c={k.c} s={18} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: W, fontSize: 14, fontWeight: '700' }} numberOfLines={2}>{x.title}</Text>
                      <Text style={{ color: DIM, fontSize: 11.5, marginTop: 2 }}>{k.t} · deleted by {nameOf(info, x.deleted_by)} · {daysLeft(x.deleted_at)} {daysLeft(x.deleted_at) === 1 ? 'day' : 'days'} left</Text>
                    </View>
                    <Pressable onPress={() => act(() => famRestore(x.kind, x.id))} hitSlop={6} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(94,231,223,.2)' }}><Text style={{ color: '#5ee7df', fontSize: 12.5, fontWeight: '800' }}>Restore</Text></Pressable>
                    <Pressable onPress={() => forever(x)} hitSlop={8}><Text style={{ color: '#ffb3bf', fontSize: 18, fontWeight: '700' }}>✕</Text></Pressable>
                  </View>
                </Glass>
              );
            })}
          </Rise>
          {list && !list.length ? <Note t="Nothing here. When someone in the family deletes a task, activity or shopping item, it waits here for 7 days so it can be brought back." /> : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
