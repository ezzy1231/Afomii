-- 0006_hold_release_and_cron.sql
-- 1) Atomic single-hold release: restores inventory when a purchase fails after
--    the hold was placed (prevents inventory leaks on the failure path).
-- 2) pg_cron schedule for release_expired_holds() so expired holds return to
--    inventory without a manual job.

-- Release one active hold back into inventory. Returns true when released.
create or replace function public.release_ticket_hold(
  p_hold_id uuid,
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hold record;
begin
  select * into v_hold
  from public.ticket_holds
  where id = p_hold_id and user_id = p_user_id and status = 'active'
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

grant execute on function public.release_ticket_hold(uuid, uuid) to authenticated, anon;

-- Scheduler for expired holds (pg_cron, every 5 minutes).
create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('release-expired-ticket-holds');
    exception when others then null;
    end;
    perform cron.schedule(
      'release-expired-ticket-holds',
      '*/5 * * * *',
      $cron$ select public.release_expired_holds(); $cron$
    );
  end if;
end $$;
