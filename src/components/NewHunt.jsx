import { useEffect, useMemo, useState } from 'react'
import { GAMES } from '../data/games'
import { getMethods } from '../data/methods'
import { getPokemonForGame, spriteUrl } from '../api/pokeapi'

export default function NewHunt({ onStart, onCancel }) {
  const [game, setGame] = useState(null)
  const [pokemonList, setPokemonList] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [search, setSearch] = useState('')
  const [pokemon, setPokemon] = useState(null)
  const [method, setMethod] = useState('')
  const [customMethod, setCustomMethod] = useState('')

  useEffect(() => {
    if (!game) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    setPokemonList([])
    setPokemon(null)
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
    return () => {
      cancelled = true
    }
  }, [game])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return pokemonList
    return pokemonList.filter(
      (p) => p.name.includes(q) || String(p.id) === q
    )
  }, [search, pokemonList])

  const methods = game ? getMethods(game.id) : []
  const finalMethod = method === 'Other' ? customMethod.trim() : method
  const canStart = game && pokemon && finalMethod

  function start() {
    onStart({
      gameId: game.id,
      gameName: game.name,
      pokemonId: pokemon.id,
      pokemonName: pokemon.displayName,
      method: finalMethod,
    })
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>New Hunt</h2>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>

      <label className="field-label">1. Game</label>
      <div className="game-grid">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className={`game-chip ${game?.id === g.id ? 'selected' : ''}`}
            onClick={() => setGame(g)}
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
                {filtered.slice(0, 60).map((p) => (
                  <button
                    key={p.id}
                    className={`pokemon-cell ${pokemon?.id === p.id ? 'selected' : ''}`}
                    onClick={() => setPokemon(p)}
                    title={p.displayName}
                  >
                    <img src={spriteUrl(p.id)} alt={p.displayName} loading="lazy" width="56" height="56" />
                    <span>{p.displayName}</span>
                  </button>
                ))}
                {filtered.length === 0 && <p className="muted">No matches.</p>}
              </div>
              {filtered.length > 60 && (
                <p className="muted">Showing first 60 — keep typing to narrow down.</p>
              )}
            </>
          )}

          <label className="field-label">3. Method</label>
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
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
        </>
      )}

      <button className="btn primary big" disabled={!canStart} onClick={start}>
        ✨ Start Hunt
      </button>
    </div>
  )
}
