import React, { useMemo, useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../components/Txt';
import { RecordPage, Intro } from '../components/RecordHubUi';
import { SearchField } from '../components/Shine';
import { Inp, DateField, W } from '../components/Ui';
import { Empty, BigBtn, SheetFrame, Lab, chip } from '../components/ColUi';
import { useStored } from '../lib/store';
import { confirmDelete } from '../lib/dialog';
import { tryForm } from '../lib/num';
import { validDate } from '../lib/documents';
import { ColArt } from '../components/ColArt';
import { ACC, BTN, TAGS, EMPTY_COL, dmy, today, type ColStore, type Lesson } from '../lib/collection';

const g = BTN;
const TAGC: Record<string, string> = { Work: '#4de1ff', Money: '#ffe84d', People: '#ff6ad5', Self: '#c6ff5a', Other: '#b07bff' };
type Form = Lesson;

function Sheet({ f, setF, onSave, onDelete, onClose }: { f: Form; setF: (x: Form) => void; onSave: () => void; onDelete?: () => void; onClose: () => void }) {
  const [tried, setTried] = useState(false); const set = (p: Partial<Form>) => setF({ ...f, ...p });
  const badDate = !validDate(f.date);
  const save = () => { setTried(true); tryForm('lesson'); if (!f.title.trim() || !f.text.trim() || badDate) return; onSave(); };
  return (
    <SheetFrame title={f.id ? 'Edit lesson' : 'Add lesson'} sub="Life Lessons" onClose={onClose}>
      <Lab t="THE LESSON" />
      <Inp value={f.title} onChangeText={(x: string) => set({ title: x })} placeholder="Short title (up to 30 letters), e.g. Check before you pay" maxLength={30} />
      {tried && !f.title.trim() ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please enter a title.</Text> : null}
      <Inp style={{ marginTop: 9, minHeight: 120, textAlignVertical: 'top' }} multiline value={f.text} onChangeText={(x: string) => set({ text: x })} placeholder="What happened, and what you learned" maxLength={1000} />
      {tried && !f.text.trim() ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please write what you learned.</Text> : null}
      <Lab t="ABOUT" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {TAGS.map((t) => <Pressable key={t} onPress={() => set({ tag: t })} accessibilityLabel={t}><View style={chip(f.tag === t, TAGC[t])}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{t}</Text></View></Pressable>)}
      </View>
      <Lab t="DATE" />
      <DateField value={f.date} onChange={(v: string) => set({ date: v })} past />
      {tried && badDate ? <Text style={{ color: '#ff9aa9', fontSize: 12, marginTop: 5 }}>Please pick a valid date.</Text> : null}
      <BigBtn t="Save" onPress={save} a11y="Save lesson" />
      {onDelete ? <BigBtn t="Delete" outline="#ff8da1" onPress={onDelete} a11y="Delete lesson" /> : null}
    </SheetFrame>
  );
}

export default function Screen() {
  const [st, setSt] = useStored<ColStore>('ml_collection', EMPTY_COL);
  const all = (st && st.lessons) || [];
  const [q, setQ] = useState(''); const [tag, setTag] = useState(''); const [f, setF] = useState<Form | null>(null);
  const list = useMemo(() => { const n = q.trim().toLowerCase(); return all.filter((l) => (!tag || l.tag === tag) && (!n || (l.title + ' ' + l.text).toLowerCase().includes(n))).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id); }, [all, q, tag]);
  const save = () => {
    if (!f) return; const l = { ...f, title: f.title.trim(), text: f.text.trim() };
    if (l.id) setSt({ ...st, lessons: all.map((x) => (x.id === l.id ? l : x)) });
    else setSt({ ...st, lessons: [...all, { ...l, id: st.next }], next: st.next + 1 });
    setF(null);
  };
  const del = () => { if (!f || !f.id) return; confirmDelete('this lesson', () => { setSt({ ...st, lessons: all.filter((x) => x.id !== f.id) }); setF(null); }, { title: 'Delete this lesson?', message: 'It will be removed from this phone. This cannot be undone.' }); };
  const plus = <Pressable onPress={() => setF({ id: 0, title: '', text: '', date: today(), tag: 'Self' })} accessibilityLabel="Add lesson"><LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 28, fontWeight: '300', marginTop: -2 }}>+</Text></LinearGradient></Pressable>;
  return (
    <RecordPage title="Life Lessons" sub={all.length + (all.length === 1 ? ' lesson' : ' lessons')} right={plus} bg={<ColArt />}>
      <Intro plain title="So you do not forget" text="Write down what life taught you" colors={['rgba(142,168,255,.5)', 'rgba(183,148,255,.4)']} />
      <View style={{ marginTop: 12 }}><SearchField value={q} onChangeText={setQ} placeholder="Search lessons" /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {['', ...TAGS].map((t) => <Pressable key={t || 'all'} onPress={() => setTag(t)} accessibilityLabel={t || 'All'}><View style={chip(tag === t, t ? TAGC[t] : '#8ea8ff')}><Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{t || 'All'}</Text></View></Pressable>)}
      </ScrollView>
      {list.length ? list.map((l) => (
        <Pressable key={l.id} onPress={() => setF({ ...l })} accessibilityLabel={'Open ' + l.title} style={({ pressed }) => ({ marginTop: 10, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
          <View style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.34)', padding: 14 }}>
            <LinearGradient colors={['rgba(255,255,255,.12)', 'rgba(255,255,255,.03)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: TAGC[l.tag] || ACC.lessons }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 6 }}><Text style={{ color: TAGC[l.tag] || ACC.lessons, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 }}>{l.tag.toUpperCase()}</Text><Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5 }}>{dmy(l.date)}</Text></View>
            <Text numberOfLines={2} style={{ color: W, fontSize: 16.5, fontWeight: '800', marginTop: 4, paddingLeft: 6 }}>{l.title}</Text>
            <Text numberOfLines={3} style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, lineHeight: 19, marginTop: 4, paddingLeft: 6 }}>{l.text}</Text>
          </View>
        </Pressable>
      )) : <Empty e={q.trim() || tag ? 'search' : 'bulb'} t={q.trim() || tag ? 'Nothing found' : 'No lessons yet'} s={q.trim() || tag ? 'Try another word or tag.' : 'Tap + to write down something you learned.'} />}
      {f ? <Sheet f={f} setF={setF} onSave={save} onDelete={f.id ? del : undefined} onClose={() => setF(null)} /> : null}
    </RecordPage>
  );
}
