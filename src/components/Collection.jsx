import { useMemo, useState } from 'react'
import { spriteUrl } from '../api/pokeapi'

const SORTS = {
  date: { label: 'Date', fn: (a, b) => new Date(b.endDate) - new Date(a.endDate) },
  game: { label: 'Game', fn: (a, b) => a.gameName.localeCompare(b.gameName) },
  method: { label: 'Method', fn: (a, b) => a.method.localeCompare(b.method) },
}

export default function Collection({ hunts, onDelete }) {
  const [sortBy, setSortBy] = useState('date')
  const [asc, setAsc] = useState(false)

  const completed = useMemo(() => {
    const list = hunts.filter((h) => h.status === 'completed').sort(SORTS[sortBy].fn)
    return asc ? list.reverse() : list
  }, [hunts, sortBy, asc])

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Collection <span className="muted">({completed.length})</span></h2>
        <div className="row">
          <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {Object.entries(SORTS).map(([key, s]) => (
              <option key={key} value={key}>Sort: {s.label}</option>
            ))}
          </select>
          <button className="btn" onClick={() => setAsc(!asc)} title="Reverse order">
            {asc ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {completed.length === 0 && (
        <div className="empty">
          <p>No shinies yet.</p>
          <p className="muted">Complete a hunt and it will appear here.</p>
        </div>
      )}

      <div className="collection-grid">
        {completed.map((h) => (
          <div key={h.id} className="shiny-card">
            <img
              src={spriteUrl(h.pokemonId, true)}
              alt={h.pokemonName}
              width="72"
              height="72"
              onError={(e) => { e.currentTarget.src = spriteUrl(h.pokemonId) }}
            />
            <strong>✨ {h.pokemonName}</strong>
            <span className="muted">{h.gameName}</span>
            <span className="muted">{h.method}</span>
            <span className="muted">{h.count.toLocaleString()} encounters</span>
            <span className="muted small">
              {h.endDate ? new Date(h.endDate).toLocaleDateString() : ''}
            </span>
            <button
              className="btn ghost small"
              onClick={() => window.confirm(`Remove shiny ${h.pokemonName} from collection?`) && onDelete(h)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
