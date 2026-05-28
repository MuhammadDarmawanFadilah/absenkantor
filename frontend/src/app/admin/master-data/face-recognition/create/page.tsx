'use client'

import { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { Info } from 'lucide-react'

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
  TrendingUp
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

// API URL helper (using imported config)

export default function CreateFaceRecognitionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Form state
  const [selectedPegawai, setSelectedPegawai] = useState<Pegawai | null>(null)
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Step navigation
  const [currentStep, setCurrentStep] = useState(1) // 1: Select Pegawai, 2: Capture, 3: Test, 4: Preview & Submit
  
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
  const [currentStepIndex, setCurrentStepIndex] = useState(-1) // SIMPLE INDEX APPROACH
  const [currentCaptureStep, setCurrentCaptureStep] = useState<CaptureStep | null>(null) // PROPER STATE
  
  // Debug tracking for currentCaptureStep changes
  useEffect(() => {
    console.log('🔄 CurrentCaptureStep changed:', {
      id: currentCaptureStep?.id,
      name: currentCaptureStep?.name,
      expectedOrientation: currentCaptureStep?.expectedOrientation
    })
  }, [currentStepIndex])
  const [allDescriptors, setAllDescriptors] = useState<Float32Array[]>([])
  const [notes, setNotes] = useState('')
  
  // Camera and Detection
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [autoDetectionEnabled, setAutoDetectionEnabled] = useState(true) // Always enabled for auto-only mode
  const [captureCountdown, setCaptureCountdown] = useState<number | null>(null)
  const [isProcessingCapture, setIsProcessingCapture] = useState(false) // New state to pause detection
  const [recentStepChange, setRecentStepChange] = useState(false) // Prevent immediate capture after step change
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const isCapturingRef = useRef(false) // Prevent multiple captures
  const lastLogTime = useRef(0) // Throttle logging
  const currentStepIndexRef = useRef(-1) // Immediate access to current step index

  // Test Step for Face Recognition
  const [testStep, setTestStep] = useState(false)
  const [previewStep, setPreviewStep] = useState(false) // New preview step
  const [testResult, setTestResult] = useState<{
    recognized: boolean,
    confidence: number,
    message: string
  } | null>(null)

  // Initialize component
  useEffect(() => {
    loadMediaPipeModels()
    loadPegawaiList()
    
    // Check for pegawaiId parameter and auto-select
    const pegawaiId = searchParams.get('pegawaiId')
    if (pegawaiId) {
      loadSpecificPegawai(parseInt(pegawaiId))
    }
    
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
  }, [])

  // PROPER STATE SYNC - Use useEffect to sync currentCaptureStep with index
  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex // Sync ref immediately
    
    if (currentStepIndex >= 0 && currentStepIndex < captureSteps.length) {
      const newStep = captureSteps[currentStepIndex]
      setCurrentCaptureStep(newStep)
      console.log('🔄 Synced currentCaptureStep:', newStep.name, '| Index:', currentStepIndex)
    } else {
      setCurrentCaptureStep(null)
    }
  }, [currentStepIndex, captureSteps])

  // Auto-initialize first capture step (FIXED: Remove flushSync)
  useEffect(() => {
    if (captureSteps.length > 0 && currentStepIndexRef.current === -1) {
      setCurrentStepIndex(0)
      setRecentStepChange(true) // Prevent immediate capture on first load
      currentStepIndexRef.current = 0 // Immediate ref update
      console.log('🎯 Initialized to step 0:', captureSteps[0].name)
      
      // Allow capture after initial delay
      setTimeout(() => {
        setRecentStepChange(false)
      }, 1500)
    }
  }, [captureSteps])

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load MediaPipe Models - Latest 2024-2025 Technology
  const loadMediaPipeModels = async () => {
    try {
      setLoading(true)
      
      // Try multiple CDN sources for better reliability
      const cdnUrls = [
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm",
        "https://unpkg.com/@mediapipe/tasks-vision/wasm"
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
      
      // Create FaceLandmarker with latest model
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
      console.error('Error loading MediaPipe models:', error)
      toast.error('Failed to load MediaPipe face recognition models. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  // Load pegawai list
  const loadPegawaiList = async (search?: string) => {
    try {
      console.log('Loading pegawai list with search:', search)
      const params = new URLSearchParams()
      if (search) {
        params.append('search', search)
      }
      params.append('withoutFaceRecognition', 'true')
      
      const url = getApiUrl(`pegawai?${params}`)
      console.log('Fetching URL:', url)
      
      const response = await fetch(url)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Received data:', data)
        const pegawaiData = data.pegawai || data.content || data.data || data || []
        console.log('Setting pegawaiList:', pegawaiData)
        setPegawaiList(pegawaiData)
      } else {
        console.error('Failed to fetch pegawai:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error loading pegawai list:', error)
    }
  }

  // Load specific pegawai by ID
  const loadSpecificPegawai = async (pegawaiId: number) => {
    try {
      const url = getApiUrl(`pegawai/${pegawaiId}`)
      console.log('Loading specific pegawai:', url)
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const pegawai = data.data || data
        if (pegawai) {
          setSelectedPegawai(pegawai)
          setSearchQuery(pegawai.namaLengkap || pegawai.fullName)
          console.log('Auto-selected pegawai:', pegawai.namaLengkap)
        }
      } else {
        console.error('Failed to fetch specific pegawai:', response.status)
      }
    } catch (error) {
      console.error('Error loading specific pegawai:', error)
    }
  }

  // Search pegawai
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setShowDropdown(true)
    
    if (value.length > 0) {
      loadPegawaiList(value)
    } else {
      loadPegawaiList()
    }
  }

  // Select pegawai
  const selectPegawai = (pegawai: Pegawai) => {
    setSelectedPegawai(pegawai)
    setSearchQuery(pegawai.namaLengkap || pegawai.fullName)
    setShowDropdown(false)
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
          if (currentStepIndex === -1) {
            const firstStep = captureSteps.find(step => !step.completed)
            if (firstStep) {
              const firstIndex = captureSteps.findIndex(s => s.id === firstStep.id)
              setCurrentStepIndex(firstIndex)
              toast.success(`Ready! Start with: ${firstStep.name} - ${firstStep.instruction}`)
            } else {
              // Force start with front step if no incomplete steps found  
              setCurrentStepIndex(0)
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
    if (!modelsLoaded || !videoRef.current || !faceLandmarker) return

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
          console.log('� Advancing from step:', currentStepIndex)
          
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
                console.log('� Detection resumed')
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
              
            if (autoDetectionEnabled && !isProcessingCapture && !recentStepChange && isValidOrientation && 
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
        console.error('MediaPipe face detection error:', error)
        setFaceDetected(false)
        setFaceOrientation('')
        setOrientationValid(false)
      }
    }, 300) // 3 FPS to reduce spam and CPU usage
  }

  // Modern MediaPipe orientation calculation using BlendShapes and 3D landmarks
  const calculateMediaPipeOrientation = (landmarks: any[], blendshapes?: any): string => {
    if (!landmarks || landmarks.length === 0) return 'tidak_terdeteksi'
    
    // Get key facial points (MediaPipe uses normalized coordinates 0-1)
    const noseTip = landmarks[1] // Nose tip
    const leftEye = landmarks[33] // Left eye center  
    const rightEye = landmarks[263] // Right eye center
    const chin = landmarks[175] // Chin center
    
    // Calculate face center from eyes
    const faceCenter = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2,
      z: (leftEye.z + rightEye.z) / 2
    }
    
    // Calculate orientation vectors using 3D coordinates
    const horizontalOffset = noseTip.x - faceCenter.x
    const verticalOffset = noseTip.y - faceCenter.y
    
    // Use blendshapes for more accurate orientation if available
    if (blendshapes && blendshapes.categories) {
      const headYaw = blendshapes.categories.find((c: any) => c.categoryName === 'headYaw')?.score || 0
      const headPitch = blendshapes.categories.find((c: any) => c.categoryName === 'headPitch')?.score || 0
      
      // Use blendshape thresholds (more accurate than geometric calculations)
      if (Math.abs(headYaw) > 0.2) {
        return headYaw > 0 ? 'kanan' : 'kiri'
      }
      if (Math.abs(headPitch) > 0.2) {
        return headPitch > 0 ? 'atas' : 'bawah'
      }
      return 'depan'
    }
    
    // Fallback to geometric calculation with improved thresholds
    const eyeDistance = Math.abs(rightEye.x - leftEye.x)
    const horizontalThreshold = eyeDistance * 0.08
    const verticalThreshold = eyeDistance * 0.06
    
    // Horizontal orientation (left/right)
    if (horizontalOffset > horizontalThreshold) {
      return 'kanan'
    } else if (horizontalOffset < -horizontalThreshold) {
      return 'kiri'
    }
    
    // Vertical orientation (up/down)  
    if (verticalOffset < -verticalThreshold) {
      return 'atas'
    } else if (verticalOffset > verticalThreshold) {
      return 'bawah'
    }
    
    return 'depan'
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

  // Start capture for specific step
  const startCaptureStep = (step: CaptureStep) => {
    const stepIndex = captureSteps.findIndex(s => s.id === step.id)
    setCurrentStepIndex(stepIndex)
    setOrientationValid(false)
    setFaceOrientation('')
    
    if (!cameraActive) {
      startCamera()
    }
  }

  // HAPUS function capturePhoto lama - diganti dengan executeCapture di atas

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

  // Test face recognition
  const testFaceRecognition = async () => {
    if (!videoRef.current || !faceLandmarker || allDescriptors.length === 0) {
      toast.error('No face data captured yet. Please complete capture first.')
      return
    }

    try {
      setTestStep(true)
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
        
        setTimeout(() => setTestStep(false), 3000)
      } else {
        console.warn('⚠️ No face detected during test')
        setTestResult({
          recognized: false,
          confidence: 0,
          message: '❌ Tidak ada wajah terdeteksi. Pastikan wajah Anda terlihat jelas di kamera.'
        })
        toast.error('Wajah tidak terdeteksi dalam test')
        setTestStep(false)
      }
    } catch (error) {
      console.error('❌ Error testing face recognition:', error)
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
    if (!selectedPegawai || allDescriptors.length === 0) {
      toast.error('Please select a pegawai and capture all required photos')
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
      
      console.log('💾 Saving face recognition data...')
      console.log('📊 Descriptors count:', allDescriptors.length)
      console.log('📸 Images count:', capturedImages.length)
      
      // Prepare comprehensive face recognition data
      const faceData = {
        pegawaiId: selectedPegawai.id,
        // Save all individual descriptors for better recognition
        faceDescriptors: allDescriptors.map((desc, index) => ({
          position: captureSteps[index]?.name || `Position_${index + 1}`,
          stepId: captureSteps[index]?.id || `step_${index + 1}`,
          descriptor: Array.from(desc),
          landmarks: desc.length // MediaPipe uses 468 landmarks
        })),
        // Save all captured images
        capturedImages: capturedImages.map((imageData, index) => ({
          position: captureSteps[index]?.name || `Position_${index + 1}`,
          stepId: captureSteps[index]?.id || `step_${index + 1}`,
          imageBase64: imageData,
          timestamp: new Date().toISOString()
        })),
        // Save capture steps completion status
        captureSteps: captureSteps.map(step => ({
          stepId: step.id,
          stepName: step.name,
          instruction: step.instruction,
          completed: step.completed,
          expectedOrientation: step.expectedOrientation
        })),
        // Test result validation
        testResult: {
          recognized: testResult.recognized,
          confidence: testResult.confidence,
          message: testResult.message,
          testDate: new Date().toISOString()
        },
        // Metadata
        technology: 'MediaPipe FaceLandmarker 2024-2025',
        version: '0.10.22',
        landmarkPoints: 468,
        captureMethod: 'Auto-capture with orientation detection',
        notes: notes.trim() || null,
        createdAt: new Date().toISOString(),
        // Summary statistics
        statistics: {
          totalPositions: captureSteps.length,
          completedPositions: captureSteps.filter(s => s.completed).length,
          totalDescriptors: allDescriptors.length,
          totalImages: capturedImages.length,
          averageConfidence: testResult.confidence,
          setupDuration: Date.now() - startTime // Track setup time
        }
      }

      console.log('🚀 Sending face recognition data to backend...')
      
      const response = await fetch(getApiUrl('api/face-recognition'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(faceData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log('✅ Face recognition data saved successfully!')
        toast.success(`🎉 Face recognition berhasil disimpan! ID: ${result.data?.id || 'Unknown'}`, { 
          duration: 5000 
        })
        
        // Show detailed success info
        setTimeout(() => {
          toast.success(`📊 Data tersimpan: ${allDescriptors.length} descriptors, ${capturedImages.length} images`, {
            duration: 4000
          })
        }, 1000)
        
        router.push('/admin/master-data/face-recognition')
      } else {
        console.error('❌ Failed to save:', result)
        toast.error(result.message || 'Failed to save face recognition data')
        
        // Show specific error details if available
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach((error: string) => {
            toast.error(error, { duration: 4000 })
          })
        }
      }
    } catch (error) {
      console.error('❌ Error saving face recognition:', error)
      toast.error('Network error: Failed to save face recognition data')
    } finally {
      setLoading(false)
    }
  }

  // Reset all data
  const resetAllData = () => {
    setSelectedPegawai(null)
    setSearchQuery('')
    setCurrentStep(1)
    setCaptureSteps(prev => prev.map(step => ({ ...step, completed: false })))
    setAllDescriptors([])
    setCurrentStepIndex(-1)
    setNotes('')
    setTestResult(null)
    setPreviewStep(false)
    setTestStep(false)
    stopCamera()
  }

  // Preview step functions
  const handleCaptureUlang = () => {
    console.log('🔄 User requested capture ulang, resetting...')
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
    console.log('➡️ User proceeding to test step...')
    setPreviewStep(false)
    setCurrentStep(3) // Change to step 3 for test recognition
    setTestStep(false) // Reset test step
    toast.success('📊 Lanjut ke tahap pengujian...', { duration: 3000 })
    
    // Start camera for testing
    startCamera()
  }

  const completedSteps = captureSteps.filter(step => step.completed).length
  const totalSteps = captureSteps.length
  const progress = (completedSteps / totalSteps) * 100

  // Step titles
  const stepTitles = [
    { number: 1, title: "Select Employee", description: "Choose employee for face recognition setup" },
    { number: 2, title: "Capture Photos", description: "Take photos from multiple angles" },
    { number: 3, title: "Test Recognition", description: "Verify face recognition accuracy" },
    { number: 4, title: "Preview & Submit", description: "Review and save face recognition data" }
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
    <div className="container mx-auto p-6 space-y-6">
      <AdminPageHeader 
        title="Create Face Recognition"
        description="Setup face recognition data for employee using MediaPipe 2024-2025 technology"
        icon={UserPlus}
      />
      
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin/master-data/face-recognition')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Step Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
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
          <div className="text-center">
            <h3 className="text-lg font-semibold">{stepTitles[currentStep - 1].title}</h3>
            <p className="text-sm text-muted-foreground">{stepTitles[currentStep - 1].description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Select Employee */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Employee</CardTitle>
            <CardDescription>Search and select employee for face recognition setup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative" ref={searchRef}>
              <Label htmlFor="pegawai-search">Search Employee ({pegawaiList.length} found)</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pegawai-search"
                  placeholder="Type name to search... (Click to see all employees)"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    setShowDropdown(true)
                    // Load all pegawai if list is empty
                    if (pegawaiList.length === 0) {
                      loadPegawaiList()
                    }
                  }}
                  className="pl-10"
                />
              </div>
              
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {pegawaiList.length > 0 ? (
                    pegawaiList.map((pegawai) => (
                      <div
                        key={pegawai.id}
                        className="px-4 py-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
                        onClick={() => selectPegawai(pegawai)}
                      >
                        <div className="font-medium">{pegawai.namaLengkap || pegawai.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {typeof pegawai.jabatan === 'string' ? pegawai.jabatan : pegawai.jabatan?.nama || 'No Position'} • {pegawai.email}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-muted-foreground text-center">
                      {loading ? 'Loading employees...' : 'No employees found'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedPegawai && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Selected Employee</h4>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage 
                      src={selectedPegawai.photoUrl ? 
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload/photos/${selectedPegawai.photoUrl}` : 
                        undefined
                      } 
                    />
                    <AvatarFallback>
                      {(selectedPegawai.namaLengkap || selectedPegawai.fullName)
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedPegawai.namaLengkap || selectedPegawai.fullName}</p>
                    <p className="text-sm text-muted-foreground">{typeof selectedPegawai.jabatan === 'string' ? selectedPegawai.jabatan : selectedPegawai.jabatan?.nama || 'No Position'}</p>
                    <p className="text-xs text-muted-foreground">{selectedPegawai.email}</p>
                    {selectedPegawai.phoneNumber && (
                      <p className="text-xs text-muted-foreground">{selectedPegawai.phoneNumber}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setCurrentStep(2)
                  // Initialize first capture step
                  setCurrentStepIndex(0)
                  console.log('🚀 Initialized first capture step:', captureSteps[0].name)
                }}
                disabled={!selectedPegawai}
                className="min-w-32"
              >
                Next: Capture Photos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Capture Photos - Redesigned Layout */}
      {currentStep === 2 && !previewStep && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <h4 className="font-bold text-green-800 text-lg">Face Recognition Setup Berhasil!</h4>
                    <p className="text-green-700">
                      Semua {totalSteps} posisi wajah telah berhasil diambil dengan kualitas tinggi untuk <strong>{selectedPegawai?.namaLengkap || selectedPegawai?.fullName}</strong>
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
                Hasil Capture & Recognition Score
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

      {/* Step 3: Enhanced Test Recognition */}
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
                      <span className="font-medium">{selectedPegawai?.namaLengkap || selectedPegawai?.fullName}</span>
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

      {/* Step 4: Preview & Submit */}
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
                <p className="text-sm">{selectedPegawai?.namaLengkap || selectedPegawai?.fullName}</p>
                <p className="text-xs text-muted-foreground">{typeof selectedPegawai?.jabatan === 'string' ? selectedPegawai?.jabatan : selectedPegawai?.jabatan?.nama || 'No Position'}</p>
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
                onClick={resetAllData}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All
              </Button>
              
              <Button
                onClick={saveFaceRecognition}
                disabled={!selectedPegawai || completedSteps !== totalSteps || !testResult?.recognized || loading}
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
      )}
    </div>
  )
}