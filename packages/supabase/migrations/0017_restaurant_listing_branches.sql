-- Scope restaurant branches to one listing. Menu items remain branch-specific,
-- so each listing and location can keep its own menu.

alter table public.branches
  add column if not exists restaurant_id uuid;

-- The composite key makes it impossible to attach a business's branch to a
-- listing owned by a different business.
create unique index if not exists restaurants_business_id_id_uidx
  on public.restaurants (business_id, id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'branches_business_restaurant_fkey'
      and conrelid = 'public.branches'::regclass
  ) then
    alter table public.branches
      add constraint branches_business_restaurant_fkey
      foreign key (business_id, restaurant_id)
      references public.restaurants (business_id, id)
      on delete cascade;
  end if;
end $$;

create index if not exists idx_branches_restaurant
  on public.branches (restaurant_id);

-- Existing branches can be assigned automatically only when the business has
-- exactly one listing. Multi-listing businesses are assigned from the Listings
-- screen so their locations and menus are not silently attached to the wrong one.
with single_listing_businesses as (
  select business_id, min(id::text)::uuid as restaurant_id
  from public.restaurants
  group by business_id
  having count(*) = 1
)
update public.branches branch
set restaurant_id = listing.restaurant_id
from single_listing_businesses listing
where branch.business_id = listing.business_id
  and branch.restaurant_id is null;

drop policy if exists branches_insert on public.branches;
create policy branches_insert on public.branches
  for insert to authenticated
  with check (
    restaurant_id is not null
    and exists (
      select 1
      from public.businesses business
      where business.id = branches.business_id
        and business.owner_id = (select auth.uid())
    )
  );

drop policy if exists branches_update on public.branches;
create policy branches_update on public.branches
  for update to authenticated
  using (
    exists (
      select 1
      from public.businesses business
      where business.id = branches.business_id
        and business.owner_id = (select auth.uid())
    )
  )
  with check (
    restaurant_id is not null
    and exists (
      select 1
      from public.businesses business
      where business.id = branches.business_id
        and business.owner_id = (select auth.uid())
    )
  );
