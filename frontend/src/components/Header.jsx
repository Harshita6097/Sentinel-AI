import { useDashboard } from '../context/DashboardContext'
import { useSim } from '../context/SimulationContext'

const ALERT_COLOR  = { Green:'var(--green)', Yellow:'var(--amber)', Orange:'var(--orange)', Red:'var(--red)' }
const ALERT_BORDER = { Green:'rgba(34,197,94,.35)', Yellow:'rgba(245,158,11,.35)', Orange:'rgba(249,115,22,.35)', Red:'rgba(239,68,68,.35)' }

export default function Header({ page, onNav }) {
  const dash = useDashboard()
  // useSim is always available (SimulationProvider wraps sub-pages)
  const simCtx = useSim()

  // Prefer DashboardContext values; fall back to SimulationContext on sub-pages
  const sim        = dash?.sim        ?? simCtx?.sim        ?? { time:'--:--', paused:true, finished:false, speed:1 }
  const cop        = dash?.cop        ?? null
  const connected  = dash?.connected  ?? simCtx?.connected  ?? false
  const recomputing= dash?.recomputing ?? false
  const recompute  = dash?.recompute  ?? (() => {})

  const alertLevel = cop?.weather?.alert_level ?? 'Green'
  const isPaused   = sim.paused || sim.finished

  const NAV = [
    { id:'dashboard', label:'Dashboard' },
    { id:'vision',    label:'Vision' },
    { id:'emergency', label:'Emergency' },
    { id:'logistics', label:'Logistics' },
  ]

  return (
    <header style={s.header}>
      {/* Brand */}
      <div style={s.brand}>
        <div style={s.logo}>🛰️</div>
        <div>
          <div style={s.name}>Sentinel AI</div>
          <div style={s.sub}>Emergency Command Center</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={s.nav}>
        {NAV.map(({ id, label }) => (
          <button key={id} style={{ ...s.navBtn, ...(page === id ? s.navActive : {}) }} onClick={() => onNav(id)}>
            {label}
          </button>
        ))}
      </nav>

      {/* Right controls */}
      <div style={s.right}>
        <div style={s.simClock}>
          <span style={{ ...s.pauseDot, background: isPaused ? 'var(--amber)' : 'var(--green)' }} />
          <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:'var(--white)' }}>
            {sim.time}
          </span>
          <span style={{ fontSize:11, color:'var(--text-2)' }}>
            · {sim.finished ? 'Finished' : isPaused ? 'Paused' : `${sim.speed}× Live`}
          </span>
        </div>

        <div style={{ ...s.weatherPill, color: ALERT_COLOR[alertLevel], borderColor: ALERT_BORDER[alertLevel] }}>
          ● {alertLevel} Alert
        </div>

        <button
          style={{ ...s.recomputeBtn, opacity: recomputing ? 0.6 : 1 }}
          onClick={recompute}
          disabled={recomputing}
        >
          ↻ {recomputing ? 'Computing…' : 'Recompute'}
        </button>

        <div style={{ ...s.connPill, background: connected ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: connected ? 'var(--green)' : 'var(--red)' }}>
          <span style={{ ...s.dot, background: connected ? 'var(--green)' : 'var(--red)', boxShadow: connected ? '0 0 5px var(--green)' : 'none' }} />
          {connected ? 'Connected' : 'Offline'}
        </div>
      </div>
    </header>
  )
}

const s = {
  header:      { background:'var(--bg-deep)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', padding:'0 var(--sp-5)', gap:'var(--sp-5)', height:56, flexShrink:0, zIndex:2000 },
  brand:       { display:'flex', alignItems:'center', gap:'var(--sp-2)', flexShrink:0 },
  logo:        { width:28, height:28, borderRadius:7, background:'var(--panel-2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 },
  name:        { fontWeight:800, fontSize:14, color:'var(--white)', lineHeight:1.1 },
  sub:         { fontSize:9.5, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.6px' },
  nav:         { display:'flex', gap:2 },
  navBtn:      { padding:'7px 13px', fontSize:12.5, color:'var(--text-2)', borderRadius:'var(--r-sm)', fontWeight:600, background:'transparent', border:'none', cursor:'pointer' },
  navActive:   { background:'var(--panel-2)', color:'var(--white)' },
  right:       { marginLeft:'auto', display:'flex', alignItems:'center', gap:'var(--sp-3)' },
  simClock:    { display:'flex', alignItems:'center', gap:6 },
  pauseDot:    { width:6, height:6, borderRadius:'50%', flexShrink:0 },
  weatherPill: { display:'flex', alignItems:'center', gap:6, fontSize:11, padding:'5px 10px', border:'1px solid', borderRadius:20, fontWeight:600 },
  recomputeBtn:{ background:'var(--blue)', color:'#fff', border:'none', padding:'7px 13px', borderRadius:'var(--r-sm)', fontSize:11.5, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5 },
  connPill:    { display:'flex', alignItems:'center', gap:6, fontSize:11, padding:'5px 10px', borderRadius:20, fontWeight:700 },
  dot:         { width:6, height:6, borderRadius:'50%', flexShrink:0 },
}
