-- My Life 1.0 — admin can clear the wrong-code log (all of it, or one person's). Run once in Supabase > SQL Editor.
-- Also lets "Clear" remove codes that were already used.
create or replace function public.admin_clear_attempts(p_email text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  perform public.admin_guard();
  if p_email is null then delete from public.code_attempts;
  else delete from public.code_attempts where user_id in (select id from auth.users where email = p_email);
  end if;
  return true;
end $$;
grant execute on function public.admin_clear_attempts(text) to authenticated;

create or replace function public.admin_delete_code(p_code text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  perform public.admin_guard();
  delete from public.activation_codes where code = p_code;
  return found;
end $$;
