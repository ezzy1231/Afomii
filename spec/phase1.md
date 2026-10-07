# Phase 1: Database

## Skills to Use
- `supabase` — Schema design, RLS policies, RPCs, triggers
- `supabase-postgres-best-practices` — Query optimization, indexes, RLS, connection pooling
- `nextjs` — Server components, data fetching patterns

## Objective
Create the complete Supabase schema with RLS, RPCs, triggers, and seed data.

## Schema Overview

### Enums
```sql
CREATE TYPE user_role AS ENUM ('customer', 'food_business', 'event_organizer', 'system_admin');
CREATE TYPE booking_mode AS ENUM ('instant', 'request');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE ticket_tier AS ENUM ('general', 'early_bird', 'vip', 'group');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'refunded', 'failed');
CREATE TYPE moderation_status AS ENUM ('pending', 'active', 'rejected', 'inactive');
CREATE TYPE review_target_type AS ENUM ('restaurant', 'event', 'hotel', 'organizer', 'business');
CREATE TYPE follow_target_type AS ENUM ('restaurant', 'event', 'organizer', 'business');
```

### Tables (26 total)

#### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE,
  role user_role NOT NULL DEFAULT 'customer',
  full_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  country TEXT NOT NULL DEFAULT 'ET',
  dietary_preferences TEXT[],
  allergies TEXT[],
  gender TEXT,
  birth_date DATE,
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### businesses
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  email TEXT,
  description TEXT,
  category TEXT,
  logo_url TEXT,
  cover_url TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  website TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status moderation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### organizers
```sql
CREATE TABLE organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  email TEXT,
  description TEXT,
  category TEXT,
  logo_url TEXT,
  cover_url TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  website TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status moderation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### restaurants
```sql
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cuisine TEXT,
  category TEXT,
  description TEXT,
  city TEXT,
  area_label TEXT,
  closing_label TEXT,
  logo_url TEXT,
  cover_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  opening_hours JSONB,
  rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### branches
```sql
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  branch_name TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### booking_configs
```sql
CREATE TABLE booking_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE UNIQUE,
  booking_mode booking_mode NOT NULL DEFAULT 'instant',
  total_tables INTEGER NOT NULL DEFAULT 0,
  max_guest_per_table INTEGER NOT NULL DEFAULT 0,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
  advance_notice_hours INTEGER NOT NULL DEFAULT 0,
  cancellation_policy TEXT,
  daily_capacity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### menu_items
```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### events
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  venue_name TEXT,
  address TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  cover_image_url TEXT,
  status event_status NOT NULL DEFAULT 'draft',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### ticket_types
```sql
CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tier ticket_tier NOT NULL DEFAULT 'general',
  price NUMERIC(10,2) NOT NULL,
  quantity_total INTEGER NOT NULL,
  quantity_remaining INTEGER NOT NULL,
  sales_start TIMESTAMPTZ,
  sales_end TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### ticket_holds
```sql
CREATE TABLE ticket_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  held_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);
```

#### ticket_purchases
```sql
CREATE TABLE ticket_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### reservations
```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  time_slot TIME NOT NULL,
  guest_count INTEGER NOT NULL,
  status reservation_status NOT NULL DEFAULT 'pending',
  special_requests TEXT,
  confirmation_code TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### hotels
```sql
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
  address TEXT,
  city TEXT,
  area_label TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  phone TEXT,
  website TEXT,
  amenities TEXT[],
  photos TEXT[],
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### rooms
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type TEXT NOT NULL,
  description TEXT,
  max_guests INTEGER NOT NULL,
  bed_type TEXT,
  price_per_night NUMERIC(10,2) NOT NULL,
  amenities TEXT[],
  photos TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### hotel_bookings
```sql
CREATE TABLE hotel_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guest_count INTEGER NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  special_requests TEXT,
  confirmation_code TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### reviews
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type review_target_type NOT NULL,
  target_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  photos TEXT[],
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reviews_target ON reviews(target_type, target_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
```

#### payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('ticket', 'reservation', 'hotel', 'subscription')),
  entity_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ETB',
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_payment_id TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### waitlist
```sql
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  time_slot TIME NOT NULL,
  guest_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### follows
```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type follow_target_type NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);
```

#### loyalty_points
```sql
CREATE TABLE loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'bronze',
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

#### audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### ride_search_logs
```sql
CREATE TABLE ride_search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  dest_lat DOUBLE PRECISION,
  dest_lng DOUBLE PRECISION,
  distance_km DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### RPCs (Atomic Operations)

1. **reserve_table** — Atomically checks capacity and creates reservation
2. **hold_ticket** — Atomically decrements `quantity_remaining` and creates hold
3. **release_ticket_hold** — Restores inventory and marks hold as released
4. **complete_purchase** — Validates hold, creates purchase, generates QR code, creates Stripe payment intent
5. **release_expired_holds** — Batch release holds past `expires_at`
6. **admin_set_user_role** — SECURITY DEFINER role update
7. **get_consumer_plans** — UNION of reservations + tickets for My Plans
8. **create_review** — Create review with validation
9. **join_waitlist** — Add to waitlist with position
10. **create_hotel_booking** — Book hotel room with availability check

### Triggers

1. **reservation_notify** — Creates notification on reservation insert/status change
2. **ticket_purchase_notify** — Creates notification on ticket purchase
3. **review_aggregate** — Updates restaurant/event rating when review added

### RLS Policies

- All tables: ENABLE ROW LEVEL Security
- profiles: Users can read/update own row; admins can read all
- businesses/organizers: Owners can CRUD own; public can read active
- restaurants/branches/menu: Business owners can CRUD; public can read
- events/ticket_types: Organizers can CRUD own; public can read published
- ticket_purchases: Users can read own; organizers can read for their events
- reservations: Users can read own; business owners can read for their branches
- hotels/rooms: Business owners can CRUD; public can read
- hotel_bookings: Users can read own; business owners can read for their hotels
- reviews: Users can create/read; owners can read for their business; admins can moderate
- notifications: Users can read/update own only
- payments: Users can read own; admins can read all
- follows: Users can CRUD own
- loyalty_points: Users can read own; system can update
- audit_logs: Admins read-only
- waitlist: Users can read own; business owners can read for their branches

### Indexes

```sql
CREATE INDEX idx_profiles_clerk_user_id ON profiles(clerk_user_id);
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX idx_organizers_owner_id ON organizers(owner_id);
CREATE INDEX idx_restaurants_business_id ON restaurants(business_id);
CREATE INDEX idx_branches_business_id ON branches(business_id);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_ticket_types_event_id ON ticket_types(event_id);
CREATE INDEX idx_ticket_purchases_user_id ON ticket_purchases(user_id);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_branch_id ON reservations(branch_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_reviews_target ON reviews(target_type, target_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_follows_user_id ON follows(user_id);
CREATE INDEX idx_hotels_business_id ON hotels(business_id);
CREATE INDEX idx_rooms_hotel_id ON rooms(hotel_id);
CREATE INDEX idx_hotel_bookings_user_id ON hotel_bookings(user_id);
CREATE INDEX idx_waitlist_branch_id ON waitlist(branch_id);
```

## Verification Gate

- [ ] All migrations apply cleanly in order
- [ ] RLS enabled on all tables
- [ ] RPCs execute correctly (test each one)
- [ ] Triggers fire on expected events
- [ ] Seed data loads without errors
- [ ] `npm run supabase:check` passes
