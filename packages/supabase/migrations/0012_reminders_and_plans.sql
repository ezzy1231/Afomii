-- 0012_reminders_and_plans.sql
-- 1) notifications table + RLS
-- 2) get_consumer_plans() unified view
-- 3) Day-of reminder cron job (pg_cron, 05:00 UTC = 08:00 Addis)

-- 1) Notifications table ---------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  related_entity_type text not null,
  related_entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select (id, user_id, type, title, body, related_entity_type, related_entity_id, read_at, created_at)
  on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- 2) get_consumer_plans ----------------------------------------------------
-- Merges confirmed reservations and paid ticket purchases into a single
-- "plans" view, ordered by upcoming date, with cover image and coordinates
-- for ride prefill.

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

-- 3) Day-of reminder cron --------------------------------------------------
-- Inserts a notification row for each confirmed reservation and paid ticket
-- purchase whose event / reservation date is today. Guards against duplicate
-- notifications if the cron job runs more than once.

create or replace function public.send_day_of_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := current_date;
begin
  -- Restaurant reservations for today
  insert into public.notifications (user_id, type, title, body, related_entity_type, related_entity_id)
  select
    r.user_id,
    'reservation_day',
    '🍽️ Reservation today at ' || rest.name,
    'Your table for ' || r.guest_count || ' at ' || coalesce(r.time_slot, 'your reserved time') || ' — ' || b.address,
    'reservation',
    r.id
  from public.reservations r
  join public.branches b on b.id = r.branch_id
  join public.restaurants rest on rest.business_id = b.business_id
  where r.reservation_date = today
    and r.status = 'confirmed'
    and not exists (
      select 1 from public.notifications n
      where n.user_id = r.user_id
        and n.related_entity_type = 'reservation'
        and n.related_entity_id = r.id
        and n.type = 'reservation_day'
    );

  -- Events starting today (ticket holders)
  insert into public.notifications (user_id, type, title, body, related_entity_type, related_entity_id)
  select
    tp.user_id,
    'event_day',
    '🎉 ' || e.title || ' is today!',
    'At ' || coalesce(e.venue_name, 'TBD') || ' — ' || to_char(e.starts_at, 'HH:MI AM'),
    'event',
    tp.id
  from public.ticket_purchases tp
  join public.events e on e.id = tp.event_id
  where e.starts_at::date = today
    and tp.payment_status = 'paid'
    and not exists (
      select 1 from public.notifications n
      where n.user_id = tp.user_id
        and n.related_entity_type = 'event'
        and n.related_entity_id = tp.id
        and n.type = 'event_day'
    );
end;
$$;

-- Schedule the cron job at 05:00 UTC (~08:00 Addis) daily.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('send-day-of-reminders');
    exception when others then null;
    end;
    perform cron.schedule(
      'send-day-of-reminders',
      '0 5 * * *',
      $cron$ select public.send_day_of_reminders(); $cron$
    );
  end if;
end $$;
