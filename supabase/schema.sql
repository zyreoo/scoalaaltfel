-- Schema for the Școala altfel site.
-- Run this in the Supabase SQL editor of a NEW project if the old one
-- cannot be restored. It is safe to run more than once.

create table if not exists public.schedule_entries (
  id          bigint generated always as identity primary key,
  class_name  text not null,          -- ex: "Clasa a IX-a A"
  day         text not null,          -- "Luni" … "Vineri"
  time        text not null,          -- ex: "08:00 - 09:00"
  activity    text not null default '',
  professor   text not null default '',
  created_at  timestamptz not null default now(),
  -- The API upserts on these three columns, so this constraint is required.
  constraint schedule_entries_slot_unique unique (class_name, day, time)
);

create table if not exists public.partners (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  created_at  timestamptz not null default now()
);

-- The site talks to the database only from the server with the
-- service_role key, which bypasses RLS. Enabling RLS with no policies
-- keeps the tables closed to the public anon key.
alter table public.schedule_entries enable row level security;
alter table public.partners enable row level security;
