import { useState } from 'react'
import RecommendationCard from './RecommendationCard'

export default function RescueQueue({ recommendations, onRecompute, loading }) {
  const [expanded, setExpanded] = useState(null)

  const toggle = (rank) => setExpanded(prev => prev === rank ? null : rank)

  return (
    <div style={s.root}>
      <div style={s.header}>
        <span style={s.title}>Rescue Queue</span>
        <button style={s.btn} onClick={onRecompute} disabled={loading}>
          {loading ? '…' : '↺ Recompute'}
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🎯</div>
          <div>No recommendations yet.</div>
          <div style={s.emptySub}>Click Recompute or submit an incident report.</div>
        </div>
      ) : (
        <div style={s.list}>
          {recommendations.map(rec => (
            <RecommendationCard
              key={rec.rank}
              rec={rec}
              expanded={expanded === rec.rank}
              onToggle={() => toggle(rec.rank)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const s = {
  root:      { display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'hidden', flex: 1 },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  title:     { color: '#e5e7eb', fontWeight: 700, fontSize: '0.82rem' },
  btn:       { background: '#111827', border: '1px solid #374151', color: '#9ca3af', borderRadius: 6, padding: '0.25rem 0.6rem', fontSize: '0.72rem', cursor: 'pointer' },
  list:      { display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto', flex: 1 },
  empty:     { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '0.4rem', color: '#374151', fontSize: '0.75rem', textAlign: 'center' },
  emptyIcon: { fontSize: '2rem' },
  emptySub:  { color: '#1f2937', fontSize: '0.68rem' },
}
