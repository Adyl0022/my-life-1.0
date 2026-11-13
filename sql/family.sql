-- My Life 1.0 — Family Planner, stage A (family space, invite code, members).
-- Run this whole file once in Supabase > SQL Editor. It needs license.sql to have been run first (it uses is_active()).
-- Nothing in the app can read or write these tables directly: every action goes through the functions below,
-- and every function checks that the person is signed in and has an active licence.

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  owner_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  invites_open boolean not null default true,     -- the owner can switch the invite code off
  created_at timestamptz not null default now()
);
alter table public.families add column if not exists invites_open boolean not null default true;

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  color text not null default '#ff8fab',
  role text not null default 'member' check (role in ('owner', 'parent', 'member')),
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id),
  unique (user_id)                      -- one family per person for now
);

-- People without an account (a child, a grandparent). A name and a colour only, managed by parents.
create table if not exists public.family_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  color text not null default '#ffc46b',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.family_attempts (
  user_id uuid not null,
  at timestamptz not null default now()
);

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_profiles enable row level security;
alter table public.family_attempts enable row level security;   -- no policies: the app can never read this

-- Helpers ---------------------------------------------------------------------------------------------------
create or replace function public.family_ok(fid uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select public.is_active() and exists (select 1 from public.family_members m where m.family_id = fid and m.user_id = auth.uid());
$$;

-- The role of the signed-in person, or null when they are in no family or their licence is not active.
create or replace function public.family_my_role() returns text
language sql security definer set search_path = public stable as $$
  select m.role from public.family_members m where m.user_id = auth.uid() and public.is_active();
$$;

create or replace function public.family_gen_code() returns text
language plpgsql set search_path = public as $$
declare chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; c text; i int;
begin
  loop
    c := '';
    for i in 1..6 loop c := c || substr(chars, 1 + floor(random() * length(chars))::int, 1); end loop;
    exit when not exists (select 1 from public.families where code = c);
  end loop;
  return c;
end $$;

-- Members of a family can read it (kept for the later stages; the app uses family_info() for now).
drop policy if exists "family read" on public.families;
create policy "family read" on public.families for select to authenticated using (public.family_ok(id));
drop policy if exists "members read" on public.family_members;
create policy "members read" on public.family_members for select to authenticated using (public.family_ok(family_id));
drop policy if exists "profiles read" on public.family_profiles;
create policy "profiles read" on public.family_profiles for select to authenticated using (public.family_ok(family_id));

-- Everything the family screen needs, in one call -----------------------------------------------------------
create or replace function public.family_info() returns jsonb
language plpgsql security definer set search_path = public stable as $$
declare uid uuid := auth.uid(); m public.family_members; f public.families;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  select * into m from public.family_members where user_id = uid;
  if not found then return jsonb_build_object('state', 'none'); end if;
  if not public.is_active() then return jsonb_build_object('state', 'locked'); end if;
  select * into f from public.families where id = m.family_id;
  return jsonb_build_object(
    'state', 'ready', 'id', f.id, 'name', f.name, 'role', m.role, 'me', uid,
    'code', case when m.role in ('owner', 'parent') and f.invites_open then f.code else null end, 'invites_open', f.invites_open,
    'max_members', 15, 'max_profiles', 10,
    'members', (select coalesce(jsonb_agg(jsonb_build_object('user_id', x.user_id, 'name', x.display_name, 'color', x.color, 'role', x.role, 'joined', x.joined_at) order by x.joined_at), '[]'::jsonb)
                from public.family_members x where x.family_id = f.id),
    'profiles', (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'color', p.color) order by p.created_at), '[]'::jsonb)
                 from public.family_profiles p where p.family_id = f.id)
  );
end $$;

-- Create a family ---------------------------------------------------------------------------------------------
create or replace function public.family_create(p_name text, p_display text, p_color text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); fid uuid; c text;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if not public.is_active() then raise exception 'not_active'; end if;
  if char_length(trim(coalesce(p_name, ''))) < 1 or char_length(trim(coalesce(p_display, ''))) < 1 then raise exception 'bad_name'; end if;
  if exists (select 1 from public.family_members where user_id = uid) then raise exception 'already_in_family'; end if;
  c := public.family_gen_code();
  insert into public.families(name, owner_id, code) values (left(trim(p_name), 40), uid, c) returning id into fid;
  insert into public.family_members(family_id, user_id, display_name, color, role)
    values (fid, uid, left(trim(p_display), 30), coalesce(nullif(p_color, ''), '#ff8fab'), 'owner');
  return jsonb_build_object('id', fid, 'code', c);
end $$;

-- Join with a code (8 wrong tries in 15 minutes are blocked, like activation codes) ---------------------------
create or replace function public.family_join(p_code text, p_display text, p_color text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); f public.families; n int;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  if not public.is_active() then raise exception 'not_active'; end if;
  if char_length(trim(coalesce(p_display, ''))) < 1 then raise exception 'bad_name'; end if;
  delete from public.family_attempts where at < now() - interval '1 day';
  if (select count(*) from public.family_attempts where user_id = uid and at > now() - interval '15 minutes') >= 8 then
    raise exception 'too_many_attempts';
  end if;
  if exists (select 1 from public.family_members where user_id = uid) then raise exception 'already_in_family'; end if;
  select * into f from public.families where invites_open and code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if not found then
    insert into public.family_attempts(user_id) values (uid);    -- return instead of raising, so the try is saved
    return jsonb_build_object('error', 'invalid_code');
  end if;
  select count(*) into n from public.family_members where family_id = f.id;
  if n >= 15 then return jsonb_build_object('error', 'family_full'); end if;
  insert into public.family_members(family_id, user_id, display_name, color, role)
    values (f.id, uid, left(trim(p_display), 30), coalesce(nullif(p_color, ''), '#5ee7df'), 'member');
  return jsonb_build_object('id', f.id);
end $$;

-- Leave. The owner can only leave when alone (the family is then removed) or after handing over ownership. ----
create or replace function public.family_leave() returns boolean
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); m public.family_members;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  select * into m from public.family_members where user_id = uid;
  if not found then raise exception 'not_in_family'; end if;
  if m.role = 'owner' then
    if exists (select 1 from public.family_members where family_id = m.family_id and user_id <> uid) then raise exception 'owner_must_transfer'; end if;
    delete from public.families where id = m.family_id;
  else
    delete from public.family_members where user_id = uid;
  end if;
  return true;
end $$;

-- Owner actions -------------------------------------------------------------------------------------------------
create or replace function public.family_remove_member(p_user uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); fid uuid;
begin
  if public.family_my_role() is distinct from 'owner' then raise exception 'not_allowed'; end if;
  if p_user = uid then raise exception 'cannot_remove_self'; end if;
  select family_id into fid from public.family_members where user_id = uid;
  delete from public.family_members where user_id = p_user and family_id = fid;
  return true;
end $$;

create or replace function public.family_new_code() returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if public.family_my_role() is distinct from 'owner' then raise exception 'not_allowed'; end if;
  c := public.family_gen_code();
  update public.families set code = c, invites_open = true where owner_id = auth.uid();
  return c;
end $$;

-- Switch the invite code off (nobody can join) or on again (a fresh code is made, so an old shared code stays dead).
create or replace function public.family_set_invites(p_open boolean) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if public.family_my_role() is distinct from 'owner' then raise exception 'not_allowed'; end if;
  if p_open then
    c := public.family_gen_code();
    update public.families set code = c, invites_open = true where owner_id = auth.uid();
    return c;
  end if;
  update public.families set invites_open = false where owner_id = auth.uid();
  return null;
end $$;

-- Delete the whole family for everyone. Only the owner, and only after typing the family name.
-- Members, people without an account and every task, activity and shopping item of the family go with it.
create or replace function public.family_delete_all(p_name text) returns boolean
language plpgsql security definer set search_path = public as $$
declare f public.families;
begin
  if public.family_my_role() is distinct from 'owner' then raise exception 'not_allowed'; end if;
  select * into f from public.families where owner_id = auth.uid();
  if lower(trim(coalesce(p_name, ''))) <> lower(trim(f.name)) then raise exception 'name_mismatch'; end if;
  delete from public.families where id = f.id;
  return true;
end $$;

create or replace function public.family_set_role(p_user uuid, p_role text) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  if public.family_my_role() is distinct from 'owner' then raise exception 'not_allowed'; end if;
  if p_role not in ('parent', 'member') then raise exception 'bad_role'; end if;
  select family_id into fid from public.family_members where user_id = auth.uid();
  update public.family_members set role = p_role where user_id = p_user and family_id = fid and role <> 'owner';
  return true;
end $$;

create or replace function public.family_transfer_owner(p_user uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); fid uuid;
begin
  if public.family_my_role() is distinct from 'owner' then raise exception 'not_allowed'; end if;
  select family_id into fid from public.family_members where user_id = uid;
  if not exists (select 1 from public.family_members where user_id = p_user and family_id = fid) or p_user = uid then raise exception 'bad_member'; end if;
  update public.family_members set role = 'owner' where user_id = p_user and family_id = fid;
  update public.family_members set role = 'parent' where user_id = uid and family_id = fid;
  update public.families set owner_id = p_user where id = fid;
  return true;
end $$;

create or replace function public.family_rename(p_name text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if public.family_my_role() is distinct from 'owner' then raise exception 'not_allowed'; end if;
  if char_length(trim(coalesce(p_name, ''))) < 1 then raise exception 'bad_name'; end if;
  update public.families set name = left(trim(p_name), 40) where owner_id = auth.uid();
  return true;
end $$;

-- Anyone: change my own name and colour in the family ----------------------------------------------------------
create or replace function public.family_set_me(p_display text, p_color text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if public.family_my_role() is null then raise exception 'not_allowed'; end if;
  if char_length(trim(coalesce(p_display, ''))) < 1 then raise exception 'bad_name'; end if;
  update public.family_members set display_name = left(trim(p_display), 30), color = coalesce(nullif(p_color, ''), color) where user_id = auth.uid();
  return true;
end $$;

-- Parents and the owner: people without an account (maximum 10) ----------------------------------------------
create or replace function public.family_profile_add(p_name text, p_color text) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  if coalesce(public.family_my_role(), '') not in ('owner', 'parent') then raise exception 'not_allowed'; end if;
  if char_length(trim(coalesce(p_name, ''))) < 1 then raise exception 'bad_name'; end if;
  select family_id into fid from public.family_members where user_id = auth.uid();
  if (select count(*) from public.family_profiles where family_id = fid) >= 10 then raise exception 'profiles_full'; end if;
  insert into public.family_profiles(family_id, name, color, created_by) values (fid, left(trim(p_name), 30), coalesce(nullif(p_color, ''), '#ffc46b'), auth.uid());
  return true;
end $$;

create or replace function public.family_profile_remove(p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  if coalesce(public.family_my_role(), '') not in ('owner', 'parent') then raise exception 'not_allowed'; end if;
  select family_id into fid from public.family_members where user_id = auth.uid();
  delete from public.family_profiles where id = p_id and family_id = fid;
  return true;
end $$;

-- Only signed-in people may call these ---------------------------------------------------------------------
revoke all on function public.family_ok(uuid), public.family_my_role(), public.family_gen_code(), public.family_info(),
  public.family_create(text, text, text), public.family_join(text, text, text), public.family_leave(),
  public.family_remove_member(uuid), public.family_new_code(), public.family_set_invites(boolean), public.family_delete_all(text), public.family_set_role(uuid, text),
  public.family_transfer_owner(uuid), public.family_rename(text), public.family_set_me(text, text),
  public.family_profile_add(text, text), public.family_profile_remove(uuid) from public, anon;
grant execute on function public.family_ok(uuid), public.family_my_role(), public.family_info(),
  public.family_create(text, text, text), public.family_join(text, text, text), public.family_leave(),
  public.family_remove_member(uuid), public.family_new_code(), public.family_set_invites(boolean), public.family_delete_all(text), public.family_set_role(uuid, text),
  public.family_transfer_owner(uuid), public.family_rename(text), public.family_set_me(text, text),
  public.family_profile_add(text, text), public.family_profile_remove(uuid) to authenticated;
