-- 0010_fix_insert_policies.sql
-- INSERT policies must validate ownership against the NEW row's parent FK —
-- never via a helper that SELECTs this table for that id (the row does not
-- exist yet, so the check always failed and inserts were silently impossible).

-- Events: organizers may insert events owned by their own organizer profile.
drop policy if exists events_insert on public.events;
create policy events_insert on public.events
  for insert to authenticated
  with check (
    exists (
      select 1 from public.organizers o
      where o.id = organizer_id and o.owner_id = auth.uid()
    )
    or public.is_admin()
  );

-- Ticket types: same treatment. UPDATE/DELETE keep using the row-lookup
-- helper because those rows already exist.
drop policy if exists ticket_types_write on public.ticket_types;
create policy ticket_types_insert on public.ticket_types
  for insert to authenticated
  with check (
    exists (
      select 1 from public.events e
      join public.organizers o on o.id = e.organizer_id
      where e.id = event_id and o.owner_id = auth.uid()
    )
    or public.is_admin()
  );

create policy ticket_types_update on public.ticket_types
  for update to authenticated
  using (public.event_organizer_is_self(event_id) or public.is_admin())
  with check (public.event_organizer_is_self(event_id) or public.is_admin());

create policy ticket_types_delete on public.ticket_types
  for delete to authenticated
  using (public.event_organizer_is_self(event_id) or public.is_admin());
