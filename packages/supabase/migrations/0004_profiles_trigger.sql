-- 0004_profiles_trigger.sql
-- Automatically create exactly one public.profiles row for every new auth user,
-- carrying the role (and basic fields) from signup metadata. Runs as SECURITY
-- DEFINER so it can insert despite RLS on profiles.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email, phone, city, language, country)
  values (
    new.id,
    coalesce(
      (new.raw_user_meta_data ->> 'role')::public.user_role,
      'customer'
    ),
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
