-- Branch lifecycle: a partner can pause a location without deleting it, so a
-- seasonal closure or a renovation does not cost them the menu and settings
-- they already built for that site.
--
-- `is_active` is a console-side flag only. It is NOT folded into the public
-- `branches_select` policy, because that policy is `using (true)` and the
-- partner console reads branches through the same authenticated channel —
-- hiding inactive rows there would hide the very rows a partner needs in order
-- to reactivate them. Public surfaces filter explicitly instead
-- (lib/supabase/queries.ts -> getRestaurantDetail).

alter table public.branches
  add column if not exists is_active boolean not null default true;

create index if not exists idx_branches_listing_active
  on public.branches (restaurant_id, is_active);

-- Paused locations drop out of capacity accounting: a walk-in-only or paused
-- branch must not appear as reservable on the public listing.
comment on column public.branches.is_active is
  'false pauses the location: hidden from public listings and not reservable, while remaining editable in the partner console.';