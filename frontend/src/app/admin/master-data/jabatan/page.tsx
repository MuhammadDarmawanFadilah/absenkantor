'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { SortableHeader } from '@/components/ui/sortable-header'
import { ServerPagination } from '@/components/ServerPagination'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Search, Plus, MoreHorizontal, Edit, Trash2, Briefcase, AlertTriangle, Eye } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import AdminFilters from "@/components/AdminFilters"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/config"

interface JabatanResponse {
  id: number
  nama: string
  deskripsi?: string
  manager?: {
    id: number
    username: string
    namaLengkap: string
    email: string
  }
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export default function JabatanMasterDataPage() {
  const [jabatanList, setJabatanList] = useState<JabatanResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isToggleOpen, setIsToggleOpen] = useState(false)
  const [selectedJabatan, setSelectedJabatan] = useState<JabatanResponse | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    isActive: true,
    sortOrder: 0
  })
  
  const { toast } = useToast()

  const handleViewDetail = (jabatan: JabatanResponse) => {
    window.location.href = `/admin/master-data/jabatan/${jabatan.id}`
  }
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortBy, setSortBy] = useState('sortOrder')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  
  // Load data from backend
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (mounted) {
      loadJabatanData()
    }
  }, [mounted, currentPage, pageSize, searchTerm, sortBy, sortDir])

  const loadJabatanData = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        getApiUrl(`api/admin/master-data/jabatan?search=${encodeURIComponent(searchTerm || '')}&page=${currentPage}&size=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setJabatanList(data.content || [])
        setTotalElements(data.totalElements || 0)
        setTotalPages(data.totalPages || 0)
      } else {
        showErrorToast('Gagal memuat data jabatan')
      }
    } catch (error) {
      console.error('Error loading jabatan data:', error)
      showErrorToast('Gagal memuat data jabatan')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (newSortBy: string, newSortDir: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortDir(newSortDir)
    setCurrentPage(0) // Reset to first page when sorting
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }
  
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(0) // Reset to first page when changing page size
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(0) // Reset to first page when searching
  }

  const resetForm = () => {
    setFormData({
      nama: '',
      deskripsi: '',
      isActive: true,
      sortOrder: 0
    })
    setSelectedJabatan(null)
  }

  const handleCreate = () => {
    window.location.href = '/admin/master-data/jabatan/tambah'
  }
  
  const handleEdit = (jabatan: JabatanResponse) => {
    window.location.href = `/admin/master-data/jabatan/${jabatan.id}/edit`
  }
  
  const handleDelete = (jabatan: JabatanResponse) => {
    setSelectedJabatan(jabatan)
    setIsDeleteOpen(true)
  }

  const handleToggle = (jabatan: JabatanResponse) => {
    setSelectedJabatan(jabatan)
    setIsToggleOpen(true)
  }
  
  const submitCreate = async () => {
    if (!formData.nama.trim()) {
      showErrorToast('Nama jabatan harus diisi')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(getApiUrl('api/admin/master-data/jabatan'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          nama: formData.nama.trim(),
          deskripsi: formData.deskripsi?.trim(),
          isActive: formData.isActive,
          sortOrder: formData.sortOrder
        })
      })
      
      if (response.ok) {
        showSuccessToast('Jabatan berhasil ditambahkan')
        setIsCreateOpen(false)
        resetForm()
        loadJabatanData()
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal menambahkan jabatan')
      }
    } catch (error) {
      console.error('Error creating jabatan:', error)
      showErrorToast('Gagal menambahkan jabatan')
    } finally {
      setLoading(false)
    }
  }

  const submitEdit = async () => {
    if (!selectedJabatan || !formData.nama.trim()) {
      showErrorToast('Data tidak valid')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/admin/master-data/jabatan/${selectedJabatan.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          nama: formData.nama.trim(),
          deskripsi: formData.deskripsi?.trim(),
          isActive: formData.isActive,
          sortOrder: formData.sortOrder
        })
      })
      
      if (response.ok) {
        showSuccessToast('Jabatan berhasil diperbarui')
        setIsEditOpen(false)
        resetForm()
        loadJabatanData()
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal memperbarui jabatan')
      }
    } catch (error) {
      console.error('Error updating jabatan:', error)
      showErrorToast('Gagal memperbarui jabatan')
    } finally {
      setLoading(false)
    }
  }

  const submitDelete = async () => {
    if (!selectedJabatan) return

    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/admin/master-data/jabatan/${selectedJabatan.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        showSuccessToast('Jabatan berhasil dihapus')
        setIsDeleteOpen(false)
        setSelectedJabatan(null)
        loadJabatanData()
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal menghapus jabatan')
      }
    } catch (error) {
      console.error('Error deleting jabatan:', error)
      showErrorToast('Gagal menghapus jabatan')
    } finally {
      setLoading(false)
    }
  }
  
  const submitToggle = async () => {
    if (!selectedJabatan) return
    
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/admin/master-data/jabatan/${selectedJabatan.id}/toggle-active`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        showSuccessToast(`Status jabatan berhasil ${selectedJabatan.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
        setIsToggleOpen(false)
        loadJabatanData()
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal mengubah status jabatan')
      }
    } catch (error) {
      console.error('Error toggling jabatan status:', error)
      showErrorToast('Gagal mengubah status jabatan')
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
        title="Master Data Jabatan"
        description="Kelola jabatan dalam sistem"
        icon={Briefcase}
        primaryAction={{
          label: "Tambah Jabatan",
          onClick: handleCreate,
          icon: Plus
        }}
        stats={[
          {
            label: "Total Jabatan",
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
          searchPlaceholder="Cari nama jabatan..."
          totalItems={totalElements}
          currentItems={jabatanList.length}
          filters={[]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Data Jabatan</CardTitle>
            <CardDescription>
              Daftar jabatan yang tersedia dalam sistem
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
                        sortKey="nama"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        Nama Jabatan
                      </SortableHeader>
                    </TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>
                      <SortableHeader
                        sortKey="sortOrder"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        Urutan
                      </SortableHeader>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <LoadingSpinner />
                      </TableCell>
                    </TableRow>
                  ) : jabatanList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Briefcase className="h-8 w-8 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {searchTerm ? 'Tidak ada jabatan yang ditemukan' : 'Belum ada data jabatan'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    jabatanList.map((jabatan: JabatanResponse) => (
                      <TableRow key={jabatan.id}>
                        <TableCell className="font-medium">{jabatan.nama}</TableCell>
                        <TableCell className="max-w-xs truncate">{jabatan.deskripsi || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {jabatan.manager ? `${jabatan.manager.namaLengkap}` : '-'}
                        </TableCell>
                        <TableCell>{jabatan.sortOrder}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={jabatan.isActive}
                              onCheckedChange={() => handleToggle(jabatan)}
                            />
                            <Badge variant={jabatan.isActive ? "default" : "secondary"}>
                              {jabatan.isActive ? "Aktif" : "Nonaktif"}
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
                              <DropdownMenuItem onClick={() => handleViewDetail(jabatan)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(jabatan)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(jabatan)}
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

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Jabatan Baru</DialogTitle>
              <DialogDescription>
                Tambahkan jabatan baru ke dalam sistem
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="create-nama">Nama Jabatan</Label>
                <Input
                  id="create-nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama jabatan"
                />
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="create-deskripsi">Deskripsi (Opsional)</Label>
                <Input
                  id="create-deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Masukkan deskripsi jabatan"
                />
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="create-sortOrder">Urutan</Label>
                <Input
                  id="create-sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="Urutan tampilan"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="create-status">Status Aktif</Label>
                <Switch
                  id="create-status"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Batal
              </Button>
              <Button onClick={submitCreate}>
                Tambah
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Jabatan</DialogTitle>
              <DialogDescription>
                Perbarui informasi jabatan
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="edit-nama">Nama Jabatan</Label>
                <Input
                  id="edit-nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama jabatan"
                />
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="edit-deskripsi">Deskripsi (Opsional)</Label>
                <Input
                  id="edit-deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Masukkan deskripsi jabatan"
                />
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="edit-sortOrder">Urutan</Label>
                <Input
                  id="edit-sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="Urutan tampilan"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-status">Status Aktif</Label>
                <Switch
                  id="edit-status"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Batal
              </Button>
              <Button onClick={submitEdit}>
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title="Hapus Jabatan"
          description={`Apakah Anda yakin ingin menghapus jabatan "${selectedJabatan?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
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
          title={`${selectedJabatan?.isActive ? 'Nonaktifkan' : 'Aktifkan'} Jabatan`}
          description={`Apakah Anda yakin ingin ${selectedJabatan?.isActive ? 'menonaktifkan' : 'mengaktifkan'} jabatan "${selectedJabatan?.nama}"?`}
          confirmText={selectedJabatan?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          cancelText="Batal"
          variant={selectedJabatan?.isActive ? "destructive" : "default"}
          onConfirm={submitToggle}
          loading={loading}
        />
      </div>
    </div>
  )
}
