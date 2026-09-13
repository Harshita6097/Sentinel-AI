import { useCallback, useEffect, useState } from 'react'
import { SimulationProvider } from '../context/SimulationContext'
import SeverityBadge from '../components/primitives/SeverityBadge'
import StatusPill from '../components/primitives/StatusPill'
import { api } from '../services/api'

const SEV_BORDER = { Critical:'var(--red)', High:'var(--orange)', Medium:'var(--amber)', Low:'var(--blue)' }
const TYPES = ['Flood entrapment','Medical','Infrastructure','Supply request','Welfare check','Other']

function IncidentCard({ inc, onStatusChange }) {
  return (
    <div style={{ ...s.card, borderLeftColor: SEV_BORDER[inc.severity_label] ?? 'var(--text-3)' }}>
      <SeverityBadge level={inc.severity_label} />
      <div style={s.cardDetails}>
        <div style={s.cardLoc}>{inc.location ?? inc.id}</div>
        <div style={s.cardMeta}>
          <span>{inc.incident_type ?? '—'}</span>
          <span>{inc.id}</span>
          <span>{inc.time}</span>
        </div>
      </div>
      <StatusPill label={inc.status} />
      <select
        style={s.select}
        defaultValue=""
        onChange={e => { if (e.target.value) onStatusChange(inc.id, e.target.value) }}
      >
        <option value="" disabled>Update</option>
        <option>Open</option><option>Assigned</option><option>Enroute</option><option>Resolved</option>
      </select>
    </div>
  )
}

function SOSForm({ onSubmit, loading }) {
  const [loc, setLoc]   = useState('')
  const [type, setType] = useState(TYPES[0])
  const [sev, setSev]   = useState('Critical')
  const [desc, setDesc] = useState('')

  const submit = () => {
    if (!loc.trim()) return
    onSubmit(`${sev} ${type} at ${loc}. ${desc}`.trim())
    setLoc(''); setDesc('')
  }

  return (
    <div style={s.sosForm}>
      <div style={s.formTitle}>New SOS report</div>
      <Field label="Location"><input style={s.input} value={loc} onChange={e => setLoc(e.target.value)} placeholder="e.g. Kuttanad, near St. Mary's church" /></Field>
      <Field label="Type">
        <select style={s.input} value={type} onChange={e => setType(e.target.value)}>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Severity">
        <div style={s.sevRow}>
          {['Critical','High','Medium','Low'].map(sv => (
            <button key={sv} style={{ ...s.sevBtn, ...(sev === sv ? s.sevBtnOn[sv] : {}) }} onClick={() => setSev(sv)}>{sv}</button>
          ))}
        </div>
      </Field>
      <Field label="Description">
        <textarea style={{ ...s.input, height:56, resize:'none' }} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Number of people, visible conditions, access notes…" />
      </Field>
      <button style={s.submitBtn} onClick={submit} disabled={loading || !loc.trim()}>
        {loading ? 'Submitting…' : 'Submit report'}
      </button>
    </div>
  )
}

function Field({ label, children }) {
  return <div style={{ marginBottom:10 }}><label style={s.fieldLabel}>{label}</label>{children}</div>
}

function DashboardInner() {
  const [incidents, setIncidents] = useState([])
  const [filter, setFilter]       = useState('All')
  const [loading, setLoading]     = useState(false)

  const fetch = useCallback(() => { api.getIncidents().then(setIncidents).catch(() => {}) }, [])
  useEffect(() => { fetch(); const t = setInterval(fetch, 5000); return () => clearInterval(t) }, [fetch])

  const handleSubmit = async (text) => {
    setLoading(true)
    try { const inc = await api.submitReport(text); setIncidents(prev => [inc, ...prev]) }
    catch { /* ignore */ } finally { setLoading(false) }
  }

  const handleStatusChange = async (id, status) => {
    try {
      const updated = await api.updateIncidentStatus(id, status)
      setIncidents(prev => prev.map(i => i.id === id ? updated : i))
    } catch { /* ignore */ }
  }

  const counts = {
    Critical: incidents.filter(i => i.severity_label === 'Critical').length,
    High:     incidents.filter(i => i.severity_label === 'High').length,
    Medium:   incidents.filter(i => i.severity_label === 'Medium').length,
    Low:      incidents.filter(i => i.severity_label === 'Low').length,
    Unassigned: incidents.filter(i => i.status === 'Open').length,
  }

  const unassignedCrit = incidents.filter(i => i.severity_label === 'Critical' && i.status === 'Open').length

  const filtered = filter === 'All' ? incidents
    : filter === 'Unassigned' ? incidents.filter(i => i.status === 'Open')
    : incidents.filter(i => i.severity_label === filter)

  return (
    <div style={s.app}>
      {/* Briefing */}
      <div style={s.briefing}>
        <div style={s.briefingIcon}>🚨</div>
        <div style={{ flex:1 }}>
          <div style={s.briefingEyebrow}>Unassigned · Critical</div>
          <div style={s.briefingTitle}>
            {unassignedCrit > 0 ? `${unassignedCrit} critical report${unassignedCrit > 1 ? 's' : ''} have no unit assigned` : 'All critical incidents are assigned'}
          </div>
        </div>
        <button style={s.briefingBtn} onClick={() => setFilter('Unassigned')}>Review unassigned</button>
      </div>

      {/* Filter toolbar */}
      <div style={s.toolbar}>
        {['All','Critical','High','Medium','Low','Unassigned'].map(f => (
          <button key={f} style={{ ...s.chip, ...(filter === f ? s.chipOn : {}), ...(filter === f && f === 'Critical' ? s.chipCrit : {}) }}
            onClick={() => setFilter(f)}>
            {f}{f !== 'All' ? ` (${counts[f] ?? 0})` : ` (${incidents.length})`}
          </button>
        ))}
        <div style={{ flex:1 }} />
        <span style={{ fontSize:11.5, color:'var(--text-2)', fontFamily:'var(--mono)' }}>{incidents.length} incidents</span>
      </div>

      {/* Body */}
      <div style={s.body}>
        <div style={s.incidentList}>
          {filtered.length === 0
            ? <div style={{ color:'var(--text-3)', fontSize:12, textAlign:'center', padding:'2rem' }}>No incidents</div>
            : filtered.map(inc => <IncidentCard key={inc.id} inc={inc} onStatusChange={handleStatusChange} />)
          }
        </div>

        <div style={s.rail}>
          <SOSForm onSubmit={handleSubmit} loading={loading} />
          <div style={s.miniMapPanel}>
            <div style={s.formTitle}>Incident map</div>
            <div style={s.miniMap}>
              <svg viewBox="0 0 300 150" style={{ width:'100%', height:150, display:'block' }}>
                <rect width="300" height="150" fill="var(--panel-2)" />
                <path d="M40,30 L260,20 L270,130 L60,140 Z" fill="none" stroke="#243244" strokeWidth="1" />
                {incidents.filter(i => i.severity_label === 'Critical').slice(0,3).map((_, i) => (
                  <circle key={i} cx={[130,180,90][i]} cy={[70,95,100][i]} r="6" fill="var(--red)" stroke="#fff" strokeWidth="1.5" />
                ))}
                {incidents.filter(i => i.severity_label === 'High').slice(0,2).map((_, i) => (
                  <circle key={i} cx={[160,210][i]} cy={[50,70][i]} r="5" fill="var(--orange)" stroke="#fff" strokeWidth="1" />
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EmergencyDashboard() {
  return <SimulationProvider><DashboardInner /></SimulationProvider>
}

const s = {
  app:           { display:'grid', gridTemplateRows:'auto auto 1fr', gap:12, padding:12, overflow:'hidden', flex:1 },
  briefing:      { background:'linear-gradient(135deg,rgba(239,68,68,.12),rgba(13,17,23,.4))', border:'1px solid rgba(239,68,68,.35)', borderRadius:'var(--r-lg)', padding:'14px 18px', display:'flex', alignItems:'center', gap:20, flexShrink:0 },
  briefingIcon:  { width:44, height:44, borderRadius:10, background:'rgba(239,68,68,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 },
  briefingEyebrow:{ fontSize:10.5, color:'var(--red)', fontWeight:800, letterSpacing:'.4px', marginBottom:3 },
  briefingTitle: { fontSize:15.5, fontWeight:800, color:'var(--white)' },
  briefingBtn:   { background:'var(--red)', color:'#fff', border:'none', padding:'9px 16px', borderRadius:'var(--r-sm)', fontWeight:700, fontSize:12.5, cursor:'pointer', whiteSpace:'nowrap' },
  toolbar:       { display:'flex', alignItems:'center', gap:10, flexShrink:0, flexWrap:'wrap' },
  chip:          { fontSize:11.5, padding:'6px 13px', borderRadius:20, border:'1px solid var(--border)', background:'var(--panel)', color:'var(--text-1)', cursor:'pointer', fontWeight:600 },
  chipOn:        { background:'var(--panel-2)', color:'var(--white)', borderColor:'var(--text-3)' },
  chipCrit:      { borderColor:'var(--red)', color:'var(--red)' },
  body:          { display:'grid', gridTemplateColumns:'1fr 320px', gap:12, overflow:'hidden' },
  incidentList:  { display:'flex', flexDirection:'column', gap:8, overflowY:'auto' },
  card:          { background:'var(--panel)', border:'1px solid var(--border)', borderLeft:'4px solid', borderRadius:'var(--r-md)', padding:'12px 14px', display:'flex', alignItems:'center', gap:14 },
  cardDetails:   { flex:1, minWidth:0 },
  cardLoc:       { fontSize:13.5, fontWeight:700, color:'var(--white)', marginBottom:2 },
  cardMeta:      { fontSize:11, color:'var(--text-2)', display:'flex', gap:10 },
  select:        { background:'var(--panel-2)', border:'1px solid var(--border)', color:'var(--white)', fontSize:11, padding:'6px 8px', borderRadius:'var(--r-sm)', flexShrink:0 },
  rail:          { display:'flex', flexDirection:'column', gap:12, overflowY:'auto' },
  sosForm:       { background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:14, flexShrink:0 },
  formTitle:     { fontSize:11, textTransform:'uppercase', letterSpacing:'.6px', color:'var(--text-2)', fontWeight:800, marginBottom:12 },
  fieldLabel:    { display:'block', fontSize:11, color:'var(--text-2)', marginBottom:5, fontWeight:600 },
  input:         { width:'100%', background:'var(--panel-2)', border:'1px solid var(--border)', color:'var(--white)', fontSize:12, padding:'8px 10px', borderRadius:7, fontFamily:'var(--sys)', outline:'none' },
  sevRow:        { display:'flex', gap:6 },
  sevBtn:        { flex:1, padding:'7px 0', borderRadius:'var(--r-sm)', border:'1px solid var(--border)', background:'var(--panel-2)', color:'var(--text-2)', fontSize:10.5, fontWeight:700, cursor:'pointer' },
  sevBtnOn:      { Critical:{ background:'rgba(239,68,68,.15)', borderColor:'var(--red)', color:'var(--red)' }, High:{ background:'rgba(249,115,22,.15)', borderColor:'var(--orange)', color:'var(--orange)' }, Medium:{ background:'rgba(245,158,11,.15)', borderColor:'var(--amber)', color:'var(--amber)' }, Low:{ background:'rgba(59,130,246,.15)', borderColor:'var(--blue)', color:'var(--blue)' } },
  submitBtn:     { width:'100%', background:'var(--red)', color:'#fff', border:'none', padding:10, borderRadius:'var(--r-sm)', fontWeight:700, fontSize:12.5, cursor:'pointer', marginTop:4 },
  miniMapPanel:  { background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:14 },
  miniMap:       { borderRadius:10, overflow:'hidden', border:'1px solid var(--border)', marginTop:8 },
}
