const CONF_COLOR = (c) => c >= 80 ? '#22c55e' : c >= 60 ? '#f97316' : '#ef4444'

export default function DecisionLog({ log }) {
  if (!log || log.length === 0) {
    return (
      <div style={s.empty}>
        <div>No decisions logged yet.</div>
        <div style={s.emptySub}>Decisions appear after each Recompute cycle.</div>
      </div>
    )
  }

  return (
    <div style={s.root}>
      {log.map((entry, i) => (
        <div key={i} style={s.entry}>
          <div style={s.entryTop}>
            <span style={s.time}>{entry.time}</span>
            <span style={s.location}>{entry.location}</span>
            <span style={{ ...s.conf, color: CONF_COLOR(entry.confidence) }}>
              {entry.confidence}%
            </span>
          </div>
          <div style={s.action}>{entry.action}</div>
          <div style={s.reason}>{entry.reason}</div>
          {entry.priority_score > 0 && (
            <div style={s.score}>Priority score: {entry.priority_score?.toFixed(1)}</div>
          )}
        </div>
      ))}
    </div>
  )
}

const s = {
  root:      { display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto' },
  entry:     { background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  entryTop:  { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  time:      { color: '#3b82f6', fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 600, flexShrink: 0 },
  location:  { color: '#e5e7eb', fontSize: '0.72rem', fontWeight: 600, flex: 1 },
  conf:      { fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 },
  action:    { color: '#d1d5db', fontSize: '0.72rem' },
  reason:    { color: '#6b7280', fontSize: '0.68rem', lineHeight: 1.4, fontStyle: 'italic' },
  score:     { color: '#374151', fontSize: '0.62rem', fontFamily: 'monospace' },
  empty:     { color: '#374151', fontSize: '0.75rem', textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  emptySub:  { color: '#1f2937', fontSize: '0.68rem' },
}
