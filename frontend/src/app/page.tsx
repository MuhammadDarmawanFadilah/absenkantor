"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { DashboardService, DashboardOverview, DashboardStats, DashboardTableData } from '@/services/dashboardService';
import OrganizationInfoCard from '@/components/dashboard/OrganizationInfoCard';
import QuickStatsCards from '@/components/dashboard/QuickStatsCards';
import MonthlyDataChart from '@/components/dashboard/MonthlyDataChart';
import ActivityFeedCard from '@/components/dashboard/ActivityFeedCard';
import DashboardTables from '@/components/dashboard/DashboardTables';
import { TrendingUp, MessageCircle, ThumbsUp, Download, FileText, Users, Calendar, CalendarClock, Clock, Briefcase, Edit, Key, Calculator, Building, MapPin, Database, LogIn } from 'lucide-react';

const Dashboard = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tableData, setTableData] = useState<DashboardTableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.role?.roleName === 'ADMIN' || user?.role?.roleName === 'VERIFICATOR';

  // Navigation functions with authentication check
  const navigateToDetail = (type: 'berita' | 'usulan' | 'documents' | 'biografi', id: number) => {
    if (!isAuthenticated) {
      // If not authenticated, redirect to login with return URL
      router.push(`/login?returnUrl=/${type}/${id}`);
      return;
    }
    
    // Navigate to the appropriate detail page
    router.push(`/${type}/${id}`);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [overviewData, statsData, tableDataResult] = await Promise.all([
        DashboardService.getDashboardOverview(),
        DashboardService.getDashboardStats(),
        DashboardService.getDashboardTableData()
      ]);
      
      setOverview(overviewData);
      setStats(statsData);
      setTableData(tableDataResult);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Gagal memuat data dashboard. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 md:space-y-8">
          {/* Header Skeleton */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-3">
                  <Skeleton className="h-10 w-80" />
                  <Skeleton className="h-6 w-96" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
          </div>
          
          {/* Organization Info Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-1 h-8" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          
          {/* Stats Grid Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-1 h-8" />
              <Skeleton className="h-8 w-40" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          </div>
          
          {/* Chart Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-1 h-8" />
              <Skeleton className="h-8 w-36" />
            </div>
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
          
          {/* Content Grid Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-1 h-8" />
              <Skeleton className="h-8 w-52" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Skeleton className="h-96 xl:col-span-2 rounded-2xl" />
              <Skeleton className="h-96 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert className="bg-white dark:bg-gray-800 border-red-200 dark:border-red-800 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Terjadi Kesalahan
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gagal memuat data dashboard
                </p>
              </div>
            </div>
            <AlertDescription className="text-gray-700 dark:text-gray-300 mb-4">
              {error}
            </AlertDescription>
            <Button 
              variant="outline" 
              onClick={fetchDashboardData}
              className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Coba Lagi
            </Button>
          </Alert>
        </div>
      </div>
    );
  }
  if (!overview || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Data Tidak Tersedia
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Tidak ada data yang dapat ditampilkan saat ini
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchDashboardData}
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Muat Ulang
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 md:space-y-8">        {/* Enhanced Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-white/5 to-blue-600/10"></div>
          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
                  Dashboard Sistem Absensi Lampung
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
                  Sistem Informasi Absensi dan Monitoring Kehadiran Pegawai Provinsi Lampung
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full pulse"></div>
                  <span>Sistem aktif • Data real-time • Monitoring 24/7</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={fetchDashboardData}
                  disabled={loading}
                  className="w-full sm:w-auto self-start sm:self-auto bg-white/50 hover:bg-white/80 dark:bg-gray-700/50 dark:hover:bg-gray-700/80 backdrop-blur-sm border-2 focus-ring"
                >
                  <RefreshCw className={`w-5 h-5 mr-3 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
                <div className="text-xs text-gray-500 text-center">
                  Update terakhir: {new Date().toLocaleTimeString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Info Section */}
        <div className="space-y-4 fade-in-delay-1">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Informasi Organisasi
            </h2>
          </div>
          <OrganizationInfoCard organizationInfo={overview.organizationInfo} />
        </div>        {/* Quick Stats Section */}
        <div className="space-y-4 fade-in-delay-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Statistik Absensi
            </h2>
          </div>
          <QuickStatsCards quickStats={overview.quickStats} />
        </div>        {/* Analytics Section */}
        <div className="space-y-4 fade-in-delay-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Analisis Data Absensi
            </h2>
          </div>
          <MonthlyDataChart monthlyData={overview.monthlyData} />
        </div>        {/* Dashboard Attendance Tables Section */}
        <div className="space-y-4 fade-in-delay-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-teal-500 to-teal-600 rounded-full"></div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Data Kehadiran Pegawai
            </h2>
          </div>
          <DashboardTables
            earlyEmployees={tableData?.pegawaiDatangPagi || []}
            exemplaryEmployees={tableData?.pegawaiTeladan || []}
            employeesOnLeave={tableData?.pegawaiCuti || []}
            loading={loading}
          />
        </div>

        {/* Quick Access Menu */}
        <div className="space-y-4 fade-in-delay-5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full"></div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Menu Cepat Akses
            </h2>
          </div>
          
          <Card className="relative overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-400/10 to-red-400/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <CardHeader className="relative">
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Akses Cepat Sistem Absensi</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="relative">
              <Tabs defaultValue="pegawai" className="space-y-6">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                  <TabsTrigger 
                    value="pegawai"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-red-600 font-medium transition-all duration-200"
                  >
                    Menu Pegawai
                  </TabsTrigger>
                  <TabsTrigger 
                    value="admin"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-medium transition-all duration-200"
                  >
                    Admin Menu
                  </TabsTrigger>
                  <TabsTrigger 
                    value="master"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-green-600 font-medium transition-all duration-200"
                  >
                    Master Data
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="pegawai" className="space-y-4">
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-xl p-4">
                    {isAuthenticated ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div 
                          className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-red-50 dark:hover:bg-gray-600"
                          onClick={() => router.push('/pegawai/absensi')}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <CalendarClock className="h-5 w-5 text-red-600" />
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400">
                              Absensi
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Catat kehadiran harian Anda
                          </p>
                        </div>
                        
                        <div 
                          className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-red-50 dark:hover:bg-gray-600"
                          onClick={() => router.push('/pegawai/histori-absensi')}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Clock className="h-5 w-5 text-orange-600" />
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-orange-600 dark:hover:text-orange-400">
                              Histori Absensi
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Lihat riwayat kehadiran Anda
                          </p>
                        </div>
                        
                        <div 
                          className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-red-50 dark:hover:bg-gray-600"
                          onClick={() => router.push('/pegawai/cuti')}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-5 w-5 text-green-600" />
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400">
                              Pengajuan Cuti
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Ajukan dan kelola cuti Anda
                          </p>
                        </div>

                        <div 
                          className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-red-50 dark:hover:bg-gray-600"
                          onClick={() => router.push('/pegawai/edit')}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Edit className="h-5 w-5 text-purple-600" />
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400">
                              Edit Profil
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Perbarui data profil pegawai
                          </p>
                        </div>

                        <div 
                          className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-red-50 dark:hover:bg-gray-600"
                          onClick={() => router.push('/reset-password')}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Key className="h-5 w-5 text-indigo-600" />
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400">
                              Ganti Password
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Ubah kata sandi akun
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          Masuk untuk mengakses menu pegawai
                        </p>
                        <Button 
                          onClick={() => router.push('/login')}
                          className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Masuk ke Sistem
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="admin" className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4">
                    {!isAuthenticated || !isAdmin ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          Anda perlu login sebagai admin untuk mengakses menu ini
                        </p>
                        <Button 
                          onClick={() => router.push('/login')}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Masuk sebagai Admin
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Menu Laporan Absensi</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div 
                            className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600"
                            onClick={() => router.push('/admin/master-data/histori-absensi')}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <Clock className="h-5 w-5 text-blue-600" />
                              <h5 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400">
                                Histori Absensi
                              </h5>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Laporan kehadiran semua pegawai
                            </p>
                          </div>

                          <div 
                            className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600"
                            onClick={() => router.push('/admin/master-data/cuti')}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <Calendar className="h-5 w-5 text-teal-600" />
                              <h5 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-teal-600 dark:hover:text-teal-400">
                                Pengajuan Cuti
                              </h5>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Kelola pengajuan cuti pegawai
                            </p>
                          </div>

                          <div 
                            className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600"
                            onClick={() => router.push('/admin/master-data/pemotongan')}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <Calculator className="h-5 w-5 text-cyan-600" />
                              <h5 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-cyan-600 dark:hover:text-cyan-400">
                                Pemotongan
                              </h5>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Kelola pemotongan gaji
                            </p>
                          </div>

                          <div 
                            className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600"
                            onClick={() => router.push('/admin/master-data/laporan-tukin')}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <FileText className="h-5 w-5 text-emerald-600" />
                              <h5 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-emerald-600 dark:hover:text-emerald-400">
                                Laporan Tukin
                              </h5>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Laporan tunjangan kinerja
                            </p>
                          </div>
                        </div>

                        <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Menu Administrasi Pegawai</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div 
                            className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600"
                            onClick={() => router.push('/admin/master-data/pegawai')}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <Users className="h-5 w-5 text-rose-600" />
                              <h5 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-rose-600 dark:hover:text-rose-400">
                                Data Pegawai
                              </h5>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Kelola data pegawai sistem
                            </p>
                          </div>

                          <div 
                            className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600"
                            onClick={() => router.push('/admin/master-data/shift')}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <Clock className="h-5 w-5 text-amber-600" />
                              <h5 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-amber-600 dark:hover:text-amber-400">
                                Shift
                              </h5>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Kelola jadwal shift kerja
                            </p>
                          </div>

                          <div 
                            className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600"
                            onClick={() => router.push('/admin/master-data/lokasi-kantor')}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <Building className="h-5 w-5 text-lime-600" />
                              <h5 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-lime-600 dark:hover:text-lime-400">
                                Lokasi Kantor
                              </h5>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Kelola lokasi kantor
                            </p>
                          </div>

                          <div 
                            className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600"
                            onClick={() => router.push('/admin/master-data/pegawai/lokasi')}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <MapPin className="h-5 w-5 text-violet-600" />
                              <h5 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-violet-600 dark:hover:text-violet-400">
                                Lokasi Pegawai
                              </h5>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Kelola lokasi penugasan pegawai
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="master" className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-4">
                    {!isAuthenticated || !isAdmin ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          Anda perlu login sebagai admin untuk mengakses menu ini
                        </p>
                        <Button 
                          onClick={() => router.push('/login')}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Masuk sebagai Admin
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div 
                          className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-green-50 dark:hover:bg-gray-600"
                          onClick={() => router.push('/admin/master-data/daftar-cuti')}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="h-5 w-5 text-slate-600" />
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-slate-600 dark:hover:text-slate-400">
                              Daftar Cuti
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Kelola jenis cuti
                          </p>
                        </div>

                        <div 
                          className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-green-50 dark:hover:bg-gray-600"
                          onClick={() => router.push('/admin/master-data/hari-libur')}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-5 w-5 text-stone-600" />
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-stone-600 dark:hover:text-stone-400">
                              Hari Libur
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Kelola kalender hari libur
                          </p>
                        </div>

                        <div 
                          className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-green-50 dark:hover:bg-gray-600"
                          onClick={() => router.push('/admin/master-data/pemotongan-absen')}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Calculator className="h-5 w-5 text-orange-600" />
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-orange-600 dark:hover:text-orange-400">
                              Pemotongan Absen
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Kelola aturan pemotongan absen
                          </p>
                        </div>

                        <div 
                          className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-green-50 dark:hover:bg-gray-600"
                          onClick={() => router.push('/admin/master-data/jabatan')}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Briefcase className="h-5 w-5 text-zinc-600" />
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-zinc-600 dark:hover:text-zinc-400">
                              Jabatan
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Kelola data jabatan
                          </p>
                        </div>

                        <div 
                          className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-green-50 dark:hover:bg-gray-600"
                          onClick={() => router.push('/admin/master-data/role')}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Database className="h-5 w-5 text-purple-600" />
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400">
                              Role
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Kelola role pengguna
                          </p>
                        </div>

                        <div 
                          className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-green-50 dark:hover:bg-gray-600"
                          onClick={() => router.push('/admin/master-data/wilayah-provinsi')}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400">
                              Wilayah
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Kelola data wilayah
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Content and Activity Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-teal-500 to-teal-600 rounded-full"></div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Informasi dan Aktivitas Sistem
            </h2>
          </div>
          
          {/* Side by Side: Activity Feed and System Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="order-1 lg:order-1">
              <ActivityFeedCard activityFeed={overview.activityFeed} />
            </div>
            <div className="order-2 lg:order-2">
              <Card className="relative overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-400/10 to-purple-400/10 rounded-full -translate-y-12 translate-x-12"></div>
                
                <CardHeader className="relative flex flex-row items-center justify-between pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Statistik Sistem
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ringkasan data sistem pengawasan
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="relative space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Pegawai</p>
                          <p className="text-2xl font-bold text-green-600">{overview.quickStats.totalMembers || 0}</p>
                        </div>
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Pegawai Aktif</p>
                          <p className="text-2xl font-bold text-blue-600">{overview.quickStats.activeMembers || 0}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Login Bulan Ini</p>
                          <p className="text-2xl font-bold text-purple-600">{overview.quickStats.monthlyLogins || 0}</p>
                        </div>
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Status Sistem</p>
                          <p className="text-lg font-bold text-orange-600">Aktif</p>
                        </div>
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Contact and Information Footer */}
        <div className="bg-gradient-to-r from-red-50 via-white to-blue-50 dark:from-red-950/20 dark:via-gray-800 dark:to-blue-950/20 rounded-xl shadow-sm border border-gray-200/50 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <div className="w-6 h-6 bg-red-600 rounded mr-3"></div>
                Tentang Bawaslu Lampung
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Badan Pengawas Pemilihan Umum (Bawaslu) Provinsi Lampung adalah lembaga negara yang bertugas mengawasi 
                penyelenggaraan pemilihan umum di Provinsi Lampung. Melayani masyarakat dengan integritas, profesional, dan transparan.
              </p>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>📍 Jl. ZA. Pagar Alam No. 1A, Bandar Lampung</p>
                <p>🏢 Gedung Bawaslu Provinsi Lampung</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <div className="w-6 h-6 bg-blue-600 rounded mr-3"></div>
                Kontak & Media Sosial
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  <a href="tel:0721703441" className="hover:text-blue-600">📞 Telepon: (0721) 703-441</a>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <a href="https://www.instagram.com/bawaslulampung/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">� Instagram: @bawaslulampung</a>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <a href="https://bawaslu-lampungprov.go.id" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">🌐 Website: bawaslu-lampungprov.go.id</a>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <a href="mailto:info@bawaslu-lampungprov.go.id" className="hover:text-blue-600">📧 Email: info@bawaslu-lampungprov.go.id</a>
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <div className="w-6 h-6 bg-green-600 rounded mr-3"></div>
                Jam Operasional
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Senin - Kamis:</span> 07:30 - 16:00 WIB
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Jumat:</span> 07:30 - 16:30 WIB
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Istirahat:</span> 12:00 - 13:00 WIB
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Sabtu & Minggu:</span> Tutup
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          <p>© {new Date().getFullYear()} Sistem Absensi Lampung - Sistem Informasi Manajemen Absensi dan Data Pegawai</p>
          <p className="mt-2 text-xs">
            Dikembangkan untuk mendukung administrasi dan manajemen pegawai yang efisien
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
