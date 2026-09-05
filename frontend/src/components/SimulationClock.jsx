import { useSim } from '../context/SimulationContext'

const SEVERITY_COLOR = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }

export default function SimulationClock() {
  const { sim, connected } = useSim()
  const latest = sim.active_events[0]

  return (
    <div style={s.wrap}>
      <div style={s.label}>SIM TIME</div>
      <div style={s.time}>{sim.time}</div>
      <div style={s.row}>
        <span style={{ ...s.dot, background: sim.finished ? '#6b7280' : sim.paused ? '#f59e0b' : '#22c55e' }} />
        <span style={s.status}>
          {sim.finished ? 'Finished' : sim.paused ? 'Paused' : `${sim.speed}× Live`}
        </span>
      </div>
      {latest && (
        <div style={{ ...s.latest, borderColor: SEVERITY_COLOR[latest.severity] ?? '#374151' }}>
          <span style={{ color: SEVERITY_COLOR[latest.severity] }}>●</span> {latest.location}
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: { padding: '0.75rem 1rem', background: '#111827', border: '1px solid #1f2937', borderRadius: 8, marginBottom: '0.5rem' },
  label: { color: '#4b5563', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 },
  time: { color: '#3b82f6', fontSize: '2rem', fontWeight: 700, fontFamily: 'monospace', lineHeight: 1 },
  row: { display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' },
  dot: { width: 7, height: 7, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  status: { color: '#9ca3af', fontSize: '0.72rem' },
  latest: { marginTop: '0.4rem', fontSize: '0.7rem', color: '#9ca3af', borderLeft: '2px solid', paddingLeft: '0.4rem' },
}
