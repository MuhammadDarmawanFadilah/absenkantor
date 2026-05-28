'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, MapPin, Globe, Navigation, Target, Info, CheckCircle, Loader2 } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { getApiUrl } from "@/lib/config"
import dynamic from 'next/dynamic'

// Dynamically import map component to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

interface LokasiResponse {
  id: number
  namaLokasi: string
  alamat?: string
  latitude?: string
  longitude?: string
  radius?: string
  isActive: boolean
}

export default function EditLokasiKantorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)

  const [formData, setFormData] = useState({
    namaLokasi: '',
    alamat: '',
    latKantor: '',
    longKantor: '',
    radius: '100',
    isActive: true
  })

  // Default center (Indonesia - Central Java)
  const defaultCenter: [number, number] = [-2.5489, 118.0149]
  const mapCenter: [number, number] = formData.latKantor && formData.longKantor 
    ? [parseFloat(formData.latKantor), parseFloat(formData.longKantor)]
    : defaultCenter

  const markerPosition: [number, number] | undefined = formData.latKantor && formData.longKantor
    ? [parseFloat(formData.latKantor), parseFloat(formData.longKantor)]
    : undefined

  const radiusValue = parseInt(formData.radius) || 0

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
        setFormData({
          namaLokasi: data.namaLokasi,
          alamat: data.alamat || '',
          latKantor: data.latitude || '',
          longKantor: data.longitude || '',
          radius: data.radius || '100',
          isActive: data.isActive
        })
      } else {
        showErrorToast('Gagal memuat data lokasi kantor')
        router.push('/admin/master-data/lokasi-kantor')
      }
    } catch (error) {
      showErrorToast('Terjadi kesalahan saat memuat data')
      router.push('/admin/master-data/lokasi-kantor')
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMapLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latKantor: lat.toString(),
      longKantor: lng.toString()
    }))
    showSuccessToast('Lokasi berhasil dipilih dari peta!')
  }

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setGettingLocation(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latKantor: position.coords.latitude.toString(),
            longKantor: position.coords.longitude.toString()
          }))
          showSuccessToast('Lokasi saat ini berhasil diambil!')
          setGettingLocation(false)
        },
        (error) => {
          showErrorToast('Gagal mengambil lokasi: ' + error.message)
          setGettingLocation(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } else {
      showErrorToast('Geolocation tidak didukung oleh browser')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.namaLokasi || !formData.latKantor || !formData.longKantor || !formData.radius) {
      showErrorToast('Nama lokasi, koordinat, dan radius wajib diisi')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(getApiUrl(`/admin/master-data/lokasi/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          namaLokasi: formData.namaLokasi,
          alamat: formData.alamat,
          latitude: formData.latKantor,
          longitude: formData.longKantor,
          radius: formData.radius,
          isActive: formData.isActive
        })
      })

      if (response.ok) {
        showSuccessToast('Lokasi kantor berhasil diperbarui')
        router.push('/admin/master-data/lokasi-kantor')
      } else {
        const error = await response.text()
        showErrorToast(`Gagal memperbarui lokasi kantor: ${error}`)
      }
    } catch (error) {
      showErrorToast('Terjadi kesalahan saat memperbarui lokasi kantor')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Memuat data lokasi...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Edit Lokasi Kantor"
        description="Perbarui informasi lokasi kantor dengan bantuan peta interaktif"
        icon={MapPin}
      />
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Form Edit Lokasi Kantor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="namaLokasi">Nama Lokasi *</Label>
                  <Input
                    id="namaLokasi"
                    type="text"
                    placeholder="Masukkan nama lokasi"
                    value={formData.namaLokasi}
                    onChange={(e) => handleInputChange('namaLokasi', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="alamat">Alamat</Label>
                  <Input
                    id="alamat"
                    type="text"
                    placeholder="Masukkan alamat lengkap"
                    value={formData.alamat}
                    onChange={(e) => handleInputChange('alamat', e.target.value)}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Koordinat Lokasi</Label>
                  
                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Klik pada peta di sebelah kanan untuk memilih lokasi, atau gunakan tombol di bawah untuk menggunakan lokasi saat ini.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latKantor">Latitude *</Label>
                      <Input
                        id="latKantor"
                        type="number"
                        step="any"
                        placeholder="Contoh: -6.2000"
                        value={formData.latKantor}
                        onChange={(e) => handleInputChange('latKantor', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="longKantor">Longitude *</Label>
                      <Input
                        id="longKantor"
                        type="number"
                        step="any"
                        placeholder="Contoh: 106.8000"
                        value={formData.longKantor}
                        onChange={(e) => handleInputChange('longKantor', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {formData.latKantor && formData.longKantor && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        Koordinat telah dipilih: {parseFloat(formData.latKantor).toFixed(6)}, {parseFloat(formData.longKantor).toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="radius">Radius (Meter) *</Label>
                  <Input
                    id="radius"
                    type="number"
                    placeholder="Masukkan radius dalam meter"
                    value={formData.radius}
                    onChange={(e) => handleInputChange('radius', e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Radius area kerja dalam meter (contoh: 100 untuk radius 100 meter)
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="isActive" className="text-sm font-medium">Status Lokasi</Label>
                    <p className="text-xs text-gray-500">
                      {formData.isActive ? 'Lokasi aktif dan dapat digunakan' : 'Lokasi non-aktif'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    />
                    <Badge variant={formData.isActive ? 'default' : 'secondary'}>
                      {formData.isActive ? 'Aktif' : 'Non-aktif'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Map Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Peta Lokasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mounted && (
                <MapComponent
                  center={mapCenter}
                  onLocationSelect={handleMapLocationSelect}
                  marker={markerPosition}
                  radius={radiusValue}
                />
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={handleGetCurrentLocation}
                disabled={gettingLocation}
                className="w-full flex items-center gap-2"
              >
                <Navigation className="h-4 w-4" />
                {gettingLocation ? 'Mengambil Lokasi...' : 'Gunakan Lokasi Saat Ini'}
              </Button>

              {markerPosition && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-2">Informasi Lokasi:</p>
                  <div className="space-y-1 text-xs text-blue-700">
                    <div>📍 Latitude: {parseFloat(formData.latKantor).toFixed(6)}</div>
                    <div>📍 Longitude: {parseFloat(formData.longKantor).toFixed(6)}</div>
                    <div>📐 Radius: {formData.radius} meter</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
