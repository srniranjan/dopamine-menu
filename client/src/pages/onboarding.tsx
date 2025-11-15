import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronRight, ChevronLeft, Check, Heart, Coffee, Activity, Headphones, Smartphone, Star, Plus, Trash2 } from "lucide-react";
import backgroundImage from "@assets/image_1757519497835.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CategoryType } from "@shared/schema";
import { exampleActivities, categoryDescriptions } from "@shared/schema";

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

const categoryInfo = {
  appetizers: {
    icon: Coffee,
    title: "Appetizers",
    subtitle: "Quick 1-5 minute energy boosts",
    description: "These are your go-to activities when you need just a tiny spark of motivation. Think of them as mental snacks - quick, satisfying, and they don't pull you into a rabbit hole.",
    examples: "Like listening to one favorite song, doing 10 jumping jacks, or taking three deep breaths.",
    tip: "Choose things that feel good but naturally end on their own."
  },
  entrees: {
    icon: Activity,
    title: "Entrées", 
    subtitle: "Main activities that energize you",
    description: "These are your main courses - activities that truly excite you and make you feel alive. They're worth spending 15-60 minutes on and leave you feeling accomplished.",
    examples: "Like going for a walk, playing an instrument, working on a hobby, or having a meaningful conversation.",
    tip: "Pick activities that match your energy level and genuinely bring you joy."
  },
  sides: {
    icon: Headphones,
    title: "Sides",
    subtitle: "Background stimulation helpers", 
    description: "These are the background activities that make boring tasks more bearable. They add just enough stimulation to keep your brain engaged while you do other things.",
    examples: "Like listening to music while cleaning, having white noise during work, or using a fidget toy during meetings.",
    tip: "Choose things that enhance focus without becoming the main attraction."
  },
  desserts: {
    icon: Smartphone,
    title: "Desserts",
    subtitle: "Easy dopamine hits (use mindfully)",
    description: "These are the easy pleasure activities that feel good in the moment. They're totally okay to enjoy - just be mindful about when and how much.",
    examples: "Like scrolling social media, playing phone games, or watching short videos.",
    tip: "It's about awareness, not restriction. Sometimes dessert is exactly what you need."
  },
  specials: {
    icon: Star,
    title: "Specials",
    subtitle: "Special treats and bucket-list items",
    description: "These are your special occasion activities - the ones that require planning, cost money, or happen rarely but fill your emotional tank for weeks.",
    examples: "Like going to concerts, weekend getaways, spa days, or trying that new restaurant you've been wanting to visit.",
    tip: "These are investments in your long-term happiness and motivation."
  }
};

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedActivities, setSelectedActivities] = useState<Record<CategoryType, string[]>>({
    appetizers: [],
    entrees: [],
    snacks: [],
    sides: [],
    desserts: [],
    specials: []
  });
  const [includeTemplates, setIncludeTemplates] = useState<Record<CategoryType, boolean>>({
    appetizers: false,
    entrees: false,
    snacks: false,
    sides: false,
    desserts: false,
    specials: false
  });
  const [hasAttemptedContinue, setHasAttemptedContinue] = useState<Record<CategoryType, boolean>>({
    appetizers: false,
    entrees: false,
    snacks: false,
    sides: false,
    desserts: false,
    specials: false
  });
  const [customActivities, setCustomActivities] = useState<Record<CategoryType, Array<{name: string; emoji?: string; duration?: number}>>>({
    appetizers: [],
    entrees: [],
    snacks: [],
    sides: [],
    desserts: [],
    specials: []
  });
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityEmoji, setNewActivityEmoji] = useState('');
  const [newActivityDuration, setNewActivityDuration] = useState<number | ''>('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createActivitiesBatchMutation = useMutation({
    mutationFn: async (activities: Array<{ name: string; category: CategoryType; duration?: number; emoji?: string; description?: string }>) => {
      const response = await apiRequest("POST", "/api/activities/batch", activities);
      return response.json();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save activities. Please try again.",
        variant: "destructive",
      });
    },
  });

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to Your Dopamine Menu! 🧠✨",
      subtitle: "Let's create your personalized activity menu",
      content: (
        <div className="space-y-6 text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-4">
            <p className="text-lg text-slate-800 leading-relaxed">
              Create your personal "dopamine menu" - activities organized like a restaurant menu for when your brain needs stimulation.
            </p>
            <p className="text-base text-slate-600">
              Takes 3-5 minutes. We'll guide you through each step.
            </p>
          </div>
        </div>
      )
    },

    ...Object.entries(categoryInfo).map(([category, info]) => ({
      id: category,
      title: `Let's set up your ${info.title}`,
      subtitle: info.subtitle,
      content: (
        <div className="space-y-6">
          
          <div className="space-y-4">
            <p className="text-sm text-slate-700">{info.description}</p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800"><strong>Tip:</strong> {info.tip}</p>
            </div>
          </div>

          <div className="space-y-6 border-t pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor={`templates-${category}`} className="text-base font-semibold text-slate-800">
                  Include popular {info.title.toLowerCase()}
                </Label>
                <p className="text-sm text-slate-700 mt-1">Add tried-and-tested activities to get started</p>
              </div>
              <div className="flex-shrink-0">
                <Switch
                  id={`templates-${category}`}
                  checked={includeTemplates[category as CategoryType]}
                  className="data-[state=unchecked]:bg-slate-300"
                  onCheckedChange={(checked) => {
                  setIncludeTemplates(prev => ({
                    ...prev,
                    [category]: checked
                  }));
                  if (checked) {
                    // Add all template activities
                    const templateNames = exampleActivities[category as CategoryType]?.map(a => a.name) || [];
                    setSelectedActivities(prev => ({
                      ...prev,
                      [category]: Array.from(new Set([...prev[category as CategoryType], ...templateNames]))
                    }));
                  } else {
                    // Remove template activities but keep custom ones
                    const templateNames = exampleActivities[category as CategoryType]?.map(a => a.name) || [];
                    setSelectedActivities(prev => ({
                      ...prev,
                      [category]: prev[category as CategoryType].filter(name => !templateNames.includes(name))
                    }));
                  }
                  }}
                />
              </div>
            </div>
            
            {includeTemplates[category as CategoryType] && (
              <div className="space-y-3">
                <p className="text-sm text-slate-700 font-medium">Popular activities added:</p>
                <div className="grid gap-2">
                  {exampleActivities[category as CategoryType]?.slice(0, 3).map((activity, index) => (
                    <div key={index} className="text-sm p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                      {activity.name}
                    </div>
                  )) || []}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 border-t pt-6">
            <h4 className="font-semibold text-base text-slate-800">Add your own {info.title.toLowerCase()}</h4>
            <div className="space-y-4">
              <Input
                placeholder={`Enter a ${category.slice(0, -1)} activity...`}
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                className="rounded-none"
              />
              <div className="flex gap-3">
                <Input
                  placeholder="🎵 Emoji"
                  value={newActivityEmoji}
                  onChange={(e) => setNewActivityEmoji(e.target.value)}
                  className="w-24 rounded-none text-center"
                  maxLength={2}
                />
                <Input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={newActivityDuration}
                  onChange={(e) => setNewActivityDuration(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="flex-1 rounded-none"
                  min={0}
                />
              </div>
              <Button
                onClick={() => {
                  if (newActivityName.trim()) {
                    const newActivity = {
                      name: newActivityName.trim(),
                      emoji: newActivityEmoji.trim() || undefined,
                      duration: typeof newActivityDuration === 'number' ? newActivityDuration : undefined
                    };
                    setCustomActivities(prev => ({
                      ...prev,
                      [category]: [...prev[category as CategoryType], newActivity]
                    }));
                    setSelectedActivities(prev => ({
                      ...prev,
                      [category]: [...prev[category as CategoryType], newActivity.name]
                    }));
                    setNewActivityName('');
                    setNewActivityEmoji('');
                    setNewActivityDuration('');
                  }
                }}
                disabled={!newActivityName.trim()}
                className="w-full h-10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </Button>
              
              {customActivities[category as CategoryType].length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700 font-medium">Your custom activities:</p>
                  {customActivities[category as CategoryType].map((activity, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex-1">
                        <div className="text-base font-medium text-blue-900">
                          {activity.emoji && <span className="mr-2">{activity.emoji}</span>}
                          {activity.name}
                          {activity.duration && activity.duration > 0 && (
                            <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                              {activity.duration}m
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCustomActivities(prev => ({
                            ...prev,
                            [category]: prev[category as CategoryType].filter((_, i) => i !== index)
                          }));
                          setSelectedActivities(prev => ({
                            ...prev,
                            [category]: prev[category as CategoryType].filter(name => name !== activity.name)
                          }));
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {hasAttemptedContinue[category as CategoryType] && selectedActivities[category as CategoryType].length === 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-base text-red-800">
                <strong>Please add at least one {category.slice(0, -1)} activity to continue.</strong>
              </p>
            </div>
          )}
          
          {selectedActivities[category as CategoryType].length > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ You have {selectedActivities[category as CategoryType]?.length || 0} activit{(selectedActivities[category as CategoryType]?.length || 0) === 1 ? 'y' : 'ies'} selected
              </p>
            </div>
          )}
        </div>
      )
    })),
    {
      id: "complete",
      title: "Your dopamine menu is ready!",
      subtitle: "Time to start using your personalized activity menu",
      content: (
        <div className="space-y-6 text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-4">
            <p className="text-xl text-slate-800 leading-relaxed">
              Your dopamine menu is ready!
            </p>
            <div className="text-base text-slate-700 space-y-3">
              <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                <li><strong>Appetizers</strong> for quick energy boosts</li>
                <li><strong>Entrées</strong> for longer engagement</li>
                <li><strong>Sides</strong> for background stimulation</li>
                <li><strong>Desserts</strong> for comfort treats</li>
                <li><strong>Specials</strong> for rare occasions</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  const canContinue = () => {
    if (currentStep === 0) return true; // Welcome step
    if (currentStep === steps.length - 1) return true; // Complete step
    
    // For category steps, require at least one activity
    const categorySteps = ['appetizers', 'entrees', 'snacks', 'sides', 'desserts', 'specials'];
    const currentStepId = steps[currentStep]?.id;
    if (categorySteps.includes(currentStepId)) {
      return selectedActivities[currentStepId as CategoryType].length > 0;
    }
    
    return true;
  };

  const handleNext = async () => {
    // Scroll to top when navigating
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (currentStep === steps.length - 1) {
      // Save selected activities to database in batch
      try {
        const activitiesToSave = Object.entries(selectedActivities).flatMap(([category, activities]) =>
          activities.map(name => {
            const templateActivity = exampleActivities[category as CategoryType].find(a => a.name === name);
            const customActivity = customActivities[category as CategoryType].find(a => a.name === name);
            return {
              name,
              category: category as CategoryType,
              duration: customActivity?.duration || templateActivity?.duration || 0,
              emoji: customActivity?.emoji,
              description: templateActivity?.description || undefined
            };
          })
        );

        // Create all activities in a single batch request
        await createActivitiesBatchMutation.mutateAsync(activitiesToSave);

        // Wait for the query to refresh before navigating
        await queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
        await queryClient.refetchQueries({ queryKey: ["/api/activities"] });
        
        toast({
          title: "Welcome aboard!",
          description: "Your dopamine menu has been created successfully.",
        });
        
        setLocation("/");
      } catch (error) {
        console.error("Error saving activities:", error);
        toast({
          title: "Setup almost complete",
          description: "There was a small issue saving some activities, but you can add them manually.",
          variant: "destructive",
        });
        setLocation("/");
      }
    } else {
      // Mark that user attempted to continue for this category
      const categorySteps = ['appetizers', 'entrees', 'snacks', 'sides', 'desserts', 'specials'];
      const currentStepId = steps[currentStep]?.id;
      if (categorySteps.includes(currentStepId)) {
        setHasAttemptedContinue(prev => ({ ...prev, [currentStepId]: true }));
      }
      
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Don't count welcome step in progress - start counting from step 2
  const progress = currentStep === 0 ? 0 : ((currentStep) / (steps.length - 1)) * 100;
  const currentStepData = steps[currentStep];

  // Render welcome screen with full-screen aesthetic
  if (currentStep === 0) {
    return (
      <div 
        className="welcome-screen min-h-screen flex flex-col relative"
        style={{
          backgroundImage: `linear-gradient(135deg, 
            rgba(138, 43, 226, 0.4) 0%,
            rgba(236, 72, 153, 0.3) 25%,
            rgba(168, 85, 247, 0.3) 50%,
            rgba(147, 51, 234, 0.4) 75%,
            rgba(59, 130, 246, 0.4) 100%
          ), url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Floating Background Orbs */}
        <div className="bg-shapes">
          <div className="floating-orb orb-1"></div>
          <div className="floating-orb orb-2"></div>
          <div className="floating-orb orb-3"></div>
        </div>

        {/* Content Container */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative z-20">
          {/* Main Content */}
          <div className="text-center space-y-12 max-w-lg mx-auto">
            {/* Hero Icon */}
            <div className="flex justify-center">
              <div className="w-32 h-32 glass-card rounded-full flex items-center justify-center relative">
                <Heart className="w-16 h-16 text-white neon-icon" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-6">
              <h1 className="welcome-title youth-text text-center">
                Welcome to Your<br />Dopamine Menu
              </h1>
              <p className="welcome-subtitle text-white/90 text-center leading-relaxed">
                Create activities organized like a restaurant menu for when your brain needs stimulation
              </p>
            </div>

            {/* Glass Card with Details */}
            <div className="glass-card rounded-3xl p-8 space-y-4">
              <p className="text-white/80 text-lg leading-relaxed">
                Takes 3-5 minutes. We'll guide you through each step.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Action */}
        <div className="relative z-20 px-6 pb-8">
          <div className="max-w-sm mx-auto">
            <Button 
              onClick={handleNext}
              className="glass-button w-full h-16 text-lg font-semibold text-white border-0 rounded-2xl"
            >
              <span>Let's Get Started</span>
              <ChevronRight className="w-6 h-6 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render regular onboarding steps
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Step {currentStep} of {steps.length - 1}
              </div>
              <div className="text-sm text-slate-600">
                {Math.round(progress)}% complete
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-2">
        <Card className="shadow-lg border-0 bg-slate-100">
          <CardContent className="p-4 bg-slate-100 rounded-sm">
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-black leading-tight">
                  {currentStepData.title}
                </h1>
                <p className="text-slate-600">
                  {currentStepData.subtitle}
                </p>
              </div>

              <div className="space-y-4">
                {currentStepData.content}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center gap-3 pt-4 border-t border-slate-200">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="flex items-center space-x-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                
                <Button 
                  onClick={handleNext}
                  disabled={createActivitiesBatchMutation.isPending || !canContinue()}
                  className="flex items-center space-x-2 bg-primary text-primary-foreground"
                >
                  <span>
                    {currentStep === steps.length - 1 ? 
                      (createActivitiesBatchMutation.isPending ? "Setting up..." : "Start using my menu!") : 
                      "Continue"
                    }
                  </span>
                  {currentStep !== steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}