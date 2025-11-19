import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Settings, Plus, Edit3, Play, Pause, Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddActivityDialog from "@/components/add-activity-dialog";
import CelebrationAnimation from "@/components/celebration-animation";
import type { Activity, CategoryType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTimer } from "@/hooks/use-timer";
import { useUser } from "@stackframe/react";

type ViewState = 'home' | 'category' | 'activity' | 'settings' | 'edit-activity';

const categoryInfo = {
  appetizers: {
    name: "APPETIZERS",
    description: "Quick dopamine hits",
    gradient: "from-indigo-500 to-blue-600"
  },
  entrees: {
    name: "Entrées", 
    description: "Main activities",
    gradient: "from-pink-500 to-rose-600"
  },
  snacks: {
    name: "SNACKS",
    description: "Light activities", 
    gradient: "from-green-500 to-teal-600"
  },
  desserts: {
    name: "DESSERTS",
    description: "Pure indulgence", 
    gradient: "from-orange-500 to-yellow-600"
  },
  sides: {
    name: "SIDES",
    description: "Background vibes", 
    gradient: "from-purple-500 to-violet-600"
  },
  specials: {
    name: "SPECIALS",
    description: "Rare treats", 
    gradient: "from-yellow-500 to-orange-600"
  }
};

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'completion' | 'streak' | 'goal' | 'first-time'>('completion');
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [username, setUsername] = useState(localStorage.getItem('userName') || 'User');
  const user = useUser();

  // Activity editing form state
  const [editForm, setEditForm] = useState({
    name: '',
    duration: 0,
    category: 'appetizers' as CategoryType,
    emoji: '⭐'
  });

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["/api/activities"],
  });
  
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { time, isRunning, start, pause, stop, setTime } = useTimer();

  const completeActivityMutation = useMutation({
    mutationFn: async ({ activityId, duration }: { activityId: number; duration?: number }) => {
      const response = await apiRequest("POST", `/api/activities/${activityId}/complete`, { duration });
      return response.json();
    },
    onSuccess: async (_, { activityId }) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/activities/recent"] });
      
      const activity = (activities as Activity[]).find((a: Activity) => a.id === activityId);
      if (activity) {
        const newCompletionCount = (activity.completionCount || 0) + 1;
        const isFirstTime = newCompletionCount === 1;
        
        if (isFirstTime) {
          setCelebrationType('first-time');
          setCelebrationMessage(`🎉 First time completing "${activity.name}"! Great start!`);
        } else {
          setCelebrationType('completion');
          setCelebrationMessage(`💪 Awesome! You've completed "${activity.name}" ${newCompletionCount} times!`);
        }
        
        setShowCelebration(true);
        setSelectedActivity(null);
        setViewState('home');
      }
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to complete activity.",
        variant: "destructive",
      });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/activities/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({ title: "Activity updated successfully!" });
      setEditingActivity(null);
      setViewState('activity');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update activity.",
        variant: "destructive",
      });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/activities/all");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "All activities cleared",
        description: "Your dopamine menu has been reset.",
      });
      setViewState('home');
    },
  });

  const categorizedActivities = {
    appetizers: (activities as Activity[]).filter((a: Activity) => a.category === "appetizers"),
    entrees: (activities as Activity[]).filter((a: Activity) => a.category === "entrees"), 
    snacks: (activities as Activity[]).filter((a: Activity) => a.category === "snacks"),
    desserts: (activities as Activity[]).filter((a: Activity) => a.category === "desserts"),
    sides: (activities as Activity[]).filter((a: Activity) => a.category === "sides"),
    specials: (activities as Activity[]).filter((a: Activity) => a.category === "specials"),
  };

  const handleCategorySelect = (category: CategoryType) => {
    setSelectedCategory(category);
    setViewState('category');
  };

  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
    if (activity.duration && activity.duration > 0) {
      setTime(activity.duration * 60);
    }
    setViewState('activity');
  };

  const handleActivityComplete = () => {
    if (selectedActivity) {
      completeActivityMutation.mutate({ 
        activityId: selectedActivity.id!, 
        duration: selectedActivity.duration || undefined 
      });
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setEditForm({
      name: activity.name,
      duration: activity.duration || 0,
      category: activity.category as CategoryType,
      emoji: activity.emoji || '⭐'
    });
    setViewState('edit-activity');
  };

  const handleSaveEdit = () => {
    if (editingActivity) {
      updateActivityMutation.mutate({
        id: editingActivity.id!,
        data: {
          name: editForm.name,
          duration: editForm.duration || null,
          category: editForm.category,
          emoji: editForm.emoji
        }
      });
    }
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    stop();
    setShowCancelConfirm(false);
    setSelectedActivity(null);
    setViewState(selectedCategory ? 'category' : 'home');
  };

  const handleLogout = async () => {
    if (user) {
      await user.signOut();
    }
  };

  if (isLoading) {
    return (
      <div className="vibrant-bg flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
          <p className="text-white text-lg font-semibold drop-shadow-lg">Loading your dopamine menu...</p>
        </div>
        <div className="bg-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
      </div>
    );
  }

  // HOME SCREEN - 4 Category Menu
  if (viewState === 'home') {
    return (
      <div className="h-screen flex flex-col gap-6 relative overflow-hidden max-w-lg mx-auto">
        {/* Animated background shapes */}
        <div className="bg-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>

        <header className="flex justify-between items-center p-6 relative z-10">
          <div>
            <h1 className="text-2xl font-black text-white mb-1 tracking-wide">DOPAMINE MENU</h1>
            <p className="text-white/80 text-sm font-medium">What sounds good right now?</p>
          </div>
          <Button 
            onClick={() => setViewState('settings')} 
            className="glass-card p-2 border border-white/30 hover:border-white/50"
          >
            <Settings className="w-5 h-5 text-white" />
          </Button>
        </header>

        <main className="relative px-6 z-10 flex-1 flex flex-col">
          {/* Main 2x2 grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {['appetizers', 'entrees', 'sides', 'desserts'].map((key) => {
              const category = key as CategoryType;
              const info = categoryInfo[category];
              const hasActivities = categorizedActivities[category].length > 0;
              
              return (
                <div 
                  key={category}
                  className={`category-card cursor-pointer aspect-square hover:scale-105 ${category === 'appetizers' ? 'category-appetizers' : ''}
                  ${category === 'entrees' ? 'category-entrees' : ''}
                  ${category === 'sides' ? 'category-sides' : ''}
                  ${category === 'desserts' ? 'category-desserts' : ''}`}
                  onClick={() => handleCategorySelect(category)}
                >
                  <div className="text-center h-full flex flex-col justify-center p-4">
                    <h3 className="text-xl font-black text-white mb-2 tracking-wide leading-tight">{info.name}</h3>
                    <p className="text-white/80 text-sm font-medium mb-4 leading-tight">{info.description}</p>
                    <div className="inline-block bg-white/20 rounded-full px-4 py-2">
                      <span className="text-white font-bold text-sm">
                        {hasActivities ? `${categorizedActivities[category].length} item${categorizedActivities[category].length !== 1 ? 's' : ''}` : 'Add one now!'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Sides - full width, half height */}
          <div 
            className="category-card cursor-pointer category-specials hover:scale-105"
            style={{ height: '120px' }}
            onClick={() => handleCategorySelect('specials')}
          >
            <div className="text-center h-full flex flex-col justify-center p-4">
              <h3 className="text-xl font-black text-white mb-2 tracking-wide">{categoryInfo.specials.name}</h3>
              <p className="text-white/80 text-sm font-medium mb-2">{categoryInfo.specials.description}</p>
              <div className="inline-block bg-white/20 rounded-full px-4 py-1">
                <span className="text-white font-bold text-sm">
                  {categorizedActivities.specials.length > 0 ? `${categorizedActivities.specials.length} item${categorizedActivities.specials.length !== 1 ? 's' : ''}` : 'Add one now!'}
                </span>
              </div>
            </div>
          </div>
        </main>

        <AddActivityDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          category={selectedCategory || undefined}
        />

        <CelebrationAnimation
          show={showCelebration}
          type={celebrationType}
          message={celebrationMessage}
          onComplete={() => setShowCelebration(false)}
        />
      </div>
    );
  }

  // CATEGORY VIEW - Menu items with edit/add buttons
  if (viewState === 'category' && selectedCategory) {
    const categoryActivities = categorizedActivities[selectedCategory];
    const info = categoryInfo[selectedCategory];

    return (
      <div className="h-screen relative overflow-hidden max-w-lg mx-auto">
        <div className="bg-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>

        <header className="flex flex-wrap items-center justify-between py-6 px-4 relative z-10 sm:flex-nowrap">
          <Button 
            onClick={() => setViewState('home')} 
            className="glass-card p-3 border border-white/30 hover:border-white/50 shrink-0"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <div className="">
            <h1 className="text-3xl font-black text-white tracking-wide mb-1">{info.name}</h1>
            <p className="text-white/80 text-lg font-medium">{info.description}</p>
          </div>
          <div className="">
            <Button onClick={() => setShowAddDialog(true)} className="neon-button w-6 h-8 flex items-center justify-center p-0">
              <Plus className="w-5 h-5" />
              <span className="sr-only">Add</span>
            </Button>
          </div>
        </header>

        <main className="pb-6 px-4 relative z-10">
          {categoryActivities.length > 0 ? (
            <div className="space-y-4">
              {categoryActivities.map((activity: Activity) => (
                <div 
                  key={activity.id}
                  className="activity-card cursor-pointer"
                  onClick={() => handleActivitySelect(activity)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{activity.emoji || '⭐'}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg">{activity.name}</h3>
                      <div className="flex items-center space-x-3 text-white/70">
                        {activity.duration ? (
                          <span>{activity.duration} minute{activity.duration !== 1 ? 's' : ''}</span>
                        ) : (
                          <span>Quick activity</span>
                        )}
                        <span>•</span>
                        <span>Done {activity.completionCount || 0} times</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">🎯</div>
              <h3 className="text-2xl font-black text-white mb-4">No {info.name.toLowerCase()} yet</h3>
              <p className="text-white/80 text-lg mb-8">Ready to add some {info.description.toLowerCase()}?</p>
              <Button onClick={() => setShowAddDialog(true)} className="neon-button text-xl px-12 py-6">
                <Plus className="w-6 h-6 mr-3" />
                Add Your First One
              </Button>
            </div>
          )}
        </main>

        <AddActivityDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          category={selectedCategory}
        />
      </div>
    );
  }

  // ACTIVITY SCREEN - Shows activity with timer/controls
  if (viewState === 'activity' && selectedActivity) {
    const isTimerActivity = selectedActivity.duration && selectedActivity.duration > 0;
    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
      <div className="h-screen relative overflow-hidden max-w-lg mx-auto">
        <div className="bg-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>

        <header className="flex items-center justify-between px-6 pt-6 relative z-10">
          <Button onClick={handleCancel} className="glass-card p-3 border border-white/30 hover:border-white/50">
            <X className="w-6 h-6 text-white" />
          </Button>
          <Button onClick={() => handleEditActivity(selectedActivity)} className="glass-card p-3 border border-white/30 hover:border-white/50">
            <Edit3 className="w-6 h-6 text-white" />
          </Button>
        </header>

        <main className="p-6 text-center space-y-8 relative z-10">
          <div className="neon-accent p-4 rounded-2xl">
            <h1 className="bold-title mb-4">{selectedActivity.name.toUpperCase()}</h1>
            <p className="text-white/80 text-xl font-semibold capitalize">{selectedActivity.category.replace('_', ' ')}</p>
          </div>

          {isTimerActivity ? (
            <div className="space-y-8">
              <div className="glass-card p-8 mx-4">
                <div className="bold-title font-black text-white mb-4 drop-shadow-lg">
                  {formatTime(time)}
                </div>
              </div>
              
              <div className="flex justify-center space-x-6">
                <Button
                  onClick={isRunning ? pause : start}
                  className="neon-button text-xl px-8 py-4"
                >
                  {isRunning ? <Pause className="w-8 h-8 mr-3" /> : <Play className="w-8 h-8 mr-3" />}
                  {isRunning ? 'PAUSE' : 'START'}
                </Button>
                
                <Button
                  onClick={() => setTime((selectedActivity.duration || 0) * 60)}
                  className="glass-card p-4 border border-white/30 hover:border-white/50"
                >
                  <RotateCcw className="w-8 h-8 text-white" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 mx-4">
              <p className="text-2xl text-white font-bold drop-shadow-lg">Ready to crush this?</p>
            </div>
          )}

          <div className="space-y-4 px-4">
            <Button 
              onClick={handleActivityComplete}
              className="w-full neon-button text-2xl py-6"
            >
              <Check className="w-8 h-8 mr-3" />
              COMPLETE
            </Button>
            
            <Button 
              onClick={handleCancel}
              className="w-full glass-card border border-white/30 hover:border-white/50 text-white font-bold text-xl py-4"
            >
              Cancel
            </Button>
          </div>
        </main>

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Activity?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel "{selectedActivity.name}"? Any progress will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Going</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCancel}>Cancel Activity</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <CelebrationAnimation
          show={showCelebration}
          type={celebrationType}
          message={celebrationMessage}
          onComplete={() => setShowCelebration(false)}
        />
      </div>
    );
  }

  // EDIT ACTIVITY SCREEN
  if (viewState === 'edit-activity' && editingActivity) {
    return (
      <div className="h-screen relative overflow-hidden max-w-lg mx-auto">
        <div className="bg-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>

        <header className="flex items-center p-6 gap-4 relative z-10">
          <Button onClick={() => setViewState('activity')} className="glass-card p-3 mr-4 border border-white/30 hover:border-white/50">
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <h1 className="text-3xl font-black text-white tracking-wide">EDIT ACTIVITY</h1>
        </header>

        <main className="p-6 space-y-8 relative z-10">
          <div className="space-y-6">
            <div>
              <Label htmlFor="activity-name" className="text-white font-bold text-lg mb-2 block">Activity Name</Label>
              <Input
                id="activity-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter activity name"
                className="glass-input text-xl py-4 font-semibold"
              />
            </div>

            <div>
              <Label htmlFor="emoji" className="text-white font-bold text-lg mb-2 block">Emoji</Label>
              <Input
                id="emoji"
                value={editForm.emoji}
                onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
                placeholder="⭐"
                maxLength={2}
                className="glass-input text-3xl py-4 text-center"
              />
            </div>

            <div>
              <Label htmlFor="duration" className="text-white font-bold text-lg mb-2 block">Duration (minutes, 0 = instant)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={editForm.duration}
                onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 0 })}
                className="glass-input text-xl py-4 font-semibold"
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-white font-bold text-lg mb-2 block">Category</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) => setEditForm({ ...editForm, category: value as CategoryType })}
              >
                <SelectTrigger className="glass-input text-white text-xl py-4 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border border-white/30">
                  <SelectItem value="appetizers" className="text-white font-semibold">⚡ APPETIZERS (Quick activities)</SelectItem>
                  <SelectItem value="entrees" className="text-white font-semibold">🔥 MEALS (Main activities)</SelectItem>
                  <SelectItem value="sides" className="text-white font-semibold">🌊 SIDES (Background activities)</SelectItem>
                  <SelectItem value="desserts" className="text-white font-semibold">✨ DESSERTS (Indulgences)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <Button onClick={handleSaveEdit} className="neon-button text-xl py-6">
              SAVE CHANGES
            </Button>
            <Button onClick={() => setViewState('activity')} className="glass-button bg-transparent text-xl py-6">
              Cancel
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // SETTINGS SCREEN
  if (viewState === 'settings') {
    return (
      <div className="h-screen relative overflow-hidden max-w-lg mx-auto">
        <div className="bg-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>

        <header className="flex items-center p-6 relative z-10">
          <Button onClick={() => setViewState('home')} className="glass-card p-3 mr-4 border border-white/30 hover:border-white/50">
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <h1 className="text-3xl font-black text-white tracking-wide">SETTINGS</h1>
        </header>

        <main className="p-6 space-y-6 relative z-10">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full glass-card border border-red-400/50 text-red-300 hover:border-red-400 text-xl py-6 font-bold">
                Clear All Activities
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card border border-white/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white text-xl font-bold">Clear all activities?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/80">
                  This will permanently delete all your activities and progress. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="glass-card border border-white/30 text-white hover:border-white/50">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => clearAllMutation.mutate()} className="neon-button">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button 
            onClick={handleLogout}
            className="w-full glass-card border border-white/30 hover:border-white/50 text-white font-bold text-xl py-6"
          >
            Logout
          </Button>

          <Button 
            className="w-full glass-card border border-white/30 hover:border-white/50 text-white font-bold text-xl py-6"
          >
            About & Info
          </Button>
        </main>
      </div>
    );
  }

  return null;
}