-- 0007_security_hardening.sql
-- M0 production-readiness security hardening.
--
-- 1) Identity-safe RPCs: reserve_table / hold_ticket / release_ticket_hold no
--    longer accept a client-supplied p_user_id; they derive the caller from
--    auth.uid() internally, and are no longer executable by `anon`.
-- 2) complete_purchase(): the ONLY way to create a ticket_purchase. Inserts the
--    purchase with a server-generated random QR code and closes the hold
--    atomically. Direct DML on ticket_purchases is revoked from authenticated.
-- 3) ticket_holds rows can only be created by hold_ticket().
-- 4) profiles RLS locked down to own-row (+ admin via definer helper so there
--    is no policy recursion). Partner customer contact moves to
--    partner_customer_contacts(), scoped to branches the caller owns.
-- 5) Columns used by partner/organizer onboarding (slug/category/contact/plan).
-- 6) audit_logs aligned with application writes (entity_type/metadata) plus an
--    actor-scoped insert policy.

-- ─────────────────────────────────────────────────────────────────────
-- 1) Reservation RPC — caller derived from JWT
-- ─────────────────────────────────────────────────────────────────────
drop function if exists public.reserve_table(uuid, date, text, integer, uuid);

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
  v_cap integer;
  v_max_guests integer;
  v_booked integer;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  select total_tables, max_guest_per_table
    into v_cap, v_max_guests
  from public.booking_configs
  where branch_id = p_branch_id;

  if v_max_guests is not null and v_max_guests > 0 and p_guest_count > v_max_guests then
    raise exception 'PARTY_TOO_LARGE' using errcode = 'P0001';
  end if;

  -- No capacity configured yet: do NOT silently allow unlimited bookings.
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
  values (p_branch_id, p_reservation_date, p_time_slot, p_guest_count, auth.uid(), 'pending')
  returning id into v_id;

  return v_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 2) Ticket hold RPC — caller derived from JWT
-- ─────────────────────────────────────────────────────────────────────
drop function if exists public.hold_ticket(uuid, integer, uuid);

create or replace function public.hold_ticket(
  p_ticket_type_id uuid,
  p_quantity integer
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
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  if p_quantity is null or p_quantity < 1 then
    raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
  end if;

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
  values (p_ticket_type_id, auth.uid(), p_quantity, now() + interval '15 minutes', 'active')
  returning id into v_id;

  return v_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 3) Single-hold release — caller derived from JWT
-- ─────────────────────────────────────────────────────────────────────
drop function if exists public.release_ticket_hold(uuid, uuid);

create or replace function public.release_ticket_hold(p_hold_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hold record;
begin
  if auth.uid() is null then
    return false;
  end if;

  select * into v_hold
  from public.ticket_holds
  where id = p_hold_id and user_id = auth.uid() and status = 'active'
  for update;

  if not found then
    return false;
  end if;

  update public.ticket_types
  set remaining_quantity = remaining_quantity + v_hold.quantity
  where id = v_hold.ticket_type_id;

  update public.ticket_holds
  set status = 'released'
  where id = v_hold.id;

  return true;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 4) Purchase completion — the only write path into ticket_purchases
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.complete_purchase(p_hold_id uuid)
returns table (purchase_id uuid, qr_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hold record;
  v_tt record;
  v_qr text;
  v_pid uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '28000';
  end if;

  select * into v_hold
  from public.ticket_holds
  where id = p_hold_id
  for update;

  if not found or v_hold.user_id <> auth.uid() then
    raise exception 'HOLD_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_hold.status <> 'active' then
    raise exception 'HOLD_NOT_ACTIVE' using errcode = 'P0001';
  end if;

  select * into v_tt
  from public.ticket_types
  where id = v_hold.ticket_type_id;

  if not found then
    raise exception 'TICKET_TYPE_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- Server-generated unguessable token; door scanning looks it up in the DB.
  v_qr := 'UE-' || upper(encode(gen_random_bytes(12), 'hex'));

  insert into public.ticket_purchases
    (ticket_type_id, event_id, user_id, quantity, amount, currency, payment_status, qr_code)
  values (
    v_hold.ticket_type_id,
    v_tt.event_id,
    auth.uid(),
    v_hold.quantity,
    v_tt.price * v_hold.quantity,
    'ETB',
    'paid', -- payment states stay modeled here until a provider is integrated
    v_qr
  )
  returning id into v_pid;

  update public.ticket_holds
  set status = 'completed'
  where id = v_hold.id;

  return query select v_pid, v_qr;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 5) Partner customer contacts (replacement for open profiles reads)
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.partner_customer_contacts(p_user_ids uuid[])
returns table (id uuid, email text, phone text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct p.id, p.email, p.phone
  from public.profiles p
  where auth.uid() is not null
    and p.id = any(p_user_ids)
    and exists (
      select 1
      from public.reservations r
      join public.branches br on br.id = r.branch_id
      join public.businesses b on b.id = br.business_id
      where r.user_id = p.id
        and b.owner_id = auth.uid()
    );
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 6) Grants: authenticated-only execution, no anon, no direct DML
-- ─────────────────────────────────────────────────────────────────────
revoke execute on function public.reserve_table(uuid, date, text, integer) from anon, public;
revoke execute on function public.hold_ticket(uuid, integer) from anon, public;
revoke execute on function public.release_ticket_hold(uuid) from anon, public;
revoke execute on function public.partner_customer_contacts(uuid[]) from anon, public;
revoke execute on function public.complete_purchase(uuid) from anon, public;

grant execute on function public.reserve_table(uuid, date, text, integer) to authenticated;
grant execute on function public.hold_ticket(uuid, integer) to authenticated;
grant execute on function public.release_ticket_hold(uuid) to authenticated;
grant execute on function public.complete_purchase(uuid) to authenticated;
grant execute on function public.partner_customer_contacts(uuid[]) to authenticated;

-- Purchases are created exclusively via complete_purchase().
revoke insert, update, delete on public.ticket_purchases from authenticated;
-- Holds are created exclusively via hold_ticket().
revoke insert on public.ticket_holds from authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 7) profiles RLS: own row only (no cross-user PII reads)
-- ─────────────────────────────────────────────────────────────────────
-- Definer helper avoids the classic "infinite recursion" problem of calling an
-- invoker-role profiles lookup from a profiles policy.
create or replace function public.actor_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'system_admin'
  );
$$;

revoke execute on function public.actor_is_admin() from anon, public;
grant execute on function public.actor_is_admin() to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.actor_is_admin());

-- ─────────────────────────────────────────────────────────────────────
-- 8) Partner onboarding columns (used by app/auth/callback/route.ts)
-- ─────────────────────────────────────────────────────────────────────
alter table public.businesses
  add column if not exists slug text,
  add column if not exists category text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists plan text not null default 'free';

alter table public.organizers
  add column if not exists slug text,
  add column if not exists category text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists plan text not null default 'free';

create unique index if not exists ux_businesses_slug on public.businesses (slug) where slug is not null;
create unique index if not exists ux_organizers_slug on public.organizers (slug) where slug is not null;
create index if not exists idx_businesses_plan on public.businesses (plan);
create index if not exists idx_organizers_plan on public.organizers (plan);

-- ─────────────────────────────────────────────────────────────────────
-- 9) audit_logs alignment + actor-scoped insert policy
-- ─────────────────────────────────────────────────────────────────────
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_logs' and column_name = 'entity'
  ) then
    alter table public.audit_logs rename column entity to entity_type;
  end if;
end $$;

alter table public.audit_logs add column if not exists metadata jsonb;

drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
  for insert to authenticated
  with check (actor_id = auth.uid());

grant insert on public.audit_logs to authenticated;
