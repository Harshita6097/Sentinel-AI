import { useDashboard } from '../context/DashboardContext'

const SEV_COLOR = { critical:'var(--red)', high:'var(--orange)', medium:'var(--amber)', low:'var(--green)' }

export default function AlertCenter() {
  const { alerts } = useDashboard()

  if (!alerts.length) return (
    <div style={s.empty}>
      <span style={{ fontSize:11, color:'var(--green)' }}>✅</span>
      <span style={{ fontSize:12, color:'var(--text-3)' }}>No active alerts</span>
    </div>
  )

  return (
    <div style={s.root}>
      {alerts.map(alert => {
        const c = SEV_COLOR[alert.severity] ?? 'var(--text-2)'
        return (
          <div key={alert.id} style={s.row}>
            <span style={{ ...s.dot, background: c }} />
            <div style={s.txt}>
              <span style={{ color: c, fontWeight:700, fontSize:11.5 }}>{alert.title}</span>
              {alert.detail && <span style={{ color:'var(--text-2)', fontSize:11 }}> — {alert.detail.slice(0,80)}</span>}
            </div>
            <span style={s.time}>{alert.time}</span>
          </div>
        )
      })}
    </div>
  )
}

const s = {
  root:  { display:'flex', flexDirection:'column', gap:6 },
  row:   { display:'flex', alignItems:'flex-start', gap:8, padding:8, borderRadius:'var(--r-sm)', background:'var(--panel-2)', fontSize:11.5 },
  dot:   { width:6, height:6, borderRadius:'50%', flexShrink:0, marginTop:4 },
  txt:   { flex:1, color:'var(--text-1)', lineHeight:1.35 },
  time:  { fontFamily:'var(--mono)', fontSize:9.5, color:'var(--text-2)', flexShrink:0 },
  empty: { display:'flex', alignItems:'center', gap:8, padding:'0.5rem 0' },
}
