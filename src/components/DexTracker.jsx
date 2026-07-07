import { useEffect, useMemo, useState } from 'react'
import { GAMES, getGame } from '../data/games'
import { getNationalDex, getPokemonForGame, spriteUrl } from '../api/pokeapi'
import { newHuntId } from '../lib/storage'

// Caught = any completed hunt (including manual entries and evolutions).
// In progress = any active hunt.
export function dexStatus(hunts, dexId = null) {
  const caught = new Set()
  const inProgress = new Set()
  for (const h of hunts) {
    // Custom dexes only count hunts assigned to them; national counts everything.
    if (dexId && !(h.dexIds || []).includes(dexId)) continue
    if (h.status === 'completed') {
      caught.add(h.pokemonId)
      for (const id of h.evolvedIds || []) caught.add(id)
    } else if (h.status === 'active') {
      inProgress.add(h.pokemonId)
    }
  }
  return { caught, inProgress }
}

export default function DexTracker({ hunts, dexes, onCreateDex, onDeleteDex }) {
  const [selected, setSelected] = useState('national') // 'national' | dex.id
  const [species, setSpecies] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGame, setNewGame] = useState('')
  const [hideCaught, setHideCaught] = useState(false)

  const currentDex = dexes.find((d) => d.id === selected)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const promise = currentDex?.gameId
      ? getPokemonForGame(getGame(currentDex.gameId))
      : getNationalDex()
    promise
      .then((list) => { if (!cancelled) setSpecies(list) })
      .catch(() => { if (!cancelled) setSpecies([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selected, currentDex?.gameId])

  const { caught, inProgress } = useMemo(
    () => dexStatus(hunts, selected === 'national' ? null : selected),
    [hunts, selected]
  )

  const caughtCount = species.filter((p) => caught.has(p.id)).length
  const shown = hideCaught ? species.filter((p) => !caught.has(p.id)) : species

  function create() {
    const name = newName.trim()
    if (!name) return
    onCreateDex({ id: newHuntId(), name, gameId: newGame || null })
    setCreating(false)
    setNewName('')
    setNewGame('')
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Shiny Dex Trackers</h2>
        <button className="btn" onClick={() => setCreating(!creating)}>+ New Dex</button>
      </div>

      {creating && (
        <div className="settings">
          <label className="field-label">Dex name</label>
          <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Kanto Living Dex" />
          <label className="field-label">Tied to a game (optional)</label>
          <select className="input" value={newGame} onChange={(e) => setNewGame(e.target.value)}>
            <option value="">All Pokemon (national)</option>
            {GAMES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <button className="btn primary" onClick={create}>Create Dex</button>
        </div>
      )}

      <div className="game-grid" style={{ marginBottom: 12 }}>
        <button
          className={`game-chip ${selected === 'national' ? 'selected' : ''}`}
          onClick={() => setSelected('national')}
        >
          ✨ National Living Dex
        </button>
        {dexes.map((d) => (
          <button
            key={d.id}
            className={`game-chip ${selected === d.id ? 'selected' : ''}`}
            onClick={() => setSelected(d.id)}
          >
            {d.name}
          </button>
        ))}
      </div>

      {currentDex && (
        <p className="muted small">
          {currentDex.gameId ? `Tied to ${getGame(currentDex.gameId)?.name}` : 'All Pokemon'} — counts hunts assigned to this dex.{' '}
          <button
            className="btn ghost small danger"
            onClick={() => window.confirm(`Delete dex "${currentDex.name}"? Hunts are kept.`) && (setSelected('national'), onDeleteDex(currentDex))}
          >
            Delete dex
          </button>
        </p>
      )}

      {loading ? (
        <p className="muted">Loading Pokemon…</p>
      ) : (
        <>
          <div className="dex-progress">
            <strong>{caughtCount} / {species.length}</strong>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${species.length ? (caughtCount / species.length) * 100 : 0}%` }} />
            </div>
            <label className="charm-toggle">
              <input type="checkbox" checked={hideCaught} onChange={(e) => setHideCaught(e.target.checked)} />
              Hide caught
            </label>
          </div>

          <div className="pokemon-grid dex-grid">
            {shown.map((p) => {
              const isCaught = caught.has(p.id)
              const isActive = inProgress.has(p.id)
              return (
                <div
                  key={p.id}
                  className={`pokemon-cell ${isCaught ? 'dex-caught' : isActive ? 'dex-progressing' : 'dex-missing'}`}
                  title={`${p.displayName}${isCaught ? ' — caught!' : isActive ? ' — hunt in progress' : ''}`}
                >
                  <img src={spriteUrl(p.id, isCaught)} alt={p.displayName} loading="lazy" width="80" height="80" />
                  <span>{isCaught ? '✨ ' : isActive ? '⏳ ' : ''}{p.displayName}</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
