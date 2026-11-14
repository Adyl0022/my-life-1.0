import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './Txt';
import { Glass } from './Glass';
import { showAlert } from '../lib/dialog';
import { Avatar, Btn, Chip, Field, Note, W, DIM } from './FamilyUi';
import { famError, isParent, useAutoRefresh, FInfo } from '../lib/family';
import { useFamChores, useFamChoreLog, useFamRedeems, useFamRewards, useBalances, choreSave, choreDelete, choreMark, choreDecide, rewardSave, rewardDelete, rewardAsk, redeemDecide, choreWho, nextWho, periodOf, peopleOf, useReloadOnFocus, FChore, FReward } from '../lib/familyData';

// Chores that take turns, the points they earn, and the rewards the points can buy.
// A chore ticked by a child waits for a parent to check it. Only parents give points, approve rewards and set rewards.
const num = (s: string) => s.replace(/[^0-9]/g, '').slice(0, 4);

function usePoints(info: FInfo | null) {
  const chores = useFamChores(info?.id), log = useFamChoreLog(info?.id), rewards = useFamRewards(info?.id), reds = useFamRedeems(info?.id);
  const sig = log.rows.map((x) => x.id + x.status).join() + reds.rows.map((x) => x.id + x.status).join();
  const b = useBalances(info?.id, sig);
  useReloadOnFocus(chores.reload, log.reload, rewards.reload, reds.reload, b.reload);
  // a request or a tick from another phone shows up within a few seconds, without leaving the screen
  useAutoRefresh(() => { chores.reload(); log.reload(); rewards.reload(); reds.reload(); b.reload(); }, 5000);
  return { chores, log, rewards, reds, b };
}

const Stars = ({ n }: { n: number }) => <Text style={{ color: '#ffc46b', fontWeight: '900' }}>⭐ {n}</Text>;

export function HouseChores({ info }: { info: FInfo | null }) {
  const { chores, log, b } = usePoints(info);
  const people = useMemo(() => peopleOf(info), [info]);
  const me = info?.me || ''; const parent = isParent(info?.role);
  const [panel, setPanel] = useState(false);
  const [eid, setEid] = useState<string | null>(null);
  const [title, setTitle] = useState(''); const [pts, setPts] = useState('10');
  const [every, setEvery] = useState<'daily' | 'weekly'>('weekly');
  const [rot, setRot] = useState<string[]>([]);
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  const pn = (id: string) => people.find((p) => p.id === id);

  const run = async (fn: () => Promise<any>) => { setBusy(true); setMsg(''); try { await fn(); await Promise.all([log.reload(), b.reload()]); } catch (e) { setMsg(famError(e)); } setBusy(false); };
  const open = (c?: FChore) => { setPanel(true); setMsg(''); setEid(c?.id || null); setTitle(c?.title || ''); setPts(String(c?.points || 10)); setEvery(c?.every || 'weekly'); setRot(c?.rotate || []); };
  const save = () => {
    if (!title.trim()) { setMsg('Please type the chore.'); return; }
    if (!rot.length) { setMsg('Choose at least one person.'); return; }
    run(async () => { await choreSave(eid, title, Math.max(1, Math.min(100, +pts || 0)), every, rot); await chores.reload(); setPanel(false); setEid(null); });
  };
  const del = () => showAlert('Delete this chore?', 'Points already given stay.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => run(async () => { await choreDelete(eid!); await chores.reload(); setPanel(false); setEid(null); }) },
  ]);
  const pending = log.rows.filter((x) => x.status === 'pending');

  return (
    <View>
      <Glass solid radius={24} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', paddingVertical: 14, paddingHorizontal: 6, marginBottom: 6 }}>
        {people.map((p) => (
          <View key={p.id} style={{ alignItems: 'center', width: 74, paddingVertical: 4 }}>
            <Avatar name={p.name} color={p.color} size={40} />
            <View style={{ marginTop: 4 }}><Stars n={b.bal[p.id] || 0} /></View>
            <Text style={{ color: DIM, fontSize: 11 }} numberOfLines={1}>{p.id === me ? 'Me' : p.name}</Text>
          </View>
        ))}
      </Glass>
      {msg ? <Note warm t={msg} /> : null}
      {parent && pending.length ? (
        <View>
          <Text style={{ color: '#ffc46b', fontSize: 11, letterSpacing: 1.5, fontWeight: '800', marginTop: 14, marginBottom: 8, marginLeft: 4 }}>WAITING FOR YOU TO CHECK</Text>
          {pending.map((x) => { const c = chores.rows.find((q) => q.id === x.chore_id); const p = pn(x.person); if (!c) return null;
            return (
              <Glass key={x.id} solid radius={22} style={{ padding: 13, marginBottom: 10, borderColor: 'rgba(255,196,107,.7)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {p ? <Avatar name={p.name} color={p.color} size={30} /> : null}
                  <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>{p?.name || 'Someone'} did: {c.title}</Text><Text style={{ color: DIM, fontSize: 11.5 }}>+{c.points} ⭐ if you approve</Text></View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <Btn solid t="Approve" kind="good" onPress={() => run(() => choreDecide(x.id, true))} disabled={busy} flex />
                  <Btn solid t="Not done" onPress={() => run(() => choreDecide(x.id, false))} disabled={busy} flex />
                </View>
              </Glass>
            ); })}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 8, marginHorizontal: 4 }}>
        <Text style={{ color: DIM, fontSize: 11, letterSpacing: 1.5, fontWeight: '800' }}>THIS TURN</Text>
      </View>
      {panel ? (
        <Glass solid radius={22} style={{ padding: 14, marginBottom: 12 }}>
          <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>{eid ? 'Edit chore' : 'New chore'}</Text>
          <Field label="Chore" value={title} onChange={setTitle} ph="Wash the dishes" max={80} />
          <Field label="Points for doing it (1 to 100)" value={pts} onChange={(s) => setPts(num(s))} ph="10" max={3} />
          <Text style={{ color: DIM, fontSize: 12, marginTop: 14, marginBottom: 6 }}>How often it changes person</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}><Chip t="Every day" on={every === 'daily'} onPress={() => setEvery('daily')} /><Chip t="Every week" on={every === 'weekly'} onPress={() => setEvery('weekly')} /></View>
          <Text style={{ color: DIM, fontSize: 12, marginTop: 14, marginBottom: 6 }}>Who takes turns (tap in the order you want)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {people.map((p) => { const i = rot.indexOf(p.id); return <Chip key={p.id} t={(i >= 0 ? i + 1 + '. ' : '') + p.name} color={p.color} on={i >= 0} onPress={() => setRot(i >= 0 ? rot.filter((x) => x !== p.id) : [...rot, p.id])} />; })}
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Btn t="Save" kind="main" onPress={save} busy={busy} flex />
            <Btn t="Cancel" onPress={() => { setPanel(false); setEid(null); }} disabled={busy} />
            {eid ? <Btn t="Delete" kind="danger" onPress={del} disabled={busy} /> : null}
          </View>
        </Glass>
      ) : null}
      {chores.rows.map((c) => {
        const period = periodOf(c.every); const who = choreWho(c, period); const nx = nextWho(c, period); const p = pn(who); const q = pn(nx);
        const l = log.rows.find((x) => x.chore_id === c.id && x.period === period);
        const mineOrParent = who === me || parent;
        return (
          <Glass key={c.id} solid radius={22} style={{ padding: 13, marginBottom: 10 }}>
            <Pressable disabled={!parent} onPress={() => open(c)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 22 }}>🧽</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: W, fontSize: 14.5, fontWeight: '700' }}>{c.title}</Text>
                  <Text style={{ color: DIM, fontSize: 11.5, marginTop: 2 }}>{c.every === 'weekly' ? 'Changes every week' : 'Changes every day'} · {c.points} ⭐</Text>
                </View>
                {p ? <Avatar name={p.name} color={p.color} size={34} /> : null}
              </View>
              <Text style={{ color: DIM, fontSize: 11.5, marginTop: 8 }}>Now: {p ? (p.id === me ? 'You' : p.name) : '—'}{q ? ' · Next: ' + (q.id === me ? 'You' : q.name) : ''}</Text>
            </Pressable>
            {l ? (
              <Text style={{ marginTop: 8, color: l.status === 'approved' ? '#8ff0d4' : '#ffc46b', fontSize: 12.5, fontWeight: '700' }}>{l.status === 'approved' ? '✔ Done · +' + c.points + ' ⭐ given' : '✔ Done · waiting for a parent to check'}</Text>
            ) : mineOrParent ? (
              <View style={{ marginTop: 10 }}><Btn solid t={'✔ Mark done' + (p && who !== me ? ' (' + p.name + ')' : '')} kind="good" onPress={() => run(() => choreMark(c.id, period))} disabled={busy} /></View>
            ) : null}
          </Glass>
        );
      })}
      {chores.ready && !chores.rows.length ? <Note t={parent ? 'No chores yet. Tap + New chore to start taking turns.' : 'No chores yet. A parent can add them.'} /> : null}
      {parent && !panel ? <View style={{ marginTop: 6 }}><Btn solid t="+ New chore" kind="main" onPress={() => open()} /></View> : null}
    </View>
  );
}

export function HouseRewards({ info }: { info: FInfo | null }) {
  const { rewards, reds, b } = usePoints(info);
  const people = useMemo(() => peopleOf(info), [info]);
  const me = info?.me || ''; const parent = isParent(info?.role);
  const [who, setWho] = useState('');
  const sel = people.find((p) => p.id === (who || me)) || people[0];
  const [panel, setPanel] = useState(false);
  const [eid, setEid] = useState<string | null>(null);
  const [title, setTitle] = useState(''); const [cost, setCost] = useState('30');
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [ok, setOk] = useState('');
  const pn = (id: string) => people.find((p) => p.id === id);
  const canAsk = !!sel && (sel.id === me || parent);

  const run = async (fn: () => Promise<any>, done?: string) => { setBusy(true); setMsg(''); setOk(''); try { await fn(); await Promise.all([reds.reload(), rewards.reload(), b.reload()]); if (done) setOk(done); } catch (e) { setMsg(famError(e)); } setBusy(false); };
  const open = (r?: FReward) => { setPanel(true); setMsg(''); setEid(r?.id || null); setTitle(r?.title || ''); setCost(String(r?.cost || 30)); };
  const save = () => {
    if (!title.trim()) { setMsg('Please type the reward.'); return; }
    run(async () => { await rewardSave(eid, title, Math.max(1, Math.min(1000, +cost || 0))); setPanel(false); setEid(null); });
  };
  const del = () => showAlert('Delete this reward?', 'Requests already waiting stay.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => run(async () => { await rewardDelete(eid!); setPanel(false); setEid(null); }) },
  ]);
  const held = (id: string) => reds.rows.filter((x) => x.person === id && x.status === 'pending').reduce((a, x) => a + x.cost, 0);
  const have = sel ? (b.bal[sel.id] || 0) - held(sel.id) : 0;
  const pending = reds.rows.filter((x) => x.status === 'pending');
  const recent = reds.rows.filter((x) => x.status !== 'pending' && sel && x.person === sel.id).slice(0, 4);

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {people.map((p) => { const on = sel?.id === p.id; return (
          <Pressable key={p.id} onPress={() => setWho(p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 5, paddingLeft: 5, paddingRight: 12, borderRadius: 999, backgroundColor: on ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.3)', borderWidth: 1, borderColor: on ? p.color : 'rgba(255,255,255,.15)' }}>
            <Avatar name={p.name} color={p.color} size={26} /><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{p.id === me ? 'Me' : p.name}</Text>
          </Pressable>); })}
      </View>
      <Glass solid radius={24} style={{ alignItems: 'center', padding: 18, marginBottom: 12 }}>
        <Text style={{ color: DIM, fontSize: 11, letterSpacing: 1.5, fontWeight: '800' }}>{sel ? (sel.id === me ? 'MY POINTS' : sel.name.toUpperCase() + "'S POINTS") : 'POINTS'}</Text>
        <Text style={{ color: '#ffc46b', fontSize: 44, fontWeight: '900', marginTop: 2 }}>⭐ {sel ? b.bal[sel.id] || 0 : 0}</Text>
        {sel && held(sel.id) ? <Text style={{ color: DIM, fontSize: 11.5 }}>{held(sel.id)} ⭐ waiting for a parent to approve</Text> : null}
      </Glass>
      {msg ? <Note warm t={msg} /> : null}{ok ? <Note t={ok} /> : null}
      {parent && pending.length ? (
        <View>
          <Text style={{ color: '#ffc46b', fontSize: 11, letterSpacing: 1.5, fontWeight: '800', marginBottom: 8, marginLeft: 4 }}>WAITING FOR A PARENT</Text>
          {pending.map((x) => { const p = pn(x.person); return (
            <Glass key={x.id} solid radius={22} style={{ padding: 13, marginBottom: 10, borderColor: 'rgba(255,196,107,.7)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {p ? <Avatar name={p.name} color={p.color} size={30} /> : null}
                <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>{p?.name || 'Someone'}</Text><Text style={{ color: DIM, fontSize: 11.5 }}>Wants: {x.title} ({x.cost} ⭐)</Text></View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <Btn solid t="Approve" kind="good" onPress={() => run(() => redeemDecide(x.id, true))} disabled={busy} flex />
                <Btn solid t="Not now" onPress={() => run(() => redeemDecide(x.id, false))} disabled={busy} flex />
              </View>
            </Glass>); })}
        </View>
      ) : null}
      {panel ? (
        <Glass solid radius={22} style={{ padding: 14, marginBottom: 12 }}>
          <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>{eid ? 'Edit reward' : 'New reward'}</Text>
          <Field label="Reward" value={title} onChange={setTitle} ph="30 minutes of games" max={60} />
          <Field label="Points needed" value={cost} onChange={(s) => setCost(num(s))} ph="30" max={4} />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Btn t="Save" kind="main" onPress={save} busy={busy} flex />
            <Btn t="Cancel" onPress={() => { setPanel(false); setEid(null); }} disabled={busy} />
            {eid ? <Btn t="Delete" kind="danger" onPress={del} disabled={busy} /> : null}
          </View>
        </Glass>
      ) : null}
      <Text style={{ color: DIM, fontSize: 11, letterSpacing: 1.5, fontWeight: '800', marginTop: 4, marginBottom: 8, marginLeft: 4 }}>REWARDS</Text>
      {rewards.rows.map((r) => {
        const enough = have >= r.cost;
        return (
          <Glass key={r.id} solid radius={22} style={{ padding: 13, marginBottom: 10, opacity: enough ? 1 : 0.6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 22 }}>🎁</Text>
              <Pressable disabled={!parent} onPress={() => open(r)} style={{ flex: 1 }}>
                <Text style={{ color: W, fontSize: 14.5, fontWeight: '700' }}>{r.title}</Text>
                <Text style={{ color: DIM, fontSize: 11.5, marginTop: 2 }}>{r.cost} ⭐{enough ? '' : ' · ' + (r.cost - have) + ' more to go'}</Text>
              </Pressable>
              {canAsk ? (enough ? <Btn solid t="Ask" kind="good" onPress={() => run(() => rewardAsk(r.id, sel!.id), 'Asked. A parent will see it.')} disabled={busy} /> : <Text style={{ fontSize: 18 }}>🔒</Text>) : null}
            </View>
          </Glass>
        );
      })}
      {rewards.ready && !rewards.rows.length ? <Note t={parent ? 'No rewards yet. Add things the points can buy, like game time or choosing dinner.' : 'No rewards yet. A parent can add them.'} /> : null}
      {parent && !panel ? <View style={{ marginTop: 6 }}><Btn solid t="+ New reward" kind="main" onPress={() => open()} /></View> : null}
      {recent.length ? <View style={{ marginTop: 16 }}><Text style={{ color: DIM, fontSize: 11, letterSpacing: 1.5, fontWeight: '800', marginBottom: 6, marginLeft: 4 }}>RECENT</Text>
        {recent.map((x) => <Text key={x.id} style={{ color: DIM, fontSize: 12.5, marginLeft: 4, marginBottom: 3 }}>{x.status === 'approved' ? '✔' : '✕'} {x.title} · {x.cost} ⭐ · {x.status === 'approved' ? 'approved' : 'not now'}</Text>)}</View> : null}
      <Text style={{ color: DIM, fontSize: 11.5, marginLeft: 4, marginTop: 12 }}>Only a parent can approve rewards, check chores and set rewards.</Text>
    </View>
  );
}
