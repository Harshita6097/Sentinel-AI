const GRADE_COLOR = { A: '#22c55e', B: '#84cc16', C: '#f59e0b', D: '#ef4444' }

function Bar({ value }) {
  const color = value >= 90 ? '#22c55e' : value >= 80 ? '#3b82f6' : value >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <div style={s.track}>
      <div style={{ ...s.fill, width: `${value}%`, background: color }} />
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={s.row}>
      <span style={s.label}>{label}</span>
      <Bar value={value} />
      <span style={s.val}>{value}%</span>
    </div>
  )
}

export default function ConfidenceCard({ confidence }) {
  const gradeColor = GRADE_COLOR[confidence.grade] ?? '#9ca3af'
  return (
    <div style={s.card}>
      <div style={s.header}>
        <span style={s.title}>Confidence Scores</span>
        <span style={{ ...s.grade, color: gradeColor, borderColor: gradeColor }}>
          Grade {confidence.grade}
        </span>
      </div>
      <Row label="Segmentation" value={confidence.segmentation} />
      <Row label="Scene Understanding" value={confidence.scene_understanding} />
      <div style={s.divider} />
      <Row label="Overall" value={confidence.overall} />
    </div>
  )
}

const s = {
  card: { background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '1rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  title: { color: '#e5e7eb', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  grade: { fontSize: '0.72rem', fontWeight: 700, border: '1px solid', borderRadius: 9999, padding: '0.15rem 0.5rem' },
  row: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' },
  label: { color: '#6b7280', fontSize: '0.72rem', width: 130, flexShrink: 0 },
  track: { flex: 1, height: 5, background: '#1f2937', borderRadius: 9999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 9999, transition: 'width 0.5s ease' },
  val: { color: '#9ca3af', fontSize: '0.72rem', width: 36, textAlign: 'right' },
  divider: { borderTop: '1px solid #1f2937', margin: '0.5rem 0' },
}
