'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { useAuth } from "@/contexts/AuthContext"
import { getApiUrl } from "@/lib/config"
import ProtectedRoute from "@/components/ProtectedRoute"
import { ArrowLeft, Save, User, Camera, X, ChevronRight, ChevronLeft, MapPin, Eye, Check, ChevronsUpDown, Search } from 'lucide-react'
import { Stepper } from "@/components/ui/stepper"
import { cn } from "@/lib/utils"

interface Pegawai {
  id: number
  nip: string
  fullName: string
  email: string
  phoneNumber: string
  alamat: string
  photoUrl?: string
  jabatan?: string
  provinsi?: string
  kota?: string
  kecamatan?: string
  kelurahan?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Wilayah {
  kode: string
  nama: string
  id?: number
}

const steps = [
  {
    id: 1,
    title: "Informasi Personal",
    description: "Data diri dan foto"
  },
  {
    id: 2,
    title: "Alamat Detail",
    description: "Informasi lokasi lengkap"
  },
  {
    id: 3,
    title: "Preview",
    description: "Review data sebelum simpan"
  }
]

export default function EditPegawaiPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [pegawai, setPegawai] = useState<Pegawai | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    nip: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    gender: '',
    tgl_lahir: '',
    status_nikah: '',
    tgl_join: '',
    rekening: '',
    foto_karyawan: null as File | null,
    alamat: '',
    provinsiId: '',
    kotaId: '',
    kecamatanId: '',
    kelurahanId: '',
    kodePos: '',
    latitude: '',
    longitude: ''
  })
  
  // Options
  const [provinsiOptions, setProvinsiOptions] = useState<Wilayah[]>([])
  const [kotaOptions, setKotaOptions] = useState<Wilayah[]>([])
  const [kecamatanOptions, setKecamatanOptions] = useState<Wilayah[]>([])
  const [kelurahanOptions, setKelurahanOptions] = useState<Wilayah[]>([])
  
  // Search dropdown states
  const [provinsiOpen, setProvinsiOpen] = useState(false)
  const [kotaOpen, setKotaOpen] = useState(false)
  const [kecamatanOpen, setKecamatanOpen] = useState(false)
  const [kelurahanOpen, setKelurahanOpen] = useState(false)
  
  // Loading states
  const [loadingProvinsi, setLoadingProvinsi] = useState(true)
  const [loadingKota, setLoadingKota] = useState(false)
  
  // Map states
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAddress, setSelectedAddress] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && user?.id) {
      loadProvinsiOptions()
      loadPegawaiData()
    } else if (mounted && !user?.id) {
      // Redirect if no user ID available
      showErrorToast('Silakan login terlebih dahulu')
      router.push('/login')
    }
  }, [mounted, user?.id])

  // Load dependent data after pegawai data is loaded
  useEffect(() => {
    if (pegawai && provinsiOptions.length > 0) {
      loadDependentWilayahData()
    }
  }, [pegawai, provinsiOptions])

  const loadDependentWilayahData = async () => {
    if (!pegawai) return

    try {
      // Load kota options if provinsi exists
      if (pegawai.provinsi && provinsiOptions.length > 0) {
        const provinsiFound = provinsiOptions.find(p => p.kode === pegawai.provinsi)
        if (provinsiFound) {
          await loadKotaOptionsByProvinsiKode(provinsiFound.kode)
        }
      }
    } catch (error) {
      console.error('Error loading dependent wilayah data:', error)
    }
  }

  // Load kecamatan after kota is loaded
  useEffect(() => {
    if (pegawai && kotaOptions.length > 0) {
      loadKecamatanData()
    }
  }, [pegawai, kotaOptions])

  const loadKecamatanData = async () => {
    if (!pegawai || !pegawai.kota) return

    try {
      const kotaFound = kotaOptions.find(k => k.kode === pegawai.kota)
      if (kotaFound) {
        await loadKecamatanOptionsByKotaKode(kotaFound.kode)
      }
    } catch (error) {
      console.error('Error loading kecamatan data:', error)
    }
  }

  // Load kelurahan after kecamatan is loaded
  useEffect(() => {
    if (pegawai && kecamatanOptions.length > 0) {
      loadKelurahanData()
    }
  }, [pegawai, kecamatanOptions])

  const loadKelurahanData = async () => {
    if (!pegawai || !pegawai.kecamatan) return

    try {
      const kecamatanFound = kecamatanOptions.find(k => k.kode === pegawai.kecamatan)
      if (kecamatanFound) {
        await loadKelurahanOptionsByKecamatanKode(kecamatanFound.kode)
      }
    } catch (error) {
      console.error('Error loading kelurahan data:', error)
    }
  }

  const loadPegawaiData = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/pegawai/${user?.id}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPegawai(data)
        
        // Map the API response to form data correctly
        setFormData({
          nip: data.nip || '',
          fullName: data.fullName || data.namaLengkap || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || data.noTelp || '',
          address: data.alamat || '',
          gender: data.jenisKelamin === 'L' ? 'Laki-Laki' : data.jenisKelamin === 'P' ? 'Perempuan' : '',
          tgl_lahir: data.tanggalLahir || '',
          status_nikah: data.statusNikah || '',
          tgl_join: data.tanggalMasuk || '',
          rekening: data.rekening || '',
          foto_karyawan: null,
          alamat: data.alamat || '',
          provinsiId: data.provinsi || '',
          kotaId: data.kota || '',
          kecamatanId: data.kecamatan || '',
          kelurahanId: data.kelurahan || '',
          kodePos: data.kodePos || '',
          latitude: data.latitude?.toString() || '',
          longitude: data.longitude?.toString() || ''
        })

        // Set preview image if exists
        if (data.fotoKaryawan || data.photoUrl) {
          const photoField = data.photoUrl || data.fotoKaryawan
          let imageUrl
          
          if (photoField.startsWith('http')) {
            imageUrl = photoField
          } else {
            // Construct URL for uploaded photos
            imageUrl = getApiUrl(`api/upload/photos/${photoField}`)
          }
          
          setPreviewImage(imageUrl)
        }

        // Load related data based on address
        if (data.provinsi) {
          await loadKotaOptionsByProvinsiKode(data.provinsi)
        }
        if (data.kota) {
          await loadKecamatanOptionsByKotaKode(data.kota)
        }
        if (data.kecamatan) {
          await loadKelurahanOptionsByKecamatanKode(data.kecamatan)
        }

      } else {
        showErrorToast('Gagal memuat data pegawai')
        router.push('/')
      }
    } catch (error) {
      console.error('Error loading pegawai data:', error)
      showErrorToast('Gagal memuat data pegawai')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const loadProvinsiOptions = async () => {
    try {
      setLoadingProvinsi(true)
      const response = await fetch(getApiUrl('api/wilayah/provinsi'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setProvinsiOptions(data || [])
      }
    } catch (error) {
      console.error('Error loading provinsi options:', error)
    } finally {
      setLoadingProvinsi(false)
    }
  }

  const loadKotaOptionsByProvinsiKode = async (provinsiKode: string) => {
    try {
      setLoadingKota(true)
      const response = await fetch(getApiUrl(`api/wilayah/kota?provinsiKode=${provinsiKode}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setKotaOptions(data || [])
        setKecamatanOptions([])
        setKelurahanOptions([])
      }
    } catch (error) {
      console.error('Error loading kota options:', error)
    } finally {
      setLoadingKota(false)
    }
  }

  const loadKecamatanOptionsByKotaKode = async (kotaKode: string) => {
    try {
      const response = await fetch(getApiUrl(`api/wilayah/kecamatan?kotaKode=${kotaKode}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setKecamatanOptions(data || [])
        setKelurahanOptions([])
      }
    } catch (error) {
      console.error('Error loading kecamatan options:', error)
    }
  }

  const loadKelurahanOptionsByKecamatanKode = async (kecamatanKode: string) => {
    try {
      const response = await fetch(getApiUrl(`api/wilayah/kelurahan?kecamatanKode=${kecamatanKode}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setKelurahanOptions(data || [])
      }
    } catch (error) {
      console.error('Error loading kelurahan options:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Handle wilayah dependencies
    if (field === 'provinsiId' && value) {
      setFormData(prev => ({
        ...prev,
        kotaId: '',
        kecamatanId: '',
        kelurahanId: '',
        kodePos: ''
      }))
      loadKotaOptionsByProvinsiKode(value)
    } else if (field === 'kotaId' && value) {
      setFormData(prev => ({
        ...prev,
        kecamatanId: '',
        kelurahanId: '',
        kodePos: ''
      }))
      loadKecamatanOptionsByKotaKode(value)
    } else if (field === 'kecamatanId' && value) {
      setFormData(prev => ({
        ...prev,
        kelurahanId: '',
        kodePos: ''
      }))
      loadKelurahanOptionsByKecamatanKode(value)
    } else if (field === 'kelurahanId' && value) {
      // Auto-populate postal code from selected kelurahan
      const selectedKelurahan = kelurahanOptions.find(k => k.kode === value)
      if (selectedKelurahan && (selectedKelurahan as any).kodePos) {
        setFormData(prev => ({
          ...prev,
          kodePos: (selectedKelurahan as any).kodePos || ''
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Personal Information
        if (!formData.fullName?.trim()) {
          showErrorToast('Nama lengkap harus diisi')
          return false
        }
        if (!formData.nip?.trim()) {
          showErrorToast('NIP harus diisi')
          return false
        }
        if (!formData.email?.trim()) {
          showErrorToast('Email harus diisi')
          return false
        }
        if (!formData.phoneNumber?.trim()) {
          showErrorToast('Nomor telepon harus diisi')
          return false
        }
        return true
      
      case 1: // Address Details
        if (!formData.alamat.trim()) {
          showErrorToast('Alamat lengkap harus diisi')
          return false
        }
        if (!formData.provinsiId) {
          showErrorToast('Provinsi harus dipilih')
          return false
        }
        if (!formData.kotaId) {
          showErrorToast('Kota/Kabupaten harus dipilih')
          return false
        }
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

  const handleNext = () => {
    const isValid = validateStep(currentStep)
    
    if (isValid) {
      // Clean up map if moving away from step 1
      if (currentStep === 1 && mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
        setMapLoaded(false)
      }
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    }
  }

  const handleSubmit = async () => {
    // Only allow submit on final step (step 2 - Preview)
    if (currentStep !== 2) {
      showErrorToast('Silakan selesaikan semua langkah terlebih dahulu')
      return
    }
    
    // Validate all steps
    for (let i = 0; i < steps.length - 1; i++) {
      const isValid = validateStep(i)
      if (!isValid) {
        setCurrentStep(i)
        return
      }
    }
    
    if (!user?.id) {
      showErrorToast('User tidak ditemukan')
      return
    }

    try {
      setSaving(true)
      
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
      
      const submitData = {
        nip: formData.nip,
        namaLengkap: formData.fullName,
        email: formData.email,
        noTelp: formData.phoneNumber,
        alamat: formData.alamat,
        provinsi: formData.provinsiId || null,
        kota: formData.kotaId || null,
        kecamatan: formData.kecamatanId || null,
        kelurahan: formData.kelurahanId || null,
        kodePos: formData.kodePos || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        jenisKelamin: formData.gender === 'Laki-Laki' ? 'L' : formData.gender === 'Perempuan' ? 'P' : null,
        tanggalLahir: formData.tgl_lahir || null,
        statusNikah: formData.status_nikah || null,
        tanggalMasuk: formData.tgl_join || null,
        rekening: formData.rekening || null,
        ...(photoUrl && { photoUrl })
      }

      const response = await fetch(getApiUrl(`api/pegawai/${user.id}/self-update`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        showSuccessToast('Data pegawai berhasil diperbarui')
        router.push('/')
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal memperbarui data pegawai')
      }
    } catch (error) {
      console.error('Error updating pegawai:', error)
      showErrorToast('Gagal memperbarui data pegawai')
    } finally {
      setSaving(false)
    }
  }

  const getStepIcon = (step: number) => {
    switch (step) {
      case 0: return User
      case 1: return MapPin
      case 2: return Eye
      default: return User
    }
  }

  if (!mounted) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner />
            <span className="text-muted-foreground">Memuat data pegawai...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-6 w-6" />
                Edit Profil Pegawai
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Perbarui informasi profil Anda
              </p>
            </div>
          </div>

          {/* Stepper */}
          <Card>
            <CardContent className="pt-6">
              <Stepper steps={steps} currentStep={currentStep} />
            </CardContent>
          </Card>

          {/* Form Content */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* Step 1: Personal Information */}
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
                        <Label htmlFor="fullName">Nama Lengkap *</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          placeholder="Masukkan nama lengkap"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nip">NIP (Nomor Induk Pegawai) *</Label>
                        <Input
                          id="nip"
                          value={formData.nip}
                          onChange={(e) => handleInputChange('nip', e.target.value)}
                          placeholder="Masukkan NIP"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="nama@email.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Nomor Telepon *</Label>
                        <Input
                          id="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          required
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

                    <div className="space-y-2">
                      <Label htmlFor="rekening">Nomor Rekening</Label>
                      <Input
                        id="rekening"
                        value={formData.rekening}
                        onChange={(e) => handleInputChange('rekening', e.target.value)}
                        placeholder="Masukkan nomor rekening"
                      />
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
                      <Label htmlFor="alamat">Alamat Lengkap *</Label>
                      <Textarea
                        id="alamat"
                        value={formData.alamat}
                        onChange={(e) => handleInputChange('alamat', e.target.value)}
                        placeholder="Masukkan alamat lengkap (jalan, nomor rumah, dll)"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="provinsi">Provinsi *</Label>
                        <Popover open={provinsiOpen} onOpenChange={setProvinsiOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={provinsiOpen}
                              className="justify-between w-full"
                              disabled={loadingProvinsi}
                            >
                              {formData.provinsiId
                                ? provinsiOptions.find((provinsi) => provinsi.kode === formData.provinsiId)?.nama
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
                                ) : provinsiOptions.length === 0 ? (
                                  <CommandItem disabled>Tidak ada data provinsi</CommandItem>
                                ) : (
                                  provinsiOptions.map((provinsi) => (
                                    <CommandItem
                                      key={provinsi.kode}
                                      value={provinsi.nama}
                                      onSelect={() => {
                                        handleInputChange('provinsiId', provinsi.kode)
                                        setProvinsiOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          formData.provinsiId === provinsi.kode ? "opacity-100" : "opacity-0"
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
                        <Label htmlFor="kota">Kota/Kabupaten *</Label>
                        <Popover open={kotaOpen} onOpenChange={setKotaOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={kotaOpen}
                              className="justify-between w-full"
                              disabled={!formData.provinsiId || loadingKota}
                            >
                              {formData.kotaId
                                ? kotaOptions.find((kota) => kota.kode === formData.kotaId)?.nama
                                : !formData.provinsiId 
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
                                ) : kotaOptions.length === 0 ? (
                                  <CommandItem disabled>Tidak ada data kota</CommandItem>
                                ) : (
                                  kotaOptions.map((kota) => (
                                    <CommandItem
                                      key={kota.kode}
                                      value={kota.nama}
                                      onSelect={() => {
                                        handleInputChange('kotaId', kota.kode)
                                        setKotaOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          formData.kotaId === kota.kode ? "opacity-100" : "opacity-0"
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
                              disabled={!formData.kotaId}
                            >
                              {formData.kecamatanId
                                ? kecamatanOptions.find((kecamatan) => kecamatan.kode === formData.kecamatanId)?.nama
                                : !formData.kotaId 
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
                                {kecamatanOptions.length === 0 ? (
                                  <CommandItem disabled>Tidak ada data kecamatan</CommandItem>
                                ) : (
                                  kecamatanOptions.map((kecamatan) => (
                                    <CommandItem
                                      key={kecamatan.kode}
                                      value={kecamatan.nama}
                                      onSelect={() => {
                                        handleInputChange('kecamatanId', kecamatan.kode)
                                        setKecamatanOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          formData.kecamatanId === kecamatan.kode ? "opacity-100" : "opacity-0"
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
                              disabled={!formData.kecamatanId}
                            >
                              {formData.kelurahanId
                                ? kelurahanOptions.find((kelurahan) => kelurahan.kode === formData.kelurahanId)?.nama
                                : !formData.kecamatanId 
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
                                {kelurahanOptions.length === 0 ? (
                                  <CommandItem disabled>Tidak ada data kelurahan/desa</CommandItem>
                                ) : (
                                  kelurahanOptions.map((kelurahan) => (
                                    <CommandItem
                                      key={kelurahan.kode}
                                      value={kelurahan.nama}
                                      onSelect={() => {
                                        handleInputChange('kelurahanId', kelurahan.kode)
                                        setKelurahanOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          formData.kelurahanId === kelurahan.kode ? "opacity-100" : "opacity-0"
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
                        disabled
                        className="bg-muted"
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
                          className="w-full h-full min-h-96"
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

            {/* Step 3: Preview */}
            {currentStep === 2 && (
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
                        <div><span className="font-medium">Nama:</span> {formData.fullName || '-'}</div>
                        <div><span className="font-medium">NIP:</span> {formData.nip || '-'}</div>
                        <div><span className="font-medium">Email:</span> {formData.email || '-'}</div>
                        <div><span className="font-medium">Telepon:</span> {formData.phoneNumber || '-'}</div>
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
                          <div><span className="font-medium">Provinsi:</span> {provinsiOptions.find(p => p.kode === formData.provinsiId)?.nama || '-'}</div>
                          <div><span className="font-medium">Kota:</span> {kotaOptions.find(k => k.kode === formData.kotaId)?.nama || '-'}</div>
                          <div><span className="font-medium">Kecamatan:</span> {kecamatanOptions.find(k => k.kode === formData.kecamatanId)?.nama || '-'}</div>
                          <div><span className="font-medium">Kelurahan:</span> {kelurahanOptions.find(k => k.kode === formData.kelurahanId)?.nama || '-'}</div>
                          <div><span className="font-medium">Kode Pos:</span> {formData.kodePos || '-'}</div>
                          {formData.latitude && formData.longitude && (
                            <div><span className="font-medium">Koordinat:</span> {formData.latitude}, {formData.longitude}</div>
                          )}
                        </div>
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
                  onClick={() => router.back()}
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
                    disabled={saving}
                    onClick={handleSubmit}
                    className="flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Simpan Perubahan
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
