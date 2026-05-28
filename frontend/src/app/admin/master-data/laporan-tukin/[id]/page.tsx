'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Printer, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Users,
  Calculator,
  TrendingDown,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { laporanTukinAPI, type LaporanTukin, type DetailPegawaiTukin } from '@/lib/api';

// Server-paginated rincian detail component - fetches 10 employees per page
function RincianDetailPerPegawai({ 
  laporanId,
  formatCurrency, 
  safeFormatDate 
}: {
  laporanId: number;
  formatCurrency: (amount: number) => string;
  safeFormatDate: (dateString: string | null | undefined) => string;
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DetailPegawaiTukin[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedEmployees, setExpandedEmployees] = useState<Record<number, DetailPegawaiTukin | null>>({});
  const [loadingEmployee, setLoadingEmployee] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchPage = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const result = await laporanTukinAPI.getRincianPaginated(laporanId, page, pageSize);
      setData(result.content);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalElements);
      setCurrentPage(page);
      setExpandedEmployees({});
    } catch (error) {
      console.error('Error fetching rincian:', error);
    } finally {
      setLoading(false);
    }
  }, [laporanId, pageSize]);

  useEffect(() => {
    fetchPage(0);
  }, [fetchPage]);

  const toggleEmployeeDetail = async (pegawaiId: number) => {
    if (expandedEmployees[pegawaiId] !== undefined) {
      // Toggle collapse
      setExpandedEmployees(prev => {
        const next = { ...prev };
        delete next[pegawaiId];
        return next;
      });
      return;
    }
    // Lazy-load full detail for this employee
    setLoadingEmployee(pegawaiId);
    try {
      const result = await laporanTukinAPI.getRincianPaginated(laporanId, 0, 1, pegawaiId);
      const detail = result.content[0] || null;
      setExpandedEmployees(prev => ({ ...prev, [pegawaiId]: detail }));
    } catch (error) {
      console.error('Error loading employee detail:', error);
    } finally {
      setLoadingEmployee(null);
    }
  };

  const filteredData = searchTerm
    ? data.filter(e =>
        e.namaLengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.nip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.jabatan?.toLowerCase().includes(searchTerm.toLowerCase()))
    : data;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Rincian Detail Per Pegawai</h3>
        </div>
        <div className="text-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
          <div className="text-sm text-gray-500">Memuat data halaman {currentPage + 1}...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Rincian Detail Per Pegawai</h3>
          <Badge variant="secondary">{totalItems} pegawai</Badge>
        </div>
      </div>

      {/* Search in current page */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari nama / NIP / jabatan di halaman ini..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setSearchTerm(searchInput)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setSearchTerm(searchInput)}>
              <Search className="w-4 h-4 mr-1" /> Cari
            </Button>
            {searchTerm && (
              <Button variant="ghost" onClick={() => { setSearchTerm(''); setSearchInput(''); }}>
                Reset
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Menampilkan {filteredData.length} dari {data.length} pegawai di halaman ini
            {totalPages > 1 && ` (Halaman ${currentPage + 1} dari ${totalPages})`}
          </p>
        </CardContent>
      </Card>

      {/* Employee Cards */}
      <div className="space-y-3">
        {filteredData.map((pegawai) => {
          const empId = pegawai.pegawaiId;
          const isExpanded = empId in expandedEmployees;
          const isLoadingThis = loadingEmployee === empId;
          const expandedDetail = expandedEmployees[empId];
          const daysWithDeduction = (pegawai as any).historiAbsensi?.filter((h: any) => h.nominalPemotongan > 0).length ?? 0;

          return (
            <Card key={empId} className="border transition-all duration-200 hover:shadow-md">
              <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors pb-3"
                onClick={() => toggleEmployeeDetail(empId)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{pegawai.namaLengkap}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{pegawai.nip || '-'}</Badge>
                      <Badge variant="secondary" className="text-xs">{pegawai.jabatan}</Badge>
                      <span className="text-xs text-gray-500">{pegawai.lokasi}</span>
                    </CardDescription>
                  </div>
                  <div className="hidden md:flex items-center gap-6 text-sm mr-4">
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{formatCurrency(pegawai.tunjanganKinerja || 0)}</div>
                      <div className="text-xs text-gray-500">Tunjangan</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-semibold ${(pegawai.totalPotongan ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(pegawai.totalPotongan ?? 0)}
                      </div>
                      <div className="text-xs text-gray-500">Total Potong</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{formatCurrency(pegawai.tunjanganBersih ?? 0)}</div>
                      <div className="text-xs text-gray-500">Bersih</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(pegawai.totalPotongan ?? 0) === 0 ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Perfect</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">Ada Potongan</Badge>
                    )}
                    {isLoadingThis
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    }
                  </div>
                </div>
                {/* Mobile quick stats */}
                <div className="md:hidden grid grid-cols-3 gap-2 mt-3 pt-3 border-t text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-green-600 text-xs">{formatCurrency(pegawai.tunjanganKinerja || 0)}</div>
                    <div className="text-xs text-gray-500">Tunjangan</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-semibold text-xs ${(pegawai.totalPotongan ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(pegawai.totalPotongan ?? 0)}
                    </div>
                    <div className="text-xs text-gray-500">Potongan</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600 text-xs">{formatCurrency(pegawai.tunjanganBersih ?? 0)}</div>
                    <div className="text-xs text-gray-500">Bersih</div>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && expandedDetail && (
                <CardContent className="pt-0 border-t">
                  {/* Summary stats */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg my-3">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center text-sm">
                      <div>
                        <div className="font-bold text-blue-600">{formatCurrency(expandedDetail.tunjanganKinerja || 0)}</div>
                        <div className="text-xs text-gray-500">Tunjangan Dasar</div>
                      </div>
                      <div>
                        <div className="font-bold text-purple-600">{formatCurrency((expandedDetail as any).maxPossibleDeduction || 0)}</div>
                        <div className="text-xs text-gray-500">Maks. Potong (60%)</div>
                      </div>
                      <div>
                        <div className={`font-bold text-red-600 ${(expandedDetail as any).isTotalCapped ? 'border-2 border-red-600 rounded px-1' : ''}`}>
                          {formatCurrency(expandedDetail.totalPotongan || 0)}
                        </div>
                        <div className="text-xs text-gray-500">Total Pemotongan</div>
                      </div>
                      <div>
                        <div className="font-bold text-green-600">{formatCurrency(expandedDetail.tunjanganBersih || 0)}</div>
                        <div className="text-xs text-gray-500">Tunjangan Bersih</div>
                      </div>
                      <div>
                        <div className="font-bold text-orange-600">
                          {expandedDetail.historiAbsensi?.filter((h: any) => h.nominalPemotongan > 0).length || 0}
                        </div>
                        <div className="text-xs text-gray-500">Hari Potong</div>
                      </div>
                    </div>
                  </div>

                  {/* Daily attendance table */}
                  {expandedDetail.historiAbsensi && expandedDetail.historiAbsensi.length > 0 && (
                    <div className="overflow-x-auto">
                      <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Rincian Harian
                        <span className="text-xs text-gray-500 ml-2">
                          ({expandedDetail.historiAbsensi.filter((h: any) => h.nominalPemotongan > 0).length} dari {expandedDetail.historiAbsensi.length} hari ada pemotongan)
                        </span>
                      </p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Hari</TableHead>
                            <TableHead>Jam Masuk</TableHead>
                            <TableHead>Jam Pulang</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Pemotongan</TableHead>
                            <TableHead>Keterangan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expandedDetail.historiAbsensi.map((absensi: any, index: number) => {
                            const hasDeduction = absensi.nominalPemotongan > 0;
                            return (
                              <TableRow key={index} className={hasDeduction ? 'bg-red-50 dark:bg-red-950 border-l-4 border-l-red-400' : ''}>
                                <TableCell className="font-medium text-xs">{safeFormatDate(absensi.tanggal)}</TableCell>
                                <TableCell className="text-xs">{absensi.hari || '-'}</TableCell>
                                <TableCell className="text-xs">{absensi.jamMasuk || '-'}</TableCell>
                                <TableCell className="text-xs">{absensi.jamPulang || '-'}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={absensi.statusMasuk === 'HADIR' ? 'default' :
                                      absensi.statusMasuk === 'TERLAMBAT' ? 'destructive' :
                                      absensi.statusMasuk === 'LIBUR' ? 'outline' :
                                      absensi.statusMasuk === 'CUTI' ? 'secondary' :
                                      absensi.statusMasuk === 'MENDATANG' ? 'outline' : 'secondary'}
                                    className={`text-xs ${absensi.statusMasuk === 'CUTI' ? 'bg-blue-100 text-blue-800' : ''}`}
                                  >
                                    {absensi.statusMasuk || absensi.status || 'HADIR'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {hasDeduction ? (
                                    <div className="text-red-600 text-xs">
                                      <div className="font-semibold">{formatCurrency(absensi.nominalPemotongan || 0)}</div>
                                      <div>({(absensi.persentasePemotongan || 0).toFixed(2)}%)</div>
                                    </div>
                                  ) : (
                                    <span className="text-green-600 text-xs">Tidak Ada</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-gray-600">{absensi.detailPemotongan || absensi.keterangan || '-'}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Server-side pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Halaman {currentPage + 1} dari {totalPages} ({totalItems} pegawai total)
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => fetchPage(0)} disabled={currentPage === 0}>«</Button>
                <Button variant="outline" size="sm" onClick={() => fetchPage(currentPage - 1)} disabled={currentPage === 0}>‹</Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i;
                  return (
                    <Button key={p} variant={currentPage === p ? 'default' : 'outline'} size="sm"
                      onClick={() => fetchPage(p)} className="w-8 h-8">{p + 1}</Button>
                  );
                })}
                <Button variant="outline" size="sm" onClick={() => fetchPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}>›</Button>
                <Button variant="outline" size="sm" onClick={() => fetchPage(totalPages - 1)} disabled={currentPage >= totalPages - 1}>»</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
export default function LaporanTukinDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [laporan, setLaporan] = useState<LaporanTukin | null>(null);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  useEffect(() => {
    fetchLaporanDetail();
  }, [params.id]);

  const fetchLaporanDetail = async () => {
    setLoading(true);
    try {
      const result = await laporanTukinAPI.getById(Number(params.id));
      if (!result || typeof result !== 'object') {
        throw new Error('Data laporan tidak valid atau kosong');
      }
      setLaporan(result);
    } catch (error: any) {
      console.error('Error fetching laporan detail:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengambil detail laporan",
        variant: "destructive"
      });
      setLaporan(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if invalid date
      }
      return format(date, 'dd MMMM yyyy', { locale: id });
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return dateString || '-';
    }
  };

  const safeFormatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if invalid date
      }
      return format(date, 'dd/MM/yyyy', { locale: id });
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return dateString || '-';
    }
  };

  const handlePrint = async () => {
    try {
      // Create print-friendly popup window
      const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
      if (!printWindow) {
        toast({
          title: "Error",
          description: "Popup diblokir. Harap izinkan popup untuk print.",
          variant: "destructive"
        });
        return;
      }

      const printContent = generateComprehensivePrintContent();
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Laporan Tunjangan Kinerja - ${laporan?.judul}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.3; color: #000; background: #fff; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
              .header h1 { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
              .header p { font-size: 12px; color: #666; }
              .summary { display: flex; justify-content: space-around; margin: 20px 0; border: 1px solid #ccc; background: #f9f9f9; }
              .summary-item { padding: 15px; text-align: center; flex: 1; border-right: 1px solid #ccc; }
              .summary-item:last-child { border-right: none; }
              .summary-item .label { font-size: 10px; color: #666; text-transform: uppercase; }
              .summary-item .value { font-size: 14px; font-weight: bold; margin-top: 5px; color: #333; }
              .section { margin: 25px 0; }
              .section-title { font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 5px; text-transform: uppercase; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              th, td { padding: 8px 6px; border: 1px solid #ccc; text-align: left; font-size: 10px; }
              th { background-color: #f5f5f5; font-weight: bold; text-align: center; color: #333; }
              .number { text-align: right; font-family: monospace; }
              .center { text-align: center; }
              .currency { font-family: monospace; color: #2563eb; }
              .employee-section { margin: 30px 0; border: 1px solid #ddd; padding: 15px; background: #fafafa; }
              .employee-header { font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #333; }
              .attendance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 2px; margin: 10px 0; }
              .attendance-day { padding: 3px; text-align: center; font-size: 8px; border: 1px solid #ddd; }
              .hadir { background-color: #dcfce7; color: #166534; }
              .alpha { background-color: #fecaca; color: #dc2626; }
              .sakit { background-color: #fef3c7; color: #d97706; }
              .cuti { background-color: #dbeafe; color: #2563eb; }
              .libur { background-color: #f3e8ff; color: #7c3aed; }
              .page-break { page-break-before: always; }
              @media print {
                body { font-size: 10px; }
                .section { margin: 20px 0; }
                table { font-size: 9px; }
                th, td { padding: 4px 3px; }
                .employee-section { margin: 20px 0; padding: 10px; }
                .attendance-grid { grid-template-columns: repeat(10, 1fr); }
                .attendance-day { font-size: 7px; padding: 2px; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      // Auto print after a short delay
      setTimeout(() => {
        printWindow.print();
      }, 1000);
      
      toast({
        title: "Print Preview",
        description: "Jendela print telah dibuka dengan data lengkap Rincian Detail semua Pegawai",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error printing:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuka print preview",
        variant: "destructive"
      });
    }
  };
  const generateComprehensivePrintContent = () => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount);
    };

    return `
      <div class="header">
        <h1>${laporan?.judul || 'Laporan Tunjangan Kinerja'}</h1>
        <p>Periode: ${laporan?.tanggalMulai ? formatDate(laporan.tanggalMulai) : '-'} - ${laporan?.tanggalAkhir ? formatDate(laporan.tanggalAkhir) : '-'}</p>
        <p>Generated: ${laporan?.tanggalGenerate ? formatDate(laporan.tanggalGenerate) : '-'} oleh ${laporan?.generatedBy || '-'}</p>
      </div>

      <div class="summary">
        <div class="summary-item">
          <div class="label">Total Pegawai</div>
          <div class="value">${laporan?.totalPegawai || 0}</div>
        </div>
        <div class="summary-item">
          <div class="label">Total Tunjangan Kinerja</div>
          <div class="value currency">${formatCurrency(laporan?.totalTunjanganKinerja || 0)}</div>
        </div>
        <div class="summary-item">
          <div class="label">Total Potongan</div>
          <div class="value currency">${formatCurrency((laporan?.totalPotonganAbsen || 0) + (laporan?.totalPemotongan || 0))}</div>
        </div>
        <div class="summary-item">
          <div class="label">Total Tunjangan Bersih</div>
          <div class="value currency">${formatCurrency(laporan?.totalTunjanganBersih || 0)}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Ringkasan Tunjangan Kinerja Per Pegawai</div>
        <table>
          <thead>
            <tr>
              <th style="width: 25px;">No</th>
              <th style="width: 90px;">NIP</th>
              <th style="width: 140px;">Nama Pegawai</th>
              <th style="width: 110px;">Jabatan</th>
              <th style="width: 70px;">Lokasi</th>
              <th style="width: 80px;">Tunjangan Kinerja</th>
              <th style="width: 40px;">Masuk</th>
              <th style="width: 70px;">Pot. Absen</th>
              <th style="width: 70px;">Pot. Lain</th>
              <th style="width: 80px;">Tunj. Bersih</th>
            </tr>
          </thead>
          <tbody>
            ${laporan?.detailPegawai?.map((pegawai, index) => {
              const totalMasuk = pegawai.historiAbsensi ? 
                pegawai.historiAbsensi.filter((h: any) => {
                  const status = h.statusMasuk || h.status || 'HADIR';
                  return status !== 'ALPHA' && status !== 'TIDAK_HADIR';
                }).length : 
                (pegawai.statistikAbsen ? (pegawai.statistikAbsen as any).totalHariKerja - (pegawai.statistikAbsen as any).totalAlpha : '-');
              
              return `
                <tr>
                  <td class="center">${index + 1}</td>
                  <td>${pegawai.nip || '-'}</td>
                  <td>${pegawai.namaLengkap}</td>
                  <td>${pegawai.jabatan}</td>
                  <td>${pegawai.lokasi}</td>
                  <td class="number currency">${formatCurrency(pegawai.tunjanganKinerja || 0)}</td>
                  <td class="center">${totalMasuk}</td>
                  <td class="number currency">${formatCurrency(pegawai.potonganAbsen || 0)}</td>
                  <td class="number currency">${formatCurrency(pegawai.pemotonganLain || 0)}</td>
                  <td class="number currency">${formatCurrency(pegawai.tunjanganBersih || 0)}</td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="10" class="center">Tidak ada data pegawai</td></tr>'}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Catatan</div>
        <p>Untuk rincian detail kehadiran harian per pegawai, gunakan fitur "Lihat Rincian" di halaman detail laporan.</p>
      </div>
    `;
  };
  const generatePrintContent = () => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount);
    };

    return `
      <div class="header">
        <h1>${laporan?.judul || 'Laporan Tunjangan Kinerja'}</h1>
        <p>Periode: ${laporan?.tanggalMulai ? formatDate(laporan.tanggalMulai) : '-'} - ${laporan?.tanggalAkhir ? formatDate(laporan.tanggalAkhir) : '-'}</p>
        <p>Generated: ${laporan?.tanggalGenerate ? formatDate(laporan.tanggalGenerate) : '-'} oleh ${laporan?.generatedBy || '-'}</p>
      </div>

      <div class="summary">
        <div class="summary-item">
          <div class="label">Total Pegawai</div>
          <div class="value">${laporan?.totalPegawai || 0}</div>
        </div>
        <div class="summary-item">
          <div class="label">Total Tunjangan Kinerja</div>
          <div class="value currency">${formatCurrency(laporan?.totalTunjanganKinerja || 0)}</div>
        </div>
        <div class="summary-item">
          <div class="label">Total Potongan</div>
          <div class="value currency">${formatCurrency((laporan?.totalPotonganAbsen || 0) + (laporan?.totalPemotongan || 0))}</div>
        </div>
        <div class="summary-item">
          <div class="label">Total Tunjangan Bersih</div>
          <div class="value currency">${formatCurrency(laporan?.totalTunjanganBersih || 0)}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Detail Tunjangan Kinerja Per Pegawai</div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th style="width: 100px;">NIP</th>
              <th style="width: 150px;">Nama Pegawai</th>
              <th style="width: 120px;">Jabatan</th>
              <th style="width: 80px;">Lokasi</th>
              <th style="width: 90px;">Tunjangan Kinerja</th>
              <th style="width: 50px;">Masuk</th>
              <th style="width: 80px;">Pot. Absen</th>
              <th style="width: 80px;">Pot. Lain</th>
              <th style="width: 80px;">Total Pot.</th>
              <th style="width: 90px;">Tunj. Bersih</th>
            </tr>
          </thead>
          <tbody>
            ${laporan?.detailPegawai?.map((pegawai, index) => {
              const totalMasuk = pegawai.historiAbsensi ? 
                pegawai.historiAbsensi.filter((h: any) => {
                  const status = h.statusMasuk || h.status || 'HADIR';
                  return status !== 'ALPHA' && status !== 'TIDAK_HADIR';
                }).length : 
                (pegawai.statistikAbsen ? (pegawai.statistikAbsen as any).totalHariKerja - (pegawai.statistikAbsen as any).totalAlpha : '-');
              
              return `
                <tr>
                  <td class="center">${index + 1}</td>
                  <td>${pegawai.nip || '-'}</td>
                  <td>${pegawai.namaLengkap}</td>
                  <td>${pegawai.jabatan}</td>
                  <td>${pegawai.lokasi}</td>
                  <td class="number currency">${formatCurrency(pegawai.tunjanganKinerja || 0)}</td>
                  <td class="center">${totalMasuk}</td>
                  <td class="number currency">${formatCurrency(pegawai.potonganAbsen || 0)}</td>
                  <td class="number currency">${formatCurrency(pegawai.pemotonganLain || 0)}</td>
                  <td class="number currency">${formatCurrency(pegawai.totalPotongan || 0)}</td>
                  <td class="number currency">${formatCurrency(pegawai.tunjanganBersih || 0)}</td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="11" class="center">Tidak ada data pegawai</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  };

  const handleExportPDF = async () => {
    try {
      const blob = await laporanTukinAPI.downloadPDF(Number(params.id));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-tukin-${laporan?.bulan}-${laporan?.tahun}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF Downloaded",
        description: "File PDF laporan berhasil didownload",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal download PDF",
        variant: "destructive"
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await laporanTukinAPI.downloadFile(Number(params.id));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-tukin-${laporan?.bulan}-${laporan?.tahun}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal export Excel",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!laporan) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <div className="text-lg">Laporan tidak ditemukan</div>
          <Button onClick={() => router.back()} className="mt-4">
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header - Responsive Design */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">{laporan.judul}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">
              Periode: {laporan.tanggalMulai ? formatDate(laporan.tanggalMulai) : '-'} - {laporan.tanggalAkhir ? formatDate(laporan.tanggalAkhir) : '-'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePrint} size="sm">
            <Printer className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button variant="outline" onClick={handleExportPDF} size="sm">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button variant="outline" onClick={handleExportExcel} size="sm">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Total Pegawai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{laporan.totalPegawai}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pegawai aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Total Tunjangan Kinerja</span>
              <span className="lg:hidden">Tunjangan</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg lg:text-2xl font-bold text-green-600">
              <span className="lg:hidden">{formatCurrency(laporan.totalTunjanganKinerja || 0).slice(0, -3)}K</span>
              <span className="hidden lg:inline">{formatCurrency(laporan.totalTunjanganKinerja || 0)}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sebelum potongan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <TrendingDown className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Total Potongan</span>
              <span className="lg:hidden">Potongan</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg lg:text-2xl font-bold text-red-600">
              <span className="lg:hidden">{formatCurrency((laporan.totalPotonganAbsen || 0) + (laporan.totalPemotongan || 0)).slice(0, -3)}K</span>
              <span className="hidden lg:inline">{formatCurrency((laporan.totalPotonganAbsen || 0) + (laporan.totalPemotongan || 0))}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Absen + Lainnya</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Total Tunjangan Bersih</span>
              <span className="lg:hidden">Bersih</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg lg:text-2xl font-bold text-blue-600">
              <span className="lg:hidden">{formatCurrency(laporan.totalTunjanganBersih || 0).slice(0, -3)}K</span>
              <span className="hidden lg:inline">{formatCurrency(laporan.totalTunjanganBersih || 0)}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Setelah potongan</p>
          </CardContent>
        </Card>
      </div>

      {/* Detail Pegawai - Paginated */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Detail Tunjangan Kinerja Per Pegawai</span>
            <Badge variant="secondary">{laporan.totalPegawai} pegawai</Badge>
          </CardTitle>
          <CardDescription>
            Rincian perhitungan tunjangan kinerja untuk periode {months[laporan.bulan - 1]} {laporan.tahun}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RincianDetailPerPegawai 
            laporanId={Number(params.id)}
            formatCurrency={formatCurrency} 
            safeFormatDate={safeFormatDate} 
          />
        </CardContent>
      </Card>

      {/* Footer Info - Mobile Responsive */}
      <div className="mt-6 text-sm text-gray-600 dark:text-gray-400 print:block">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <p>Generated pada: {laporan.tanggalGenerate ? formatDate(laporan.tanggalGenerate) : '-'}</p>
            <p>Generated oleh: {laporan.generatedBy}</p>
          </div>
          <div className="lg:text-right">
            <p className="font-medium">Status: <Badge variant="default">{laporan.status}</Badge></p>
            <p className="mt-1">Format: <Badge variant="outline">{laporan.formatLaporan}</Badge></p>
          </div>
        </div>
      </div>

      {/* Responsive Print Styles */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .container {
            max-width: none !important;
            margin: 0 !important;
            padding: 1rem !important;
          }
          table {
            font-size: 10px !important;
          }
          .text-2xl {
            font-size: 1.25rem !important;
          }
          .text-3xl {
            font-size: 1.5rem !important;
          }
          .lg\\:hidden {
            display: none !important;
          }
          .hidden.lg\\:block {
            display: block !important;
          }
        }
        
        @media (max-width: 768px) {
          .container {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .bg-gray-50 {
            background-color: rgb(17 24 39) !important;
          }
          .text-gray-600 {
            color: rgb(156 163 175) !important;
          }
          .border-gray-200 {
            border-color: rgb(55 65 81) !important;
          }
        }
      `}</style>
    </div>
  );
}
