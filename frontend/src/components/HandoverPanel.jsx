import { useState } from 'react'
import { api } from '../services/api'

export default function HandoverPanel() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = () => {
    setLoading(true)
    api.generateHandover()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  return (
    <div style={s.card}>
      <div style={s.header}>
        <span style={s.icon}>🔄</span>
        <span style={s.title}>Shift Handover</span>
        <button style={s.btn} onClick={generate} disabled={loading}>
          {loading ? '…' : 'Generate'}
        </button>
      </div>
      {data ? (
        <>
          <p style={s.text}>{data.text}</p>
          <div style={s.footer}>
            <span style={s.ts}>{data.generated_at}</span>
            <span style={{ ...s.badge, background: data.llm_used ? '#1d4ed8' : '#374151' }}>
              {data.llm_used ? 'Qwen 2.5' : 'Fallback'}
            </span>
          </div>
        </>
      ) : (
        <div style={s.muted}>Click Generate to create a handover briefing</div>
      )}
    </div>
  )
}

const s = {
  card:   { background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  header: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  icon:   { fontSize: '0.9rem' },
  title:  { color: '#e5e7eb', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 },
  btn:    { background: '#1f2937', border: '1px solid #374151', color: '#9ca3af', borderRadius: 5, padding: '0.2rem 0.5rem', fontSize: '0.65rem', cursor: 'pointer' },
  text:   { color: '#d1d5db', fontSize: '0.75rem', lineHeight: 1.6, margin: 0 },
  muted:  { color: '#4b5563', fontSize: '0.72rem' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  ts:     { color: '#374151', fontSize: '0.6rem' },
  badge:  { fontSize: '0.6rem', color: '#93c5fd', padding: '0.1rem 0.4rem', borderRadius: 4 },
}
