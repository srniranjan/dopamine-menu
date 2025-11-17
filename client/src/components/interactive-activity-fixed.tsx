import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, ExternalLink, Music, Smartphone, Headphones, X } from "lucide-react";
import { useTimer } from "@/hooks/use-timer";
import { buildApiUrl, withStackUserHeader } from "@/lib/queryClient";

interface InteractiveActivityProps {
  activity: {
    id?: number;
    name: string;
    duration?: number;
    category: string;
  };
  onClose: () => void;
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

export default function InteractiveActivity({ activity, onClose }: InteractiveActivityProps) {
  const [phase, setPhase] = useState<'active' | 'complete'>('active');
  const { time, isRunning, start, pause, stop, setTime } = useTimer();
  
  const isJumpingJacks = activity.name.toLowerCase().includes('jumping jacks');
  const isMusic = activity.name.toLowerCase().includes('song') || activity.name.toLowerCase().includes('music');
  const isTimerActivity = activity.duration && activity.duration > 0;
  
  console.log("Timer state:", { time, isRunning, isTimerActivity, duration: activity.duration });

  // Initialize timer on mount but don't auto-start
  useEffect(() => {
    if (isTimerActivity) {
      setTime((activity.duration || 0) * 60);
    }
  }, [activity.duration, isTimerActivity, setTime]);

  // Auto-complete timer-based activities when time reaches zero
  useEffect(() => {
    if (phase === 'active' && isTimerActivity && isRunning && time <= 0) {
      handleComplete();
    }
  }, [time, phase, isTimerActivity, isRunning]);

  const handleComplete = () => {
    setPhase('complete');
    stop();
    
    // Track activity completion
    if (activity.id) {
      fetch(buildApiUrl(`/api/activities/${activity.id}/complete`), {
        method: 'POST',
        credentials: 'include',
        headers: withStackUserHeader({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          duration: activity.duration,
        }),
      }).catch(console.error);
    }
  };



  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 z-10"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
        
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">{activity.name}</h3>
              {activity.duration && activity.duration > 0 && (
                <p className="text-sm text-muted-foreground">{activity.duration} minute activity</p>
              )}
            </div>

            {phase === 'active' && (
              <div className="space-y-4">
                {/* Always show activity content */}
                <div className="text-center">
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-blue-800 font-medium">Performing Activity</p>
                  </div>
                  
                  {/* Activity-specific content */}
                  {isJumpingJacks && <JumpingJacksAnimation isActive={isRunning} />}
                  {isMusic && <MusicServiceButtons />}
                  
                  {/* Timer for timed activities */}
                  {isTimerActivity && (
                    <div className="text-center space-y-4">
                      <div className="text-4xl font-bold text-primary">
                        {formatTime(time)}
                      </div>
                      <Progress value={((activity.duration! * 60 - time) / (activity.duration! * 60)) * 100} className="h-2" />
                      
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={isRunning ? pause : start}
                        >
                          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTime((activity.duration || 0) * 60)}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center space-x-2">
                  <Button
                    onClick={handleComplete}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Mark Complete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}

            {phase === 'complete' && (
              <div className="text-center space-y-4">
                <div className="text-green-600 text-xl font-bold">✓ Activity Complete!</div>
                <p className="text-muted-foreground">Great job completing your activity!</p>
                <Button onClick={onClose} className="w-full">
                  Continue
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}