import { useEffect, useMemo, useState } from 'react'
import { GAMES, getGame } from '../data/games'
import { getMethods } from '../data/methods'
import { getPokemonForGame, spriteUrl } from '../api/pokeapi'
import { getOdds } from '../data/odds'
import { isShinyLocked } from '../data/shinyLocks'
import ModifierControls from './ModifierControls'
import { dexStatus } from './DexTracker'

// Suggests up to 3 uncaught Pokemon from the user's owned games.
function Suggestions({ profile, hunts, onPick }) {
  const [suggestions, setSuggestions] = useState(null)
  const owned = profile?.gamesOwned || []

  useEffect(() => {
    if (owned.length === 0) return
    let cancelled = false
    async function load() {
      const { caught, inProgress } = dexStatus(hunts)
      const picks = []
      const gamePool = [...owned].sort(() => Math.random() - 0.5)
      for (const gameId of gamePool) {
        if (picks.length >= 3) break
        const game = getGame(gameId)
        if (!game) continue
        try {
          const list = await getPokemonForGame(game)
          const candidates = list.filter((p) => !caught.has(p.id) && !inProgress.has(p.id))
          if (candidates.length) {
            picks.push({ pokemon: candidates[Math.floor(Math.random() * candidates.length)], game })
          }
        } catch { /* skip on network error */ }
      }
      if (!cancelled) setSuggestions(picks)
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (owned.length === 0 || suggestions?.length === 0) return null
  return (
    <div className="suggestions">
      <label className="field-label">Suggested hunts (missing from your living dex)</label>
      {!suggestions && <p className="muted small">Finding suggestions…</p>}
      <div className="row">
        {suggestions?.map((s, i) => (
          <button key={i} className="suggestion-card" onClick={() => onPick(s.game, s.pokemon)}>
            <img src={spriteUrl(s.pokemon.id)} alt="" width="48" height="48" />
            <strong>{s.pokemon.displayName}</strong>
            <span className="muted small">{s.game.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function NewHunt({ onStart, onCancel, dexes = [], profile, hunts = [], manual = false }) {
  const [game, setGame] = useState(null)
  const [pokemonList, setPokemonList] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [search, setSearch] = useState('')
  const [pokemon, setPokemon] = useState(null)
  const [method, setMethod] = useState('')
  const [customMethod, setCustomMethod] = useState('')
  const [modifiers, setModifiers] = useState({})
  const [dexIds, setDexIds] = useState([])
  // Manual-entry fields
  const [count, setCount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [proofUrl, setProofUrl] = useState('')

  useEffect(() => {
    if (!game) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    setPokemonList([])
    setSearch('')
    getPokemonForGame(game)
      .then((list) => {
        if (!cancelled) setPokemonList(list)
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load Pokemon list. Check your connection and try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [game])

  function pickGame(g, keepPokemon = null) {
    setGame(g)
    setPokemon(keepPokemon)
    setMethod('')
    setModifiers({})
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return pokemonList
    return pokemonList.filter((p) => p.name.includes(q) || String(p.id) === q)
  }, [search, pokemonList])

  const methods = game ? getMethods(game.id) : []
  const finalMethod = method === 'Other' ? customMethod.trim() : method
  const canStart = game && pokemon && finalMethod
  const previewOdds = game && finalMethod ? getOdds(game.id, finalMethod, modifiers) : null

  function toggleDex(id) {
    setDexIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]))
  }

  function start() {
    const fields = {
      gameId: game.id,
      gameName: game.name,
      pokemonId: pokemon.id,
      pokemonName: pokemon.displayName,
      method: finalMethod,
      modifiers,
      dexIds,
    }
    if (manual) {
      fields.manualCount = parseInt(count, 10) || 0
      fields.manualDate = date
      fields.proofUrl = proofUrl.trim() || null
    }
    onStart(fields)
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>{manual ? 'Add Past Hunt' : 'New Hunt'}</h2>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>

      {manual && (
        <p className="muted small">
          Past hunts count toward your dexes and collection but not the site leaderboards.
        </p>
      )}

      {!manual && !game && (
        <Suggestions profile={profile} hunts={hunts} onPick={(g, p) => pickGame(g, p)} />
      )}

      <label className="field-label">1. Game</label>
      <div className="game-grid">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className={`game-chip ${game?.id === g.id ? 'selected' : ''}`}
            onClick={() => pickGame(g)}
          >
            {g.name}
          </button>
        ))}
      </div>

      {game && (
        <>
          <label className="field-label">2. Pokemon (available in {game.name})</label>
          {loading && <p className="muted">Loading Pokemon list…</p>}
          {loadError && <p className="error">{loadError}</p>}
          {!loading && !loadError && (
            <>
              <input
                className="input"
                type="text"
                placeholder={`Search ${pokemonList.length} Pokemon…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {pokemon && (
                <div className="selected-pokemon">
                  <img src={spriteUrl(pokemon.id)} alt="" width="48" height="48" />
                  <strong>{pokemon.displayName}</strong>
                  <span className="muted">#{pokemon.id}</span>
                </div>
              )}
              <div className="pokemon-grid">
                {filtered.slice(0, 60).map((p) => {
                  const locked = isShinyLocked(game.id, p)
                  return (
                    <button
                      key={p.id}
                      className={`pokemon-cell ${pokemon?.id === p.id ? 'selected' : ''} ${locked ? 'locked' : ''}`}
                      onClick={() => !locked && setPokemon(p)}
                      disabled={locked}
                      title={locked ? `${p.displayName} is shiny-locked in ${game.name}` : p.displayName}
                    >
                      <img src={spriteUrl(p.id)} alt={p.displayName} loading="lazy" width="56" height="56" />
                      <span>{locked ? '🔒 ' : ''}{p.displayName}</span>
                    </button>
                  )
                })}
                {filtered.length === 0 && <p className="muted">No matches.</p>}
              </div>
              <p className="muted small">🔒 = shiny-locked in this game (no way to hunt it shiny there)</p>
              {filtered.length > 60 && (
                <p className="muted">Showing first 60 — keep typing to narrow down.</p>
              )}
            </>
          )}

          <label className="field-label">3. Method</label>
          <select className="input" value={method} onChange={(e) => { setMethod(e.target.value); setModifiers({}) }}>
            <option value="">Select a method…</option>
            {methods.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {method === 'Other' && (
            <input
              className="input"
              type="text"
              placeholder="Custom method name"
              value={customMethod}
              onChange={(e) => setCustomMethod(e.target.value)}
            />
          )}

          {finalMethod && !manual && (
            <>
              <label className="field-label">
                4. Odds setup {previewOdds?.denominator ? `— ~1/${previewOdds.denominator.toLocaleString()}` : ''}
              </label>
              <ModifierControls gameId={game.id} method={finalMethod} values={modifiers} onChange={setModifiers} />
              <p className="muted small">You can change these mid-hunt too.</p>
            </>
          )}

          {dexes.length > 0 && (
            <>
              <label className="field-label">Also add to dex trackers (national is automatic)</label>
              <div className="game-grid">
                {dexes.map((d) => (
                  <button
                    key={d.id}
                    className={`game-chip ${dexIds.includes(d.id) ? 'selected' : ''}`}
                    onClick={() => toggleDex(d.id)}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </>
          )}

          {manual && (
            <>
              <label className="field-label">Encounters (if you remember)</label>
              <input className="input narrow" type="number" min="0" value={count} onChange={(e) => setCount(e.target.value)} placeholder="0" />
              <label className="field-label">Date found</label>
              <input className="input narrow" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <label className="field-label">Reaction clip link (optional)</label>
              <input className="input" type="url" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="https://youtube.com/... or https://twitch.tv/..." />
            </>
          )}
        </>
      )}

      <button className="btn primary big" disabled={!canStart} onClick={start}>
        {manual ? '✨ Add to Collection' : '✨ Start Hunt'}
      </button>
    </div>
  )
}
