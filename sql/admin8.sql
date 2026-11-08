-- My Life 1.0 — the Admin page marks which accounts are admins. Run once in Supabase > SQL Editor.
create or replace function public.admin_admins() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.admin_guard();
  return coalesce((select jsonb_agg(user_id) from public.admins), '[]'::jsonb);
end $$;
grant execute on function public.admin_admins() to authenticated;
