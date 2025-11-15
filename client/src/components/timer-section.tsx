import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Play, Pause, Square } from "lucide-react";
import { useTimer } from "@/hooks/use-timer";
import type { Activity } from "@shared/schema";

interface TimerSectionProps {
  selectedActivity: Activity | null;
}

const presetTimes = [5, 10, 15, 30];

export default function TimerSection({ selectedActivity }: TimerSectionProps) {
  const { time, isRunning, start, pause, stop, setTime } = useTimer();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePresetTime = (minutes: number) => {
    setTime(minutes * 60);
  };

  return (
    <Card className="adhd-card mt-8">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Activity Timer</h3>
              <p className="text-sm text-muted-foreground">Set time limits for your chosen activities</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {presetTimes.map((minutes) => (
            <Button
              key={minutes}
              variant="outline"
              className="p-4 h-auto flex-col space-y-1 adhd-focus hover:bg-indigo-50"
              onClick={() => handlePresetTime(minutes)}
            >
              <div className="text-2xl font-bold text-indigo-600">{minutes}</div>
              <div className="text-sm text-muted-foreground">minutes</div>
            </Button>
          ))}
        </div>
        
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-medium text-foreground">Current Activity</div>
              <div className="text-sm text-muted-foreground">
                {selectedActivity ? selectedActivity.name : "No activity selected"}
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{formatTime(time)}</div>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              className="flex-1 bg-secondary text-secondary-foreground adhd-button"
              onClick={start}
              disabled={time === 0}
            >
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
            <Button 
              variant="outline"
              className="flex-1 adhd-button"
              onClick={pause}
              disabled={!isRunning}
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
            <Button 
              variant="outline"
              className="flex-1 adhd-button"
              onClick={stop}
              disabled={time === 0 && !isRunning}
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
