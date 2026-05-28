'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Save, Briefcase, Loader2 } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { getApiUrl } from "@/lib/config"

interface JabatanResponse {
  id: number
  nama: string
  deskripsi: string
  manager?: {
    id: number
    username: string
    namaLengkap: string
    email: string
  }
  isActive: boolean
  sortOrder: number
}

interface PegawaiOption {
  id: number
  username: string
  namaLengkap: string
  email: string
}

export default function EditJabatanPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [pegawaiList, setPegawaiList] = useState<PegawaiOption[]>([])
  const [loadingPegawai, setLoadingPegawai] = useState(false)

  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    managerId: 'none',
    isActive: true,
    sortOrder: 0
  })

  useEffect(() => {
    setMounted(true)
    if (id) {
      loadPegawaiList()
      fetchJabatanData()
    }
  }, [id])

  const loadPegawaiList = async () => {
    try {
      setLoadingPegawai(true)
      const response = await fetch(getApiUrl('api/admin/master-data/pegawai/all'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPegawaiList(data || [])
      } else {
        console.error('Failed to load pegawai list')
      }
    } catch (error) {
      console.error('Error loading pegawai list:', error)
    } finally {
      setLoadingPegawai(false)
    }
  }

  const fetchJabatanData = async () => {
    try {
      const response = await fetch(getApiUrl(`api/admin/master-data/jabatan/${id}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data: JabatanResponse = await response.json()
        setFormData({
          nama: data.nama,
          deskripsi: data.deskripsi || '',
          managerId: data.manager ? data.manager.id.toString() : 'none',
          isActive: data.isActive,
          sortOrder: data.sortOrder
        })
      } else {
        showErrorToast('Gagal memuat data jabatan')
        router.push('/admin/master-data/jabatan')
      }
    } catch (error) {
      showErrorToast('Terjadi kesalahan saat memuat data')
      router.push('/admin/master-data/jabatan')
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nama.trim()) {
      showErrorToast('Nama jabatan wajib diisi')
      return
    }

    setLoading(true)
    try {
      const payload: any = {
        nama: formData.nama.trim(),
        deskripsi: formData.deskripsi?.trim() || '',
        isActive: formData.isActive,
        sortOrder: formData.sortOrder
      }

      // Add managerId only if selected
      if (formData.managerId && formData.managerId !== 'none') {
        payload.managerId = parseInt(formData.managerId)
      }

      const response = await fetch(getApiUrl(`api/admin/master-data/jabatan/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        showSuccessToast('Jabatan berhasil diperbarui')
        router.push('/admin/master-data/jabatan')
      } else {
        const error = await response.text()
        showErrorToast(`Gagal memperbarui jabatan: ${error}`)
      }
    } catch (error) {
      showErrorToast('Terjadi kesalahan saat memperbarui jabatan')
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
        title="Edit Jabatan"
        description="Perbarui informasi jabatan"
        icon={Briefcase}
      />
      
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Form Edit Jabatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nama">Nama Jabatan *</Label>
                  <Input
                    id="nama"
                    type="text"
                    placeholder="Masukkan nama jabatan"
                    value={formData.nama}
                    onChange={(e) => handleInputChange('nama', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea
                    id="deskripsi"
                    placeholder="Masukkan deskripsi jabatan (opsional)"
                    value={formData.deskripsi}
                    onChange={(e) => handleInputChange('deskripsi', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="managerId">Manager (Opsional)</Label>
                  <Select 
                    value={formData.managerId} 
                    onValueChange={(value) => handleInputChange('managerId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih manager untuk jabatan ini" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tidak ada manager</SelectItem>
                      {loadingPegawai ? (
                        <SelectItem value="loading" disabled>Loading pegawai...</SelectItem>
                      ) : (
                        pegawaiList.map((pegawai) => (
                          <SelectItem key={pegawai.id} value={pegawai.id.toString()}>
                            {pegawai.namaLengkap} ({pegawai.username})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pilih pegawai yang akan menjadi manager untuk jabatan ini
                  </p>
                </div>

                <div>
                  <Label htmlFor="sortOrder">Urutan</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    placeholder="Urutan tampilan"
                    value={formData.sortOrder}
                    onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Status Aktif</Label>
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
      </div>
    </div>
  )
}
