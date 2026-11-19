import React from 'react';
import { View } from 'react-native';
import { Text } from './Txt';
import { Glass } from './Glass';
import { useStored } from '../lib/store';
import { HData, HEMPTY, bestStreakAll } from '../lib/habit';

// A friendly look back: when you started with My Life and what you have done so far. Everything is counted on the phone from data already saved; nothing new is stored or sent.
const DIM = 'rgba(255,255,255,.65)'; const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const nf = (n: number) => n.toLocaleString('en-GB');

export function MemoriesCard({ since }: { since?: string }) {
  const [h] = useStored<HData>('ml_habit', HEMPTY);
  const [pl] = useStored<any>('ml_planner', { events: [], tasks: [] });
  const [fin] = useStored<any>('ml_finance', { spends: [] });
  const [rec] = useStored<any>('ml_record', { data: {} });
  const sd = since ? new Date(since) : null; const ok = !!sd && !isNaN(sd.getTime());
  const days = ok ? Math.max(1, Math.floor((Date.now() - (sd as Date).getTime()) / 86400000) + 1) : 0;
  const hd = Object.values((h && h.days) || {}) as any[];
  const jobs = Object.values((rec && rec.data) || {}).reduce((s: number, c: any) => s + ((c && c.tasks) || []).reduce((a: number, t: any) => a + ((t && t.hist) || []).length, 0), 0) as number;
  const stats: [string, string][] = ([
    ['Nights of sleep logged', nf(hd.filter((x) => x.sleep > 0).length)],
    ['Steps walked', nf(hd.reduce((s, x) => s + (x.steps || 0), 0))],
    ['Glasses of water', nf(hd.reduce((s, x) => s + (x.cups || 0), 0))],
    ['Tasks finished', nf(((pl && pl.tasks) || []).filter((t: any) => t.status === 'done').length)],
    ['Events planned', nf(((pl && pl.events) || []).length)],
    ['Spendings logged', nf(((fin && fin.spends) || []).length)],
    ['Vehicle jobs done', nf(jobs)],
    ['Best streak', bestStreakAll(h || HEMPTY) + ' days'],
  ] as [string, string][]).filter((x) => x[1] !== '0' && x[1] !== '0 days');
  return (
    <Glass style={{ padding: 16 }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Your memories with My Life</Text>
      {ok ? <Text style={{ color: DIM, fontSize: 12.5, marginTop: 4, lineHeight: 18 }}>{'You started on ' + (sd as Date).getDate() + ' ' + MON[(sd as Date).getMonth()] + ' ' + (sd as Date).getFullYear() + '. Today is day ' + days + ' together.'}</Text> : null}
      {stats.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {stats.map(([a, b]) => (
            <View key={a} style={{ width: '48%', flexGrow: 1, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)', borderTopColor: 'rgba(255,255,255,.36)' }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{b}</Text>
              <Text style={{ color: DIM, fontSize: 11.5, marginTop: 2 }}>{a}</Text>
            </View>))}
        </View>) : <Text style={{ color: DIM, fontSize: 12.5, marginTop: 10 }}>Your numbers will show up here as you use the app.</Text>}
    </Glass>
  );
}
