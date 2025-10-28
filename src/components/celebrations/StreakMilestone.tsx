'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { getStreakColor, getStreakEmoji } from '@/lib/gamification/streaks';

interface StreakMilestoneProps {
  show: boolean;
  days: number;
  title: string;
  bonusPoints: number;
  onClose: () => void;
}

export function StreakMilestone({
  show,
  days,
  title,
  bonusPoints,
  onClose,
}: StreakMilestoneProps) {
  useEffect(() => {
    if (show) {
      // Confetti burst
      const duration = 2000;
      const animationEnd = Date.now() + duration;

      const colors = days >= 365
        ? ['#FFD700', '#FFA500', '#FF8C00'] // Gold
        : days >= 100
        ? ['#9333EA', '#EC4899', '#8B5CF6'] // Purple/Pink
        : days >= 30
        ? ['#8B5CF6', '#A855F7', '#C084FC'] // Purple
        : days >= 7
        ? ['#3B82F6', '#60A5FA', '#93C5FD'] // Blue
        : ['#F97316', '#FB923C', '#FDBA74']; // Orange

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors,
        });

        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors,
        });
      }, 50);

      // Auto-close after 3 seconds
      const timer = setTimeout(onClose, 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [show, days, onClose]);

  const streakColor = getStreakColor(days);
  const streakEmoji = getStreakEmoji(days);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            className="relative z-10 max-w-md w-full"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
          >
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-2xl border-4 border-nature-400">
              {/* Pulsing glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={{
                  boxShadow: [
                    '0 0 0px rgba(139, 195, 74, 0)',
                    '0 0 40px rgba(139, 195, 74, 0.6)',
                    '0 0 0px rgba(139, 195, 74, 0)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Content */}
              <div className="relative text-center">
                {/* Title */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-4"
                >
                  <h2 className="text-3xl font-display font-bold text-nature-600 dark:text-nature-400 mb-2">
                    Streak Milestone!
                  </h2>
                </motion.div>

                {/* Big emoji */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{
                    scale: [0, 1.3, 1],
                    rotate: [-180, 180, 0],
                  }}
                  transition={{
                    delay: 0.3,
                    duration: 0.8,
                    times: [0, 0.6, 1],
                  }}
                  className="text-8xl mb-4"
                >
                  {streakEmoji}
                </motion.div>

                {/* Days count */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="mb-4"
                >
                  <div className={`text-7xl font-display font-black bg-gradient-to-r ${streakColor} bg-clip-text text-transparent`}>
                    {days}
                  </div>
                  <div className="text-2xl font-display font-bold text-gray-600 dark:text-gray-400">
                    Day Streak!
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="text-2xl font-display font-bold mb-4"
                >
                  {title}
                </motion.h3>

                {/* Bonus points */}
                {bonusPoints > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.9, type: 'spring' }}
                    className="inline-block px-6 py-3 bg-nature-100 dark:bg-nature-900/30 border-2 border-nature-300 dark:border-nature-700 rounded-full"
                  >
                    <p className="text-sm font-display text-nature-700 dark:text-nature-300">
                      Bonus Reward
                    </p>
                    <p className="text-3xl font-display font-black text-nature-600 dark:text-nature-400">
                      +{bonusPoints.toLocaleString()}
                    </p>
                    <p className="text-xs font-display text-nature-600 dark:text-nature-400">
                      points
                    </p>
                  </motion.div>
                )}

                {/* Close button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="mt-6 px-6 py-3 bg-nature-600 hover:bg-nature-700 text-white rounded-lg font-display font-bold shadow-lg transition-colors"
                >
                  Amazing!
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Floating flames */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-4xl"
                initial={{
                  x: '50%',
                  y: '50%',
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  scale: [0, 1.5, 0],
                  opacity: [1, 1, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  delay: 0.5 + Math.random() * 0.5,
                  ease: 'easeOut',
                }}
              >
                {streakEmoji}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
