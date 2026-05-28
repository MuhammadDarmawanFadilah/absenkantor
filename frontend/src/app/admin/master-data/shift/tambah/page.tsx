'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { ArrowLeft, Save, Clock, CheckCircle, MapPin, Globe } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { getApiUrl } from "@/lib/config"

export default function TambahShiftPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
  }, [])

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
      const response = await fetch(getApiUrl('api/admin/master-data/shift'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // 'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
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
        showSuccessToast('Shift berhasil ditambahkan')
        router.push('/admin/master-data/shift')
      } else {
        console.error('Response status:', response.status)
        console.error('Response headers:', response.headers)
        const errorText = await response.text()
        console.error('Response body:', errorText)
        showErrorToast(`Gagal menambahkan shift (${response.status}): ${errorText || 'Terjadi kesalahan pada server'}`)
      }
    } catch (error) {
      console.error('Network error:', error)
      showErrorToast('Terjadi kesalahan jaringan saat menambahkan shift')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Tambah Shift"
        description="Tambahkan shift kerja baru dengan konfigurasi yang lengkap"
        icon={Clock}
      />
      
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Form Tambah Shift Kerja
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
                  {loading ? 'Menyimpan...' : 'Simpan Shift'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
