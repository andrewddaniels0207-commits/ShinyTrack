import { useEffect, useRef, useState } from 'react'
import { spriteUrl } from '../api/pokeapi'
import { getOdds, cumulativeChance } from '../data/odds'
import ModifierControls from './ModifierControls'

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function ActiveHunt({ hunt, onUpdate, onComplete, onDelete, onBack }) {
  const [manualValue, setManualValue] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  // ---- Timer ----
  const [running, setRunning] = useState(false)
  const [, setTick] = useState(0) // re-render every second while running
  const sessionStart = useRef(null)

  const sessionSeconds = running ? Math.floor((Date.now() - sessionStart.current) / 1000) : 0
  const totalSeconds = (hunt.timeSeconds || 0) + sessionSeconds

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  // Returns the hunt with any running session time folded in, stopping the clock.
  function withTime(h = hunt) {
    if (!running) return h
    const secs = Math.floor((Date.now() - sessionStart.current) / 1000)
    setRunning(false)
    sessionStart.current = null
    return { ...h, timeSeconds: (h.timeSeconds || 0) + secs }
  }

  function toggleTimer() {
    if (running) {
      onUpdate(withTime())
    } else {
      sessionStart.current = Date.now()
      setRunning(true)
    }
  }

  // ---- Counter ----
  function increment() {
    onUpdate({ ...hunt, count: hunt.count + hunt.increment })
  }

  function decrement() {
    onUpdate({ ...hunt, count: Math.max(0, hunt.count - hunt.increment) })
  }

  function setManual() {
    const n = parseInt(manualValue, 10)
    if (!Number.isNaN(n) && n >= 0) {
      onUpdate({ ...hunt, count: n })
      setManualValue('')
    }
  }

  function setIncrement(value) {
    const n = parseInt(value, 10)
    if (!Number.isNaN(n) && n >= 1) onUpdate({ ...hunt, increment: n })
  }

  // Space or Enter increments the counter.
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        increment()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ---- Phases (off-target shinies) ----
  function addPhase() {
    const name = window.prompt('A different shiny appeared! Which Pokemon was it?')
    if (!name) return
    const phase = {
      name: name.trim(),
      count: hunt.count,
      date: new Date().toISOString(),
    }
    const updated = { ...withTime(), phases: [...(hunt.phases || []), phase] }
    if (window.confirm('Reset the counter to 0 for the new phase? (Cancel keeps counting)')) {
      updated.count = 0
    }
    onUpdate(updated)
  }

  // ---- Odds ----
  const odds = getOdds(hunt.gameId, hunt.method, hunt.modifiers, hunt.combo)
  const chance = odds?.denominator ? cumulativeChance(odds.denominator, hunt.count) : null
  const isLetsGo = hunt.gameId === 'lets-go'

  const phases = hunt.phases || []

  return (
    <div className="panel hunt-view">
      <div className="panel-header">
        <button className="btn ghost" onClick={() => onBack(withTime())}>← Hunts</button>
        <button className="btn ghost" onClick={() => setShowSettings(!showSettings)}>
          ⚙ Settings
        </button>
      </div>

      <div className="hunt-target">
        <img
          className="hunt-sprite"
          src={spriteUrl(hunt.pokemonId, true)}
          alt={hunt.pokemonName}
          onError={(e) => { e.currentTarget.src = spriteUrl(hunt.pokemonId) }}
        />
        <h2>✨ {hunt.pokemonName}</h2>
        <p className="muted">{hunt.gameName} · {hunt.method}</p>

        <div className="odds-box">
          {odds?.denominator && (
            <>
              <span className="odds-main">~1/{odds.denominator.toLocaleString()}</span>
              {odds.note && <span className="muted small"> ({odds.note})</span>}
              {chance !== null && (
                <div className="muted small">
                  {chance.toFixed(1)}% chance you'd have found it by now
                </div>
              )}
            </>
          )}
          {odds?.varies && <span className="muted small">Odds vary: {odds.varies}</span>}
          {!odds && <span className="muted small">Custom method — odds unknown</span>}
          <ModifierControls
            gameId={hunt.gameId}
            method={hunt.method}
            values={hunt.modifiers}
            onChange={(m) => onUpdate({ ...hunt, modifiers: m })}
          />
        </div>
      </div>

      {isLetsGo && (
        <div className="combo-box">
          <span className="muted small">Catch Combo</span>
          <span className="combo-value">{hunt.combo || 0}</span>
          <div className="row center-row">
            <button
              className="btn primary"
              onClick={() => onUpdate({ ...hunt, combo: (hunt.combo || 0) + 1, count: hunt.count + 1 })}
            >
              +1 Catch (combo + encounter)
            </button>
            <button
              className="btn"
              disabled={!hunt.combo}
              onClick={() => onUpdate({ ...hunt, combo: 0 })}
            >
              Combo broke
            </button>
          </div>
        </div>
      )}

      <div className="counter">{hunt.count.toLocaleString()}</div>

      <button className="btn primary counter-btn" onClick={increment}>
        +{hunt.increment}
      </button>
      <p className="muted small center">Tip: Space or Enter also counts</p>

      <div className="timer-row">
        <span className="timer">{formatTime(totalSeconds)}</span>
        <button className={`btn small ${running ? '' : 'primary'}`} onClick={toggleTimer}>
          {running ? '⏸ Pause' : '▶ Start Timer'}
        </button>
      </div>

      <div className="row center-row">
        <button className="btn" onClick={addPhase}>◆ Phase (off-target shiny)</button>
      </div>

      {phases.length > 0 && (
        <div className="phases">
          <label className="field-label">Phases ({phases.length})</label>
          {phases.map((p, i) => (
            <div key={i} className="phase-row">
              <span>✨ {p.name}</span>
              <span className="muted">at {p.count.toLocaleString()} · {new Date(p.date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {showSettings && (
        <div className="settings">
          <label className="field-label">Increment by</label>
          <div className="row">
            {[1, 2, 3, 5, 10].map((n) => (
              <button
                key={n}
                className={`btn small ${hunt.increment === n ? 'primary' : ''}`}
                onClick={() => setIncrement(n)}
              >
                {n}
              </button>
            ))}
            <input
              className="input narrow"
              type="number"
              min="1"
              placeholder="Custom"
              onChange={(e) => setIncrement(e.target.value)}
            />
          </div>

          <label className="field-label">Set counter manually</label>
          <div className="row">
            <input
              className="input narrow"
              type="number"
              min="0"
              placeholder={String(hunt.count)}
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setManual()}
            />
            <button className="btn" onClick={setManual}>Set</button>
            <button className="btn" onClick={decrement}>−{hunt.increment}</button>
          </div>

          <label className="field-label">Danger zone</label>
          <button
            className="btn danger"
            onClick={() => window.confirm('Delete this hunt permanently?') && onDelete(hunt)}
          >
            Delete Hunt
          </button>
        </div>
      )}

      <button
        className="btn shiny big"
        onClick={() =>
          window.confirm(`Found shiny ${hunt.pokemonName} after ${hunt.count.toLocaleString()} encounters?`) &&
          onComplete(withTime())
        }
      >
        ★ Found the Shiny! — End Hunt
      </button>
    </div>
  )
}
