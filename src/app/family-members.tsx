import React, { useState } from 'react';
import { View, ScrollView, Pressable, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '../components/Txt';
import { Glass } from '../components/Glass';
import { Header } from '../components/IslamicUi';
import { FamilyBg } from '../components/FamilyBg';
import { Rise } from '../components/Anim';
import { Avatar, Pill, Btn, Field, Note, Label, W, DIM } from '../components/FamilyUi';
import { useFamily, famError, famNewCode, famRemove, famSetRole, famTransfer, famLeave, famAddProfile, famRemoveProfile, famRename, showCode, pickColor, isParent, FMember } from '../lib/family';

const ROLE: Record<string, string> = { owner: 'Owner', parent: 'Parent', member: 'Member' };

export default function FamilyMembers() {
  const router = useRouter();
  const f = useFamily();
  const info = f.info;
  const [open, setOpen] = useState('');
  const [msg, setMsg] = useState('');
  const [pname, setPname] = useState('');
  const [rn, setRn] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<any>, ok?: string) => {
    setBusy(true); setMsg('');
    try { await fn(); await f.refresh(); if (ok) setMsg(ok); } catch (e) { setMsg(famError(e)); }
    setBusy(false);
  };
  const ask = (title: string, text: string, yes: string, go: () => void) => Alert.alert(title, text, [{ text: 'Cancel', style: 'cancel' }, { text: yes, style: 'destructive', onPress: go }]);

  if (!info) return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}><FamilyBg /><SafeAreaView style={{ flex: 1 }}><Header title="Members" /><View style={{ padding: 20 }}><Note t={f.state === 'loading' ? 'Loading…' : 'You are not in a family yet.'} /></View></SafeAreaView></View>
  );
  const owner = info.role === 'owner';
  const parent = isParent(info.role);
  const share = () => Share.share({ message: 'Join our family on My Life. Open Daily Planner, then Family, then Join with a code. Code: ' + showCode(info.code) }).catch(() => {});

  const Row = ({ m }: { m: FMember }) => {
    const me = m.user_id === info.me; const on = open === m.user_id;
    return (
      <View>
        <Pressable onPress={() => (owner && !me ? setOpen(on ? '' : m.user_id) : null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
          <Avatar name={m.name} color={m.color} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: W, fontSize: 14.5, fontWeight: '700' }}>{m.name}{me ? ' (You)' : ''}</Text>
            <Text style={{ color: DIM, fontSize: 11.5, marginTop: 1 }}>Joined {new Date(m.joined).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
          </View>
          {m.role !== 'member' ? <Pill t={ROLE[m.role]} c={m.role === 'owner' ? 'rgba(255,143,171,.35)' : 'rgba(94,231,223,.3)'} /> : null}
        </Pressable>
        {on ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12, paddingBottom: 12 }}>
            <Btn t={m.role === 'parent' ? 'Make member' : 'Make parent'} onPress={() => run(() => famSetRole(m.user_id, m.role === 'parent' ? 'member' : 'parent'))} disabled={busy} />
            <Btn t="Make owner" onPress={() => ask('Make ' + m.name + ' the owner?', 'You will become a parent. Only the owner can remove members and change the code.', 'Make owner', () => run(() => famTransfer(m.user_id)))} disabled={busy} />
            <Btn t="Remove" kind="danger" onPress={() => ask('Remove ' + m.name + '?', 'They lose access to this family. Their own data on their phone is not affected.', 'Remove', () => run(() => famRemove(m.user_id)))} disabled={busy} />
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <FamilyBg />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Members" sub={info.members.length + ' of ' + info.max_members + ' members'} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 170 }} showsVerticalScrollIndicator={false}>
          {parent ? (
            <Rise>
              <Glass radius={24} style={{ padding: 16 }}>
                <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Invite code</Text>
                <Text style={{ color: DIM, fontSize: 12, lineHeight: 17, marginTop: 3 }}>Share it with your family. Everyone who joins needs an active My Life subscription.</Text>
                <Text style={{ color: W, fontSize: 28, fontWeight: '900', letterSpacing: 6, textAlign: 'center', paddingVertical: 14, marginTop: 12, borderRadius: 16, backgroundColor: 'rgba(0,0,0,.28)', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.3)' }}>{showCode(info.code)}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <Btn t="Share code" kind="main" onPress={share} flex />
                  {owner ? <Btn t="New code" onPress={() => ask('Make a new code?', 'The old code stops working. People already in the family stay.', 'New code', () => run(famNewCode))} disabled={busy} flex /> : null}
                </View>
              </Glass>
            </Rise>
          ) : null}
          {msg ? <Text style={{ color: '#ffe0ad', fontSize: 12.5, marginTop: 12 }}>{msg}</Text> : null}

          <Rise i={1}>
            <Label t="Members" />
            <Glass radius={24}>{info.members.map((m, i) => <View key={m.user_id} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: 'rgba(255,255,255,.09)' }}><Row m={m} /></View>)}</Glass>
            {owner ? <Text style={{ color: DIM, fontSize: 11.5, marginTop: 8, marginLeft: 4 }}>Tap a member to change their role or remove them.</Text> : null}
          </Rise>

          <Rise i={2}>
            <Label t="People without an account" />
            <Glass radius={24} style={{ padding: 14 }}>
              {info.profiles.length ? info.profiles.map((p) => (
                <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
                  <Avatar name={p.name} color={p.color} size={34} />
                  <Text style={{ flex: 1, color: W, fontSize: 14, fontWeight: '700' }}>{p.name}</Text>
                  {parent ? <Pressable hitSlop={10} onPress={() => ask('Remove ' + p.name + '?', 'They are taken off the family list.', 'Remove', () => run(() => famRemoveProfile(p.id)))}><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 16 }}>✕</Text></Pressable> : null}
                </View>
              )) : <Text style={{ color: DIM, fontSize: 12.5, lineHeight: 18 }}>For a child or a grandparent who does not use the app. A parent manages them.</Text>}
              {parent && info.profiles.length < info.max_profiles ? (
                <>
                  <Field label="Add a person" value={pname} onChange={setPname} ph="Name" />
                  <View style={{ marginTop: 10 }}><Btn t="Add" onPress={() => run(async () => { await famAddProfile(pname, pickColor(info.profiles.length + 1)); setPname(''); })} disabled={!pname.trim() || busy} /></View>
                </>
              ) : null}
            </Glass>
          </Rise>

          {owner ? (
            <Rise i={3}>
              <Label t="Family name" />
              <Glass radius={24} style={{ padding: 14 }}>
                <Field label="" value={rn} onChange={setRn} ph={info.name} max={40} />
                <View style={{ marginTop: 10 }}><Btn t="Rename" onPress={() => run(async () => { await famRename(rn); setRn(''); }, 'Family renamed.')} disabled={!rn.trim() || busy} /></View>
              </Glass>
            </Rise>
          ) : null}

          <Rise i={4}>
            <View style={{ marginTop: 22 }}>
              <Btn t="Leave family" kind="danger" disabled={busy} onPress={() => ask('Leave this family?', owner && info.members.length > 1 ? 'You are the owner. Make someone else the owner first.' : owner ? 'You are the only member. The family will be removed.' : 'You lose access to the family. Your own data is not affected.', 'Leave', async () => { try { setBusy(true); await famLeave(); router.replace('/family' as any); } catch (e) { setMsg(famError(e)); } setBusy(false); })} />
            </View>
          </Rise>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
