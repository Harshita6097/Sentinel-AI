const ALERT_COLOR = { Green: '#22c55e', Yellow: '#eab308', Orange: '#f97316', Red: '#ef4444' }
const RISK_COLOR  = { Low: '#22c55e', Medium: '#eab308', High: '#f97316', Critical: '#ef4444' }

function COPRow({ label, value, color }) {
  return (
    <div style={s.row}>
      <span style={s.label}>{label}</span>
      <span style={{ ...s.value, color: color ?? '#d1d5db' }}>{value ?? '—'}</span>
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

export default function COPPanel({ cop }) {
  if (!cop) return <div style={s.empty}>Awaiting COP data…</div>

  const { sim_time, sim_running, weather, flood, incidents, resources,
          routes, road_closures, priority_zone, last_updated, update_count } = cop

  const available = (resources ?? []).filter(r => r.status === 'Available').length
  const assigned  = (resources ?? []).filter(r => r.status === 'Assigned').length
  const openInc   = (incidents ?? []).filter(i => i.status === 'Open').length
  const critInc   = (incidents ?? []).filter(i => i.severity_label === 'Critical').length

  return (
    <div style={s.root}>
      <div style={s.header}>
        <span style={s.title}>Common Operating Picture</span>
        <span style={s.meta}>#{update_count} · {last_updated}</span>
      </div>

      <Section title="Simulation">
        <COPRow label="Time"    value={sim_time} />
        <COPRow label="Status"  value={sim_running ? 'Running' : 'Paused'} color={sim_running ? '#22c55e' : '#6b7280'} />
        {priority_zone && <COPRow label="Priority Zone" value={priority_zone} color="#f97316" />}
      </Section>

      <Section title="Weather">
        <COPRow label="Condition"  value={weather?.condition} />
        <COPRow label="Rainfall"   value={weather?.rainfall_mm_hr != null ? `${weather.rainfall_mm_hr} mm/hr` : null} />
        <COPRow label="Alert"      value={weather?.alert_level} color={ALERT_COLOR[weather?.alert_level]} />
        <COPRow label="Wind"       value={weather?.wind_kmh != null ? `${weather.wind_kmh} km/h` : null} />
      </Section>

      <Section title="Flood Assessment">
        <COPRow label="Detected"   value={flood?.detected ? 'Yes' : 'No'} color={flood?.detected ? '#ef4444' : '#22c55e'} />
        <COPRow label="Coverage"   value={flood?.coverage_percent != null ? `${flood.coverage_percent}%` : null} />
        <COPRow label="Risk Level" value={flood?.risk_level} color={RISK_COLOR[flood?.risk_level]} />
        <COPRow label="Depth"      value={flood?.water_depth} />
        <COPRow label="Source"     value={flood?.source} />
      </Section>

      <Section title="Incidents">
        <COPRow label="Open"     value={openInc} color={openInc > 0 ? '#f97316' : '#22c55e'} />
        <COPRow label="Critical" value={critInc} color={critInc > 0 ? '#ef4444' : '#6b7280'} />
        {(incidents ?? []).slice(0, 3).map(i => (
          <div key={i.id} style={s.incRow}>
            <span style={s.incId}>{i.id}</span>
            <span style={s.incLoc}>{i.location || '—'}</span>
            <span style={{ ...s.incSev, color: RISK_COLOR[i.severity_label] }}>{i.severity_label}</span>
          </div>
        ))}
      </Section>

      <Section title="Resources">
        <COPRow label="Available" value={available} color="#22c55e" />
        <COPRow label="Assigned"  value={assigned}  color="#3b82f6" />
        <COPRow label="Closures"  value={(road_closures ?? []).length} color={(road_closures ?? []).length > 0 ? '#ef4444' : '#6b7280'} />
        <COPRow label="Routes"    value={(routes ?? []).length} />
      </Section>
    </div>
  )
}

const s = {
  root:         { display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' },
  title:        { color: '#e5e7eb', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.04em' },
  meta:         { color: '#374151', fontSize: '0.62rem', fontFamily: 'monospace' },
  section:      { background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  sectionTitle: { color: '#4b5563', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem', fontWeight: 600 },
  row:          { display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' },
  label:        { color: '#4b5563' },
  value:        { fontFamily: 'monospace', fontSize: '0.7rem' },
  incRow:       { display: 'flex', gap: '0.4rem', fontSize: '0.68rem', alignItems: 'center' },
  incId:        { color: '#3b82f6', fontFamily: 'monospace', flexShrink: 0 },
  incLoc:       { color: '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  incSev:       { flexShrink: 0, fontWeight: 600, fontSize: '0.65rem' },
  empty:        { color: '#374151', fontSize: '0.75rem', textAlign: 'center', padding: '2rem 0' },
}
