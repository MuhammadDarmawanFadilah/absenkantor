"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonthlyData } from '@/services/dashboardService';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MonthlyDataChartProps {
  monthlyData: MonthlyData[];
}

export default function MonthlyDataChart({ monthlyData }: MonthlyDataChartProps) {
  const chartColors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    tertiary: '#f59e0b',
    quaternary: '#ef4444',
    accent: '#8b5cf6'
  };

  return (
    <Card className="relative overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-xl">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-400/10 to-purple-400/10 rounded-full -translate-y-20 translate-x-20"></div>
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Data Registrasi Bulanan
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Visualisasi data pegawai dan aktivitas login per bulan
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Live Data</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
            <TabsTrigger 
              value="overview" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-medium transition-all duration-200"
            >
              Data Pegawai
            </TabsTrigger>
            <TabsTrigger 
              value="content"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-orange-600 font-medium transition-all duration-200"
            >
              Aktivitas Login
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.secondary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={chartColors.secondary} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorNews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.tertiary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={chartColors.tertiary} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none', 
                        borderRadius: '12px', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="logins" 
                      stackId="1" 
                      stroke={chartColors.primary}
                      fill="url(#colorLogins)"
                      name="Total Login"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="newMembers" 
                      stackId="1" 
                      stroke={chartColors.secondary}
                      fill="url(#colorMembers)"
                      name="Pegawai Baru"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl p-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none', 
                        borderRadius: '12px', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="logins" 
                      fill={chartColors.primary} 
                      name="Login Harian" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
