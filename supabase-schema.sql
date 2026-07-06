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
