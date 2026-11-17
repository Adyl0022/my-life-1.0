-- My Life 1.0 Online AI: daily counters, so one person (or everyone together) cannot use up the free AI quota.
-- Paste this whole file in Supabase > SQL Editor > Run.
create table if not exists public.ai_usage (
  user_id uuid not null,
  day date not null,
  n int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
-- No policies on purpose: only the server function (service role) can read or write it.
revoke all on public.ai_usage from anon, authenticated;

-- Takes one use. Returns 'ok', 'user' (this person is over their daily limit) or 'global' (everyone together is over the daily limit).
create or replace function public.ai_take(p_user uuid, p_user_limit int, p_global_limit int)
returns text language plpgsql security definer set search_path = public as $$
declare
  d date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
  g uuid := '00000000-0000-0000-0000-000000000000';
  got int;
begin
  insert into public.ai_usage as u (user_id, day, n) values (g, d, 1)
    on conflict (user_id, day) do update set n = u.n + 1 where u.n < p_global_limit
    returning n into got;
  if got is null then return 'global'; end if;
  insert into public.ai_usage as u (user_id, day, n) values (p_user, d, 1)
    on conflict (user_id, day) do update set n = u.n + 1 where u.n < p_user_limit
    returning n into got;
  if got is null then
    update public.ai_usage set n = n - 1 where user_id = g and day = d;
    return 'user';
  end if;
  return 'ok';
end; $$;
revoke all on function public.ai_take(uuid, int, int) from public, anon, authenticated;
grant execute on function public.ai_take(uuid, int, int) to service_role;

-- Old counters are not needed.
create or replace function public.ai_clean() returns void language sql security definer set search_path = public as $$
  delete from public.ai_usage where day < (now() at time zone 'Asia/Kuala_Lumpur')::date - 3;
$$;
revoke all on function public.ai_clean() from public, anon, authenticated;
grant execute on function public.ai_clean() to service_role;
