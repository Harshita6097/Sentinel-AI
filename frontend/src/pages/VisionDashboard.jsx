import { useState } from 'react'
import { SimulationProvider } from '../context/SimulationContext'
import Header from '../components/Header'
import ImageUploader from '../components/ImageUploader'
import VisionResults from '../components/VisionResults'
import { api } from '../services/api'

function VisionDashboardInner() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAnalyze = async (file) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await api.analyzeImage(file)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.root}>
      <Header />
      <div style={s.body}>

        {/* Left panel — upload */}
        <div style={s.left}>
          <div style={s.panelHeader}>
            <span style={s.panelIcon}>🛰️</span>
            <div>
              <div style={s.panelTitle}>Vision Agent</div>
              <div style={s.panelSub}>Flood Detection · Scene Understanding</div>
            </div>
          </div>
          <ImageUploader onAnalyze={handleAnalyze} loading={loading} />

          {loading && (
            <div style={s.loadingBox}>
              <div style={s.spinner} />
              <span style={s.loadingText}>Running analysis pipeline…</span>
            </div>
          )}

          {error && <div style={s.errorBox}>⚠ {error}</div>}

          <div style={s.modelStatus}>
            <span style={s.mockBadge}>MOCK MODE</span>
            <span style={s.mockNote}>Real SegFormer + Florence-2 weights plug in via D:\GOALS\Models\</span>
          </div>
        </div>

        {/* Right panel — results */}
        <div style={s.right}>
          {result
            ? <VisionResults result={result} />
            : (
              <div style={s.empty}>
                <div style={s.emptyIcon}>🔍</div>
                <div style={s.emptyTitle}>No Analysis Yet</div>
                <div style={s.emptySub}>Upload a satellite or aerial image to run flood detection and scene understanding.</div>
              </div>
            )
          }
        </div>

      </div>
    </div>
  )
}

export default function VisionDashboard() {
  return (
    <SimulationProvider>
      <VisionDashboardInner />
    </SimulationProvider>
  )
}

const s = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0f1e', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' },
  body: { display: 'flex', flex: 1, overflow: 'hidden', gap: 0 },
  left: {
    width: 380, flexShrink: 0, background: '#0d1117', borderRight: '1px solid #1f2937',
    padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem',
  },
  panelHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' },
  panelIcon: { fontSize: '1.8rem' },
  panelTitle: { color: '#f9fafb', fontWeight: 700, fontSize: '1rem' },
  panelSub: { color: '#6b7280', fontSize: '0.72rem' },
  loadingBox: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.75rem 1rem' },
  spinner: { width: 16, height: 16, border: '2px solid #1f2937', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 },
  loadingText: { color: '#6b7280', fontSize: '0.78rem' },
  errorBox: { background: '#450a0a', border: '1px solid #ef4444', borderRadius: 8, padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.8rem' },
  modelStatus: { marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  mockBadge: { background: '#1f2937', border: '1px solid #374151', color: '#f59e0b', borderRadius: 9999, padding: '0.15rem 0.5rem', fontSize: '0.65rem', fontWeight: 700 },
  mockNote: { color: '#374151', fontSize: '0.65rem' },
  right: { flex: 1, overflowY: 'auto', padding: '1.25rem' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: '0.75rem' },
  emptyIcon: { fontSize: '3rem' },
  emptyTitle: { color: '#374151', fontSize: '1.1rem', fontWeight: 600 },
  emptySub: { color: '#1f2937', fontSize: '0.82rem', maxWidth: 320, lineHeight: 1.6 },
}
