'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, MapPin, Globe, Navigation, Target, Info, CheckCircle } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { getApiUrl } from "@/lib/config"
import dynamic from 'next/dynamic'

// Dynamically import map component to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

export default function TambahLokasiKantorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)

  const [formData, setFormData] = useState({
    namaLokasi: '',
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

  useEffect(() => {
    setMounted(true)
  }, [])

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
    showSuccessToast('Lokasi dipilih dari peta!')
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
          showSuccessToast('Lokasi berhasil diambil!')
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
      showErrorToast('Semua field wajib diisi')
      return
    }

    const radiusNum = parseInt(formData.radius)
    if (radiusNum <= 0 || radiusNum > 10000) {
      showErrorToast('Radius harus antara 1-10000 meter')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(getApiUrl('/admin/master-data/lokasi'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          namaLokasi: formData.namaLokasi,
          latitude: formData.latKantor,
          longitude: formData.longKantor,
          radius: formData.radius,
          isActive: formData.isActive
        })
      })

      if (response.ok) {
        showSuccessToast('Lokasi kantor berhasil ditambahkan')
        router.push('/admin/master-data/lokasi-kantor')
      } else {
        const error = await response.text()
        showErrorToast(`Gagal menambahkan lokasi kantor: ${error}`)
      }
    } catch (error) {
      showErrorToast('Terjadi kesalahan saat menambahkan lokasi kantor')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <AdminPageHeader
          title="Tambah Lokasi Kantor"
          description="Kelola lokasi kantor dengan sistem koordinat dan radius area yang akurat"
          icon={MapPin}
        />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Form Section - Occupies 1 column */}
          <div className="xl:col-span-1">
            <Card className="h-fit shadow-sm border-0 bg-white">
              <CardHeader className="pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" />
                  Informasi Lokasi
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Isi data lokasi kantor dengan lengkap
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Nama Lokasi */}
                  <div className="space-y-2">
                    <Label htmlFor="namaLokasi" className="text-sm font-semibold text-gray-700">
                      Nama Lokasi *
                    </Label>
                    <Input
                      id="namaLokasi"
                      type="text"
                      placeholder="Contoh: Kantor Pusat Jakarta"
                      value={formData.namaLokasi}
                      onChange={(e) => handleInputChange('namaLokasi', e.target.value)}
                      className="h-11 border-gray-200 focus:border-primary focus:ring-primary"
                      required
                    />
                  </div>

                  <Separator className="my-6" />

                  {/* Koordinat Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Navigation className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">Koordinat Lokasi</Label>
                        <p className="text-xs text-muted-foreground">Tentukan posisi geografis kantor</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="latKantor" className="text-sm font-medium text-gray-600">
                          Latitude *
                        </Label>
                        <Input
                          id="latKantor"
                          type="number"
                          step="any"
                          placeholder="-6.2088"
                          value={formData.latKantor}
                          onChange={(e) => handleInputChange('latKantor', e.target.value)}
                          className="h-10 border-gray-200 focus:border-primary font-mono text-sm"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="longKantor" className="text-sm font-medium text-gray-600">
                          Longitude *
                        </Label>
                        <Input
                          id="longKantor"
                          type="number"
                          step="any"
                          placeholder="106.8456"
                          value={formData.longKantor}
                          onChange={(e) => handleInputChange('longKantor', e.target.value)}
                          className="h-10 border-gray-200 focus:border-primary font-mono text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Radius Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-orange-100 rounded-lg">
                        <Target className="h-3.5 w-3.5 text-orange-600" />
                      </div>
                      <Label htmlFor="radius" className="text-sm font-semibold text-gray-700">
                        Radius Area (Meter) *
                      </Label>
                    </div>
                    <Input
                      id="radius"
                      type="number"
                      min="1"
                      max="10000"
                      placeholder="100"
                      value={formData.radius}
                      onChange={(e) => handleInputChange('radius', e.target.value)}
                      className="h-11 border-gray-200 focus:border-primary"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Jangkauan area kerja dalam meter (1-10000)
                    </p>
                  </div>

                  <Separator className="my-6" />

                  {/* Status Section */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <Label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
                          Status Aktif
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Aktifkan lokasi untuk digunakan sistem
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={loading}
                      className="flex-1 h-11 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Kembali
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || gettingLocation}
                      className="flex-1 h-11 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
                    >
                      <Save className="h-4 w-4" />
                      {loading ? 'Menyimpan...' : 'Simpan Lokasi'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Map Section - Occupies 2 columns */}
          <div className="xl:col-span-2">
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader className="pb-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      Peta Lokasi Indonesia
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pilih lokasi dengan mengklik pada peta atau masukkan koordinat manual
                    </p>
                  </div>
                  {markerPosition && (
                    <div className="flex flex-col gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1 font-mono text-xs">
                        <Navigation className="h-3 w-3" />
                        {parseFloat(formData.latKantor).toFixed(6)}, {parseFloat(formData.longKantor).toFixed(6)}
                      </Badge>
                      {formData.radius && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Radius: {formData.radius}m
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50/50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-800">
                      <strong>Petunjuk:</strong> Klik pada peta untuk memilih lokasi kantor. Area biru menunjukkan radius jangkauan yang telah ditentukan.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="relative">
                    <MapComponent
                      center={mapCenter}
                      onLocationSelect={handleMapLocationSelect}
                      marker={markerPosition}
                      radius={formData.radius ? parseInt(formData.radius) : undefined}
                    />
                  </div>
                  
                  {/* Current Location Button Below Map */}
                  <div className="flex justify-center pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGetCurrentLocation}
                      disabled={gettingLocation || loading}
                      className="flex items-center gap-2 h-11 px-6 border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
                    >
                      <Globe className="h-4 w-4" />
                      {gettingLocation ? 'Mengambil Lokasi...' : 'Gunakan Lokasi Saat Ini'}
                    </Button>
                  </div>
                  
                  {markerPosition && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Navigation className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-blue-800 text-sm">Koordinat</span>
                        </div>
                        <div className="font-mono text-xs text-blue-700">
                          Lat: {parseFloat(formData.latKantor).toFixed(6)}
                        </div>
                        <div className="font-mono text-xs text-blue-700">
                          Lng: {parseFloat(formData.longKantor).toFixed(6)}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-orange-600" />
                          <span className="font-semibold text-orange-800 text-sm">Area Radius</span>
                        </div>
                        <div className="font-mono text-lg font-bold text-orange-700">
                          {formData.radius || '0'} meter
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-800 text-sm">Status</span>
                        </div>
                        <div className="text-sm font-medium text-green-700">
                          {formData.isActive ? 'Aktif' : 'Tidak Aktif'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
