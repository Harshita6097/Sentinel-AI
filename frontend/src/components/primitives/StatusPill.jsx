const MAP = {
  critical:'var(--red)', high:'var(--orange)', medium:'var(--amber)', low:'var(--blue)',
  active:'var(--green)', blocked:'var(--red)', rerouted:'var(--orange)',
  assigned:'var(--green)', enroute:'var(--blue)', resolved:'var(--text-2)',
  available:'var(--green)', unassigned:'var(--red)', offline:'var(--text-3)',
  green:'var(--green)', yellow:'var(--amber)', orange:'var(--orange)', red:'var(--red)',
}

const ALPHA = {
  'var(--red)':'rgba(239,68,68,0.12)', 'var(--orange)':'rgba(249,115,22,0.12)',
  'var(--amber)':'rgba(245,158,11,0.12)', 'var(--green)':'rgba(34,197,94,0.12)',
  'var(--blue)':'rgba(59,130,246,0.12)', 'var(--text-2)':'rgba(107,114,128,0.12)',
  'var(--text-3)':'rgba(55,65,81,0.12)',
}

export default function StatusPill({ label }) {
  const c = MAP[label?.toLowerCase()] ?? 'var(--text-2)'
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', padding:'3px 9px',
      borderRadius:20, fontSize:10.5, fontWeight:700, letterSpacing:'.3px',
      color:c, background: ALPHA[c] ?? 'rgba(107,114,128,0.12)',
    }}>
      {label}
    </span>
  )
}
