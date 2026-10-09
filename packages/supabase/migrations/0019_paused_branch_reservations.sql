-- Close the two paths by which a paused location could still take a booking.
--
-- 0018 added `branches.is_active` and hid paused rows from the public listing
-- page, but the reservation paths bypassed that filter entirely:
--
--   1. reserve_table() (SECURITY DEFINER, recreated in 0016) never looked at
--      is_active, so a caller with a stale page could still book a paused site.
--   2. `reservations_insert` is `with check (user_id = auth.uid())` — nothing
--      about the branch. A client could insert the row directly and skip the
--      RPC altogether, which also skips capacity enforcement.
--
-- The RPC is the enforcement point for the happy path; the INSERT policy is the
-- backstop that makes bypassing it pointless. Both raise BRANCH_NOT_ACCEPTING so
-- the existing error mapping in app/restaurants/actions.ts already reports it.

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
  v_active boolean;
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

  -- A paused location keeps its config row, so is_active is read separately.
  -- `is not false` keeps this working before 0018 has been applied anywhere.
  select is_active into v_active
  from public.branches
  where id = p_branch_id;

  if v_active is false then
    raise exception 'BRANCH_NOT_ACCEPTING' using errcode = 'P0001';
  end if;

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

-- The direct-insert backstop. A client that skips reserve_table to dodge the
-- capacity check now also has to get past this, and cannot.
drop policy if exists reservations_insert on public.reservations;
create policy reservations_insert on public.reservations
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.branches branch
      where branch.id = reservations.branch_id
        and branch.is_active is not false
    )
  );

-- A paused location must also stop being confirmable. accept_reservation_suggestion
-- promotes a pending booking to confirmed; refusing it leaves the guest's
-- original request pending, which is the correct outcome — the partner can
-- resolve it by hand once the location reopens.
create or replace function public.accept_reservation_suggestion(p_reservation_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation record;
  v_active boolean;
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

  select is_active into v_active
  from public.branches
  where id = v_reservation.branch_id;

  if v_active is false then
    raise exception 'BRANCH_NOT_ACCEPTING' using errcode = 'P0001';
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