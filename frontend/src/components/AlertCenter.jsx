import { useDashboard } from '../context/DashboardContext'

const SEV_COLOR = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#f59e0b',
  low:      '#22c55e',
}

export default function AlertCenter() {
  const { alerts } = useDashboard()

  if (alerts.length === 0) {
    return (
      <div style={s.empty}>
        <span style={s.emptyIcon}>✅</span>
        <span>No active alerts</span>
      </div>
    )
  }

  return (
    <div style={s.root}>
      {alerts.map(alert => {
        const color = SEV_COLOR[alert.severity] ?? '#6b7280'
        return (
          <div key={alert.id} style={{ ...s.row, borderLeftColor: color }}>
            <span style={s.icon}>{alert.icon}</span>
            <div style={s.body}>
              <div style={{ ...s.title, color }}>{alert.title}</div>
              <div style={s.detail}>{alert.detail?.slice(0, 80)}</div>
            </div>
            <span style={s.time}>{alert.time}</span>
          </div>
        )
      })}
    </div>
  )
}

const s = {
  root:      { display: 'flex', flexDirection: 'column', gap: '0.3rem', overflowY: 'auto' },
  row:       { display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: '#111827', borderLeft: '3px solid', borderRadius: '0 6px 6px 0', padding: '0.45rem 0.6rem' },
  icon:      { fontSize: '0.9rem', flexShrink: 0, marginTop: 1 },
  body:      { flex: 1, minWidth: 0 },
  title:     { fontWeight: 600, fontSize: '0.72rem', lineHeight: 1.3 },
  detail:    { color: '#4b5563', fontSize: '0.65rem', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  time:      { color: '#374151', fontSize: '0.62rem', fontFamily: 'monospace', flexShrink: 0 },
  empty:     { display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#374151', fontSize: '0.72rem', padding: '0.5rem 0' },
  emptyIcon: { fontSize: '0.9rem' },
}
