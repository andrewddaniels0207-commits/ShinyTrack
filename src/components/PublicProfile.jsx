import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { spriteUrl } from '../api/pokeapi'
import Collection, { currentSpecies } from './Collection'

function fromRow(r) {
  return {
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
    proofUrl: r.proof_url || null,
    manual: r.manual || false,
    evolvedIds: r.evolved_ids || [],
    evolvedName: r.evolved_name || null,
  }
}

const SOCIAL_LABELS = { youtube: 'YouTube', twitch: 'Twitch', twitter: 'X / Twitter' }

export default function PublicProfile({ username }) {
  const [state, setState] = useState({ loading: true, hunts: null, profile: null, error: null })

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase) {
        setState({ loading: false, hunts: null, profile: null, error: 'Profiles are not available.' })
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, socials, favorite_hunt_id')
        .eq('username', username.toLowerCase())
        .eq('is_public', true)
        .maybeSingle()
      if (cancelled) return
      if (!profile) {
        setState({ loading: false, hunts: null, profile: null, error: 'Profile not found or not public.' })
        return
      }
      const { data: rows, error } = await supabase
        .from('hunts')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'completed')
      if (cancelled) return
      if (error) {
        setState({ loading: false, hunts: null, profile: null, error: error.message })
        return
      }
      setState({ loading: false, hunts: rows.map(fromRow), profile, error: null })
    }
    load()
    return () => { cancelled = true }
  }, [username])

  const { profile, hunts } = state
  const favorite = hunts?.find((h) => h.id === profile?.favorite_hunt_id)
  const socials = Object.entries(profile?.socials || {}).filter(([, v]) => v)

  return (
    <div className="app">
      <nav className="nav">
        <span className="logo">✨ {username}'s Shiny Collection</span>
        <a className="btn ghost" href="#/">← ShinyTrack</a>
      </nav>

      {state.loading && <p className="muted center">Loading…</p>}
      {state.error && <p className="error center">{state.error}</p>}

      {socials.length > 0 && (
        <div className="panel">
          <div className="row">
            {socials.map(([key, url]) => (
              <a key={key} className="btn" href={url} target="_blank" rel="noreferrer">
                {SOCIAL_LABELS[key] || key} ↗
              </a>
            ))}
          </div>
        </div>
      )}

      {favorite && (
        <div className="panel favorite-panel">
          <label className="field-label">★ Favorite Shiny</label>
          <div className="hunt-row static">
            <img
              src={spriteUrl(currentSpecies(favorite).id, true)}
              alt=""
              width="72"
              height="72"
              onError={(e) => { e.currentTarget.src = spriteUrl(currentSpecies(favorite).id) }}
            />
            <div className="hunt-row-info">
              <strong>✨ {currentSpecies(favorite).name}</strong>
              <span className="muted small">
                {favorite.gameName} · {favorite.method} · {favorite.count.toLocaleString()} encounters
              </span>
              {favorite.proofUrl && (
                <a className="clip-link" href={favorite.proofUrl} target="_blank" rel="noreferrer">▶ Watch reaction</a>
              )}
            </div>
          </div>
        </div>
      )}

      {hunts && <Collection hunts={hunts} readOnly favoriteHuntId={profile?.favorite_hunt_id} />}
    </div>
  )
}
