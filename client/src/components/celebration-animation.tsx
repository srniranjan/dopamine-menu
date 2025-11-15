import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, Star, Zap } from "lucide-react";

interface CelebrationAnimationProps {
  show: boolean;
  type: 'completion' | 'streak' | 'goal' | 'first-time';
  message: string;
  onComplete?: () => void;
}

const celebrationIcons = {
  completion: Sparkles,
  streak: Zap,
  goal: Trophy,
  'first-time': Star,
};

const celebrationColors = {
  completion: 'text-green-500',
  streak: 'text-yellow-500', 
  goal: 'text-purple-500',
  'first-time': 'text-blue-500',
};

export default function CelebrationAnimation({ show, type, message, onComplete }: CelebrationAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  
  useEffect(() => {
    if (show) {
      // Generate random particles
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);
      
      // Auto-hide after animation
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);
  
  const Icon = celebrationIcons[type];
  const colorClass = celebrationColors[type];
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={onComplete}
        >
          {/* Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                opacity: 0, 
                scale: 0,
                x: `${particle.x}vw`,
                y: `${particle.y}vh`
              }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                y: `${particle.y - 20}vh`,
                rotate: 360
              }}
              transition={{
                duration: 2,
                delay: particle.delay,
                ease: "easeOut"
              }}
              className="absolute"
            >
              <Sparkles className={`w-4 h-4 ${colorClass}`} />
            </motion.div>
          ))}
          
          {/* Main celebration */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
            className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 text-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 0.8,
                repeat: 2,
                ease: "easeInOut"
              }}
              className="mb-4"
            >
              <Icon className={`w-16 h-16 mx-auto ${colorClass}`} />
            </motion.div>
            
            <motion.h3
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold text-gray-800 mb-2"
            >
              {type === 'completion' && "Activity Completed!"}
              {type === 'streak' && "Streak Milestone!"}
              {type === 'goal' && "Goal Achieved!"}
              {type === 'first-time' && "First Time!"}
            </motion.h3>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-600"
            >
              {message}
            </motion.p>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring" }}
              className="mt-4 text-xs text-gray-400"
            >
              Tap anywhere to continue
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}