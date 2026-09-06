import { lazy, Suspense, useState } from 'react'
import { DashboardProvider } from './context/DashboardContext'
import { SimulationProvider } from './context/SimulationContext'
import DashboardShell from './components/DashboardShell'

// Legacy agent pages — lazy loaded so they don't block the main dashboard
const VisionDashboard    = lazy(() => import('./pages/VisionDashboard'))
const EmergencyDashboard = lazy(() => import('./pages/EmergencyDashboard'))
const LogisticsDashboard = lazy(() => import('./pages/LogisticsDashboard'))

const NAV = [
  { id: 'dashboard', label: '🛰️ Sentinel AI' },
  { id: 'vision',    label: '🔭 Vision' },
  { id: 'emergency', label: '🚨 Emergency' },
  { id: 'logistics', label: '🚚 Logistics' },
]

function PageFallback() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#374151', fontSize: '0.85rem' }}>Loading…</div>
}

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    // DashboardProvider wraps everything — provides unified state to all pages
    <DashboardProvider>
      {/* SimulationProvider wraps legacy pages that still use useSim() */}
      <SimulationProvider>
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
            <div style={s.navSpacer} />
            <span style={s.navHint}>Sentinel AI · Kerala Flood Response</span>
          </nav>

          <div style={s.content}>
            {page === 'dashboard' && <DashboardShell />}

            {page !== 'dashboard' && (
              <Suspense fallback={<PageFallback />}>
                {page === 'vision'    && <VisionDashboard />}
                {page === 'emergency' && <EmergencyDashboard />}
                {page === 'logistics' && <LogisticsDashboard />}
              </Suspense>
            )}
          </div>
        </div>
      </SimulationProvider>
    </DashboardProvider>
  )
}

const s = {
  root:         { display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0f1e', fontFamily: 'system-ui, sans-serif' },
  nav:          { display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0 0.75rem', height: 36, background: '#030712', borderBottom: '1px solid #111827', flexShrink: 0, zIndex: 3000 },
  navBtn:       { background: 'transparent', border: '1px solid transparent', color: '#374151', borderRadius: 5, padding: '0.2rem 0.75rem', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 500, transition: 'color 0.15s' },
  navBtnActive: { background: '#111827', border: '1px solid #1f2937', color: '#d1d5db' },
  navSpacer:    { flex: 1 },
  navHint:      { color: '#1f2937', fontSize: '0.62rem', letterSpacing: '0.06em' },
  content:      { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
}
