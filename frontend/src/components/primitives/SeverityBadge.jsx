const CFG = {
  Critical: { bg:'var(--red)',    color:'#fff' },
  High:     { bg:'var(--orange)', color:'#fff' },
  Medium:   { bg:'var(--amber)',  color:'#3a2a04' },
  Low:      { bg:'var(--blue)',   color:'#fff' },
}

export default function SeverityBadge({ level }) {
  const cfg = CFG[level] ?? { bg:'var(--text-3)', color:'#fff' }
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:64, padding:'4px 0', borderRadius:'var(--r-sm)',
      fontSize:9.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'.4px',
      background:cfg.bg, color:cfg.color, flexShrink:0,
    }}>
      {level}
    </span>
  )
}
