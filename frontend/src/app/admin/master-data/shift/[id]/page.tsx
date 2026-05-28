'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Clock, Calendar, Loader2, Edit } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { showErrorToast } from "@/components/ui/toast-utils"
import { getApiUrl } from "@/lib/config"

interface ShiftResponse {
  id: number
  namaShift: string
  jamMasuk: string
  jamKeluar: string
  lockLokasi: string
  deskripsi: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function DetailShiftPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [shift, setShift] = useState<ShiftResponse | null>(null)

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
        setShift(data)
      } else {
        showErrorToast('Gagal memuat data shift')
        router.push('/admin/master-data/shift')
      }
    } catch (error) {
      showErrorToast('Terjadi kesalahan saat memuat data')
      router.push('/admin/master-data/shift')
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

  const formatTime = (timeString: string) => {
    return timeString ? timeString.slice(0, 5) : '-'
  }

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!shift) {
    return (
      <div className="text-center">
        <p>Data shift tidak ditemukan</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Detail: ${shift.namaShift}`}
        description="Informasi lengkap shift kerja"
        icon={Clock}
      />
      
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Informasi Shift
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/master-data/shift/${id}/edit`)}
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
                  <h3 className="text-sm font-medium text-muted-foreground">Nama Shift</h3>
                  <p className="text-lg font-semibold">{shift.namaShift}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Lock Lokasi</h3>
                  <Badge variant={shift.lockLokasi === 'HARUS_DI_KANTOR' ? 'destructive' : 'outline'}>
                    {shift.lockLokasi === 'HARUS_DI_KANTOR' ? 'Harus di Kantor' : 'Dimana Saja'}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Deskripsi</h3>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    {shift.deskripsi || 'Tidak ada deskripsi'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <Badge variant={shift.isActive ? "default" : "secondary"}>
                    {shift.isActive ? "✅ Aktif" : "❌ Tidak Aktif"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Waktu Kerja</h3>
                  <div className="space-y-2">
                    <p className="text-lg">
                      <span className="font-medium">Masuk:</span> {formatTime(shift.jamMasuk)}
                    </p>
                    <p className="text-lg">
                      <span className="font-medium">Keluar:</span> {formatTime(shift.jamKeluar)}
                    </p>
                  </div>
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
                <p className="text-sm">{formatDate(shift.createdAt)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Terakhir Diperbarui
                </h3>
                <p className="text-sm">{formatDate(shift.updatedAt)}</p>
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
