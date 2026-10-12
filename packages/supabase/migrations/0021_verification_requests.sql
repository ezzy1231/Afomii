-- 0021_verification_requests.sql
-- A partner (restaurant business or event organizer) asks to be verified; an
-- admin confirms or declines. Until now the only path was an admin spotting a
-- `status = 'pending'` row in a list, and because ensureBusiness /
-- ensureOrganizer insert neither `status` nor `is_verified`, every new partner
-- sat on the pending/unverified defaults with nothing to nudge them and no way
-- to ask. Their listings stayed invisible on the public catalogue the whole
-- time (private.business_is_public / private.organizer_is_public both require
-- status = 'active' and is_verified = true).
--
-- `entity_type` + `entity_id` is a soft reference on purpose: one queue serves
-- two tables. A trigger would keep it honest; the insert policy below is the
-- enforcement point that matters, because it only lets the owner of the
-- referenced record submit.

do $$
begin
  create type verification_request_status as enum
    ('pending', 'in_review', 'approved', 'rejected', 'needs_info');
exception when duplicate_object then null;
end $$;

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('business', 'organizer')),
  entity_id uuid not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  status verification_request_status not null default 'pending',

  -- What the partner claims, snapshotted at submission. Kept apart from the
  -- live profile columns on purpose: an admin reviews what was claimed, and a
  -- later profile edit must not rewrite the history of a decision.
  legal_name text not null,
  registration_number text,
  tax_id text,
  phone text,
  address text,
  city text,
  website text,
  note text,

  -- [{ label, path, content_type, size_bytes }]. `path` is a storage object
  -- path in the private verification-docs bucket, never a public URL.
  documents jsonb not null default '[]'::jsonb,

  reviewer_id uuid references auth.users (id) on delete set null,
  reviewer_note text,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint verification_requests_documents_is_array
    check (jsonb_typeof(documents) = 'array')
);

create index if not exists idx_verification_requests_owner
  on public.verification_requests (owner_id, submitted_at desc);

create index if not exists idx_verification_requests_entity
  on public.verification_requests (entity_type, entity_id);

-- The admin queue reads exactly these, oldest first so nothing starves.
create index if not exists idx_verification_requests_queue
  on public.verification_requests (submitted_at)
  where status in ('pending', 'in_review', 'needs_info');

-- One live request per partner. Rejected and approved rows stay as history, so
-- the next attempt is a new row rather than an overwrite.
create unique index if not exists ux_verification_requests_open
  on public.verification_requests (entity_type, entity_id)
  where status in ('pending', 'in_review', 'needs_info');

-- ── Row level security ────────────────────────────────────────────────
alter table public.verification_requests enable row level security;

drop policy if exists verification_requests_select on public.verification_requests;
create policy verification_requests_select on public.verification_requests
  for select to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()));

-- A partner may only submit against a record they actually own. Without the
-- two EXISTS branches this would let any signed-in user file a request against
-- somebody else's business and put it in the admin queue.
drop policy if exists verification_requests_insert on public.verification_requests;
create policy verification_requests_insert on public.verification_requests
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (
      (
        entity_type = 'business'
        and exists (
          select 1 from public.businesses b
          where b.id = entity_id and b.owner_id = (select auth.uid())
        )
      )
      or (
        entity_type = 'organizer'
        and exists (
          select 1 from public.organizers o
          where o.id = entity_id and o.owner_id = (select auth.uid())
        )
      )
    )
  );

-- Partners may correct a submission while it is still open, but never touch a
-- reviewed one, and never set their own reviewer fields: `reviewer_id` and
-- `status` are pinned by the admin policy below.
drop policy if exists verification_requests_update on public.verification_requests;
create policy verification_requests_update on public.verification_requests
  for update to authenticated
  using (
    owner_id = (select auth.uid())
    and status in ('pending', 'needs_info')
  )
  with check (
    owner_id = (select auth.uid())
    and status in ('pending', 'needs_info')
  );

-- Withdraw a submission you have not actioned yet.
drop policy if exists verification_requests_delete on public.verification_requests;
create policy verification_requests_delete on public.verification_requests
  for delete to authenticated
  using (owner_id = (select auth.uid()) and status = 'pending');

drop policy if exists verification_requests_admin_update on public.verification_requests;
create policy verification_requests_admin_update on public.verification_requests
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 0003 granted on all tables *existing at that time*, so a new table needs its
-- own grant or every query fails with "permission denied".
grant select, insert, update, delete on public.verification_requests to authenticated;

-- ── Partner notification on every decision ─────────────────────────────
-- Mirrors the trigger-driven pattern from 0014. There is no INSERT policy on
-- public.notifications, so this (or a SECURITY DEFINER rpc) is the only way a
-- notification reaches a partner.
create or replace function public.on_verification_request_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  perform public.create_notification(
    new.owner_id,
    case new.status
      when 'approved' then 'verification_approved'
      when 'rejected' then 'verification_rejected'
      when 'needs_info' then 'verification_needs_info'
      when 'in_review' then 'verification_in_review'
      else 'verification_updated'
    end,
    case new.status
      when 'approved' then 'Account verified'
      when 'rejected' then 'Verification declined'
      when 'needs_info' then 'More information needed'
      when 'in_review' then 'Verification under review'
      else 'Verification update'
    end,
    coalesce(
      nullif(btrim(new.reviewer_note), ''),
      case new.status
        when 'approved' then 'Your listings are now visible on UrbanExplore.'
        when 'rejected' then 'Your verification request was declined.'
        else 'Your verification request was updated.'
      end
    ),
    new.entity_type,
    new.entity_id
  );

  return new;
end;
$$;

revoke execute on function public.on_verification_request_changed() from public, anon, authenticated;

drop trigger if exists trg_verification_request_changed on public.verification_requests;
create trigger trg_verification_request_changed
  after update of status on public.verification_requests
  for each row
  execute function public.on_verification_request_changed();