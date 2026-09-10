import { useCallback, useEffect, useState } from 'react'
import { SimulationProvider, useSim } from '../context/SimulationContext'
import Header from '../components/Header'
import COPPanel from '../components/COPPanel'
import RescueQueue from '../components/RescueQueue'
import ConfidenceBreakdown from '../components/ConfidenceBreakdown'
import DecisionLog from '../components/DecisionLog'
import SitrepPanel from '../components/SitrepPanel'
import AIExplanationCard from '../components/AIExplanationCard'
import HandoverPanel from '../components/HandoverPanel'
import ReportGenerator from '../components/ReportGenerator'
import { api } from '../services/api'

function CommandCenterInner() {
  const { sim } = useSim()

  const [cop,             setCop]             = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [decisionLog,     setDecisionLog]     = useState([])
  const [breakdown,       setBreakdown]       = useState(null)
  const [sources,         setSources]         = useState([])
  const [loading,         setLoading]         = useState(false)
  const [lastRecompute,   setLastRecompute]   = useState(null)
  const [tab,             setTab]             = useState('queue')  // 'queue' | 'log' | 'ai'
  const [reasoningKey,    setReasoningKey]    = useState(0)

  // Fetch COP and log on a 3s poll
  const fetchState = useCallback(() => {
    api.getCOP().then(setCop).catch(() => {})
    api.getDecisionLog().then(setDecisionLog).catch(() => {})
    api.getRecommendations().then(recs => {
      setRecommendations(recs)
      if (recs.length > 0) {
        setSources(recs[0].evidence_sources ?? [])
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetchState()
    const t = setInterval(fetchState, 3000)
    return () => clearInterval(t)
  }, [fetchState])

  // Auto-recompute every 10s when simulation is running
  useEffect(() => {
    if (sim.paused) return
    const t = setInterval(() => {
      handleRecompute()
    }, 10000)
    return () => clearInterval(t)
  }, [sim.paused])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecompute = async () => {
    setLoading(true)
    try {
      const result = await api.recompute()
      setRecommendations(result.recommendations ?? [])
      if (result.recommendations?.length > 0) {
        setSources(result.recommendations[0].evidence_sources ?? [])
      }
      setLastRecompute(new Date().toLocaleTimeString())
      setReasoningKey(k => k + 1)
      fetchState()
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  // Derive confidence breakdown from latest recommendations
  useEffect(() => {
    if (recommendations.length > 0) {
      const rec = recommendations[0]
      setBreakdown({
        evidence_confidence: Math.round(
          (rec.evidence_sources ?? []).reduce((s, x) => s + x.confidence * x.weight, 0)
        ),
        priority_certainty: recommendations.length >= 2
          ? Math.min(Math.round((recommendations[0].priority_score - recommendations[1].priority_score) * 2), 100)
          : 70,
        data_completeness: cop ? _copCompleteness(cop) : 0,
        overall: rec.confidence,
      })
    }
  }, [recommendations, cop])

  const stats = {
    recs:     recommendations.length,
    critical: (cop?.incidents ?? []).filter(i => i.severity_label === 'Critical').length,
    closures: (cop?.road_closures ?? []).length,
    avail:    (cop?.resources ?? []).filter(r => r.status === 'Available').length,
  }

  return (
    <div style={s.root}>
      <Header />
      <div style={s.body}>

        {/* Column 1 — COP */}
        <div style={s.col1}>
          <div style={s.colHeader}>🌐 COP</div>
          <COPPanel cop={cop} />
        </div>

        {/* Column 2 — Rescue Queue + Decision Log */}
        <div style={s.col2}>
          {/* Stats bar */}
          <div style={s.statsRow}>
            <Stat label="Recommendations" value={stats.recs}     color="#3b82f6" />
            <Stat label="Critical"        value={stats.critical} color="#ef4444" />
            <Stat label="Closures"        value={stats.closures} color="#f97316" />
            <Stat label="Available"       value={stats.avail}    color="#22c55e" />
          </div>

          {/* Tab switcher */}
          <div style={s.tabs}>
            <button style={{ ...s.tab, ...(tab === 'queue' ? s.tabActive : {}) }} onClick={() => setTab('queue')}>
              Rescue Queue ({recommendations.length})
            </button>
            <button style={{ ...s.tab, ...(tab === 'log' ? s.tabActive : {}) }} onClick={() => setTab('log')}>
              Decision Log ({decisionLog.length})
            </button>
            <button style={{ ...s.tab, ...(tab === 'ai' ? s.tabActive : {}) }} onClick={() => setTab('ai')}>
              🧠 AI
            </button>
          </div>

          {tab === 'queue' ? (
            <RescueQueue
              recommendations={recommendations}
              onRecompute={handleRecompute}
              loading={loading}
            />
          ) : tab === 'log' ? (
            <div style={s.logWrap}>
              <DecisionLog log={decisionLog} />
            </div>
          ) : (
            <div style={{ ...s.logWrap, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <SitrepPanel triggerKey={reasoningKey} />
              <AIExplanationCard triggerKey={reasoningKey} />
              <HandoverPanel />
              <ReportGenerator />
            </div>
          )}
        </div>

        {/* Column 3 — Confidence + Agent Status */}
        <div style={s.col3}>
          <div style={s.colHeader}>📊 Confidence</div>
          <ConfidenceBreakdown breakdown={breakdown} sources={sources} />

          <div style={s.agentStatus}>
            <div style={s.agentStatusTitle}>Agent Pipeline</div>
            {AGENTS.map(a => (
              <div key={a.name} style={s.agentRow}>
                <span style={{ ...s.agentDot, background: a.color }} />
                <span style={s.agentName}>{a.name}</span>
                <span style={s.agentState}>{a.state}</span>
              </div>
            ))}
          </div>

          {lastRecompute && (
            <div style={s.lastRun}>Last recompute: {lastRecompute}</div>
          )}

          <div style={s.agentBadge}>
            <span style={{ ...s.agentDot2, background: '#22c55e' }} />
            Commander Agent · LangGraph Active
          </div>
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

const AGENTS = [
  { name: 'Simulation',  color: '#22c55e', state: 'Active' },
  { name: 'Weather',     color: '#22c55e', state: 'Active' },
  { name: 'Vision',      color: '#eab308', state: 'On Upload' },
  { name: 'Emergency',   color: '#22c55e', state: 'Active' },
  { name: 'Logistics',   color: '#22c55e', state: 'Active' },
  { name: 'Commander',   color: '#3b82f6', state: 'Orchestrating' },
  { name: 'Reasoning',   color: '#a855f7', state: 'Qwen 2.5 / Fallback' },
]

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

export default function CommandCenter() {
  return (
    <SimulationProvider>
      <CommandCenterInner />
    </SimulationProvider>
  )
}

const s = {
  root:            { display: 'flex', flexDirection: 'column', flex: 1, background: '#0a0f1e', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' },
  body:            { display: 'flex', flex: 1, overflow: 'hidden' },
  col1:            { width: 240, flexShrink: 0, background: '#0d1117', borderRight: '1px solid #1f2937', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'hidden' },
  col2:            { flex: 1, display: 'flex', flexDirection: 'column', padding: '0.75rem', gap: '0.5rem', overflow: 'hidden', borderRight: '1px solid #1f2937' },
  col3:            { width: 280, flexShrink: 0, background: '#0d1117', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto' },
  colHeader:       { color: '#4b5563', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, flexShrink: 0 },
  statsRow:        { display: 'flex', gap: '0.4rem', flexShrink: 0 },
  stat:            { flex: 1, background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.4rem', textAlign: 'center' },
  statVal:         { fontSize: '1.2rem', fontWeight: 700 },
  statLabel:       { color: '#4b5563', fontSize: '0.58rem', textTransform: 'uppercase' },
  tabs:            { display: 'flex', gap: '0.25rem', flexShrink: 0 },
  tab:             { flex: 1, background: 'transparent', border: '1px solid #1f2937', color: '#4b5563', borderRadius: 6, padding: '0.3rem', fontSize: '0.72rem', cursor: 'pointer' },
  tabActive:       { background: '#111827', border: '1px solid #374151', color: '#e5e7eb' },
  logWrap:         { flex: 1, overflowY: 'auto' },
  agentStatus:     { background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  agentStatusTitle:{ color: '#4b5563', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' },
  agentRow:        { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  agentDot:        { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  agentName:       { color: '#9ca3af', fontSize: '0.7rem', flex: 1 },
  agentState:      { color: '#4b5563', fontSize: '0.65rem' },
  lastRun:         { color: '#374151', fontSize: '0.62rem', textAlign: 'center' },
  agentBadge:      { display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#374151', fontSize: '0.65rem', marginTop: 'auto' },
  agentDot2:       { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
}
