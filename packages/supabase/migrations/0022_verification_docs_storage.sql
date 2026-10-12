-- 0022_verification_docs_storage.sql
-- Private bucket for the documents a partner submits to prove legitimacy
-- (business licence, registration certificate, ID).
--
-- NOT the `banners` bucket: that one is public and image-only, so a licence
-- PDF dropped there would be world-readable and be rejected by the bucket's
-- mime allowlist. This bucket is private and served to admins through short
-- lived signed URLs, so a licence is never reachable by guessing a path and
-- stops being reachable once the URL expires.
--
-- Layout: verification-docs/<user-id>/<timestamp>-<slug>.<ext>
-- Owner policies key off the first path segment, matching 0011.

insert into storage.buckets (id, name, public)
values ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
where id = 'verification-docs';

-- The owner who uploaded a document may read it back (to preview what they
-- submitted). No anon policy: these objects are not public by construction.
drop policy if exists "verification_docs_owner_read" on storage.objects;
create policy "verification_docs_owner_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "verification_docs_owner_insert" on storage.objects;
create policy "verification_docs_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "verification_docs_owner_delete" on storage.objects;
create policy "verification_docs_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins read every document in order to review it. This is the policy that
-- makes the workflow possible at all; it is scoped to admins rather than to
-- public because a licence is personal data.
drop policy if exists "verification_docs_admin_read" on storage.objects;
create policy "verification_docs_admin_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'verification-docs'
    and (select public.is_admin())
  );