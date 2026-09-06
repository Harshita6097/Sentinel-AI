const ITEMS = [
  { color: '#22c55e', label: 'Active route' },
  { color: '#ef4444', label: 'Blocked road' },
  { color: '#f97316', label: 'Delayed route' },
  { color: '#3b82f6', label: 'Resource marker' },
  { color: '#a855f7', label: 'Destination' },
]

export default function RoadStatusLegend() {
  return (
    <div style={s.wrap}>
      {ITEMS.map(({ color, label }) => (
        <div key={label} style={s.item}>
          <span style={{ ...s.dot, background: color }} />
          <span style={s.label}>{label}</span>
        </div>
      ))}
    </div>
  )
}

const s = {
  wrap:  { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  item:  { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  dot:   { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  label: { color: '#9ca3af', fontSize: '0.7rem' },
}
