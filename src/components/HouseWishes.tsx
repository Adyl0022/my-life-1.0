import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './Txt';
import { Glass } from './Glass';
import { showAlert } from '../lib/dialog';
import { Avatar, Btn, Field, Note, W, DIM } from './FamilyUi';
import { famError, isParent, FInfo } from '../lib/family';
import { useFamWishes, useFamClaims, wishSave, wishDelete, wishClaim, peopleOf, useReloadOnFocus, FWish } from '../lib/familyData';

// Wish lists: everyone has their own, and the others can say "I'll get this" so a gift is never bought twice.
// The person a list belongs to never sees who is getting what (the server does not send it to them), so gifts stay a surprise.
export function HouseWishes({ info }: { info: FInfo | null }) {
  const w = useFamWishes(info?.id);
  const cl = useFamClaims(info?.id);
  useReloadOnFocus(w.reload, cl.reload);
  const people = useMemo(() => peopleOf(info), [info]);
  const me = info?.me || '';
  const [who, setWho] = useState('');
  const sel = people.find((p) => p.id === (who || me)) || people[0];
  const mine = !!sel && sel.id === me;
  const canEdit = !!sel && (mine || (!sel.member && isParent(info?.role)));
  const [panel, setPanel] = useState(false);
  const [eid, setEid] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const list = w.rows.filter((x) => sel && x.owner === sel.id);
  const claimOf = (id: string) => cl.rows.find((c) => c.wish_id === id)?.claimer || '';
  const nameOf = (id: string) => (id === me ? 'You are' : (people.find((p) => p.id === id)?.name || 'Someone') + ' is');

  const open = (x?: FWish) => { setPanel(true); setMsg(''); setEid(x?.id || null); setTitle(x?.title || ''); setPrice(x?.price || ''); setNote(x?.note || ''); };
  const save = async () => {
    if (!sel || !title.trim()) { setMsg('Please type what is wished for.'); return; }
    setBusy(true); setMsg('');
    try { await wishSave(eid, sel.id, title, price, note); await w.reload(); setPanel(false); setEid(null); } catch (e) { setMsg(famError(e)); }
    setBusy(false);
  };
  const del = () => showAlert('Delete this wish?', 'It is removed for everyone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { try { await wishDelete(eid!); await w.reload(); setPanel(false); setEid(null); } catch (e) { setMsg(famError(e)); } } },
  ]);
  const claim = async (x: FWish, on: boolean) => {
    setMsg('');
    try { await wishClaim(x.id, on); await cl.reload(); } catch (e) { setMsg(famError(e)); cl.reload(); }
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {people.map((p) => {
          const on = sel?.id === p.id;
          return (
            <Pressable key={p.id} onPress={() => { setWho(p.id); setPanel(false); setMsg(''); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 5, paddingLeft: 5, paddingRight: 12, borderRadius: 999, backgroundColor: on ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.3)', borderWidth: 1, borderColor: on ? p.color : 'rgba(255,255,255,.15)' }}>
              <Avatar name={p.name} color={p.color} size={26} />
              <Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{p.id === me ? 'Me' : p.name}</Text>
            </Pressable>
          );
        })}
      </View>
      {msg ? <Note warm t={msg} /> : null}
      {canEdit ? (panel ? (
        <Glass solid radius={22} style={{ padding: 14, marginBottom: 12 }}>
          <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>{eid ? 'Edit wish' : 'New wish'}</Text>
          <Field label="What" value={title} onChange={setTitle} ph="Red bicycle" max={80} />
          <Field label="About how much (optional)" value={price} onChange={setPrice} ph="RM 350" max={30} />
          <Field label="Note (optional)" value={note} onChange={setNote} ph="Size 20 inch" max={200} />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Btn t="Save" kind="main" onPress={save} busy={busy} flex />
            <Btn t="Cancel" onPress={() => { setPanel(false); setEid(null); }} disabled={busy} />
            {eid ? <Btn t="Delete" kind="danger" onPress={del} disabled={busy} /> : null}
          </View>
        </Glass>
      ) : <View style={{ marginBottom: 12 }}><Btn solid t="+ Add a wish" kind="main" onPress={() => open()} /></View>) : null}
      {list.map((x) => {
        const c = claimOf(x.id);
        return (
          <Glass key={x.id} solid radius={22} style={{ marginBottom: 10, padding: 13, borderColor: c ? 'rgba(94,231,223,.6)' : 'rgba(255,255,255,.22)' }}>
            <Pressable disabled={!canEdit} onPress={() => open(x)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 22 }}>🎁</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: W, fontSize: 14.5, fontWeight: '700' }}>{x.title}</Text>
                  {x.price || x.note ? <Text style={{ color: DIM, fontSize: 11.5, marginTop: 2 }}>{[x.price, x.note].filter(Boolean).join(' · ')}</Text> : null}
                </View>
              </View>
            </Pressable>
            {!mine ? (c
              ? <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#8ff0d4', fontSize: 12.5, fontWeight: '700' }}>✔ {nameOf(c)} getting this</Text>
                  {c === me ? <Pressable hitSlop={10} onPress={() => claim(x, false)}><Text style={{ color: '#ffb3bf', fontSize: 12, fontWeight: '800' }}>Undo</Text></Pressable> : null}
                </View>
              : <View style={{ marginTop: 10 }}><Btn solid t="🎁 I'll get this" kind="good" onPress={() => claim(x, true)} /></View>) : null}
          </Glass>
        );
      })}
      {w.ready && !list.length ? <Note t={mine ? 'Your list is empty. Tap + Add a wish. Others will see it, but never who is getting what.' : sel && !sel.member ? 'Nothing here yet. A parent can add wishes for ' + sel.name + '.' : 'No wishes yet.'} /> : null}
      {mine && list.length ? <Text style={{ color: DIM, fontSize: 11.5, marginLeft: 4, marginTop: 4 }}>You cannot see who is getting your wishes. It stays a surprise.</Text> : null}
    </View>
  );
}
