"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, Percent, Calculator, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { getApiUrl } from '@/lib/config';
import ServerPagination from '@/components/ServerPagination';
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Pemotongan {
  id: number;
  pegawaiId: number;
  namaPegawai: string;
  nip: string;
  jabatan?: string;
  bulanPemotongan: number;
  tahunPemotongan: number;
  persentasePemotongan: number;
  alasanPemotongan: string;
  nominalPemotongan?: number;
  gajiPokok?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pegawai {
  id: number;
  namaLengkap: string;
  nip: string;
  gajiPokok?: number;
  tunjanganKinerja?: number;
}

interface PemotonganFormData {
  pegawaiId: string;
  bulanPemotongan: number;
  tahunPemotongan: number;
  persentasePemotongan: string;
  alasanPemotongan: string;
}

const PemotonganPage = () => {
  const [pemotongans, setPemotongans] = useState<Pemotongan[]>([]);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedPemotongan, setSelectedPemotongan] = useState<Pemotongan | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Filters
  const currentDate = new Date();
  const [filters, setFilters] = useState({
    namaPegawai: '',
    bulan: currentDate.getMonth() + 1 as number | null,
    tahun: currentDate.getFullYear()
  });
  
  const [appliedFilters, setAppliedFilters] = useState(filters);
  
  // Pegawai dropdown state for form
  const [pegawaiOpen, setPegawaiOpen] = useState(false);
  const [pegawaiSearch, setPegawaiSearch] = useState('');
  
  // Pegawai dropdown state for filter
  const [filterPegawaiOpen, setFilterPegawaiOpen] = useState(false);
  const [filterPegawaiSearch, setFilterPegawaiSearch] = useState('');
  
  // Form data
  const [formData, setFormData] = useState<PemotonganFormData>({
    pegawaiId: '',
    bulanPemotongan: currentDate.getMonth() + 1,
    tahunPemotongan: currentDate.getFullYear(),
    persentasePemotongan: '',
    alasanPemotongan: ''
  });

  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);

  const fetchPemotongans = async (page = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString(),
        ...(appliedFilters.namaPegawai && { namaPegawai: appliedFilters.namaPegawai }),
        ...(appliedFilters.bulan && { bulan: appliedFilters.bulan.toString() }),
        ...(appliedFilters.tahun && { tahun: appliedFilters.tahun.toString() })
      });

      const response = await fetch(getApiUrl(`pemotongan?${params}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Gagal mengambil data pemotongan');

      const result = await response.json();
      setPemotongans(result.data);
      setCurrentPage(result.currentPage);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPegawaiList = async () => {
    try {
      const response = await fetch(getApiUrl('pegawai?size=1000'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Gagal mengambil data pegawai');

      const result = await response.json();
      // API pegawai mengembalikan field 'pegawai', bukan 'data'
      setPegawaiList(result.pegawai || result.data || []);
    } catch (error: any) {
      console.error('Error fetching pegawai:', error);
      toast.error(error.message);
      setPegawaiList([]);
    }
  };

  const handleSearch = () => {
    setAppliedFilters(filters);
    setCurrentPage(0);
  };

  const resetForm = () => {
    setFormData({
      pegawaiId: '',
      bulanPemotongan: currentDate.getMonth() + 1,
      tahunPemotongan: currentDate.getFullYear(),
      persentasePemotongan: '',
      alasanPemotongan: ''
    });
    setEditingId(null);
    setPegawaiSearch('');
    setPegawaiOpen(false);
  };

  const calculateNominalPemotongan = () => {
    const selectedPegawai = pegawaiList.find(p => p.id.toString() === formData.pegawaiId);
    const tunjanganKinerja = selectedPegawai?.tunjanganKinerja || 0;
    const persentase = parseFloat(formData.persentasePemotongan) || 0;
    return (tunjanganKinerja * persentase / 100).toLocaleString('id-ID');
  };

  const getSelectedPegawaiTunjangan = () => {
    const selectedPegawai = pegawaiList.find(p => p.id.toString() === formData.pegawaiId);
    return selectedPegawai?.tunjanganKinerja || 0;
  };

  const handlePegawaiChange = (pegawaiId: string) => {
    const selectedPegawai = pegawaiList.find(p => p.id.toString() === pegawaiId);
    
    // Peringatan jika pegawai tidak memiliki tunjangan kinerja
    if (selectedPegawai && (!selectedPegawai.tunjanganKinerja || selectedPegawai.tunjanganKinerja === 0)) {
      toast.warning(`Pegawai ${selectedPegawai.namaLengkap} belum memiliki tunjangan kinerja. Pemotongan akan menjadi Rp 0.`);
    }
    
    setFormData({
      ...formData,
      pegawaiId
    });
    setPegawaiSearch(''); // Reset search setelah memilih
    setPegawaiOpen(false);
  };

  // Filter pegawai berdasarkan pencarian untuk form
  const filteredPegawaiList = pegawaiList.filter(pegawai =>
    pegawai.namaLengkap.toLowerCase().includes(pegawaiSearch.toLowerCase()) ||
    pegawai.nip.toLowerCase().includes(pegawaiSearch.toLowerCase())
  );

  // Filter pegawai berdasarkan pencarian untuk filter
  const filteredPegawaiListForFilter = pegawaiList.filter(pegawai =>
    pegawai.namaLengkap.toLowerCase().includes(filterPegawaiSearch.toLowerCase()) ||
    pegawai.nip.toLowerCase().includes(filterPegawaiSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi frontend
    if (!formData.pegawaiId) {
      toast.error('Pegawai harus dipilih');
      return;
    }
    
    if (!formData.alasanPemotongan || formData.alasanPemotongan.length < 5) {
      toast.error('Alasan pemotongan minimal 5 karakter');
      return;
    }
    
    if (formData.alasanPemotongan.length > 500) {
      toast.error('Alasan pemotongan maksimal 500 karakter');
      return;
    }
    
    const persentase = parseFloat(formData.persentasePemotongan);
    if (isNaN(persentase) || persentase <= 0 || persentase > 100) {
      toast.error('Persentase pemotongan harus antara 0.01% - 100%');
      return;
    }
    
    setLoading(true);

    try {
      const requestData = {
        pegawaiId: parseInt(formData.pegawaiId),
        bulanPemotongan: formData.bulanPemotongan,
        tahunPemotongan: formData.tahunPemotongan,
        persentasePemotongan: parseFloat(formData.persentasePemotongan),
        alasanPemotongan: formData.alasanPemotongan
      };

      const url = editingId 
        ? getApiUrl(`pemotongan/${editingId}`)
        : getApiUrl('pemotongan');
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(result.message);
      setShowForm(false);
      resetForm();
      fetchPemotongans(currentPage);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pemotongan: Pemotongan) => {
    setFormData({
      pegawaiId: pemotongan.pegawaiId.toString(),
      bulanPemotongan: pemotongan.bulanPemotongan,
      tahunPemotongan: pemotongan.tahunPemotongan,
      persentasePemotongan: pemotongan.persentasePemotongan.toString(),
      alasanPemotongan: pemotongan.alasanPemotongan
    });
    setEditingId(pemotongan.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pemotongan ini?')) return;

    setLoading(true);
    try {
      const response = await fetch(getApiUrl(`pemotongan/${id}`), {
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
      fetchPemotongans(currentPage);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const showDetailModal = (pemotongan: Pemotongan) => {
    setSelectedPemotongan(pemotongan);
    setShowDetail(true);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Rp 0';
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const getMonthName = (monthNumber: number) => {
    const month = months.find(m => m.value === monthNumber);
    return month ? month.label : monthNumber.toString();
  };

  useEffect(() => {
    fetchPemotongans(0);
    fetchPegawaiList();
  }, [appliedFilters, pageSize]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Master Data Pemotongan</h1>
          <p className="text-muted-foreground">Kelola data pemotongan gaji pegawai</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pemotongan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto w-[95vw]">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingId ? 'Edit Pemotongan' : 'Tambah Pemotongan Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pegawaiId">Nama Pegawai *</Label>
                  <Popover open={pegawaiOpen} onOpenChange={setPegawaiOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={pegawaiOpen}
                        className="w-full justify-between h-11"
                      >
                        {formData.pegawaiId ? (
                          <div className="flex flex-col items-start text-left">
                            <span className="font-medium">
                              {pegawaiList.find(p => p.id.toString() === formData.pegawaiId)?.namaLengkap}
                            </span>
                            <span className="text-sm text-gray-500">
                              NIP: {pegawaiList.find(p => p.id.toString() === formData.pegawaiId)?.nip}
                            </span>
                            {pegawaiList.find(p => p.id.toString() === formData.pegawaiId)?.tunjanganKinerja && (
                              <span className="text-xs text-green-600">
                                Tunjangan Kinerja: Rp {pegawaiList.find(p => p.id.toString() === formData.pegawaiId)?.tunjanganKinerja?.toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">
                            {pegawaiList.length === 0 ? "Memuat pegawai..." : "Pilih pegawai untuk melihat tunjangan kinerja..."}
                          </span>
                        )}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
                      <Command>
                        <CommandInput 
                          placeholder="Cari pegawai..." 
                          value={pegawaiSearch}
                          onValueChange={setPegawaiSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {pegawaiList.length === 0 ? 'Memuat data pegawai...' : `Tidak ada pegawai dengan nama atau NIP "${pegawaiSearch}"`}
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredPegawaiList.length > 0 ? filteredPegawaiList.map((pegawai) => (
                              <CommandItem
                                key={pegawai.id}
                                value={pegawai.namaLengkap.toLowerCase()}
                                onSelect={() => handlePegawaiChange(pegawai.id.toString())}
                                className="flex flex-col items-start py-3 cursor-pointer hover:bg-gray-50"
                              >
                                <span className="font-medium">{pegawai.namaLengkap}</span>
                                <span className="text-sm text-gray-500">NIP: {pegawai.nip}</span>
                                <div className="flex gap-4 text-xs">
                                  {pegawai.tunjanganKinerja && pegawai.tunjanganKinerja > 0 ? (
                                    <span className="text-green-600">
                                      Tunjangan Kinerja: Rp {pegawai.tunjanganKinerja.toLocaleString('id-ID')}
                                    </span>
                                  ) : (
                                    <span className="text-red-500 font-medium">
                                      ⚠️ Belum ada tunjangan kinerja
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            )) : pegawaiList.length > 0 && (
                              <div className="p-2 text-center text-sm text-gray-500">
                                Tidak ada pegawai yang sesuai dengan pencarian "{pegawaiSearch}"
                              </div>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulanPemotongan">Bulan Pemotongan *</Label>
                  <Select
                    value={formData.bulanPemotongan.toString()}
                    onValueChange={(value) => setFormData({ ...formData, bulanPemotongan: parseInt(value) })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tahunPemotongan">Tahun Pemotongan *</Label>
                  <Select
                    value={formData.tahunPemotongan.toString()}
                    onValueChange={(value) => setFormData({ ...formData, tahunPemotongan: parseInt(value) })}
                  >
                    <SelectTrigger className="h-11">
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
                  <Label htmlFor="persentasePemotongan">Persentase Pemotongan (%) *</Label>
                  <div className="relative">
                    <Input
                      id="persentasePemotongan"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="100"
                      value={formData.persentasePemotongan}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = parseFloat(value);
                        
                        // Hanya update jika nilai kosong atau <= 100
                        if (value === '' || (numValue >= 0 && numValue <= 100)) {
                          setFormData({ ...formData, persentasePemotongan: value });
                        } else {
                          // Jika melebihi 100, set ke 100
                          setFormData({ ...formData, persentasePemotongan: '100' });
                          toast.warning('Persentase pemotongan maksimal 100%');
                        }
                      }}
                      placeholder="0.00"
                      className="h-11 pr-10"
                      required
                    />
                    <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">Maksimal 100%</p>
                </div>
              </div>

              {formData.pegawaiId && formData.persentasePemotongan && (
                <div className="space-y-2">
                  <Label>Estimasi Pemotongan</Label>
                  {getSelectedPegawaiTunjangan() > 0 ? (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-4 rounded-md border border-blue-200">
                      <Calculator className="h-5 w-5" />
                      <div className="flex flex-col">
                        <span className="font-medium text-lg">Rp {calculateNominalPemotongan()}</span>
                        <span className="text-xs text-gray-600">
                          {formData.persentasePemotongan}% dari tunjangan kinerja pegawai
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-4 rounded-md border border-amber-200">
                      <Calculator className="h-5 w-5" />
                      <div className="flex flex-col">
                        <span className="font-medium text-lg">Rp 0</span>
                        <span className="text-xs text-gray-600">
                          Pegawai belum memiliki tunjangan kinerja yang ditetapkan
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="alasanPemotongan">Alasan Pemotongan *</Label>
                <Textarea
                  id="alasanPemotongan"
                  value={formData.alasanPemotongan}
                  onChange={(e) => setFormData({ ...formData, alasanPemotongan: e.target.value })}
                  placeholder="Masukkan alasan pemotongan (minimal 5 karakter)"
                  rows={4}
                  className="resize-none"
                  maxLength={500}
                  required
                />
                <p className="text-xs text-gray-500">
                  {formData.alasanPemotongan.length}/500 karakter (min: 5)
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="min-w-[100px]"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="min-w-[120px]"
                >
                  {loading ? 'Menyimpan...' : editingId ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Nama Pegawai</Label>
              <Popover open={filterPegawaiOpen} onOpenChange={setFilterPegawaiOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={filterPegawaiOpen}
                    className="w-full justify-between h-11"
                  >
                    {filters.namaPegawai ? (
                      <div className="flex flex-col items-start">
                        <span className="font-medium">
                          {pegawaiList.find(p => p.namaLengkap === filters.namaPegawai)?.namaLengkap || filters.namaPegawai}
                        </span>
                        {pegawaiList.find(p => p.namaLengkap === filters.namaPegawai)?.nip && (
                          <span className="text-sm text-gray-500">
                            NIP: {pegawaiList.find(p => p.namaLengkap === filters.namaPegawai)?.nip}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">
                        {pegawaiList.length === 0 ? "Memuat pegawai..." : "Cari nama pegawai..."}
                      </span>
                    )}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
                  <Command>
                    <CommandInput 
                      placeholder="Cari pegawai..." 
                      value={filterPegawaiSearch}
                      onValueChange={setFilterPegawaiSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {pegawaiList.length === 0 ? 'Memuat data pegawai...' : 'Pegawai tidak ditemukan.'}
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => {
                            setFilters({ ...filters, namaPegawai: '' });
                            setFilterPegawaiSearch('');
                            setFilterPegawaiOpen(false);
                          }}
                          className="flex items-center py-3"
                        >
                          <span className="text-gray-500">Semua Pegawai</span>
                        </CommandItem>
                        {filteredPegawaiListForFilter.length > 0 ? filteredPegawaiListForFilter.map((pegawai) => (
                          <CommandItem
                            key={pegawai.id}
                            value={pegawai.namaLengkap}
                            onSelect={() => {
                              setFilters({ ...filters, namaPegawai: pegawai.namaLengkap });
                              setFilterPegawaiSearch('');
                              setFilterPegawaiOpen(false);
                            }}
                            className="flex flex-col items-start py-3"
                          >
                            <span className="font-medium">{pegawai.namaLengkap}</span>
                            <span className="text-sm text-gray-500">NIP: {pegawai.nip}</span>
                          </CommandItem>
                        )) : pegawaiList.length > 0 && (
                          <div className="p-2 text-center text-sm text-gray-500">
                            Tidak ada pegawai yang sesuai dengan pencarian "{filterPegawaiSearch}"
                          </div>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Bulan</Label>
              <Select
                value={filters.bulan?.toString() || "all"}
                onValueChange={(value) => setFilters({ ...filters, bulan: value === "all" ? null : parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bulan</SelectItem>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <div className="flex justify-between items-start">
            <CardTitle>Daftar Pemotongan</CardTitle>
            {/* Filter badges */}
            <div className="flex gap-2 flex-wrap">
              {appliedFilters.namaPegawai && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Nama: {appliedFilters.namaPegawai}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      setFilters({ ...filters, namaPegawai: '' });
                      setAppliedFilters({ ...appliedFilters, namaPegawai: '' });
                    }}
                  />
                </Badge>
              )}
              {appliedFilters.bulan && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Bulan: {months.find(m => m.value === appliedFilters.bulan)?.label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      const currentMonth = new Date().getMonth() + 1;
                      setFilters({ ...filters, bulan: currentMonth });
                      setAppliedFilters({ ...appliedFilters, bulan: currentMonth });
                    }}
                  />
                </Badge>
              )}
              {appliedFilters.tahun !== new Date().getFullYear() && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Tahun: {appliedFilters.tahun}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      const currentYear = new Date().getFullYear();
                      setFilters({ ...filters, tahun: currentYear });
                      setAppliedFilters({ ...appliedFilters, tahun: currentYear });
                    }}
                  />
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Pegawai</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Persentase</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : pemotongans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Tidak ada data pemotongan
                    </TableCell>
                  </TableRow>
                ) : (
                  pemotongans.map((pemotongan, index) => (
                    <TableRow key={pemotongan.id}>
                      <TableCell>{currentPage * pageSize + index + 1}</TableCell>
                      <TableCell className="font-medium">{pemotongan.namaPegawai}</TableCell>
                      <TableCell>{pemotongan.nip}</TableCell>
                      <TableCell>
                        {getMonthName(pemotongan.bulanPemotongan)} {pemotongan.tahunPemotongan}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {pemotongan.persentasePemotongan}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(pemotongan.nominalPemotongan)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={pemotongan.alasanPemotongan}>
                        {pemotongan.alasanPemotongan}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => showDetailModal(pemotongan)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(pemotongan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(pemotongan.id)}
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
              fetchPemotongans(page);
            }}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(0);
              fetchPemotongans(0);
            }}
          />
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl">Detail Pemotongan</DialogTitle>
          </DialogHeader>
          {selectedPemotongan && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nama Pegawai</Label>
                    <p className="text-lg font-medium">{selectedPemotongan.namaPegawai}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">NIP</Label>
                    <p className="font-mono">{selectedPemotongan.nip}</p>
                  </div>
                  {selectedPemotongan.jabatan && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Jabatan</Label>
                      <p>{selectedPemotongan.jabatan}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Periode</Label>
                    <p className="text-lg">{getMonthName(selectedPemotongan.bulanPemotongan)} {selectedPemotongan.tahunPemotongan}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Persentase Pemotongan</Label>
                    <p className="text-2xl font-bold text-red-600">{selectedPemotongan.persentasePemotongan}%</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <Label className="text-sm font-medium text-gray-500">Gaji Pokok</Label>
                  <p className="text-xl font-mono font-bold text-blue-700">{formatCurrency(selectedPemotongan.gajiPokok)}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <Label className="text-sm font-medium text-gray-500">Nominal Pemotongan</Label>
                  <p className="text-xl font-mono font-bold text-red-700">
                    {formatCurrency(selectedPemotongan.nominalPemotongan)}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Alasan Pemotongan</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-md border">
                  <p className="whitespace-pre-wrap">{selectedPemotongan.alasanPemotongan}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Dibuat</Label>
                  <p className="text-sm">{new Date(selectedPemotongan.createdAt).toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Diupdate</Label>
                  <p className="text-sm">{new Date(selectedPemotongan.updatedAt).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PemotonganPage;
