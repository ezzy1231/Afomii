-- 0014_real_notifications.sql
-- Real notifications: DB triggers create notification rows the moment real
-- events happen (reservation requested / confirmed / declined / cancelled,
-- tickets purchased), so the bell always reflects live state instead of an
-- empty list.
--
-- Why triggers instead of app code: all reservation writes go through the
-- reserve_table RPC or direct status updates, and all purchases through
-- complete_purchase — a trigger on those tables catches every path without
-- each server action having to remember to notify.

-- ─────────────────────────────────────────────────────────────────────
-- 1) Internal helper: insert a notification row.
--    SECURITY DEFINER so it bypasses RLS on notifications (the table has
--    SELECT/UPDATE policies but no INSERT policy, and these rows are often
--    created for a user other than the current one, e.g. restaurant owner
--    confirming a consumer's reservation).
--    NOT callable by end users — triggers invoke it internally.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_entity_type text,
  p_entity_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;
  insert into public.notifications (user_id, type, title, body, related_entity_type, related_entity_id)
  values (p_user_id, p_type, p_title, p_body, p_entity_type, p_entity_id);
end;
$$;

-- Keep it internal: no anon/authenticated execution (prevents spam).
revoke execute on function public.create_notification(uuid, text, text, text, text, uuid) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 2) Reservation created → notify the consumer AND the business owner.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.on_reservation_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restaurant text;
  v_owner_id uuid;
begin
  select coalesce(r.name, 'the restaurant'), bz.owner_id
    into v_restaurant, v_owner_id
  from public.branches b
  left join public.restaurants r on r.business_id = b.business_id
  left join public.businesses bz on bz.id = b.business_id
  where b.id = new.branch_id;

  -- Consumer: request received (always 'pending' at insert time).
  perform public.create_notification(
    new.user_id,
    'reservation_requested',
    '🍽️ Reservation requested',
    'Your table for ' || new.guest_count || ' on ' ||
      to_char(new.reservation_date, 'Mon DD, YYYY') || ' at ' ||
      coalesce(nullif(new.time_slot, ''), 'your selected time') ||
      ' at ' || v_restaurant || ' has been received and awaits confirmation.',
    'reservation', new.id
  );

  -- Business owner: a new request to act on.
  if v_owner_id is not null and v_owner_id <> new.user_id then
    perform public.create_notification(
      v_owner_id,
      'new_reservation',
      '📥 New reservation request',
      new.guest_count || ' guests on ' ||
        to_char(new.reservation_date, 'Mon DD, YYYY') || ' at ' ||
        coalesce(nullif(new.time_slot, ''), 'a selected time') || '.',
      'reservation', new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reservation_inserted on public.reservations;
create trigger trg_reservation_inserted
  after insert on public.reservations
  for each row
  execute function public.on_reservation_inserted();

-- ─────────────────────────────────────────────────────────────────────
-- 3) Reservation status changed → notify the consumer.
--    Fires only when the status actually changes.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.on_reservation_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restaurant text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  select coalesce(r.name, 'the restaurant')
    into v_restaurant
  from public.branches b
  left join public.restaurants r on r.business_id = b.business_id
  where b.id = new.branch_id;

  if new.status = 'confirmed' then
    perform public.create_notification(
      new.user_id,
      'reservation_confirmed',
      '✅ Reservation confirmed',
      'Your table for ' || new.guest_count || ' on ' ||
        to_char(new.reservation_date, 'Mon DD, YYYY') || ' at ' ||
        coalesce(nullif(new.time_slot, ''), 'your reserved time') ||
        ' at ' || v_restaurant || ' is confirmed. See you there!',
      'reservation', new.id
    );
  elsif new.status = 'rejected' then
    perform public.create_notification(
      new.user_id,
      'reservation_rejected',
      '❌ Reservation declined',
      'Unfortunately ' || v_restaurant || ' could not accommodate your table for ' ||
        new.guest_count || ' on ' || to_char(new.reservation_date, 'Mon DD, YYYY') || '.',
      'reservation', new.id
    );
  elsif new.status = 'cancelled' then
    perform public.create_notification(
      new.user_id,
      'reservation_cancelled',
      'Reservation cancelled',
      'Your reservation at ' || v_restaurant || ' on ' ||
        to_char(new.reservation_date, 'Mon DD, YYYY') || ' has been cancelled.',
      'reservation', new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reservation_status_changed on public.reservations;
create trigger trg_reservation_status_changed
  after update of status on public.reservations
  for each row
  execute function public.on_reservation_status_changed();

-- ─────────────────────────────────────────────────────────────────────
-- 4) Ticket purchase created → notify the consumer AND the organizer.
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.on_ticket_purchase_inserted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event text;
  v_owner_id uuid;
begin
  select coalesce(e.title, 'the event'), o.owner_id
    into v_event, v_owner_id
  from public.events e
  left join public.organizers o on o.id = e.organizer_id
  where e.id = new.event_id;

  if new.payment_status = 'paid' then
    -- Consumer: tickets confirmed.
    perform public.create_notification(
      new.user_id,
      'ticket_purchase',
      '🎟️ Tickets confirmed',
      new.quantity || ' ticket(s) for ' || v_event || ' are confirmed. Your QR code is ready.',
      'event', new.id
    );

    -- Organizer: a new sale.
    if v_owner_id is not null and v_owner_id <> new.user_id then
      perform public.create_notification(
        v_owner_id,
        'new_ticket_sale',
        '🎟️ New ticket sale',
        new.quantity || ' ticket(s) sold for ' || v_event || '.',
        'event', new.id
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_ticket_purchase_inserted on public.ticket_purchases;
create trigger trg_ticket_purchase_inserted
  after insert on public.ticket_purchases
  for each row
  execute function public.on_ticket_purchase_inserted();

-- ─────────────────────────────────────────────────────────────────────
-- 5) Ticket payment status changed → notify the consumer.
--    Covers future payment-provider transitions (paid → refunded, etc.).
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.on_ticket_payment_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event text;
begin
  if new.payment_status is not distinct from old.payment_status then
    return new;
  end if;

  select coalesce(e.title, 'the event')
    into v_event
  from public.events e
  where e.id = new.event_id;

  if new.payment_status = 'refunded' then
    perform public.create_notification(
      new.user_id,
      'ticket_refunded',
      '💳 Tickets refunded',
      'Your tickets for ' || v_event || ' were refunded.',
      'event', new.id
    );
  elsif new.payment_status = 'cancelled' then
    perform public.create_notification(
      new.user_id,
      'ticket_cancelled',
      'Tickets cancelled',
      'Your tickets for ' || v_event || ' were cancelled.',
      'event', new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_ticket_payment_changed on public.ticket_purchases;
create trigger trg_ticket_payment_changed
  after update of payment_status on public.ticket_purchases
  for each row
  execute function public.on_ticket_payment_changed();
