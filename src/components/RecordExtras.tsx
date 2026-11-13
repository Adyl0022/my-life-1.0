import { fileStamp } from '../lib/exporter';
import React, { useState } from 'react';
import { View, Pressable, Image, Modal, Platform } from 'react-native';
import { Text } from './Txt';
import { LinearGradient } from 'expo-linear-gradient';
import { Glass } from './Glass';
import { buildRecordHtml } from '../lib/recordPdf';
import { useName } from '../lib/store';
import { Inp, DateField, todayStr, W } from './Ui';
import { cs, cu } from '../lib/region';

export type Fu = { id: number; date: string; liters: number; amt: number; odo: number };
export type Pt = { id: number; name: string; date: string; odo: number; life: number };
export type Dc = { id: number; title: string; date: string; uri: string };
export type Ren = { roadtax?: string; insurance?: string; licence?: string };
export type Ext = { profile?: { model: string; plate: string }; renew?: Ren; fuel?: Fu[]; parts?: Pt[]; docs?: Dc[] };
type P<T> = { d: T; upd: (fn: (x: any) => any) => void };

const PG = ['#ff8fab', '#b794ff'] as [string, string];
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const num = (n: number) => n.toLocaleString('en-MY', { maximumFractionDigits: 0 });
const dec = (n: number, k = 2) => n.toLocaleString('en-MY', { minimumFractionDigits: k, maximumFractionDigits: k });
const fd = (s: string) => { const p = (s || '').split('-'); return p.length === 3 ? parseInt(p[2], 10) + ' ' + MO[parseInt(p[1], 10) - 1] + ' ' + p[0] : s; };
const dim = 'rgba(255,255,255,.65)';
const f = (s: string) => parseFloat((s || '').replace(',', '.'));
const daysTo = (s: string) => { const a = new Date(s + 'T00:00:00').getTime(); const n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((a - n.getTime()) / 86400000); };

const Card = ({ title, sub, children, right }: { title: string; sub?: string; children: React.ReactNode; right?: React.ReactNode }) => (
  <Glass radius={24} style={{ marginTop: 12, padding: 14 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>{title}</Text>{sub ? <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 1 }}>{sub}</Text> : null}</View>
      {right}
    </View>
    {children}
  </Glass>
);
const Btn = ({ t, onPress, h = 42, w = 16 }: { t: string; onPress: () => void; h?: number; w?: number }) => <Pressable onPress={onPress}><LinearGradient colors={PG} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: h, paddingHorizontal: w, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 12, fontWeight: '800' }}>{t}</Text></LinearGradient></Pressable>;
const Sq = ({ t, onPress, c = W, label }: { t: string; onPress: () => void; c?: string; label: string }) => <Pressable accessibilityLabel={label} onPress={onPress} style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c, fontSize: 14 }}>{t}</Text></Pressable>;
const Stat = ({ l, v }: { l: string; v: string }) => <View style={{ flex: 1, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,.08)' }}><Text style={{ color: 'rgba(255,255,255,.68)', fontSize: 10.5 }}>{l}</Text><Text style={{ color: W, fontSize: 15, fontWeight: '800', marginTop: 2 }} numberOfLines={1}>{v}</Text></View>;
const Row = ({ children, last }: { children: React.ReactNode; last?: boolean }) => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(255,255,255,.1)' }}>{children}</View>;
const Chip = ({ t, on, onPress }: { t: string; on?: boolean; onPress: () => void }) => <Pressable onPress={onPress} style={{ paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1, borderColor: on ? 'transparent' : 'rgba(255,255,255,.2)', backgroundColor: on ? '#b06ad8' : 'rgba(255,255,255,.08)' }}><Text style={{ color: W, fontSize: 12, fontWeight: '700' }}>{t}</Text></Pressable>;

// 7. Vehicle profile ---------------------------------------------------------
export function ProfileCard({ d, upd, name }: P<Ext> & { name: string }) {
  const [ed, setEd] = useState(false); const [m, setM] = useState(''); const [pl, setPl] = useState('');
  const pr = d.profile;
  return (
    <Glass radius={22} style={{ marginTop: 12, padding: 14 }}>
      {!ed ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10.5, fontWeight: '700', letterSpacing: 1.2 }}>{name.toUpperCase()}</Text>
            <Text style={{ color: W, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{pr && pr.model ? pr.model : 'Add model name'}</Text>
            <Text style={{ color: '#ffb3c6', fontSize: 13, fontWeight: '700', marginTop: 1, letterSpacing: 1 }}>{pr && pr.plate ? pr.plate : 'Plate number'}</Text>
          </View>
          <Sq t="✎" label="Edit profile" c="#ffd593" onPress={() => { setM(pr?.model || ''); setPl(pr?.plate || ''); setEd(true); }} />
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>Vehicle profile · {name}</Text>
          <Inp value={m} onChangeText={setM} placeholder="Model, e.g. Honda RS150R" />
          <Inp value={pl} onChangeText={(v: string) => setPl(v.toUpperCase())} autoCapitalize="characters" placeholder="Plate number, e.g. WXX 1234" />
          <View style={{ flexDirection: 'row', gap: 8 }}><Btn t="Save" onPress={() => { upd((x) => ({ ...x, profile: { model: m.trim(), plate: pl.trim() } })); setEd(false); }} /><Pressable onPress={() => setEd(false)} style={{ height: 42, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 12, fontWeight: '700' }}>Cancel</Text></Pressable></View>
        </View>
      )}
    </Glass>
  );
}

// 2. Renewals ----------------------------------------------------------------
const RK: [keyof Ren, string][] = [['roadtax', 'Road tax'], ['insurance', 'Insurance'], ['licence', 'Driving licence']];
export const renewStatus = (s?: string) => {
  if (!s) return { txt: 'Not set', col: 'rgba(255,255,255,.6)', bg: 'rgba(255,255,255,.1)', n: 9999 };
  const n = daysTo(s);
  if (n < 0) return { txt: 'Expired ' + -n + (n === -1 ? ' day' : ' days') + ' ago', col: '#ffb3c6', bg: 'rgba(255,143,171,.25)', n };
  if (n <= 30) return { txt: n === 0 ? 'Today' : n + (n === 1 ? ' day left' : ' days left'), col: '#ffd593', bg: 'rgba(255,196,107,.25)', n };
  if (n <= 60) return { txt: n + ' days left', col: '#ffe9b0', bg: 'rgba(255,196,107,.14)', n };
  return { txt: n + ' days left', col: '#7df0c6', bg: 'rgba(94,231,181,.18)', n };
};
export function RenewCard({ d, upd }: P<Ext>) {
  const [ek, setEk] = useState<keyof Ren | ''>(''); const [ev, setEv] = useState(todayStr());
  const r = d.renew || {};
  return (
    <Card title="Road Tax, Insurance and Licence" sub="Enter the expiry date and see how many days are left">
      <View style={{ marginTop: 6 }}>
        {RK.map(([k, label], i) => {
          const s = renewStatus(r[k]);
          if (ek === k) return (
            <View key={k} style={{ paddingVertical: 8, gap: 8, borderBottomWidth: i === 2 ? 0 : 1, borderBottomColor: 'rgba(255,255,255,.1)' }}>
              <Text style={{ color: W, fontSize: 13, fontWeight: '700' }}>{label} expires on</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><DateField value={ev} onChange={setEv} style={{ flex: 1 }} /><Btn t="Save" onPress={() => { upd((x) => ({ ...x, renew: { ...(x.renew || {}), [k]: ev } })); setEk(''); }} /><Sq t="✕" label="Cancel" onPress={() => setEk('')} /></View>
            </View>
          );
          return (
            <Row key={k} last={i === 2}>
              <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14, fontWeight: '600' }}>{label}</Text><Text style={{ color: dim, fontSize: 11.5, marginTop: 1 }}>{r[k] ? 'Expires ' + fd(r[k] as string) : 'No date yet'}</Text></View>
              <View style={{ paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999, backgroundColor: s.bg }}><Text style={{ color: s.col, fontSize: 11, fontWeight: '800' }}>{s.txt}</Text></View>
              {r[k] ? <Sq t="✎" label="Edit" c="#ffd593" onPress={() => { setEv(r[k] as string); setEk(k); }} /> : <Btn t="+ Set" h={34} w={12} onPress={() => { setEv(todayStr()); setEk(k); }} />}
            </Row>
          );
        })}
      </View>
    </Card>
  );
}

// 3. Fuel log ----------------------------------------------------------------
export function FuelCard({ d, upd }: P<Ext>) {
  const [dt, setDt] = useState(todayStr()); const [li, setLi] = useState(''); const [rm, setRm] = useState(''); const [od, setOd] = useState('');
  const list = (d.fuel || []).slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.odo - b.odo));
  // efficiency: distance since the previous fill, divided by litres of this fill (assumes you fill up each time)
  const eff: { id: number; kml: number; rpk: number }[] = [];
  for (let i = 1; i < list.length; i++) { const a = list[i - 1], b = list[i]; const dk = b.odo - a.odo; if (a.odo > 0 && b.odo > 0 && dk > 0 && b.liters > 0) eff.push({ id: b.id, kml: dk / b.liters, rpk: b.amt / dk }); }
  const avg = eff.length ? eff.reduce((s, x) => s + x.kml, 0) / eff.length : null;
  const avgR = eff.length ? eff.reduce((s, x) => s + x.rpk, 0) / eff.length : null;
  const last = eff.length ? eff[eff.length - 1].kml : null;
  const nw = new Date(); const key = (x: Date) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0');
  const cur = key(nw), prev = key(new Date(nw.getFullYear(), nw.getMonth() - 1, 1));
  const sp = (k: string) => list.filter((x) => x.date.slice(0, 7) === k).reduce((s, x) => s + x.amt, 0);
  const add = () => { const l = f(li), a = f(rm), o = parseInt(od, 10); if (!(l > 0) || !(a > 0)) return; upd((x) => ({ ...x, fuel: [...(x.fuel || []), { id: Date.now(), date: dt || todayStr(), liters: l, amt: a, odo: o >= 0 ? o : 0 }] })); setLi(''); setRm(''); setOd(''); };
  return (
    <Card title="Fuel Log" sub="Fuel economy and cost per km" right={<Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{cs()}{dec(list.reduce((s, x) => s + x.amt, 0))}</Text>}>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Stat l="Average km/L" v={avg ? dec(avg, 1) : '-'} />
        <Stat l="Last fill km/L" v={last ? dec(last, 1) : '-'} />
        <Stat l="Cost / km" v={avgR ? cs() + dec(avgR) : '-'} />
      </View>
      <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 11.5, marginTop: 6 }}>{eff.length ? 'Based on ' + eff.length + ' fill-up' + (eff.length > 1 ? 's' : '') + '. This month ' + cs() + num(sp(cur)) + ', last month ' + cs() + num(sp(prev)) + '.' : 'Add at least two fill-ups with odometer readings to see km per litre. Fill the tank each time for the best result.'}</Text>
      <DateField value={dt} onChange={setDt} style={{ marginTop: 12 }} />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Inp style={{ flex: 1 }} keyboardType="decimal-pad" value={li} onChangeText={setLi} placeholder="Litres" />
        <Inp style={{ flex: 1 }} keyboardType="decimal-pad" value={rm} onChangeText={setRm} placeholder={cu()} />
        <Inp style={{ flex: 1.2 }} keyboardType="number-pad" value={od} onChangeText={setOd} placeholder="Odometer" />
      </View>
      <View style={{ marginTop: 8, alignItems: 'flex-end' }}><Btn t="+ Add fill-up" onPress={add} /></View>
      <View style={{ marginTop: 6 }}>
        {list.slice().reverse().slice(0, 5).map((x, i, a) => {
          const e = eff.find((y) => y.id === x.id);
          return (
            <Row key={x.id} last={i === a.length - 1}>
              <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14 }}>{fd(x.date)}</Text><Text style={{ color: dim, fontSize: 11.5, marginTop: 1 }}>{dec(x.liters, 1)} L{x.odo > 0 ? ' · ' + num(x.odo) + ' km' : ''}{e ? ' · ' + dec(e.kml, 1) + ' km/L' : ''}</Text></View>
              <Text style={{ color: W, fontSize: 14, fontWeight: '800' }}>{cs()}{dec(x.amt)}</Text>
              <Sq t="✕" label="Delete" c="#ff9aa9" onPress={() => upd((y) => ({ ...y, fuel: (y.fuel || []).filter((z: Fu) => z.id !== x.id) }))} />
            </Row>
          );
        })}
      </View>
    </Card>
  );
}

// 4. Parts schedule ------------------------------------------------------------
const PRESET: [string, number][] = [['Front tyre', 15000], ['Rear tyre', 12000], ['Battery', 24000], ['Brake pads', 12000], ['Chain and sprocket', 20000], ['Spark plug', 8000]];
const Lbl = ({ t, s }: { t: string; s?: string }) => <View style={{ marginBottom: 4 }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{t}</Text>{s ? <Text style={{ color: dim, fontSize: 11, marginTop: 1, lineHeight: 15 }}>{s}</Text> : null}</View>;
export function PartsCard({ d, upd, latest, addNow }: P<Ext> & { latest: number; addNow: (odo: number) => void }) {
  const [open, setOpen] = useState(false); const [nm, setNm] = useState(''); const [dt, setDt] = useState(todayStr()); const [od, setOd] = useState(''); const [life, setLife] = useState(''); const [cur, setCur] = useState('');
  const list = d.parts || [];
  const odN = parseInt(od, 10); const tooHigh = latest > 0 && odN > latest;
  const pick = (n: string, l: number) => { setNm(n); setLife(String(l)); if (!od && latest > 0) setOd(String(latest)); };
  const save = () => { const o = parseInt(od, 10), l = parseInt(life, 10); if (!nm.trim() || !(o >= 0) || !(l > 0)) return; upd((x) => ({ ...x, parts: [...(x.parts || []), { id: Date.now(), name: nm.trim(), date: dt, odo: o, life: l }] })); setOpen(false); setNm(''); setOd(''); setLife(''); };
  const ok = !!nm.trim() && odN >= 0 && parseInt(life, 10) > 0;
  return (
    <Card title="Parts Schedule" sub="Tyres, battery, brakes and chain" right={!open ? <Btn t="+ Add part" h={34} w={12} onPress={() => { setOpen(true); setDt(todayStr()); setNm(''); setLife(''); setOd(latest > 0 ? String(latest) : ''); }} /> : undefined}>
      {latest <= 0 && list.length > 0 ? (
        <View style={{ marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(124,156,255,.16)', borderWidth: 1, borderColor: 'rgba(124,156,255,.4)', gap: 8 }}>
          <Text style={{ color: '#a9bcff', fontSize: 12.5, fontWeight: '800' }}>One more step</Text>
          <Text style={{ color: 'rgba(255,255,255,.88)', fontSize: 12, lineHeight: 17 }}>To count how many km each part has left, My Record needs your current odometer. Type what your meter shows now.</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}><Inp style={{ flex: 1 }} keyboardType="number-pad" value={cur} onChangeText={setCur} placeholder="Current odometer (km)" /><Btn t="Save" onPress={() => { const o = parseInt(cur, 10); if (o >= 0) { addNow(o); setCur(''); } }} /></View>
        </View>
      ) : null}
      {open ? (
        <View style={{ marginTop: 10, gap: 10 }}>
          <View style={{ padding: 12, borderRadius: 16, backgroundColor: 'rgba(94,231,181,.12)', borderWidth: 1, borderColor: 'rgba(94,231,181,.35)' }}>
            <Text style={{ color: '#7df0c6', fontSize: 12.5, fontWeight: '800' }}>How to fill this in</Text>
            <Text style={{ color: 'rgba(255,255,255,.88)', fontSize: 12, lineHeight: 18, marginTop: 4 }}>{'1. Tap a part below, or type your own.\n2. Pick the day you changed it (today if you just did).\n3. Type the km your meter showed on that day. Not sure? Use your current odometer.\n4. "Lasts" is how far the part usually goes before you change it. The suggested number is only a guide, so ask your mechanic or check your manual.'}</Text>
          </View>
          <View><Lbl t="Part" /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>{PRESET.map(([n, l]) => <Chip key={n} t={n} on={nm === n} onPress={() => pick(n, l)} />)}</View><Inp value={nm} onChangeText={setNm} placeholder="Part name" /></View>
          <View><Lbl t="Date changed" /><DateField value={dt} onChange={setDt} /></View>
          <View><Lbl t="Odometer on that day (km)" s={latest > 0 ? 'Your latest reading is ' + num(latest) + ' km.' : 'Type the km shown on your meter.'} /><Inp keyboardType="number-pad" value={od} onChangeText={setOd} placeholder="e.g. 12500" />{tooHigh ? <Text style={{ color: '#ffd593', fontSize: 11.5, marginTop: 4 }}>This is higher than your latest odometer ({num(latest)} km). Please check the number.</Text> : null}</View>
          <View><Lbl t="Lasts about (km)" s="Distance before the next change." /><Inp keyboardType="number-pad" value={life} onChangeText={setLife} placeholder="e.g. 15000" /></View>
          <View style={{ flexDirection: 'row', gap: 8 }}><View style={{ opacity: ok ? 1 : 0.5 }}><Btn t="Save part" onPress={save} /></View><Pressable onPress={() => setOpen(false)} style={{ height: 42, paddingHorizontal: 16, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 12, fontWeight: '700' }}>Cancel</Text></Pressable></View>
        </View>
      ) : null}
      {list.length === 0 && !open ? <Text style={{ marginTop: 10, color: dim, fontSize: 12, lineHeight: 18 }}>No parts yet. Tap + Add part, choose a part such as Rear tyre, and enter the date and odometer when you changed it. My Record then counts down the km left.</Text> : null}
      <View style={{ marginTop: 6 }}>
        {list.map((p, i) => {
          const used = latest > 0 ? Math.max(0, latest - p.odo) : 0; const left = p.life - used; const pct = latest > 0 ? Math.min(100, Math.round((used / p.life) * 100)) : 0;
          const st = latest <= 0 ? { t: 'Waiting for your current odometer', c: dim, b: '#7c9cff' } : p.odo > latest ? { t: 'Check the odometer: ' + num(p.odo) + ' km is higher than your current ' + num(latest) + ' km. Delete this part and add it again.', c: '#ffd593', b: '#ffc46b' } : left <= 0 ? { t: 'Overdue by ' + num(-left) + ' km', c: '#ffb3c6', b: '#ff5f8f' } : left <= p.life * 0.15 ? { t: 'Due soon · ' + num(left) + ' km left', c: '#ffd593', b: '#ffc46b' } : { t: num(left) + ' km left', c: '#7df0c6', b: '#34d399' };
          return (
            <View key={p.id} style={{ paddingVertical: 9, borderBottomWidth: i === list.length - 1 ? 0 : 1, borderBottomColor: 'rgba(255,255,255,.1)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>{p.name}</Text><Text style={{ color: dim, fontSize: 11.5, marginTop: 1 }}>Changed {fd(p.date)} at {num(p.odo)} km · lasts about {num(p.life)} km</Text></View>
                <Sq t="✕" label="Delete" c="#ff9aa9" onPress={() => upd((x) => ({ ...x, parts: (x.parts || []).filter((y: Pt) => y.id !== p.id) }))} />
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.12)', marginTop: 7, overflow: 'hidden' }}><View style={{ width: pct + '%', height: '100%', backgroundColor: st.b }} /></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, gap: 8 }}>
                <Text style={{ flex: 1, color: st.c, fontSize: 11.5, fontWeight: '700' }}>{st.t}</Text>
                {latest > 0 ? <Pressable onPress={() => upd((x) => ({ ...x, parts: (x.parts || []).map((y: Pt) => y.id === p.id ? { ...y, date: todayStr(), odo: latest } : y) }))} style={{ paddingVertical: 5, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.12)' }}><Text style={{ color: W, fontSize: 11, fontWeight: '700' }}>Just changed it</Text></Pressable> : null}
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

// 5. Documents and receipts ----------------------------------------------------
async function pickImage(): Promise<string | null> {
  const IP = await import('expo-image-picker');
  const r = await IP.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, base64: Platform.OS === 'web' });
  if (r.canceled || !r.assets || !r.assets[0]) return null;
  const a: any = r.assets[0];
  if (Platform.OS === 'web') return a.base64 ? 'data:' + (a.mimeType || 'image/jpeg') + ';base64,' + a.base64 : a.uri;
  try {
    const FS = await import('expo-file-system/legacy');
    const dir = (FS.documentDirectory || '') + 'receipts/';
    await FS.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const ext = (a.uri.split('.').pop() || 'jpg').split('?')[0];
    const to = dir + Date.now() + '.' + ext;
    await FS.copyAsync({ from: a.uri, to });
    return to;
  } catch (e) { return a.uri; }
}
export function DocsCard({ d, upd }: P<Ext>) {
  const [title, setTitle] = useState(''); const [view, setView] = useState<Dc | null>(null); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  const list = d.docs || [];
  const add = async () => {
    setBusy(true); setMsg('');
    try { const uri = await pickImage(); if (uri) { upd((x) => ({ ...x, docs: [{ id: Date.now(), title: title.trim() || 'Receipt', date: todayStr(), uri }, ...(x.docs || [])] })); setTitle(''); } }
    catch (e) { setMsg('Could not open your photos. Please allow photo access and try again.'); }
    setBusy(false);
  };
  return (
    <Card title="Documents and Receipts" sub="Service receipts, grant and insurance photos">
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' }}>
        <Inp style={{ flex: 1 }} value={title} onChangeText={setTitle} placeholder="Title, e.g. Oil change receipt" />
        <Btn t={busy ? 'Opening…' : '+ Photo'} onPress={add} />
      </View>
      {msg ? <Text style={{ color: '#ffb3c6', fontSize: 12, marginTop: 6 }}>{msg}</Text> : null}
      {list.length === 0 ? <Text style={{ marginTop: 10, color: dim, fontSize: 12 }}>No documents yet. Type a title, tap + Photo and pick a picture from your gallery.</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
        {list.map((x) => (
          <Pressable key={x.id} onPress={() => setView(x)} style={{ width: '47%', flexGrow: 1 }}>
            <Image source={{ uri: x.uri }} style={{ width: '100%', height: 110, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.1)' }} resizeMode="cover" />
            <Text style={{ color: W, fontSize: 12.5, fontWeight: '700', marginTop: 4 }} numberOfLines={1}>{x.title}</Text>
            <Text style={{ color: dim, fontSize: 11 }}>{fd(x.date)}</Text>
          </Pressable>
        ))}
      </View>
      {view ? (
        <Modal transparent statusBarTranslucent animationType="fade" onRequestClose={() => setView(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(5,8,25,.92)', padding: 16, justifyContent: 'center' }}>
            <Image source={{ uri: view.uri }} style={{ width: '100%', height: '72%' }} resizeMode="contain" />
            <Text style={{ color: W, fontSize: 15, fontWeight: '800', textAlign: 'center', marginTop: 10 }}>{view.title}</Text>
            <Text style={{ color: dim, fontSize: 12, textAlign: 'center' }}>{fd(view.date)}</Text>
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 14 }}>
              <Pressable onPress={() => { upd((x) => ({ ...x, docs: (x.docs || []).filter((y: Dc) => y.id !== view.id) })); setView(null); }} style={{ height: 42, paddingHorizontal: 20, borderRadius: 999, backgroundColor: 'rgba(255,107,129,.28)', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#ffb3bf', fontSize: 13, fontWeight: '700' }}>Delete</Text></Pressable>
              <Btn t="Close" onPress={() => setView(null)} />
            </View>
          </View>
        </Modal>
      ) : null}
    </Card>
  );
}

// 6. PDF export -----------------------------------------------------------------
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function buildHtml(name: string, d: any, latest: number, owner = ''): string { return buildRecordHtml(name, d, latest, owner); }
export function ExportCard({ name, d, latest }: { name: string; d: any; latest: number }) {
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const owner = useName();
  const go = async () => {
    setBusy(true); setMsg('');
    try {
      const html = buildHtml(name, d, latest, owner); const Print = await import('expo-print');
      if (Platform.OS === 'web') await Print.printAsync({ html });
      else { const r = await Print.printToFileAsync({ html }); const Sh = await import('expo-sharing'); let uri = r.uri; const fn = 'my-life-record-' + (name || 'vehicle').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + fileStamp() + '.pdf'; try { const FS = await import('expo-file-system/legacy'); const to = (FS.cacheDirectory || '') + fn; await FS.deleteAsync(to, { idempotent: true }); await FS.copyAsync({ from: r.uri, to }); uri = to; } catch (e) { /* keep name */ } if (await Sh.isAvailableAsync()) await Sh.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: fn }); else setMsg('PDF saved.'); }
    } catch (e) { setMsg('Could not create the PDF. Please try again.'); }
    setBusy(false);
  };
  return (
    <Card title="Export Report" sub="One PDF with readings, spending, parts and fuel">
      <View style={{ marginTop: 12 }}><Btn t={busy ? 'Preparing…' : 'Export ' + name + ' as PDF'} onPress={go} h={46} /></View>
      {msg ? <Text style={{ color: '#ffb3c6', fontSize: 12, marginTop: 6 }}>{msg}</Text> : null}
    </Card>
  );
}
