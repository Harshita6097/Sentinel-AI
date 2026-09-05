import { useSim } from '../context/SimulationContext'

export default function TimelineProgress() {
  const { sim } = useSim()
  const pct = Math.round(sim.progress * 100)

  return (
    <div style={s.wrap}>
      <div style={s.meta}>
        <span style={s.label}>09:00</span>
        <span style={s.pct}>{pct}%</span>
        <span style={s.label}>14:30</span>
      </div>
      <div style={s.track}>
        <div style={{ ...s.fill, width: `${pct}%` }} />
      </div>
      <div style={s.count}>{sim.active_events.length} events triggered</div>
    </div>
  )
}

const s = {
  wrap: { padding: '0.6rem 1rem', background: '#111827', border: '1px solid #1f2937', borderRadius: 8, marginBottom: '0.5rem' },
  meta: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' },
  label: { color: '#4b5563', fontSize: '0.65rem', fontFamily: 'monospace' },
  pct: { color: '#3b82f6', fontSize: '0.7rem', fontWeight: 700 },
  track: { height: 6, background: '#1f2937', borderRadius: 9999, overflow: 'hidden' },
  fill: { height: '100%', background: 'linear-gradient(90deg,#1d4ed8,#3b82f6)', borderRadius: 9999, transition: 'width 0.4s ease' },
  count: { color: '#4b5563', fontSize: '0.65rem', marginTop: '0.3rem', textAlign: 'right' },
}
