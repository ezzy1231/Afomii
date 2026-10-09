-- Reservation check-in uses a short public code instead of exposing the row id.
-- The QR payload contains only this code; authorization still comes from the
-- authenticated partner's ownership of the reservation's branch.

alter table public.reservations
  add column if not exists booking_code text,
  add column if not exists checked_in_at timestamptz,
  add column if not exists suggested_time text;

update public.reservations
set booking_code = upper(encode(gen_random_bytes(6), 'hex'))
where booking_code is null;

alter table public.reservations
  alter column booking_code set default upper(encode(gen_random_bytes(6), 'hex')),
  alter column booking_code set not null;

create unique index if not exists reservations_booking_code_uidx
  on public.reservations (booking_code);

-- The organizer account keeps its profile imagery alongside its existing
-- name, category and description fields.
alter table public.organizers
  add column if not exists logo_url text,
  add column if not exists cover_url text;

-- A walk-in-only branch must be unable to create bookings even when a caller
-- bypasses the public reservation form and invokes the RPC directly.
create or replace function public.reserve_table(
  p_branch_id uuid,
  p_reservation_date date,
  p_time_slot text,
  p_guest_count integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mode booking_mode;
  v_cap integer;
  v_max_guests integer;
  v_booked integer;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  select booking_mode, total_tables, max_guest_per_table
    into v_mode, v_cap, v_max_guests
  from public.booking_configs
  where branch_id = p_branch_id
  for update;

  if v_mode = 'closed' then
    raise exception 'BRANCH_NOT_ACCEPTING' using errcode = 'P0001';
  end if;
  if v_max_guests is not null and v_max_guests > 0 and p_guest_count > v_max_guests then
    raise exception 'PARTY_TOO_LARGE' using errcode = 'P0001';
  end if;
  if v_cap is null or v_cap <= 0 then
    raise exception 'BRANCH_NOT_CONFIGURED' using errcode = 'P0001';
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
  values (
    p_branch_id,
    p_reservation_date,
    p_time_slot,
    p_guest_count,
    auth.uid(),
    case when v_mode = 'instant' then 'confirmed'::reservation_status else 'pending'::reservation_status end
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Accepting a partner's alternate time checks capacity while holding the same
-- branch configuration lock used by reserve_table, then moves the booking in
-- one transaction.
create or replace function public.accept_reservation_suggestion(p_reservation_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation record;
  v_capacity integer;
  v_booked integer;
  v_suggested_time text;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  select id, branch_id, reservation_date, guest_count, suggested_time
    into v_reservation
  from public.reservations
  where id = p_reservation_id
    and user_id = auth.uid()
    and status = 'pending'
    and suggested_time is not null
  for update;

  if not found then
    raise exception 'SUGGESTION_NOT_FOUND' using errcode = 'P0001';
  end if;

  select total_tables into v_capacity
  from public.booking_configs
  where branch_id = v_reservation.branch_id
    and booking_mode <> 'closed'
  for update;

  if v_capacity is null or v_capacity <= 0 then
    raise exception 'BRANCH_NOT_CONFIGURED' using errcode = 'P0001';
  end if;

  select coalesce(sum(guest_count), 0) into v_booked
  from public.reservations
  where branch_id = v_reservation.branch_id
    and reservation_date = v_reservation.reservation_date
    and time_slot = v_reservation.suggested_time
    and id <> v_reservation.id
    and status in ('pending', 'confirmed');

  if v_booked + v_reservation.guest_count > v_capacity then
    raise exception 'RESERVATION_SLOT_FULL' using errcode = 'P0001';
  end if;

  v_suggested_time := v_reservation.suggested_time;
  update public.reservations
  set time_slot = v_suggested_time,
      status = 'confirmed',
      suggested_time = null
  where id = v_reservation.id;

  return v_suggested_time;
end;
$$;

revoke execute on function public.accept_reservation_suggestion(uuid) from anon, public;
grant execute on function public.accept_reservation_suggestion(uuid) to authenticated;
