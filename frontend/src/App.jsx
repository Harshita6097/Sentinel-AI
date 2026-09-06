import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import VisionDashboard from './pages/VisionDashboard'

const PAGES = {
  dashboard: Dashboard,
  vision: VisionDashboard,
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const Page = PAGES[page] ?? Dashboard

  return (
    <div style={s.root}>
      <nav style={s.nav}>
        <NavBtn label="🗺️ Command Center" id="dashboard" active={page} onClick={setPage} />
        <NavBtn label="🛰️ Vision Agent" id="vision" active={page} onClick={setPage} />
      </nav>
      <div style={s.content}>
        <Page />
      </div>
    </div>
  )
}

function NavBtn({ label, id, active, onClick }) {
  const isActive = active === id
  return (
    <button
      style={{ ...s.navBtn, ...(isActive ? s.navBtnActive : {}) }}
      onClick={() => onClick(id)}
    >
      {label}
    </button>
  )
}

const s = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0f1e', fontFamily: 'system-ui, sans-serif' },
  nav: {
    display: 'flex', gap: '0.25rem', padding: '0.4rem 1rem',
    background: '#060a14', borderBottom: '1px solid #1f2937',
    flexShrink: 0, zIndex: 2000,
  },
  navBtn: {
    background: 'transparent', border: '1px solid transparent',
    color: '#4b5563', borderRadius: 6, padding: '0.3rem 0.9rem',
    fontSize: '0.78rem', cursor: 'pointer', fontWeight: 500,
  },
  navBtnActive: { background: '#111827', border: '1px solid #1f2937', color: '#e5e7eb' },
  content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
}
