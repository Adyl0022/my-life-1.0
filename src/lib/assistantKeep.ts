// A gentle warning when spending or a transfer would leave an account below the minimum its owner keeps in it.
import { getItem } from './store';
import { cs } from './region';
import { balanceOf, keepOf, incomeFeed } from './accounts';

export async function keepWarn(accId: number | undefined, amt: number, lang: string): Promise<string> {
  try {
    if (!accId || !(amt > 0)) return '';
    const d: any = await getItem('ml_accounts', { accs: [], moves: [], nextId: 1 });
    const a = ((d && d.accs) || []).find((x: any) => x.id === accId); if (!a || keepOf(a) <= 0) return '';
    const fin: any = (await getItem('ml_finance', {})) || {}; const dbt: any = (await getItem('ml_debts', { debts: [] })) || { debts: [] };
    const left = balanceOf(a, d, fin.spends || [], { debts: dbt.debts || [], incomes: incomeFeed(fin.inc || {}, fin.incAcc) }) - amt;
    if (left >= keepOf(a)) return '';
    const m = (n: number) => cs() + (Math.round(Math.max(0, n) * 100) / 100).toFixed(2);
    return lang === 'ms' ? '\n⚠ Ini tinggalkan ' + m(left) + ' dalam ' + a.name + ', di bawah ' + m(keepOf(a)) + ' yang awak perlu simpan. Awak masih boleh teruskan.' : '\n⚠ This leaves ' + m(left) + ' in ' + a.name + ', below the ' + m(keepOf(a)) + ' you keep in it. You can still continue.';
  } catch (e) { return ''; }
}
