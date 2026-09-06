const CONFIG = {
  Critical: { bg: '#450a0a', border: '#ef4444', color: '#fca5a5', dot: '#ef4444' },
  High:     { bg: '#431407', border: '#f97316', color: '#fdba74', dot: '#f97316' },
  Medium:   { bg: '#422006', border: '#f59e0b', color: '#fcd34d', dot: '#f59e0b' },
  Low:      { bg: '#052e16', border: '#22c55e', color: '#86efac', dot: '#22c55e' },
}

export default function SeverityBadge({ label, showDot = true, size = 'md' }) {
  const c = CONFIG[label] ?? CONFIG.Low
  const fontSize = size === 'sm' ? '0.62rem' : size === 'lg' ? '0.85rem' : '0.72rem'
  const padding  = size === 'sm' ? '0.1rem 0.4rem' : '0.2rem 0.6rem'

  return (
    <span style={{ ...s.badge, background: c.bg, border: `1px solid ${c.border}`, color: c.color, fontSize, padding }}>
      {showDot && <span style={{ ...s.dot, background: c.dot }} />}
      {label}
    </span>
  )
}

const s = {
  badge: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', borderRadius: 9999, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' },
  dot:   { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
}
