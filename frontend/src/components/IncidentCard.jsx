import SeverityBadge from './SeverityBadge'
import ConfidenceIndicator from './ConfidenceIndicator'

const STATUS_COLOR = { Open: '#ef4444', Acknowledged: '#f59e0b', Resolved: '#22c55e' }
const TYPE_ICON = {
  flood: '🌊', landslide: '⛰️', fire: '🔥', medical: '🏥',
  rescue: '🚁', shelter: '🏕️', road: '🚧', unknown: '📡',
}

export default function IncidentCard({ incident, selected, onClick, onStatusChange }) {
  const { id, time, location, facility, incident_type, people_count,
          severity_label, severity_signals, duplicate, confidence, status, source } = incident

  return (
    <div
      style={{ ...s.card, ...(selected ? s.cardSelected : {}), ...(duplicate ? s.cardDup : {}) }}
      onClick={() => onClick?.(incident)}
    >
      {/* Header row */}
      <div style={s.header}>
        <span style={s.icon}>{TYPE_ICON[incident_type] ?? '📡'}</span>
        <span style={s.id}>{id}</span>
        <span style={s.time}>{time}</span>
        <SeverityBadge label={severity_label} size="sm" />
        {duplicate && <span style={s.dupTag}>DUP</span>}
      </div>

      {/* Location / facility */}
      <div style={s.location}>
        {location ?? 'Unknown location'}
        {facility && <span style={s.facility}> · {facility}</span>}
      </div>

      {/* People count */}
      {people_count && (
        <div style={s.people}>👥 {people_count} people affected</div>
      )}

      {/* Top signal */}
      {severity_signals?.[0] && (
        <div style={s.signal}>⚡ {severity_signals[0]}</div>
      )}

      {/* Footer */}
      <div style={s.footer}>
        <ConfidenceIndicator value={confidence.overall} compact />
        <span style={{ ...s.status, color: STATUS_COLOR[status] ?? '#9ca3af' }}>● {status}</span>
        <span style={s.source}>{source}</span>
        {onStatusChange && status !== 'Resolved' && (
          <button
            style={s.ackBtn}
            onClick={(e) => { e.stopPropagation(); onStatusChange(id, status === 'Open' ? 'Acknowledged' : 'Resolved') }}
          >
            {status === 'Open' ? 'Ack' : 'Resolve'}
          </button>
        )}
      </div>
    </div>
  )
}

const s = {
  card: {
    background: '#111827', border: '1px solid #1f2937', borderRadius: 8,
    padding: '0.65rem 0.75rem', cursor: 'pointer', marginBottom: '0.4rem',
    transition: 'border-color 0.15s',
  },
  cardSelected: { borderColor: '#3b82f6', background: '#0f172a' },
  cardDup:      { opacity: 0.65 },
  header:   { display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', flexWrap: 'wrap' },
  icon:     { fontSize: '0.9rem' },
  id:       { color: '#3b82f6', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace' },
  time:     { color: '#4b5563', fontSize: '0.68rem', fontFamily: 'monospace', marginLeft: 'auto' },
  dupTag:   { background: '#374151', color: '#9ca3af', fontSize: '0.6rem', borderRadius: 4, padding: '0.1rem 0.3rem', fontWeight: 700 },
  location: { color: '#e5e7eb', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.2rem' },
  facility: { color: '#6b7280', fontWeight: 400 },
  people:   { color: '#9ca3af', fontSize: '0.7rem', marginBottom: '0.2rem' },
  signal:   { color: '#f59e0b', fontSize: '0.68rem', marginBottom: '0.35rem' },
  footer:   { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  status:   { fontSize: '0.68rem', fontWeight: 600 },
  source:   { color: '#374151', fontSize: '0.62rem', marginLeft: 'auto' },
  ackBtn:   {
    background: '#1f2937', border: '1px solid #374151', color: '#9ca3af',
    borderRadius: 4, padding: '0.1rem 0.4rem', fontSize: '0.62rem', cursor: 'pointer',
  },
}
