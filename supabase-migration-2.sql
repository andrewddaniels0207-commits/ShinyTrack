-- Migration 2: odds/charm, timers, phases, public profiles.
-- Run this in the Supabase SQL Editor (your database already has the v1 schema).

-- New hunt columns
alter table public.hunts add column if not exists charm boolean not null default false;
alter table public.hunts add column if not exists time_seconds integer not null default 0;
alter table public.hunts add column if not exists phases jsonb not null default '[]';

-- Profiles for public collection pages
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_-]{3,20}$'),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (is_public = true or auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Anyone (including logged-out visitors) can view completed hunts
-- belonging to a public profile.
create policy "Completed hunts of public profiles are viewable"
  on public.hunts for select
  using (
    status = 'completed'
    and exists (
      select 1 from public.profiles p
      where p.id = hunts.user_id and p.is_public = true
    )
  );
