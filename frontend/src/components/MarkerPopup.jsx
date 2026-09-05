const TYPE_COLOR = {
  Hospital: '#ef4444',
  Shelter: '#3b82f6',
  Resource: '#f97316',
  FloodZone: '#6b7280',
}

export default function MarkerPopup({ location }) {
  const color = TYPE_COLOR[location.type] ?? '#9ca3af'
  return (
    <div style={s.wrap}>
      <div style={{ ...s.badge, background: color }}>{location.type}</div>
      <div style={s.name}>{location.name}</div>
      <div style={s.row}><span style={s.label}>Status</span><span style={s.value}>{location.status}</span></div>
      {location.capacity > 0 && (
        <div style={s.row}><span style={s.label}>Capacity</span><span style={s.value}>{location.capacity}</span></div>
      )}
      <div style={s.row}>
        <span style={s.label}>Coords</span>
        <span style={s.value}>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
      </div>
    </div>
  )
}

const s = {
  wrap: { fontFamily: 'system-ui, sans-serif', minWidth: 180 },
  badge: {
    display: 'inline-block', color: '#fff', fontSize: '0.65rem',
    fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 9999,
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem',
  },
  name: { fontWeight: 700, fontSize: '0.9rem', color: '#111827', marginBottom: '0.4rem' },
  row: { display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.78rem', padding: '0.1rem 0' },
  label: { color: '#6b7280' },
  value: { color: '#111827', fontWeight: 500 },
}
