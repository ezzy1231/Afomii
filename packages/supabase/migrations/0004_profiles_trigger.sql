-- 0004_profiles_trigger.sql
-- Automatically create exactly one public.profiles row for every new auth user,
-- carrying the role (and basic fields) from signup metadata. Runs as SECURITY
-- DEFINER so it can insert despite RLS on profiles.
--
-- Hardened: an invalid/legacy `role` in signup metadata (e.g. the historic
-- 'user' value) must never brick account creation — fall back to 'customer'
-- instead of letting the enum cast fail the whole auth.users insert.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  begin
    v_role := coalesce(
      (new.raw_user_meta_data ->> 'role')::public.user_role,
      'customer'
    );
  exception when invalid_text_representation or invalid_parameter_value or others then
    v_role := 'customer';
  end;

  insert into public.profiles (id, role, full_name, email, phone, city, language, country)
  values (
    new.id,
    v_role,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'city',
    coalesce(new.raw_user_meta_data ->> 'language', 'en'),
    coalesce(new.raw_user_meta_data ->> 'country', 'ET')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
