import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { GAMES } from '../data/games'

export default function ProfileSettings({ user, onClose, onSaved }) {
  const [username, setUsername] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [socials, setSocials] = useState({ youtube: '', twitch: '', twitter: '' })
  const [gamesOwned, setGamesOwned] = useState([])
  const [saved, setSaved] = useState(false)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setUsername(data.username || '')
          setIsPublic(data.is_public)
          setSocials({ youtube: '', twitch: '', twitter: '', ...(data.socials || {}) })
          setGamesOwned(data.games_owned || [])
          setSaved(true)
        }
      })
  }, [user.id])

  function toggleGame(id) {
    setGamesOwned((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
  }

  async function save() {
    const name = username.trim().toLowerCase()
    if (!/^[a-z0-9_-]{3,20}$/.test(name)) {
      setMessage({ ok: false, text: 'Username must be 3-20 characters: letters, numbers, - or _' })
      return
    }
    setBusy(true)
    setMessage(null)
    const cleanSocials = Object.fromEntries(
      Object.entries(socials).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v)
    )
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username: name,
      is_public: isPublic,
      socials: cleanSocials,
      games_owned: gamesOwned,
    })
    setBusy(false)
    if (error) {
      setMessage({
        ok: false,
        text: error.code === '23505' ? 'That username is taken.' : error.message,
      })
    } else {
      setUsername(name)
      setSaved(true)
      setMessage({ ok: true, text: 'Profile saved.' })
      onSaved?.()
    }
  }

  const link = `${window.location.origin}/#/u/${username}`

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Profile</h2>
        <button className="btn ghost" onClick={onClose}>Close</button>
      </div>

      <label className="field-label">Username</label>
      <input
        className="input"
        type="text"
        placeholder="e.g. andrew"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <label className="charm-toggle">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        Make my profile public (required to appear on leaderboards and share your collection)
      </label>

      <label className="field-label">Social links (shown on your public profile)</label>
      <input className="input" type="url" placeholder="YouTube channel URL"
        value={socials.youtube} onChange={(e) => setSocials({ ...socials, youtube: e.target.value })} />
      <input className="input" type="url" placeholder="Twitch channel URL"
        value={socials.twitch} onChange={(e) => setSocials({ ...socials, twitch: e.target.value })} />
      <input className="input" type="url" placeholder="X / Twitter URL"
        value={socials.twitter} onChange={(e) => setSocials({ ...socials, twitter: e.target.value })} />

      <label className="field-label">Games I own (used for hunt suggestions)</label>
      <div className="game-grid">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className={`game-chip ${gamesOwned.includes(g.id) ? 'selected' : ''}`}
            onClick={() => toggleGame(g.id)}
          >
            {g.name}
          </button>
        ))}
      </div>

      {message && <p className={message.ok ? 'success' : 'error'}>{message.text}</p>}

      <button className="btn primary big" onClick={save} disabled={busy}>
        {busy ? '…' : 'Save Profile'}
      </button>

      {saved && isPublic && username && (
        <>
          <label className="field-label">Your share link</label>
          <div className="row">
            <input className="input" readOnly value={link} onFocus={(e) => e.target.select()} />
            <button
              className="btn"
              onClick={() => navigator.clipboard?.writeText(link).then(() => setMessage({ ok: true, text: 'Link copied!' }))}
            >
              Copy
            </button>
          </div>
          <p className="muted small">Tip: set your favorite shiny with the ☆ star on any Collection card.</p>
        </>
      )}
    </div>
  )
}
