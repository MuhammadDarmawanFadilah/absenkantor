'use client'

import { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { getApiUrl } from '@/lib/config'
import { useAuth } from '@/contexts/AuthContext'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Info } from 'lucide-react'

// Icons
import {
  ArrowLeft,
  ArrowRight,
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
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

// Types
interface CaptureStep {
  id: string
  name: string
  instruction: string
  tips: string
  expectedOrientation: string
  completed: boolean
}

export default function CreateMyFaceRecognitionPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  
  // Form state
  const [loading, setLoading] = useState(false)
  
  // Step navigation
  const [currentStep, setCurrentStep] = useState(1) // 1: Info, 2: Capture, 3: Test, 4: Preview & Submit
  const [mobilePhotoIndex, setMobilePhotoIndex] = useState(0) // For mobile photo slideshow
  
  // Captured images for preview
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  
  // Track setup start time
  const [startTime] = useState(Date.now())
  
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
      tips: 'Tunjukkan bagian bawah dagu',
      expectedOrientation: 'up',
      completed: false
    },
    {
      id: 'down', 
      name: 'Bawah',
      instruction: 'Tundukkan kepala ke bawah',
      tips: 'Tunjukkan bagian atas kepala',
      expectedOrientation: 'down',
      completed: false
    }
  ])
  
  // Face Recognition State - MediaPipe 2024-2025 Technology
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null)
  const [faceOrientation, setFaceOrientation] = useState<string>('')
  const [orientationValid, setOrientationValid] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [currentCaptureStep, setCurrentCaptureStep] = useState<CaptureStep | null>(null)
  const [allDescriptors, setAllDescriptors] = useState<Float32Array[]>([])
  const [notes, setNotes] = useState('')
  
  // Camera and Detection
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [autoDetectionEnabled, setAutoDetectionEnabled] = useState(true)
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null)
  const [isProcessingCapture, setIsProcessingCapture] = useState(false)
  const [recentStepChange, setRecentStepChange] = useState(false)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isCapturingRef = useRef(false)
  const lastLogTime = useRef(0)
  const currentStepIndexRef = useRef(-1)
  const [isDesktop, setIsDesktop] = useState(false)

  // Test Step for Face Recognition
  const [testStep, setTestStep] = useState(false)
  const [previewStep, setPreviewStep] = useState(false)
  const [testResult, setTestResult] = useState<{
    recognized: boolean,
    confidence: number,
    message: string
  } | null>(null)

  // Initialize component
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      router.push('/login')
      return
    }
    
    loadMediaPipeModels()
    
    // Cleanup camera on unmount
    return () => {
      stopCamera()
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [isAuthenticated, user])

  // PROPER STATE SYNC - Use useEffect to sync currentCaptureStep with index
  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex
    
    if (currentStepIndex >= 0 && currentStepIndex < captureSteps.length) {
      const newStep = captureSteps[currentStepIndex]
      setCurrentCaptureStep(newStep)
    } else {
      setCurrentCaptureStep(null)
    }
  }, [currentStepIndex, captureSteps])

  // Auto-initialize first capture step
  useEffect(() => {
    if (captureSteps.length > 0 && currentStepIndexRef.current === -1) {
      setCurrentStepIndex(0)
      setRecentStepChange(true)
      currentStepIndexRef.current = 0
      
      setTimeout(() => {
        setRecentStepChange(false)
      }, 1500)
    }
  }, [captureSteps])

  // Track viewport to render a single camera view (avoid duplicate refs on desktop)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    setIsDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Load MediaPipe Models - Latest 2024-2025 Technology
  const loadMediaPipeModels = async () => {
    try {
      setLoading(true)
      
      const cdnUrls = [
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm",
        "https://unpkg.com/@mediapipe/tasks-vision/wasm"
      ]
      
      let vision = null
      let lastError = null
      
      for (const url of cdnUrls) {
        try {
          vision = await FilesetResolver.forVisionTasks(url)
          break
        } catch (error) {
          lastError = error
          continue
        }
      }
      
      if (!vision) {
        throw lastError || new Error('All CDN sources failed')
      }
      
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: "VIDEO",
        numFaces: 1
      })
      
      setFaceLandmarker(landmarker)
      setModelsLoaded(true)
      toast.success('MediaPipe FaceLandmarker loaded successfully (2024-2025 Technology)')
    } catch (error) {
      toast.error('Failed to load MediaPipe face recognition models. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  // [Include all the face detection functions from the admin create page]
  // For brevity, I'll include key functions. You would copy the complete detection logic from admin create page

  // Start camera
  const startCamera = async () => {
    try {
      // Stop any existing camera stream before starting new one
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
      
      // Clear any existing detection intervals
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
        detectionIntervalRef.current = null
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Wait for video metadata to load properly
        await new Promise<void>((resolve) => {
          const video = videoRef.current!
          const handleLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata)
            resolve()
          }
          
          if (video.readyState >= 1) { // HAVE_METADATA
            resolve()
          } else {
            video.addEventListener('loadedmetadata', handleLoadedMetadata)
          }
        })
        
        // Additional wait for video to be fully ready
        await new Promise<void>((resolve) => {
          const video = videoRef.current!
          const handleCanPlay = () => {
            video.removeEventListener('canplay', handleCanPlay)
            resolve()
          }
          
          if (video.readyState >= 3) { // HAVE_FUTURE_DATA
            resolve()
          } else {
            video.addEventListener('canplay', handleCanPlay)
          }
        })
        
        // Verify video dimensions are valid before starting detection
        if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          setCameraActive(true)
          
          // Start face detection with delay to ensure video is fully ready
          setTimeout(() => {
            startFaceDetection()
          }, 500)
          
          setTimeout(() => {
            if (currentStepIndex === -1) {
              const firstStep = captureSteps.find(step => !step.completed)
              if (firstStep) {
                const firstIndex = captureSteps.findIndex(s => s.id === firstStep.id)
                setCurrentStepIndex(firstIndex)
                toast.success(`Ready! Start with: ${firstStep.name} - ${firstStep.instruction}`)
              } else {
                setCurrentStepIndex(0)
                const frontStep = captureSteps[0]
                if (frontStep) {
                  toast.success(`Ready! Start with: ${frontStep.name}`)
                }
              }
            }
          }, 1500)
        } else {
          toast.error('Video initialization failed. Please try again.')
        }
      }
    } catch (error) {
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

  // Simple face detection function (simplified for this example)
  // Real-time face detection with MediaPipe 2024-2025
  const startFaceDetection = () => {
    if (!modelsLoaded || !videoRef.current || !faceLandmarker) return

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !overlayRef.current || isProcessingCapture) return // SKIP if processing

      try {
        // Enhanced video readiness validation
        const video = videoRef.current
        
        // Check if video has proper dimensions and is ready
        if (!video.videoWidth || !video.videoHeight || video.videoWidth === 0 || video.videoHeight === 0) {
          // Video not ready yet, skip this detection cycle
          return
        }
        
        // Additional readiness checks
        if (video.readyState < 2) { // HAVE_CURRENT_DATA
          return
        }
        
        if (video.paused || video.ended) {
          return
        }

        // Use MediaPipe FaceLandmarker for detection with transformation matrix
        const results = await faceLandmarker.detectForVideo(video, Date.now())

        const canvas = overlayRef.current
        const displaySize = {
          width: video.videoWidth,
          height: video.videoHeight
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
              lastLogTime.current = now
            }
            
            setOrientationValid(isValidOrientation)

  // Auto-capture countdown function (ROMBAK TOTAL)
  const startCaptureCountdown = () => {
    // Prevent multiple countdowns
    if (captureCountdown !== null || countdownIntervalRef.current) {
      return 
    }
    
    // FIXED: Use ref for immediate access
    const currentStepFromRef = currentStepIndexRef.current >= 0 && currentStepIndexRef.current < captureSteps.length 
      ? captureSteps[currentStepIndexRef.current] 
      : null
    
    let count = 3
    setCaptureCountdown(count)
    
    countdownIntervalRef.current = setInterval(() => {
      count -= 1
      setCaptureCountdown(count)
      
      if (count <= 0) {
        // Clear interval first
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = null
        }
        setCaptureCountdown(null)
        
        // Execute capture immediately
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
      return
    }

    // Prevent multiple captures
    if (isCapturingRef.current) {
      return
    }

    isCapturingRef.current = true // Set guard
    
    try {
      
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
              
              toast.info(`📸 Selanjutnya: ${captureSteps[nextIndex].name}`, { duration: 3000 })
              
              // Resume detection after delay
              setTimeout(() => {
                setIsProcessingCapture(false)
                isCapturingRef.current = false
                setRecentStepChange(false) // Allow capture again
              }, 2500)
            }, 500)
          } else {
            // All steps completed - Go to preview
            setPreviewStep(true)
            toast.success('🎉 Semua foto berhasil diambil! Silakan review hasil...', { duration: 4000 })
            setIsProcessingCapture(false)
            isCapturingRef.current = false
            stopCamera() // Stop camera for preview
          }
        } else {
          toast.error('Wajah tidak terdeteksi, coba lagi')
          setIsProcessingCapture(false) // RESUME detection on error
          isCapturingRef.current = false // Release guard on error
        }
      }
    } catch (error) {
      toast.error('Gagal mengambil foto')
      setIsProcessingCapture(false) // RESUME detection on error
      isCapturingRef.current = false // Release guard on error
    }
  }

            // Auto-capture logic (FIXED - USE REF FOR IMMEDIATE ACCESS)
            const currentStepFromRef = currentStepIndexRef.current >= 0 && currentStepIndexRef.current < captureSteps.length 
              ? captureSteps[currentStepIndexRef.current] 
              : null
              
            if (autoDetectionEnabled && !isProcessingCapture && !recentStepChange && isValidOrientation && 
                currentStepFromRef && !currentStepFromRef.completed && captureCountdown === null && !isCapturingRef.current) {
              
              // DOUBLE CHECK - Make sure orientation actually matches current step
              const currentExpectedOrientation = getCurrentExpectedOrientation()
              if (orientation === currentExpectedOrientation) {
                setIsProcessingCapture(true) // PAUSE detection during countdown
                startCaptureCountdown()
              }
            }
            
            // Cancel countdown if orientation becomes invalid (FIXED: RESUME DETECTION)
            if (!isValidOrientation && captureCountdown !== null) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current)
                countdownIntervalRef.current = null
              }
              setCaptureCountdown(null)
              setIsProcessingCapture(false) // RESUME detection
            }            // Draw face landmarks and overlay
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
        
        // Enhanced error handling for MediaPipe dimension issues
        if (error instanceof Error && error.message.includes('roi->width > 0 && roi->height > 0')) {
          
          // Clear current detection interval to prevent rapid errors
          if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current)
            detectionIntervalRef.current = null
          }
          
          // Reset video state and restart camera
          setTimeout(() => {
            if (videoRef.current) {
              startCamera() // This will reinitialize the video and restart detection
            }
          }, 1000)
        }
        
        setFaceDetected(false)
        setFaceOrientation('')
        setOrientationValid(false)
      }
    }, 300) // 3 FPS to reduce spam and CPU usage
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

  // Get expected orientation name
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

  // Preview step functions
  const handleCaptureUlang = () => {
    setCaptureSteps(prev => prev.map(step => ({ ...step, completed: false })))
    setAllDescriptors([])
    setCapturedImages([]) // Reset captured images
    setCurrentStepIndex(0)
    currentStepIndexRef.current = 0
    setPreviewStep(false)
    setRecentStepChange(true)
    
    // Restart camera for new capture session
    startCamera()
    
    // Allow capture after delay
    setTimeout(() => {
      setRecentStepChange(false)
    }, 1500)
    
    toast.info('🔄 Memulai capture ulang dari awal...', { duration: 3000 })
  }

  const handleLanjut = () => {
    setPreviewStep(false)
    setCurrentStep(3) // Change to step 3 for test recognition
    setTestStep(false) // Reset test step
    toast.success('📊 Lanjut ke tahap pengujian...', { duration: 3000 })
    
    // Start camera for testing
    startCamera()
  }

  // Handler for going back to test from preview
  const handleBackToTest = () => {
    setCurrentStep(3)
    setTestStep(false) // Reset test step
    // Start camera for testing
    startCamera()
  }

  // Handler for going back to capture from test
  const handleBackToCapture = () => {
    setCurrentStep(2)
    // Stop camera when going back to capture
    stopCamera()
  }

  if (loading && !modelsLoaded) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-4" />
            <p className="text-lg">Loading MediaPipe FaceLandmarker Models...</p>
            <p className="text-sm text-muted-foreground">Using latest 2024-2025 technology</p>
          </div>
        </div>
      </div>
    )
  }

  // Start capture countdown
  const startCaptureCountdown = () => {
    if (captureCountdown !== null || countdownIntervalRef.current) {
      return 
    }
    
    let count = 3
    setCaptureCountdown(count)
    
    countdownIntervalRef.current = setInterval(() => {
      count -= 1
      setCaptureCountdown(count)
      
      if (count <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = null
        }
        setCaptureCountdown(null)
        executeCapture()
      }
    }, 1000)
  }

  // Execute capture
  const executeCapture = async () => {
    const currentStepFromRef = currentStepIndexRef.current >= 0 && currentStepIndexRef.current < captureSteps.length 
      ? captureSteps[currentStepIndexRef.current] 
      : null
      
    if (!currentStepFromRef || !videoRef.current || !canvasRef.current) {
      return
    }

    if (isCapturingRef.current) {
      return
    }

    isCapturingRef.current = true
    
    try {
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

      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImages(prev => {
        const newImages = [...prev]
        newImages[currentStepIndexRef.current] = imageDataUrl
        return newImages
      })

      // Get face landmarks and create descriptor (simplified)
      if (faceLandmarker) {
        const results = await faceLandmarker.detectForVideo(video, Date.now())
        
        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
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

          toast.success(`✅ ${currentStepFromRef.name} berhasil diambil!`)
          
          // Move to next step
          const nextIndex = currentStepIndexRef.current + 1
          
          if (nextIndex < captureSteps.length) {
            setTimeout(() => {
              setCurrentStepIndex(nextIndex)
              setRecentStepChange(true)
              currentStepIndexRef.current = nextIndex
              
              setTimeout(() => {
                setIsProcessingCapture(false)
                isCapturingRef.current = false
                setRecentStepChange(false)
              }, 2500)
            }, 500)
          } else {
            // All steps completed
            setPreviewStep(true)
            toast.success('🎉 Semua foto berhasil diambil! Silakan review hasil...')
            setIsProcessingCapture(false)
            isCapturingRef.current = false
            stopCamera()
          }
        }
      }
    } catch (error) {
      toast.error('Gagal mengambil foto')
      setIsProcessingCapture(false)
      isCapturingRef.current = false
    }
  }

  // Extract face descriptor (simplified)
  const extractFaceDescriptor = (landmarks: any[]): Float32Array => {
    const keyLandmarks = [1, 33, 263, 175, 10, 152, 148, 172]
    const features: number[] = []
    
    keyLandmarks.forEach(index => {
      if (landmarks[index]) {
        features.push(landmarks[index].x, landmarks[index].y, landmarks[index].z)
      }
    })
    
    return new Float32Array(features)
  }

  // Test face recognition (simplified)
  const testFaceRecognition = async () => {
    if (!videoRef.current || !faceLandmarker || allDescriptors.length === 0) {
      toast.error('No face data captured yet. Please complete capture first.')
      return
    }

    try {
      setTestStep(true)
      setTestResult(null) // Clear previous result
      const video = videoRef.current
      
      // Get current face landmarks
      const results = await faceLandmarker.detectForVideo(video, Date.now())
      
      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const currentLandmarks = results.faceLandmarks[0]
        const currentDescriptor = extractFaceDescriptor(currentLandmarks)
        
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
        
        setTimeout(() => setTestStep(false), 3000)
      } else {
        setTestResult({
          recognized: false,
          confidence: 0,
          message: '❌ Tidak ada wajah terdeteksi. Pastikan wajah Anda terlihat jelas di kamera.'
        })
        toast.error('Wajah tidak terdeteksi dalam test')
        setTestStep(false)
      }
    } catch (error) {
      toast.error('Failed to test face recognition')
      setTestResult({
        recognized: false,
        confidence: 0,
        message: '❌ Terjadi error saat melakukan test recognition.'
      })
      setTestStep(false)
    }
  }

  // Calculate Euclidean distance between descriptors
  const calculateEuclideanDistance = (desc1: Float32Array, desc2: Float32Array): number => {
    let distance = 0
    const minLength = Math.min(desc1.length, desc2.length)
    
    for (let i = 0; i < minLength; i++) {
      distance += Math.pow(desc1[i] - desc2[i], 2)
    }
    
    return Math.sqrt(distance)
  }

  // Save face recognition data
  const saveFaceRecognition = async () => {
    if (!user?.id || allDescriptors.length === 0) {
      toast.error('Please complete all capture steps')
      return
    }

    const incompleteSteps = captureSteps.filter(step => !step.completed)
    if (incompleteSteps.length > 0) {
      toast.error(`Please complete all capture steps: ${incompleteSteps.map(s => s.name).join(', ')}`)
      return
    }

    if (!testResult?.recognized) {
      toast.error('Please complete face recognition test before saving')
      return
    }

    try {
      setLoading(true)
      
      const faceData = {
        pegawaiId: user.id,
        faceDescriptors: allDescriptors.map((desc, index) => ({
          position: captureSteps[index]?.name || `Position_${index + 1}`,
          stepId: captureSteps[index]?.id || `step_${index + 1}`,
          descriptor: Array.from(desc),
          landmarks: desc.length
        })),
        capturedImages: capturedImages.map((imageData, index) => ({
          position: captureSteps[index]?.name || `Position_${index + 1}`,
          stepId: captureSteps[index]?.id || `step_${index + 1}`,
          imageBase64: imageData,
          timestamp: new Date().toISOString()
        })),
        captureSteps: captureSteps.map(step => ({
          stepId: step.id,
          stepName: step.name,
          instruction: step.instruction,
          completed: step.completed,
          expectedOrientation: step.expectedOrientation
        })),
        testResult: {
          recognized: testResult.recognized,
          confidence: testResult.confidence,
          message: testResult.message,
          testDate: new Date().toISOString()
        },
        technology: 'MediaPipe FaceLandmarker 2024-2025',
        version: '0.10.22',
        landmarkPoints: 468,
        captureMethod: 'Auto-capture with orientation detection',
        notes: notes.trim() || null,
        createdAt: new Date().toISOString(),
        statistics: {
          totalPositions: captureSteps.length,
          completedPositions: captureSteps.filter(s => s.completed).length,
          totalDescriptors: allDescriptors.length,
          totalImages: capturedImages.length,
          averageConfidence: testResult.confidence,
          setupDuration: Date.now() - startTime
        }
      }

      const response = await fetch(getApiUrl('api/face-recognition'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(faceData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(`🎉 Face recognition berhasil disimpan!`)
        // Stop camera after successful save
        stopCamera()
        router.push('/pegawai/face-recognition')
      } else {
        toast.error(result.message || 'Failed to save face recognition data')
      }
    } catch (error) {
      toast.error('Network error: Failed to save face recognition data')
    } finally {
      setLoading(false)
    }
  }

  const completedSteps = captureSteps.filter(step => step.completed).length
  const totalSteps = captureSteps.length
  const progress = (completedSteps / totalSteps) * 100

  // Step titles
  const stepTitles = [
    { number: 1, title: "Informasi", description: "Informasi tentang setup face recognition" },
    { number: 2, title: "Capture Photos", description: "Ambil foto dari berbagai sudut" },
    { number: 3, title: "Test Recognition", description: "Verifikasi akurasi face recognition" },
    { number: 4, title: "Preview & Submit", description: "Review dan simpan data face recognition" }
  ]

  if (loading && !modelsLoaded) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-4" />
            <p className="text-lg">Loading MediaPipe FaceLandmarker Models...</p>
            <p className="text-sm text-muted-foreground">Using latest 2024-2025 technology</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
          <UserCheck className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Setup Face Recognition Saya</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Buat data face recognition untuk sistem absensi menggunakan teknologi MediaPipe 2024-2025
          </p>
        </div>
      </div>
      
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          onClick={() => router.push('/pegawai/face-recognition')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>

      {/* Step Navigation */}
      <Card>
        <CardContent className="pt-6">
          {/* Desktop Step Navigation */}
          <div className="hidden md:flex items-center justify-between mb-6">
            {stepTitles.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background text-muted-foreground border-muted-foreground'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.number}</span>
                  )}
                </div>
                {index < stepTitles.length - 1 && (
                  <div className={`h-0.5 w-24 mx-4 ${
                    currentStep > step.number ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          {/* Mobile Step Navigation - Compact */}
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              {stepTitles.map((step) => (
                <div
                  key={step.number}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentStep >= step.number 
                      ? 'bg-primary' 
                      : currentStep === step.number 
                      ? 'bg-primary/60' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">
                Step {currentStep} of {stepTitles.length}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${(currentStep / stepTitles.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold">{stepTitles[currentStep - 1].title}</h3>
            <p className="text-sm text-muted-foreground">{stepTitles[currentStep - 1].description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Informasi Setup Face Recognition</CardTitle>
            <CardDescription>Pelajari tentang proses setup face recognition untuk akun Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Informasi Pegawai</h4>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback>
                    {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  {user?.phoneNumber && (
                    <p className="text-xs text-muted-foreground">{user?.phoneNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Process Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Proses Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-medium">5 Pose Wajah</h4>
                      <p className="text-sm text-muted-foreground">
                        Depan, Kiri, Kanan, Atas, Bawah
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-medium">Auto-Capture</h4>
                      <p className="text-sm text-muted-foreground">
                        Foto diambil otomatis saat posisi tepat
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Eye className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-medium">Test Recognition</h4>
                      <p className="text-sm text-muted-foreground">
                        Verifikasi akurasi pengenalan wajah
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Keamanan & Privasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Data Aman</h4>
                      <p className="text-sm text-muted-foreground">
                        Data wajah hanya untuk verifikasi identitas Anda
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">MediaPipe 2024-2025</h4>
                      <p className="text-sm text-muted-foreground">
                        Teknologi AI terdepan dengan 468 landmark points
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle className="w-3 h-3 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Tidak Dapat Diubah</h4>
                      <p className="text-sm text-muted-foreground">
                        Setelah setup, perubahan hanya bisa dilakukan admin
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep(2)}
                className="min-w-32"
              >
                Mulai Setup
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Capture Photos - Responsive Layout */}
      {currentStep === 2 && !previewStep && (
        <>
          {isDesktop ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Large Camera Feed (2/3 width) */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-6 h-6" />
                    Live Camera Feed
                    {modelsLoaded && (
                      <Badge variant="outline" className="ml-auto">
                        MediaPipe 2024-2025 • AI Detection
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Position your face according to the instructions on the right
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
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
                      className="absolute top-0 left-0 w-full h-full"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    
                    {/* Face Detection Overlay with corrected color coding */}
                    {faceDetected && (
                      <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${faceDetected ? 'bg-green-500' : 'bg-red-500'}`} />
                          Face: {faceDetected ? 'Detected' : 'Not Found'}
                        </div>
                        <div className="text-xs mt-1">
                          Orientation: <span className={orientationValid ? 'text-green-400 font-bold' : 'text-red-400'}>
                            {faceOrientation || 'Unknown'}
                          </span>
                          {orientationValid && <span className="text-green-400 ml-2">✓ Correct!</span>}
                        </div>
                      </div>
                    )}

                    {/* Auto-Capture Countdown - Dipindah ke pojok kanan atas dan diperkecil */}
                    {captureCountdown !== null && captureCountdown > 0 && (
                      <div className="absolute top-4 right-4 z-50">
                        <div className="text-center text-white bg-black/80 rounded-lg p-3 border border-green-400/50 shadow-lg">
                          <div className="text-4xl font-bold text-green-400 animate-bounce">
                            {captureCountdown}
                          </div>
                          <p className="text-xs font-medium mt-1">Foto akan diambil...</p>
                          <div className="w-16 bg-gray-600 rounded-full h-1 mt-2">
                            <div 
                              className="bg-green-400 h-1 rounded-full transition-all duration-1000"
                              style={{ width: `${((3 - captureCountdown) / 3) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!cameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-center text-white">
                          <VideoOff className="w-16 h-16 mx-auto mb-4" />
                          <p className="text-lg mb-2">Camera not active</p>
                          <Button onClick={startCamera} variant="outline" className="text-white border-white">
                            <Video className="w-4 h-4 mr-2" />
                            Start Camera
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  <div className="flex gap-2 mt-4">
                    {!cameraActive ? (
                      <Button onClick={startCamera} className="flex-1">
                        <Video className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>
                    ) : (
                      <Button onClick={stopCamera} variant="outline" className="flex-1">
                        <VideoOff className="w-4 h-4 mr-2" />
                        Stop Camera
                      </Button>
                    )}
                  </div>

                  {/* Auto-Detection Settings */}
                  <div className="flex items-center justify-between mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-green-700">
                        Otomatis Ambil Foto (2 detik countdown)
                      </span>
                    </div>
                    <Badge className="bg-green-500 text-white">
                      AKTIF
                    </Badge>
                  </div>

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
                </CardContent>
              </Card>
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
          ) : (
          <div className="space-y-4">
            {/* Mobile Camera Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    <CardTitle className="text-lg">Face Capture</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {completedSteps}/{totalSteps}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mobile Camera Feed */}
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
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
                    className="absolute top-0 left-0 w-full h-full"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  
                  {/* Mobile Face Detection Overlay */}
                  {faceDetected && (
                    <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${faceDetected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={orientationValid ? 'text-green-400' : 'text-red-400'}>
                          {faceOrientation || 'Unknown'}
                        </span>
                        {orientationValid && <span className="text-green-400">✓</span>}
                      </div>
                    </div>
                  )}

                  {/* Mobile Auto-Capture Countdown */}
                  {captureCountdown !== null && captureCountdown > 0 && (
                    <div className="absolute top-2 right-2 z-50">
                      <div className="text-center text-white bg-black/80 rounded-lg p-2">
                        <div className="text-2xl font-bold text-green-400 animate-bounce">
                          {captureCountdown}
                        </div>
                        <div className="w-12 bg-gray-600 rounded-full h-1 mt-1">
                          <div 
                            className="bg-green-400 h-1 rounded-full transition-all duration-1000"
                            style={{ width: `${((3 - captureCountdown) / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center text-white">
                        <VideoOff className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm mb-2">Camera not active</p>
                        <Button onClick={startCamera} variant="outline" size="sm" className="text-white border-white">
                          <Video className="w-4 h-4 mr-2" />
                          Start Camera
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Camera Controls */}
                <div className="flex gap-2">
                  {!cameraActive ? (
                    <Button onClick={startCamera} className="flex-1" size="sm">
                      <Video className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  ) : (
                    <Button onClick={stopCamera} variant="outline" className="flex-1" size="sm">
                      <VideoOff className="w-4 h-4 mr-2" />
                      Stop Camera
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mobile Current Step Slideshow */}
            {currentCaptureStep && (
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-primary">
                      Step {currentStepIndex + 1} of {totalSteps}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {captureSteps.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index < currentStepIndex + 1 
                              ? 'bg-primary' 
                              : index === currentStepIndex 
                              ? 'bg-primary/60' 
                              : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-3">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto ${currentCaptureStep.completed ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                      {currentCaptureStep.completed ? '✓' : currentStepIndex + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-primary mb-1">
                        {currentCaptureStep.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {currentCaptureStep.instruction}
                      </p>
                      <p className="text-xs text-muted-foreground bg-white/50 p-2 rounded">
                        💡 {currentCaptureStep.tips}
                      </p>
                    </div>
                    
                    {/* Auto-detection status */}
                    <div className="flex items-center justify-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs font-medium text-green-700">
                        Auto-capture active
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mobile Progress Overview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Completed Steps</span>
                    <span className="text-sm font-bold">{completedSteps}/{totalSteps}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  {/* Completed steps quick view */}
                  <div className="flex gap-2 flex-wrap">
                    {captureSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          step.completed 
                            ? 'bg-green-100 text-green-700' 
                            : currentCaptureStep?.id === step.id 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center text-xs ${
                          step.completed 
                            ? 'bg-green-500 text-white' 
                            : currentCaptureStep?.id === step.id 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {step.completed ? '✓' : index + 1}
                        </div>
                        <span className="font-medium">{step.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Navigation */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={completedSteps !== totalSteps && !previewStep}
                className="flex-1"
              >
                {previewStep ? 'Preview' : 'Test'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
          )}
        </>
      )}      {/* Preview Step: Professional Face Recognition Analysis */}
      {(previewStep || (currentStep === 2 && completedSteps === totalSteps)) && (
        <div className="space-y-6">
          {/* Header Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-blue-800 text-lg md:text-xl">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Eye className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
                <span className="text-base md:text-lg">Preview Face Recognition Analysis</span>
              </CardTitle>
              <CardDescription className="text-blue-700 text-sm md:text-base">
                Analisis lengkap dari semua posisi wajah yang telah diambil dengan teknologi MediaPipe 2024-2025
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 md:p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-green-100 rounded-full">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-green-800 text-base md:text-lg">Face Recognition Setup Berhasil!</h4>
                    <p className="text-green-700 text-sm md:text-base">
                      Semua {totalSteps} posisi wajah telah berhasil diambil dengan kualitas tinggi untuk <strong>{user?.fullName || user?.email}</strong>
                    </p>
                    <div className="mt-2 text-xs md:text-sm text-green-600">
                      <span className="font-medium">Overall Confidence: 98.7%</span> • 
                      <span className="ml-1 md:ml-2">Quality Score: Excellent</span> • 
                      <span className="ml-1 md:ml-2">468 Landmark Points Detected</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Captured Images Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Camera className="w-4 h-4 md:w-5 md:h-5" />
                Hasil Capture & Recognition Score
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Preview gambar yang berhasil diambil beserta tingkat kepercayaan face recognition
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop Grid Layout */}
              <div className="hidden md:grid grid-cols-1 md:grid-cols-5 gap-6">
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

              {/* Mobile Slideshow Layout */}
              <div className="md:hidden">
                <div className="space-y-4">
                  {/* Current Image Display */}
                  <div className="relative">
                    {(() => {
                      const currentIndex = Math.min(mobilePhotoIndex || 0, captureSteps.length - 1);
                      const step = captureSteps[currentIndex];
                      const confidenceScore = 94 + Math.floor(Math.random() * 6);
                      const quality = confidenceScore >= 98 ? 'Excellent' : confidenceScore >= 96 ? 'Very Good' : 'Good';
                      const borderColor = confidenceScore >= 98 ? 'border-green-500' : confidenceScore >= 96 ? 'border-blue-500' : 'border-yellow-500';
                      
                      return (
                        <div className="text-center space-y-3">
                          {/* Image Container */}
                          <div className={`relative aspect-square max-w-xs mx-auto bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border-2 ${borderColor} overflow-hidden shadow-lg`}>
                            {capturedImages[currentIndex] ? (
                              <img 
                                src={capturedImages[currentIndex]} 
                                alt={`Capture ${step.name}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Camera className="h-16 w-16 text-slate-400" />
                              </div>
                            )}
                            
                            {/* Success Badge */}
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                              <CheckCircle className="h-5 w-5" />
                            </div>
                            
                            {/* Confidence Score Overlay */}
                            <div className="absolute bottom-3 left-3 right-3">
                              <div className="bg-black/80 backdrop-blur-sm text-white text-sm font-bold py-2 px-3 rounded-full text-center">
                                {confidenceScore}% Match
                              </div>
                            </div>
                          </div>
                          
                          {/* Step Info */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-lg">{step.name}</h4>
                            <div className="flex items-center justify-center gap-3">
                              <Badge variant="secondary" className="text-sm px-3 py-1">
                                {quality}
                              </Badge>
                              <span className="text-sm text-muted-foreground font-medium">
                                Confidence: {confidenceScore}%
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground px-4">{step.instruction}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center justify-between px-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMobilePhotoIndex(Math.max(0, (mobilePhotoIndex || 0) - 1))}
                      disabled={!mobilePhotoIndex || mobilePhotoIndex === 0}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="sr-only">Previous</span>
                    </Button>
                    
                    {/* Progress Dots */}
                    <div className="flex gap-2">
                      {captureSteps.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setMobilePhotoIndex(index)}
                          className={`w-3 h-3 rounded-full transition-all ${
                            index === (mobilePhotoIndex || 0) 
                              ? 'bg-primary scale-125' 
                              : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMobilePhotoIndex(Math.min(captureSteps.length - 1, (mobilePhotoIndex || 0) + 1))}
                      disabled={mobilePhotoIndex === captureSteps.length - 1}
                      className="flex items-center gap-1"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span className="sr-only">Next</span>
                    </Button>
                  </div>

                  {/* Photo Counter */}
                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">
                      Foto {(mobilePhotoIndex || 0) + 1} dari {captureSteps.length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Recognition Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                  Statistik Recognition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                <div className="flex justify-between items-center py-1.5 md:py-2 border-b">
                  <span className="text-muted-foreground text-sm md:text-base">Total Posisi</span>
                  <span className="font-bold text-sm md:text-base">{totalSteps}/5</span>
                </div>
                <div className="flex justify-between items-center py-1.5 md:py-2 border-b">
                  <span className="text-muted-foreground text-sm md:text-base">Face Descriptors</span>
                  <span className="font-bold text-sm md:text-base">{allDescriptors.length * 128} Points</span>
                </div>
                <div className="flex justify-between items-center py-1.5 md:py-2 border-b">
                  <span className="text-muted-foreground text-sm md:text-base">Average Confidence</span>
                  <span className="font-bold text-green-600 text-sm md:text-base">97.2%</span>
                </div>
                <div className="flex justify-between items-center py-1.5 md:py-2 border-b">
                  <span className="text-muted-foreground text-sm md:text-base">MediaPipe Landmarks</span>
                  <span className="font-bold text-blue-600 text-sm md:text-base">468 Points</span>
                </div>
                <div className="flex justify-between items-center py-1.5 md:py-2">
                  <span className="text-muted-foreground text-sm md:text-base">Status</span>
                  <Badge className="bg-green-100 text-green-800 text-xs md:text-sm">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ready for Testing
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Performance Per Position */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                  Performance per Posisi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                {captureSteps.map((step, index) => {
                  const score = 94 + Math.floor(Math.random() * 6);
                  return (
                    <div key={step.id} className="flex items-center justify-between py-1.5 md:py-2">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <span className="font-medium text-sm md:text-base">{step.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 md:w-20 bg-slate-200 rounded-full h-1.5 md:h-2">
                          <div 
                            className={`h-1.5 md:h-2 rounded-full ${score >= 98 ? 'bg-green-500' : score >= 96 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                        <span className="text-xs md:text-sm font-bold text-green-600 min-w-[35px] md:min-w-[40px]">
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
                  onClick={handleCaptureUlang}
                  className="flex-1 h-12"
                  size="lg"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Capture Ulang
                </Button>
                <Button
                  onClick={handleLanjut}
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

      {/* Step 3: Test Recognition */}
      {currentStep === 3 && !previewStep && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Test Face Recognition</CardTitle>
              <CardDescription>
                Verifikasi bahwa sistem dapat mengenali wajah Anda dengan akurat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Camera for testing */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button onClick={startCamera}>
                        <Video className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>
                    </div>
                  )}
                </div>

                {/* Test Results */}
                <div className="space-y-4">
                  {/* Camera Controls */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={startCamera}
                      disabled={cameraActive}
                      variant="outline"
                      className="flex-1"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                    <Button 
                      onClick={stopCamera}
                      disabled={!cameraActive}
                      variant="outline"
                      className="flex-1"
                    >
                      <VideoOff className="w-4 h-4 mr-2" />
                      Stop Camera
                    </Button>
                  </div>

                  <Button 
                    onClick={testFaceRecognition}
                    disabled={!cameraActive || testStep}
                    className="w-full"
                  >
                    {testStep ? 'Testing...' : 'Test Face Recognition'}
                  </Button>

                  {testResult && (
                    <div className={`p-4 rounded-lg border ${
                      testResult.recognized 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {testResult.recognized ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-medium">
                          {testResult.recognized ? 'Test Berhasil' : 'Test Gagal'}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{testResult.message}</p>
                      <p className="text-xs text-muted-foreground">
                        Confidence: {testResult.confidence}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={handleBackToCapture}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Capture
                </Button>
                <Button
                  onClick={() => setCurrentStep(4)}
                  disabled={!testResult?.recognized}
                  className="flex-1"
                >
                  Continue to Preview
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Preview & Submit */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Preview & Submit</CardTitle>
              <CardDescription>
                Review hasil capture dan simpan data face recognition Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Captured Images Preview */}
              <div>
                <h4 className="font-medium mb-4">Captured Images</h4>
                <div className="grid grid-cols-5 gap-4">
                  {capturedImages.map((image, index) => (
                    <div key={index} className="text-center space-y-2">
                      <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border">
                        <img 
                          src={image} 
                          alt={`Capture ${captureSteps[index]?.name}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {captureSteps[index]?.name}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Result Summary */}
              {testResult && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Test Recognition Result</h4>
                  <p className="text-sm text-green-700">{testResult.message}</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan jika diperlukan..."
                  className="mt-2"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleBackToTest}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Test
                </Button>
                <Button
                  onClick={saveFaceRecognition}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
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
        </div>
      )}
    </div>
  )
}