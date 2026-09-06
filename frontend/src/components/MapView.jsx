import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet'
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

const ROUTE_COLOR = {
  Active:   '#22c55e',
  Rerouted: '#f97316',
  Blocked:  '#ef4444',
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

// Build a node-id → [lat, lng] lookup from the road network
function buildNodeIndex(network) {
  if (!network?.nodes) return {}
  return Object.fromEntries(network.nodes.map(n => [n.id, [n.lat, n.lng]]))
}

// Convert a route (array of node ids) to LatLng pairs
function routeToLatLngs(route, nodeIndex) {
  return route.map(id => nodeIndex[id]).filter(Boolean)
}

export default function MapView({ locations, network, routes }) {
  const { sim } = useSim()
  const overrides = sim.location_overrides
  const nodeIndex = buildNodeIndex(network)

  // Blocked edge midpoints for red overlay markers
  const blockedEdges = network?.edges?.filter(e => e.blocked) ?? []

  return (
    <MapContainer center={KERALA_CENTER} zoom={8} style={{ flex: 1, height: '100%' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        maxZoom={19}
      />

      {/* Location markers */}
      {locations.map(loc => {
        const { color, radius, fillOpacity, status } = resolveMarker(loc, overrides)
        return (
          <CircleMarker
            key={loc.id}
            center={[loc.lat, loc.lng]}
            radius={radius}
            pathOptions={{ color, fillColor: color, fillOpacity, weight: 2 }}
          >
            <Popup><MarkerPopup location={{ ...loc, status }} /></Popup>
          </CircleMarker>
        )
      })}

      {/* Route polylines */}
      {(routes ?? []).map(r => {
        const latlngs = routeToLatLngs(r.route, nodeIndex)
        if (latlngs.length < 2) return null
        const color = ROUTE_COLOR[r.status] ?? '#22c55e'
        return (
          <Polyline
            key={r.assignment_id}
            positions={latlngs}
            pathOptions={{ color, weight: r.status === 'Active' ? 3 : 2, opacity: 0.85, dashArray: r.status === 'Rerouted' ? '6 4' : undefined }}
          />
        )
      })}

      {/* Blocked road markers */}
      {blockedEdges.map(edge => {
        const fromNode = network.nodes.find(n => n.id === edge.from)
        const toNode   = network.nodes.find(n => n.id === edge.to)
        if (!fromNode || !toNode) return null
        const midLat = (fromNode.lat + toNode.lat) / 2
        const midLng = (fromNode.lng + toNode.lng) / 2
        return (
          <CircleMarker
            key={`blocked-${edge.id}`}
            center={[midLat, midLng]}
            radius={7}
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.9, weight: 2 }}
          >
            <Popup>
              <div style={{ fontFamily: 'system-ui', fontSize: 13 }}>
                <strong style={{ color: '#ef4444' }}>🚧 Road Blocked</strong><br />
                {edge.road_name}
              </div>
            </Popup>
          </CircleMarker>
        )
      })}

      {/* Destination markers for active assignments */}
      {(routes ?? []).filter(r => r.reachable).map(r => {
        const pos = nodeIndex[r.destination]
        if (!pos) return null
        return (
          <CircleMarker
            key={`dest-${r.assignment_id}`}
            center={pos}
            radius={8}
            pathOptions={{ color: '#a855f7', fillColor: '#a855f7', fillOpacity: 0.9, weight: 2 }}
          >
            <Popup>
              <div style={{ fontFamily: 'system-ui', fontSize: 13 }}>
                <strong style={{ color: '#a855f7' }}>📍 Destination</strong><br />
                {r.resource_id} → {r.destination}<br />
                ETA: {r.eta_minutes?.toFixed(0)} min
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
