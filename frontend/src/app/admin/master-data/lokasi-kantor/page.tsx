'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { SortableHeader } from '@/components/ui/sortable-header'
import { ServerPagination } from '@/components/ServerPagination'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Search, Plus, MoreHorizontal, Edit, Trash2, MapPin, AlertTriangle, Eye } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import AdminFilters from "@/components/AdminFilters"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/config"

interface LokasiResponse {
  id: number
  namaLokasi: string
  latitude?: string
  longitude?: string
  radius?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function LokasiKantorMasterDataPage() {
  const router = useRouter()
  const [lokasiList, setLokasiList] = useState<LokasiResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isToggleOpen, setIsToggleOpen] = useState(false)
  const [selectedLokasi, setSelectedLokasi] = useState<LokasiResponse | null>(null)
  
  const { toast } = useToast()

  const handleViewDetail = (lokasi: LokasiResponse) => {
    router.push(`/admin/master-data/lokasi-kantor/${lokasi.id}`)
  }
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortBy, setSortBy] = useState('namaLokasi')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  
  // Load data from backend
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (mounted) {
      fetchLokasiList()
    }
  }, [mounted, currentPage, pageSize, sortBy, sortDir, searchTerm])

  const fetchLokasiList = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: pageSize.toString(),
        sort: `${sortBy},${sortDir}`,
        ...(searchTerm && { search: searchTerm })
      })

      console.log('Fetching lokasi data with URL:', getApiUrl(`/admin/master-data/lokasi?${params}`))
      
      const response = await fetch(getApiUrl(`/admin/master-data/lokasi?${params}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Received data:', data)
        setLokasiList(data.content || [])
        setTotalElements(data.totalElements || 0)
        setTotalPages(data.totalPages || 0)
      } else {
        const errorText = await response.text()
        console.error('API error:', response.status, errorText)
        showErrorToast(`Gagal memuat data lokasi kantor: ${response.status}`)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      showErrorToast('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleSortChange = (sortBy: string, sortDir: 'asc' | 'desc') => {
    setSortBy(sortBy)
    setSortDir(sortDir)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(0)
  }

  const handleEdit = (lokasi: LokasiResponse) => {
    router.push(`/admin/master-data/lokasi-kantor/${lokasi.id}/edit`)
  }

  const openDeleteDialog = (lokasi: LokasiResponse) => {
    setSelectedLokasi(lokasi)
    setIsDeleteOpen(true)
  }

  const openToggleDialog = (lokasi: LokasiResponse) => {
    setSelectedLokasi(lokasi)
    setIsToggleOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedLokasi) return

    setLoading(true)
    try {
      const response = await fetch(getApiUrl(`/admin/master-data/lokasi/${selectedLokasi.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        showSuccessToast('Lokasi kantor berhasil dihapus')
        fetchLokasiList()
      } else {
        showErrorToast('Gagal menghapus lokasi kantor')
      }
    } catch (error) {
      showErrorToast('Terjadi kesalahan saat menghapus lokasi kantor')
    } finally {
      setLoading(false)
      setIsDeleteOpen(false)
      setSelectedLokasi(null)
    }
  }

  const handleToggleStatus = async () => {
    if (!selectedLokasi) return

    setLoading(true)
    try {
      const response = await fetch(getApiUrl(`/admin/master-data/lokasi/${selectedLokasi.id}/toggle-active`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const newStatus = !selectedLokasi.isActive
        showSuccessToast(`Status lokasi kantor berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`)
        fetchLokasiList()
      } else {
        showErrorToast('Gagal mengubah status lokasi kantor')
      }
    } catch (error) {
      showErrorToast('Terjadi kesalahan saat mengubah status')
    } finally {
      setLoading(false)
      setIsToggleOpen(false)
      setSelectedLokasi(null)
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Lokasi Kantor"
        description="Kelola data lokasi kantor dan koordinat"
        icon={MapPin}
        primaryAction={{
          label: "Tambah Lokasi",
          onClick: () => router.push('/admin/master-data/lokasi-kantor/tambah'),
          icon: Plus
        }}
      />

      <div className="grid gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Daftar Lokasi Kantor
                </CardTitle>
                <CardDescription className="mt-1">
                  Total {totalElements} lokasi kantor terdaftar dalam sistem
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AdminFilters
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Cari nama lokasi, alamat, atau status..."
              totalItems={totalElements}
              currentItems={lokasiList.length}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
            />

            <div className="rounded-lg border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[60px] text-center">No</TableHead>
                    <SortableHeader
                      sortKey="namaLokasi"
                      currentSort={{ sortBy, sortDir }}
                      onSort={handleSortChange}
                      className="min-w-[200px]"
                    >
                      Nama Lokasi
                    </SortableHeader>
                    <TableHead className="min-w-[180px]">Koordinat</TableHead>
                    <TableHead className="w-[100px] text-center">Radius</TableHead>
                    <TableHead className="w-[120px] text-center">Status</TableHead>
                    <TableHead className="w-[80px] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span className="text-muted-foreground">Memuat data...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : lokasiList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <MapPin className="h-12 w-12 text-muted-foreground/50" />
                          <div>
                            <p className="text-muted-foreground font-medium">
                              Tidak ada data lokasi kantor
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Tambah lokasi kantor baru untuk memulai'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    lokasiList.map((lokasi, index) => (
                      <TableRow key={lokasi.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-center font-medium text-muted-foreground">
                          {currentPage * pageSize + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {lokasi.namaLokasi}
                          </div>
                        </TableCell>
                        <TableCell>
                          {lokasi.latitude && lokasi.longitude ? (
                            <div className="space-y-1">
                              <div className="text-xs font-mono text-muted-foreground">
                                Lat: {parseFloat(lokasi.latitude).toFixed(6)}
                              </div>
                              <div className="text-xs font-mono text-muted-foreground">
                                Lng: {parseFloat(lokasi.longitude).toFixed(6)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Belum diset</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-medium">
                            {lokasi.radius ? `${lokasi.radius}m` : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={lokasi.isActive ? "default" : "secondary"}
                            className={lokasi.isActive ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {lokasi.isActive ? "Aktif" : "Tidak Aktif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-8 w-8 p-0 border-0 bg-transparent hover:bg-muted rounded-md inline-flex items-center justify-center">
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetail(lokasi)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(lokasi)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openToggleDialog(lokasi)}>
                                <Switch className="mr-2 h-4 w-4" />
                                {lokasi.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(lokasi)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6">
                <ServerPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalElements={totalElements}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Konfirmasi Hapus"
        description={`Apakah Anda yakin ingin menghapus lokasi kantor "${selectedLokasi?.namaLokasi}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        confirmText="Hapus"
        variant="destructive"
        loading={loading}
      />

      {/* Toggle Status Confirmation Dialog */}
      <ConfirmationDialog
        open={isToggleOpen}
        onOpenChange={setIsToggleOpen}
        title="Konfirmasi Perubahan Status"
        description={`Apakah Anda yakin ingin ${selectedLokasi?.isActive ? 'menonaktifkan' : 'mengaktifkan'} lokasi kantor "${selectedLokasi?.namaLokasi}"?`}
        onConfirm={handleToggleStatus}
        confirmText={selectedLokasi?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        variant="toggle"
        loading={loading}
      />
    </div>
  )
}
