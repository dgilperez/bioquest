'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface QuestProgressCelebrationProps {
  questTitle: string;
  progress: number;
  milestone?: number; // e.g., 25, 50, 75
  show: boolean;
  onClose: () => void;
}

export function QuestProgressCelebration({
  questTitle,
  progress,
  milestone,
  show,
  onClose,
}: QuestProgressCelebrationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; rotation: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti particles
      const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * -100 - 20,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.2,
      }));
      setConfetti(particles);

      // Auto-close after 3 seconds
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [show, onClose]);

  const milestoneMessages: Record<number, string> = {
    25: "You're making great progress!",
    50: "Halfway there! Keep it up!",
    75: "Almost done! You've got this!",
    100: "Quest complete! Amazing work!",
  };

  const message = milestone ? milestoneMessages[milestone] : "Progress updated!";
  const emoji = milestone === 100 ? '🎉' : milestone && milestone >= 75 ? '🔥' : milestone && milestone >= 50 ? '⭐' : '✨';

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] pointer-events-none"
          />

          {/* Celebration Card */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 180, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl max-w-md mx-4 pointer-events-auto"
            >
              {/* Confetti particles */}
              {confetti.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    background: `hsl(${Math.random() * 360}, 70%, 60%)`,
                  }}
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: 0,
                    rotate: 0,
                  }}
                  animate={{
                    x: particle.x,
                    y: particle.y,
                    opacity: [1, 1, 0],
                    scale: [0, 1, 0.5],
                    rotate: particle.rotation,
                  }}
                  transition={{
                    duration: 1.5,
                    delay: particle.delay,
                    ease: 'easeOut',
                  }}
                />
              ))}

              {/* Content */}
              <div className="text-center relative z-10">
                {/* Emoji with pulse animation */}
                <motion.div
                  className="text-6xl mb-4"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: 2,
                    repeatType: 'reverse',
                  }}
                >
                  {emoji}
                </motion.div>

                {/* Message */}
                <h3 className="text-2xl font-display font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {message}
                </h3>

                {/* Quest title */}
                <p className="text-gray-700 dark:text-gray-300 font-body mb-4">
                  {questTitle}
                </p>

                {/* Progress indicator */}
                <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{
                      duration: 1,
                      ease: 'easeOut',
                      delay: 0.3,
                    }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative overflow-hidden"
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                      animate={{
                        x: ['-100%', '200%'],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  </motion.div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-body">
                  {progress}% complete
                </p>

                {/* Sparkles */}
                <div className="flex items-center justify-center gap-2 mt-4 text-purple-600 dark:text-purple-400">
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <Sparkles className="h-5 w-5" />
                  </motion.div>
                  <span className="text-sm font-semibold">Keep going!</span>
                  <motion.div
                    animate={{
                      rotate: [360, 0],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <Sparkles className="h-5 w-5" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
