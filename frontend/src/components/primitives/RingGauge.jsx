export default function RingGauge({ value = 0, max = 100, size = 74, stroke = 7, color = 'var(--blue)', label }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(Math.max(value / max, 0), 1)
  const offset = circ * (1 - pct)
  const cx = size / 2, cy = size / 2

  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
        <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <span style={{
        position:'absolute', inset:0, display:'flex', alignItems:'center',
        justifyContent:'center', fontFamily:'var(--mono)', fontWeight:700,
        fontSize: size > 60 ? 16 : 10, color:'var(--white)',
      }}>
        {label ?? `${Math.round(value)}${max === 100 ? '%' : ''}`}
      </span>
    </div>
  )
}
