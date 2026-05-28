'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapComponentProps {
  center: [number, number]
  onLocationSelect: (lat: number, lng: number) => void
  marker?: [number, number]
  radius?: number
}

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function FitBounds({ center, radius, hasMarker }: { center: [number, number], radius?: number, hasMarker: boolean }) {
  const map = useMap()
  
  useEffect(() => {
    if (hasMarker) {
      if (radius && radius > 0) {
        const bounds = L.latLng(center).toBounds(radius * 2)
        map.fitBounds(bounds, { padding: [20, 20] })
      } else {
        map.setView(center, 15)
      }
    } else {
      // Show Indonesia overview
      map.setView(center, 5)
    }
  }, [map, center, radius, hasMarker])
  
  return null
}

export default function MapComponent({ center, onLocationSelect, marker, radius }: MapComponentProps) {
  const mapRef = useRef<any>(null)
  const hasMarker = !!marker

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <style jsx global>{`
        .leaflet-control-attribution {
          display: none !important;
        }
      `}</style>
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={hasMarker ? 15 : 5}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        attributionControl={false}
      >
        <TileLayer
          attribution=''
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEvents onLocationSelect={onLocationSelect} />
        <FitBounds center={center} radius={radius} hasMarker={hasMarker} />
        
        {marker && (
          <>
            <Marker position={marker} />
            {radius && radius > 0 && (
              <Circle
                center={marker}
                radius={radius}
                pathOptions={{
                  color: '#3b82f6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: '5, 5'
                }}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  )
}
