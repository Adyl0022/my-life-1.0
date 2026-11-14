create table if not exists public.family_wishes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  owner uuid not null,
  title text not null check (char_length(title) between 1 and 80),
  price text check (price is null or char_length(price) <= 30),
  note text check (note is null or char_length(note) <= 200),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.family_wish_claims (
  wish_id uuid primary key references public.family_wishes(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  claimer uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.family_wishes enable row level security;
alter table public.family_wish_claims enable row level security;
drop policy if exists "wishes read" on public.family_wishes;
create policy "wishes read" on public.family_wishes for select to authenticated using (public.family_ok(family_id));
-- The person a wish belongs to can never read who claimed it (so the gift stays a surprise).
drop policy if exists "claims read" on public.family_wish_claims;
create policy "claims read" on public.family_wish_claims for select to authenticated using (
  public.family_ok(family_id) and not exists (select 1 from public.family_wishes w where w.id = wish_id and w.owner = auth.uid())
);
grant select on public.family_wishes, public.family_wish_claims to authenticated;
do $$ begin
  begin alter publication supabase_realtime add table public.family_wishes; exception when others then null; end;
end $$;

create or replace function public.family_wish_save(p_id uuid, p_owner uuid, p_title text, p_price text, p_note text) returns uuid
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); parent boolean := coalesce(public.family_my_role(), '') in ('owner', 'parent'); wid uuid;
begin
  if char_length(trim(coalesce(p_title, ''))) < 1 then raise exception 'bad_title'; end if;
  if p_id is null then
    if p_owner is distinct from auth.uid() then
      if not parent or not exists (select 1 from public.family_profiles where id = p_owner and family_id = fid) then raise exception 'not_allowed'; end if;
    end if;
    if (select count(*) from public.family_wishes where family_id = fid and owner = p_owner) >= 30 then raise exception 'list_full'; end if;
    insert into public.family_wishes(family_id, owner, title, price, note, created_by)
    values (fid, p_owner, left(trim(p_title), 80), left(nullif(trim(coalesce(p_price, '')), ''), 30), left(nullif(trim(coalesce(p_note, '')), ''), 200), auth.uid()) returning id into wid;
    return wid;
  end if;
  update public.family_wishes set title = left(trim(p_title), 80), price = left(nullif(trim(coalesce(p_price, '')), ''), 30), note = left(nullif(trim(coalesce(p_note, '')), ''), 200)
  where id = p_id and family_id = fid and (owner = auth.uid() or parent);
  if not found then raise exception 'not_found'; end if;
  return p_id;
end $$;

create or replace function public.family_wish_delete(p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid();
begin
  delete from public.family_wishes where id = p_id and family_id = fid and (owner = auth.uid() or coalesce(public.family_my_role(), '') in ('owner', 'parent'));
  if not found then raise exception 'not_found'; end if;
  return true;
end $$;

create or replace function public.family_wish_claim(p_id uuid, p_on boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.family_my_fid(); w public.family_wishes; c uuid;
begin
  select * into w from public.family_wishes where id = p_id and family_id = fid;
  if not found then raise exception 'not_found'; end if;
  if w.owner = auth.uid() then raise exception 'not_allowed'; end if;
  if p_on then
    select claimer into c from public.family_wish_claims where wish_id = p_id;
    if c is not null and c <> auth.uid() then raise exception 'already_claimed'; end if;
    insert into public.family_wish_claims(wish_id, family_id, claimer) values (p_id, fid, auth.uid()) on conflict (wish_id) do nothing;
  else
    delete from public.family_wish_claims where wish_id = p_id and claimer = auth.uid();
  end if;
  return true;
end $$;

revoke all on function public.family_wish_save(uuid, uuid, text, text, text), public.family_wish_delete(uuid), public.family_wish_claim(uuid, boolean) from public, anon;
grant execute on function public.family_wish_save(uuid, uuid, text, text, text), public.family_wish_delete(uuid), public.family_wish_claim(uuid, boolean) to authenticated;
