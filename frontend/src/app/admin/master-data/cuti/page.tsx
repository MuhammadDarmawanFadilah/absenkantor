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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { usePusherNotifications } from "@/hooks/usePusherNotifications"
import { toast } from "sonner"
import { 
  CalendarIcon, 
  Search, 
  RotateCcw, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Check,
  X,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  Users
} from "lucide-react"
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { ServerPagination } from "@/components/ServerPagination"
import { useAuth } from "@/contexts/AuthContext"
import { getApiUrl } from "@/lib/config"

interface CutiData {
  id: number
  namaPegawai: string
  tanggalCuti: string
  jenisCuti: string
  alasanCuti: string
  statusApproval: string
  lampiranCuti?: string
  createdAt: string
  adminApprovalNama?: string
  catatanApproval?: string
}

export default function AdminCutiPage() {
  const { user } = useAuth()
  const [cutiData, setCutiData] = useState<CutiData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize] = useState(10)

  // Filter states
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('semua')
  const [selectedJenis, setSelectedJenis] = useState('semua')
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()

  // Applied filters (only change when search button is clicked)
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: '',
    status: 'semua',
    jenis: 'semua',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined
  })

  // Approval dialog states
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [selectedCuti, setSelectedCuti] = useState<CutiData | null>(null)
  const [approvalStatus, setApprovalStatus] = useState('')
  const [catatanApproval, setCatatanApproval] = useState('')
  const [isApproving, setIsApproving] = useState(false)

  // Image preview modal states
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState('')
  const [previewImageName, setPreviewImageName] = useState('')

  // Bulk approval states
  const [selectedCutiIds, setSelectedCutiIds] = useState<number[]>([])
  const [showBulkApprovalDialog, setShowBulkApprovalDialog] = useState(false)
  const [bulkApprovalStatus, setBulkApprovalStatus] = useState('')
  const [bulkCatatanApproval, setBulkCatatanApproval] = useState('')
  const [isBulkApproving, setIsBulkApproving] = useState(false)

  const loadCutiData = async (page = 0) => {
    setLoading(true)
    try {
      let queryParams = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString()
      })

      if (appliedFilters.searchTerm) {
        queryParams.append('search', appliedFilters.searchTerm)
      }
      if (appliedFilters.status && appliedFilters.status !== 'semua') {
        queryParams.append('status', appliedFilters.status.toUpperCase())
      }
      if (appliedFilters.jenis && appliedFilters.jenis !== 'semua') {
        queryParams.append('jenis', appliedFilters.jenis)
      }
      if (appliedFilters.startDate) {
        queryParams.append('startDate', format(appliedFilters.startDate, 'yyyy-MM-dd'))
      }
      if (appliedFilters.endDate) {
        queryParams.append('endDate', format(appliedFilters.endDate, 'yyyy-MM-dd'))
      }

      const response = await fetch(getApiUrl(`api/cuti?${queryParams.toString()}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCutiData(data.content || [])
        setTotalElements(data.totalElements || 0)
        setTotalPages(data.totalPages || 0)
        setCurrentPage(page)
      } else {
        console.error('Failed to fetch cuti data')
        setCutiData([])
      }
    } catch (error) {
      console.error('Error fetching cuti data:', error)
      setCutiData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCutiData(0)
  }, [appliedFilters])

  usePusherNotifications({ 
    onCutiResponse: () => loadCutiData(currentPage)
  })

  const handleSearch = () => {
    setAppliedFilters({
      searchTerm,
      status: selectedStatus,
      jenis: selectedJenis,
      startDate,
      endDate
    })
    setCurrentPage(0)
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedStatus('semua')
    setSelectedJenis('semua')
    setStartDate(undefined)
    setEndDate(undefined)
    setAppliedFilters({
      searchTerm: '',
      status: 'semua',
      jenis: 'semua',
      startDate: undefined,
      endDate: undefined
    })
    setCurrentPage(0)
  }

  const handlePageChange = (page: number) => {
    loadCutiData(page)
  }

  const handleApproval = async () => {
    if (!selectedCuti || !approvalStatus) {
      toast.error('Mohon pilih status approval')
      return
    }

    setIsApproving(true)
    try {
      const response = await fetch(getApiUrl(`api/cuti/${selectedCuti.id}/approve?adminId=${user?.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          statusApproval: approvalStatus,
          catatanApproval: catatanApproval
        })
      })

      if (response.ok) {
        toast.success('Status cuti berhasil diupdate!')
        setShowApprovalDialog(false)
        setSelectedCuti(null)
        setApprovalStatus('')
        setCatatanApproval('')
        loadCutiData()
      } else {
        const errorData = await response.text()
        toast.error(errorData || 'Gagal mengupdate status cuti')
      }
    } catch (error) {
      console.error('Error updating cuti status:', error)
      toast.error('Terjadi kesalahan saat mengupdate status')
    } finally {
      setIsApproving(false)
    }
  }

  const handleBulkApproval = async () => {
    if (selectedCutiIds.length === 0) {
      toast.error('Mohon pilih pengajuan cuti yang akan diproses')
      return
    }

    if (!bulkApprovalStatus) {
      toast.error('Mohon pilih status approval')
      return
    }

    setIsBulkApproving(true)
    try {
      const results = await Promise.all(
        selectedCutiIds.map(async (cutiId) => {
          const response = await fetch(getApiUrl(`api/cuti/${cutiId}/approve?adminId=${user?.id}`), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              statusApproval: bulkApprovalStatus,
              catatanApproval: bulkCatatanApproval
            })
          })
          return { cutiId, success: response.ok }
        })
      )

      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      if (successCount > 0) {
        toast.success(`${successCount} pengajuan cuti berhasil diupdate!`)
      }
      
      if (failCount > 0) {
        toast.error(`${failCount} pengajuan cuti gagal diupdate`)
      }

      setShowBulkApprovalDialog(false)
      setSelectedCutiIds([])
      setBulkApprovalStatus('')
      setBulkCatatanApproval('')
      loadCutiData()
    } catch (error) {
      console.error('Error bulk updating cuti status:', error)
      toast.error('Terjadi kesalahan saat mengupdate status')
    } finally {
      setIsBulkApproving(false)
    }
  }

  const handleSelectCuti = (cutiId: number, checked: boolean) => {
    if (checked) {
      setSelectedCutiIds(prev => [...prev, cutiId])
    } else {
      setSelectedCutiIds(prev => prev.filter(id => id !== cutiId))
    }
  }

  const handleSelectAllCuti = (checked: boolean) => {
    if (checked) {
      const availableCutiIds = cutiData
        .filter(cuti => cuti.statusApproval === 'PENDING' || cuti.statusApproval === 'DIAJUKAN')
        .map(cuti => cuti.id)
      setSelectedCutiIds(availableCutiIds)
    } else {
      setSelectedCutiIds([])
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
      case 'DIAJUKAN':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          <Clock className="w-3 h-3 mr-1" />
          Pending
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
      } else {
        toast.error('Gagal mengunduh lampiran')
      }
    } catch (error) {
      console.error('Error downloading attachment:', error)
      toast.error('Terjadi kesalahan saat mengunduh lampiran')
    }
  }

  const isImageFile = (fileName?: string) => {
    if (!fileName) return false
    const extension = fileName.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')
  }

  const openApprovalDialog = (cuti: CutiData) => {
    setSelectedCuti(cuti)
    setApprovalStatus('')
    setCatatanApproval('')
    setShowApprovalDialog(true)
  }

  const openImagePreview = async (cutiId: number, fileName: string) => {
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
        const imageUrl = window.URL.createObjectURL(blob)
        setPreviewImageUrl(imageUrl)
        setPreviewImageName(fileName)
        setShowImagePreview(true)
      } else {
        toast.error('Gagal memuat gambar untuk preview')
      }
    } catch (error) {
      console.error('Error loading image for preview:', error)
      toast.error('Terjadi kesalahan saat memuat gambar')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-2 md:p-6">
      <div className="container mx-auto space-y-4 md:space-y-8">
        <AdminPageHeader 
          title="Master Data Cuti" 
          description="Kelola dan approval pengajuan cuti pegawai"
          icon={CalendarIcon}
        />

        {/* Filters */}
        <Card className="mb-4 md:mb-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                <Filter className="w-5 h-5 mr-2 inline" />
                Filter Data Cuti
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
          {showFilters && (
            <CardContent className="pt-0 p-3 md:p-6">
              <div className="space-y-3 md:space-y-4">
                {/* Row 1: Search */}
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Cari Pegawai
                    </Label>
                    <Input
                      placeholder="Masukkan nama pegawai..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full text-xs md:text-sm"
                    />
                  </div>
                </div>

                {/* Row 2: Date range and Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Tanggal Mulai
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal text-xs md:text-sm h-8 md:h-10"
                        >
                          <CalendarIcon className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                          {startDate ? format(startDate, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Tanggal Akhir
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal text-xs md:text-sm h-8 md:h-10"
                        >
                          <CalendarIcon className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                          {endDate ? format(endDate, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Status
                    </Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semua">Semua Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="diajukan">Diajukan</SelectItem>
                        <SelectItem value="disetujui">Disetujui</SelectItem>
                        <SelectItem value="ditolak">Ditolak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Jenis dan Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-end">
                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Jenis Cuti
                    </Label>
                    <Select value={selectedJenis} onValueChange={setSelectedJenis}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semua">Semua Jenis</SelectItem>
                        <SelectItem value="tahunan">Cuti Tahunan</SelectItem>
                        <SelectItem value="sakit">Cuti Sakit</SelectItem>
                        <SelectItem value="melahirkan">Cuti Melahirkan</SelectItem>
                        <SelectItem value="menikah">Cuti Menikah</SelectItem>
                        <SelectItem value="lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col md:flex-row gap-2">
                    <Button onClick={handleSearch} className="w-full text-xs md:text-sm h-8 md:h-10">
                      <Search className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      Cari
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleResetFilters}
                      className="w-full text-xs md:text-sm h-8 md:h-10"
                    >
                      <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Table */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                Data Pengajuan Cuti ({totalElements} data)
              </CardTitle>
              {selectedCutiIds.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setShowBulkApprovalDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Proses {selectedCutiIds.length} Item
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : cutiData.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">
                          <Checkbox
                            checked={selectedCutiIds.length > 0 && selectedCutiIds.length === cutiData.filter(cuti => cuti.statusApproval === 'PENDING' || cuti.statusApproval === 'DIAJUKAN').length}
                            onCheckedChange={handleSelectAllCuti}
                            className="h-6 w-6 border-2 border-gray-700"
                          />
                        </TableHead>
                        <TableHead>Pegawai</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Alasan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Diajukan</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cutiData.map((cuti) => (
                        <TableRow key={cuti.id}>
                          <TableCell className="w-16">
                            <Checkbox
                              checked={selectedCutiIds.includes(cuti.id)}
                              disabled={cuti.statusApproval !== 'PENDING' && cuti.statusApproval !== 'DIAJUKAN'}
                              onCheckedChange={(checked) => handleSelectCuti(cuti.id, !!checked)}
                              className="h-6 w-6 border-2 border-gray-700"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{cuti.namaPegawai}</TableCell>
                          <TableCell>
                            {format(new Date(cuti.tanggalCuti), "dd MMM yyyy", { locale: id })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {cuti.jenisCuti}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={cuti.alasanCuti}>
                            {cuti.alasanCuti}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(cuti.statusApproval)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(cuti.createdAt), "dd MMM yyyy HH:mm", { locale: id })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openApprovalDialog(cuti)}
                                disabled={cuti.statusApproval === 'DISETUJUI' || cuti.statusApproval === 'DITOLAK'}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {cuti.lampiranCuti && (
                                <div className="flex gap-1">
                                  {isImageFile(cuti.lampiranCuti) ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openImagePreview(cuti.id, cuti.lampiranCuti!)}
                                      title="Preview gambar"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDownloadAttachment(cuti.id, cuti.lampiranCuti!)}
                                      title="Download lampiran"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-4">
                  <ServerPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={() => {}}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Tidak ada data cuti yang ditemukan
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Dialog */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Approval Pengajuan Cuti</DialogTitle>
              <DialogDescription>
                Proses approval untuk pengajuan cuti dari {selectedCuti?.namaPegawai}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Pegawai</Label>
                <p className="text-sm font-medium">{selectedCuti?.namaPegawai}</p>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Cuti</Label>
                <p className="text-sm">
                  {selectedCuti && format(new Date(selectedCuti.tanggalCuti), "dd MMMM yyyy", { locale: id })}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Jenis Cuti</Label>
                <p className="text-sm">{selectedCuti?.jenisCuti}</p>
              </div>
              <div className="space-y-2">
                <Label>Alasan</Label>
                <p className="text-sm">{selectedCuti?.alasanCuti}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status Approval</Label>
                <Select value={approvalStatus} onValueChange={setApprovalStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISETUJUI">Disetujui</SelectItem>
                    <SelectItem value="DITOLAK">Ditolak</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="catatan">Catatan (Opsional)</Label>
                <Textarea
                  id="catatan"
                  placeholder="Tambahkan catatan approval..."
                  value={catatanApproval}
                  onChange={(e) => setCatatanApproval(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleApproval} disabled={isApproving || !approvalStatus}>
                {isApproving ? 'Memproses...' : 'Simpan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Approval Dialog */}
        <Dialog open={showBulkApprovalDialog} onOpenChange={setShowBulkApprovalDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Approval Bulk Pengajuan Cuti</DialogTitle>
              <DialogDescription>
                Proses approval untuk {selectedCutiIds.length} pengajuan cuti sekaligus
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-status">Status Approval</Label>
                <Select value={bulkApprovalStatus} onValueChange={setBulkApprovalStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISETUJUI">Disetujui</SelectItem>
                    <SelectItem value="DITOLAK">Ditolak</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk-catatan">Catatan (Opsional)</Label>
                <Textarea
                  id="bulk-catatan"
                  placeholder="Tambahkan catatan untuk semua approval..."
                  value={bulkCatatanApproval}
                  onChange={(e) => setBulkCatatanApproval(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkApprovalDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleBulkApproval} disabled={isBulkApproving || !bulkApprovalStatus}>
                {isBulkApproving ? 'Memproses...' : `Proses ${selectedCutiIds.length} Item`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Preview Modal */}
        <Dialog open={showImagePreview} onOpenChange={(open) => {
          setShowImagePreview(open)
          // Clean up blob URL when modal is closed
          if (!open && previewImageUrl.startsWith('blob:')) {
            window.URL.revokeObjectURL(previewImageUrl)
            setPreviewImageUrl('')
          }
        }}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview Lampiran Cuti
              </DialogTitle>
              <DialogDescription>
                {previewImageName}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center items-center max-h-[70vh] overflow-hidden">
              {previewImageUrl && (
                <img 
                  src={previewImageUrl} 
                  alt="Preview lampiran cuti"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    console.error('Error loading image:', e)
                    toast.error('Gagal memuat gambar')
                  }}
                />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowImagePreview(false)
                  if (previewImageUrl.startsWith('blob:')) {
                    window.URL.revokeObjectURL(previewImageUrl)
                    setPreviewImageUrl('')
                  }
                }}
              >
                Tutup
              </Button>
              <Button 
                onClick={() => {
                  // Create a download link for the blob
                  const a = document.createElement('a')
                  a.href = previewImageUrl
                  a.download = previewImageName
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
