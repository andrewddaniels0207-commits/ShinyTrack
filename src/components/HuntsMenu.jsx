import { spriteUrl } from '../api/pokeapi'

export default function HuntsMenu({ hunts, onOpen, onNew }) {
  const active = hunts.filter((h) => h.status === 'active')

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Active Hunts</h2>
        <button className="btn primary" onClick={onNew}>+ New Hunt</button>
      </div>

      {active.length === 0 && (
        <div className="empty">
          <p>No active hunts.</p>
          <p className="muted">Start one and good luck — may the odds be 1/1!</p>
        </div>
      )}

      <div className="hunt-list">
        {active.map((h) => (
          <button key={h.id} className="hunt-row" onClick={() => onOpen(h)}>
            <img
              src={spriteUrl(h.pokemonId, true)}
              alt=""
              width="56"
              height="56"
              onError={(e) => { e.currentTarget.src = spriteUrl(h.pokemonId) }}
            />
            <div className="hunt-row-info">
              <strong>{h.pokemonName}</strong>
              <span className="muted">{h.gameName} · {h.method}</span>
            </div>
            <div className="hunt-row-count">{h.count.toLocaleString()}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
