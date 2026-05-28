"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RecentComment } from '@/services/dashboardService';
import { MessageCircle, Clock } from 'lucide-react';

interface RecentCommentsCardProps {
  recentComments: RecentComment[];
}

export default function RecentCommentsCard({ recentComments }: RecentCommentsCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Navigation function with authentication check
  const navigateToBiography = (userId: number | undefined, userName: string) => {
    if (!isAuthenticated) {
      // If not authenticated, redirect to login with return URL
      router.push(`/login?returnUrl=/biografi/${userId || 'search?name=' + encodeURIComponent(userName)}`);
      return;
    }
    
    // Navigate to biography detail page
    if (userId) {
      router.push(`/biografi/${userId}`);
    } else {
      // Fallback: search by name if userId is not available
      router.push(`/biografi?search=${encodeURIComponent(userName)}`);
    }
  };

  return (
    <Card className="relative overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-xl">
      {/* Background decoration - matching ActivityFeedCard */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-400/10 to-emerald-400/10 rounded-full -translate-y-12 translate-x-12"></div>
      
      <CardHeader className="relative flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Komentar Terbaru
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Interaksi dan feedback terkini
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {recentComments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Belum ada komentar terbaru
                </p>
              </div>
            ) : (              recentComments.map((comment, index) => (
                <div 
                  key={index} 
                  className="group relative flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 transition-all duration-300 border border-gray-100 dark:border-gray-600 hover:border-green-200 dark:hover:border-green-700 hover:shadow-md cursor-pointer"
                  onClick={() => navigateToBiography(comment.userId, comment.userName)}
                >
                  {/* Timeline connector - matching ActivityFeedCard style */}
                  {index < recentComments.length - 1 && (
                    <div className="absolute left-7 top-16 w-0.5 h-6 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-500"></div>
                  )}
                  
                  <Avatar className="relative w-12 h-12 border-2 border-white dark:border-gray-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                      {comment.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        {comment.userName}
                      </span>
                      <Badge 
                        variant="outline" 
                        className="text-xs font-medium bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-500"
                      >
                        {comment.type}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
                      {comment.comment}
                    </p>
                    
                    <div className="space-y-1">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        pada "{comment.itemTitle}"
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{comment.commentDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
