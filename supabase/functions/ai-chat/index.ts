// My Life 1.0 "Online AI": a middleman between the app and OpenRouter, so the OpenRouter key stays on the server and each person has a daily limit.
// Secrets to set in Supabase (Edge Functions > Secrets):
//   OPENROUTER_API_KEY  (required)  the key from openrouter.ai
//   OPENROUTER_MODELS   (optional)  comma separated model ids, tried in order. Default: openrouter/free
//   AI_USER_DAILY       (optional)  uses per person per day. Default: 10
//   AI_GLOBAL_DAILY     (optional)  uses for everyone together per day. Default: 40 (the free OpenRouter limit is 50 a day)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are filled in by Supabase itself.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' };
const out = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: CORS });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return out({ ok: false, why: 'method' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL')!; const sk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const key = Deno.env.get('OPENROUTER_API_KEY');
    if (!key) return out({ ok: false, why: 'config' });
    const admin = createClient(url, sk, { auth: { persistSession: false } });

    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: u } = await admin.auth.getUser(jwt);
    if (!u || !u.user) return out({ ok: false, why: 'auth' }, 401);

    const body = await req.json().catch(() => ({}));
    const q = String(body.q || '').trim().slice(0, 500);
    const lang = body.lang === 'ms' ? 'ms' : 'en';
    if (!q) return out({ ok: false, why: 'empty' }, 400);

    const ul = parseInt(Deno.env.get('AI_USER_DAILY') || '10', 10) || 10;
    const gl = parseInt(Deno.env.get('AI_GLOBAL_DAILY') || '40', 10) || 40;
    const { data: t, error: te } = await admin.rpc('ai_take', { p_user: u.user.id, p_user_limit: ul, p_global_limit: gl });
    if (te) return out({ ok: false, why: 'busy' });
    if (t === 'user') return out({ ok: false, why: 'user_limit' });
    if (t === 'global') return out({ ok: false, why: 'global_limit' });

    const sys = 'You are My Life Assistant, a friendly helper inside the My Life app. '
      + 'Reply in the same language the person writes in' + (lang === 'ms' ? ' (usually Bahasa Malaysia)' : '') + ', in at most 6 short sentences. '
      + 'You have no live internet access and your knowledge may be out of date, so say so for news, prices, scores, weather or who holds a post now. '
      + 'Be honest. If you are not sure, say you are not sure. Never invent facts, numbers, dates, names or sources. '
      + 'Do not give religious rulings, medical diagnosis, legal advice or investment advice; tell the person to ask a qualified person instead.';
    const models = (Deno.env.get('OPENROUTER_MODELS') || 'openrouter/free').split(',').map((s) => s.trim()).filter(Boolean);
    for (const model of models) {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 25000);
      try {
        const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST', signal: ctl.signal,
          headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://adyl0022.github.io/my-life-1.0/', 'X-Title': 'My Life' },
          body: JSON.stringify({ model, max_tokens: 450, temperature: 0.4, messages: [{ role: 'system', content: sys }, { role: 'user', content: q }] }),
        });
        clearTimeout(to);
        if (!r.ok) continue;
        const j = await r.json();
        const text = String(j?.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        if (text) return out({ ok: true, text: text.slice(0, 1500) });
      } catch (_e) { clearTimeout(to); }
    }
    return out({ ok: false, why: 'busy' });
  } catch (_e) {
    return out({ ok: false, why: 'busy' });
  }
});
