const STATUS_COLOR = {
  Available:   '#22c55e',
  Assigned:    '#3b82f6',
  Busy:        '#f97316',
  Maintenance: '#6b7280',
}

const TYPE_ICON = {
  Boat:       '🚤',
  Ambulance:  '🚑',
  Helicopter: '🚁',
  Truck:      '🚛',
}

function ResourceCard({ resource, onAssign }) {
  const { id, type, status, location, capacity, assigned_to } = resource
  const color = STATUS_COLOR[status] ?? '#6b7280'
  const canAssign = status === 'Available'

  return (
    <div style={s.card}>
      <div style={s.top}>
        <span style={s.icon}>{TYPE_ICON[type] ?? '🚗'}</span>
        <div style={s.info}>
          <div style={s.id}>{id}</div>
          <div style={s.loc}>{location}</div>
        </div>
        <span style={{ ...s.badge, color, borderColor: color }}>{status}</span>
      </div>
      <div style={s.meta}>
        <span style={s.metaItem}>Cap: {capacity}</span>
        {assigned_to && <span style={s.metaItem}>→ {assigned_to}</span>}
      </div>
      {canAssign && (
        <button style={s.assignBtn} onClick={() => onAssign(resource)}>
          Assign
        </button>
      )}
    </div>
  )
}

export default function ResourcePanel({ resources, onAssign }) {
  const counts = resources.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div style={s.root}>
      <div style={s.statsRow}>
        {Object.entries(STATUS_COLOR).map(([status, color]) => (
          <div key={status} style={s.stat}>
            <span style={{ ...s.statDot, background: color }} />
            <span style={s.statLabel}>{counts[status] ?? 0} {status}</span>
          </div>
        ))}
      </div>
      <div style={s.grid}>
        {resources.map(r => (
          <ResourceCard key={r.id} resource={r} onAssign={onAssign} />
        ))}
      </div>
    </div>
  )
}

const s = {
  root:      { display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden' },
  statsRow:  { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  stat:      { display: 'flex', alignItems: 'center', gap: '0.3rem' },
  statDot:   { width: 8, height: 8, borderRadius: '50%' },
  statLabel: { color: '#6b7280', fontSize: '0.68rem' },
  grid:      { display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto' },
  card:      { background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  top:       { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  icon:      { fontSize: '1.1rem', flexShrink: 0 },
  info:      { flex: 1, minWidth: 0 },
  id:        { color: '#e5e7eb', fontWeight: 600, fontSize: '0.75rem', fontFamily: 'monospace' },
  loc:       { color: '#4b5563', fontSize: '0.68rem' },
  badge:     { fontSize: '0.62rem', fontWeight: 600, border: '1px solid', borderRadius: 4, padding: '0.1rem 0.35rem', flexShrink: 0 },
  meta:      { display: 'flex', gap: '0.5rem' },
  metaItem:  { color: '#4b5563', fontSize: '0.65rem' },
  assignBtn: { background: '#1e3a5f', border: '1px solid #3b82f6', color: '#60a5fa', borderRadius: 4, padding: '0.2rem 0.5rem', fontSize: '0.68rem', cursor: 'pointer', alignSelf: 'flex-start' },
}
