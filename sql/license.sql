-- My Life 1.0 — activation codes. Run this whole file once in Supabase > SQL Editor.

create table if not exists public.activation_codes (
  code text primary key,
  note text,
  days int,                          -- null = lifetime, otherwise number of days
  created_at timestamptz not null default now(),
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz
);
alter table public.activation_codes enable row level security;   -- no policies: the app can never read codes

create table if not exists public.licenses (
  user_id uuid primary key references auth.users(id) on delete cascade,
  activated_at timestamptz not null default now(),
  expires_at timestamptz             -- null = lifetime
);
alter table public.licenses enable row level security;
drop policy if exists "own license" on public.licenses;
create policy "own license" on public.licenses for select to authenticated using (user_id = auth.uid());

create table if not exists public.code_attempts (
  user_id uuid not null,
  at timestamptz not null default now()
);
alter table public.code_attempts enable row level security;

create or replace function public.is_active() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.licenses l
                 where l.user_id = auth.uid() and (l.expires_at is null or l.expires_at > now()));
$$;

create or replace function public.redeem_code(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  c public.activation_codes;
  cur timestamptz;
  newexp timestamptz;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  delete from public.code_attempts where at < now() - interval '1 day';
  if (select count(*) from public.code_attempts where user_id = uid and at > now() - interval '15 minutes') >= 8 then
    raise exception 'too_many_attempts';
  end if;
  select * into c from public.activation_codes
    where code = upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g')) and redeemed_by is null
    for update;
  if not found then
    -- Return instead of raising, so the failed try is really saved and counted.
    insert into public.code_attempts(user_id) values (uid);
    return jsonb_build_object('error', 'invalid_code');
  end if;
  update public.activation_codes set redeemed_by = uid, redeemed_at = now() where code = c.code;
  select expires_at into cur from public.licenses where user_id = uid;
  if c.days is null then newexp := null;
  else newexp := greatest(coalesce(cur, now()), now()) + (c.days || ' days')::interval;
    if exists (select 1 from public.licenses where user_id = uid and expires_at is null) then newexp := null; end if;
  end if;
  insert into public.licenses(user_id, activated_at, expires_at) values (uid, now(), newexp)
    on conflict (user_id) do update set expires_at = excluded.expires_at;
  return jsonb_build_object('active', true, 'expires_at', newexp);
end $$;

grant execute on function public.is_active() to authenticated;
grant execute on function public.redeem_code(text) to authenticated;
grant select on public.licenses to authenticated;

-- Cloud data: every signed-in account can save and read its own rows (the licence check was removed on 2026-11-12,
-- so accounts from the Play edition, which has no activation step, are backed up too).
drop policy if exists "own select" on public.user_data;
drop policy if exists "own insert" on public.user_data;
drop policy if exists "own update" on public.user_data;
drop policy if exists "own delete" on public.user_data;
drop policy if exists "own data" on public.user_data;
create policy "own data" on public.user_data for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ===== How to make codes (run when someone has paid) =====
-- Lifetime, 5 codes:
-- insert into public.activation_codes(code, note)
--   select 'ML-' || upper(substr(encode(gen_random_bytes(8),'hex'),1,4)) || '-' || upper(substr(encode(gen_random_bytes(8),'hex'),1,4)), 'batch 1'
--   from generate_series(1,5) returning code;
-- 30 days instead: add days => insert into public.activation_codes(code, note, days) select ..., 'batch', 30 ...
--
-- ===== Activate your own account (change the email) =====
-- insert into public.licenses(user_id) select id from auth.users where email = 'adlisyahmi324@gmail.com' on conflict do nothing;
