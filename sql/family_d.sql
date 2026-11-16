-- Leaving a family: the owner may now leave too. Ownership passes to the longest-standing parent (or, if there is none, the
-- longest-standing member), and the owner's place is removed. If the owner is alone, the family is removed as before.
create or replace function public.family_leave() returns boolean
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); m public.family_members; nxt uuid;
begin
  if uid is null then raise exception 'not_signed_in'; end if;
  select * into m from public.family_members where user_id = uid;
  if not found then raise exception 'not_in_family'; end if;
  if m.role = 'owner' then
    select user_id into nxt from public.family_members
      where family_id = m.family_id and user_id <> uid
      order by (role = 'parent') desc, joined_at asc limit 1;
    if nxt is null then
      delete from public.families where id = m.family_id;
    else
      update public.family_members set role = 'owner' where user_id = nxt and family_id = m.family_id;
      update public.families set owner_id = nxt where id = m.family_id;
      delete from public.family_members where user_id = uid;
    end if;
  else
    delete from public.family_members where user_id = uid;
  end if;
  return true;
end $$;
