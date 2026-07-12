import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { spriteUrl } from '../api/pokeapi'
import { SITE } from '../data/site'
import { NEWS } from '../data/news'
import ShinyModal from './ShinyModal'

// Convert a raw hunts row to the camelCase shape ShinyModal expects.
export function rowToHunt(r) {
  return {
    id: r.id,
    userId: r.user_id,
    pokemonId: r.pokemon_id,
    pokemonName: r.pokemon_name,
    gameName: r.game_name,
    method: r.method,
    count: r.count,
    endDate: r.end_date,
    manual: r.manual,
    evolvedIds: r.evolved_ids || [],
    evolvedName: r.evolved_name,
    proofUrl: r.proof_url,
    timeSeconds: r.time_seconds,
    phases: r.phases || [],
  }
}

// Fetches recent completed hunts visible to everyone (public profiles only),
// with usernames attached. Shared with the History page.
export async function fetchGlobalShinies(limit = 300) {
  if (!supabase) return { hunts: [], users: {} }
  const { data: rows, error } = await supabase
    .from('hunts')
    .select('id, user_id, pokemon_id, pokemon_name, game_id, game_name, method, count, end_date, manual, evolved_name, evolved_ids, proof_url, time_seconds, phases')
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
  const [modal, setModal] = useState(null) // { title, hunts }

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
              <div
                key={h.id}
                className="hunt-row"
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  if (e.target.closest('a')) return
                  setModal({ title: `✨ ${name}`, hunts: [rowToHunt(h)] })
                }}
              >
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
            <button
              key={e.name}
              className="leader-row clickable"
              onClick={() =>
                setModal({
                  title: `${e.name} — found ${e.count}× on ShinyTrack`,
                  hunts: nonManual.filter((h) => h.pokemon_name === e.name).slice(0, 10).map(rowToHunt),
                })
              }
            >
              <span className="leader-rank">#{i + 1}</span>
              <img src={spriteUrl(e.id, true)} alt="" width="40" height="40"
                onError={(ev) => { ev.currentTarget.src = spriteUrl(e.id) }} />
              <strong>{e.name}</strong>
              <span className="leader-count">{e.count}×</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>💬 Community & Support</h2>
        <div className="row social-row">
          <a className="social-btn discord" href={SITE.discordUrl} target="_blank" rel="noreferrer" aria-label="Join the Discord">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
            </svg>
            Discord
          </a>
          <a className="social-btn twitch" href={SITE.twitchUrl} target="_blank" rel="noreferrer" aria-label="Twitch channel">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
            </svg>
            Twitch
          </a>
          <a className="social-btn youtube" href={SITE.youtubeUrl} target="_blank" rel="noreferrer" aria-label="YouTube channel">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
              <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="var(--panel, #fff)" />
            </svg>
            YouTube
          </a>
        </div>
        <p className="muted small">Enjoying {SITE.name}? Following the channels above is the best way to support the site.</p>
      </div>

      {modal && (
        <ShinyModal title={modal.title} hunts={modal.hunts} users={data?.users || {}} onClose={() => setModal(null)} />
      )}
    </>
  )
}
