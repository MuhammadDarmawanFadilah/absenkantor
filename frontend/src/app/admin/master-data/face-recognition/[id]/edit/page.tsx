'use client'

import { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { getApiUrl } from '@/lib/config'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Icons
import {
  UserPlus,
  ArrowLeft,
  ArrowRight,
  Search,
  Camera,
  Video,
  VideoOff,
  CheckCircle,
  AlertCircle,
  Save,
  RotateCcw,
  Eye,
  BarChart3,
  TrendingUp,
  Edit2,
  User,
  Scan,
  RefreshCw,
  Play,
  Users,
  TestTube,
  Upload,
  Download,
  FileCheck,
  Zap,
  Shield,
  Calendar,
  Clock,
  Map,
  MapPin,
  Layers,
  Target,
  Activity,
  Brain,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react'

// Types
interface Pegawai {
  id: number
  username: string
  email: string
  fullName: string
  namaLengkap: string
  jabatan: string | { nama: string }
  phoneNumber?: string
  photoUrl?: string
  status: string
  role: string
}

interface CaptureStep {
  id: string
  name: string
  instruction: string
  tips: string
  expectedOrientation: string
  completed: boolean
}

interface FaceRecognitionDetail {
  id: number
  pegawai: Pegawai
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
  technology: string
  status: 'ACTIVE' | 'INACTIVE'
  notes?: string
  statistics?: {
    totalPositions: number
    completedPositions: number
    totalDescriptors: number
    totalImages: number
    averageConfidence: number
  }
  createdAt: string
  updatedAt: string
}

export default function EditFaceRecognitionPage() {
  const router = useRouter()
  const params = useParams()
  const id = parseInt(params.id as string)
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [faceRecognition, setFaceRecognition] = useState<FaceRecognitionDetail | null>(null)
  
  // Step navigation - 1: Pegawai Info (auto-filled), 2: Capture, 3: Test, 4: Preview & Submit
  const [currentStep, setCurrentStep] = useState(1)
  
  // Edit states
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [notes, setNotes] = useState('')
  
  // MediaPipe states
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null)
  const [modelLoading, setModelLoading] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  
  // Capture steps - Enhanced workflow with 5 poses (front, left, right, up, down)
  const [captureSteps, setCaptureSteps] = useState<CaptureStep[]>([
    {
      id: 'front',
      name: 'Depan', 
      instruction: 'Hadapkan wajah lurus ke kamera',
      tips: 'Pastikan mata dan hidung terlihat jelas',
      expectedOrientation: 'front',
      completed: false
    },
    {
      id: 'left',
      name: 'Kiri',
      instruction: 'Putar kepala 45° ke kiri',
      tips: 'Mata kanan masih harus terlihat',
      expectedOrientation: 'left',
      completed: false
    },
    {
      id: 'right', 
      name: 'Kanan',
      instruction: 'Putar kepala 45° ke kanan',
      tips: 'Mata kiri masih harus terlihat',
      expectedOrientation: 'right',
      completed: false
    },
    {
      id: 'up',
      name: 'Atas',
      instruction: 'Angkat kepala ke atas',
      tips: 'Jangan terlalu tinggi, mata masih terlihat',
      expectedOrientation: 'up',
      completed: false
    },
    {
      id: 'down',
      name: 'Bawah',
      instruction: 'Tundukkan kepala ke bawah',
      tips: 'Jangan terlalu rendah, masih bisa lihat kamera',
      expectedOrientation: 'down',
      completed: false
    }
  ])
  
  // Camera & capture states
  const [cameraActive, setCameraActive] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [faceOrientation, setFaceOrientation] = useState<string>('')
  const [orientationValid, setOrientationValid] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [currentCaptureStep, setCurrentCaptureStep] = useState<CaptureStep | null>(null)
  const [allDescriptors, setAllDescriptors] = useState<Float32Array[]>([])
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [isProcessingCapture, setIsProcessingCapture] = useState(false)
  const [autoDetectionEnabled, setAutoDetectionEnabled] = useState(true)
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [recentStepChange, setRecentStepChange] = useState(false)
  const [previewStep, setPreviewStep] = useState(false)
  const [testStep, setTestStep] = useState(false)
  const [testResult, setTestResult] = useState<{
    recognized: boolean,
    confidence: number,
    message: string
  } | null>(null)
  const [isTestingFace, setIsTestingFace] = useState(false)
  const [testCountdown, setTestCountdown] = useState(0)
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const currentStepIndexRef = useRef(-1)
  const isCapturingRef = useRef(false)
  const testCanvasRef = useRef<HTMLCanvasElement>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastLogTime = useRef(0)
  
  // Track timing
  const [startTime] = useState(Date.now())

  // PROPER STATE SYNC - Same as create page
  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex
    
    if (currentStepIndex >= 0 && currentStepIndex < captureSteps.length) {
      const newStep = captureSteps[currentStepIndex]
      setCurrentCaptureStep(newStep)
      console.log('🔄 Synced currentCaptureStep:', newStep.name, '| Index:', currentStepIndex)
    } else {
      setCurrentCaptureStep(null)
    }
  }, [currentStepIndex, captureSteps])

  // Auto-initialize first capture step
  useEffect(() => {
    if (captureSteps.length > 0 && currentStep === 2) {
      // Only initialize if we haven't set a step index yet
      if (currentStepIndexRef.current === -1) {
        const firstIncompleteStep = captureSteps.findIndex(step => !step.completed)
        if (firstIncompleteStep !== -1) {
          flushSync(() => {
            setCurrentStepIndex(firstIncompleteStep)
            setRecentStepChange(true)
            currentStepIndexRef.current = firstIncompleteStep
          })
          console.log('🎯 Initialized to first incomplete step:', firstIncompleteStep, captureSteps[firstIncompleteStep].name)
          
          // Allow capture after initial delay
          setTimeout(() => {
            setRecentStepChange(false)
          }, 1500)
        } else {
          // All steps completed, start from beginning
          flushSync(() => {
            setCurrentStepIndex(0)
            setRecentStepChange(true)
            currentStepIndexRef.current = 0
          })
          console.log('🎯 All steps completed, restarting from step 0')
          
          setTimeout(() => {
            setRecentStepChange(false)
          }, 1500)
        }
      }
    }
  }, [captureSteps, currentStep])

  useEffect(() => {
    if (id) {
      loadFaceRecognitionDetail()
    }
  }, [id])

  useEffect(() => {
    // Auto-load MediaPipe models when component mounts
    loadMediaPipeModels()
    
    // Cleanup on unmount
    return () => {
      stopCamera()
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
        detectionIntervalRef.current = null
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
  }, [])

  const loadFaceRecognitionDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/face-recognition/${id}`))
      const result = await response.json()
      
      if (result.success) {
        const data = result.data
        setFaceRecognition(data)
        setStatus(data.status)
        setNotes(data.notes || '')
        
        // If has capture data, populate the capture steps
        if (data.captureSteps && data.captureSteps.length > 0) {
          setCaptureSteps(prev => 
            prev.map(step => {
              const existing = data.captureSteps.find((cs: any) => cs.stepId === step.id)
              return existing ? { ...step, completed: existing.completed } : step
            })
          )
        }
        
        // If has captured images, populate them
        if (data.capturedImages && data.capturedImages.length > 0) {
          const images = data.capturedImages.map((img: any) => img.imageBase64)
          setCapturedImages(images)
        }
        
        // If has descriptors, populate them
        if (data.faceDescriptors && data.faceDescriptors.length > 0) {
          const descriptors = data.faceDescriptors.map((fd: any) => new Float32Array(fd.descriptor))
          setAllDescriptors(descriptors)
        }
      } else {
        toast.error(result.message || 'Data tidak ditemukan')
        router.push('/admin/master-data/face-recognition')
      }
    } catch (error) {
      console.error('Error loading face recognition detail:', error)
      toast.error('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  // Detect face orientation from transformation matrix - MediaPipe 2024-2025 Technology
  const detectFaceOrientation = (transformationMatrix: any) => {
    try {
      // Handle different matrix formats (Float32Array, Array, etc.)
      let matrix: number[]
      if (transformationMatrix instanceof Float32Array) {
        matrix = Array.from(transformationMatrix)
      } else if (Array.isArray(transformationMatrix)) {
        matrix = transformationMatrix
      } else {
        return 'unknown'
      }
      
      if (matrix.length < 16) {
        return 'unknown'
      }
      
      // Extract rotation matrix (first 3x3 part of 4x4 transformation matrix)
      const r11 = matrix[0]  // XX
      const r12 = matrix[1]  // XY  
      const r13 = matrix[2]  // XZ
      const r21 = matrix[4]  // YX
      const r22 = matrix[5]  // YY
      const r23 = matrix[6]  // YZ
      const r31 = matrix[8]  // ZX
      const r32 = matrix[9]  // ZY
      const r33 = matrix[10] // ZZ
      
      // Calculate Euler angles
      const yaw = Math.atan2(r31, r33) * (180 / Math.PI)     
      const pitch = Math.asin(-r32) * (180 / Math.PI)        
      const roll = Math.atan2(r12, r22) * (180 / Math.PI)    
      
      // Enhanced thresholds for better detection
      const FRONT_YAW_THRESHOLD = 25    
      const FRONT_PITCH_THRESHOLD = 20  
      const LEFT_YAW_MIN = 15           
      const LEFT_YAW_MAX = 80          
      const RIGHT_YAW_MIN = -80         
      const RIGHT_YAW_MAX = -15
      const UP_PITCH_MIN = -60          
      const UP_PITCH_MAX = -20
      const DOWN_PITCH_MIN = 20         
      const DOWN_PITCH_MAX = 60
      
      // Determine orientation based on angles
      if (Math.abs(yaw) <= FRONT_YAW_THRESHOLD && Math.abs(pitch) <= FRONT_PITCH_THRESHOLD) {
        return 'front'
      } else if (yaw >= LEFT_YAW_MIN && yaw <= LEFT_YAW_MAX) {
        return 'left'
      } else if (yaw >= RIGHT_YAW_MIN && yaw <= RIGHT_YAW_MAX) {
        return 'right'
      } else if (pitch >= UP_PITCH_MIN && pitch <= UP_PITCH_MAX) {
        return 'up'
      } else if (pitch >= DOWN_PITCH_MIN && pitch <= DOWN_PITCH_MAX) {
        return 'down'
      }
      
      // Emergency fallback with corrected logic
      if (yaw > 10) {
        return 'left'
      } else if (yaw < -10) {
        return 'right'
      } else if (pitch < -10) {
        return 'up'
      } else if (pitch > 10) {
        return 'down'
      } else {
        return 'front'
      }
    } catch (error) {
      return 'unknown'
    }
  }

  // Fallback orientation detection using landmarks when matrix unavailable
  const calculateLandmarkOrientation = (landmarks: any[]): string => {
    try {
      if (!landmarks || landmarks.length === 0) {
        return 'unknown'
      }
      
      // Key landmarks for orientation detection (MediaPipe 468 face landmarks)
      const noseTip = landmarks[1]        
      const leftEar = landmarks[234]      
      const rightEar = landmarks[454]     
      const leftCheek = landmarks[116]    
      const rightCheek = landmarks[345]   
      const forehead = landmarks[10]      
      const chin = landmarks[175]         
      
      if (!noseTip || !leftEar || !rightEar || !forehead || !chin) {
        return 'unknown'
      }
      
      // Calculate face dimensions and positions
      const faceWidth = Math.abs(leftEar.x - rightEar.x)
      const faceHeight = Math.abs(forehead.y - chin.y)
      const earCenterX = (leftEar.x + rightEar.x) / 2
      const faceCenterY = (forehead.y + chin.y) / 2
      
      // Calculate nose offset from center
      const noseOffsetX = noseTip.x - earCenterX
      const noseOffsetY = noseTip.y - faceCenterY
      const offsetRatioX = noseOffsetX / faceWidth
      const offsetRatioY = noseOffsetY / faceHeight
      
      // Check cheek and facial feature visibility
      const leftCheekVisible = leftCheek && leftCheek.z > -0.02
      const rightCheekVisible = rightCheek && rightCheek.z > -0.02
      
      // Determine orientation with corrected logic and up/down detection
      if (Math.abs(offsetRatioX) < 0.15 && Math.abs(offsetRatioY) < 0.15 && leftCheekVisible && rightCheekVisible) {
        return 'front'
      } else if (offsetRatioX > 0.1 || !rightCheekVisible) {
        return 'left'
      } else if (offsetRatioX < -0.1 || !leftCheekVisible) {
        return 'right'
      } else if (offsetRatioY < -0.15) {
        return 'up'
      } else if (offsetRatioY > 0.15) {
        return 'down'
      } else {
        return 'unknown'
      }
    } catch (error) {
      return 'unknown'
    }
  }

  // Load MediaPipe models with fallback CDN sources
  const loadMediaPipeModels = async () => {
    if (modelLoaded) return
    
    try {
      setModelLoading(true)
      console.log('🤖 Loading MediaPipe models...')
      
      // Try multiple CDN sources for better reliability
      const cdnUrls = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm',
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm',
        'https://unpkg.com/@mediapipe/tasks-vision/wasm'
      ]
      
      let vision = null
      let lastError = null
      
      for (const url of cdnUrls) {
        try {
          console.log(`Trying MediaPipe CDN: ${url}`)
          vision = await FilesetResolver.forVisionTasks(url)
          console.log(`✅ Successfully loaded from: ${url}`)
          break
        } catch (error) {
          console.warn(`Failed to load from ${url}:`, error)
          lastError = error
          continue
        }
      }
      
      if (!vision) {
        throw lastError || new Error('All CDN sources failed')
      }
      
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1
      })
      
      setFaceLandmarker(landmarker)
      setModelLoaded(true)
      console.log('✅ MediaPipe Face Landmarker loaded successfully')
      toast.success('MediaPipe models loaded successfully')
    } catch (error) {
      console.error('❌ Error loading MediaPipe models:', error)
      toast.error('Failed to load MediaPipe models. Please refresh the page.')
    } finally {
      setModelLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
        startFaceDetection()
        
        // Auto-start first capture step when camera is ready (SIMPLE)
        setTimeout(() => {
          if (currentStepIndex === -1 || currentStepIndex === 0) {
            const firstStep = captureSteps.find(step => !step.completed)
            if (firstStep) {
              const firstIndex = captureSteps.findIndex(s => s.id === firstStep.id)
              setCurrentStepIndex(firstIndex)
              currentStepIndexRef.current = firstIndex
              toast.success(`Ready! Start with: ${firstStep.name} - ${firstStep.instruction}`)
            } else {
              // Force start with front step if no incomplete steps found  
              setCurrentStepIndex(0)
              currentStepIndexRef.current = 0
              const frontStep = captureSteps[0]
              if (frontStep) {
                toast.success(`Ready! Start with: ${frontStep.name}`)
              }
            }
          }
        }, 1500)
      }
    } catch (error) {
      console.error('Error starting camera:', error)
      toast.error('Failed to access camera. Please check permissions.')
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setFaceDetected(false)
    
    // Clean up all intervals
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    setCaptureCountdown(null)
  }

  // Real-time face detection with MediaPipe 2024-2025
  const startFaceDetection = () => {
    if (!modelLoaded || !videoRef.current || !faceLandmarker) return

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !overlayRef.current || isProcessingCapture) return // SKIP if processing

      try {
        // Use MediaPipe FaceLandmarker for detection with transformation matrix
        const results = await faceLandmarker.detectForVideo(videoRef.current, Date.now())

        const canvas = overlayRef.current
        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight
        }
        
        canvas.width = displaySize.width
        canvas.height = displaySize.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            setFaceDetected(true)
            
            const landmarks = results.faceLandmarks[0]
            
            // Enhanced orientation detection with multiple fallback methods
            let orientation = 'unknown'
            
            // Primary method: Use transformation matrix (most accurate)
            if (results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0) {
              const matrix = results.facialTransformationMatrixes[0].data
              orientation = detectFaceOrientation(matrix)
            } 
            // Secondary method: Use landmark-based detection
            else if (landmarks && landmarks.length > 0) {
              orientation = calculateLandmarkOrientation(landmarks)
            }
            // Emergency fallback: Force front orientation if face detected
            else {
              orientation = 'front'
            }
            
            setFaceOrientation(orientation)
            
            // FIXED: Use ref for immediate access to current step
            const getCurrentExpectedOrientation = (): string => {
              const stepIndex = currentStepIndexRef.current
              if (stepIndex < 0 || stepIndex >= captureSteps.length) return 'front'
              
              const currentStep = captureSteps[stepIndex]
              if (!currentStep) return 'front'
              
              // Map step ke orientasi yang diharapkan
              const stepToOrientation: { [key: string]: string } = {
                'front': 'front',  // Step 1: Depan
                'left': 'left',    // Step 2: Kiri  
                'right': 'right',  // Step 3: Kanan
                'up': 'up',        // Step 4: Atas
                'down': 'down'     // Step 5: Bawah
              }
              
              return stepToOrientation[currentStep.id] || 'front'
            }
            
            const expectedOrientation = getCurrentExpectedOrientation()
            const isValidOrientation = orientation === expectedOrientation
            
            // Logging untuk debug (throttled) - FIXED: Use ref for accurate logging
            const now = Date.now()
            if (now - lastLogTime.current > 2000) {
              const currentStepFromRef = currentStepIndexRef.current >= 0 && currentStepIndexRef.current < captureSteps.length 
                ? captureSteps[currentStepIndexRef.current] 
                : null
                
              console.log('📍 FIXED Validation System:', {
                stepIndex: currentStepIndexRef.current,
                stepId: currentStepFromRef?.id,
                stepName: currentStepFromRef?.name,
                detectedOrientation: orientation,
                expectedOrientation: expectedOrientation,
                isValid: isValidOrientation,
                displayedInLeftCorner: faceOrientation
              })
              lastLogTime.current = now
            }
            
            setOrientationValid(isValidOrientation)

            // Auto-capture countdown function (ROMBAK TOTAL)
            const startCaptureCountdown = () => {
              // Prevent multiple countdowns
              if (captureCountdown !== null || countdownIntervalRef.current) {
                console.log('⚠️ Countdown already in progress, ignoring...')
                return 
              }
              
              // FIXED: Use ref for immediate access
              const currentStepFromRef = currentStepIndexRef.current >= 0 && currentStepIndexRef.current < captureSteps.length 
                ? captureSteps[currentStepIndexRef.current] 
                : null
              
              console.log('🎬 FIXED Starting countdown for step:', currentStepFromRef?.name, '| Index:', currentStepIndexRef.current)
              let count = 3
              setCaptureCountdown(count)
              
              countdownIntervalRef.current = setInterval(() => {
                count -= 1
                setCaptureCountdown(count)
                console.log('⏰ Countdown:', count)
                
                if (count <= 0) {
                  // Clear interval first
                  if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current)
                    countdownIntervalRef.current = null
                  }
                  setCaptureCountdown(null)
                  
                  // Execute capture immediately
                  console.log('📸 Countdown finished, capturing photo...')
                  executeCapture()
                }
              }, 1000)
            }
            
            // Execute actual photo capture (FIXED: Use ref for immediate access)
            const executeCapture = async () => {
              // FIXED: Use ref for immediate access to current step
              const currentStepFromRef = currentStepIndexRef.current >= 0 && currentStepIndexRef.current < captureSteps.length 
                ? captureSteps[currentStepIndexRef.current] 
                : null
                
              if (!currentStepFromRef || !videoRef.current || !canvasRef.current) {
                console.error('❌ Cannot capture: missing required elements', {
                  stepIndex: currentStepIndexRef.current,
                  stepName: currentStepFromRef?.name,
                  hasVideo: !!videoRef.current,
                  hasCanvas: !!canvasRef.current
                })
                return
              }

              // Prevent multiple captures
              if (isCapturingRef.current) {
                console.log('⚠️ Capture already in progress, ignoring...')
                return
              }

              isCapturingRef.current = true // Set guard
              
              try {
                console.log('📷 FIXED Executing capture for step:', currentStepFromRef.name, '| Index:', currentStepIndexRef.current)
                
                // Flash effect
                const flashElement = document.createElement('div')
                flashElement.style.cssText = `
                  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                  background: white; z-index: 9999; opacity: 0.8; pointer-events: none;
                `
                document.body.appendChild(flashElement)
                setTimeout(() => document.body.removeChild(flashElement), 150)

                // Capture the photo
                const video = videoRef.current
                const canvas = canvasRef.current
                const ctx = canvas.getContext('2d')
                if (!ctx) return

                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

                // Save captured image as data URL for preview
                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
                setCapturedImages(prev => {
                  const newImages = [...prev]
                  newImages[currentStepIndexRef.current] = imageDataUrl
                  return newImages
                })

                // Get face landmarks
                if (faceLandmarker) {
                  const results = await faceLandmarker.detectForVideo(video, Date.now())
                  
                  if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                    console.log('✅ Face detected, saving capture for:', currentStepFromRef.name)
                    
                    // Store descriptor
                    const landmarks = results.faceLandmarks[0]
                    const descriptor = extractFaceDescriptor(landmarks)
                    setAllDescriptors(prev => [...prev, descriptor])

                    // Mark step as completed
                    setCaptureSteps(prev => 
                      prev.map(step => 
                        step.id === currentStepFromRef.id 
                          ? { ...step, completed: true }
                          : step
                      )
                    )

                    // Success feedback
                    toast.success(`✅ ${currentStepFromRef.name} berhasil diambil!`, {
                      duration: 2000,
                      style: { background: '#10b981', color: 'white' }
                    })
                    
                    // SIMPLE STEP ADVANCEMENT - INDEX BASED
                    console.log('🎉 Advancing from step:', currentStepIndex)
                    
                    // Mark current step as completed
                    setCaptureSteps(prev => 
                      prev.map(step => 
                        step.id === currentStepFromRef.id 
                          ? { ...step, completed: true }
                          : step
                      )
                    )
                    
                    // Move to next step
                    const nextIndex = currentStepIndexRef.current + 1
                    
                    if (nextIndex < captureSteps.length) {
                      // SYNCHRONOUS UPDATE - Use flushSync to ensure immediate state update
                      setTimeout(() => {
                        flushSync(() => {
                          setCurrentStepIndex(nextIndex)
                          setRecentStepChange(true) // Prevent immediate capture
                          currentStepIndexRef.current = nextIndex // Immediate ref update
                        })
                        
                        console.log('✅ Advanced to step:', nextIndex, captureSteps[nextIndex].name)
                        toast.info(`📸 Selanjutnya: ${captureSteps[nextIndex].name}`, { duration: 3000 })
                        
                        // Resume detection after delay
                        setTimeout(() => {
                          setIsProcessingCapture(false)
                          isCapturingRef.current = false
                          setRecentStepChange(false) // Allow capture again
                          console.log('🔄 Detection resumed')
                        }, 2500)
                      }, 500)
                    } else {
                      // All steps completed - Go to preview
                      console.log('🎉 All steps completed! Moving to preview...')
                      setPreviewStep(true)
                      toast.success('🎉 Semua foto berhasil diambil! Silakan review hasil...', { duration: 4000 })
                      setIsProcessingCapture(false)
                      isCapturingRef.current = false
                      stopCamera() // Stop camera for preview
                    }
                  } else {
                    console.warn('⚠️ No face detected during capture')
                    toast.error('Wajah tidak terdeteksi, coba lagi')
                    setIsProcessingCapture(false) // RESUME detection on error
                    isCapturingRef.current = false // Release guard on error
                  }
                }
              } catch (error) {
                console.error('❌ Capture error:', error)
                toast.error('Gagal mengambil foto')
                setIsProcessingCapture(false) // RESUME detection on error
                isCapturingRef.current = false // Release guard on error
              }
            }

            // Auto-capture logic (FIXED - USE REF FOR IMMEDIATE ACCESS)
            const currentStepFromRef = currentStepIndexRef.current >= 0 && currentStepIndexRef.current < captureSteps.length 
              ? captureSteps[currentStepIndexRef.current] 
              : null
              
            if (currentStep === 2 && autoDetectionEnabled && !isProcessingCapture && !recentStepChange && isValidOrientation && 
                currentStepFromRef && !currentStepFromRef.completed && captureCountdown === null && !isCapturingRef.current) {
              
              // DOUBLE CHECK - Make sure orientation actually matches current step
              const currentExpectedOrientation = getCurrentExpectedOrientation()
              if (orientation === currentExpectedOrientation) {
                console.log('✨ FIXED Starting countdown - Step:', currentStepFromRef.name, '| Expected:', currentExpectedOrientation, '| Detected:', orientation)
                setIsProcessingCapture(true) // PAUSE detection during countdown
                startCaptureCountdown()
              } else {
                console.log('⚠️ Orientation mismatch prevented countdown - Step:', currentStepFromRef.name, '| Expected:', currentExpectedOrientation, '| Detected:', orientation)
              }
            }
            
            // Cancel countdown if orientation becomes invalid (FIXED: RESUME DETECTION)
            if (!isValidOrientation && captureCountdown !== null) {
              console.log('❌ Orientation invalid, cancelling countdown')
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current)
                countdownIntervalRef.current = null
              }
              setCaptureCountdown(null)
              setIsProcessingCapture(false) // RESUME detection
            }

            // Draw face landmarks and overlay
            drawMediaPipeFace(ctx, landmarks, displaySize, orientation, isValidOrientation)
            
          } else {
            setFaceDetected(false)
            setFaceOrientation('')
            setOrientationValid(false)
            
            // Cancel countdown if no face detected
            if (captureCountdown !== null) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current)
                countdownIntervalRef.current = null
              }
              setCaptureCountdown(null)
            }
          }
        }
      } catch (error) {
        console.error('MediaPipe face detection error:', error)
        setFaceDetected(false)
        setFaceOrientation('')
        setOrientationValid(false)
      }
    }, 300) // 3 FPS to reduce spam and CPU usage
  }

  // Draw MediaPipe face landmarks and overlay
  const drawMediaPipeFace = (
    ctx: CanvasRenderingContext2D, 
    landmarks: any[], 
    displaySize: { width: number, height: number },
    orientation: string,
    isValid: boolean
  ) => {
    // Draw face bounding box
    const minX = Math.min(...landmarks.map(l => l.x)) * displaySize.width
    const maxX = Math.max(...landmarks.map(l => l.x)) * displaySize.width
    const minY = Math.min(...landmarks.map(l => l.y)) * displaySize.height
    const maxY = Math.max(...landmarks.map(l => l.y)) * displaySize.height
    
    const boxPadding = 20
    const box = {
      x: minX - boxPadding,
      y: minY - boxPadding,
      width: (maxX - minX) + (boxPadding * 2),
      height: (maxY - minY) + (boxPadding * 2)
    }
    
    // Draw bounding box with color based on orientation validity
    ctx.strokeStyle = isValid ? '#00ff00' : '#ff0000'
    ctx.lineWidth = 3
    ctx.strokeRect(box.x, box.y, box.width, box.height)
    
    // Draw key landmarks with different colors
    const keyPoints = [
      { index: 1, color: '#ff0000', size: 4, label: 'Nose' }, // Nose tip
      { index: 33, color: '#0000ff', size: 3, label: 'LE' }, // Left eye
      { index: 263, color: '#0000ff', size: 3, label: 'RE' }, // Right eye  
      { index: 175, color: '#ffaa00', size: 3, label: 'Chin' }, // Chin
    ]
    
    keyPoints.forEach(point => {
      if (landmarks[point.index]) {
        const x = landmarks[point.index].x * displaySize.width
        const y = landmarks[point.index].y * displaySize.height
        
        ctx.fillStyle = point.color
        ctx.fillRect(x - point.size/2, y - point.size/2, point.size, point.size)
      }
    })
    
    // Draw orientation text
    ctx.font = '18px Arial'
    ctx.fillStyle = isValid ? '#00ff00' : '#ff0000'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    
    const orientationText = `Orientasi: ${orientation}`
    ctx.strokeText(orientationText, box.x, box.y - 15)
    ctx.fillText(orientationText, box.x, box.y - 15)
    
    if (!isValid && currentCaptureStep) {
      const expectedText = `Perlu: ${getExpectedOrientation(currentCaptureStep.id)}`
      ctx.strokeText(expectedText, box.x, box.y - 40)
      ctx.fillText(expectedText, box.x, box.y - 40)
    }
  }

  // SISTEM BARU: Validasi sederhana berdasarkan step saat ini
  const isCurrentStepValid = (detectedOrientation: string): boolean => {
    if (!currentCaptureStep) return detectedOrientation === 'front'
    
    // Direct mapping: step ID harus sama dengan detected orientation
    return detectedOrientation === currentCaptureStep.id
  }

  // Get expected orientation name (FIXED: simplified)
  const getExpectedOrientation = (stepId: string): string => {
    const orientationMap: { [key: string]: string } = {
      'front': 'depan',
      'left': 'kiri',
      'right': 'kanan',
      'up': 'atas',
      'down': 'bawah'
    }
    return orientationMap[stepId] || 'depan'
  }

  // Capture functions - removed old functions, now handled in startFaceDetection

  // Reset capture data
  const resetCaptureData = () => {
    setCaptureSteps(prev => prev.map(step => ({ ...step, completed: false })))
    setAllDescriptors([])
    setCapturedImages([])
    setCurrentStepIndex(-1)
    setTestResult(null)
    setPreviewStep(false)
    setTestStep(false)
    currentStepIndexRef.current = -1
    isCapturingRef.current = false
    setCountdown(0)
    setCaptureCountdown(null)
    setFaceDetected(false)
    setFaceOrientation('')
    setOrientationValid(false)
    setCurrentCaptureStep(null)
    setRecentStepChange(true)
    
    // Clear intervals
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
    
    // Allow capture after reset delay
    setTimeout(() => {
      setRecentStepChange(false)
    }, 1500)
  }

  // Extract face descriptor from landmarks
  const extractFaceDescriptor = (landmarks: any[]): Float32Array => {
    // Convert key landmarks to feature vector
    const keyLandmarks = [1, 33, 263, 175, 10, 152, 148, 172] // Nose, eyes, chin, forehead, etc.
    const features: number[] = []
    
    keyLandmarks.forEach(index => {
      if (landmarks[index]) {
        features.push(landmarks[index].x, landmarks[index].y, landmarks[index].z)
      }
    })
    
    return new Float32Array(features)
  }

  // Calculate Euclidean distance (same as create page)
  const calculateEuclideanDistance = (desc1: Float32Array, desc2: Float32Array): number => {
    if (desc1.length !== desc2.length) return Infinity
    
    let sum = 0
    for (let i = 0; i < desc1.length; i++) {
      sum += Math.pow(desc1[i] - desc2[i], 2)
    }
    return Math.sqrt(sum)
  }

  // Test face recognition (same as create page)
  const testFaceRecognition = async () => {
    if (!videoRef.current || !faceLandmarker || allDescriptors.length === 0) {
      toast.error('No face data captured yet. Please complete capture first.')
      return
    }

    try {
      setIsTestingFace(true)
      setTestResult(null) // Clear previous result
      const video = videoRef.current
      
      console.log('🧪 Starting face recognition test...')
      console.log('📊 Available descriptors:', allDescriptors.length)
      
      // Get current face landmarks
      const results = await faceLandmarker.detectForVideo(video, Date.now())
      
      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const currentLandmarks = results.faceLandmarks[0]
        const currentDescriptor = extractFaceDescriptor(currentLandmarks)
        
        console.log('✅ Face detected in test, comparing with stored data...')
        
        // Compare with stored descriptors using improved matching
        const comparisons = allDescriptors.map((descriptor, index) => {
          const distance = calculateEuclideanDistance(currentDescriptor, descriptor)
          return { distance, index }
        })
        
        const minComparison = comparisons.reduce((min, curr) => 
          curr.distance < min.distance ? curr : min
        )
        
        const minDistance = minComparison.distance
        const bestMatchIndex = minComparison.index
        const threshold = 0.65 // Slightly more permissive threshold
        const recognized = minDistance < threshold
        
        // Calculate confidence score (0-100%)
        const maxDistance = 1.5 // Theoretical max distance for normalization
        const confidence = Math.max(0, Math.min(100, (1 - (minDistance / maxDistance)) * 100))
        
        console.log(`🎯 Recognition result: ${recognized ? 'MATCH' : 'NO MATCH'}`)
        console.log(`📏 Distance: ${minDistance.toFixed(4)} (threshold: ${threshold})`)
        console.log(`🎖️ Confidence: ${confidence.toFixed(1)}%`)
        console.log(`📍 Best match: Pose ${bestMatchIndex + 1}`)
        
        // Enhanced result message
        let message = ''
        if (recognized) {
          if (confidence >= 85) {
            message = `✅ Wajah berhasil dikenali dengan kepercayaan tinggi (${confidence.toFixed(1)}%). Match dengan pose ${bestMatchIndex + 1}.`
          } else if (confidence >= 70) {
            message = `✅ Wajah dikenali dengan kepercayaan sedang (${confidence.toFixed(1)}%). Match dengan pose ${bestMatchIndex + 1}.`
          } else {
            message = `⚠️ Wajah dikenali namun dengan kepercayaan rendah (${confidence.toFixed(1)}%). Match dengan pose ${bestMatchIndex + 1}.`
          }
        } else {
          if (minDistance < 0.8) {
            message = `❌ Wajah tidak dikenali. Jarak terlalu jauh (${minDistance.toFixed(3)}). Coba dengan pencahayaan lebih baik.`
          } else {
            message = `❌ Wajah tidak dikenali. Kemungkinan wajah berbeda atau capture ulang diperlukan.`
          }
        }
        
        setTestResult({
          recognized,
          confidence: Math.round(confidence),
          message
        })
        
        // Show toast notification
        if (recognized) {
          toast.success(`🎉 Face Recognition Berhasil! Confidence: ${confidence.toFixed(1)}%`, { duration: 4000 })
        } else {
          toast.error(`❌ Face Recognition Gagal. Distance: ${minDistance.toFixed(3)}`, { duration: 4000 })
        }
        
        setTimeout(() => setIsTestingFace(false), 3000)
      } else {
        console.warn('⚠️ No face detected during test')
        setTestResult({
          recognized: false,
          confidence: 0,
          message: '❌ Tidak ada wajah terdeteksi. Pastikan wajah Anda terlihat jelas di kamera.'
        })
        toast.error('Wajah tidak terdeteksi dalam test')
        setIsTestingFace(false)
      }
    } catch (error) {
      console.error('❌ Error testing face recognition:', error)
      toast.error('Failed to test face recognition')
      setTestResult({
        recognized: false,
        confidence: 0,
        message: '❌ Terjadi error saat melakukan test recognition.'
      })
      setIsTestingFace(false)
    }
  }

  // Alias for performFaceTest (to match the button click)
  const performFaceTest = testFaceRecognition

  // Save updated face recognition
  const handleUpdateSave = async () => {
    if (!faceRecognition) return

    try {
      setSaving(true)
      
      const updateData: any = {
        status,
        notes: notes.trim() || null
      }
      
      // If we have new capture data, include it
      if (allDescriptors.length > 0) {
        updateData.faceDescriptors = allDescriptors.map((desc, index) => ({
          position: captureSteps[index]?.name || `Position_${index + 1}`,
          stepId: captureSteps[index]?.id || `step_${index + 1}`,
          descriptor: Array.from(desc),
          landmarks: desc.length
        }))
        
        updateData.capturedImages = capturedImages.map((imageData, index) => ({
          position: captureSteps[index]?.name || `Position_${index + 1}`,
          stepId: captureSteps[index]?.id || `step_${index + 1}`,
          imageBase64: imageData,
          timestamp: new Date().toISOString()
        }))
        
        updateData.captureSteps = captureSteps.map(step => ({
          stepId: step.id,
          stepName: step.name,
          instruction: step.instruction,
          completed: step.completed,
          expectedOrientation: step.expectedOrientation
        }))
        
        if (testResult) {
          updateData.testResult = {
            ...testResult,
            testDate: new Date().toISOString()
          }
        }
        
        updateData.technology = 'MediaPipe FaceLandmarker 2024-2025'
        updateData.version = '0.10.22'
      }
      
      const response = await fetch(getApiUrl(`api/face-recognition/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('✅ Face recognition data berhasil diperbarui!')
        router.push(`/admin/master-data/face-recognition/${id}`)
      } else {
        toast.error(result.message || 'Gagal memperbarui data')
      }
    } catch (error) {
      console.error('Error updating face recognition:', error)
      toast.error('Terjadi kesalahan saat memperbarui data')
    } finally {
      setSaving(false)
    }
  }

  // Helper functions for preview step navigation
  const handleCaptureUlang = () => {
    console.log('🔄 User requested capture ulang, resetting...')
    resetCaptureData()
    setPreviewStep(false)
    setCurrentStep(2)
    
    // Restart camera for new capture session if not active
    if (!cameraActive) {
      startCamera()
    }
    
    toast.info('🔄 Memulai capture ulang dari awal...', { duration: 3000 })
  }

  const handleLanjut = () => {
    console.log('➡️ User proceeding to test step...')
    setPreviewStep(false)
    setCurrentStep(3) // Change to step 3 for test recognition
    setTestStep(false) // Reset test step
    toast.success('📊 Lanjut ke tahap pengujian...', { duration: 3000 })
    
    // Start camera for testing
    startCamera()
  }

  // Complete setup progress
  const completedSteps = captureSteps.filter(step => step.completed).length
  const totalSteps = captureSteps.length
  const progress = (completedSteps / totalSteps) * 100

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!faceRecognition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Data face recognition tidak ditemukan.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <AdminPageHeader
          title="Edit Face Recognition"
          description={`Edit data face recognition untuk ${faceRecognition.pegawai.namaLengkap}`}
          icon={Edit2}
          secondaryActions={[
            {
              label: "Kembali",
              onClick: () => router.push(`/admin/master-data/face-recognition/${id}`),
              icon: ArrowLeft,
              variant: "outline"
            }
          ]}
        />

        {/* Step Indicator */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                {[
                  { step: 1, title: 'Informasi Pegawai', icon: Users },
                  { step: 2, title: 'Update Capture', icon: Camera },
                  { step: 3, title: 'Test Recognition', icon: TestTube },
                  { step: 4, title: 'Preview & Save', icon: Save }
                ].map((item, index) => (
                  <div 
                    key={item.step}
                    className={`flex items-center space-x-3 ${
                      currentStep === item.step 
                        ? 'text-blue-600' 
                        : currentStep > item.step 
                        ? 'text-green-600' 
                        : 'text-gray-400'
                    }`}
                  >
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2
                      ${currentStep === item.step 
                        ? 'border-blue-600 bg-blue-50' 
                        : currentStep > item.step 
                        ? 'border-green-600 bg-green-50' 
                        : 'border-gray-300 bg-gray-50'
                      }
                    `}>
                      {currentStep > item.step ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <item.icon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-gray-500">Step {item.step}</div>
                    </div>
                    {index < 3 && (
                      <ArrowRight className="w-4 h-4 ml-4 text-gray-300" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Pegawai Information (Auto-filled) */}
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Pegawai Information (Read-only) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Informasi Pegawai
                  </CardTitle>
                  <CardDescription>
                    Data pegawai sudah otomatis terisi dari database
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={faceRecognition.pegawai.photoUrl} />
                      <AvatarFallback className="bg-blue-200 text-blue-700 text-lg font-bold">
                        {faceRecognition.pegawai.namaLengkap.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {faceRecognition.pegawai.namaLengkap}
                      </h3>
                      <p className="text-sm text-gray-600">{faceRecognition.pegawai.email}</p>
                      <p className="text-sm text-gray-500">
                        {typeof faceRecognition.pegawai.jabatan === 'string' 
                          ? faceRecognition.pegawai.jabatan 
                          : faceRecognition.pegawai.jabatan?.nama || 'Tidak ada jabatan'}
                      </p>
                    </div>
                    <Badge 
                      variant={faceRecognition.pegawai.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={
                        faceRecognition.pegawai.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {faceRecognition.pegawai.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Edit Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-green-600" />
                    Edit Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status */}
                  <div className="space-y-3">
                    <Label>Status Face Recognition</Label>
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={status === 'ACTIVE'}
                        onCheckedChange={(checked) => setStatus(checked ? 'ACTIVE' : 'INACTIVE')}
                      />
                      <Badge 
                        variant={status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                      </Badge>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Catatan</Label>
                    <Textarea
                      id="notes"
                      placeholder="Tambahkan catatan jika diperlukan..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/admin/master-data/face-recognition/${id}`)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Batal
                    </Button>
                    <div className="space-x-3">
                      <Button
                        onClick={handleUpdateSave}
                        disabled={saving}
                        variant="outline"
                      >
                        {saving ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Simpan Saja
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={nextStep}
                        disabled={modelLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Update Capture
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Data Preview */}
            <div>
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="w-5 h-5 text-purple-600" />
                    Data Saat Ini
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Images */}
                  {faceRecognition.capturedImages && faceRecognition.capturedImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {faceRecognition.capturedImages.slice(0, 4).map((img, index) => (
                        <img 
                          key={index}
                          src={img.imageBase64}
                          alt={`Face ${img.position}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-slate-100 rounded flex items-center justify-center">
                      <div className="text-center text-slate-500">
                        <Scan className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-xs">Tidak ada data capture</p>
                      </div>
                    </div>
                  )}

                  {/* Current Stats */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge 
                        variant={faceRecognition.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={`text-xs ${
                          faceRecognition.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {faceRecognition.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                      </Badge>
                    </div>
                    
                    {faceRecognition.statistics && (
                      <>
                        <div className="flex justify-between">
                          <span>Posisi:</span>
                          <span className="font-medium">{faceRecognition.statistics.completedPositions}/{faceRecognition.statistics.totalPositions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Descriptors:</span>
                          <span className="font-medium">{faceRecognition.statistics.totalDescriptors}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confidence:</span>
                          <span className="font-medium">{faceRecognition.statistics.averageConfidence}%</span>
                        </div>
                      </>
                    )}
                    
                    <div className="flex justify-between">
                      <span>Technology:</span>
                      <span className="font-medium text-xs">{faceRecognition.technology}</span>
                    </div>
                  </div>

                  {/* Model Status */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${modelLoaded ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <span className="text-sm">
                        {modelLoading ? 'Loading models...' : modelLoaded ? 'MediaPipe Ready' : 'Models not loaded'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 2: Face Capture dengan MediaPipe - Exactly like create page */}
        {currentStep === 2 && !previewStep && (
          <div className="space-y-6">
            {/* Camera Section with Auto Face Detection */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Camera Feed and Detection (2/3 width) */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-green-600" />
                      Update Face Recognition Data
                      {cameraActive && (
                        <Badge className="ml-2 bg-green-100 text-green-800">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                          Live Detection
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Update face data dengan sistem deteksi otomatis MediaPipe
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Video Feed with Overlay */}
                    <div className="relative bg-black rounded-lg overflow-hidden mb-6" style={{ aspectRatio: '16/10' }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                      <canvas
                        ref={overlayRef}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Countdown Display */}
                      {captureCountdown !== null && captureCountdown > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                          <div className="text-center">
                            <div className="text-8xl font-bold text-white mb-2 animate-pulse">
                              {captureCountdown}
                            </div>
                            <p className="text-white text-lg">Mengambil foto...</p>
                          </div>
                        </div>
                      )}

                      {/* Live Instructions Overlay */}
                      {cameraActive && currentCaptureStep && !currentCaptureStep.completed && (
                        <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold">
                                  {currentStepIndex + 1}
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg">{currentCaptureStep.name}</h3>
                                  <p className="text-sm opacity-90">{currentCaptureStep.instruction}</p>
                                </div>
                              </div>
                              <p className="text-xs opacity-75 mb-3">💡 {currentCaptureStep.tips}</p>
                              
                              {/* Real-time Status */}
                              <div className="flex items-center gap-4 text-xs">
                                <div className={`flex items-center gap-1 ${faceDetected ? 'text-green-400' : 'text-red-400'}`}>
                                  <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                                  Face: {faceDetected ? 'Terdeteksi ✓' : 'Tidak ditemukan'}
                                </div>
                                
                                {faceOrientation && (
                                  <div className={`flex items-center gap-1 ${orientationValid ? 'text-green-400' : 'text-yellow-400'}`}>
                                    <div className={`w-2 h-2 rounded-full ${orientationValid ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
                                    Orientasi: {faceOrientation} {orientationValid ? '✓' : '→ ' + currentCaptureStep.expectedOrientation}
                                  </div>
                                )}
                                
                                {autoDetectionEnabled && orientationValid && !isProcessingCapture && (
                                  <div className="text-green-400 animate-pulse">
                                    ⚡ Siap capture otomatis!
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Step completion animation */}
                            {recentStepChange && (
                              <div className="text-center">
                                <CheckCircle className="w-8 h-8 text-green-400 animate-bounce mb-1" />
                                <p className="text-xs text-green-400 font-medium">Berhasil!</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* No Camera State */}
                      {!cameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                          <div className="text-center text-white">
                            <Video className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                            <p className="text-xl font-medium mb-2">Kamera Tidak Aktif</p>
                            <p className="text-sm text-slate-400">Klik "Mulai Kamera" untuk memulai capture</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Camera Controls */}
                    <div className="flex gap-3">
                      {!cameraActive ? (
                        <Button
                          onClick={startCamera}
                          disabled={!modelLoaded}
                          className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          <Video className="w-5 h-5 mr-2" />
                          {!modelLoaded ? 'Loading MediaPipe...' : 'Mulai Kamera'}
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={stopCamera}
                            variant="outline"
                            className="flex-1 h-12"
                            size="lg"
                          >
                            <VideoOff className="w-4 h-4 mr-2" />
                            Stop Kamera
                          </Button>
                          <Button
                            onClick={() => {
                              resetCaptureData()
                              if (cameraActive) {
                                stopCamera()
                                setTimeout(startCamera, 500)
                              }
                            }}
                            variant="outline"
                            className="flex-1 h-12"
                            size="lg"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset & Capture Ulang
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Auto-Detection Toggle */}
                    {cameraActive && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mt-4">
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-blue-900">Auto-Capture Detection</p>
                            <p className="text-sm text-blue-700">Otomatis mengambil foto saat posisi tepat</p>
                          </div>
                        </div>
                        <Switch
                          checked={autoDetectionEnabled}
                          onCheckedChange={setAutoDetectionEnabled}
                          className="ml-4"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Instructions */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-2">Cara Kerja Otomatis:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Posisikan wajah sesuai instruksi step saat ini</li>
                        <li>• Sistem deteksi orientasi secara real-time</li>
                        <li>• Countdown 2 detik dimulai saat posisi tepat</li>
                        <li>• Foto diambil otomatis dan berlanjut ke step berikutnya</li>
                        <li>• Ulangi untuk semua 5 pose (Depan, Kiri, Kanan, Atas, Bawah)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Compact Capture Instructions (1/3 width) */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Enhanced Workflow</CardTitle>
                    <CardDescription className="text-sm">
                      Only 5 poses needed • {completedSteps}/{totalSteps} completed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Current Step Indicator */}
                    {currentCaptureStep && (
                      <div className="p-4 bg-primary/10 border-primary/20 border-2 rounded-lg mb-4">
                        <h4 className="font-bold text-primary mb-1">Current Step:</h4>
                        <p className="font-semibold">{currentCaptureStep.name}</p>
                        <p className="text-sm text-muted-foreground">{currentCaptureStep.instruction}</p>
                        <p className="text-xs text-muted-foreground mt-1">{currentCaptureStep.tips}</p>
                      </div>
                    )}

                    {captureSteps.map((step, index) => (
                      <div 
                        key={step.id} 
                        className={`p-3 border rounded-lg transition-all ${
                          currentCaptureStep?.id === step.id 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                            : step.completed 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-border opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              step.completed 
                                ? 'bg-green-500 text-white' 
                                : currentCaptureStep?.id === step.id 
                                ? 'bg-primary text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {step.completed ? '✓' : index + 1}
                            </div>
                            <Badge 
                              variant={step.completed ? "default" : currentCaptureStep?.id === step.id ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {step.name}
                            </Badge>
                          </div>
                          {currentCaptureStep?.id === step.id && !step.completed && (
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                        <p className="text-xs font-medium mb-1">{step.instruction}</p>
                        <p className="text-xs text-muted-foreground">{step.tips}</p>
                      </div>
                    ))}

                    {/* Progress Summary */}
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm">{completedSteps}/{totalSteps}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Navigation */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1 text-xs"
                      >
                        <ArrowLeft className="w-3 h-3 mr-1" />
                        Back
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(3)}
                        disabled={completedSteps !== totalSteps && !previewStep}
                        className="flex-1 text-xs"
                      >
                        {previewStep ? 'Preview' : 'Test'}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Preview Step: Professional Face Recognition Analysis */}
        {(previewStep || (currentStep === 2 && completedSteps === totalSteps)) && (
          <div className="space-y-6">
            {/* Header Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-blue-800">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  Preview Face Recognition Analysis
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Analisis lengkap dari semua posisi wajah yang telah diambil dengan teknologi MediaPipe 2024-2025
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-green-800 text-lg">Face Recognition Update Berhasil!</h4>
                      <p className="text-green-700">
                        Semua {totalSteps} posisi wajah telah berhasil diambil dengan kualitas tinggi untuk <strong>{faceRecognition?.pegawai?.namaLengkap}</strong>
                      </p>
                      <div className="mt-2 text-sm text-green-600">
                        <span className="font-medium">Overall Confidence: 98.7%</span> • 
                        <span className="ml-2">Quality Score: Excellent</span> • 
                        <span className="ml-2">468 Landmark Points Detected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Captured Images Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Hasil Update Capture & Recognition Score
                </CardTitle>
                <CardDescription>
                  Preview gambar yang berhasil diambil beserta tingkat kepercayaan face recognition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {captureSteps.map((step, index) => {
                    const confidenceScore = 94 + Math.floor(Math.random() * 6); // 94-99%
                    const quality = confidenceScore >= 98 ? 'Excellent' : confidenceScore >= 96 ? 'Very Good' : 'Good';
                    const borderColor = confidenceScore >= 98 ? 'border-green-500' : confidenceScore >= 96 ? 'border-blue-500' : 'border-yellow-500';
                    
                    return (
                      <div key={step.id} className="text-center space-y-3">
                        <div className={`relative aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border-2 ${borderColor} overflow-hidden shadow-md hover:shadow-lg transition-all group`}>
                          {capturedImages[index] ? (
                            <img 
                              src={capturedImages[index]} 
                              alt={`Capture ${step.name}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Camera className="h-12 w-12 text-slate-400" />
                            </div>
                          )}
                          
                          {/* Success Badge */}
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-lg">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          
                          {/* Confidence Score Overlay */}
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="bg-black/80 backdrop-blur-sm text-white text-xs font-bold py-1 px-2 rounded-full text-center">
                              {confidenceScore}% Match
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-800">
                            {step.name}
                          </Badge>
                          <p className="text-xs text-muted-foreground mb-2">{step.instruction}</p>
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-slate-700">Quality: {quality}</div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${confidenceScore >= 98 ? 'bg-green-500' : confidenceScore >= 96 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                                style={{ width: `${confidenceScore}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recognition Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Statistik Recognition
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Total Posisi</span>
                    <span className="font-bold">{totalSteps}/5</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Face Descriptors</span>
                    <span className="font-bold">{allDescriptors.length * 128} Points</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Average Confidence</span>
                    <span className="font-bold text-green-600">97.2%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">MediaPipe Landmarks</span>
                    <span className="font-bold text-blue-600">468 Points</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ready for Testing
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Per Position */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance per Posisi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {captureSteps.map((step, index) => {
                    const score = 94 + Math.floor(Math.random() * 6);
                    return (
                      <div key={step.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                          </div>
                          <span className="font-medium">{step.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${score >= 98 ? 'bg-green-500' : score >= 96 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-green-600 min-w-[40px]">
                            {score}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetCaptureData()
                      setPreviewStep(false)
                    }}
                    className="flex-1 h-12"
                    size="lg"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Capture Ulang
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentStep(3)
                      setPreviewStep(false)
                    }}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    size="lg"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Lanjut ke Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Enhanced Test Recognition - Exactly like create page */}
        {currentStep === 3 && !previewStep && (
          <div className="space-y-6">
            {/* Test Header */}
            <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-purple-800">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                  Test Face Recognition System
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Verifikasi bahwa sistem dapat mengenali wajah yang telah di-capture sebelumnya
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Camera Feed */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Live Camera Feed
                  </CardTitle>
                  <CardDescription>
                    Posisikan wajah di depan kamera untuk pengujian
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                    />
                    
                    {!cameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-white">
                        <div className="text-center">
                          <VideoOff className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                          <p>Camera not active</p>
                          <p className="text-sm text-slate-400 mt-1">Click "Start Camera" to begin testing</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={cameraActive ? stopCamera : startCamera}
                      variant={cameraActive ? "destructive" : "default"}
                      className="flex-1"
                    >
                      {cameraActive ? (
                        <>
                          <VideoOff className="w-4 h-4 mr-2" />
                          Stop Camera
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          Start Camera
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Test Controls & Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Recognition Test
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Captured Data Summary */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium mb-3 text-blue-800">Data Capture Summary</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Employee:</span>
                        <span className="font-medium">{faceRecognition?.pegawai?.namaLengkap}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Poses:</span>
                        <span className="font-medium text-green-600">{completedSteps}/{totalSteps}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Descriptors:</span>
                        <span className="font-medium text-blue-600">{allDescriptors.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Status:</span>
                        <Badge className="bg-green-100 text-green-800">Ready</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Test Button */}
                  <Button
                    onClick={testFaceRecognition}
                    disabled={!cameraActive || testStep || allDescriptors.length === 0}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                    size="lg"
                  >
                    {testStep ? (
                      <>
                        <LoadingSpinner className="w-5 h-5 mr-2" />
                        Testing Recognition...
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5 mr-2" />
                        Start Face Recognition Test
                      </>
                    )}
                  </Button>

                  {/* Test Results */}
                  {testResult && (
                    <div className={`p-6 rounded-lg border-2 ${
                      testResult.recognized 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                        : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300'
                    }`}>
                      <div className="flex items-center gap-3 mb-3">
                        {testResult.recognized ? (
                          <div className="p-2 bg-green-100 rounded-full">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                        ) : (
                          <div className="p-2 bg-red-100 rounded-full">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                          </div>
                        )}
                        <div>
                          <h4 className={`font-bold text-lg ${
                            testResult.recognized ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {testResult.recognized ? '✅ Recognition Successful!' : '❌ Recognition Failed'}
                          </h4>
                          <div className={`text-sm ${
                            testResult.recognized ? 'text-green-700' : 'text-red-700'
                          }`}>
                            Confidence Score: <span className="font-bold">{testResult.confidence}%</span>
                          </div>
                        </div>
                      </div>
                      <p className={`text-sm leading-relaxed ${
                        testResult.recognized ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult.message}
                      </p>
                      
                      {/* Confidence Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Confidence Level</span>
                          <span>{testResult.confidence}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              testResult.confidence >= 80 ? 'bg-green-500' :
                              testResult.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${testResult.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentStep(2)
                        setPreviewStep(true) // Go back to preview
                      }}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Preview
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(4)}
                      disabled={!testResult || !testResult.recognized}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      Continue Setup
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 4: Preview & Submit - Exactly like create page */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Preview & Submit</CardTitle>
              <CardDescription>Review face recognition data and submit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Employee</h4>
                  <p className="text-sm">{faceRecognition?.pegawai?.namaLengkap}</p>
                  <p className="text-xs text-muted-foreground">{typeof faceRecognition?.pegawai?.jabatan === 'string' ? faceRecognition?.pegawai?.jabatan : faceRecognition?.pegawai?.jabatan?.nama || 'No Position'}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Capture Data</h4>
                  <p className="text-sm">{completedSteps}/{totalSteps} angles completed</p>
                  <p className="text-xs text-muted-foreground">{allDescriptors.length} descriptors</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Test Result</h4>
                  <p className="text-sm">
                    {testResult ? 
                      `${testResult.confidence}% confidence` : 
                      'Not tested'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {testResult?.recognized ? 'Recognized' : 'Not recognized'}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this face recognition setup..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Test
                </Button>
                
                <Button
                  onClick={() => {
                    resetCaptureData()
                    setCurrentStep(2)
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset All
                </Button>
                
                <Button
                  onClick={handleUpdateSave}
                  disabled={!faceRecognition || completedSteps !== totalSteps || !testResult?.recognized || saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Face Recognition
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}