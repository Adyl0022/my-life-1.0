-- Birthdays: the owner and parents can set anyone's birthday; the date check allows for time zones (up to one day ahead of the server).
create or replace function public.family_set_birthday(p_date date) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if public.family_my_role() is null then raise exception 'not_allowed'; end if;
  if p_date is not null and (p_date > current_date + 1 or p_date < date '1900-01-01') then raise exception 'bad_date'; end if;
  update public.family_members set birthday = p_date where user_id = auth.uid();
  return true;
end $$;

create or replace function public.family_member_birthday(p_user uuid, p_date date) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid();
begin
  if coalesce(public.family_my_role(), '') not in ('owner', 'parent') then raise exception 'not_allowed'; end if;
  if p_date is not null and (p_date > current_date + 1 or p_date < date '1900-01-01') then raise exception 'bad_date'; end if;
  update public.family_members set birthday = p_date where user_id = p_user and family_id = fid;
  if not found then raise exception 'not_found'; end if;
  return true;
end $$;

revoke all on function public.family_member_birthday(uuid, date) from public, anon;
grant execute on function public.family_member_birthday(uuid, date) to authenticated;
