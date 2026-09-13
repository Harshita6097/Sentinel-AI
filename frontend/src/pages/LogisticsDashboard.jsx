import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { SimulationProvider } from '../context/SimulationContext'
import RingGauge from '../components/primitives/RingGauge'
import { api } from '../services/api'

const MapView = lazy(() => import('../components/MapView'))

const STATUS_COLOR = { Active:'var(--green)', Rerouted:'var(--orange)', Blocked:'var(--red)' }
const STATUS_BG    = { Active:'rgba(34,197,94,.12)', Rerouted:'rgba(249,115,22,.12)', Blocked:'rgba(239,68,68,.12)' }

function RouteCard({ route }) {
  const sc = STATUS_COLOR[route.status] ?? 'var(--text-2)'
  const sb = STATUS_BG[route.status]   ?? 'rgba(107,114,128,.12)'
  const eta = route.eta_minutes != null && isFinite(route.eta_minutes)
    ? `ETA ${Math.round(route.eta_minutes)}m`
    : route.status === 'Blocked' ? 'Blocked' : '—'

  return (
    <div style={{ ...s.routeCard, ...(route.status === 'Blocked' ? s.routeBlocked : route.status === 'Rerouted' ? s.routeRerouted : {}) }}>
      <div style={s.routeTop}>
        <span style={s.routeId}>{route.assignment_id ?? '—'}</span>
        <span style={{ fontFamily:'var(--mono)', fontSize:12, fontWeight:700, color: sc }}>{eta}</span>
      </div>
      <div style={s.routePath}>
        {route.origin ?? 'Base'} <span style={s.arrow}>→</span> {route.destination ?? '—'}
      </div>
      <div style={s.routeFoot}>
        <span style={{ fontSize:10.5, color:'var(--text-2)' }}>{route.resource_id ?? '—'}</span>
        <span style={{ padding:'2px 8px', borderRadius:10, background:sb, color:sc, fontSize:10.5, fontWeight:700 }}>{route.status}</span>
      </div>
    </div>
  )
}

function AssetCard({ resource, onAssign }) {
  const available = resource.status === 'Available'
  return (
    <div style={s.assetCard}>
      <div style={s.assetIcon}>{resource.type === 'Boat' ? '🚤' : resource.type === 'Helicopter' ? '🚁' : '🚛'}</div>
      <div style={{ flex:1 }}>
        <div style={s.assetName}>{resource.id}</div>
        <div style={{ fontSize:10.5, color:'var(--text-2)' }}>{resource.type}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:10.5, color: available ? 'var(--green)' : 'var(--text-2)', flexShrink:0 }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background: available ? 'var(--green)' : 'var(--text-3)' }} />
        {resource.status}
      </div>
      {available && (
        <button style={s.assignBtn} onClick={() => onAssign(resource)}>Assign</button>
      )}
    </div>
  )
}

function DashboardInner() {
  const [locations, setLocations] = useState([])
  const [network, setNetwork]     = useState(null)
  const [routes, setRoutes]       = useState([])
  const [resources, setResources] = useState([])
  const [tab, setTab]             = useState('routes')
  const [loading, setLoading]     = useState(false)

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

  const handleAssign = async (resource) => {
    const dest = window.prompt('Assign to destination:\nKochi, Alappuzha, Kottayam, Thiruvananthapuram, Thrissur, Pathanamthitta, Idukki, Ernakulam')
    if (!dest) return
    setLoading(true)
    try { await api.assignResource({ destination: dest.trim(), resource_id: resource.id }); fetchAll() }
    catch { /* ignore */ } finally { setLoading(false) }
  }

  const handleRecalculate = async () => {
    setLoading(true)
    try { await api.recalculateRoutes(); fetchAll() }
    catch { /* ignore */ } finally { setLoading(false) }
  }

  const activeRoutes  = routes.filter(r => r.status === 'Active').length
  const available     = resources.filter(r => r.status === 'Available').length
  const closures      = network?.edges?.filter(e => e.blocked).length ?? 0
  const blockedRoute  = routes.find(r => r.status === 'Blocked')

  const gaugeMax = Math.max(routes.length, 1)
  const resMax   = Math.max(resources.length, 1)
  const closMax  = Math.max(closures, 1)

  return (
    <div style={s.app}>
      {/* Briefing */}
      <div style={s.briefing}>
        <div style={s.briefingIcon}>🚧</div>
        <div style={{ flex:1 }}>
          <div style={s.briefingEyebrow}>Route conflict</div>
          <div style={s.briefingTitle}>
            {blockedRoute
              ? `Road to ${blockedRoute.destination} blocked — assignments need rerouting`
              : 'All routes operational'}
          </div>
        </div>
        <button style={s.briefingBtn} onClick={handleRecalculate} disabled={loading}>
          {loading ? 'Recalculating…' : 'Recalculate routes'}
        </button>
      </div>

      {/* Ring gauge strip */}
      <div style={s.strip}>
        {[
          { val:activeRoutes, max:gaugeMax, color:'var(--green)', label:'Active routes' },
          { val:available,    max:resMax,   color:'var(--blue)',  label:'Resources available' },
          { val:closures,     max:closMax,  color:'var(--red)',   label:'Road closures' },
        ].map(({ val, max, color, label }) => (
          <div key={label} style={s.stripCard}>
            <RingGauge value={val} max={max} size={38} stroke={4} color={color} label={String(val)} />
            <div>
              <div style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:15, color:'var(--white)', lineHeight:1.1 }}>{val}</div>
              <div style={{ fontSize:10, color:'var(--text-2)', fontWeight:600 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={s.body}>
        {/* Left panel */}
        <div style={s.leftPanel}>
          <div style={s.tabs}>
            <button style={{ ...s.tab, ...(tab === 'routes' ? s.tabOn : {}) }} onClick={() => setTab('routes')}>
              Routes ({routes.length})
            </button>
            <button style={{ ...s.tab, ...(tab === 'assets' ? s.tabOn : {}) }} onClick={() => setTab('assets')}>
              Assets ({resources.length})
            </button>
          </div>
          <div style={s.list}>
            {tab === 'routes'
              ? routes.map(r => <RouteCard key={r.assignment_id} route={r} />)
              : resources.map(r => <AssetCard key={r.id} resource={r} onAssign={handleAssign} />)
            }
          </div>
        </div>

        {/* Map */}
        <div style={s.mapCard}>
          <Suspense fallback={<div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1, color:'var(--text-3)', fontSize:12 }}>Loading map…</div>}>
            <MapView locations={locations} network={network} routes={routes} overrides={{}} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default function LogisticsDashboard() {
  return <SimulationProvider><DashboardInner /></SimulationProvider>
}

const s = {
  app:           { display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12, overflow:'hidden', flex:1 },
  briefing:      { background:'linear-gradient(135deg,rgba(249,115,22,.12),rgba(13,17,23,.4))', border:'1px solid rgba(249,115,22,.35)', borderRadius:'var(--r-lg)', padding:'14px 18px', display:'flex', alignItems:'center', gap:20, flexShrink:0 },
  briefingIcon:  { width:44, height:44, borderRadius:10, background:'rgba(249,115,22,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 },
  briefingEyebrow:{ fontSize:10.5, color:'var(--orange)', fontWeight:800, letterSpacing:'.4px', marginBottom:3 },
  briefingTitle: { fontSize:15.5, fontWeight:800, color:'var(--white)' },
  briefingBtn:   { background:'var(--orange)', color:'#1f1000', border:'none', padding:'9px 16px', borderRadius:'var(--r-sm)', fontWeight:700, fontSize:12.5, cursor:'pointer', whiteSpace:'nowrap' },
  strip:         { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, flexShrink:0 },
  stripCard:     { background:'var(--panel)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 },
  body:          { display:'grid', gridTemplateColumns:'360px 1fr', gap:12, overflow:'hidden' },
  leftPanel:     { background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', display:'flex', flexDirection:'column', overflow:'hidden' },
  tabs:          { display:'flex', borderBottom:'1px solid var(--border-soft)', flexShrink:0 },
  tab:           { flex:1, background:'none', border:'none', borderBottom:'2px solid transparent', padding:11, fontSize:12, fontWeight:700, color:'var(--text-2)', cursor:'pointer' },
  tabOn:         { color:'var(--white)', borderBottomColor:'var(--orange)' },
  list:          { overflowY:'auto', padding:10, display:'flex', flexDirection:'column', gap:8 },
  routeCard:     { background:'var(--panel-2)', border:'1px solid var(--border)', borderRadius:9, padding:'10px 12px' },
  routeBlocked:  { borderColor:'rgba(239,68,68,.4)' },
  routeRerouted: { borderColor:'rgba(249,115,22,.4)' },
  routeTop:      { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 },
  routeId:       { fontFamily:'var(--mono)', fontSize:10.5, color:'var(--text-2)' },
  routePath:     { fontSize:12.5, color:'var(--white)', fontWeight:600, marginBottom:4 },
  arrow:         { color:'var(--text-2)', margin:'0 6px', fontWeight:400 },
  routeFoot:     { display:'flex', justifyContent:'space-between', alignItems:'center' },
  assetCard:     { background:'var(--panel-2)', border:'1px solid var(--border)', borderRadius:9, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 },
  assetIcon:     { width:32, height:32, borderRadius:8, background:'var(--panel)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 },
  assetName:     { fontSize:12.5, fontWeight:700, color:'var(--white)' },
  assignBtn:     { background:'var(--panel)', border:'1px solid var(--border)', color:'var(--white)', fontSize:10.5, padding:'5px 10px', borderRadius:'var(--r-sm)', cursor:'pointer', fontWeight:600, flexShrink:0 },
  mapCard:       { background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', overflow:'hidden', position:'relative', display:'flex', flexDirection:'column' },
}
