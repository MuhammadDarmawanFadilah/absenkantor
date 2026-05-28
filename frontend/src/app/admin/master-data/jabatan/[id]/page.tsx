'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Briefcase, Calendar, Loader2, Edit, Crown } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { showErrorToast } from "@/components/ui/toast-utils"
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
  createdAt: string
  updatedAt: string
}

export default function DetailJabatanPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [jabatan, setJabatan] = useState<JabatanResponse | null>(null)

  useEffect(() => {
    setMounted(true)
    if (id) {
      fetchJabatanData()
    }
  }, [id])

  const fetchJabatanData = async () => {
    try {
      const response = await fetch(getApiUrl(`api/admin/master-data/jabatan/${id}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data: JabatanResponse = await response.json()
        setJabatan(data)
      } else {
        showErrorToast('Gagal memuat data jabatan')
        router.push('/admin/master-data/jabatan')
      }
    } catch (error) {
      showErrorToast('Terjadi kesalahan saat memuat data')
      router.push('/admin/master-data/jabatan')
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

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!jabatan) {
    return (
      <div className="text-center">
        <p>Data jabatan tidak ditemukan</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Detail: ${jabatan.nama}`}
        description="Informasi lengkap jabatan"
        icon={Briefcase}
      />
      
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Informasi Jabatan
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/master-data/jabatan/${id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Nama Jabatan</h3>
                  <p className="text-lg font-semibold">{jabatan.nama}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Deskripsi</h3>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <p className="text-sm">{jabatan.deskripsi || 'Tidak ada deskripsi'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <Badge variant={jabatan.isActive ? "default" : "secondary"}>
                    {jabatan.isActive ? "✅ Aktif" : "❌ Tidak Aktif"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Manager</h3>
                  <p className="text-sm">
                    {jabatan.manager ? `${jabatan.manager.namaLengkap} (${jabatan.manager.username})` : 'Tidak ada manager'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Urutan</h3>
                  <p className="text-lg font-mono">{jabatan.sortOrder}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Tanggal Dibuat
                </h3>
                <p className="text-sm">{formatDate(jabatan.createdAt)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Terakhir Diperbarui
                </h3>
                <p className="text-sm">{formatDate(jabatan.updatedAt)}</p>
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
      </div>
    </div>
  )
}
