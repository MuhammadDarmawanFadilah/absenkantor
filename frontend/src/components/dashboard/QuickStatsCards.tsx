"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuickStats, DailyAttendanceStats, DashboardService } from '@/services/dashboardService';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Home, 
  AlertTriangle, 
  LogIn,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface QuickStatsCardsProps {
  quickStats: QuickStats;
}

export default function QuickStatsCards({ quickStats }: QuickStatsCardsProps) {
  const [dailyStats, setDailyStats] = useState<DailyAttendanceStats>({
    hadirHariIni: 0,
    cutiHariIni: 0,
    terlambatHariIni: 0
  });

  useEffect(() => {
    const fetchDailyStats = async () => {
      try {
        const stats = await DashboardService.getDailyAttendanceStats();
        setDailyStats(stats);
      } catch (error) {
        console.error('Error fetching daily stats:', error);
      }
    };

    fetchDailyStats();
  }, []);

  const statsData = [
    {
      title: "Total Pegawai",
      value: quickStats.totalMembers?.toLocaleString() || "0",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
    },
    {
      title: "Pegawai Aktif",
      value: quickStats.activeMembers?.toLocaleString() || "0",
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
    },
    {
      title: "Hadir Hari Ini",
      value: dailyStats.hadirHariIni.toLocaleString(),
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
    },
    {
      title: "Cuti Hari Ini",
      value: dailyStats.cutiHariIni.toLocaleString(),
      icon: Home,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900",
    },
    {
      title: "Terlambat Hari Ini",
      value: dailyStats.terlambatHariIni.toLocaleString(),
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900",
    },
    {
      title: "Login Bulan Ini",
      value: (quickStats.monthlyLogins || 0).toLocaleString(),
      icon: LogIn,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900",
      growth: quickStats.memberGrowthRate,
    },
  ];
  return (
    <>
      {/* Desktop Grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {statsData.map((stat, index) => (
          <Card key={index} className="group relative overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700"></div>
            
            {/* Animated Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wide">
                {stat.title}
              </CardTitle>
              <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                    {stat.value}
                  </div>
                  {stat.growth !== undefined && (
                    <div className={`flex items-center space-x-1 text-sm font-medium ${
                      stat.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stat.growth >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>{Math.abs(stat.growth).toFixed(1)}%</span>
                      <span className="text-xs text-gray-500">vs bulan lalu</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile Slideshow */}
      <div className="md:hidden">
        <div className="relative overflow-hidden rounded-xl">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {statsData.map((stat, index) => (
              <div key={index} className="flex-none w-64 snap-start">
                <Card className="group relative overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700"></div>
                  
                  {/* Animated Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wide">
                      {stat.title}
                    </CardTitle>
                    <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                          {stat.value}
                        </div>
                        {stat.growth !== undefined && (
                          <div className={`flex items-center space-x-1 text-sm font-medium ${
                            stat.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {stat.growth >= 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span>{Math.abs(stat.growth).toFixed(1)}%</span>
                            <span className="text-xs text-gray-500">vs bulan lalu</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
