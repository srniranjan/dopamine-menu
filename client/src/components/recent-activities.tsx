import React from "react";
import { motion } from "framer-motion";
import { Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { ActivityLog, Activity } from "@shared/schema";

interface RecentActivitiesProps {
  onActivityStart?: (activity: Activity) => void;
  className?: string;
}

interface RecentActivityWithDetails extends ActivityLog {
  activity?: Activity;
}

export default function RecentActivities({ onActivityStart, className = "" }: RecentActivitiesProps) {
  const { data: recentLogs = [], isLoading } = useQuery({
    queryKey: ["/api/activities/recent"],
  });
  
  const { data: allActivities = [] } = useQuery({
    queryKey: ["/api/activities"],
  });
  
  // Combine recent logs with activity details
  const recentWithDetails: RecentActivityWithDetails[] = (recentLogs as ActivityLog[]).map((log: ActivityLog) => ({
    ...log,
    activity: (allActivities as Activity[]).find((a: Activity) => a.id === log.activityId)
  }));
  
  const formatTimeAgo = (completedAt: string) => {
    const date = new Date(completedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };
  
  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h4 className="text-sm font-medium text-gray-700">Recently Completed</h4>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  if (recentWithDetails.length === 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h4 className="text-sm font-medium text-gray-700">Recently Completed</h4>
        <Card>
          <CardContent className="p-4 text-center text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activities</p>
            <p className="text-xs">Complete some activities to see them here!</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700">Recently Completed</h4>
      <div className="space-y-2">
        {recentWithDetails.slice(0, 3).map((log, index) => {
          const activity = log.activity;
          if (!activity) return null;
          
          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="text-sm font-medium truncate">{activity.name}</h5>
                        <Badge variant="secondary" className="text-xs">
                          {activity.category}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(log.completedAt.toString())}</span>
                        {log.duration && (
                          <span>• {log.duration}m</span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onActivityStart?.(activity)}
                      className="h-8 w-8 p-0 shrink-0"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}