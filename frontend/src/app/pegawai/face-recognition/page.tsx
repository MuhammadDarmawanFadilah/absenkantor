'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { getApiUrl } from '@/lib/config'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Icons
import {
  Scan,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Plus,
  Eye,
  Info,
  Trash2,
  Edit,
  Clock,
  Smartphone,
  Shield,
  Lock,
  Calendar,
  Users,
  Camera
} from 'lucide-react'

// Types
interface FaceRecognitionData {
  id: number
  pegawai: {
    id: number
    namaLengkap: string
    nip: string
    email: string
    nomorTelepon?: string
    jabatan?: {
      id: number
      nama: string
    }
    status: string
  }
  status: 'ACTIVE' | 'INACTIVE'
  technology?: string
  version?: string
  landmarkPoints?: number
  captureMethod?: string
  notes?: string
  createdAt: string
  updatedAt: string
  faceDescriptors?: Array<{
    position: string
    stepId: string
    descriptor: number[]
    landmarks: number
  }>
  capturedImages?: Array<{
    position: string
    stepId: string
    imageBase64: string
    timestamp: string
  }>
  captureSteps?: Array<{
    stepId: string
    stepName: string
    instruction: string
    completed: boolean
    expectedOrientation: string
  }>
  testResult?: {
    recognized: boolean
    confidence: number
    message: string
    testDate: string
  }
  statistics?: {
    totalPositions: number
    completedPositions: number
    totalDescriptors: number
    totalImages: number
    averageConfidence: number
    setupDuration: number
  }
}

export default function MyFaceRecognitionPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [faceRecognitionData, setFaceRecognitionData] = useState<FaceRecognitionData | null>(null)
  const [hasError, setHasError] = useState(false)

  // Load face recognition data for current user
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      router.push('/login')
      return
    }
    
    loadFaceRecognitionData()
  }, [isAuthenticated, user])

  const loadFaceRecognitionData = async () => {
    try {
      setLoading(true)
      setHasError(false)
      
      const response = await fetch(getApiUrl(`api/face-recognition/pegawai/${user?.id}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setFaceRecognitionData(result.data)
        } else {
          setFaceRecognitionData(null)
        }
      } else if (response.status === 404) {
        // Face recognition not found for this user
        setFaceRecognitionData(null)
      } else {
        setHasError(true)
        toast.error('Gagal memuat data face recognition')
      }
    } catch (error) {
      console.error('Error loading face recognition data:', error)
      setHasError(true)
      toast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFaceRecognition = () => {
    router.push(`/pegawai/face-recognition/create`)
  }

  const handleViewDetails = () => {
    if (faceRecognitionData) {
      router.push(`/pegawai/face-recognition/${faceRecognitionData.id}`)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-4" />
            <p className="text-lg">Memuat data Face Recognition...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Scan className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Face Recognition Saya</h1>
          <p className="text-muted-foreground">
            Kelola data face recognition untuk sistem absensi
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Terjadi kesalahan saat memuat data. Silakan coba lagi.
            <Button 
              variant="link" 
              onClick={loadFaceRecognitionData}
              className="ml-2 h-auto p-0"
            >
              Refresh
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {!faceRecognitionData ? (
        // No Face Recognition Data - Show Create Option
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="text-center">
              <div className="mx-auto p-4 bg-blue-100 rounded-full w-fit">
                <Camera className="w-12 h-12 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-blue-800">
                Belum Ada Face Recognition
              </CardTitle>
              <CardDescription className="text-blue-700">
                Anda belum memiliki data face recognition. Buat sekarang untuk mengaktifkan fitur absensi dengan pengenalan wajah.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={handleCreateFaceRecognition}
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Buat Face Recognition
              </Button>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Tentang Face Recognition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Keamanan Tinggi</h4>
                    <p className="text-sm text-muted-foreground">
                      Menggunakan teknologi MediaPipe 2024-2025 dengan 468 landmark points
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Mudah Digunakan</h4>
                    <p className="text-sm text-muted-foreground">
                      Proses setup otomatis dengan 5 pose wajah (depan, kiri, kanan, atas, bawah)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Absensi Cepat</h4>
                    <p className="text-sm text-muted-foreground">
                      Verifikasi wajah dalam hitungan detik untuk absensi masuk/pulang
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-orange-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Personal</h4>
                    <p className="text-sm text-muted-foreground">
                      Data wajah hanya digunakan untuk verifikasi identitas Anda sendiri
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Has Face Recognition Data - Show Details
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-green-800">
                      Face Recognition Aktif
                    </CardTitle>
                    <CardDescription className="text-green-700">
                      Setup pada {new Date(faceRecognitionData.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {faceRecognitionData.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  onClick={handleViewDetails}
                  variant="outline"
                  className="border-green-200 text-green-700 hover:bg-green-100"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Lihat Detail
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Face Recognition Details */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Technology Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Teknologi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teknologi</span>
                  <span className="font-medium">{faceRecognitionData.technology || 'MediaPipe'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versi</span>
                  <span className="font-medium">{faceRecognitionData.version || '2024-2025'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Landmark Points</span>
                  <span className="font-medium">{faceRecognitionData.landmarkPoints || 468}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode Capture</span>
                  <span className="font-medium">{faceRecognitionData.captureMethod || 'Auto-detection'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistik Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {faceRecognitionData.statistics ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Posisi Completed</span>
                      <span className="font-medium">
                        {faceRecognitionData.statistics.completedPositions}/{faceRecognitionData.statistics.totalPositions}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Descriptors</span>
                      <span className="font-medium">{faceRecognitionData.statistics.totalDescriptors}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Images</span>
                      <span className="font-medium">{faceRecognitionData.statistics.totalImages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Confidence</span>
                      <span className="font-medium text-green-600">
                        {faceRecognitionData.statistics.averageConfidence}%
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>Statistik tidak tersedia</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Test Result Card */}
          {faceRecognitionData.testResult && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  Hasil Test Recognition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    faceRecognitionData.testResult.recognized 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {faceRecognitionData.testResult.recognized ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {faceRecognitionData.testResult.recognized ? 'Berhasil' : 'Gagal'} - 
                      <span className="ml-2">
                        Confidence: {faceRecognitionData.testResult.confidence}%
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {faceRecognitionData.testResult.message}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Captured Images Preview */}
          {faceRecognitionData.capturedImages && faceRecognitionData.capturedImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview Captured Images</CardTitle>
                <CardDescription>
                  {faceRecognitionData.capturedImages.length} gambar wajah dari berbagai sudut
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {faceRecognitionData.capturedImages.map((image, index) => (
                    <div key={index} className="text-center space-y-2">
                      <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border">
                        <img 
                          src={image.imageBase64} 
                          alt={`Capture ${image.position}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {image.position}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Section */}
          {faceRecognitionData.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Catatan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{faceRecognitionData.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Admin Contact Alert */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>Perhatian:</strong> Untuk menghapus atau mengubah data face recognition, 
              silakan hubungi administrator sistem. Data ini tidak dapat diubah oleh pegawai 
              untuk menjaga keamanan sistem absensi.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
