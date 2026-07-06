import { getModifierDefs } from '../data/odds'

// Renders the odds modifiers for a game+method (charm, sandwich level, chains...).
// values = hunt.modifiers object; onChange(newValues).
export default function ModifierControls({ gameId, method, values = {}, onChange }) {
  const defs = getModifierDefs(gameId, method)
  if (defs.length === 0) return null

  function set(key, value) {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className="modifiers">
      {defs.map((def) =>
        def.type === 'toggle' ? (
          <label key={def.key} className="charm-toggle">
            <input
              type="checkbox"
              checked={!!values[def.key]}
              onChange={(e) => set(def.key, e.target.checked)}
            />
            {def.label}
          </label>
        ) : (
          <label key={def.key} className="modifier-select">
            <span className="muted small">{def.label}</span>
            <select
              className="input"
              value={values[def.key] ?? def.options[0].value}
              onChange={(e) => set(def.key, Number(e.target.value))}
            >
              {def.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        )
      )}
    </div>
  )
}
