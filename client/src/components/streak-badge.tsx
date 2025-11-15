import React from "react";
import { motion } from "framer-motion";
import { Flame, Target, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
  dailyGoal: number;
  activitiesCompleted: number;
  className?: string;
}

export default function StreakBadge({ 
  currentStreak, 
  longestStreak, 
  dailyGoal, 
  activitiesCompleted,
  className = ""
}: StreakBadgeProps) {
  const goalProgress = Math.min((activitiesCompleted / dailyGoal) * 100, 100);
  const isGoalComplete = activitiesCompleted >= dailyGoal;
  
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Current Streak */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center space-x-1"
      >
        <Badge variant="outline" className="bg-orange-50 border-orange-200 hover:bg-orange-100 transition-colors">
          <Flame className="w-3 h-3 text-orange-500 mr-1" />
          <span className="text-orange-700 font-medium">{currentStreak} day streak</span>
        </Badge>
      </motion.div>
      
      {/* Daily Goal Progress */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center space-x-1"
      >
        <Badge 
          variant="outline" 
          className={`${
            isGoalComplete 
              ? "bg-green-50 border-green-200 hover:bg-green-100" 
              : "bg-blue-50 border-blue-200 hover:bg-blue-100"
          } transition-colors`}
        >
          <Target className={`w-3 h-3 mr-1 ${isGoalComplete ? "text-green-500" : "text-blue-500"}`} />
          <span className={`font-medium ${isGoalComplete ? "text-green-700" : "text-blue-700"}`}>
            {activitiesCompleted}/{dailyGoal} today
          </span>
        </Badge>
      </motion.div>
      
      {/* Longest Streak */}
      {longestStreak > 0 && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center space-x-1"
        >
          <Badge variant="outline" className="bg-purple-50 border-purple-200 hover:bg-purple-100 transition-colors">
            <Trophy className="w-3 h-3 text-purple-500 mr-1" />
            <span className="text-purple-700 font-medium">Best: {longestStreak}</span>
          </Badge>
        </motion.div>
      )}
    </div>
  );
}