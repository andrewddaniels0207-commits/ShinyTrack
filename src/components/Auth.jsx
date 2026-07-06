import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth({ onGuest }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setMessage(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage({ ok: true, text: 'Account created! Check your email to confirm, then log in.' })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setMessage({ ok: false, text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel auth">
      <h1 className="logo">✨ Shiny Hunt Tracker</h1>
      <p className="muted center">Track your hunts. Build your collection.</p>

      {supabase ? (
        <form onSubmit={submit}>
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          {message && <p className={message.ok ? 'success' : 'error'}>{message.text}</p>}
          <button className="btn primary big" type="submit" disabled={busy}>
            {busy ? '…' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
          <button
            type="button"
            className="btn ghost big"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(null) }}
          >
            {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
          </button>
        </form>
      ) : (
        <p className="error center">
          Supabase is not configured — accounts are disabled. Copy .env.example to .env
          and add your project keys to enable logins.
        </p>
      )}

      <button className="btn ghost big" onClick={onGuest}>
        Continue as guest (saves to this browser only)
      </button>
    </div>
  )
}
