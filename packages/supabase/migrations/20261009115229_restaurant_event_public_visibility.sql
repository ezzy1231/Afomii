-- Public listings inherit the moderation and suspension state of their owner.
-- Keep these SECURITY DEFINER checks in a non-exposed schema: they return only
-- a public-visibility boolean and let public RLS policies inspect parent rows
-- without making business contact details or profile rows publicly readable.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.business_is_public(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.businesses b
    join public.profiles p on p.id = b.owner_id
    where b.id = p_business_id
      and b.status = 'active'::public.moderation_status
      and b.is_verified is true
      and p.is_suspended is false
  );
$$;

create or replace function private.organizer_is_public(p_organizer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organizers o
    join public.profiles p on p.id = o.owner_id
    where o.id = p_organizer_id
      and o.status = 'active'::public.moderation_status
      and o.is_verified is true
      and p.is_suspended is false
  );
$$;

revoke execute on function private.business_is_public(uuid) from public;
revoke execute on function private.organizer_is_public(uuid) from public;
grant execute on function private.business_is_public(uuid) to anon, authenticated;
grant execute on function private.organizer_is_public(uuid) to anon, authenticated;

drop policy if exists restaurants_select_anon on public.restaurants;
create policy restaurants_select_anon on public.restaurants
  for select to anon, authenticated
  using (is_active is true and (select private.business_is_public(business_id)));

drop policy if exists organizers_select on public.organizers;
create policy organizers_select on public.organizers
  for select to anon, authenticated
  using (
    owner_id = (select auth.uid())
    or (select public.is_admin())
    or (select private.organizer_is_public(id))
  );

drop policy if exists events_select_anon on public.events;
create policy events_select_anon on public.events
  for select to anon, authenticated
  using (
    status = 'published'
    and is_active is true
    and (select private.organizer_is_public(organizer_id))
  );
