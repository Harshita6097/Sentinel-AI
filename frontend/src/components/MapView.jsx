import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import MarkerPopup from './MarkerPopup'

const TYPE_COLOR = {
  Hospital: '#ef4444',
  Shelter: '#3b82f6',
  Resource: '#f97316',
  FloodZone: '#6b7280',
}

const KERALA_CENTER = [10.1632, 76.6413]

export default function MapView({ locations }) {
  return (
    <MapContainer
      center={KERALA_CENTER}
      zoom={8}
      style={{ flex: 1, height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        maxZoom={19}
      />
      {locations.map((loc) => (
        <CircleMarker
          key={loc.id}
          center={[loc.lat, loc.lng]}
          radius={loc.type === 'FloodZone' ? 14 : 9}
          pathOptions={{
            color: TYPE_COLOR[loc.type] ?? '#9ca3af',
            fillColor: TYPE_COLOR[loc.type] ?? '#9ca3af',
            fillOpacity: loc.type === 'FloodZone' ? 0.25 : 0.85,
            weight: 2,
          }}
        >
          <Popup>
            <MarkerPopup location={loc} />
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
