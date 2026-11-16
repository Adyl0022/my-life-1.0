import React from 'react';
import { View, Pressable, useWindowDimensions } from 'react-native';
import { Text } from './Txt';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Glass } from './Glass';
import { W } from './Ui';
import { useStored } from '../lib/store';
import { DEBT_EMPTY, DebtData } from '../lib/debts';
import { calcLeft, commitFor, monthSummary, MONTHS, Sp } from '../lib/moneyLeft';
import { setup } from '../lib/adhan';
import { BUDGET_EMPTY, BudgetCfg, checkBudget } from '../lib/budgetAlert';
import { cs } from '../lib/region';

const money = (n: number) => n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rnd = (n: number) => Math.round(n).toLocaleString('en-MY');
const COL = { commit: '#b794ff', spent: '#ffc46b', save: '#7c9cff', left: '#5ee7b5', over: '#ff7a8a' };
const dim = 'rgba(255,255,255,.68)';

type Props = { ym: string; income: number; spends: Sp[] };

const Row = ({ c, l, v, minus, bold }: { c?: string; l: string; v: string; minus?: boolean; bold?: boolean }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 }}>
    {c ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c }} /> : <View style={{ width: 10 }} />}
    <Text style={{ flex: 1, color: bold ? W : 'rgba(255,255,255,.82)', fontSize: 13.5, fontWeight: bold ? '800' : '600' }}>{l}</Text>
    <Text style={{ color: W, fontSize: 14, fontWeight: bold ? '800' : '700' }}>{(minus ? '- ' : '') + cs() + v}</Text>
  </View>
);
const Tile = ({ l, v, sub, c }: { l: string; v: string; sub?: string; c?: string }) => (
  <View style={{ flex: 1, borderRadius: 16, paddingVertical: 9, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,.09)' }}>
    <Text style={{ color: dim, fontSize: 10.5 }}>{l}</Text>
    <Text style={{ color: c || W, fontSize: 15, fontWeight: '800', marginTop: 2 }}>{v}</Text>
    {sub ? <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 10, marginTop: 1 }}>{sub}</Text> : null}
  </View>
);
const Sw = ({ on, set }: { on: boolean; set: (v: boolean) => void }) => (
  <Pressable accessibilityLabel="Budget alerts" onPress={() => set(!on)} style={{ width: 44, height: 26, borderRadius: 13, padding: 3, backgroundColor: on ? '#ffc46b' : 'rgba(255,255,255,.2)', alignItems: on ? 'flex-end' : 'flex-start', justifyContent: 'center' }}>
    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: on ? '#2a1030' : '#fff' }} />
  </Pressable>
);

export function MoneyLeft({ ym, income, spends }: Props) {
  const narrow = useWindowDimensions().width < 360;
  const [debts] = useStored<DebtData>('ml_debts', DEBT_EMPTY);
  const [bc, setBc] = useStored<BudgetCfg>('ml_budget', BUDGET_EMPTY);
  const c = calcLeft({ ym, income, commit: commitFor(debts, ym), spends });
  const { isCur, dim: dimDays, dayNo, daysLeft, commit, spent, today, left, over, savings, used, allowance, projLeft, pace, oneOff, runOutDay, state } = c;
  const sc = state === 'over' ? COL.over : state === 'care' ? COL.spent : COL.left;
  const sl = state === 'over' ? 'Over budget' : state === 'care' ? (isCur ? 'Be careful' : 'Tight month') : 'On track';
  const R = 46, C = 2 * Math.PI * R;
  const pct = income > 0 ? Math.min(100, Math.round(used * 100)) : 0;
  const seg = (v: number) => (income > 0 ? Math.max(0, Math.min(1, v / income)) : 0);
  const bar = [{ v: commit, c: COL.commit }, { v: spent, c: COL.spent }, { v: savings, c: COL.save }, { v: Math.max(0, left), c: COL.left }];
  const py = c.y, pm = c.m; const prev = new Date(py, pm - 1, 1);
  const prevYm = prev.getFullYear() + '-' + String(prev.getMonth() + 1).padStart(2, '0');
  const showSum = income > 0 && (!isCur || daysLeft <= 3);
  const sm = showSum ? monthSummary({ ym, income, commit, spends, prevYm }) : null;

  let tip = '';
  if (state === 'none') tip = 'Add this month\'s income above and I will show how much is left after your commitments and spending.';
  else if (state === 'over') tip = 'You have gone ' + cs() + rnd(-left) + ' past what you earned this month. Hold off on non-essential spending.';
  else if (!isCur) tip = left > 0 ? 'You finished this month with ' + cs() + rnd(left) + ' left. Well done.' : 'This month ended exactly on budget.';
  else if (spent === 0) tip = 'No spending recorded yet. You can spend about ' + cs() + rnd(allowance) + ' a day and stay on track.';
  else if (projLeft < 0) tip = 'At your usual pace of ' + cs() + rnd(pace) + ' a day, your money runs out around the ' + (runOutDay || dimDays) + 'th. Try to keep to ' + cs() + rnd(allowance) + ' a day.';
  else tip = 'At your usual pace you would finish the month with about ' + cs() + rnd(projLeft) + ' left. Keep to ' + cs() + rnd(allowance) + ' a day or less.';

  return (
    <Glass radius={26} style={{ marginTop: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
      <LinearGradient colors={[state === 'over' ? 'rgba(255,122,138,.28)' : 'rgba(94,231,181,.2)', 'rgba(124,156,255,.12)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: -1 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ flexShrink: 1, color: 'rgba(255,255,255,.8)', fontSize: 13, fontWeight: '700' }}>{'Money Left · ' + MONTHS[pm] + ' ' + py}</Text>
        {state !== 'none' ? <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: sc }}><Text style={{ color: '#2a1030', fontSize: 11, fontWeight: '800' }}>{sl}</Text></View> : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
        <View style={{ width: 112, height: 112, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={112} height={112} viewBox="0 0 112 112">
            <Circle cx="56" cy="56" r={R} stroke="rgba(255,255,255,.14)" strokeWidth="11" fill="none" />
            {income > 0 ? <Circle cx="56" cy="56" r={R} stroke={sc} strokeWidth="11" fill="none" strokeLinecap="round" strokeDasharray={C + ' ' + C} strokeDashoffset={C * (1 - Math.min(1, used))} rotation={-90} origin="56, 56" /> : null}
          </Svg>
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <Text style={{ color: W, fontSize: 22, fontWeight: '800' }}>{income > 0 ? pct + '%' : '-'}</Text>
            <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 10.5 }}>used</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>{over ? 'Over by' : 'Left to spend'}</Text>
          <Text style={{ color: income <= 0 ? 'rgba(255,255,255,.5)' : over ? COL.over : W, fontSize: narrow ? 21 : 28, fontWeight: '800', letterSpacing: -0.5, marginTop: 1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{cs()}{money(income <= 0 ? 0 : Math.abs(left))}</Text>
          <Text style={{ color: 'rgba(255,255,255,.6)', fontSize: 11.5, marginTop: 2 }}>{income > 0 ? 'from ' + cs() + money(income) + ' income' : 'No income saved yet'}</Text>
        </View>
      </View>

      {income > 0 ? (
        <>
          <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 14, backgroundColor: 'rgba(255,255,255,.1)' }}>
            {bar.map((b, i) => (b.v > 0 ? <View key={i} style={{ width: seg(b.v) * 100 + '%', backgroundColor: b.c }} /> : null))}
          </View>
          <View style={{ marginTop: 8 }}>
            <Row c="#fff" l="Income" v={money(income)} />
            <Row c={COL.commit} l="Commitments and debts" v={money(commit)} minus />
            <Row l="After commitments" v={money(income - commit)} bold />
            <Row c={COL.spent} l="Spent" v={money(spent)} minus />
            {savings > 0 ? <Row c={COL.save} l="Put into savings goals" v={money(savings)} minus /> : null}
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,.16)', marginVertical: 4 }} />
            <Row c={over ? COL.over : COL.left} l={over ? 'Over budget' : 'Left'} v={money(Math.abs(left))} bold />
          </View>

          {isCur ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <Tile l="Per day" v={cs() + rnd(allowance)} sub={daysLeft + (daysLeft === 1 ? ' day left' : ' days left')} c={allowance > 0 ? W : COL.over} />
              <Tile l="Today" v={cs() + rnd(today)} sub={allowance > 0 ? (today <= allowance ? 'within limit' : 'over limit') : ''} c={allowance > 0 && today > allowance ? COL.over : W} />
              {!over ? <Tile l="Month end" v={(projLeft < 0 ? '-' : '') + cs() + rnd(Math.abs(projLeft))} sub="at usual pace" c={projLeft < 0 ? COL.over : COL.left} /> : null}
            </View>
          ) : null}
        </>
      ) : null}

      <Text style={{ color: 'rgba(255,255,255,.78)', fontSize: 12.5, lineHeight: 18, marginTop: 10 }}>{tip}</Text>
      {isCur && income > 0 && spent > 0 && oneOff > 0 ? <Text style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, lineHeight: 15, marginTop: 4 }}>{'Usual pace leaves out bills and big one-off buys (' + cs() + rnd(oneOff) + ' so far), because they do not repeat every day.'}</Text> : null}

      {sm ? (
        <View style={{ marginTop: 14, borderRadius: 16, padding: 12, backgroundColor: 'rgba(0,0,0,.2)' }}>
          <Text style={{ color: '#ffd593', fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>{isCur ? 'MONTH SO FAR' : 'MONTH SUMMARY'}</Text>
          <Text style={{ color: sm.ok ? COL.left : COL.over, fontSize: 15, fontWeight: '800', marginTop: 6 }}>{sm.ok ? 'Left over ' + cs() + money(sm.saved) + (isCur ? ' so far' : '') : 'Overspent by ' + cs() + money(-sm.saved)}</Text>
          {sm.topCat ? <Text style={{ color: 'rgba(255,255,255,.82)', fontSize: 12.5, marginTop: 6 }}>{'Biggest category: ' + sm.topCat + ' ' + cs() + rnd(sm.topAmt) + ' (' + sm.topShare + '% of spending)'}</Text> : null}
          {sm.biggest ? <Text style={{ color: 'rgba(255,255,255,.82)', fontSize: 12.5, marginTop: 3 }}>{'Biggest single spend: ' + sm.biggest.name + ' ' + cs() + rnd(sm.biggest.amt)}</Text> : null}
          {sm.vsPrev !== null ? <Text style={{ color: 'rgba(255,255,255,.82)', fontSize: 12.5, marginTop: 3 }}>{'Spending was ' + (sm.vsPrev === 0 ? 'the same as' : Math.abs(sm.vsPrev) + '% ' + (sm.vsPrev > 0 ? 'higher than' : 'lower than')) + ' ' + MONTHS[prev.getMonth()] + ' (' + cs() + rnd(sm.prevSpent) + ').'}</Text> : null}
          {sm.tip ? <Text style={{ color: '#ffd593', fontSize: 12.5, lineHeight: 18, marginTop: 8 }}>{'Next month: ' + sm.tip}</Text> : null}
        </View>
      ) : null}

      {income > 0 ? (
        <View style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: W, fontSize: 13.5, fontWeight: '700' }}>Budget alerts</Text>
              <Text style={{ color: dim, fontSize: 11.5, lineHeight: 16, marginTop: 2 }}>A notification when you use 80% of your income, go over today's limit, or go over budget.</Text>
            </View>
            <Sw on={bc.on} set={(v) => { setBc({ ...bc, on: v }); if (v) setup().then(() => setTimeout(() => { checkBudget(); }, 600)).catch(() => {}); }} />
          </View>
        </View>
      ) : null}
    </Glass>
  );
}
