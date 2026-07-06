import { useEffect, useState } from 'react'
import { spriteUrl } from '../api/pokeapi'

export default function ActiveHunt({ hunt, onUpdate, onComplete, onDelete, onBack }) {
  const [manualValue, setManualValue] = useState('')
  const [showSettings, setShowSettings] = useState(false)

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

  return (
    <div className="panel hunt-view">
      <div className="panel-header">
        <button className="btn ghost" onClick={onBack}>← Hunts</button>
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
        <p className="muted small">Started {new Date(hunt.startDate).toLocaleDateString()}</p>
      </div>

      <div className="counter">{hunt.count.toLocaleString()}</div>

      <button className="btn primary counter-btn" onClick={increment}>
        +{hunt.increment}
      </button>
      <p className="muted small center">Tip: Space or Enter also counts</p>

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
        onClick={() => window.confirm(`Found shiny ${hunt.pokemonName} after ${hunt.count.toLocaleString()} encounters?`) && onComplete(hunt)}
      >
        ★ Found the Shiny! — End Hunt
      </button>
    </div>
  )
}
