'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/alert-dialog';
import { CalendarIcon, FileText, Download, Eye, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { laporanTukinAPI, type LaporanTukin, type LaporanTukinRequest, type LaporanTukinHistoriRequest, type PagedResponse } from '@/lib/api';

interface FormData {
  bulan: string;
  tahun: string;
  tanggalMulai: string;
  tanggalAkhir: string;
}

export default function LaporanTukinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [historiLoading, setHistoriLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean; laporan: LaporanTukin | null}>({
    open: false,
    laporan: null
  });
  const [histori, setHistori] = useState<PagedResponse<LaporanTukin>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    first: true,
    last: true,
    empty: true
  });
  const [currentPage, setCurrentPage] = useState(0);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [formData, setFormData] = useState<FormData>({
    bulan: currentMonth.toString(),
    tahun: currentYear.toString(),
    tanggalMulai: '',
    tanggalAkhir: ''
  });

  const [filters, setFilters] = useState({
    bulan: 'all',
    tahun: 'all',
    status: 'all'
  });

  const months = [
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

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // Auto-set date range when month changes
  useEffect(() => {
    if (formData.bulan && formData.tahun) {
      const year = parseInt(formData.tahun);
      const month = parseInt(formData.bulan);
      
      // Set date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      setFormData(prev => ({
        ...prev,
        tanggalMulai: format(startDate, 'yyyy-MM-dd'),
        tanggalAkhir: format(endDate, 'yyyy-MM-dd')
      }));
    }
  }, [formData.bulan, formData.tahun]);

  useEffect(() => {
    fetchHistori();
  }, [currentPage, filters]);

  const fetchHistori = async () => {
    setHistoriLoading(true);
    try {
      const request: LaporanTukinHistoriRequest = {
        page: currentPage,
        size: 10,
        ...(filters.bulan !== 'all' && { bulan: parseInt(filters.bulan) }),
        ...(filters.tahun !== 'all' && { tahun: parseInt(filters.tahun) }),
        ...(filters.status !== 'all' && { status: filters.status as any })
      };

      const result = await laporanTukinAPI.getHistori(request);
      
      // Ensure result has the expected structure
      if (result && typeof result === 'object') {
        setHistori(result);
      } else {
        // Fallback to empty state if result is invalid
        setHistori({
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 10,
          number: 0,
          first: true,
          last: true,
          empty: true
        });
      }
    } catch (error: any) {
      // Reset to empty state on error
      setHistori({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true,
        empty: true
      });
      
      toast.error('Terjadi kesalahan saat memuat data histori', {
        description: error.message || 'Gagal memuat data histori'
      });
    } finally {
      setHistoriLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const request: LaporanTukinRequest = {
        bulan: parseInt(formData.bulan),
        tahun: parseInt(formData.tahun),
        ...(formData.tanggalMulai && { tanggalMulai: formData.tanggalMulai }),
        ...(formData.tanggalAkhir && { tanggalAkhir: formData.tanggalAkhir }),
        formatLaporan: 'WEB'
      };

      const result = await laporanTukinAPI.generate(request);
      
      toast.success('Laporan Tukin berhasil dibuat!');
      
      // Redirect to detail page
      if (result.id) {
        router.push(`/admin/master-data/laporan-tukin/${result.id}`);
      } else {
        // Refresh histori and close form
        setShowForm(false);
        fetchHistori();
      }
    } catch (error: any) {
      toast.error('Terjadi kesalahan saat generate laporan', {
        description: error.message || 'Terjadi kesalahan saat generate laporan'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (id: number) => {
    router.push(`/admin/master-data/laporan-tukin/${id}`);
  };

  const handleDeleteClick = (laporan: LaporanTukin) => {
    setDeleteDialog({ open: true, laporan });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.laporan) return;

    try {
      await laporanTukinAPI.delete(deleteDialog.laporan.id);
      
      // Close dialog first
      setDeleteDialog({ open: false, laporan: null });
      
      // Show success toast
      toast.success(`Laporan "${deleteDialog.laporan.judul}" berhasil dihapus!`);
      
      // Refresh data
      fetchHistori();
    } catch (error: any) {
      // Close dialog first
      setDeleteDialog({ open: false, laporan: null });
      
      // Show error toast
      toast.error('Terjadi kesalahan saat menghapus laporan', {
        description: error.message || 'Terjadi kesalahan saat menghapus laporan'
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: id });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'PROCESSING':
        return <Badge variant="secondary">Processing</Badge>;
      case 'DRAFT':
        return <Badge variant="outline">Draft</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFormatBadge = (format: string) => {
    const colors = {
      'WEB': 'bg-blue-500',
      'PDF': 'bg-red-500',
      'EXCEL': 'bg-green-500'
    };
    
    return <Badge className={colors[format as keyof typeof colors] || 'bg-gray-500'}>{format}</Badge>;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Laporan Tunjangan Kinerja</h1>
          <p className="text-gray-600 mt-2">Generate dan kelola laporan tunjangan kinerja pegawai</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Generate Laporan
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generate Laporan Tunjangan Kinerja</CardTitle>
            <CardDescription>
              Pilih periode dan format laporan yang ingin digenerate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bulan">Bulan</Label>
                  <Select value={formData.bulan} onValueChange={(value) => setFormData(prev => ({ ...prev, bulan: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bulan" />
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

                <div>
                  <Label htmlFor="tahun">Tahun</Label>
                  <Select value={formData.tahun} onValueChange={(value) => setFormData(prev => ({ ...prev, tahun: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun" />
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tanggalMulai">Tanggal Mulai</Label>
                  <Input
                    id="tanggalMulai"
                    type="date"
                    value={formData.tanggalMulai}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggalMulai: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="tanggalAkhir">Tanggal Akhir</Label>
                  <Input
                    id="tanggalAkhir"
                    type="date"
                    value={formData.tanggalAkhir}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggalAkhir: e.target.value }))}
                  />
                </div>
              </div>



              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? 'Generating...' : 'Generate Laporan'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Histori Laporan */}
      <Card>
        <CardHeader>
          <CardTitle>Histori Laporan</CardTitle>
          <CardDescription>Daftar laporan tunjangan kinerja yang pernah digenerate</CardDescription>
          
          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <Select value={filters.bulan} onValueChange={(value) => setFilters(prev => ({ ...prev, bulan: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.tahun} onValueChange={(value) => setFilters(prev => ({ ...prev, tahun: value }))}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Pegawai</TableHead>
                <TableHead>Total Tunjangan</TableHead>
                <TableHead>Tanggal Generate</TableHead>
                <TableHead>Generated By</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historiLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : histori.empty ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Belum ada laporan yang digenerate
                  </TableCell>
                </TableRow>
              ) : (
                (histori.content || []).map((laporan) => (
                  <TableRow key={laporan.id}>
                    <TableCell className="font-medium">{laporan.judul}</TableCell>
                    <TableCell>
                      {laporan.bulan && laporan.tahun 
                        ? `${months.find(m => m.value === laporan.bulan.toString())?.label} ${laporan.tahun}`
                        : `${formatDate(laporan.tanggalMulai)} - ${formatDate(laporan.tanggalAkhir)}`
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(laporan.status)}</TableCell>
                    <TableCell>{laporan.totalPegawai} orang</TableCell>
                    <TableCell>{formatCurrency(laporan.totalTunjanganBersih || 0)}</TableCell>
                    <TableCell>{formatDate(laporan.tanggalGenerate)}</TableCell>
                    <TableCell>{laporan.generatedBy || 'System'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetail(laporan.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteClick(laporan)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

          {/* Pagination */}
          {histori.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-700">
                Menampilkan {currentPage * histori.size + 1} - {Math.min((currentPage + 1) * histori.size, histori.totalElements)} dari {histori.totalElements} data
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  disabled={histori.first}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={histori.last}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, laporan: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Laporan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus laporan{' '}
              <strong>"{deleteDialog.laporan?.judul}"</strong>?
              <br />
              <br />
              <span className="text-red-600 font-medium">
                ⚠️ Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data laporan secara permanen.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog({ open: false, laporan: null })}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Ya, Hapus Laporan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
