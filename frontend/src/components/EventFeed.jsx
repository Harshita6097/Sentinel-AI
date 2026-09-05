import { useSim } from '../context/SimulationContext'

const SEV = {
  critical: { bg: '#450a0a', border: '#ef4444', dot: '#ef4444', label: 'CRITICAL' },
  high:     { bg: '#431407', border: '#f97316', dot: '#f97316', label: 'HIGH' },
  medium:   { bg: '#422006', border: '#f59e0b', dot: '#f59e0b', label: 'MED' },
  low:      { bg: '#052e16', border: '#22c55e', dot: '#22c55e', label: 'LOW' },
}

const TYPE_ICON = {
  hospital_sos:    '🏥',
  road_blocked:    '🚧',
  shelter_capacity:'🏕️',
  flood:           '🌊',
  resource_deploy: '📦',
  rescue:          '🚁',
  weather:         '⛈️',
}

export default function EventFeed() {
  const { sim } = useSim()
  const events = sim.active_events

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span>⚡ Live Event Feed</span>
        <span style={s.badge}>{events.length}</span>
      </div>
      <div style={s.list}>
        {events.length === 0
          ? <div style={s.empty}>Awaiting events…</div>
          : events.map(ev => {
              const sev = SEV[ev.severity] ?? SEV.low
              return (
                <div key={ev.id} style={{ ...s.card, background: sev.bg, borderColor: sev.border }}>
                  <div style={s.cardTop}>
                    <span style={s.icon}>{TYPE_ICON[ev.type] ?? '📡'}</span>
                    <span style={s.time}>{ev.time}</span>
                    <span style={{ ...s.sevBadge, color: sev.dot }}>● {sev.label}</span>
                    <span style={s.loc}>{ev.location}</span>
                  </div>
                  <div style={s.desc}>{ev.description}</div>
                </div>
              )
            })
        }
      </div>
    </div>
  )
}

const s = {
  wrap: { background: '#111827', border: '1px solid #1f2937', borderRadius: 8, display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', borderBottom: '1px solid #1f2937', color: '#e5e7eb', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 },
  badge: { background: '#1d4ed8', color: '#bfdbfe', borderRadius: 9999, padding: '0.1rem 0.45rem', fontSize: '0.65rem' },
  list: { overflowY: 'auto', flex: 1, padding: '0.4rem' },
  empty: { color: '#4b5563', fontSize: '0.75rem', textAlign: 'center', padding: '1.5rem 0' },
  card: { border: '1px solid', borderRadius: 6, padding: '0.45rem 0.6rem', marginBottom: '0.35rem' },
  cardTop: { display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' },
  icon: { fontSize: '0.85rem' },
  time: { color: '#9ca3af', fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 700 },
  sevBadge: { fontSize: '0.62rem', fontWeight: 700, marginLeft: 'auto' },
  loc: { color: '#6b7280', fontSize: '0.65rem' },
  desc: { color: '#d1d5db', fontSize: '0.72rem', lineHeight: 1.4 },
}
