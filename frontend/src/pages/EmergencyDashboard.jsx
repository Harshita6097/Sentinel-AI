import { useCallback, useEffect, useState } from 'react'
import { SimulationProvider } from '../context/SimulationContext'
import Header from '../components/Header'
import SOSInput from '../components/SOSInput'
import IncidentFeed from '../components/IncidentFeed'
import SeverityBadge from '../components/SeverityBadge'
import ConfidenceIndicator from '../components/ConfidenceIndicator'
import { api } from '../services/api'

const TYPE_ICON = {
  flood: '🌊', landslide: '⛰️', fire: '🔥', medical: '🏥',
  rescue: '🚁', shelter: '🏕️', road: '🚧', unknown: '📡',
}

function DetailPanel({ incident }) {
  if (!incident) {
    return (
      <div style={s.emptyDetail}>
        <div style={s.emptyIcon}>📋</div>
        <div style={s.emptyTitle}>Select an incident</div>
        <div style={s.emptySub}>Click any incident card to view full details.</div>
      </div>
    )
  }

  const { id, time, raw_text, normalized_text, location, facility, facility_type,
          incident_type, people_count, urgency_keywords, severity_label, severity_score,
          severity_signals, duplicate, duplicate_similarity, matched_incident_id,
          confidence, status, source } = incident

  return (
    <div style={s.detail}>
      <div style={s.detailHeader}>
        <span style={s.detailIcon}>{TYPE_ICON[incident_type] ?? '📡'}</span>
        <div>
          <div style={s.detailId}>{id}</div>
          <div style={s.detailTime}>{time} · {source}</div>
        </div>
        <SeverityBadge label={severity_label} size="lg" />
      </div>

      <DetailSection title="Location">
        <Row label="Location" value={location ?? '—'} />
        <Row label="Facility" value={facility ?? '—'} />
        <Row label="Type" value={facility_type ?? '—'} />
      </DetailSection>

      <DetailSection title="Incident">
        <Row label="Type" value={incident_type} />
        <Row label="People" value={people_count ? `${people_count} affected` : '—'} />
        <Row label="Status" value={status} />
        {urgency_keywords.length > 0 && (
          <Row label="Urgency" value={urgency_keywords.join(', ')} />
        )}
      </DetailSection>

      <DetailSection title="Severity Analysis">
        <Row label="Score" value={`${severity_score}/100`} />
        <div style={s.signals}>
          {severity_signals.map(sig => (
            <div key={sig} style={s.signal}>⚡ {sig}</div>
          ))}
        </div>
      </DetailSection>

      <DetailSection title="Confidence">
        <ConfidenceIndicator label="Extraction" value={confidence.extraction} />
        <ConfidenceIndicator label="Severity" value={confidence.severity} />
        <ConfidenceIndicator label="Duplicate Check" value={confidence.duplicate} />
        <div style={s.divider} />
        <ConfidenceIndicator label="Overall" value={confidence.overall} />
      </DetailSection>

      {duplicate && (
        <div style={s.dupWarning}>
          ⚠ Possible duplicate of {matched_incident_id} (similarity: {(duplicate_similarity * 100).toFixed(0)}%)
        </div>
      )}

      <DetailSection title="Raw Report">
        <div style={s.rawText}>{raw_text}</div>
      </DetailSection>
    </div>
  )
}

function DetailSection({ title, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>{title}</div>
      <div style={s.sectionBody}>{children}</div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={s.row}>
      <span style={s.rowLabel}>{label}</span>
      <span style={s.rowValue}>{value}</span>
    </div>
  )
}

function DashboardInner() {
  const [incidents, setIncidents] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(false)
  const [mockLoading, setMockLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchIncidents = useCallback(() => {
    api.getIncidents()
      .then(setIncidents)
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchIncidents()
    // Poll every 5s so incidents added from other sources appear automatically
    const t = setInterval(fetchIncidents, 5000)
    return () => clearInterval(t)
  }, [fetchIncidents])

  const handleSubmit = async (text) => {
    setLoading(true)
    setError(null)
    try {
      const inc = await api.submitReport(text)
      setIncidents(prev => [inc, ...prev])
      setSelected(inc)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMock = async () => {
    setMockLoading(true)
    setError(null)
    try {
      const list = await api.loadMockReports()
      setIncidents(list)
      setSelected(list[0] ?? null)
    } catch (e) {
      setError(e.message)
    } finally {
      setMockLoading(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      const updated = await api.updateIncidentStatus(id, status)
      setIncidents(prev => prev.map(i => i.id === id ? updated : i))
      if (selected?.id === id) setSelected(updated)
    } catch { /* ignore */ }
  }

  const stats = {
    total:    incidents.length,
    critical: incidents.filter(i => i.severity_label === 'Critical').length,
    open:     incidents.filter(i => i.status === 'Open').length,
  }

  return (
    <div style={s.root}>
      <Header />
      <div style={s.body}>

        {/* Left — input + stats */}
        <div style={s.left}>
          <div style={s.statsRow}>
            <Stat label="Total" value={stats.total} color="#3b82f6" />
            <Stat label="Critical" value={stats.critical} color="#ef4444" />
            <Stat label="Open" value={stats.open} color="#f59e0b" />
          </div>
          <SOSInput onSubmit={handleSubmit} onLoadMock={handleMock} loading={loading} mockLoading={mockLoading} />
          {error && <div style={s.errorBox}>⚠ {error}</div>}
          <div style={s.agentBadge}>
            <span style={s.agentDot} />
            Emergency Intelligence Agent · NLP Pipeline Active
          </div>
        </div>

        {/* Center — incident feed */}
        <div style={s.center}>
          <div style={s.feedHeader}>
            <span style={s.feedTitle}>⚡ Incident Feed</span>
            <span style={s.feedCount}>{incidents.length} incidents</span>
          </div>
          <IncidentFeed
            incidents={incidents}
            selected={selected}
            onSelect={setSelected}
            onStatusChange={handleStatusChange}
            filter={filter}
            onFilter={setFilter}
          />
        </div>

        {/* Right — detail panel */}
        <div style={s.right}>
          <DetailPanel incident={selected} />
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

export default function EmergencyDashboard() {
  return (
    <SimulationProvider>
      <DashboardInner />
    </SimulationProvider>
  )
}

const s = {
  root:        { display: 'flex', flexDirection: 'column', flex: 1, background: '#0a0f1e', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' },
  body:        { display: 'flex', flex: 1, overflow: 'hidden' },
  left:        { width: 320, flexShrink: 0, background: '#0d1117', borderRight: '1px solid #1f2937', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' },
  center:      { width: 340, flexShrink: 0, borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', padding: '0.75rem', overflow: 'hidden' },
  right:       { flex: 1, overflowY: 'auto', padding: '1rem' },
  statsRow:    { display: 'flex', gap: '0.5rem' },
  stat:        { flex: 1, background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.6rem', textAlign: 'center' },
  statVal:     { fontSize: '1.5rem', fontWeight: 700 },
  statLabel:   { color: '#4b5563', fontSize: '0.65rem', textTransform: 'uppercase' },
  errorBox:    { background: '#450a0a', border: '1px solid #ef4444', borderRadius: 8, padding: '0.6rem', color: '#fca5a5', fontSize: '0.78rem' },
  agentBadge:  { display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#374151', fontSize: '0.65rem', marginTop: 'auto' },
  agentDot:    { width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 },
  feedHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexShrink: 0 },
  feedTitle:   { color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 600 },
  feedCount:   { color: '#4b5563', fontSize: '0.72rem' },
  // Detail panel
  emptyDetail: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: '0.75rem' },
  emptyIcon:   { fontSize: '2.5rem' },
  emptyTitle:  { color: '#374151', fontSize: '1rem', fontWeight: 600 },
  emptySub:    { color: '#1f2937', fontSize: '0.8rem' },
  detail:      { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  detailHeader:{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.9rem' },
  detailIcon:  { fontSize: '1.8rem' },
  detailId:    { color: '#3b82f6', fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem' },
  detailTime:  { color: '#4b5563', fontSize: '0.72rem' },
  section:     { background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.75rem' },
  sectionTitle:{ color: '#e5e7eb', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' },
  sectionBody: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  row:         { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' },
  rowLabel:    { color: '#4b5563' },
  rowValue:    { color: '#d1d5db', textAlign: 'right', maxWidth: '60%' },
  signals:     { display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.25rem' },
  signal:      { color: '#f59e0b', fontSize: '0.72rem' },
  divider:     { borderTop: '1px solid #1f2937', margin: '0.25rem 0' },
  dupWarning:  { background: '#422006', border: '1px solid #f97316', borderRadius: 8, padding: '0.6rem', color: '#fdba74', fontSize: '0.75rem' },
  rawText:     { color: '#6b7280', fontSize: '0.75rem', lineHeight: 1.6, fontStyle: 'italic' },
}
