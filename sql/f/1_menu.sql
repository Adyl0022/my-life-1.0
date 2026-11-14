create table if not exists public.family_menu (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  day date not null,
  slot text not null check (slot in ('breakfast', 'lunch', 'dinner')),
  dish text not null check (char_length(dish) between 1 and 80),
  cook uuid,
  needs text check (needs is null or char_length(needs) <= 300),
  created_at timestamptz not null default now(),
  unique (family_id, day, slot)
);
alter table public.family_menu enable row level security;
drop policy if exists "menu read" on public.family_menu;
create policy "menu read" on public.family_menu for select to authenticated using (public.family_ok(family_id));
grant select on public.family_menu to authenticated;
do $$ begin
  begin alter publication supabase_realtime add table public.family_menu; exception when others then null; end;
end $$;

create or replace function public.family_menu_save(p_day date, p_slot text, p_dish text, p_cook uuid, p_needs text) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid();
begin
  if p_slot not in ('breakfast', 'lunch', 'dinner') or p_day is null then raise exception 'bad_date'; end if;
  if char_length(trim(coalesce(p_dish, ''))) < 1 then
    delete from public.family_menu where family_id = fid and day = p_day and slot = p_slot;
    return true;
  end if;
  if p_cook is not null and not public.family_people_ok(fid, array[p_cook]) then raise exception 'bad_people'; end if;
  insert into public.family_menu(family_id, day, slot, dish, cook, needs)
  values (fid, p_day, p_slot, left(trim(p_dish), 80), p_cook, left(nullif(trim(coalesce(p_needs, '')), ''), 300))
  on conflict (family_id, day, slot) do update set dish = excluded.dish, cook = excluded.cook, needs = excluded.needs;
  delete from public.family_menu where family_id = fid and day < current_date - 30;
  return true;
end $$;

revoke all on function public.family_menu_save(date, text, text, uuid, text) from public, anon;
grant execute on function public.family_menu_save(date, text, text, uuid, text) to authenticated;
