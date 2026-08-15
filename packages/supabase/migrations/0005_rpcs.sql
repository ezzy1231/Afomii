-- 0005_rpcs.sql
-- Atomic operations to prevent oversell of reservation slots and ticket inventory.
-- These run as SECURITY DEFINER so they can enforce capacity independent of RLS.

-- Reserve a table atomically. Returns the new reservation id, or raises an
-- exception when the slot is full. A "slot" is capped at total_tables.
create or replace function public.reserve_table(
  p_branch_id uuid,
  p_reservation_date date,
  p_time_slot text,
  p_guest_count integer,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cap integer;
  v_booked integer;
  v_id uuid;
begin
  select total_tables into v_cap from public.booking_configs where branch_id = p_branch_id;
  if v_cap is null or v_cap <= 0 then
    -- No capacity configured: allow (owner must configure to enforce).
    v_cap := 2147483647;
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
  values (p_branch_id, p_reservation_date, p_time_slot, p_guest_count, p_user_id, 'pending')
  returning id into v_id;

  return v_id;
end;
$$;

-- Place a temporary ticket hold, decrementing remaining inventory atomically.
-- Returns the hold id. Raises when not enough inventory remains.
create or replace function public.hold_ticket(
  p_ticket_type_id uuid,
  p_quantity integer,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining integer;
  v_id uuid;
begin
  select remaining_quantity into v_remaining
  from public.ticket_types
  where id = p_ticket_type_id
  for update;

  if v_remaining is null or v_remaining < p_quantity then
    raise exception 'TICKET_INSUFFICIENT_INVENTORY' using errcode = 'P0002';
  end if;

  update public.ticket_types
  set remaining_quantity = remaining_quantity - p_quantity
  where id = p_ticket_type_id;

  insert into public.ticket_holds (ticket_type_id, user_id, quantity, expires_at, status)
  values (p_ticket_type_id, p_user_id, p_quantity, now() + interval '15 minutes', 'active')
  returning id into v_id;

  return v_id;
end;
$$;

-- Release expired holds back into inventory. Intended for a scheduled job/cron.
create or replace function public.release_expired_holds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with expired as (
    select h.id, h.ticket_type_id, h.quantity
    from public.ticket_holds h
    where h.status = 'active' and h.expires_at < now()
    for update skip locked
  )
  update public.ticket_types t
  set remaining_quantity = remaining_quantity + e.quantity
  from expired e
  where t.id = e.ticket_type_id;

  update public.ticket_holds
  set status = 'expired'
  where status = 'active' and expires_at < now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.reserve_table(uuid, date, text, integer, uuid) to authenticated, anon;
grant execute on function public.hold_ticket(uuid, integer, uuid) to authenticated, anon;
grant execute on function public.release_expired_holds() to authenticated;
