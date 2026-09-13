import { useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { api } from '../services/api'

const SPEEDS = [1, 2, 5]

export default function PlaybackBar({ onToggleTimeline }) {
  const { sim, play, pause, reset, step, setSpeed } = useDashboard()
  const [sosText, setSosText]     = useState('')
  const [sosLoading, setSosLoading] = useState(false)
  const pct = Math.round(sim.progress * 100)

  const handleSOS = async () => {
    if (!sosText.trim()) return
    setSosLoading(true)
    try { await api.submitReport(sosText.trim()); setSosText('') }
    catch { /* ignore */ } finally { setSosLoading(false) }
  }

  return (
    <div style={s.bar}>
      <button style={s.ctl} onClick={reset} title="Reset">⏮</button>
      <button style={{ ...s.ctl, ...s.play }} onClick={sim.paused ? play : pause}>
        {sim.paused ? '▶' : '⏸'}
      </button>
      <button style={s.ctl} onClick={step} title="Step">⏭</button>

      <div style={s.speeds}>
        {SPEEDS.map(sp => (
          <button key={sp} style={{ ...s.speed, ...(sim.speed === sp ? s.speedOn : {}) }} onClick={() => setSpeed(sp)}>
            {sp}×
          </button>
        ))}
      </div>

      <span style={s.clockSm}>09:00 → 14:30</span>

      <div style={s.scrub}>
        <div style={{ ...s.fill, width:`${pct}%` }} />
        <div style={{ ...s.scrubDot, left:`${pct}%` }} />
      </div>

      <input
        style={s.sosInput}
        placeholder="Quick SOS report…"
        value={sosText}
        onChange={e => setSosText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSOS()}
      />
      <button style={{ ...s.sosBtn, opacity: sosLoading ? 0.6 : 1 }} onClick={handleSOS} disabled={sosLoading || !sosText.trim()}>
        🚨 SOS
      </button>

      {onToggleTimeline && (
        <button style={s.ctl} onClick={onToggleTimeline} title="Activity feed">☰</button>
      )}
    </div>
  )
}

const s = {
  bar:      { background:'var(--panel)', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', padding:'0 var(--sp-5)', gap:'var(--sp-3)', height:52, flexShrink:0 },
  ctl:      { background:'var(--panel-2)', border:'1px solid var(--border)', color:'var(--white)', width:30, height:30, borderRadius:'var(--r-sm)', cursor:'pointer', fontSize:12, flexShrink:0 },
  play:     { background:'var(--green)', color:'#03210f', border:'none' },
  speeds:   { display:'flex', gap:2 },
  speed:    { background:'var(--panel-2)', border:'1px solid var(--border)', color:'var(--text-2)', fontSize:10, padding:'5px 8px', borderRadius:5, cursor:'pointer', fontWeight:700 },
  speedOn:  { background:'var(--blue)', color:'#fff', borderColor:'var(--blue)' },
  clockSm:  { fontFamily:'var(--mono)', fontSize:11, color:'var(--text-2)', flexShrink:0 },
  scrub:    { flex:1, height:4, background:'var(--border-soft)', borderRadius:2, position:'relative', margin:'0 8px' },
  fill:     { position:'absolute', left:0, top:0, height:'100%', background:'var(--blue)', borderRadius:2, transition:'width .5s ease' },
  scrubDot: { position:'absolute', top:'50%', transform:'translate(-50%,-50%)', width:11, height:11, borderRadius:'50%', background:'var(--blue)', border:'2px solid var(--bg-main)' },
  sosInput: { background:'var(--panel-2)', border:'1px solid var(--border)', color:'var(--white)', fontSize:11.5, padding:'7px 12px', borderRadius:20, width:220, flexShrink:0, outline:'none' },
  sosBtn:   { background:'var(--red)', color:'#fff', border:'none', padding:'7px 14px', borderRadius:20, fontSize:11.5, fontWeight:700, cursor:'pointer', flexShrink:0 },
}
