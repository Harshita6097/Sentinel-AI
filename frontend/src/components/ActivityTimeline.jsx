import { useDashboard } from '../context/DashboardContext'

const SEV_COLOR = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#f59e0b',
  low:      '#22c55e',
}

const SOURCE_COLOR = {
  simulation: '#3b82f6',
  emergency:  '#ef4444',
  logistics:  '#22c55e',
  commander:  '#8b5cf6',
}

export default function ActivityTimeline() {
  const { events } = useDashboard()

  return (
    <div style={s.root}>
      <div style={s.header}>
        <span style={s.title}>⚡ Activity Feed</span>
        <span style={s.count}>{events.length}</span>
      </div>
      <div style={s.list}>
        {events.length === 0
          ? <div style={s.empty}>Awaiting activity…</div>
          : events.map((ev, i) => {
              const sevColor = SEV_COLOR[ev.severity] ?? '#6b7280'
              const srcColor = SOURCE_COLOR[ev.source] ?? '#4b5563'
              return (
                <div key={i} style={s.entry}>
                  <div style={{ ...s.srcDot, background: srcColor }} />
                  <div style={s.entryBody}>
                    <div style={s.entryTop}>
                      <span style={s.icon}>{ev.icon}</span>
                      <span style={s.time}>{ev.time}</span>
                      <span style={{ ...s.sev, color: sevColor }}>●</span>
                      <span style={s.loc}>{ev.location}</span>
                      <span style={{ ...s.src, color: srcColor }}>{ev.source}</span>
                    </div>
                    <div style={s.desc}>{ev.description}</div>
                  </div>
                </div>
              )
            })
        }
      </div>
    </div>
  )
}

const s = {
  root:      { display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 },
  header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderBottom: '1px solid #1f2937', flexShrink: 0 },
  title:     { color: '#e5e7eb', fontSize: '0.75rem', fontWeight: 600 },
  count:     { background: '#1d4ed8', color: '#bfdbfe', borderRadius: 9999, padding: '0.1rem 0.45rem', fontSize: '0.62rem' },
  list:      { overflowY: 'auto', flex: 1, padding: '0.35rem' },
  empty:     { color: '#374151', fontSize: '0.72rem', textAlign: 'center', padding: '1.5rem 0' },
  entry:     { display: 'flex', gap: '0.4rem', marginBottom: '0.3rem', alignItems: 'flex-start' },
  srcDot:    { width: 3, borderRadius: 2, alignSelf: 'stretch', flexShrink: 0, minHeight: 8, marginTop: 4 },
  entryBody: { flex: 1, background: '#111827', borderRadius: 6, padding: '0.35rem 0.5rem' },
  entryTop:  { display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' },
  icon:      { fontSize: '0.8rem' },
  time:      { color: '#6b7280', fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 600 },
  sev:       { fontSize: '0.55rem' },
  loc:       { color: '#4b5563', fontSize: '0.62rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  src:       { fontSize: '0.58rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 },
  desc:      { color: '#9ca3af', fontSize: '0.68rem', lineHeight: 1.4 },
}
