"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, RefreshCw, Edit, Trash2, Eye, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { getApiUrl } from '@/lib/config';
import ServerPagination from '@/components/ServerPagination';

interface HariLibur {
  id: number;
  namaLibur: string;
  tanggalLibur: string;
  bulanLibur: number;
  tahunLibur: number;
  isNasional: boolean;
  keterangan?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HariLiburFormData {
  namaLibur: string;
  tanggalLibur: string;
  isNasional: boolean;
  keterangan: string;
}

const HariLiburPage = () => {
  const [hariLiburs, setHariLiburs] = useState<HariLibur[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedHariLibur, setSelectedHariLibur] = useState<HariLibur | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Filters
  const [filters, setFilters] = useState({
    namaLibur: '',
    tahun: new Date().getFullYear(),
    bulan: '0'
  });
  
  const [appliedFilters, setAppliedFilters] = useState(filters);
  
  // Form data
  const [formData, setFormData] = useState<HariLiburFormData>({
    namaLibur: '',
    tanggalLibur: '',
    isNasional: false,
    keterangan: ''
  });

  const months = [
    { value: '0', label: 'Semua Bulan' },
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);

  const fetchHariLiburs = async (page = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString(),
        ...(appliedFilters.namaLibur && { namaLibur: appliedFilters.namaLibur }),
        ...(appliedFilters.tahun && { tahun: appliedFilters.tahun.toString() }),
        ...(appliedFilters.bulan && appliedFilters.bulan !== '0' && { bulan: appliedFilters.bulan })
      });

      const response = await fetch(getApiUrl(`hari-libur?${params}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Gagal mengambil data hari libur');

      const result = await response.json();
      setHariLiburs(result.data);
      setCurrentPage(result.currentPage);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setAppliedFilters(filters);
    setCurrentPage(0);
  };

  const resetForm = () => {
    setFormData({
      namaLibur: '',
      tanggalLibur: '',
      isNasional: false,
      keterangan: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingId 
        ? getApiUrl(`hari-libur/${editingId}`)
        : getApiUrl('hari-libur');
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(result.message);
      setShowForm(false);
      resetForm();
      fetchHariLiburs(currentPage);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (hariLibur: HariLibur) => {
    setFormData({
      namaLibur: hariLibur.namaLibur,
      tanggalLibur: hariLibur.tanggalLibur,
      isNasional: hariLibur.isNasional,
      keterangan: hariLibur.keterangan || ''
    });
    setEditingId(hariLibur.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus hari libur ini?')) return;

    setLoading(true);
    try {
      const response = await fetch(getApiUrl(`hari-libur/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(result.message);
      fetchHariLiburs(currentPage);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetTahunIni = async () => {
    if (!confirm('Apakah Anda yakin ingin mereset hari libur tahun ini dengan data dari API eksternal? Data hari libur nasional yang ada akan dihapus dan diganti.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(getApiUrl('hari-libur/reset-tahun-ini'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(`${result.message}. Total: ${result.total} hari libur`);
      fetchHariLiburs(currentPage);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const showDetailModal = (hariLibur: HariLibur) => {
    setSelectedHariLibur(hariLibur);
    setShowDetail(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getMonthName = (monthNumber: number) => {
    const month = months.find(m => m.value === monthNumber.toString());
    return month ? month.label : monthNumber.toString();
  };

  useEffect(() => {
    fetchHariLiburs(0);
  }, [appliedFilters, pageSize]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Master Data Hari Libur</h1>
          <p className="text-muted-foreground">Kelola data hari libur nasional dan lokal</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleResetTahunIni}
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Tahun Ini
          </Button>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setShowForm(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Hari Libur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Hari Libur' : 'Tambah Hari Libur Baru'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="namaLibur">Nama Hari Libur</Label>
                  <Input
                    id="namaLibur"
                    value={formData.namaLibur}
                    onChange={(e) => setFormData({ ...formData, namaLibur: e.target.value })}
                    placeholder="Masukkan nama hari libur"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggalLibur">Tanggal Libur</Label>
                  <Input
                    id="tanggalLibur"
                    type="date"
                    value={formData.tanggalLibur}
                    onChange={(e) => setFormData({ ...formData, tanggalLibur: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="isNasional"
                    type="checkbox"
                    checked={formData.isNasional}
                    onChange={(e) => setFormData({ ...formData, isNasional: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isNasional">Hari Libur Nasional</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                  <Input
                    id="keterangan"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Masukkan keterangan"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Menyimpan...' : editingId ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Nama Hari Libur</Label>
              <Input
                value={filters.namaLibur}
                onChange={(e) => setFilters({ ...filters, namaLibur: e.target.value })}
                placeholder="Cari nama hari libur..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tahun</Label>
              <Select
                value={filters.tahun.toString()}
                onValueChange={(value) => setFilters({ ...filters, tahun: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Bulan</Label>
              <Select
                value={filters.bulan}
                onValueChange={(value) => setFilters({ ...filters, bulan: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                Cari
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Hari Libur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Hari Libur</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Bulan</TableHead>
                  <TableHead>Tahun</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : hariLiburs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Tidak ada data hari libur
                    </TableCell>
                  </TableRow>
                ) : (
                  hariLiburs.map((hariLibur, index) => (
                    <TableRow key={hariLibur.id}>
                      <TableCell>{currentPage * pageSize + index + 1}</TableCell>
                      <TableCell className="font-medium">{hariLibur.namaLibur}</TableCell>
                      <TableCell>{formatDate(hariLibur.tanggalLibur)}</TableCell>
                      <TableCell>{getMonthName(hariLibur.bulanLibur)}</TableCell>
                      <TableCell>{hariLibur.tahunLibur}</TableCell>
                      <TableCell>
                        <Badge variant={hariLibur.isNasional ? "default" : "secondary"}>
                          {hariLibur.isNasional ? "Nasional" : "Lokal"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => showDetailModal(hariLibur)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(hariLibur)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(hariLibur.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
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
          <ServerPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalItems}
            pageSize={pageSize}
            onPageChange={(page) => {
              setCurrentPage(page);
              fetchHariLiburs(page);
            }}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(0);
              fetchHariLiburs(0);
            }}
          />
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Hari Libur</DialogTitle>
          </DialogHeader>
          {selectedHariLibur && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Nama Hari Libur</Label>
                <p className="text-lg font-medium">{selectedHariLibur.namaLibur}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Tanggal</Label>
                <p>{formatDate(selectedHariLibur.tanggalLibur)}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Bulan</Label>
                  <p>{getMonthName(selectedHariLibur.bulanLibur)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tahun</Label>
                  <p>{selectedHariLibur.tahunLibur}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <div className="mt-1">
                  <Badge variant={selectedHariLibur.isNasional ? "default" : "secondary"}>
                    {selectedHariLibur.isNasional ? "Nasional" : "Lokal"}
                  </Badge>
                </div>
              </div>
              
              {selectedHariLibur.keterangan && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Keterangan</Label>
                  <p>{selectedHariLibur.keterangan}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Dibuat</Label>
                  <p className="text-sm">{formatDate(selectedHariLibur.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Diupdate</Label>
                  <p className="text-sm">{formatDate(selectedHariLibur.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HariLiburPage;
