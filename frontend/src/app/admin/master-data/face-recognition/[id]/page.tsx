'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { 
  ArrowLeft, 
  Edit, 
  Scan, 
  User, 
  Calendar, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  Mail,
  Phone,
  Camera,
  Trash2
} from 'lucide-react'
import { getApiUrl } from "@/lib/config"

interface FaceRecognitionDetail {
  id: number
  pegawai: {
    id: number
    namaLengkap: string
    nip: string
    email: string
    nomorTelepon?: string
    jabatan?: {
      nama: string
    }
    status: string
  }
  faceImageBase64?: string
  faceConfidence: number
  trainingImagesCount: number
  status: 'ACTIVE' | 'INACTIVE'
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function FaceRecognitionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = parseInt(params.id as string)
  
  const [faceRecognition, setFaceRecognition] = useState<FaceRecognitionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      loadFaceRecognitionDetail()
    }
  }, [id])

  const loadFaceRecognitionDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/face-recognition/${id}`))
      const result = await response.json()
      
      if (result.success) {
        setFaceRecognition(result.data)
      } else {
        showErrorToast(result.message || 'Data tidak ditemukan')
        router.push('/admin/master-data/face-recognition')
      }
    } catch (error) {
      console.error('Error loading face recognition detail:', error)
      showErrorToast('Terjadi kesalahan saat memuat data')
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

  const handleImageError = () => {
    setImageError(true)
  }

  const handleDelete = async () => {
    if (!faceRecognition) return

    try {
      setDeleting(true)
      
      const response = await fetch(getApiUrl(`api/face-recognition/${id}`), {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        showSuccessToast('Data face recognition berhasil dihapus')
        router.push('/admin/master-data/face-recognition')
      } else {
        showErrorToast(result.message || 'Gagal menghapus data')
      }
    } catch (error) {
      console.error('Error deleting face recognition:', error)
      showErrorToast('Terjadi kesalahan saat menghapus data')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!faceRecognition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Data face recognition tidak ditemukan.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <AdminPageHeader
          title="Detail Face Recognition"
          description={`Informasi lengkap face recognition untuk ${faceRecognition.pegawai.namaLengkap}`}
          icon={Eye}
          secondaryActions={[
            {
              label: "Kembali",
              onClick: () => router.push('/admin/master-data/face-recognition'),
              icon: ArrowLeft,
              variant: "outline"
            },
            {
              label: "Edit",
              onClick: () => router.push(`/admin/master-data/face-recognition/${id}/edit`),
              icon: Edit,
              variant: "default"
            },
            {
              label: "Hapus",
              onClick: () => {
                if (confirm('Apakah Anda yakin ingin menghapus data face recognition ini?')) {
                  handleDelete()
                }
              },
              icon: Trash2,
              variant: "destructive"
            }
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pegawai Information */}
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Informasi Pegawai
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nama Lengkap</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {faceRecognition.pegawai.namaLengkap}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">NIP</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {faceRecognition.pegawai.nip}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                    <div className="flex items-center mt-1">
                      <Mail className="w-4 h-4 mr-2 text-gray-500" />
                      <p className="text-gray-900 dark:text-gray-100">
                        {faceRecognition.pegawai.email}
                      </p>
                    </div>
                  </div>
                  
                  {faceRecognition.pegawai.nomorTelepon && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">No. Telepon</label>
                      <div className="flex items-center mt-1">
                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                        <p className="text-gray-900 dark:text-gray-100">
                          {faceRecognition.pegawai.nomorTelepon}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Jabatan</label>
                    <div className="flex items-center mt-1">
                      <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
                      <p className="text-gray-900 dark:text-gray-100">
                        {faceRecognition.pegawai.jabatan?.nama || 'Tidak ada jabatan'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status Pegawai</label>
                    <div className="mt-1">
                      <Badge 
                        variant={faceRecognition.pegawai.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={faceRecognition.pegawai.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {faceRecognition.pegawai.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Face Recognition Data */}
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scan className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                  Data Face Recognition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Confidence Score</label>
                    <div className="mt-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${(faceRecognition.faceConfidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {(faceRecognition.faceConfidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {faceRecognition.faceConfidence >= 0.8 ? 'Sangat Baik' : 
                         faceRecognition.faceConfidence >= 0.6 ? 'Baik' : 
                         faceRecognition.faceConfidence >= 0.4 ? 'Cukup' : 'Perlu Perbaikan'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status System</label>
                    <div className="mt-2">
                      <Badge 
                        variant={faceRecognition.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={`flex items-center w-fit ${
                          faceRecognition.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}
                      >
                        {faceRecognition.status === 'ACTIVE' ? (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        {faceRecognition.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Jumlah Training Images</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                      {faceRecognition.trainingImagesCount} gambar
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">ID Face Recognition</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                      #{faceRecognition.id}
                    </p>
                  </div>
                </div>

                {faceRecognition.notes && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Catatan</label>
                      <p className="text-gray-900 dark:text-gray-100 mt-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        {faceRecognition.notes}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">Face Recognition Didaftarkan</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(faceRecognition.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {faceRecognition.createdAt !== faceRecognition.updatedAt && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">Terakhir Diperbarui</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(faceRecognition.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Face Image */}
          <div className="lg:col-span-1">
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  Foto Wajah
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {faceRecognition.faceImageBase64 && !imageError ? (
                    <div className="relative">
                      <img 
                        src={faceRecognition.faceImageBase64}
                        alt={`Face of ${faceRecognition.pegawai.namaLengkap}`}
                        className="w-full h-64 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg"
                        onError={handleImageError}
                      />
                      <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-lg pointer-events-none" />
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <Scan className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">Foto tidak tersedia</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                      Face ID: #{faceRecognition.id}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
