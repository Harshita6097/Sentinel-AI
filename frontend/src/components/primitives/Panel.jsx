export default function Panel({ children, style, padding = 'var(--sp-4)' }) {
  return (
    <div style={{
      background:'var(--panel)', border:'1px solid var(--border)',
      borderRadius:'var(--r-lg)', padding, overflow:'hidden', ...style,
    }}>
      {children}
    </div>
  )
}
