import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { getStore, newHuntId } from './lib/storage'
import Auth from './components/Auth'
import HuntsMenu from './components/HuntsMenu'
import NewHunt from './components/NewHunt'
import ActiveHunt from './components/ActiveHunt'
import Collection from './components/Collection'
import ProfileSettings from './components/ProfileSettings'
import PublicProfile from './components/PublicProfile'

function parseRoute() {
  const m = window.location.hash.match(/^#\/u\/([a-zA-Z0-9_-]+)/)
  return m ? { publicUser: m[1] } : {}
}

export default function App() {
  const [route, setRoute] = useState(parseRoute())

  useEffect(() => {
    const onHash = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const [session, setSession] = useState(null)
  const [guest, setGuest] = useState(false)
  const [authReady, setAuthReady] = useState(!supabase)
  const [hunts, setHunts] = useState([])
  const [view, setView] = useState('hunts') // 'hunts' | 'new' | 'hunt' | 'collection'
  const [openHuntId, setOpenHuntId] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const user = session?.user ?? null
  const loggedIn = Boolean(user) || guest
  const store = getStore(user)

  const refresh = useCallback(async () => {
    try {
      setHunts(await store.list())
      setError(null)
    } catch (e) {
      setError(`Could not load hunts: ${e.message}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, guest])

  useEffect(() => {
    if (loggedIn) refresh()
  }, [loggedIn, refresh])

  async function save(hunt) {
    setHunts((prev) => {
      const i = prev.findIndex((h) => h.id === hunt.id)
      if (i >= 0) {
        const next = [...prev]
        next[i] = hunt
        return next
      }
      return [hunt, ...prev]
    })
    try {
      await store.upsert(hunt)
    } catch (e) {
      setError(`Save failed: ${e.message}`)
    }
  }

  async function remove(hunt) {
    setHunts((prev) => prev.filter((h) => h.id !== hunt.id))
    if (openHuntId === hunt.id) {
      setOpenHuntId(null)
      setView('hunts')
    }
    try {
      await store.remove(hunt.id)
    } catch (e) {
      setError(`Delete failed: ${e.message}`)
    }
  }

  function startHunt(fields) {
    const hunt = {
      id: newHuntId(),
      ...fields,
      count: 0,
      increment: 1,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: null,
      charm: false,
      timeSeconds: 0,
      phases: [],
    }
    save(hunt)
    setOpenHuntId(hunt.id)
    setView('hunt')
  }

  function completeHunt(hunt) {
    save({ ...hunt, status: 'completed', endDate: new Date().toISOString() })
    setOpenHuntId(null)
    setView('collection')
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut()
    setGuest(false)
    setHunts([])
    setView('hunts')
  }

  // Public profile pages work for everyone, logged in or not.
  if (route.publicUser) {
    return <PublicProfile username={route.publicUser} />
  }

  if (!authReady) return <div className="app center-screen muted">Loading…</div>

  if (!loggedIn) {
    return (
      <div className="app">
        <Auth onGuest={() => setGuest(true)} />
      </div>
    )
  }

  const openHunt = hunts.find((h) => h.id === openHuntId)

  return (
    <div className="app">
      <nav className="nav">
        <span className="logo">✨ Shiny Hunt Tracker</span>
        <div className="row">
          <button
            className={`btn ghost ${view !== 'collection' ? 'active' : ''}`}
            onClick={() => { setView('hunts'); setOpenHuntId(null) }}
          >
            Hunts
          </button>
          <button
            className={`btn ghost ${view === 'collection' ? 'active' : ''}`}
            onClick={() => setView('collection')}
          >
            Collection
          </button>
          {user && (
            <button
              className={`btn ghost ${view === 'profile' ? 'active' : ''}`}
              onClick={() => setView('profile')}
            >
              Profile
            </button>
          )}
          <button className="btn ghost muted" onClick={logout} title={user?.email || 'Guest'}>
            {guest ? 'Guest · Exit' : 'Log out'}
          </button>
        </div>
      </nav>

      {error && <p className="error banner">{error}</p>}
      {guest && (
        <p className="notice banner">
          Guest mode — hunts are saved in this browser only. Log in to sync across devices.
        </p>
      )}

      {view === 'hunts' && (
        <HuntsMenu
          hunts={hunts}
          onOpen={(h) => { setOpenHuntId(h.id); setView('hunt') }}
          onNew={() => setView('new')}
        />
      )}
      {view === 'new' && <NewHunt onStart={startHunt} onCancel={() => setView('hunts')} />}
      {view === 'hunt' && openHunt && (
        <ActiveHunt
          hunt={openHunt}
          onUpdate={save}
          onComplete={completeHunt}
          onDelete={remove}
          onBack={(updated) => { if (updated !== openHunt) save(updated); setView('hunts'); setOpenHuntId(null) }}
        />
      )}
      {view === 'collection' && <Collection hunts={hunts} onDelete={remove} />}
      {view === 'profile' && user && (
        <ProfileSettings user={user} onClose={() => setView('hunts')} />
      )}
    </div>
  )
}
