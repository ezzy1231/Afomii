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
