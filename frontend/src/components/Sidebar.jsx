const SECTIONS = [
  {
    title: 'Common Operating Picture',
    icon: '🗺️',
    items: ['Flood extent: Awaiting satellite data', 'Damage assessment: Pending', 'Affected zones: 0 identified'],
  },
  {
    title: 'Active Incidents',
    icon: '🚨',
    items: ['No active incidents reported', 'SOS feed: Offline', 'Last update: —'],
  },
  {
    title: 'Resource Status',
    icon: '📦',
    items: ['Hospitals: 3 operational', 'Shelters: 3 operational', 'Supply depots: 2 operational'],
  },
  {
    title: 'Commander Recommendations',
    icon: '🤖',
    items: ['AI agents not yet active', 'Rescue priorities: Pending', 'Route optimization: Pending'],
  },
]

export default function Sidebar({ locationCount }) {
  return (
    <aside style={s.sidebar}>
      <div style={s.summary}>
        <span style={s.summaryNum}>{locationCount}</span>
        <span style={s.summaryLabel}>Locations Loaded</span>
      </div>

      {SECTIONS.map(({ title, icon, items }) => (
        <div key={title} style={s.section}>
          <div style={s.sectionTitle}>
            <span>{icon}</span> {title}
          </div>
          {items.map((item) => (
            <div key={item} style={s.item}>{item}</div>
          ))}
        </div>
      ))}

      <div style={s.footer}>Sentinel AI v0.2 · Milestone 2</div>
    </aside>
  )
}

const s = {
  sidebar: {
    width: 280, flexShrink: 0, background: '#0d1117',
    borderRight: '1px solid #1f2937', overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: '0.25rem',
    padding: '1rem 0.75rem',
  },
  summary: {
    display: 'flex', alignItems: 'baseline', gap: '0.5rem',
    background: '#111827', border: '1px solid #1f2937',
    borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.5rem',
  },
  summaryNum: { color: '#3b82f6', fontSize: '1.8rem', fontWeight: 700 },
  summaryLabel: { color: '#6b7280', fontSize: '0.75rem' },
  section: {
    background: '#111827', border: '1px solid #1f2937',
    borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem',
  },
  sectionTitle: {
    color: '#e5e7eb', fontSize: '0.78rem', fontWeight: 600,
    letterSpacing: '0.04em', textTransform: 'uppercase',
    marginBottom: '0.5rem', display: 'flex', gap: '0.4rem', alignItems: 'center',
  },
  item: {
    color: '#6b7280', fontSize: '0.75rem',
    padding: '0.2rem 0', borderTop: '1px solid #1f2937',
  },
  footer: {
    marginTop: 'auto', paddingTop: '1rem',
    color: '#374151', fontSize: '0.7rem', textAlign: 'center',
  },
}
