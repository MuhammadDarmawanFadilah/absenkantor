'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { 
  Camera,
  Scan,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Play,
  Square,
  User,
  Clock
} from 'lucide-react'
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision'
import { getApiUrl } from "@/lib/config"

interface FaceRecognitionTestDialogProps {
  children: React.ReactNode
  faceRecognitionId?: number
  pegawaiId?: number
}

interface TestResult {
  isMatch: boolean
  confidence: number
  pegawai?: {
    id: number
    namaLengkap: string
    nip: string
  }
  error?: string
}

export default function FaceRecognitionTestDialog({ 
  children, 
  faceRecognitionId, 
  pegawaiId 
}: FaceRecognitionTestDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null)
  const [modelLoading, setModelLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Load MediaPipe model
  useEffect(() => {
    if (isOpen && !faceLandmarker) {
      loadMediaPipeModel()
    }
  }, [isOpen])

  const loadMediaPipeModel = async () => {
    try {
      setModelLoading(true)
      
      // Try multiple CDN sources for better reliability
      const cdnUrls = [
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm",
        "https://unpkg.com/@mediapipe/tasks-vision/wasm"
      ]
      
      let filesetResolver = null
      let lastError = null
      
      for (const url of cdnUrls) {
        try {
          console.log(`Trying MediaPipe CDN: ${url}`)
          filesetResolver = await FilesetResolver.forVisionTasks(url)
          console.log(`✅ Successfully loaded from: ${url}`)
          break
        } catch (error) {
          console.warn(`Failed to load from ${url}:`, error)
          lastError = error
          continue
        }
      }
      
      if (!filesetResolver) {
        throw lastError || new Error('All CDN sources failed')
      }
      
      const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: "IMAGE",
        numFaces: 1
      })
      
      setFaceLandmarker(landmarker)
      console.log('✅ MediaPipe FaceLandmarker model loaded successfully')
    } catch (error) {
      console.error('❌ Error loading MediaPipe model:', error)
      showErrorToast('Gagal memuat model face recognition. Coba refresh halaman.')
    } finally {
      setModelLoading(false)
    }
  }

  const startCamera = async () => {
    try {
      setIsLoading(true)
      console.log('🎥 Starting camera...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })
      
      console.log('📹 Camera stream obtained:', stream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        // Wait for video to load metadata
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video ref not available'))
            return
          }
          
          const video = videoRef.current
          const onLoadedMetadata = () => {
            console.log('📺 Video metadata loaded:', {
              width: video.videoWidth,
              height: video.videoHeight,
              readyState: video.readyState
            })
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            video.removeEventListener('error', onError)
            resolve()
          }
          
          const onError = (error: any) => {
            console.error('Video error:', error)
            video.removeEventListener('loadedmetadata', onLoadedMetadata)
            video.removeEventListener('error', onError)
            reject(error)
          }
          
          if (video.readyState >= 1) {
            // Metadata already loaded
            resolve()
          } else {
            video.addEventListener('loadedmetadata', onLoadedMetadata)
            video.addEventListener('error', onError)
          }
        })
        
        setIsCameraActive(true)
        console.log('✅ Camera activated successfully')
        showSuccessToast('Kamera berhasil diaktifkan')
      }
    } catch (error) {
      console.error('❌ Error accessing camera:', error)
      showErrorToast('Gagal mengakses kamera. Periksa izin kamera di browser.')
    } finally {
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    console.log('🛑 Stopping camera...')
    
    if (streamRef.current) {
      console.log('📹 Stopping stream tracks...')
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind, track.label)
        track.stop()
      })
      streamRef.current = null
    }
    
    if (videoRef.current) {
      console.log('📺 Clearing video source...')
      videoRef.current.srcObject = null
    }
    
    setIsCameraActive(false)
    setTestResult(null)
    setCountdown(0)
    console.log('✅ Camera stopped successfully')
  }

  const captureAndTest = async () => {
    if (!videoRef.current || !canvasRef.current || !faceLandmarker) {
      showErrorToast('Camera atau model belum siap')
      return
    }

    try {
      setIsLoading(true)
      setTestResult(null)

      // Start countdown
      for (let i = 3; i > 0; i--) {
        setCountdown(i)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      setCountdown(0)

      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext('2d')!
      
      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Get image data for MediaPipe
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      // Process with MediaPipe
      const results = faceLandmarker.detect(canvas)
      
      if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
        showErrorToast('Tidak ada wajah terdeteksi. Pastikan wajah Anda terlihat jelas di kamera.')
        return
      }

      // Extract face descriptors
      const landmarks = results.faceLandmarks[0]
      const faceDescriptor = extractFaceDescriptor(landmarks)
      
      console.log('📊 Face descriptor extracted:', {
        landmarks: landmarks.length,
        descriptor: faceDescriptor,
        descriptorLength: faceDescriptor.length
      });
      
      // Convert canvas to base64
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8)
      
      console.log('📸 Image captured:', {
        imageSize: imageBase64.length,
        imagePrefix: imageBase64.substring(0, 50) + '...'
      });
      
      // Send test request to backend
      await sendTestRequest(faceDescriptor, imageBase64)
      
    } catch (error) {
      console.error('Error during face recognition test:', error)
      showErrorToast('Terjadi kesalahan saat test face recognition')
    } finally {
      setIsLoading(false)
    }
  }

  const extractFaceDescriptor = (landmarks: any[]) => {
    // Use same landmark extraction as create page for consistency
    const keyLandmarks = [1, 33, 263, 175, 10, 152, 148, 172] // Nose, eyes, chin, forehead, etc.
    const features: number[] = []
    
    keyLandmarks.forEach(index => {
      if (landmarks[index]) {
        features.push(landmarks[index].x, landmarks[index].y, landmarks[index].z)
      }
    })
    
    return features // Return as regular array for JSON serialization
  }

  const sendTestRequest = async (faceDescriptor: number[], imageBase64: string) => {
    try {
      const requestBody = faceRecognitionId 
        ? {
            faceDescriptor,
            imageBase64,
            targetFaceRecognitionId: faceRecognitionId
          }
        : {
            faceDescriptor,
            imageBase64
          }

      console.log('Sending test request:', {
        descriptorLength: faceDescriptor.length,
        hasImage: !!imageBase64,
        targetId: faceRecognitionId
      })

      const response = await fetch(getApiUrl('api/face-recognition/test'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()
      console.log('🔍 Raw API response:', result)
      console.log('🔍 Response data:', result.data)
      console.log('🔍 isMatch field:', result.data.isMatch)
      console.log('🔍 match field:', result.data.match)
      console.log('🔍 confidence:', result.data.confidence)
      
      if (result.success) {
        // Try both field names for compatibility
        const isMatch = result.data.isMatch !== undefined ? result.data.isMatch : result.data.match
        
        setTestResult({
          isMatch: isMatch,
          confidence: result.data.confidence,
          pegawai: result.data.pegawai
        })
        
        if (isMatch) {
          showSuccessToast(`Face recognition berhasil! Confidence: ${(result.data.confidence * 100).toFixed(1)}%`)
        } else {
          showErrorToast(`Face recognition gagal. Confidence: ${(result.data.confidence * 100).toFixed(1)}%`)
        }
      } else {
        setTestResult({
          isMatch: false,
          confidence: 0,
          error: result.message
        })
        showErrorToast(result.message || 'Test face recognition gagal')
      }
    } catch (error) {
      console.error('Error sending test request:', error)
      setTestResult({
        isMatch: false,
        confidence: 0,
        error: 'Terjadi kesalahan saat mengirim request'
      })
      showErrorToast('Terjadi kesalahan saat test face recognition')
    }
  }

  const resetTest = () => {
    setTestResult(null)
    setCountdown(0)
  }

  const handleDialogClose = () => {
    console.log('🚪 Dialog closing...')
    stopCamera()
    setTestResult(null)
    setCountdown(0)
    setIsOpen(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up...')
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleDialogClose()
      } else {
        setIsOpen(true)
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Scan className="w-5 h-5 mr-2 text-blue-600" />
            Test Face Recognition
          </DialogTitle>
          <DialogDescription>
            {faceRecognitionId 
              ? 'Test face recognition untuk data pegawai tertentu'
              : 'Test face recognition dengan semua data yang tersimpan'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Model Loading Status */}
          {modelLoading && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <LoadingSpinner className="w-5 h-5" />
                  <div>
                    <p className="font-medium text-blue-900">Memuat Model MediaPipe</p>
                    <p className="text-sm text-blue-700">Mohon tunggu sebentar...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Camera Controls */}
          <div className="flex justify-center space-x-4">
            {!isCameraActive ? (
              <Button 
                onClick={startCamera}
                disabled={isLoading || modelLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Mengaktifkan...' : 'Aktifkan Kamera'}
              </Button>
            ) : (
              <>
                <Button 
                  onClick={captureAndTest}
                  disabled={isLoading || !faceLandmarker || !videoRef.current?.videoWidth}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? 'Memproses...' : 'Test Recognition'}
                </Button>
                <Button 
                  onClick={stopCamera}
                  variant="outline"
                  disabled={isLoading}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop Kamera
                </Button>
                {testResult && (
                  <Button 
                    onClick={resetTest}
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Countdown Display */}
          {countdown > 0 && (
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600 animate-pulse">
                {countdown}
              </div>
              <p className="text-sm text-gray-600 mt-2">Bersiap untuk capture...</p>
            </div>
          )}

          {/* Camera Feed */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden min-h-[300px]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-auto min-h-[300px] object-cover border-2 ${
                isCameraActive ? 'border-blue-500' : 'border-gray-500'
              }`}
              style={{ 
                transform: 'scaleX(-1)',
                minHeight: '300px',
                maxHeight: '400px',
                display: 'block' // Force display
              }}
              onLoadedMetadata={() => {
                console.log('📺 Video metadata loaded:', {
                  width: videoRef.current?.videoWidth,
                  height: videoRef.current?.videoHeight,
                  readyState: videoRef.current?.readyState
                })
              }}
              onLoadedData={() => {
                console.log('📺 Video data loaded')
              }}
              onCanPlay={() => {
                console.log('📺 Video can play')
              }}
              onPlaying={() => {
                console.log('📺 Video is playing')
              }}
              onError={(e) => {
                console.error('📺 Video error:', e)
              }}
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Status message overlay */}
            {!isCameraActive && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-center text-white">
                  <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Kamera Belum Aktif</p>
                  <p className="text-sm opacity-75">Klik "Aktifkan Kamera" untuk memulai</p>
                </div>
              </div>
            )}
            
            {/* Loading overlay */}
            {isCameraActive && (!videoRef.current?.videoWidth || !faceLandmarker) && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <LoadingSpinner className="w-8 h-8 mx-auto mb-2" />
                  <p>{!videoRef.current?.videoWidth ? 'Memuat video...' : 'Memuat model...'}</p>
                </div>
              </div>
            )}
            
            {/* Video status display for debugging */}
            {isCameraActive && (
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded space-y-1">
                <div>Kamera: {isCameraActive ? '✅' : '❌'}</div>
                <div>Stream: {streamRef.current ? '✅' : '❌'}</div>
                <div>Video: {videoRef.current?.videoWidth ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}` : '❌'}</div>
                <div>Model: {faceLandmarker ? '✅' : '❌'}</div>
              </div>
            )}
          </div>
          
          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
            <div className="grid grid-cols-2 gap-2">
              <div>Camera active: <span className={isCameraActive ? 'text-green-600' : 'text-red-600'}>{isCameraActive.toString()}</span></div>
              <div>Video ref: <span className={videoRef.current ? 'text-green-600' : 'text-red-600'}>{videoRef.current ? 'Available' : 'Not available'}</span></div>
              <div>Stream ref: <span className={streamRef.current ? 'text-green-600' : 'text-red-600'}>{streamRef.current ? 'Available' : 'Not available'}</span></div>
              <div>Model loaded: <span className={faceLandmarker ? 'text-green-600' : 'text-red-600'}>{faceLandmarker ? 'Yes' : 'No'}</span></div>
              <div>Video width: <span className={videoRef.current?.videoWidth ? 'text-green-600' : 'text-red-600'}>{videoRef.current?.videoWidth || 'N/A'}</span></div>
              <div>Video height: <span className={videoRef.current?.videoHeight ? 'text-green-600' : 'text-red-600'}>{videoRef.current?.videoHeight || 'N/A'}</span></div>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <Card className={`${
              testResult.isMatch 
                ? 'bg-green-50 border-green-200' 
                : testResult.error
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-full ${
                    testResult.isMatch 
                      ? 'bg-green-100' 
                      : testResult.error
                      ? 'bg-red-100'
                      : 'bg-yellow-100'
                  }`}>
                    {testResult.isMatch ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : testResult.error ? (
                      <XCircle className="w-6 h-6 text-red-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-600" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${
                      testResult.isMatch 
                        ? 'text-green-900' 
                        : testResult.error
                        ? 'text-red-900'
                        : 'text-yellow-900'
                    }`}>
                      {testResult.isMatch 
                        ? '✅ Face Recognition Berhasil!' 
                        : testResult.error
                        ? '❌ Test Gagal'
                        : '⚠️ Wajah Tidak Dikenal'
                      }
                    </h3>
                    
                    {testResult.error ? (
                      <p className="text-red-700 mt-1">{testResult.error}</p>
                    ) : (
                      <>
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Confidence Score:</span>
                            <Badge variant={testResult.confidence >= 0.8 ? 'default' : 'secondary'}>
                              {(testResult.confidence * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          
                          {testResult.pegawai && (
                            <div className="mt-3 p-3 bg-white rounded-lg border">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-600" />
                                <span className="font-medium">Teridentifikasi sebagai:</span>
                              </div>
                              <div className="mt-2 text-sm">
                                <p className="font-semibold text-gray-900">
                                  {testResult.pegawai.namaLengkap}
                                </p>
                                <p className="text-gray-600">NIP: {testResult.pegawai.nip}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center text-xs text-gray-500 mt-3">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>Test dilakukan pada {formatDate(new Date().toISOString())}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {!testResult && !isCameraActive && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-blue-900 mb-2">Petunjuk Test:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Pastikan browser memiliki izin akses kamera</li>
                  <li>• Klik "Aktifkan Kamera" untuk memulai</li>
                  <li>• Tunggu hingga kamera muncul dan model MediaPipe siap</li>
                  <li>• Posisikan wajah di tengah frame</li>
                  <li>• Klik "Test Recognition" untuk memulai test</li>
                </ul>
                
                {/* Troubleshooting button */}
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('🔧 Troubleshooting camera...')
                      console.log('Navigator.mediaDevices:', navigator.mediaDevices)
                      console.log('Video constraints supported:', navigator.mediaDevices?.getSupportedConstraints())
                      navigator.mediaDevices?.enumerateDevices()
                        .then(devices => {
                          console.log('Available devices:', devices.filter(d => d.kind === 'videoinput'))
                        })
                        .catch(console.error)
                    }}
                    className="text-xs"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Check Camera Devices
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {!testResult && isCameraActive && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-green-900 mb-2">Kamera Aktif:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Pastikan wajah Anda terlihat jelas di kamera</li>
                  <li>• Posisikan wajah di tengah frame</li>
                  <li>• Pastikan pencahayaan cukup</li>
                  <li>• Klik "Test Recognition" untuk memulai</li>
                  <li>• Sistem akan melakukan countdown 3 detik sebelum capture</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}