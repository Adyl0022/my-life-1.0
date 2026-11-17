-- Family Planner, Rewards: a parent (or the owner) can clear the Recent list of one person.
-- It removes only the finished lines (approved or not now). Points are kept in family_points, so nobody's points change,
-- and requests that are still waiting for a parent are kept.
create or replace function public.family_redeems_clear(p_person uuid) returns int
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); n int;
begin
  if fid is null then raise exception 'not_allowed'; end if;
  if coalesce(public.family_my_role(), '') not in ('owner', 'parent') then raise exception 'not_allowed'; end if;
  delete from public.family_redeems where family_id = fid and person = p_person and status <> 'pending';
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.family_redeems_clear(uuid) from public, anon;
grant execute on function public.family_redeems_clear(uuid) to authenticated;
