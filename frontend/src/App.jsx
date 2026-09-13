import { lazy, Suspense, useState } from 'react'
import { DashboardProvider } from './context/DashboardContext'
import { SimulationProvider } from './context/SimulationContext'
import Header from './components/Header'
import DashboardShell from './components/DashboardShell'

const VisionDashboard    = lazy(() => import('./pages/VisionDashboard'))
const EmergencyDashboard = lazy(() => import('./pages/EmergencyDashboard'))
const LogisticsDashboard = lazy(() => import('./pages/LogisticsDashboard'))

function PageFallback() {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, color:'var(--text-3)', fontSize:12 }}>Loading…</div>
}

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <DashboardProvider>
      <SimulationProvider>
        <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'var(--bg-main)', fontFamily:'var(--sys)', overflow:'hidden' }}>
          <Header page={page} onNav={setPage} />
          <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
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
