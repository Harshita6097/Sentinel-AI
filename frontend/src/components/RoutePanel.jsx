import { useState } from 'react'
import RouteCard from './RouteCard'

const DESTINATIONS = [
  'Kochi', 'Alappuzha', 'Kottayam', 'Thiruvananthapuram',
  'Thrissur', 'Palakkad', 'Pathanamthitta', 'Idukki', 'Ernakulam',
]

const RESOURCE_TYPES = ['Any', 'Boat', 'Ambulance', 'Helicopter', 'Truck']

export default function RoutePanel({ routes, onAssign, onRecalculate, loading }) {
  const [dest, setDest]   = useState(DESTINATIONS[0])
  const [rtype, setRtype] = useState('Any')
  const [selected, setSelected] = useState(null)

  const handleAssign = () => {
    onAssign({ destination: dest, resource_type: rtype === 'Any' ? null : rtype })
  }

  return (
    <div style={s.root}>
      {/* Assign form */}
      <div style={s.form}>
        <select style={s.select} value={dest} onChange={e => setDest(e.target.value)}>
          {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select style={s.select} value={rtype} onChange={e => setRtype(e.target.value)}>
          {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button style={s.btn} onClick={handleAssign} disabled={loading}>
          {loading ? '…' : 'Assign'}
        </button>
        <button style={s.btnSecondary} onClick={onRecalculate} disabled={loading}>
          ↺ Recalc
        </button>
      </div>

      {/* Route list */}
      <div style={s.list}>
        {routes.length === 0 ? (
          <div style={s.empty}>No active assignments. Assign a resource above.</div>
        ) : (
          routes.map(r => (
            <RouteCard
              key={r.assignment_id}
              assignment={r}
              selected={selected === r.assignment_id}
              onClick={() => setSelected(r.assignment_id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

const s = {
  root:         { display: 'flex', flexDirection: 'column', gap: '0.6rem', overflow: 'hidden', flex: 1 },
  form:         { display: 'flex', gap: '0.4rem', flexWrap: 'wrap', flexShrink: 0 },
  select:       { background: '#111827', border: '1px solid #1f2937', color: '#d1d5db', borderRadius: 6, padding: '0.3rem 0.5rem', fontSize: '0.75rem', flex: 1, minWidth: 100 },
  btn:          { background: '#1e3a5f', border: '1px solid #3b82f6', color: '#60a5fa', borderRadius: 6, padding: '0.3rem 0.7rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 },
  btnSecondary: { background: '#111827', border: '1px solid #374151', color: '#6b7280', borderRadius: 6, padding: '0.3rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer' },
  list:         { display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto', flex: 1 },
  empty:        { color: '#374151', fontSize: '0.75rem', textAlign: 'center', padding: '2rem 0' },
}
