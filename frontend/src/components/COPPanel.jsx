const ALERT_COLOR = { Green:'var(--green)', Yellow:'var(--amber)', Orange:'var(--orange)', Red:'var(--red)' }
const RISK_COLOR  = { Low:'var(--green)', Medium:'var(--amber)', High:'var(--orange)', Critical:'var(--red)' }

function KVGroup({ label, children }) {
  return (
    <div style={s.group}>
      <div style={s.gLabel}>{label}</div>
      {children}
    </div>
  )
}

function KVRow({ label, value, color }) {
  return (
    <div style={s.row}>
      <span style={s.rowLabel}>{label}</span>
      <span style={{ ...s.rowVal, color: color ?? 'var(--white)' }}>{value ?? '—'}</span>
    </div>
  )
}

export default function COPPanel({ cop }) {
  if (!cop) return <div style={s.empty}>Awaiting COP data…</div>
  const { sim_time, sim_running, weather, flood, incidents, resources, routes, road_closures, priority_zone, last_updated, update_count } = cop
  const available = (resources ?? []).filter(r => r.status === 'Available').length
  const assigned  = (resources ?? []).filter(r => r.status === 'Assigned').length
  const openInc   = (incidents ?? []).filter(i => i.status === 'Open').length
  const critInc   = (incidents ?? []).filter(i => i.severity_label === 'Critical').length

  return (
    <div style={s.root}>
      <div style={s.meta}>COP #{update_count} · <span style={{ fontFamily:'var(--mono)' }}>{last_updated}</span></div>

      <KVGroup label="Simulation">
        <KVRow label="Time"   value={sim_time} />
        <KVRow label="Status" value={sim_running ? 'Running' : 'Paused'} color={sim_running ? 'var(--green)' : 'var(--text-2)'} />
        {priority_zone && <KVRow label="Priority Zone" value={priority_zone} color="var(--orange)" />}
      </KVGroup>

      <KVGroup label="Weather">
        <KVRow label="Condition" value={weather?.condition} />
        <KVRow label="Rainfall"  value={weather?.rainfall_mm_hr != null ? `${weather.rainfall_mm_hr} mm/hr` : null} />
        <KVRow label="Alert"     value={weather?.alert_level} color={ALERT_COLOR[weather?.alert_level]} />
        <KVRow label="Wind"      value={weather?.wind_kmh != null ? `${weather.wind_kmh} km/h` : null} />
      </KVGroup>

      <KVGroup label="Flood Assessment">
        <KVRow label="Detected"   value={flood?.detected ? 'Yes' : 'No'} color={flood?.detected ? 'var(--red)' : 'var(--green)'} />
        <KVRow label="Coverage"   value={flood?.coverage_percent != null ? `${flood.coverage_percent}%` : null} />
        <KVRow label="Risk Level" value={flood?.risk_level} color={RISK_COLOR[flood?.risk_level]} />
        <KVRow label="Depth"      value={flood?.water_depth} />
      </KVGroup>

      <KVGroup label="Resources & Routes">
        <KVRow label="Available" value={available} color="var(--green)" />
        <KVRow label="Assigned"  value={assigned}  color="var(--blue)" />
        <KVRow label="Routes"    value={(routes ?? []).length} />
        <KVRow label="Closures"  value={(road_closures ?? []).length} color={(road_closures ?? []).length > 0 ? 'var(--red)' : 'var(--text-2)'} />
      </KVGroup>

      <KVGroup label="Incidents">
        <KVRow label="Open"     value={openInc} color={openInc > 0 ? 'var(--orange)' : 'var(--green)'} />
        <KVRow label="Critical" value={critInc} color={critInc > 0 ? 'var(--red)' : 'var(--text-2)'} />
      </KVGroup>
    </div>
  )
}

const s = {
  root:     { display:'flex', flexDirection:'column', gap:'var(--sp-2)' },
  meta:     { fontSize:9.5, color:'var(--text-3)', marginBottom:2 },
  group:    { marginBottom:14 },
  gLabel:   { fontSize:9.5, textTransform:'uppercase', letterSpacing:'.6px', color:'var(--text-2)', fontWeight:800, marginBottom:6 },
  row:      { display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', color:'var(--text-1)', borderBottom:'1px solid var(--border-soft)' },
  rowLabel: { color:'var(--text-2)' },
  rowVal:   { fontFamily:'var(--mono)', fontWeight:600 },
  empty:    { color:'var(--text-3)', fontSize:12, textAlign:'center', padding:'2rem 0' },
}
