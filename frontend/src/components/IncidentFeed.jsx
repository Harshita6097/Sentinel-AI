import IncidentCard from './IncidentCard'
import SeverityBadge from './SeverityBadge'

const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low']

export default function IncidentFeed({ incidents, selected, onSelect, onStatusChange, filter, onFilter }) {
  const visible = filter === 'All' ? incidents : incidents.filter(i => i.severity_label === filter)

  return (
    <div style={s.wrap}>
      {/* Filter bar */}
      <div style={s.filterBar}>
        {SEVERITIES.map(sev => (
          <button
            key={sev}
            style={{ ...s.filterBtn, ...(filter === sev ? s.filterActive : {}) }}
            onClick={() => onFilter(sev)}
          >
            {sev === 'All' ? `All (${incidents.length})` : <SeverityBadge label={sev} size="sm" showDot={false} />}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={s.list}>
        {visible.length === 0
          ? <div style={s.empty}>No incidents{filter !== 'All' ? ` with severity "${filter}"` : ''}</div>
          : visible.map(inc => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                selected={selected?.id === inc.id}
                onClick={onSelect}
                onStatusChange={onStatusChange}
              />
            ))
        }
      </div>
    </div>
  )
}

const s = {
  wrap:       { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 },
  filterBar:  { display: 'flex', gap: '0.3rem', padding: '0.5rem 0', flexShrink: 0, flexWrap: 'wrap' },
  filterBtn:  { background: 'transparent', border: '1px solid #1f2937', borderRadius: 6, padding: '0.2rem 0.5rem', cursor: 'pointer', color: '#6b7280', fontSize: '0.72rem' },
  filterActive: { background: '#111827', borderColor: '#374151', color: '#e5e7eb' },
  list:       { overflowY: 'auto', flex: 1 },
  empty:      { color: '#4b5563', fontSize: '0.78rem', textAlign: 'center', padding: '2rem 0' },
}
