const RANK_COLOR  = { 1: '#ef4444', 2: '#f97316', 3: '#eab308' }
const CONF_COLOR  = (c) => c >= 80 ? '#22c55e' : c >= 60 ? '#f97316' : '#ef4444'

const TYPE_ICON = {
  Boat: '🚤', Ambulance: '🚑', Helicopter: '🚁', Truck: '🚛',
}

function resourceIcon(action) {
  for (const [type, icon] of Object.entries(TYPE_ICON)) {
    if (action?.includes(type)) return icon
  }
  return '🚨'
}

export default function RecommendationCard({ rec, expanded, onToggle }) {
  const { rank, location, priority_score, recommended_action, reason,
          factor_breakdown, confidence, evidence_sources, incident_ids } = rec

  const rankColor = RANK_COLOR[rank] ?? '#6b7280'
  const confColor = CONF_COLOR(confidence)

  return (
    <div style={{ ...s.card, borderColor: expanded ? rankColor : '#1f2937' }} onClick={onToggle}>
      <div style={s.top}>
        <div style={{ ...s.rank, background: rankColor }}>#{rank}</div>
        <span style={s.icon}>{resourceIcon(recommended_action)}</span>
        <div style={s.info}>
          <div style={s.location}>{location}</div>
          <div style={s.action}>{recommended_action}</div>
        </div>
        <div style={s.right}>
          <div style={{ ...s.conf, color: confColor }}>{confidence}%</div>
          <div style={s.score}>{priority_score?.toFixed(0)} pts</div>
        </div>
      </div>

      <div style={s.reason}>{reason}</div>

      {expanded && (
        <div style={s.detail}>
          {factor_breakdown?.length > 0 && (
            <div style={s.factors}>
              {factor_breakdown.map((f, i) => (
                <div key={i} style={s.factor}>⚡ {f}</div>
              ))}
            </div>
          )}
          {incident_ids?.length > 0 && (
            <div style={s.incIds}>
              Incidents: {incident_ids.join(', ')}
            </div>
          )}
          {evidence_sources?.length > 0 && (
            <div style={s.sources}>
              {evidence_sources.filter(s => s.confidence > 0).map(src => (
                <span key={src.source} style={s.srcChip}>
                  {src.source} {src.confidence}%
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const s = {
  card:     { background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.75rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.4rem', transition: 'border-color 0.15s' },
  top:      { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  rank:     { width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 },
  icon:     { fontSize: '1.2rem', flexShrink: 0 },
  info:     { flex: 1, minWidth: 0 },
  location: { color: '#e5e7eb', fontWeight: 700, fontSize: '0.8rem' },
  action:   { color: '#6b7280', fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  right:    { textAlign: 'right', flexShrink: 0 },
  conf:     { fontWeight: 700, fontSize: '0.9rem', fontFamily: 'monospace' },
  score:    { color: '#4b5563', fontSize: '0.62rem' },
  reason:   { color: '#9ca3af', fontSize: '0.7rem', lineHeight: 1.5, fontStyle: 'italic' },
  detail:   { display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid #1f2937', paddingTop: '0.4rem', marginTop: '0.1rem' },
  factors:  { display: 'flex', flexDirection: 'column', gap: '0.15rem' },
  factor:   { color: '#f59e0b', fontSize: '0.68rem' },
  incIds:   { color: '#4b5563', fontSize: '0.65rem', fontFamily: 'monospace' },
  sources:  { display: 'flex', flexWrap: 'wrap', gap: '0.3rem' },
  srcChip:  { background: '#1e3a5f', color: '#60a5fa', borderRadius: 4, padding: '0.1rem 0.4rem', fontSize: '0.62rem' },
}
