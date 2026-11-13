import React, { useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '../components/Txt';
import { Glass } from '../components/Glass';
import { Header } from '../components/IslamicUi';
import { FamilyBg, HouseHeart } from '../components/FamilyBg';
import { Rise } from '../components/Anim';
import { Avatar, Pill, Btn, Field, Note, Label, Tile, W, DIM } from '../components/FamilyUi';
import { useFamily, famCreate, famError, pickColor, isParent } from '../lib/family';
import { useFamTasks, useFamShop } from '../lib/familyData';
import { useLicense } from '../lib/license';
import { useName } from '../lib/store';

export default function Family() {
  const router = useRouter();
  const lic = useLicense();
  const f = useFamily();
  const myName = useName();
  const [make, setMake] = useState(false);
  const [fname, setFname] = useState('');
  const [mine, setMine] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const info = f.info;
  const tk = useFamTasks(info?.id);
  const sh = useFamShop(info?.id);
  const tkOpen = tk.rows.filter((x) => !x.done).length;
  const shLeft = sh.rows.filter((x) => !x.bought).length;

  const create = async () => {
    setBusy(true); setErr('');
    try { await famCreate(fname, mine || myName, pickColor(Date.now())); await f.refresh(); setMake(false); }
    catch (e) { setErr(famError(e)); }
    setBusy(false);
  };

  let body: React.ReactNode;
  if (f.state === 'loading') body = <View style={{ paddingVertical: 60 }}><ActivityIndicator color="#fff" /></View>;
  else if (lic.status === 'locked' || f.state === 'locked') {
    body = <Rise><Note warm t="Family Planner needs an active My Life subscription. Your own data is safe and stays on your phone. Renew to open your family again." /></Rise>;
  } else if (f.state === 'none' || !info) {
    body = (
      <>
        <Rise>
          <Glass radius={24} style={{ padding: 18 }}>
            <Text style={{ color: W, fontSize: 17, fontWeight: '800' }}>Plan together</Text>
            <Text style={{ color: DIM, fontSize: 13, lineHeight: 19, marginTop: 6 }}>One shared space for your family: tasks, activities and lists that stay in sync on everyone's phone.</Text>
          </Glass>
        </Rise>
        <Rise i={1}>
          <Glass radius={24} style={{ padding: 18, marginTop: 12 }}>
            <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Create a family</Text>
            <Text style={{ color: DIM, fontSize: 12.5, marginTop: 3 }}>You become the owner and get a code to share.</Text>
            {make ? (
              <>
                <Field label="Family name" value={fname} onChange={setFname} ph="e.g. The Rahman family" max={40} />
                <Field label="Your name in the family" value={mine} onChange={setMine} ph={myName} />
                {err ? <Text style={{ color: '#ffb3bf', fontSize: 12.5, marginTop: 10 }}>{err}</Text> : null}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                  <Btn t="Cancel" onPress={() => { setMake(false); setErr(''); }} flex />
                  <Btn t="Create" kind="main" onPress={create} busy={busy} disabled={!fname.trim()} flex />
                </View>
              </>
            ) : <View style={{ marginTop: 14 }}><Btn t="Create a family" kind="main" onPress={() => setMake(true)} /></View>}
          </Glass>
        </Rise>
        <Rise i={2}>
          <Glass radius={24} style={{ padding: 18, marginTop: 12 }}>
            <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>Join with a code</Text>
            <Text style={{ color: DIM, fontSize: 12.5, marginTop: 3 }}>Someone in your family gave you a code.</Text>
            <View style={{ marginTop: 14 }}><Btn t="Enter a code" onPress={() => router.push('/family-join' as any)} /></View>
          </Glass>
        </Rise>
        {f.offline ? <View style={{ marginTop: 12 }}><Note t="No internet connection right now." /></View> : null}
      </>
    );
  } else {
    const n = info.members.length;
    body = (
      <>
        <Rise>
          <Pressable onPress={() => router.push('/family-members' as any)}>
            <Glass radius={24} style={{ padding: 14, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', flex: 1 }}>
                {info.members.slice(0, 5).map((m, i) => <View key={m.user_id} style={{ marginLeft: i ? -12 : 0 }}><Avatar name={m.name} color={m.color} ring /></View>)}
                {n > 5 ? <View style={{ marginLeft: -12 }}><Avatar name={'+' + (n - 5)} color="#7c9cff" ring /></View> : null}
              </View>
              <Pill t={n + ' / ' + info.max_members + '  ›'} />
            </Glass>
          </Pressable>
        </Rise>
        {info.profiles.length ? (
          <Rise i={1}>
            <Text style={{ color: DIM, fontSize: 12, marginTop: 10, marginLeft: 4 }}>Also in the family: {info.profiles.map((p) => p.name).join(', ')}</Text>
          </Rise>
        ) : null}
        <Rise i={2}>
          <Label t="Plans" />
          <Tile ic="tasks" c="#5ee7df" t="Tasks" sub={tk.ready ? (tkOpen ? tkOpen + ' open' : 'Nothing open') : 'Tasks for everyone'} onPress={() => router.push('/family-tasks' as any)} />
          <Tile ic="shop" c="#ff8fab" t="Shopping list" sub={sh.ready ? (shLeft ? shLeft + ' to buy' : 'Nothing to buy') : 'One list for the family'} onPress={() => router.push('/family-shop' as any)} />
          <Tile ic="undo" c="#9aa6c4" t="Recently deleted" sub="Kept for 7 days" onPress={() => router.push('/family-trash' as any)} />
          <Note t={isParent(info.role) ? 'Share your family code from the members page so others can join. Activities and the calendar are coming next.' : 'Ask a parent for the family code if someone else wants to join. Activities and the calendar are coming next.'} />
        </Rise>
        {f.offline ? <View style={{ marginTop: 12 }}><Note t="You are offline. Showing the last saved copy." /></View> : null}
      </>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <FamilyBg />
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="Family Planner" sub={info ? info.name + ' · ' + info.members.length + (info.members.length === 1 ? ' member' : ' members') : 'Plan together'} right={<HouseHeart size={74} />} />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 170 }} showsVerticalScrollIndicator={false}>{body}</ScrollView>
      </SafeAreaView>
    </View>
  );
}
