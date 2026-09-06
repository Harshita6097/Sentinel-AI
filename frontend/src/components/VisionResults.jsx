import ConfidenceCard from './ConfidenceCard'

const RISK_COLOR = { Low: '#22c55e', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' }
const DEPTH_LABEL = { shallow: '< 30 cm', moderate: '30–80 cm', deep: '> 80 cm' }

export default function VisionResults({ result }) {
  const { analysis, scene_description, confidence } = result
  const riskColor = RISK_COLOR[analysis.risk_level] ?? '#9ca3af'

  return (
    <div style={s.wrap}>

      {/* Flood Status Banner */}
      <div style={{ ...s.banner, borderColor: riskColor, background: riskColor + '18' }}>
        <div style={s.bannerLeft}>
          <span style={s.bannerIcon}>{analysis.flood_detected ? '🌊' : '✅'}</span>
          <div>
            <div style={{ ...s.bannerTitle, color: riskColor }}>
              {analysis.flood_detected ? 'Flood Detected' : 'No Flood Detected'}
            </div>
            <div style={s.bannerSub}>Risk Level: {analysis.risk_level}</div>
          </div>
        </div>
        <div style={s.stats}>
          <Stat label="Coverage" value={`${analysis.coverage_percent}%`} color={riskColor} />
          <Stat label="Depth" value={DEPTH_LABEL[analysis.water_depth_estimate] ?? '—'} color="#9ca3af" />
          <Stat label="Model" value={analysis.model_used} color="#4b5563" small />
        </div>
      </div>

      {/* Affected Zones */}
      <Section title="Affected Zones">
        <div style={s.tags}>
          {analysis.affected_zones.map(z => (
            <span key={z} style={s.tag}>{z}</span>
          ))}
        </div>
      </Section>

      {/* Scene Description */}
      <Section title="Scene Understanding">
        <p style={s.caption}>{scene_description.caption}</p>
        <ul style={s.obs}>
          {scene_description.key_observations.map(o => (
            <li key={o} style={s.obsItem}>◦ {o}</li>
          ))}
        </ul>
        <div style={s.infraRow}>
          <InfoRow label="Infrastructure" value={scene_description.infrastructure_status} />
          <InfoRow label="Civilians" value={scene_description.civilian_presence} />
        </div>
      </Section>

      {/* Confidence */}
      <ConfidenceCard confidence={confidence} />

      {/* Hash */}
      <div style={s.hash}>Image hash: {result.image_hash}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>{title}</div>
      {children}
    </div>
  )
}

function Stat({ label, value, color, small }) {
  return (
    <div style={s.stat}>
      <div style={{ ...s.statVal, color, fontSize: small ? '0.7rem' : '1.1rem' }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}:</span>
      <span style={s.infoVal}>{value}</span>
    </div>
  )
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  banner: { border: '1px solid', borderRadius: 8, padding: '0.9rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' },
  bannerLeft: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  bannerIcon: { fontSize: '1.8rem' },
  bannerTitle: { fontWeight: 700, fontSize: '1rem' },
  bannerSub: { color: '#6b7280', fontSize: '0.75rem' },
  stats: { display: 'flex', gap: '1.5rem' },
  stat: { textAlign: 'center' },
  statVal: { fontWeight: 700 },
  statLabel: { color: '#4b5563', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  section: { background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.9rem 1rem' },
  sectionTitle: { color: '#e5e7eb', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' },
  caption: { color: '#d1d5db', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '0.6rem' },
  obs: { listStyle: 'none', padding: 0, marginBottom: '0.6rem' },
  obsItem: { color: '#9ca3af', fontSize: '0.75rem', padding: '0.15rem 0' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  tag: { background: '#1f2937', border: '1px solid #374151', color: '#9ca3af', borderRadius: 9999, padding: '0.2rem 0.6rem', fontSize: '0.72rem' },
  infraRow: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  infoRow: { display: 'flex', gap: '0.5rem', fontSize: '0.75rem' },
  infoLabel: { color: '#4b5563', flexShrink: 0 },
  infoVal: { color: '#9ca3af' },
  hash: { color: '#374151', fontSize: '0.65rem', textAlign: 'right', fontFamily: 'monospace' },
}
