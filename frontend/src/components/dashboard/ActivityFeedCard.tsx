"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActivityFeed } from '@/services/dashboardService';
import { 
  User, 
  UserPlus, 
  Newspaper, 
  FileText, 
  MessageCircle, 
  Download,
  Clock
} from 'lucide-react';

interface ActivityFeedCardProps {
  activityFeed: ActivityFeed[];
}

const iconMap = {
  User: User,
  UserPlus: UserPlus,
  Newspaper: Newspaper,
  FileText: FileText,
  MessageCircle: MessageCircle,
  Download: Download,
};

const colorMap = {
  blue: "text-blue-600 bg-blue-100 dark:bg-blue-900",
  green: "text-green-600 bg-green-100 dark:bg-green-900",
  purple: "text-purple-600 bg-purple-100 dark:bg-purple-900",
  orange: "text-orange-600 bg-orange-100 dark:bg-orange-900",
  red: "text-red-600 bg-red-100 dark:bg-red-900",
  indigo: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900",
};

export default function ActivityFeedCard({ activityFeed }: ActivityFeedCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || User;
    return IconComponent;
  };

  const getColorClass = (color: string) => {
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };
  // Navigation function with authentication check
  const handleActivityClick = (activity: ActivityFeed) => {
    if (!isAuthenticated) {
      // If not authenticated, redirect to login with return URL
      const targetUrl = getActivityUrl(activity);
      router.push(`/login?returnUrl=${encodeURIComponent(targetUrl)}`);
      return;
    }
    
    // Navigate to the activity item URL
    const targetUrl = getActivityUrl(activity);
    router.push(targetUrl);
  };
  // Function to determine the correct URL based on activity type
  const getActivityUrl = (activity: ActivityFeed): string => {
    // If itemUrl is already provided and valid, use it
    if (activity.itemUrl && activity.itemUrl.trim() !== '') {
      return activity.itemUrl;
    }

    // Handle different activity types
    if (activity.type === 'login' || activity.type === 'user' || activity.description.includes('login')) {
      // For login activities, we should navigate to the user's biography
      // Since we don't have user ID in the activity, we'll need to derive it
      // Check if there's any identifier in the activity data
      
      // Try to extract user info from userName or description
      // For now, let's navigate to the biografi list page where users can find the specific biography
      // Ideally, the backend should provide the user ID or biography ID in the itemUrl
      
      // If we had the user ID, we would use: `/biografi/${userId}`
      // For now, navigate to the biografi list
      return '/biografi';
    }

    // Handle other activity types
    if (activity.type === 'news' || activity.type === 'berita') {
      return '/berita';
    }
    
    if (activity.type === 'proposal' || activity.type === 'usulan') {
      return '/usulan';
    }
    
    if (activity.type === 'document' || activity.type === 'dokumen') {
      return '/documents';
    }

    // Default fallback
    return '/';
  };

  return (
    <Card className="relative overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-xl h-fit">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-400/10 to-purple-400/10 rounded-full -translate-y-12 translate-x-12"></div>
      
      <CardHeader className="relative flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Aktivitas Terkini
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pembaruan sistem real-time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {activityFeed.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Belum ada aktivitas terbaru
                </p>
              </div>
            ) : (              activityFeed.map((activity, index) => {
                const IconComponent = getIcon(activity.icon);
                return (                  <div 
                    key={index} 
                    className="group relative flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 border border-gray-100 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md cursor-pointer"
                    onClick={() => handleActivityClick(activity)}
                  >
                    {/* Timeline connector */}
                    {index < activityFeed.length - 1 && (
                      <div className="absolute left-7 top-16 w-0.5 h-6 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-500"></div>
                    )}
                    
                    <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${getColorClass(activity.color)} group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8 border-2 border-white dark:border-gray-600 shadow-sm">
                            <AvatarImage src={activity.userAvatar} />
                            <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {activity.userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {activity.userName}
                          </span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="text-xs font-medium bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-500"
                        >
                          {activity.type}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {activity.description}
                      </p>
                        <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {activity.timestamp}
                        </span>
                        <span className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200">
                          Lihat detail →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
