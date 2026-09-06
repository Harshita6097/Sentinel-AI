import { useDashboard } from '../context/DashboardContext'

const ALERT_COLOR = { Green: '#22c55e', Yellow: '#eab308', Orange: '#f97316', Red: '#ef4444' }
const RISK_COLOR  = { Low: '#22c55e', Medium: '#eab308', High: '#f97316', Critical: '#ef4444' }

function Metric({ label, value, color, sub }) {
  return (
    <div style={s.metric}>
      <div style={{ ...s.metricVal, color: color ?? '#e5e7eb' }}>{value ?? '—'}</div>
      <div style={s.metricLabel}>{label}</div>
      {sub && <div style={s.metricSub}>{sub}</div>}
    </div>
  )
}

export default function COPSummary() {
  const { cop, resources, routes, road_closures } = useDashboard()

  const openInc    = (cop?.incidents ?? []).filter(i => i.status === 'Open').length
  const critInc    = (cop?.incidents ?? []).filter(i => i.severity_label === 'Critical').length
  const available  = resources.filter(r => r.status === 'Available').length
  const assigned   = resources.filter(r => r.status === 'Assigned').length
  const closures   = road_closures.length
  const activeRts  = routes.filter(r => r.status === 'Active').length
  const alertLevel = cop?.weather?.alert_level ?? 'Green'
  const floodRisk  = cop?.flood?.risk_level ?? 'Low'

  return (
    <div style={s.root}>
      <Metric label="Open Incidents" value={openInc}   color={openInc > 0 ? '#f97316' : '#22c55e'} sub={critInc > 0 ? `${critInc} critical` : null} />
      <div style={s.divider} />
      <Metric label="Available Assets" value={available} color="#22c55e" sub={assigned > 0 ? `${assigned} assigned` : null} />
      <div style={s.divider} />
      <Metric label="Active Routes"  value={activeRts}  color="#3b82f6" sub={closures > 0 ? `${closures} blocked` : null} />
      <div style={s.divider} />
      <Metric label="Weather Alert"  value={alertLevel} color={ALERT_COLOR[alertLevel]} />
      <div style={s.divider} />
      <Metric label="Flood Risk"     value={floodRisk}  color={RISK_COLOR[floodRisk]} sub={cop?.flood?.detected ? `${cop.flood.coverage_percent}% coverage` : null} />
    </div>
  )
}

const s = {
  root:        { display: 'flex', alignItems: 'center', gap: '0', background: '#0d1117', borderBottom: '1px solid #1f2937', flexShrink: 0, overflow: 'hidden' },
  metric:      { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem 1.2rem', minWidth: 90 },
  metricVal:   { fontWeight: 700, fontSize: '1.1rem', fontFamily: 'monospace', lineHeight: 1.2 },
  metricLabel: { color: '#4b5563', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 },
  metricSub:   { color: '#374151', fontSize: '0.58rem', marginTop: 1 },
  divider:     { width: 1, height: 32, background: '#1f2937', flexShrink: 0 },
}
