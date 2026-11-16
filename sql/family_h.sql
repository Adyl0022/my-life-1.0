-- Family Planner: a repeating task that was ticked cannot be ticked again until its next day / week / month begins.
create or replace function public.family_task_done(p_id uuid, p_done boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); t public.family_tasks; nd timestamptz; ps timestamptz;
begin
  select * into t from public.family_tasks where id = p_id and family_id = fid and deleted_at is null;
  if not found then raise exception 'not_found'; end if;
  if t.repeat <> 'none' and t.due_at is not null then
    if not p_done then raise exception 'already_marked'; end if;
    ps := case t.repeat
      when 'weekly' then date_trunc('week', t.due_at at time zone 'Asia/Kuala_Lumpur') at time zone 'Asia/Kuala_Lumpur'
      when 'monthly' then date_trunc('month', t.due_at at time zone 'Asia/Kuala_Lumpur') at time zone 'Asia/Kuala_Lumpur'
      else date_trunc('day', t.due_at at time zone 'Asia/Kuala_Lumpur') at time zone 'Asia/Kuala_Lumpur' end;
    if t.done_at is not null and now() < ps then raise exception 'already_marked'; end if;
    nd := public.family_next_due(t.due_at, t.repeat);
    update public.family_tasks set due_at = nd, done_at = now(), done_by = auth.uid(), updated_at = now() where id = p_id;
  else
    update public.family_tasks set done = p_done, done_at = case when p_done then now() else null end,
      done_by = case when p_done then auth.uid() else null end, updated_at = now() where id = p_id;
  end if;
  return true;
end $$;
