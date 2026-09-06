import { useDashboard } from '../context/DashboardContext'

const ALERT_COLOR = { Green: '#22c55e', Yellow: '#eab308', Orange: '#f97316', Red: '#ef4444' }

export default function SystemStatusBar() {
  const { sim, cop, alerts, connected, recomputing, recompute } = useDashboard()

  const alertLevel  = cop?.weather?.alert_level ?? 'Green'
  const critCount   = alerts.filter(a => a.severity === 'critical').length
  const highCount   = alerts.filter(a => a.severity === 'high').length

  return (
    <div style={s.bar}>
      {/* Brand */}
      <div style={s.brand}>
        <span style={s.logo}>🛰️</span>
        <div>
          <div style={s.title}>Sentinel AI</div>
          <div style={s.sub}>Emergency Command Center</div>
        </div>
      </div>

      {/* Sim clock */}
      <div style={s.group}>
        <span style={s.groupLabel}>SIM TIME</span>
        <span style={s.clock}>{sim.time}</span>
        <span style={{ ...s.dot, background: sim.finished ? '#6b7280' : sim.paused ? '#f59e0b' : '#22c55e' }} />
        <span style={s.simStatus}>
          {sim.finished ? 'Finished' : sim.paused ? 'Paused' : `${sim.speed}× Live`}
        </span>
      </div>

      {/* Weather alert */}
      <div style={s.group}>
        <span style={s.groupLabel}>WEATHER</span>
        <span style={{ ...s.alertBadge, color: ALERT_COLOR[alertLevel], borderColor: ALERT_COLOR[alertLevel] }}>
          {alertLevel} Alert
        </span>
      </div>

      {/* Active alerts */}
      {(critCount + highCount) > 0 && (
        <div style={s.group}>
          {critCount > 0 && <span style={s.critBadge}>{critCount} CRITICAL</span>}
          {highCount > 0 && <span style={s.highBadge}>{highCount} HIGH</span>}
        </div>
      )}

      {/* Priority zone */}
      {cop?.priority_zone && (
        <div style={s.group}>
          <span style={s.groupLabel}>PRIORITY</span>
          <span style={s.priorityZone}>{cop.priority_zone}</span>
        </div>
      )}

      {/* Right side */}
      <div style={s.right}>
        <button
          style={{ ...s.recomputeBtn, opacity: recomputing ? 0.6 : 1 }}
          onClick={recompute}
          disabled={recomputing}
          title="Run Commander recompute cycle"
        >
          {recomputing ? '⟳ Computing…' : '⟳ Recompute'}
        </button>
        <div style={s.connPill}>
          <span style={{ ...s.dot, background: connected ? '#22c55e' : '#ef4444' }} />
          {connected ? 'Connected' : 'Offline'}
        </div>
      </div>
    </div>
  )
}

const s = {
  bar:          { display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0 1rem', height: 52, background: '#060a14', borderBottom: '1px solid #1f2937', flexShrink: 0, zIndex: 2000, overflow: 'hidden' },
  brand:        { display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 },
  logo:         { fontSize: '1.4rem' },
  title:        { color: '#f9fafb', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 },
  sub:          { color: '#374151', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  group:        { display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 },
  groupLabel:   { color: '#374151', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  clock:        { color: '#3b82f6', fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' },
  dot:          { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  simStatus:    { color: '#6b7280', fontSize: '0.7rem' },
  alertBadge:   { border: '1px solid', borderRadius: 4, padding: '0.1rem 0.4rem', fontSize: '0.68rem', fontWeight: 600 },
  critBadge:    { background: '#450a0a', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 4, padding: '0.1rem 0.4rem', fontSize: '0.65rem', fontWeight: 700 },
  highBadge:    { background: '#431407', color: '#f97316', border: '1px solid #f97316', borderRadius: 4, padding: '0.1rem 0.4rem', fontSize: '0.65rem', fontWeight: 700 },
  priorityZone: { color: '#f97316', fontWeight: 700, fontSize: '0.75rem' },
  right:        { display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto', flexShrink: 0 },
  recomputeBtn: { background: '#1e3a5f', border: '1px solid #3b82f6', color: '#60a5fa', borderRadius: 6, padding: '0.25rem 0.7rem', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 },
  connPill:     { display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#111827', border: '1px solid #1f2937', borderRadius: 9999, padding: '0.2rem 0.6rem', color: '#6b7280', fontSize: '0.7rem' },
}
