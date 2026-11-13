import React, { useState } from 'react';
import { View, ScrollView, Pressable, Platform, Share } from 'react-native';
import { Text } from '../components/Txt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getText, useStored } from '../lib/store';
import { Glass } from '../components/Glass';
import { Blob } from '../components/Bg';
import { TOP } from '../lib/layout';

const W = '#fff';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { packReceipts } from '../lib/storage';
import { MODS, buildReport, collect, toCsv, toHtml, toXlsxBase64, deliver, deliverPdf, stamp, fileStamp, Report } from '../lib/exporter';
const IC: Record<string, React.ReactNode> = {
  planner: <><Rect x="4" y="5" width="16" height="15" rx="3" /><Path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4" /></>,
  islamic: <Path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  finance: <><Rect x="3" y="6" width="18" height="14" rx="3" /><Path d="M3 10h18M16 15h2" /></>,
  record: <><Circle cx="6" cy="16" r="3" /><Circle cx="18" cy="16" r="3" /><Path d="M6 16l4-7h4l4 7M10 9L9 6H6" /></>,
  habit: <Path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  usage: <><Circle cx="12" cy="12" r="8.5" /><Path d="M12 7v5l3 2" /></>,
  xlsx: <><Rect x="4" y="4" width="16" height="16" rx="3" /><Path d="M4 10h16M4 15h16M10 4v16" /></>,
  pdf: <><Path d="M7 3h7l4 4v14H7z" /><Path d="M14 3v4h4M10 12h5M10 16h5" /></>,
  csv: <Path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />,
  json: <><Path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><Path d="M9 12l2 2 4-4" /></>,
};
const GR: Record<string, [string, string]> = {
  planner: ['#7c9cff', '#5b7bff'], islamic: ['#34d399', '#12a58a'], finance: ['#ffc46b', '#ff8f5a'], record: ['#ff8fab', '#e0518a'], habit: ['#b794ff', '#7059e8'], usage: ['#5ee7df', '#4a8dff'],
  xlsx: ['#34d399', '#12a58a'], pdf: ['#ff8fab', '#e0518a'], csv: ['#7c9cff', '#5b7bff'], json: ['#ffc46b', '#ff8f5a'],
};
const Ico = ({ k, size = 36 }: { k: string; size?: number }) => (
  <LinearGradient colors={GR[k]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size * 0.33, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">{IC[k]}</Svg>
  </LinearGradient>
);
const FMT = [
  { k: 'xlsx', name: 'Excel', sub: '.xlsx, one sheet per module plus a Totals sheet' },
  { k: 'pdf', name: 'PDF', sub: '.pdf report with a summary and tables' },
  { k: 'csv', name: 'CSV', sub: '.csv, opens in any spreadsheet app' },
  { k: 'json', name: 'Backup (JSON)', sub: 'Everything in one file, to keep safe or move phones' },
];
const PER = ['This month', '3 months', 'All time'];

export default function Export() {
  const router = useRouter();
  const [inc, setInc] = useState<Record<string, boolean>>({ planner: true, islamic: true, finance: true, record: true, habit: true, usage: true });
  const [, setBkLast] = useStored<number>('ml_backup_last', 0);
  const [per, setPer] = useState(0); const [fmt, setFmt] = useState(3);
  const [phase, setPhase] = useState(0); const [msg, setMsg] = useState('');
  const sel = MODS.filter((m) => inc[m.k]).map((m) => m.k);
  const any = sel.length > 0;
  const isBk = FMT[fmt].k === 'json';
  const [rep, setRep] = useState<Report | null>(null);
  React.useEffect(() => { let on = true; if (any) buildReport(sel, isBk ? 2 : per).then((r) => on && setRep(r)).catch(() => {}); else setRep(null); return () => { on = false; }; }, [sel.join(','), per, isBk]);
  const totals = rep ? rep.totals : [];
  const file = 'my-life-' + (isBk ? 'backup-' : 'export-') + fileStamp() + '.' + FMT[fmt].k;
  const reset = () => { setPhase(0); setMsg(''); };

  const run = async () => {
    if (!any || phase === 1) return;
    setPhase(1); setMsg('');
    const k = FMT[fmt].k;
    try {
      let ok = true; let bkNote = '';
      if (k === 'json') {
        const data = await collect(sel);
        let pk: { images: Record<string, string>; skipped: number } = { images: {}, skipped: 0 };
        try { pk = await packReceipts(data); } catch (e) {}
        const out: any = { app: 'My Life 1.0', version: '1.0', created: stamp(), createdAt: new Date().toISOString(), period: 'All time', data };
        if (Object.keys(pk.images).length) out.images = pk.images;
        ok = await deliver(file, 'application/json', JSON.stringify(out, null, 2));
        setBkLast(Date.now());
        if (pk.skipped > 0) bkNote = pk.skipped + (pk.skipped === 1 ? ' receipt photo' : ' receipt photos') + ' did not fit in the backup and stay only on this phone.';
      } else {
        const r = await buildReport(sel, per);
        if (k === 'xlsx') ok = await deliver(file, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', await toXlsxBase64(r), true);
        else if (k === 'pdf') ok = await deliverPdf(toHtml(r), file);
        else ok = await deliver(file, 'text/csv', toCsv(r));
      }
      setMsg(ok ? (k === 'pdf' ? 'Your PDF is ready.' : 'Saved as ' + file + (bkNote ? '. ' + bkNote : '')) : 'The file was created, but this phone has no way to share it.'); setPhase(ok ? 2 : 3);
    } catch (e) { setMsg('Could not create the file. Please try again.'); setPhase(3); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0f2c' }}>
      <LinearGradient colors={['#0a0f2c', '#1a1048', '#0c2b4d']} locations={[0, 0.48, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
      <Blob size={320} color="rgba(94,231,181,.35)" style={{ right: -100, top: -40 }} />
      <Blob size={340} color="rgba(124,156,255,.35)" style={{ left: -120, bottom: 40 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 + TOP, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Glass radius={16} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: W, fontSize: 24, marginTop: -3 }}>‹</Text></Glass></Pressable>
            <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 }}>Export my data</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>Excel, PDF, CSV or a full backup</Text></View>
          </View>

          <Glass style={{ marginTop: 16, padding: 16 }}>
            <Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>Totals in this export</Text>
            <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, marginTop: 1 }}>{isBk ? 'A backup always holds everything, whatever the period' : 'From your saved data, for the period you choose'}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {totals.length === 0 ? <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 12.5 }}>Nothing selected.</Text> : totals.map(([l, v]) => (
                <View key={l} style={{ width: '31.5%', flexGrow: 1, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,.08)' }}>
                  <Text style={{ color: W, fontSize: 14.5, fontWeight: '800' }}>{v}</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11 }}>{l}</Text>
                </View>
              ))}
            </View>
          </Glass>

          <Text style={{ color: W, fontSize: 14, fontWeight: '700', margin: 4, marginTop: 16 }}>What to include</Text>
          <View style={{ gap: 8 }}>
            {MODS.map((m) => (
              <Pressable key={m.k} onPress={() => { setInc({ ...inc, [m.k]: !inc[m.k] }); reset(); }}>
                <Glass radius={18} style={{ paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ico k={m.k} />
                  <View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 13.5, fontWeight: '700' }}>{m.name}</Text><Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 11.5, marginTop: 1 }}>{m.sub}</Text></View>
                  <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: inc[m.k] ? '#5ee7df' : 'rgba(255,255,255,.45)', backgroundColor: inc[m.k] ? '#5ee7df' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{inc[m.k] ? <Text style={{ color: '#0a0f2c', fontSize: 13, fontWeight: '800' }}>✓</Text> : null}</View>
                </Glass>
              </Pressable>
            ))}
          </View>

          <Text style={{ color: W, fontSize: 14, fontWeight: '700', margin: 4, marginTop: 16 }}>Period</Text>
          <View style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,.28)' }}>
            {PER.map((n, i) => (
              <Pressable key={n} onPress={() => { setPer(i); reset(); }} style={{ flex: 1 }}>
                {per === i ? <LinearGradient colors={['#7c9cff', '#b794ff']} style={{ paddingVertical: 8, borderRadius: 999, alignItems: 'center' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{n}</Text></LinearGradient>
                  : <View style={{ paddingVertical: 8, alignItems: 'center' }}><Text style={{ color: W, fontSize: 12.5, fontWeight: '700' }}>{n}</Text></View>}
              </Pressable>
            ))}
          </View>
          

          <Text style={{ color: W, fontSize: 14, fontWeight: '700', margin: 4, marginTop: 12 }}>Format</Text>
          <View style={{ gap: 8 }}>
            {FMT.map((f, i) => (
              <Pressable key={f.k} onPress={() => { setFmt(i); reset(); }}>
                <View style={{ borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: fmt === i ? 'rgba(94,231,181,.22)' : 'rgba(255,255,255,.08)', borderWidth: fmt === i ? 1.5 : 1, borderColor: fmt === i ? '#5ee7df' : 'rgba(255,255,255,.2)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Ico k={f.k} size={34} /><View style={{ flex: 1 }}><Text style={{ color: W, fontSize: 14, fontWeight: '700' }}>{f.name}</Text><Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 11.5, marginTop: 1 }}>{f.sub}</Text></View></View>
                </View>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={run} disabled={!any} style={{ marginTop: 18 }}>
            <LinearGradient colors={!any ? ['rgba(255,255,255,.12)', 'rgba(255,255,255,.12)'] : phase === 2 ? ['#1d8f5a', '#34d399'] : ['#7c9cff', '#b794ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 15, borderRadius: 18, alignItems: 'center' }}>
              <Text style={{ color: W, fontSize: 15, fontWeight: '800' }}>{!any ? 'Choose what to include' : phase === 1 ? 'Preparing your file...' : phase === 2 ? 'Done. Export again' : 'Export as ' + FMT[fmt].name}</Text>
            </LinearGradient>
          </Pressable>
          {msg ? <View style={{ marginTop: 10 }}><Text style={{ color: phase === 2 ? '#8fe9e2' : '#ffd593', fontSize: 12.5, lineHeight: 18 }}>{msg}</Text></View> : <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, marginTop: 8 }}>{file}</Text>}
          <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11.5, lineHeight: 17, marginTop: 14 }}>The file is built on your device from your own data, and only you decide where it goes.</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
