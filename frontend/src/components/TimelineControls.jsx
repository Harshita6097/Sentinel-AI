import { useSim } from '../context/SimulationContext'

const SPEEDS = [1, 2, 5]

export default function TimelineControls() {
  const { sim, play, pause, reset, step, setSpeed } = useSim()

  return (
    <div style={s.wrap}>
      <div style={s.row}>
        <button style={s.btn} onClick={sim.paused ? play : pause} title={sim.paused ? 'Play' : 'Pause'}>
          {sim.paused ? '▶' : '⏸'}
        </button>
        <button style={s.btn} onClick={step} title="Step +1 min">⏭</button>
        <button style={{ ...s.btn, ...s.reset }} onClick={reset} title="Reset">↺</button>
        <div style={s.speeds}>
          {SPEEDS.map(sp => (
            <button
              key={sp}
              style={{ ...s.speed, ...(sim.speed === sp ? s.speedActive : {}) }}
              onClick={() => setSpeed(sp)}
            >
              {sp}×
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap: { padding: '0.6rem 1rem', background: '#111827', border: '1px solid #1f2937', borderRadius: 8, marginBottom: '0.5rem' },
  row: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  btn: {
    background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb',
    borderRadius: 6, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem',
  },
  reset: { color: '#f59e0b' },
  speeds: { display: 'flex', gap: '0.25rem', marginLeft: 'auto' },
  speed: {
    background: '#1f2937', border: '1px solid #374151', color: '#6b7280',
    borderRadius: 6, padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.72rem',
  },
  speedActive: { background: '#1d4ed8', border: '1px solid #3b82f6', color: '#bfdbfe' },
}
