'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { ServerPagination } from "@/components/ServerPagination"

// Dynamic imports for map components
const LocationMapDesktop = dynamic(() => import('@/components/LocationMapDesktop'), { ssr: false })
const LocationMapMobile = dynamic(() => import('@/components/LocationMapMobile'), { ssr: false })
import { 
  CalendarDays,
  Clock,
  MapPin,
  Camera,
  Filter,
  Calendar as CalendarIcon,
  Search,
  History,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  Zap,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Users,
  Trash2
} from 'lucide-react'
import { getApiUrl } from "@/lib/config"
import { useAuth } from "@/contexts/AuthContext"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { toast } from "sonner"

interface AbsensiHistory {
  id: number
  tanggal: string
  waktu: string
  type: string
  shift: string
  status: string
  latitude: number
  longitude: number
  jarak: number
  lokasi?: string
  photoUrl?: string
  pegawaiNama: string
  pegawaiId: number
  pegawaiNip?: string
  shiftLockLokasi?: string
}

interface AbsensiStats {
  totalHadir: number
  totalTerlambat: number
  totalPulangCepat: number
  totalAlpha: number
  bulanIni: number
}

interface Pegawai {
  id: number
  namaLengkap: string
  username: string
  email: string
}

export default function MasterDataHistoriAbsensi() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [historyData, setHistoryData] = useState<AbsensiHistory[]>([])
  const [stats, setStats] = useState<AbsensiStats>({
    totalHadir: 0,
    totalTerlambat: 0,
    totalPulangCepat: 0,
    totalAlpha: 0,
    bulanIni: 0
  })
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [pageSize, setPageSize] = useState(30)
  
  // Filter states
  const [startDate, setStartDate] = useState<Date>(() => {
    // Default to start of current month
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [endDate, setEndDate] = useState<Date>(() => {
    // Default to end of current month
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, 0)
  })
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [selectedJenis, setSelectedJenis] = useState<string>('semua')
  const [selectedStatus, setSelectedStatus] = useState<string>('semua')
  const [selectedPegawai, setSelectedPegawai] = useState<string>('semua')
  const [showFilters, setShowFilters] = useState(false)
  
  // Popup states
  const [showMapModal, setShowMapModal] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [selectedAbsensi, setSelectedAbsensi] = useState<AbsensiHistory | null>(null)

  // Pegawai list for filter
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([])

  // State for current location data (for map display)
  const [currentLocationData, setCurrentLocationData] = useState<{
    pegawaiLokasi: any
    pegawaiData: any
  } | null>(null)

  // Load pegawai data when map modal is opened
  const loadPegawaiLocationData = async (pegawaiId: number) => {
    try {
      const response = await fetch(getApiUrl(`api/pegawai/${pegawaiId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const pegawaiData = await response.json()
        setCurrentLocationData({
          pegawaiLokasi: pegawaiData.lokasi,
          pegawaiData: pegawaiData
        })
      }
    } catch (error) {
      console.error('Error loading pegawai location data:', error)
    }
  }

  // Helper function to calculate distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  useEffect(() => {
    if (user) {
      loadHistoryData()
      loadStats()
      loadPegawaiList()
    }
  }, [user, currentPage, pageSize, startDate, endDate, selectedJenis, selectedStatus, selectedPegawai])

  const loadPegawaiList = async () => {
    try {
      const response = await fetch(getApiUrl('api/admin/master-data/pegawai'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPegawaiList(data.content || [])
      }
    } catch (error) {
      console.error('Error loading pegawai list:', error)
    }
  }

  const loadHistoryData = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('size', pageSize.toString())
      params.append('sortBy', 'tanggal')
      params.append('sortDir', 'desc')
      
      // Add date range filter
      if (startDate) {
        params.append('startDate', format(startDate, 'yyyy-MM-dd'))
      }
      if (endDate) {
        params.append('endDate', format(endDate, 'yyyy-MM-dd'))
      }

      // Add jenis filter
      if (selectedJenis && selectedJenis !== 'semua') {
        params.append('type', selectedJenis.toUpperCase())
      }

      // Add status filter
      if (selectedStatus && selectedStatus !== 'semua') {
        params.append('status', selectedStatus.toUpperCase())
      }

      // Add pegawai filter
      if (selectedPegawai && selectedPegawai !== 'semua') {
        params.append('pegawaiId', selectedPegawai)
      }

      const response = await fetch(getApiUrl(`api/absensi/history/all?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setHistoryData(data.content || [])
        setTotalPages(data.totalPages || 0)
        setTotalElements(data.totalElements || 0)
      }
    } catch (error) {
      console.error('Error loading history data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const params = new URLSearchParams()
      if (startDate) {
        params.append('startDate', format(startDate, 'yyyy-MM-dd'))
      }
      if (endDate) {
        params.append('endDate', format(endDate, 'yyyy-MM-dd'))
      }
      if (selectedPegawai && selectedPegawai !== 'semua') {
        params.append('pegawaiId', selectedPegawai)
      }

      const response = await fetch(getApiUrl(`api/absensi/stats/all?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSearch = () => {
    setCurrentPage(0)
    loadHistoryData()
  }

  const handleClearFilters = () => {
    // Reset to current month
    const now = new Date()
    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1))
    setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    setSelectedJenis('semua')
    setSelectedStatus('semua')
    setSelectedPegawai('semua')
    setCurrentPage(0)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hadir':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Hadir</Badge>
      case 'terlambat':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Terlambat</Badge>
      case 'pulang_cepat':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">Pulang Cepat</Badge>
      case 'alpha':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Alpha</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'masuk':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Masuk</Badge>
      case 'pulang':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">Pulang</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5) // HH:MM format
  }

  const handleDeleteAbsensi = async (absensiId: number, pegawaiNama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data absensi ${pegawaiNama}? Pegawai dapat melakukan absensi ulang setelah data dihapus.`)) {
      return
    }

    try {
      const response = await fetch(getApiUrl(`api/absensi/${absensiId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        toast.success(`Data absensi ${pegawaiNama} berhasil dihapus`)
        loadHistoryData()
        loadStats()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Gagal menghapus data absensi')
      }
    } catch (error) {
      console.error('Error deleting absensi:', error)
      toast.error('Terjadi kesalahan saat menghapus data absensi')
    }
  }

  const getJenisBadge = (jenis: string) => {
    switch (jenis.toLowerCase()) {
      case 'masuk':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Masuk</Badge>
      case 'pulang':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">Pulang</Badge>
      default:
        return <Badge variant="outline">{jenis}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-2 md:p-6">
      <div className="container mx-auto space-y-4 md:space-y-8">
        <AdminPageHeader 
          title="Histori Absensi" 
          description="Kelola dan pantau riwayat absensi seluruh pegawai"
          icon={History}
        />

        {/* Stats Cards */}
        {!loading && (
          <>
            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-5 gap-4">
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="pt-6 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hadir</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalHadir}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="pt-6 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Terlambat</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalTerlambat}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="pt-6 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <Timer className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pulang Cepat</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPulangCepat}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="pt-6 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alpha</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalAlpha}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="pt-6 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bulan Ini</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.bulanIni}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Slideshow */}
            <div className="md:hidden">
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-4">
                  <div className="overflow-x-auto">
                    <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
                      <div className="flex-shrink-0 w-32 text-center">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total Hadir</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.totalHadir}</p>
                      </div>

                      <div className="flex-shrink-0 w-32 text-center">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                          <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Terlambat</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.totalTerlambat}</p>
                      </div>

                      <div className="flex-shrink-0 w-32 text-center">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                          <Timer className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Pulang Cepat</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPulangCepat}</p>
                      </div>

                      <div className="flex-shrink-0 w-32 text-center">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                          <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Alpha</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.totalAlpha}</p>
                      </div>

                      <div className="flex-shrink-0 w-32 text-center">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                          <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Bulan Ini</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.bulanIni}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Filters */}
        <Card className="mb-4 md:mb-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center text-gray-900 dark:text-gray-100">
                <Filter className="w-5 h-5 mr-2" />
                Filter Riwayat Absensi
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                {showFilters ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Sembunyikan
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Tampilkan Filter
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {!showFilters && (
            <CardContent className="pt-0 p-3 md:p-6">
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 space-y-1 md:space-y-0">
                <div><span className="font-medium">Periode:</span> {format(startDate, "dd MMM yyyy", { locale: id })} - {format(endDate, "dd MMM yyyy", { locale: id })}</div>
                {selectedPegawai !== 'semua' && <div className="md:ml-4"><span className="font-medium">Pegawai:</span> {pegawaiList.find(p => p.id.toString() === selectedPegawai)?.namaLengkap || 'Unknown'}</div>}
                {selectedJenis !== 'semua' && <div className="md:ml-4"><span className="font-medium">Jenis:</span> {selectedJenis.charAt(0).toUpperCase() + selectedJenis.slice(1)}</div>}
                {selectedStatus !== 'semua' && <div className="md:ml-4"><span className="font-medium">Status:</span> {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}</div>}
              </div>
            </CardContent>
          )}
          {showFilters && (
            <CardContent className="p-3 md:p-6">
              <div className="space-y-3 md:space-y-4">
                {/* Row 1: Periode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Dari Tanggal
                    </label>
                    <Popover open={showStartDatePicker} onOpenChange={setShowStartDatePicker}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(startDate, "dd MMM yyyy", { locale: id })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            if (date) setStartDate(date)
                            setShowStartDatePicker(false)
                          }}
                          locale={id}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Sampai Tanggal
                    </label>
                    <Popover open={showEndDatePicker} onOpenChange={setShowEndDatePicker}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(endDate, "dd MMM yyyy", { locale: id })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            if (date) setEndDate(date)
                            setShowEndDatePicker(false)
                          }}
                          locale={id}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Row 2: Pegawai dan Jenis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Pegawai
                    </label>
                    <Select value={selectedPegawai} onValueChange={setSelectedPegawai}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pegawai" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semua">Semua Pegawai</SelectItem>
                        {pegawaiList.map((pegawai) => (
                          <SelectItem key={pegawai.id} value={pegawai.id.toString()}>
                            {pegawai.namaLengkap}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Jenis Absensi
                    </label>
                    <Select value={selectedJenis} onValueChange={setSelectedJenis}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis absensi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semua">Semua Jenis</SelectItem>
                        <SelectItem value="masuk">Masuk</SelectItem>
                        <SelectItem value="pulang">Pulang</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Status dan Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Status Absensi
                    </label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status absensi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semua">Semua Status</SelectItem>
                        <SelectItem value="hadir">Hadir</SelectItem>
                        <SelectItem value="terlambat">Terlambat</SelectItem>
                        <SelectItem value="pulang_cepat">Pulang Cepat</SelectItem>
                        <SelectItem value="alpha">Alpha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Jumlah Data per Halaman
                    </label>
                    <Select value={pageSize.toString()} onValueChange={(value) => {
                      setPageSize(Number(value))
                      setCurrentPage(0)
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 data</SelectItem>
                        <SelectItem value="50">50 data</SelectItem>
                        <SelectItem value="100">100 data</SelectItem>
                        <SelectItem value="1000">1000 data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col md:flex-row gap-2">
                    <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
                      <Search className="w-4 h-4 mr-2" />
                      Terapkan Filter
                    </Button>

                    <Button variant="outline" onClick={handleClearFilters} className="border-gray-300 dark:border-gray-600 w-full md:w-auto">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* History Table */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
              Riwayat Absensi ({totalElements} data)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Memuat data...</p>
              </div>
            ) : historyData.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">Tidak ada data absensi</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Pegawai</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead>Jarak</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Foto</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {format(new Date(item.tanggal), "dd MMM yyyy", { locale: id })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1 text-gray-500" />
                              {item.waktu}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2 text-gray-500" />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {item.pegawaiNama}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {item.pegawaiId}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getJenisBadge(item.type)}
                          </TableCell>
                          <TableCell>{item.shift}</TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {item.shiftLockLokasi === 'HARUS_DI_KANTOR' ? 'Di Kantor' : 'Fleksibel'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                setSelectedAbsensi(item)
                                await loadPegawaiLocationData(item.pegawaiId)
                                setShowMapModal(true)
                              }}
                              className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              <MapPin className="w-4 h-4 mr-1" />
                              {Math.round(item.jarak)} m
                            </Button>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(item.status)}
                          </TableCell>
                          <TableCell>
                            {item.photoUrl ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedAbsensi(item)
                                  setShowPhotoModal(true)
                                }}
                                className="hover:bg-green-50 dark:hover:bg-green-900/20"
                              >
                                <Camera className="w-4 h-4 mr-1" />
                                Lihat
                              </Button>
                            ) : (
                              <span className="text-gray-400 text-sm">Tidak ada</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAbsensi(item.id, item.pegawaiNama)}
                              className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border-red-200 hover:border-red-300"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Hapus
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {historyData.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                      {/* Header with Date and Type */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {format(new Date(item.tanggal), "dd MMM yyyy", { locale: id })}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.waktu}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {getJenisBadge(item.type)}
                          {getStatusBadge(item.status)}
                        </div>
                      </div>

                      {/* Pegawai Info */}
                      <div className="flex items-center mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <Users className="w-4 h-4 mr-2 text-gray-500" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {item.pegawaiNama}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {item.pegawaiId}
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Shift:</span>
                          <Badge variant="outline" className="text-xs">
                            {item.shift}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Lokasi:</span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {item.shiftLockLokasi === 'HARUS_DI_KANTOR' ? 'Di Kantor' : 'Fleksibel'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setSelectedAbsensi(item)
                            await loadPegawaiLocationData(item.pegawaiId)
                            setShowMapModal(true)
                          }}
                          className="flex-1 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <MapPin className="w-4 h-4 mr-1" />
                          {Math.round(item.jarak)} m
                        </Button>
                        {item.photoUrl ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAbsensi(item)
                              setShowPhotoModal(true)
                            }}
                            className="flex-1 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <Camera className="w-4 h-4 mr-1" />
                            Foto
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="flex-1"
                          >
                            <Camera className="w-4 h-4 mr-1" />
                            -
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAbsensi(item.id, item.pegawaiNama)}
                          className="flex-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border-red-200 hover:border-red-300"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <ServerPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize)
                    setCurrentPage(0)
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map Modal */}
        {selectedAbsensi && (
          <>
            {/* Desktop View */}
            <div className="hidden md:block">
              <LocationMapDesktop
                showLocationMap={showMapModal}
                setShowLocationMap={setShowMapModal}
                currentLocation={{
                  lat: selectedAbsensi.latitude,
                  lng: selectedAbsensi.longitude
                }}
                selectedShift={{
                  lockLokasi: selectedAbsensi.shiftLockLokasi || 
                    (selectedAbsensi.shift.toLowerCase().includes('kantor') ? 'HARUS_DI_KANTOR' : 'FLEKSIBEL')
                }}
                pegawaiLokasi={selectedAbsensi.shiftLockLokasi === 'HARUS_DI_KANTOR' ? 
                  currentLocationData?.pegawaiLokasi : null}
                pegawaiData={currentLocationData?.pegawaiData}
                distance={selectedAbsensi.shiftLockLokasi === 'HARUS_DI_KANTOR' ? 
                  selectedAbsensi.jarak : null}
                distanceToHome={selectedAbsensi.shiftLockLokasi !== 'HARUS_DI_KANTOR' ? 
                  selectedAbsensi.jarak : 
                  (currentLocationData?.pegawaiData?.latitude && currentLocationData?.pegawaiData?.longitude) ?
                  calculateDistance(
                    selectedAbsensi.latitude, 
                    selectedAbsensi.longitude,
                    currentLocationData.pegawaiData.latitude,
                    currentLocationData.pegawaiData.longitude
                  ) : null}
                isLocationAllowed={true}
              />
            </div>
            
            {/* Mobile View */}
            <div className="md:hidden">
              <LocationMapMobile
                showLocationMap={showMapModal}
                setShowLocationMap={setShowMapModal}
                currentLocation={{
                  lat: selectedAbsensi.latitude,
                  lng: selectedAbsensi.longitude
                }}
                selectedShift={{
                  lockLokasi: selectedAbsensi.shiftLockLokasi || 
                    (selectedAbsensi.shift.toLowerCase().includes('kantor') ? 'HARUS_DI_KANTOR' : 'FLEKSIBEL')
                }}
                pegawaiLokasi={selectedAbsensi.shiftLockLokasi === 'HARUS_DI_KANTOR' ? 
                  currentLocationData?.pegawaiLokasi : null}
                pegawaiData={currentLocationData?.pegawaiData}
                distance={selectedAbsensi.shiftLockLokasi === 'HARUS_DI_KANTOR' ? 
                  selectedAbsensi.jarak : null}
                distanceToHome={selectedAbsensi.shiftLockLokasi !== 'HARUS_DI_KANTOR' ? 
                  selectedAbsensi.jarak : 
                  (currentLocationData?.pegawaiData?.latitude && currentLocationData?.pegawaiData?.longitude) ?
                  calculateDistance(
                    selectedAbsensi.latitude, 
                    selectedAbsensi.longitude,
                    currentLocationData.pegawaiData.latitude,
                    currentLocationData.pegawaiData.longitude
                  ) : null}
                isLocationAllowed={true}
              />
            </div>
          </>
        )}

        {/* Photo Modal */}
        <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Camera className="w-5 h-5 mr-2 text-green-600" />
                Foto Absensi
              </DialogTitle>
            </DialogHeader>
            
            {selectedAbsensi && (
              <div className="space-y-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {selectedAbsensi.pegawaiNama} {selectedAbsensi.pegawaiNip && `(${selectedAbsensi.pegawaiNip})`}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {formatDate(selectedAbsensi.tanggal)} - {formatTime(selectedAbsensi.waktu)}
                  </p>
                  <div className="mb-3">{getTypeBadge(selectedAbsensi.type)}</div>
                  <div className="mb-2">{getStatusBadge(selectedAbsensi.status)}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedAbsensi.lokasi || selectedAbsensi.shiftLockLokasi || 'Lokasi tidak tersedia'} ({Math.round(selectedAbsensi.jarak)}m)
                  </p>
                </div>

                {selectedAbsensi.photoUrl ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto max-w-sm">
                      <img 
                        src={selectedAbsensi.photoUrl.startsWith('http') 
                          ? selectedAbsensi.photoUrl 
                          : selectedAbsensi.photoUrl.startsWith('photos/') 
                            ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload/${selectedAbsensi.photoUrl}`
                            : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload/photos/${selectedAbsensi.photoUrl}`
                        }
                        alt="Foto Absensi" 
                        className="w-full h-auto rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg object-cover"
                        style={{ maxHeight: '400px' }}
                        onError={(e) => {
                          e.currentTarget.src = '/images/placeholder-avatar.png'
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Tidak ada foto</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
