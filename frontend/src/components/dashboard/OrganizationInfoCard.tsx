"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrganizationInfo } from '@/services/dashboardService';
import { Building2, Calendar, Eye, Target } from 'lucide-react';

interface OrganizationInfoCardProps {
  organizationInfo: OrganizationInfo;
}

export default function OrganizationInfoCard({ organizationInfo }: OrganizationInfoCardProps) {
  return (
    <Card className="relative overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-xl">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full translate-y-12 -translate-x-12"></div>
      
      <CardHeader className="relative pb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-3">
              <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {organizationInfo.name}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium px-3 py-1">
                  Berdiri sejak {organizationInfo.establishedYear}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-8">
        <div className="bg-white/50 dark:bg-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
            {organizationInfo.description}
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white/50 dark:bg-gray-700/50 rounded-xl p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">Visi</h4>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {organizationInfo.vision}
            </p>
          </div>
          
          <div className="bg-white/50 dark:bg-gray-700/50 rounded-xl p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">Misi</h4>
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {organizationInfo.mission}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
