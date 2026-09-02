-- 0011_banner_storage.sql
-- Public Supabase Storage bucket for listing banners + storage RLS policies.
--
-- Apply this in the Supabase SQL editor (Dashboard -> SQL -> New query) or via
-- `supabase db push`. Without it, banner uploads fail with "bucket not found".
--
-- Layout: banners/<user-id>/<timestamp>-<slug>.<ext>
-- The owner-folder policy below keys off the first path segment, so every
-- upload is scoped to the authenticated user that uploaded it.

-- 1) Create the public bucket (idempotent).
insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

-- 2) Enforce a 5 MB cap and image-only mime types at the bucket level.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'banners';

-- 3) Storage object policies (storage.objects ships with RLS enabled).
--    Public read: banner URLs are public and used by anon visitors.
drop policy if exists "banners_public_read" on storage.objects;
create policy "banners_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'banners');

-- Authenticated users may upload into their own folder only.
drop policy if exists "banners_owner_insert" on storage.objects;
create policy "banners_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "banners_owner_update" on storage.objects;
create policy "banners_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "banners_owner_delete" on storage.objects;
create policy "banners_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
