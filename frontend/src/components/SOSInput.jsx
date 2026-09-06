import { useState } from 'react'

const PLACEHOLDER = `Type or paste an emergency report…

Examples:
• "Flood water entering City Hospital in Alappuzha. 120 patients need evacuation."
• "Bridge near Kottayam collapsed. Vehicles stranded."
• "Relief shelter in Kochi at full capacity. 200+ people outside."`

export default function SOSInput({ onSubmit, onLoadMock, loading, mockLoading }) {
  const [text, setText] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed) { setError('Report cannot be empty.'); return }
    if (trimmed.length < 10) { setError('Report is too short.'); return }
    setError(null)
    onSubmit(trimmed)
    setText('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit()
  }

  return (
    <div style={s.wrap}>
      <div style={s.label}>
        <span style={s.labelIcon}>🚨</span>
        <span style={s.labelText}>Submit Emergency Report</span>
      </div>

      <textarea
        style={{ ...s.textarea, ...(error ? s.textareaError : {}) }}
        value={text}
        onChange={e => { setText(e.target.value); setError(null) }}
        onKeyDown={handleKey}
        placeholder={PLACEHOLDER}
        rows={5}
        disabled={loading}
      />

      {error && <div style={s.error}>⚠ {error}</div>}

      <div style={s.hint}>Ctrl+Enter to submit</div>

      <div style={s.actions}>
        <button style={s.btnPrimary} onClick={handleSubmit} disabled={loading || !text.trim()}>
          {loading ? 'Processing…' : '⚡ Submit Report'}
        </button>
        <button style={s.btnSecondary} onClick={onLoadMock} disabled={mockLoading || loading}>
          {mockLoading ? 'Loading…' : '📋 Load Mock Reports'}
        </button>
      </div>
    </div>
  )
}

const s = {
  wrap:         { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label:        { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  labelIcon:    { fontSize: '1rem' },
  labelText:    { color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 600 },
  textarea: {
    background: '#0d1117', border: '1px solid #374151', borderRadius: 8,
    color: '#e5e7eb', fontSize: '0.8rem', padding: '0.75rem',
    resize: 'vertical', fontFamily: 'system-ui, sans-serif', lineHeight: 1.5,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  textareaError: { borderColor: '#ef4444' },
  error:        { color: '#fca5a5', fontSize: '0.72rem' },
  hint:         { color: '#374151', fontSize: '0.65rem', textAlign: 'right' },
  actions:      { display: 'flex', gap: '0.5rem' },
  btnPrimary: {
    flex: 1, padding: '0.55rem', background: '#dc2626', border: 'none',
    borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: '0.82rem',
    cursor: 'pointer',
  },
  btnSecondary: {
    padding: '0.55rem 0.9rem', background: '#1f2937', border: '1px solid #374151',
    borderRadius: 8, color: '#9ca3af', fontSize: '0.78rem', cursor: 'pointer',
  },
}
