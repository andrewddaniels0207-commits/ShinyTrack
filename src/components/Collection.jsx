import { useMemo, useState } from 'react'
import { spriteUrl, getNextEvolutions } from '../api/pokeapi'

const SORTS = {
  date: { label: 'Date', fn: (a, b) => new Date(b.endDate) - new Date(a.endDate) },
  game: { label: 'Game', fn: (a, b) => a.gameName.localeCompare(b.gameName) },
  method: { label: 'Method', fn: (a, b) => a.method.localeCompare(b.method) },
}

function formatTime(totalSeconds) {
  if (!totalSeconds) return null
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function currentSpecies(hunt) {
  const ids = hunt.evolvedIds || []
  return {
    id: ids.length ? ids[ids.length - 1] : hunt.pokemonId,
    name: hunt.evolvedName || hunt.pokemonName,
  }
}

export default function Collection({
  hunts, onDelete, onUpdate, readOnly = false,
  favoriteHuntId = null, onSetFavorite, onAddManual,
}) {
  const [sortBy, setSortBy] = useState('date')
  const [asc, setAsc] = useState(false)

  const completed = useMemo(() => {
    const list = hunts.filter((h) => h.status === 'completed').sort(SORTS[sortBy].fn)
    return asc ? list.reverse() : list
  }, [hunts, sortBy, asc])

  async function evolve(hunt) {
    const cur = currentSpecies(hunt)
    let options
    try {
      options = await getNextEvolutions(cur.id)
    } catch {
      window.alert('Could not load evolution data. Check your connection.')
      return
    }
    if (options.length === 0) {
      window.alert(`${cur.name} can't evolve any further.`)
      return
    }
    let choice = options[0]
    if (options.length > 1) {
      const answer = window.prompt(
        `Evolve into which Pokemon?\n${options.map((o, i) => `${i + 1}. ${o.displayName}`).join('\n')}\n\nEnter a number:`
      )
      const idx = parseInt(answer, 10) - 1
      if (Number.isNaN(idx) || !options[idx]) return
      choice = options[idx]
    } else if (!window.confirm(`Evolve ${cur.name} into ${choice.displayName}?`)) {
      return
    }
    onUpdate({
      ...hunt,
      evolvedIds: [...(hunt.evolvedIds || []), choice.id],
      evolvedName: choice.displayName,
    })
  }

  function setClip(hunt) {
    const url = window.prompt(
      'Link to your reaction clip (YouTube or Twitch):',
      hunt.proofUrl || 'https://'
    )
    if (url === null) return
    onUpdate({ ...hunt, proofUrl: url.trim() || null })
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Collection <span className="muted">({completed.length})</span></h2>
        <div className="row">
          {!readOnly && onAddManual && (
            <button className="btn" onClick={onAddManual}>+ Past hunt</button>
          )}
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
        {completed.map((h) => {
          const cur = currentSpecies(h)
          const isFav = favoriteHuntId === h.id
          return (
            <div key={h.id} className={`shiny-card ${isFav ? 'favorite' : ''}`}>
              {!readOnly && onSetFavorite && (
                <button
                  className={`fav-star ${isFav ? 'active' : ''}`}
                  title={isFav ? 'Unset favorite' : 'Set as favorite shiny'}
                  onClick={() => onSetFavorite(isFav ? null : h.id)}
                >
                  {isFav ? '★' : '☆'}
                </button>
              )}
              <img
                src={spriteUrl(cur.id, true)}
                alt={cur.name}
                width="72"
                height="72"
                onError={(e) => { e.currentTarget.src = spriteUrl(cur.id) }}
              />
              <strong>✨ {cur.name}</strong>
              {h.evolvedName && <span className="muted small">evolved from {h.pokemonName}</span>}
              <span className="muted">{h.gameName}</span>
              <span className="muted">{h.method}</span>
              <span className="muted">{h.count.toLocaleString()} encounters</span>
              {formatTime(h.timeSeconds) && <span className="muted">{formatTime(h.timeSeconds)} hunted</span>}
              {h.phases?.length > 0 && <span className="muted">{h.phases.length} phase{h.phases.length > 1 ? 's' : ''}</span>}
              {h.manual && <span className="muted small">manually added</span>}
              <span className="muted small">
                {h.endDate ? new Date(h.endDate).toLocaleDateString() : ''}
              </span>
              {h.proofUrl && (
                <a className="clip-link" href={h.proofUrl} target="_blank" rel="noreferrer">
                  ▶ Watch reaction
                </a>
              )}
              {!readOnly && (
                <div className="row card-actions">
                  <button className="btn ghost small" onClick={() => evolve(h)}>Evolve</button>
                  <button className="btn ghost small" onClick={() => setClip(h)}>
                    {h.proofUrl ? 'Edit clip' : '+ Clip'}
                  </button>
                  <button
                    className="btn ghost small"
                    onClick={() => window.confirm(`Remove shiny ${cur.name} from collection?`) && onDelete(h)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
