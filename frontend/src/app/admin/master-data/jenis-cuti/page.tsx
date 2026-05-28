'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  RotateCcw, 
  CheckCircle, 
  XCircle,
  FileText
} from "lucide-react"
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { ServerPagination } from "@/components/ServerPagination"
import { getApiUrl } from "@/lib/config"

interface JenisCuti {
  id: number
  namaCuti: string
  deskripsi?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface JenisCutiFormData {
  namaCuti: string
  deskripsi: string
}

export default function JenisCutiPage() {
  const [jenisCutiList, setJenisCutiList] = useState<JenisCuti[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<JenisCuti | null>(null)
  const [formData, setFormData] = useState<JenisCutiFormData>({
    namaCuti: '',
    deskripsi: ''
  })

  const pageSize = 10

  useEffect(() => {
    loadJenisCutiData()
  }, [currentPage, searchTerm])

  const loadJenisCutiData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: pageSize.toString(),
        sortBy: 'namaCuti',
        sortDir: 'asc'
      })

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }

      const response = await fetch(getApiUrl(`api/jenis-cuti?${params}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setJenisCutiList(data.content || [])
        setTotalPages(data.totalPages || 0)
        setTotalElements(data.totalElements || 0)
      } else {
        throw new Error('Failed to load data')
      }
    } catch (error) {
      console.error('Error loading jenis cuti:', error)
      toast.error('Gagal memuat data jenis cuti')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.namaCuti.trim()) {
      toast.error('Nama cuti wajib diisi')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const url = editingItem 
        ? getApiUrl(`api/jenis-cuti/${editingItem.id}`)
        : getApiUrl('api/jenis-cuti')

      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          namaCuti: formData.namaCuti.trim(),
          deskripsi: formData.deskripsi.trim() || null,
          isActive: true
        })
      })

      if (response.ok) {
        toast.success(editingItem ? 'Jenis cuti berhasil diperbarui' : 'Jenis cuti berhasil ditambahkan')
        setDialogOpen(false)
        resetForm()
        loadJenisCutiData()
      } else {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to save data')
      }
    } catch (error: any) {
      console.error('Error saving jenis cuti:', error)
      toast.error(error.message || 'Gagal menyimpan data')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: JenisCuti) => {
    setEditingItem(item)
    setFormData({
      namaCuti: item.namaCuti,
      deskripsi: item.deskripsi || ''
    })
    setDialogOpen(true)
  }

  const handleToggleStatus = async (item: JenisCuti) => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch(getApiUrl(`api/jenis-cuti/${item.id}/toggle-status`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success(`Jenis cuti berhasil ${item.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
        loadJenisCutiData()
      } else {
        throw new Error('Failed to toggle status')
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('Gagal mengubah status')
    }
  }

  const resetForm = () => {
    setFormData({ namaCuti: '', deskripsi: '' })
    setEditingItem(null)
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(0)
    loadJenisCutiData()
  }

  const handleReset = () => {
    setSearchTerm('')
    setCurrentPage(0)
    setTimeout(() => loadJenisCutiData(), 100)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Master Data Jenis Cuti" 
        description="Kelola jenis-jenis cuti yang tersedia di sistem"
        icon={FileText}
      />

      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Daftar Jenis Cuti</CardTitle>
              <CardDescription>
                Kelola semua jenis cuti yang tersedia
              </CardDescription>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Jenis Cuti
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Edit Jenis Cuti' : 'Tambah Jenis Cuti'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem ? 'Perbarui informasi jenis cuti' : 'Tambahkan jenis cuti baru ke sistem'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="namaCuti">Nama Cuti *</Label>
                    <Input
                      id="namaCuti"
                      value={formData.namaCuti}
                      onChange={(e) => setFormData(prev => ({ ...prev, namaCuti: e.target.value }))}
                      placeholder="Contoh: Cuti Tahunan"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="deskripsi">Deskripsi</Label>
                    <Textarea
                      id="deskripsi"
                      value={formData.deskripsi}
                      onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                      placeholder="Deskripsi singkat tentang jenis cuti"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDialogClose(false)}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Menyimpan...' : (editingItem ? 'Perbarui' : 'Simpan')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Cari nama jenis cuti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Cari
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </form>

          {/* Data Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Cuti</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : jenisCutiList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Tidak ada data jenis cuti
                    </TableCell>
                  </TableRow>
                ) : (
                  jenisCutiList.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{currentPage * pageSize + index + 1}</TableCell>
                      <TableCell className="font-medium">{item.namaCuti}</TableCell>
                      <TableCell className="max-w-xs">
                        {item.deskripsi ? (
                          <span className="text-sm text-gray-600">{item.deskripsi}</span>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Tidak ada deskripsi</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.isActive ? "default" : "secondary"}
                          className={item.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {item.isActive ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Aktif</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" /> Nonaktif</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(item.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={item.isActive ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleToggleStatus(item)}
                          >
                            {item.isActive ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <ServerPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={() => {}}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
