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
import { Search, Plus, MoreHorizontal, Edit, Trash2, FolderOpen, AlertTriangle, Eye } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import AdminFilters from "@/components/AdminFilters"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/config"

interface FileKategoriResponse {
  id: number
  nama: string
  deskripsi?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export default function FileKategoriMasterDataPage() {
  const [kategoriList, setKategoriList] = useState<FileKategoriResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isToggleOpen, setIsToggleOpen] = useState(false)
  const [selectedKategori, setSelectedKategori] = useState<FileKategoriResponse | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    isActive: true,
    sortOrder: 0
  })
  
  const { toast } = useToast()

  const handleViewDetail = (kategori: FileKategoriResponse) => {
    toast({
      title: `Detail Kategori File: ${kategori.nama}`,
      description: `Deskripsi: ${kategori.deskripsi || 'Tidak ada deskripsi'} | Status: ${kategori.isActive ? 'Aktif' : 'Nonaktif'}`,
    })
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
      loadKategoriData()
    }
  }, [mounted, currentPage, pageSize, searchTerm, sortBy, sortDir])

  const loadKategoriData = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        getApiUrl(`admin/master-data/file-kategori?search=${encodeURIComponent(searchTerm || '')}&page=${currentPage}&size=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setKategoriList(data.content || [])
        setTotalElements(data.totalElements || 0)
        setTotalPages(data.totalPages || 0)
      } else {
        showErrorToast('Gagal memuat data kategori file')
      }
    } catch (error) {
      console.error('Error loading kategori data:', error)
      showErrorToast('Gagal memuat data kategori file')
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
    setSelectedKategori(null)
  }

  const handleCreate = () => {
    resetForm()
    setIsCreateOpen(true)
  }
  
  const handleEdit = (kategori: FileKategoriResponse) => {
    setSelectedKategori(kategori)
    setFormData({
      nama: kategori.nama,
      deskripsi: kategori.deskripsi || '',
      isActive: kategori.isActive,
      sortOrder: kategori.sortOrder
    })
    setIsEditOpen(true)
  }
  
  const handleDelete = (kategori: FileKategoriResponse) => {
    setSelectedKategori(kategori)
    setIsDeleteOpen(true)
  }

  const handleToggle = (kategori: FileKategoriResponse) => {
    setSelectedKategori(kategori)
    setIsToggleOpen(true)
  }
  
  const submitCreate = async () => {
    if (!formData.nama.trim()) {
      showErrorToast('Nama kategori harus diisi')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(getApiUrl('admin/master-data/file-kategori'), {
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
        showSuccessToast('Kategori file berhasil ditambahkan')
        setIsCreateOpen(false)
        resetForm()
        loadKategoriData()
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal menambahkan kategori file')
      }
    } catch (error) {
      console.error('Error creating kategori:', error)
      showErrorToast('Gagal menambahkan kategori file')
    } finally {
      setLoading(false)
    }
  }

  const submitEdit = async () => {
    if (!selectedKategori || !formData.nama.trim()) {
      showErrorToast('Data tidak valid')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`admin/master-data/file-kategori/${selectedKategori.id}`), {
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
        showSuccessToast('Kategori file berhasil diperbarui')
        setIsEditOpen(false)
        resetForm()
        loadKategoriData()
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal memperbarui kategori file')
      }
    } catch (error) {
      console.error('Error updating kategori:', error)
      showErrorToast('Gagal memperbarui kategori file')
    } finally {
      setLoading(false)
    }
  }

  const submitDelete = async () => {
    if (!selectedKategori) return

    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`admin/master-data/file-kategori/${selectedKategori.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        showSuccessToast('Kategori file berhasil dihapus')
        setIsDeleteOpen(false)
        setSelectedKategori(null)
        loadKategoriData()
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal menghapus kategori file')
      }
    } catch (error) {
      console.error('Error deleting kategori:', error)
      showErrorToast('Gagal menghapus kategori file')
    } finally {
      setLoading(false)
    }
  }
  
  const submitToggle = async () => {
    if (!selectedKategori) return
    
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`admin/master-data/file-kategori/${selectedKategori.id}/toggle-active`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        showSuccessToast(`Status kategori file berhasil ${selectedKategori.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
        setIsToggleOpen(false)
        loadKategoriData()
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal mengubah status kategori file')
      }
    } catch (error) {
      console.error('Error toggling kategori status:', error)
      showErrorToast('Gagal mengubah status kategori file')
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
        title="Master Data Kategori File"
        description="Kelola kategori file dalam sistem"
        icon={FolderOpen}
        primaryAction={{
          label: "Tambah Kategori",
          onClick: handleCreate,
          icon: Plus
        }}
        stats={[
          {
            label: "Total Kategori",
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
          searchPlaceholder="Cari nama kategori..."
          totalItems={totalElements}
          currentItems={kategoriList.length}
        />

        <Card>
          <CardHeader>
            <CardTitle>Data Kategori File</CardTitle>
            <CardDescription>
              Daftar kategori file yang tersedia dalam sistem
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
                        Nama Kategori
                      </SortableHeader>
                    </TableHead>
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
                      <TableCell colSpan={4} className="text-center py-12">
                        <LoadingSpinner />
                      </TableCell>
                    </TableRow>
                  ) : kategoriList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <FolderOpen className="h-8 w-8 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {searchTerm ? 'Tidak ada kategori yang ditemukan' : 'Belum ada data kategori file'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    kategoriList.map((kategori: FileKategoriResponse) => (
                      <TableRow key={kategori.id}>
                        <TableCell className="font-medium">{kategori.nama}</TableCell>
                        <TableCell>{kategori.sortOrder}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={kategori.isActive}
                              onCheckedChange={() => handleToggle(kategori)}
                            />
                            <Badge variant={kategori.isActive ? "default" : "secondary"}>
                              {kategori.isActive ? "Aktif" : "Nonaktif"}
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
                              <DropdownMenuItem onClick={() => handleViewDetail(kategori)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(kategori)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(kategori)}
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
              <DialogTitle>Tambah Kategori File Baru</DialogTitle>
              <DialogDescription>
                Tambahkan kategori file baru ke dalam sistem
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="create-nama">Nama Kategori</Label>
                <Input
                  id="create-nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama kategori"
                />
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="create-deskripsi">Deskripsi (Opsional)</Label>
                <Input
                  id="create-deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Masukkan deskripsi kategori"
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
              <DialogTitle>Edit Kategori File</DialogTitle>
              <DialogDescription>
                Perbarui informasi kategori file
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="edit-nama">Nama Kategori</Label>
                <Input
                  id="edit-nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama kategori"
                />
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="edit-deskripsi">Deskripsi (Opsional)</Label>
                <Input
                  id="edit-deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Masukkan deskripsi kategori"
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
          title="Hapus Kategori File"
          description={`Apakah Anda yakin ingin menghapus kategori "${selectedKategori?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
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
          title={`${selectedKategori?.isActive ? 'Nonaktifkan' : 'Aktifkan'} Kategori File`}
          description={`Apakah Anda yakin ingin ${selectedKategori?.isActive ? 'menonaktifkan' : 'mengaktifkan'} kategori "${selectedKategori?.nama}"?`}
          confirmText={selectedKategori?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          cancelText="Batal"
          variant={selectedKategori?.isActive ? "destructive" : "default"}
          onConfirm={submitToggle}
          loading={loading}
        />
      </div>
    </div>
  )
}
