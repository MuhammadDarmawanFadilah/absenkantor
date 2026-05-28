'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Users, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PegawaiAbsensi {
  id: number;
  nama: string;
  jabatan: string;
  waktu: string;
  status: 'HADIR' | 'TERLAMBAT';
  inisial: string;
}

interface PegawaiKehadiran {
  id: number;
  nama: string;
  jabatan: string;
  persentase: number;
  inisial: string;
}

interface PegawaiCuti {
  id: number;
  nama: string;
  tipe: string;
  tanggal: string;
  inisial: string;
}

interface DashboardStats {
  totalHadirHariIni: number;
  totalTerlambatHariIni: number;
  totalCutiAktif: number;
  rataRataKehadiran: number;
}

const DataAbsensiSistem: React.FC = () => {
  const { toast } = useToast();
  const [pegawaiRajin, setPegawaiRajin] = useState<PegawaiAbsensi[]>([]);
  const [pegawaiKehadiran, setPegawaiKehadiran] = useState<PegawaiKehadiran[]>([]);
  const [pegawaiCuti, setPegawaiCuti] = useState<PegawaiCuti[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalHadirHariIni: 0,
    totalTerlambatHariIni: 0,
    totalCutiAktif: 0,
    rataRataKehadiran: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      };

      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Fetch today's attendance data
      const absensiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/absensi/history/all?page=0&size=50&startDate=${today}&endDate=${today}`, {
        headers,
      });

      if (absensiResponse.ok) {
        const absensiData = await absensiResponse.json();
        
        // Process today's attendance for "Pegawai Paling Rajin Hari Ini"
        const todayAbsensi = absensiData.content || [];
        const processedRajin = todayAbsensi
          .filter((item: any) => item.type === 'MASUK')
          .sort((a: any, b: any) => a.waktu.localeCompare(b.waktu))
          .slice(0, 10)
          .map((item: any, index: number) => ({
            id: item.id,
            nama: item.pegawaiNama,
            jabatan: item.pegawaiJabatan || 'Pegawai',
            waktu: item.waktu?.substring(0, 5) || '00:00',
            status: item.status === 'TERLAMBAT' ? 'TERLAMBAT' : 'HADIR',
            inisial: getInitials(item.pegawaiNama)
          }));
        
        setPegawaiRajin(processedRajin);
      }

      // Fetch active employees for monthly attendance stats
      const pegawaiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/pegawai/active`, {
        headers,
      });

      if (pegawaiResponse.ok) {
        const pegawaiData = await pegawaiResponse.json();
        
        // Calculate attendance percentage for each employee this month
        const kehadiranData = await Promise.all(
          (pegawaiData.content || pegawaiData || []).slice(0, 10).map(async (pegawai: any) => {
            try {
              const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/absensi/stats/${pegawai.id}?bulan=${currentMonth.toString().padStart(2, '0')}&tahun=${currentYear}`, {
                headers,
              });
              
              if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                const totalHari = statsData.bulanIni || 0;
                const totalHadir = (statsData.totalHadir || 0) + (statsData.totalTerlambat || 0);
                const persentase = totalHari > 0 ? Math.round((totalHadir / totalHari) * 100) : 0;
                
                return {
                  id: pegawai.id,
                  nama: pegawai.nama,
                  jabatan: pegawai.jabatan || 'Teknologi Informasi',
                  persentase: persentase,
                  inisial: getInitials(pegawai.nama)
                };
              }
            } catch (error) {
              console.error('Error fetching stats for pegawai:', pegawai.id, error);
            }
            
            return {
              id: pegawai.id,
              nama: pegawai.nama,
              jabatan: pegawai.jabatan || 'Teknologi Informasi',
              persentase: 0,
              inisial: getInitials(pegawai.nama)
            };
          })
        );
        
        setPegawaiKehadiran(kehadiranData.filter(Boolean).sort((a, b) => b.persentase - a.persentase));
      }

      // Fetch today's leave data
      const cutiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/cuti/hari-ini?tanggal=${today}`, {
        headers,
      });

      let processedCuti: PegawaiCuti[] = [];
      if (cutiResponse.ok) {
        const cutiData = await cutiResponse.json();
        processedCuti = (cutiData || []).map((item: any) => ({
          id: item.id,
          nama: item.pegawaiNama,
          tipe: item.jenisCuti,
          tanggal: item.tanggalDari,
          inisial: getInitials(item.pegawaiNama)
        }));
      }
      
      setPegawaiCuti(processedCuti);

      // Calculate dashboard stats
      const dashboardStats = {
        totalHadirHariIni: pegawaiRajin.filter(p => p.status === 'HADIR').length,
        totalTerlambatHariIni: pegawaiRajin.filter(p => p.status === 'TERLAMBAT').length,
        totalCutiAktif: processedCuti.length,
        rataRataKehadiran: pegawaiKehadiran.length > 0 ? 
          Math.round(pegawaiKehadiran.reduce((sum, p) => sum + p.persentase, 0) / pegawaiKehadiran.length) : 0
      };
      
      setStats(dashboardStats);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getPersentaseColor = (persentase: number) => {
    if (persentase >= 90) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800';
    }
    if (persentase >= 80) {
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800';
    }
    if (persentase >= 70) {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800';
    }
    return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800';
  };

  const getInitialsBg = (index: number) => {
    const colors = [
      'bg-red-500 dark:bg-red-600',
      'bg-blue-500 dark:bg-blue-600', 
      'bg-green-500 dark:bg-green-600',
      'bg-purple-500 dark:bg-purple-600',
      'bg-yellow-500 dark:bg-yellow-600',
      'bg-pink-500 dark:bg-pink-600',
      'bg-indigo-500 dark:bg-indigo-600',
      'bg-orange-500 dark:bg-orange-600',
      'bg-teal-500 dark:bg-teal-600',
      'bg-cyan-500 dark:bg-cyan-600'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-border bg-card">
              <CardHeader className="pb-4">
                <div className="h-6 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-16 bg-muted animate-pulse rounded"></div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-border bg-card">
              <CardContent className="p-6">
                <div className="h-20 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Pegawai Paling Rajin Hari Ini */}
        <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4 bg-gradient-to-r from-emerald-50/80 to-emerald-100/80 dark:from-emerald-950/30 dark:to-emerald-900/30 border-b border-border">
            <CardTitle className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300">
              <div className="w-2 h-6 bg-emerald-600 dark:bg-emerald-400 rounded-full"></div>
              <span className="text-base sm:text-lg font-semibold">Pegawai Paling Rajin Hari Ini</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {pegawaiRajin.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">Belum ada data absensi hari ini</p>
              </div>
            ) : (
              pegawaiRajin.map((pegawai, index) => (
                <div key={pegawai.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                      <div className={`w-8 h-8 rounded-full ${getInitialsBg(index)} flex items-center justify-center text-white text-sm font-semibold shadow-sm`}>
                        {pegawai.inisial}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{pegawai.nama}</p>
                      <p className="text-sm text-muted-foreground truncate">{pegawai.jabatan}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-foreground mb-1">{pegawai.waktu}</p>
                    <Badge 
                      variant={pegawai.status === 'HADIR' ? 'default' : 'destructive'}
                      className={pegawai.status === 'HADIR' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800 font-medium' 
                        : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800 font-medium'
                      }
                    >
                      {pegawai.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pegawai Kehadiran Bulan Ini */}
        <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-950/30 dark:to-blue-900/30 border-b border-border">
            <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
              <div className="w-2 h-6 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
              <span className="text-base sm:text-lg font-semibold">Pegawai Kehadiran Bulan Ini</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {pegawaiKehadiran.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">Belum ada data kehadiran bulan ini</p>
              </div>
            ) : (
              pegawaiKehadiran.map((pegawai, index) => (
                <div key={pegawai.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                      <div className={`w-8 h-8 rounded-full ${getInitialsBg(index)} flex items-center justify-center text-white text-sm font-semibold shadow-sm`}>
                        {pegawai.inisial}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{pegawai.nama}</p>
                      <p className="text-sm text-muted-foreground truncate">{pegawai.jabatan}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge className={`${getPersentaseColor(pegawai.persentase)} border font-medium`}>
                      {pegawai.persentase}%
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pegawai Cuti Hari Ini */}
        <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4 bg-gradient-to-r from-orange-50/80 to-orange-100/80 dark:from-orange-950/30 dark:to-orange-900/30 border-b border-border">
            <CardTitle className="flex items-center space-x-2 text-orange-700 dark:text-orange-300">
              <div className="w-2 h-6 bg-orange-600 dark:bg-orange-400 rounded-full"></div>
              <span className="text-base sm:text-lg font-semibold">Pegawai Cuti Hari Ini</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {pegawaiCuti.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="w-16 h-16 bg-muted border border-border rounded-lg flex items-center justify-center mb-4">
                  <UserX className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-center text-sm font-medium">
                  Tidak ada pegawai yang cuti hari ini
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pegawaiCuti.map((pegawai, index) => (
                  <div key={pegawai.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full ${getInitialsBg(index)} flex items-center justify-center text-white text-sm font-semibold shadow-sm`}>
                        {pegawai.inisial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{pegawai.nama}</p>
                        <p className="text-sm text-muted-foreground truncate">{pegawai.tipe}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-muted-foreground">
                        {pegawai.tanggal}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-emerald-100/80 dark:from-emerald-950/20 dark:to-emerald-900/20 dark:border-emerald-800 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Hadir Hari Ini</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-800 dark:text-emerald-200">{stats.totalHadirHariIni}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 dark:bg-emerald-600/20 border border-emerald-300 dark:border-emerald-700 rounded-lg flex items-center justify-center shadow-sm">
                <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-orange-200 bg-gradient-to-r from-orange-50/80 to-orange-100/80 dark:from-orange-950/20 dark:to-orange-900/20 dark:border-orange-800 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Terlambat Hari Ini</p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-800 dark:text-orange-200">{stats.totalTerlambatHariIni}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 dark:bg-orange-600/20 border border-orange-300 dark:border-orange-700 rounded-lg flex items-center justify-center shadow-sm">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-blue-200 bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-950/20 dark:to-blue-900/20 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Rata-rata Kehadiran</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-800 dark:text-blue-200">{stats.rataRataKehadiran}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataAbsensiSistem;
