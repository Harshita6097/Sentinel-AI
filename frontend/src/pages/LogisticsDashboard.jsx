import { useCallback, useEffect, useState } from 'react'
import { SimulationProvider } from '../context/SimulationContext'
import Header from '../components/Header'
import MapView from '../components/MapView'
import RoutePanel from '../components/RoutePanel'
import ResourcePanel from '../components/ResourcePanel'
import RoadStatusLegend from '../components/RoadStatusLegend'
import { api } from '../services/api'

function DashboardInner() {
  const [locations, setLocations] = useState([])
  const [network, setNetwork]     = useState(null)
  const [routes, setRoutes]       = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [tab, setTab]             = useState('routes')   // 'routes' | 'resources'

  const fetchAll = useCallback(() => {
    api.getRoutes().then(setRoutes).catch(() => {})
    api.getResources().then(setResources).catch(() => {})
    api.getNetwork().then(setNetwork).catch(() => {})
  }, [])

  useEffect(() => {
    api.getLocations().then(setLocations).catch(() => {})
    fetchAll()
    const t = setInterval(fetchAll, 3000)
    return () => clearInterval(t)
  }, [fetchAll])

  const handleAssign = async (body) => {
    setLoading(true)
    setError(null)
    try {
      await api.assignResource(body)
      fetchAll()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRecalculate = async () => {
    setLoading(true)
    setError(null)
    try {
      await api.recalculateRoutes()
      fetchAll()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignResource = async (resource) => {
    // Quick-assign: prompt for destination via simple select
    const dest = window.prompt(
      'Assign to destination:\n' +
      'Kochi, Alappuzha, Kottayam, Thiruvananthapuram, Thrissur, Palakkad, Pathanamthitta, Idukki, Ernakulam'
    )
    if (!dest) return
    await handleAssign({ destination: dest.trim(), resource_id: resource.id })
  }

  const closureCount = network?.edges?.filter(e => e.blocked).length ?? 0
  const activeCount  = routes.filter(r => r.status === 'Active').length
  const availCount   = resources.filter(r => r.status === 'Available').length

  return (
    <div style={s.root}>
      <Header />
      <div style={s.body}>

        {/* Left sidebar */}
        <div style={s.sidebar}>
          <div style={s.sidebarHeader}>🚚 Logistics Agent</div>

          {/* Stats */}
          <div style={s.statsRow}>
            <Stat label="Active Routes" value={activeCount}  color="#22c55e" />
            <Stat label="Available"     value={availCount}   color="#3b82f6" />
            <Stat label="Closures"      value={closureCount} color="#ef4444" />
          </div>

          {error && <div style={s.errorBox}>⚠ {error}</div>}

          {/* Tab switcher */}
          <div style={s.tabs}>
            <button style={{ ...s.tab, ...(tab === 'routes'    ? s.tabActive : {}) }} onClick={() => setTab('routes')}>Routes ({routes.length})</button>
            <button style={{ ...s.tab, ...(tab === 'resources' ? s.tabActive : {}) }} onClick={() => setTab('resources')}>Assets ({resources.length})</button>
          </div>

          {tab === 'routes' ? (
            <RoutePanel
              routes={routes}
              onAssign={handleAssign}
              onRecalculate={handleRecalculate}
              loading={loading}
            />
          ) : (
            <ResourcePanel resources={resources} onAssign={handleAssignResource} />
          )}

          {/* Legend */}
          <div style={s.legendBox}>
            <div style={s.legendTitle}>Map Legend</div>
            <RoadStatusLegend />
          </div>

          <div style={s.agentBadge}>
            <span style={s.agentDot} />
            Logistics Agent · Graph Routing Active
          </div>
        </div>

        {/* Map */}
        <div style={s.mapWrap}>
          <MapView locations={locations} network={network} routes={routes} />
        </div>

      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={s.stat}>
      <div style={{ ...s.statVal, color }}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  )
}

export default function LogisticsDashboard() {
  return (
    <SimulationProvider>
      <DashboardInner />
    </SimulationProvider>
  )
}

const s = {
  root:        { display: 'flex', flexDirection: 'column', flex: 1, background: '#0a0f1e', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' },
  body:        { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar:     { width: 340, flexShrink: 0, background: '#0d1117', borderRight: '1px solid #1f2937', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', overflow: 'hidden' },
  sidebarHeader: { color: '#e5e7eb', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.04em' },
  mapWrap:     { flex: 1, position: 'relative', overflow: 'hidden' },
  statsRow:    { display: 'flex', gap: '0.4rem', flexShrink: 0 },
  stat:        { flex: 1, background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.5rem', textAlign: 'center' },
  statVal:     { fontSize: '1.3rem', fontWeight: 700 },
  statLabel:   { color: '#4b5563', fontSize: '0.6rem', textTransform: 'uppercase' },
  errorBox:    { background: '#450a0a', border: '1px solid #ef4444', borderRadius: 8, padding: '0.5rem', color: '#fca5a5', fontSize: '0.75rem', flexShrink: 0 },
  tabs:        { display: 'flex', gap: '0.25rem', flexShrink: 0 },
  tab:         { flex: 1, background: 'transparent', border: '1px solid #1f2937', color: '#4b5563', borderRadius: 6, padding: '0.3rem', fontSize: '0.72rem', cursor: 'pointer' },
  tabActive:   { background: '#111827', border: '1px solid #374151', color: '#e5e7eb' },
  legendBox:   { background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.6rem', flexShrink: 0 },
  legendTitle: { color: '#6b7280', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' },
  agentBadge:  { display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#374151', fontSize: '0.65rem', marginTop: 'auto', flexShrink: 0 },
  agentDot:    { width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 },
}
