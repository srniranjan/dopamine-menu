import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, Star, Zap, Share2 } from "lucide-react";
import { shareApp } from "@/lib/share";
import { useToast } from "@/hooks/use-toast";

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
  completion: 'text-primary',
  streak: 'text-primary',
  goal: 'text-primary',
  'first-time': 'text-primary',
};

export default function CelebrationAnimation({ show, type, message, onComplete }: CelebrationAnimationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const { toast } = useToast();

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

      // Auto-hide after animation. Slightly longer than the original 2.5s
      // to give users time to notice and tap the share CTA.
      const timer = setTimeout(() => {
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const handleShareClick = (e: React.MouseEvent) => {
    // Prevent the backdrop's onClick={onComplete} from dismissing the modal
    // before the OS share sheet has a chance to open.
    e.stopPropagation();
    void shareApp(toast, 'celebration');
  };
  
  const Icon = celebrationIcons[type];
  const colorClass = celebrationColors[type];
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
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
            className="bg-card border border-border rounded-lg p-8 shadow-lg max-w-sm mx-4 text-center"
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
              className="text-xl font-semibold text-foreground mb-2"
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
              className="text-muted-foreground"
            >
              {message}
            </motion.p>

            <motion.button
              type="button"
              onClick={handleShareClick}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <Share2 className="h-4 w-4" aria-hidden />
              Share with a friend
            </motion.button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="mt-4 text-xs text-muted-foreground"
            >
              Tap anywhere to continue
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}