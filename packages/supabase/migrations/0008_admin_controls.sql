-- 0008_admin_controls.sql
-- Platform-admin controls for the web admin panel.
--
-- Everything else the admin panel needs is already writable by system_admins
-- through RLS policies on events / reservations / businesses / organizers /
-- offers (see 0003_rls_policies.sql). Two deliberate exceptions:
--
-- 1) Profile roles: profiles_update stays own-row-only so a compromised client
--    can never edit someone else's identity row (and a future policy regression
--    can't become self-service privilege escalation). Role changes go through
--    this single audited SECURITY DEFINER function instead. Uses the
--    recursion-safe actor_is_admin() helper from 0007.
-- 2) Suspension: profiles gains an is_suspended flag; enforcement lives in the
--    web middleware + admin actions, not in RLS.

create or replace function public.admin_set_user_role(
  p_user_id uuid,
  p_new_role public.user_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_role public.user_role;
begin
  if not public.actor_is_admin() then
    raise exception 'admin_set_user_role: caller is not a system admin';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'admin_set_user_role: changing your own role is not allowed';
  end if;

  select role into v_old_role from public.profiles where id = p_user_id;
  if v_old_role is null then
    raise exception 'admin_set_user_role: profile % not found', p_user_id;
  end if;

  if v_old_role = p_new_role then
    return;
  end if;

  update public.profiles
    set role = p_new_role, updated_at = now()
    where id = p_user_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'user_role_change',
    'profile',
    p_user_id,
    jsonb_build_object('from', v_old_role, 'to', p_new_role)
  );
end;
$$;

revoke execute on function public.admin_set_user_role(uuid, public.user_role) from anon, public;
grant execute on function public.admin_set_user_role(uuid, public.user_role) to authenticated;

-- ── Account suspension flag ────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_suspended boolean not null default false;

comment on column public.profiles.is_suspended is
  'Set by platform admins via adminSetUserSuspended; enforced by web middleware.';
