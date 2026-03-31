import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { listingsApi } from '../../api'
import type { ListingFilters, MapPin } from '../../types'

// Fix default marker icons broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom price pin icon
const createPricePin = (price: number, status: string) => {
  const bg =
    status === 'pending'   ? '#FFE66D' :
    status === 'offMarket' ? '#FF6B6B' : '#4ECDC4'
  const color = status === 'pending' ? '#1B1F3B' : status === 'offMarket' ? '#fff' : '#1B1F3B'

  return L.divIcon({
    className: '',
    html: `
      <div style="
        background:${bg};color:${color};
        font-family:'Syne',sans-serif;font-weight:700;font-size:12px;
        padding:5px 10px;border-radius:20px;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
        white-space:nowrap;border:2px solid rgba(255,255,255,0.3);
        cursor:pointer;
      ">$${price.toLocaleString()}</div>
    `,
    iconAnchor: [30, 16],
    popupAnchor: [0, -20],
  })
}

// Fly to filtered location
function MapController({ pins }: { pins: MapPin[] }) {
  const map = useMap()
  useEffect(() => {
    if (pins.length > 0) {
      const lats = pins.map((p) => p.coordinates.coordinates[1])
      const lngs = pins.map((p) => p.coordinates.coordinates[0])
      const bounds = L.latLngBounds(
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      )
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    }
  }, [pins, map])
  return null
}

interface Props { filters: Partial<ListingFilters> }

export default function MapView({ filters }: Props) {
  const [pins, setPins]     = useState<MapPin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    listingsApi.getMapPins(filters)
      .then((res) => setPins(res.data.data.pins))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filters])

  return (
    <div style={styles.wrap}>
      {loading && (
        <div style={styles.loadingOverlay}>
          <div className="spinner" />
        </div>
      )}
      <MapContainer
        center={[39.5, -98.35]}
        zoom={4}
        style={styles.map}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {pins.map((pin) => {
          const [lng, lat] = pin.coordinates.coordinates
          if (!lat || !lng) return null
          return (
            <Marker
              key={pin._id}
              position={[lat, lng]}
              icon={createPricePin(pin.price, pin.status)}
            >
              <Popup>
                <div style={styles.popup}>
                  {pin.images[0] && (
                    <img src={pin.images[0]} alt={pin.title} style={styles.popupImg} />
                  )}
                  <div style={styles.popupBody}>
                    <div style={styles.popupPrice}>${pin.price.toLocaleString()}/mo</div>
                    <div style={styles.popupTitle}>{pin.title}</div>
                    <Link to={`/listings/${pin._id}`} style={styles.popupLink}>
                      View Details →
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
        <MapController pins={pins} />
      </MapContainer>
      <div style={styles.count}>{pins.length} listings on map</div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position:     'relative',
    borderRadius: 18,
    overflow:     'hidden',
    border:       '1px solid rgba(255,255,255,0.08)',
    height:       600,
  },
  map: { height: '100%', width: '100%' },
  loadingOverlay: {
    position:        'absolute',
    inset:           0,
    background:      'rgba(21,24,41,0.7)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          999,
  },
  count: {
    position:     'absolute',
    bottom:       12,
    left:         12,
    background:   'rgba(27,31,59,0.9)',
    color:        '#9BA3C7',
    fontSize:     12,
    padding:      '5px 12px',
    borderRadius: 20,
    zIndex:       999,
    fontFamily:   "'Plus Jakarta Sans', sans-serif",
    fontWeight:   600,
  },
  popup: { minWidth: 200, fontFamily: "'DM Sans', sans-serif" },
  popupImg: { width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 },
  popupBody: { display: 'flex', flexDirection: 'column', gap: 4 },
  popupPrice: { fontSize: 16, fontWeight: 700, color: '#1B1F3B', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  popupTitle: { fontSize: 13, color: '#444', lineHeight: 1.4 },
  popupLink: { fontSize: 13, color: '#4ECDC4', fontWeight: 600, marginTop: 4 },
}
