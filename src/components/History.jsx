import { useEffect, useMemo, useState } from 'react'
import { GAMES } from '../data/games'
import { spriteUrl } from '../api/pokeapi'
import { fetchGlobalShinies } from './Home'

const DATE_RANGES = {
  all: { label: 'All time', days: null },
  week: { label: 'This week', days: 7 },
  month: { label: 'Last 30 days', days: 30 },
  quarter: { label: 'Last 3 months', days: 91 },
  half: { label: 'Last 6 months', days: 182 },
  year: { label: 'Last year', days: 365 },
}

export default function History() {
  const [data, setData] = useState(null)
  const [range, setRange] = useState('all')
  const [gameId, setGameId] = useState('')
  const [userQuery, setUserQuery] = useState('')

  useEffect(() => {
    fetchGlobalShinies(500).then(setData)
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    let list = data.hunts.filter((h) => !h.manual)
    const days = DATE_RANGES[range].days
    if (days) {
      const cutoff = Date.now() - days * 86400000
      list = list.filter((h) => h.end_date && new Date(h.end_date).getTime() >= cutoff)
    }
    if (gameId) list = list.filter((h) => h.game_id === gameId)
    const q = userQuery.trim().toLowerCase()
    if (q) list = list.filter((h) => (data.users[h.user_id] || '').toLowerCase().includes(q))
    return list
  }, [data, range, gameId, userQuery])

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Shiny History <span className="muted">({filtered.length})</span></h2>
      </div>

      <div className="row">
        <select className="input" value={range} onChange={(e) => setRange(e.target.value)}>
          {Object.entries(DATE_RANGES).map(([k, r]) => (
            <option key={k} value={k}>{r.label}</option>
          ))}
        </select>
        <select className="input" value={gameId} onChange={(e) => setGameId(e.target.value)}>
          <option value="">All games</option>
          {GAMES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input
          className="input narrow"
          type="text"
          placeholder="Search user…"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
        />
      </div>

      {!data && <p className="muted">Loading…</p>}
      {data && filtered.length === 0 && <p className="muted">No shinies match these filters.</p>}

      <div className="hunt-list">
        {filtered.map((h) => {
          const username = data.users[h.user_id]
          const name = h.evolved_name || h.pokemon_name
          const spriteId = h.evolved_ids?.length ? h.evolved_ids[h.evolved_ids.length - 1] : h.pokemon_id
          return (
            <div key={h.id} className="hunt-row static">
              <img src={spriteUrl(spriteId, true)} alt="" width="48" height="48"
                onError={(e) => { e.currentTarget.src = spriteUrl(spriteId) }} />
              <div className="hunt-row-info">
                <strong>✨ {name}</strong>
                <span className="muted small">
                  {h.game_name} · {h.method} · {h.count.toLocaleString()} encounters ·{' '}
                  {username ? <a href={`#/u/${username}`}>{username}</a> : 'anonymous hunter'}
                </span>
              </div>
              <span className="muted small">{h.end_date ? new Date(h.end_date).toLocaleDateString() : ''}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
