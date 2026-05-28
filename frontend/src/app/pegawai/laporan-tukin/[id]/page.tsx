'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Download, FileText, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { personalLaporanTukinAPI, type LaporanTukin, type DetailPegawaiTukin } from '@/lib/api';

// Component for detailed per-employee breakdown with tabs
function RincianDetailPerPegawai({ 
  laporanId,
  formatCurrency, 
  safeFormatDate 
}: {
  laporanId: number;
  formatCurrency: (amount: number) => string;
  safeFormatDate: (dateString: string | null | undefined) => string;
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [pegawaiList, setPegawaiList] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchDetailData();
    fetchPegawaiList();
  }, [laporanId]);

  const fetchDetailData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pegawai/laporan-tukin/${laporanId}/rincian`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setDetailData(result.data || []);
      } else {
        console.error('Failed to fetch detail data:', result.message);
      }
    } catch (error) {
      console.error('Error fetching detail data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPegawaiList = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pegawai/laporan-tukin/${laporanId}/pegawai`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setPegawaiList(result.data || []);
      } else {
        console.error('Failed to fetch pegawai list:', result.message);
      }
    } catch (error) {
      console.error('Error fetching pegawai list:', error);
    }
  };

  const fetchIndividualData = async (pegawaiId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pegawai/laporan-tukin/${laporanId}/rincian?pegawaiId=${pegawaiId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (result.success) {
        return result.data[0]; // Return the first item since it's filtered by pegawaiId
      }
      return null;
    } catch (error) {
      console.error('Error fetching individual data:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Rincian Detail Per Pegawai</h3>
        <div className="text-center py-8">
          <div className="text-lg">Loading data detail...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Rincian Detail Per Pegawai</h3>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="all" className="px-4 py-2 text-sm">
            Semua Pegawai
          </TabsTrigger>
          {pegawaiList.map((pegawai: any) => (
            <TabsTrigger 
              key={pegawai.id} 
              value={pegawai.id.toString()}
              className="px-4 py-2 text-sm whitespace-nowrap"
            >
              {pegawai.namaLengkap ? pegawai.namaLengkap.split(' ')[0] : `Pegawai ${pegawai.id}`}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Semua Pegawai</CardTitle>
              <CardDescription>
                Statistik keseluruhan pemotongan untuk periode ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{detailData.length}</div>
                  <div className="text-xs text-gray-600">Total Pegawai</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {detailData.filter((pegawai: any) => {
                      const daysWithDeduction = pegawai.historiAbsensi?.filter((h: any) => h.nominalPemotongan > 0).length || 0;
                      return daysWithDeduction === 0;
                    }).length}
                  </div>
                  <div className="text-xs text-gray-600">Pegawai Tanpa Pemotongan</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {detailData.filter((pegawai: any) => {
                      const daysWithDeduction = pegawai.historiAbsensi?.filter((h: any) => h.nominalPemotongan > 0).length || 0;
                      return daysWithDeduction > 0;
                    }).length}
                  </div>
                  <div className="text-xs text-gray-600">Pegawai Terkena Potongan</div>
                </div>
              </div>
              
              <div className="space-y-4">
                {detailData.map((pegawai: any) => {
                  const daysWithDeduction = pegawai.historiAbsensi?.filter((h: any) => h.nominalPemotongan > 0).length || 0;
                  const totalDays = pegawai.historiAbsensi?.length || 0;
                  
                  return (
                    <div key={pegawai.pegawai?.id || pegawai.pegawaiId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{pegawai.pegawai?.nama || pegawai.namaLengkap} ({pegawai.pegawai?.nip || pegawai.nip})</h4>
                          <p className="text-sm text-gray-600">{pegawai.pegawai?.jabatan?.nama || pegawai.jabatan} - {pegawai.pegawai?.lokasiKerja || pegawai.lokasi}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActiveTab((pegawai.pegawai?.id || pegawai.pegawaiId).toString())}
                            className="ml-2"
                          >
                            Lihat Detail
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-4 text-center text-sm">
                        <div>
                          <div className="font-medium text-gray-700">
                            {pegawai.historiAbsensi?.filter((h: any) => {
                              const status = h.statusMasuk || h.status || 'HADIR';
                              return status !== 'ALPHA' && status !== 'TIDAK_HADIR';
                            }).length || 0}
                          </div>
                          <div className="text-xs text-gray-500">Hari Masuk</div>
                        </div>
                        <div>
                          <div className="font-medium text-red-600">{daysWithDeduction}</div>
                          <div className="text-xs text-gray-500">Hari Potong</div>
                        </div>
                        <div>
                          <div className="font-medium text-green-600">
                            {totalDays - daysWithDeduction}
                          </div>
                          <div className="text-xs text-gray-500">Hari Tidak Terpotong</div>
                        </div>
                        <div>
                          <div className="font-medium text-green-600">
                            {formatCurrency((pegawai.tunjanganKinerja || 0) - (pegawai.totalPotongan || 0))}
                          </div>
                          <div className="text-xs text-gray-500">Tunjangan Bersih</div>
                        </div>
                        <div>
                          <div className="font-medium text-red-600">
                            {formatCurrency(pegawai.totalPotongan || 0)}
                          </div>
                          <div className="text-xs text-gray-500">Total Potong</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual Employee Tabs */}
        {pegawaiList.map((pegawai: any) => (
          <TabsContent key={pegawai.id} value={pegawai.id.toString()} className="mt-6">
            <IndividualEmployeeDetail 
              pegawaiId={pegawai.id}
              laporanId={laporanId}
              fetchIndividualData={fetchIndividualData}
              formatCurrency={formatCurrency}
              safeFormatDate={safeFormatDate}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Component for individual employee detail that loads data on-demand
function IndividualEmployeeDetail({
  pegawaiId,
  laporanId,
  fetchIndividualData,
  formatCurrency,
  safeFormatDate
}: {
  pegawaiId: number;
  laporanId: number;
  fetchIndividualData: (pegawaiId: number) => Promise<any>;
  formatCurrency: (amount: number) => string;
  safeFormatDate: (dateString: string | null | undefined) => string;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const result = await fetchIndividualData(pegawaiId);
      setData(result);
      setLoading(false);
    };
    loadData();
  }, [pegawaiId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Loading detail pegawai...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Data tidak ditemukan</div>
      </div>
    );
  }

  const renderEmployeeDetail = (pegawai: any) => (
    <Card key={pegawai.pegawai?.id || pegawai.pegawaiId} className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <span>{pegawai.pegawai?.nama || pegawai.namaLengkap} ({pegawai.pegawai?.nip || pegawai.nip})</span>
            <Badge variant="outline" className="ml-2">{pegawai.pegawai?.jabatan?.nama || pegawai.jabatan}</Badge>
          </div>
          <div className="text-sm text-gray-500">{pegawai.pegawai?.lokasiKerja || pegawai.lokasi}</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Statistics Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(pegawai.totalTukin || pegawai.tunjanganKinerja || 0)}
              </div>
              <div className="text-xs text-gray-600">Tunjangan Dasar</div>
            </div>
            <div>
              <div className={`text-lg font-bold text-red-600 ${pegawai.isTotalCapped ? 'font-black border-2 border-red-600 rounded px-2 py-1' : ''}`}>
                {formatCurrency(pegawai.totalPotongan || pegawai.potonganAbsen || 0)}
              </div>
              <div className="text-xs text-gray-600">
                Total Pemotongan
                {pegawai.isTotalCapped && (
                  <span className="text-red-600 font-bold ml-1">(MAX 60%)</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency((pegawai.totalTukin || pegawai.tunjanganKinerja || 0) - (pegawai.totalPotongan || 0))}
              </div>
              <div className="text-xs text-gray-600">Tunjangan Bersih</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">
                {pegawai.historiAbsensi?.filter((h: any) => h.nominalPemotongan > 0).length || 0}
              </div>
              <div className="text-xs text-gray-600">Hari Potong</div>
            </div>
          </div>
        </div>
        
        {/* Daily Attendance with Deduction Details */}
        {pegawai.historiAbsensi && pegawai.historiAbsensi.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 text-gray-700">
              Rincian Harian dengan Persentase Pemotongan
              <span className="text-sm text-gray-500 ml-2">
                ({pegawai.historiAbsensi.filter((h: any) => h.nominalPemotongan > 0).length} dari {pegawai.historiAbsensi.length} hari ada pemotongan)
              </span>
            </h4>
            <div className="overflow-x-auto">
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
                  {pegawai.historiAbsensi.map((absensi: any, index: number) => {
                    const hasDeduction = absensi.nominalPemotongan > 0;
                    return (
                      <TableRow key={index} className={hasDeduction ? 'bg-red-50 border-l-4 border-l-red-400' : ''}>
                        <TableCell className="font-medium">{safeFormatDate(absensi.tanggal)}</TableCell>
                        <TableCell>{absensi.hari || '-'}</TableCell>
                        <TableCell>{absensi.jamMasuk || '-'}</TableCell>
                        <TableCell>{absensi.jamPulang || '-'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={absensi.statusMasuk === 'HADIR' ? 'default' : 
                                    absensi.statusMasuk === 'TERLAMBAT' ? 'destructive' : 
                                    absensi.statusMasuk === 'TERLAMBAT (DIKOMPENSASI LEMBUR)' ? 'default' :
                                    absensi.statusMasuk === 'LIBUR' ? 'outline' :
                                    absensi.statusMasuk === 'CUTI' ? 'secondary' :
                                    'secondary'}
                            className={absensi.statusMasuk === 'TERLAMBAT (DIKOMPENSASI LEMBUR)' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                          >
                            {absensi.status || absensi.statusMasuk || 'HADIR'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {hasDeduction ? (
                            <div className="text-red-600 text-xs space-y-1">
                              <div className="font-semibold">
                                Rp {(absensi.nominalPemotongan || 0).toLocaleString('id-ID')}
                              </div>
                              <div className="font-medium">
                                ({(absensi.persentasePemotongan || 0).toFixed(1)}%)
                              </div>
                              {absensi.detailPemotongan && (
                                <div className="italic text-red-500 text-xs">
                                  {absensi.detailPemotongan}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-green-600 text-xs font-medium">Tidak Ada</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {absensi.keterangan || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Total Row */}
                  <TableRow className="bg-gray-100 font-semibold border-t-2">
                    <TableCell colSpan={5} className="text-right">Total Pemotongan:</TableCell>
                    <TableCell>
                      <div className="text-red-700 font-bold">
                        {formatCurrency(
                          pegawai.historiAbsensi
                            ?.filter((h: any) => h.nominalPemotongan > 0)
                            ?.reduce((sum: number, h: any) => sum + (h.nominalPemotongan || 0), 0) || 0
                        )}
                      </div>
                      <div className="text-xs text-gray-600">
                        dari {pegawai.historiAbsensi?.filter((h: any) => h.nominalPemotongan > 0).length || 0} hari
                      </div>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return <>{renderEmployeeDetail(data)}</>;
}

export default function LaporanTukinDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [laporan, setLaporan] = useState<LaporanTukin | null>(null);
  const [detailData, setDetailData] = useState<any[]>([]);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  useEffect(() => {
    fetchLaporanDetail();
    fetchRincianDetailData();
  }, [params.id]);

  const fetchRincianDetailData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pegawai/laporan-tukin/${params.id}/rincian`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setDetailData(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching rincian detail data:', error);
    }
  };

  const fetchLaporanDetail = async () => {
    setLoading(true);
    try {
      // Use the API client instead of calling Next.js API route
      const result = await personalLaporanTukinAPI.getDetail(Number(params.id));
      
      // Validate that we have the expected data structure
      if (!result || typeof result !== 'object') {
        throw new Error('Data laporan tidak valid atau kosong');
      }
      
      console.log('Laporan detail loaded:', result);
      setLaporan(result);
    } catch (error: any) {
      console.error('Error fetching laporan detail:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengambil detail laporan",
        variant: "destructive"
      });
      // Set laporan to null so we show the "not found" message
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
      // Fetch complete employee detail data first
      await fetchRincianDetailData();
      
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
    `;
  };

  const handleExportPDF = async () => {
    try {
      const blob = await personalLaporanTukinAPI.downloadPDF(Number(params.id));
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
      const blob = await personalLaporanTukinAPI.downloadFile(Number(params.id));
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{laporan.judul}</h1>
            <p className="text-gray-600 mt-1">
              Periode: {laporan.tanggalMulai ? formatDate(laporan.tanggalMulai) : '-'} - {laporan.tanggalAkhir ? formatDate(laporan.tanggalAkhir) : '-'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileText className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pegawai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{laporan.totalPegawai}</div>
            <p className="text-xs text-gray-500">Pegawai aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Tunjangan Kinerja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(laporan.totalTunjanganKinerja || 0)}
            </div>
            <p className="text-xs text-gray-500">Sebelum potongan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Potongan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency((laporan.totalPotonganAbsen || 0) + (laporan.totalPemotongan || 0))}
            </div>
            <p className="text-xs text-gray-500">Absen + Lainnya</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Tunjangan Bersih</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(laporan.totalTunjanganBersih || 0)}
            </div>
            <p className="text-xs text-gray-500">Setelah potongan</p>
          </CardContent>
        </Card>
      </div>

      {/* Detail Pegawai */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Tunjangan Kinerja Per Pegawai</CardTitle>
          <CardDescription>
            Rincian perhitungan tunjangan kinerja untuk periode {months[laporan.bulan - 1]} {laporan.tahun}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">No</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Nama Pegawai</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead className="text-right">Tunjangan Kinerja</TableHead>
                  <TableHead className="text-center">Total Masuk</TableHead>
                  <TableHead className="text-right">Potongan Absen</TableHead>
                  <TableHead className="text-right">Potongan Lain</TableHead>
                  <TableHead className="text-right">Total Potongan</TableHead>
                  <TableHead className="text-right">Tunjangan Bersih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laporan.detailPegawai && laporan.detailPegawai.length > 0 ? (
                  laporan.detailPegawai.map((pegawai, index) => (
                    <TableRow key={pegawai.pegawaiId}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{pegawai.nip || '-'}</TableCell>
                      <TableCell className="font-medium">{pegawai.namaLengkap}</TableCell>
                      <TableCell>{pegawai.jabatan}</TableCell>
                      <TableCell>{pegawai.lokasi}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(pegawai.tunjanganKinerja || 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-lg font-semibold">
                          {(() => {
                            // Try to use historiAbsensi first (same logic as Rincian Detail)
                            if (pegawai.historiAbsensi && pegawai.historiAbsensi.length > 0) {
                              const hariMasuk = pegawai.historiAbsensi.filter((h: any) => {
                                const status = h.statusMasuk || h.status || 'HADIR';
                                return status !== 'ALPHA' && status !== 'TIDAK_HADIR';
                              }).length;
                              return hariMasuk;
                            }
                            
                            // Fallback to statistikAbsen Map from backend
                            const statistik = pegawai.statistikAbsen as any;
                            if (statistik) {
                              const totalHariKerja = statistik.totalHariKerja || 0;
                              const totalAlpha = statistik.totalAlpha || 0;
                              // Total masuk = total hari kerja - alpha
                              return totalHariKerja - totalAlpha;
                            }
                            
                            return '-';
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className={`text-right text-red-600 ${pegawai.isAttendanceCapped ? 'font-black bg-red-100 border-2 border-red-600' : ''}`}>
                        {formatCurrency(pegawai.potonganAbsen || 0)}
                        {pegawai.isAttendanceCapped && (
                          <div className="text-xs font-bold text-red-700">MAX 60%</div>
                        )}
                      </TableCell>
                      <TableCell className={`text-right text-red-600 ${pegawai.isOtherDeductionsCapped ? 'font-black bg-red-100 border-2 border-red-600' : ''}`}>
                        {formatCurrency(pegawai.pemotonganLain || 0)}
                        {pegawai.isOtherDeductionsCapped && (
                          <div className="text-xs font-bold text-red-700">MAX 60%</div>
                        )}
                      </TableCell>
                      <TableCell className={`text-right text-red-600 font-medium ${pegawai.isTotalCapped ? 'font-black bg-red-100 border-2 border-red-600' : ''}`}>
                        {formatCurrency(pegawai.totalPotongan || 0)}
                        {pegawai.isTotalCapped && (
                          <div className="text-xs font-bold text-red-700">MAX 60%</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        {formatCurrency(pegawai.tunjanganBersih || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      Tidak ada data pegawai
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Detail for Each Employee with Sub Menu */}
      {laporan?.detailPegawai && laporan.detailPegawai.length > 0 && (
        <RincianDetailPerPegawai 
          laporanId={Number(params.id)}
          formatCurrency={formatCurrency} 
          safeFormatDate={safeFormatDate} 
        />
      )}

      {/* Footer Info */}
      <div className="mt-6 text-sm text-gray-600 print:block">
        <div className="flex justify-between items-center">
          <div>
            <p>Generated pada: {laporan.tanggalGenerate ? formatDate(laporan.tanggalGenerate) : '-'}</p>
            <p>Generated oleh: {laporan.generatedBy}</p>
          </div>
          <div className="text-right">
            <p className="font-medium">Status: <Badge variant="default">{laporan.status}</Badge></p>
            <p>Format: <Badge variant="outline">{laporan.formatLaporan}</Badge></p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
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
        }
      `}</style>
    </div>
  );
}