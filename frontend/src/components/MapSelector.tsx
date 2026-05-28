'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, X, Locate, Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface MapSelectorProps {
  onLocationSelect: (lat: number, lng: number) => void
  onClose: () => void
  initialLocation?: { lat: number, lng: number }
}

export function MapSelector({ onLocationSelect, onClose, initialLocation }: MapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number, address?: string} | null>(
    initialLocation ? { ...initialLocation, address: 'Lokasi sebelumnya' } : null
  )
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [markerInstance, setMarkerInstance] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && mapRef.current) {
      loadLeafletAndInitMap()
    }
    
    return () => {
      if (mapInstance) {
        mapInstance.remove()
      }
    }
  }, [])

  const loadLeafletAndInitMap = async () => {
    try {
      // Dynamically import Leaflet
      const L = (await import('leaflet')).default
      
      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      const initialLat = initialLocation?.lat || -6.2088
      const initialLng = initialLocation?.lng || 106.8456

      // Initialize map
      const map = L.map(mapRef.current!).setView([initialLat, initialLng], 13)
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      // Custom marker icon
      const customIcon = L.divIcon({
        html: `<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                   <circle cx="12" cy="12" r="3"/>
                 </svg>
               </div>`,
        className: 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })

      let marker: any = null

      // Add initial marker if location provided
      if (initialLocation) {
        marker = L.marker([initialLocation.lat, initialLocation.lng], { icon: customIcon }).addTo(map)
        setMarkerInstance(marker)
      }

      // Handle map clicks
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        
        // Remove existing marker
        if (marker) {
          map.removeLayer(marker)
        }
        
        // Add new marker
        marker = L.marker([lat, lng], { icon: customIcon }).addTo(map)
        setMarkerInstance(marker)
        
        // Update selected location
        setSelectedLocation({
          lat: lat,
          lng: lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        })

        // Reverse geocoding (optional - for demo we'll use coordinates)
        reverseGeocode(lat, lng)
      })

      setMapInstance(map)

    } catch (error) {
      console.error('Error loading map:', error)
      initializeFallbackMap()
    }
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Using Nominatim for reverse geocoding (free service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      
      if (response.ok) {
        const data = await response.json()
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        
        setSelectedLocation(prev => prev ? { ...prev, address } : null)
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
    }
  }

  const initializeFallbackMap = () => {
    // Fallback map interface if Leaflet fails to load
    if (mapRef.current) {
      mapRef.current.style.background = `
        linear-gradient(45deg, #e5f3ff 25%, transparent 25%), 
        linear-gradient(-45deg, #e5f3ff 25%, transparent 25%), 
        linear-gradient(45deg, transparent 75%, #e5f3ff 75%), 
        linear-gradient(-45deg, transparent 75%, #e5f3ff 75%)
      `
      mapRef.current.style.backgroundSize = '20px 20px'
      mapRef.current.style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px'
      
      mapRef.current.innerHTML = `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
          <div style="color: #6b7280; margin-bottom: 12px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 12px;">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px; color: #1f2937;">Pilih Lokasi</div>
          <div style="color: #6b7280; font-size: 14px; margin-bottom: 20px; line-height: 1.5;">
            Peta interaktif akan memuat dalam beberapa saat.<br>
            Atau gunakan koordinat manual di bawah.
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 16px;">
            <input id="lat-input" type="number" placeholder="Latitude" step="any" style="flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
            <input id="lng-input" type="number" placeholder="Longitude" step="any" style="flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
          </div>
          <button id="select-manual-location" style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
            Gunakan Koordinat
          </button>
        </div>
      `
      
      const selectButton = mapRef.current.querySelector('#select-manual-location')
      const latInput = mapRef.current.querySelector('#lat-input') as HTMLInputElement
      const lngInput = mapRef.current.querySelector('#lng-input') as HTMLInputElement
      
      // Set initial values if provided
      if (initialLocation) {
        latInput.value = initialLocation.lat.toString()
        lngInput.value = initialLocation.lng.toString()
      } else {
        latInput.value = '-6.2088'
        lngInput.value = '106.8456'
      }
      
      if (selectButton) {
        selectButton.addEventListener('click', () => {
          const lat = parseFloat(latInput.value)
          const lng = parseFloat(lngInput.value)
          
          if (!isNaN(lat) && !isNaN(lng)) {
            setSelectedLocation({
              lat,
              lng,
              address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
            })
          }
        })
      }
    }
  }

  const searchLocation = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      // Using Nominatim for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=id`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat)
          const lng = parseFloat(data[0].lon)
          
          setSelectedLocation({
            lat,
            lng,
            address: data[0].display_name
          })
          
          // Update map view and marker if map is loaded
          if (mapInstance && markerInstance) {
            mapInstance.setView([lat, lng], 15)
            
            // Remove existing marker
            mapInstance.removeLayer(markerInstance)
            
            // Add new marker
            const L = await import('leaflet')
            const customIcon = L.default.divIcon({
              html: `<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                         <circle cx="12" cy="12" r="3"/>
                       </svg>
                     </div>`,
              className: 'custom-marker',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
            
            const newMarker = L.default.marker([lat, lng], { icon: customIcon }).addTo(mapInstance)
            setMarkerInstance(newMarker)
          }
        }
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          
          setSelectedLocation({
            lat,
            lng,
            address: 'Lokasi saat ini'
          })
          
          // Update map if available
          if (mapInstance) {
            mapInstance.setView([lat, lng], 15)
          }
          
          setLoading(false)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setLoading(false)
        }
      )
    }
  }

  const handleConfirmSelection = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation.lat, selectedLocation.lng)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Pilih Lokasi di Peta
            </CardTitle>
            <CardDescription>
              Klik pada peta atau cari alamat untuk memilih koordinat yang tepat
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Controls */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium mb-1 block">
                Cari Alamat
              </Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Masukkan nama tempat atau alamat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                />
                <Button 
                  onClick={searchLocation} 
                  disabled={loading || !searchQuery.trim()}
                  size="sm"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block opacity-0">
                GPS
              </Label>
              <Button 
                variant="outline"
                onClick={getCurrentLocation}
                disabled={loading}
                size="sm"
                className="flex items-center gap-1"
              >
                <Locate className="h-4 w-4" />
                Lokasi Saya
              </Button>
            </div>
          </div>

          {/* Map Container */}
          <div 
            ref={mapRef}
            className="w-full h-96 bg-gray-100 rounded-lg border relative overflow-hidden"
            style={{ minHeight: '384px' }}
          >
            {/* Map will be initialized here */}
          </div>
          
          {/* Selected Location Info */}
          {selectedLocation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Lokasi Terpilih</span>
              </div>
              <div className="text-sm text-green-600 mb-1">
                {selectedLocation.address}
              </div>
              <div className="text-xs text-green-600">
                Koordinat: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-2">
            <div className="text-sm text-muted-foreground">
              {selectedLocation ? (
                <span className="text-green-600">
                  ✓ Siap untuk dikonfirmasi
                </span>
              ) : (
                "Pilih lokasi dengan mengklik pada peta atau menggunakan pencarian"
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button 
                onClick={handleConfirmSelection}
                disabled={!selectedLocation || loading}
              >
                {loading ? "Memproses..." : "Konfirmasi Lokasi"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
