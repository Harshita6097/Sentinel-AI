import { useEffect, useState } from 'react'
import { SimulationProvider } from '../context/SimulationContext'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import MapView from '../components/MapView'
import { api } from '../services/api'

function DashboardInner() {
  const [locations, setLocations] = useState([])
  const [network, setNetwork]     = useState(null)
  const [routes, setRoutes]       = useState([])
  const [error, setError]         = useState(null)

  useEffect(() => {
    api.getLocations()
      .then(setLocations)
      .catch(() => setError('Backend offline — map data unavailable'))
    api.getNetwork().then(setNetwork).catch(() => {})
  }, [])

  // Poll routes every 3s so map updates when assignments change
  useEffect(() => {
    const fetch = () => api.getRoutes().then(setRoutes).catch(() => {})
    fetch()
    const t = setInterval(fetch, 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={s.root}>
      <Header />
      <div style={s.body}>
        <Sidebar locationCount={locations.length} />
        <div style={s.mapWrap}>
          {error
            ? <div style={s.error}>{error}</div>
            : <MapView locations={locations} network={network} routes={routes} />
          }
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <SimulationProvider>
      <DashboardInner />
    </SimulationProvider>
  )
}

const s = {
  root: {
    display: 'flex', flexDirection: 'column',
    flex: 1, background: '#0a0f1e',
    fontFamily: 'system-ui, sans-serif', overflow: 'hidden',
  },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  mapWrap: { flex: 1, position: 'relative', overflow: 'hidden' },
  error: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', color: '#ef4444', fontSize: '0.9rem',
  },
}
