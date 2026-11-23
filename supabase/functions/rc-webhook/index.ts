// My Life 1.0 (Play edition): turns a Google Play subscription into a server licence, so Family Planner opens by itself.
// RevenueCat calls this after every purchase and renewal. The licence ends on the date the subscription ends.
// Set up once:
//   1. Supabase > Edge Functions > rc-webhook. Turn OFF "Verify JWT" (RevenueCat has no Supabase login).
//   2. Supabase > Edge Functions > Secrets: RC_WEBHOOK_SECRET = any long random text you choose.
//   3. RevenueCat > Integrations > Webhooks > New: URL = this function's URL, leave the Authorization header empty and end the URL with ?key=<the same text>.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are filled in by Supabase itself.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const J = { 'Content-Type': 'application/json' };
const out = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: J });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Events that mean "this person has paid until expiration_at_ms". Cancelling changes nothing: the person keeps access until the end date.
const GRANT = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE', 'NON_RENEWING_PURCHASE', 'SUBSCRIPTION_EXTENDED', 'TEMPORARY_ENTITLEMENT_GRANT']);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return out({ ok: false, why: 'method' }, 405);
  const secret = Deno.env.get('RC_WEBHOOK_SECRET');
  if (!secret) return out({ ok: false, why: 'config' }, 500);
  // The secret travels in the URL (?key=...), because Supabase checks any Authorization header as a Supabase login token.
  const got = new URL(req.url).searchParams.get('key') || '';
  if (got !== secret) return out({ ok: false, why: 'auth' }, 401);

  const body = await req.json().catch(() => ({}));
  const ev = body && body.event ? body.event : {};
  if (!GRANT.has(String(ev.type || ''))) return out({ ok: true, skipped: String(ev.type || '') });
  const ids: string[] = [ev.app_user_id, ev.original_app_user_id, ...(Array.isArray(ev.aliases) ? ev.aliases : [])].filter((x) => typeof x === 'string');
  const uid = ids.find((x) => UUID.test(x));
  const exp = Number(ev.expiration_at_ms);
  if (!uid || !exp || exp <= Date.now()) return out({ ok: true, skipped: 'no_user_or_expired' });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: cur, error: ce } = await admin.from('licenses').select('expires_at').eq('user_id', uid).maybeSingle();
  if (ce) return out({ ok: false, why: 'db' }, 500);
  const next = new Date(exp).toISOString();
  if (cur) {
    // Never shorten a lifetime licence (expires_at is null) or a licence that already lasts longer.
    if (cur.expires_at === null || new Date(cur.expires_at).getTime() >= exp) return out({ ok: true, kept: true });
    const { error } = await admin.from('licenses').update({ expires_at: next }).eq('user_id', uid);
    return error ? out({ ok: false, why: 'db' }, 500) : out({ ok: true, extended: next });
  }
  const { error } = await admin.from('licenses').insert({ user_id: uid, expires_at: next });
  return error ? out({ ok: false, why: 'db' }, 500) : out({ ok: true, created: next });
});
