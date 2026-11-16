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
