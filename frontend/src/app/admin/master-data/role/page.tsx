'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { Plus, ArrowLeft, Save, Shield, Edit, Trash2 } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { ServerPagination } from "@/components/ServerPagination"
import ProtectedRoute from "@/components/ProtectedRoute"
import { getApiUrl } from "@/lib/config"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Role {
  roleId: number
  roleName: string
  description?: string
}

export default function RolePage() {
  return (
    <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN"]}>
      <RolePageContent />
    </ProtectedRoute>
  )
}

function RolePageContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Role[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  
  // Form state
  const [formData, setFormData] = useState({
    roleName: '',
    description: ''
  })
  
  const [editingId, setEditingId] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [currentPage, pageSize])

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        getApiUrl('api/roles/all'),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      )
      
      if (response.ok) {
        const result = await response.json()
        setData(result || [])
        setTotalElements(result.length || 0)
        setTotalPages(Math.ceil((result.length || 0) / pageSize))
      } else {
        showErrorToast('Gagal memuat data role')
      }
    } catch (error) {
      console.error('Error loading data:', error)
      showErrorToast('Gagal memuat data role')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      roleName: '',
      description: ''
    })
    setEditingId(null)
  }

  const handleEdit = (item: Role) => {
    setFormData({
      roleName: item.roleName,
      description: item.description || ''
    })
    setEditingId(item.roleId)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.roleName.trim()) {
      showErrorToast('Nama role harus diisi')
      return
    }

    try {
      setLoading(true)
      
      const payload = {
        roleName: formData.roleName,
        description: formData.description || null
      }

      const url = editingId 
        ? getApiUrl(`api/roles/${editingId}`)
        : getApiUrl('api/roles')
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        showSuccessToast(editingId ? 'Role berhasil diperbarui' : 'Role berhasil ditambahkan')
        setDialogOpen(false)
        resetForm()
        loadData()
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal menyimpan data')
      }
    } catch (error) {
      console.error('Error saving data:', error)
      showErrorToast('Gagal menyimpan data')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      setLoading(true)
      const response = await fetch(
        getApiUrl(`api/roles/${id}`),
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      )

      if (response.ok) {
        showSuccessToast('Role berhasil dihapus')
        loadData()
      } else {
        showErrorToast('Gagal menghapus role')
      }
    } catch (error) {
      console.error('Error deleting data:', error)
      showErrorToast('Gagal menghapus role')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(0)
  }

  const paginatedData = data.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="Role"
        description="Kelola data role dalam sistem"
        icon={Shield}
        primaryAction={{
          label: "Tambah Role",
          onClick: () => {
            resetForm()
            setDialogOpen(true)
          },
          icon: Plus
        }}
      />

      <div className="container mx-auto p-6">
        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Role</CardTitle>
            <CardDescription>
              Kelola role pengguna dalam sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                {data.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      Belum ada data role
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Tambahkan role pertama untuk memulai.
                    </p>
                    <Button onClick={() => setDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Role
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-4 font-medium">Nama Role</th>
                            <th className="text-left p-4 font-medium">Deskripsi</th>
                            <th className="text-left p-4 font-medium">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedData.map((item) => (
                            <tr key={item.roleId} className="border-b hover:bg-muted/50">
                              <td className="p-4 font-medium">{item.roleName}</td>
                              <td className="p-4 text-muted-foreground">
                                {item.description || '-'}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(item)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus Role</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Apakah Anda yakin ingin menghapus role "{item.roleName}"? 
                                          Tindakan ini tidak dapat dibatalkan.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(item.roleId)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Hapus
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="mt-6">
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
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Role' : 'Tambah Role'}
              </DialogTitle>
              <DialogDescription>
                {editingId ? 'Perbarui informasi role' : 'Tambahkan role baru'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Nama Role *</Label>
                <Input
                  id="roleName"
                  value={formData.roleName}
                  onChange={(e) => handleInputChange('roleName', e.target.value)}
                  placeholder="Contoh: ADMIN, VERIFICATOR, PEGAWAI"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Deskripsi role dan fungsinya"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingId ? 'Perbarui' : 'Simpan'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
