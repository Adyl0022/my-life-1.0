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
