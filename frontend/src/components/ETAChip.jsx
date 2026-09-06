export default function ETAChip({ etaMinutes, delayMinutes, arrivalTime }) {
  const hasDelay = delayMinutes > 0
  return (
    <div style={s.wrap}>
      <span style={s.eta}>{etaMinutes?.toFixed(0) ?? '--'} min</span>
      {arrivalTime && <span style={s.arrival}>→ {arrivalTime}</span>}
      {hasDelay && (
        <span style={s.delay}>+{delayMinutes?.toFixed(0)}m delay</span>
      )}
    </div>
  )
}

const s = {
  wrap:    { display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' },
  eta:     { background: '#1e3a5f', color: '#60a5fa', borderRadius: 4, padding: '0.15rem 0.45rem', fontSize: '0.72rem', fontWeight: 600, fontFamily: 'monospace' },
  arrival: { color: '#6b7280', fontSize: '0.7rem', fontFamily: 'monospace' },
  delay:   { background: '#422006', color: '#fb923c', borderRadius: 4, padding: '0.15rem 0.4rem', fontSize: '0.68rem', fontWeight: 600 },
}
