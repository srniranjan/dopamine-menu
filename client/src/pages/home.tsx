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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import AddActivityDialog from "@/components/add-activity-dialog";
import CelebrationAnimation from "@/components/celebration-animation";
import type { Activity, CategoryType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTimer } from "@/hooks/use-timer";
import { useUser } from "@stackframe/react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

type ViewState = 'home' | 'category' | 'activity' | 'settings' | 'edit-activity';

const categoryInfo = {
  appetizers: {
    name: "APPETIZERS",
    description: "Quick dopamine hits",
  },
  entrees: {
    name: "Entrées",
    description: "Main activities",
  },
  snacks: {
    name: "SNACKS",
    description: "Light activities",
  },
  desserts: {
    name: "DESSERTS",
    description: "Pure indulgence",
  },
  sides: {
    name: "SIDES",
    description: "Background vibes",
  },
  specials: {
    name: "SPECIALS",
    description: "Rare treats",
  },
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
  const [editEmojiPickerOpen, setEditEmojiPickerOpen] = useState(false);
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
          <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-foreground text-lg font-medium">Loading your dopamine menu...</p>
        </div>
      </div>
    );
  }

  // HOME SCREEN - 4 Category Menu
  if (viewState === 'home') {
    return (
      <div className="h-screen flex flex-col gap-6 relative overflow-hidden max-w-lg mx-auto bg-background">
        <header className="flex justify-between items-center p-6 relative z-10">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1 tracking-tight">Dopamine menu</h1>
            <p className="text-muted-foreground text-sm">What sounds good right now?</p>
          </div>
          <Button
            onClick={() => setViewState('settings')}
            variant="outline"
            size="icon"
            className="glass-card shrink-0"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-foreground" />
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
                  className={`category-card cursor-pointer aspect-square ${category === 'appetizers' ? 'category-appetizers' : ''}
                  ${category === 'entrees' ? 'category-entrees' : ''}
                  ${category === 'sides' ? 'category-sides' : ''}
                  ${category === 'desserts' ? 'category-desserts' : ''}`}
                  onClick={() => handleCategorySelect(category)}
                >
                  <div className="text-center h-full flex flex-col justify-center p-4">
                    <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight leading-tight">{info.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-tight">{info.description}</p>
                    <div className="inline-block rounded-full bg-muted px-4 py-2">
                      <span className="text-foreground font-medium text-sm">
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
            className="category-card cursor-pointer category-specials"
            style={{ height: '120px' }}
            onClick={() => handleCategorySelect('specials')}
          >
            <div className="text-center h-full flex flex-col justify-center p-4">
              <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">{categoryInfo.specials.name}</h3>
              <p className="text-muted-foreground text-sm mb-2">{categoryInfo.specials.description}</p>
              <div className="inline-block rounded-full bg-muted px-4 py-1">
                <span className="text-foreground font-medium text-sm">
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
      <div className="h-screen relative overflow-hidden max-w-lg mx-auto flex flex-col bg-background">
        <header className="flex flex-wrap items-center justify-between gap-2 py-6 px-4 relative z-10 sm:flex-nowrap flex-shrink-0">
          <Button
            onClick={() => setViewState('home')}
            variant="outline"
            size="icon"
            className="glass-card shrink-0"
            aria-label="Back to menu"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </Button>
          <div className="min-w-0 flex-1 text-center sm:text-left px-2">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-1">{info.name}</h1>
            <p className="text-muted-foreground text-base">{info.description}</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            size="icon"
            className="neon-button shrink-0 h-10 w-10 p-0"
            aria-label="Add activity"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </header>

        <main className="pb-6 px-4 relative z-10 flex-1 overflow-y-auto">
          {categoryActivities.length > 0 ? (
            <div className="space-y-4 pb-6">
              {categoryActivities.map((activity: Activity) => (
                <div 
                  key={activity.id}
                  className="activity-card cursor-pointer"
                  onClick={() => handleActivitySelect(activity)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{activity.emoji || '⭐'}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-lg">
                        {activity.name.length > 25 ? `${activity.name.slice(0, 20)}...` : activity.name}
                      </h3>
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-muted-foreground text-sm">
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
              <h3 className="text-xl font-semibold text-foreground mb-4">No {info.name.toLowerCase()} yet</h3>
              <p className="text-muted-foreground text-lg mb-8">Ready to add some {info.description.toLowerCase()}?</p>
              <Button onClick={() => setShowAddDialog(true)} className="neon-button text-lg px-10 py-6 h-auto">
                <Plus className="w-6 h-6 mr-3" />
                Add your first one
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
      <div className="h-screen relative overflow-hidden max-w-lg mx-auto bg-background">
        <header className="flex items-center justify-between px-6 pt-6 relative z-10">
          <Button onClick={handleCancel} variant="outline" size="icon" className="glass-card" aria-label="Cancel">
            <X className="w-6 h-6 text-foreground" />
          </Button>
          <Button onClick={() => handleEditActivity(selectedActivity)} variant="outline" size="icon" className="glass-card" aria-label="Edit activity">
            <Edit3 className="w-6 h-6 text-foreground" />
          </Button>
        </header>

        <main className="p-6 text-center space-y-8 relative z-10">
          <div className="neon-accent">
            <h1 className="bold-title mb-4">{selectedActivity.name}</h1>
            <p className="text-muted-foreground text-lg font-medium capitalize">{selectedActivity.category.replace('_', ' ')}</p>
          </div>

          {isTimerActivity ? (
            <div className="space-y-8">
              <div className="glass-card p-8 mx-4">
                <div className="text-5xl font-semibold tabular-nums tracking-tight text-foreground sm:text-6xl">
                  {formatTime(time)}
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  onClick={isRunning ? pause : start}
                  className="neon-button text-lg px-8 py-6 h-auto"
                >
                  {isRunning ? <Pause className="w-8 h-8 mr-3" /> : <Play className="w-8 h-8 mr-3" />}
                  {isRunning ? 'Pause' : 'Start'}
                </Button>

                <Button
                  onClick={() => setTime((selectedActivity.duration || 0) * 60)}
                  variant="outline"
                  size="icon"
                  className="glass-card h-14 w-14 shrink-0"
                  aria-label="Reset timer"
                >
                  <RotateCcw className="w-8 h-8 text-foreground" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 mx-4">
              <p className="text-xl text-foreground font-medium">Ready when you are.</p>
            </div>
          )}

          <div className="space-y-4 px-4">
            <Button
              onClick={handleActivityComplete}
              className="w-full neon-button text-xl py-6 h-auto font-semibold"
            >
              <Check className="w-8 h-8 mr-3" />
              Complete
            </Button>

            <Button
              onClick={handleCancel}
              variant="outline"
              className="w-full glass-card text-foreground font-medium text-lg py-6 h-auto"
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
      <div className="h-screen relative overflow-hidden max-w-lg mx-auto bg-background">
        <header className="flex items-center p-6 gap-4 relative z-10">
          <Button onClick={() => setViewState('activity')} variant="outline" size="icon" className="glass-card shrink-0" aria-label="Back">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </Button>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Edit activity</h1>
        </header>

        <main className="p-6 space-y-8 relative z-10">
          <div className="space-y-6">
            <div>
              <Label htmlFor="activity-name" className="text-foreground font-medium text-base mb-2 block">Activity name</Label>
              <Input
                id="activity-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter activity name"
                className="glass-input text-xl py-4 font-semibold"
              />
            </div>

            <div>
              <Label htmlFor="emoji" className="text-foreground font-medium text-base mb-2 block">Emoji</Label>
              <Popover open={editEmojiPickerOpen} onOpenChange={setEditEmojiPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="glass-input text-3xl py-4 text-center w-full"
                  >
                    {editForm.emoji || "⭐"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 border-none w-[320px]" align="start">
                  <EmojiPicker
                    searchDisabled
                    skinTonesDisabled
                    previewConfig={{ showPreview: false }}
                    onEmojiClick={({ emoji }: EmojiClickData) => {
                      setEditForm((prev) => ({ ...prev, emoji }));
                      setEditEmojiPickerOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="duration" className="text-foreground font-medium text-base mb-2 block">Duration (minutes, 0 = instant)</Label>
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
              <Label htmlFor="category" className="text-foreground font-medium text-base mb-2 block">Category</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) => setEditForm({ ...editForm, category: value as CategoryType })}
              >
                <SelectTrigger className="glass-input text-xl py-4 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  <SelectItem value="appetizers">Appetizers (quick activities)</SelectItem>
                  <SelectItem value="entrees">Entrées (main activities)</SelectItem>
                  <SelectItem value="sides">Sides (background activities)</SelectItem>
                  <SelectItem value="desserts">Desserts (indulgences)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <Button onClick={handleSaveEdit} className="neon-button text-lg py-6 h-auto font-semibold">
              Save changes
            </Button>
            <Button onClick={() => setViewState('activity')} variant="outline" className="text-lg py-6 h-auto">
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
      <div className="h-screen relative overflow-hidden max-w-lg mx-auto bg-background">
        <header className="flex items-center p-6 relative z-10 gap-4">
          <Button onClick={() => setViewState('home')} variant="outline" size="icon" className="glass-card shrink-0" aria-label="Back">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </Button>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Settings</h1>
        </header>

        <main className="p-6 space-y-6 relative z-10">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full text-lg py-6 h-auto font-medium">
                Clear all activities
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-semibold">Clear all activities?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This will permanently delete all your activities and progress. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => clearAllMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Clear all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full glass-card text-foreground font-medium text-lg py-6 h-auto"
          >
            Log out
          </Button>

          <Button
            variant="outline"
            className="w-full glass-card text-foreground font-medium text-lg py-6 h-auto"
          >
            About
          </Button>
        </main>
      </div>
    );
  }

  return null;
}