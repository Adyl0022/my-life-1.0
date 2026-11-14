create table if not exists public.family_menu (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  day date not null,
  slot text not null check (slot in ('breakfast', 'lunch', 'dinner')),
  dish text not null check (char_length(dish) between 1 and 80),
  cook uuid,
  needs text check (needs is null or char_length(needs) <= 300),
  created_at timestamptz not null default now(),
  unique (family_id, day, slot)
);
alter table public.family_menu enable row level security;
drop policy if exists "menu read" on public.family_menu;
create policy "menu read" on public.family_menu for select to authenticated using (public.family_ok(family_id));
grant select on public.family_menu to authenticated;
do $$ begin
  begin alter publication supabase_realtime add table public.family_menu; exception when others then null; end;
end $$;

create or replace function public.family_menu_save(p_day date, p_slot text, p_dish text, p_cook uuid, p_needs text) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid();
begin
  if p_slot not in ('breakfast', 'lunch', 'dinner') or p_day is null then raise exception 'bad_date'; end if;
  if char_length(trim(coalesce(p_dish, ''))) < 1 then
    delete from public.family_menu where family_id = fid and day = p_day and slot = p_slot;
    return true;
  end if;
  if p_cook is not null and not public.family_people_ok(fid, array[p_cook]) then raise exception 'bad_people'; end if;
  insert into public.family_menu(family_id, day, slot, dish, cook, needs)
  values (fid, p_day, p_slot, left(trim(p_dish), 80), p_cook, left(nullif(trim(coalesce(p_needs, '')), ''), 300))
  on conflict (family_id, day, slot) do update set dish = excluded.dish, cook = excluded.cook, needs = excluded.needs;
  delete from public.family_menu where family_id = fid and day < current_date - 30;
  return true;
end $$;

revoke all on function public.family_menu_save(date, text, text, uuid, text) from public, anon;
grant execute on function public.family_menu_save(date, text, text, uuid, text) to authenticated;
create table if not exists public.family_wishes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  owner uuid not null,
  title text not null check (char_length(title) between 1 and 80),
  price text check (price is null or char_length(price) <= 30),
  note text check (note is null or char_length(note) <= 200),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.family_wish_claims (
  wish_id uuid primary key references public.family_wishes(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  claimer uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.family_wishes enable row level security;
alter table public.family_wish_claims enable row level security;
drop policy if exists "wishes read" on public.family_wishes;
create policy "wishes read" on public.family_wishes for select to authenticated using (public.family_ok(family_id));
-- The person a wish belongs to can never read who claimed it (so the gift stays a surprise).
drop policy if exists "claims read" on public.family_wish_claims;
create policy "claims read" on public.family_wish_claims for select to authenticated using (
  public.family_ok(family_id) and not exists (select 1 from public.family_wishes w where w.id = wish_id and w.owner = auth.uid())
);
grant select on public.family_wishes, public.family_wish_claims to authenticated;
do $$ begin
  begin alter publication supabase_realtime add table public.family_wishes; exception when others then null; end;
end $$;

create or replace function public.family_wish_save(p_id uuid, p_owner uuid, p_title text, p_price text, p_note text) returns uuid
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); parent boolean := coalesce(public.family_my_role(), '') in ('owner', 'parent'); wid uuid;
begin
  if char_length(trim(coalesce(p_title, ''))) < 1 then raise exception 'bad_title'; end if;
  if p_id is null then
    if p_owner is distinct from auth.uid() then
      if not parent or not exists (select 1 from public.family_profiles where id = p_owner and family_id = fid) then raise exception 'not_allowed'; end if;
    end if;
    if (select count(*) from public.family_wishes where family_id = fid and owner = p_owner) >= 30 then raise exception 'list_full'; end if;
    insert into public.family_wishes(family_id, owner, title, price, note, created_by)
    values (fid, p_owner, left(trim(p_title), 80), left(nullif(trim(coalesce(p_price, '')), ''), 30), left(nullif(trim(coalesce(p_note, '')), ''), 200), auth.uid()) returning id into wid;
    return wid;
  end if;
  update public.family_wishes set title = left(trim(p_title), 80), price = left(nullif(trim(coalesce(p_price, '')), ''), 30), note = left(nullif(trim(coalesce(p_note, '')), ''), 200)
  where id = p_id and family_id = fid and (owner = auth.uid() or parent);
  if not found then raise exception 'not_found'; end if;
  return p_id;
end $$;

create or replace function public.family_wish_delete(p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid();
begin
  delete from public.family_wishes where id = p_id and family_id = fid and (owner = auth.uid() or coalesce(public.family_my_role(), '') in ('owner', 'parent'));
  if not found then raise exception 'not_found'; end if;
  return true;
end $$;

create or replace function public.family_wish_claim(p_id uuid, p_on boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); w public.family_wishes; c uuid;
begin
  select * into w from public.family_wishes where id = p_id and family_id = fid;
  if not found then raise exception 'not_found'; end if;
  if w.owner = auth.uid() then raise exception 'not_allowed'; end if;
  if p_on then
    select claimer into c from public.family_wish_claims where wish_id = p_id;
    if c is not null and c <> auth.uid() then raise exception 'already_claimed'; end if;
    insert into public.family_wish_claims(wish_id, family_id, claimer) values (p_id, fid, auth.uid()) on conflict (wish_id) do nothing;
  else
    delete from public.family_wish_claims where wish_id = p_id and claimer = auth.uid();
  end if;
  return true;
end $$;

revoke all on function public.family_wish_save(uuid, uuid, text, text, text), public.family_wish_delete(uuid), public.family_wish_claim(uuid, boolean) from public, anon;
grant execute on function public.family_wish_save(uuid, uuid, text, text, text), public.family_wish_delete(uuid), public.family_wish_claim(uuid, boolean) to authenticated;
create table if not exists public.family_chores (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  points int not null check (points between 1 and 100),
  every text not null check (every in ('daily', 'weekly')),
  rotate uuid[] not null,
  anchor date not null,
  created_at timestamptz not null default now()
);
create table if not exists public.family_chore_log (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  chore_id uuid not null references public.family_chores(id) on delete cascade,
  period date not null,
  person uuid not null,
  status text not null check (status in ('pending', 'approved')),
  marked_by uuid,
  created_at timestamptz not null default now(),
  unique (chore_id, period)
);
create table if not exists public.family_points (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  person uuid not null,
  delta int not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists family_points_fam on public.family_points (family_id, person);
alter table public.family_chores enable row level security;
alter table public.family_chore_log enable row level security;
alter table public.family_points enable row level security;
drop policy if exists "chores read" on public.family_chores;
create policy "chores read" on public.family_chores for select to authenticated using (public.family_ok(family_id));
drop policy if exists "chorelog read" on public.family_chore_log;
create policy "chorelog read" on public.family_chore_log for select to authenticated using (public.family_ok(family_id));
grant select on public.family_chores, public.family_chore_log to authenticated;
do $$ begin
  begin alter publication supabase_realtime add table public.family_chores; exception when others then null; end;
  begin alter publication supabase_realtime add table public.family_chore_log; exception when others then null; end;
end $$;

-- Who has the chore in a given day or week: the list goes round in turn.
create or replace function public.family_chore_person(c public.family_chores, p_period date) returns uuid
language plpgsql immutable as $$
declare n int := array_length(c.rotate, 1); step int := case c.every when 'weekly' then 7 else 1 end; k int; i int;
begin
  k := floor((p_period - c.anchor)::numeric / step);
  i := ((k % n) + n) % n;
  return c.rotate[i + 1];
end $$;

create or replace function public.family_chore_save(p_id uuid, p_title text, p_points int, p_every text, p_rotate uuid[]) returns uuid
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); kl date := (now() at time zone 'Asia/Kuala_Lumpur')::date; a date; cid uuid; old public.family_chores;
begin
  if coalesce(public.family_my_role(), '') not in ('owner', 'parent') then raise exception 'not_allowed'; end if;
  if char_length(trim(coalesce(p_title, ''))) < 1 then raise exception 'bad_title'; end if;
  if p_points is null or p_points < 1 or p_points > 100 then raise exception 'bad_points'; end if;
  if p_every not in ('daily', 'weekly') then raise exception 'bad_date'; end if;
  if coalesce(array_length(p_rotate, 1), 0) < 1 or array_length(p_rotate, 1) > 10 or not public.family_people_ok(fid, p_rotate) then raise exception 'bad_people'; end if;
  a := case p_every when 'weekly' then kl - (extract(isodow from kl)::int - 1) else kl end;
  if p_id is null then
    if (select count(*) from public.family_chores where family_id = fid) >= 30 then raise exception 'list_full'; end if;
    insert into public.family_chores(family_id, title, points, every, rotate, anchor) values (fid, left(trim(p_title), 80), p_points, p_every, p_rotate, a) returning id into cid;
    return cid;
  end if;
  select * into old from public.family_chores where id = p_id and family_id = fid;
  if not found then raise exception 'not_found'; end if;
  update public.family_chores set title = left(trim(p_title), 80), points = p_points, every = p_every, rotate = p_rotate,
    anchor = case when old.every = p_every then old.anchor else a end where id = p_id;
  return p_id;
end $$;

create or replace function public.family_chore_delete(p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid();
begin
  if coalesce(public.family_my_role(), '') not in ('owner', 'parent') then raise exception 'not_allowed'; end if;
  delete from public.family_chores where id = p_id and family_id = fid;
  return true;
end $$;

revoke all on function public.family_chore_save(uuid, text, int, text, uuid[]), public.family_chore_delete(uuid) from public, anon;
grant execute on function public.family_chore_save(uuid, text, int, text, uuid[]), public.family_chore_delete(uuid) to authenticated;
create or replace function public.family_chore_mark(p_chore uuid, p_period date) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); c public.family_chores; kl date := (now() at time zone 'Asia/Kuala_Lumpur')::date;
  mon date; who uuid; parent boolean := coalesce(public.family_my_role(), '') in ('owner', 'parent');
begin
  select * into c from public.family_chores where id = p_chore and family_id = fid;
  if not found then raise exception 'not_found'; end if;
  mon := kl - (extract(isodow from kl)::int - 1);
  if c.every = 'weekly' then
    if extract(isodow from p_period) <> 1 or abs(p_period - mon) > 7 then raise exception 'bad_date'; end if;
  else
    if abs(p_period - kl) > 1 then raise exception 'bad_date'; end if;
  end if;
  who := public.family_chore_person(c, p_period);
  if who <> auth.uid() and not parent then raise exception 'not_allowed'; end if;
  if exists (select 1 from public.family_chore_log where chore_id = c.id and period = p_period) then raise exception 'already_marked'; end if;
  insert into public.family_chore_log(family_id, chore_id, period, person, status, marked_by)
  values (fid, c.id, p_period, who, case when parent then 'approved' else 'pending' end, auth.uid());
  if parent then
    insert into public.family_points(family_id, person, delta, reason) values (fid, who, c.points, 'Chore: ' || c.title);
  end if;
  delete from public.family_chore_log where family_id = fid and period < kl - 60;
  return true;
end $$;

create or replace function public.family_chore_decide(p_log uuid, p_ok boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); l public.family_chore_log; c public.family_chores;
begin
  if coalesce(public.family_my_role(), '') not in ('owner', 'parent') then raise exception 'not_allowed'; end if;
  select * into l from public.family_chore_log where id = p_log and family_id = fid and status = 'pending';
  if not found then raise exception 'not_found'; end if;
  if p_ok then
    select * into c from public.family_chores where id = l.chore_id;
    update public.family_chore_log set status = 'approved' where id = l.id;
    insert into public.family_points(family_id, person, delta, reason) values (fid, l.person, c.points, 'Chore: ' || c.title);
  else
    delete from public.family_chore_log where id = l.id;
  end if;
  return true;
end $$;

-- Everyone's points in one call, so a long history never makes the numbers wrong.
create or replace function public.family_balances() returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare fid uuid := public.family_my_fid();
begin
  return coalesce((select jsonb_object_agg(person::text, s) from (select person, sum(delta)::int as s from public.family_points where family_id = fid group by person) t), '{}'::jsonb);
end $$;

revoke all on function public.family_chore_mark(uuid, date), public.family_chore_decide(uuid, boolean), public.family_balances() from public, anon;
grant execute on function public.family_chore_mark(uuid, date), public.family_chore_decide(uuid, boolean), public.family_balances() to authenticated;
create table if not exists public.family_rewards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  cost int not null check (cost between 1 and 1000),
  created_at timestamptz not null default now()
);
create table if not exists public.family_redeems (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  person uuid not null,
  title text not null,
  cost int not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  requested_by uuid,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
alter table public.family_rewards enable row level security;
alter table public.family_redeems enable row level security;
drop policy if exists "rewards read" on public.family_rewards;
create policy "rewards read" on public.family_rewards for select to authenticated using (public.family_ok(family_id));
drop policy if exists "redeems read" on public.family_redeems;
create policy "redeems read" on public.family_redeems for select to authenticated using (public.family_ok(family_id));
grant select on public.family_rewards, public.family_redeems to authenticated;
do $$ begin
  begin alter publication supabase_realtime add table public.family_rewards; exception when others then null; end;
  begin alter publication supabase_realtime add table public.family_redeems; exception when others then null; end;
end $$;

create or replace function public.family_reward_save(p_id uuid, p_title text, p_cost int) returns uuid
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); rid uuid;
begin
  if coalesce(public.family_my_role(), '') not in ('owner', 'parent') then raise exception 'not_allowed'; end if;
  if char_length(trim(coalesce(p_title, ''))) < 1 then raise exception 'bad_title'; end if;
  if p_cost is null or p_cost < 1 or p_cost > 1000 then raise exception 'bad_points'; end if;
  if p_id is null then
    if (select count(*) from public.family_rewards where family_id = fid) >= 30 then raise exception 'list_full'; end if;
    insert into public.family_rewards(family_id, title, cost) values (fid, left(trim(p_title), 60), p_cost) returning id into rid;
    return rid;
  end if;
  update public.family_rewards set title = left(trim(p_title), 60), cost = p_cost where id = p_id and family_id = fid;
  if not found then raise exception 'not_found'; end if;
  return p_id;
end $$;

create or replace function public.family_reward_delete(p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid();
begin
  if coalesce(public.family_my_role(), '') not in ('owner', 'parent') then raise exception 'not_allowed'; end if;
  delete from public.family_rewards where id = p_id and family_id = fid;
  return true;
end $$;

create or replace function public.family_reward_ask(p_reward uuid, p_person uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); r public.family_rewards; bal int; held int;
begin
  select * into r from public.family_rewards where id = p_reward and family_id = fid;
  if not found then raise exception 'not_found'; end if;
  if not public.family_people_ok(fid, array[p_person]) then raise exception 'bad_people'; end if;
  if p_person <> auth.uid() and coalesce(public.family_my_role(), '') not in ('owner', 'parent') then raise exception 'not_allowed'; end if;
  select coalesce(sum(delta), 0) into bal from public.family_points where family_id = fid and person = p_person;
  select coalesce(sum(cost), 0) into held from public.family_redeems where family_id = fid and person = p_person and status = 'pending';
  if bal - held < r.cost then raise exception 'not_enough_points'; end if;
  insert into public.family_redeems(family_id, person, title, cost, requested_by) values (fid, p_person, r.title, r.cost, auth.uid());
  delete from public.family_redeems where family_id = fid and status <> 'pending' and decided_at < now() - interval '90 days';
  return true;
end $$;

create or replace function public.family_redeem_decide(p_id uuid, p_ok boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); d public.family_redeems; bal int;
begin
  if coalesce(public.family_my_role(), '') not in ('owner', 'parent') then raise exception 'not_allowed'; end if;
  select * into d from public.family_redeems where id = p_id and family_id = fid and status = 'pending';
  if not found then raise exception 'not_found'; end if;
  if p_ok then
    select coalesce(sum(delta), 0) into bal from public.family_points where family_id = fid and person = d.person;
    if bal < d.cost then raise exception 'not_enough_points'; end if;
    insert into public.family_points(family_id, person, delta, reason) values (fid, d.person, -d.cost, 'Reward: ' || d.title);
    update public.family_redeems set status = 'approved', decided_at = now() where id = d.id;
  else
    update public.family_redeems set status = 'declined', decided_at = now() where id = d.id;
  end if;
  return true;
end $$;

revoke all on function public.family_reward_save(uuid, text, int), public.family_reward_delete(uuid), public.family_reward_ask(uuid, uuid), public.family_redeem_decide(uuid, boolean) from public, anon;
grant execute on function public.family_reward_save(uuid, text, int), public.family_reward_delete(uuid), public.family_reward_ask(uuid, uuid), public.family_redeem_decide(uuid, boolean) to authenticated;
