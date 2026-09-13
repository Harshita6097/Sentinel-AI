import { useState } from 'react'
import { SimulationProvider } from '../context/SimulationContext'
import { api } from '../services/api'
import RingGauge from '../components/primitives/RingGauge'

const RISK_COLOR = { Low:'var(--green)', Medium:'var(--amber)', High:'var(--orange)', Critical:'var(--red)' }
const DEPTH_LABEL = { shallow:'< 30 cm', moderate:'30–80 cm', deep:'> 80 cm' }

const SAMPLES = [
  { id:'alappuzha_2018_08_17', label:'Alappuzha — Coastal Belt', sub:'62% flood coverage · Critical', color:'#1e3a5f' },
  { id:'kuttanad_2018_08_18',  label:'Kuttanad — Backwaters',    sub:'48% flood coverage · High',     color:'#243244' },
  { id:'ernakulam_2018_08_16', label:'Ernakulam — Urban Fringe', sub:'31% flood coverage · High',     color:'#1a2d4a' },
  { id:'pathanamthitta_2018',  label:'Pathanamthitta — Delta',   sub:'55% flood coverage · Critical', color:'#1f3550' },
]

function LeftPanel({ onResult, loading, setLoading }) {
  const [selected, setSelected] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [modelMode, setModelMode] = useState('mock')

  useState(() => {
    api.visionHealth().then(h => setModelMode(h.mock_mode ? 'mock' : 'real')).catch(() => {})
  }, [])

  const analyze = async (file) => {
    setLoading(true)
    try { onResult(await api.analyzeImage(file)) }
    catch { /* ignore */ } finally { setLoading(false) }
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) analyze(f)
  }

  const handleSample = async (sample) => {
    setSelected(sample.id)
    setLoading(true)
    try {
      const resp = await fetch(`/samples/${sample.id}.jpg`)
      const blob = await resp.blob()
      const file = new File([blob], `${sample.id}.jpg`, { type:'image/jpeg' })
      onResult(await api.analyzeImage(file))
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  return (
    <div style={s.leftPanel}>
      <div style={s.panelTitle}>Analyze imagery</div>

      <div
        style={{ ...s.dropzone, borderColor: dragOver ? 'var(--purple)' : 'var(--border)' }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('vfile').click()}
      >
        <div style={{ fontSize:26, marginBottom:8 }}>📤</div>
        <div style={s.dropT1}>Drag and drop satellite image</div>
        <div style={s.dropT2}>or click to browse · JPG, PNG, TIFF</div>
        <input id="vfile" type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => e.target.files[0] && analyze(e.target.files[0])} />
      </div>

      <button style={s.btnPrimary} onClick={() => handleSample(SAMPLES[0])} disabled={loading}>
        {loading ? 'Analyzing…' : 'Load sample Kerala image'}
      </button>

      <div style={s.sampleList}>
        {SAMPLES.map(s2 => (
          <div key={s2.id} style={{ ...s.sampleItem, ...(selected === s2.id ? s.sampleSelected : {}) }}
            onClick={() => handleSample(s2)}>
            <div style={{ ...s.sampleThumb, background: s2.color }} />
            <div>
              <div style={{ fontSize:11.5, color:'var(--text-1)' }}>{s2.label}</div>
              <div style={{ fontSize:9.5, color:'var(--text-2)' }}>{s2.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={s.modelStatus}>
        {[['SegFormer (flood detection)','var(--green)','Ready'],['Florence-2 (scene description)','var(--green)','Ready'],['Mode','var(--blue)', modelMode === 'real' ? 'Real inference' : 'Simulation data']].map(([name,c,badge]) => (
          <div key={name} style={s.modelRow}>
            <span style={{ fontSize:11.5, color:'var(--text-1)', fontWeight:600 }}>{name}</span>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:c }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:c, flexShrink:0 }} />{badge}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResultsPanel({ result }) {
  if (!result) return (
    <div style={s.empty}>
      <div style={{ fontSize:'3rem' }}>🔍</div>
      <div style={{ color:'var(--text-3)', fontSize:13, fontWeight:600 }}>No Analysis Yet</div>
      <div style={{ color:'var(--text-3)', fontSize:11.5, maxWidth:300, textAlign:'center', lineHeight:1.6 }}>
        Upload a satellite image or load a sample Kerala flood image to run analysis.
      </div>
    </div>
  )

  const { analysis, scene_description } = result
  const riskColor = RISK_COLOR[analysis.risk_level] ?? 'var(--text-2)'
  const gaugeColor = analysis.coverage_percent >= 50 ? 'var(--red)' : analysis.coverage_percent >= 25 ? 'var(--orange)' : 'var(--amber)'

  return (
    <div style={s.results}>
      <div style={s.resultGrid}>
        {/* Flood coverage card */}
        <div style={s.resultCard}>
          <div style={s.cardHead}>
            Flood coverage
            <span style={s.aiTag}>SegFormer</span>
          </div>
          <div style={s.floodReadout}>
            <RingGauge value={analysis.coverage_percent} size={74} stroke={7} color={gaugeColor} />
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
              <div style={s.statLine}><span style={s.statL}>Est. water depth</span><span style={s.statV}>{DEPTH_LABEL[analysis.water_depth_estimate] ?? '—'}</span></div>
              <div style={s.statLine}><span style={s.statL}>Model confidence</span><span style={s.statV}>{result.confidence?.overall ?? '—'}%</span></div>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700, marginTop:10, background:`${riskColor}22`, color:riskColor }}>
                ● {analysis.risk_level} risk
              </span>
            </div>
          </div>
        </div>

        {/* Scene description card */}
        <div style={s.resultCard}>
          <div style={s.cardHead}>Scene description <span style={s.aiTag}>Florence-2</span></div>
          <div style={s.sceneDesc}>{scene_description.caption}</div>
        </div>
      </div>

      {/* Affected zones */}
      <div style={s.resultCard}>
        <div style={s.cardHead}>Affected zones</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {analysis.affected_zones.map(z => (
            <span key={z} style={s.zoneChip}>{z}</span>
          ))}
        </div>
      </div>

      {/* Key observations */}
      <div style={s.resultCard}>
        <div style={s.cardHead}>Key observations</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {scene_description.key_observations.map((o, i) => (
            <div key={i} style={s.obsItem}>
              <span style={s.obsDot} />
              {o}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DashboardInner() {
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)

  const latestScan = result
    ? `${result.analysis.coverage_percent}% flood coverage detected — risk level ${result.analysis.risk_level}`
    : 'No scan yet — load a sample image or upload satellite imagery'

  return (
    <div style={s.app}>
      {/* Briefing bar */}
      <div style={s.briefing}>
        <div style={s.briefingIcon}>🛰️</div>
        <div style={{ flex:1 }}>
          <div style={s.briefingEyebrow}>Latest scan · Vision Agent</div>
          <div style={s.briefingTitle}>{latestScan}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11.5, color:'var(--text-1)', flexShrink:0 }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--green)' }} />
          SegFormer + Florence-2 ready
        </div>
      </div>

      <div style={s.body}>
        <LeftPanel onResult={setResult} loading={loading} setLoading={setLoading} />
        <ResultsPanel result={result} />
      </div>
    </div>
  )
}

export default function VisionDashboard() {
  return <SimulationProvider><DashboardInner /></SimulationProvider>
}

const s = {
  app:           { display:'grid', gridTemplateRows:'auto 1fr', gap:12, padding:12, overflow:'hidden', flex:1 },
  briefing:      { background:'linear-gradient(135deg,rgba(168,85,247,.12),rgba(13,17,23,.4))', border:'1px solid rgba(168,85,247,.35)', borderRadius:'var(--r-lg)', padding:'14px 18px', display:'flex', alignItems:'center', gap:20, flexShrink:0 },
  briefingIcon:  { width:44, height:44, borderRadius:10, background:'rgba(168,85,247,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 },
  briefingEyebrow:{ fontSize:10.5, color:'var(--purple)', fontWeight:800, letterSpacing:'.4px', marginBottom:3 },
  briefingTitle: { fontSize:15.5, fontWeight:800, color:'var(--white)' },
  body:          { display:'grid', gridTemplateColumns:'320px 1fr', gap:12, overflow:'hidden' },
  leftPanel:     { background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:14, overflowY:'auto', display:'flex', flexDirection:'column', gap:12 },
  panelTitle:    { fontSize:11, textTransform:'uppercase', letterSpacing:'.6px', color:'var(--text-2)', fontWeight:800 },
  dropzone:      { border:'2px dashed', borderRadius:10, padding:'28px 14px', textAlign:'center', cursor:'pointer' },
  dropT1:        { fontSize:12.5, color:'var(--text-1)', fontWeight:600, marginBottom:3 },
  dropT2:        { fontSize:11, color:'var(--text-2)' },
  btnPrimary:    { width:'100%', padding:10, borderRadius:'var(--r-sm)', fontSize:12.5, fontWeight:700, cursor:'pointer', border:'none', background:'var(--purple)', color:'#fff' },
  sampleList:    { display:'flex', flexDirection:'column', gap:6 },
  sampleItem:    { display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:7, background:'var(--panel-2)', fontSize:11.5, border:'1px solid transparent', cursor:'pointer' },
  sampleSelected:{ borderColor:'var(--purple)', background:'rgba(168,85,247,.1)' },
  sampleThumb:   { width:28, height:28, borderRadius:5, flexShrink:0 },
  modelStatus:   { display:'flex', flexDirection:'column', gap:8, paddingTop:10, borderTop:'1px solid var(--border-soft)', marginTop:'auto' },
  modelRow:      { display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11.5 },
  results:       { display:'flex', flexDirection:'column', gap:12, overflowY:'auto' },
  resultGrid:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  resultCard:    { background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:16 },
  cardHead:      { fontSize:10.5, textTransform:'uppercase', letterSpacing:'.6px', color:'var(--text-2)', fontWeight:800, marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between' },
  aiTag:         { fontSize:9, color:'var(--purple)', background:'rgba(168,85,247,.12)', padding:'2px 7px', borderRadius:10, textTransform:'none', letterSpacing:0, fontWeight:700 },
  floodReadout:  { display:'flex', alignItems:'center', gap:18 },
  statLine:      { display:'flex', justifyContent:'space-between', fontSize:12 },
  statL:         { color:'var(--text-2)' },
  statV:         { color:'var(--white)', fontFamily:'var(--mono)', fontWeight:600 },
  sceneDesc:     { fontSize:12.5, lineHeight:1.6, color:'var(--text-1)', background:'rgba(168,85,247,.06)', borderLeft:'3px solid var(--purple)', padding:'10px 12px', borderRadius:'0 8px 8px 0' },
  zoneChip:      { fontSize:11, padding:'5px 10px', borderRadius:16, background:'var(--panel-2)', border:'1px solid var(--border)', color:'var(--text-1)' },
  obsItem:       { display:'flex', gap:8, fontSize:12, color:'var(--text-1)', lineHeight:1.4 },
  obsDot:        { width:5, height:5, borderRadius:'50%', background:'var(--amber)', marginTop:6, flexShrink:0 },
  empty:         { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, gap:12 },
}
