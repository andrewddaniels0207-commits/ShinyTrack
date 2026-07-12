import { spriteUrl } from '../api/pokeapi'

function formatTime(totalSeconds) {
  if (!totalSeconds) return null
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// Detail popup for one or more found shinies.
// hunts: camelCase hunt objects; users: { userId: username } for profile links.
export default function ShinyModal({ title, hunts, users = {}, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn ghost small" onClick={onClose}>✕</button>
        </div>

        {hunts.map((h) => {
          const spriteId = h.evolvedIds?.length ? h.evolvedIds[h.evolvedIds.length - 1] : h.pokemonId
          const name = h.evolvedName || h.pokemonName
          const username = users[h.userId]
          const time = formatTime(h.timeSeconds)
          return (
            <div key={h.id} className="modal-shiny">
              <img
                src={spriteUrl(spriteId, true)}
                alt={name}
                width="96"
                height="96"
                onError={(e) => { e.currentTarget.src = spriteUrl(spriteId) }}
              />
              <strong>✨ {name}</strong>
              {h.evolvedName && <span className="muted small">evolved from {h.pokemonName}</span>}
              <span className="muted">{h.gameName} · {h.method}</span>
              <span className="muted">
                {(h.count ?? 0).toLocaleString()} encounters{time ? ` · ${time} hunted` : ''}
              </span>
              {h.phases?.length > 0 && (
                <span className="muted small">
                  {h.phases.length} phase{h.phases.length > 1 ? 's' : ''}: {h.phases.map((p) => p.name).join(', ')}
                </span>
              )}
              {h.manual && <span className="muted small">manually added</span>}
              {h.endDate && <span className="muted small">{new Date(h.endDate).toLocaleDateString()}</span>}
              <div className="row center-row">
                {h.proofUrl && (
                  <a className="btn" href={h.proofUrl} target="_blank" rel="noreferrer">▶ Watch reaction</a>
                )}
                {username && (
                  <a className="btn" href={`#/u/${username}`} onClick={onClose}>@{username}'s profile</a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
