-- seed-places.sql
-- Real Addis Ababa restaurant listings (names/ratings from public directories)
-- for development/demo data. Images are self-hosted in /places/.
-- Idempotent: re-running replaces previous seed:* businesses only.
-- Run in the Supabase SQL editor.

delete from public.businesses where name like 'seed:%';

-- 1. Yod Abyssinia Traditional Restaurant (4.5, 1461 reviews)
with b as (
  insert into public.businesses (name, description, is_verified, status)
  values ('seed:yod-abyssinia', 'Yod Abyssinia — traditional Ethiopian cuisine with live music and dance.', true, 'active')
  returning id
)
insert into public.restaurants (business_id, name, cuisine, category, description, city, area_label, closing_label, cover_url, is_verified, is_active, rating)
select id, 'Yod Abyssinia Traditional Restaurant', 'Ethiopian Traditional', 'Restaurant',
       'Legendary traditional restaurant serving classic Ethiopian dishes with live music and dance performances nightly.',
       'Addis Ababa', 'Bole', 'Open daily 11:00 AM – 11:00 PM', '/places/food-1.jpg', true, true, 4.5
from b;

-- 2. Kategna Restaurant Bole Millennium (Ethiopian, cultural shows)
with b as (
  insert into public.businesses (name, description, is_verified, status)
  values ('seed:kategna-bole', 'Kategna — injera-based Ethiopian dishes paired with cultural shows.', true, 'active')
  returning id
)
insert into public.restaurants (business_id, name, cuisine, category, description, city, area_label, closing_label, cover_url, is_verified, is_active, rating)
select id, 'Kategna Restaurant', 'Ethiopian', 'Restaurant',
       'Injera-based dishes and combo platters paired with evening cultural shows. A local favorite in Bole.',
       'Addis Ababa', 'Bole Millennium', 'Open daily 10:00 AM – 10:30 PM', '/places/food-1.jpg', true, true, 4.4
from b;

-- 3. 2000 Habesha Cultural Restaurant
with b as (
  insert into public.businesses (name, description, is_verified, status)
  values ('seed:2000-habesha', '2000 Habesha — traditional meals with evening performances.', true, 'active')
  returning id
)
insert into public.restaurants (business_id, name, cuisine, category, description, city, area_label, closing_label, cover_url, is_verified, is_active, rating)
select id, '2000 Habesha Cultural Restaurant', 'Ethiopian Traditional', 'Restaurant',
       'Traditional Habesha dining with a full cultural performance every evening — coffee ceremony included.',
       'Addis Ababa', 'Bole', 'Open daily 11:00 AM – 11:00 PM', '/places/food-2.jpg', true, true, 4.4
from b;

-- 4. KAZ Sushi & Japanese Fusion
with b as (
  insert into public.businesses (name, description, is_verified, status)
  values ('seed:kaz-sushi', 'KAZ Sushi — the best Japanese restaurant in Addis Ababa.', true, 'active')
  returning id
)
insert into public.restaurants (business_id, name, cuisine, category, description, city, area_label, closing_label, cover_url, is_verified, is_active, rating)
select id, 'KAZ Sushi & Japanese Fusion', 'Japanese', 'Restaurant',
       'Addis Ababa''s top Japanese restaurant — exceptional sushi, vibrant ambiance and welcoming service.',
       'Addis Ababa', 'Bole', 'Open daily 12:00 PM – 10:00 PM', '/places/food-3.jpg', true, true, 4.6
from b;

-- 5. Cravings Restaurant & Bar (4.7, ~2.3k reviews)
with b as (
  insert into public.businesses (name, description, is_verified, status)
  values ('seed:cravings', 'Cravings — diverse menu, luxurious ambiance, gourmet offerings.', true, 'active')
  returning id
)
insert into public.restaurants (business_id, name, cuisine, category, description, city, area_label, closing_label, cover_url, is_verified, is_active, rating)
select id, 'Cravings Restaurant & Bar', 'International', 'Restaurant',
       'Fine dining with a diverse gourmet menu, curated wine and cocktail list, and an elegant ambiance.',
       'Addis Ababa', 'Bole', 'Open daily 8:00 AM – 11:00 PM', '/places/food-3.jpg', true, true, 4.7
from b;

-- 6. Sanaa Restaurant
with b as (
  insert into public.businesses (name, description, is_verified, status)
  values ('seed:sanaa', 'Sanaa — elegant fine dining and culinary artistry.', true, 'active')
  returning id
)
insert into public.restaurants (business_id, name, cuisine, category, description, city, area_label, closing_label, cover_url, is_verified, is_active, rating)
select id, 'Sanaa Restaurant', 'International', 'Restaurant',
       'Elegant dining experience with a focus on hospitality and culinary artistry.',
       'Addis Ababa', 'Kazanchis', 'Open daily 11:00 AM – 10:00 PM', '/places/food-3.jpg', true, true, 4.5
from b;

-- 7. Golden Plate Restaurant (4.6, 458 reviews)
with b as (
  insert into public.businesses (name, description, is_verified, status)
  values ('seed:golden-plate', 'Golden Plate — European and fusion fine dining.', true, 'active')
  returning id
)
insert into public.restaurants (business_id, name, cuisine, category, description, city, area_label, closing_label, cover_url, is_verified, is_active, rating)
select id, 'Golden Plate Restaurant', 'European', 'Restaurant',
       'White-tablecloth fine dining with European and fusion cuisine, multi-course menus and impeccable service.',
       'Addis Ababa', 'Bole', 'Open daily 11:00 AM – 10:00 PM', '/places/food-3.jpg', true, true, 4.6
from b;

-- 8. Marcus Addis Restaurant & Sky Bar (4.2, 434 reviews)
with b as (
  insert into public.businesses (name, description, is_verified, status)
  values ('seed:marcus-addis', 'Marcus Addis — rooftop fine dining with skyline views.', true, 'active')
  returning id
)
insert into public.restaurants (business_id, name, cuisine, category, description, city, area_label, closing_label, cover_url, is_verified, is_active, rating)
select id, 'Marcus Addis Restaurant & Sky Bar', 'International', 'Restaurant',
       'Rooftop fine dining combining skyline views with elegant meals and a curated wine list.',
       'Addis Ababa', 'Bole', 'Open daily 5:00 PM – 12:00 AM', '/places/food-3.jpg', true, true, 4.2
from b;

-- 9. Castelli's Restaurant (3.9, 209 reviews) — Piazza institution
with b as (
  insert into public.businesses (name, description, is_verified, status)
  values ('seed:castellis', 'Castelli''s — classic Italian fine dining, a legacy name in Addis Ababa.', true, 'active')
  returning id
)
insert into public.restaurants (business_id, name, cuisine, category, description, city, area_label, closing_label, cover_url, is_verified, is_active, rating)
select id, 'Castelli''s Restaurant', 'Italian', 'Restaurant',
       'A legacy name in Addis Ababa — classic Italian fine dining with vintage furnishings and old-world charm since 1948.',
       'Addis Ababa', 'Piassa', 'Open daily 12:00 PM – 9:30 PM', '/places/food-3.jpg', true, true, 3.9
from b;

-- 10. HOTTO (4.6, 207 reviews)
with b as (
  insert into public.businesses (name, description, is_verified, status)
  values ('seed:hotto', 'HOTTO — Japanese fine dining and high-end sushi.', true, 'active')
  returning id
)
insert into public.restaurants (business_id, name, cuisine, category, description, city, area_label, closing_label, cover_url, is_verified, is_active, rating)
select id, 'HOTTO', 'Japanese', 'Restaurant',
       'Japanese fine dining — quiet elegance, high-end sushi, upscale minimalist decor.',
       'Addis Ababa', 'Bole', 'Open daily 12:00 PM – 10:00 PM', '/places/food-3.jpg', true, true, 4.6
from b;

-- 11. Aladdin Restaurant
with b as (
  insert into public.businesses (name, description, is_verified, status)
  values ('seed:aladdin', 'Aladdin — refined Middle Eastern dining, a hidden gem.', true, 'active')
  returning id
)
insert into public.restaurants (business_id, name, cuisine, category, description, city, area_label, closing_label, cover_url, is_verified, is_active, rating)
select id, 'Aladdin Restaurant', 'Middle Eastern', 'Restaurant',
       'Refined Middle Eastern dining — aromatic spices, detailed service, perfect for romantic nights.',
       'Addis Ababa', 'Bole', 'Open daily 11:00 AM – 10:30 PM', '/places/food-1.jpg', true, true, 4.3
from b;

-- 12. Romina Restaurant
with b as (
  insert into public.businesses (name, description, is_verified, status)
  values ('seed:romina', 'Romina — beloved local dining in Addis Ababa.', true, 'active')
  returning id
)
insert into public.restaurants (business_id, name, cuisine, category, description, city, area_label, closing_label, cover_url, is_verified, is_active, rating)
select id, 'Romina Restaurant', 'Ethiopian', 'Restaurant',
       'Beloved local restaurant serving generous Ethiopian platters and grilled specialties.',
       'Addis Ababa', 'Bole', 'Open daily 10:00 AM – 10:00 PM', '/places/food-1.jpg', true, true, 4.3
from b;

-- Branches + booking configs for every seeded restaurant
insert into public.branches (business_id, branch_name, address, phone)
select r.business_id, r.name || ' — ' || coalesce(r.area_label, 'Addis Ababa'),
       coalesce(r.area_label, 'Addis Ababa') || ', Addis Ababa', null
from public.restaurants r
join public.businesses b on b.id = r.business_id
where b.name like 'seed:%'
  and not exists (
    select 1 from public.branches br where br.business_id = r.business_id
  );

insert into public.booking_configs (branch_id, booking_mode, total_tables, max_guest_per_table, slot_duration_minutes, advance_notice_hours, daily_capacity)
select br.id, 'instant', 8, 6, 60, 0, 40
from public.branches br
join public.businesses b on b.id = br.business_id
where b.name like 'seed:%'
  and not exists (
    select 1 from public.booking_configs bc where bc.branch_id = br.id
  );
