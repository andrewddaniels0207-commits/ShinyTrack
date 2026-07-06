import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { spriteUrl } from '../api/pokeapi'
import { SITE } from '../data/site'
import { NEWS } from '../data/news'

// Fetches recent completed hunts visible to everyone (public profiles only),
// with usernames attached. Shared with the History page.
export async function fetchGlobalShinies(limit = 300) {
  if (!supabase) return { hunts: [], users: {} }
  const { data: rows, error } = await supabase
    .from('hunts')
    .select('id, user_id, pokemon_id, pokemon_name, game_id, game_name, method, count, end_date, manual, evolved_name, evolved_ids')
    .eq('status', 'completed')
    .order('end_date', { ascending: false })
    .limit(limit)
  if (error || !rows) return { hunts: [], users: {} }
  const userIds = [...new Set(rows.map((r) => r.user_id))]
  const users = {}
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds)
      .eq('is_public', true)
    for (const p of profiles || []) users[p.id] = p.username
  }
  return { hunts: rows, users }
}

export default function Home({ loggedIn, onNavigate }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchGlobalShinies().then(setData)
  }, [])

  const nonManual = useMemo(
    () => (data?.hunts || []).filter((h) => !h.manual),
    [data]
  )

  const recent = nonManual.slice(0, 5)

  const leaderboard = useMemo(() => {
    const counts = new Map()
    for (const h of nonManual) {
      const key = h.pokemon_name
      const e = counts.get(key) || { name: h.pokemon_name, id: h.pokemon_id, count: 0 }
      e.count += 1
      counts.set(key, e)
    }
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 10)
  }, [nonManual])

  return (
    <>
      <div className="panel hero">
        <h1 className="logo">✨ {SITE.name}</h1>
        <p className="muted">Track your shiny hunts. Build your living dex. Show off your collection.</p>
        {!loggedIn && (
          <button className="btn shiny" onClick={() => onNavigate('hunts')}>
            Get Started — It's Free
          </button>
        )}
      </div>

      <div className="panel">
        <h2>📰 News & Updates</h2>
        {NEWS.map((n, i) => (
          <div key={i} className="news-item">
            <strong>{n.title}</strong>
            <span className="muted small">{new Date(n.date + 'T00:00').toLocaleDateString()}</span>
            <p className="muted">{n.body}</p>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>🕑 Latest Shinies</h2>
          <button className="btn ghost" title="Full shiny history" onClick={() => onNavigate('history')}>⋯</button>
        </div>
        {!data && <p className="muted">Loading…</p>}
        {data && recent.length === 0 && <p className="muted">No shinies registered yet — be the first!</p>}
        <div className="hunt-list">
          {recent.map((h) => {
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
                    {h.game_name} · {h.count.toLocaleString()} encounters ·{' '}
                    {username ? (
                      <a href={`#/u/${username}`}>{username}</a>
                    ) : (
                      'anonymous hunter'
                    )}
                  </span>
                </div>
                <span className="muted small">{h.end_date ? new Date(h.end_date).toLocaleDateString() : ''}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="panel">
        <h2>🏆 Most Hunted Shinies</h2>
        {data && leaderboard.length === 0 && <p className="muted">Leaderboard appears once shinies are registered.</p>}
        <div className="leaderboard">
          {leaderboard.map((e, i) => (
            <div key={e.name} className="leader-row">
              <span className="leader-rank">#{i + 1}</span>
              <img src={spriteUrl(e.id, true)} alt="" width="40" height="40"
                onError={(ev) => { ev.currentTarget.src = spriteUrl(e.id) }} />
              <strong>{e.name}</strong>
              <span className="leader-count">{e.count}×</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>💬 Community & Support</h2>
        <div className="row">
          <a className="btn" href={SITE.discordUrl} target="_blank" rel="noreferrer">Join the Discord</a>
          <a className="btn" href={SITE.twitchUrl} target="_blank" rel="noreferrer">Twitch</a>
          <a className="btn" href={SITE.youtubeUrl} target="_blank" rel="noreferrer">YouTube</a>
        </div>
        <p className="muted small">Enjoying {SITE.name}? Following the channels above is the best way to support the site.</p>
      </div>
    </>
  )
}
