import React, { useState } from 'react';
import { View, ScrollView, Pressable, Share } from 'react-native';
import { showAlert } from '../lib/dialog';
import { KbScroll } from '../components/KbScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '../components/Txt';
import { Glass } from '../components/Glass';
import { Header } from '../components/IslamicUi';
import { DateField } from '../components/Ui';
import { FamilyBg } from '../components/FamilyBg';
import { Rise } from '../components/Anim';
import { Avatar, Pill, Btn, Field, Note, Label, W, DIM } from '../components/FamilyUi';
import { useFamily, useAutoRefresh, famError, famNewCode, famSetInvites, famDeleteAll, famRemove, famSetRole, famTransfer, famLeave, famForget, famAddProfile, famSetBirthday, famProfileBirthday, famMemberBirthday, famRemoveProfile, famRename, showCode, pickColor, isParent, FMember } from '../lib/family';

const bdText = (v: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); return m ? Number(m[3]) + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m[2]) - 1] + ' ' + m[1] : v; };
const ROLE: Record<string, string> = { owner: 'Owner', parent: 'Parent', member: 'Member' };

export default function FamilyMembers() {
  const router = useRouter();
  const f = useFamily();
  const info = f.info;
  useAutoRefresh(f.refresh);
  const [open, setOpen] = useState('');
  const [msg, setMsg] = useState('');
  const [pname, setPname] = useState('');
  const [rn, setRn] = useState('');
  const [del, setDel] = useState(false);
  const [dn, setDn] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<any>, ok?: string) => {
    setBusy(true); setMsg('');
    try { await fn(); await f.refresh(); if (ok) setMsg(ok); } catch (e) { setMsg(famError(e)); }
    setBusy(false);
  };
  const ask = (title: string, text: string, yes: string, go: () => void) => showAlert(title, text, [{ text: 'Cancel', style: 'cancel' }, { text: yes, style: 'destructive', onPress: go }]);

  if (!info) return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}><FamilyBg /><SafeAreaView style={{ flex: 1 }}><Header title="Members" /><View style={{ padding: 20 }}><Note t={f.state === 'loading' ? 'Loading…' : 'You are not in a family yet.'} /></View></SafeAreaView></View>
  );
  const owner = info.role === 'owner';
  const nextOwner = ([...info.members].filter((m) => m.user_id !== info.me).sort((a, b) => (a.role === 'parent' ? 0 : 1) - (b.role === 'parent' ? 0 : 1) || new Date(a.joined).getTime() - new Date(b.joined).getTime())[0] || { name: 'the next member' }).name;
  const parent = isParent(info.role);
  const share = () => Share.share({ message: 'Join our family on My Life. Open Daily Planner, then Family, then Join with a code. Code: ' + showCode(info.code) }).catch(() => {});

  // A solid dark card tinted with the member's own colour (no see-through).
  const tint = (hex: string, t: number, a = 1) => {
    const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#7c9cff';
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), b = [16, 22, 52];
    return 'rgba(' + c.map((v, i) => Math.round(b[i] + (v - b[i]) * t)).join(',') + ',' + a + ')';
  };
  const Row = ({ m }: { m: FMember }) => {
    const me = m.user_id === info.me; const on = open === m.user_id;
    return (
      <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: tint(m.color, 0.3, 0.74), borderWidth: 1.5, borderColor: tint(m.color, 0.7), borderLeftWidth: 5, borderLeftColor: m.color }}>
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
            <Btn solid kind="good" t={m.role === 'parent' ? 'Make member' : 'Make parent'} onPress={() => run(() => famSetRole(m.user_id, m.role === 'parent' ? 'member' : 'parent'))} disabled={busy} />
            <Btn solid kind="good" t="Make owner" onPress={() => ask('Make ' + m.name + ' the owner?', 'You will become a parent. Only the owner can remove members and change the code.', 'Make owner', () => run(() => famTransfer(m.user_id)))} disabled={busy} />
            <Btn solid t="Remove" kind="danger" onPress={() => ask('Remove ' + m.name + '?', 'They lose access to this family. Their own data on their phone is not affected.', 'Remove', () => run(() => famRemove(m.user_id)))} disabled={busy} />
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
        <KbScroll contentContainerStyle={{ padding: 20, paddingBottom: 170 }} showsVerticalScrollIndicator={false}>
          {parent ? (
            <Rise>
              <Glass solid radius={24} style={{ padding: 16 }}>
                <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Invite code</Text>
                {info.invites_open ? (
                  <>
                    <Text style={{ color: DIM, fontSize: 12, lineHeight: 17, marginTop: 3 }}>Share it with your family. Everyone who joins needs an active My Life subscription.</Text>
                    <Text style={{ color: W, fontSize: 28, fontWeight: '900', letterSpacing: 6, textAlign: 'center', paddingVertical: 14, marginTop: 12, borderRadius: 16, backgroundColor: 'rgba(0,0,0,.28)', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.3)' }}>{showCode(info.code)}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <Btn solid t="Share code" kind="main" onPress={share} flex />
                      {owner ? <Btn solid t="New code" onPress={() => ask('Make a new code?', 'The old code stops working. People already in the family stay.', 'New code', () => run(famNewCode))} disabled={busy} flex /> : null}
                    </View>
                    {owner ? <View style={{ marginTop: 8 }}><Btn solid t="Turn off code" onPress={() => ask('Turn off the code?', 'Nobody can join until you turn it on again. People already in the family stay.', 'Turn off', () => run(() => famSetInvites(false), 'Code turned off.'))} disabled={busy} /></View> : null}
                  </>
                ) : (
                  <>
                    <Text style={{ color: DIM, fontSize: 12, lineHeight: 17, marginTop: 3 }}>The code is turned off, so nobody can join right now.{owner ? ' Turn it on to get a fresh code. Old codes stay dead.' : ' Ask the owner to turn it on.'}</Text>
                    {owner ? <View style={{ marginTop: 12 }}><Btn solid t="Turn on code" kind="main" onPress={() => run(() => famSetInvites(true), 'New code ready.')} disabled={busy} /></View> : null}
                  </>
                )}
              </Glass>
            </Rise>
          ) : null}
          {msg ? <Text style={{ color: '#ffe0ad', fontSize: 12.5, marginTop: 12 }}>{msg}</Text> : null}

          <Rise i={1}>
            <Label t="Members" />
            <View style={{ gap: 10 }}>{info.members.map((m) => <Row key={m.user_id} m={m} />)}</View>
            {owner ? <Text style={{ color: DIM, fontSize: 11.5, marginTop: 8, marginLeft: 4 }}>Tap a member to change their role or remove them.</Text> : null}
          </Rise>

          <Rise i={2}>
            <Label t="Birthdays" />
            <Glass solid radius={24} style={{ padding: 14 }}>
              <Text style={{ color: DIM, fontSize: 12, lineHeight: 17, marginBottom: 6 }}>Shown in the family calendar every year. Pick the day you were born (tap the year to go back). Everyone can set their own. The owner and parents can set it for anyone.</Text>
              {[...info.members.map((m) => ({ id: m.user_id, name: m.name, color: m.color, bd: m.birthday || '', mine: m.user_id === info.me, prof: false })), ...info.profiles.map((p) => ({ id: p.id, name: p.name, color: p.color, bd: p.birthday || '', mine: false, prof: true }))].map((x) => {
                const can = x.mine || parent;
                const save = (v: string | null) => run(() => (x.prof ? famProfileBirthday(x.id, v) : x.mine ? famSetBirthday(v) : famMemberBirthday(x.id, v)), v ? 'Birthday saved.' : 'Birthday cleared.');
                return (
                  <View key={x.id} style={{ paddingVertical: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Avatar name={x.name} color={x.color} size={30} />
                      <Text style={{ flex: 1, color: W, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{x.name}{x.mine ? ' (You)' : ''}</Text>
                      {x.bd && can ? <Pressable hitSlop={10} onPress={() => save(null)}><Text style={{ color: '#ffb3bf', fontSize: 12, fontWeight: '800' }}>Clear</Text></Pressable> : null}
                    </View>
                    {can ? <View style={{ marginTop: 6 }}><DateField past value={x.bd} onChange={(v) => save(v)} /></View> : <Text style={{ color: DIM, fontSize: 12.5, marginTop: 4, marginLeft: 40 }}>{x.bd ? bdText(x.bd) : 'Not set'}</Text>}
                  </View>
                );
              })}
              {msg ? <Text style={{ color: msg.indexOf('Birthday') === 0 ? '#8ff0d4' : '#ffb3bf', fontSize: 12.5, marginTop: 8 }}>{msg}</Text> : null}
            </Glass>
          </Rise>

          <Rise i={2}>
            <Label t="People without an account" />
            <Text style={{ color: DIM, fontSize: 11.5, lineHeight: 16, marginTop: -4, marginBottom: 8, marginLeft: 4 }}>For a child or a grandparent who does not use the app. A parent adds them here, then they can have tasks, chores, wishes and a birthday like everyone else.</Text>
            <Glass solid radius={24} style={{ padding: 14 }}>
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
                  <View style={{ marginTop: 10 }}><Btn solid t="Add" kind="good" onPress={() => run(async () => { await famAddProfile(pname, pickColor(info.profiles.length + 1)); setPname(''); })} disabled={!pname.trim() || busy} /></View>
                </>
              ) : null}
            </Glass>
          </Rise>

          {owner ? (
            <Rise i={3}>
              <Label t="Family name" />
              <Text style={{ color: DIM, fontSize: 11.5, lineHeight: 16, marginTop: -4, marginBottom: 8, marginLeft: 4 }}>Change the name everyone in the family sees. Only the owner can do this.</Text>
              <Glass solid radius={24} style={{ padding: 14 }}>
                <Field label="" value={rn} onChange={setRn} ph={info.name} max={40} />
                <View style={{ marginTop: 10 }}><Btn solid t="Rename" kind="good" onPress={() => run(async () => { await famRename(rn); setRn(''); }, 'Family renamed.')} disabled={!rn.trim() || busy} /></View>
              </Glass>
            </Rise>
          ) : null}

          <Rise i={4}>
            <View style={{ marginTop: 22 }}>
              <Btn solid t="Leave family" kind="danger" disabled={busy} onPress={() => ask('Leave this family?', owner && info.members.length > 1 ? 'You are the owner. Ownership passes to ' + nextOwner + ', and you leave the family. Your own data is not affected.' : owner ? 'You are the only member. The family will be removed.' : 'You lose access to the family. Your own data is not affected.', 'Leave', async () => { try { setBusy(true); await famLeave(); famForget(); router.dismissTo('/family' as any); } catch (e) { showAlert('Could not leave', famError(e)); } setBusy(false); })} />
            </View>
          </Rise>
          {owner ? (
            <Rise i={5}>
              <View style={{ marginTop: 10 }}>
                {!del ? <Btn solid t="Delete family" kind="danger" disabled={busy} onPress={() => setDel(true)} /> : (
                  <Glass solid radius={24} style={{ padding: 16 }}>
                    <Text style={{ color: '#ffb3bf', fontSize: 15, fontWeight: '800' }}>Delete this family?</Text>
                    <Text style={{ color: DIM, fontSize: 12.5, lineHeight: 18, marginTop: 4 }}>This removes the family for everyone: all members, tasks, activities and shopping items. It cannot be undone. To confirm, type the family name: {info.name}</Text>
                    <Field label="" value={dn} onChange={setDn} ph={info.name} max={40} />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                      <Btn solid t="Cancel" onPress={() => { setDel(false); setDn(''); }} flex />
                      <Btn solid t="Delete forever" kind="danger" busy={busy} disabled={!dn.trim()} flex onPress={async () => { try { setBusy(true); setMsg(''); await famDeleteAll(dn); famForget(); router.dismissTo('/family' as any); } catch (e) { showAlert('Could not delete', famError(e)); } setBusy(false); }} />
                    </View>
                  </Glass>
                )}
              </View>
            </Rise>
          ) : null}
        </KbScroll>
      </SafeAreaView>
    </View>
  );
}
