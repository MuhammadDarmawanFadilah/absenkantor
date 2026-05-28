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
import { Search, Plus, MoreHorizontal, Edit, Trash2, Clock, AlertTriangle, Eye } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import AdminFilters from "@/components/AdminFilters"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/config"

interface ShiftResponse {
  id: number
  namaShift: string
  jamMasuk: string
  jamKeluar: string
  lockLokasi: string
  deskripsi: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function ShiftMasterDataPage() {
  const router = useRouter()
  const [shiftList, setShiftList] = useState<ShiftResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isToggleOpen, setIsToggleOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState<ShiftResponse | null>(null)
  
  const { toast } = useToast()

  const handleViewDetail = (shift: ShiftResponse) => {
    router.push(`/admin/master-data/shift/${shift.id}`)
  }
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortBy, setSortBy] = useState('namaShift')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  
  // Load data from backend
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (mounted) {
      loadShiftData()
    }
  }, [mounted, currentPage, pageSize, searchTerm, sortBy, sortDir])

  const loadShiftData = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        getApiUrl(`api/admin/master-data/shift?search=${encodeURIComponent(searchTerm || '')}&page=${currentPage}&size=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setShiftList(data.content || [])
        setTotalElements(data.totalElements || 0)
        setTotalPages(data.totalPages || 0)
      } else {
        showErrorToast('Gagal memuat data shift')
      }
    } catch (error) {
      console.error('Error loading shift data:', error)
      showErrorToast('Gagal memuat data shift')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (newSortBy: string, newSortDir: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortDir(newSortDir)
    setCurrentPage(0)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }
  
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(0)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(0)
  }

  const handleCreate = () => {
    router.push('/admin/master-data/shift/tambah')
  }
  
  const handleEdit = (shift: ShiftResponse) => {
    router.push(`/admin/master-data/shift/${shift.id}/edit`)
  }
  
  const handleDelete = (shift: ShiftResponse) => {
    setSelectedShift(shift)
    setIsDeleteOpen(true)
  }

  const handleToggle = (shift: ShiftResponse) => {
    setSelectedShift(shift)
    setIsToggleOpen(true)
  }

  const submitDelete = async () => {
    if (!selectedShift) return

    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/admin/master-data/shift/${selectedShift.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        showSuccessToast('Shift berhasil dihapus')
        setIsDeleteOpen(false)
        setSelectedShift(null)
        loadShiftData()
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal menghapus shift')
      }
    } catch (error) {
      console.error('Error deleting shift:', error)
      showErrorToast('Gagal menghapus shift')
    } finally {
      setLoading(false)
    }
  }
  
  const submitToggle = async () => {
    if (!selectedShift) return
    
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/admin/master-data/shift/${selectedShift.id}/toggle-active`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        showSuccessToast(`Status shift berhasil ${selectedShift.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
        setIsToggleOpen(false)
        loadShiftData()
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal mengubah status shift')
      }
    } catch (error) {
      console.error('Error toggling shift status:', error)
      showErrorToast('Gagal mengubah status shift')
    } finally {
      setLoading(false)
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
        title="Master Data Shift"
        description="Kelola shift kerja dalam sistem"
        icon={Clock}
        primaryAction={{
          label: "Tambah Shift",
          onClick: handleCreate,
          icon: Plus
        }}
        stats={[
          {
            label: "Total Shift",
            value: totalElements,
            variant: "secondary"
          }
        ]}
      />

      <div className="container mx-auto p-6 space-y-6">
        {/* Filters */}
        <AdminFilters
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          searchPlaceholder="Cari nama shift..."
          totalItems={totalElements}
          currentItems={shiftList.length}
          filters={[]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Data Shift</CardTitle>
            <CardDescription>
              Daftar shift kerja yang tersedia dalam sistem
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortableHeader
                        sortKey="namaShift"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        Nama Shift
                      </SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        sortKey="jamMasuk"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        Jam Masuk
                      </SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        sortKey="jamKeluar"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        Jam Keluar
                      </SortableHeader>
                    </TableHead>
                    <TableHead>Lock Lokasi</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <LoadingSpinner />
                      </TableCell>
                    </TableRow>
                  ) : shiftList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Clock className="h-8 w-8 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {searchTerm ? 'Tidak ada shift yang ditemukan' : 'Belum ada data shift'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    shiftList.map((shift: ShiftResponse) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">{shift.namaShift}</TableCell>
                        <TableCell>{shift.jamMasuk}</TableCell>
                        <TableCell>{shift.jamKeluar}</TableCell>
                        <TableCell>
                          <Badge variant={shift.lockLokasi === 'HARUS_DI_KANTOR' ? 'destructive' : 'outline'}>
                            {shift.lockLokasi === 'HARUS_DI_KANTOR' ? 'Harus di Kantor' : 'Dimana Saja'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={shift.deskripsi}>
                          {shift.deskripsi || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={shift.isActive}
                              onCheckedChange={() => handleToggle(shift)}
                            />
                            <Badge variant={shift.isActive ? "default" : "secondary"}>
                              {shift.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetail(shift)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(shift)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(shift)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
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
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <ServerPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </CardContent>
        </Card>



        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title="Hapus Shift"
          description={`Apakah Anda yakin ingin menghapus shift "${selectedShift?.namaShift}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Hapus"
          cancelText="Batal"
          variant="destructive"
          onConfirm={submitDelete}
          loading={loading}
        />

        {/* Toggle Status Confirmation Dialog */}
        <ConfirmationDialog
          open={isToggleOpen}
          onOpenChange={setIsToggleOpen}
          title={`${selectedShift?.isActive ? 'Nonaktifkan' : 'Aktifkan'} Shift`}
          description={`Apakah Anda yakin ingin ${selectedShift?.isActive ? 'menonaktifkan' : 'mengaktifkan'} shift "${selectedShift?.namaShift}"?`}
          confirmText={selectedShift?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          cancelText="Batal"
          variant={selectedShift?.isActive ? "destructive" : "default"}
          onConfirm={submitToggle}
          loading={loading}
        />
      </div>
    </div>
  )
}
