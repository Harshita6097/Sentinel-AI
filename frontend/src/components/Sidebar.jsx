import SimulationClock from './SimulationClock'
import TimelineControls from './TimelineControls'
import TimelineProgress from './TimelineProgress'
import EventFeed from './EventFeed'

export default function Sidebar({ locationCount }) {
  return (
    <aside style={s.sidebar}>
      <div style={s.summary}>
        <span style={s.summaryNum}>{locationCount}</span>
        <span style={s.summaryLabel}>Locations on Map</span>
      </div>

      <SimulationClock />
      <TimelineControls />
      <TimelineProgress />

      <div style={s.feedWrap}>
        <EventFeed />
      </div>

      <div style={s.footer}>Sentinel AI v0.3 · Milestone 3</div>
    </aside>
  )
}

const s = {
  sidebar: {
    width: 300, flexShrink: 0, background: '#0d1117',
    borderRight: '1px solid #1f2937', overflowY: 'hidden',
    display: 'flex', flexDirection: 'column',
    padding: '0.75rem',
  },
  summary: {
    display: 'flex', alignItems: 'baseline', gap: '0.5rem',
    background: '#111827', border: '1px solid #1f2937',
    borderRadius: 8, padding: '0.5rem 1rem', marginBottom: '0.5rem', flexShrink: 0,
  },
  summaryNum: { color: '#3b82f6', fontSize: '1.5rem', fontWeight: 700 },
  summaryLabel: { color: '#6b7280', fontSize: '0.75rem' },
  feedWrap: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
  footer: {
    flexShrink: 0, paddingTop: '0.5rem',
    color: '#374151', fontSize: '0.7rem', textAlign: 'center',
  },
}
