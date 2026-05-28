'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { TimeInput } from "@/components/ui/time-input"
import { ArrowLeft, Save, Clock, Loader2, CheckCircle, MapPin, Globe } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { getApiUrl } from "@/lib/config"

interface ShiftResponse {
  id: number
  namaShift: string
  jamMasuk: string
  jamKeluar: string
  deskripsi?: string
  lockLokasi: 'HARUS_DI_KANTOR' | 'DIMANA_SAJA'
  lockLokasiDisplayName?: string
  isActive: boolean
}

export default function EditShiftPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [mounted, setMounted] = useState(false)

  const [formData, setFormData] = useState({
    namaShift: '',
    jamMasuk: '',
    jamKeluar: '',
    deskripsi: '',
    lockLokasi: 'DIMANA_SAJA' as 'HARUS_DI_KANTOR' | 'DIMANA_SAJA',
    isActive: true
  })

  useEffect(() => {
    setMounted(true)
    if (id) {
      fetchShiftData()
    }
  }, [id])

  const fetchShiftData = async () => {
    try {
      const response = await fetch(getApiUrl(`api/admin/master-data/shift/${id}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data: ShiftResponse = await response.json()
        setFormData({
          namaShift: data.namaShift,
          jamMasuk: data.jamMasuk,
          jamKeluar: data.jamKeluar,
          deskripsi: data.deskripsi || '',
          lockLokasi: data.lockLokasi || 'DIMANA_SAJA',
          isActive: data.isActive
        })
      } else {
        showErrorToast('Gagal memuat data shift')
        router.push('/admin/master-data/shift')
      }
    } catch (error) {
      showErrorToast('Terjadi kesalahan saat memuat data')
      router.push('/admin/master-data/shift')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.namaShift || !formData.jamMasuk || !formData.jamKeluar || !formData.lockLokasi) {
      showErrorToast('Nama shift, jam masuk, jam keluar, dan lock lokasi wajib diisi')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(getApiUrl(`api/admin/master-data/shift/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          namaShift: formData.namaShift,
          jamMasuk: formData.jamMasuk,
          jamKeluar: formData.jamKeluar,
          deskripsi: formData.deskripsi,
          lockLokasi: formData.lockLokasi,
          isActive: formData.isActive
        })
      })

      if (response.ok) {
        showSuccessToast('Shift berhasil diperbarui')
        router.push('/admin/master-data/shift')
      } else {
        const error = await response.text()
        showErrorToast(`Gagal memperbarui shift: ${error}`)
      }
    } catch (error) {
      showErrorToast('Terjadi kesalahan saat memperbarui shift')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Edit Shift"
        description="Perbarui informasi shift kerja"
        icon={Clock}
      />
      
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Form Edit Shift Kerja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <h3 className="text-lg font-medium">Informasi Dasar</h3>
                  </div>
                  
                  <div>
                    <Label htmlFor="namaShift">Nama Shift *</Label>
                    <Input
                      id="namaShift"
                      type="text"
                      placeholder="Contoh: Shift Pagi, Shift Sore, dll."
                      value={formData.namaShift}
                      onChange={(e) => handleInputChange('namaShift', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deskripsi">Deskripsi Shift</Label>
                    <Textarea
                      id="deskripsi"
                      placeholder="Deskripsi detail tentang shift ini..."
                      value={formData.deskripsi}
                      onChange={(e) => handleInputChange('deskripsi', e.target.value)}
                      rows={3}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Opsional: Jelaskan detail shift, tugas, atau catatan khusus
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Time Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-green-600" />
                    <h3 className="text-lg font-medium">Konfigurasi Waktu</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="jamMasuk" className="flex items-center gap-2 text-sm font-medium">
                        <span>Jam Masuk *</span>
                        <Badge variant="outline" className="text-xs">WIB</Badge>
                      </Label>
                      <TimeInput
                        id="jamMasuk"
                        value={formData.jamMasuk}
                        onChange={(value) => handleInputChange('jamMasuk', value)}
                        placeholder="Pilih jam masuk"
                        required
                        className="w-full"
                      />
                      {formData.jamMasuk && (
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                          <CheckCircle className="h-3 w-3" />
                          Jam masuk: {formData.jamMasuk} WIB
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="jamKeluar" className="flex items-center gap-2 text-sm font-medium">
                        <span>Jam Keluar *</span>
                        <Badge variant="outline" className="text-xs">WIB</Badge>
                      </Label>
                      <TimeInput
                        id="jamKeluar"
                        value={formData.jamKeluar}
                        onChange={(value) => handleInputChange('jamKeluar', value)}
                        placeholder="Pilih jam keluar"
                        required
                        className="w-full"
                      />
                      {formData.jamKeluar && (
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                          <CheckCircle className="h-3 w-3" />
                          Jam keluar: {formData.jamKeluar} WIB
                        </p>
                      )}
                    </div>
                  </div>

                  {formData.jamMasuk && formData.jamKeluar && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Durasi Shift</span>
                      </div>
                      <p className="text-sm text-green-700">
                        {formData.jamMasuk} - {formData.jamKeluar} WIB
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Location Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <h3 className="text-lg font-medium">Pengaturan Lokasi</h3>
                  </div>

                  <div>
                    <Label htmlFor="lockLokasi">Lock Lokasi *</Label>
                    <Select
                      value={formData.lockLokasi}
                      onValueChange={(value) => handleInputChange('lockLokasi', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Pilih aturan lokasi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIMANA_SAJA">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>Dimana Saja</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="HARUS_DI_KANTOR">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>Harus di Kantor</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.lockLokasi === 'HARUS_DI_KANTOR' 
                        ? 'Pegawai harus berada di lokasi kantor untuk absen' 
                        : 'Pegawai bisa absen dari lokasi manapun'
                      }
                    </p>
                  </div>

                  {formData.lockLokasi && (
                    <div className={`p-3 border rounded-lg ${
                      formData.lockLokasi === 'HARUS_DI_KANTOR' 
                        ? 'bg-orange-50 border-orange-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {formData.lockLokasi === 'HARUS_DI_KANTOR' ? (
                          <MapPin className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Globe className="h-4 w-4 text-blue-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          formData.lockLokasi === 'HARUS_DI_KANTOR' 
                            ? 'text-orange-800' 
                            : 'text-blue-800'
                        }`}>
                          {formData.lockLokasi === 'HARUS_DI_KANTOR' 
                            ? 'Lokasi Terbatas' 
                            : 'Lokasi Fleksibel'
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Status Configuration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="isActive" className="text-sm font-medium">Status Shift</Label>
                      <p className="text-xs text-gray-500">
                        {formData.isActive ? 'Shift aktif dan dapat digunakan' : 'Shift non-aktif'}
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
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t">
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
      </div>
    </div>
  )
}
