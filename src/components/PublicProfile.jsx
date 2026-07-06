import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Collection from './Collection'

export default function PublicProfile({ username }) {
  const [state, setState] = useState({ loading: true, hunts: null, error: null })

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase) {
        setState({ loading: false, hunts: null, error: 'Profiles are not available.' })
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', username.toLowerCase())
        .eq('is_public', true)
        .maybeSingle()
      if (cancelled) return
      if (!profile) {
        setState({ loading: false, hunts: null, error: 'Profile not found or not public.' })
        return
      }
      const { data: rows, error } = await supabase
        .from('hunts')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'completed')
      if (cancelled) return
      if (error) {
        setState({ loading: false, hunts: null, error: error.message })
        return
      }
      const hunts = rows.map((r) => ({
        id: r.id,
        pokemonId: r.pokemon_id,
        pokemonName: r.pokemon_name,
        gameId: r.game_id,
        gameName: r.game_name,
        method: r.method,
        count: r.count,
        status: r.status,
        endDate: r.end_date,
        phases: r.phases || [],
        timeSeconds: r.time_seconds || 0,
      }))
      setState({ loading: false, hunts, error: null })
    }
    load()
    return () => { cancelled = true }
  }, [username])

  return (
    <div className="app">
      <nav className="nav">
        <span className="logo">✨ {username}'s Shiny Collection</span>
        <a className="btn ghost" href="#/">Shiny Hunt Tracker →</a>
      </nav>
      {state.loading && <p className="muted center">Loading…</p>}
      {state.error && <p className="error center">{state.error}</p>}
      {state.hunts && <Collection hunts={state.hunts} readOnly />}
    </div>
  )
}
