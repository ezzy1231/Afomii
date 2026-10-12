-- 0020_event_insert_ownership_policy.sql
-- Make INSERT ... RETURNING work for events the organizer is not yet public.
--
-- The symptom: creating an event returned
--   42501 new row violates row-level security policy for table "events"
-- for every draft, and for every organizer awaiting verification, while
-- `insert into events ...` (no RETURNING) succeeded and the row landed.
--
-- Why. `events_insert`'s WITH CHECK is fine — it resolves ownership from the
-- new row's own `organizer_id`. But Postgres also runs the table's SELECT
-- policies against rows coming out of a RETURNING clause, and
-- events_select_owner answered that question by looking the row up again:
--
--   using (public.event_organizer_is_self(id) or public.is_admin())
--   -> select 1 from public.events e where e.id = <the row being inserted>
--
-- That lookup runs against the statement's snapshot, which was taken before
-- the INSERT, so it cannot see the row being created. The owner policy
-- therefore never matches, and Postgres reports it with the same "new row
-- violates row-level security policy" message — which reads like the INSERT
-- check failed when it did not.
--
-- Only events that ALSO satisfied events_select_anon got through, which is
-- why a published event on a verified organizer worked and nothing else did.
--
-- Express ownership on the row itself, exactly as events_insert already does.
-- The helper stays in place for ticket_types_update / ticket_types_delete /
-- events_update / events_delete, where the row is already visible in the
-- snapshot.
--
-- Also re-asserts is_admin() as SECURITY DEFINER (0009). On this project it
-- had drifted back to SECURITY INVOKER, so the check ran under the caller's
-- RLS instead of the function owner's.

drop policy if exists events_select_owner on public.events;
create policy events_select_owner on public.events
  for select to authenticated
  using (
    exists (
      select 1 from public.organizers o
      where o.id = organizer_id and o.owner_id = auth.uid()
    )
    or public.is_admin()
  );

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