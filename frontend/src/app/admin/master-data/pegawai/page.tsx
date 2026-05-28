'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Search, Plus, MoreHorizontal, Edit, Trash2, Users, AlertTriangle, Eye, Filter, X, Check, ChevronsUpDown, MapPin, Calendar } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import AdminFilters from "@/components/AdminFilters"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/config"
import { cn } from "@/lib/utils"

interface JabatanResponse {
  id: number
  nama: string
}

interface LokasiResponse {
  id: number
  namaLokasi: string
}

interface RoleResponse {
  roleId: number
  roleName: string
}

interface PegawaiResponse {
  id: number
  nip: string
  namaLengkap: string
  email: string
  noTelp: string
  alamat: string
  jenisKelamin: string
  tanggalLahir: string
  tempatLahir: string
  pendidikan: string
  tanggalMasuk: string
  role: string
  jabatan?: JabatanResponse
  lokasi?: LokasiResponse
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function PegawaiMasterDataPage() {
  return (
    <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN"]}>
      <PegawaiMasterDataContent />
    </ProtectedRoute>
  )
}

function PegawaiMasterDataContent() {
  const router = useRouter()
  const [pegawaiList, setPegawaiList] = useState<PegawaiResponse[]>([])
  const [jabatanList, setJabatanList] = useState<JabatanResponse[]>([])
  const [roleList, setRoleList] = useState<RoleResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingJabatan, setLoadingJabatan] = useState(false)
  const [loadingRole, setLoadingRole] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isToggleOpen, setIsToggleOpen] = useState(false)
  const [selectedPegawai, setSelectedPegawai] = useState<PegawaiResponse | null>(null)
  
  // Popover states
  const [jabatanOpen, setJabatanOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  
  // Selected values for dropdown
  const [selectedJabatan, setSelectedJabatan] = useState<JabatanResponse | null>(null)
  const [selectedRole, setSelectedRole] = useState<RoleResponse | null>(null)
  
  const { toast } = useToast()

  const handleViewDetail = (pegawai: PegawaiResponse) => {
    router.push(`/admin/master-data/pegawai/${pegawai.id}`)
  }
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortBy, setSortBy] = useState('namaLengkap')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  
  // State untuk filter per kategori
  const [filters, setFilters] = useState({
    nama: '',
    email: '',
    nip: '',
    jabatan: '',
    role: '',
    status: 'all'
  })
  
  // Load data from backend
  useEffect(() => {
    setMounted(true)
    console.log('Loading initial data...')
    loadJabatanData()
    loadRoleData()
  }, [])
  
  useEffect(() => {
    if (mounted) {
      loadPegawaiData()
    }
  }, [mounted, currentPage, pageSize, filters, sortBy, sortDir])

  const loadJabatanData = async () => {
    try {
      setLoadingJabatan(true)
      console.log('Loading jabatan data...')
      const response = await fetch(getApiUrl('api/admin/master-data/jabatan'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      console.log('Jabatan response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Jabatan data received:', data)
        setJabatanList(data.content || data || [])
        console.log('Jabatan data loaded:', data.content?.length || 0, 'items')
      } else {
        console.error('Failed to load jabatan data:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error loading jabatan data:', error)
    } finally {
      setLoadingJabatan(false)
    }
  }

  const loadRoleData = async () => {
    try {
      setLoadingRole(true)
      console.log('Loading role data...')
      const response = await fetch(getApiUrl('api/roles/all'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      console.log('Role response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Role data received:', data)
        setRoleList(data || [])
        console.log('Role data loaded:', data?.length || 0, 'items')
      } else {
        console.error('Failed to load role data:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error loading role data:', error)
    } finally {
      setLoadingRole(false)
    }
  }

  const loadPegawaiData = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: pageSize.toString(),
        sortBy: sortBy,
        sortDir: sortDir
      })
      
      // Add filters to params
      if (filters.nama) params.append('nama', filters.nama)
      if (filters.email) params.append('email', filters.email) 
      if (filters.nip) params.append('nip', filters.nip)
      if (filters.jabatan) params.append('jabatan', filters.jabatan)
      if (filters.role) params.append('role', filters.role)
      if (filters.status !== 'all') params.append('status', filters.status)
      
      const response = await fetch(
        getApiUrl(`api/pegawai?${params.toString()}`),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('API Response:', data)
        setPegawaiList(data.pegawai || data.content || [])
        setTotalElements(data.totalElements || 0)
        setTotalPages(data.totalPages || 0)
      } else {
        console.error('API Error:', response.status, response.statusText)
        showErrorToast('Gagal memuat data pegawai')
      }
    } catch (error) {
      console.error('Error loading pegawai data:', error)
      showErrorToast('Gagal memuat data pegawai')
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

  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }))
    setCurrentPage(0)
  }

  const clearFilters = () => {
    setFilters({
      nama: '',
      email: '',
      nip: '',
      jabatan: '',
      role: '',
      status: 'all'
    })
    setSelectedJabatan(null)
    setSelectedRole(null)
    setCurrentPage(0)
  }

  const handleSearchChange = (value: string) => {
    // Update general search to nama filter
    handleFilterChange('nama', value)
  }

  const resetForm = () => {
    setSelectedPegawai(null)
  }

  const handleCreate = () => {
    router.push('/admin/master-data/pegawai/tambah')
  }
  
  const handleEdit = (pegawai: PegawaiResponse) => {
    router.push(`/admin/master-data/pegawai/${pegawai.id}/edit`)
  }
  
  const handleEditCuti = (pegawai: PegawaiResponse) => {
    // Redirect to edit page with step 4 (Daftar Cuti) focused
    router.push(`/admin/master-data/pegawai/${pegawai.id}/edit?step=3`)
  }
  
  const handleDelete = (pegawai: PegawaiResponse) => {
    setSelectedPegawai(pegawai)
    setIsDeleteOpen(true)
  }

  const handleToggle = (pegawai: PegawaiResponse) => {
    setSelectedPegawai(pegawai)
    setIsToggleOpen(true)
  }

  const submitDelete = async () => {
    if (!selectedPegawai) return

    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/pegawai/${selectedPegawai.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        showSuccessToast('Pegawai berhasil dihapus')
        setIsDeleteOpen(false)
        setSelectedPegawai(null)
        loadPegawaiData()
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal menghapus pegawai')
      }
    } catch (error) {
      console.error('Error deleting pegawai:', error)
      showErrorToast('Gagal menghapus pegawai')
    } finally {
      setLoading(false)
    }
  }
  
  const submitToggle = async () => {
    if (!selectedPegawai) return
    
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/pegawai/${selectedPegawai.id}/toggle`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        showSuccessToast(`Status pegawai berhasil ${selectedPegawai.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
        setIsToggleOpen(false)
        loadPegawaiData()
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal mengubah status pegawai')
      }
    } catch (error) {
      console.error('Error toggling pegawai status:', error)
      showErrorToast('Gagal mengubah status pegawai')
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
        title="Master Data Pegawai"
        description="Kelola data pegawai dalam sistem"
        icon={Users}
        primaryAction={{
          label: "Tambah Pegawai",
          onClick: handleCreate,
          icon: Plus
        }}
        secondaryActions={[
          {
            label: "Lokasi Pegawai",
            onClick: () => router.push('/admin/master-data/pegawai/lokasi'),
            icon: MapPin
          }
        ]}
        stats={[
          {
            label: "Total Pegawai",
            value: totalElements,
            variant: "secondary"
          }
        ]}
      />

      <div className="container mx-auto p-6 space-y-6">
        {/* Category-based Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Data Pegawai
            </CardTitle>
            <CardDescription>
              Filter pegawai berdasarkan kategori tertentu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter-nama">Nama</Label>
                <Input
                  id="filter-nama"
                  placeholder="Cari nama..."
                  value={filters.nama}
                  onChange={(e) => handleFilterChange('nama', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="filter-nip">NIP</Label>
                <Input
                  id="filter-nip"
                  placeholder="Cari NIP..."
                  value={filters.nip}
                  onChange={(e) => handleFilterChange('nip', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="filter-email">Email</Label>
                <Input
                  id="filter-email"
                  placeholder="Cari email..."
                  value={filters.email}
                  onChange={(e) => handleFilterChange('email', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="filter-jabatan">Jabatan</Label>
                <Popover open={jabatanOpen} onOpenChange={setJabatanOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={jabatanOpen}
                      className="w-full justify-between"
                    >
                      {selectedJabatan ? selectedJabatan.nama : "Pilih jabatan..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Cari jabatan..." />
                      <CommandEmpty>Tidak ada jabatan ditemukan.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedJabatan(null)
                            handleFilterChange('jabatan', '')
                            setJabatanOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !selectedJabatan ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Semua Jabatan
                        </CommandItem>
                        {loadingJabatan ? (
                          <CommandItem disabled>
                            Loading jabatan...
                          </CommandItem>
                        ) : jabatanList.length > 0 ? jabatanList.map((jabatan) => (
                          <CommandItem
                            key={jabatan.id}
                            value={jabatan.nama}
                            onSelect={() => {
                              setSelectedJabatan(jabatan)
                              handleFilterChange('jabatan', jabatan.nama)
                              setJabatanOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedJabatan?.id === jabatan.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {jabatan.nama}
                          </CommandItem>
                        )) : (
                          <CommandItem disabled>
                            Tidak ada data jabatan
                          </CommandItem>
                        )}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="filter-role">Role</Label>
                <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={roleOpen}
                      className="w-full justify-between"
                    >
                      {selectedRole ? selectedRole.roleName : "Pilih role..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Cari role..." />
                      <CommandEmpty>Tidak ada role ditemukan.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedRole(null)
                            handleFilterChange('role', '')
                            setRoleOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !selectedRole ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Semua Role
                        </CommandItem>
                        {loadingRole ? (
                          <CommandItem disabled>
                            Loading role...
                          </CommandItem>
                        ) : roleList.length > 0 ? roleList.map((role) => (
                          <CommandItem
                            key={role.roleId}
                            value={role.roleName}
                            onSelect={() => {
                              setSelectedRole(role)
                              handleFilterChange('role', role.roleName)
                              setRoleOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedRole?.roleId === role.roleId ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {role.roleName}
                          </CommandItem>
                        )) : (
                          <CommandItem disabled>
                            Tidak ada data role
                          </CommandItem>
                        )}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="filter-status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Total: {totalElements} pegawai</span>
                <span>•</span>
                <span>Menampilkan: {pegawaiList.length} pegawai</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Pegawai</CardTitle>
            <CardDescription>
              Daftar pegawai yang terdaftar dalam sistem
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
                        sortKey="nip"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        NIP
                      </SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        sortKey="namaLengkap"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        Nama Lengkap
                      </SortableHeader>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>No. Telp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <LoadingSpinner />
                      </TableCell>
                    </TableRow>
                  ) : pegawaiList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-8 w-8 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {Object.values(filters).some(filter => filter && filter !== 'all') ? 
                              'Tidak ada pegawai yang sesuai dengan filter' : 
                              'Belum ada data pegawai'
                            }
                          </span>
                          {Object.values(filters).some(filter => filter && filter !== 'all') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearFilters}
                              className="mt-2"
                            >
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pegawaiList.map((pegawai: PegawaiResponse) => (
                      <TableRow key={pegawai.id}>
                        <TableCell className="font-medium">{pegawai.nip}</TableCell>
                        <TableCell className="font-medium">{pegawai.namaLengkap}</TableCell>
                        <TableCell>{pegawai.email}</TableCell>
                        <TableCell>{pegawai.jabatan?.nama || '-'}</TableCell>
                        <TableCell>{pegawai.role || '-'}</TableCell>
                        <TableCell>{pegawai.noTelp || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={pegawai.isActive}
                              onCheckedChange={() => handleToggle(pegawai)}
                            />
                            <Badge variant={pegawai.isActive ? "default" : "secondary"}>
                              {pegawai.isActive ? "Aktif" : "Nonaktif"}
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
                              <DropdownMenuItem onClick={() => handleViewDetail(pegawai)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(pegawai)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditCuti(pegawai)}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Kelola Cuti
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(pegawai)}
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
          title="Hapus Pegawai"
          description={`Apakah Anda yakin ingin menghapus pegawai "${selectedPegawai?.namaLengkap}" (${selectedPegawai?.nip})? Tindakan ini tidak dapat dibatalkan.`}
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
          title={`${selectedPegawai?.isActive ? 'Nonaktifkan' : 'Aktifkan'} Pegawai`}
          description={`Apakah Anda yakin ingin ${selectedPegawai?.isActive ? 'menonaktifkan' : 'mengaktifkan'} pegawai "${selectedPegawai?.namaLengkap}"?`}
          confirmText={selectedPegawai?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          cancelText="Batal"
          variant={selectedPegawai?.isActive ? "destructive" : "default"}
          onConfirm={submitToggle}
          loading={loading}
        />
      </div>
    </div>
  )
}
