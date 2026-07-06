import { RESOURCES } from '../data/resources'

export default function Resources() {
  return (
    <div className="panel">
      <h2>🧰 Shiny Hunting Resources</h2>
      <p className="muted">Calculators, references, and tools — grouped by game.</p>
      {RESOURCES.map((cat) => (
        <div key={cat.category}>
          <label className="field-label">{cat.category}</label>
          <div className="hunt-list">
            {cat.links.map((l) => (
              <a key={l.url} className="hunt-row static resource-link" href={l.url} target="_blank" rel="noreferrer">
                <div className="hunt-row-info">
                  <strong>{l.name} ↗</strong>
                  <span className="muted small">{l.desc}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
