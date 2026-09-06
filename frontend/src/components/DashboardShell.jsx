/**
 * DashboardShell — Unified EOC layout.
 *
 * Layout:
 *   ┌─ SystemStatusBar ──────────────────────────────────────┐
 *   ├─ COPSummary (metrics strip) ───────────────────────────┤
 *   ├─ Map (left 60%) ──┬─ Right panel (40%) ────────────────┤
 *   │                   │  [COP | Commander | Confidence tab] │
 *   │                   │  AlertCenter                        │
 *   ├─ PlaybackBar ─────┴─────────────────────────────────────┤
 *   └─ ActivityTimeline (bottom strip) ──────────────────────┘
 *
 * All data flows from DashboardContext — no local API calls.
 */
import { useState, lazy, Suspense } from 'react'
import { useDashboard } from '../context/DashboardContext'
import SystemStatusBar from './SystemStatusBar'
import COPSummary from './COPSummary'
import PlaybackBar from './PlaybackBar'
import AlertCenter from './AlertCenter'
import ActivityTimeline from './ActivityTimeline'
import COPPanel from './COPPanel'
import RescueQueue from './RescueQueue'
import DecisionLog from './DecisionLog'
import ConfidenceBreakdown from './ConfidenceBreakdown'
import RecommendationCard from './RecommendationCard'
import NotificationToast from './NotificationToast'

// Lazy-load the map to avoid blocking initial render
const MapView = lazy(() => import('./MapView'))

const RIGHT_TABS = [
  { id: 'cop',        label: '🌐 COP' },
  { id: 'commander',  label: '🧠 Commander' },
  { id: 'confidence', label: '📊 Confidence' },
  { id: 'alerts',     label: '🚨 Alerts' },
]

// Wrap MapView so it reads from DashboardContext instead of needing props
function ConnectedMap() {
  const { locations, network, routes, sim } = useDashboard()
  return (
    <Suspense fallback={<div style={s.mapLoading}>Loading map…</div>}>
      <MapView
        locations={locations}
        network={network}
        routes={routes}
        overrides={sim?.location_overrides ?? {}}
      />
    </Suspense>
  )
}

function RightPanel() {
  const { cop, recommendations, decisionLog, recomputing, recompute } = useDashboard()
  const [tab, setTab] = useState('cop')

  // Derive confidence breakdown from latest recommendation
  const breakdown = recommendations.length > 0 ? (() => {
    const rec = recommendations[0]
    return {
      evidence_confidence: Math.round(
        (rec.evidence_sources ?? []).reduce((s, x) => s + x.confidence * x.weight, 0)
      ),
      priority_certainty: recommendations.length >= 2
        ? Math.min(Math.round((recommendations[0].priority_score - recommendations[1].priority_score) * 2), 100)
        : 70,
      data_completeness: cop ? _copCompleteness(cop) : 0,
      overall: rec.confidence,
    }
  })() : null

  const sources = recommendations[0]?.evidence_sources ?? []

  return (
    <div style={s.rightPanel}>
      {/* Tab bar */}
      <div style={s.tabs}>
        {RIGHT_TABS.map(t => (
          <button
            key={t.id}
            style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}) }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={s.tabContent}>
        {tab === 'cop' && <COPPanel cop={cop} />}

        {tab === 'commander' && (
          <div style={s.commanderTab}>
            <RescueQueue
              recommendations={recommendations}
              onRecompute={recompute}
              loading={recomputing}
            />
            {decisionLog.length > 0 && (
              <div style={s.logSection}>
                <div style={s.logTitle}>Decision Log</div>
                <DecisionLog log={decisionLog.slice(0, 5)} />
              </div>
            )}
          </div>
        )}

        {tab === 'confidence' && (
          <ConfidenceBreakdown breakdown={breakdown} sources={sources} />
        )}

        {tab === 'alerts' && <AlertCenter />}
      </div>
    </div>
  )
}

export default function DashboardShell() {
  return (
    <div style={s.root}>
      <SystemStatusBar />
      <COPSummary />

      {/* Main content area */}
      <div style={s.main}>
        {/* Map */}
        <div style={s.mapArea}>
          <ConnectedMap />
        </div>

        {/* Right panel */}
        <RightPanel />
      </div>

      {/* Bottom: playback + activity feed */}
      <div style={s.bottom}>
        <div style={s.bottomLeft}>
          <PlaybackBar />
        </div>
        <div style={s.bottomRight}>
          <ActivityTimeline />
        </div>
      </div>

      {/* Floating toasts */}
      <NotificationToast />
    </div>
  )
}

function _copCompleteness(cop) {
  const layers = [
    cop.weather?.alert_level !== 'Green',
    cop.flood?.detected,
    (cop.incidents?.length ?? 0) > 0,
    (cop.resources?.length ?? 0) > 0,
    (cop.routes?.length ?? 0) > 0,
    (cop.road_closures?.length ?? 0) > 0,
  ]
  return Math.round(layers.filter(Boolean).length / layers.length * 100)
}

const s = {
  root:        { display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0f1e', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' },
  main:        { display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 },
  mapArea:     { flex: '0 0 60%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  mapLoading:  { display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#374151', fontSize: '0.85rem' },
  rightPanel:  { flex: '0 0 40%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #1f2937', overflow: 'hidden', background: '#0d1117' },
  tabs:        { display: 'flex', borderBottom: '1px solid #1f2937', flexShrink: 0 },
  tab:         { flex: 1, background: 'transparent', border: 'none', borderBottom: '2px solid transparent', color: '#4b5563', padding: '0.5rem 0.25rem', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 500, transition: 'color 0.15s' },
  tabActive:   { color: '#e5e7eb', borderBottomColor: '#3b82f6' },
  tabContent:  { flex: 1, overflowY: 'auto', padding: '0.75rem' },
  commanderTab:{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' },
  logSection:  { flexShrink: 0 },
  logTitle:    { color: '#4b5563', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' },
  bottom:      { display: 'flex', height: 180, borderTop: '1px solid #1f2937', flexShrink: 0 },
  bottomLeft:  { flex: '0 0 60%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1f2937' },
  bottomRight: { flex: '0 0 40%', display: 'flex', flexDirection: 'column', background: '#0d1117', overflow: 'hidden' },
}
