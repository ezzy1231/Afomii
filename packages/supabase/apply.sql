-- ============================================================
-- UrbanExplore Supabase schema (single-file apply)
-- Run this entire file in the Supabase SQL Editor (dashboard -> SQL).
-- Order: extensions/enums -> tables -> RLS -> profiles trigger -> RPCs -> seed
--
-- !! CANONICAL SOURCE: packages/supabase/migrations/0001..0007 !!
-- This single-file snapshot is NOT auto-generated yet and may lag behind the
-- numbered migrations. 0007_security_hardening.sql is currently NOT included
-- here — apply the numbered migrations (supabase db push or SQL editor, in
-- filename order) instead of relying on this file. Regenerate before use.
-- ============================================================


-- ---------------- 0001_extensions_enums.sql ----------------
-- 0001_extensions_enums.sql
-- Extensions and shared enums for the UrbanExplore Supabase schema.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

do $$
begin
  create type user_role as enum ('customer', 'food_business', 'event_organizer', 'system_admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type booking_mode as enum ('instant', 'request', 'closed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type reservation_status as enum ('pending', 'confirmed', 'rejected', 'cancelled', 'completed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type event_status as enum ('draft', 'published', 'cancelled', 'completed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type ticket_tier as enum ('standard', 'vip', 'early_bird', 'group');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type moderation_status as enum ('active', 'inactive', 'pending', 'rejected');
exception when duplicate_object then null;
end $$;


-- ---------------- 0002_core_tables.sql ----------------
-- 0002_core_tables.sql
-- Core product tables. Column names align with existing web app queries
-- (restaurants.cuisine/area_label/closing_label, events.starts_at/venue_name/price_label, etc.)
-- and feed the new camelCase UI shapes via the server query layer.

-- Profiles: one row per auth.users, provisioned automatically (see 0004).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'customer',
  full_name text,
  email text,
  phone text,
  city text,
  language text not null default 'en',
  country text not null default 'ET',
  dietary_preferences text[],
  allergies text[],
  gender text,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Partner account (restaurant business). owner_id links to auth.users.
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete set null,
  name text not null,
  email text,
  description text,
  logo_url text,
  cover_url text,
  is_verified boolean not null default false,
  status moderation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Organizer account.
create table if not exists public.organizers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete set null,
  name text not null,
  email text,
  description text,
  is_verified boolean not null default false,
  status moderation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Public restaurant listing (linked to a business).
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  cuisine text,
  category text,
  description text,
  city text,
  area_label text,
  closing_label text,
  logo_url text,
  cover_url text,
  is_verified boolean not null default false,
  opening_hours jsonb,
  rating numeric(2, 1) check (rating >= 0 and rating <= 5),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Physical branch of a business.
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  branch_name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  phone text,
  created_at timestamptz not null default now()
);

-- Booking configuration per branch.
create table if not exists public.booking_configs (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade unique,
  booking_mode booking_mode not null default 'instant',
  total_tables integer not null default 0,
  max_guest_per_table integer not null default 0,
  slot_duration_minutes integer not null default 60,
  advance_notice_hours integer not null default 0,
  cancellation_policy text,
  daily_capacity integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Menu items per branch.
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null default 0,
  category text not null default 'General',
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

-- Events.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizers (id) on delete cascade,
  title text not null,
  description text,
  category text,
  venue_name text,
  latitude double precision,
  longitude double precision,
  starts_at timestamptz,
  end_date_time timestamptz,
  price_label text,
  cover_image_url text,
  status event_status not null default 'published',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ticket tiers for an event.
create table if not exists public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  tier ticket_tier not null default 'standard',
  price numeric(10, 2) not null default 0,
  total_quantity integer not null default 0,
  remaining_quantity integer not null default 0,
  sales_start timestamptz,
  sales_end timestamptz,
  created_at timestamptz not null default now()
);

-- Temporary ticket holds (atomic inventory).
create table if not exists public.ticket_holds (
  id uuid primary key default gen_random_uuid(),
  ticket_type_id uuid not null references public.ticket_types (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  quantity integer not null default 1,
  expires_at timestamptz not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- Completed ticket purchases.
create table if not exists public.ticket_purchases (
  id uuid primary key default gen_random_uuid(),
  ticket_type_id uuid not null references public.ticket_types (id) on delete cascade,
  event_id uuid references public.events (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  quantity integer not null default 1,
  amount numeric(10, 2) not null default 0,
  currency text not null default 'ETB',
  payment_status payment_status not null default 'pending',
  qr_code text,
  attended boolean not null default false,
  created_at timestamptz not null default now()
);

-- Reservations.
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  reservation_date date not null,
  time_slot text,
  guest_count integer not null default 1,
  status reservation_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- Commercial: offers, promotions, subscriptions.
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id) on delete cascade,
  title text not null,
  description text,
  discount_type text,
  value numeric(10, 2),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references public.organizers (id) on delete cascade,
  business_id uuid references public.businesses (id) on delete cascade,
  title text not null,
  description text,
  placement text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  business_id uuid references public.businesses (id) on delete cascade,
  organizer_id uuid references public.organizers (id) on delete cascade,
  plan text not null default 'free',
  status moderation_status not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- Platform audit log.
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

-- Ride search logs.
create table if not exists public.ride_search_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  pickup text,
  destination text,
  distance_km numeric(10, 2),
  created_at timestamptz not null default now()
);

-- Indexes for common lookups.
create index if not exists idx_restaurants_business on public.restaurants (business_id);
create index if not exists idx_restaurants_active on public.restaurants (is_active);
create index if not exists idx_branches_business on public.branches (business_id);
create index if not exists idx_booking_configs_branch on public.booking_configs (branch_id);
create index if not exists idx_menu_items_branch on public.menu_items (branch_id);
create index if not exists idx_events_organizer on public.events (organizer_id);
create index if not exists idx_events_status on public.events (status, is_active);
create index if not exists idx_ticket_types_event on public.ticket_types (event_id);
create index if not exists idx_reservations_branch on public.reservations (branch_id);
create index if not exists idx_reservations_date_slot on public.reservations (branch_id, reservation_date, time_slot);
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_businesses_owner on public.businesses (owner_id);
create index if not exists idx_organizers_owner on public.organizers (owner_id);


-- ---------------- 0003_rls_policies.sql ----------------
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


-- ---------------- 0004_profiles_trigger.sql ----------------
-- 0004_profiles_trigger.sql
-- Automatically create exactly one public.profiles row for every new auth user,
-- carrying the role (and basic fields) from signup metadata. Runs as SECURITY
-- DEFINER so it can insert despite RLS on profiles.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email, phone, city, language, country)
  values (
    new.id,
    coalesce(
      (new.raw_user_meta_data ->> 'role')::public.user_role,
      'customer'
    ),
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'city',
    coalesce(new.raw_user_meta_data ->> 'language', 'en'),
    coalesce(new.raw_user_meta_data ->> 'country', 'ET')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------- 0005_rpcs.sql ----------------
-- 0005_rpcs.sql
-- Atomic operations to prevent oversell of reservation slots and ticket inventory.
-- These run as SECURITY DEFINER so they can enforce capacity independent of RLS.

-- Reserve a table atomically. Returns the new reservation id, or raises an
-- exception when the slot is full. A "slot" is capped at total_tables.
create or replace function public.reserve_table(
  p_branch_id uuid,
  p_reservation_date date,
  p_time_slot text,
  p_guest_count integer,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cap integer;
  v_booked integer;
  v_id uuid;
begin
  select total_tables into v_cap from public.booking_configs where branch_id = p_branch_id;
  if v_cap is null or v_cap <= 0 then
    -- No capacity configured: allow (owner must configure to enforce).
    v_cap := 2147483647;
  end if;

  select coalesce(sum(guest_count), 0) into v_booked
  from public.reservations
  where branch_id = p_branch_id
    and reservation_date = p_reservation_date
    and time_slot = p_time_slot
    and status in ('pending', 'confirmed');

  if v_booked + p_guest_count > v_cap then
    raise exception 'RESERVATION_SLOT_FULL' using errcode = 'P0001';
  end if;

  insert into public.reservations (branch_id, reservation_date, time_slot, guest_count, user_id, status)
  values (p_branch_id, p_reservation_date, p_time_slot, p_guest_count, p_user_id, 'pending')
  returning id into v_id;

  return v_id;
end;
$$;

-- Place a temporary ticket hold, decrementing remaining inventory atomically.
-- Returns the hold id. Raises when not enough inventory remains.
create or replace function public.hold_ticket(
  p_ticket_type_id uuid,
  p_quantity integer,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining integer;
  v_id uuid;
begin
  select remaining_quantity into v_remaining
  from public.ticket_types
  where id = p_ticket_type_id
  for update;

  if v_remaining is null or v_remaining < p_quantity then
    raise exception 'TICKET_INSUFFICIENT_INVENTORY' using errcode = 'P0002';
  end if;

  update public.ticket_types
  set remaining_quantity = remaining_quantity - p_quantity
  where id = p_ticket_type_id;

  insert into public.ticket_holds (ticket_type_id, user_id, quantity, expires_at, status)
  values (p_ticket_type_id, p_user_id, p_quantity, now() + interval '15 minutes', 'active')
  returning id into v_id;

  return v_id;
end;
$$;

-- Release expired holds back into inventory. Intended for a scheduled job/cron.
create or replace function public.release_expired_holds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with expired as (
    select h.id, h.ticket_type_id, h.quantity
    from public.ticket_holds h
    where h.status = 'active' and h.expires_at < now()
    for update skip locked
  )
  update public.ticket_types t
  set remaining_quantity = remaining_quantity + e.quantity
  from expired e
  where t.id = e.ticket_type_id;

  update public.ticket_holds
  set status = 'expired'
  where status = 'active' and expires_at < now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.reserve_table(uuid, date, text, integer, uuid) to authenticated, anon;
grant execute on function public.hold_ticket(uuid, integer, uuid) to authenticated, anon;
grant execute on function public.release_expired_holds() to authenticated;


-- ---------------- seed.sql ----------------
-- seed.sql
-- Idempotent development fixture matching the new UI sample data.
-- Safe to re-run: every row uses a fixed id with ON CONFLICT DO NOTHING.
-- Intended to be applied by a privileged role (postgres / service_role) which
-- bypasses RLS. Owner fields are NULL so seeded data stays separate from real
-- signed-in users' dashboards.

-- Business + restaurant (Sky Garden)
insert into public.businesses (id, owner_id, name, email, is_verified, status)
values ('11111111-1111-1111-1111-111111111111', null, 'Sky Garden', 'hello@skygarden.example', true, 'active')
on conflict (id) do nothing;

insert into public.restaurants (id, business_id, name, cuisine, category, city, area_label, closing_label, is_verified, opening_hours, rating, is_active)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Sky Garden',
  'Modern African',
  'Modern African',
  'Addis Ababa',
  'Bole',
  'Open until 11:00 PM',
  true,
  '{"mon":[{"open":"08:00","close":"23:00"}],"tue":[{"open":"08:00","close":"23:00"}],"wed":[{"open":"08:00","close":"23:00"}],"thu":[{"open":"08:00","close":"23:00"}],"fri":[{"open":"08:00","close":"23:00"}],"sat":[{"open":"08:00","close":"23:00"}],"sun":[{"open":"08:00","close":"23:00"}]}'::jsonb,
  4.7,
  true
)
on conflict (id) do nothing;

-- Branch + booking config
insert into public.branches (id, business_id, branch_name, address, latitude, longitude, phone)
values (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Bole',
  'Bole, Addis Ababa',
  9.0192,
  38.7525,
  '+251 11 000 0000'
)
on conflict (id) do nothing;

insert into public.booking_configs (branch_id, booking_mode, total_tables, max_guest_per_table, slot_duration_minutes, advance_notice_hours, cancellation_policy, daily_capacity)
values (
  '33333333-3333-3333-3333-333333333333',
  'instant',
  24,
  6,
  60,
  2,
  'Free cancellation up to 24 hours before.',
  144
)
on conflict (branch_id) do nothing;

-- Menu items
insert into public.menu_items (id, branch_id, name, description, price, category, is_available)
values
  ('a1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Doro Wat', 'Ethiopian chicken stew with injera', 350.00, 'Main', true),
  ('a2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Tibs', 'Sautéed beef with peppers and onions', 420.00, 'Main', true),
  ('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Shiro', 'Spiced chickpea purée', 280.00, 'Vegetarian', true),
  ('a4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Ethiopian Coffee', 'Traditional ceremonial coffee', 120.00, 'Drinks', true),
  ('a5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Habesha Platter', 'Mixed grill sharing plate', 680.00, 'Main', false)
on conflict (id) do nothing;

-- Organizer + event (Sunset Brunch Party)
insert into public.organizers (id, owner_id, name, email, is_verified, status)
values ('44444444-4444-4444-4444-444444444444', null, 'UrbanExplore Events', 'events@urbanexplore.com', true, 'active')
on conflict (id) do nothing;

insert into public.events (id, organizer_id, title, description, category, venue_name, latitude, longitude, starts_at, end_date_time, price_label, cover_image_url, status, is_active)
values (
  '55555555-5555-5555-5555-555555555555',
  '44444444-4444-4444-4444-444444444444',
  'Sunset Brunch Party',
  'A relaxed rooftop brunch with live music, great food, and city views.',
  'Food & Drink',
  'Sky Garden',
  9.0192,
  38.7525,
  '2026-05-25T16:00:00+03:00',
  '2026-05-25T21:00:00+03:00',
  'From ETB 200',
  null,
  'published',
  true
)
on conflict (id) do nothing;

-- Ticket tiers
insert into public.ticket_types (id, event_id, name, tier, price, total_quantity, remaining_quantity, sales_start, sales_end)
values
  ('b1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'General Admission', 'standard', 200.00, 200, 180, '2026-04-01T00:00:00+03:00', '2026-05-25T15:00:00+03:00'),
  ('b2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'VIP Table', 'vip', 600.00, 20, 18, '2026-04-01T00:00:00+03:00', '2026-05-25T15:00:00+03:00'),
  ('b3333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'Early Bird', 'early_bird', 150.00, 50, 0, '2026-04-01T00:00:00+03:00', '2026-04-15T00:00:00+03:00')
on conflict (id) do nothing;
