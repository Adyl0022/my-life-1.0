-- My Life 1.0 — private photo storage for ONE account only. Run once in Supabase > SQL Editor.
-- Photos of Documents, Personal Collection, Subscriptions and My Accounts go to this bucket, in a folder named after the user id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('my-photos', 'my-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "my-photos read" on storage.objects;
drop policy if exists "my-photos insert" on storage.objects;
drop policy if exists "my-photos update" on storage.objects;
drop policy if exists "my-photos delete" on storage.objects;

create policy "my-photos read" on storage.objects for select to authenticated
  using (bucket_id = 'my-photos' and lower(auth.jwt() ->> 'email') = 'adlisyahmi324@gmail.com' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "my-photos insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'my-photos' and lower(auth.jwt() ->> 'email') = 'adlisyahmi324@gmail.com' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "my-photos update" on storage.objects for update to authenticated
  using (bucket_id = 'my-photos' and lower(auth.jwt() ->> 'email') = 'adlisyahmi324@gmail.com' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'my-photos' and lower(auth.jwt() ->> 'email') = 'adlisyahmi324@gmail.com' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "my-photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'my-photos' and lower(auth.jwt() ->> 'email') = 'adlisyahmi324@gmail.com' and (storage.foldername(name))[1] = auth.uid()::text);
