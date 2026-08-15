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
