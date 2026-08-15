-- 0001_extensions_enums.sql
-- Extensions and shared enums for the UrbanExplore Supabase schema.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

do $$
begin
  create type user_role as enum ('customer', 'food_business', 'event_organizer', 'system_admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type booking_mode as enum ('instant', 'request', 'closed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type reservation_status as enum ('pending', 'confirmed', 'rejected', 'cancelled', 'completed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type event_status as enum ('draft', 'published', 'cancelled', 'completed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type ticket_tier as enum ('standard', 'vip', 'early_bird', 'group');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type moderation_status as enum ('active', 'inactive', 'pending', 'rejected');
exception when duplicate_object then null;
end $$;
