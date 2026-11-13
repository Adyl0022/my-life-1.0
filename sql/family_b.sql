-- My Life 1.0 — Family Planner, stage B (tasks, activities, shared shopping list, recently deleted).
-- Run this whole file once in Supabase > SQL Editor, AFTER family.sql (it uses family_ok() and the family tables).
-- Like stage A, the app never writes to these tables directly: every change goes through the functions below,
-- and each one checks that the person is signed in, has an active licence and belongs to the family.
-- Every member can add, edit and delete (agreed rule). Deleting only hides the item; it stays in "Recently deleted"
-- for 7 days and can be restored by anyone in the family, then it is removed for good.

-- Tables ----------------------------------------------------------------------------------------------------
-- "assignees" and "attendees" hold the user id of a member, or the id of a profile without an account.
create table if not exists public.family_tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  note text check (note is null or char_length(note) <= 500),
  due_at timestamptz,
  repeat text not null default 'none' check (repeat in ('none', 'daily', 'weekdays', 'weekly', 'monthly')),
  remind_min int check (remind_min is null or remind_min in (0, 10, 30, 60, 180, 1440)),
  assignees uuid[] not null default '{}',
  done boolean not null default false,
  done_at timestamptz,
  done_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
);

create table if not exists public.family_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  place text check (place is null or char_length(place) <= 80),
  note text check (note is null or char_length(note) <= 500),
  starts_at timestamptz not null,
  ends_at timestamptz,
  attendees uuid[] not null default '{}',
  remind_min int check (remind_min is null or remind_min in (0, 10, 30, 60, 180, 1440)),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
);

create table if not exists public.family_shop (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  qty text check (qty is null or char_length(qty) <= 30),
  category text not null default 'Groceries' check (char_length(category) between 1 and 20),
  bought boolean not null default false,
  bought_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null
);

create index if not exists family_tasks_fam on public.family_tasks (family_id, deleted_at);
create index if not exists family_events_fam on public.family_events (family_id, deleted_at, starts_at);
create index if not exists family_shop_fam on public.family_shop (family_id, deleted_at);

alter table public.family_tasks enable row level security;
alter table public.family_events enable row level security;
alter table public.family_shop enable row level security;

-- Members can read (this is also what lets the lists update live); nobody can write directly.
drop policy if exists "tasks read" on public.family_tasks;
create policy "tasks read" on public.family_tasks for select to authenticated using (public.family_ok(family_id));
drop policy if exists "events read" on public.family_events;
create policy "events read" on public.family_events for select to authenticated using (public.family_ok(family_id));
drop policy if exists "shop read" on public.family_shop;
create policy "shop read" on public.family_shop for select to authenticated using (public.family_ok(family_id));

-- Live updates (safe to run twice; ignored if the realtime publication is not there).
do $$ begin
  begin alter publication supabase_realtime add table public.family_tasks; exception when others then null; end;
  begin alter publication supabase_realtime add table public.family_events; exception when others then null; end;
  begin alter publication supabase_realtime add table public.family_shop; exception when others then null; end;
end $$;

-- Helpers ---------------------------------------------------------------------------------------------------
-- The family of the signed-in person; raises when they are not signed in, not in a family or not licensed.
create or replace function public.family_my_fid() returns uuid
language plpgsql security definer set search_path = public stable as $$
declare fid uuid;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if not public.is_active() then raise exception 'not_active'; end if;
  select family_id into fid from public.family_members where user_id = auth.uid();
  if fid is null then raise exception 'no_family'; end if;
  return fid;
end $$;

-- True when every id is a member or a profile of that family.
create or replace function public.family_people_ok(fid uuid, ids uuid[]) returns boolean
language sql security definer set search_path = public stable as $$
  select coalesce(bool_and(
    exists (select 1 from public.family_members m where m.family_id = fid and m.user_id = x)
    or exists (select 1 from public.family_profiles p where p.family_id = fid and p.id = x)
  ), true) from unnest(coalesce(ids, '{}'::uuid[])) as x;
$$;

-- Next date of a repeating task, counted in Malaysia time so "weekdays" means Monday to Friday there.
create or replace function public.family_next_due(d timestamptz, r text) returns timestamptz
language plpgsql stable set search_path = public as $$
declare n timestamptz := d; i int := 0;
begin
  loop
    i := i + 1;
    n := case r
      when 'daily' then n + interval '1 day'
      when 'weekly' then n + interval '7 days'
      when 'monthly' then n + interval '1 month'
      when 'weekdays' then n + interval '1 day'
      else n end;
    if r = 'weekdays' and extract(isodow from (n at time zone 'Asia/Kuala_Lumpur')) in (6, 7) then continue; end if;
    exit when n > now() or i > 400 or r = 'none';
  end loop;
  return n;
end $$;

-- Remove what has been in "Recently deleted" for more than 7 days.
create or replace function public.family_purge(fid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.family_tasks where family_id = fid and deleted_at < now() - interval '7 days';
  delete from public.family_events where family_id = fid and deleted_at < now() - interval '7 days';
  delete from public.family_shop where family_id = fid and deleted_at < now() - interval '7 days';
end $$;

-- Tasks -----------------------------------------------------------------------------------------------------
create or replace function public.family_task_save(
  p_id uuid, p_title text, p_note text, p_due timestamptz, p_repeat text, p_remind int, p_assignees uuid[]
) returns uuid
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); tid uuid;
begin
  if char_length(trim(coalesce(p_title, ''))) < 1 then raise exception 'bad_title'; end if;
  if coalesce(p_repeat, 'none') <> 'none' and p_due is null then raise exception 'repeat_needs_date'; end if;
  if not public.family_people_ok(fid, p_assignees) then raise exception 'bad_people'; end if;
  if p_id is null then
    if (select count(*) from public.family_tasks where family_id = fid and deleted_at is null) >= 500 then raise exception 'list_full'; end if;
    insert into public.family_tasks(family_id, title, note, due_at, repeat, remind_min, assignees, created_by)
      values (fid, left(trim(p_title), 120), nullif(left(trim(coalesce(p_note, '')), 500), ''), p_due, coalesce(p_repeat, 'none'), p_remind, coalesce(p_assignees, '{}'), auth.uid())
      returning id into tid;
  else
    update public.family_tasks set title = left(trim(p_title), 120), note = nullif(left(trim(coalesce(p_note, '')), 500), ''), due_at = p_due,
      repeat = coalesce(p_repeat, 'none'), remind_min = p_remind, assignees = coalesce(p_assignees, '{}'), updated_at = now()
      where id = p_id and family_id = fid and deleted_at is null returning id into tid;
    if tid is null then raise exception 'not_found'; end if;
  end if;
  return tid;
end $$;

-- Tick or untick a task. A repeating task is not finished: it moves to its next date instead.
create or replace function public.family_task_done(p_id uuid, p_done boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); t public.family_tasks;
begin
  select * into t from public.family_tasks where id = p_id and family_id = fid and deleted_at is null;
  if not found then raise exception 'not_found'; end if;
  if p_done and t.repeat <> 'none' and t.due_at is not null then
    update public.family_tasks set due_at = public.family_next_due(t.due_at, t.repeat), updated_at = now() where id = p_id;
  else
    update public.family_tasks set done = p_done, done_at = case when p_done then now() else null end,
      done_by = case when p_done then auth.uid() else null end, updated_at = now() where id = p_id;
  end if;
  return true;
end $$;

-- Activities ------------------------------------------------------------------------------------------------
create or replace function public.family_event_save(
  p_id uuid, p_title text, p_place text, p_note text, p_starts timestamptz, p_ends timestamptz, p_attendees uuid[], p_remind int
) returns uuid
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); eid uuid;
begin
  if char_length(trim(coalesce(p_title, ''))) < 1 then raise exception 'bad_title'; end if;
  if p_starts is null then raise exception 'bad_date'; end if;
  if p_ends is not null and p_ends < p_starts then raise exception 'bad_date'; end if;
  if not public.family_people_ok(fid, p_attendees) then raise exception 'bad_people'; end if;
  if p_id is null then
    if (select count(*) from public.family_events where family_id = fid and deleted_at is null) >= 300 then raise exception 'list_full'; end if;
    insert into public.family_events(family_id, title, place, note, starts_at, ends_at, attendees, remind_min, created_by)
      values (fid, left(trim(p_title), 120), nullif(left(trim(coalesce(p_place, '')), 80), ''), nullif(left(trim(coalesce(p_note, '')), 500), ''),
              p_starts, p_ends, coalesce(p_attendees, '{}'), p_remind, auth.uid())
      returning id into eid;
  else
    update public.family_events set title = left(trim(p_title), 120), place = nullif(left(trim(coalesce(p_place, '')), 80), ''),
      note = nullif(left(trim(coalesce(p_note, '')), 500), ''), starts_at = p_starts, ends_at = p_ends,
      attendees = coalesce(p_attendees, '{}'), remind_min = p_remind, updated_at = now()
      where id = p_id and family_id = fid and deleted_at is null returning id into eid;
    if eid is null then raise exception 'not_found'; end if;
  end if;
  return eid;
end $$;

-- Shopping list ---------------------------------------------------------------------------------------------
create or replace function public.family_shop_save(p_id uuid, p_name text, p_qty text, p_cat text) returns uuid
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); sid uuid; cat text := coalesce(nullif(left(trim(coalesce(p_cat, '')), 20), ''), 'Groceries');
begin
  if char_length(trim(coalesce(p_name, ''))) < 1 then raise exception 'bad_title'; end if;
  if p_id is null then
    if (select count(*) from public.family_shop where family_id = fid and deleted_at is null) >= 300 then raise exception 'list_full'; end if;
    insert into public.family_shop(family_id, name, qty, category, created_by)
      values (fid, left(trim(p_name), 80), nullif(left(trim(coalesce(p_qty, '')), 30), ''), cat, auth.uid()) returning id into sid;
  else
    update public.family_shop set name = left(trim(p_name), 80), qty = nullif(left(trim(coalesce(p_qty, '')), 30), ''), category = cat, updated_at = now()
      where id = p_id and family_id = fid and deleted_at is null returning id into sid;
    if sid is null then raise exception 'not_found'; end if;
  end if;
  return sid;
end $$;

create or replace function public.family_shop_bought(p_id uuid, p_bought boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid();
begin
  update public.family_shop set bought = p_bought, bought_by = case when p_bought then auth.uid() else null end, updated_at = now()
    where id = p_id and family_id = fid and deleted_at is null;
  if not found then raise exception 'not_found'; end if;
  return true;
end $$;

-- "Clear bought": moves every bought item to Recently deleted, so a tap by mistake can be undone.
create or replace function public.family_shop_clear_bought() returns int
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); n int;
begin
  update public.family_shop set deleted_at = now(), deleted_by = auth.uid(), updated_at = now()
    where family_id = fid and bought and deleted_at is null;
  get diagnostics n = row_count;
  return n;
end $$;

-- Delete, restore, recently deleted (kind is 'task', 'event' or 'shop') ---------------------------------------
create or replace function public.family_delete(p_kind text, p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); n int;
begin
  if p_kind = 'task' then
    update public.family_tasks set deleted_at = now(), deleted_by = auth.uid(), updated_at = now() where id = p_id and family_id = fid and deleted_at is null;
  elsif p_kind = 'event' then
    update public.family_events set deleted_at = now(), deleted_by = auth.uid(), updated_at = now() where id = p_id and family_id = fid and deleted_at is null;
  elsif p_kind = 'shop' then
    update public.family_shop set deleted_at = now(), deleted_by = auth.uid(), updated_at = now() where id = p_id and family_id = fid and deleted_at is null;
  else raise exception 'bad_kind'; end if;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'not_found'; end if;
  return true;
end $$;

create or replace function public.family_restore(p_kind text, p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); n int;
begin
  if p_kind = 'task' then
    update public.family_tasks set deleted_at = null, deleted_by = null, updated_at = now() where id = p_id and family_id = fid and deleted_at is not null;
  elsif p_kind = 'event' then
    update public.family_events set deleted_at = null, deleted_by = null, updated_at = now() where id = p_id and family_id = fid and deleted_at is not null;
  elsif p_kind = 'shop' then
    update public.family_shop set deleted_at = null, deleted_by = null, updated_at = now() where id = p_id and family_id = fid and deleted_at is not null;
  else raise exception 'bad_kind'; end if;
  get diagnostics n = row_count;
  if n = 0 then raise exception 'not_found'; end if;
  return true;
end $$;

-- Remove one item (or everything) from Recently deleted for good.
create or replace function public.family_trash_remove(p_kind text, p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid();
begin
  if p_kind = 'task' then delete from public.family_tasks where id = p_id and family_id = fid and deleted_at is not null;
  elsif p_kind = 'event' then delete from public.family_events where id = p_id and family_id = fid and deleted_at is not null;
  elsif p_kind = 'shop' then delete from public.family_shop where id = p_id and family_id = fid and deleted_at is not null;
  else raise exception 'bad_kind'; end if;
  return true;
end $$;

create or replace function public.family_trash_empty() returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid();
begin
  delete from public.family_tasks where family_id = fid and deleted_at is not null;
  delete from public.family_events where family_id = fid and deleted_at is not null;
  delete from public.family_shop where family_id = fid and deleted_at is not null;
  return true;
end $$;

-- What is in Recently deleted (also cleans out anything older than 7 days).
create or replace function public.family_trash() returns jsonb
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid();
begin
  perform public.family_purge(fid);
  return coalesce((
    select jsonb_agg(x order by (x->>'deleted_at') desc) from (
      select jsonb_build_object('kind', 'task', 'id', id, 'title', title, 'deleted_at', deleted_at, 'deleted_by', deleted_by) as x from public.family_tasks where family_id = fid and deleted_at is not null
      union all
      select jsonb_build_object('kind', 'event', 'id', id, 'title', title, 'deleted_at', deleted_at, 'deleted_by', deleted_by) from public.family_events where family_id = fid and deleted_at is not null
      union all
      select jsonb_build_object('kind', 'shop', 'id', id, 'title', name, 'deleted_at', deleted_at, 'deleted_by', deleted_by) from public.family_shop where family_id = fid and deleted_at is not null
    ) t
  ), '[]'::jsonb);
end $$;

-- Only signed-in people may call these ---------------------------------------------------------------------
revoke all on function public.family_my_fid(), public.family_people_ok(uuid, uuid[]), public.family_next_due(timestamptz, text),
  public.family_purge(uuid), public.family_task_save(uuid, text, text, timestamptz, text, int, uuid[]),
  public.family_task_done(uuid, boolean),
  public.family_event_save(uuid, text, text, text, timestamptz, timestamptz, uuid[], int),
  public.family_shop_save(uuid, text, text, text), public.family_shop_bought(uuid, boolean), public.family_shop_clear_bought(),
  public.family_delete(text, uuid), public.family_restore(text, uuid), public.family_trash_remove(text, uuid),
  public.family_trash_empty(), public.family_trash() from public, anon;
grant execute on function public.family_task_save(uuid, text, text, timestamptz, text, int, uuid[]),
  public.family_task_done(uuid, boolean),
  public.family_event_save(uuid, text, text, text, timestamptz, timestamptz, uuid[], int),
  public.family_shop_save(uuid, text, text, text), public.family_shop_bought(uuid, boolean), public.family_shop_clear_bought(),
  public.family_delete(text, uuid), public.family_restore(text, uuid), public.family_trash_remove(text, uuid),
  public.family_trash_empty(), public.family_trash() to authenticated;

-- The family lists are read straight from the tables (the row rules above decide who may see what), so signed-in people need
-- permission to read them. Without this line adding works but the lists stay empty. Safe to run twice.
grant select on public.family_tasks, public.family_events, public.family_shop to authenticated;
