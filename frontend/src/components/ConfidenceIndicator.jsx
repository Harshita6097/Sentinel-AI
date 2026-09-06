export default function ConfidenceIndicator({ value, label = 'Confidence', compact = false }) {
  const color = value >= 85 ? '#22c55e' : value >= 70 ? '#3b82f6' : value >= 55 ? '#f59e0b' : '#ef4444'

  if (compact) {
    return (
      <span style={{ ...s.compact, color }}>
        {value}%
      </span>
    )
  }

  return (
    <div style={s.wrap}>
      <div style={s.row}>
        <span style={s.label}>{label}</span>
        <span style={{ ...s.value, color }}>{value}%</span>
      </div>
      <div style={s.track}>
        <div style={{ ...s.fill, width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

const s = {
  wrap:    { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  row:     { display: 'flex', justifyContent: 'space-between' },
  label:   { color: '#6b7280', fontSize: '0.68rem' },
  value:   { fontSize: '0.68rem', fontWeight: 700 },
  track:   { height: 4, background: '#1f2937', borderRadius: 9999, overflow: 'hidden' },
  fill:    { height: '100%', borderRadius: 9999, transition: 'width 0.4s ease' },
  compact: { fontSize: '0.72rem', fontWeight: 700 },
}
