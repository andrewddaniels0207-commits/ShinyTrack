import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ProfileSettings({ user, onClose }) {
  const [username, setUsername] = useState('')
  const [isPublic, setIsPublic] = useState(false)
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
          setSaved(true)
        }
      })
  }, [user.id])

  async function save() {
    const name = username.trim().toLowerCase()
    if (!/^[a-z0-9_-]{3,20}$/.test(name)) {
      setMessage({ ok: false, text: 'Username must be 3-20 characters: letters, numbers, - or _' })
      return
    }
    setBusy(true)
    setMessage(null)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: name, is_public: isPublic })
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
    }
  }

  const link = `${window.location.origin}/#/u/${username}`

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Public Profile</h2>
        <button className="btn ghost" onClick={onClose}>Close</button>
      </div>

      <p className="muted">
        Pick a username and make your profile public to share your shiny collection with anyone.
      </p>

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
        Make my collection public
      </label>

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
        </>
      )}
    </div>
  )
}
