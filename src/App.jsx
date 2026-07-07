import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { getStore, getDexStore, newHuntId } from './lib/storage'
import { SITE } from './data/site'
import Auth from './components/Auth'
import Home from './components/Home'
import HuntsMenu from './components/HuntsMenu'
import NewHunt from './components/NewHunt'
import ActiveHunt from './components/ActiveHunt'
import Collection from './components/Collection'
import DexTracker from './components/DexTracker'
import History from './components/History'
import Tutorials from './components/Tutorials'
import ProfileSettings from './components/ProfileSettings'
import PublicProfile from './components/PublicProfile'

const PUBLIC_VIEWS = new Set(['home', 'history', 'tutorials'])

function parseRoute() {
  const hash = window.location.hash
  const user = hash.match(/^#\/u\/([a-zA-Z0-9_-]+)/)
  if (user) return { view: 'public', publicUser: user[1] }
  const page = hash.match(/^#\/([a-z]+)/)
  return { view: page ? page[1] : 'home' }
}

export default function App() {
  const [route, setRoute] = useState(parseRoute())
  const [session, setSession] = useState(null)
  const [guest, setGuest] = useState(false)
  const [authReady, setAuthReady] = useState(!supabase)
  const [hunts, setHunts] = useState([])
  const [dexes, setDexes] = useState([])
  const [profile, setProfile] = useState(null)
  const [openHuntId, setOpenHuntId] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const onHash = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

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
  const dexStore = getDexStore(user)

  function navigate(view) {
    window.location.hash = `#/${view}`
    setOpenHuntId(null)
  }

  const loadProfile = useCallback(async () => {
    if (!user || !supabase) {
      setProfile(null)
      return
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    setProfile(
      data
        ? {
            username: data.username,
            isPublic: data.is_public,
            socials: data.socials || {},
            gamesOwned: data.games_owned || [],
            favoriteHuntId: data.favorite_hunt_id || null,
          }
        : null
    )
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(async () => {
    try {
      const [h, d] = await Promise.all([store.list(), dexStore.list()])
      setHunts(h)
      setDexes(d)
      setError(null)
    } catch (e) {
      setError(`Could not load your data: ${e.message}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, guest])

  useEffect(() => {
    if (loggedIn) {
      refresh()
      loadProfile()
    }
  }, [loggedIn, refresh, loadProfile])

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
    if (openHuntId === hunt.id) setOpenHuntId(null)
    try {
      await store.remove(hunt.id)
    } catch (e) {
      setError(`Delete failed: ${e.message}`)
    }
  }

  function baseHunt(fields) {
    return {
      id: newHuntId(),
      ...fields,
      increment: 1,
      charm: false,
      timeSeconds: 0,
      phases: [],
      combo: 0,
      proofUrl: fields.proofUrl || null,
      manual: false,
      evolvedIds: [],
      evolvedName: null,
    }
  }

  function startHunt(fields) {
    const hunt = {
      ...baseHunt(fields),
      count: 0,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: null,
    }
    save(hunt)
    setOpenHuntId(hunt.id)
    navigate('hunts')
    setOpenHuntId(hunt.id)
  }

  function addManualHunt(fields) {
    const when = fields.manualDate ? new Date(fields.manualDate + 'T12:00') : new Date()
    const hunt = {
      ...baseHunt(fields),
      count: fields.manualCount || 0,
      status: 'completed',
      manual: true,
      startDate: when.toISOString(),
      endDate: when.toISOString(),
    }
    delete hunt.manualCount
    delete hunt.manualDate
    save(hunt)
    navigate('collection')
  }

  async function setFavorite(huntId) {
    if (!user || !supabase) return
    setProfile((p) => (p ? { ...p, favoriteHuntId: huntId } : p))
    const { error: err } = await supabase
      .from('profiles')
      .update({ favorite_hunt_id: huntId })
      .eq('id', user.id)
    if (err) setError(profile?.username ? `Could not save favorite: ${err.message}` : 'Set a username in Profile first, then pick a favorite.')
  }

  async function createDex(dex) {
    setDexes((prev) => [...prev, dex])
    try {
      await dexStore.insert(dex)
    } catch (e) {
      setError(`Could not create dex: ${e.message}`)
    }
  }

  async function deleteDex(dex) {
    setDexes((prev) => prev.filter((d) => d.id !== dex.id))
    try {
      await dexStore.remove(dex.id)
    } catch (e) {
      setError(`Could not delete dex: ${e.message}`)
    }
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut()
    setGuest(false)
    setHunts([])
    setDexes([])
    setProfile(null)
    navigate('home')
  }

  // ---- Routing ----
  if (route.view === 'public') {
    return <PublicProfile username={route.publicUser} />
  }

  if (!authReady) return <div className="app center-screen muted">Loading…</div>

  const view = route.view
  const needsAuth = !PUBLIC_VIEWS.has(view)

  if (needsAuth && !loggedIn) {
    return (
      <div className="app">
        <nav className="nav">
          <a className="logo" href="#/">✨ {SITE.name}</a>
        </nav>
        <Auth onGuest={() => setGuest(true)} />
      </div>
    )
  }

  const openHunt = hunts.find((h) => h.id === openHuntId)

  const tabs = [
    ['home', 'Home'],
    ['hunts', 'Hunts'],
    ['collection', 'Collection'],
    ['dex', 'Dexes'],
    ['tutorials', 'Guides'],
  ]

  return (
    <div className={`app ${view === 'dex' ? 'wide' : ''}`}>
      <nav className="nav">
        <a className="logo" href="#/">✨ {SITE.name}</a>
        <div className="row">
          {tabs.map(([v, label]) => (
            <button
              key={v}
              className={`btn ghost ${view === v ? 'active' : ''}`}
              onClick={() => navigate(v)}
            >
              {label}
            </button>
          ))}
          {loggedIn ? (
            <>
              {user && (
                <button
                  className={`btn ghost ${view === 'profile' ? 'active' : ''}`}
                  onClick={() => navigate('profile')}
                >
                  Profile
                </button>
              )}
              <button className="btn ghost muted" onClick={logout} title={user?.email || 'Guest'}>
                {guest ? 'Guest · Exit' : 'Log out'}
              </button>
            </>
          ) : (
            <button className="btn primary" onClick={() => navigate('hunts')}>Log in</button>
          )}
        </div>
      </nav>

      {error && <p className="error banner">{error}</p>}
      {guest && loggedIn && (
        <p className="notice banner">
          Guest mode — data saved in this browser only. Log in to sync and join leaderboards.
        </p>
      )}

      {view === 'home' && <Home loggedIn={loggedIn} onNavigate={navigate} />}
      {view === 'history' && <History />}
      {view === 'tutorials' && <Tutorials />}

      {view === 'hunts' && !openHunt && (
        <HuntsMenu
          hunts={hunts}
          onOpen={(h) => setOpenHuntId(h.id)}
          onNew={() => navigate('new')}
        />
      )}
      {view === 'hunts' && openHunt && (
        <ActiveHunt
          hunt={openHunt}
          onUpdate={save}
          onComplete={(h) => {
            save({ ...h, status: 'completed', endDate: new Date().toISOString() })
            navigate('collection')
          }}
          onDelete={remove}
          onBack={(updated) => {
            if (updated !== openHunt) save(updated)
            setOpenHuntId(null)
          }}
        />
      )}
      {view === 'new' && (
        <NewHunt
          onStart={startHunt}
          onCancel={() => navigate('hunts')}
          dexes={dexes}
          profile={profile}
          hunts={hunts}
        />
      )}
      {view === 'manual' && (
        <NewHunt
          manual
          onStart={addManualHunt}
          onCancel={() => navigate('collection')}
          dexes={dexes}
        />
      )}
      {view === 'collection' && (
        <Collection
          hunts={hunts}
          onDelete={remove}
          onUpdate={save}
          favoriteHuntId={profile?.favoriteHuntId}
          onSetFavorite={user ? setFavorite : undefined}
          onAddManual={() => navigate('manual')}
        />
      )}
      {view === 'dex' && (
        <DexTracker hunts={hunts} dexes={dexes} onCreateDex={createDex} onDeleteDex={deleteDex} />
      )}
      {view === 'profile' && user && (
        <ProfileSettings user={user} onClose={() => navigate('home')} onSaved={loadProfile} />
      )}
    </div>
  )
}
