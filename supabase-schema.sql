-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).

create table public.hunts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pokemon_id integer not null,
  pokemon_name text not null,
  game_id text not null,
  game_name text not null,
  method text not null,
  count integer not null default 0,
  increment integer not null default 1,
  status text not null default 'active' check (status in ('active', 'completed')),
  start_date timestamptz not null default now(),
  end_date timestamptz,
  created_at timestamptz not null default now()
);

create index hunts_user_id_idx on public.hunts (user_id);

-- Row Level Security: users can only see and modify their own hunts.
alter table public.hunts enable row level security;

create policy "Users can view own hunts"
  on public.hunts for select
  using (auth.uid() = user_id);

create policy "Users can insert own hunts"
  on public.hunts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own hunts"
  on public.hunts for update
  using (auth.uid() = user_id);

create policy "Users can delete own hunts"
  on public.hunts for delete
  using (auth.uid() = user_id);

-- v2 additions (odds/charm, timers, phases, public profiles).
-- If your database was created with the v1 schema, run supabase-migration-2.sql instead.
alter table public.hunts add column if not exists charm boolean not null default false;
alter table public.hunts add column if not exists time_seconds integer not null default 0;
alter table public.hunts add column if not exists phases jsonb not null default '[]';

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

create policy "Completed hunts of public profiles are viewable"
  on public.hunts for select
  using (
    status = 'completed'
    and exists (
      select 1 from public.profiles p
      where p.id = hunts.user_id and p.is_public = true
    )
  );
