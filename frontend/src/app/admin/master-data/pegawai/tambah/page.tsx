'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { ArrowLeft, Save, Camera, X, ChevronRight, ChevronLeft, User, MapPin, Calculator, Eye, Check, ChevronsUpDown, Search, Calendar } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/config"
import { cn } from "@/lib/utils"
import { Stepper } from "@/components/ui/stepper"
import { MapSelector } from "@/components/MapSelector"
import PegawaiCutiInlineForm from "@/components/pegawai/PegawaiCutiInlineForm"
import { PemotonganAbsenInfo } from "@/components/pegawai/PemotonganAbsenInfo"

interface JabatanResponse {
  id: number
  nama: string
}

interface LokasiResponse {
  id: number
  namaLokasi: string
}

interface ProvinsiResponse {
  kode: string
  nama: string
}

interface KotaResponse {
  kode: string
  nama: string
}

interface KecamatanResponse {
  kode: string
  nama: string
}

interface KelurahanResponse {
  kode: string
  nama: string
  kodePos: string
}

const steps = [
  {
    id: 1,
    title: "Personal & Akun",
    description: "Informasi personal dan jabatan"
  },
  {
    id: 2,
    title: "Alamat Detail",
    description: "Informasi lokasi lengkap"
  },
  {
    id: 3,
    title: "Tunjangan Kerja",
    description: "Komponen gaji & tunjangan"
  },
  {
    id: 4,
    title: "Preview",
    description: "Review data sebelum simpan"
  }
]

export default function TambahPegawaiPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [jabatanList, setJabatanList] = useState<JabatanResponse[]>([])
  const [lokasiList, setLokasiList] = useState<LokasiResponse[]>([])
  const [roleList, setRoleList] = useState<any[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Wilayah data
  const [provinsiList, setProvinsiList] = useState<ProvinsiResponse[]>([])
  const [kotaList, setKotaList] = useState<KotaResponse[]>([])
  const [kecamatanList, setKecamatanList] = useState<KecamatanResponse[]>([])
  const [kelurahanList, setKelurahanList] = useState<KelurahanResponse[]>([])
  
  // Search dropdown states
  const [provinsiOpen, setProvinsiOpen] = useState(false)
  const [kotaOpen, setKotaOpen] = useState(false)
  const [kecamatanOpen, setKecamatanOpen] = useState(false)
  const [kelurahanOpen, setKelurahanOpen] = useState(false)
  
  // Loading states
  const [loadingProvinsi, setLoadingProvinsi] = useState(true)
  const [loadingKota, setLoadingKota] = useState(false)
  
  // Map selector state
  const [showMapSelector, setShowMapSelector] = useState(false)
  
  // Map states
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAddress, setSelectedAddress] = useState('')
  
  // Form state matching absensi structure
  const [formData, setFormData] = useState({
    // Step 1: Personal & Account Info
    name: '',
    nip: '',
    email: '',
    telepon: '',
    gender: '',
    tgl_lahir: '',
    status_nikah: '',
    tgl_join: '',
    rekening: '',
    username: '',
    password: '',
    lokasi_id: '',
    jabatan_id: '',
    is_admin: '',
    foto_karyawan: null as File | null,

    // Step 2: Address Details
    alamat: '',
    provinsi: '',
    kota: '',
    kecamatan: '',
    kelurahan: '',
    kodePos: '',
    latitude: '',
    longitude: '',
    // Step 3: Salary & Benefits (Penambah)
    gaji_pokok: '',
    makan_transport: '',
    lembur: '',
    kehadiran: '',
    thr: '',
    bonus: '',
    tunjangan_komunikasi: '',
    tunjangan_transportasi: '',

    // Pengurangan
    izin: '',
    terlambat: '',
    mangkir: '',
    saldo_kasbon: '',
    potongan_bpjs: '',
    potongan_pajak: '',

    // Izin data
    izin_cuti: 0,
    izin_lainnya: 0,
    izin_telat: 0,
    izin_pulang_cepat: 0,
    
    // Cuti data  
    cutiList: [] as any[]
  })
  
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (mounted) {
      loadJabatanData()
      loadLokasiData()
      loadProvinsiData()
      loadRoleData()
    }
  }, [mounted])

  const loadJabatanData = async () => {
    try {
      const response = await fetch(
        getApiUrl('api/admin/master-data/jabatan?page=0&size=100'),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setJabatanList(data.content || [])
      }
    } catch (error) {
      console.error('Error loading jabatan data:', error)
    }
  }

  const loadLokasiData = async () => {
    try {
      const response = await fetch(
        getApiUrl('api/admin/master-data/lokasi?page=0&size=100'),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setLokasiList(data.content || [])
      }
    } catch (error) {
      console.error('Error loading lokasi data:', error)
    }
  }

  const loadRoleData = async () => {
    try {
      const response = await fetch(getApiUrl('api/roles/all'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setRoleList(data || [])
      }
    } catch (error) {
      console.error('Error loading role data:', error)
    }
  }

  // Wilayah API functions
  const loadProvinsiData = async () => {
    try {
      setLoadingProvinsi(true)
      const response = await fetch(getApiUrl('api/wilayah/provinsi'))
      if (response.ok) {
        const data = await response.json()
        console.log('Provinsi data loaded:', data?.length, 'items')
        setProvinsiList(data || [])
      } else {
        console.error('Failed to load provinsi data:', response.status)
      }
    } catch (error) {
      console.error('Error loading provinsi data:', error)
    } finally {
      setLoadingProvinsi(false)
    }
  }

  const loadKotaData = async (provinsiKode: string) => {
    try {
      setLoadingKota(true)
      console.log('Loading kota for provinsi:', provinsiKode)
      const response = await fetch(
        getApiUrl(`api/wilayah/kota?provinsiKode=${provinsiKode}`)
      )
      if (response.ok) {
        const data = await response.json()
        console.log('Kota data loaded:', data?.length, 'items')
        setKotaList(data || [])
        setKecamatanList([])
        setKelurahanList([])
      } else {
        console.error('Failed to load kota data:', response.status)
      }
    } catch (error) {
      console.error('Error loading kota data:', error)
    } finally {
      setLoadingKota(false)
    }
  }

  const loadKecamatanData = async (kotaKode: string) => {
    try {
      const response = await fetch(
        getApiUrl(`api/wilayah/kecamatan?kotaKode=${kotaKode}`)
      )
      if (response.ok) {
        const data = await response.json()
        setKecamatanList(data || [])
        setKelurahanList([])
      }
    } catch (error) {
      console.error('Error loading kecamatan data:', error)
    }
  }

  const loadKelurahanData = async (kecamatanKode: string) => {
    try {
      const response = await fetch(
        getApiUrl(`api/wilayah/kelurahan?kecamatanKode=${kecamatanKode}`)
      )
      if (response.ok) {
        const data = await response.json()
        setKelurahanList(data || [])
      }
    } catch (error) {
      console.error('Error loading kelurahan data:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-fill username from NIP
    if (field === 'nip' && value) {
      setFormData(prev => ({
        ...prev,
        nip: value,
        username: value // Auto-fill username with NIP value
      }))
    }

    // Handle wilayah dependencies
    if (field === 'provinsi' && value) {
      setFormData(prev => ({
        ...prev,
        kota: '',
        kecamatan: '',
        kelurahan: '',
        kodePos: ''
      }))
      loadKotaData(value)
    } else if (field === 'kota' && value) {
      setFormData(prev => ({
        ...prev,
        kecamatan: '',
        kelurahan: '',
        kodePos: ''
      }))
      loadKecamatanData(value)
    } else if (field === 'kecamatan' && value) {
      setFormData(prev => ({
        ...prev,
        kelurahan: '',
        kodePos: ''
      }))
      loadKelurahanData(value)
    } else if (field === 'kelurahan' && value) {
      // Auto-populate postal code from selected kelurahan
      console.log('Kelurahan selected:', value)
      console.log('Available kelurahan list:', kelurahanList)
      
      const selectedKelurahan = kelurahanList.find(k => k.kode === value)
      console.log('Selected kelurahan data:', selectedKelurahan)
      
      if (selectedKelurahan && selectedKelurahan.kodePos) {
        console.log('Setting kode pos:', selectedKelurahan.kodePos)
        setFormData(prev => ({
          ...prev,
          kodePos: selectedKelurahan.kodePos || ''
        }))
      } else {
        console.log('No kode pos found for selected kelurahan')
        setFormData(prev => ({
          ...prev,
          kodePos: ''
        }))
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        showErrorToast('Format file tidak didukung. Silakan pilih file JPG, PNG, atau GIF.')
        e.target.value = ''
        return
      }
      
      // Validate file size (2MB)
      const maxSize = 2 * 1024 * 1024
      if (file.size > maxSize) {
        showErrorToast('Ukuran file terlalu besar. Maksimal 2MB.')
        e.target.value = ''
        return
      }

      setFormData(prev => ({ ...prev, foto_karyawan: file }))
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePreview = () => {
    setFormData(prev => ({ ...prev, foto_karyawan: null }))
    setPreviewImage(null)
    const fileInput = document.getElementById('foto_karyawan') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }))
  }

  // Initialize map on component mount
  useEffect(() => {
    if (currentStep === 1 && mapRef.current && !mapInstanceRef.current) {
      loadLeafletAndInitMap()
    }
    // Cleanup map when leaving step 1
    return () => {
      if (currentStep !== 1 && mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
        setMapLoaded(false)
      }
    }
  }, [currentStep])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  // Re-initialize map when returning to step 1
  useEffect(() => {
    if (currentStep === 1 && mapRef.current && !mapInstanceRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        loadLeafletAndInitMap()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [currentStep])

  const loadLeafletAndInitMap = async () => {
    try {
      // Dynamically import Leaflet
      const L = (await import('leaflet')).default
      
      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Indonesia center coordinates
      const indonesiaLat = -2.5
      const indonesiaLng = 118.0

      // Initialize map centered on Indonesia
      const map = L.map(mapRef.current!).setView([indonesiaLat, indonesiaLng], 5)
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ''
      }).addTo(map)

      // Custom marker icon
      const customIcon = L.divIcon({
        html: `<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                   <circle cx="12" cy="12" r="3"/>
                 </svg>
               </div>`,
        className: 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })

      // Add initial marker if coordinates exist
      if (formData.latitude && formData.longitude) {
        const lat = parseFloat(formData.latitude)
        const lng = parseFloat(formData.longitude)
        markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map)
        map.setView([lat, lng], 13)
      }

      // Handle map clicks
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        
        // Remove existing marker
        if (markerRef.current) {
          map.removeLayer(markerRef.current)
        }
        
        // Add new marker
        markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map)
        
        // Update form data
        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6)
        }))

        // Reverse geocoding
        reverseGeocode(lat, lng)
      })

      mapInstanceRef.current = map
      setMapLoaded(true)

    } catch (error) {
      console.error('Error loading map:', error)
      setMapLoaded(true) // Still set to true to show fallback
    }
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&countrycodes=id`
      )
      
      if (response.ok) {
        const data = await response.json()
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        setSelectedAddress(address)
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
      setSelectedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    }
  }

  const searchLocation = async () => {
    if (!searchQuery.trim()) return
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=id`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat)
          const lng = parseFloat(data[0].lon)
          
          setFormData(prev => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6)
          }))
          
          setSelectedAddress(data[0].display_name)
          
          // Update map view and marker if map is loaded
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15)
            
            // Remove existing marker
            if (markerRef.current) {
              mapInstanceRef.current.removeLayer(markerRef.current)
            }
            
            // Add new marker
            const L = await import('leaflet')
            const customIcon = L.default.divIcon({
              html: `<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                         <circle cx="12" cy="12" r="3"/>
                       </svg>
                     </div>`,
              className: 'custom-marker',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
            
            markerRef.current = L.default.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current)
          }
        }
      }
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          
          setFormData(prev => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6)
          }))
          
          setSelectedAddress('Lokasi saat ini')
          
          // Update map if available
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15)
            
            // Remove existing marker
            if (markerRef.current) {
              mapInstanceRef.current.removeLayer(markerRef.current)
            }
            
            // Add new marker
            import('leaflet').then((L) => {
              const customIcon = L.default.divIcon({
                html: `<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                           <circle cx="12" cy="12" r="3"/>
                         </svg>
                       </div>`,
                className: 'custom-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })
              
              markerRef.current = L.default.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current)
            })
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
        }
      )
    }
  }

  const validateStep = async (step: number): Promise<boolean> => {
    console.log('validateStep called with step:', step)
    console.log('Current formData:', formData)
    
    switch (step) {
      case 0: // Personal & Account Info
        console.log('Validating step 0 - Personal & Account Info')
        
        // Personal Information - only nama lengkap is mandatory
        if (!formData.name?.trim()) {
          console.log('Name validation failed:', formData.name)
          showErrorToast('Nama lengkap harus diisi')
          return false
        }
        
        // Account & Job Information - all fields are mandatory
        if (!formData.username?.trim()) {
          console.log('Username validation failed:', formData.username)
          showErrorToast('Username harus diisi')
          return false
        }
        if (!formData.password?.trim()) {
          console.log('Password validation failed:', formData.password)
          showErrorToast('Password harus diisi')
          return false
        }
        if (!formData.lokasi_id) {
          console.log('Lokasi validation failed:', formData.lokasi_id)
          showErrorToast('Lokasi kantor harus dipilih')
          return false
        }
        if (!formData.jabatan_id) {
          console.log('Jabatan validation failed:', formData.jabatan_id)
          showErrorToast('Jabatan harus dipilih')
          return false
        }
        if (!formData.is_admin) {
          console.log('Level user validation failed:', formData.is_admin)
          showErrorToast('Level user harus dipilih')
          return false
        }
        
        console.log('Basic validation passed, checking duplicates...')
        
        // Check for duplicates only for filled fields
        try {
          const duplicateCheckData: any = {}
          
          if (formData.username?.trim()) duplicateCheckData.username = formData.username
          if (formData.email?.trim()) duplicateCheckData.email = formData.email
          if (formData.telepon?.trim()) duplicateCheckData.phoneNumber = formData.telepon
          if (formData.nip?.trim()) duplicateCheckData.nip = formData.nip
          
          // Only check for duplicates if there are fields to check
          if (Object.keys(duplicateCheckData).length > 0) {
            const duplicateResponse = await fetch(getApiUrl('api/pegawai/check-duplicate'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              },
              body: JSON.stringify(duplicateCheckData)
            })
            
            if (duplicateResponse.ok) {
              const duplicateData = await duplicateResponse.json()
              console.log('Duplicate check result:', duplicateData)
              
              if (duplicateData.usernameExists && formData.username?.trim()) {
                showErrorToast('Username sudah digunakan')
                return false
              }
              if (duplicateData.emailExists && formData.email?.trim()) {
                showErrorToast('Email sudah digunakan')
                return false
              }
              if (duplicateData.phoneExists && formData.telepon?.trim()) {
                showErrorToast('Nomor telepon sudah digunakan')
                return false
              }
              if (duplicateData.nipExists && formData.nip?.trim()) {
                showErrorToast('NIP sudah digunakan')
                return false
              }
            }
          }
        } catch (error) {
          console.error('Error checking duplicates:', error)
          showErrorToast('Gagal memvalidasi data. Silakan coba lagi.')
          return false
        }
        
        return true
      
      case 1: // Address Details
        // No mandatory fields for address details
        return true
      
      case 2: // Salary & Benefits
        // Optional validation for salary components
        return true
      
      default:
        return true
    }
  }

  const handlePrevious = () => {
    // Clean up map if moving away from step 1
    if (currentStep === 1 && mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
      markerRef.current = null
      setMapLoaded(false)
    }
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleNext = async () => {
    console.log('handleNext called, current step:', currentStep)
    console.log('formData values:', {
      name: formData.name,
      nip: formData.nip,
      email: formData.email,
      telepon: formData.telepon,
      username: formData.username,
      password: formData.password,
      gender: formData.gender,
      jabatan_id: formData.jabatan_id,
      lokasi_id: formData.lokasi_id,
      is_admin: formData.is_admin
    })
    
    const isValid = await validateStep(currentStep)
    console.log('validation result:', isValid)
    
    if (isValid) {
      console.log('moving to next step')
      // Clean up map if moving away from step 1
      if (currentStep === 1 && mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
        setMapLoaded(false)
      }
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    } else {
      console.log('validation failed, staying on current step')
    }
  }

  const handleSubmit = async () => {
    // Only allow submit on final step (step 3 - Preview)
    if (currentStep !== 3) {
      showErrorToast('Silakan selesaikan semua langkah terlebih dahulu')
      return
    }
    
    // Validate all steps
    for (let i = 0; i < steps.length - 1; i++) {
      const isValid = await validateStep(i)
      if (!isValid) {
        setCurrentStep(i)
        return
      }
    }

    try {
      setLoading(true)
      
      let photoUrl = null
      
      // Upload photo first if there's a new one
      if (formData.foto_karyawan !== null) {
        try {
          const photoFormData = new FormData()
          photoFormData.append('file', formData.foto_karyawan as File)
          
          const photoResponse = await fetch(getApiUrl('api/upload/photo'), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: photoFormData
          })
          
          if (photoResponse.ok) {
            const photoData = await photoResponse.json()
            photoUrl = photoData.filename
            console.log('Photo uploaded successfully:', photoData)
          } else {
            const photoError = await photoResponse.json()
            console.error('Photo upload failed:', photoError)
            showErrorToast('Gagal mengupload foto: ' + photoError.message)
            return
          }
        } catch (photoError) {
          console.error('Photo upload error:', photoError)
          showErrorToast('Gagal mengupload foto')
          return
        }
      }
      
      // Map frontend field names to backend field names
      const mappedData = {
        namaLengkap: formData.name,
        nip: formData.nip,
        email: formData.email,
        noTelp: formData.telepon,
        jenisKelamin: formData.gender === 'Laki-Laki' ? 'L' : 'P',
        tanggalLahir: formData.tgl_lahir || null,
        statusNikah: formData.status_nikah,
        tanggalMasuk: formData.tgl_join || null,
        rekening: formData.rekening,
        username: formData.username,
        password: formData.password,
        lokasiId: parseInt(formData.lokasi_id),
        jabatanId: parseInt(formData.jabatan_id),
        isAdmin: formData.is_admin === 'ADMIN' ? '1' : '0',
        role: formData.is_admin,
        alamat: formData.alamat,
        provinsi: formData.provinsi,
        kota: formData.kota,
        kecamatan: formData.kecamatan,
        kelurahan: formData.kelurahan,
        kodePos: formData.kodePos,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        gajiPokok: formData.gaji_pokok ? parseInt(formData.gaji_pokok.replace(/\D/g, '')) : null,
        makanTransport: formData.makan_transport ? parseInt(formData.makan_transport.replace(/\D/g, '')) : null,
        lembur: formData.lembur ? parseInt(formData.lembur.replace(/\D/g, '')) : null,
        kehadiran: formData.kehadiran ? parseInt(formData.kehadiran.replace(/\D/g, '')) : null,
        thr: formData.thr ? parseInt(formData.thr.replace(/\D/g, '')) : null,
        bonus: formData.bonus ? parseInt(formData.bonus.replace(/\D/g, '')) : null,
        tunjanganKinerja: formData.tunjangan_komunikasi ? parseInt(formData.tunjangan_komunikasi.replace(/\D/g, '')) : null,
        tunjanganTransportasi: formData.tunjangan_transportasi ? parseInt(formData.tunjangan_transportasi.replace(/\D/g, '')) : null,
        izin: formData.izin ? parseInt(formData.izin.replace(/\D/g, '')) : null,
        terlambat: formData.terlambat ? parseInt(formData.terlambat.replace(/\D/g, '')) : null,
        mangkir: formData.mangkir ? parseInt(formData.mangkir.replace(/\D/g, '')) : null,
        saldoKasbon: formData.saldo_kasbon ? parseInt(formData.saldo_kasbon.replace(/\D/g, '')) : null,
        potonganBpjs: formData.potongan_bpjs ? parseInt(formData.potongan_bpjs.replace(/\D/g, '')) : null,
        potonganPajak: formData.potongan_pajak ? parseInt(formData.potongan_pajak.replace(/\D/g, '')) : null,
        izinCuti: formData.izin_cuti,
        izinLainnya: formData.izin_lainnya,
        izinTelat: formData.izin_telat,
        izinPulangCepat: formData.izin_pulang_cepat,
        photoUrl: photoUrl // Include photo URL if uploaded
      }
      
      // Remove photoUrl if no photo was uploaded
      if (!photoUrl) {
        delete mappedData.photoUrl
      }
      
      // For now, use JSON endpoint only (without file upload)
      let requestBody: any = JSON.stringify(mappedData)
      let headers: any = {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(getApiUrl('api/pegawai'), {
        method: 'POST',
        headers: headers,
        body: requestBody
      })
      
      if (response.ok) {
        const pegawaiData = await response.json()
        const pegawaiId = pegawaiData.id
        
        // Save cuti data if exists
        if (formData.cutiList.length > 0) {
          try {
            const cutiRequestData = formData.cutiList.map(item => ({
              pegawaiId: pegawaiId,
              jenisCutiId: item.jenisCutiId,
              tahun: item.tahun,
              jatahHari: item.jumlahHari
            }));

            const cutiResponse = await fetch(getApiUrl(`api/pegawai-cuti/pegawai/${pegawaiId}/batch`), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              },
              body: JSON.stringify(cutiRequestData)
            });

            if (!cutiResponse.ok) {
              console.error('Failed to save cuti data, but pegawai created successfully');
            }
          } catch (cutiError) {
            console.error('Error saving cuti data:', cutiError);
          }
        }
        
        showSuccessToast('Pegawai berhasil ditambahkan')
        router.push('/admin/master-data/pegawai')
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal menambahkan pegawai')
      }
    } catch (error) {
      console.error('Error creating pegawai:', error)
      showErrorToast('Gagal menambahkan pegawai')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/admin/master-data/pegawai')
  }

  const formatCurrency = (value: string) => {
    const num = parseInt(value.replace(/\D/g, ''))
    return isNaN(num) ? '' : num.toLocaleString('id-ID')
  }

  const getStepIcon = (step: number) => {
    switch (step) {
      case 0: return User
      case 1: return MapPin
      case 2: return Calculator
      case 3: return Eye
      default: return User
    }
  }

  if (!mounted) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-muted-foreground">Memuat halaman...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="Tambah Pegawai Baru"
        description="Tambahkan pegawai baru ke dalam sistem dengan langkah-langkah terstruktur"
        icon={getStepIcon(currentStep)}
        primaryAction={{
          label: "Kembali",
          onClick: handleBack,
          icon: ArrowLeft
        }}
      />

      <div className="container mx-auto p-6 max-w-4xl">
        {/* Stepper */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Stepper steps={steps} currentStep={currentStep} />
          </CardContent>
        </Card>

        {/* Form Content */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Step 1: Personal & Account Information */}
          {currentStep === 0 && (
            <div className="space-y-6">
              {/* Photo Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Foto Pegawai
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-4">
                    {previewImage ? (
                      <div className="relative">
                        <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-lg">
                          <img
                            src={previewImage}
                            alt="Preview Foto"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="mt-3"
                          onClick={removePreview}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Hapus Foto
                        </Button>
                      </div>
                    ) : (
                      <label className="w-48 h-48 rounded-full border-3 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        <Camera className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-600">Upload Foto</span>
                        <span className="text-xs text-gray-400">JPG, PNG, GIF (Max: 2MB)</span>
                        <input
                          type="file"
                          id="foto_karyawan"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Informasi Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Masukkan nama lengkap"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nip">NIP (Nomor Induk Pegawai)</Label>
                      <Input
                        id="nip"
                        value={formData.nip}
                        onChange={(e) => handleInputChange('nip', e.target.value)}
                        placeholder="Masukkan NIP"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="nama@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telepon">Nomor Telepon</Label>
                      <Input
                        id="telepon"
                        value={formData.telepon}
                        onChange={(e) => handleInputChange('telepon', e.target.value)}
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender">Jenis Kelamin</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Jenis Kelamin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Laki-Laki">Laki-Laki</SelectItem>
                          <SelectItem value="Perempuan">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tgl_lahir">Tanggal Lahir</Label>
                      <Input
                        id="tgl_lahir"
                        type="date"
                        value={formData.tgl_lahir}
                        onChange={(e) => handleInputChange('tgl_lahir', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status_nikah">Status Pernikahan</Label>
                      <Select value={formData.status_nikah} onValueChange={(value) => handleInputChange('status_nikah', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Status Pernikahan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Menikah">Menikah</SelectItem>
                          <SelectItem value="Lajang">Lajang</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tgl_join">Tanggal Masuk Perusahaan</Label>
                      <Input
                        id="tgl_join"
                        type="date"
                        value={formData.tgl_join}
                        onChange={(e) => handleInputChange('tgl_join', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rekening">Nomor Rekening</Label>
                      <Input
                        id="rekening"
                        value={formData.rekening}
                        onChange={(e) => handleInputChange('rekening', e.target.value)}
                        placeholder="Masukkan nomor rekening"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Informasi Akun & Jabatan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder="Masukkan username"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Masukkan password"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lokasi_id">Lokasi Kantor *</Label>
                      <Select value={formData.lokasi_id} onValueChange={(value) => handleInputChange('lokasi_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Lokasi Kantor" />
                        </SelectTrigger>
                        <SelectContent>
                          {lokasiList.map((lokasi) => (
                            <SelectItem key={lokasi.id} value={lokasi.id.toString()}>
                              {lokasi.namaLokasi}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jabatan_id">Jabatan *</Label>
                      <Select value={formData.jabatan_id} onValueChange={(value) => handleInputChange('jabatan_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Jabatan" />
                        </SelectTrigger>
                        <SelectContent>
                          {jabatanList.map((jabatan) => (
                            <SelectItem key={jabatan.id} value={jabatan.id.toString()}>
                              {jabatan.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="is_admin">Level User *</Label>
                      <Select value={formData.is_admin} onValueChange={(value) => handleInputChange('is_admin', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Level User" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleList.map((role) => (
                            <SelectItem key={role.roleId} value={role.roleName}>
                              {role.roleName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Address Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Alamat Detail
                  </CardTitle>
                  <CardDescription>
                    Informasi alamat lengkap menggunakan data resmi dari wilayah.id
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="alamat">Alamat Lengkap</Label>
                    <Textarea
                      id="alamat"
                      value={formData.alamat}
                      onChange={(e) => handleInputChange('alamat', e.target.value)}
                      placeholder="Masukkan alamat lengkap (jalan, nomor rumah, dll)"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="provinsi">Provinsi</Label>
                      <Popover open={provinsiOpen} onOpenChange={setProvinsiOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={provinsiOpen}
                            className="justify-between w-full"
                            disabled={loadingProvinsi}
                          >
                            {formData.provinsi
                              ? provinsiList.find((provinsi) => provinsi.kode === formData.provinsi)?.nama
                              : loadingProvinsi 
                                ? "Memuat provinsi..." 
                                : "Pilih Provinsi"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Cari provinsi..." />
                            <CommandEmpty>Tidak ada provinsi ditemukan.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {loadingProvinsi ? (
                                <CommandItem disabled>Memuat data provinsi...</CommandItem>
                              ) : provinsiList.length === 0 ? (
                                <CommandItem disabled>Tidak ada data provinsi</CommandItem>
                              ) : (
                                provinsiList.map((provinsi) => (
                                  <CommandItem
                                    key={provinsi.kode}
                                    value={provinsi.nama}
                                    onSelect={() => {
                                      handleInputChange('provinsi', provinsi.kode)
                                      setProvinsiOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.provinsi === provinsi.kode ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {provinsi.nama}
                                  </CommandItem>
                                ))
                              )}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kota">Kota/Kabupaten</Label>
                      <Popover open={kotaOpen} onOpenChange={setKotaOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={kotaOpen}
                            className="justify-between w-full"
                            disabled={!formData.provinsi || loadingKota}
                          >
                            {formData.kota
                              ? kotaList.find((kota) => kota.kode === formData.kota)?.nama
                              : !formData.provinsi 
                                ? "Pilih provinsi terlebih dahulu"
                                : loadingKota 
                                  ? "Memuat kota..." 
                                  : "Pilih Kota/Kabupaten"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Cari kota/kabupaten..." />
                            <CommandEmpty>Tidak ada kota/kabupaten ditemukan.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {loadingKota ? (
                                <CommandItem disabled>Memuat data kota...</CommandItem>
                              ) : kotaList.length === 0 ? (
                                <CommandItem disabled>Tidak ada data kota</CommandItem>
                              ) : (
                                kotaList.map((kota) => (
                                  <CommandItem
                                    key={kota.kode}
                                    value={kota.nama}
                                    onSelect={() => {
                                      handleInputChange('kota', kota.kode)
                                      setKotaOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.kota === kota.kode ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {kota.nama}
                                  </CommandItem>
                                ))
                              )}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kecamatan">Kecamatan</Label>
                      <Popover open={kecamatanOpen} onOpenChange={setKecamatanOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={kecamatanOpen}
                            className="justify-between w-full"
                            disabled={!formData.kota}
                          >
                            {formData.kecamatan
                              ? kecamatanList.find((kecamatan) => kecamatan.kode === formData.kecamatan)?.nama
                              : !formData.kota 
                                ? "Pilih kota terlebih dahulu"
                                : "Pilih Kecamatan"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Cari kecamatan..." />
                            <CommandEmpty>Tidak ada kecamatan ditemukan.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {kecamatanList.length === 0 ? (
                                <CommandItem disabled>Tidak ada data kecamatan</CommandItem>
                              ) : (
                                kecamatanList.map((kecamatan) => (
                                  <CommandItem
                                    key={kecamatan.kode}
                                    value={kecamatan.nama}
                                    onSelect={() => {
                                      handleInputChange('kecamatan', kecamatan.kode)
                                      setKecamatanOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.kecamatan === kecamatan.kode ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {kecamatan.nama}
                                  </CommandItem>
                                ))
                              )}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kelurahan">Kelurahan/Desa</Label>
                      <Popover open={kelurahanOpen} onOpenChange={setKelurahanOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={kelurahanOpen}
                            className="justify-between w-full"
                            disabled={!formData.kecamatan}
                          >
                            {formData.kelurahan
                              ? kelurahanList.find((kelurahan) => kelurahan.kode === formData.kelurahan)?.nama
                              : !formData.kecamatan 
                                ? "Pilih kecamatan terlebih dahulu"
                                : "Pilih Kelurahan/Desa"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Cari kelurahan/desa..." />
                            <CommandEmpty>Tidak ada kelurahan/desa ditemukan.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {kelurahanList.length === 0 ? (
                                <CommandItem disabled>Tidak ada data kelurahan/desa</CommandItem>
                              ) : (
                                kelurahanList.map((kelurahan) => (
                                  <CommandItem
                                    key={kelurahan.kode}
                                    value={kelurahan.nama}
                                    onSelect={() => {
                                      handleInputChange('kelurahan', kelurahan.kode)
                                      setKelurahanOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.kelurahan === kelurahan.kode ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {kelurahan.nama}
                                  </CommandItem>
                                ))
                              )}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kodePos">Kode Pos</Label>
                    <Input
                      id="kodePos"
                      value={formData.kodePos}
                      onChange={(e) => handleInputChange('kodePos', e.target.value)}
                      placeholder="12345"
                      maxLength={5}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Kode pos akan terisi otomatis setelah memilih kelurahan/desa
                    </p>
                  </div>

                  {/* Map Location Selector */}
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <Label className="text-base font-medium">Koordinat Lokasi Indonesia</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pilih lokasi tepat pada peta Indonesia untuk koordinat GPS (Opsional)
                      </p>
                    </div>
                    
                    {/* Embedded Map Display */}
                    <div className="w-full h-96 bg-gray-100 rounded-lg border relative overflow-hidden">
                      <div 
                        ref={mapRef}
                        className="w-full h-full"
                        style={{ minHeight: '384px' }}
                      />
                      {!mapLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                            <p className="text-sm text-gray-600">Memuat peta Indonesia...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Location Search */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Cari alamat di Indonesia..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                        />
                      </div>
                      <Button 
                        type="button"
                        onClick={searchLocation} 
                        disabled={!searchQuery.trim()}
                        className="flex items-center gap-2"
                      >
                        <Search className="h-4 w-4" />
                        Cari
                      </Button>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={getCurrentLocation}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="h-4 w-4" />
                        Lokasi Saya
                      </Button>
                    </div>
                    
                    {(formData.latitude && formData.longitude) && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-700">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">Lokasi Terpilih</span>
                        </div>
                        <div className="text-sm text-green-600 mt-1">
                          {selectedAddress || `${formData.latitude}, ${formData.longitude}`}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Koordinat: {formData.latitude}, {formData.longitude}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              latitude: '',
                              longitude: ''
                            }))
                            setSelectedAddress('')
                            if (markerRef.current && mapInstanceRef.current) {
                              mapInstanceRef.current.removeLayer(markerRef.current)
                              markerRef.current = null
                            }
                          }}
                          className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50 h-auto p-1"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Hapus Koordinat
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Address Details - Remove duplicate */}

          {/* Step 3: Salary & Benefits */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Tunjangan (Penambah) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-green-600" />
                    Komponen Penambah Gaji
                  </CardTitle>
                  <CardDescription>
                    Komponen yang menambah total gaji pegawai
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tunjangan_komunikasi">Tunjangan Kinerja</Label>
                      <div className="relative">
                        <Input
                          id="tunjangan_komunikasi"
                          value={formData.tunjangan_komunikasi}
                          onChange={(e) => handleInputChange('tunjangan_komunikasi', e.target.value)}
                          placeholder="1000000"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          / Bulan
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="makan_transport">Makan & Transport</Label>
                      <div className="relative">
                        <Input
                          id="makan_transport"
                          value={formData.makan_transport}
                          onChange={(e) => handleInputChange('makan_transport', e.target.value)}
                          placeholder="750000"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          / Bulan
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kehadiran">Tunjangan Kehadiran (100%)</Label>
                      <div className="relative">
                        <Input
                          id="kehadiran"
                          value={formData.kehadiran}
                          onChange={(e) => handleInputChange('kehadiran', e.target.value)}
                          placeholder="300000"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          / Bulan
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lembur">Lembur</Label>
                      <div className="relative">
                        <Input
                          id="lembur"
                          value={formData.lembur}
                          onChange={(e) => handleInputChange('lembur', e.target.value)}
                          placeholder="25000"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          / Jam
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bonus">Bonus</Label>
                      <div className="relative">
                        <Input
                          id="bonus"
                          value={formData.bonus}
                          onChange={(e) => handleInputChange('bonus', e.target.value)}
                          placeholder="500000"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          / Bulan
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="thr">THR</Label>
                      <div className="relative">
                        <Input
                          id="thr"
                          value={formData.thr}
                          onChange={(e) => handleInputChange('thr', e.target.value)}
                          placeholder="5000000"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          / Tahun
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tunjangan_transportasi">Tunjangan Transportasi</Label>
                      <div className="relative">
                        <Input
                          id="tunjangan_transportasi"
                          value={formData.tunjangan_transportasi}
                          onChange={(e) => handleInputChange('tunjangan_transportasi', e.target.value)}
                          placeholder="200000"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          / Bulan
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informasi Pemotongan Absen */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-orange-600" />
                    Informasi Pemotongan Absen
                  </CardTitle>
                  <CardDescription>
                    Informasi perhitungan pemotongan gaji berdasarkan ketidakhadiran
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PemotonganAbsenInfo tunjanganKinerja={formData.tunjangan_komunikasi} />
                </CardContent>
              </Card>

              {/* Daftar Cuti Pegawai */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Daftar Cuti Pegawai</CardTitle>
                  <CardDescription>
                    Pengaturan jenis cuti dan kuota per tahun untuk pegawai
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PegawaiCutiInlineForm
                    cutiList={formData.cutiList}
                    onChange={(updatedCutiList) => {
                      setFormData(prev => ({
                        ...prev,
                        cutiList: updatedCutiList
                      }));
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Preview Data Pegawai
                  </CardTitle>
                  <CardDescription>
                    Periksa kembali data sebelum menyimpan. Pastikan semua informasi sudah benar.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Photo Preview */}
                  {previewImage && (
                    <div className="flex justify-center">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                        <img
                          src={previewImage}
                          alt="Foto Pegawai"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Personal Information Preview */}
                  <div>
                    <h4 className="font-semibold text-lg mb-3">Informasi Personal</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Nama:</span> {formData.name || '-'}</div>
                      <div><span className="font-medium">NIP:</span> {formData.nip || '-'}</div>
                      <div><span className="font-medium">Email:</span> {formData.email || '-'}</div>
                      <div><span className="font-medium">Telepon:</span> {formData.telepon || '-'}</div>
                      <div><span className="font-medium">Jenis Kelamin:</span> {formData.gender || '-'}</div>
                      <div><span className="font-medium">Tanggal Lahir:</span> {formData.tgl_lahir || '-'}</div>
                      <div><span className="font-medium">Status Pernikahan:</span> {formData.status_nikah || '-'}</div>
                      <div><span className="font-medium">Tanggal Masuk:</span> {formData.tgl_join || '-'}</div>
                      <div><span className="font-medium">No. Rekening:</span> {formData.rekening || '-'}</div>
                    </div>
                  </div>

                  {/* Address Preview */}
                  <div>
                    <h4 className="font-semibold text-lg mb-3">Alamat</h4>
                    <div className="text-sm space-y-2">
                      <div><span className="font-medium">Alamat Lengkap:</span> {formData.alamat || '-'}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><span className="font-medium">Provinsi:</span> {provinsiList.find(p => p.kode === formData.provinsi)?.nama || '-'}</div>
                        <div><span className="font-medium">Kota:</span> {kotaList.find(k => k.kode === formData.kota)?.nama || '-'}</div>
                        <div><span className="font-medium">Kecamatan:</span> {kecamatanList.find(k => k.kode === formData.kecamatan)?.nama || '-'}</div>
                        <div><span className="font-medium">Kelurahan:</span> {kelurahanList.find(k => k.kode === formData.kelurahan)?.nama || '-'}</div>
                        <div><span className="font-medium">Kode Pos:</span> {formData.kodePos || '-'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Job Information Preview */}
                  <div>
                    <h4 className="font-semibold text-lg mb-3">Informasi Jabatan</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Jabatan:</span> {jabatanList.find(j => j.id.toString() === formData.jabatan_id)?.nama || '-'}</div>
                      <div><span className="font-medium">Lokasi Kantor:</span> {lokasiList.find(l => l.id.toString() === formData.lokasi_id)?.namaLokasi || '-'}</div>
                      <div><span className="font-medium">Username:</span> {formData.username || '-'}</div>
                      <div><span className="font-medium">Level User:</span> {formData.is_admin || '-'}</div>
                    </div>
                  </div>

                  {/* Salary Information Preview */}
                  <div>
                    <h4 className="font-semibold text-lg mb-3">Informasi Gaji</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-green-600 mb-2">Komponen Penambah</h5>
                        <div className="space-y-1 text-sm">
                          {formData.tunjangan_komunikasi && <div>Tunjangan Kinerja: Rp {formatCurrency(formData.tunjangan_komunikasi)}</div>}
                          {formData.makan_transport && <div>Makan & Transport: Rp {formatCurrency(formData.makan_transport)}</div>}
                          {formData.kehadiran && <div>Tunjangan Kehadiran: Rp {formatCurrency(formData.kehadiran)}</div>}
                          {formData.lembur && <div>Lembur: Rp {formatCurrency(formData.lembur)}/jam</div>}
                          {formData.bonus && <div>Bonus: Rp {formatCurrency(formData.bonus)}</div>}
                          {formData.thr && <div>THR: Rp {formatCurrency(formData.thr)}</div>}
                          {formData.tunjangan_transportasi && <div>Tunjangan Transportasi: Rp {formatCurrency(formData.tunjangan_transportasi)}</div>}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-orange-600 mb-2">Potongan Absen</h5>
                        <div className="text-sm text-muted-foreground">
                          {formData.tunjangan_komunikasi ? (
                            <div>
                              <p>Potongan dihitung otomatis berdasarkan</p>
                              <p>Tunjangan Kinerja: <span className="font-semibold">Rp {formatCurrency(formData.tunjangan_komunikasi)}</span></p>
                              <p className="text-xs mt-1">Lihat detail pada bagian "Informasi Pemotongan Absen"</p>
                            </div>
                          ) : (
                            <p>Masukkan Tunjangan Kinerja untuk melihat perhitungan potongan</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Allowance Information Preview */}
                  <div>
                    <h4 className="font-semibold text-lg mb-3">Daftar Cuti Pegawai</h4>
                    <div className="text-sm">
                      <p className="text-gray-500">
                        Daftar cuti pegawai akan dapat dikelola setelah data pegawai berhasil disimpan
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6">
            <div>
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </Button>
              )}
            </div>

            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBack}
              >
                Batal
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="button" 
                  disabled={loading}
                  onClick={handleSubmit}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Simpan Data Pegawai
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
