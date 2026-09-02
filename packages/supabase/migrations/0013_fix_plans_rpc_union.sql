-- 0013_fix_plans_rpc_union.sql
-- Fixes get_consumer_plans(): the UNION branches returned two different
-- enum types for the 9th column — r.status (reservation_status) vs
-- tp.payment_status (payment_status). Postgres cannot union distinct enums,
-- so the RPC 500'd with "UNION could not convert type payment_status to
-- reservation_status". Both are cast to ::text to unify the column.

create or replace function public.get_consumer_plans(p_user_id uuid)
returns table (
  id text,
  plan_type text,
  title text,
  cover_image_url text,
  plan_date timestamptz,
  location text,
  latitude double precision,
  longitude double precision,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  -- Reservations
  select
    r.id::text,
    'reservation'::text,
    rest.name,
    rest.cover_url,
    (r.reservation_date::timestamptz + coalesce(nullif(r.time_slot, '')::time, '12:00'::time))::timestamptz,
    b.address,
    b.latitude,
    b.longitude,
    r.status::text
  from public.reservations r
  join public.branches b on b.id = r.branch_id
  join public.restaurants rest on rest.business_id = b.business_id
  where r.user_id = p_user_id
    and r.status in ('confirmed')
    and r.reservation_date >= current_date

  union all

  -- Events (ticket purchases)
  select
    tp.id::text,
    'event'::text,
    e.title,
    e.cover_image_url,
    e.starts_at,
    e.venue_name,
    e.latitude,
    e.longitude,
    tp.payment_status::text
  from public.ticket_purchases tp
  join public.events e on e.id = tp.event_id
  where tp.user_id = p_user_id
    and tp.payment_status = 'paid'
    and (e.starts_at is null or e.starts_at >= now() - interval '2 hours')

  order by plan_date;
end;
$$;

grant execute on function public.get_consumer_plans(uuid) to authenticated;
