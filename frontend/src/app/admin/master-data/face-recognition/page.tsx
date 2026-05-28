'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import FaceRecognitionTestDialog from '@/components/face-recognition/FaceRecognitionTestDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Trash2, 
  Scan, 
  UserPlus, 
  RefreshCw, 
  Users, 
  CheckCircle,
  XCircle,
  Clock,
  User,
  TestTube
} from 'lucide-react'
import { getApiUrl } from "@/lib/config"

interface FaceRecognition {
  id: number
  pegawai: {
    id: number
    namaLengkap: string
    nip: string
    email: string
    jabatan?: {
      nama: string
    }
    status: string
  }
  faceConfidence: number
  trainingImagesCount: number
  status: 'ACTIVE' | 'INACTIVE'
  notes?: string
  createdAt: string
  updatedAt: string
}

interface PegawaiWithoutFace {
  id: number
  namaLengkap: string
  nip: string
  email: string
  jabatan?: {
    nama: string
  }
  status: string
}

interface ApiResponse {
  success: boolean
  message: string
  data: FaceRecognition[]
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    pageSize: number
  }
}

interface StatsResponse {
  success: boolean
  data: {
    totalRegistered: number
    totalActive: number
    totalInactive: number
    averageConfidence: number
  }
}

export default function FaceRecognitionPage() {
  const router = useRouter()
  const [faceRecognitions, setFaceRecognitions] = useState<FaceRecognition[]>([])
  const [pegawaiWithoutFace, setPegawaiWithoutFace] = useState<PegawaiWithoutFace[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [deleting, setDeleting] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    totalRegistered: 0,
    totalActive: 0,
    totalInactive: 0,
    averageConfidence: 0
  })

  useEffect(() => {
    loadFaceRecognitions()
    loadStats()
    loadPegawaiWithoutFace()
  }, [currentPage, statusFilter])

  const loadFaceRecognitions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: (currentPage - 1).toString(),
        size: '10',
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'ALL' && { status: statusFilter })
      })
      
      const response = await fetch(getApiUrl(`api/face-recognition?${params}`))
      const result: ApiResponse = await response.json()
      
      if (result.success) {
        setFaceRecognitions(result.data || [])
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages)
        }
      } else {
        showErrorToast(result.message || 'Gagal memuat data face recognition')
      }
    } catch (error) {
      console.error('Error loading face recognitions:', error)
      showErrorToast('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch(getApiUrl('api/face-recognition/stats'))
      const result: StatsResponse = await response.json()
      
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadPegawaiWithoutFace = async () => {
    try {
      const response = await fetch(getApiUrl('api/face-recognition/pegawai-without-face'))
      const result = await response.json()
      
      if (result.success) {
        setPegawaiWithoutFace(result.data || [])
      }
    } catch (error) {
      console.error('Error loading pegawai without face:', error)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    // Trigger immediate search for better UX
    const timer = setTimeout(() => {
      loadFaceRecognitions()
    }, 300)
    return () => clearTimeout(timer)
  }

  const handleStatusFilter = (status: 'ALL' | 'ACTIVE' | 'INACTIVE') => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handleCreateFaceRecognition = (pegawai: PegawaiWithoutFace) => {
    router.push(`/admin/master-data/face-recognition/create?pegawaiId=${pegawai.id}`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data face recognition ini?')) {
      return
    }

    try {
      setDeleting(id)
      const response = await fetch(getApiUrl(`api/face-recognition/${id}`), {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        showSuccessToast('Data face recognition berhasil dihapus')
        loadFaceRecognitions()
        loadStats()
        loadPegawaiWithoutFace()
      } else {
        showErrorToast(result.message || 'Gagal menghapus data')
      }
    } catch (error) {
      console.error('Error deleting face recognition:', error)
      showErrorToast('Terjadi kesalahan saat menghapus data')
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <AdminPageHeader
          title="Face Recognition"
          description="Kelola data pengenalan wajah untuk sistem absensi"
          icon={Scan}
          primaryAction={{
            label: "Tambah Face Recognition",
            onClick: () => router.push('/admin/master-data/face-recognition/create'),
            icon: Plus
          }}
          secondaryActions={[{
            label: "Test Recognition",
            onClick: () => {},
            icon: TestTube,
            variant: "outline"
          }]}
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Terdaftar</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalRegistered}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalActive}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tidak Aktif</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalInactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Scan className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Confidence</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {(stats.averageConfidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pegawai Without Face Recognition Section */}
        {pegawaiWithoutFace.length > 0 && (
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
                Pegawai Belum Terdaftar Face Recognition
              </CardTitle>
              <CardDescription>
                Daftar pegawai yang belum memiliki data face recognition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pegawaiWithoutFace.slice(0, 5).map((pegawai) => (
                  <div key={pegawai.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{pegawai.namaLengkap}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {pegawai.nip} • {pegawai.jabatan?.nama || 'Tidak ada jabatan'}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCreateFaceRecognition(pegawai)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Scan className="w-4 h-4 mr-1" />
                      Daftarkan
                    </Button>
                  </div>
                ))}
                {pegawaiWithoutFace.length > 5 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">
                    Dan {pegawaiWithoutFace.length - 5} pegawai lainnya
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Controls */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari berdasarkan nama atau NIP..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value: 'ALL' | 'ACTIVE' | 'INACTIVE') => handleStatusFilter(value)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Status</SelectItem>
                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                    <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <FaceRecognitionTestDialog>
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-initial bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                  >
                    <TestTube className="w-4 h-4 mr-1" />
                    Test Recognition
                  </Button>
                </FaceRecognitionTestDialog>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('ALL')
                    setCurrentPage(1)
                    loadFaceRecognitions()
                    loadStats()
                    loadPegawaiWithoutFace()
                  }}
                  className="flex-1 sm:flex-initial"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    loadFaceRecognitions()
                    loadStats()
                    loadPegawaiWithoutFace()
                  }}
                  disabled={loading}
                  className="flex-1 sm:flex-initial"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(searchQuery || statusFilter !== 'ALL') && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Filter aktif:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="text-xs">
                    Pencarian: "{searchQuery}"
                  </Badge>
                )}
                {statusFilter !== 'ALL' && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {statusFilter === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Face Recognition Table */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scan className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Data Face Recognition
            </CardTitle>
            <CardDescription>
              Daftar pegawai yang telah terdaftar dalam sistem face recognition
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : faceRecognitions.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Scan className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {searchQuery || statusFilter !== 'ALL' ? 'Tidak ada data yang sesuai' : 'Belum ada data face recognition'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {searchQuery || statusFilter !== 'ALL' 
                    ? 'Coba ubah filter pencarian atau tambahkan data baru'
                    : 'Mulai dengan mendaftarkan pegawai untuk sistem face recognition'
                  }
                </p>
                {!searchQuery && statusFilter === 'ALL' && (
                  <Button 
                    onClick={() => router.push('/admin/master-data/face-recognition/create')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Face Recognition
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Pegawai</TableHead>
                        <TableHead className="min-w-[120px]">Confidence</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[160px]">Tanggal Daftar</TableHead>
                        <TableHead className="text-center min-w-[120px]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faceRecognitions.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {item.pegawai.namaLengkap}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                NIP: {item.pegawai.nip}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                {item.pegawai.jabatan?.nama || 'Tidak ada jabatan'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    item.faceConfidence >= 0.8 ? 'bg-green-600' :
                                    item.faceConfidence >= 0.6 ? 'bg-yellow-600' : 'bg-red-600'
                                  }`}
                                  style={{ width: `${(item.faceConfidence * 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium tabular-nums">
                                {(item.faceConfidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={item.status === 'ACTIVE' ? 'default' : 'secondary'}
                              className={`${
                                item.status === 'ACTIVE' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {item.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
                              <span className="truncate">
                                {formatDate(item.createdAt)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center space-x-1">
                              <FaceRecognitionTestDialog pegawaiId={item.pegawai.id}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                                  title="Test Recognition"
                                >
                                  <TestTube className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </Button>
                              </FaceRecognitionTestDialog>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item.id)}
                                disabled={deleting === item.id}
                                className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/30"
                                title="Hapus"
                              >
                                {deleting === item.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin text-red-600 dark:text-red-400" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Halaman {currentPage} dari {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center space-x-1"
                      >
                        <span>Previous</span>
                      </Button>
                      
                      {/* Page numbers */}
                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                          if (pageNum > totalPages) return null
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center space-x-1"
                      >
                        <span>Next</span>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
