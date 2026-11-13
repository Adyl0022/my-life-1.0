-- Family Planner, stage C: birthdays for the family calendar. Run this once in the Supabase SQL editor.
-- Safe to run again.

alter table public.family_members add column if not exists birthday date;
alter table public.family_profiles add column if not exists birthday date;

-- family_info now also returns each person's birthday.
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
    'members', (select coalesce(jsonb_agg(jsonb_build_object('user_id', x.user_id, 'name', x.display_name, 'color', x.color, 'role', x.role, 'joined', x.joined_at, 'birthday', x.birthday) order by x.joined_at), '[]'::jsonb)
                from public.family_members x where x.family_id = f.id),
    'profiles', (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'color', p.color, 'birthday', p.birthday) order by p.created_at), '[]'::jsonb)
                 from public.family_profiles p where p.family_id = f.id)
  );
end $$;

-- Anyone: set or clear my own birthday.
create or replace function public.family_set_birthday(p_date date) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if public.family_my_role() is null then raise exception 'not_allowed'; end if;
  if p_date is not null and (p_date > current_date or p_date < date '1900-01-01') then raise exception 'bad_date'; end if;
  update public.family_members set birthday = p_date where user_id = auth.uid();
  return true;
end $$;

-- Owner or a parent: set or clear the birthday of a person without an account.
create or replace function public.family_profile_birthday(p_id uuid, p_date date) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  if coalesce(public.family_my_role(), '') not in ('owner', 'parent') then raise exception 'not_allowed'; end if;
  if p_date is not null and (p_date > current_date or p_date < date '1900-01-01') then raise exception 'bad_date'; end if;
  select family_id into fid from public.family_members where user_id = auth.uid();
  update public.family_profiles set birthday = p_date where id = p_id and family_id = fid;
  return true;
end $$;

revoke all on function public.family_set_birthday(date), public.family_profile_birthday(uuid, date) from public, anon;
grant execute on function public.family_set_birthday(date), public.family_profile_birthday(uuid, date) to authenticated;
