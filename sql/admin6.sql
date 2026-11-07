-- My Life 1.0 — devices signed in. Run once in Supabase > SQL Editor, after admin5.sql.
-- No IP addresses or device names are returned, only counts and times.

-- The signed-in user's own devices (the app shows this to the admin only).
create or replace function public.my_devices() returns jsonb
language sql security definer set search_path = public stable as $$
  select jsonb_build_object('count', count(*), 'last', max(coalesce(s.refreshed_at, s.updated_at, s.created_at)))
  from auth.sessions s where s.user_id = auth.uid() and (s.not_after is null or s.not_after > now());
$$;
grant execute on function public.my_devices() to authenticated;

-- Admin: how many devices each user is signed in on.
create or replace function public.admin_devices() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.admin_guard();
  return coalesce((select jsonb_agg(x) from (
    select s.user_id, count(*) as n, max(coalesce(s.refreshed_at, s.updated_at, s.created_at)) as last_at
    from auth.sessions s where s.not_after is null or s.not_after > now() group by s.user_id) x), '[]'::jsonb);
end $$;

-- Admin: sign a user out of every device.
create or replace function public.admin_signout_user(p_user uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  perform public.admin_guard();
  delete from auth.sessions where user_id = p_user;
  return true;
end $$;

grant execute on function public.admin_devices() to authenticated;
grant execute on function public.admin_signout_user(uuid) to authenticated;
