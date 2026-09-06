import { useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { api } from '../services/api'

const SPEEDS = [1, 2, 5]

export default function PlaybackBar() {
  const { sim, play, pause, reset, step, setSpeed } = useDashboard()
  const [sosText,    setSosText]    = useState('')
  const [sosLoading, setSosLoading] = useState(false)

  const pct = Math.round(sim.progress * 100)

  const handleSOS = async () => {
    if (!sosText.trim()) return
    setSosLoading(true)
    try {
      await api.submitReport(sosText.trim())
      setSosText('')
    } catch { /* ignore */ } finally {
      setSosLoading(false)
    }
  }

  return (
    <div style={s.bar}>
      {/* Playback controls */}
      <div style={s.controls}>
        <button style={s.btn} onClick={sim.paused ? play : pause} title={sim.paused ? 'Play' : 'Pause'}>
          {sim.paused ? '▶' : '⏸'}
        </button>
        <button style={s.btn} onClick={step} title="Step +1 min">⏭</button>
        <button style={{ ...s.btn, color: '#f59e0b' }} onClick={reset} title="Reset">↺</button>
        <div style={s.speeds}>
          {SPEEDS.map(sp => (
            <button
              key={sp}
              style={{ ...s.speed, ...(sim.speed === sp ? s.speedActive : {}) }}
              onClick={() => setSpeed(sp)}
            >
              {sp}×
            </button>
          ))}
        </div>
      </div>

      {/* Timeline progress */}
      <div style={s.timeline}>
        <span style={s.tlLabel}>09:00</span>
        <div style={s.track}>
          <div style={{ ...s.fill, width: `${pct}%` }} />
        </div>
        <span style={s.tlLabel}>14:30</span>
        <span style={s.tlPct}>{pct}%</span>
        <span style={s.evCount}>{sim.active_events.length} events</span>
      </div>

      {/* Quick SOS input */}
      <div style={s.sos}>
        <input
          style={s.sosInput}
          placeholder="Quick SOS report…"
          value={sosText}
          onChange={e => setSosText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSOS()}
        />
        <button
          style={{ ...s.sosBtn, opacity: sosLoading ? 0.6 : 1 }}
          onClick={handleSOS}
          disabled={sosLoading || !sosText.trim()}
        >
          {sosLoading ? '…' : '🚨 SOS'}
        </button>
      </div>
    </div>
  )
}

const s = {
  bar:       { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 0.75rem', height: 44, background: '#060a14', borderTop: '1px solid #1f2937', flexShrink: 0 },
  controls:  { display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 },
  btn:       { background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb', borderRadius: 5, padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem' },
  speeds:    { display: 'flex', gap: '0.2rem', marginLeft: '0.25rem' },
  speed:     { background: '#1f2937', border: '1px solid #374151', color: '#6b7280', borderRadius: 5, padding: '0.15rem 0.4rem', cursor: 'pointer', fontSize: '0.68rem' },
  speedActive:{ background: '#1d4ed8', border: '1px solid #3b82f6', color: '#bfdbfe' },
  timeline:  { display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 },
  tlLabel:   { color: '#374151', fontSize: '0.62rem', fontFamily: 'monospace', flexShrink: 0 },
  track:     { flex: 1, height: 5, background: '#1f2937', borderRadius: 9999, overflow: 'hidden' },
  fill:      { height: '100%', background: 'linear-gradient(90deg,#1d4ed8,#3b82f6)', borderRadius: 9999, transition: 'width 0.5s ease' },
  tlPct:     { color: '#3b82f6', fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 700, flexShrink: 0 },
  evCount:   { color: '#374151', fontSize: '0.62rem', flexShrink: 0 },
  sos:       { display: 'flex', gap: '0.3rem', flexShrink: 0 },
  sosInput:  { background: '#111827', border: '1px solid #1f2937', color: '#d1d5db', borderRadius: 5, padding: '0.2rem 0.5rem', fontSize: '0.72rem', width: 200, outline: 'none' },
  sosBtn:    { background: '#450a0a', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: 5, padding: '0.2rem 0.6rem', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600 },
}
