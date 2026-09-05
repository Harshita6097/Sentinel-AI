import { useEffect, useState } from 'react'

export default function Header() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header style={s.header}>
      <div style={s.brand}>
        <span style={s.logo}>🛰️</span>
        <div>
          <div style={s.title}>Sentinel AI</div>
          <div style={s.sub}>Emergency Command Center</div>
        </div>
      </div>
      <div style={s.right}>
        <div style={s.pill}>
          <span style={s.dot} />
          Backend Connecting…
        </div>
        <div style={s.clock}>
          SIM {time.toUTCString().slice(17, 25)} UTC
        </div>
      </div>
    </header>
  )
}

const s = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 1.5rem', height: 56, background: '#0d1117',
    borderBottom: '1px solid #1f2937', flexShrink: 0, zIndex: 1000,
  },
  brand: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  logo: { fontSize: '1.6rem' },
  title: { color: '#f9fafb', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.02em' },
  sub: { color: '#6b7280', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' },
  right: { display: 'flex', alignItems: 'center', gap: '1rem' },
  pill: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    background: '#1f2937', border: '1px solid #374151',
    borderRadius: 9999, padding: '0.25rem 0.75rem',
    color: '#9ca3af', fontSize: '0.75rem',
  },
  dot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#f59e0b', display: 'inline-block',
  },
  clock: { color: '#4b5563', fontSize: '0.75rem', fontFamily: 'monospace' },
}
