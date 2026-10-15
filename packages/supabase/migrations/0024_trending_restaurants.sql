-- Trending restaurants.
--
-- The home page labelled its hero card "Just added" while ranking by created_at.
-- Making it honest needs a real demand signal, and there is none an anonymous
-- visitor may read: `reservations_select` is granted `to authenticated` with
-- `user_id = auth.uid() or branch_owner_is_self(branch_id) or is_admin()`, so
-- anon sees zero reservation rows. There is also no public aggregate view.
--
-- Hence a SECURITY DEFINER function. It returns ONLY an aggregate — a restaurant
-- id, a recent-reservation count and the public rating — never a reservation
-- row, customer id, guest count, date or contact detail. The RLS boundary on
-- public.reservations is unchanged; this widens nothing an anon caller can read
-- row-wise.
--
-- Ranking: most reservations inside the window first, then rating, then newest.
-- That means a brand-new restaurant with no bookings yet still ranks by rating
-- rather than showing nothing.

create or replace function public.trending_restaurants(
  p_limit integer default 6,
  p_days integer default 14
)
returns table (
  restaurant_id uuid,
  recent_reservations bigint,
  rating numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  with window_start as (
    select (pg_catalog.now() - pg_catalog.make_interval(days => pg_catalog.greatest(p_days, 1)))::date as day
  ),
  demand as (
    select b.business_id, pg_catalog.count(*)::bigint as recent_reservations
    from public.reservations r
    join public.branches b on b.id = r.branch_id
    where r.reservation_date >= (select day from window_start)
      -- 'cancelled' and 'rejected' are not demand.
      and r.status in (
        'pending'::public.reservation_status,
        'confirmed'::public.reservation_status,
        'completed'::public.reservation_status
      )
    group by b.business_id
  )
  select
    rs.id as restaurant_id,
    pg_catalog.coalesce(d.recent_reservations, 0) as recent_reservations,
    rs.rating
  from public.restaurants rs
  left join demand d on d.business_id = rs.business_id
  where rs.is_active is true
    -- Mirror restaurants_select_anon so this can never surface a suspended or
    -- unverified business that the catalogue itself would hide.
    and (select private.business_is_public(rs.business_id))
  order by
    pg_catalog.coalesce(d.recent_reservations, 0) desc,
    rs.rating desc nulls last,
    rs.created_at desc
  limit pg_catalog.greatest(p_limit, 1);
$$;

revoke execute on function public.trending_restaurants(integer, integer) from public;
grant execute on function public.trending_restaurants(integer, integer) to anon, authenticated;
