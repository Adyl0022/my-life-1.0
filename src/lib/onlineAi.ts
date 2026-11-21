import { useEffect, useState } from 'react';
import { getItem, setItem } from './store';
import { supabase } from './supabase';
import { getSession } from './auth';

// "Online AI": general questions the Assistant cannot answer are sent over the internet to an AI service (through our own server, which keeps the key
// and limits use per person). It is off until the person turns it on. Anything it cannot do falls back to the AI on the phone.
const KEY = 'ml_online_ai';
let ON = false; let loaded = false;
const subs = new Set<() => void>();
const tell = () => subs.forEach((f) => { try { f(); } catch (e) { } });
getItem(KEY, false).then((v: any) => { ON = !!v; loaded = true; tell(); });

export const onlineOn = () => ON;
export function setOnline(v: boolean) { ON = v; setItem(KEY, v); tell(); }
export function useOnlineAi(): [boolean, (v: boolean) => void, boolean] {
  const [, n] = useState(0);
  useEffect(() => { const f = () => n((x) => x + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  return [ON, setOnline, loaded];
}

export type OnlineResult = { text: string } | { why: 'login' | 'user_limit' | 'global_limit' | 'busy' | 'offline' };

export async function onlineAsk(q: string, lang: string, hist: { me: boolean; text: string }[] = [], voice = false): Promise<OnlineResult> {
  if (!ON) return { why: 'busy' };
  if (!getSession()) return { why: 'login' };
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat', { body: voice ? { q, lang, voice: true, hist: hist.slice(-6).map((x) => ({ me: !!x.me, text: String(x.text || '').slice(0, 300) })) } : { q, lang } });
    if (error || !data) return { why: 'offline' };
    if (data.ok && data.text) {
      const ms = lang === 'ms';
      return { text: String(data.text) + (ms
        ? '\n\n(Jawapan AI dalam talian: soalan awak dihantar ke internet. Ia boleh tersilap. Semak fakta penting dengan sumber rasmi.)'
        : '\n\n(Online AI answer: your question was sent over the internet. It can be wrong. Check important facts with an official source.)') };
    }
    const w = String(data.why || '');
    if (w === 'user_limit' || w === 'global_limit') return { why: w };
    return { why: 'busy' };
  } catch (e) { return { why: 'offline' }; }
}

export function onlineNote(why: string, lang: string): string {
  const ms = lang === 'ms';
  if (why === 'user_limit') return ms ? 'Had harian AI dalam talian untuk awak dah habis. Esok boleh guna lagi.' : 'Your daily limit for Online AI is used up. You can use it again tomorrow.';
  if (why === 'global_limit') return ms ? 'AI dalam talian sibuk hari ini (kuota harian penuh). Cuba lagi esok.' : 'Online AI is busy today (the daily quota is full). Try again tomorrow.';
  if (why === 'login') return ms ? 'Log masuk dahulu untuk guna AI dalam talian.' : 'Sign in first to use Online AI.';
  return '';
}
