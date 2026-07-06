# ✨ Shiny Hunt Tracker

Track Pokemon shiny hunts across every main-series game, with account logins so hunts sync across devices.

## Features

- Game selection (Gold/Silver through Legends: Z-A) — the Pokemon search only shows Pokemon obtainable in the chosen game (live from PokeAPI, cached in the browser)
- Method selection with per-game methods (Masuda, SOS chaining, mass outbreaks, etc.) plus a custom "Other" option
- Counter with a big increment button, configurable increment amount, manual set, and Space/Enter keyboard counting
- Multiple simultaneous hunts via the Hunts menu
- "Found the Shiny!" ends a hunt and adds it to your Collection, sortable by date, game, or method (both directions)
- Account login (Supabase) or guest mode (browser-only storage)

## Run it locally

```bash
npm install
npm run dev
```

Open the printed URL. Without Supabase configured, the app runs in guest mode — everything works but data stays in the browser.

## Set up accounts (Supabase)

1. Create a free account at https://supabase.com and create a new project.
2. In the project dashboard, open **SQL Editor**, paste the contents of `supabase-schema.sql`, and run it.
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public** key.
4. Copy `.env.example` to `.env` and paste both values in.
5. Restart `npm run dev`. The login screen now accepts sign-ups.

By default Supabase requires email confirmation on sign-up. To disable it while testing: **Authentication → Providers → Email → turn off "Confirm email"**.

## Deploy (free)

Vercel and Netlify both work:

1. Push this folder to a GitHub repository.
2. Import the repo on https://vercel.com (or Netlify). Vite is auto-detected.
3. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the project settings.
4. Deploy — share the URL with other hunters.

## Project structure

```
src/
  data/games.js       Game list + PokeAPI version-group mapping
  data/methods.js     Hunting methods per game
  api/pokeapi.js      Per-game Pokemon lists + sprites (cached)
  lib/supabase.js     Supabase client
  lib/storage.js      Storage layer (Supabase or localStorage for guests)
  components/         Auth, HuntsMenu, NewHunt, ActiveHunt, Collection
  App.jsx             Views, session, and hunt state
```

## Notes

- The `hunts` table uses Row Level Security — users can only ever read/write their own hunts.
- Pokemon lists come from each game's pokédexes on PokeAPI. A few event-only or transfer-only Pokemon may differ from true in-game availability.
- Gen 1 games are excluded (shinies didn't exist until Gold/Silver).
