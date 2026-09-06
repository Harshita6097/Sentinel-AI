import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import VisionDashboard from './pages/VisionDashboard'
import EmergencyDashboard from './pages/EmergencyDashboard'

const PAGES = {
  dashboard: Dashboard,
  vision:    VisionDashboard,
  emergency: EmergencyDashboard,
}

const NAV = [
  { id: 'dashboard', label: '🗺️ Command Center' },
  { id: 'vision',    label: '🛰️ Vision Agent' },
  { id: 'emergency', label: '🚨 Emergency Intel' },
]

export default function App() {
  const [page, setPage] = useState('dashboard')
  const Page = PAGES[page] ?? Dashboard

  return (
    <div style={s.root}>
      <nav style={s.nav}>
        {NAV.map(({ id, label }) => (
          <button
            key={id}
            style={{ ...s.navBtn, ...(page === id ? s.navBtnActive : {}) }}
            onClick={() => setPage(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div style={s.content}>
        <Page />
      </div>
    </div>
  )
}

const s = {
  root:        { display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0f1e', fontFamily: 'system-ui, sans-serif' },
  nav:         { display: 'flex', gap: '0.25rem', padding: '0.4rem 1rem', background: '#060a14', borderBottom: '1px solid #1f2937', flexShrink: 0, zIndex: 2000 },
  navBtn:      { background: 'transparent', border: '1px solid transparent', color: '#4b5563', borderRadius: 6, padding: '0.3rem 0.9rem', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 500 },
  navBtnActive:{ background: '#111827', border: '1px solid #1f2937', color: '#e5e7eb' },
  content:     { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
}
