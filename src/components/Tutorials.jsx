import { GAMES } from '../data/games'
import { getMethods } from '../data/methods'

export default function Tutorials() {
  return (
    <div className="panel">
      <h2>📖 Method Tutorials</h2>
      <p className="muted">Written guides for every hunting method, game by game.</p>
      {GAMES.map((g) => (
        <div key={g.id}>
          <label className="field-label">{g.name}</label>
          <div className="game-grid">
            {getMethods(g.id).filter((m) => m !== 'Other').map((m) => (
              <span key={m} className="game-chip tutorial-chip" title="Tutorial coming soon">
                {m} <span className="muted small">· coming soon</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
