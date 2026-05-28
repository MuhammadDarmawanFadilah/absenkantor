'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, MapPin, Globe, Calendar, Loader2, Edit, Target, Navigation } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { showErrorToast } from "@/components/ui/toast-utils"
import { getApiUrl } from "@/lib/config"
import dynamic from 'next/dynamic'

// Dynamically import map component to avoid SSR issues
const MapComponent = dynamic(() => import('./edit/MapComponent'), { ssr: false })

interface LokasiResponse {
  id: number
  namaLokasi: string
  alamat?: string
  latitude?: string
  longitude?: string
  radius?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function DetailLokasiKantorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [lokasi, setLokasi] = useState<LokasiResponse | null>(null)

  // Default center (Indonesia - Central Java)
  const defaultCenter: [number, number] = [-2.5489, 118.0149]
  const mapCenter: [number, number] = lokasi?.latitude && lokasi?.longitude 
    ? [parseFloat(lokasi.latitude), parseFloat(lokasi.longitude)]
    : defaultCenter

  const markerPosition: [number, number] | undefined = lokasi?.latitude && lokasi?.longitude
    ? [parseFloat(lokasi.latitude), parseFloat(lokasi.longitude)]
    : undefined

  const radiusValue = lokasi?.radius ? parseInt(lokasi.radius) : 0

  useEffect(() => {
    setMounted(true)
    if (id) {
      fetchLokasiData()
    }
  }, [id])

  const fetchLokasiData = async () => {
    try {
      const response = await fetch(getApiUrl(`/admin/master-data/lokasi/${id}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data: LokasiResponse = await response.json()
        setLokasi(data)
      } else {
        showErrorToast('Gagal memuat data lokasi kantor')
        router.push('/admin/master-data/lokasi-kantor')
      }
    } catch (error) {
      showErrorToast('Terjadi kesalahan saat memuat data')
      router.push('/admin/master-data/lokasi-kantor')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openGoogleMaps = () => {
    if (lokasi?.latitude && lokasi?.longitude) {
      const url = `https://www.google.com/maps?q=${lokasi.latitude},${lokasi.longitude}`
      window.open(url, '_blank')
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Memuat data lokasi...</span>
      </div>
    )
  }

  if (!lokasi) {
    return (
      <div className="text-center">
        <p>Data lokasi kantor tidak ditemukan</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Detail: ${lokasi.namaLokasi}`}
        description="Informasi lengkap lokasi kantor dengan visualisasi peta"
        icon={MapPin}
      />
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Information Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Informasi Lokasi Kantor
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/master-data/lokasi-kantor/${id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Nama Lokasi</h3>
                <p className="text-lg font-semibold">{lokasi.namaLokasi}</p>
              </div>

              {lokasi.alamat && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Alamat</h3>
                  <p className="text-base">{lokasi.alamat}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <Badge variant={lokasi.isActive ? "default" : "secondary"} className="mt-1">
                  {lokasi.isActive ? "✅ Aktif" : "❌ Tidak Aktif"}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Radius Kerja</h3>
                <p className="text-lg">{lokasi.radius ? `${lokasi.radius} meter` : 'Tidak diset'}</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Koordinat GPS</h3>
                {lokasi.latitude && lokasi.longitude ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Latitude</p>
                        <p className="text-sm font-mono">{parseFloat(lokasi.latitude).toFixed(6)}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Longitude</p>
                        <p className="text-sm font-mono">{parseFloat(lokasi.longitude).toFixed(6)}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openGoogleMaps}
                      className="w-full flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      Buka di Google Maps
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Koordinat tidak tersedia</p>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Tanggal Dibuat
                  </h3>
                  <p className="text-sm">{formatDate(lokasi.createdAt)}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Terakhir Diperbarui
                  </h3>
                  <p className="text-sm">{formatDate(lokasi.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Map Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Lokasi di Peta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mounted && (
                <MapComponent
                  center={mapCenter}
                  onLocationSelect={() => {}} // Read-only for detail view
                  marker={markerPosition}
                  radius={radiusValue}
                />
              )}
              
              {markerPosition ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Navigation className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-blue-800 font-medium">Informasi Lokasi</p>
                  </div>
                  <div className="space-y-2 text-xs text-blue-700">
                    <div className="flex justify-between">
                      <span>📍 Latitude:</span>
                      <span className="font-mono">{parseFloat(lokasi.latitude!).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📍 Longitude:</span>
                      <span className="font-mono">{parseFloat(lokasi.longitude!).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📐 Radius Kerja:</span>
                      <span>{lokasi.radius} meter</span>
                    </div>
                    <div className="flex justify-between">
                      <span>✅ Status:</span>
                      <span>{lokasi.isActive ? 'Aktif' : 'Non-aktif'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Koordinat lokasi belum diset</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
