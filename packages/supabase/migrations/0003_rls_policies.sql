-- 0003_rls_policies.sql
-- Row Level Security + grants. Anonymous users may only read published public
-- data; authenticated users act on their own rows; system admins have broad read.

-- Helper: is the current user a system admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'system_admin'
  );
$$;

-- Helper: does the current user own the business that owns this branch?
create or replace function public.branch_owner_is_self(branch uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.branches br
    join public.businesses b on b.id = br.business_id
    where br.id = branch and b.owner_id = auth.uid()
  );
$$;

-- Helper: does the current user own the organizer of this event?
create or replace function public.event_organizer_is_self(event uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    join public.organizers o on o.id = e.organizer_id
    where e.id = event and o.owner_id = auth.uid()
  );
$$;

-- Profiles
alter table public.profiles enable row level security;
create policy profiles_select on public.profiles
  for select to authenticated
  using (true);
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

-- Businesses
alter table public.businesses enable row level security;
create policy businesses_select on public.businesses
  for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());
create policy businesses_insert on public.businesses
  for insert to authenticated
  with check (owner_id = auth.uid());
create policy businesses_update on public.businesses
  for update to authenticated
  using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy businesses_delete on public.businesses
  for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- Organizers
alter table public.organizers enable row level security;
create policy organizers_select on public.organizers
  for select to anon, authenticated
  using (is_verified = true or owner_id = auth.uid() or public.is_admin());
create policy organizers_insert on public.organizers
  for insert to authenticated
  with check (owner_id = auth.uid());
create policy organizers_update on public.organizers
  for update to authenticated
  using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy organizers_delete on public.organizers
  for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- Restaurants (public catalogue)
alter table public.restaurants enable row level security;
create policy restaurants_select_anon on public.restaurants
  for select to anon, authenticated
  using (is_active = true);
create policy restaurants_select_owner on public.restaurants
  for select to authenticated
  using (exists (select 1 from public.businesses b where b.id = restaurants.business_id and b.owner_id = auth.uid()) or public.is_admin());
create policy restaurants_insert on public.restaurants
  for insert to authenticated
  with check (exists (select 1 from public.businesses b where b.id = restaurants.business_id and b.owner_id = auth.uid()));
create policy restaurants_update on public.restaurants
  for update to authenticated
  using (exists (select 1 from public.businesses b where b.id = restaurants.business_id and b.owner_id = auth.uid()) or public.is_admin())
  with check (exists (select 1 from public.businesses b where b.id = restaurants.business_id and b.owner_id = auth.uid()) or public.is_admin());
create policy restaurants_delete on public.restaurants
  for delete to authenticated
  using (exists (select 1 from public.businesses b where b.id = restaurants.business_id and b.owner_id = auth.uid()) or public.is_admin());

-- Branches (public addresses)
alter table public.branches enable row level security;
create policy branches_select on public.branches
  for select to anon, authenticated
  using (true);
create policy branches_insert on public.branches
  for insert to authenticated
  with check (public.branch_owner_is_self(business_id) or exists (select 1 from public.businesses b where b.id = branches.business_id and b.owner_id = auth.uid()));
create policy branches_update on public.branches
  for update to authenticated
  using (public.branch_owner_is_self(id) or exists (select 1 from public.businesses b where b.id = branches.business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.businesses b where b.id = branches.business_id and b.owner_id = auth.uid()));
create policy branches_delete on public.branches
  for delete to authenticated
  using (exists (select 1 from public.businesses b where b.id = branches.business_id and b.owner_id = auth.uid()));

-- Booking configs (public read)
alter table public.booking_configs enable row level security;
create policy booking_configs_select on public.booking_configs
  for select to anon, authenticated
  using (true);
create policy booking_configs_write on public.booking_configs
  for all to authenticated
  using (public.branch_owner_is_self(branch_id))
  with check (public.branch_owner_is_self(branch_id));

-- Menu items (public read of available)
alter table public.menu_items enable row level security;
create policy menu_items_select on public.menu_items
  for select to anon, authenticated
  using (is_available = true);
create policy menu_items_select_owner on public.menu_items
  for select to authenticated
  using (true);
create policy menu_items_write on public.menu_items
  for all to authenticated
  using (public.branch_owner_is_self(branch_id))
  with check (public.branch_owner_is_self(branch_id));

-- Events (public catalogue)
alter table public.events enable row level security;
create policy events_select_anon on public.events
  for select to anon, authenticated
  using (status = 'published' and is_active = true);
create policy events_select_owner on public.events
  for select to authenticated
  using (public.event_organizer_is_self(id) or public.is_admin());
create policy events_insert on public.events
  for insert to authenticated
  with check (public.event_organizer_is_self(id));
create policy events_update on public.events
  for update to authenticated
  using (public.event_organizer_is_self(id) or public.is_admin())
  with check (public.event_organizer_is_self(id) or public.is_admin());
create policy events_delete on public.events
  for delete to authenticated
  using (public.event_organizer_is_self(id) or public.is_admin());

-- Ticket types (public read)
alter table public.ticket_types enable row level security;
create policy ticket_types_select on public.ticket_types
  for select to anon, authenticated
  using (true);
create policy ticket_types_write on public.ticket_types
  for all to authenticated
  using (public.event_organizer_is_self(event_id))
  with check (public.event_organizer_is_self(event_id));

-- Ticket holds
alter table public.ticket_holds enable row level security;
create policy ticket_holds_select on public.ticket_holds
  for select to authenticated
  using (user_id = auth.uid());
create policy ticket_holds_write on public.ticket_holds
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Ticket purchases
alter table public.ticket_purchases enable row level security;
create policy ticket_purchases_select on public.ticket_purchases
  for select to authenticated
  using (user_id = auth.uid() or public.event_organizer_is_self(event_id) or public.is_admin());
create policy ticket_purchases_insert on public.ticket_purchases
  for insert to authenticated
  with check (user_id = auth.uid());

-- Reservations
alter table public.reservations enable row level security;
create policy reservations_select on public.reservations
  for select to authenticated
  using (user_id = auth.uid() or public.branch_owner_is_self(branch_id) or public.is_admin());
create policy reservations_insert on public.reservations
  for insert to authenticated
  with check (user_id = auth.uid());
create policy reservations_update on public.reservations
  for update to authenticated
  using (user_id = auth.uid() or public.branch_owner_is_self(branch_id) or public.is_admin())
  with check (user_id = auth.uid() or public.branch_owner_is_self(branch_id) or public.is_admin());
create policy reservations_delete on public.reservations
  for delete to authenticated
  using (public.branch_owner_is_self(branch_id) or public.is_admin());

-- Offers
alter table public.offers enable row level security;
create policy offers_select on public.offers
  for select to anon, authenticated
  using (is_active = true or exists (select 1 from public.businesses b where b.id = offers.business_id and b.owner_id = auth.uid()) or public.is_admin());
create policy offers_write on public.offers
  for all to authenticated
  using (exists (select 1 from public.businesses b where b.id = offers.business_id and b.owner_id = auth.uid()) or public.is_admin())
  with check (exists (select 1 from public.businesses b where b.id = offers.business_id and b.owner_id = auth.uid()) or public.is_admin());

-- Promotions
alter table public.promotions enable row level security;
create policy promotions_select on public.promotions
  for select to anon, authenticated
  using (is_active = true or public.is_admin());
create policy promotions_write on public.promotions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Subscriptions
alter table public.subscriptions enable row level security;
create policy subscriptions_select on public.subscriptions
  for select to authenticated
  using (user_id = auth.uid() or business_id in (select id from public.businesses where owner_id = auth.uid()) or organizer_id in (select id from public.organizers where owner_id = auth.uid()) or public.is_admin());
create policy subscriptions_write on public.subscriptions
  for all to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Audit logs (admin only)
alter table public.audit_logs enable row level security;
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (public.is_admin());

-- Ride search logs
alter table public.ride_search_logs enable row level security;
create policy ride_search_logs_select on public.ride_search_logs
  for select to authenticated
  using (user_id = auth.uid());
create policy ride_search_logs_insert on public.ride_search_logs
  for insert to authenticated
  with check (user_id = auth.uid());

-- Grants: API roles need table privileges for RLS to be evaluated.
grant usage on schema public to anon, authenticated;
grant select on public.restaurants, public.businesses, public.branches,
  public.booking_configs, public.menu_items, public.events, public.ticket_types,
  public.organizers to anon;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
