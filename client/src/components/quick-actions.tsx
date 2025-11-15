import { useState } from "react";
import { Shuffle, Clock, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Activity } from "@shared/schema";

interface QuickActionsProps {
  activities: Activity[];
  onActivitySelect: (activity: Activity) => void;
}

export default function QuickActions({ activities, onActivitySelect }: QuickActionsProps) {
  const { toast } = useToast();
  const [isGettingRandom, setIsGettingRandom] = useState(false);

  const getRandomActivity = async () => {
    if (activities.length === 0) {
      toast({
        title: "No activities available",
        description: "Add some activities to your menu first!",
        variant: "destructive",
      });
      return;
    }

    setIsGettingRandom(true);
    
    // Simulate a brief delay for better UX
    setTimeout(() => {
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      onActivitySelect(randomActivity);
      
      toast({
        title: "Random activity selected!",
        description: randomActivity.name,
      });
      
      setIsGettingRandom(false);
    }, 500);
  };

  const getQuickBoost = () => {
    const appetizers = activities.filter(a => a.category === "appetizers");
    if (appetizers.length === 0) {
      toast({
        title: "No quick activities available",
        description: "Add some appetizers to your menu for quick boosts!",
        variant: "destructive",
      });
      return;
    }

    const randomAppetizer = appetizers[Math.floor(Math.random() * appetizers.length)];
    onActivitySelect(randomAppetizer);
    
    toast({
      title: "Quick boost selected!",
      description: randomAppetizer.name,
    });
  };

  const getEmergencyBoost = () => {
    // Prioritize appetizers for emergency situations
    const appetizers = activities.filter(a => a.category === "appetizers");
    const quickActivities = appetizers.length > 0 ? appetizers : activities;
    
    if (quickActivities.length === 0) {
      toast({
        title: "No activities available",
        description: "Add some activities to your menu first!",
        variant: "destructive",
      });
      return;
    }

    const emergencyActivity = quickActivities[Math.floor(Math.random() * quickActivities.length)];
    onActivitySelect(emergencyActivity);
    
    toast({
      title: "Emergency boost activated!",
      description: emergencyActivity.name,
    });
  };

  return (
    <Card className="adhd-card mb-8">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="p-4 h-auto flex-col space-y-2 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 adhd-focus"
            onClick={getRandomActivity}
            disabled={isGettingRandom}
          >
            <Shuffle className="w-6 h-6" />
            <div className="font-medium">
              {isGettingRandom ? "Selecting..." : "Random Activity"}
            </div>
            <div className="text-sm text-amber-600/70">When you feel overwhelmed</div>
          </Button>
          
          <Button
            variant="outline"
            className="p-4 h-auto flex-col space-y-2 text-secondary border-green-200 bg-green-50 hover:bg-green-100 adhd-focus"
            onClick={getQuickBoost}
          >
            <Clock className="w-6 h-6" />
            <div className="font-medium">Quick Timer</div>
            <div className="text-sm text-secondary/70">5 min dopamine boost</div>
          </Button>
          
          <Button
            variant="outline"
            className="p-4 h-auto flex-col space-y-2 text-primary border-blue-200 bg-blue-50 hover:bg-blue-100 adhd-focus"
            onClick={getEmergencyBoost}
          >
            <Zap className="w-6 h-6" />
            <div className="font-medium">Emergency Boost</div>
            <div className="text-sm text-primary/70">Need stimulation now</div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
