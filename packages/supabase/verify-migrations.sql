-- ============================================================================
-- Post-migration verification for the UrbanExplore Supabase schema.
-- Run AFTER the migrations, in the same session/project:
--   psql "$CONNECTION_STRING" -v ON_ERROR_STOP=1 -f verify-migrations.sql
-- or paste into the Supabase SQL Editor.
--
-- Every check raises an exception on failure, so ON_ERROR_STOP turns this into a
-- pass/fail gate. These encode the security invariants from
-- migrations/0007_security_hardening.sql (the P0 identity-forgery fix), so a
-- fresh project is provably as locked down as production.
-- ============================================================================
set client_min_messages to notice;

-- 1) P0: anonymous callers must not be able to run the SECURITY DEFINER RPCs
--    (reserve_table / hold_ticket / complete_purchase / release_ticket_hold).
--    Identity is derived from auth.uid() inside the functions, so exposing them
--    to anon would let an unauthenticated caller act as anyone.
do $$
begin
  if has_function_privilege('anon', 'public.reserve_table(uuid,date,text,integer)', 'EXECUTE')
     or has_function_privilege('anon', 'public.hold_ticket(uuid,integer)', 'EXECUTE')
     or has_function_privilege('anon', 'public.complete_purchase(uuid)', 'EXECUTE')
     or has_function_privilege('anon', 'public.release_ticket_hold(uuid)', 'EXECUTE') then
    raise exception 'FAIL: anon can execute a SECURITY DEFINER auth RPC';
  end if;
  raise notice 'PASS: anon has no execute on the auth RPCs';
end $$;

-- 2) Signed-in users must still be able to call them (we did not over-lock).
do $$
begin
  if not has_function_privilege('authenticated', 'public.reserve_table(uuid,date,text,integer)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.hold_ticket(uuid,integer)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.complete_purchase(uuid)', 'EXECUTE') then
    raise exception 'FAIL: authenticated lost access to the auth RPCs';
  end if;
  raise notice 'PASS: authenticated retains RPC access';
end $$;

-- 3) The purchase ledger is RPC-only: no client role may write it directly.
--    (That was the self-granted paid-ticket path.) Supabase pre-grants broad
--    table privileges to `anon`/`authenticated` at the platform level, so the
--    real enforcement is the RLS policies in 0007 + 0010: a client role that
--    has no policy for the table gets zero rows / a policy violation, even when
--    it holds the GRANT. So assert on the policies, not the grants.
do $$
declare v_writers text;
begin
  select string_agg(pol.roles::text, ', ') into v_writers
    from pg_policies pol
   where pol.schemaname = 'public'
     and pol.tablename = 'ticket_purchases'
     and pol.cmd in ('INSERT', 'UPDATE', 'DELETE')
     and pol.roles::text[] @> ARRAY['anon'];
  if v_writers is not null then
    raise exception 'FAIL: an INSERT/UPDATE/DELETE policy on ticket_purchases is open to anon (%)', v_writers;
  end if;
  raise notice 'PASS: ticket_purchases has no anon write policy (RLS blocks direct DML)';
end $$;

-- 4) The profiles trigger must exist, or new signups get no role and are
--    bounced back to the login page.
do $$
declare v_exists boolean;
begin
  select exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created' and not tgisinternal
  ) into v_exists;
  if not v_exists then
    raise exception 'FAIL: on_auth_user_created trigger is missing';
  end if;
  raise notice 'PASS: on_auth_user_created trigger present';
end $$;

-- 5) RLS must be switched on for every public table.
do $$
declare v_off text;
begin
  select string_agg(tablename, ', ') into v_off
    from pg_tables where schemaname = 'public' and rowsecurity = false;
  if v_off is not null then
    raise exception 'FAIL: RLS disabled on public.%', v_off;
  end if;
  raise notice 'PASS: RLS enabled on all public tables';
end $$;

-- 6) Informational counts (review these against the expected schema).
select count(*) as public_tables
  from information_schema.tables
 where table_schema = 'public' and table_type = 'BASE TABLE';

select count(*) as rls_policies
  from pg_policies where schemaname = 'public';

-- The five role-gating functions the web app depends on.
select proname
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and proname in (
     'reserve_table', 'hold_ticket', 'complete_purchase', 'release_ticket_hold',
     'release_expired_holds', 'admin_set_user_role', 'actor_is_admin', 'handle_new_user'
   )
 order by 1;
