import React from "react";
import { motion } from "framer-motion";
import { Battery, BatteryLow, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MoodSelectorProps {
  selectedMood?: string;
  onMoodSelect: (mood: string) => void;
  className?: string;
}

const moods = [
  {
    id: 'low',
    label: 'Low Energy',
    icon: BatteryLow,
    color: 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300',
    description: 'Need gentle boost'
  },
  {
    id: 'neutral',
    label: 'Balanced',
    icon: Battery,
    color: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300',
    description: 'Ready for anything'
  },
  {
    id: 'high',
    label: 'High Energy', 
    icon: Zap,
    color: 'bg-green-100 hover:bg-green-200 text-green-700 border-green-300',
    description: 'Ready for challenges'
  }
];

export default function MoodSelector({ selectedMood, onMoodSelect, className = "" }: MoodSelectorProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700">How are you feeling?</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {moods.map((mood) => {
          const Icon = mood.icon;
          const isSelected = selectedMood === mood.id;
          
          return (
            <motion.div
              key={mood.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                onClick={() => onMoodSelect(mood.id)}
                className={`
                  w-full h-auto p-3 flex flex-col items-center space-y-2 transition-all
                  ${isSelected 
                    ? mood.color + ' ring-2 ring-offset-2 ring-current' 
                    : 'hover:' + mood.color.split('hover:')[1] || mood.color
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <div className="text-center">
                  <div className="text-xs font-medium">{mood.label}</div>
                  <div className="text-xs opacity-70">{mood.description}</div>
                </div>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}