function Bar({ label, value, color }) {
  return (
    <div style={s.item}>
      <div style={s.labelRow}>
        <span style={s.label}>{label}</span>
        <span style={{ ...s.pct, color }}>{value}%</span>
      </div>
      <div style={s.track}>
        <div style={{ ...s.fill, width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

export default function ConfidenceBreakdown({ breakdown, sources }) {
  if (!breakdown) return null

  const { evidence_confidence, priority_certainty, data_completeness, overall } = breakdown

  const overallColor = overall >= 80 ? '#22c55e' : overall >= 60 ? '#f97316' : '#ef4444'

  return (
    <div style={s.root}>
      <div style={s.overall}>
        <span style={s.overallLabel}>Commander Confidence</span>
        <span style={{ ...s.overallVal, color: overallColor }}>{overall}%</span>
      </div>

      <div style={s.bars}>
        <Bar label="Evidence Fusion"    value={evidence_confidence} color="#3b82f6" />
        <Bar label="Priority Certainty" value={priority_certainty}  color="#8b5cf6" />
        <Bar label="Data Completeness"  value={data_completeness}   color="#06b6d4" />
      </div>

      {sources && sources.length > 0 && (
        <div style={s.sources}>
          <div style={s.sourcesTitle}>Agent Sources</div>
          {sources.map(src => (
            <div key={src.source} style={s.sourceRow}>
              <span style={s.sourceName}>{src.source}</span>
              <div style={s.sourceTrack}>
                <div style={{ ...s.sourceFill, width: `${src.confidence}%` }} />
              </div>
              <span style={s.sourceVal}>{src.confidence}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const s = {
  root:         { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  overall:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.6rem 0.8rem' },
  overallLabel: { color: '#9ca3af', fontSize: '0.75rem', fontWeight: 600 },
  overallVal:   { fontSize: '1.4rem', fontWeight: 700, fontFamily: 'monospace' },
  bars:         { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  item:         { display: 'flex', flexDirection: 'column', gap: '0.15rem' },
  labelRow:     { display: 'flex', justifyContent: 'space-between' },
  label:        { color: '#6b7280', fontSize: '0.68rem' },
  pct:          { fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 600 },
  track:        { height: 5, background: '#1f2937', borderRadius: 3, overflow: 'hidden' },
  fill:         { height: '100%', borderRadius: 3, transition: 'width 0.4s ease' },
  sources:      { background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.6rem' },
  sourcesTitle: { color: '#4b5563', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' },
  sourceRow:    { display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' },
  sourceName:   { color: '#6b7280', fontSize: '0.68rem', width: 70, flexShrink: 0 },
  sourceTrack:  { flex: 1, height: 4, background: '#1f2937', borderRadius: 2, overflow: 'hidden' },
  sourceFill:   { height: '100%', background: '#6366f1', borderRadius: 2, transition: 'width 0.4s ease' },
  sourceVal:    { color: '#6b7280', fontSize: '0.65rem', fontFamily: 'monospace', width: 32, textAlign: 'right' },
}
