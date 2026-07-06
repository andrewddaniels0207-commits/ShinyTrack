-- Migration 3: home page/community features, dexes, dynamic odds, manual entries.
-- Run in the Supabase SQL Editor after migration 2.

-- Profile additions
alter table public.profiles add column if not exists socials jsonb not null default '{}';
alter table public.profiles add column if not exists games_owned jsonb not null default '[]';
alter table public.profiles add column if not exists favorite_hunt_id uuid;

-- Hunt additions
alter table public.hunts add column if not exists proof_url text;
alter table public.hunts add column if not exists manual boolean not null default false;
alter table public.hunts add column if not exists modifiers jsonb not null default '{}';
alter table public.hunts add column if not exists combo integer not null default 0;
alter table public.hunts add column if not exists dex_ids jsonb not null default '[]';
alter table public.hunts add column if not exists evolved_ids jsonb not null default '[]';
alter table public.hunts add column if not exists evolved_name text;

-- Custom dex trackers
create table if not exists public.dexes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  game_id text,
  created_at timestamptz not null default now()
);

create index if not exists dexes_user_id_idx on public.dexes (user_id);
alter table public.dexes enable row level security;

create policy "Users can view own dexes"
  on public.dexes for select using (auth.uid() = user_id);
create policy "Users can insert own dexes"
  on public.dexes for insert with check (auth.uid() = user_id);
create policy "Users can update own dexes"
  on public.dexes for update using (auth.uid() = user_id);
create policy "Users can delete own dexes"
  on public.dexes for delete using (auth.uid() = user_id);
