import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw, ExternalLink, Music, Smartphone, Headphones, Edit, Save, X } from "lucide-react";
import { useTimer } from "@/hooks/use-timer";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/lib/queryClient";

interface InteractiveActivityProps {
  activity: {
    id?: number;
    name: string;
    duration?: number | null;
    category: string;
    description?: string | null;
  };
  onClose: () => void;
  onComplete?: (activity: any, duration?: number) => void;
}

const JumpingJacksAnimation = ({ isActive }: { isActive: boolean }) => (
  <div className="flex items-center justify-center h-32">
    <div className={`w-16 h-16 transition-all duration-500 ${isActive ? 'animate-bounce' : ''}`}>
      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
        <div className="text-white text-xs font-bold">🏃‍♀️</div>
      </div>
    </div>
  </div>
);

const MusicServiceButtons = () => (
  <div className="grid grid-cols-2 gap-3">
    <Button
      variant="outline"
      className="flex items-center space-x-2 h-12"
      onClick={() => window.open('https://open.spotify.com', '_blank')}
    >
      <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
        <Music className="w-4 h-4 text-white" />
      </div>
      <span className="text-sm">Spotify</span>
    </Button>
    <Button
      variant="outline"
      className="flex items-center space-x-2 h-12"
      onClick={() => window.open('https://music.apple.com', '_blank')}
    >
      <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-red-500 rounded flex items-center justify-center">
        <Music className="w-4 h-4 text-white" />
      </div>
      <span className="text-sm">Apple Music</span>
    </Button>
    <Button
      variant="outline"
      className="flex items-center space-x-2 h-12"
      onClick={() => window.open('https://music.youtube.com', '_blank')}
    >
      <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
        <Music className="w-4 h-4 text-white" />
      </div>
      <span className="text-sm">YouTube Music</span>
    </Button>
    <Button
      variant="outline"
      className="flex items-center space-x-2 h-12"
      onClick={() => window.open('https://music.amazon.com', '_blank')}
    >
      <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
        <Music className="w-4 h-4 text-white" />
      </div>
      <span className="text-sm">Amazon Music</span>
    </Button>
  </div>
);

const CountdownTimer = ({ seconds, onComplete }: { seconds: number; onComplete: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onComplete]);

  return (
    <div className="text-center space-y-4">
      <div className="text-6xl font-bold text-primary">{timeLeft}</div>
      <div className="text-sm text-muted-foreground">Get ready...</div>
      <Progress value={((seconds - timeLeft) / seconds) * 100} className="h-2" />
    </div>
  );
};

export default function InteractiveActivity({ activity, onClose, onComplete }: InteractiveActivityProps) {
  const [phase, setPhase] = useState<'active' | 'complete' | 'edit'>('active');
  const [editForm, setEditForm] = useState({
    name: activity.name,
    duration: activity.duration || 0,
    category: activity.category,
    description: activity.description || ''
  });
  const { time, isRunning, start, pause, stop, setTime } = useTimer();
  const { toast } = useToast();

  const isJumpingJacks = activity.name.toLowerCase().includes('jumping jacks');
  const isMusic = activity.name.toLowerCase().includes('song') || activity.name.toLowerCase().includes('music');
  const isTimerActivity = activity.duration && activity.duration > 0;

  // Initialize timer on mount but don't auto-start
  useEffect(() => {
    if (isTimerActivity) {
      setTime((activity.duration || 0) * 60);
    }
  }, [activity.duration, isTimerActivity, setTime]);

  const handleComplete = () => {
    setPhase('complete');
    pause();
    
    // Track activity completion
    if (activity.id) {
      fetch(buildApiUrl(`/api/activities/${activity.id}/complete`), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: activity.duration,
        }),
      }).catch(console.error);
    }
    
    // Call onComplete callback if provided
    if (onComplete) {
      onComplete(activity, activity.duration || undefined);
    }
  };
  
  const handleEditSave = async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/activities/${activity.id}`), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          duration: editForm.duration || null,
          category: editForm.category,
          description: editForm.description || null
        })
      });
      
      if (response.ok) {
        toast({
          title: "Activity updated",
          description: "Your changes have been saved successfully."
        });
        // Update local activity data
        Object.assign(activity, editForm);
        setPhase('active');
        // Reinitialize timer with new duration
        if (editForm.duration && editForm.duration > 0) {
          setTime(editForm.duration * 60);
        }
      } else {
        throw new Error('Failed to update activity');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Auto-complete timer-based activities
  useEffect(() => {
    if (phase === 'active' && isTimerActivity && time <= 0) {
      handleComplete();
    }
  }, [time, phase, isTimerActivity]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2"
              onClick={() => setPhase('edit')}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold">{activity.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{activity.category.replace('_', ' ')}</p>
            {activity.duration && activity.duration > 0 && (
              <p className="text-sm text-muted-foreground">{activity.duration} minute{activity.duration !== 1 ? 's' : ''}</p>
            )}
          </div>

          {phase === 'edit' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="activity-name">Activity Name</Label>
                <Input
                  id="activity-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter activity name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appetizers">🥗 Appetizers (Quick boosts)</SelectItem>
                    <SelectItem value="entrees">🍽️ Entrees (Main activities)</SelectItem>
                    <SelectItem value="sides">🥖 Sides (Background activities)</SelectItem>
                    <SelectItem value="desserts">🍰 Desserts (Indulgent treats)</SelectItem>
                    <SelectItem value="specials">⭐ Specials (Rare treats)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={editForm.duration}
                  onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 0 })}
                  placeholder="0 for instant activities"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Add a description..."
                />
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleEditSave} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button 
                  onClick={() => {
                    setEditForm({
                      name: activity.name,
                      duration: activity.duration || 0,
                      category: activity.category,
                      description: activity.description || ''
                    });
                    setPhase('active');
                  }}
                  variant="outline"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {phase === 'active' && (
            <div className="space-y-4">
              {isJumpingJacks && (
                <JumpingJacksAnimation isActive={phase === 'active'} />
              )}

              {isMusic && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Headphones className="w-12 h-12 mx-auto text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Choose your music app:</p>
                  </div>
                  <MusicServiceButtons />
                </div>
              )}

              {isTimerActivity && (
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-primary">
                    {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="flex justify-center space-x-2">
                    <Button
                      onClick={isRunning ? pause : start}
                      className="flex items-center space-x-2"
                    >
                      {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{isRunning ? 'Pause' : 'Start'}</span>
                    </Button>
                    <Button onClick={() => setTime((activity.duration || 0) * 60)} variant="outline">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                  {activity.duration && (
                    <Progress 
                      value={((activity.duration * 60) - time) / (activity.duration * 60) * 100} 
                      className="h-2"
                    />
                  )}
                </div>
              )}

            </div>
          )}

          {phase === 'complete' && (
            <div className="text-center space-y-4">
              <div className="text-2xl">🎉</div>
              <p className="font-semibold text-green-600">Great job! Activity completed!</p>
              <p className="text-sm text-muted-foreground">
                You've given your brain the dopamine boost it needed.
              </p>
            </div>
          )}

          <div className="flex justify-center space-x-3">
            <Button onClick={onClose} variant="outline" className="w-full">
              {phase === 'complete' ? 'Close' : 'Cancel'}
            </Button>
            {!isTimerActivity && phase === 'active' && (
              <Button onClick={handleComplete} className="w-full">
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}