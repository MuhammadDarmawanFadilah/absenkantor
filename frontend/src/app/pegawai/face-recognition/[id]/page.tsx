'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
import { Separator } from '@/components/ui/separator'

// Icons
import {
  ArrowLeft,
  Scan,
  CheckCircle,
  AlertCircle,
  Clock,
  Camera,
  Eye,
  BarChart3,
  TrendingUp,
  Shield,
  Info,
  Calendar,
  User,
  Lock,
  Settings
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

export default function ViewMyFaceRecognitionPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const params = useParams()
  const faceRecognitionId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [faceRecognitionData, setFaceRecognitionData] = useState<FaceRecognitionData | null>(null)
  const [hasError, setHasError] = useState(false)

  // Load face recognition data
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      router.push('/login')
      return
    }
    
    if (!faceRecognitionId) {
      router.push('/pegawai/face-recognition')
      return
    }
    
    loadFaceRecognitionData()
  }, [isAuthenticated, user, faceRecognitionId])

  const loadFaceRecognitionData = async () => {
    try {
      setLoading(true)
      setHasError(false)
      
      const response = await fetch(getApiUrl(`api/face-recognition/${faceRecognitionId}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // Verify this face recognition belongs to current user
          if (result.data.pegawai.id !== user?.id) {
            toast.error('Anda tidak memiliki akses ke data face recognition ini')
            router.push('/pegawai/face-recognition')
            return
          }
          
          setFaceRecognitionData(result.data)
        } else {
          setHasError(true)
          toast.error('Data face recognition tidak ditemukan')
        }
      } else if (response.status === 404) {
        toast.error('Data face recognition tidak ditemukan')
        router.push('/pegawai/face-recognition')
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

  if (hasError || !faceRecognitionData) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Gagal memuat data face recognition. 
            <Button 
              variant="link" 
              onClick={loadFaceRecognitionData}
              className="ml-2 h-auto p-0"
            >
              Coba lagi
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Eye className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Detail Face Recognition</h1>
            <p className="text-muted-foreground">
              Informasi lengkap data face recognition Anda
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push('/pegawai/face-recognition')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>

      {/* Status Card */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-green-800">
                  Face Recognition Aktif
                </CardTitle>
                <CardDescription className="text-green-700">
                  ID: {faceRecognitionData.id} • Status: {faceRecognitionData.status}
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 text-base px-3 py-1">
              {faceRecognitionData.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-700 font-medium">Dibuat:</span>
              <span className="ml-2 text-green-800">
                {new Date(faceRecognitionData.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Terakhir Update:</span>
              <span className="ml-2 text-green-800">
                {new Date(faceRecognitionData.updatedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pegawai Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Informasi Pegawai
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-lg">
                {faceRecognitionData.pegawai.namaLengkap.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{faceRecognitionData.pegawai.namaLengkap}</h3>
              <p className="text-muted-foreground">NIP: {faceRecognitionData.pegawai.nip}</p>
              <p className="text-muted-foreground">{faceRecognitionData.pegawai.email}</p>
              {faceRecognitionData.pegawai.nomorTelepon && (
                <p className="text-muted-foreground">{faceRecognitionData.pegawai.nomorTelepon}</p>
              )}
              {faceRecognitionData.pegawai.jabatan && (
                <Badge variant="secondary">{faceRecognitionData.pegawai.jabatan.nama}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technology & Statistics */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Technology Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Informasi Teknologi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Teknologi</span>
              <span className="font-medium">{faceRecognitionData.technology || 'MediaPipe'}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Versi</span>
              <span className="font-medium">{faceRecognitionData.version || '2024-2025'}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Landmark Points</span>
              <span className="font-medium text-blue-600">{faceRecognitionData.landmarkPoints || 468}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Metode Capture</span>
              <span className="font-medium">{faceRecognitionData.captureMethod || 'Auto-detection'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Statistik Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faceRecognitionData.statistics ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Posisi Completed</span>
                  <span className="font-medium">
                    {faceRecognitionData.statistics.completedPositions}/{faceRecognitionData.statistics.totalPositions}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Descriptors</span>
                  <span className="font-medium text-blue-600">{faceRecognitionData.statistics.totalDescriptors}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Images</span>
                  <span className="font-medium text-purple-600">{faceRecognitionData.statistics.totalImages}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Average Confidence</span>
                  <span className="font-medium text-green-600">
                    {faceRecognitionData.statistics.averageConfidence}%
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Setup Duration</span>
                  <span className="font-medium">
                    {Math.round(faceRecognitionData.statistics.setupDuration / 1000 / 60)} menit
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Statistik tidak tersedia</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Result */}
      {faceRecognitionData.testResult && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Hasil Test Recognition
            </CardTitle>
            <CardDescription>
              Test dilakukan pada {new Date(faceRecognitionData.testResult.testDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg border ${
              faceRecognitionData.testResult.recognized 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  faceRecognitionData.testResult.recognized 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  {faceRecognitionData.testResult.recognized ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">
                    {faceRecognitionData.testResult.recognized ? 'Test Berhasil' : 'Test Gagal'}
                    <span className="ml-2 text-sm font-normal">
                      (Confidence: {faceRecognitionData.testResult.confidence}%)
                    </span>
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {faceRecognitionData.testResult.message}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capture Steps */}
      {faceRecognitionData.captureSteps && faceRecognitionData.captureSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Langkah Capture
            </CardTitle>
            <CardDescription>
              Status completion untuk setiap pose wajah
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-4">
              {faceRecognitionData.captureSteps.map((step, index) => (
                <div key={step.stepId} className="text-center space-y-2">
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                    step.completed 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <span className="font-bold">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <Badge 
                      variant={step.completed ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {step.stepName}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.instruction}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Captured Images */}
      {faceRecognitionData.capturedImages && faceRecognitionData.capturedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              Preview Captured Images
            </CardTitle>
            <CardDescription>
              {faceRecognitionData.capturedImages.length} gambar wajah dari berbagai sudut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {faceRecognitionData.capturedImages.map((image, index) => (
                <div key={index} className="text-center space-y-3">
                  <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-300 transition-colors group">
                    <img 
                      src={image.imageBase64} 
                      alt={`Capture ${image.position}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <Badge variant="secondary" className="text-xs mb-1">
                      {image.position}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(image.timestamp).toLocaleDateString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Face Descriptors Info */}
      {faceRecognitionData.faceDescriptors && faceRecognitionData.faceDescriptors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5 text-indigo-600" />
              Face Descriptors
            </CardTitle>
            <CardDescription>
              Data deskriptor wajah untuk setiap posisi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-4">
              {faceRecognitionData.faceDescriptors.map((descriptor, index) => (
                <div key={index} className="text-center p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <Badge variant="outline" className="mb-2 border-indigo-200 text-indigo-700">
                    {descriptor.position}
                  </Badge>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Points: {descriptor.landmarks}</p>
                    <p>Descriptor: {descriptor.descriptor.length} values</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {faceRecognitionData.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-orange-600" />
              Catatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {faceRecognitionData.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Admin Contact Alert */}
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          <strong>Informasi Penting:</strong> Data face recognition ini tidak dapat diubah atau dihapus 
          oleh pegawai. Jika Anda memerlukan perubahan atau penghapusan data, silakan hubungi 
          administrator sistem untuk bantuan lebih lanjut.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => router.push('/pegawai/face-recognition')}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke List
        </Button>
      </div>
    </div>
  )
}