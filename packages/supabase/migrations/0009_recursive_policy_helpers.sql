-- 0009_recursive_policy_helpers.sql
-- Fix "stack depth limit exceeded" on authenticated discovery surfaces.
--
-- event_organizer_is_self() and branch_owner_is_self() were SECURITY INVOKER
-- while querying the very tables whose RLS policies call them
-- (events_select_owner -> event_organizer_is_self -> SELECT events -> ...).
-- Postgres re-applied RLS on each nested lookup until the stack ran out.
-- Anonymous visitors never hit the owner policies, which is why the breakage
-- only appeared for signed-in users.
--
-- Recreate all row-existence helpers as SECURITY DEFINER (mirroring 0007's
-- actor_is_admin) so policy checks bypass RLS internally and terminate.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'system_admin'
  );
$$;

create or replace function public.event_organizer_is_self(event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    join public.organizers o on o.id = e.organizer_id
    where e.id = event and o.owner_id = auth.uid()
  );
$$;

create or replace function public.branch_owner_is_self(branch uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.branches br
    join public.businesses b on b.id = br.business_id
    where br.id = branch and b.owner_id = auth.uid()
  );
$$;
