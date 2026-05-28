'use client'

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useLeaflet } from '@/hooks/useLeaflet'
import { showErrorToast, showSuccessToast } from '@/components/ui/toast-utils'
import { config } from '@/lib/config'

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })

interface LocationMapMobileProps {
  showLocationMap: boolean
  setShowLocationMap: (show: boolean) => void
  currentLocation: { lat: number; lng: number } | null
  selectedShift: any
  pegawaiLokasi: any
  pegawaiData: any
  distance: number | null
  distanceToHome: number | null
  isLocationAllowed: boolean
  onRequestLocation?: () => void
}

export default function LocationMapMobile({
  showLocationMap,
  setShowLocationMap,
  currentLocation,
  selectedShift,
  pegawaiLokasi,
  pegawaiData,
  distance,
  distanceToHome,
  isLocationAllowed,
  onRequestLocation
}: LocationMapMobileProps) {
  const { isLoaded, isLoading, createCustomIcon } = useLeaflet()

  const handleMapButtonClick = () => {
    if (!currentLocation) {
      // Request location through parent component
      if (onRequestLocation) {
        onRequestLocation()
      } else {
        showErrorToast('📍 GPS belum aktif. Nyalakan GPS terlebih dahulu.')
      }
      return
    }
    
    // Always allow viewing the map for informational purposes
    // The location restriction should not prevent viewing the map
    setShowLocationMap(true)
  }

  return (
    <Dialog open={showLocationMap} onOpenChange={setShowLocationMap}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={handleMapButtonClick}
        >
          <Eye className="w-3 h-3 mr-1" />
          Lihat Lokasi
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="p-0 overflow-hidden bg-background border-0 shadow-2xl"
        style={{ 
          width: '98vw', 
          maxWidth: '98vw', 
          height: '96vh', 
          maxHeight: '96vh',
          minWidth: '98vw'
        }}
      >
        <DialogTitle style={{ 
          position: 'absolute', 
          left: '-10000px', 
          top: 'auto', 
          width: '1px', 
          height: '1px', 
          overflow: 'hidden' 
        }}>
          Peta Lokasi Pegawai
        </DialogTitle>
        <div className="relative w-full h-full flex flex-col bg-background" style={{ width: '100%', height: '100%' }}>
          {/* Header */}
          <div className="flex-shrink-0 bg-background border-b border-border p-2 z-20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Peta Lokasi</h3>
                {selectedShift?.lockLokasi !== 'HARUS_DI_KANTOR' && (
                  <p className="text-xs text-muted-foreground">
                    Fleksibel
                  </p>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowLocationMap(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                ✕
              </Button>
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative">
            {currentLocation && isLoaded ? (
              <MapContainer
                center={[currentLocation.lat, currentLocation.lng]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution=""
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Current location marker */}
                <Marker
                  position={[currentLocation.lat, currentLocation.lng]}
                  icon={createCustomIcon(
                    pegawaiData?.photoUrl ? 
                      `<img src="${pegawaiData.photoUrl.startsWith('http') ? pegawaiData.photoUrl : `${config.backendUrl}/api/upload/photos/${pegawaiData.photoUrl}`}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid #3b82f6;" />` :
                      '�', 
                    36, 
                    '#3b82f6'
                  )}
                >
                  <Popup>
                    <div className="p-2 min-w-[180px] bg-background border border-border rounded-lg">
                      <h4 className="font-semibold text-primary text-sm mb-1">
                        📍 Lokasi Pegawai
                      </h4>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="grid grid-cols-2 gap-1 text-xs bg-muted p-1 rounded">
                          <div>Lat: {currentLocation.lat.toFixed(4)}</div>
                          <div>Lng: {currentLocation.lng.toFixed(4)}</div>
                        </div>
                        {selectedShift?.lockLokasi === 'HARUS_DI_KANTOR' && distance !== null && (
                          <div className="mt-1 pt-1 border-t border-border">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-foreground">Jarak:</span>
                              <span className="font-bold text-foreground">{Math.round(distance)}m</span>
                            </div>
                            <div className={`text-center mt-1 p-1 rounded text-xs ${
                              distance <= (pegawaiLokasi?.radius || 100) 
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            }`}>
                              {distance <= (pegawaiLokasi?.radius || 100) ? '✅ Dalam radius' : '❌ Di luar radius'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {/* Office location marker and radius */}
                {selectedShift?.lockLokasi === 'HARUS_DI_KANTOR' && pegawaiLokasi && 
                 pegawaiLokasi.latitude && pegawaiLokasi.longitude && (
                  <>
                    <Circle
                      center={[parseFloat(pegawaiLokasi.latitude), parseFloat(pegawaiLokasi.longitude)]}
                      radius={parseFloat(pegawaiLokasi.radius) || 100}
                      pathOptions={{
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.15,
                        weight: 2,
                        dashArray: '5, 5'
                      }}
                    />
                    <Marker
                      position={[parseFloat(pegawaiLokasi.latitude), parseFloat(pegawaiLokasi.longitude)]}
                      icon={createCustomIcon('🏢', 40, '#ef4444')}
                    >
                      <Popup>
                        <div className="p-2 min-w-[200px] bg-background border border-border rounded-lg">
                          <h4 className="font-semibold text-destructive text-sm mb-1">
                            🏢 {pegawaiLokasi.namaLokasi}
                          </h4>
                          <div className="space-y-1">
                            <div className="bg-primary/10 p-1 rounded border border-primary/20">
                              <div className="text-xs font-medium text-primary mb-1">Radius</div>
                              <div className="text-lg font-bold text-primary">{parseFloat(pegawaiLokasi.radius) || 100}m</div>
                            </div>
                            {distance !== null && (
                              <div className={`p-1 rounded border ${
                                distance <= (parseFloat(pegawaiLokasi.radius) || 100) 
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              }`}>
                                <div className={`text-xs font-medium ${
                                  distance <= (parseFloat(pegawaiLokasi.radius) || 100) 
                                    ? 'text-green-900 dark:text-green-100' 
                                    : 'text-red-900 dark:text-red-100'
                                }`}>
                                  Jarak: {Math.round(distance)}m
                                </div>
                                <div className={`text-xs ${
                                  distance <= (parseFloat(pegawaiLokasi.radius) || 100) 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {distance <= (parseFloat(pegawaiLokasi.radius) || 100) 
                                    ? '✅ Dapat absen' 
                                    : '❌ Tidak dapat absen'
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}

                {/* Home location marker */}
                {(selectedShift?.lockLokasi !== 'HARUS_DI_KANTOR' || !pegawaiLokasi) && 
                 pegawaiData?.latitude && pegawaiData?.longitude && (
                  <Marker
                    position={[pegawaiData.latitude, pegawaiData.longitude]}
                    icon={createCustomIcon('🏠', 36, '#22c55e')}
                  >
                    <Popup>
                      <div className="p-1 min-w-[150px] bg-background border border-border rounded-lg">
                        <h4 className="font-semibold text-green-600 dark:text-green-400 text-sm mb-1">
                          🏠 Rumah
                        </h4>
                        <div className="text-xs text-muted-foreground">
                          {distanceToHome !== null && (
                            <div className="flex justify-between bg-muted p-1 rounded">
                              <span>Jarak:</span>
                              <span className="font-bold text-foreground">{Math.round(distanceToHome)}m</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-full bg-muted/20">
                <div className="text-center">
                  <div className="text-3xl mb-3">📍</div>
                  <div className="text-sm text-muted-foreground">
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                        Memuat peta...
                      </div>
                    ) : !currentLocation ? (
                      'Memuat lokasi...'
                    ) : (
                      'Memuat peta...'
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Legend */}
          <div className="flex-shrink-0 bg-background border-t border-border p-2">
            <div className="space-y-1">
              <h4 className="font-medium text-foreground text-xs">Legenda</h4>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-primary rounded-full shadow-sm animate-pulse" />
                  <span className="text-xs font-medium text-foreground">Pegawai</span>
                </div>
                
                {/* Show office if it exists and shift requires it */}
                {selectedShift?.lockLokasi === 'HARUS_DI_KANTOR' && pegawaiLokasi && 
                 pegawaiLokasi.latitude && pegawaiLokasi.longitude && (
                  <>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-destructive rounded-full shadow-sm flex items-center justify-center text-white text-xs">🏢</div>
                      <span className="text-xs font-medium text-foreground">Kantor</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 border border-primary border-dashed rounded-full bg-primary/20" />
                      <span className="text-xs font-medium text-foreground">Radius</span>
                    </div>
                  </>
                )}
                
                {/* Show home if shift is flexible and pegawai has home coordinates */}
                {selectedShift?.lockLokasi !== 'HARUS_DI_KANTOR' && pegawaiData?.latitude && pegawaiData?.longitude && (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm flex items-center justify-center text-white text-xs">🏠</div>
                    <span className="text-xs font-medium text-foreground">Rumah</span>
                  </div>
                )}
                
                {/* Show flexible badge if not office required */}
                {selectedShift?.lockLokasi !== 'HARUS_DI_KANTOR' && (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-400 rounded" />
                    <span className="text-xs font-medium text-foreground">Fleksibel</span>
                  </div>
                )}
              </div>
              
              {selectedShift?.lockLokasi === 'HARUS_DI_KANTOR' && distance !== null && (
                <div className="pt-1 border-t border-border">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    distance <= (parseFloat(pegawaiLokasi?.radius) || 100) 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                      : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}>
                    {distance <= (parseFloat(pegawaiLokasi?.radius) || 100) 
                      ? `✅ Valid (${Math.round(distance)}m)` 
                      : `❌ Terlalu jauh (${Math.round(distance)}m)`
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
