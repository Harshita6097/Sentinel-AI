import { useEffect } from 'react'
import { useDashboard } from '../context/DashboardContext'

const SEV_STYLE = {
  critical: { bg: '#450a0a', border: '#ef4444', color: '#fca5a5' },
  high:     { bg: '#431407', border: '#f97316', color: '#fdba74' },
  medium:   { bg: '#422006', border: '#f59e0b', color: '#fde68a' },
  low:      { bg: '#052e16', border: '#22c55e', color: '#86efac' },
}

function Toast({ toast, onDismiss }) {
  const sev = SEV_STYLE[toast.severity] ?? SEV_STYLE.low

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.toastId), 5000)
    return () => clearTimeout(t)
  }, [toast.toastId, onDismiss])

  return (
    <div
      style={{ ...s.toast, background: sev.bg, borderColor: sev.border }}
      onClick={() => onDismiss(toast.toastId)}
    >
      <span style={s.icon}>{toast.icon}</span>
      <div style={s.body}>
        <div style={{ ...s.title, color: sev.color }}>{toast.title}</div>
        {toast.detail && <div style={s.detail}>{toast.detail.slice(0, 80)}</div>}
      </div>
      <button style={s.close} onClick={() => onDismiss(toast.toastId)}>×</button>
    </div>
  )
}

export default function NotificationToast() {
  const { toasts, dismissToast } = useDashboard()
  if (!toasts.length) return null

  return (
    <div style={s.container}>
      {toasts.map(t => (
        <Toast key={t.toastId} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  )
}

const s = {
  container: { position: 'fixed', top: 60, right: 12, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.4rem', maxWidth: 320 },
  toast:     { display: 'flex', alignItems: 'flex-start', gap: '0.5rem', border: '1px solid', borderRadius: 8, padding: '0.6rem 0.75rem', cursor: 'pointer', animation: 'slideIn 0.2s ease' },
  icon:      { fontSize: '1rem', flexShrink: 0, marginTop: 1 },
  body:      { flex: 1, minWidth: 0 },
  title:     { fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.3 },
  detail:    { color: '#6b7280', fontSize: '0.68rem', marginTop: '0.15rem', lineHeight: 1.3 },
  close:     { background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: '1rem', padding: 0, flexShrink: 0, lineHeight: 1 },
}
