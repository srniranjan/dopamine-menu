import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Play, Clock, MoreVertical, Edit, Trash2, Calendar } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Activity } from "@shared/schema";
import EditActivityDialog from "./edit-activity-dialog";

interface ActivityItemProps {
  activity: Activity;
  colorClass?: string;
  onActivityStart?: (activity: Activity) => void;
}

export default function ActivityItem({ activity, colorClass = "", onActivityStart }: ActivityItemProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/activities/${activity.id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Activity deleted",
        description: "The activity has been removed from your menu.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  const formatLastCompleted = (lastCompleted: string | null) => {
    if (!lastCompleted) return "Never";
    const date = new Date(lastCompleted);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowEditDialog(true);
  };

  const handleLongPress = () => {
    setShowEditDialog(true);
  };

  let touchTimer: NodeJS.Timeout;

  return (
    <>
      <Card 
        className={`transition-all duration-200 hover:shadow-lg ${colorClass} cursor-pointer`}
        onContextMenu={handleContextMenu}
        onTouchStart={(e) => {
          touchTimer = setTimeout(() => {
            handleLongPress();
          }, 700);
        }}
        onTouchEnd={() => {
          clearTimeout(touchTimer);
        }}
        onTouchMove={() => {
          clearTimeout(touchTimer);
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-sm truncate">{activity.name}</h3>
                {activity.duration && activity.duration > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {activity.duration}m
                  </Badge>
                )}
              </div>
              
              {activity.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {activity.description}
                </p>
              )}
              
              {/* Visible tracking indicators */}
              <div className="flex items-center space-x-3 text-xs text-muted-foreground mb-2">
                <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-full">
                  <Play className="w-3 h-3 text-green-600" />
                  <span className="text-green-700 font-medium">{activity.completionCount || 0} times</span>
                </div>
                <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-full">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  <span className="text-blue-700 font-medium">{formatLastCompleted(activity.lastCompleted ? activity.lastCompleted.toString() : null)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-1 ml-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onActivityStart?.(activity);
                }}
                className="h-8 w-8 p-0"
                title="Start activity"
              >
                <Play className="w-3 h-3" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditDialog(true);
                }}
                className="h-8 w-8 p-0"
                title="Edit activity"
              >
                <Edit className="w-3 h-3" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditActivityDialog
        activity={activity}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{activity.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}