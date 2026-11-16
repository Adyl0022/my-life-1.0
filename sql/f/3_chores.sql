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
