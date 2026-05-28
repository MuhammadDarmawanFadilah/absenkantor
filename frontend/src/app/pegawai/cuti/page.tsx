'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { CalendarIcon, Upload, FileText, Clock, CheckCircle, XCircle, Calendar as CalendarDays, History, Eye, Filter, Search, Download, Plus, Image, File, AlertCircle, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { usePusherNotifications } from "@/hooks/usePusherNotifications"
import { getApiUrl } from "@/lib/config"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { pegawaiCutiQuotaService, PegawaiCutiQuota as PegawaiCutiQuotaType } from '@/services/pegawaiCutiQuotaService'

interface CutiStats {
  totalCuti: number
  cutiTerpakai: number
  sisaCuti: number
}

interface CutiResponse {
  id: number
  tanggalCuti: string
  jenisCutiNama: string
  alasanCuti: string
  statusApproval: string
  catatanApproval?: string
  approvedByName?: string
  createdAt: string
  lampiranCuti?: string
}

interface JenisCuti {
  id: number
  namaCuti: string
  deskripsi?: string
  isActive: boolean
}

interface PegawaiCutiQuota {
  jenisCutiId: number
  jenisCutiNama: string
  tahun: number
  jumlahHari: number
  cutiTerpakai: number
  sisaCuti: number
}

export default function PengajuanCutiPage() {
  const { user } = useAuth()
  const [tipeCuti, setTipeCuti] = useState('CUTI')
  const [tanggalDari, setTanggalDari] = useState<Date>()
  const [tanggalKe, setTanggalKe] = useState<Date>()
  const [jenisCuti, setJenisCuti] = useState('')
  const [alasanCuti, setAlasanCuti] = useState('')
  const [lampiranFile, setLampiranFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [cutiStats, setCutiStats] = useState<CutiStats | null>(null)
  const [riwayatCuti, setRiwayatCuti] = useState<CutiResponse[]>([])
  const [allCutiHistory, setAllCutiHistory] = useState<CutiResponse[]>([])
  const [jenisCutiOptions, setJenisCutiOptions] = useState<JenisCuti[]>([])
  const [pegawaiCutiQuota, setPegawaiCutiQuota] = useState<PegawaiCutiQuotaType[]>([])
  const [activeTab, setActiveTab] = useState('form')
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyFilter, setHistoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('semua')
  const [previewFile, setPreviewFile] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Initialize Pusher notifications for employee
  usePusherNotifications({
    onCutiResponse: (data: any) => {
      const status = data.status?.toLowerCase()
      if (status === 'disetujui') {
        toast.success("Pengajuan cuti disetujui!", {
          description: `Cuti tanggal ${data.tanggalCuti} telah disetujui`,
        });
      } else if (status === 'ditolak') {
        toast.error("Pengajuan cuti ditolak", {
          description: `Cuti tanggal ${data.tanggalCuti} ditolak. ${data.keterangan || ''}`,
        });
      }
      // Refresh data setelah menerima notifikasi
      loadRiwayatCuti()
    }
  });

  useEffect(() => {
    if (user) {
      loadCutiStats()
      loadRiwayatCuti()
      loadJenisCutiOptions()
      loadPegawaiCutiQuota()
    }
  }, [user])

  const loadCutiStats = async () => {
    try {
      const response = await fetch(getApiUrl(`api/cuti/stats/${user?.id}`))
      if (response.ok) {
        const data = await response.json()
        setCutiStats(data)
      }
    } catch (error) {
      console.error('Error loading cuti stats:', error)
    }
  }

  const loadRiwayatCuti = async () => {
    try {
      const response = await fetch(getApiUrl(`api/cuti/pegawai/${user?.id}?size=5`))
      if (response.ok) {
        const data = await response.json()
        setRiwayatCuti(data.content || [])
      }
    } catch (error) {
      console.error('Error loading riwayat cuti:', error)
    }
  }

  const loadAllCutiHistory = async () => {
    if (!user?.id) {
      console.error('User ID not available')
      return
    }

    setIsLoadingHistory(true)
    try {
      console.log('Loading all cuti history for user:', user.id)
      const response = await fetch(getApiUrl(`api/cuti/pegawai/${user?.id}?size=100`))
      
      if (response.ok) {
        const data = await response.json()
        console.log('All cuti history response:', data)
        
        if (data.content && Array.isArray(data.content)) {
          setAllCutiHistory(data.content)
          console.log('Set allCutiHistory with', data.content.length, 'items')
        } else {
          console.warn('Invalid data structure received:', data)
          setAllCutiHistory([])
        }
      } else {
        console.error('Failed to load all cuti history:', response.status, response.statusText)
        toast.error('Gagal memuat riwayat cuti lengkap')
        setAllCutiHistory([])
      }
    } catch (error) {
      console.error('Error loading all cuti history:', error)
      toast.error('Gagal memuat riwayat cuti')
      setAllCutiHistory([])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const loadJenisCutiOptions = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch(getApiUrl('api/jenis-cuti/active'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setJenisCutiOptions(data.filter((item: JenisCuti) => item.isActive))
      }
    } catch (error) {
      console.error('Error loading jenis cuti:', error)
    }
  }

  const loadPegawaiCutiQuota = async () => {
    try {
      if (!user?.id) return

      const data = await pegawaiCutiQuotaService.getPegawaiCutiQuota(user.id)
      setPegawaiCutiQuota(data)
    } catch (error) {
      console.error('Error loading pegawai cuti quota:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Ukuran file maksimal 5MB')
        return
      }
      setLampiranFile(file)
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file)
        setPreviewFile(previewUrl)
      } else {
        setPreviewFile(null)
      }
    }
  }

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return <File className="w-4 h-4" />
    
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const isImageFile = (fileName?: string) => {
    if (!fileName) return false
    const extension = fileName.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')
  }

  const handleDownloadAttachment = async (cutiId: number, fileName: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(getApiUrl(`api/cuti/${cutiId}/download-attachment`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Lampiran berhasil diunduh')
      } else {
        toast.error('Gagal mengunduh lampiran')
      }
    } catch (error) {
      console.error('Error downloading attachment:', error)
      toast.error('Terjadi kesalahan saat mengunduh lampiran')
    }
  }

  const handlePreviewAttachment = (cutiId: number, fileName: string) => {
    const token = localStorage.getItem('auth_token')
    const attachmentUrl = getApiUrl(`api/cuti/${cutiId}/view-attachment?token=${token}`)
    setPreviewFile(attachmentUrl)
    setShowPreview(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasi berdasarkan tipe cuti
    if (tipeCuti === 'CUTI') {
      if (!tanggalDari || !tanggalKe || !jenisCuti || !alasanCuti) {
        toast.error('Mohon lengkapi semua field yang wajib diisi')
        return
      }
    } else {
      // Untuk SAKIT, jenisCuti tidak wajib
      if (!tanggalDari || !tanggalKe || !alasanCuti) {
        toast.error('Mohon lengkapi semua field yang wajib diisi')
        return
      }
    }

    if (tanggalDari > tanggalKe) {
      toast.error('Tanggal mulai tidak boleh lebih besar dari tanggal selesai')
      return
    }

    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('pegawaiId', user?.id.toString() || '')
      formData.append('tanggalDari', format(tanggalDari, 'yyyy-MM-dd'))
      formData.append('tanggalKe', format(tanggalKe, 'yyyy-MM-dd'))
      formData.append('tipeCuti', tipeCuti)
      if (tipeCuti === 'CUTI' && jenisCuti) {
        formData.append('jenisCuti', jenisCuti)
      }
      formData.append('alasanCuti', alasanCuti)
      
      if (lampiranFile) {
        formData.append('lampiranCuti', lampiranFile)
      }

      const response = await fetch(getApiUrl('api/cuti/ajukan'), {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast.success(`Pengajuan ${tipeCuti === 'SAKIT' ? 'sakit' : 'cuti'} berhasil disubmit!`)
        
        // Reset form
        setTipeCuti('CUTI')
        setTanggalDari(undefined)
        setTanggalKe(undefined)
        setJenisCuti('')
        setAlasanCuti('')
        setLampiranFile(null)
        setPreviewFile(null)
        
        // Reload data
        loadCutiStats()
        loadRiwayatCuti()
        if (activeTab === 'history') {
          loadAllCutiHistory()
        }
      } else {
        const errorData = await response.text()
        toast.error(errorData || `Gagal mengajukan ${tipeCuti === 'SAKIT' ? 'sakit' : 'cuti'}`)
      }
    } catch (error) {
      console.error('Error submitting cuti:', error)
      toast.error(`Terjadi kesalahan saat mengajukan ${tipeCuti === 'SAKIT' ? 'sakit' : 'cuti'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      case 'DIAJUKAN':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          <FileText className="w-3 h-3 mr-1" />
          Diajukan
        </Badge>
      case 'DISETUJUI':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Disetujui
        </Badge>
      case 'DITOLAK':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <XCircle className="w-3 h-3 mr-1" />
          Ditolak
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const calculateDays = () => {
    if (tanggalDari && tanggalKe) {
      const diffTime = Math.abs(tanggalKe.getTime() - tanggalDari.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      return diffDays
    }
    return 0
  }

  const filteredHistory = allCutiHistory.filter(cuti => {
    const matchesSearch = historyFilter === '' || 
      cuti.jenisCutiNama?.toLowerCase().includes(historyFilter.toLowerCase()) ||
      cuti.alasanCuti?.toLowerCase().includes(historyFilter.toLowerCase())
    
    const matchesStatus = statusFilter === 'semua' || cuti.statusApproval === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Debug logging for filtered history
  console.log('All cuti history count:', allCutiHistory.length)
  console.log('Filtered history count:', filteredHistory.length)
  console.log('History filter:', historyFilter)
  console.log('Status filter:', statusFilter)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === 'history') {
      // Load all history when switching to history tab
      loadAllCutiHistory()
    }
  }

  const handleLihatSemua = () => {
    // Clear any existing filters
    setHistoryFilter('')
    setStatusFilter('semua')
    // Switch to history tab and load all data
    setActiveTab('history')
    loadAllCutiHistory()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-2 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                📅 Manajemen Cuti
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Kelola pengajuan cuti dan lihat riwayat cuti Anda
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden md:flex">
                {new Date().getFullYear()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6">
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium opacity-90">Total Pengajuan</p>
                    <p className="text-2xl font-bold">
                      {riwayatCuti.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium opacity-90">Disetujui</p>
                    <p className="text-2xl font-bold">
                      {riwayatCuti.filter(cuti => cuti.statusApproval === 'DISETUJUI').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <XCircle className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium opacity-90">Ditolak</p>
                    <p className="text-2xl font-bold">
                      {riwayatCuti.filter(cuti => cuti.statusApproval === 'DITOLAK').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium opacity-90">Pending</p>
                    <p className="text-2xl font-bold">
                      {riwayatCuti.filter(cuti => cuti.statusApproval === 'PENDING').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Slideshow */}
          <div className="md:hidden">
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x snap-mandatory">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg min-w-[280px] snap-center">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium opacity-90">Total Pengajuan</p>
                      <p className="text-2xl font-bold">
                        {riwayatCuti.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg min-w-[280px] snap-center">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium opacity-90">Disetujui</p>
                      <p className="text-2xl font-bold">
                        {riwayatCuti.filter(cuti => cuti.statusApproval === 'DISETUJUI').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg min-w-[280px] snap-center">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <XCircle className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium opacity-90">Ditolak</p>
                      <p className="text-2xl font-bold">
                        {riwayatCuti.filter(cuti => cuti.statusApproval === 'DITOLAK').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg min-w-[280px] snap-center">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium opacity-90">Pending</p>
                      <p className="text-2xl font-bold">
                        {riwayatCuti.filter(cuti => cuti.statusApproval === 'PENDING').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Dots indicator for mobile */}
            <div className="flex justify-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="form" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Pengajuan Baru
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Riwayat Lengkap
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Pengajuan */}
              <div className="lg:col-span-2">
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-t-lg">
                    <CardTitle className="text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5" />
                      Form Pengajuan {tipeCuti === 'SAKIT' ? 'Sakit' : 'Cuti'}
                    </CardTitle>
                    <CardDescription>
                      Isi form di bawah untuk mengajukan permohonan {tipeCuti === 'SAKIT' ? 'sakit' : 'cuti'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Tipe Cuti/Sakit */}
                      <div className="space-y-2">
                        <Label htmlFor="tipeCuti" className="text-sm font-medium flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          Pilih Tipe *
                        </Label>
                        <Select value={tipeCuti} onValueChange={(value) => {
                          setTipeCuti(value)
                          if (value === 'SAKIT') {
                            setJenisCuti('') // Reset jenis cuti ketika pilih sakit
                          }
                        }}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Pilih tipe" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CUTI">Cuti</SelectItem>
                            <SelectItem value="SAKIT">Sakit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Tanggal Cuti */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tanggalDari" className="text-sm font-medium flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            Tanggal Mulai {tipeCuti === 'SAKIT' ? 'Sakit' : 'Cuti'} *
                          </Label>
                          <Popover open={showStartDatePicker} onOpenChange={setShowStartDatePicker}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal h-11"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {tanggalDari ? format(tanggalDari, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={tanggalDari}
                                onSelect={(date) => {
                                  setTanggalDari(date)
                                  setShowStartDatePicker(false)
                                }}
                                disabled={(date) => {
                                  const today = new Date()
                                  today.setHours(0, 0, 0, 0)
                                  return date < today
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tanggalKe" className="text-sm font-medium flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            Tanggal Selesai {tipeCuti === 'SAKIT' ? 'Sakit' : 'Cuti'} *
                          </Label>
                          <Popover open={showEndDatePicker} onOpenChange={setShowEndDatePicker}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal h-11"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {tanggalKe ? format(tanggalKe, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={tanggalKe}
                                onSelect={(date) => {
                                  setTanggalKe(date)
                                  setShowEndDatePicker(false)
                                }}
                                disabled={(date) => {
                                  const today = new Date()
                                  today.setHours(0, 0, 0, 0)
                                  const startDate = tanggalDari || today
                                  return date < startDate
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Durasi */}
                      {tanggalDari && tanggalKe && (
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                              Durasi {tipeCuti === 'SAKIT' ? 'Sakit' : 'Cuti'}: {calculateDays()} hari
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Jenis Cuti - Only show for CUTI */}
                      {tipeCuti === 'CUTI' && (
                        <div className="space-y-2">
                          <Label htmlFor="jenisCuti" className="text-sm font-medium flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            Jenis Cuti *
                          </Label>
                          <Select value={jenisCuti} onValueChange={setJenisCuti}>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Pilih jenis cuti" />
                            </SelectTrigger>
                            <SelectContent>
                              {jenisCutiOptions.map((jenis) => {
                                const quota = pegawaiCutiQuota.find(q => q.jenisCutiId === jenis.id)
                                const isAvailable = quota && quota.sisaCuti > 0
                                
                                return (
                                  <SelectItem 
                                    key={jenis.id} 
                                    value={jenis.id.toString()}
                                    disabled={!isAvailable}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span>{jenis.namaCuti}</span>
                                      {quota && (
                                      <Badge variant={isAvailable ? "secondary" : "destructive"} className="ml-2">
                                        {quota.sisaCuti} hari
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      )}

                      {/* Alasan */}
                      <div className="space-y-2">
                        <Label htmlFor="alasanCuti" className="text-sm font-medium">
                          Alasan {tipeCuti === 'SAKIT' ? 'Sakit' : 'Cuti'} *
                        </Label>
                        <Textarea
                          id="alasanCuti"
                          value={alasanCuti}
                          onChange={(e) => setAlasanCuti(e.target.value)}
                          placeholder={`Jelaskan alasan pengajuan ${tipeCuti === 'SAKIT' ? 'sakit' : 'cuti'}...`}
                          className="min-h-[100px] resize-none"
                        />
                      </div>

                      {/* Lampiran */}
                      <div className="space-y-2">
                        <Label htmlFor="lampiran" className="text-sm font-medium flex items-center gap-1">
                          <Upload className="w-4 h-4" />
                          Lampiran (Opsional)
                        </Label>
                        <div className="space-y-2">
                          <Input
                            id="lampiran"
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            className="cursor-pointer h-11"
                          />
                          <p className="text-xs text-gray-500">
                            Format yang didukung: PDF, JPG, PNG, DOC, DOCX (Maks. 5MB)
                          </p>
                          {lampiranFile && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <div className="flex items-center gap-2 flex-1">
                                {getFileIcon(lampiranFile.name)}
                                <span className="text-sm text-green-700 dark:text-green-300">
                                  {lampiranFile.name}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                {isImageFile(lampiranFile.name) && previewFile && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button type="button" variant="outline" size="sm">
                                        <Eye className="w-4 h-4 mr-1" />
                                        Preview
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[80vw] max-h-[95vh] w-[95vw] sm:w-[90vw] lg:w-[85vw] xl:w-[80vw] h-[95vh] p-0">
                                      <DialogHeader className="p-4 sm:p-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                                        <DialogTitle className="text-lg sm:text-xl font-semibold">Preview Lampiran</DialogTitle>
                                        <DialogDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                          {lampiranFile.name}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="flex justify-center items-center h-[calc(95vh-120px)] overflow-auto p-2 sm:p-4 bg-gray-50 dark:bg-gray-900">
                                        <img 
                                          src={previewFile} 
                                          alt="Preview" 
                                          className="w-full h-full min-w-0 min-h-0 object-contain rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                        />
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    try {
                                      const url = URL.createObjectURL(lampiranFile)
                                      const a = document.createElement('a')
                                      a.href = url
                                      a.download = lampiranFile.name
                                      a.style.display = 'none'
                                      document.body.appendChild(a)
                                      a.click()
                                      document.body.removeChild(a)
                                      URL.revokeObjectURL(url)
                                      toast.success('File berhasil diunduh')
                                    } catch (error) {
                                      toast.error('Gagal mengunduh file')
                                    }
                                  }}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Submit Button */}
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 text-base font-medium shadow-lg"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Mengajukan {tipeCuti === 'SAKIT' ? 'Sakit' : 'Cuti'}...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 mr-2" />
                            Ajukan {tipeCuti === 'SAKIT' ? 'Sakit' : 'Cuti'}
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Riwayat Cuti Terbaru */}
              <div className="lg:col-span-1">
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-t-lg">
                    <CardTitle className="text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Pengajuan Terbaru
                    </CardTitle>
                    <CardDescription>
                      5 pengajuan cuti terakhir
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {riwayatCuti.length > 0 ? (
                        riwayatCuti.map((cuti) => (
                          <div key={cuti.id} className="p-3 border rounded-lg dark:border-gray-600 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-sm">
                                  {format(new Date(cuti.tanggalCuti), "dd MMM yyyy", { locale: id })}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {cuti.jenisCutiNama}
                                </p>
                              </div>
                              {getStatusBadge(cuti.statusApproval)}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {cuti.alasanCuti}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Belum ada riwayat cuti
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {riwayatCuti.length > 0 && (
                      <div className="mt-4 pt-3 border-t">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={handleLihatSemua}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Lihat Semua
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Riwayat Cuti Lengkap
                    </CardTitle>
                    <CardDescription>
                      Semua riwayat pengajuan cuti Anda
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Cari berdasarkan jenis cuti atau alasan..."
                        value={historyFilter}
                        onChange={(e) => setHistoryFilter(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semua">Semua Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
                      <SelectItem value="DISETUJUI">Disetujui</SelectItem>
                      <SelectItem value="DITOLAK">Ditolak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Memuat riwayat...</span>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal Cuti</TableHead>
                          <TableHead>Jenis Cuti</TableHead>
                          <TableHead>Durasi</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Disetujui Oleh</TableHead>
                          <TableHead>Lampiran</TableHead>
                          <TableHead>Tanggal Pengajuan</TableHead>
                          <TableHead className="w-[120px]">Download</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHistory.length > 0 ? (
                          filteredHistory.map((cuti) => (
                            <TableRow key={cuti.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <TableCell className="font-medium">
                                {format(new Date(cuti.tanggalCuti), "dd MMM yyyy", { locale: id })}
                              </TableCell>
                              <TableCell>{cuti.jenisCutiNama}</TableCell>
                              <TableCell>1 hari</TableCell>
                              <TableCell>{getStatusBadge(cuti.statusApproval)}</TableCell>
                              <TableCell>
                                {cuti.approvedByName || '-'}
                              </TableCell>
                              <TableCell>
                                {cuti.lampiranCuti ? (
                                  <div className="flex gap-1">
                                    {isImageFile(cuti.lampiranCuti) ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePreviewAttachment(cuti.id, cuti.lampiranCuti!)}
                                      >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Preview
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDownloadAttachment(cuti.id, cuti.lampiranCuti!)}
                                      >
                                        <Download className="w-4 h-4 mr-1" />
                                        Download
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {format(new Date(cuti.createdAt), "dd MMM yyyy", { locale: id })}
                              </TableCell>
                              <TableCell>
                                {cuti.lampiranCuti ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadAttachment(cuti.id, cuti.lampiranCuti!)}
                                    className="flex items-center gap-2"
                                  >
                                    <Download className="w-4 h-4" />
                                    Download
                                  </Button>
                                ) : (
                                  <span className="text-gray-400 text-sm">Tidak ada lampiran</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12">
                              <div className="flex flex-col items-center">
                                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-gray-500 dark:text-gray-400">
                                  {isLoadingHistory 
                                    ? 'Memuat riwayat cuti...'
                                    : allCutiHistory.length === 0 
                                      ? 'Belum ada riwayat cuti'
                                      : (historyFilter || statusFilter !== 'semua')
                                        ? `Tidak ada data yang sesuai dengan filter (dari ${allCutiHistory.length} total data)`
                                        : 'Tidak ada data cuti'
                                  }
                                </p>
                                {!isLoadingHistory && allCutiHistory.length === 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={loadAllCutiHistory}
                                    className="mt-2"
                                  >
                                    <RotateCcw className="w-4 h-4 mr-1" />
                                    Muat Ulang
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preview Dialog for History */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[80vw] max-h-[95vh] w-[95vw] sm:w-[90vw] lg:w-[85vw] xl:w-[80vw] h-[95vh] p-0">
            <DialogHeader className="p-4 sm:p-6 pb-2 border-b border-gray-200 dark:border-gray-700">
              <DialogTitle className="text-lg sm:text-xl font-semibold">Preview Lampiran</DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Lampiran pengajuan cuti
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center items-center h-[calc(95vh-120px)] overflow-auto p-2 sm:p-4 bg-gray-50 dark:bg-gray-900">
              {previewFile && (
                <img 
                  src={previewFile} 
                  alt="Preview Lampiran" 
                  className="w-full h-full min-w-0 min-h-0 object-contain rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
