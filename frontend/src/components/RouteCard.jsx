import ETAChip from './ETAChip'

const STATUS_COLOR = {
  Active:   '#22c55e',
  Rerouted: '#f97316',
  Blocked:  '#ef4444',
}

const TYPE_ICON = {
  Boat:       '🚤',
  Ambulance:  '🚑',
  Helicopter: '🚁',
  Truck:      '🚛',
}

export default function RouteCard({ assignment, selected, onClick }) {
  const { assignment_id, resource_id, resource_type, origin, destination,
          route, eta_minutes, delay_minutes, arrival_time, status, explanation } = assignment
  const color = STATUS_COLOR[status] ?? '#6b7280'

  return (
    <div style={{ ...s.card, ...(selected ? s.selected : {}) }} onClick={onClick}>
      <div style={s.top}>
        <span style={s.icon}>{TYPE_ICON[resource_type] ?? '🚗'}</span>
        <div style={s.info}>
          <div style={s.id}>{resource_id}</div>
          <div style={s.dest}>{origin} → {destination}</div>
        </div>
        <span style={{ ...s.badge, color, borderColor: color }}>{status}</span>
      </div>

      {route.length > 0 && (
        <div style={s.route}>
          {route.join(' › ')}
        </div>
      )}

      <ETAChip etaMinutes={eta_minutes} delayMinutes={delay_minutes} arrivalTime={arrival_time} />

      {explanation && (
        <div style={s.explanation}>{explanation}</div>
      )}
    </div>
  )
}

const s = {
  card:        { background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.7rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.4rem', transition: 'border-color 0.15s' },
  selected:    { borderColor: '#3b82f6' },
  top:         { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  icon:        { fontSize: '1.3rem', flexShrink: 0 },
  info:        { flex: 1, minWidth: 0 },
  id:          { color: '#60a5fa', fontWeight: 700, fontSize: '0.78rem', fontFamily: 'monospace' },
  dest:        { color: '#9ca3af', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  badge:       { fontSize: '0.65rem', fontWeight: 600, border: '1px solid', borderRadius: 4, padding: '0.1rem 0.4rem', flexShrink: 0 },
  route:       { color: '#4b5563', fontSize: '0.68rem', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  explanation: { color: '#6b7280', fontSize: '0.68rem', lineHeight: 1.4, fontStyle: 'italic' },
}
