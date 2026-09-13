import { useEffect, useState } from 'react'
import { api } from '../services/api'

export default function SitrepPanel({ triggerKey }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = () => {
    setLoading(true)
    api.generateSitrep().then(setData).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { generate() }, [triggerKey])

  return (
    <div style={s.block}>
      <div style={s.card}>
        <div style={s.tag}>
          <span style={s.dot} />
          SITREP · {data?.llm_used ? 'Qwen 2.5' : 'Fallback'} · {data?.generated_at ?? '—'}
        </div>
        {loading
          ? <p style={s.muted}>Generating…</p>
          : <p style={s.text}>{data?.text ?? 'No situation report yet.'}</p>
        }
        <button style={s.regen} onClick={generate} disabled={loading}>
          {loading ? '…' : 'Regenerate'}
        </button>
      </div>
    </div>
  )
}

const s = {
  block: { padding:'var(--sp-4)', borderBottom:'1px solid var(--border-soft)', flexShrink:0 },
  card:  { borderRadius:'var(--r-lg)', border:'1px solid rgba(168,85,247,.35)', background:'rgba(168,85,247,.06)', padding:13 },
  tag:   { display:'flex', alignItems:'center', gap:6, fontSize:10.5, color:'var(--purple)', fontWeight:800, marginBottom:8 },
  dot:   { width:6, height:6, borderRadius:'50%', background:'var(--purple)', animation:'pulse 1.6s infinite', flexShrink:0 },
  text:  { fontSize:12, lineHeight:1.55, color:'var(--text-1)', margin:0 },
  muted: { fontSize:12, color:'var(--text-2)', margin:0 },
  regen: { marginTop:10, background:'none', border:'1px solid var(--border)', color:'var(--text-2)', fontSize:10.5, padding:'5px 10px', borderRadius:'var(--r-sm)', cursor:'pointer', fontWeight:600 },
}
