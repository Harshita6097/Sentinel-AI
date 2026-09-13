import { lazy, Suspense, useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { api } from '../services/api'
import SitrepPanel from './SitrepPanel'
import COPPanel from './COPPanel'
import ConfidenceBreakdown from './ConfidenceBreakdown'
import AlertCenter from './AlertCenter'
import PlaybackBar from './PlaybackBar'
import ActivityTimeline from './ActivityTimeline'
import NotificationToast from './NotificationToast'

const MapView = lazy(() => import('./MapView'))

const PRIORITY_COLOR = { 1:'var(--red)', 2:'var(--orange)', 3:'var(--amber)' }

function MetricsStrip() {
  const { cop, alerts } = useDashboard()
  const openInc  = (cop?.incidents ?? []).filter(i => i.status === 'Open').length
  const available= (cop?.resources ?? []).filter(r => r.status === 'Available').length
  const activeRoutes = (cop?.routes ?? []).filter(r => r.status === 'Active').length
  const alert    = cop?.weather?.alert_level ?? 'Green'
  const risk     = cop?.flood?.risk_level ?? 'Low'
  const ALERT_C  = { Green:'var(--green)', Yellow:'var(--amber)', Orange:'var(--orange)', Red:'var(--red)' }
  const RISK_C   = { Low:'var(--green)', Medium:'var(--amber)', High:'var(--orange)', Critical:'var(--red)' }

  const metrics = [
    { val: openInc,   label:'Open incidents',   color: openInc > 0 ? 'var(--red)' : 'var(--white)' },
    { val: available, label:'Available assets',  color:'var(--white)' },
    { val: activeRoutes, label:'Active routes',     color:'var(--white)' },
    { val: alert,     label:'Weather alert',     color: ALERT_C[alert] },
    { val: risk,      label:'Flood risk',        color: RISK_C[risk] },
  ]

  return (
    <div style={s.metrics}>
      {metrics.map(({ val, label, color }) => (
        <div key={label} style={s.metric}>
          <span style={{ ...s.metricVal, color }}>{val}</span>
          <span style={s.metricLabel}>{label}</span>
        </div>
      ))}
    </div>
  )
}

function MapOverlay({ layers, onToggle }) {
  const LAYERS = ['Flood','Routes','Assets','Incidents']
  return (
    <>
      <div style={s.mapToolbar}>
        {LAYERS.map(l => (
          <button key={l} style={{ ...s.chip, ...(layers.includes(l) ? s.chipOn : {}) }} onClick={() => onToggle(l)}>
            {l}
          </button>
        ))}
      </div>
      <div style={s.mapLegend}>
        {[['var(--red)','Critical incident'],['var(--blue)','Shelter'],['var(--orange)','Resource unit'],['var(--green)','Active route']].map(([c,l]) => (
          <div key={l} style={s.legendRow}>
            <span style={{ ...s.legendSw, background:c }} />
            <span style={{ fontSize:10.5, color:'var(--text-2)' }}>{l}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function HeroCard({ rec, onRecompute, loading }) {
  const { sim } = useDashboard()
  const [dispatching, setDispatching] = useState(false)

  const handleDispatch = async () => {
    if (!rec?.assigned_resource) return
    setDispatching(true)
    try {
      await api.assignResource({
        destination: rec.location,
        resource_id: rec.assigned_resource,
        current_sim_minutes: sim?.current_minutes ?? 540,
      })
    } catch { /* ignore */ } finally { setDispatching(false) }
  }

  if (!rec) return (
    <div style={s.heroEmpty}>
      <div style={{ color:'var(--text-3)', fontSize:12, textAlign:'center' }}>No priority data yet.</div>
      <button style={s.recomputeBtn} onClick={onRecompute} disabled={loading}>
        {loading ? '…' : '↻ Recompute'}
      </button>
    </div>
  )

  const score = Math.round((rec.priority_score ?? 0) * 100)
  const scoreColor = score >= 80 ? 'var(--red)' : score >= 60 ? 'var(--orange)' : 'var(--amber)'
  const eta = rec.eta_minutes ? `${Math.round(rec.eta_minutes)}m` : '—'
  const unit = rec.assigned_resource ?? '—'

  return (
    <div style={s.heroCard}>
      <div style={s.heroTop}>
        <span style={s.heroLoc}>{rec.location ?? rec.incident_id ?? 'Unknown location'}</span>
        <span style={{ ...s.heroScore, color: scoreColor }}>{score}%</span>
      </div>
      <div style={s.heroDetail}>{rec.reasoning ?? rec.action ?? 'Awaiting Commander analysis.'}</div>
      <div style={s.heroRow}>
        <div style={s.heroItem}><div style={s.heroN}>{eta}</div><div style={s.heroL}>ETA</div></div>
        <div style={s.heroItem}><div style={s.heroN}>{unit}</div><div style={s.heroL}>Unit</div></div>
        <div style={s.heroItem}><div style={s.heroN}>{score}%</div><div style={s.heroL}>Confidence</div></div>
      </div>
      <button style={{ ...s.dispatchBtn, opacity: dispatching ? 0.6 : 1 }} onClick={handleDispatch} disabled={dispatching || !rec.assigned_resource}>
        {dispatching ? 'Dispatching…' : `Dispatch ${unit}`}
      </button>
    </div>
  )
}

function QueueMini({ recs }) {
  if (!recs?.length) return null
  const COLOR = { 1:'var(--red)', 2:'var(--orange)', 3:'var(--amber)', 4:'var(--blue)' }
  return (
    <div style={s.queueMini}>
      {recs.slice(1, 4).map((r, i) => {
        const rank = i + 2
        const score = Math.round((r.priority_score ?? 0) * 100)
        return (
          <div key={r.incident_id ?? i} style={s.queueItem}>
            <div style={{ ...s.queueN, background: COLOR[rank] ?? 'var(--text-3)' }}>{score}</div>
            <div style={s.queuePlace}>{r.location ?? r.incident_id ?? '—'}</div>
            <div style={s.queueStatus}>{r.status ?? 'queued'}</div>
          </div>
        )
      })}
    </div>
  )
}

function RightPanel({ sitrepKey }) {
  const { cop, recommendations, decisionLog, recomputing, recompute, alerts } = useDashboard()
  const [tab, setTab] = useState('cop')

  const breakdown = recommendations.length > 0 ? (() => {
    const rec = recommendations[0]
    return {
      evidence_confidence: Math.round((rec.evidence_sources ?? []).reduce((s, x) => s + x.confidence * x.weight, 0)),
      priority_certainty: recommendations.length >= 2 ? Math.min(Math.round((recommendations[0].priority_score - recommendations[1].priority_score) * 200), 100) : 70,
      data_completeness: cop ? Math.round([cop.weather, cop.flood, (cop.incidents?.length > 0), (cop.resources?.length > 0), (cop.routes?.length > 0)].filter(Boolean).length / 5 * 100) : 0,
      overall: rec.confidence,
    }
  })() : null

  return (
    <div style={s.side}>
      {/* Priority block — always visible */}
      <div style={s.priorityBlock}>
        <div style={s.eyebrow}>
          <span style={s.eyebrowLabel}>Top priority</span>
          <span style={s.eyebrowN}>{recommendations[0]?.incident_id ?? '—'}</span>
        </div>
        <HeroCard rec={recommendations[0]} onRecompute={recompute} loading={recomputing} />
        <QueueMini recs={recommendations} />
      </div>

      {/* SITREP — always visible */}
      <SitrepPanel triggerKey={sitrepKey} />

      {/* Secondary tabs */}
      <div style={s.subTabs}>
        {[['cop','COP'],['confidence','Confidence'],['alerts','Alerts']].map(([id,label]) => (
          <button key={id} style={{ ...s.subTab, ...(tab === id ? s.subTabOn : {}) }} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div style={s.subContent}>
        {tab === 'cop'        && <COPPanel cop={cop} />}
        {tab === 'confidence' && <ConfidenceBreakdown breakdown={breakdown} sources={recommendations[0]?.evidence_sources ?? []} />}
        {tab === 'alerts'     && <AlertCenter />}
      </div>
    </div>
  )
}

export default function DashboardShell() {
  const { locations, network, routes, sim } = useDashboard()
  const [layers, setLayers]           = useState(['Flood','Routes','Assets','Incidents'])
  const [showTimeline, setTimeline]   = useState(false)
  const [sitrepKey, setSitrepKey]     = useState(0)

  const toggleLayer = (l) => setLayers(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])

  return (
    <div style={s.app}>
      <MetricsStrip />

      <div style={s.main}>
        {/* Map */}
        <div style={s.mapWrap}>
          <Suspense fallback={<div style={s.mapLoading}>Loading map…</div>}>
            <MapView locations={locations} network={network} routes={routes} overrides={sim?.location_overrides ?? {}} />
          </Suspense>
          <MapOverlay layers={layers} onToggle={toggleLayer} />
        </div>

        {/* Right panel */}
        <RightPanel sitrepKey={sitrepKey} />
      </div>

      <PlaybackBar onToggleTimeline={() => setTimeline(v => !v)} />

      {/* Activity drawer */}
      {showTimeline && (
        <div style={s.drawer} onClick={() => setTimeline(false)}>
          <div style={s.drawerPanel} onClick={e => e.stopPropagation()}>
            <div style={s.drawerHeader}>
              <span style={s.drawerTitle}>Activity Feed</span>
              <button style={s.drawerClose} onClick={() => setTimeline(false)}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              <ActivityTimeline />
            </div>
          </div>
        </div>
      )}

      <NotificationToast />
    </div>
  )
}

const s = {
  app:          { display:'grid', gridTemplateRows:'auto 1fr 52px', height:'100vh', overflow:'hidden' },
  metrics:      { display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:1, background:'var(--border)', borderBottom:'1px solid var(--border)', flexShrink:0 },
  metric:       { background:'var(--panel)', padding:'10px var(--sp-5)', display:'flex', alignItems:'baseline', gap:8 },
  metricVal:    { fontFamily:'var(--mono)', fontSize:22, fontWeight:800, lineHeight:1 },
  metricLabel:  { fontSize:10, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:700 },
  main:         { display:'grid', gridTemplateColumns:'1fr 420px', gap:1, background:'var(--border)', overflow:'hidden' },
  mapWrap:      { background:'var(--bg-main)', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' },
  mapLoading:   { display:'flex', alignItems:'center', justifyContent:'center', flex:1, color:'var(--text-3)', fontSize:12 },
  mapToolbar:   { position:'absolute', top:12, left:12, zIndex:5, display:'flex', gap:6 },
  chip:         { background:'rgba(13,17,23,.92)', border:'1px solid var(--border)', color:'var(--text-1)', fontSize:10.5, padding:'6px 11px', borderRadius:20, fontWeight:700, cursor:'pointer' },
  chipOn:       { background:'var(--white)', color:'#0a0f1e' },
  mapLegend:    { position:'absolute', bottom:12, left:12, zIndex:5, background:'rgba(13,17,23,.92)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'10px 12px', display:'flex', flexDirection:'column', gap:6 },
  legendRow:    { display:'flex', alignItems:'center', gap:7 },
  legendSw:     { width:9, height:9, borderRadius:'50%', flexShrink:0 },
  side:         { background:'var(--panel)', display:'flex', flexDirection:'column', overflow:'hidden' },
  priorityBlock:{ padding:'var(--sp-4)', borderBottom:'1px solid var(--border-soft)', flexShrink:0 },
  eyebrow:      { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  eyebrowLabel: { fontSize:10.5, textTransform:'uppercase', letterSpacing:'.6px', color:'var(--text-2)', fontWeight:800 },
  eyebrowN:     { fontFamily:'var(--mono)', fontSize:10.5, color:'var(--text-2)' },
  heroCard:     { background:'linear-gradient(180deg,rgba(239,68,68,.10),rgba(239,68,68,.02))', border:'1px solid rgba(239,68,68,.4)', borderRadius:'var(--r-lg)', padding:14 },
  heroEmpty:    { border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:14, display:'flex', flexDirection:'column', gap:10, alignItems:'center' },
  heroTop:      { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:8 },
  heroLoc:      { fontSize:14.5, fontWeight:800, color:'var(--white)', lineHeight:1.3 },
  heroScore:    { fontFamily:'var(--mono)', fontSize:15, fontWeight:800, flexShrink:0 },
  heroDetail:   { fontSize:12, color:'var(--text-1)', lineHeight:1.5, marginBottom:12 },
  heroRow:      { display:'flex', gap:16, marginBottom:12 },
  heroItem:     {},
  heroN:        { fontFamily:'var(--mono)', fontSize:14, fontWeight:700, color:'var(--white)' },
  heroL:        { fontSize:9.5, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.4px' },
  dispatchBtn:  { width:'100%', background:'var(--red)', color:'#fff', border:'none', padding:9, borderRadius:'var(--r-sm)', fontWeight:700, fontSize:12, cursor:'pointer' },
  recomputeBtn: { background:'var(--blue)', color:'#fff', border:'none', padding:'7px 14px', borderRadius:'var(--r-sm)', fontWeight:700, fontSize:12, cursor:'pointer' },
  queueMini:    { marginTop:10, display:'flex', flexDirection:'column' },
  queueItem:    { display:'flex', alignItems:'center', gap:8, padding:'7px 2px', borderBottom:'1px solid var(--border-soft)', fontSize:11.5, cursor:'pointer' },
  queueN:       { width:20, height:20, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#fff', flexShrink:0 },
  queuePlace:   { flex:1, color:'var(--text-1)', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  queueStatus:  { fontSize:9.5, color:'var(--text-2)', flexShrink:0, padding:'2px 7px', borderRadius:10, background:'var(--panel-2)' },
  subTabs:      { display:'flex', borderBottom:'1px solid var(--border-soft)', flexShrink:0 },
  subTab:       { flex:1, background:'none', border:'none', borderBottom:'2px solid transparent', padding:10, fontSize:11, fontWeight:700, color:'var(--text-2)', cursor:'pointer' },
  subTabOn:     { color:'var(--white)', borderBottomColor:'var(--blue)' },
  subContent:   { flex:1, overflowY:'auto', padding:'var(--sp-4)' },
  drawer:       { position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:9000, display:'flex', justifyContent:'flex-end' },
  drawerPanel:  { width:360, background:'var(--panel)', borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', height:'100%' },
  drawerHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'var(--sp-4)', borderBottom:'1px solid var(--border)', flexShrink:0 },
  drawerTitle:  { color:'var(--white)', fontWeight:700, fontSize:13 },
  drawerClose:  { background:'none', border:'none', color:'var(--text-2)', fontSize:14, cursor:'pointer' },
}
