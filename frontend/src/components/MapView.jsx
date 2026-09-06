import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useSim } from '../context/SimulationContext'
import MarkerPopup from './MarkerPopup'

const BASE_COLOR = {
  Hospital:  '#ef4444',
  Shelter:   '#3b82f6',
  Resource:  '#f97316',
  FloodZone: '#6b7280',
}

const ALERT_COLOR = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#f59e0b',
  low:      '#22c55e',
}

const KERALA_CENTER = [10.1632, 76.6413]

function resolveMarker(loc, overrides) {
  const ov = overrides[String(loc.id)]
  const color = ov ? (ALERT_COLOR[ov.alert] ?? BASE_COLOR[loc.type]) : BASE_COLOR[loc.type]
  const isFlood = loc.type === 'FloodZone'
  const radius = ov?.alert === 'critical' ? 13 : isFlood ? 14 : 9
  const fillOpacity = isFlood ? 0.3 : ov ? 0.95 : 0.85
  const status = ov?.status ?? loc.status
  return { color, radius, fillOpacity, status }
}

export default function MapView({ locations }) {
  const { sim } = useSim()
  const overrides = sim.location_overrides

  return (
    <MapContainer center={KERALA_CENTER} zoom={8} style={{ flex: 1, height: '100%' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        maxZoom={19}
      />
      {locations.map(loc => {
        const { color, radius, fillOpacity, status } = resolveMarker(loc, overrides)
        return (
          <CircleMarker
            key={loc.id}
            center={[loc.lat, loc.lng]}
            radius={radius}
            pathOptions={{ color, fillColor: color, fillOpacity, weight: 2 }}
          >
            <Popup>
              <MarkerPopup location={{ ...loc, status }} />
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
